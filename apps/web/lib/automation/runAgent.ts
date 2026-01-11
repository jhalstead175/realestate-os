/**
 * Agent Invocation
 *
 * Builds immutable decision context and invokes agent.
 *
 * CRITICAL RULE:
 * Agents receive:
 * - Decision context
 * - Available commands
 *
 * They do NOT infer legality.
 */

import { buildDecisionContext } from '@/lib/execution';
import type { AutomationRunRequest, AgentContext, ProposedCommand } from './types';

/**
 * Run agent with decision context
 *
 * @param request - Automation run request
 * @returns Proposed command from agent
 */
export async function runAgent(
  request: AutomationRunRequest
): Promise<ProposedCommand | null> {
  const { automationId, agent, aggregateId, eventId } = request;

  try {
    // Build decision context (enforcement spine)
    const decision = await buildDecisionContext({
      actorId: 'SYSTEM_AUTOMATION',
      transactionId: aggregateId,
    });

    // Build agent context
    const agentContext: AgentContext = {
      automationId,
      triggeringEventId: eventId,
      decisionContext: decision,
      availableCommands: [], // TODO: Map from CommandResolution
    };

    // Invoke agent
    const proposal = await invokeAgent(agent, agentContext);

    return proposal;
  } catch (error) {
    console.error('Agent invocation failed:', error);
    return null;
  }
}

/**
 * Invoke specific agent
 *
 * TODO: Implement agent router/dispatcher
 * For now: stub implementation
 */
async function invokeAgent(
  agent: string,
  context: AgentContext
): Promise<ProposedCommand | null> {
  console.log(`Invoking agent: ${agent}`, context);

  // TODO: Route to actual agent implementation
  // This would call OpenAI/Anthropic with context
  // Agent analyzes context and proposes command

  // Stub: Return null (no proposal)
  return null;
}
