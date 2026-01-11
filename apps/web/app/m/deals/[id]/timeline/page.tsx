/**
 * Mobile Timeline
 *
 * Calm, glanceable event history for mobile agents.
 * No actions, no buttons, large tap targets.
 */

import { supabaseServer } from '@/lib/supabase/server';

export default async function MobileTimeline({
  params,
}: {
  params: { id: string };
}) {
  const dealId = params.id;

  // Load events (read-only)
  const { data: events } = await supabaseServer
    .from('events')
    .select('id, event_type, created_at, payload')
    .eq('aggregate_id', dealId)
    .order('created_at', { ascending: false });

  return (
    <main className="p-4 max-w-md mx-auto">
      <ul className="space-y-3">
        {events?.map((e) => (
          <li key={e.id} className="border border-gray-200 rounded-lg p-3 bg-white">
            <div className="text-xs text-gray-400 mb-1">
              {new Date(e.created_at).toLocaleString()}
            </div>
            <div className="text-sm text-gray-900">
              {generateSummary(e.event_type, e.payload)}
            </div>
          </li>
        ))}
      </ul>

      {(!events || events.length === 0) && (
        <div className="text-center text-gray-500 py-8">
          No events recorded yet.
        </div>
      )}
    </main>
  );
}

/**
 * Generate human-readable summary from event type and payload
 */
function generateSummary(eventType: string, payload: any): string {
  switch (eventType) {
    case 'deal_created':
      return `Transaction created`;
    case 'under_contract':
      return `Contract accepted`;
    case 'appraisal_ordered':
      return `Appraisal ordered`;
    case 'financing_approved':
      return `Financing approved`;
    case 'title_search_complete':
      return `Title search completed`;
    case 'closing_readiness_determined':
      return `Closing readiness updated`;
    case 'deal_closed':
      return `Transaction closed`;
    case 'automation_proposal_created':
      return `System suggested an action`;
    case 'automation_proposal_approved':
      return `Suggestion approved`;
    case 'federated_event_received':
      return `Update received from external source`;
    default:
      return eventType.replace(/_/g, ' ');
  }
}
