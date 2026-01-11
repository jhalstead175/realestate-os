/**
 * At-Risk Panel
 *
 * Amber = Watch Closely
 *
 * Examples:
 * - Insurance effective date is after closing
 * - Lender conditions satisfied but documents expiring
 * - HOA docs received but not acknowledged
 *
 * These do not block closing yet — but will.
 * Executives love this panel.
 */

export interface AtRiskItem {
  id: string;
  title: string;
  description: string;
  riskLevel: 'medium' | 'high';
  willBlockBy?: string; // ISO date when this becomes blocking
  source: string;
}

export function AtRiskPanel({ items }: { items: AtRiskItem[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-amber-200 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
        <h2 className="text-lg font-semibold text-amber-900">
          At-Risk Dependencies ({items.length})
        </h2>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="border border-amber-300 rounded-lg p-4 bg-amber-50"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-amber-900">{item.title}</h3>
              <span
                className={`text-xs px-2 py-1 rounded ${
                  item.riskLevel === 'high'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-400 text-amber-900'
                }`}
              >
                {item.riskLevel === 'high' ? 'HIGH RISK' : 'MEDIUM RISK'}
              </span>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-900 mb-3">{item.description}</p>

            {/* Will Block By */}
            {item.willBlockBy && (
              <div className="text-xs text-amber-800 mb-2 font-medium">
                Will block by: {new Date(item.willBlockBy).toLocaleDateString()}
              </div>
            )}

            {/* Source */}
            <div className="text-xs text-gray-600">
              Source: <span className="font-mono">{item.source}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
