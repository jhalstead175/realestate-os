/**
 * Pipeline State Projection
 *
 * Read-only derived view of all transactions.
 * Computes current state from event stream.
 *
 * This is NOT stored state — it's computed on-demand.
 */

import { supabaseServer } from '@/lib/supabase/server';
import { buildDecisionContext } from '@/lib/execution';

export interface PipelineDeal {
  dealId: string;
  propertyAddress: string;
  currentState: string;
  closingReadiness: 'ready' | 'conditional' | 'blocked' | 'unknown';
  leadAgent: string;
  clientName: string;
  createdAt: string;
  lastActivityAt: string;
  blockingIssues: string[];
  eventCount: number;
  daysInPipeline: number;
}

export interface PipelineStats {
  totalDeals: number;
  readyToClose: number;
  blocked: number;
  conditional: number;
  avgDaysInPipeline: number;
}

/**
 * Load all transactions and project pipeline state
 */
export async function projectPipelineState(): Promise<{
  deals: PipelineDeal[];
  stats: PipelineStats;
}> {
  // Load all distinct transaction IDs from events
  const { data: aggregates, error } = await supabaseServer
    .from('events')
    .select('aggregate_id, created_at')
    .order('created_at', { ascending: false });

  if (error || !aggregates) {
    console.error('Failed to load aggregates:', error);
    return { deals: [], stats: defaultStats() };
  }

  // Get unique transaction IDs
  const uniqueAggregateIds = Array.from(
    new Set(aggregates.map((a) => a.aggregate_id))
  );

  // For each transaction, build decision context and extract pipeline state
  const deals: PipelineDeal[] = [];

  for (const aggregateId of uniqueAggregateIds) {
    try {
      const decisionContext = await buildDecisionContext({
        actorId: 'PIPELINE_VIEWER',
        transactionId: aggregateId,
      });

      // Extract metadata from events
      const { data: events } = await supabaseServer
        .from('events')
        .select('*')
        .eq('aggregate_id', aggregateId)
        .order('created_at', { ascending: true });

      if (!events || events.length === 0) continue;

      const firstEvent = events[0];
      const lastEvent = events[events.length - 1];

      // Extract property address from first event or later events
      let propertyAddress = 'Unknown Property';
      let leadAgent = 'Unknown Agent';
      let clientName = 'Unknown Client';

      for (const event of events) {
        if (event.payload?.property_address) {
          propertyAddress = event.payload.property_address;
        }
        if (event.payload?.agent_id) {
          leadAgent = event.payload.agent_id;
        }
        if (event.payload?.buyer_name || event.payload?.seller_name) {
          clientName =
            event.payload.buyer_name ||
            event.payload.seller_name ||
            'Unknown Client';
        }
      }

      // Calculate days in pipeline
      const createdAt = new Date(firstEvent.created_at);
      const now = new Date();
      const daysInPipeline = Math.floor(
        (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      deals.push({
        dealId: aggregateId,
        propertyAddress,
        currentState: decisionContext.transactionState,
        closingReadiness: decisionContext.closingReadiness,
        leadAgent,
        clientName,
        createdAt: firstEvent.created_at,
        lastActivityAt: lastEvent.created_at,
        blockingIssues: decisionContext.blockingReason
          ? [decisionContext.blockingReason]
          : [],
        eventCount: events.length,
        daysInPipeline,
      });
    } catch (error) {
      console.error(
        `Failed to project pipeline state for ${aggregateId}:`,
        error
      );
      // Continue with other deals
    }
  }

  // Compute stats
  const stats: PipelineStats = {
    totalDeals: deals.length,
    readyToClose: deals.filter((d) => d.closingReadiness === 'ready').length,
    blocked: deals.filter((d) => d.closingReadiness === 'blocked').length,
    conditional: deals.filter((d) => d.closingReadiness === 'conditional')
      .length,
    avgDaysInPipeline:
      deals.length > 0
        ? Math.round(
            deals.reduce((sum, d) => sum + d.daysInPipeline, 0) / deals.length
          )
        : 0,
  };

  return { deals, stats };
}

function defaultStats(): PipelineStats {
  return {
    totalDeals: 0,
    readyToClose: 0,
    blocked: 0,
    conditional: 0,
    avgDaysInPipeline: 0,
  };
}

/**
 * Filter deals by readiness status
 */
export function filterByReadiness(
  deals: PipelineDeal[],
  status: 'ready' | 'conditional' | 'blocked' | 'all'
): PipelineDeal[] {
  if (status === 'all') return deals;
  return deals.filter((d) => d.closingReadiness === status);
}

/**
 * Sort deals by various criteria
 */
export function sortDeals(
  deals: PipelineDeal[],
  sortBy: 'created' | 'activity' | 'days' | 'readiness'
): PipelineDeal[] {
  const sorted = [...deals];

  switch (sortBy) {
    case 'created':
      return sorted.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    case 'activity':
      return sorted.sort(
        (a, b) =>
          new Date(b.lastActivityAt).getTime() -
          new Date(a.lastActivityAt).getTime()
      );
    case 'days':
      return sorted.sort((a, b) => b.daysInPipeline - a.daysInPipeline);
    case 'readiness':
      const order = { blocked: 0, conditional: 1, ready: 2, unknown: 3 };
      return sorted.sort(
        (a, b) => order[a.closingReadiness] - order[b.closingReadiness]
      );
    default:
      return sorted;
  }
}
