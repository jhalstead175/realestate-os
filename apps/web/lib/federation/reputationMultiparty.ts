/**
 * Role-Specific Reputation Engine
 *
 * Computes reputation for different node types (brokerage, lender, title, insurance).
 * Metrics vary by role to reflect what matters for that participant.
 */

import type {
  NodeType,
  BrokerageMetrics,
  LenderMetrics,
  TitleMetrics,
  InsuranceMetrics,
} from '@repo/federation';
import { supabaseServer } from '@/lib/supabase/server';

interface ReputationSnapshot {
  node_id: string;
  node_type: NodeType;
  score: number;
  metrics:
    | BrokerageMetrics
    | LenderMetrics
    | TitleMetrics
    | InsuranceMetrics;
  computed_at: Date;
  valid_until: Date;
}

/**
 * Compute reputation for a node (role-aware)
 */
export async function computeNodeReputation(
  nodeId: string
): Promise<ReputationSnapshot> {
  // Get node type
  const { data: node, error: nodeError } = await supabaseServer
    .from('federation_nodes')
    .select('node_id, node_type')
    .eq('node_id', nodeId)
    .single();

  if (nodeError || !node) {
    throw new Error('Node not found');
  }

  // Get attestations
  const { data: attestations, error } = await supabaseServer
    .from('federation_attestations')
    .select('*')
    .eq('issuing_node_id', nodeId)
    .order('issued_at', { ascending: false });

  if (error) {
    throw new Error('Failed to query attestations');
  }

  if (!attestations || attestations.length === 0) {
    return createNewNodeReputation(nodeId, node.node_type);
  }

  // Compute role-specific metrics
  let metrics;
  let score;

  switch (node.node_type) {
    case 'brokerage':
      metrics = computeBrokerageMetrics(attestations);
      score = scoreBrokerage(metrics);
      break;
    case 'lender':
      metrics = computeLenderMetrics(attestations);
      score = scoreLender(metrics);
      break;
    case 'title':
      metrics = computeTitleMetrics(attestations);
      score = scoreTitle(metrics);
      break;
    case 'insurance':
      metrics = computeInsuranceMetrics(attestations);
      score = scoreInsurance(metrics);
      break;
    default:
      metrics = computeBrokerageMetrics(attestations);
      score = 50;
  }

  return {
    node_id: nodeId,
    node_type: node.node_type,
    score,
    metrics,
    computed_at: new Date(),
    valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };
}

/**
 * Compute brokerage-specific metrics
 */
function computeBrokerageMetrics(attestations: any[]): BrokerageMetrics {
  let totalTransactions = 0;
  let completedTransactions = 0;
  let failedTransactions = 0;
  let disputeCount = 0;

  for (const att of attestations) {
    if (att.attestation_type === 'StateTransitioned') {
      const payload = att.payload as { to_state?: string };
      if (payload.to_state === 'completed' || payload.to_state === 'closed') {
        completedTransactions++;
      }
      if (payload.to_state === 'failed' || payload.to_state === 'cancelled') {
        failedTransactions++;
      }
      totalTransactions++;
    }

    if (att.attestation_type === 'ComplianceVerified') {
      const payload = att.payload as { compliance_status?: string };
      if (payload.compliance_status === 'non_compliant') {
        disputeCount++;
      }
    }
  }

  return {
    on_time_close_ratio:
      totalTransactions > 0 ? completedTransactions / totalTransactions : 0,
    failure_rate: totalTransactions > 0 ? failedTransactions / totalTransactions : 0,
    dispute_frequency: totalTransactions > 0 ? disputeCount / totalTransactions : 0,
    automation_reliability: 1.0, // TODO: Track from automation events
    total_transactions: totalTransactions,
  };
}

/**
 * Compute lender-specific metrics
 */
function computeLenderMetrics(attestations: any[]): LenderMetrics {
  let totalLoans = 0;
  let clearedLoans = 0;
  let withdrawnLoans = 0;
  let clearanceTimes: number[] = [];

  const loanMap = new Map<string, { cleared?: Date; withdrawn?: Date }>();

  for (const att of attestations) {
    const fingerprint = att.entity_fingerprint;

    if (att.attestation_type === 'LoanClearedToClose') {
      if (!loanMap.has(fingerprint)) {
        loanMap.set(fingerprint, {});
      }
      loanMap.get(fingerprint)!.cleared = new Date(att.issued_at);
      clearedLoans++;
    }

    if (att.attestation_type === 'FinancingWithdrawn') {
      if (!loanMap.has(fingerprint)) {
        loanMap.set(fingerprint, {});
      }
      loanMap.get(fingerprint)!.withdrawn = new Date(att.issued_at);
      withdrawnLoans++;
    }
  }

  totalLoans = loanMap.size;

  // Compute clearance accuracy (how many cleared loans actually closed)
  const clearanceAccuracy = totalLoans > 0 ? clearedLoans / totalLoans : 0;

  // Compute withdrawal rate
  const withdrawalRate = totalLoans > 0 ? withdrawnLoans / totalLoans : 0;

  return {
    clearance_accuracy: clearanceAccuracy,
    time_to_clear_avg_days: 21, // TODO: Compute from actual timestamps
    withdrawal_rate: withdrawalRate,
    total_loans: totalLoans,
  };
}

/**
 * Compute title-specific metrics
 */
function computeTitleMetrics(attestations: any[]): TitleMetrics {
  let totalSearches = 0;
  let clearances = 0;
  let defects = 0;

  const titleMap = new Map<string, { cleared?: Date; defect?: Date }>();

  for (const att of attestations) {
    const fingerprint = att.entity_fingerprint;

    if (att.attestation_type === 'TitleClearToClose') {
      if (!titleMap.has(fingerprint)) {
        titleMap.set(fingerprint, {});
      }
      titleMap.get(fingerprint)!.cleared = new Date(att.issued_at);
      clearances++;
    }

    if (att.attestation_type === 'TitleDefectDetected') {
      if (!titleMap.has(fingerprint)) {
        titleMap.set(fingerprint, {});
      }
      titleMap.get(fingerprint)!.defect = new Date(att.issued_at);
      defects++;
    }
  }

  totalSearches = titleMap.size;

  // Defect miss rate: defects found after clearance
  let missedDefects = 0;
  for (const [_fp, data] of titleMap.entries()) {
    if (data.cleared && data.defect && data.defect > data.cleared) {
      missedDefects++;
    }
  }

  const defectMissRate = clearances > 0 ? missedDefects / clearances : 0;
  const clearanceReliability = totalSearches > 0 ? clearances / totalSearches : 0;

  return {
    defect_miss_rate: defectMissRate,
    clearance_reliability: clearanceReliability,
    exception_accuracy: 0.95, // TODO: Track from exceptions
    total_title_searches: totalSearches,
  };
}

/**
 * Compute insurance-specific metrics
 */
function computeInsuranceMetrics(attestations: any[]): InsuranceMetrics {
  let totalPolicies = 0;
  let bindersIssued = 0;
  let bindersRevoked = 0;

  const policyMap = new Map<string, { bound?: Date; revoked?: Date }>();

  for (const att of attestations) {
    const fingerprint = att.entity_fingerprint;

    if (att.attestation_type === 'BinderIssued') {
      if (!policyMap.has(fingerprint)) {
        policyMap.set(fingerprint, {});
      }
      policyMap.get(fingerprint)!.bound = new Date(att.issued_at);
      bindersIssued++;
    }

    if (att.attestation_type === 'CoverageWithdrawn') {
      if (!policyMap.has(fingerprint)) {
        policyMap.set(fingerprint, {});
      }
      policyMap.get(fingerprint)!.revoked = new Date(att.issued_at);
      bindersRevoked++;
    }
  }

  totalPolicies = policyMap.size;

  const binderRevocationRate =
    bindersIssued > 0 ? bindersRevoked / bindersIssued : 0;

  return {
    binder_revocation_rate: binderRevocationRate,
    claim_dispute_rate: 0, // Future
    coverage_accuracy: 0.98, // TODO: Track from coverage issues
    total_policies: totalPolicies,
  };
}

/**
 * Score brokerage node (0-100)
 */
function scoreBrokerage(metrics: BrokerageMetrics): number {
  return Math.max(
    0,
    Math.min(
      100,
      metrics.on_time_close_ratio * 40 +
        (1 - metrics.failure_rate) * 30 +
        (1 - metrics.dispute_frequency) * 20 +
        metrics.automation_reliability * 10
    )
  );
}

/**
 * Score lender node (0-100)
 */
function scoreLender(metrics: LenderMetrics): number {
  return Math.max(
    0,
    Math.min(
      100,
      metrics.clearance_accuracy * 50 +
        (1 - metrics.withdrawal_rate) * 40 +
        (30 - Math.min(metrics.time_to_clear_avg_days, 30)) // Faster is better
    )
  );
}

/**
 * Score title node (0-100)
 */
function scoreTitle(metrics: TitleMetrics): number {
  return Math.max(
    0,
    Math.min(
      100,
      (1 - metrics.defect_miss_rate) * 50 +
        metrics.clearance_reliability * 30 +
        metrics.exception_accuracy * 20
    )
  );
}

/**
 * Score insurance node (0-100)
 */
function scoreInsurance(metrics: InsuranceMetrics): number {
  return Math.max(
    0,
    Math.min(
      100,
      (1 - metrics.binder_revocation_rate) * 50 +
        metrics.coverage_accuracy * 50
    )
  );
}

/**
 * Create reputation for new node (no history)
 */
function createNewNodeReputation(
  nodeId: string,
  nodeType: NodeType
): ReputationSnapshot {
  let metrics;

  switch (nodeType) {
    case 'lender':
      metrics = {
        clearance_accuracy: 0,
        time_to_clear_avg_days: 0,
        withdrawal_rate: 0,
        total_loans: 0,
      } as LenderMetrics;
      break;
    case 'title':
      metrics = {
        defect_miss_rate: 0,
        clearance_reliability: 0,
        exception_accuracy: 0,
        total_title_searches: 0,
      } as TitleMetrics;
      break;
    case 'insurance':
      metrics = {
        binder_revocation_rate: 0,
        claim_dispute_rate: 0,
        coverage_accuracy: 0,
        total_policies: 0,
      } as InsuranceMetrics;
      break;
    default:
      metrics = {
        on_time_close_ratio: 0,
        failure_rate: 0,
        dispute_frequency: 0,
        automation_reliability: 0,
        total_transactions: 0,
      } as BrokerageMetrics;
  }

  return {
    node_id: nodeId,
    node_type: nodeType,
    score: 50, // Neutral starting score
    metrics,
    computed_at: new Date(),
    valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };
}

/**
 * Store reputation snapshot
 */
export async function storeReputationSnapshot(
  snapshot: ReputationSnapshot
): Promise<void> {
  const { error } = await supabaseServer
    .from('federation_reputation_snapshots')
    .insert({
      node_id: snapshot.node_id,
      node_type: snapshot.node_type,
      score: snapshot.score,
      metrics: snapshot.metrics,
      computed_at: snapshot.computed_at.toISOString(),
      valid_until: snapshot.valid_until.toISOString(),
    });

  if (error) {
    console.error('Failed to store reputation:', error);
    throw new Error('Failed to store reputation');
  }
}

/**
 * Compute all reputations (scheduled job)
 */
export async function computeAllReputations(): Promise<{
  computed: number;
  failed: number;
}> {
  const { data: nodes, error } = await supabaseServer
    .from('federation_nodes')
    .select('node_id')
    .eq('status', 'active');

  if (error) {
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
