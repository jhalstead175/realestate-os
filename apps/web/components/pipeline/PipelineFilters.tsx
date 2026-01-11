'use client';

/**
 * Pipeline Filters & Deal List
 *
 * Client-side filtering and sorting of deals.
 * No server mutations — display only.
 */

import { useState } from 'react';
import type { PipelineDeal } from '@/lib/pipeline/projectPipelineState';
import { filterByReadiness, sortDeals } from '@/lib/pipeline/projectPipelineState';
import { DealCard } from './DealCard';

interface Props {
  deals: PipelineDeal[];
}

export function PipelineFilters({ deals }: Props) {
  const [readinessFilter, setReadinessFilter] = useState<
    'all' | 'ready' | 'conditional' | 'blocked'
  >('all');
  const [sortBy, setSortBy] = useState<
    'created' | 'activity' | 'days' | 'readiness'
  >('activity');

  // Apply filters and sorting
  const filteredDeals = filterByReadiness(deals, readinessFilter);
  const sortedDeals = sortDeals(filteredDeals, sortBy);

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-wrap gap-4">
          {/* Readiness Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Closing Readiness
            </label>
            <select
              value={readinessFilter}
              onChange={(e) =>
                setReadinessFilter(
                  e.target.value as 'all' | 'ready' | 'conditional' | 'blocked'
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Transactions</option>
              <option value="ready">Ready to Close</option>
              <option value="conditional">Conditional</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(
                  e.target.value as 'created' | 'activity' | 'days' | 'readiness'
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="activity">Recent Activity</option>
              <option value="created">Created Date</option>
              <option value="days">Days in Pipeline</option>
              <option value="readiness">Readiness Status</option>
            </select>
          </div>

          {/* Results Count */}
          <div className="flex items-end">
            <div className="text-sm text-gray-500 pb-2">
              Showing {sortedDeals.length} of {deals.length} transactions
            </div>
          </div>
        </div>
      </div>

      {/* Deal List */}
      <div className="space-y-3">
        {sortedDeals.map((deal) => (
          <DealCard key={deal.dealId} deal={deal} />
        ))}
      </div>

      {/* No Results */}
      {sortedDeals.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No transactions match the selected filters.
        </div>
      )}
    </div>
  );
}
