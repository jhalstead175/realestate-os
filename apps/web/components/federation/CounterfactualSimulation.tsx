/**
 * Counterfactual Simulation Component
 *
 * Agent-only view for "what if" scenario analysis.
 * Shows side-by-side comparison of reality vs simulation.
 *
 * CRITICAL: This is observation-only. No commands allowed.
 * Simulations run in shadow timelines and never affect reality.
 */

'use client';

import { useState } from 'react';

interface SimulationScenario {
  id: string;
  name: string;
  description: string;
}

interface SimulationOutcome {
  closing_date: string;
  net_proceeds: number;
  risk_score: number;
  timeline_days: number;
  contingencies_resolved: number;
  estimated_costs: number;
}

interface CounterfactualSimulationProps {
  transactionId: string;
  realityOutcome: SimulationOutcome;
  availableScenarios: SimulationScenario[];
}

export function CounterfactualSimulation({
  transactionId,
  realityOutcome,
  availableScenarios,
}: CounterfactualSimulationProps) {
  const [selectedScenario, setSelectedScenario] = useState<SimulationScenario | null>(null);
  const [simulationOutcome, setSimulationOutcome] = useState<SimulationOutcome | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const runSimulation = async (scenario: SimulationScenario) => {
    setIsSimulating(true);
    setSelectedScenario(scenario);

    // Simulate API call to counterfactual engine
    // In production, this would call the counterfactual replay system
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock simulation result
    const mockOutcome: SimulationOutcome = {
      closing_date: '2026-02-10',
      net_proceeds: 3050000,
      risk_score: 0.21,
      timeline_days: 25,
      contingencies_resolved: 2,
      estimated_costs: 12000,
    };

    setSimulationOutcome(mockOutcome);
    setIsSimulating(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="border border-gray-200 rounded-lg bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="font-mono text-sm font-semibold uppercase tracking-wide">
          Counterfactual Analysis
        </h3>
        <p className="text-xs text-gray-600 mt-1">
          Observation only - simulations never affect reality
        </p>
      </div>

      {/* Scenario Selection */}
      <div className="p-4 border-b border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Scenario
        </label>
        <div className="space-y-2">
          {availableScenarios.map((scenario) => (
            <button
              key={scenario.id}
              onClick={() => runSimulation(scenario)}
              disabled={isSimulating}
              className={`
                w-full text-left p-3 rounded border
                ${selectedScenario?.id === scenario.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
                }
                ${isSimulating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                transition-colors
              `}
            >
              <div className="font-medium text-sm">{scenario.name}</div>
              <div className="text-xs text-gray-600 mt-1">{scenario.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Side-by-Side Comparison */}
      {simulationOutcome && (
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Reality Column */}
            <div>
              <div className="text-xs font-mono uppercase tracking-wide text-gray-600 mb-3">
                Reality
              </div>
              <div className="space-y-3">
                <OutcomeMetric
                  label="Closing Date"
                  value={realityOutcome.closing_date}
                  type="reality"
                />
                <OutcomeMetric
                  label="Net Proceeds"
                  value={formatCurrency(realityOutcome.net_proceeds)}
                  type="reality"
                />
                <OutcomeMetric
                  label="Risk Score"
                  value={realityOutcome.risk_score.toFixed(2)}
                  type="reality"
                />
                <OutcomeMetric
                  label="Timeline"
                  value={`${realityOutcome.timeline_days} days`}
                  type="reality"
                />
                <OutcomeMetric
                  label="Est. Costs"
                  value={formatCurrency(realityOutcome.estimated_costs)}
                  type="reality"
                />
              </div>
            </div>

            {/* Simulation Column */}
            <div>
              <div className="text-xs font-mono uppercase tracking-wide text-blue-600 mb-3">
                Simulation
              </div>
              <div className="space-y-3">
                <OutcomeMetric
                  label="Closing Date"
                  value={simulationOutcome.closing_date}
                  type="simulation"
                  comparison={
                    new Date(simulationOutcome.closing_date) <
                    new Date(realityOutcome.closing_date)
                      ? 'better'
                      : 'worse'
                  }
                />
                <OutcomeMetric
                  label="Net Proceeds"
                  value={formatCurrency(simulationOutcome.net_proceeds)}
                  type="simulation"
                  comparison={
                    simulationOutcome.net_proceeds > realityOutcome.net_proceeds
                      ? 'better'
                      : 'worse'
                  }
                />
                <OutcomeMetric
                  label="Risk Score"
                  value={simulationOutcome.risk_score.toFixed(2)}
                  type="simulation"
                  comparison={
                    simulationOutcome.risk_score < realityOutcome.risk_score
                      ? 'better'
                      : 'worse'
                  }
                />
                <OutcomeMetric
                  label="Timeline"
                  value={`${simulationOutcome.timeline_days} days`}
                  type="simulation"
                  comparison={
                    simulationOutcome.timeline_days < realityOutcome.timeline_days
                      ? 'better'
                      : 'worse'
                  }
                />
                <OutcomeMetric
                  label="Est. Costs"
                  value={formatCurrency(simulationOutcome.estimated_costs)}
                  type="simulation"
                  comparison={
                    simulationOutcome.estimated_costs < realityOutcome.estimated_costs
                      ? 'better'
                      : 'worse'
                  }
                />
              </div>
            </div>
          </div>

          {/* Delta Summary */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-xs font-mono uppercase tracking-wide text-gray-600 mb-2">
              Net Impact
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div>
                <span className="text-gray-600">Timeline: </span>
                <span className={
                  simulationOutcome.timeline_days < realityOutcome.timeline_days
                    ? 'text-green-600 font-mono'
                    : 'text-red-600 font-mono'
                }>
                  {simulationOutcome.timeline_days - realityOutcome.timeline_days > 0 ? '+' : ''}
                  {simulationOutcome.timeline_days - realityOutcome.timeline_days} days
                </span>
              </div>
              <div>
                <span className="text-gray-600">Proceeds: </span>
                <span className={
                  simulationOutcome.net_proceeds > realityOutcome.net_proceeds
                    ? 'text-green-600 font-mono'
                    : 'text-red-600 font-mono'
                }>
                  {formatCurrency(simulationOutcome.net_proceeds - realityOutcome.net_proceeds)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Risk: </span>
                <span className={
                  simulationOutcome.risk_score < realityOutcome.risk_score
                    ? 'text-green-600 font-mono'
                    : 'text-red-600 font-mono'
                }>
                  {simulationOutcome.risk_score - realityOutcome.risk_score > 0 ? '+' : ''}
                  {(simulationOutcome.risk_score - realityOutcome.risk_score).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isSimulating && (
        <div className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
          <p className="text-sm text-gray-600 mt-3">Running simulation...</p>
        </div>
      )}

      {/* No Simulation Selected */}
      {!simulationOutcome && !isSimulating && (
        <div className="p-8 text-center text-sm text-gray-500">
          Select a scenario above to run a counterfactual simulation
        </div>
      )}
    </div>
  );
}

interface OutcomeMetricProps {
  label: string;
  value: string;
  type: 'reality' | 'simulation';
  comparison?: 'better' | 'worse' | 'same';
}

function OutcomeMetric({ label, value, type, comparison }: OutcomeMetricProps) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-600">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`font-mono ${type === 'simulation' ? 'text-blue-900' : 'text-gray-900'}`}>
          {value}
        </span>
        {comparison && type === 'simulation' && (
          <span className="text-xs">
            {comparison === 'better' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </div>
  );
}
