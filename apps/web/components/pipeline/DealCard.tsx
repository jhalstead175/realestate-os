/**
 * Deal Card
 *
 * Displays individual deal in pipeline view.
 * Read-only projection.
 */

import Link from 'next/link';
import type { PipelineDeal } from '@/lib/pipeline/projectPipelineState';

interface Props {
  deal: PipelineDeal;
}

export function DealCard({ deal }: Props) {
  // Readiness badge styling
  const readinessBadge = getReadinessBadge(deal.closingReadiness);

  return (
    <Link href={`/transactions/${deal.dealId}/executive`}>
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start justify-between">
          {/* Left: Deal Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-gray-900">
                {deal.propertyAddress}
              </h3>
              <span className={readinessBadge.className}>
                {readinessBadge.label}
              </span>
            </div>

            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <span>Agent: {deal.leadAgent}</span>
              <span>•</span>
              <span>Client: {deal.clientName}</span>
              <span>•</span>
              <span>State: {deal.currentState}</span>
            </div>

            {/* Blocking Issues */}
            {deal.blockingIssues.length > 0 && (
              <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                <div className="text-sm font-medium text-red-700">
                  Blocking Issues:
                </div>
                {deal.blockingIssues.map((issue, idx) => (
                  <div key={idx} className="text-sm text-red-600 mt-1">
                    • {issue}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Metrics */}
          <div className="ml-6 text-right">
            <div className="text-2xl font-bold text-gray-900">
              {deal.daysInPipeline}
            </div>
            <div className="text-sm text-gray-500">days in pipeline</div>
            <div className="text-sm text-gray-400 mt-2">
              {deal.eventCount} events
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Last activity:{' '}
              {new Date(deal.lastActivityAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function getReadinessBadge(readiness: string): {
  label: string;
  className: string;
} {
  switch (readiness) {
    case 'ready':
      return {
        label: 'READY TO CLOSE',
        className:
          'px-2 py-1 text-xs font-bold bg-green-100 text-green-700 rounded',
      };
    case 'conditional':
      return {
        label: 'CONDITIONAL',
        className:
          'px-2 py-1 text-xs font-bold bg-yellow-100 text-yellow-700 rounded',
      };
    case 'blocked':
      return {
        label: 'BLOCKED',
        className:
          'px-2 py-1 text-xs font-bold bg-red-100 text-red-700 rounded',
      };
    default:
      return {
        label: 'UNKNOWN',
        className:
          'px-2 py-1 text-xs font-bold bg-gray-100 text-gray-700 rounded',
      };
  }
}
