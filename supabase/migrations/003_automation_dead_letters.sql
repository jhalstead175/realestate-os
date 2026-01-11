-- Phase 4.1.2: Dead-Letter Queue for Automations
-- "Nothing fails silently. Ever."

-- Create automation_dead_letters table
create table automation_dead_letters (
  id uuid primary key default gen_random_uuid(),

  automation_id text not null,
  agent text not null,
  aggregate_id uuid not null,
  triggering_event_id uuid not null,

  failure_stage text not null check (failure_stage in (
    'agent_invocation',
    'proposal_generation',
    'legality_validation',
    'enqueue',
    'unknown'
  )),

  error_message text not null,
  error_stack text,

  input_snapshot jsonb not null,

  created_at timestamptz default now(),
  resolved boolean default false
);

-- Indices for efficient querying
create index automation_dead_letters_resolved_idx on automation_dead_letters(resolved) where resolved = false;
create index automation_dead_letters_aggregate_idx on automation_dead_letters(aggregate_id);
create index automation_dead_letters_automation_idx on automation_dead_letters(automation_id);
create index automation_dead_letters_created_at_idx on automation_dead_letters(created_at desc);

-- RLS: Only operators can view dead letters (can be refined later)
alter table automation_dead_letters enable row level security;

-- For now: Allow service role to write (automations run as service)
-- Operators need to be authenticated users with specific role (TBD)
create policy "Service role can insert dead letters"
  on automation_dead_letters for insert
  with check (true);

create policy "Service role can read dead letters"
  on automation_dead_letters for select
  using (true);

create policy "Service role can update dead letters"
  on automation_dead_letters for update
  using (true);
