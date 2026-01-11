/**
 * Closing Readiness State Machine (Formal Specification)
 *
 * This is a DERIVED meta-state, never directly set.
 * It emerges only when all required attestations exist and are valid at the same moment.
 *
 * No party can declare readiness alone.
 */

import type { Attestation } from '@repo/federation';

/**
 * Closing Readiness States (Derived, Not Stored)
 */
export type ClosingReadinessState =
  | 'not_ready'
  | 'conditionally_ready'
  | 'ready'
  | 'blocked'
  | 'expired';

/**
 * Blocking Conditions (Explicit)
 * A single blocker dominates all other signals
 */
export type ClosingBlocker =
  | 'financing_withdrawn'
  | 'title_defect'
  | 'insurance_withdrawn'
  | 'authority_revoked'
  | 'contingency_failed';

/**
 * Blocking Event
 */
export interface BlockingEvent {
  blocker_type: ClosingBlocker;
  attestation_id: string;
  issuing_node_id: string;
  detected_at: Date;
  reason?: string;
}

/**
 * Closing Readiness Context
 * All inputs required to compute readiness
 */
export interface ClosingReadinessContext {
  // Required attestations
  lenderAttestation?: Attestation;
  titleAttestation?: Attestation;
  insuranceAttestation?: Attestation;

  // Authority & contingencies
  authorityValid: boolean;
  unresolvedContingencies: boolean;

  // Blocking conditions
  blockingEvents: BlockingEvent[];

  // Time context
  now: Date;
}

/**
 * Closing Readiness Result
 */
export interface ClosingReadinessResult {
  state: ClosingReadinessState;
  missing_attestations: string[];
  blocking_reasons: string[];
  conditional_warnings: string[];
  expiring_soon: {
    attestation_type: string;
    expires_at: Date;
  }[];
  ready_to_close: boolean; // state === 'ready'
  computed_at: Date;
}

/**
 * Compute closing readiness state (Pure, Deterministic, Testable)
 *
 * This is the canonical computation function.
 * All readiness checks MUST use this function.
 *
 * @param context - Readiness context
 * @returns Readiness state
 */
export function computeClosingReadiness(
  context: ClosingReadinessContext
): ClosingReadinessResult {
  const result: ClosingReadinessResult = {
    state: 'not_ready',
    missing_attestations: [],
    blocking_reasons: [],
    conditional_warnings: [],
    expiring_soon: [],
    ready_to_close: false,
    computed_at: context.now,
  };

  // Rule 1: BLOCKED dominates all other signals
  if (context.blockingEvents.length > 0) {
    result.state = 'blocked';
    result.blocking_reasons = context.blockingEvents.map((e) => {
      switch (e.blocker_type) {
        case 'financing_withdrawn':
          return 'Lender withdrew financing clearance';
        case 'title_defect':
          return 'Title company detected blocking defect';
        case 'insurance_withdrawn':
          return 'Insurance coverage withdrawn';
        case 'authority_revoked':
          return 'Signing authority revoked';
        case 'contingency_failed':
          return 'Contingency failed';
      }
    });
    return result;
  }

  // Rule 2: Check for missing attestations
  const attestations = [
    { type: 'LoanClearedToClose', value: context.lenderAttestation },
    { type: 'TitleClearToClose', value: context.titleAttestation },
    { type: 'BinderIssued', value: context.insuranceAttestation },
  ];

  for (const att of attestations) {
    if (!att.value) {
      result.missing_attestations.push(att.type);
    }
  }

  if (result.missing_attestations.length > 0) {
    result.state = 'not_ready';
    return result;
  }

  // Rule 3: Check authority and contingencies
  if (!context.authorityValid) {
    result.state = 'not_ready';
    result.missing_attestations.push('AuthorityVerified');
    return result;
  }

  if (context.unresolvedContingencies) {
    result.state = 'not_ready';
    result.blocking_reasons.push('Unresolved contingencies remain');
    return result;
  }

  // Rule 4: Check for expiration
  const allAttestations = [
    context.lenderAttestation,
    context.titleAttestation,
    context.insuranceAttestation,
  ].filter((a): a is Attestation => !!a);

  for (const att of allAttestations) {
    const payload = att.payload as {
      expiration_date?: Date | string;
      expires_at?: Date | string;
    };
    const expiresAt = payload.expiration_date || payload.expires_at;

    if (expiresAt) {
      const expDate =
        typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;

      if (expDate < context.now) {
        result.state = 'expired';
        result.blocking_reasons.push(
          `${att.attestation_type} expired at ${expDate.toISOString()}`
        );
        return result;
      }

      // Warn if expiring soon (within 7 days)
      const daysUntilExpiry =
        (expDate.getTime() - context.now.getTime()) / (1000 * 60 * 60 * 24);
      if (daysUntilExpiry < 7) {
        result.expiring_soon.push({
          attestation_type: att.attestation_type,
          expires_at: expDate,
        });
      }
    }
  }

  // Rule 5: Check for conditional attestations
  for (const att of allAttestations) {
    const payload = att.payload as {
      conditions?: string[];
      conditional?: boolean;
    };

    if (payload.conditions && payload.conditions.length > 0) {
      result.state = 'conditionally_ready';
      result.conditional_warnings.push(
        `${att.attestation_type} has ${payload.conditions.length} unresolved condition(s)`
      );
    }

    if (payload.conditional === true) {
      result.state = 'conditionally_ready';
      result.conditional_warnings.push(
        `${att.attestation_type} is marked as conditional`
      );
    }
  }

  // Rule 6: If we haven't set a state yet, and no conditions exist, we're READY
  if (result.state === 'not_ready' && result.conditional_warnings.length === 0) {
    result.state = 'ready';
    result.ready_to_close = true;
  }

  // If conditionally_ready and expiring soon, note both
  if (result.state === 'conditionally_ready' && result.expiring_soon.length > 0) {
    result.conditional_warnings.push(
      `${result.expiring_soon.length} attestation(s) expiring within 7 days`
    );
  }

  // Set ready_to_close flag
  result.ready_to_close = result.state === 'ready';

  return result;
}

/**
 * Check if state transition is legal
 *
 * Guards: TransactionStateAdvanced → closing
 * Only allowed if readiness === 'ready'
 *
 * @param readinessState - Current readiness state
 * @returns true if transition to closing is allowed
 */
export function mayAdvanceToClosing(
  readinessState: ClosingReadinessState
): boolean {
  return readinessState === 'ready';
}

/**
 * Check if automation may advance to closing
 *
 * Additional requirement: explicit automation authority must exist
 *
 * @param readinessState - Current readiness state
 * @param hasAutomationAuthority - Whether automation is explicitly authorized
 * @returns true if automation may advance
 */
export function mayAutoAdvanceToClosing(
  readinessState: ClosingReadinessState,
  hasAutomationAuthority: boolean
): boolean {
  return readinessState === 'ready' && hasAutomationAuthority;
}

/**
 * Get human-readable status message
 *
 * @param result - Readiness result
 * @returns User-facing status message
 */
export function getReadinessStatusMessage(
  result: ClosingReadinessResult
): string {
  switch (result.state) {
    case 'ready':
      return 'Ready to close';

    case 'conditionally_ready':
      return `Conditionally ready: ${result.conditional_warnings.join(', ')}`;

    case 'blocked':
      return `Blocked: ${result.blocking_reasons.join(', ')}`;

    case 'expired':
      return `Attestations expired: ${result.blocking_reasons.join(', ')}`;

    case 'not_ready':
      if (result.missing_attestations.length > 0) {
        return `Waiting for: ${result.missing_attestations.join(', ')}`;
      }
      if (result.blocking_reasons.length > 0) {
        return `Not ready: ${result.blocking_reasons.join(', ')}`;
      }
      return 'Not ready';
  }
}

/**
 * Get UI affordance configuration
 *
 * Controls what buttons/actions are visible
 *
 * @param result - Readiness result
 * @returns UI affordance config
 */
export function getUIAffordances(result: ClosingReadinessResult): {
  showProceedButton: boolean;
  showWarning: boolean;
  showBlocker: boolean;
  buttonLabel: string;
  buttonEnabled: boolean;
  warningMessage?: string;
  blockerMessage?: string;
} {
  switch (result.state) {
    case 'ready':
      return {
        showProceedButton: true,
        showWarning: false,
        showBlocker: false,
        buttonLabel: 'Proceed to Closing',
        buttonEnabled: true,
      };

    case 'conditionally_ready':
      return {
        showProceedButton: true,
        showWarning: true,
        showBlocker: false,
        buttonLabel: 'Proceed with Conditions',
        buttonEnabled: false, // Require manual override
        warningMessage: result.conditional_warnings.join('; '),
      };

    case 'blocked':
      return {
        showProceedButton: false,
        showWarning: false,
        showBlocker: true,
        buttonLabel: 'Cannot Proceed',
        buttonEnabled: false,
        blockerMessage: result.blocking_reasons.join('; '),
      };

    case 'expired':
      return {
        showProceedButton: false,
        showWarning: false,
        showBlocker: true,
        buttonLabel: 'Renew Attestations',
        buttonEnabled: false,
        blockerMessage: 'One or more attestations have expired',
      };

    case 'not_ready':
      return {
        showProceedButton: false,
        showWarning: false,
        showBlocker: false,
        buttonLabel: 'Not Ready',
        buttonEnabled: false,
      };
  }
}
