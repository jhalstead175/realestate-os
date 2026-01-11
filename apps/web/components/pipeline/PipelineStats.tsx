/**
 * Pipeline Stats Overview
 *
 * High-level metrics computed from pipeline state.
 */

import type { PipelineStats as Stats } from '@/lib/pipeline/projectPipelineState';

interface Props {
  stats: Stats;
}

export function PipelineStats({ stats }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {/* Total Deals */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="text-2xl font-bold text-gray-900">
          {stats.totalDeals}
        </div>
        <div className="text-sm text-gray-500 mt-1">Total Transactions</div>
      </div>

      {/* Ready to Close */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="text-2xl font-bold text-green-700">
          {stats.readyToClose}
        </div>
        <div className="text-sm text-green-600 mt-1">Ready to Close</div>
      </div>

      {/* Conditional */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="text-2xl font-bold text-yellow-700">
          {stats.conditional}
        </div>
        <div className="text-sm text-yellow-600 mt-1">Conditional</div>
      </div>

      {/* Blocked */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-2xl font-bold text-red-700">{stats.blocked}</div>
        <div className="text-sm text-red-600 mt-1">Blocked</div>
      </div>

      {/* Avg Days in Pipeline */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="text-2xl font-bold text-blue-700">
          {stats.avgDaysInPipeline}
        </div>
        <div className="text-sm text-blue-600 mt-1">Avg Days in Pipeline</div>
      </div>
    </div>
  );
}
