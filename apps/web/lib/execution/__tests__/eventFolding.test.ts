/**
 * Execution Spine - Event Folding Unit Tests
 *
 * These tests verify the LAW at the event folding level.
 * Pure functions, deterministic, no I/O.
 */

import { describe, it, expect } from '@jest/globals';
import {
  foldTransactionState,
  foldAuthority,
  deriveRoleFromAuthority,
  detectBlockingEvent,
  hasUnresolvedContingencies,
} from '../eventFolding';
import type { AuthorityScope } from '../types';

// === 1. foldTransactionState() ===

describe('foldTransactionState', () => {
  it('defaults to initiated with no events', () => {
    const state = foldTransactionState([]);
    expect(state).toBe('initiated');
  });

  it('advances only on TransactionStateAdvanced events', () => {
    const events = [
      {
        event_type: 'TransactionStateAdvanced',
        payload: { from_state: 'initiated', to_state: 'qualified' },
        occurred_at: new Date(),
      },
      {
        event_type: 'SomeOtherEvent',
        payload: {},
        occurred_at: new Date(),
      },
    ];

    const state = foldTransactionState(events);
    expect(state).toBe('qualified');
  });

  it('ignores illegal transitions', () => {
    const events = [
      {
        event_type: 'TransactionStateAdvanced',
        payload: { from_state: 'initiated', to_state: 'qualified' },
        occurred_at: new Date(),
      },
      {
        // Illegal: cannot go from qualified to closing
        event_type: 'TransactionStateAdvanced',
        payload: { from_state: 'qualified', to_state: 'closing' },
        occurred_at: new Date(),
      },
    ];

    const state = foldTransactionState(events);
    // Should stay at qualified (illegal transition ignored)
    expect(state).toBe('qualified');
  });

  it('handles multiple valid transitions sequentially', () => {
    const events = [
      {
        event_type: 'TransactionStateAdvanced',
        payload: { to_state: 'qualified' },
        occurred_at: new Date('2026-01-01'),
      },
      {
        event_type: 'TransactionStateAdvanced',
        payload: { to_state: 'offer_issued' },
        occurred_at: new Date('2026-01-02'),
      },
      {
        event_type: 'TransactionStateAdvanced',
        payload: { to_state: 'under_contract' },
        occurred_at: new Date('2026-01-03'),
      },
    ];

    const state = foldTransactionState(events);
    expect(state).toBe('under_contract');
  });

  it('terminal states cannot advance further', () => {
    const events = [
      {
        event_type: 'TransactionStateAdvanced',
        payload: { to_state: 'qualified' },
        occurred_at: new Date('2026-01-01'),
      },
      {
        event_type: 'TransactionStateAdvanced',
        payload: { to_state: 'offer_issued' },
        occurred_at: new Date('2026-01-02'),
      },
      {
        event_type: 'TransactionStateAdvanced',
        payload: { to_state: 'under_contract' },
        occurred_at: new Date('2026-01-03'),
      },
      {
        event_type: 'TransactionStateAdvanced',
        payload: { to_state: 'closing' },
        occurred_at: new Date('2026-01-04'),
      },
      {
        event_type: 'TransactionStateAdvanced',
        payload: { to_state: 'completed' },
        occurred_at: new Date('2026-01-05'),
      },
      {
        // Illegal: completed is terminal
        event_type: 'TransactionStateAdvanced',
        payload: { to_state: 'failed' },
        occurred_at: new Date('2026-01-06'),
      },
    ];

    const state = foldTransactionState(events);
    expect(state).toBe('completed');
  });
});

// === 2. foldAuthority() ===

describe('foldAuthority', () => {
  it('authority granted then active', () => {
    const events = [
      {
        event_type: 'AuthorityGranted',
        payload: {
          actor_id: 'agent_1',
          scope: ['advance_to_closing'],
          valid_from: '2026-01-01',
          valid_until: '2026-12-31',
        },
        occurred_at: new Date('2026-01-01'),
      },
    ];

    const now = new Date('2026-06-01');
    const authority = foldAuthority(events, now);

    expect(authority.mayAdvanceToClosing).toBe(true);
  });

  it('authority revoked overrides grant', () => {
    const events = [
      {
        event_type: 'AuthorityGranted',
        payload: {
          actor_id: 'agent_1',
          scope: ['advance_to_closing'],
        },
        occurred_at: new Date('2026-01-01'),
      },
      {
        event_type: 'AuthorityRevoked',
        payload: {
          actor_id: 'agent_1',
        },
        occurred_at: new Date('2026-01-02'),
      },
    ];

    const authority = foldAuthority(events);

    expect(authority).toEqual({});
  });

  it('expired authority is inactive', () => {
    const events = [
      {
        event_type: 'AuthorityGranted',
        payload: {
          actor_id: 'agent_1',
          scope: ['advance_to_closing'],
          valid_from: '2026-01-01',
          valid_until: '2026-01-31',
        },
        occurred_at: new Date('2026-01-01'),
      },
    ];

    const now = new Date('2026-02-01'); // After expiration
    const authority = foldAuthority(events, now);

    expect(authority).toEqual({});
  });

  it('not yet valid authority is inactive', () => {
    const events = [
      {
        event_type: 'AuthorityGranted',
        payload: {
          actor_id: 'agent_1',
          scope: ['advance_to_closing'],
          valid_from: '2026-06-01',
        },
        occurred_at: new Date('2026-01-01'),
      },
    ];

    const now = new Date('2026-01-15'); // Before valid_from
    const authority = foldAuthority(events, now);

    expect(authority).toEqual({});
  });

  it('multiple grants merge scopes', () => {
    const events = [
      {
        event_type: 'AuthorityGranted',
        payload: {
          actor_id: 'agent_1',
          scope: ['advance_to_closing'],
        },
        occurred_at: new Date('2026-01-01'),
      },
      {
        event_type: 'AuthorityGranted',
        payload: {
          actor_id: 'agent_1',
          scope: ['issue_LoanClearedToClose'],
        },
        occurred_at: new Date('2026-01-02'),
      },
    ];

    const authority = foldAuthority(events);

    expect(authority.mayAdvanceToClosing).toBe(true);
    expect(authority.mayIssueAttestation).toContain('LoanClearedToClose');
  });

  it('converts scope strings to authority structure', () => {
    const events = [
      {
        event_type: 'AuthorityGranted',
        payload: {
          actor_id: 'lender_1',
          scope: [
            'issue_LoanClearedToClose',
            'withdraw_FinancingWithdrawn',
          ],
        },
        occurred_at: new Date(),
      },
    ];

    const authority = foldAuthority(events);

    expect(authority.mayIssueAttestation).toContain('LoanClearedToClose');
    expect(authority.mayWithdrawAttestation).toContain('FinancingWithdrawn');
  });
});

// === 3. deriveRoleFromAuthority() ===

describe('deriveRoleFromAuthority', () => {
  it('agent role from mayAdvanceToClosing', () => {
    const authority: AuthorityScope = {
      mayAdvanceToClosing: true,
    };

    const role = deriveRoleFromAuthority(authority);
    expect(role).toBe('agent');
  });

  it('lender role from LoanClearedToClose authority', () => {
    const authority: AuthorityScope = {
      mayIssueAttestation: ['LoanClearedToClose'],
    };

    const role = deriveRoleFromAuthority(authority);
    expect(role).toBe('lender');
  });

  it('title role from TitleClearToClose authority', () => {
    const authority: AuthorityScope = {
      mayIssueAttestation: ['TitleClearToClose'],
    };

    const role = deriveRoleFromAuthority(authority);
    expect(role).toBe('title');
  });

  it('insurance role from BinderIssued authority', () => {
    const authority: AuthorityScope = {
      mayIssueAttestation: ['BinderIssued'],
    };

    const role = deriveRoleFromAuthority(authority);
    expect(role).toBe('insurance');
  });

  it('fails closed on multiple role matches', () => {
    const authority: AuthorityScope = {
      mayAdvanceToClosing: true,
      mayIssueAttestation: ['LoanClearedToClose'],
    };

    const role = deriveRoleFromAuthority(authority);
    // Ambiguous → null
    expect(role).toBeNull();
  });

  it('fails closed on no role matches', () => {
    const authority: AuthorityScope = {};

    const role = deriveRoleFromAuthority(authority);
    expect(role).toBeNull();
  });

  it('fails closed on unknown attestation type', () => {
    const authority: AuthorityScope = {
      mayIssueAttestation: ['UnknownAttestationType'],
    };

    const role = deriveRoleFromAuthority(authority);
    expect(role).toBeNull();
  });
});

// === 4. detectBlockingEvent() ===

describe('detectBlockingEvent', () => {
  it('detects FinancingWithdrawn', () => {
    const events = [
      {
        event_type: 'FinancingWithdrawn',
        payload: {},
        occurred_at: new Date(),
      },
    ];

    const blocking = detectBlockingEvent(events, []);
    expect(blocking).not.toBeNull();
    expect(blocking?.reason).toContain('Financing has been withdrawn');
  });

  it('detects TitleDefectDetected', () => {
    const events = [
      {
        event_type: 'TitleDefectDetected',
        payload: {},
        occurred_at: new Date(),
      },
    ];

    const blocking = detectBlockingEvent(events, []);
    expect(blocking).not.toBeNull();
    expect(blocking?.reason).toContain('Title defect detected');
  });

  it('detects CoverageWithdrawn', () => {
    const events = [
      {
        event_type: 'CoverageWithdrawn',
        payload: {},
        occurred_at: new Date(),
      },
    ];

    const blocking = detectBlockingEvent(events, []);
    expect(blocking).not.toBeNull();
    expect(blocking?.reason).toContain('Insurance coverage has been withdrawn');
  });

  it('detects AuthorityRevoked', () => {
    const events = [
      {
        event_type: 'AuthorityRevoked',
        payload: {},
        occurred_at: new Date(),
      },
    ];

    const blocking = detectBlockingEvent(events, []);
    expect(blocking).not.toBeNull();
    expect(blocking?.reason).toContain('Authority has been revoked');
  });

  it('detects ContingencyFailed', () => {
    const events = [
      {
        event_type: 'ContingencyFailed',
        payload: {},
        occurred_at: new Date(),
      },
    ];

    const blocking = detectBlockingEvent(events, []);
    expect(blocking).not.toBeNull();
    expect(blocking?.reason).toContain('Contingency has failed');
  });

  it('returns null when no blocking events', () => {
    const events = [
      {
        event_type: 'TransactionStateAdvanced',
        payload: {},
        occurred_at: new Date(),
      },
    ];

    const blocking = detectBlockingEvent(events, []);
    expect(blocking).toBeNull();
  });

  it('checks attestations for blocking events', () => {
    const attestations = [
      {
        event_type: 'FinancingWithdrawn',
        payload: {},
        occurred_at: new Date(),
      },
    ];

    const blocking = detectBlockingEvent([], attestations);
    expect(blocking).not.toBeNull();
  });
});

// === 5. hasUnresolvedContingencies() ===

describe('hasUnresolvedContingencies', () => {
  it('returns true when contingencies created but not resolved', () => {
    const events = [
      {
        event_type: 'ContingencyCreated',
        payload: {},
        occurred_at: new Date(),
      },
    ];

    const hasUnresolved = hasUnresolvedContingencies(events);
    expect(hasUnresolved).toBe(true);
  });

  it('returns false when contingencies resolved', () => {
    const events = [
      {
        event_type: 'ContingencyCreated',
        payload: {},
        occurred_at: new Date('2026-01-01'),
      },
      {
        event_type: 'ContingencyResolved',
        payload: {},
        occurred_at: new Date('2026-01-02'),
      },
    ];

    const hasUnresolved = hasUnresolvedContingencies(events);
    expect(hasUnresolved).toBe(false);
  });

  it('returns false when contingencies failed (not unresolved)', () => {
    const events = [
      {
        event_type: 'ContingencyCreated',
        payload: {},
        occurred_at: new Date('2026-01-01'),
      },
      {
        event_type: 'ContingencyFailed',
        payload: {},
        occurred_at: new Date('2026-01-02'),
      },
    ];

    const hasUnresolved = hasUnresolvedContingencies(events);
    expect(hasUnresolved).toBe(false);
  });

  it('handles multiple contingencies', () => {
    const events = [
      {
        event_type: 'ContingencyCreated',
        payload: {},
        occurred_at: new Date('2026-01-01'),
      },
      {
        event_type: 'ContingencyCreated',
        payload: {},
        occurred_at: new Date('2026-01-02'),
      },
      {
        event_type: 'ContingencyResolved',
        payload: {},
        occurred_at: new Date('2026-01-03'),
      },
    ];

    const hasUnresolved = hasUnresolvedContingencies(events);
    expect(hasUnresolved).toBe(true); // 2 created, 1 resolved → 1 unresolved
  });

  it('returns false with no contingency events', () => {
    const events = [
      {
        event_type: 'TransactionStateAdvanced',
        payload: {},
        occurred_at: new Date(),
      },
    ];

    const hasUnresolved = hasUnresolvedContingencies(events);
    expect(hasUnresolved).toBe(false);
  });
});
