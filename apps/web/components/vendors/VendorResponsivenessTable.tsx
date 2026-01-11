/**
 * Vendor Responsiveness Table
 *
 * Shows how quickly vendors respond to transaction updates.
 */

interface Responsiveness {
  vendor_id: string;
  vendor_type: string;
  deals_participated: number;
  total_responses: number;
  avg_response_interval_days: number;
  median_response_interval_days: number;
  responsiveness_score: number;
}

interface Props {
  rows: Responsiveness[];
}

export function VendorResponsivenessTable({ rows }: Props) {
  if (!rows || rows.length === 0) {
    return (
      <section>
        <h2 className="font-semibold mb-3">Vendor Responsiveness</h2>
        <div className="text-center text-gray-500 py-8">
          No responsiveness data available
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="font-semibold mb-3">Vendor Responsiveness</h2>
      <p className="text-sm text-gray-500 mb-4">
        How quickly do vendors respond to transaction updates. Lower response
        interval = more responsive. Score ranges from 0-100.
      </p>

      <table className="w-full text-sm border rounded-lg overflow-hidden">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-3 text-left">Vendor</th>
            <th className="p-3 text-left">Type</th>
            <th className="p-3 text-left">Deals</th>
            <th className="p-3 text-left">Responses</th>
            <th className="p-3 text-left">Avg Interval</th>
            <th className="p-3 text-left">Median Interval</th>
            <th className="p-3 text-left">Score</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.vendor_id} className="border-t">
              <td className="p-3 font-medium">{r.vendor_id}</td>
              <td className="p-3">{r.vendor_type}</td>
              <td className="p-3">{r.deals_participated}</td>
              <td className="p-3">{r.total_responses}</td>
              <td className="p-3">{r.avg_response_interval_days} days</td>
              <td className="p-3">{r.median_response_interval_days} days</td>
              <td className="p-3">
                <span
                  className={`font-medium ${
                    r.responsiveness_score >= 80
                      ? 'text-green-600'
                      : r.responsiveness_score >= 60
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`}
                >
                  {r.responsiveness_score}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
