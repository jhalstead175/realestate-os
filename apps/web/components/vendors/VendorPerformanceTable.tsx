/**
 * Vendor Performance Table
 *
 * Overall vendor performance: success rates, turnaround times.
 */

interface VendorPerformance {
  vendor_id: string;
  vendor_type: string;
  total_deals: number;
  approvals_granted: number;
  conditional_approvals: number;
  title_clears: number;
  title_exceptions: number;
  policies_issued: number;
  coverage_issues: number;
  avg_turnaround_days: number;
  median_turnaround_days: number;
  success_rate: number;
}

interface Props {
  rows: VendorPerformance[];
}

export function VendorPerformanceTable({ rows }: Props) {
  if (!rows || rows.length === 0) {
    return (
      <section>
        <h2 className="font-semibold mb-3">Vendor Performance</h2>
        <div className="text-center text-gray-500 py-8">
          No vendor performance data available
        </div>
      </section>
    );
  }

  // Group by vendor type
  const lenders = rows.filter((r) => r.vendor_type === 'lender');
  const titleCompanies = rows.filter((r) => r.vendor_type === 'title');
  const insuranceProviders = rows.filter((r) => r.vendor_type === 'insurance');

  return (
    <section>
      <h2 className="font-semibold mb-3">Vendor Performance</h2>
      <p className="text-sm text-gray-500 mb-4">
        Success rates and turnaround times by vendor type. Higher success rate
        and lower turnaround time = better performance.
      </p>

      {/* Lenders */}
      {lenders.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Lenders</h3>
          <VendorTable rows={lenders} type="lender" />
        </div>
      )}

      {/* Title Companies */}
      {titleCompanies.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Title Companies
          </h3>
          <VendorTable rows={titleCompanies} type="title" />
        </div>
      )}

      {/* Insurance Providers */}
      {insuranceProviders.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Insurance Providers
          </h3>
          <VendorTable rows={insuranceProviders} type="insurance" />
        </div>
      )}
    </section>
  );
}

function VendorTable({
  rows,
  type,
}: {
  rows: VendorPerformance[];
  type: string;
}) {
  return (
    <table className="w-full text-sm border rounded-lg overflow-hidden">
      <thead className="bg-gray-50">
        <tr>
          <th className="p-3 text-left">Vendor</th>
          <th className="p-3 text-left">Total Deals</th>
          {type === 'lender' && (
            <>
              <th className="p-3 text-left">Approvals</th>
              <th className="p-3 text-left">Conditional</th>
            </>
          )}
          {type === 'title' && (
            <>
              <th className="p-3 text-left">Clears</th>
              <th className="p-3 text-left">Exceptions</th>
            </>
          )}
          {type === 'insurance' && (
            <>
              <th className="p-3 text-left">Policies</th>
              <th className="p-3 text-left">Issues</th>
            </>
          )}
          <th className="p-3 text-left">Success Rate</th>
          <th className="p-3 text-left">Avg Turnaround</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.vendor_id} className="border-t">
            <td className="p-3 font-medium">{r.vendor_id}</td>
            <td className="p-3">{r.total_deals}</td>
            {type === 'lender' && (
              <>
                <td className="p-3">{r.approvals_granted}</td>
                <td className="p-3">{r.conditional_approvals}</td>
              </>
            )}
            {type === 'title' && (
              <>
                <td className="p-3">{r.title_clears}</td>
                <td className="p-3">{r.title_exceptions}</td>
              </>
            )}
            {type === 'insurance' && (
              <>
                <td className="p-3">{r.policies_issued}</td>
                <td className="p-3">{r.coverage_issues}</td>
              </>
            )}
            <td className="p-3">
              <span
                className={`font-medium ${
                  r.success_rate >= 80
                    ? 'text-green-600'
                    : r.success_rate >= 60
                    ? 'text-yellow-600'
                    : 'text-red-600'
                }`}
              >
                {r.success_rate}%
              </span>
            </td>
            <td className="p-3">
              {r.avg_turnaround_days} days
              <span className="text-xs text-gray-400 ml-1">
                (median: {r.median_turnaround_days})
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
