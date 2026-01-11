/**
 * Agent Decision Surface
 *
 * Command authority view - agent can see full transaction and command state changes.
 * Question: "What can I lawfully do next to move this deal forward?"
 */

import { RealityStrip } from '@/components/federation/RealityStrip';
import { ReadinessLattice } from '@/components/federation/ReadinessLattice';
import { BlockingPanel } from '@/components/federation/BlockingPanel';
import { CommandRail, getCommandAction } from '@/components/federation/CommandRail';
import { CounterfactualSimulation } from '@/components/federation/CounterfactualSimulation';
import { computeClosingReadiness } from '@/lib/federation/closingReadiness';

interface AgentPageProps {
  params: { id: string };
}

export default async function AgentPage({ params }: AgentPageProps) {
  // In production, fetch transaction data and compute readiness
  // For now, using mock data to demonstrate UI
  const transactionState = 'under_contract';
  const entityFingerprint = `transaction_${params.id}`;

  // Compute closing readiness
  const readinessResult = await computeClosingReadiness(entityFingerprint);

  // Get authority-bound command action
  const commandAction = getCommandAction('agent', readinessResult, {
    onProceedToClosing: async () => {
      'use server';
      // Emit TransactionStateAdvanced event
      console.log('Proceeding to closing...');
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
            <h1 className="text-3xl font-bold mb-2">Transaction Dashboard</h1>
            <p className="text-gray-600">
              Transaction ID: {params.id}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Readiness Lattice */}
            <div>
              <ReadinessLattice
                result={readinessResult}
                onRequirementClick={(req) => {
                  console.log('Show attestation:', req);
                }}
              />
            </div>

            {/* Right: Transaction Details */}
            <div className="space-y-6">
              {/* Blocking Panel (if applicable) */}
              <BlockingPanel result={readinessResult} />

              {/* Transaction Timeline */}
              <div className="border border-gray-200 rounded-lg p-6 bg-white">
                <h3 className="font-semibold mb-4">Transaction Timeline</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Listed</span>
                    <span className="font-mono">2026-01-15</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Offer Accepted</span>
                    <span className="font-mono">2026-02-01</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Under Contract</span>
                    <span className="font-mono">2026-02-05</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Closing</span>
                    <span className="font-mono">—</span>
                  </div>
                </div>
              </div>

              {/* Contingencies */}
              <div className="border border-gray-200 rounded-lg p-6 bg-white">
                <h3 className="font-semibold mb-4">Contingencies</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span className="text-sm">Inspection Complete</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span className="text-sm">Appraisal Complete</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Counterfactual Simulation (Agent-Only) */}
          <div className="mt-8">
            <CounterfactualSimulation
              transactionId={params.id}
              realityOutcome={{
                closing_date: '2026-03-15',
                net_proceeds: 3120000,
                risk_score: 0.42,
                timeline_days: 38,
                contingencies_resolved: 2,
                estimated_costs: 15000,
              }}
              availableScenarios={[
                {
                  id: 'accelerate_inspection',
                  name: 'Accelerate Inspection',
                  description: 'Complete inspection 5 days earlier',
                },
                {
                  id: 'waive_financing',
                  name: 'Waive Financing Contingency',
                  description: 'Remove financing contingency to speed closing',
                },
                {
                  id: 'reduce_price',
                  name: 'Reduce Price 2%',
                  description: 'Lower offer by $50k to reduce appraisal risk',
                },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Command Rail */}
      <CommandRail action={commandAction} />
    </div>
  );
}
