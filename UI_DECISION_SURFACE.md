# UI Decision Surface Documentation

## Overview

The RealEstate-OS UI is not a traditional interface. It is an **execution surface** where:

- **Authority** determines what you can see
- **State** determines what you can do
- **Command** is the only write path

This architecture makes illegal actions **unrenderable**, not just disabled.

## Core Principle

**The UI may only present actions that are legally possible right now.**

This means:
- ✅ No disabled buttons
- ✅ No "almost ready" states
- ✅ No persuasion
- ✅ No ambiguity
- ✅ One primary action at a time

If a button exists, it **must succeed**. If it cannot succeed, it **must not exist**.

## Architecture Layers

### 1. Truth Layer (Read-Only)

All UI components derive their state from:
- Event-sourced transaction state
- Authority relationships (temporal)
- Closing readiness (computed)
- Federation attestations (signed)

**Components:**
- `RealityStrip` - Always-visible status band
- `ReadinessLattice` - Vertical checklist of requirements
- `BlockingPanel` - Explanation of why not ready
- Role-specific panels (agent, lender, title, insurance)

### 2. Authority Layer (Contextual)

Access is **not** role-based. It is **authority-based**.

Authority is derived from:
- Temporal relationships (who represents whom, when)
- State machines (what state allows what actions)
- Federation grants (what external nodes may attest)

**Example:**
```typescript
// Authority checked at runtime, not deployment
const authority = await getAuthorityScope(actorId, transactionId);

if (authority.may_advance_state) {
  // Show "Proceed to Closing" button
} else {
  // Show read-only view
}
```

### 3. Command Layer (Write Path)

**Only one component writes:** `CommandRail`

The CommandRail:
- Shows at most one primary action
- Resolves available command based on role + state + readiness
- Executes command on click (no confirmation modal)
- Requires justification for critical actions

## Shared UI Primitives

### RealityStrip

**Purpose:** Always-visible truth banner at top of screen

**Props:**
```typescript
interface RealityStripProps {
  transactionState: TransactionState;
  readinessState: ClosingReadinessState;
  authorityValid: boolean;
}
```

**Visual:**
```
┌───────────────────────────────────────────────────────┐
│ STATE: Under Contract │ READY: ✓ │ AUTH: Valid │
└───────────────────────────────────────────────────────┘
```

**Color encoding:**
- Green: Ready / Valid
- Amber: Conditional / Warning
- Red: Blocked / Invalid
- Gray: Waiting / Unknown

**No icons. No text blocks. Color only.**

### ReadinessLattice

**Purpose:** Vertical checklist of closing requirements (computed, not editable)

**Props:**
```typescript
interface ReadinessLatticeProps {
  result: ClosingReadinessResult;
  onRequirementClick?: (requirement: {
    type: string;
    attestation_id?: string;
  }) => void;
}
```

**Visual:**
```
[✓] Funds Cleared        (Lender)
[✓] Title Clear         (Title)
[!] Insurance Binder    (Conditional)
[✓] Authority Valid     (Brokerage)
[✓] Contingencies Done
```

**Status indicators:**
- ✓ (green) - Satisfied
- ! (amber) - Conditional (review required)
- ✗ (red) - Missing

Each line is **clickable** → shows source attestation with:
- Issuing node
- Timestamp
- Signature verification
- Expiration (if applicable)

### BlockingPanel

**Purpose:** Explain why not ready (plain language, no blame)

**Props:**
```typescript
interface BlockingPanelProps {
  result: ClosingReadinessResult;
}
```

**Visual:**
```
Closing is blocked because:
• Insurance Binder is conditional and expires in 3 days.
• Title company has not attested to clearance.
```

**Rules:**
- Only shown if `result.state !== 'ready'`
- No blame language ("Title failed" → "Title has not attested")
- No suggestions ("Contact title" → just facts)

### CommandRail

**Purpose:** Single action rail on right side of screen

**Props:**
```typescript
interface CommandRailProps {
  action: CommandAction;
}
```

**Command resolution function:**
```typescript
function getCommandAction(
  role: 'agent' | 'lender' | 'title' | 'insurance',
  result: ClosingReadinessResult,
  callbacks: {
    onProceedToClosing?: () => void;
    onAttest?: (type: string) => void;
    onWithdraw?: (type: string) => void;
  }
): CommandAction
```

**Visual:**
```
┌─────────────────┐
│                 │
│  [Action Label] │
│                 │
└─────────────────┘
```

**Rules:**
- At most **one primary action** at a time
- No confirmation modals - button itself is confirmation
- Critical actions require 1-sentence justification (inline)
- If no action available, rail shows explanation

## Role-Specific Decision Surfaces

### Agent Decision Surface

**Route:** `/transactions/[id]/agent`

**Authority:** Command authority (full transaction view)

**What they see:**
- Full transaction state
- Readiness lattice
- Timeline
- Contingencies
- Counterfactual simulation (agent-only)

**What they can do:**
- Proceed to closing (if ready)
- Review conditions (if conditional)

**Command Rail states:**
- Ready: `✓ Proceed to Closing` (green)
- Conditional: `⚠ Review Conditions` (amber, disabled)
- Waiting: `Waiting on Partners` (gray, disabled)

### Lender Decision Surface

**Route:** `/transactions/[id]/lender`

**Authority:** Attestation-only (limited view)

**What they see:**
- Transaction state (binary)
- Contingency status (binary)
- Property fingerprint (hashed)
- Title status (binary)
- Insurance status (binary)

**What they DO NOT see:**
- Offer prices
- Agent communications
- Seller strategy
- Buyer identity (beyond credit check)

**What they can do:**
- Attest "Loan Cleared to Close"
- Withdraw financing (with justification)

**Command Rail states:**
- Not attested: `✓ Loan Cleared to Close` (green)
- Already attested: `⛔ Withdraw Financing` (red)

### Title Decision Surface

**Route:** `/transactions/[id]/title`

**Authority:** Verification-only (ownership chain focus)

**What they see:**
- Property identity (fingerprint)
- Ownership chain (derived)
- Authority grants
- Known encumbrances (abstracted)

**What they DO NOT see:**
- Offer amounts
- Financing details
- Negotiation history

**What they can do:**
- Attest "Title Clear to Close"
- Report title defect (blocks readiness)

**Command Rail states:**
- Not attested: `✓ Title Clear to Close` (green)
- Already attested: `⛔ Report Title Defect` (red)

**Critical:** Reporting a defect:
- Immediately blocks readiness
- Propagates across federation
- Appears in audit narrative

### Insurance Decision Surface

**Route:** `/transactions/[id]/insurance`

**Authority:** Risk acceptance (property focus)

**What they see:**
- Property facts (abstracted)
- Title status (binary)
- Transaction state
- Risk factors (binary)

**What they DO NOT see:**
- Buyer identity
- Financing details
- Offer amounts
- Underwriting notes (internal)
- Premium calculations (internal)

**What they can do:**
- Issue binder
- Withdraw coverage (with justification)

**Command Rail states:**
- Not issued: `✓ Issue Binder` (green)
- Already issued: `⛔ Withdraw Coverage` (red)

### Closing Coordination View

**Route:** `/transactions/[id]/closing`

**Authority:** All roles can view, only agent can command

**What everyone sees:**
- Readiness lattice (all party attestations)
- Closing timeline
- Party participation status
- Blocking conditions (if any)
- Expiration warnings

**What only agent can do:**
- Proceed to closing (if ready)

**Purpose:** Shared truth surface for multi-party coordination

## Advanced Features

### Counterfactual Simulation (Agent-Only)

**Component:** `CounterfactualSimulation`

**Purpose:** "What if" scenario analysis without affecting reality

**Visual:**
```
REALITY        SIMULATION
─────────      ──────────
Close: Mar 15  Close: Feb 10
Net: $3.12M   Net: $3.05M
Risk: 0.42    Risk: 0.21
```

**Rules:**
- Observation only - no commands
- Runs in shadow timeline
- Never affects reality
- Agent-only feature

**Scenarios:**
- Accelerate inspection
- Waive financing contingency
- Reduce price
- Alternative closing date

**Output:**
- Side-by-side comparison
- Net impact (delta)
- Risk score change

## Component Ownership Map

| Component | Owns State? | Writes Events? | Role Restriction |
|-----------|-------------|----------------|------------------|
| RealityStrip | No | No | None (all roles) |
| ReadinessLattice | No | No | None (all roles) |
| BlockingPanel | No | No | None (all roles) |
| CommandRail | Yes (ephemeral) | Yes | Role-specific |
| CounterfactualSimulation | Yes (ephemeral) | No | Agent only |
| Role Panels | No | No | Role-specific |

**Critical:** Only `CommandRail` may write events.

## Implementation Guidelines

### Server Components First

All decision surfaces are **server components** by default:

```typescript
// app/transactions/[id]/agent/page.tsx
export default async function AgentPage({ params }: AgentPageProps) {
  // Compute state server-side
  const readinessResult = await computeClosingReadiness(entityFingerprint);

  // Render with authority-bound components
  return (
    <div>
      <RealityStrip />
      <ReadinessLattice result={readinessResult} />
      <CommandRail action={commandAction} />
    </div>
  );
}
```

### Client Components (Minimal)

Only interactive components are client components:

- `CommandRail` (button click)
- `ReadinessLattice` (expandable items)
- `CounterfactualSimulation` (scenario selection)

Mark with `'use client'` directive.

### Authority Derivation

Authority is **never** hardcoded:

```typescript
// ❌ BAD
if (user.role === 'agent') {
  showProceedButton();
}

// ✅ GOOD
const authority = await getAuthorityScope(actorId, transactionId);
if (authority.may_advance_state && readinessState === 'ready') {
  showProceedButton();
}
```

### State Machine Integration

All commands **must** pass state machine validation:

```typescript
// CommandRail execution
async function executeCommand(command: CommandAction) {
  // Server action
  'use server';

  // Recompute state
  const currentState = await getTransactionState(transactionId);

  // Validate transition
  const isLegal = validateStateTransition(currentState, command.type);

  if (!isLegal) {
    throw new Error('Illegal state transition');
  }

  // Emit event
  await emitEvent({
    event_type: 'TransactionStateAdvanced',
    payload: { ... }
  });
}
```

### No Optimistic UI

**Never** update UI before server confirmation:

```typescript
// ❌ BAD
onClick={() => {
  setLoading(true); // Optimistic
  submitCommand();
}}

// ✅ GOOD
onClick={async () => {
  await submitCommand(); // Wait for server
  // UI updates via refresh
}}
```

If command fails, **UI does nothing**. Explanation updates.

## Testing Strategy

### Read Models (Pure Functions)

```typescript
describe('computeClosingReadiness', () => {
  it('returns ready when all attestations exist', () => {
    const result = computeClosingReadiness({
      lenderAttestation: mockAttestation,
      titleAttestation: mockAttestation,
      insuranceAttestation: mockAttestation,
      authorityValid: true,
      unresolvedContingencies: false,
      blockingEvents: [],
      now: new Date(),
    });

    expect(result.state).toBe('ready');
    expect(result.ready_to_close).toBe(true);
  });
});
```

### Command Resolution

```typescript
describe('getCommandAction', () => {
  it('shows proceed for agent when ready', () => {
    const action = getCommandAction('agent', readyResult, callbacks);

    expect(action.type).toBe('ready');
    expect(action.label).toBe('✓ Proceed to Closing');
    expect(action.enabled).toBe(true);
  });

  it('shows waiting for agent when not ready', () => {
    const action = getCommandAction('agent', notReadyResult, callbacks);

    expect(action.type).toBe('waiting');
    expect(action.enabled).toBe(false);
  });
});
```

### Authority Guards

```typescript
describe('authority enforcement', () => {
  it('prevents lender from seeing offer details', async () => {
    const data = await getLenderView(transactionId, lenderNodeId);

    expect(data.offer_amount).toBeUndefined();
    expect(data.negotiation_history).toBeUndefined();
    expect(data.agent_communications).toBeUndefined();
  });
});
```

## Strategic Value

This UI architecture is **not copyable** without:

1. Event-sourced ontology
2. Authority-bound state machines
3. Federation protocol
4. Closing readiness derivation
5. Cryptographic attestations

Competitors see:
- "Clean design"
- "Simple buttons"
- "Nice colors"

They miss:
- **Ontological enforcement** (state machines)
- **Authority derivation** (temporal relationships)
- **Federation isolation** (PII-free attestations)
- **Legal defensibility** (audit narratives)

This is **infrastructure dominance** disguised as UI simplicity.

## FAQ

**Q: Why no disabled buttons?**
A: Disabled buttons are **ambiguous**. "Not ready" vs "Not allowed" vs "Not yet" are different failure modes. We show **only what is lawful**, with explanations for blocking conditions.

**Q: Why only one action at a time?**
A: Multiple actions create **decision paralysis** and **coordination errors**. The system computes the **single next lawful action**. If none exists, it explains why.

**Q: Why no confirmation modals?**
A: The button itself **is** the confirmation. Critical actions require inline justification. Modals add friction without adding safety.

**Q: Why server components?**
A: **Authority must be recomputed on every request**. Client-side state is untrusted. Server components ensure fresh authority derivation.

**Q: Why no chat/notes/collaboration features?**
A: This is an **execution surface**, not a communication platform. Execution certainty requires **explicit commands**, not implicit conversations.

**Q: Can this be built with traditional CRUD?**
A: No. Authority derivation requires **temporal relationships** and **event-sourced state machines**. CRUD cannot express "who may command what, when, given current state."

---

**Status:** UI Decision Surface fully implemented
**Version:** 1.0.0
**Last Updated:** 2026-01-11
