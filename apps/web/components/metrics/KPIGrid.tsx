/**
 * KPI Grid
 *
 * Displays high-level governance metrics.
 */

interface KPIData {
  on_time_close_rate: number;
  avg_days_to_close: number;
  blocked_at_t7: number;
  automation_accept_rate: number;
}

interface Props {
  kpis: KPIData | null;
}

export function KPIGrid({ kpis }: Props) {
  if (!kpis) {
    return (
      <section className="grid grid-cols-4 gap-4">
        <div className="border rounded-lg p-4 text-center text-gray-500">
          No metrics data available
        </div>
      </section>
    );
  }

  const items = [
    {
      label: 'On-Time Close Rate',
      value: `${kpis.on_time_close_rate}%`,
      description: 'Deals closed by expected date',
    },
    {
      label: 'Average Time to Close',
      value: `${kpis.avg_days_to_close} days`,
      description: 'From contract to close',
    },
    {
      label: 'Deals Blocked at T-7',
      value: kpis.blocked_at_t7,
      description: 'Blocked within 7 days of close',
    },
    {
      label: 'Automation Acceptance Rate',
      value: `${kpis.automation_accept_rate}%`,
      description: 'Proposals approved by humans',
    },
  ];

  return (
    <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {items.map((i) => (
        <div key={i.label} className="border rounded-lg p-4">
          <div className="text-sm text-gray-500">{i.label}</div>
          <div className="text-3xl font-semibold mt-2">{i.value}</div>
          <div className="text-xs text-gray-400 mt-1">{i.description}</div>
        </div>
      ))}
    </section>
  );
}
