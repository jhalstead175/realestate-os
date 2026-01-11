/**
 * Execution Spine - Server Selectors
 *
 * These functions derive decision context from event-sourced state.
 * MUST run server-side only. NEVER expose to client.
 *
 * Each selector folds events in order to compute current state.
 */

import type {
  TransactionState,
  ClosingReadinessState,
  AuthorityScope,
} from './types';
import { computeClosingReadiness } from '@/lib/federation/closingReadiness';

/**
 * Get current transaction state
 *
 * In production: Fold TransactionStateAdvanced events
 * For now: Mock implementation
 */
export async function getTransactionState(
  transactionId: string
): Promise<TransactionState> {
  // TODO: Implement event folding
  // SELECT event_type, payload FROM events
  // WHERE entity_id = transactionId
  // ORDER BY occurred_at ASC

  // Mock: Default to under_contract for demo
  return 'under_contract';
}

/**
 * Get closing readiness state
 *
 * Derived from:
 * - Federation attestations (LoanClearedToClose, TitleClearToClose, BinderIssued)
 * - Authority validity
 * - Unresolved contingencies
 * - Blocking events
 */
export async function getClosingReadiness(
  transactionId: string
): Promise<{
  state: ClosingReadinessState;
  blockingReason?: string;
  unresolvedContingencies: boolean;
}> {
  const entityFingerprint = `transaction_${transactionId}`;

  // Use existing closing readiness computation
  const result = await computeClosingReadiness(entityFingerprint);

  // Map to execution spine types
  const state: ClosingReadinessState = result.state;

  // Extract blocking reason
  let blockingReason: string | undefined;
  if (result.blocking_reasons.length > 0) {
    blockingReason = result.blocking_reasons.join('; ');
  }

  // Check for unresolved contingencies
  const unresolvedContingencies =
    result.blocking_reasons.some((r) => r.includes('contingenc')) ||
    result.missing_attestations.includes('ContingencyResolved');

  return {
    state,
    blockingReason,
    unresolvedContingencies,
  };
}

/**
 * Get authority scope for actor
 *
 * Derived from:
 * - AuthorityGranted / AuthorityRevoked events
 * - Role-specific permissions
 * - Temporal validity (authority at this point in time)
 *
 * In production: Fold authority events
 * For now: Mock based on role
 */
export async function getAuthorityScope(
  actorId: string,
  transactionId: string,
  role: 'agent' | 'lender' | 'title' | 'insurance'
): Promise<AuthorityScope> {
  // TODO: Implement authority event folding
  // SELECT event_type, payload FROM events
  // WHERE entity_id = transactionId
  //   AND event_type IN ('AuthorityGranted', 'AuthorityRevoked')
  //   AND payload->>'actor_id' = actorId
  // ORDER BY occurred_at ASC

  // Mock implementation based on role
  switch (role) {
    case 'agent':
      return {
        mayAdvanceToClosing: true,
        mayIssueAttestation: [],
        mayWithdrawAttestation: [],
      };

    case 'lender': {
      // Check if already attested
      const hasAttested = await hasIssuedAttestation(
        transactionId,
        'LoanClearedToClose'
      );

      return {
        mayAdvanceToClosing: false,
        mayIssueAttestation: hasAttested ? [] : ['LoanClearedToClose'],
        mayWithdrawAttestation: hasAttested ? ['FinancingWithdrawn'] : [],
      };
    }

    case 'title': {
      const hasAttested = await hasIssuedAttestation(
        transactionId,
        'TitleClearToClose'
      );

      return {
        mayAdvanceToClosing: false,
        mayIssueAttestation: hasAttested ? [] : ['TitleClearToClose'],
        mayWithdrawAttestation: hasAttested ? ['TitleDefectDetected'] : [],
      };
    }

    case 'insurance': {
      const hasAttested = await hasIssuedAttestation(
        transactionId,
        'BinderIssued'
      );

      return {
        mayAdvanceToClosing: false,
        mayIssueAttestation: hasAttested ? [] : ['BinderIssued'],
        mayWithdrawAttestation: hasAttested ? ['CoverageWithdrawn'] : [],
      };
    }
  }
}

/**
 * Helper: Check if actor has issued specific attestation
 *
 * In production: Query federation_attestations table
 * For now: Mock based on missing_attestations
 */
async function hasIssuedAttestation(
  transactionId: string,
  attestationType: string
): Promise<boolean> {
  const entityFingerprint = `transaction_${transactionId}`;
  const result = await computeClosingReadiness(entityFingerprint);

  // If attestation is in missing list, it hasn't been issued
  return !result.missing_attestations.includes(attestationType);
}
