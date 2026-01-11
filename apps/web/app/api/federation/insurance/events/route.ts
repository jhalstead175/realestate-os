/**
 * Federated Insurance Event Intake API
 *
 * Insurance confirms protection — it does not decide outcomes.
 *
 * Gate for coverage assertions:
 * - Policy bound
 * - Binder issued
 * - Coverage changed
 * - Coverage lapsed
 *
 * No side effects, no auto-commands.
 */

import { NextRequest, NextResponse } from 'next/server';
import { loadFederatedNode, insertFederatedEvent } from '@/lib/federation/db';
import { verifySignature } from '@/lib/federation/verifySignature';
import type { FederatedEventSubmission } from '@/lib/federation/types';

/**
 * Insurance-specific allowed event types
 */
const INSURANCE_EVENT_TYPES = [
  'POLICY_BOUND',
  'BINDER_ISSUED',
  'COVERAGE_CHANGED',
  'COVERAGE_LAPSED',
  'QUOTE_ISSUED',
  'POLICY_ISSUED',
] as const;

/**
 * Insurance event intake gate
 */
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

    // 2. Verify node type (must be insurance)
    if (node.node_type !== 'insurance') {
      return NextResponse.json(
        { error: 'Not an insurance node' },
        { status: 403 }
      );
    }

    // 3. Verify event type authorization
    if (!INSURANCE_EVENT_TYPES.includes(eventType as any)) {
      return NextResponse.json(
        { error: `Event type not allowed: ${eventType}` },
        { status: 403 }
      );
    }

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
    console.error('Insurance event intake failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to process insurance event',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
