/**
 * Attestation Generation and Verification
 *
 * Core functions for creating and verifying attestations.
 */

import type {
  Attestation,
  AttestationType,
  AttestationPayload,
  InboxEnvelope,
} from './types.js';
import { sign, verify } from './crypto.js';

/**
 * Create a new attestation
 *
 * @param params - Attestation parameters
 * @returns Signed attestation
 */
export async function createAttestation(params: {
  issuing_node_id: string;
  attestation_type: AttestationType;
  entity_fingerprint: string;
  payload: AttestationPayload;
  private_key: string;
}): Promise<Attestation> {
  const attestation_id = crypto.randomUUID();
  const issued_at = new Date();

  const unsignedAttestation = {
    attestation_id,
    issuing_node_id: params.issuing_node_id,
    attestation_type: params.attestation_type,
    entity_fingerprint: params.entity_fingerprint,
    payload: params.payload,
    issued_at,
  };

  const signature = await sign(unsignedAttestation, params.private_key);

  return {
    ...unsignedAttestation,
    signature,
  };
}

/**
 * Verify an attestation signature
 *
 * @param attestation - The attestation to verify
 * @param public_key - Public key of the issuing node
 * @returns true if signature is valid
 */
export async function verifyAttestation(
  attestation: Attestation,
  public_key: string
): Promise<boolean> {
  const { signature, ...unsignedAttestation } = attestation;
  return await verify(unsignedAttestation, signature, public_key);
}

/**
 * Create an inbox envelope
 *
 * @param params - Envelope parameters
 * @returns Signed envelope
 */
export async function createInboxEnvelope(params: {
  from_node_id: string;
  to_node_id: string;
  attestations: Attestation[];
  private_key: string;
}): Promise<InboxEnvelope> {
  const envelope_id = crypto.randomUUID();
  const sent_at = new Date();

  const unsignedEnvelope = {
    envelope_id,
    from_node_id: params.from_node_id,
    to_node_id: params.to_node_id,
    attestations: params.attestations,
    sent_at,
  };

  const envelope_signature = await sign(unsignedEnvelope, params.private_key);

  return {
    ...unsignedEnvelope,
    envelope_signature,
  };
}

/**
 * Verify an inbox envelope
 *
 * @param envelope - The envelope to verify
 * @param public_key - Public key of the sending node
 * @returns true if envelope signature is valid
 */
export async function verifyInboxEnvelope(
  envelope: InboxEnvelope,
  public_key: string
): Promise<boolean> {
  const { envelope_signature, ...unsignedEnvelope } = envelope;
  return await verify(unsignedEnvelope, envelope_signature, public_key);
}

/**
 * Batch create attestations from events
 *
 * @param events - Internal events to attest
 * @param params - Node parameters
 * @returns Array of signed attestations
 */
export async function createAttestationsFromEvents(
  events: Array<{
    event_type: string;
    entity_fingerprint: string;
    payload: Record<string, unknown>;
  }>,
  params: {
    issuing_node_id: string;
    private_key: string;
  }
): Promise<Attestation[]> {
  const attestations: Attestation[] = [];

  for (const event of events) {
    // Map internal event types to attestation types
    const attestationType = mapEventTypeToAttestationType(event.event_type);
    if (!attestationType) continue; // Skip non-attestable events

    const attestation = await createAttestation({
      issuing_node_id: params.issuing_node_id,
      attestation_type: attestationType,
      entity_fingerprint: event.entity_fingerprint,
      payload: sanitizePayload(event.payload),
      private_key: params.private_key,
    });

    attestations.push(attestation);
  }

  return attestations;
}

/**
 * Map internal event types to attestation types
 * Only certain events are attestable cross-node
 */
function mapEventTypeToAttestationType(
  eventType: string
): AttestationType | null {
  const mapping: Record<string, AttestationType> = {
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
 * Remove PII and sensitive data
 */
function sanitizePayload(
  payload: Record<string, unknown>
): AttestationPayload {
  // Only extract safe, non-PII fields
  return {
    from_state: payload.prior_state as string | undefined,
    to_state: payload.new_state as string | undefined,
    timestamp: payload.occurred_at
      ? new Date(payload.occurred_at as string)
      : undefined,
    policy_version: payload.policy_version as string | undefined,
  };
}
