/**
 * Title Decision Surface
 *
 * Authority verification view - title sees ownership chain and can attest to legal coherence.
 * Question: "Is ownership and authority legally coherent?"
 *
 * What they see:
 * - Property identity
 * - Ownership chain (derived)
 * - Authority grants
 * - Prior title attestations
 * - Known encumbrances (abstracted)
 *
 * What they DO NOT see:
 * - Offer amounts
 * - Financing details
 * - Negotiation history
 * - Agent communications
 */

import { RealityStrip } from '@/components/federation/RealityStrip';
import { BlockingPanel } from '@/components/federation/BlockingPanel';
import { CommandRail, getCommandAction } from '@/components/federation/CommandRail';
import { computeClosingReadiness } from '@/lib/federation/closingReadiness';

interface TitlePageProps {
  params: { id: string };
}

export default async function TitlePage({ params }: TitlePageProps) {
  const transactionState = 'under_contract';
  const entityFingerprint = `transaction_${params.id}`;

  // Compute closing readiness
  const readinessResult = await computeClosingReadiness(entityFingerprint);

  // Get title-specific command action
  const commandAction = getCommandAction('title', readinessResult, {
    onAttest: async (type) => {
      'use server';
      console.log('Title attesting:', type);
    },
    onWithdraw: async (type) => {
      'use server';
      console.log('Title reporting defect:', type);
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
            <h1 className="text-3xl font-bold mb-2">Title Review</h1>
            <p className="text-gray-600">
              Transaction ID: {params.id}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Property & Ownership */}
            <div className="space-y-6">
              {/* Property Identity */}
              <div className="border border-gray-200 rounded-lg p-6 bg-white">
                <h3 className="font-semibold mb-4">Property Identity</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fingerprint</span>
                    <code className="font-mono text-xs">
                      {entityFingerprint.slice(0, 16)}...
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Jurisdiction</span>
                    <span className="font-mono">NC</span>
                  </div>
                </div>
              </div>

              {/* Ownership Chain */}
              <div className="border border-gray-200 rounded-lg p-6 bg-white">
                <h3 className="font-semibold mb-4">Chain of Title</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Current owner verified</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Prior conveyance verified (2 levels)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>No gaps in chain</span>
                  </div>
                </div>
              </div>

              {/* Authority Grants */}
              <div className="border border-gray-200 rounded-lg p-6 bg-white">
                <h3 className="font-semibold mb-4">Authority Status</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Seller Authority</span>
                    <span className="font-mono">
                      {readinessResult.missing_attestations.includes(
                        'AuthorityVerified'
                      )
                        ? '⚠ Pending Verification'
                        : '✓ Verified'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Agent Authority</span>
                    <span className="font-mono">✓ Valid</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Encumbrances & Status */}
            <div className="space-y-6">
              {/* Known Encumbrances */}
              <div className="border border-gray-200 rounded-lg p-6 bg-white">
                <h3 className="font-semibold mb-4">Known Encumbrances</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-500">ⓘ</span>
                    <span>Mortgage lien (current lender)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-500">ⓘ</span>
                    <span>County tax assessment (current)</span>
                  </div>
                  <div className="mt-4 text-xs text-gray-500">
                    All encumbrances disclosed. No blocking defects detected.
                  </div>
                </div>
              </div>

              {/* Blocking Panel (if applicable) */}
              <BlockingPanel result={readinessResult} />

              {/* Prior Title Attestations */}
              <div className="border border-gray-200 rounded-lg p-6 bg-white">
                <h3 className="font-semibold mb-4">Prior Attestations</h3>
                <div className="text-sm text-gray-500">
                  No prior title attestations for this transaction.
                </div>
              </div>

              {/* Title Status Summary */}
              <div className="border border-gray-200 rounded-lg p-6 bg-white">
                <h3 className="font-semibold mb-4">Review Status</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Chain Verified</span>
                    <span className="font-mono text-green-600">✓</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Encumbrances Disclosed</span>
                    <span className="font-mono text-green-600">✓</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Clear to Close</span>
                    <span className="font-mono">
                      {readinessResult.missing_attestations.includes(
                        'TitleClearToClose'
                      )
                        ? '⚠ Pending'
                        : '✓ Attested'}
                    </span>
                  </div>
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
