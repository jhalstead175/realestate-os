/**
 * Automation Types
 *
 * Defines contracts for agent proposals and automation execution.
 */

/**
 * Proposed Command
 *
 * Agents cannot emit events directly.
 * They emit proposed commands that must be validated.
 */
export interface ProposedCommand {
  type: string;
  justification: string;
  payload: unknown;
}

/**
 * Agent Invocation Context
 *
 * Immutable context passed to agents.
 * Agents receive decision context and available commands.
 * They do NOT infer legality.
 */
export interface AgentContext {
  automationId: string;
  triggeringEventId: string;
  decisionContext: unknown; // Full DecisionContext
  availableCommands: unknown[]; // Array of CommandDescriptor
}

/**
 * Automation Run Request
 *
 * Enqueued for async execution.
 */
export interface AutomationRunRequest {
  automationId: string;
  agent: string;
  eventId: string;
  aggregateId: string;
}

/**
 * Proposal Handler Result
 *
 * Outcome after proposal validation.
 */
export interface ProposalHandlerResult {
  status: 'approved' | 'awaiting-human' | 'rejected';
  reason?: string;
  proposal?: ProposedCommand;
  command?: unknown; // CommandDescriptor if approved
}
