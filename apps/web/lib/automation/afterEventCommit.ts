/**
 * After Event Commit Hook
 *
 * Invocation point for automation after event is committed.
 * This is durable orchestration, not async fire-and-forget.
 */

import { selectAutomations } from './selectAutomations';
import { enqueueAgentRun } from './agentQueue';
import type { AutomationRunRequest } from './types';

/**
 * After event commit hook
 *
 * Triggers automations that match the event type.
 *
 * @param event - The event that was committed
 */
export async function afterEventCommit(event: {
  id: string;
  entity_type: string;
  entity_id: string;
  event_type: string;
  payload: unknown;
}) {
  try {
    // Select automations triggered by this event
    const automations = selectAutomations(event.event_type);

    if (automations.length === 0) {
      return; // No automations for this event type
    }

    // Enqueue agent runs for each automation
    for (const automation of automations) {
      const runRequest: AutomationRunRequest = {
        automationId: automation.id,
        agent: automation.agent,
        eventId: event.id,
        aggregateId: event.entity_id,
      };

      await enqueueAgentRun(runRequest);
    }
  } catch (error) {
    console.error('afterEventCommit failed:', error);
    // Don't throw - event commit should not fail due to automation
  }
}
