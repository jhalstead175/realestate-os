/**
 * CRM / MLS Read-In Integrations
 *
 * CRITICAL PRINCIPLE: Sync listings. Never sync authority.
 *
 * External systems (CRM, MLS) are advisory sources.
 * They provide property data, contact info, listing status.
 * They NEVER provide role assignments, permissions, or authority grants.
 *
 * Authority is ALWAYS derived from internal events, never imported.
 */

-- ==================== CRM SYNC ====================

create table crm_listings (
  id uuid primary key default gen_random_uuid(),

  -- External identifiers
  crm_system text not null,  -- 'salesforce', 'hubspot', 'follow_up_boss', etc.
  crm_listing_id text not null,

  -- Property data (informational only)
  property_address text,
  listing_price numeric,
  listing_status text,
  property_type text,
  bedrooms int,
  bathrooms numeric,
  square_feet int,

  -- Contact data (informational only)
  agent_email text,
  client_name text,
  client_email text,
  client_phone text,

  -- Activity data (informational only)
  last_activity_at timestamptz,
  activity_summary text,

  -- Sync metadata
  synced_at timestamptz default now(),
  last_modified_at timestamptz,
  sync_source text not null,

  -- Reconciliation with internal deal
  matched_aggregate_id uuid,  -- If matched to internal transaction
  reconciliation_status text default 'unmatched' check (reconciliation_status in (
    'unmatched',    -- Not yet matched to internal deal
    'matched',      -- Matched to internal deal
    'conflict',     -- Data conflict between CRM and internal
    'ignored'       -- Manually marked as not needing reconciliation
  )),

  unique (crm_system, crm_listing_id)
);

create index idx_crm_listings_system on crm_listings(crm_system);
create index idx_crm_listings_address on crm_listings(property_address);
create index idx_crm_listings_agent on crm_listings(agent_email);
create index idx_crm_listings_matched on crm_listings(matched_aggregate_id);
create index idx_crm_listings_status on crm_listings(reconciliation_status);

-- ==================== MLS SYNC ====================

create table mls_listings (
  id uuid primary key default gen_random_uuid(),

  -- External identifiers
  mls_system text not null,  -- 'mls_name', 'bright_mls', 'cal_res', etc.
  mls_number text not null,

  -- Property data (informational only)
  property_address text,
  list_price numeric,
  status text,  -- 'active', 'pending', 'closed', 'withdrawn'
  property_type text,
  bedrooms int,
  bathrooms numeric,
  square_feet int,
  lot_size numeric,
  year_built int,

  -- Listing metadata
  list_date date,
  pending_date date,
  closed_date date,
  listing_agent_id text,
  listing_office_id text,

  -- Sync metadata
  synced_at timestamptz default now(),
  last_modified_at timestamptz,
  sync_source text not null,

  -- Reconciliation with internal deal
  matched_aggregate_id uuid,
  reconciliation_status text default 'unmatched' check (reconciliation_status in (
    'unmatched',
    'matched',
    'conflict',
    'ignored'
  )),

  unique (mls_system, mls_number)
);

create index idx_mls_listings_system on mls_listings(mls_system);
create index idx_mls_listings_number on mls_listings(mls_number);
create index idx_mls_listings_address on mls_listings(property_address);
create index idx_mls_listings_agent on mls_listings(listing_agent_id);
create index idx_mls_listings_matched on mls_listings(matched_aggregate_id);
create index idx_mls_listings_status on mls_listings(reconciliation_status);

-- ==================== RECONCILIATION VIEW ====================

create or replace view external_listing_reconciliation_view as
with internal_deals as (
  select
    aggregate_id,
    payload->>'property_address' as property_address,
    payload->>'agent_id' as agent_id,
    event_type,
    created_at
  from events
  where event_type = 'deal_created'
),
crm_unmatched as (
  select
    'crm' as source,
    crm_system as system_name,
    crm_listing_id as external_id,
    property_address,
    agent_email as agent_identifier,
    synced_at,
    matched_aggregate_id,
    reconciliation_status
  from crm_listings
),
mls_unmatched as (
  select
    'mls' as source,
    mls_system as system_name,
    mls_number as external_id,
    property_address,
    listing_agent_id as agent_identifier,
    synced_at,
    matched_aggregate_id,
    reconciliation_status
  from mls_listings
),
all_external as (
  select * from crm_unmatched
  union all
  select * from mls_unmatched
)
select
  e.source,
  e.system_name,
  e.external_id,
  e.property_address as external_address,
  e.agent_identifier as external_agent,
  e.reconciliation_status,
  e.synced_at,
  i.aggregate_id as internal_deal_id,
  i.property_address as internal_address,
  i.agent_id as internal_agent,
  i.created_at as internal_created_at
from all_external e
left join internal_deals i on e.matched_aggregate_id = i.aggregate_id
order by e.reconciliation_status, e.synced_at desc;

-- ==================== AUTHORITY FIREWALL ====================

comment on table crm_listings is
  'CRM listings are INFORMATIONAL ONLY. Never used for authority grants or role assignments. Authority is ALWAYS derived from internal events.';

comment on table mls_listings is
  'MLS listings are INFORMATIONAL ONLY. Never used for authority grants or role assignments. Authority is ALWAYS derived from internal events.';

comment on view external_listing_reconciliation_view is
  'Shows external listings (CRM/MLS) and their reconciliation status with internal deals. Used for detecting data drift, NOT for importing authority.';

-- ==================== SYNC LOG ====================

create table external_sync_log (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('crm', 'mls')),
  system_name text not null,
  sync_started_at timestamptz not null,
  sync_completed_at timestamptz,
  records_fetched int,
  records_created int,
  records_updated int,
  errors int,
  status text not null check (status in ('running', 'completed', 'failed')),
  error_message text,
  created_at timestamptz default now()
);

create index idx_external_sync_log_source on external_sync_log(source);
create index idx_external_sync_log_created on external_sync_log(created_at desc);

comment on table external_sync_log is
  'Audit log for CRM/MLS sync operations. Tracks what was synced and when.';
