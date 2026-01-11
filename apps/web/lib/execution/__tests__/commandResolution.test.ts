/**
 * Execution Spine - Command Resolution Tests
 *
 * These tests verify the LAW.
 * If these pass, the system enforces correctness.
 */

import { describe, it, expect } from '@jest/globals';
import { resolveAvailableCommand } from '../commandResolution';
import type { DecisionContext } from '../types';

describe('resolveAvailableCommand', () => {
  // === HARD BLOCKERS ===

  it('returns none when closing is blocked', () => {
    const ctx: DecisionContext = {
      actorId: 'agent_1',
      role: 'agent',
      transactionState: 'under_contract',
      closingReadiness: 'blocked',
      authority: { mayAdvanceToClosing: true },
      unresolvedContingencies: false,
      blockingReason: 'Title defect detected',
    };

    const result = resolveAvailableCommand(ctx);

    expect(result.type).toBe('none');
    expect(result).toHaveProperty('reason', 'Title defect detected');
  });

  it('blocks even if agent has authority when readiness is blocked', () => {
    const ctx: DecisionContext = {
      actorId: 'agent_1',
      role: 'agent',
      transactionState: 'under_contract',
      closingReadiness: 'blocked',
      authority: { mayAdvanceToClosing: true },
      unresolvedContingencies: false,
      blockingReason: 'Financing withdrawn',
    };

    const result = resolveAvailableCommand(ctx);

    expect(result.type).toBe('none');
  });

  // === AGENT COMMANDS ===

  it('allows agent to proceed when ready', () => {
    const ctx: DecisionContext = {
      actorId: 'agent_1',
      role: 'agent',
      transactionState: 'under_contract',
      closingReadiness: 'ready',
      authority: { mayAdvanceToClosing: true },
      unresolvedContingencies: false,
    };

    const result = resolveAvailableCommand(ctx);

    expect(result.type).toBe('advance_to_closing');
  });

  it('prevents agent from proceeding without authority', () => {
    const ctx: DecisionContext = {
      actorId: 'agent_1',
      role: 'agent',
      transactionState: 'under_contract',
      closingReadiness: 'ready',
      authority: { mayAdvanceToClosing: false },
      unresolvedContingencies: false,
    };

    const result = resolveAvailableCommand(ctx);

    expect(result.type).toBe('none');
  });

  it('prevents agent from proceeding when transaction state is wrong', () => {
    const ctx: DecisionContext = {
      actorId: 'agent_1',
      role: 'agent',
      transactionState: 'offer_issued', // Not under contract
      closingReadiness: 'ready',
      authority: { mayAdvanceToClosing: true },
      unresolvedContingencies: false,
    };

    const result = resolveAvailableCommand(ctx);

    expect(result.type).toBe('none');
  });

  it('shows review message when conditionally ready', () => {
    const ctx: DecisionContext = {
      actorId: 'agent_1',
      role: 'agent',
      transactionState: 'under_contract',
      closingReadiness: 'conditionally_ready',
      authority: { mayAdvanceToClosing: true },
      unresolvedContingencies: false,
    };

    const result = resolveAvailableCommand(ctx);

    expect(result.type).toBe('none');
    expect(result).toHaveProperty(
      'reason',
      'Conditions require review before proceeding'
    );
  });

  it('shows waiting message when not ready', () => {
    const ctx: DecisionContext = {
      actorId: 'agent_1',
      role: 'agent',
      transactionState: 'under_contract',
      closingReadiness: 'not_ready',
      authority: { mayAdvanceToClosing: true },
      unresolvedContingencies: true,
    };

    const result = resolveAvailableCommand(ctx);

    expect(result.type).toBe('none');
    expect(result).toHaveProperty('reason', 'Waiting on partner attestations');
  });

  // === LENDER COMMANDS ===

  it('allows lender to issue attestation when authorized', () => {
    const ctx: DecisionContext = {
      actorId: 'lender_1',
      role: 'lender',
      transactionState: 'under_contract',
      closingReadiness: 'not_ready',
      authority: {
        mayAdvanceToClosing: false,
        mayIssueAttestation: ['LoanClearedToClose'],
        mayWithdrawAttestation: [],
      },
      unresolvedContingencies: false,
    };

    const result = resolveAvailableCommand(ctx);

    expect(result.type).toBe('issue_attestation');
    expect(result).toHaveProperty('attestationType', 'LoanClearedToClose');
  });

  it('allows lender to withdraw after attesting', () => {
    const ctx: DecisionContext = {
      actorId: 'lender_1',
      role: 'lender',
      transactionState: 'under_contract',
      closingReadiness: 'conditionally_ready',
      authority: {
        mayAdvanceToClosing: false,
        mayIssueAttestation: [],
        mayWithdrawAttestation: ['FinancingWithdrawn'],
      },
      unresolvedContingencies: false,
    };

    const result = resolveAvailableCommand(ctx);

    expect(result.type).toBe('withdraw_attestation');
    expect(result).toHaveProperty('attestationType', 'FinancingWithdrawn');
  });

  it('prevents lender action when no authority', () => {
    const ctx: DecisionContext = {
      actorId: 'lender_1',
      role: 'lender',
      transactionState: 'under_contract',
      closingReadiness: 'not_ready',
      authority: {
        mayAdvanceToClosing: false,
        mayIssueAttestation: [],
        mayWithdrawAttestation: [],
      },
      unresolvedContingencies: false,
    };

    const result = resolveAvailableCommand(ctx);

    expect(result.type).toBe('none');
    expect(result).toHaveProperty(
      'reason',
      'No authority to act on this transaction'
    );
  });

  // === TITLE COMMANDS ===

  it('allows title to issue attestation when authorized', () => {
    const ctx: DecisionContext = {
      actorId: 'title_1',
      role: 'title',
      transactionState: 'under_contract',
      closingReadiness: 'not_ready',
      authority: {
        mayAdvanceToClosing: false,
        mayIssueAttestation: ['TitleClearToClose'],
        mayWithdrawAttestation: [],
      },
      unresolvedContingencies: false,
    };

    const result = resolveAvailableCommand(ctx);

    expect(result.type).toBe('issue_attestation');
    expect(result).toHaveProperty('attestationType', 'TitleClearToClose');
  });

  it('allows title to report defect after attesting', () => {
    const ctx: DecisionContext = {
      actorId: 'title_1',
      role: 'title',
      transactionState: 'under_contract',
      closingReadiness: 'ready',
      authority: {
        mayAdvanceToClosing: false,
        mayIssueAttestation: [],
        mayWithdrawAttestation: ['TitleDefectDetected'],
      },
      unresolvedContingencies: false,
    };

    const result = resolveAvailableCommand(ctx);

    expect(result.type).toBe('withdraw_attestation');
    expect(result).toHaveProperty('attestationType', 'TitleDefectDetected');
  });

  // === INSURANCE COMMANDS ===

  it('allows insurance to issue binder when authorized', () => {
    const ctx: DecisionContext = {
      actorId: 'insurance_1',
      role: 'insurance',
      transactionState: 'under_contract',
      closingReadiness: 'not_ready',
      authority: {
        mayAdvanceToClosing: false,
        mayIssueAttestation: ['BinderIssued'],
        mayWithdrawAttestation: [],
      },
      unresolvedContingencies: false,
    };

    const result = resolveAvailableCommand(ctx);

    expect(result.type).toBe('issue_attestation');
    expect(result).toHaveProperty('attestationType', 'BinderIssued');
  });

  it('allows insurance to withdraw coverage after issuing', () => {
    const ctx: DecisionContext = {
      actorId: 'insurance_1',
      role: 'insurance',
      transactionState: 'under_contract',
      closingReadiness: 'conditionally_ready',
      authority: {
        mayAdvanceToClosing: false,
        mayIssueAttestation: [],
        mayWithdrawAttestation: ['CoverageWithdrawn'],
      },
      unresolvedContingencies: false,
    };

    const result = resolveAvailableCommand(ctx);

    expect(result.type).toBe('withdraw_attestation');
    expect(result).toHaveProperty('attestationType', 'CoverageWithdrawn');
  });

  // === PRIORITY TESTS ===

  it('prioritizes issue over withdraw when both available', () => {
    const ctx: DecisionContext = {
      actorId: 'lender_1',
      role: 'lender',
      transactionState: 'under_contract',
      closingReadiness: 'not_ready',
      authority: {
        mayAdvanceToClosing: false,
        mayIssueAttestation: ['LoanClearedToClose'],
        mayWithdrawAttestation: ['FinancingWithdrawn'],
      },
      unresolvedContingencies: false,
    };

    const result = resolveAvailableCommand(ctx);

    // Should prioritize issue over withdraw
    expect(result.type).toBe('issue_attestation');
  });

  // === EDGE CASES ===

  it('handles expired readiness state', () => {
    const ctx: DecisionContext = {
      actorId: 'agent_1',
      role: 'agent',
      transactionState: 'under_contract',
      closingReadiness: 'expired',
      authority: { mayAdvanceToClosing: true },
      unresolvedContingencies: false,
    };

    const result = resolveAvailableCommand(ctx);

    expect(result.type).toBe('none');
    expect(result).toHaveProperty('reason', 'Waiting on partner attestations');
  });

  it('handles transaction in closing state', () => {
    const ctx: DecisionContext = {
      actorId: 'agent_1',
      role: 'agent',
      transactionState: 'closing', // Already closing
      closingReadiness: 'ready',
      authority: { mayAdvanceToClosing: true },
      unresolvedContingencies: false,
    };

    const result = resolveAvailableCommand(ctx);

    // Cannot advance when already in closing
    expect(result.type).toBe('none');
  });

  it('handles transaction in completed state', () => {
    const ctx: DecisionContext = {
      actorId: 'agent_1',
      role: 'agent',
      transactionState: 'completed',
      closingReadiness: 'ready',
      authority: { mayAdvanceToClosing: true },
      unresolvedContingencies: false,
    };

    const result = resolveAvailableCommand(ctx);

    expect(result.type).toBe('none');
  });
});
