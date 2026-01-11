/**
 * Attestation Emitter
 *
 * Converts internal events into cross-node attestations.
 * This is the boundary between internal operations and federation.
 */

import { createAttestation, createEntityFingerprint } from '@repo/federation';
import { supabaseServer } from '@/lib/supabase/server';

/**
 * Emit attestations from internal events
 *
 * This should be called after events are written to the internal event log.
 * It creates minimal, PII-free attestations for federation.
 */
export async function emitAttestationsFromEvents(params: {
  events: Array<{
    event_id: string;
    event_type: string;
    entity_type: string;
    entity_id: string;
    payload: Record<string, unknown>;
    occurred_at: Date;
  }>;
  issuing_node_id: string;
  private_key: string;
  jurisdiction: string;
  salt: string;
}): Promise<void> {
  const attestableEventTypes = new Set([
    'TransactionStateAdvanced',
    'PropertyStatusSet',
    'AuthorityGranted',
    'AuthorityRevoked',
    'AuditNarrativeGenerated',
  ]);

  const attestationsToCreate = [];

  for (const event of params.events) {
    // Only attest certain event types
    if (!attestableEventTypes.has(event.event_type)) {
      continue;
    }

    // Create entity fingerprint (non-reversible)
    const entityFingerprint = await createEntityFingerprint(
      event.entity_type,
      event.entity_id,
      params.jurisdiction,
      params.salt
    );

    // Map event type to attestation type
    const attestationType = mapEventTypeToAttestationType(event.event_type);
    if (!attestationType) continue;

    // Create attestation
    const attestation = await createAttestation({
      issuing_node_id: params.issuing_node_id,
      attestation_type: attestationType,
      entity_fingerprint: entityFingerprint,
      payload: sanitizePayloadForFederation(event.payload),
      private_key: params.private_key,
    });

    attestationsToCreate.push(attestation);
  }

  if (attestationsToCreate.length === 0) {
    return;
  }

  // Store attestations
  const { error } = await supabaseServer
    .from('federation_attestations')
    .insert(
      attestationsToCreate.map((a) => ({
        attestation_id: a.attestation_id,
        issuing_node_id: a.issuing_node_id,
        attestation_type: a.attestation_type,
        entity_fingerprint: a.entity_fingerprint,
        payload: a.payload,
        issued_at: a.issued_at,
        signature: a.signature,
      }))
    );

  if (error) {
    console.error('Failed to store attestations:', error);
    throw new Error('Failed to store attestations');
  }
}

/**
 * Map internal event types to federation attestation types
 */
function mapEventTypeToAttestationType(
  eventType: string
): 'StateTransitioned' | 'AuthorityVerified' | 'AuditNarrativeGenerated' | null {
  const mapping: Record<
    string,
    'StateTransitioned' | 'AuthorityVerified' | 'AuditNarrativeGenerated'
  > = {
    TransactionStateAdvanced: 'StateTransitioned',
    PropertyStatusSet: 'StateTransitioned',
    AuthorityGranted: 'AuthorityVerified',
    AuthorityRevoked: 'AuthorityVerified',
    AuditNarrativeGenerated: 'AuditNarrativeGenerated',
  };

  return mapping[eventType] || null;
}

/**
 * Sanitize payload for cross-node transmission
 * Remove all PII and sensitive data
 */
function sanitizePayloadForFederation(
  payload: Record<string, unknown>
): Record<string, unknown> {
  // Only extract safe, non-PII fields
  const safe: Record<string, unknown> = {};

  // State transitions
  if (payload.prior_state) safe.from_state = payload.prior_state;
  if (payload.new_state) safe.to_state = payload.new_state;

  // Timestamps
  if (payload.occurred_at) safe.timestamp = payload.occurred_at;

  // Policy/compliance
  if (payload.policy_version) safe.policy_version = payload.policy_version;

  return safe;
}

/**
 * Queue attestations for dispatch to specific nodes
 *
 * Call this after attestations are created to schedule delivery.
 */
export async function queueAttestationForDispatch(params: {
  attestation_id: string;
  to_node_ids: string[];
}): Promise<void> {
  const outboxItems = params.to_node_ids.map((node_id) => ({
    to_node_id: node_id,
    attestation_id: params.attestation_id,
    status: 'queued' as const,
    attempts: 0,
  }));

  const { error } = await supabaseServer
    .from('federation_outbox')
    .insert(outboxItems);

  if (error) {
    console.error('Failed to queue attestations:', error);
    throw new Error('Failed to queue attestations');
  }
}
