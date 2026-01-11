/**
 * Command Rail
 *
 * Single vertical rail on the right.
 * At most one primary action at a time.
 *
 * No confirmation modals. The button itself is the confirmation.
 */

'use client';

import { useState } from 'react';
import type { ClosingReadinessResult } from '@/lib/federation/closingReadinessStateMachine';

interface CommandAction {
  type: 'ready' | 'conditional' | 'blocked' | 'waiting' | 'attestation';
  label: string;
  enabled: boolean;
  color: 'green' | 'amber' | 'red' | 'gray' | 'blue';
  onClick: () => void;
  requiresJustification?: boolean;
  warningMessage?: string;
}

interface CommandRailProps {
  action: CommandAction;
}

export function CommandRail({ action }: CommandRailProps) {
  const [justification, setJustification] = useState('');
  const [showJustification, setShowJustification] = useState(false);

  const colorClasses = {
    green: 'bg-green-600 hover:bg-green-700 text-white',
    amber: 'bg-amber-500 hover:bg-amber-600 text-white',
    red: 'bg-red-600 hover:bg-red-700 text-white',
    gray: 'bg-gray-300 text-gray-600 cursor-not-allowed',
    blue: 'bg-blue-600 hover:bg-blue-700 text-white',
  };

  const handleClick = () => {
    if (!action.enabled) return;

    if (action.requiresJustification && !showJustification) {
      setShowJustification(true);
      return;
    }

    action.onClick();
    setShowJustification(false);
    setJustification('');
  };

  return (
    <div className="fixed right-0 top-16 bottom-0 w-64 bg-white border-l border-gray-200 p-6 flex flex-col">
      <div className="flex-1">
        {/* Warning Message */}
        {action.warningMessage && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-900">
            ⚠ {action.warningMessage}
          </div>
        )}

        {/* Justification Input */}
        {showJustification && (
          <div className="mb-4 space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Justification (1 sentence)
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              rows={3}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Explain why you're taking this action..."
            />
          </div>
        )}
      </div>

      {/* Primary Action */}
      <button
        onClick={handleClick}
        disabled={!action.enabled}
        className={`
          w-full py-4 px-6 rounded-lg font-semibold text-lg
          transition-colors duration-150
          ${colorClasses[action.color]}
          ${!action.enabled ? 'opacity-50' : ''}
        `}
      >
        {action.label}
      </button>

      {/* Metadata */}
      <div className="mt-4 text-xs text-gray-500 text-center font-mono">
        {action.enabled ? 'Action Available' : 'No Action Available'}
      </div>
    </div>
  );
}

/**
 * Determine which command action to show based on role and state
 */
export function getCommandAction(
  role: 'agent' | 'lender' | 'title' | 'insurance',
  result: ClosingReadinessResult,
  callbacks: {
    onProceedToClosing?: () => void;
    onAttest?: (type: string) => void;
    onWithdraw?: (type: string) => void;
  }
): CommandAction {
  // Agent actions
  if (role === 'agent') {
    if (result.state === 'ready') {
      return {
        type: 'ready',
        label: '✓ Proceed to Closing',
        enabled: true,
        color: 'green',
        onClick: () => callbacks.onProceedToClosing?.(),
        requiresJustification: true,
      };
    }

    if (result.state === 'conditionally_ready') {
      return {
        type: 'conditional',
        label: '⚠ Review Conditions',
        enabled: false,
        color: 'amber',
        onClick: () => {},
        warningMessage: result.conditional_warnings.join('; '),
      };
    }

    return {
      type: 'waiting',
      label: 'Waiting on Partners',
      enabled: false,
      color: 'gray',
      onClick: () => {},
    };
  }

  // Lender actions
  if (role === 'lender') {
    const hasFundsCleared = !result.missing_attestations.includes(
      'LoanClearedToClose'
    );

    if (!hasFundsCleared) {
      return {
        type: 'attestation',
        label: '✓ Loan Cleared to Close',
        enabled: true,
        color: 'green',
        onClick: () => callbacks.onAttest?.('LoanClearedToClose'),
        requiresJustification: true,
      };
    }

    return {
      type: 'attestation',
      label: '⛔ Withdraw Financing',
        enabled: true,
        color: 'red',
        onClick: () => callbacks.onWithdraw?.('FinancingWithdrawn'),
        requiresJustification: true,
      };
  }

  // Title actions
  if (role === 'title') {
    const hasTitleCleared = !result.missing_attestations.includes(
      'TitleClearToClose'
    );

    if (!hasTitleCleared) {
      return {
        type: 'attestation',
        label: '✓ Title Clear to Close',
        enabled: true,
        color: 'green',
        onClick: () => callbacks.onAttest?.('TitleClearToClose'),
        requiresJustification: true,
      };
    }

    return {
      type: 'attestation',
      label: '⛔ Report Title Defect',
      enabled: true,
      color: 'red',
      onClick: () => callbacks.onWithdraw?.('TitleDefectDetected'),
      requiresJustification: true,
    };
  }

  // Insurance actions
  if (role === 'insurance') {
    const hasBinderIssued = !result.missing_attestations.includes('BinderIssued');

    if (!hasBinderIssued) {
      return {
        type: 'attestation',
        label: '✓ Issue Binder',
        enabled: true,
        color: 'green',
        onClick: () => callbacks.onAttest?.('BinderIssued'),
        requiresJustification: true,
      };
    }

    return {
      type: 'attestation',
      label: '⛔ Withdraw Coverage',
      enabled: true,
      color: 'red',
      onClick: () => callbacks.onWithdraw?.('CoverageWithdrawn'),
      requiresJustification: true,
    };
  }

  // Fallback
  return {
    type: 'waiting',
    label: 'No Action Available',
    enabled: false,
    color: 'gray',
    onClick: () => {},
  };
}
