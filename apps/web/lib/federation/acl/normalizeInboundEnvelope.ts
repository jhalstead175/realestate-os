/**
 * Anti-Corruption Layer: Inbound Envelope Normalization
 *
 * Validates and normalizes incoming federation envelopes.
 * Protects internal systems from malformed or malicious data.
 */

import { z } from 'zod';

// Strict schema for inbound envelopes
const InboundEnvelopeSchema = z.object({
  envelope_id: z.string().uuid(),
  from_node_id: z.string().uuid(),
  to_node_id: z.string().uuid(),
  attestations: z
    .array(
      z.object({
        attestation_id: z.string().uuid(),
        issuing_node_id: z.string().uuid(),
        attestation_type: z.enum([
          'StateTransitioned',
          'AuthorityVerified',
          'ComplianceVerified',
          'AuditNarrativeGenerated',
          'ReputationSnapshot',
        ]),
        entity_fingerprint: z.string().min(1).max(128),
        payload: z.record(z.unknown()),
        issued_at: z.string().datetime(),
        signature: z.string().min(1),
      })
    )
    .max(100), // Max 100 attestations per envelope
  envelope_signature: z.string().min(1),
  sent_at: z.string().datetime(),
});

export type NormalizedEnvelope = z.infer<typeof InboundEnvelopeSchema>;

/**
 * Normalize and validate an inbound envelope
 *
 * @param raw - Raw envelope data
 * @returns Normalized envelope
 * @throws If envelope is invalid
 */
export function normalizeInboundEnvelope(raw: unknown): NormalizedEnvelope {
  try {
    return InboundEnvelopeSchema.parse(raw);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid envelope format: ${error.errors.map((e) => e.message).join(', ')}`
      );
    }
    throw error;
  }
}

/**
 * Validate envelope metadata constraints
 *
 * @param envelope - Normalized envelope
 * @throws If constraints are violated
 */
export function validateEnvelopeConstraints(envelope: NormalizedEnvelope): void {
  // Check timestamp is not too far in the past or future
  const sentAt = new Date(envelope.sent_at);
  const now = new Date();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  const maxFuture = 5 * 60 * 1000; // 5 minutes

  if (now.getTime() - sentAt.getTime() > maxAge) {
    throw new Error('Envelope is too old');
  }

  if (sentAt.getTime() - now.getTime() > maxFuture) {
    throw new Error('Envelope timestamp is too far in the future');
  }

  // Validate all attestations are from the same issuing node
  const issuingNode = envelope.from_node_id;
  for (const attestation of envelope.attestations) {
    if (attestation.issuing_node_id !== issuingNode) {
      throw new Error(
        `Attestation ${attestation.attestation_id} is from a different node than envelope sender`
      );
    }
  }
}
