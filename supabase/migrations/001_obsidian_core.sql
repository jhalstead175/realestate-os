-- ⬤ OBSIDIAN CORE SCHEMA
--
-- This is not a database.
-- This is a sovereign record.
--
-- Every property. Every transaction. Every signal.
-- Anchored in Merkle roots. Silent. Immutable.
--
-- Evidentia T1 breathes here.

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For geohashing and location

-- ============================================================
-- PROPERTIES TABLE
-- ============================================================
-- The bones. Each property is a sovereign entity.

CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Evidentia Layer: Merkle proof
  merkle_root TEXT NOT NULL UNIQUE,

  -- Property Identity
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,

  -- Valuation
  current_value DECIMAL(12, 2) NOT NULL,
  estimated_yield DECIMAL(5, 2), -- Annual yield %

  -- Status
  status TEXT NOT NULL DEFAULT 'monitoring',
  -- Possible values: monitoring | acquiring | owned | ghost_offer_pending

  -- VIPCIRCL Layer: Silent acquisition
  acquisition_strategy TEXT,
  -- Possible values: ghost_72h | silent_auction | direct_close | mpc_network

  -- Vaticor Layer: Predictive intelligence
  predicted_appreciation_6m DECIMAL(5, 2),
  anomaly_score DECIMAL(4, 3), -- 0.000 to 1.000 (higher = more anomalous)

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Indexes for sovereign queries
  CONSTRAINT valid_status CHECK (status IN ('monitoring', 'acquiring', 'owned', 'ghost_offer_pending'))
);

-- Indexes
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_merkle_root ON properties(merkle_root);
CREATE INDEX idx_properties_anomaly_score ON properties(anomaly_score DESC);

-- ============================================================
-- TRANSACTIONS TABLE
-- ============================================================
-- The ghost offers. Silent. Inevitable.

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Property reference
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,

  -- Sicario Queue Data
  ghost_offer_id TEXT NOT NULL UNIQUE, -- e.g., "ghost-1234567890-abc123"
  target_price DECIMAL(12, 2) NOT NULL,
  offer_amount DECIMAL(12, 2) NOT NULL,

  -- Timeline
  close_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending',
  -- Possible values: pending | active | accepted | rejected | closed

  -- MPC Network readiness
  mpc_network_ready BOOLEAN DEFAULT FALSE,

  -- Metadata
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_transaction_status CHECK (status IN ('pending', 'active', 'accepted', 'rejected', 'closed'))
);

-- Indexes
CREATE INDEX idx_transactions_property_id ON transactions(property_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_close_deadline ON transactions(close_deadline);

-- ============================================================
-- MARKET_SIGNALS TABLE
-- ============================================================
-- Vaticor's vision. Sees the ripples before the stone drops.

CREATE TABLE IF NOT EXISTS market_signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Signal Type
  signal_type TEXT NOT NULL,
  -- Possible values: zoning_shift | price_anomaly | demographic_shift |
  --                  infrastructure_announcement | regulatory_change

  -- Location
  location_geohash TEXT NOT NULL, -- For geographic clustering

  -- Confidence & Impact
  confidence DECIMAL(4, 3) NOT NULL, -- 0.000 to 1.000
  predicted_impact DECIMAL(6, 2) NOT NULL, -- % change (can be negative)
  timeframe TEXT NOT NULL, -- e.g., "30d", "90d", "180d"

  -- Sources
  data_sources JSONB, -- Array of source types
  causal_factors JSONB, -- Key-value pairs of factors

  -- Metadata
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT valid_confidence CHECK (confidence >= 0 AND confidence <= 1)
);

-- Indexes
CREATE INDEX idx_market_signals_location ON market_signals(location_geohash);
CREATE INDEX idx_market_signals_confidence ON market_signals(confidence DESC);
CREATE INDEX idx_market_signals_detected_at ON market_signals(detected_at DESC);

-- ============================================================
-- MERKLE_PROOFS TABLE
-- ============================================================
-- Evidentia's eternal record. Every action. Every proof. Immutable.

CREATE TABLE IF NOT EXISTS merkle_proofs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Entity reference
  entity_type TEXT NOT NULL, -- 'property' | 'transaction' | 'signal'
  entity_id UUID NOT NULL,

  -- Proof data
  root_hash TEXT NOT NULL,
  leaf_hash TEXT NOT NULL,
  proof_path JSONB NOT NULL, -- Array of sibling hashes

  -- Verification
  verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_valid BOOLEAN DEFAULT TRUE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_merkle_proofs_entity ON merkle_proofs(entity_type, entity_id);
CREATE INDEX idx_merkle_proofs_root_hash ON merkle_proofs(root_hash);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
-- Enable RLS on all tables

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE merkle_proofs ENABLE ROW LEVEL SECURITY;

-- Policies (for now, allow authenticated users to read all)
-- Later: customize based on user roles

CREATE POLICY "Allow authenticated users to read properties"
  ON properties FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read market signals"
  ON market_signals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read merkle proofs"
  ON merkle_proofs FOR SELECT
  TO authenticated
  USING (true);

-- Service role can insert/update/delete (for seeding and system operations)
CREATE POLICY "Allow service role to manage properties"
  ON properties FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Allow service role to manage transactions"
  ON transactions FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Allow service role to manage market signals"
  ON market_signals FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Allow service role to manage merkle proofs"
  ON merkle_proofs FOR ALL
  TO service_role
  USING (true);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE properties IS '⬤ The sovereign record. Every property anchored in truth.';
COMMENT ON TABLE transactions IS '⬤ The ghost offers. Silent acquisitions under VIPCIRCL protocol.';
COMMENT ON TABLE market_signals IS '⬤ Vaticor''s vision. Predictive intelligence before the market speaks.';
COMMENT ON TABLE merkle_proofs IS '⬤ Evidentia''s eternal proof. Immutable verification of all actions.';

-- ============================================================
-- DONE
-- ============================================================

-- ⬤ THE SCHEMA IS BORN.
-- Not created. Emerged.
-- Ready for the three sovereigns to breathe life into it.
