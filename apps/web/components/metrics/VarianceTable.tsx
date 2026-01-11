/**
 * Time-to-Close Variance Table
 *
 * Shows expected vs actual days for each transaction stage.
 */

interface VarianceRow {
  stage: string;
  expected_days: number;
  actual_days: number;
  variance_days: number;
}

interface Props {
  rows: VarianceRow[];
}

export function VarianceTable({ rows }: Props) {
  if (!rows || rows.length === 0) {
    return (
      <section>
        <h2 className="font-semibold mb-3">Time-to-Close Variance</h2>
        <div className="text-center text-gray-500 py-8">
          No variance data available
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="font-semibold mb-3">Time-to-Close Variance</h2>
      <p className="text-sm text-gray-500 mb-4">
        Expected vs actual days for each transaction stage. Derived from event
        timestamps.
      </p>
      <table className="w-full text-sm border rounded-lg overflow-hidden">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-3 text-left">Stage</th>
            <th className="p-3 text-left">Expected (Days)</th>
            <th className="p-3 text-left">Actual (Days)</th>
            <th className="p-3 text-left">Variance</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.stage} className="border-t">
              <td className="p-3">{r.stage}</td>
              <td className="p-3">{r.expected_days}</td>
              <td className="p-3">{r.actual_days}</td>
              <td className="p-3">
                <span
                  className={
                    r.variance_days > 0 ? 'text-red-600' : 'text-green-600'
                  }
                >
                  {r.variance_days > 0 ? '+' : ''}
                  {r.variance_days}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
