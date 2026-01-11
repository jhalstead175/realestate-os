/**
 * Federated Authority Panel
 *
 * Power Move - Shows each external authority as a peer, not a subordinate.
 *
 * Executives instantly see:
 * - Who is holding things up
 * - Whether the system is "waiting on someone else"
 *
 * No blame. Just facts.
 */

export interface FederatedAuthority {
  nodeId: string;
  nodeType: 'lender' | 'title' | 'insurance';
  displayName: string;
  status: 'ready' | 'pending' | 'blocked' | 'unknown';
  statusReason?: string;
  lastUpdate: string; // ISO timestamp
}

export function FederatedAuthorityPanel({
  authorities,
}: {
  authorities: FederatedAuthority[];
}) {
  function getStatusColor(status: FederatedAuthority['status']): string {
    switch (status) {
      case 'ready':
        return 'text-green-600 bg-green-50';
      case 'blocked':
        return 'text-red-600 bg-red-50';
      case 'pending':
        return 'text-amber-600 bg-amber-50';
      case 'unknown':
        return 'text-gray-600 bg-gray-50';
    }
  }

  function getStatusLabel(status: FederatedAuthority['status']): string {
    switch (status) {
      case 'ready':
        return 'Ready';
      case 'blocked':
        return 'Blocking';
      case 'pending':
        return 'Pending';
      case 'unknown':
        return 'Unknown';
    }
  }

  function getNodeTypeIcon(nodeType: FederatedAuthority['nodeType']): string {
    switch (nodeType) {
      case 'lender':
        return '🏦';
      case 'title':
        return '📋';
      case 'insurance':
        return '🛡️';
    }
  }

  if (authorities.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4">Federated Authorities</h2>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-3 font-semibold text-gray-700">
                Node
              </th>
              <th className="text-left py-2 px-3 font-semibold text-gray-700">
                Status
              </th>
              <th className="text-left py-2 px-3 font-semibold text-gray-700">
                Last Update
              </th>
            </tr>
          </thead>
          <tbody>
            {authorities.map((authority) => {
              const timeSinceUpdate = getTimeSinceUpdate(authority.lastUpdate);

              return (
                <tr key={authority.nodeId} className="border-b border-gray-100">
                  {/* Node */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">
                        {getNodeTypeIcon(authority.nodeType)}
                      </span>
                      <div>
                        <div className="font-medium text-gray-900">
                          {authority.displayName}
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {authority.nodeType}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-3">
                    <div>
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                          authority.status
                        )}`}
                      >
                        {getStatusLabel(authority.status)}
                      </span>
                      {authority.statusReason && (
                        <p className="text-xs text-gray-600 mt-1">
                          {authority.statusReason}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Last Update */}
                  <td className="py-3 px-3 text-gray-600">
                    {timeSinceUpdate}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Get human-readable time since update
 */
function getTimeSinceUpdate(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();

  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}
