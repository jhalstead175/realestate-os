/**
 * Federation Core Types
 *
 * This is the canonical type system for cross-brokerage federation.
 * All federation operations must use these types.
 */

/**
 * Federation Node Identity
 * Represents a participant in the federation network
 */
export interface FederationNode {
  node_id: string;
  organization_name: string; // Generic: brokerage, lender, title company, etc.
  node_type: NodeType;
  jurisdiction: string;
  public_key: string;
  policy_manifest_hash: string;
  created_at: Date;
  status: 'active' | 'suspended' | 'revoked';
}

/**
 * Node Types
 * Each node type has specific attestation capabilities
 */
export type NodeType =
  | 'brokerage'
  | 'lender'
  | 'title'
  | 'insurance'
  | 'escrow'
  | 'inspector';

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
 *
 * Core attestations (all nodes):
 * - StateTransitioned, AuthorityVerified, ComplianceVerified
 * - AuditNarrativeGenerated, ReputationSnapshot
 *
 * Lender attestations:
 * - BorrowerPrequalified, FundsVerified, LoanClearedToClose, FinancingWithdrawn
 *
 * Title attestations:
 * - ChainOfTitleVerified, EncumbrancesDisclosed, TitleClearToClose, TitleDefectDetected
 *
 * Insurance attestations:
 * - RiskAccepted, BinderIssued, CoverageConditional, CoverageWithdrawn
 */
export type AttestationType =
  // Core attestations
  | 'StateTransitioned'
  | 'AuthorityVerified'
  | 'ComplianceVerified'
  | 'AuditNarrativeGenerated'
  | 'ReputationSnapshot'
  // Lender attestations
  | 'BorrowerPrequalified'
  | 'FundsVerified'
  | 'LoanClearedToClose'
  | 'FinancingWithdrawn'
  // Title attestations
  | 'ChainOfTitleVerified'
  | 'EncumbrancesDisclosed'
  | 'TitleClearToClose'
  | 'TitleDefectDetected'
  // Insurance attestations
  | 'RiskAccepted'
  | 'BinderIssued'
  | 'CoverageConditional'
  | 'CoverageWithdrawn';

/**
 * Attestation Payload
 * Minimal data required for verification
 */
export interface AttestationPayload {
  // Core fields
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

  // Lender attestations
  confidence?: number; // 0-1 confidence score
  conditions?: string[]; // Conditional requirements

  // Title attestations
  exceptions?: string[]; // Title exceptions
  defect_severity?: 'low' | 'medium' | 'high' | 'critical';

  // Insurance attestations
  coverage_type?: string;
  effective_date?: Date;
  expiration_date?: Date;
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
 * Metrics vary by node type
 */
export interface ReputationSnapshot {
  node_id: string;
  node_type: NodeType;
  score: number;
  metrics: ReputationMetrics;
  computed_at: Date;
  valid_until: Date;
}

/**
 * Reputation Metrics (Role-Specific)
 */
export type ReputationMetrics =
  | BrokerageMetrics
  | LenderMetrics
  | TitleMetrics
  | InsuranceMetrics;

export interface BrokerageMetrics {
  on_time_close_ratio: number;
  failure_rate: number;
  dispute_frequency: number;
  automation_reliability: number;
  total_transactions: number;
}

export interface LenderMetrics {
  clearance_accuracy: number; // How often "cleared to close" actually closes
  time_to_clear_avg_days: number;
  withdrawal_rate: number; // How often financing is withdrawn
  total_loans: number;
}

export interface TitleMetrics {
  defect_miss_rate: number; // Defects found after "clear to close"
  clearance_reliability: number;
  exception_accuracy: number;
  total_title_searches: number;
}

export interface InsuranceMetrics {
  binder_revocation_rate: number;
  claim_dispute_rate: number; // Future
  coverage_accuracy: number;
  total_policies: number;
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

/**
 * Closing Readiness
 * Meta-state derived from multi-party attestations
 */
export interface ClosingReadiness {
  entity_fingerprint: string; // Transaction fingerprint
  ready: boolean;
  requirements: ClosingRequirement[];
  computed_at: Date;
}

export interface ClosingRequirement {
  requirement_type:
    | 'funds_ready'
    | 'title_clear'
    | 'insurance_bound'
    | 'authority_valid'
    | 'contingencies_resolved';
  satisfied: boolean;
  attested_by?: string; // Node ID
  attestation_id?: string;
  last_updated: Date;
  blocking_reason?: string;
}

/**
 * Role-Specific Authority Scopes
 */
export interface AuthorityScope {
  // What this node may read
  may_read: string[];

  // What this node may attest to
  may_attest: AttestationType[];

  // What this node may never see
  excluded_from: string[];
}

export const ROLE_AUTHORITY_TEMPLATES: Record<NodeType, AuthorityScope> = {
  brokerage: {
    may_read: [
      'transaction_state',
      'property_state',
      'authority',
      'offers',
      'contingencies',
    ],
    may_attest: [
      'StateTransitioned',
      'AuthorityVerified',
      'ComplianceVerified',
    ],
    excluded_from: ['underwriting', 'title_chain', 'insurance_risk'],
  },
  lender: {
    may_read: ['transaction_state', 'contingencies'],
    may_attest: [
      'BorrowerPrequalified',
      'FundsVerified',
      'LoanClearedToClose',
      'FinancingWithdrawn',
    ],
    excluded_from: ['offers', 'negotiation', 'agent_communications'],
  },
  title: {
    may_read: ['property_identity', 'ownership_assertions', 'authority'],
    may_attest: [
      'ChainOfTitleVerified',
      'EncumbrancesDisclosed',
      'TitleClearToClose',
      'TitleDefectDetected',
    ],
    excluded_from: ['offers', 'financing', 'negotiation'],
  },
  insurance: {
    may_read: ['property_facts', 'title_status', 'transaction_state'],
    may_attest: [
      'RiskAccepted',
      'BinderIssued',
      'CoverageConditional',
      'CoverageWithdrawn',
    ],
    excluded_from: ['buyer_identity', 'financing', 'agent_communications'],
  },
  escrow: {
    may_read: [
      'transaction_state',
      'closing_readiness',
      'funds_status',
      'title_status',
    ],
    may_attest: ['StateTransitioned', 'ComplianceVerified'],
    excluded_from: ['negotiation', 'underwriting'],
  },
  inspector: {
    may_read: ['property_facts', 'transaction_state'],
    may_attest: ['StateTransitioned', 'ComplianceVerified'],
    excluded_from: ['offers', 'financing', 'title'],
  },
};
