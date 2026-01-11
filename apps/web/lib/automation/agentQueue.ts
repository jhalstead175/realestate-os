/**
 * Agent Queue
 *
 * Durable queue for agent invocations.
 * Ensures agents run reliably even if system restarts.
 *
 * TODO: Implement with actual queue system (BullMQ, Inngest, etc.)
 * For now: Simple async execution
 */

import { runAutomationSafely } from './runAutomationSafely';
import { handleProposedCommand } from './handleProposal';
import { AUTOMATIONS } from './registry';
import { emitEvent } from '@/lib/db/events';
import type { AutomationRunRequest } from './types';

/**
 * Enqueue agent run
 *
 * In production: Use durable queue (BullMQ, Inngest, etc.)
 * For now: Execute asynchronously
 */
export async function enqueueAgentRun(
  request: AutomationRunRequest
): Promise<void> {
  // TODO: Implement with durable queue
  // For now: Execute immediately
  executeAgentRun(request).catch((error) => {
    console.error('Agent run failed:', error);
  });
}

/**
 * Execute agent run
 *
 * Orchestrates: agent invocation → proposal validation → command execution
 * All failures are captured via runAutomationSafely
 */
async function executeAgentRun(request: AutomationRunRequest): Promise<void> {
  const { automationId, agent, eventId, aggregateId } = request;

  // Find automation spec
  const automation = AUTOMATIONS.find((a) => a.id === automationId);
  if (!automation) {
    throw new Error(`Automation not found: ${automationId}`);
  }

  // 1. Invoke agent with decision context (wrapped with DLQ capture)
  const proposal = await runAutomationSafely(request, 'agent_invocation');

  if (!proposal) {
    console.log(`Agent ${agent} produced no proposal`);
    return;
  }

  // 2. Handle proposed command (enforcement re-entry)
  // TODO: Get decision context from runAgent
  // For now: Skip validation (stub)
  const result = {
    status: 'approved' as const,
    command: proposal,
  };

  if (result.status === 'rejected') {
    console.log(`Proposal rejected: ${result.reason}`);
    return;
  }

  if (result.status === 'awaiting-human') {
    console.log('Proposal awaiting human approval');
    // TODO: Store proposal for human review
    return;
  }

  // 3. Execute approved command
  if (result.status === 'approved' && result.command) {
    console.log('Executing approved command:', result.command);
    // TODO: Emit event via command API
    // For now: Log only
  }
}
