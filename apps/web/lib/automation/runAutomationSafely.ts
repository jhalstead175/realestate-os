/**
 * Safe Automation Runner
 *
 * Single choke point for automation failure capture.
 * Ensures all automation failures are recorded to DLQ.
 */

import { runAgent } from './runAgent';
import { recordDeadLetter } from './recordDeadLetter';
import type { AutomationRunRequest, ProposedCommand } from './types';

/**
 * Run automation with failure capture
 *
 * All automation invocations MUST go through this function.
 * Failures are recorded to dead-letter queue before rethrowing.
 */
export async function runAutomationSafely(
  request: AutomationRunRequest,
  stage: 'agent_invocation' | 'proposal_generation' | 'legality_validation' = 'agent_invocation'
): Promise<ProposedCommand | null> {
  try {
    return await runAgent(request);
  } catch (error) {
    // Record to dead-letter queue
    await recordDeadLetter({
      automationId: request.automationId,
      agent: request.agent,
      aggregateId: request.aggregateId,
      triggeringEventId: request.eventId,
      failureStage: stage,
      error: error instanceof Error ? error : new Error(String(error)),
      inputSnapshot: request,
    });

    // Rethrow to maintain error propagation
    throw error;
  }
}
