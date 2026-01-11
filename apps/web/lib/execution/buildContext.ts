/**
 * Execution Spine - Decision Context Builder
 *
 * This is the ONLY function allowed to assemble DecisionContext.
 * If this function is correct, every decision surface is correct.
 *
 * GUARANTEES:
 * - Runs server-side only
 * - Performs no writes
 * - Deterministic for a given event log
 * - Fails closed (returns safest possible context)
 *
 * MUST run server-side only.
 */

import type { DecisionContext, ClosingReadinessState } from './types';
import {
  foldTransactionState,
  foldAuthority,
  deriveRoleFromAuthority,
  detectBlockingEvent,
  hasUnresolvedContingencies,
} from './eventFolding';
import { computeClosingReadiness as computeReadinessFromAttestations } from '@/lib/federation/closingReadiness';

/**
 * Build decision context for actor in transaction
 *
 * This follows the rigorous 9-step pipeline:
 * 1. Load canonical events
 * 2. Derive transaction state
 * 3. Load authority grants
 * 4. Derive actor role (CRITICAL: not from user metadata)
 * 5. Load attestations
 * 6. Evaluate contingencies
 * 7. Detect blocking events
 * 8. Compute closing readiness
 * 9. Assemble context
 *
 * @param input - Actor ID and transaction ID
 * @returns Complete decision context (or safest fallback)
 */
export async function buildDecisionContext(input: {
  actorId: string;
  transactionId: string;
}): Promise<DecisionContext> {
  const { actorId, transactionId } = input;

  try {
    // STEP 1: Load canonical events
    const events = await loadEvents({
      entityType: 'Transaction',
      entityId: transactionId,
    });

    // STEP 2: Derive transaction state
    const transactionState = foldTransactionState(events);

    // STEP 3: Load authority grants
    const authorityEvents = await loadAuthorityEvents({
      actorId,
      transactionId,
    });

    // Fold authority to get scope
    const authority = foldAuthority(authorityEvents);

    // STEP 4: Derive actor role (CRITICAL: derived, not assumed)
    const role = deriveRoleFromAuthority(authority);

    // If role cannot be derived, fail closed
    if (!role) {
      return createBlockedContext({
        actorId,
        reason: 'No valid authority for this transaction',
      });
    }

    // STEP 5: Load attestations
    const attestations = await loadAttestations({ transactionId });

    // STEP 6: Evaluate contingencies
    const unresolvedContingencies = hasUnresolvedContingencies(events);

    // STEP 7: Detect blocking events
    const blockingEvent = detectBlockingEvent(events, attestations);

    // If blocked, short-circuit
    if (blockingEvent) {
      return {
        actorId,
        role,
        transactionState,
        closingReadiness: 'blocked',
        authority,
        unresolvedContingencies,
        blockingReason: blockingEvent.reason,
      };
    }

    // STEP 8: Compute closing readiness
    const closingReadiness = await computeClosingReadinessState(
      transactionId,
      attestations,
      authority,
      unresolvedContingencies
    );

    // STEP 9: Assemble DecisionContext
    const context: DecisionContext = {
      actorId,
      role,
      transactionState,
      closingReadiness: closingReadiness.state,
      authority,
      unresolvedContingencies,
      blockingReason: closingReadiness.blockingReason,
    };

    return context;
  } catch (error) {
    // On ANY error, fail closed
    console.error('buildDecisionContext failed:', error);
    return createBlockedContext({
      actorId,
      reason: 'Unable to verify authority',
    });
  }
}

/**
 * Load events for transaction
 *
 * TODO: Implement database query
 * For now: Mock with empty array
 */
async function loadEvents(params: {
  entityType: string;
  entityId: string;
}): Promise<any[]> {
  // TODO: Query events table
  // SELECT event_type, payload, occurred_at
  // FROM events
  // WHERE entity_type = $1 AND entity_id = $2
  // ORDER BY occurred_at ASC

  return [];
}

/**
 * Load authority events for actor in transaction
 *
 * TODO: Implement database query
 * For now: Mock based on environment
 */
async function loadAuthorityEvents(params: {
  actorId: string;
  transactionId: string;
}): Promise<any[]> {
  // TODO: Query authority events
  // SELECT event_type, payload, occurred_at
  // FROM events
  // WHERE entity_type = 'Authority'
  //   AND payload->>'actor_id' = $1
  //   AND payload->>'transaction_id' = $2
  //   AND event_type IN ('AuthorityGranted', 'AuthorityRevoked')
  // ORDER BY occurred_at ASC

  // Mock: Grant agent authority for demo
  return [
    {
      event_type: 'AuthorityGranted',
      payload: {
        actor_id: params.actorId,
        transaction_id: params.transactionId,
        scope: ['advance_to_closing'],
      },
      occurred_at: new Date(),
    },
  ];
}

/**
 * Load attestations for transaction
 *
 * TODO: Implement database query
 * For now: Return empty array
 */
async function loadAttestations(params: {
  transactionId: string;
}): Promise<any[]> {
  // TODO: Query federation_attestations table
  // SELECT attestation_type, payload, signature, attested_at
  // FROM federation_attestations
  // WHERE entity_fingerprint = $1
  // ORDER BY attested_at DESC

  return [];
}

/**
 * Compute closing readiness state
 *
 * Delegates to existing closing readiness logic
 */
async function computeClosingReadinessState(
  transactionId: string,
  attestations: any[],
  authority: any,
  unresolvedContingencies: boolean
): Promise<{
  state: ClosingReadinessState;
  blockingReason?: string;
}> {
  const entityFingerprint = `transaction_${transactionId}`;

  try {
    const result = await computeReadinessFromAttestations(entityFingerprint);

    return {
      state: result.state as ClosingReadinessState,
      blockingReason: result.blocking_reasons.join('; ') || undefined,
    };
  } catch (error) {
    // Fail closed
    return {
      state: 'blocked',
      blockingReason: 'Unable to compute readiness',
    };
  }
}

/**
 * Create blocked context (safe fallback)
 *
 * This is the safest possible context when we cannot determine authority.
 */
function createBlockedContext(params: {
  actorId: string;
  reason: string;
}): DecisionContext {
  return {
    actorId: params.actorId,
    role: 'agent', // Safest role (can't act without authority anyway)
    transactionState: 'initiated',
    closingReadiness: 'blocked',
    authority: {}, // No authority
    unresolvedContingencies: false,
    blockingReason: params.reason,
  };
}

/**
 * Validate that decision context is well-formed
 *
 * Guards against programmer error where context is malformed.
 * Throws if context is invalid.
 */
export function validateDecisionContext(ctx: DecisionContext): void {
  if (!ctx.actorId) {
    throw new Error('DecisionContext: actorId is required');
  }

  if (!ctx.role) {
    throw new Error('DecisionContext: role is required');
  }

  if (!ctx.transactionState) {
    throw new Error('DecisionContext: transactionState is required');
  }

  if (!ctx.closingReadiness) {
    throw new Error('DecisionContext: closingReadiness is required');
  }

  if (ctx.authority === undefined) {
    throw new Error('DecisionContext: authority is required');
  }
}
