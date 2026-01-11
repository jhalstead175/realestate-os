/**
 * Lender Decision Surface
 *
 * Attestation-only view - lender sees limited data and can only attest to funding readiness.
 * Question: "Is this transaction safe to fund right now?"
 *
 * What they see:
 * - Transaction state
 * - Contingency resolution
 * - Property identity
 * - Authority validity
 * - Title & insurance status (binary)
 *
 * What they DO NOT see:
 * - Offer price negotiations
 * - Agent communications
 * - Seller strategy
 */

import { RealityStrip } from '@/components/federation/RealityStrip';
import { ReadinessLattice } from '@/components/federation/ReadinessLattice';
import { BlockingPanel } from '@/components/federation/BlockingPanel';
import { CommandRail, getCommandAction } from '@/components/federation/CommandRail';
import { computeClosingReadiness } from '@/lib/federation/closingReadiness';

interface LenderPageProps {
  params: { id: string };
}

export default async function LenderPage({ params }: LenderPageProps) {
  const transactionState = 'under_contract';
  const entityFingerprint = `transaction_${params.id}`;

  // Compute closing readiness
  const readinessResult = await computeClosingReadiness(entityFingerprint);

  // Get lender-specific command action
  const commandAction = getCommandAction('lender', readinessResult, {
    onAttest: async (type) => {
      'use server';
      console.log('Lender attesting:', type);
    },
    onWithdraw: async (type) => {
      'use server';
      console.log('Lender withdrawing:', type);
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Reality Strip */}
      <RealityStrip
        transactionState={transactionState}
        readinessState={readinessResult.state}
        authorityValid={!readinessResult.missing_attestations.includes(
          'AuthorityVerified'
        )}
      />

      {/* Main Content */}
      <div className="pt-16 pr-64">
        <div className="max-w-7xl mx-auto p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Loan Clearance Review</h1>
            <p className="text-gray-600">
              Transaction ID: {params.id}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Readiness Overview (Limited) */}
            <div className="space-y-6">
              <div className="border border-gray-200 rounded-lg p-6 bg-white">
                <h3 className="font-semibold mb-4">Transaction Status</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">State</span>
                    <span className="font-mono uppercase">{transactionState}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Contingencies</span>
                    <span className="font-mono">
                      {readinessResult.blocking_reasons.some((r) =>
                        r.includes('contingencies')
                      )
                        ? '⚠ Unresolved'
                        : '✓ Resolved'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Authority</span>
                    <span className="font-mono">
                      {readinessResult.missing_attestations.includes(
                        'AuthorityVerified'
                      )
                        ? '✗ Invalid'
                        : '✓ Valid'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Title Status</span>
                    <span className="font-mono">
                      {readinessResult.missing_attestations.includes(
                        'TitleClearToClose'
                      )
                        ? '⚠ Pending'
                        : '✓ Clear'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Insurance Status</span>
                    <span className="font-mono">
                      {readinessResult.missing_attestations.includes(
                        'BinderIssued'
                      )
                        ? '⚠ Pending'
                        : '✓ Bound'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Property Identity (Minimal) */}
              <div className="border border-gray-200 rounded-lg p-6 bg-white">
                <h3 className="font-semibold mb-4">Property</h3>
                <div className="text-sm text-gray-600">
                  Property fingerprint: <code className="font-mono text-xs">{entityFingerprint}</code>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  (Full property details not visible to lender)
                </div>
              </div>
            </div>

            {/* Right: Blocking Info */}
            <div className="space-y-6">
              <BlockingPanel result={readinessResult} />

              {/* Lender Actions Log */}
              <div className="border border-gray-200 rounded-lg p-6 bg-white">
                <h3 className="font-semibold mb-4">Your Attestations</h3>
                <div className="text-sm text-gray-500">
                  No attestations yet for this transaction.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Command Rail */}
      <CommandRail action={commandAction} />
    </div>
  );
}
