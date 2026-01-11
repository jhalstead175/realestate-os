/**
 * Proposed Command Handler
 *
 * Enforcement re-entry point for agent proposals.
 * Automation cannot bypass the law.
 *
 * Even auto-approved flows still enforce:
 * ProposedCommand → resolveAvailableCommand() → emitEvent()
 *
 * If legality changes between proposal and execution → fails safely.
 */

import { resolveAvailableCommand } from '@/lib/execution';
import type { DecisionContext } from '@/lib/execution';
import type { ProposedCommand, ProposalHandlerResult } from './types';

/**
 * Handle proposed command from agent
 *
 * @param params - Proposal, context, and approval flag
 * @returns Handler result with approval status
 */
export async function handleProposedCommand(params: {
  proposal: ProposedCommand;
  decisionContext: DecisionContext;
  autoApprove: boolean;
}): Promise<ProposalHandlerResult> {
  const { proposal, decisionContext, autoApprove } = params;

  // Re-validate command via enforcement spine
  const allowedCommand = resolveAvailableCommand(decisionContext);

  // Check if proposed command matches any allowed command
  const isLegal =
    allowedCommand.type !== 'none' &&
    (allowedCommand.type === proposal.type ||
      (allowedCommand.type === 'issue_attestation' &&
        proposal.type === allowedCommand.type) ||
      (allowedCommand.type === 'withdraw_attestation' &&
        proposal.type === allowedCommand.type));

  if (!isLegal) {
    return {
      status: 'rejected',
      reason: 'Illegal command - not in available commands',
    };
  }

  // If requires human approval
  if (!autoApprove) {
    return {
      status: 'awaiting-human',
      proposal,
    };
  }

  // Auto-approved - but still went through enforcement
  return {
    status: 'approved',
    command: allowedCommand,
  };
}
