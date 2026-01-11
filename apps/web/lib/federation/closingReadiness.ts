/**
 * Closing Readiness Engine
 *
 * Gathers attestations and computes readiness using the formal state machine.
 * This replaces 30 phone calls with one provable condition.
 */

import type { Attestation } from '@repo/federation';
import { supabaseServer } from '@/lib/supabase/server';
import {
  computeClosingReadiness as computeReadinessState,
  type ClosingReadinessContext,
  type ClosingReadinessResult,
  type BlockingEvent,
  type ClosingBlocker,
} from './closingReadinessStateMachine';

/**
 * Gather attestations and compute closing readiness
 *
 * @param entityFingerprint - Transaction fingerprint
 * @returns Formal readiness result
 */
export async function computeClosingReadiness(
  entityFingerprint: string
): Promise<ClosingReadinessResult> {
  const now = new Date();

  // Gather all required attestations
  const [
    lenderAttestation,
    titleAttestation,
    insuranceAttestation,
    authorityAttestation,
    blockingEvents,
    unresolvedContingencies,
  ] = await Promise.all([
    getLatestAttestation(entityFingerprint, 'LoanClearedToClose', now),
    getLatestAttestation(entityFingerprint, 'TitleClearToClose', now),
    getLatestAttestation(entityFingerprint, 'BinderIssued', now),
    getLatestAttestation(entityFingerprint, 'AuthorityVerified', now),
    getBlockingEvents(entityFingerprint, now),
    checkUnresolvedContingencies(entityFingerprint, now),
  ]);

  // Build readiness context
  const context: ClosingReadinessContext = {
    lenderAttestation,
    titleAttestation,
    insuranceAttestation,
    authorityValid: !!authorityAttestation,
    unresolvedContingencies,
    blockingEvents,
    now,
  };

  // Compute readiness using formal state machine
  return computeReadinessState(context);
}

/**
 * Get latest attestation of a specific type
 */
async function getLatestAttestation(
  entityFingerprint: string,
  attestationType: string,
  now: Date
): Promise<Attestation | undefined> {
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const { data: attestation } = await supabaseServer
    .from('federation_attestations')
    .select('*')
    .eq('entity_fingerprint', entityFingerprint)
    .eq('attestation_type', attestationType)
    .gte('issued_at', thirtyDaysAgo.toISOString())
    .order('issued_at', { ascending: false })
    .limit(1)
    .single();

  if (!attestation) return undefined;

  return {
    attestation_id: attestation.attestation_id,
    issuing_node_id: attestation.issuing_node_id,
    attestation_type: attestation.attestation_type,
    entity_fingerprint: attestation.entity_fingerprint,
    payload: attestation.payload,
    issued_at: new Date(attestation.issued_at),
    signature: attestation.signature,
  };
}

/**
 * Get blocking events
 */
async function getBlockingEvents(
  entityFingerprint: string,
  now: Date
): Promise<BlockingEvent[]> {
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const blockingTypes = [
    { type: 'FinancingWithdrawn', blocker: 'financing_withdrawn' as ClosingBlocker },
    { type: 'TitleDefectDetected', blocker: 'title_defect' as ClosingBlocker },
    { type: 'CoverageWithdrawn', blocker: 'insurance_withdrawn' as ClosingBlocker },
  ];

  const blockingEvents: BlockingEvent[] = [];

  for (const { type, blocker } of blockingTypes) {
    const { data: attestation } = await supabaseServer
      .from('federation_attestations')
      .select('*')
      .eq('entity_fingerprint', entityFingerprint)
      .eq('attestation_type', type)
      .gte('issued_at', thirtyDaysAgo.toISOString())
      .order('issued_at', { ascending: false })
      .limit(1)
      .single();

    if (attestation) {
      blockingEvents.push({
        blocker_type: blocker,
        attestation_id: attestation.attestation_id,
        issuing_node_id: attestation.issuing_node_id,
        detected_at: new Date(attestation.issued_at),
        reason: (attestation.payload as { reason?: string })?.reason,
      });
    }
  }

  return blockingEvents;
}

/**
 * Check for unresolved contingencies
 */
async function checkUnresolvedContingencies(
  entityFingerprint: string,
  now: Date
): Promise<boolean> {
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Check for state transitions indicating contingency resolution
  const { data: attestation } = await supabaseServer
    .from('federation_attestations')
    .select('payload')
    .eq('entity_fingerprint', entityFingerprint)
    .in('attestation_type', ['StateTransitioned', 'ComplianceVerified'])
    .gte('issued_at', thirtyDaysAgo.toISOString())
    .order('issued_at', { ascending: false })
    .limit(1)
    .single();

  if (!attestation) return true; // No resolution attestation = unresolved

  const payload = attestation.payload as { to_state?: string };
  return payload.to_state !== 'under_contract';
}

/**
 * Store closing readiness in cache
 */
export async function storeClosingReadiness(
  entityFingerprint: string,
  result: ClosingReadinessResult
): Promise<void> {
  const { error } = await supabaseServer.from('federation_closing_readiness').upsert({
    entity_fingerprint: entityFingerprint,
    ready: result.ready_to_close,
    computed_at: result.computed_at.toISOString(),
    blocking_reasons: result.blocking_reasons,
  });

  if (error) {
    console.error('Failed to store closing readiness:', error);
    throw new Error('Failed to store closing readiness');
  }
}

/**
 * Refresh closing readiness (compute and store)
 * Call this when new attestations arrive
 */
export async function refreshClosingReadiness(
  entityFingerprint: string
): Promise<ClosingReadinessResult> {
  const result = await computeClosingReadiness(entityFingerprint);
  await storeClosingReadiness(entityFingerprint, result);
  return result;
}
