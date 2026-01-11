/**
 * Notification Log
 *
 * Event-driven messaging layer.
 * All notifications are logged, auditable, and triggered by events.
 *
 * No state mutation — notifications are append-only records.
 */

-- ==================== NOTIFICATION LOG ====================

create table notification_log (
  id uuid primary key default gen_random_uuid(),

  -- What triggered this notification
  triggering_event_id uuid not null references events(id),
  aggregate_id uuid not null,

  -- Recipient
  recipient_type text not null check (recipient_type in ('agent', 'client', 'broker', 'ops')),
  recipient_id text not null,
  recipient_email text,
  recipient_phone text,

  -- Notification content
  channel text not null check (channel in ('email', 'sms', 'in_app')),
  template text not null,
  subject text,
  body text not null,

  -- Delivery tracking
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'bounced')),
  sent_at timestamptz,
  failed_reason text,

  -- Metadata
  created_at timestamptz default now(),
  metadata jsonb default '{}'::jsonb
);

-- Indexes for querying
create index idx_notification_log_event on notification_log(triggering_event_id);
create index idx_notification_log_aggregate on notification_log(aggregate_id);
create index idx_notification_log_recipient on notification_log(recipient_id);
create index idx_notification_log_status on notification_log(status);
create index idx_notification_log_created on notification_log(created_at desc);

-- ==================== NOTIFICATION TEMPLATES ====================

create table notification_templates (
  template_name text primary key,
  channel text not null check (channel in ('email', 'sms', 'in_app')),
  subject_template text,
  body_template text not null,
  enabled boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Seed default templates
insert into notification_templates (template_name, channel, subject_template, body_template) values
  (
    'deal_blocked',
    'email',
    'Transaction Blocked: {{property_address}}',
    'Your transaction at {{property_address}} has been blocked. Reason: {{blocking_reason}}. Please review in RealEstate-OS.'
  ),
  (
    'deal_ready_to_close',
    'email',
    'Ready to Close: {{property_address}}',
    'Great news! Your transaction at {{property_address}} is now ready to close. All requirements have been satisfied.'
  ),
  (
    'automation_proposal',
    'email',
    'Action Required: Automation Proposal',
    'An automation has proposed an action for {{property_address}}. Please review and approve or reject in RealEstate-OS.'
  ),
  (
    'federated_assertion_received',
    'email',
    'Update from {{source_type}}',
    'A new assertion has been received from {{source_name}} for {{property_address}}. Status: {{assertion_status}}.'
  ),
  (
    'closing_in_7_days',
    'sms',
    null,
    'Reminder: {{property_address}} closes in 7 days. Status: {{closing_readiness}}. Review in RealEstate-OS.'
  );

-- ==================== COMMENTS ====================

comment on table notification_log is
  'Append-only log of all notifications sent. Event-driven, auditable, zero state mutation.';

comment on table notification_templates is
  'Notification templates with variable substitution. Templates are applied at send time.';
