/**
 * Insurance Decision Surface
 *
 * Risk acceptance view - insurance sees property facts and can bind coverage.
 * Question: "Is this property safe to bind?"
 *
 * What they see:
 * - Property facts (abstracted)
 * - Title status (binary)
 * - Transaction state
 * - Prior insurance attestations
 * - Known risk factors
 *
 * What they DO NOT see:
 * - Buyer identity (beyond property owner)
 * - Financing details
 * - Offer amounts
 * - Agent communications
 * - Underwriting notes (internal)
 * - Premium calculations (internal)
 */

import { RealityStrip } from '@/components/federation/RealityStrip';
import { BlockingPanel } from '@/components/federation/BlockingPanel';
import { CommandRail, getCommandAction } from '@/components/federation/CommandRail';
import { computeClosingReadiness } from '@/lib/federation/closingReadiness';

interface InsurancePageProps {
  params: { id: string };
}

export default async function InsurancePage({ params }: InsurancePageProps) {
  const transactionState = 'under_contract';
  const entityFingerprint = `transaction_${params.id}`;

  // Compute closing readiness
  const readinessResult = await computeClosingReadiness(entityFingerprint);

  // Get insurance-specific command action
  const commandAction = getCommandAction('insurance', readinessResult, {
    onAttest: async (type) => {
      'use server';
      console.log('Insurance attesting:', type);
    },
    onWithdraw: async (type) => {
      'use server';
      console.log('Insurance withdrawing coverage:', type);
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
            <h1 className="text-3xl font-bold mb-2">Coverage Review</h1>
            <p className="text-gray-600">
              Transaction ID: {params.id}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Property & Risk Factors */}
            <div className="space-y-6">
              {/* Property Facts */}
              <div className="border border-gray-200 rounded-lg p-6 bg-white">
                <h3 className="font-semibold mb-4">Property Facts</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Property Type</span>
                    <span className="font-mono">Single Family</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Year Built</span>
                    <span className="font-mono">1995</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Square Footage</span>
                    <span className="font-mono">2,400 sq ft</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Jurisdiction</span>
                    <span className="font-mono">NC</span>
                  </div>
                </div>
              </div>

              {/* Risk Factors */}
              <div className="border border-gray-200 rounded-lg p-6 bg-white">
                <h3 className="font-semibold mb-4">Risk Assessment</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>No flood zone</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>No wildfire risk</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Standard construction</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>No prior claims history</span>
                  </div>
                </div>
              </div>

              {/* Transaction Context */}
              <div className="border border-gray-200 rounded-lg p-6 bg-white">
                <h3 className="font-semibold mb-4">Transaction Status</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">State</span>
                    <span className="font-mono uppercase">{transactionState}</span>
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
                    <span className="text-gray-600">Financing Status</span>
                    <span className="font-mono">
                      {readinessResult.missing_attestations.includes(
                        'LoanClearedToClose'
                      )
                        ? '⚠ Pending'
                        : '✓ Cleared'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Coverage Status & Blocking */}
            <div className="space-y-6">
              {/* Blocking Panel (if applicable) */}
              <BlockingPanel result={readinessResult} />

              {/* Coverage Status */}
              <div className="border border-gray-200 rounded-lg p-6 bg-white">
                <h3 className="font-semibold mb-4">Coverage Status</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Risk Accepted</span>
                    <span className="font-mono">
                      {readinessResult.missing_attestations.includes('BinderIssued')
                        ? '⚠ Pending Review'
                        : '✓ Accepted'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Binder Status</span>
                    <span className="font-mono">
                      {readinessResult.missing_attestations.includes('BinderIssued')
                        ? '⚠ Not Issued'
                        : '✓ Issued'}
                    </span>
                  </div>
                  {readinessResult.conditional_warnings.some((w) =>
                    w.includes('BinderIssued')
                  ) && (
                    <div className="mt-2 text-xs text-amber-600">
                      ⚠ Conditional coverage - review required
                    </div>
                  )}
                </div>
              </div>

              {/* Prior Attestations */}
              <div className="border border-gray-200 rounded-lg p-6 bg-white">
                <h3 className="font-semibold mb-4">Prior Attestations</h3>
                <div className="text-sm text-gray-500">
                  No prior insurance attestations for this transaction.
                </div>
              </div>

              {/* Property Fingerprint */}
              <div className="border border-gray-200 rounded-lg p-6 bg-white">
                <h3 className="font-semibold mb-4">Property Identity</h3>
                <div className="text-sm text-gray-600">
                  Property fingerprint: <code className="font-mono text-xs">{entityFingerprint}</code>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  (Owner identity abstracted per federation protocol)
                </div>
              </div>

              {/* Risk Notes */}
              <div className="border border-gray-200 rounded-lg p-6 bg-white">
                <h3 className="font-semibold mb-4">Internal Notes</h3>
                <div className="text-sm text-gray-500 italic">
                  Underwriting notes and premium calculations remain internal and are not shared via federation.
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
