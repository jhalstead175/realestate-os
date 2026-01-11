/**
 * Sync Log Table
 *
 * Shows recent CRM/MLS sync operations.
 */

interface SyncLogRow {
  id: string;
  source: 'crm' | 'mls';
  system_name: string;
  sync_started_at: string;
  sync_completed_at: string | null;
  records_fetched: number;
  records_created: number;
  records_updated: number;
  errors: number;
  status: 'running' | 'completed' | 'failed';
}

interface Props {
  rows: SyncLogRow[];
}

export function SyncLogTable({ rows }: Props) {
  if (!rows || rows.length === 0) {
    return (
      <section>
        <h2 className="font-semibold mb-3">Sync Log</h2>
        <div className="text-center text-gray-500 py-8">
          No sync operations recorded yet.
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="font-semibold mb-3">Recent Sync Operations</h2>
      <p className="text-sm text-gray-500 mb-4">
        Audit log of CRM/MLS sync operations. Tracks what was synced and when.
      </p>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Source</th>
              <th className="p-3 text-left">Started</th>
              <th className="p-3 text-left">Completed</th>
              <th className="p-3 text-left">Fetched</th>
              <th className="p-3 text-left">Created</th>
              <th className="p-3 text-left">Updated</th>
              <th className="p-3 text-left">Errors</th>
              <th className="p-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
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
                <td className="p-3 text-xs text-gray-600">
                  {new Date(r.sync_started_at).toLocaleString()}
                </td>
                <td className="p-3 text-xs text-gray-600">
                  {r.sync_completed_at
                    ? new Date(r.sync_completed_at).toLocaleString()
                    : '—'}
                </td>
                <td className="p-3">{r.records_fetched}</td>
                <td className="p-3">{r.records_created}</td>
                <td className="p-3">{r.records_updated}</td>
                <td className="p-3">
                  {r.errors > 0 ? (
                    <span className="text-red-600 font-medium">{r.errors}</span>
                  ) : (
                    <span className="text-gray-400">0</span>
                  )}
                </td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      r.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : r.status === 'failed'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {r.status.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
