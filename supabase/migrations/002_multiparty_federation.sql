-- Multi-Party Federation Extension
-- Extends federation to support lenders, title companies, insurance providers

-- ============================================================================
-- UPDATE FEDERATION NODES SCHEMA
-- ============================================================================

-- Add node_type column to support multi-party roles
ALTER TABLE federation_nodes
  ADD COLUMN node_type TEXT NOT NULL DEFAULT 'brokerage'
  CHECK (node_type IN ('brokerage', 'lender', 'title', 'insurance', 'escrow', 'inspector'));

-- Rename brokerage_name to organization_name (more generic)
ALTER TABLE federation_nodes
  RENAME COLUMN brokerage_name TO organization_name;

-- Update indexes
CREATE INDEX idx_federation_nodes_type ON federation_nodes(node_type);

-- ============================================================================
-- UPDATE ATTESTATION TYPES
-- ============================================================================

-- Extend attestation_type constraint to include new types
ALTER TABLE federation_attestations
  DROP CONSTRAINT IF EXISTS federation_attestations_attestation_type_check;

ALTER TABLE federation_attestations
  ADD CONSTRAINT federation_attestations_attestation_type_check
  CHECK (attestation_type IN (
    -- Core attestations
    'StateTransitioned',
    'AuthorityVerified',
    'ComplianceVerified',
    'AuditNarrativeGenerated',
    'ReputationSnapshot',
    -- Lender attestations
    'BorrowerPrequalified',
    'FundsVerified',
    'LoanClearedToClose',
    'FinancingWithdrawn',
    -- Title attestations
    'ChainOfTitleVerified',
    'EncumbrancesDisclosed',
    'TitleClearToClose',
    'TitleDefectDetected',
    -- Insurance attestations
    'RiskAccepted',
    'BinderIssued',
    'CoverageConditional',
    'CoverageWithdrawn'
  ));

-- ============================================================================
-- CLOSING READINESS TRACKING
-- ============================================================================

-- Closing readiness cache (derived from attestations)
CREATE TABLE federation_closing_readiness (
  entity_fingerprint TEXT PRIMARY KEY,
  ready BOOLEAN NOT NULL DEFAULT FALSE,

  -- Individual requirement statuses
  funds_ready BOOLEAN DEFAULT FALSE,
  funds_attested_by UUID REFERENCES federation_nodes(node_id),
  funds_attestation_id UUID,
  funds_updated_at TIMESTAMPTZ,

  title_clear BOOLEAN DEFAULT FALSE,
  title_attested_by UUID REFERENCES federation_nodes(node_id),
  title_attestation_id UUID,
  title_updated_at TIMESTAMPTZ,

  insurance_bound BOOLEAN DEFAULT FALSE,
  insurance_attested_by UUID REFERENCES federation_nodes(node_id),
  insurance_attestation_id UUID,
  insurance_updated_at TIMESTAMPTZ,

  authority_valid BOOLEAN DEFAULT FALSE,
  authority_attested_by UUID REFERENCES federation_nodes(node_id),
  authority_attestation_id UUID,
  authority_updated_at TIMESTAMPTZ,

  contingencies_resolved BOOLEAN DEFAULT FALSE,
  contingencies_attested_by UUID REFERENCES federation_nodes(node_id),
  contingencies_attestation_id UUID,
  contingencies_updated_at TIMESTAMPTZ,

  -- Metadata
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  blocking_reasons JSONB DEFAULT '[]'
);

CREATE INDEX idx_closing_readiness_ready ON federation_closing_readiness(ready);
CREATE INDEX idx_closing_readiness_computed ON federation_closing_readiness(computed_at DESC);

-- ============================================================================
-- ROLE-SPECIFIC AUTHORITY TEMPLATES
-- ============================================================================

-- Authority templates by node type
CREATE TABLE federation_authority_templates (
  node_type TEXT PRIMARY KEY CHECK (node_type IN (
    'brokerage', 'lender', 'title', 'insurance', 'escrow', 'inspector'
  )),

  may_read TEXT[] NOT NULL,
  may_attest TEXT[] NOT NULL,
  excluded_from TEXT[] NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default templates
INSERT INTO federation_authority_templates (node_type, may_read, may_attest, excluded_from) VALUES
  ('brokerage',
   ARRAY['transaction_state', 'property_state', 'authority', 'offers', 'contingencies'],
   ARRAY['StateTransitioned', 'AuthorityVerified', 'ComplianceVerified'],
   ARRAY['underwriting', 'title_chain', 'insurance_risk']),

  ('lender',
   ARRAY['transaction_state', 'contingencies'],
   ARRAY['BorrowerPrequalified', 'FundsVerified', 'LoanClearedToClose', 'FinancingWithdrawn'],
   ARRAY['offers', 'negotiation', 'agent_communications']),

  ('title',
   ARRAY['property_identity', 'ownership_assertions', 'authority'],
   ARRAY['ChainOfTitleVerified', 'EncumbrancesDisclosed', 'TitleClearToClose', 'TitleDefectDetected'],
   ARRAY['offers', 'financing', 'negotiation']),

  ('insurance',
   ARRAY['property_facts', 'title_status', 'transaction_state'],
   ARRAY['RiskAccepted', 'BinderIssued', 'CoverageConditional', 'CoverageWithdrawn'],
   ARRAY['buyer_identity', 'financing', 'agent_communications']),

  ('escrow',
   ARRAY['transaction_state', 'closing_readiness', 'funds_status', 'title_status'],
   ARRAY['StateTransitioned', 'ComplianceVerified'],
   ARRAY['negotiation', 'underwriting']),

  ('inspector',
   ARRAY['property_facts', 'transaction_state'],
   ARRAY['StateTransitioned', 'ComplianceVerified'],
   ARRAY['offers', 'financing', 'title']);

-- ============================================================================
-- ROLE-SPECIFIC REPUTATION METRICS
-- ============================================================================

-- Extend reputation snapshots to support role-specific metrics
ALTER TABLE federation_reputation_snapshots
  ADD COLUMN node_type TEXT CHECK (node_type IN (
    'brokerage', 'lender', 'title', 'insurance', 'escrow', 'inspector'
  ));

-- Create index on node_type for role-specific queries
CREATE INDEX idx_reputation_node_type ON federation_reputation_snapshots(node_type);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Active nodes with reputation (updated to include node_type)
DROP VIEW IF EXISTS federation_nodes_with_reputation;
CREATE VIEW federation_nodes_with_reputation AS
SELECT
  n.node_id,
  n.organization_name,
  n.node_type,
  n.jurisdiction,
  n.status,
  n.policy_manifest_hash,
  n.created_at,
  r.score as reputation_score,
  r.metrics as reputation_metrics,
  r.computed_at as reputation_updated_at
FROM federation_nodes n
LEFT JOIN LATERAL (
  SELECT score, metrics, computed_at
  FROM federation_reputation_snapshots
  WHERE node_id = n.node_id
    AND valid_until > NOW()
  ORDER BY computed_at DESC
  LIMIT 1
) r ON true
WHERE n.status = 'active';

-- Closing readiness summary view
CREATE VIEW federation_closing_summary AS
SELECT
  entity_fingerprint,
  ready,
  (funds_ready AND title_clear AND insurance_bound AND authority_valid AND contingencies_resolved) as all_requirements_met,
  CASE
    WHEN NOT funds_ready THEN 'Waiting for lender clearance'
    WHEN NOT title_clear THEN 'Waiting for title clearance'
    WHEN NOT insurance_bound THEN 'Waiting for insurance binder'
    WHEN NOT authority_valid THEN 'Waiting for authority verification'
    WHEN NOT contingencies_resolved THEN 'Waiting for contingencies'
    ELSE 'Ready to close'
  END as status_message,
  computed_at
FROM federation_closing_readiness;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to compute closing readiness from attestations
CREATE OR REPLACE FUNCTION compute_closing_readiness(
  p_entity_fingerprint TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_funds_ready BOOLEAN := FALSE;
  v_title_clear BOOLEAN := FALSE;
  v_insurance_bound BOOLEAN := FALSE;
  v_authority_valid BOOLEAN := FALSE;
  v_contingencies_resolved BOOLEAN := FALSE;
  v_ready BOOLEAN := FALSE;
BEGIN
  -- Check for LoanClearedToClose attestation
  SELECT EXISTS (
    SELECT 1 FROM federation_attestations
    WHERE entity_fingerprint = p_entity_fingerprint
      AND attestation_type = 'LoanClearedToClose'
      AND issued_at > NOW() - INTERVAL '30 days'
  ) INTO v_funds_ready;

  -- Check for TitleClearToClose attestation
  SELECT EXISTS (
    SELECT 1 FROM federation_attestations
    WHERE entity_fingerprint = p_entity_fingerprint
      AND attestation_type = 'TitleClearToClose'
      AND issued_at > NOW() - INTERVAL '30 days'
  ) INTO v_title_clear;

  -- Check for BinderIssued attestation
  SELECT EXISTS (
    SELECT 1 FROM federation_attestations
    WHERE entity_fingerprint = p_entity_fingerprint
      AND attestation_type = 'BinderIssued'
      AND issued_at > NOW() - INTERVAL '30 days'
  ) INTO v_insurance_bound;

  -- Check for AuthorityVerified attestation
  SELECT EXISTS (
    SELECT 1 FROM federation_attestations
    WHERE entity_fingerprint = p_entity_fingerprint
      AND attestation_type = 'AuthorityVerified'
      AND issued_at > NOW() - INTERVAL '30 days'
  ) INTO v_authority_valid;

  -- Check for contingency resolution (via StateTransitioned or ComplianceVerified)
  SELECT EXISTS (
    SELECT 1 FROM federation_attestations
    WHERE entity_fingerprint = p_entity_fingerprint
      AND attestation_type IN ('StateTransitioned', 'ComplianceVerified')
      AND payload->>'to_state' = 'under_contract'
      AND issued_at > NOW() - INTERVAL '30 days'
  ) INTO v_contingencies_resolved;

  -- Overall readiness
  v_ready := v_funds_ready AND v_title_clear AND v_insurance_bound
             AND v_authority_valid AND v_contingencies_resolved;

  -- Upsert closing readiness
  INSERT INTO federation_closing_readiness (
    entity_fingerprint, ready,
    funds_ready, title_clear, insurance_bound,
    authority_valid, contingencies_resolved,
    computed_at
  ) VALUES (
    p_entity_fingerprint, v_ready,
    v_funds_ready, v_title_clear, v_insurance_bound,
    v_authority_valid, v_contingencies_resolved,
    NOW()
  )
  ON CONFLICT (entity_fingerprint) DO UPDATE SET
    ready = EXCLUDED.ready,
    funds_ready = EXCLUDED.funds_ready,
    title_clear = EXCLUDED.title_clear,
    insurance_bound = EXCLUDED.insurance_bound,
    authority_valid = EXCLUDED.authority_valid,
    contingencies_resolved = EXCLUDED.contingencies_resolved,
    computed_at = EXCLUDED.computed_at;

  RETURN v_ready;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Closing readiness: readable by authenticated users
ALTER TABLE federation_closing_readiness ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read closing readiness"
  ON federation_closing_readiness
  FOR SELECT
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Service role can write closing readiness"
  ON federation_closing_readiness
  FOR ALL
  USING (auth.role() = 'service_role');

-- Authority templates: readable by all, writable by service
ALTER TABLE federation_authority_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read authority templates"
  ON federation_authority_templates
  FOR SELECT
  USING (TRUE);

CREATE POLICY "Service role can write authority templates"
  ON federation_authority_templates
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE federation_closing_readiness IS 'Derived meta-state tracking transaction readiness from multi-party attestations';
COMMENT ON TABLE federation_authority_templates IS 'Role-specific authority scopes defining what each node type may read and attest';
COMMENT ON FUNCTION compute_closing_readiness IS 'Computes closing readiness from attestation history - replaces 30 phone calls with one provable condition';
