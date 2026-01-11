/**
 * Agent Deal Timeline UI
 *
 * Read-Only, Calming, Truth-Preserving
 *
 * Purpose: Reassurance, clarity, and shared understanding.
 * No buttons, no urgency colors, no editing, no instructions.
 */

import { supabaseServer } from '@/lib/supabase/server';
import { Timeline } from '@/components/timeline/Timeline';

export default async function DealTimelinePage({
  params,
}: {
  params: { id: string };
}) {
  const dealId = params.id;

  // Read-only event history (authoritative)
  const { data: events, error } = await supabaseServer
    .from('events')
    .select('id, event_type, created_at, actor_id, payload')
    .eq('aggregate_id', dealId)
    .order('created_at', { ascending: true });

  if (error) {
    return (
      <main className="max-w-4xl mx-auto p-8">
        <div className="text-red-600">Failed to load timeline: {error.message}</div>
      </main>
    );
  }

  // Transform events into display format
  const timelineEvents = (events ?? []).map((e) => ({
    id: e.id,
    type: e.event_type,
    createdAt: e.created_at,
    actorType: e.actor_id,
    summary: generateSummary(e.event_type, e.payload),
  }));

  return (
    <main className="max-w-4xl mx-auto p-8 space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-gray-900">Deal Timeline</h1>
        <p className="text-sm text-gray-500 mt-1">
          This timeline reflects the official record of the transaction. Events
          are recorded automatically and cannot be edited.
        </p>
      </header>

      <Timeline events={timelineEvents} />
    </main>
  );
}

/**
 * Generate human-readable summary from event type and payload
 */
function generateSummary(eventType: string, payload: any): string {
  switch (eventType) {
    case 'deal_created':
      return `Transaction created for ${payload?.property_address || 'property'}`;
    case 'under_contract':
      return `Contract accepted`;
    case 'appraisal_ordered':
      return `Appraisal ordered`;
    case 'financing_approved':
      return `Financing approved by lender`;
    case 'title_search_complete':
      return `Title search completed`;
    case 'closing_readiness_determined':
      return `Closing readiness: ${payload?.readiness || 'unknown'}`;
    case 'deal_closed':
      return `Transaction closed successfully`;
    case 'automation_proposal_created':
      return `Automation proposed: ${payload?.action || 'action'}`;
    case 'automation_proposal_approved':
      return `Automation approved`;
    case 'automation_proposal_rejected':
      return `Automation rejected`;
    case 'federated_event_received':
      return `Update received from ${payload?.source_type || 'external source'}`;
    default:
      return eventType.replace(/_/g, ' ');
  }
}
