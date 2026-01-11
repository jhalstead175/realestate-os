/**
 * Federated Title Event Intake API
 *
 * Stricter than lender intake.
 * Title controls documents and assertions — not outcomes.
 *
 * Hard rejections:
 * - Unknown event type
 * - Invalid signature
 * - Missing document references (where required)
 * - Disabled node
 *
 * No partial acceptance. No soft logging.
 */

import { NextRequest, NextResponse } from 'next/server';
import { loadFederatedNode, insertFederatedEvent } from '@/lib/federation/db';
import { verifyTitleSignature, type TitleDocumentRef } from '@/lib/federation/verifyTitleSignature';

/**
 * Title event submission with document custody
 */
interface TitleEventSubmission {
  nodeId: string;
  aggregateId: string;
  eventType: string;
  payload: Record<string, unknown>;
  documentRefs?: TitleDocumentRef[];
  signature: string;
}

/**
 * Title-specific allowed event types
 */
const TITLE_EVENT_TYPES = [
  'TITLE_REPORT_ISSUED',
  'TITLE_EXCEPTION_FOUND',
  'TITLE_CLEARED',
  'SETTLEMENT_STATEMENT_READY',
  'COMMITMENT_ISSUED',
  'TITLE_SEARCH_COMPLETED',
] as const;

/**
 * Hard gate for title events
 */
export async function POST(request: NextRequest) {
  try {
    const submission: TitleEventSubmission = await request.json();
    const { nodeId, aggregateId, eventType, payload, documentRefs, signature } = submission;

    // 1. Load and validate node
    const node = await loadFederatedNode(nodeId);

    if (!node) {
      // Hard reject: Unknown or disabled node
      return NextResponse.json(
        { error: 'Unknown or disabled node' },
        { status: 403 }
      );
    }

    // 2. Verify node type (must be title)
    if (node.node_type !== 'title') {
      return NextResponse.json(
        { error: 'Not a title node' },
        { status: 403 }
      );
    }

    // 3. Verify event type authorization (stricter)
    if (!TITLE_EVENT_TYPES.includes(eventType as any)) {
      // Hard reject: Event type not in allowed set
      return NextResponse.json(
        { error: `Event type not allowed: ${eventType}` },
        { status: 403 }
      );
    }

    if (!node.allowed_event_types.includes(eventType)) {
      // Hard reject: Node not authorized for this event type
      return NextResponse.json(
        { error: 'Event type not allowed for this node' },
        { status: 403 }
      );
    }

    // 4. Verify cryptographic signature (with document refs)
    const isValidSignature = verifyTitleSignature({
      aggregateId,
      payload,
      documentRefs,
      signature,
      publicKey: node.public_key,
    });

    if (!isValidSignature) {
      // Hard reject: Invalid signature
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 403 }
      );
    }

    // 5. Insert to immutable log
    // Store document refs in payload for custody tracking
    const enrichedPayload = {
      ...payload,
      _documentRefs: documentRefs ?? [],
    };

    const federatedEvent = await insertFederatedEvent({
      source_node: nodeId,
      aggregate_id: aggregateId,
      event_type: eventType,
      payload: enrichedPayload,
      signature,
    });

    // 6. Success response (no side effects, no auto-execution)
    return NextResponse.json({
      success: true,
      eventId: federatedEvent.id,
      received_at: federatedEvent.received_at,
    });
  } catch (error) {
    console.error('Title event intake failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to process title event',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
