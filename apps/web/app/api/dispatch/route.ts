/**
 * Federation Dispatch API
 *
 * Processes the outbox queue and dispatches attestations to destination nodes.
 * Protected endpoint - should only be called by scheduled jobs or admin.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createInboxEnvelope } from '@repo/federation';
import { supabaseServer } from '@/lib/supabase/server';

// Simple bearer token auth for dispatch endpoint
const DISPATCH_SECRET = process.env.FEDERATION_DISPATCH_SECRET;

export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    if (token !== DISPATCH_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get this node's identity and private key
    const nodeId = process.env.FEDERATION_NODE_ID;
    const privateKey = process.env.FEDERATION_PRIVATE_KEY;

    if (!nodeId || !privateKey) {
      return NextResponse.json(
        { error: 'Federation not configured' },
        { status: 500 }
      );
    }

    // Get queued outbox items (limit 50 per batch)
    const { data: outboxItems, error: outboxError } = await supabaseServer
      .from('federation_outbox')
      .select('*, attestation:federation_attestations(*), destination:federation_nodes(*)')
      .eq('status', 'queued')
      .lt('attempts', 3) // Max 3 attempts
      .order('created_at', { ascending: true })
      .limit(50);

    if (outboxError) {
      console.error('Failed to query outbox:', outboxError);
      return NextResponse.json(
        { error: 'Failed to query outbox' },
        { status: 500 }
      );
    }

    if (!outboxItems || outboxItems.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        message: 'No items in outbox',
      });
    }

    // Group by destination node
    const itemsByDestination = new Map<string, typeof outboxItems>();
    for (const item of outboxItems) {
      const nodeId = item.to_node_id;
      if (!itemsByDestination.has(nodeId)) {
        itemsByDestination.set(nodeId, []);
      }
      itemsByDestination.get(nodeId)!.push(item);
    }

    // Dispatch to each destination
    let successCount = 0;
    let failureCount = 0;

    for (const [destinationId, items] of itemsByDestination.entries()) {
      try {
        const destination = items[0].destination;

        // Create envelope with attestations
        const attestations = items.map((item) => item.attestation);
        const envelope = await createInboxEnvelope({
          from_node_id: nodeId,
          to_node_id: destinationId,
          attestations,
          private_key: privateKey,
        });

        // Send to destination inbox
        const response = await fetch(
          `${destination.api_endpoint}/api/federation/inbox`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(envelope),
          }
        );

        if (response.ok) {
          // Mark as sent
          const outboxIds = items.map((item) => item.outbox_id);
          await supabaseServer
            .from('federation_outbox')
            .update({
              status: 'sent',
              last_attempt_at: new Date().toISOString(),
            })
            .in('outbox_id', outboxIds);

          successCount += items.length;
        } else {
          // Mark as failed, increment attempts
          const outboxIds = items.map((item) => item.outbox_id);
          await supabaseServer
            .from('federation_outbox')
            .update({
              status: 'failed',
              attempts: items[0].attempts + 1,
              last_attempt_at: new Date().toISOString(),
              error_message: `HTTP ${response.status}: ${await response.text()}`,
            })
            .in('outbox_id', outboxIds);

          failureCount += items.length;
        }
      } catch (error) {
        console.error(`Failed to dispatch to ${destinationId}:`, error);

        // Mark as failed
        const outboxIds = items.map((item) => item.outbox_id);
        await supabaseServer
          .from('federation_outbox')
          .update({
            status: 'failed',
            attempts: items[0].attempts + 1,
            last_attempt_at: new Date().toISOString(),
            error_message: error instanceof Error ? error.message : 'Unknown error',
          })
          .in('outbox_id', outboxIds);

        failureCount += items.length;
      }
    }

    return NextResponse.json({
      success: true,
      processed: successCount + failureCount,
      sent: successCount,
      failed: failureCount,
    });
  } catch (error) {
    console.error('Dispatch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
