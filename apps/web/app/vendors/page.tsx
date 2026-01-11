/**
 * Vendor Scorecards
 *
 * Performance tracking for federated sources:
 * - Lender performance
 * - Title delay patterns
 * - Insurance responsiveness
 *
 * Read-only analytics, derived from federated events.
 */

import { supabaseServer } from '@/lib/supabase/server';
import { VendorPerformanceTable } from '@/components/vendors/VendorPerformanceTable';
import { VendorDelayPatternsTable } from '@/components/vendors/VendorDelayPatternsTable';
import { VendorResponsivenessTable } from '@/components/vendors/VendorResponsivenessTable';

export default async function VendorScorecardsPage() {
  const { data: performance } = await supabaseServer
    .from('vendor_performance_view')
    .select('*');

  const { data: delays } = await supabaseServer
    .from('vendor_delay_patterns_view')
    .select('*');

  const { data: responsiveness } = await supabaseServer
    .from('vendor_responsiveness_view')
    .select('*');

  return (
    <main className="max-w-7xl mx-auto p-8 space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Vendor Scorecards</h1>
        <p className="text-sm text-gray-500 mt-1">
          Performance metrics for lenders, title companies, and insurance
          providers. Derived from federated events.
        </p>
      </header>

      <VendorPerformanceTable rows={performance ?? []} />
      <VendorResponsivenessTable rows={responsiveness ?? []} />
      <VendorDelayPatternsTable rows={delays ?? []} />
    </main>
  );
}
