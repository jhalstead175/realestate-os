/**
 * Reality Strip
 *
 * Thin, always-visible band showing transaction state, readiness, and authority.
 * Green/Amber/Red only. No gradients. No charts.
 *
 * This replaces status meetings.
 */

'use client';

import type { ClosingReadinessState } from '@/lib/federation/closingReadinessStateMachine';

interface RealityStripProps {
  transactionState: string;
  readinessState: ClosingReadinessState;
  authorityValid: boolean;
}

export function RealityStrip({
  transactionState,
  readinessState,
  authorityValid,
}: RealityStripProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-black text-white">
      <div className="flex items-center justify-between px-6 py-3 text-sm font-mono">
        {/* Transaction State */}
        <div className="flex items-center gap-2">
          <StatusDot state={getTransactionStateColor(transactionState)} />
          <span className="uppercase tracking-wide">{transactionState}</span>
        </div>

        {/* Readiness */}
        <div className="flex items-center gap-2">
          <StatusDot state={getReadinessColor(readinessState)} />
          <span className="uppercase tracking-wide">
            {getReadinessLabel(readinessState)}
          </span>
        </div>

        {/* Authority */}
        <div className="flex items-center gap-2">
          <StatusDot state={authorityValid ? 'green' : 'red'} />
          <span className="uppercase tracking-wide">
            {authorityValid ? 'Authority Valid' : 'Authority Revoked'}
          </span>
        </div>
      </div>
    </div>
  );
}

function StatusDot({ state }: { state: 'green' | 'amber' | 'red' }) {
  const colors = {
    green: 'bg-green-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
  };

  return <div className={`w-2 h-2 rounded-full ${colors[state]}`} />;
}

function getTransactionStateColor(state: string): 'green' | 'amber' | 'red' {
  if (state === 'completed' || state === 'closed') return 'green';
  if (state === 'under_contract' || state === 'closing') return 'amber';
  return 'red';
}

function getReadinessColor(
  state: ClosingReadinessState
): 'green' | 'amber' | 'red' {
  if (state === 'ready') return 'green';
  if (state === 'conditionally_ready') return 'amber';
  return 'red';
}

function getReadinessLabel(state: ClosingReadinessState): string {
  switch (state) {
    case 'ready':
      return 'Ready';
    case 'conditionally_ready':
      return 'Conditionally Ready';
    case 'not_ready':
      return 'Not Ready';
    case 'blocked':
      return 'Blocked';
    case 'expired':
      return 'Expired';
  }
}
