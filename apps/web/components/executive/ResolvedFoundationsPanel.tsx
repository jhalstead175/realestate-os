/**
 * Resolved Foundations Panel
 *
 * Green = Confidence
 *
 * Shows:
 * - What's done
 * - Who confirmed it
 * - When it was confirmed
 * - Source of truth
 *
 * This builds trust.
 */

export interface ResolvedItem {
  id: string;
  title: string;
  details?: Record<string, string>; // Key-value pairs (e.g., "Policy": "HO-123456")
  source: string;
  verifiedAt: string; // ISO timestamp
  verifiedBy?: string;
}

export function ResolvedFoundationsPanel({ items }: { items: ResolvedItem[] }) {
  if (items.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
          <h2 className="text-lg font-semibold text-gray-700">
            Resolved Foundations
          </h2>
        </div>
        <p className="text-sm text-gray-500">
          No foundations resolved yet
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-green-200 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        <h2 className="text-lg font-semibold text-green-900">
          Resolved Foundations ({items.length})
        </h2>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="border border-green-300 rounded-lg p-4 bg-green-50"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-green-600 text-xl">✓</span>
                <h3 className="font-semibold text-green-900">{item.title}</h3>
              </div>
            </div>

            {/* Details */}
            {item.details && Object.keys(item.details).length > 0 && (
              <div className="mb-3 space-y-1">
                {Object.entries(item.details).map(([key, value]) => (
                  <div key={key} className="text-sm">
                    <span className="text-gray-600">{key}:</span>{' '}
                    <span className="font-medium text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Source */}
            <div className="text-xs text-gray-600 mb-1">
              Source: <span className="font-mono">{item.source}</span>
            </div>

            {/* Verified */}
            <div className="text-xs text-gray-600">
              Verified: {new Date(item.verifiedAt).toLocaleString()}
              {item.verifiedBy && ` by ${item.verifiedBy}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
