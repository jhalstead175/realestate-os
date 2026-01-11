/**
 * Anti-Corruption Layer: Schema Validation
 *
 * Type-safe validation of federation protocol messages.
 */

import { z } from 'zod';

/**
 * Verification Request Schema
 */
export const VerificationRequestSchema = z.object({
  entity_fingerprint: z.string().min(1).max(128),
  attestation_type: z
    .enum([
      'StateTransitioned',
      'AuthorityVerified',
      'ComplianceVerified',
      'AuditNarrativeGenerated',
      'ReputationSnapshot',
    ])
    .optional(),
  after_date: z.string().datetime().optional(),
});

export type VerificationRequest = z.infer<typeof VerificationRequestSchema>;

/**
 * Attestation Payload Schema
 * Defines allowed fields in attestation payloads
 */
export const AttestationPayloadSchema = z.object({
  // State transitions
  from_state: z.string().optional(),
  to_state: z.string().optional(),
  timestamp: z.string().datetime().optional(),

  // Authority
  authority_scope: z.record(z.boolean()).optional(),

  // Compliance
  policy_version: z.string().optional(),
  compliance_status: z.enum(['compliant', 'non_compliant', 'pending']).optional(),

  // Narrative
  narrative_hash: z.string().optional(),

  // Reputation
  reputation_score: z.number().min(0).max(100).optional(),
  metrics: z.record(z.number()).optional(),
});

export type AttestationPayload = z.infer<typeof AttestationPayloadSchema>;

/**
 * Validate that payload contains no PII or sensitive data
 *
 * @param payload - Payload to validate
 * @throws If payload contains forbidden fields
 */
export function validateNoPII(payload: Record<string, unknown>): void {
  const forbiddenFields = [
    'name',
    'email',
    'phone',
    'ssn',
    'address',
    'dob',
    'ip_address',
    'user_agent',
    'client_id',
    'buyer_name',
    'seller_name',
    'agent_name',
    'price',
    'amount',
  ];

  for (const field of forbiddenFields) {
    if (field in payload) {
      throw new Error(`Payload contains forbidden PII field: ${field}`);
    }
  }

  // Recursively check nested objects
  for (const value of Object.values(payload)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      validateNoPII(value as Record<string, unknown>);
    }
  }
}
