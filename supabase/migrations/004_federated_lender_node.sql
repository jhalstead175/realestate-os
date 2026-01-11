-- Phase 5.1: Federated Lender Node
-- "Sovereignty, not shared mutability"

-- =============================================================================
-- Federated Nodes Table
-- =============================================================================
-- Identity and trust registry for external nodes (lenders, title, insurance)

create table federated_nodes (
  node_id text primary key,
  node_type text not null check (node_type in ('lender', 'title', 'insurance')),

  display_name text not null,

  -- Cryptographic identity
  public_key text not null,

  -- Explicit trust boundaries
  allowed_event_types text[] not null,

  -- Revocable participation
  enabled boolean default true,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indices
create index federated_nodes_type_idx on federated_nodes(node_type) where enabled = true;
create index federated_nodes_enabled_idx on federated_nodes(enabled);

-- =============================================================================
-- Federated Events Table
-- =============================================================================
-- Immutable log of signed facts from external nodes
-- These are INPUTS, not commands

create table federated_events (
  id uuid primary key default gen_random_uuid(),

  -- Source identity
  source_node text not null references federated_nodes(node_id),

  -- Target aggregate (deal)
  aggregate_id uuid not null,

  -- Event classification
  event_type text not null,

  -- Payload (signed)
  payload jsonb not null,

  -- Cryptographic proof
  signature text not null,

  -- Reception timestamp
  received_at timestamptz default now(),

  -- Processing status
  processed boolean default false,
  processed_at timestamptz
);

-- Indices for efficient querying
create index federated_events_aggregate_idx on federated_events(aggregate_id);
create index federated_events_source_idx on federated_events(source_node);
create index federated_events_type_idx on federated_events(event_type);
create index federated_events_processed_idx on federated_events(processed) where processed = false;
create index federated_events_received_idx on federated_events(received_at desc);

-- Composite index for deal-specific queries
create index federated_events_aggregate_received_idx on federated_events(aggregate_id, received_at desc);

-- =============================================================================
-- RLS Policies
-- =============================================================================

alter table federated_nodes enable row level security;
alter table federated_events enable row level security;

-- Service role can manage nodes
create policy "Service role can manage federated nodes"
  on federated_nodes
  using (true)
  with check (true);

-- Service role can read/write federated events
create policy "Service role can manage federated events"
  on federated_events
  using (true)
  with check (true);

-- TODO: Add policies for authenticated users to view federated events
-- related to their deals (requires actor → deal relationship)

-- =============================================================================
-- Helper Functions
-- =============================================================================

-- Function to update updated_at timestamp
create or replace function update_federated_node_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to auto-update updated_at
create trigger federated_nodes_updated_at
  before update on federated_nodes
  for each row
  execute function update_federated_node_timestamp();
