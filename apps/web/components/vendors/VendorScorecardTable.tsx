/**
 * Vendor Scorecard Table
 *
 * Unified table for all vendor types (lender, title, insurance).
 */

interface VendorScorecard {
  vendor_id: string;
  vendor_name: string;
  vendor_type: 'lender' | 'title' | 'insurance';
  deal_count: number;
  avg_delay_days: number;
  on_time_rate: number;
  primary_blocker: string;
}

interface Props {
  rows: VendorScorecard[];
}

export function VendorScorecardTable({ rows }: Props) {
  if (!rows || rows.length === 0) {
    return <div className="text-gray-500">No vendor data available.</div>;
  }

  return (
    <section className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-3 text-left">Vendor</th>
            <th className="p-3 text-left">Type</th>
            <th className="p-3 text-left">Deals Involved</th>
            <th className="p-3 text-left">Avg Delay (Days)</th>
            <th className="p-3 text-left">On-Time Rate</th>
            <th className="p-3 text-left">Primary Issue</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((v) => (
            <tr key={v.vendor_id} className="border-t hover:bg-gray-50">
              <td className="p-3 font-medium">{v.vendor_name}</td>
              <td className="p-3">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    v.vendor_type === 'lender'
                      ? 'bg-blue-100 text-blue-700'
                      : v.vendor_type === 'title'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-purple-100 text-purple-700'
                  }`}
                >
                  {v.vendor_type.toUpperCase()}
                </span>
              </td>
              <td className="p-3">{v.deal_count}</td>
              <td className="p-3">
                <span
                  className={`font-medium ${
                    v.avg_delay_days === 0
                      ? 'text-green-600'
                      : v.avg_delay_days <= 3
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`}
                >
                  {v.avg_delay_days}
                </span>
              </td>
              <td className="p-3">
                <span
                  className={`font-medium ${
                    v.on_time_rate >= 80
                      ? 'text-green-600'
                      : v.on_time_rate >= 60
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`}
                >
                  {v.on_time_rate}%
                </span>
              </td>
              <td className="p-3 text-gray-600">{v.primary_blocker}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
