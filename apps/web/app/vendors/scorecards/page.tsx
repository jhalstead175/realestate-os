/**
 * Vendor Scorecards — Lender, Title, Insurance (Read-Only, Derived)
 *
 * Performance metrics derived from actual transaction events
 * and federated confirmations.
 */

import { supabaseServer } from '@/lib/supabase/server';
import { VendorScorecardTable } from '@/components/vendors/VendorScorecardTable';

export default async function VendorScorecardsPage() {
  const { data: vendors, error } = await supabaseServer
    .from('vendor_scorecards_view')
    .select('*')
    .order('avg_delay_days', { ascending: true });

  if (error) {
    return (
      <main className="max-w-7xl mx-auto p-8">
        <div className="text-red-600">
          Failed to load vendor scorecards: {error.message}
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto p-8 space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Vendor Performance Scorecards</h1>
        <p className="text-sm text-gray-500">
          Performance metrics are derived from actual transaction events and
          federated confirmations.
        </p>
      </header>

      <VendorScorecardTable rows={vendors ?? []} />
    </main>
  );
}
