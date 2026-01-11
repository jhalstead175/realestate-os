/**
 * Vendor Scorecards
 *
 * Performance tracking for federated sources:
 * - Lender performance
 * - Title delay patterns
 * - Insurance responsiveness
 *
 * Derived from federated events and transaction outcomes.
 * Read-only analytics, zero stored state.
 */

-- ==================== VENDOR PERFORMANCE VIEW ====================

create or replace view vendor_performance_view as
with vendor_events as (
  select
    fe.source_node,
    fn.node_type,
    fe.aggregate_id,
    fe.event_type,
    fe.received_at,
    e_close.created_at as closed_at,
    extract(epoch from (e_close.created_at - fe.received_at)) / 86400 as turnaround_days
  from federated_events fe
  join federated_nodes fn on fn.node_id = fe.source_node
  left join events e_close on e_close.aggregate_id = fe.aggregate_id
    and e_close.event_type = 'deal_closed'
),
vendor_stats as (
  select
    source_node,
    node_type,
    count(distinct aggregate_id) as total_deals,
    count(*) filter (where event_type = 'lender_approval_granted') as approvals_granted,
    count(*) filter (where event_type = 'lender_conditional_approval') as conditional_approvals,
    count(*) filter (where event_type = 'title_clear') as title_clears,
    count(*) filter (where event_type = 'title_exception_found') as title_exceptions,
    count(*) filter (where event_type = 'insurance_policy_issued') as policies_issued,
    count(*) filter (where event_type = 'insurance_coverage_issue') as coverage_issues,
    round(avg(turnaround_days) filter (where turnaround_days is not null), 1) as avg_turnaround_days,
    round(
      percentile_cont(0.5) within group (order by turnaround_days)
      filter (where turnaround_days is not null), 1
    ) as median_turnaround_days
  from vendor_events
  group by source_node, node_type
)
select
  source_node as vendor_id,
  node_type as vendor_type,
  total_deals,
  approvals_granted,
  conditional_approvals,
  title_clears,
  title_exceptions,
  policies_issued,
  coverage_issues,
  avg_turnaround_days,
  median_turnaround_days,
  -- Derived scores
  case
    when node_type = 'lender' then
      round(100.0 * approvals_granted / nullif(approvals_granted + conditional_approvals, 0), 1)
    when node_type = 'title' then
      round(100.0 * title_clears / nullif(title_clears + title_exceptions, 0), 1)
    when node_type = 'insurance' then
      round(100.0 * policies_issued / nullif(policies_issued + coverage_issues, 0), 1)
    else null
  end as success_rate
from vendor_stats
order by node_type, avg_turnaround_days;

-- ==================== VENDOR DELAY PATTERNS ====================

create or replace view vendor_delay_patterns_view as
with delay_events as (
  select
    fe.source_node,
    fn.node_type,
    fe.event_type,
    fe.aggregate_id,
    fe.received_at,
    e_prev.created_at as previous_event_at,
    extract(epoch from (fe.received_at - e_prev.created_at)) / 86400 as delay_days
  from federated_events fe
  join federated_nodes fn on fn.node_id = fe.source_node
  left join lateral (
    select created_at
    from events
    where aggregate_id = fe.aggregate_id
      and created_at < fe.received_at
    order by created_at desc
    limit 1
  ) e_prev on true
),
delay_stats as (
  select
    source_node,
    node_type,
    event_type,
    count(*) as frequency,
    round(avg(delay_days) filter (where delay_days > 0), 1) as avg_delay_days,
    round(
      percentile_cont(0.9) within group (order by delay_days)
      filter (where delay_days > 0), 1
    ) as p90_delay_days
  from delay_events
  where delay_days > 0
  group by source_node, node_type, event_type
  having count(*) >= 3  -- Only show patterns with at least 3 occurrences
)
select
  source_node as vendor_id,
  node_type as vendor_type,
  case event_type
    when 'lender_conditional_approval' then 'Conditional Approval'
    when 'lender_approval_granted' then 'Approval Granted'
    when 'title_exception_found' then 'Title Exception'
    when 'title_clear' then 'Title Clear'
    when 'insurance_coverage_issue' then 'Coverage Issue'
    when 'insurance_policy_issued' then 'Policy Issued'
    else event_type
  end as event_label,
  frequency,
  avg_delay_days,
  p90_delay_days
from delay_stats
order by vendor_type, avg_delay_days desc;

-- ==================== VENDOR RESPONSIVENESS ====================

create or replace view vendor_responsiveness_view as
with response_times as (
  select
    fe.source_node,
    fn.node_type,
    fe.aggregate_id,
    fe.event_type,
    fe.received_at,
    lag(fe.received_at) over (partition by fe.source_node, fe.aggregate_id order by fe.received_at) as prev_response_at,
    extract(epoch from (fe.received_at - lag(fe.received_at) over (partition by fe.source_node, fe.aggregate_id order by fe.received_at))) / 86400 as days_since_last_response
  from federated_events fe
  join federated_nodes fn on fn.node_id = fe.source_node
),
responsiveness_stats as (
  select
    source_node,
    node_type,
    count(distinct aggregate_id) as deals_participated,
    count(*) as total_responses,
    round(avg(days_since_last_response) filter (where days_since_last_response is not null), 1) as avg_response_interval_days,
    round(
      percentile_cont(0.5) within group (order by days_since_last_response)
      filter (where days_since_last_response is not null), 1
    ) as median_response_interval_days
  from response_times
  group by source_node, node_type
)
select
  source_node as vendor_id,
  node_type as vendor_type,
  deals_participated,
  total_responses,
  avg_response_interval_days,
  median_response_interval_days,
  -- Responsiveness score (inverse of response time, normalized to 0-100)
  case
    when avg_response_interval_days <= 1 then 100
    when avg_response_interval_days <= 3 then 80
    when avg_response_interval_days <= 7 then 60
    when avg_response_interval_days <= 14 then 40
    else 20
  end as responsiveness_score
from responsiveness_stats
order by responsiveness_score desc, vendor_type;

-- ==================== COMMENTS ====================

comment on view vendor_performance_view is
  'Aggregate vendor performance: success rates, turnaround times, derived from federated events.';

comment on view vendor_delay_patterns_view is
  'Delay patterns by vendor and event type. Shows which vendors cause the most delays and why.';

comment on view vendor_responsiveness_view is
  'Vendor responsiveness: how quickly do vendors respond to transaction updates.';
