/**
 * Executive Metrics Dashboard (Read-Only, Derived, Governance-Safe)
 *
 * All data is derived from projections / analytics views.
 * No state mutation — pure reporting.
 */

import { supabaseServer } from '@/lib/supabase/server';
import { KPIGrid } from '@/components/metrics/KPIGrid';
import { BottleneckTable } from '@/components/metrics/BottleneckTable';
import { VarianceTable } from '@/components/metrics/VarianceTable';

export default async function MetricsPage() {
  // All data is derived from projections / analytics views
  const { data: kpis } = await supabaseServer
    .from('metrics_kpi_view')
    .select('*')
    .single();

  const { data: bottlenecks } = await supabaseServer
    .from('metrics_bottlenecks_view')
    .select('*');

  const { data: variance } = await supabaseServer
    .from('metrics_time_variance_view')
    .select('*');

  return (
    <main className="max-w-7xl mx-auto p-8 space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Executive Metrics</h1>
        <p className="text-sm text-gray-500">
          Metrics are derived from completed transaction events and closing
          readiness data.
        </p>
      </header>

      <KPIGrid kpis={kpis} />
      <VarianceTable rows={variance ?? []} />
      <BottleneckTable rows={bottlenecks ?? []} />
    </main>
  );
}
