/**
 * Execution Spine - Command Resolution Adversarial Tests
 *
 * These tests verify the system cannot be tricked into allowing illegal actions.
 * Adversarial: we try to break the law.
 */

import { describe, it, expect } from '@jest/globals';
import { resolveAvailableCommand } from '../commandResolution';
import type { DecisionContext } from '../types';

describe('Command Resolution - Adversarial Tests', () => {
  // === AGENT ATTEMPTS ILLEGAL ADVANCE ===

  describe('agent attempts illegal advance', () => {
    it('agent cannot advance when not ready', () => {
      const ctx: DecisionContext = {
        actorId: 'agent_1',
        role: 'agent',
        transactionState: 'under_contract',
        closingReadiness: 'not_ready', // NOT READY
        authority: { mayAdvanceToClosing: true },
        unresolvedContingencies: true,
      };

      const command = resolveAvailableCommand(ctx);

      // MUST NOT allow advance
      expect(command.type).not.toBe('advance_to_closing');
      expect(command.type).toBe('none');
    });

    it('agent cannot advance when conditionally ready', () => {
      const ctx: DecisionContext = {
        actorId: 'agent_2',
        role: 'agent',
        transactionState: 'under_contract',
        closingReadiness: 'conditionally_ready',
        authority: { mayAdvanceToClosing: true },
        unresolvedContingencies: false,
      };

      const command = resolveAvailableCommand(ctx);

      // Conditional readiness requires review
      expect(command.type).not.toBe('advance_to_closing');
      expect(command.type).toBe('none');
    });

    it('agent cannot advance when transaction not under contract', () => {
      const ctx: DecisionContext = {
        actorId: 'agent_3',
        role: 'agent',
        transactionState: 'offer_issued', // Wrong state
        closingReadiness: 'ready',
        authority: { mayAdvanceToClosing: true },
        unresolvedContingencies: false,
      };

      const command = resolveAvailableCommand(ctx);

      expect(command.type).not.toBe('advance_to_closing');
    });

    it('agent cannot advance without authority', () => {
      const ctx: DecisionContext = {
        actorId: 'agent_4',
        role: 'agent',
        transactionState: 'under_contract',
        closingReadiness: 'ready',
        authority: { mayAdvanceToClosing: false }, // No authority
        unresolvedContingencies: false,
      };

      const command = resolveAvailableCommand(ctx);

      expect(command.type).not.toBe('advance_to_closing');
    });

    it('agent cannot advance when blocked', () => {
      const ctx: DecisionContext = {
        actorId: 'agent_5',
        role: 'agent',
        transactionState: 'under_contract',
        closingReadiness: 'blocked',
        authority: { mayAdvanceToClosing: true },
        unresolvedContingencies: false,
        blockingReason: 'Financing withdrawn',
      };

      const command = resolveAvailableCommand(ctx);

      expect(command.type).toBe('none');
      expect(command).toHaveProperty('reason');
    });
  });

  // === AUTOMATION WITHOUT AUTHORITY ===

  describe('automation without authority', () => {
    it('automation cannot advance without explicit scope', () => {
      const ctx: DecisionContext = {
        actorId: 'automation_bot',
        role: 'agent',
        transactionState: 'under_contract',
        closingReadiness: 'ready',
        authority: {}, // No scope granted
        unresolvedContingencies: false,
      };

      const command = resolveAvailableCommand(ctx);

      // No mayAdvanceToClosing → no advance
      expect(command.type).not.toBe('advance_to_closing');
    });

    it('automation with wrong scope cannot advance', () => {
      const ctx: DecisionContext = {
        actorId: 'automation_bot2',
        role: 'agent',
        transactionState: 'under_contract',
        closingReadiness: 'ready',
        authority: {
          mayIssueAttestation: ['SomeAttestation'], // Wrong scope
        },
        unresolvedContingencies: false,
      };

      const command = resolveAvailableCommand(ctx);

      expect(command.type).not.toBe('advance_to_closing');
    });
  });

  // === LENDER ATTEMPTS STATE CHANGE ===

  describe('lender attempts state change', () => {
    it('lender cannot advance transaction state', () => {
      const ctx: DecisionContext = {
        actorId: 'lender_1',
        role: 'lender',
        transactionState: 'under_contract',
        closingReadiness: 'ready',
        authority: {
          mayIssueAttestation: ['LoanClearedToClose'],
        },
        unresolvedContingencies: false,
      };

      const command = resolveAvailableCommand(ctx);

      // Lender can only issue attestation, not advance state
      expect(command.type).not.toBe('advance_to_closing');
      expect(['issue_attestation', 'withdraw_attestation', 'none']).toContain(
        command.type
      );
    });

    it('lender without attestation authority gets no command', () => {
      const ctx: DecisionContext = {
        actorId: 'lender_2',
        role: 'lender',
        transactionState: 'under_contract',
        closingReadiness: 'ready',
        authority: {}, // No authority
        unresolvedContingencies: false,
      };

      const command = resolveAvailableCommand(ctx);

      expect(command.type).toBe('none');
    });
  });

  // === TITLE ATTEMPTS STATE CHANGE ===

  describe('title attempts state change', () => {
    it('title cannot advance transaction state', () => {
      const ctx: DecisionContext = {
        actorId: 'title_1',
        role: 'title',
        transactionState: 'under_contract',
        closingReadiness: 'ready',
        authority: {
          mayIssueAttestation: ['TitleClearToClose'],
        },
        unresolvedContingencies: false,
      };

      const command = resolveAvailableCommand(ctx);

      expect(command.type).not.toBe('advance_to_closing');
    });
  });

  // === INSURANCE ATTEMPTS STATE CHANGE ===

  describe('insurance attempts state change', () => {
    it('insurance cannot advance transaction state', () => {
      const ctx: DecisionContext = {
        actorId: 'insurance_1',
        role: 'insurance',
        transactionState: 'under_contract',
        closingReadiness: 'ready',
        authority: {
          mayIssueAttestation: ['BinderIssued'],
        },
        unresolvedContingencies: false,
      };

      const command = resolveAvailableCommand(ctx);

      expect(command.type).not.toBe('advance_to_closing');
    });
  });

  // === WRONG ATTESTATION TYPE ===

  describe('wrong attestation type attempts', () => {
    it('lender cannot issue title attestation', () => {
      const ctx: DecisionContext = {
        actorId: 'lender_3',
        role: 'lender',
        transactionState: 'under_contract',
        closingReadiness: 'not_ready',
        authority: {
          mayIssueAttestation: ['LoanClearedToClose'],
        },
        unresolvedContingencies: false,
      };

      const command = resolveAvailableCommand(ctx);

      if (command.type === 'issue_attestation') {
        // Can ONLY issue LoanClearedToClose
        expect(command.attestationType).toBe('LoanClearedToClose');
        expect(command.attestationType).not.toBe('TitleClearToClose');
      }
    });

    it('title cannot issue lender attestation', () => {
      const ctx: DecisionContext = {
        actorId: 'title_2',
        role: 'title',
        transactionState: 'under_contract',
        closingReadiness: 'not_ready',
        authority: {
          mayIssueAttestation: ['TitleClearToClose'],
        },
        unresolvedContingencies: false,
      };

      const command = resolveAvailableCommand(ctx);

      if (command.type === 'issue_attestation') {
        expect(command.attestationType).toBe('TitleClearToClose');
        expect(command.attestationType).not.toBe('LoanClearedToClose');
      }
    });
  });

  // === WITHDRAWAL WITHOUT PRIOR ISSUANCE ===

  describe('withdrawal without prior issuance', () => {
    it('lender cannot withdraw if never issued', () => {
      const ctx: DecisionContext = {
        actorId: 'lender_4',
        role: 'lender',
        transactionState: 'under_contract',
        closingReadiness: 'not_ready',
        authority: {
          mayIssueAttestation: ['LoanClearedToClose'],
          // No withdraw authority
        },
        unresolvedContingencies: false,
      };

      const command = resolveAvailableCommand(ctx);

      // Should get issue, not withdraw
      if (command.type !== 'none') {
        expect(command.type).toBe('issue_attestation');
      }
    });
  });

  // === EXPIRED READINESS ===

  describe('expired readiness blocks advance', () => {
    it('agent cannot advance when readiness expired', () => {
      const ctx: DecisionContext = {
        actorId: 'agent_6',
        role: 'agent',
        transactionState: 'under_contract',
        closingReadiness: 'expired',
        authority: { mayAdvanceToClosing: true },
        unresolvedContingencies: false,
      };

      const command = resolveAvailableCommand(ctx);

      expect(command.type).not.toBe('advance_to_closing');
    });
  });

  // === COMPLETED TRANSACTION ===

  describe('completed transaction cannot advance', () => {
    it('agent cannot advance completed transaction', () => {
      const ctx: DecisionContext = {
        actorId: 'agent_7',
        role: 'agent',
        transactionState: 'completed',
        closingReadiness: 'ready',
        authority: { mayAdvanceToClosing: true },
        unresolvedContingencies: false,
      };

      const command = resolveAvailableCommand(ctx);

      expect(command.type).not.toBe('advance_to_closing');
    });
  });

  // === FAILED TRANSACTION ===

  describe('failed transaction cannot advance', () => {
    it('agent cannot advance failed transaction', () => {
      const ctx: DecisionContext = {
        actorId: 'agent_8',
        role: 'agent',
        transactionState: 'failed',
        closingReadiness: 'ready',
        authority: { mayAdvanceToClosing: true },
        unresolvedContingencies: false,
      };

      const command = resolveAvailableCommand(ctx);

      expect(command.type).not.toBe('advance_to_closing');
    });
  });

  // === BLOCKING REASON OVERRIDES AUTHORITY ===

  describe('blocking reason overrides authority', () => {
    it('blocks even with full authority and readiness', () => {
      const ctx: DecisionContext = {
        actorId: 'agent_9',
        role: 'agent',
        transactionState: 'under_contract',
        closingReadiness: 'blocked',
        authority: { mayAdvanceToClosing: true },
        unresolvedContingencies: false,
        blockingReason: 'Title defect detected',
      };

      const command = resolveAvailableCommand(ctx);

      expect(command.type).toBe('none');
      expect(command).toHaveProperty('reason', 'Title defect detected');
    });
  });

  // === UNRESOLVED CONTINGENCIES BLOCK ===

  describe('unresolved contingencies prevent advance', () => {
    it('ready but with contingencies prevents advance', () => {
      const ctx: DecisionContext = {
        actorId: 'agent_10',
        role: 'agent',
        transactionState: 'under_contract',
        closingReadiness: 'not_ready',
        authority: { mayAdvanceToClosing: true },
        unresolvedContingencies: true,
      };

      const command = resolveAvailableCommand(ctx);

      expect(command.type).not.toBe('advance_to_closing');
    });
  });

  // === EDGE CASE: MULTIPLE ATTESTATION TYPES ===

  describe('only one attestation at a time', () => {
    it('returns only first attestation type if multiple available', () => {
      const ctx: DecisionContext = {
        actorId: 'multi_role',
        role: 'lender',
        transactionState: 'under_contract',
        closingReadiness: 'not_ready',
        authority: {
          mayIssueAttestation: ['LoanClearedToClose', 'OtherAttestation'],
        },
        unresolvedContingencies: false,
      };

      const command = resolveAvailableCommand(ctx);

      if (command.type === 'issue_attestation') {
        // Should return first only
        expect(command.attestationType).toBe('LoanClearedToClose');
      }
    });
  });

  // === EMPTY AUTHORITY SCOPE ===

  describe('empty authority scope', () => {
    it('empty scope results in no command', () => {
      const ctx: DecisionContext = {
        actorId: 'no_auth',
        role: 'agent',
        transactionState: 'under_contract',
        closingReadiness: 'ready',
        authority: {}, // Empty
        unresolvedContingencies: false,
      };

      const command = resolveAvailableCommand(ctx);

      expect(command.type).toBe('none');
    });
  });
});
