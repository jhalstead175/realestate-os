/**
 * Reconciliation Table
 *
 * Shows external listings and their reconciliation status with internal deals.
 */

interface ReconciliationRow {
  source: 'crm' | 'mls';
  system_name: string;
  external_id: string;
  external_address: string;
  external_agent: string;
  reconciliation_status: 'matched' | 'unmatched' | 'conflict' | 'ignored';
  synced_at: string;
  internal_deal_id: string | null;
  internal_address: string | null;
  internal_agent: string | null;
  internal_created_at: string | null;
}

interface Props {
  rows: ReconciliationRow[];
}

export function ReconciliationTable({ rows }: Props) {
  if (!rows || rows.length === 0) {
    return (
      <section>
        <h2 className="font-semibold mb-3">Listing Reconciliation</h2>
        <div className="text-center text-gray-500 py-8">
          No external listings synced yet.
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="font-semibold mb-3">Listing Reconciliation</h2>
      <p className="text-sm text-gray-500 mb-4">
        External listings from CRM/MLS systems and their reconciliation status
        with internal deals.
      </p>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Source</th>
              <th className="p-3 text-left">External ID</th>
              <th className="p-3 text-left">External Address</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Internal Deal</th>
              <th className="p-3 text-left">Internal Address</th>
              <th className="p-3 text-left">Synced At</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={idx} className="border-t hover:bg-gray-50">
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      r.source === 'crm'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}
                  >
                    {r.source.toUpperCase()}
                  </span>
                  <div className="text-xs text-gray-400 mt-1">
                    {r.system_name}
                  </div>
                </td>
                <td className="p-3 text-gray-600">{r.external_id}</td>
                <td className="p-3 text-gray-900">{r.external_address}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      r.reconciliation_status === 'matched'
                        ? 'bg-green-100 text-green-700'
                        : r.reconciliation_status === 'conflict'
                        ? 'bg-red-100 text-red-700'
                        : r.reconciliation_status === 'ignored'
                        ? 'bg-gray-100 text-gray-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {r.reconciliation_status.toUpperCase()}
                  </span>
                </td>
                <td className="p-3">
                  {r.internal_deal_id ? (
                    <a
                      href={`/transactions/${r.internal_deal_id}/executive`}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      {r.internal_deal_id.substring(0, 8)}...
                    </a>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="p-3 text-gray-600">
                  {r.internal_address || '—'}
                </td>
                <td className="p-3 text-xs text-gray-400">
                  {new Date(r.synced_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
