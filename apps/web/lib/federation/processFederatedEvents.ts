/**
 * Federated Event Processor
 *
 * Wires federated facts into automation proposal flow.
 *
 * Flow:
 * 1. Load unprocessed federated events
 * 2. Interpret each event
 * 3. Generate automation proposals or readiness updates
 * 4. Mark events as processed
 *
 * This is triggered after federated event intake, not synchronously.
 */

import {
  loadUnprocessedFederatedEvents,
  markFederatedEventProcessed,
  loadFederatedNode,
} from './db';
import { interpretFederatedEvent } from './interpretFederatedEvent';
import { enqueueAgentRun } from '@/lib/automation';

/**
 * Process unprocessed federated events for an aggregate
 *
 * Called by:
 * - Background job
 * - Manual trigger
 * - After federated event intake (async)
 */
export async function processFederatedEvents(
  aggregateId: string
): Promise<void> {
  try {
    // Load unprocessed events
    const events = await loadUnprocessedFederatedEvents(aggregateId);

    if (events.length === 0) {
      return;
    }

    console.log(
      `Processing ${events.length} federated events for aggregate ${aggregateId}`
    );

    for (const event of events) {
      try {
        await processSingleFederatedEvent(event);
      } catch (error) {
        console.error('Failed to process federated event:', event.id, error);
        // Continue processing other events
      }
    }
  } catch (error) {
    console.error('Failed to process federated events:', error);
    throw error;
  }
}

/**
 * Process single federated event
 */
async function processSingleFederatedEvent(
  event: any
): Promise<void> {
  // Load source node to get type
  const node = await loadFederatedNode(event.source_node);

  if (!node) {
    console.warn('Source node not found for event:', event.id);
    await markFederatedEventProcessed(event.id);
    return;
  }

  // Interpret event
  const interpretation = interpretFederatedEvent(event, node.node_type);

  if (!interpretation) {
    console.log('No interpretation for event:', event.event_type);
    await markFederatedEventProcessed(event.id);
    return;
  }

  // Handle readiness impact
  if (interpretation.readinessImpact) {
    // TODO: Update readiness lattice
    // For now: Log
    console.log('Readiness impact:', interpretation.readinessImpact);
  }

  // Handle proposed command
  if (interpretation.proposedCommand) {
    if (interpretation.requiresHumanReview) {
      // TODO: Create automation proposal for human review
      // For now: Log
      console.log(
        'Proposed command (requires review):',
        interpretation.proposedCommand
      );
    } else {
      // TODO: Auto-approve if configured
      // For now: Log
      console.log(
        'Proposed command (auto-approvable):',
        interpretation.proposedCommand
      );
    }
  }

  // Mark as processed
  await markFederatedEventProcessed(event.id);
}

/**
 * Trigger federated event processing (async)
 *
 * Call this after federated event intake to process asynchronously
 */
export function triggerFederatedEventProcessing(aggregateId: string): void {
  // Fire and forget (in production, use durable queue)
  processFederatedEvents(aggregateId).catch((error) => {
    console.error('Federated event processing failed:', error);
  });
}
