/**
 * Execution Spine - Core Types
 *
 * These types are the canonical representation of system state.
 * All decision-making flows from these types.
 */

export type TransactionState =
  | 'initiated'
  | 'qualified'
  | 'offer_issued'
  | 'under_contract'
  | 'closing'
  | 'completed'
  | 'failed';

export type ClosingReadinessState =
  | 'not_ready'
  | 'conditionally_ready'
  | 'ready'
  | 'blocked'
  | 'expired';

export type AuthorityScope = {
  mayAdvanceToClosing?: boolean;
  mayIssueAttestation?: string[];
  mayWithdrawAttestation?: string[];
};

/**
 * Decision Context
 *
 * All command resolution flows from this context.
 * MUST be derived server-side. NEVER trusted from client input.
 */
export type DecisionContext = {
  actorId: string;
  role: 'agent' | 'lender' | 'title' | 'insurance';

  transactionState: TransactionState;
  closingReadiness: ClosingReadinessState;

  authority: AuthorityScope;

  unresolvedContingencies: boolean;
  blockingReason?: string;
};

/**
 * Command Resolution
 *
 * Only these commands may exist. If a command is not enumerated here,
 * it does not exist in the system.
 */
export type CommandResolution =
  | { type: 'none'; reason: string }
  | { type: 'advance_to_closing' }
  | { type: 'issue_attestation'; attestationType: string }
  | { type: 'withdraw_attestation'; attestationType: string };
