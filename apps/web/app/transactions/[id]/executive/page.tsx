/**
 * Executive-Grade Closing Readiness Page
 *
 * "Truth at a glance"
 *
 * Design Ethos:
 * - Read-only (no accidental authority)
 * - Deterministic (no guesses, no spinners)
 * - Explainable (every red has a reason)
 * - Calm under pressure
 * - Defensible in court
 *
 * In 5 seconds, an executive must be able to answer:
 * 1. Can this deal close on time?
 * 2. If not, what exactly is blocking it?
 * 3. Who controls each blocker?
 * 4. What has already been resolved?
 * 5. What is the earliest possible close if nothing changes?
 */

import { DealHeader, type DealHeaderInfo } from '@/components/executive/DealHeader';
import { ClosingReadinessScorecard, type ReadinessNode } from '@/components/executive/ClosingReadinessScorecard';
import { BlockingIssuesPanel, type BlockingIssue } from '@/components/executive/BlockingIssuesPanel';
import { AtRiskPanel, type AtRiskItem } from '@/components/executive/AtRiskPanel';
import { ResolvedFoundationsPanel, type ResolvedItem } from '@/components/executive/ResolvedFoundationsPanel';
import { FederatedAuthorityPanel, type FederatedAuthority } from '@/components/executive/FederatedAuthorityPanel';
import { AuditConfidenceStrip } from '@/components/executive/AuditConfidenceStrip';
import { buildDecisionContext } from '@/lib/execution';

export default async function ExecutivePage({
  params,
}: {
  params: { id: string };
}) {
  const transactionId = params.id;

  // TODO: Get actual actor from auth
  const actorId = 'executive_user_1';

  // Build decision context (single source of truth)
  const decisionContext = await buildDecisionContext({
    actorId,
    transactionId,
  });

  // TODO: Derive executive view from decision context
  // For now: Stub data

  const dealInfo: DealHeaderInfo = {
    dealId: transactionId,
    propertyAddress: '123 Main Street, Seattle, WA 98101',
    targetClosingDate: '2026-03-15',
    buyerName: 'John & Jane Buyer',
    sellerName: 'Bob Seller',
    leadAgent: 'Alice Agent',
    brokerage: 'Premier Realty',
  };

  const readinessNodes: ReadinessNode[] = [
    {
      id: 'contract',
      label: 'Contract',
      status: 'satisfied',
      reason: 'Purchase contract accepted',
      source: 'Internal',
      lastUpdated: '2026-02-12T10:42:00Z',
    },
    {
      id: 'lender',
      label: 'Lender',
      status: 'blocking',
      reason: 'Conditions outstanding',
      source: 'Federated:Lender',
      lastUpdated: '2026-02-14T14:30:00Z',
    },
    {
      id: 'title',
      label: 'Title',
      status: 'blocking',
      reason: 'IRS lien recorded 2019',
      source: 'Federated:Title',
      lastUpdated: '2026-02-14T09:15:00Z',
    },
    {
      id: 'insurance',
      label: 'Insurance',
      status: 'satisfied',
      reason: 'Policy bound',
      source: 'Federated:Insurance',
      lastUpdated: '2026-02-13T16:20:00Z',
    },
    {
      id: 'compliance',
      label: 'Compliance',
      status: 'satisfied',
      reason: 'All disclosures signed',
      source: 'Internal',
      lastUpdated: '2026-02-12T11:00:00Z',
    },
  ];

  const blockingIssues: BlockingIssue[] = [
    {
      id: 'title_lien',
      title: 'Title Clearance',
      source: 'Federated Title Node',
      reason: 'IRS lien recorded 2019',
      documentRef: 'Title Report (hash: abc123...)',
      control: 'Seller / Title',
      earliestResolution: null,
      discovered: '2026-02-14T09:15:00Z',
    },
    {
      id: 'lender_conditions',
      title: 'Lender Conditions',
      source: 'Federated Lender Node',
      reason: 'Updated paystub and bank statements required',
      control: 'Buyer / Lender',
      earliestResolution: '2026-02-20',
      discovered: '2026-02-14T14:30:00Z',
    },
  ];

  const atRiskItems: AtRiskItem[] = [
    {
      id: 'insurance_date',
      title: 'Insurance Effective Date',
      description: 'Insurance effective date (Mar 5) is after target closing (Mar 1)',
      riskLevel: 'medium',
      willBlockBy: '2026-03-01',
      source: 'Internal Analysis',
    },
  ];

  const resolvedItems: ResolvedItem[] = [
    {
      id: 'insurance_bound',
      title: 'Insurance Bound',
      details: {
        Policy: 'HO-123456',
        'Effective Date': 'Mar 5, 2026',
        'Coverage Type': 'Homeowners',
      },
      source: 'Federated Insurance',
      verifiedAt: '2026-02-13T16:20:00Z',
    },
    {
      id: 'disclosures',
      title: 'Disclosures Signed',
      details: {
        'Lead Disclosure': 'Signed',
        'HOA Docs': 'Signed',
      },
      source: 'Internal',
      verifiedAt: '2026-02-12T11:00:00Z',
      verifiedBy: 'Alice Agent',
    },
  ];

  const federatedAuthorities: FederatedAuthority[] = [
    {
      nodeId: 'lender_1',
      nodeType: 'lender',
      displayName: 'First National Mortgage',
      status: 'blocked',
      statusReason: 'Conditions outstanding',
      lastUpdate: '2026-02-14T14:30:00Z',
    },
    {
      nodeId: 'title_1',
      nodeType: 'title',
      displayName: 'Secure Title Co',
      status: 'blocked',
      statusReason: 'IRS lien unresolved',
      lastUpdate: '2026-02-14T09:15:00Z',
    },
    {
      nodeId: 'insurance_1',
      nodeType: 'insurance',
      displayName: 'Protective Insurance',
      status: 'ready',
      lastUpdate: '2026-02-13T16:20:00Z',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Deal Header */}
      <DealHeader info={dealInfo} />

      {/* Closing Readiness Scorecard */}
      <ClosingReadinessScorecard nodes={readinessNodes} />

      {/* Blocking Issues */}
      <BlockingIssuesPanel issues={blockingIssues} />

      {/* At-Risk Dependencies */}
      <AtRiskPanel items={atRiskItems} />

      {/* Resolved Foundations */}
      <ResolvedFoundationsPanel items={resolvedItems} />

      {/* Federated Authority Panel */}
      <FederatedAuthorityPanel authorities={federatedAuthorities} />

      {/* Audit Confidence Strip */}
      <AuditConfidenceStrip />
    </div>
  );
}
