/**
 * Readiness Lattice
 *
 * Vertical checklist—computed, not editable.
 * Each line is clickable → shows source attestation.
 * Signed → shows issuing node.
 * Timestamped → shows freshness.
 */

'use client';

import { useState } from 'react';
import type { ClosingReadinessResult } from '@/lib/federation/closingReadinessStateMachine';

interface ReadinessLatticeProps {
  result: ClosingReadinessResult;
  onRequirementClick?: (requirement: {
    type: string;
    attestation_id?: string;
  }) => void;
}

export function ReadinessLattice({
  result,
  onRequirementClick,
}: ReadinessLatticeProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const requirements = [
    {
      label: 'Funds Cleared',
      key: 'funds',
      satisfied: result.missing_attestations.includes('LoanClearedToClose')
        ? false
        : !result.blocking_reasons.some((r) =>
            r.includes('lender')
          ),
      source: 'Lender',
      attestationType: 'LoanClearedToClose',
    },
    {
      label: 'Title Clear',
      key: 'title',
      satisfied: result.missing_attestations.includes('TitleClearToClose')
        ? false
        : !result.blocking_reasons.some((r) =>
            r.includes('title')
          ),
      source: 'Title',
      attestationType: 'TitleClearToClose',
    },
    {
      label: 'Insurance Bound',
      key: 'insurance',
      satisfied: result.missing_attestations.includes('BinderIssued')
        ? false
        : !result.blocking_reasons.some((r) =>
            r.includes('insurance')
          ),
      source: 'Insurance',
      attestationType: 'BinderIssued',
      conditional: result.conditional_warnings.some((w) =>
        w.includes('BinderIssued')
      ),
    },
    {
      label: 'Authority Valid',
      key: 'authority',
      satisfied: result.missing_attestations.includes('AuthorityVerified')
        ? false
        : !result.blocking_reasons.some((r) =>
            r.includes('authority')
          ),
      source: 'Brokerage',
      attestationType: 'AuthorityVerified',
    },
    {
      label: 'Contingencies Resolved',
      key: 'contingencies',
      satisfied: !result.blocking_reasons.some((r) =>
        r.includes('contingencies')
      ),
      source: 'Brokerage',
      attestationType: 'StateTransitioned',
    },
  ];

  return (
    <div className="border border-gray-200 rounded-lg">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="font-mono text-sm font-semibold uppercase tracking-wide">
          Closing Readiness
        </h3>
      </div>

      <div className="divide-y divide-gray-100">
        {requirements.map((req) => (
          <div
            key={req.key}
            className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => {
              setExpandedId(expandedId === req.key ? null : req.key);
              if (onRequirementClick) {
                onRequirementClick({
                  type: req.attestationType,
                  attestation_id: undefined, // Would come from backend
                });
              }
            }}
          >
            <div className="flex items-start gap-3">
              {/* Status Icon */}
              <div className="mt-0.5">
                {req.satisfied ? (
                  req.conditional ? (
                    <span className="text-amber-500 text-xl">!</span>
                  ) : (
                    <span className="text-green-500 text-xl">✓</span>
                  )
                ) : (
                  <span className="text-red-500 text-xl">✗</span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{req.label}</span>
                  <span className="text-xs text-gray-500 font-mono">
                    ({req.source})
                  </span>
                </div>

                {expandedId === req.key && (
                  <div className="mt-2 text-sm text-gray-600 space-y-1">
                    <div className="font-mono text-xs">
                      Attestation: {req.attestationType}
                    </div>
                    {req.conditional && (
                      <div className="text-amber-600">
                        ⚠ Conditional - review required
                      </div>
                    )}
                    {!req.satisfied && (
                      <div className="text-red-600">Waiting for attestation</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Overall Status */}
      <div
        className={`p-4 border-t border-gray-200 font-mono text-sm ${
          result.ready_to_close
            ? 'bg-green-50 text-green-900'
            : result.state === 'conditionally_ready'
              ? 'bg-amber-50 text-amber-900'
              : 'bg-red-50 text-red-900'
        }`}
      >
        <div className="uppercase tracking-wide font-semibold">
          {result.ready_to_close
            ? '✓ Ready to Close'
            : result.state === 'conditionally_ready'
              ? '! Conditionally Ready'
              : '✗ Not Ready'}
        </div>
        <div className="mt-1 text-xs opacity-75">
          Computed {result.computed_at.toLocaleString()}
        </div>
      </div>
    </div>
  );
}
