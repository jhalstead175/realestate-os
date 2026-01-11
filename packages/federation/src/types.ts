/**
 * Federation Core Types
 *
 * This is the canonical type system for cross-brokerage federation.
 * All federation operations must use these types.
 */

/**
 * Federation Node Identity
 * Represents a single brokerage in the federation network
 */
export interface FederationNode {
  node_id: string;
  brokerage_name: string;
  jurisdiction: string;
  public_key: string;
  policy_manifest_hash: string;
  created_at: Date;
  status: 'active' | 'suspended' | 'revoked';
}

/**
 * Policy Manifest
 * Defines the semantic and operational contract of a federation node
 */
export interface PolicyManifest {
  version: string;
  ontology_version: string;
  event_dictionary_version: string;
  state_machine_version: string;

  // What automations are allowed
  automation_allowed_event_types: string[];

  // What attestation types this node supports
  attestation_types_supported: string[];

  // Compliance declarations
  compliance_frameworks: string[];

  // Generated timestamp
  issued_at: Date;
}

/**
 * Attestation
 * A minimal, signed proof that something happened
 * NEVER contains PII or raw internal data
 */
export interface Attestation {
  attestation_id: string;
  issuing_node_id: string;
  attestation_type: AttestationType;
  entity_fingerprint: string;
  payload: AttestationPayload;
  issued_at: Date;
  signature: string;
}

/**
 * Attestation Types
 * Closed set of allowable cross-node communications
 */
export type AttestationType =
  | 'StateTransitioned'
  | 'AuthorityVerified'
  | 'ComplianceVerified'
  | 'AuditNarrativeGenerated'
  | 'ReputationSnapshot';

/**
 * Attestation Payload
 * Minimal data required for verification
 */
export interface AttestationPayload {
  // Type-specific fields (all optional)
  from_state?: string;
  to_state?: string;
  timestamp?: Date;

  // Authority attestation
  authority_scope?: Record<string, boolean>;

  // Compliance attestation
  policy_version?: string;
  compliance_status?: 'compliant' | 'non_compliant' | 'pending';

  // Narrative attestation
  narrative_hash?: string;

  // Reputation attestation
  reputation_score?: number;
  metrics?: Record<string, number>;
}

/**
 * Inbox Envelope
 * Container for incoming attestations
 */
export interface InboxEnvelope {
  envelope_id: string;
  from_node_id: string;
  to_node_id: string;
  attestations: Attestation[];
  envelope_signature: string;
  sent_at: Date;
}

/**
 * Entity Fingerprint
 * Stable, non-reversible identifier for cross-node references
 * NEVER reveals internal IDs
 */
export interface EntityFingerprint {
  entity_type: string;
  jurisdiction: string;
  hash: string;
}

/**
 * Reputation Snapshot
 * Computed from attestations only (not self-reported)
 */
export interface ReputationSnapshot {
  node_id: string;
  score: number;
  metrics: {
    on_time_close_ratio: number;
    failure_rate: number;
    dispute_frequency: number;
    automation_reliability: number;
    total_transactions: number;
  };
  computed_at: Date;
  valid_until: Date;
}

/**
 * Outbox Item
 * Queued attestation awaiting dispatch
 */
export interface OutboxItem {
  outbox_id: string;
  to_node_id: string;
  attestation_id: string;
  status: 'queued' | 'sent' | 'failed';
  attempts: number;
  last_attempt_at?: Date;
  created_at: Date;
}

/**
 * Verification Request
 * Cross-node query for attestation verification
 */
export interface VerificationRequest {
  entity_fingerprint: string;
  attestation_type?: AttestationType;
  after_date?: Date;
}

/**
 * Verification Response
 * Provable chain of attestations
 */
export interface VerificationResponse {
  entity_fingerprint: string;
  attestations: Attestation[];
  verification_chain: {
    issuing_node: string;
    public_key: string;
    signature_valid: boolean;
  }[];
}
