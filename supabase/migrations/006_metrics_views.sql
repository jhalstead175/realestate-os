/**
 * Executive Metrics Views
 *
 * Read-only analytical projections for governance metrics.
 * All derived from events — no stored state.
 *
 * Refreshed periodically or on-demand.
 */

-- ==================== KPI AGGREGATES ====================

create or replace view metrics_kpi_view as
with closed_deals as (
  select
    aggregate_id,
    min(created_at) filter (where event_type = 'deal_created') as created_at,
    max(created_at) filter (where event_type = 'deal_closed') as closed_at,
    max(payload->>'expected_close_date') as expected_close_date
  from events
  where event_type in ('deal_created', 'deal_closed')
  group by aggregate_id
  having count(*) filter (where event_type = 'deal_closed') > 0
),
time_to_close as (
  select
    aggregate_id,
    extract(epoch from (closed_at - created_at)) / 86400 as days_to_close,
    case
      when closed_at <= expected_close_date::timestamptz then 1
      else 0
    end as on_time
  from closed_deals
  where expected_close_date is not null
),
automation_proposals as (
  select
    count(*) as total_proposals,
    count(*) filter (where payload->>'status' = 'approved') as accepted_proposals
  from events
  where event_type = 'automation_proposal_created'
),
blocked_at_t7 as (
  select count(distinct aggregate_id) as blocked_count
  from events e
  where event_type = 'closing_readiness_determined'
    and payload->>'readiness' = 'blocked'
    and exists (
      select 1 from events e2
      where e2.aggregate_id = e.aggregate_id
        and e2.event_type = 'deal_closed'
        and extract(epoch from (e2.created_at - e.created_at)) / 86400 <= 7
    )
)
select
  coalesce(round(100.0 * sum(on_time) / nullif(count(*), 0), 1), 0) as on_time_close_rate,
  coalesce(round(avg(days_to_close), 1), 0) as avg_days_to_close,
  (select blocked_count from blocked_at_t7) as blocked_at_t7,
  coalesce(
    round(100.0 * (select accepted_proposals from automation_proposals) /
      nullif((select total_proposals from automation_proposals), 0), 1
    ), 0
  ) as automation_accept_rate
from time_to_close;

-- ==================== TIME VARIANCE BY STAGE ====================

create or replace view metrics_time_variance_view as
with stage_transitions as (
  select
    aggregate_id,
    event_type,
    created_at,
    lead(created_at) over (partition by aggregate_id order by created_at) as next_event_at
  from events
  where event_type in ('deal_created', 'under_contract', 'appraisal_ordered', 'financing_approved', 'deal_closed')
),
stage_durations as (
  select
    case event_type
      when 'deal_created' then 'Prospect → Contract'
      when 'under_contract' then 'Contract → Appraisal'
      when 'appraisal_ordered' then 'Appraisal → Financing'
      when 'financing_approved' then 'Financing → Close'
    end as stage,
    extract(epoch from (next_event_at - created_at)) / 86400 as days
  from stage_transitions
  where next_event_at is not null
),
expected_durations as (
  values
    ('Prospect → Contract', 14),
    ('Contract → Appraisal', 7),
    ('Appraisal → Financing', 21),
    ('Financing → Close', 14)
)
select
  e.column1 as stage,
  e.column2 as expected_days,
  coalesce(round(avg(d.days), 1), 0) as actual_days,
  coalesce(round(avg(d.days) - e.column2, 1), 0) as variance_days
from expected_durations e
left join stage_durations d on d.stage = e.column1
group by e.column1, e.column2
order by e.column2;

-- ==================== BOTTLENECKS FROM FEDERATED SOURCES ====================

create or replace view metrics_bottlenecks_view as
with federated_blockers as (
  select
    fe.source_node,
    fe.event_type,
    fe.aggregate_id,
    fe.received_at,
    e_close.created_at as closed_at
  from federated_events fe
  join events e_close on e_close.aggregate_id = fe.aggregate_id
    and e_close.event_type = 'deal_closed'
  where fe.event_type in (
    'lender_conditional_approval',
    'title_exception_found',
    'insurance_coverage_issue'
  )
),
blocker_delays as (
  select
    source_node,
    event_type,
    extract(epoch from (closed_at - received_at)) / 86400 as delay_days
  from federated_blockers
  where closed_at > received_at
)
select
  source_node as source,
  case event_type
    when 'lender_conditional_approval' then 'Conditional Approval'
    when 'title_exception_found' then 'Title Exception'
    when 'insurance_coverage_issue' then 'Coverage Issue'
  end as blocker_type,
  round(avg(delay_days), 1) as avg_delay_days,
  count(*) as frequency
from blocker_delays
group by source_node, event_type
order by avg_delay_days desc;

-- ==================== COMMENTS ====================

comment on view metrics_kpi_view is
  'Aggregate KPIs: on-time close rate, avg days to close, deals blocked at T-7, automation acceptance rate. Derived from events.';

comment on view metrics_time_variance_view is
  'Stage-by-stage time variance: expected vs actual days for each transaction phase.';

comment on view metrics_bottlenecks_view is
  'Federated source bottlenecks: which lenders/title/insurance providers cause the most delays.';
