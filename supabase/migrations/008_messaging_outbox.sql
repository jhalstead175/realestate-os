/**
 * Messaging Outbox
 *
 * Event-driven notifications with zero state mutation.
 * Fully auditable, retryable, governance-safe.
 */

-- ==================== MESSAGING OUTBOX ====================

create table messaging_outbox (
  id uuid primary key default gen_random_uuid(),

  -- Transaction and event linkage
  deal_id uuid not null,
  trigger_event_id uuid not null references events(id),

  -- Delivery
  channel text not null check (channel in ('email', 'sms')),
  template_id text not null,
  rendered_body text not null,
  recipients text[] not null,

  -- Status tracking
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  sent_at timestamptz,
  provider_message_id text,

  -- Metadata
  created_at timestamptz default now(),
  metadata jsonb default '{}'::jsonb
);

-- Indexes
create index idx_messaging_outbox_deal on messaging_outbox(deal_id);
create index idx_messaging_outbox_event on messaging_outbox(trigger_event_id);
create index idx_messaging_outbox_status on messaging_outbox(status);
create index idx_messaging_outbox_created on messaging_outbox(created_at desc);

-- ==================== MESSAGE TEMPLATES ====================

create table message_templates (
  template_id text primary key,
  channel text not null check (channel in ('email', 'sms')),
  subject_template text,
  body_template text not null,
  enabled boolean default true,
  created_at timestamptz default now()
);

-- Seed templates
insert into message_templates (template_id, channel, subject_template, body_template) values
  (
    'deal_blocked',
    'email',
    'Transaction Blocked: {{property_address}}',
    E'Your transaction at {{property_address}} has been blocked.\n\nReason: {{blocking_reason}}\n\nPlease review in RealEstate-OS: {{deal_url}}'
  ),
  (
    'deal_ready_to_close',
    'email',
    'Ready to Close: {{property_address}}',
    E'Great news! Your transaction at {{property_address}} is now ready to close.\n\nAll requirements have been satisfied.\n\nView details: {{deal_url}}'
  ),
  (
    'automation_proposal',
    'email',
    'Action Required: Automation Proposal',
    E'An automation has proposed an action for {{property_address}}.\n\nProposed Action: {{proposed_action}}\n\nPlease review and approve or reject in RealEstate-OS: {{deal_url}}'
  ),
  (
    'federated_assertion_received',
    'email',
    'Update from {{source_type}}',
    E'A new assertion has been received from {{source_name}} for {{property_address}}.\n\nStatus: {{assertion_status}}\n\nView details: {{deal_url}}'
  ),
  (
    'closing_in_7_days',
    'sms',
    null,
    'Reminder: {{property_address}} closes in 7 days. Status: {{closing_readiness}}. Review in RealEstate-OS.'
  );

-- ==================== COMMENTS ====================

comment on table messaging_outbox is
  'Append-only message queue. Event-driven, auditable, zero state mutation. Delivery worker processes pending messages.';

comment on table message_templates is
  'Message templates with variable substitution (Mustache-style). Rendered at send time with decision context.';
