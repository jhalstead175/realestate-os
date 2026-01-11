/**
 * Blocking Issues Panel
 *
 * Red = Stop Signs
 *
 * Rules:
 * - Only true blockers
 * - Sorted by time criticality
 * - One card per blocker
 *
 * No action buttons. No suggestions. Just truth.
 */

export interface BlockingIssue {
  id: string;
  title: string;
  source: string;
  reason: string;
  documentRef?: string;
  control: string; // Who can resolve this
  earliestResolution: string | null; // 'Unknown' or date
  discovered: string; // ISO timestamp
}

export function BlockingIssuesPanel({ issues }: { issues: BlockingIssue[] }) {
  if (issues.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-red-200 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
        <h2 className="text-lg font-semibold text-red-900">
          Blocking Issues ({issues.length})
        </h2>
      </div>

      <div className="space-y-4">
        {issues.map((issue) => (
          <div
            key={issue.id}
            className="border border-red-300 rounded-lg p-4 bg-red-50"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-red-900">{issue.title}</h3>
              <span className="text-xs px-2 py-1 bg-red-600 text-white rounded">
                BLOCKING
              </span>
            </div>

            {/* Source */}
            <div className="text-sm text-gray-700 mb-2">
              <span className="font-medium">Source:</span>{' '}
              <span className="font-mono text-xs">{issue.source}</span>
            </div>

            {/* Reason */}
            <div className="text-sm text-gray-900 mb-3 p-3 bg-white rounded border border-red-200">
              {issue.reason}
            </div>

            {/* Document Reference */}
            {issue.documentRef && (
              <div className="text-xs text-gray-600 mb-2">
                <span className="font-medium">Document:</span> {issue.documentRef}
              </div>
            )}

            {/* Control & Resolution */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-600">Control:</span>
                <p className="font-medium text-gray-900 mt-1">{issue.control}</p>
              </div>
              <div>
                <span className="text-gray-600">Earliest Resolution:</span>
                <p className="font-medium text-gray-900 mt-1">
                  {issue.earliestResolution || 'Unknown'}
                </p>
              </div>
            </div>

            {/* Discovery Time */}
            <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-red-200">
              Discovered: {new Date(issue.discovered).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
