/**
 * Bottleneck Table
 *
 * Shows which federated sources (lender/title/insurance) cause the most delays.
 */

interface BottleneckRow {
  source: string;
  blocker_type: string;
  avg_delay_days: number;
  frequency: number;
}

interface Props {
  rows: BottleneckRow[];
}

export function BottleneckTable({ rows }: Props) {
  if (!rows || rows.length === 0) {
    return (
      <section>
        <h2 className="font-semibold mb-3">
          Lender / Title / Insurance Bottlenecks
        </h2>
        <div className="text-center text-gray-500 py-8">
          No bottleneck data available
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="font-semibold mb-3">
        Lender / Title / Insurance Bottlenecks
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Federated sources ranked by average delay to close. Helps identify
        problematic providers.
      </p>
      <table className="w-full text-sm border rounded-lg overflow-hidden">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-3 text-left">Source</th>
            <th className="p-3 text-left">Blocker Type</th>
            <th className="p-3 text-left">Avg Delay (Days)</th>
            <th className="p-3 text-left">Frequency</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={idx} className="border-t">
              <td className="p-3">{r.source}</td>
              <td className="p-3">{r.blocker_type}</td>
              <td className="p-3">
                <span className="text-red-600 font-medium">
                  {r.avg_delay_days}
                </span>
              </td>
              <td className="p-3">{r.frequency}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
