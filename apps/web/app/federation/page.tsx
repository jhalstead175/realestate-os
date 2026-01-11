/**
 * Federation Console
 *
 * Command bridge for federation operations.
 * Minimal, fast, non-chatty (Apple lens).
 */

import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function getFederationStats() {
  try {
    // Get node count
    const { count: nodeCount } = await supabaseServer
      .from('federation_nodes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Get attestation count (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: attestationCount } = await supabaseServer
      .from('federation_attestations')
      .select('*', { count: 'exact', head: true })
      .gte('issued_at', sevenDaysAgo);

    // Get inbox stats
    const { count: inboxPending } = await supabaseServer
      .from('federation_inbox')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'pending');

    const { count: inboxValid } = await supabaseServer
      .from('federation_inbox')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'valid');

    const { count: inboxInvalid } = await supabaseServer
      .from('federation_inbox')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'invalid');

    // Get outbox stats
    const { count: outboxQueued } = await supabaseServer
      .from('federation_outbox')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'queued');

    const { count: outboxSent } = await supabaseServer
      .from('federation_outbox')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'sent');

    const { count: outboxFailed } = await supabaseServer
      .from('federation_outbox')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'failed');

    // Get top nodes by reputation
    const { data: topNodes } = await supabaseServer
      .from('federation_nodes_with_reputation')
      .select('brokerage_name, jurisdiction, reputation_score')
      .order('reputation_score', { ascending: false })
      .limit(10);

    return {
      nodeCount: nodeCount || 0,
      attestationCount: attestationCount || 0,
      inbox: {
        pending: inboxPending || 0,
        valid: inboxValid || 0,
        invalid: inboxInvalid || 0,
      },
      outbox: {
        queued: outboxQueued || 0,
        sent: outboxSent || 0,
        failed: outboxFailed || 0,
      },
      topNodes: topNodes || [],
    };
  } catch (error) {
    console.error('Failed to fetch federation stats:', error);
    return null;
  }
}

export default async function FederationPage() {
  const stats = await getFederationStats();

  if (!stats) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Federation Console</h1>
        <p className="text-red-500">Failed to load federation data</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Federation Console</h1>
        <p className="text-gray-600">Cross-brokerage network status</p>
      </div>

      {/* Network Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-1">Active Nodes</div>
          <div className="text-4xl font-bold">{stats.nodeCount}</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-1">Attestations (7d)</div>
          <div className="text-4xl font-bold">{stats.attestationCount}</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-1">Network Health</div>
          <div className="text-4xl font-bold text-green-600">
            {stats.inbox.invalid === 0 && stats.outbox.failed === 0
              ? '✓'
              : '⚠'}
          </div>
        </div>
      </div>

      {/* Inbox Status */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-bold mb-4">Inbox</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-600">Pending</div>
            <div className="text-2xl font-semibold">{stats.inbox.pending}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Valid</div>
            <div className="text-2xl font-semibold text-green-600">
              {stats.inbox.valid}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Invalid</div>
            <div className="text-2xl font-semibold text-red-600">
              {stats.inbox.invalid}
            </div>
          </div>
        </div>
      </div>

      {/* Outbox Status */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-bold mb-4">Outbox</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-600">Queued</div>
            <div className="text-2xl font-semibold">{stats.outbox.queued}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Sent</div>
            <div className="text-2xl font-semibold text-green-600">
              {stats.outbox.sent}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Failed</div>
            <div className="text-2xl font-semibold text-red-600">
              {stats.outbox.failed}
            </div>
          </div>
        </div>
      </div>

      {/* Top Nodes by Reputation */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Top Nodes by Reputation</h2>
        {stats.topNodes.length === 0 ? (
          <p className="text-gray-500">No reputation data available</p>
        ) : (
          <div className="space-y-3">
            {stats.topNodes.map((node, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-2 border-b last:border-b-0"
              >
                <div>
                  <div className="font-semibold">{node.brokerage_name}</div>
                  <div className="text-sm text-gray-600">{node.jurisdiction}</div>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {node.reputation_score?.toFixed(1) || 'N/A'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
