/**
 * Mobile Deal Summary
 *
 * Calm, glanceable, read-only mobile UX for agents.
 * Purpose: Reassurance > productivity
 *
 * No actions, no buttons, no urgency colors.
 */

import { supabaseServer } from '@/lib/supabase/server';
import { buildDecisionContext } from '@/lib/execution';

export default async function MobileDealSummary({
  params,
}: {
  params: { id: string };
}) {
  const dealId = params.id;

  // Build decision context (read-only projection)
  const decisionContext = await buildDecisionContext({
    actorId: 'mobile_agent',
    transactionId: dealId,
  });

  // Extract display data
  const propertyAddress =
    decisionContext.transactionState?.propertyAddress || 'Unknown Property';
  const stage = decisionContext.transactionState || 'unknown';
  const readiness = decisionContext.closingReadiness || 'unknown';
  const targetCloseDate = 'TBD'; // TODO: Extract from events

  return (
    <main className="p-4 space-y-4 max-w-md mx-auto">
      {/* Property Address */}
      <h1 className="text-lg font-semibold text-gray-900">
        {propertyAddress}
      </h1>

      {/* Deal Status Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
        <Row label="Stage" value={stage} />
        <Row label="Readiness" value={readiness} />
        <Row label="Target Close" value={targetCloseDate} />
      </div>

      {/* Calm Disclaimer */}
      <p className="text-xs text-gray-500 text-center px-4">
        Status is derived from the system of record and updates automatically.
      </p>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}
