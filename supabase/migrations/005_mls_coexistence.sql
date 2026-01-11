-- Phase 5.4: MLS Coexistence & Gradual Displacement
-- "Win by outgrowing, not fighting"

-- =============================================================================
-- MLS Snapshots Table
-- =============================================================================
-- Append-only, immutable log of MLS data snapshots
-- MLS is untrusted, read-only, periodic data source

create table mls_snapshots (
  id uuid primary key default gen_random_uuid(),

  -- MLS identity
  mls_id text not null,              -- Which MLS (e.g., "NWMLS", "CRMLS")
  listing_id text not null,          -- MLS listing number

  -- Snapshot data (raw, unprocessed)
  snapshot jsonb not null,

  -- Metadata
  retrieved_at timestamptz default now(),

  -- Optional: Link to internal transaction (if associated)
  transaction_id uuid,

  -- Status tracking
  processed boolean default false,
  processed_at timestamptz
);

-- Indices for efficient querying
create index mls_snapshots_mls_listing_idx on mls_snapshots(mls_id, listing_id);
create index mls_snapshots_retrieved_idx on mls_snapshots(retrieved_at desc);
create index mls_snapshots_transaction_idx on mls_snapshots(transaction_id) where transaction_id is not null;
create index mls_snapshots_processed_idx on mls_snapshots(processed) where processed = false;

-- Composite index for finding latest snapshot per listing
create index mls_snapshots_listing_latest_idx on mls_snapshots(mls_id, listing_id, retrieved_at desc);

-- =============================================================================
-- MLS Configuration Table
-- =============================================================================
-- Configuration for MLS sources (which MLSs we ingest from)

create table mls_sources (
  mls_id text primary key,

  display_name text not null,
  region text,

  -- Ingestion settings
  enabled boolean default true,
  ingestion_frequency_hours integer default 24,

  -- API credentials (encrypted)
  credentials jsonb,

  -- Trust level (informational only)
  trust_level text check (trust_level in ('advisory', 'contextual')) default 'advisory',

  last_ingestion_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================================================
-- MLS Attribution Table
-- =============================================================================
-- Links internal transactions to MLS listings for attribution/context
-- This is association, not dependency

create table mls_attributions (
  id uuid primary key default gen_random_uuid(),

  transaction_id uuid not null,
  mls_id text not null,
  listing_id text not null,

  -- Attribution metadata
  attributed_at timestamptz default now(),
  attributed_by text,             -- Actor who made the association

  -- Status
  active boolean default true,

  unique(transaction_id, mls_id, listing_id)
);

-- Indices
create index mls_attributions_transaction_idx on mls_attributions(transaction_id);
create index mls_attributions_listing_idx on mls_attributions(mls_id, listing_id);
create index mls_attributions_active_idx on mls_attributions(active) where active = true;

-- =============================================================================
-- RLS Policies
-- =============================================================================

alter table mls_snapshots enable row level security;
alter table mls_sources enable row level security;
alter table mls_attributions enable row level security;

-- Service role can manage MLS data
create policy "Service role can manage mls snapshots"
  on mls_snapshots
  using (true)
  with check (true);

create policy "Service role can manage mls sources"
  on mls_sources
  using (true)
  with check (true);

create policy "Service role can manage mls attributions"
  on mls_attributions
  using (true)
  with check (true);

-- TODO: Add policies for authenticated users to view MLS snapshots
-- related to their deals (requires actor → deal relationship)

-- =============================================================================
-- Helper Functions
-- =============================================================================

-- Function to update updated_at timestamp
create or replace function update_mls_source_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to auto-update updated_at
create trigger mls_sources_updated_at
  before update on mls_sources
  for each row
  execute function update_mls_source_timestamp();

-- =============================================================================
-- Comments for Documentation
-- =============================================================================

comment on table mls_snapshots is 'Append-only log of MLS listing snapshots. MLS data is advisory, not authoritative.';
comment on table mls_sources is 'Configuration for MLS data sources. Trust level is informational only.';
comment on table mls_attributions is 'Links internal transactions to MLS listings for context. Association, not dependency.';

comment on column mls_snapshots.snapshot is 'Raw MLS data. Never trusted as authoritative state.';
comment on column mls_snapshots.transaction_id is 'Optional link to internal transaction. MLS does not control transaction state.';
comment on column mls_sources.trust_level is 'Advisory only. MLS is never authoritative.';
