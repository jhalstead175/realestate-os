/**
 * Vendor Delay Patterns Table
 *
 * Shows which vendors cause delays and for which event types.
 */

interface DelayPattern {
  vendor_id: string;
  vendor_type: string;
  event_label: string;
  frequency: number;
  avg_delay_days: number;
  p90_delay_days: number;
}

interface Props {
  rows: DelayPattern[];
}

export function VendorDelayPatternsTable({ rows }: Props) {
  if (!rows || rows.length === 0) {
    return (
      <section>
        <h2 className="font-semibold mb-3">Delay Patterns</h2>
        <div className="text-center text-gray-500 py-8">
          No delay pattern data available
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="font-semibold mb-3">Delay Patterns by Vendor</h2>
      <p className="text-sm text-gray-500 mb-4">
        Shows which vendors cause delays and for which event types. P90 =
        90th percentile (worst-case delays).
      </p>

      <table className="w-full text-sm border rounded-lg overflow-hidden">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-3 text-left">Vendor</th>
            <th className="p-3 text-left">Type</th>
            <th className="p-3 text-left">Event</th>
            <th className="p-3 text-left">Frequency</th>
            <th className="p-3 text-left">Avg Delay</th>
            <th className="p-3 text-left">P90 Delay</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={idx} className="border-t">
              <td className="p-3 font-medium">{r.vendor_id}</td>
              <td className="p-3">{r.vendor_type}</td>
              <td className="p-3">{r.event_label}</td>
              <td className="p-3">{r.frequency}</td>
              <td className="p-3">
                <span className="text-red-600 font-medium">
                  {r.avg_delay_days} days
                </span>
              </td>
              <td className="p-3">
                <span className="text-red-700 font-medium">
                  {r.p90_delay_days} days
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
