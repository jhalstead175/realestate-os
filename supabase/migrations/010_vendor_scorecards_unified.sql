/**
 * Unified Vendor Scorecards View
 *
 * Single view for all vendor types (lender, title, insurance).
 * Simpler than multiple views, easier to consume.
 */

create or replace view vendor_scorecards_view as
with vendor_transactions as (
  select
    fe.source_node as vendor_id,
    fn.node_type as vendor_type,
    fe.aggregate_id,
    fe.event_type,
    fe.received_at,
    e_close.created_at as closed_at,
    e_close.payload->>'expected_close_date' as expected_close_date,
    extract(epoch from (e_close.created_at - fe.received_at)) / 86400 as turnaround_days
  from federated_events fe
  join federated_nodes fn on fn.node_id = fe.source_node
  left join events e_close on e_close.aggregate_id = fe.aggregate_id
    and e_close.event_type = 'deal_closed'
),
vendor_delays as (
  select
    vendor_id,
    vendor_type,
    aggregate_id,
    avg(turnaround_days) filter (where turnaround_days > 0) as avg_delay_days,
    case
      when avg(turnaround_days) <= 0 then 1
      when expected_close_date is not null and closed_at <= expected_close_date::timestamptz then 1
      else 0
    end as on_time
  from vendor_transactions
  group by vendor_id, vendor_type, aggregate_id, expected_close_date, closed_at
),
vendor_issues as (
  select
    vendor_id,
    vendor_type,
    event_type,
    count(*) as issue_count,
    row_number() over (partition by vendor_id order by count(*) desc) as rn
  from vendor_transactions
  where event_type in (
    'lender_conditional_approval',
    'title_exception_found',
    'insurance_coverage_issue'
  )
  group by vendor_id, vendor_type, event_type
),
primary_blockers as (
  select
    vendor_id,
    case event_type
      when 'lender_conditional_approval' then 'Conditional Approval'
      when 'title_exception_found' then 'Title Exception'
      when 'insurance_coverage_issue' then 'Coverage Issue'
      else 'Other'
    end as primary_blocker
  from vendor_issues
  where rn = 1
)
select
  vd.vendor_id,
  vd.vendor_id as vendor_name,  -- Use vendor_id as name (can be joined with vendor directory later)
  vd.vendor_type,
  count(distinct vd.aggregate_id) as deal_count,
  coalesce(round(avg(vd.avg_delay_days), 1), 0) as avg_delay_days,
  coalesce(round(100.0 * sum(vd.on_time) / nullif(count(*), 0), 1), 0) as on_time_rate,
  coalesce(pb.primary_blocker, 'None') as primary_blocker
from vendor_delays vd
left join primary_blockers pb on pb.vendor_id = vd.vendor_id
group by vd.vendor_id, vd.vendor_type, pb.primary_blocker
order by avg_delay_days asc;

-- ==================== COMMENTS ====================

comment on view vendor_scorecards_view is
  'Unified vendor scorecards: performance metrics for lenders, title companies, and insurance providers. Derived from federated events.';
