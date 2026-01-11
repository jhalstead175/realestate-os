/**
 * Blocking Explanation Panel
 *
 * Appears only if state ≠ ready.
 * Plain language. No blame.
 */

'use client';

import type { ClosingReadinessResult } from '@/lib/federation/closingReadinessStateMachine';

interface BlockingPanelProps {
  result: ClosingReadinessResult;
}

export function BlockingPanel({ result }: BlockingPanelProps) {
  if (result.ready_to_close) return null;

  return (
    <div className="border-l-4 border-red-500 bg-red-50 p-6 rounded-r-lg">
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          <span className="text-red-500 text-3xl">⛔</span>
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-red-900 mb-2">
            {result.state === 'blocked'
              ? 'Closing is Blocked'
              : result.state === 'expired'
                ? 'Attestations Expired'
                : result.state === 'conditionally_ready'
                  ? 'Conditional Readiness'
                  : 'Not Ready to Close'}
          </h3>

          {/* Blocking Reasons */}
          {result.blocking_reasons.length > 0 && (
            <div className="space-y-2">
              {result.blocking_reasons.map((reason, idx) => (
                <div key={idx} className="text-sm text-red-800">
                  • {reason}
                </div>
              ))}
            </div>
          )}

          {/* Missing Attestations */}
          {result.missing_attestations.length > 0 && (
            <div className="mt-3">
              <div className="text-sm font-medium text-red-900 mb-1">
                Waiting for:
              </div>
              <div className="space-y-1">
                {result.missing_attestations.map((attestation, idx) => (
                  <div key={idx} className="text-sm text-red-800">
                    • {formatAttestationType(attestation)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conditional Warnings */}
          {result.conditional_warnings.length > 0 && (
            <div className="mt-3">
              <div className="text-sm font-medium text-amber-900 mb-1">
                Conditions:
              </div>
              <div className="space-y-1">
                {result.conditional_warnings.map((warning, idx) => (
                  <div key={idx} className="text-sm text-amber-800">
                    • {warning}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expiring Soon */}
          {result.expiring_soon.length > 0 && (
            <div className="mt-3">
              <div className="text-sm font-medium text-amber-900 mb-1">
                Expiring Soon:
              </div>
              <div className="space-y-1">
                {result.expiring_soon.map((item, idx) => (
                  <div key={idx} className="text-sm text-amber-800">
                    • {formatAttestationType(item.attestation_type)} expires{' '}
                    {item.expires_at.toLocaleDateString()}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatAttestationType(type: string): string {
  const mapping: Record<string, string> = {
    LoanClearedToClose: 'Lender Clearance',
    TitleClearToClose: 'Title Clearance',
    BinderIssued: 'Insurance Binder',
    AuthorityVerified: 'Authority Verification',
    StateTransitioned: 'Contingency Resolution',
  };

  return mapping[type] || type;
}
