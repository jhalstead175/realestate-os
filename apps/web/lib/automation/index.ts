/**
 * Automation Module - Public API
 *
 * Micro-automation trigger wiring with agent command loop.
 *
 * Prime Directive: Agents do not act. Agents propose.
 * Commands still flow through the enforcement spine.
 */

// Registry
export { AUTOMATIONS } from './registry';
export type { AutomationSpec } from './registry';

// Selection
export { selectAutomations } from './selectAutomations';

// Execution
export { runAgent } from './runAgent';
export { handleProposedCommand } from './handleProposal';
export { afterEventCommit } from './afterEventCommit';
export { enqueueAgentRun } from './agentQueue';

// Types
export type {
  ProposedCommand,
  AgentContext,
  AutomationRunRequest,
  ProposalHandlerResult,
} from './types';
