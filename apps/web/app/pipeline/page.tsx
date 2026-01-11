/**
 * Pipeline View (Read-Only)
 *
 * Displays all transactions with derived state.
 * No commands — projection only.
 *
 * This is what brokers/ops see at a glance.
 */

import { projectPipelineState } from '@/lib/pipeline/projectPipelineState';
import { PipelineStats } from '@/components/pipeline/PipelineStats';
import { PipelineFilters } from '@/components/pipeline/PipelineFilters';
import { DealCard } from '@/components/pipeline/DealCard';

export default async function PipelinePage() {
  const { deals, stats } = await projectPipelineState();

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Transaction Pipeline
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Read-only view • Derived from event stream
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <PipelineStats stats={stats} />

      {/* Filters (Client Component) */}
      <PipelineFilters deals={deals} />

      {/* No Deals State */}
      {deals.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No transactions found in pipeline.</p>
        </div>
      )}
    </div>
  );
}
