-- Federation Core Schema
-- This migration establishes the cross-brokerage federation infrastructure

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- FEDERATION NODES
-- ============================================================================

-- Federation Node Registry
-- Each brokerage in the federation network
CREATE TABLE federation_nodes (
  node_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brokerage_name TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  public_key TEXT NOT NULL UNIQUE,
  policy_manifest_hash TEXT NOT NULL,

  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'revoked')),

  -- Metadata
  contact_email TEXT,
  api_endpoint TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure unique brokerage per jurisdiction
  UNIQUE(brokerage_name, jurisdiction)
);

CREATE INDEX idx_federation_nodes_status ON federation_nodes(status);
CREATE INDEX idx_federation_nodes_jurisdiction ON federation_nodes(jurisdiction);

-- ============================================================================
-- ATTESTATIONS
-- ============================================================================

-- Federation Attestations
-- Signed proofs that something happened, cross-node verifiable
CREATE TABLE federation_attestations (
  attestation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Issuer
  issuing_node_id UUID NOT NULL REFERENCES federation_nodes(node_id),

  -- What this attests to
  attestation_type TEXT NOT NULL CHECK (attestation_type IN (
    'StateTransitioned',
    'AuthorityVerified',
    'ComplianceVerified',
    'AuditNarrativeGenerated',
    'ReputationSnapshot'
  )),

  -- Entity reference (non-reversible fingerprint)
  entity_fingerprint TEXT NOT NULL,

  -- Minimal payload (no PII)
  payload JSONB NOT NULL,

  -- Cryptographic proof
  signature TEXT NOT NULL,

  -- Temporal
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Indexes for queries
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_attestations_entity ON federation_attestations(entity_fingerprint);
CREATE INDEX idx_attestations_node ON federation_attestations(issuing_node_id);
CREATE INDEX idx_attestations_type ON federation_attestations(attestation_type);
CREATE INDEX idx_attestations_issued_at ON federation_attestations(issued_at DESC);

-- ============================================================================
-- INBOX / OUTBOX
-- ============================================================================

-- Federation Inbox
-- Incoming attestations from other nodes
CREATE TABLE federation_inbox (
  inbox_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Source
  from_node_id UUID NOT NULL REFERENCES federation_nodes(node_id),

  -- Raw envelope
  envelope JSONB NOT NULL,

  -- Verification
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN (
    'pending',
    'valid',
    'invalid'
  )),
  verification_error TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,

  -- Temporal
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_inbox_from_node ON federation_inbox(from_node_id);
CREATE INDEX idx_inbox_status ON federation_inbox(verification_status);
CREATE INDEX idx_inbox_received ON federation_inbox(received_at DESC);

-- Federation Outbox
-- Attestations queued for dispatch to other nodes
CREATE TABLE federation_outbox (
  outbox_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Destination
  to_node_id UUID NOT NULL REFERENCES federation_nodes(node_id),

  -- What to send
  attestation_id UUID NOT NULL REFERENCES federation_attestations(attestation_id),

  -- Dispatch state
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN (
    'queued',
    'sent',
    'failed'
  )),

  -- Retry tracking
  attempts INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,

  -- Temporal
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_outbox_to_node ON federation_outbox(to_node_id);
CREATE INDEX idx_outbox_status ON federation_outbox(status);
CREATE INDEX idx_outbox_created ON federation_outbox(created_at DESC);

-- ============================================================================
-- REPUTATION TRACKING
-- ============================================================================

-- Federation Reputation Snapshots
-- Computed reputation scores (from attestations only, not self-reported)
CREATE TABLE federation_reputation_snapshots (
  snapshot_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Node being scored
  node_id UUID NOT NULL REFERENCES federation_nodes(node_id),

  -- Score
  score NUMERIC(4,2) NOT NULL CHECK (score >= 0 AND score <= 100),

  -- Metrics (derived from attestations)
  metrics JSONB NOT NULL,

  -- Temporal validity
  computed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Only one active snapshot per node
  UNIQUE(node_id, valid_until)
);

CREATE INDEX idx_reputation_node ON federation_reputation_snapshots(node_id);
CREATE INDEX idx_reputation_computed ON federation_reputation_snapshots(computed_at DESC);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Active nodes with their latest reputation
CREATE VIEW federation_nodes_with_reputation AS
SELECT
  n.node_id,
  n.brokerage_name,
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

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE federation_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE federation_attestations ENABLE ROW LEVEL SECURITY;
ALTER TABLE federation_inbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE federation_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE federation_reputation_snapshots ENABLE ROW LEVEL SECURITY;

-- Federation nodes: service role only (managed by system)
CREATE POLICY "Service role can manage federation nodes"
  ON federation_nodes
  FOR ALL
  USING (auth.role() = 'service_role');

-- Attestations: readable by authenticated users, writable by service
CREATE POLICY "Authenticated users can read attestations"
  ON federation_attestations
  FOR SELECT
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Service role can write attestations"
  ON federation_attestations
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Inbox: service role only
CREATE POLICY "Service role can manage inbox"
  ON federation_inbox
  FOR ALL
  USING (auth.role() = 'service_role');

-- Outbox: service role only
CREATE POLICY "Service role can manage outbox"
  ON federation_outbox
  FOR ALL
  USING (auth.role() = 'service_role');

-- Reputation: readable by authenticated, writable by service
CREATE POLICY "Authenticated users can read reputation"
  ON federation_reputation_snapshots
  FOR SELECT
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Service role can write reputation"
  ON federation_reputation_snapshots
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at on federation_nodes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_federation_nodes_updated_at
  BEFORE UPDATE ON federation_nodes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE federation_nodes IS 'Registry of brokerages participating in the federation network';
COMMENT ON TABLE federation_attestations IS 'Signed proofs of events, cross-node verifiable without exposing PII';
COMMENT ON TABLE federation_inbox IS 'Incoming attestation envelopes from other nodes';
COMMENT ON TABLE federation_outbox IS 'Outgoing attestations queued for dispatch';
COMMENT ON TABLE federation_reputation_snapshots IS 'Computed reputation scores derived from attestation history';
