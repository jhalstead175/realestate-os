/**
 * Execution Spine - Command Resolution Logic
 *
 * This function is the LAW.
 * If this is correct, the system is correct.
 *
 * Properties:
 * - Pure (no side effects)
 * - Deterministic (same input = same output)
 * - Exhaustive (handles all cases)
 * - Testable (unit testable)
 */

import type { DecisionContext, CommandResolution } from './types';

/**
 * Resolve available command based on decision context
 *
 * This is the single source of truth for what actions are available.
 * UI renders what this returns. API guards enforce what this returns.
 */
export function resolveAvailableCommand(
  ctx: DecisionContext
): CommandResolution {
  // 1. HARD BLOCKERS
  // If closing is blocked, nothing else matters
  if (ctx.closingReadiness === 'blocked') {
    return {
      type: 'none',
      reason: ctx.blockingReason ?? 'Closing is blocked',
    };
  }

  // 2. AGENT COMMANDS
  // Agents have command authority to advance state
  if (ctx.role === 'agent') {
    // Can proceed to closing if:
    // - Transaction is under contract
    // - Closing readiness is confirmed
    // - Authority grants permission
    if (
      ctx.transactionState === 'under_contract' &&
      ctx.closingReadiness === 'ready' &&
      ctx.authority.mayAdvanceToClosing === true
    ) {
      return { type: 'advance_to_closing' };
    }

    // Conditional readiness requires review (no action)
    if (ctx.closingReadiness === 'conditionally_ready') {
      return {
        type: 'none',
        reason: 'Conditions require review before proceeding',
      };
    }

    // Not ready yet - waiting on attestations
    return {
      type: 'none',
      reason: 'Waiting on partner attestations',
    };
  }

  // 3. LENDER / TITLE / INSURANCE ATTESTATIONS
  // These roles can only issue or withdraw attestations
  if (ctx.role === 'lender' || ctx.role === 'title' || ctx.role === 'insurance') {
    const issueable = ctx.authority.mayIssueAttestation ?? [];
    const withdrawable = ctx.authority.mayWithdrawAttestation ?? [];

    // Priority 1: Issue attestation if available
    if (issueable.length > 0) {
      return {
        type: 'issue_attestation',
        attestationType: issueable[0], // Only one at a time
      };
    }

    // Priority 2: Withdraw attestation if already issued
    if (withdrawable.length > 0) {
      return {
        type: 'withdraw_attestation',
        attestationType: withdrawable[0], // Only one at a time
      };
    }

    // No authority to act
    return {
      type: 'none',
      reason: 'No authority to act on this transaction',
    };
  }

  // 4. FALLBACK (should never reach here)
  return {
    type: 'none',
    reason: 'No applicable action for current context',
  };
}

/**
 * Get human-readable action label for UI
 */
export function getActionLabel(command: CommandResolution): string {
  switch (command.type) {
    case 'advance_to_closing':
      return '✓ Proceed to Closing';
    case 'issue_attestation':
      return getAttestationLabel(command.attestationType, 'issue');
    case 'withdraw_attestation':
      return getAttestationLabel(command.attestationType, 'withdraw');
    case 'none':
      return command.reason;
  }
}

/**
 * Get action button color
 */
export function getActionColor(
  command: CommandResolution
): 'green' | 'amber' | 'red' | 'gray' | 'blue' {
  switch (command.type) {
    case 'advance_to_closing':
      return 'green';
    case 'issue_attestation':
      return 'green';
    case 'withdraw_attestation':
      return 'red';
    case 'none':
      return 'gray';
  }
}

/**
 * Determine if action requires justification
 */
export function requiresJustification(command: CommandResolution): boolean {
  // All write commands require justification
  return command.type !== 'none';
}

/**
 * Helper: Get attestation-specific label
 */
function getAttestationLabel(
  attestationType: string,
  action: 'issue' | 'withdraw'
): string {
  const labels: Record<string, { issue: string; withdraw: string }> = {
    LoanClearedToClose: {
      issue: '✓ Loan Cleared to Close',
      withdraw: '⛔ Withdraw Financing',
    },
    TitleClearToClose: {
      issue: '✓ Title Clear to Close',
      withdraw: '⛔ Report Title Defect',
    },
    BinderIssued: {
      issue: '✓ Issue Binder',
      withdraw: '⛔ Withdraw Coverage',
    },
  };

  return labels[attestationType]?.[action] ?? `${action} ${attestationType}`;
}
