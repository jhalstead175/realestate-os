/**
 * External Listing Reconciliation
 *
 * Shows CRM/MLS listings and their reconciliation status with internal deals.
 *
 * Purpose: Detect data drift, not import authority.
 * External systems are advisory, not authoritative.
 */

import { supabaseServer } from '@/lib/supabase/server';
import { ReconciliationTable } from '@/components/integrations/ReconciliationTable';
import { SyncLogTable } from '@/components/integrations/SyncLogTable';

export default async function ReconciliationPage() {
  const { data: reconciliation } = await supabaseServer
    .from('external_listing_reconciliation_view')
    .select('*')
    .order('reconciliation_status', { ascending: true });

  const { data: syncLog } = await supabaseServer
    .from('external_sync_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  // Stats
  const stats = {
    total: reconciliation?.length || 0,
    matched: reconciliation?.filter((r) => r.reconciliation_status === 'matched')
      .length || 0,
    unmatched:
      reconciliation?.filter((r) => r.reconciliation_status === 'unmatched')
        .length || 0,
    conflicts:
      reconciliation?.filter((r) => r.reconciliation_status === 'conflict')
        .length || 0,
  };

  return (
    <main className="max-w-7xl mx-auto p-8 space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">
          External Listing Reconciliation
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          CRM and MLS listings are informational only. Authority is always
          derived from internal events.
        </p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Total External Listings</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-700">
            {stats.matched}
          </div>
          <div className="text-sm text-green-600">Matched</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-700">
            {stats.unmatched}
          </div>
          <div className="text-sm text-yellow-600">Unmatched</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-700">
            {stats.conflicts}
          </div>
          <div className="text-sm text-red-600">Conflicts</div>
        </div>
      </div>

      {/* Reconciliation Table */}
      <ReconciliationTable rows={reconciliation ?? []} />

      {/* Sync Log */}
      <SyncLogTable rows={syncLog ?? []} />
    </main>
  );
}
