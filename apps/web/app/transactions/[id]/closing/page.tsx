/**
 * Closing Coordination View
 *
 * Shared view for all parties - shows readiness state and closing timeline.
 * All roles can see this page, but only agents can command state transitions.
 *
 * What all parties see:
 * - Transaction readiness state
 * - All party attestations (lattice)
 * - Closing timeline
 * - Blocking conditions (if any)
 *
 * Command authority:
 * - Agent: Can proceed to closing (if ready)
 * - All others: Read-only view
 */

import { RealityStrip } from '@/components/federation/RealityStrip';
import { ReadinessLattice } from '@/components/federation/ReadinessLattice';
import { BlockingPanel } from '@/components/federation/BlockingPanel';
import { CommandRail, getCommandAction } from '@/components/federation/CommandRail';
import { computeClosingReadiness } from '@/lib/federation/closingReadiness';

interface ClosingPageProps {
  params: { id: string };
  searchParams?: { role?: 'agent' | 'lender' | 'title' | 'insurance' };
}

export default async function ClosingPage({ params, searchParams }: ClosingPageProps) {
  const transactionState = 'under_contract';
  const entityFingerprint = `transaction_${params.id}`;

  // In production, derive role from authority context
  // For now, use searchParams or default to read-only
  const userRole = searchParams?.role || null;

  // Compute closing readiness
  const readinessResult = await computeClosingReadiness(entityFingerprint);

  // Get command action (only agent can proceed)
  const commandAction = userRole === 'agent'
    ? getCommandAction('agent', readinessResult, {
        onProceedToClosing: async () => {
          'use server';
          console.log('Agent proceeding to closing...');
        },
      })
    : {
        type: 'waiting' as const,
        label: 'Read Only',
        enabled: false,
        color: 'gray' as const,
        onClick: () => {},
      };

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
            <h1 className="text-3xl font-bold mb-2">Closing Coordination</h1>
            <p className="text-gray-600">
              Transaction ID: {params.id}
            </p>
            {userRole && (
              <p className="text-sm text-gray-500 mt-1">
                Viewing as: <span className="font-mono">{userRole}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Readiness Overview */}
            <div className="space-y-6">
              {/* Readiness Lattice */}
              <ReadinessLattice
                result={readinessResult}
                onRequirementClick={(req) => {
                  console.log('Show attestation:', req);
                }}
              />

              {/* Overall Status Card */}
              <div className="border border-gray-200 rounded-lg p-6 bg-white">
                <h3 className="font-semibold mb-4">Overall Status</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction State</span>
                    <span className="font-mono uppercase">{transactionState}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Readiness</span>
                    <span className={`font-mono ${
                      readinessResult.ready_to_close
                        ? 'text-green-600'
                        : readinessResult.state === 'conditionally_ready'
                          ? 'text-amber-600'
                          : 'text-red-600'
                    }`}>
                      {readinessResult.ready_to_close
                        ? '✓ Ready'
                        : readinessResult.state === 'conditionally_ready'
                          ? '! Conditional'
                          : '✗ Not Ready'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Computed At</span>
                    <span className="font-mono text-xs">
                      {readinessResult.computed_at.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Timeline & Blocking */}
            <div className="space-y-6">
              {/* Blocking Panel (if not ready) */}
              <BlockingPanel result={readinessResult} />

              {/* Closing Timeline */}
              <div className="border border-gray-200 rounded-lg p-6 bg-white">
                <h3 className="font-semibold mb-4">Closing Timeline</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 w-2 h-2 rounded-full bg-green-500" />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="font-medium text-sm">Under Contract</span>
                        <span className="text-xs text-gray-500">Feb 5</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        All parties agreed, transaction initiated
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className={`mt-1 w-2 h-2 rounded-full ${
                      readinessResult.ready_to_close
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                    }`} />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className={`font-medium text-sm ${
                          readinessResult.ready_to_close
                            ? 'text-gray-900'
                            : 'text-gray-400'
                        }`}>
                          Ready to Close
                        </span>
                        <span className="text-xs text-gray-500">
                          {readinessResult.ready_to_close ? 'Now' : 'Pending'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {readinessResult.ready_to_close
                          ? 'All attestations received and valid'
                          : 'Waiting for all party attestations'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-1 w-2 h-2 rounded-full bg-gray-300" />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="font-medium text-sm text-gray-400">
                          Closing
                        </span>
                        <span className="text-xs text-gray-500">—</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Final state transition (agent command required)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Party Participation Status */}
              <div className="border border-gray-200 rounded-lg p-6 bg-white">
                <h3 className="font-semibold mb-4">Party Status</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Lender</span>
                    <span className={`font-mono ${
                      !readinessResult.missing_attestations.includes('LoanClearedToClose')
                        ? 'text-green-600'
                        : 'text-gray-400'
                    }`}>
                      {!readinessResult.missing_attestations.includes('LoanClearedToClose')
                        ? '✓ Attested'
                        : '⏳ Pending'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Title</span>
                    <span className={`font-mono ${
                      !readinessResult.missing_attestations.includes('TitleClearToClose')
                        ? 'text-green-600'
                        : 'text-gray-400'
                    }`}>
                      {!readinessResult.missing_attestations.includes('TitleClearToClose')
                        ? '✓ Attested'
                        : '⏳ Pending'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Insurance</span>
                    <span className={`font-mono ${
                      !readinessResult.missing_attestations.includes('BinderIssued')
                        ? 'text-green-600'
                        : 'text-gray-400'
                    }`}>
                      {!readinessResult.missing_attestations.includes('BinderIssued')
                        ? '✓ Attested'
                        : '⏳ Pending'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Brokerage (Authority)</span>
                    <span className={`font-mono ${
                      !readinessResult.missing_attestations.includes('AuthorityVerified')
                        ? 'text-green-600'
                        : 'text-gray-400'
                    }`}>
                      {!readinessResult.missing_attestations.includes('AuthorityVerified')
                        ? '✓ Valid'
                        : '✗ Invalid'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Expiration Warnings */}
              {readinessResult.expiring_soon.length > 0 && (
                <div className="border border-amber-200 rounded-lg p-6 bg-amber-50">
                  <h3 className="font-semibold mb-4 text-amber-900">
                    ⚠ Expiring Attestations
                  </h3>
                  <div className="space-y-2 text-sm">
                    {readinessResult.expiring_soon.map((exp, idx) => (
                      <div key={idx} className="flex justify-between text-amber-800">
                        <span>{exp.attestation_type}</span>
                        <span className="font-mono text-xs">
                          {exp.expires_at.toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Command Rail (only active for agent) */}
      <CommandRail action={commandAction} />
    </div>
  );
}
