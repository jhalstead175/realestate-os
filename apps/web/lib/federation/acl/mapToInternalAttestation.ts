/**
 * Anti-Corruption Layer: Internal Mapping
 *
 * Maps validated external attestations to internal representations.
 * Prevents federation concepts from leaking into core domain.
 */

interface ExternalAttestation {
  attestation_id: string;
  issuing_node_id: string;
  attestation_type: string;
  entity_fingerprint: string;
  payload: Record<string, unknown>;
  issued_at: string;
  signature: string;
}

interface InternalAttestation {
  id: string;
  external_node: string;
  type: string;
  entity_ref: string;
  data: Record<string, unknown>;
  verified_at: Date;
}

/**
 * Map external attestation to internal representation
 *
 * This isolates the internal domain from federation protocol changes.
 *
 * @param external - Validated external attestation
 * @returns Internal attestation representation
 */
export function mapToInternalAttestation(
  external: ExternalAttestation
): InternalAttestation {
  return {
    id: external.attestation_id,
    external_node: external.issuing_node_id,
    type: mapAttestationType(external.attestation_type),
    entity_ref: external.entity_fingerprint,
    data: external.payload,
    verified_at: new Date(external.issued_at),
  };
}

/**
 * Map federation attestation types to internal event types
 */
function mapAttestationType(externalType: string): string {
  const mapping: Record<string, string> = {
    StateTransitioned: 'external_state_change',
    AuthorityVerified: 'external_authority_proof',
    ComplianceVerified: 'external_compliance_proof',
    AuditNarrativeGenerated: 'external_audit_narrative',
    ReputationSnapshot: 'external_reputation_update',
  };

  return mapping[externalType] || 'external_unknown';
}
