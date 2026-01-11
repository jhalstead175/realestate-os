/**
 * Reputation Engine
 *
 * Computes federation node reputation from attestation history.
 * Scores are derived ONLY from attestations, never self-reported.
 */

import { supabaseServer } from '@/lib/supabase/server';

interface ReputationMetrics {
  on_time_close_ratio: number;
  failure_rate: number;
  dispute_frequency: number;
  automation_reliability: number;
  total_transactions: number;
}

interface ReputationSnapshot {
  node_id: string;
  score: number;
  metrics: ReputationMetrics;
  computed_at: Date;
  valid_until: Date;
}

/**
 * Compute reputation for a federation node
 *
 * @param node_id - The node to compute reputation for
 * @returns Reputation snapshot
 */
export async function computeNodeReputation(
  node_id: string
): Promise<ReputationSnapshot> {
  // Get all attestations from this node
  const { data: attestations, error } = await supabaseServer
    .from('federation_attestations')
    .select('*')
    .eq('issuing_node_id', node_id)
    .order('issued_at', { ascending: false });

  if (error) {
    console.error('Failed to query attestations:', error);
    throw new Error('Failed to compute reputation');
  }

  if (!attestations || attestations.length === 0) {
    // New node with no history
    return {
      node_id,
      score: 50, // Neutral starting score
      metrics: {
        on_time_close_ratio: 0,
        failure_rate: 0,
        dispute_frequency: 0,
        automation_reliability: 0,
        total_transactions: 0,
      },
      computed_at: new Date(),
      valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Valid for 7 days
    };
  }

  // Compute metrics from attestations
  const metrics = computeMetricsFromAttestations(attestations);

  // Compute composite score (0-100)
  const score = computeCompositeScore(metrics);

  return {
    node_id,
    score,
    metrics,
    computed_at: new Date(),
    valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };
}

/**
 * Store a reputation snapshot
 */
export async function storeReputationSnapshot(
  snapshot: ReputationSnapshot
): Promise<void> {
  const { error } = await supabaseServer
    .from('federation_reputation_snapshots')
    .insert({
      node_id: snapshot.node_id,
      score: snapshot.score,
      metrics: snapshot.metrics,
      computed_at: snapshot.computed_at.toISOString(),
      valid_until: snapshot.valid_until.toISOString(),
    });

  if (error) {
    console.error('Failed to store reputation snapshot:', error);
    throw new Error('Failed to store reputation');
  }
}

/**
 * Compute all reputation snapshots
 * Should be run as a scheduled job (daily)
 */
export async function computeAllReputations(): Promise<{
  computed: number;
  failed: number;
}> {
  // Get all active nodes
  const { data: nodes, error } = await supabaseServer
    .from('federation_nodes')
    .select('node_id')
    .eq('status', 'active');

  if (error) {
    console.error('Failed to query nodes:', error);
    return { computed: 0, failed: 0 };
  }

  let computed = 0;
  let failed = 0;

  for (const node of nodes) {
    try {
      const snapshot = await computeNodeReputation(node.node_id);
      await storeReputationSnapshot(snapshot);
      computed++;
    } catch (error) {
      console.error(`Failed to compute reputation for ${node.node_id}:`, error);
      failed++;
    }
  }

  return { computed, failed };
}

/**
 * Compute metrics from attestation history
 */
function computeMetricsFromAttestations(
  attestations: Array<{
    attestation_type: string;
    payload: Record<string, unknown>;
  }>
): ReputationMetrics {
  let totalTransactions = 0;
  let completedTransactions = 0;
  let failedTransactions = 0;
  let disputeCount = 0;
  let automationSuccesses = 0;
  let automationFailures = 0;

  for (const attestation of attestations) {
    if (attestation.attestation_type === 'StateTransitioned') {
      const payload = attestation.payload as {
        from_state?: string;
        to_state?: string;
      };

      if (payload.to_state === 'completed' || payload.to_state === 'closed') {
        completedTransactions++;
      }

      if (payload.to_state === 'failed' || payload.to_state === 'cancelled') {
        failedTransactions++;
      }

      totalTransactions++;
    }

    if (attestation.attestation_type === 'ComplianceVerified') {
      const payload = attestation.payload as {
        compliance_status?: string;
      };

      if (payload.compliance_status === 'non_compliant') {
        disputeCount++;
      }
    }
  }

  const onTimeCloseRatio =
    completedTransactions > 0 ? completedTransactions / totalTransactions : 0;

  const failureRate =
    failedTransactions > 0 ? failedTransactions / totalTransactions : 0;

  const disputeFrequency = totalTransactions > 0 ? disputeCount / totalTransactions : 0;

  const automationReliability =
    automationSuccesses + automationFailures > 0
      ? automationSuccesses / (automationSuccesses + automationFailures)
      : 1.0; // Default to high if no automation data

  return {
    on_time_close_ratio: onTimeCloseRatio,
    failure_rate: failureRate,
    dispute_frequency: disputeFrequency,
    automation_reliability: automationReliability,
    total_transactions: totalTransactions,
  };
}

/**
 * Compute composite reputation score (0-100)
 */
function computeCompositeScore(metrics: ReputationMetrics): number {
  // Weighted scoring:
  // - On-time close ratio: 40%
  // - Low failure rate: 30%
  // - Low dispute frequency: 20%
  // - Automation reliability: 10%

  const score =
    metrics.on_time_close_ratio * 40 +
    (1 - metrics.failure_rate) * 30 +
    (1 - metrics.dispute_frequency) * 20 +
    metrics.automation_reliability * 10;

  // Clamp to 0-100
  return Math.max(0, Math.min(100, score));
}
