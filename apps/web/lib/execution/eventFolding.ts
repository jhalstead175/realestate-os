/**
 * Execution Spine - Event Folding Functions
 *
 * These functions fold events in order to derive current state.
 * Pure functions with defensive handling of malformed data.
 */

import type { TransactionState, AuthorityScope } from './types';

// Event type definitions (subset needed for folding)
type Event = {
  event_type: string;
  payload: Record<string, unknown>;
  occurred_at: Date;
};

type AuthorityEvent = Event & {
  event_type: 'AuthorityGranted' | 'AuthorityRevoked';
  payload: {
    actor_id: string;
    scope: string[];
    valid_from?: string;
    valid_until?: string;
  };
};

/**
 * Fold TransactionStateAdvanced events to derive current state
 *
 * Rules:
 * - Only TransactionStateAdvanced events may change state
 * - Illegal transitions are ignored (defensive)
 * - Default = initiated
 */
export function foldTransactionState(events: Event[]): TransactionState {
  let state: TransactionState = 'initiated';

  for (const event of events) {
    if (event.event_type === 'TransactionStateAdvanced') {
      const targetState = event.payload.to_state as TransactionState;

      // Validate transition is legal
      if (isLegalTransition(state, targetState)) {
        state = targetState;
      }
      // Else: ignore illegal transition (defensive)
    }
  }

  return state;
}

/**
 * Validate state transition is legal
 */
function isLegalTransition(
  from: TransactionState,
  to: TransactionState
): boolean {
  const legalTransitions: Record<TransactionState, TransactionState[]> = {
    initiated: ['qualified', 'failed'],
    qualified: ['offer_issued', 'failed'],
    offer_issued: ['under_contract', 'failed'],
    under_contract: ['closing', 'failed'],
    closing: ['completed', 'failed'],
    completed: [], // Terminal
    failed: [], // Terminal
  };

  return legalTransitions[from]?.includes(to) ?? false;
}

/**
 * Fold authority events to derive current authority scope
 *
 * Authority is:
 * - Temporal (valid_from → valid_until)
 * - Scoped (specific permissions)
 * - Revocable (AuthorityRevoked event)
 *
 * If no active authority → empty scope
 */
export function foldAuthority(
  events: AuthorityEvent[],
  now: Date = new Date()
): AuthorityScope {
  let scope: Set<string> = new Set();
  let validFrom: Date | null = null;
  let validUntil: Date | null = null;

  for (const event of events) {
    if (event.event_type === 'AuthorityGranted') {
      // Add scopes
      const grantedScopes = event.payload.scope ?? [];
      grantedScopes.forEach((s) => scope.add(s));

      // Update temporal bounds
      if (event.payload.valid_from) {
        validFrom = new Date(event.payload.valid_from);
      }
      if (event.payload.valid_until) {
        validUntil = new Date(event.payload.valid_until);
      }
    } else if (event.event_type === 'AuthorityRevoked') {
      // Revoke all authority
      scope.clear();
      validFrom = null;
      validUntil = null;
    }
  }

  // Check temporal validity
  if (validFrom && now < validFrom) {
    return {}; // Not yet valid
  }
  if (validUntil && now > validUntil) {
    return {}; // Expired
  }

  // Convert scope set to AuthorityScope structure
  return scopeSetToAuthorityScope(scope);
}

/**
 * Convert scope set to AuthorityScope structure
 */
function scopeSetToAuthorityScope(scopes: Set<string>): AuthorityScope {
  const authority: AuthorityScope = {};

  if (scopes.has('advance_to_closing')) {
    authority.mayAdvanceToClosing = true;
  }

  const issueableAttestations = Array.from(scopes).filter((s) =>
    s.startsWith('issue_')
  );
  if (issueableAttestations.length > 0) {
    authority.mayIssueAttestation = issueableAttestations.map((s) =>
      s.replace('issue_', '')
    );
  }

  const withdrawableAttestations = Array.from(scopes).filter((s) =>
    s.startsWith('withdraw_')
  );
  if (withdrawableAttestations.length > 0) {
    authority.mayWithdrawAttestation = withdrawableAttestations.map((s) =>
      s.replace('withdraw_', '')
    );
  }

  return authority;
}

/**
 * Derive role from authority scope
 *
 * CRITICAL: Role is not user metadata. Role is derived from authority.
 *
 * Rules:
 * - mayAdvanceToClosing → agent
 * - mayIssueAttestation containing LoanClearedToClose → lender
 * - mayIssueAttestation containing TitleClearToClose → title
 * - mayIssueAttestation containing BinderIssued → insurance
 * - If multiple match → fail closed (returns null)
 * - If none match → fail closed (returns null)
 */
export function deriveRoleFromAuthority(
  authority: AuthorityScope
): 'agent' | 'lender' | 'title' | 'insurance' | null {
  const matches: ('agent' | 'lender' | 'title' | 'insurance')[] = [];

  if (authority.mayAdvanceToClosing === true) {
    matches.push('agent');
  }

  if (authority.mayIssueAttestation?.includes('LoanClearedToClose')) {
    matches.push('lender');
  }

  if (authority.mayIssueAttestation?.includes('TitleClearToClose')) {
    matches.push('title');
  }

  if (authority.mayIssueAttestation?.includes('BinderIssued')) {
    matches.push('insurance');
  }

  // Fail closed if ambiguous or empty
  if (matches.length !== 1) {
    return null;
  }

  return matches[0];
}

/**
 * Detect blocking event from events and attestations
 *
 * Blocking if any exist:
 * - FinancingWithdrawn
 * - TitleDefectDetected
 * - CoverageWithdrawn
 * - AuthorityRevoked
 * - ContingencyFailed
 */
export function detectBlockingEvent(
  events: Event[],
  attestations: Event[]
): { reason: string } | null {
  const allEvents = [...events, ...attestations];

  for (const event of allEvents) {
    switch (event.event_type) {
      case 'FinancingWithdrawn':
        return { reason: 'Financing has been withdrawn by lender' };
      case 'TitleDefectDetected':
        return { reason: 'Title defect detected by title company' };
      case 'CoverageWithdrawn':
        return { reason: 'Insurance coverage has been withdrawn' };
      case 'AuthorityRevoked':
        return { reason: 'Authority has been revoked' };
      case 'ContingencyFailed':
        return { reason: 'Contingency has failed' };
    }
  }

  return null;
}

/**
 * Check for unresolved contingencies
 *
 * Returns boolean only. No detail leaks.
 */
export function hasUnresolvedContingencies(events: Event[]): boolean {
  let unresolvedCount = 0;

  for (const event of events) {
    if (event.event_type === 'ContingencyCreated') {
      unresolvedCount++;
    } else if (event.event_type === 'ContingencyResolved') {
      unresolvedCount--;
    } else if (event.event_type === 'ContingencyFailed') {
      unresolvedCount--;
    }
  }

  return unresolvedCount > 0;
}
