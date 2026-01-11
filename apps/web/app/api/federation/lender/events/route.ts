/**
 * Federated Lender Event Intake API
 *
 * Hard gate for external lender events.
 *
 * Enforces:
 * - Node identity and trust
 * - Signature verification
 * - Event type authorization
 * - Immutable append-only log
 *
 * This API never emits events directly.
 */

import { NextRequest, NextResponse } from 'next/server';
import { loadFederatedNode, insertFederatedEvent } from '@/lib/federation/db';
import { verifySignature } from '@/lib/federation/verifySignature';
import type { FederatedEventSubmission } from '@/lib/federation/types';

export async function POST(request: NextRequest) {
  try {
    const submission: FederatedEventSubmission = await request.json();
    const { nodeId, aggregateId, eventType, payload, signature } = submission;

    // 1. Load and validate node
    const node = await loadFederatedNode(nodeId);

    if (!node) {
      return NextResponse.json(
        { error: 'Unknown or disabled node' },
        { status: 403 }
      );
    }

    // 2. Verify node type
    if (node.node_type !== 'lender') {
      return NextResponse.json(
        { error: 'Not a lender node' },
        { status: 403 }
      );
    }

    // 3. Verify event type authorization
    if (!node.allowed_event_types.includes(eventType)) {
      return NextResponse.json(
        { error: 'Event type not allowed for this node' },
        { status: 403 }
      );
    }

    // 4. Verify cryptographic signature
    const isValidSignature = verifySignature({
      payload,
      signature,
      publicKey: node.public_key,
    });

    if (!isValidSignature) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 403 }
      );
    }

    // 5. Insert to immutable log
    const federatedEvent = await insertFederatedEvent({
      source_node: nodeId,
      aggregate_id: aggregateId,
      event_type: eventType,
      payload,
      signature,
    });

    // 6. Success response (no side effects)
    return NextResponse.json({
      success: true,
      eventId: federatedEvent.id,
      received_at: federatedEvent.received_at,
    });
  } catch (error) {
    console.error('Federated event intake failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to process federated event',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
