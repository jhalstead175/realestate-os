# Execution Spine Documentation

## Overview

The **Execution Spine** is the enforcement layer that makes illegal actions impossible to render or execute.

**Core Principle:** If the spine is correct, the system is correct.

This is not a convenience layer. This is **law**.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                      UI Layer                        │
│  (Renders what the law permits, nothing more)       │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│              Command Resolution Layer                │
│  (Resolves available command based on context)      │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│             Decision Context Builder                 │
│  (9-step pipeline: events → state → authority)      │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│                Event-Sourced Truth                   │
│  (Immutable events, folded to derive state)         │
└─────────────────────────────────────────────────────┘
```

## Core Components

### 1. Types (`types.ts`)

Canonical representation of system state.

```typescript
export type TransactionState =
  | 'initiated'
  | 'qualified'
  | 'offer_issued'
  | 'under_contract'
  | 'closing'
  | 'completed'
  | 'failed';

export type ClosingReadinessState =
  | 'not_ready'
  | 'conditionally_ready'
  | 'ready'
  | 'blocked'
  | 'expired';

export type AuthorityScope = {
  mayAdvanceToClosing?: boolean;
  mayIssueAttestation?: string[];
  mayWithdrawAttestation?: string[];
};

export type DecisionContext = {
  actorId: string;
  role: 'agent' | 'lender' | 'title' | 'insurance';
  transactionState: TransactionState;
  closingReadiness: ClosingReadinessState;
  authority: AuthorityScope;
  unresolvedContingencies: boolean;
  blockingReason?: string;
};

export type CommandResolution =
  | { type: 'none'; reason: string }
  | { type: 'advance_to_closing' }
  | { type: 'issue_attestation'; attestationType: string }
  | { type: 'withdraw_attestation'; attestationType: string };
```

**CRITICAL:** Only these types exist. Extensions require architectural review.

### 2. Event Folding (`eventFolding.ts`)

Pure functions that fold events to derive state.

**Key Functions:**

- `foldTransactionState(events)` - Derive current transaction state
- `foldAuthority(events, now)` - Derive authority scope with temporal validation
- `deriveRoleFromAuthority(authority)` - **Derive role from authority (not user metadata)**
- `detectBlockingEvent(events, attestations)` - Find blocking conditions
- `hasUnresolvedContingencies(events)` - Check for unresolved contingencies

**Properties:**
- Pure (no side effects)
- Defensive (ignores malformed data)
- Deterministic (same input = same output)

### 3. Decision Context Builder (`buildContext.ts`)

The **only** function allowed to assemble `DecisionContext`.

**9-Step Pipeline:**

1. **Load canonical events** - Transaction-scoped events, ordered by time
2. **Derive transaction state** - Fold TransactionStateAdvanced events
3. **Load authority grants** - Actor + transaction scoped authority events
4. **Derive actor role** - **CRITICAL: derived from authority, not assumed**
5. **Load attestations** - Federation attestations from lender/title/insurance
6. **Evaluate contingencies** - Boolean check for unresolved contingencies
7. **Detect blocking events** - Find FinancingWithdrawn, TitleDefect, etc.
8. **Compute closing readiness** - Delegate to readiness state machine
9. **Assemble context** - Return complete DecisionContext

**Guarantees:**
- Runs server-side only
- Performs no writes
- Deterministic for given event log
- **Fails closed** (returns safest possible context on error)

```typescript
export async function buildDecisionContext(input: {
  actorId: string;
  transactionId: string;
}): Promise<DecisionContext>
```

### 4. Command Resolution (`commandResolution.ts`)

The **LAW**. If this is correct, the system is correct.

```typescript
export function resolveAvailableCommand(
  ctx: DecisionContext
): CommandResolution
```

**Resolution Logic:**

1. **Hard blockers dominate** - If `closingReadiness === 'blocked'`, return `none`
2. **Agent commands** - Can advance to closing if ready + authority + under_contract
3. **Attestation commands** - Lender/title/insurance can issue or withdraw attestations
4. **Priority** - Issue always before withdraw

**Properties:**
- Pure function
- Deterministic
- Exhaustive (handles all cases)
- Unit testable

### 5. API Guards (`apiGuard.ts`)

Enforcement at the endpoint layer.

**Every command endpoint MUST:**

```typescript
const ctx = await guardCommand({
  actorId: 'agent_1',
  transactionId: 'txn_123',
  expectedCommandType: 'advance_to_closing'
});
```

This:
1. Builds decision context
2. Resolves available command
3. Validates request matches law
4. Throws if illegal

**UI intent is irrelevant. Law is enforced here.**

## Failure Modes (By Design)

| Failure | Outcome |
|---------|---------|
| Missing data | `not_ready` |
| Ambiguous role | `none` (blocked) |
| Expired authority | `blocked` |
| Conflicting attestations | `blocked` |
| Partial load | `blocked` |
| Exception during build | `blocked` with reason |

**No optimistic assumptions. Ever.**

## Testing Strategy

### Unit Tests (Mandatory)

All pure functions must have unit tests:

- `foldTransactionState` - State transitions
- `foldAuthority` - Authority grants/revokes
- `computeClosingReadiness` - Readiness computation
- `deriveRoleFromAuthority` - Role derivation
- **`resolveAvailableCommand`** - Command resolution (THE LAW)

See: `__tests__/commandResolution.test.ts`

### Integration Tests

- `buildDecisionContext` happy path
- Authority revoked mid-transaction
- Lender withdraws after ready
- Concurrent attestation conflicts

## Usage Patterns

### UI Rendering

```typescript
// Server component
export default async function AgentPage({ params }) {
  const command = await getCommandResolution({
    actorId: currentUserId,
    transactionId: params.id
  });

  return (
    <CommandRail
      command={command}
      onExecute={async () => {
        // Server action with guard
      }}
    />
  );
}
```

### API Endpoint

```typescript
export async function POST(request: NextRequest) {
  const { actorId, transactionId } = await request.json();

  // Guard enforces law
  const { context, command } = await guardCommand({
    actorId,
    transactionId,
    expectedCommandType: 'advance_to_closing'
  });

  // Only executes if guard passes
  await emitEvent({
    event_type: 'TransactionStateAdvanced',
    payload: { from: context.transactionState, to: 'closing' }
  });

  return NextResponse.json({ success: true });
}
```

### Attestation Issuance

```typescript
export async function POST(request: NextRequest) {
  const { actorId, transactionId, attestationType } = await request.json();

  // Specialized guard for attestations
  const { context, command } = await guardAttestationIssuance({
    actorId,
    transactionId,
    attestationType: 'LoanClearedToClose'
  });

  // Create and sign attestation
  const attestation = await createAttestation({
    type: command.attestationType,
    entity_fingerprint: `transaction_${transactionId}`,
    // ...
  });

  return NextResponse.json({ attestation });
}
```

## Key Architectural Decisions

### 1. Role is Derived, Not Assumed

**WRONG:**
```typescript
const role = user.profile.role; // ❌ User metadata is untrusted
```

**RIGHT:**
```typescript
const authority = foldAuthority(authorityEvents);
const role = deriveRoleFromAuthority(authority); // ✅ Derived from events
```

Role is a **projection** of authority, not a property.

### 2. State is Folded, Not Queried

**WRONG:**
```typescript
const state = await db.query('SELECT state FROM transactions WHERE id = ?'); // ❌ Mutable state
```

**RIGHT:**
```typescript
const events = await loadEvents({ entityId: transactionId });
const state = foldTransactionState(events); // ✅ Derived from events
```

State is **derived**, not stored.

### 3. Commands are Enumerated, Not Open-Ended

**WRONG:**
```typescript
type CommandResolution = {
  type: string; // ❌ Unbounded
  payload: any;
};
```

**RIGHT:**
```typescript
type CommandResolution =
  | { type: 'none'; reason: string }
  | { type: 'advance_to_closing' }
  | { type: 'issue_attestation'; attestationType: string }
  | { type: 'withdraw_attestation'; attestationType: string }; // ✅ Closed set
```

If a command doesn't exist in the enum, it **cannot exist**.

### 4. Failures are Explicit, Not Silent

**WRONG:**
```typescript
if (!authority) {
  return { /* optimistic defaults */ }; // ❌ Silent failure
}
```

**RIGHT:**
```typescript
if (!authority) {
  return createBlockedContext({
    reason: 'No valid authority'
  }); // ✅ Explicit block
}
```

**Fail closed, fail loud.**

## Why This is Un-Copyable

Competitors see:
- "Clean button logic"
- "Role-based permissions"
- "State machine"

They miss:
1. **Event-sourced authority** - Temporal relationships derived from events
2. **Pure command resolution** - Deterministic, testable law
3. **Fail-closed enforcement** - No optimistic rendering
4. **Role derivation** - Not user metadata, derived from grants
5. **API-level guards** - UI cannot bypass enforcement

This requires:
- Event-sourced ontology
- Immutable event log
- Cryptographic attestations
- Temporal authority model
- State machine integration

**One spine. One truth. Uncopyable without the foundation.**

## Maintenance Guidelines

### Adding New Command Types

1. Add to `CommandResolution` type in `types.ts`
2. Update `resolveAvailableCommand` logic in `commandResolution.ts`
3. Add unit tests for new command
4. Update API guards if needed
5. Update UI components to handle new command

### Adding New Roles

1. Update authority scope definitions
2. Add role to `deriveRoleFromAuthority` logic
3. Update `resolveAvailableCommand` for role-specific logic
4. Add unit tests
5. Create role-specific decision surface

### Modifying State Transitions

1. Update `isLegalTransition` in `eventFolding.ts`
2. Update event emission logic
3. Add unit tests for new transitions
4. Audit command resolution for impacts

## Monitoring & Observability

### Metrics to Track

- `execution_spine.context_build_time` - Time to build context
- `execution_spine.context_build_errors` - Failed context builds
- `execution_spine.command_guard_rejections` - Illegal command attempts
- `execution_spine.role_derivation_failures` - Ambiguous authority

### Logging

```typescript
console.error('buildDecisionContext failed:', {
  actorId,
  transactionId,
  error: error.message,
  stack: error.stack
});
```

All execution spine errors should be logged and alerted.

## Migration Path

### Phase 1: Parallel Execution
- Execution spine runs alongside old logic
- Compare results, log discrepancies
- No enforcement yet

### Phase 2: Shadow Enforcement
- Execution spine guards all endpoints
- Logs rejections but doesn't block
- Audit logs for illegal attempts

### Phase 3: Full Enforcement
- Remove old logic
- Execution spine is sole authority
- UI cannot bypass guards

## Status

- **Implemented:** Core types, event folding, command resolution, API guards
- **TODO:** Database queries for events/authority, full UI integration
- **Tested:** Command resolution unit tests complete
- **Status:** Ready for integration testing

---

**Version:** 1.0.0
**Last Updated:** 2026-01-11
**Architectural Status:** CANONICAL
