# RealEstate-OS Architecture

**Transaction System of Record for Enterprise Brokerages**

---

## Executive Summary

RealEstate-OS is not a CRM. It is **transaction infrastructure** that governs authority, readiness, and risk across the entire real estate closing lifecycle.

### What We Solve
- ❌ Failed closings ($10K-$50K per failure)
- ❌ Compliance exposure (regulatory fines, litigation)
- ❌ Unclear accountability (who had authority?)
- ❌ Lender/title blame loops (no source of truth)
- ❌ Automation mistakes (AI acts without approval)
- ❌ Post-mortem chaos (can't explain what happened)

### How We Solve It
- ✅ **Authority Control** - Only the right person can do the right thing at the right time
- ✅ **Closing Readiness** - See the truth of a deal in 5 seconds
- ✅ **Audit Explainability** - Explain transactions to regulators in plain English

---

## Architecture Principles

### 1. Event Sourcing (Not CRUD)

**Principle:** Events are immutable facts. State is derived.

```typescript
// ❌ CRUD (traditional CRM)
UPDATE deals SET status = 'closed' WHERE id = 123;

// ✅ Event Sourcing (RealEstate-OS)
INSERT INTO events (entity_type, entity_id, event_type, payload)
VALUES ('Transaction', '123', 'ClosingCompleted', {...});

// State is computed from events
SELECT * FROM events WHERE entity_id = '123' ORDER BY occurred_at;
```

**Why This Matters:**
- Complete audit trail (every change is a fact)
- Time travel (replay state at any moment)
- Deterministic narratives (same events = same explanation)
- Regulatory defensibility (immutable record)

---

### 2. Authority Derivation (Not Assumption)

**Principle:** Role is computed from events, never stored or assumed.

```typescript
// ❌ Traditional (role from user table)
const role = user.role; // 'agent', 'broker', etc.

// ✅ RealEstate-OS (role derived from authority events)
const authorityEvents = await loadAuthorityEvents({ actorId, transactionId });
const authority = foldAuthorityScope(authorityEvents);
const role = deriveRoleFromAuthority(authority);

// If authority is ambiguous or missing → null (fail closed)
```

**Why This Matters:**
- Can't spoof authority (role is cryptographically derived)
- Accountability (authority grants are signed events)
- Auditable (can prove who had permission when)
- Revocable (disable authority without touching user records)

---

### 3. Fail-Closed Enforcement (Not Fail-Open)

**Principle:** When in doubt, deny. Never guess. Never assume.

```typescript
// ❌ Optimistic (fail-open)
if (user.role === 'agent') {
  // Assume they can advance to closing
  advanceToClosing();
}

// ✅ Fail-Closed (RealEstate-OS)
const decisionContext = await buildDecisionContext({ actorId, transactionId });
const command = resolveAvailableCommand(decisionContext);

if (command.type === 'advance_to_closing') {
  // Legal action - proceed
  advanceToClosing();
} else {
  // Illegal action - reject
  return { error: command.reason };
}
```

**Why This Matters:**
- No premature closings (readiness enforced)
- No unauthorized actions (authority verified)
- No automation overreach (enforcement re-entry)
- Reduced liability (system prevents illegal actions)

---

### 4. Federated Sovereignty (Not Integration)

**Principle:** External nodes propose, never command. No shared mutability.

```typescript
// ❌ Integration (lender writes to your DB)
lenderAPI.onApproval((loan) => {
  db.update({ status: 'approved', loan_id: loan.id });
});

// ✅ Federation (lender submits signed fact)
federationAPI.onLenderEvent((event) => {
  // Verify signature
  if (!verifySignature(event)) throw new Error('Invalid signature');

  // Insert to immutable log (proposal, not command)
  await insertFederatedEvent(event);

  // Interpret → automation proposal
  const interpretation = interpretLenderEvent(event);

  // Proposal flows through enforcement spine
  await handleProposedCommand(interpretation);
});
```

**Why This Matters:**
- External nodes can't mutate your state
- All interactions are signed (accountability)
- No 'he said / she said' (cryptographic proof)
- You own your reality (they inform, don't control)

---

### 5. Deterministic Narratives (Not Logs)

**Principle:** Audit narratives are projections, not reconstructions.

```typescript
// ❌ Activity Log (what happened)
SELECT * FROM audit_log ORDER BY created_at DESC;

// ✅ Audit Narrative (why it happened)
const narrative = await generateAuditNarrative({ decisionContext, dealId });

// Same events → same narrative (deterministic)
// Every statement traceable to signed event
// Reproducible by any authorized party
```

**Why This Matters:**
- Regulatory defensibility ("this is what we give regulators")
- Litigation readiness (timeline + authority chain)
- Executive clarity (plain English, not database dumps)
- Replayability (verify conclusions independently)

---

## System Components

### Core Execution Spine

**Location:** `apps/web/lib/execution/`

#### Types (`types.ts`)
- `TransactionState` - Canonical deal states
- `ClosingReadinessState` - Derived meta-state
- `AuthorityScope` - What an actor can do
- `DecisionContext` - Complete context for command resolution
- `CommandResolution` - THE LAW (available actions)

#### Event Folding (`eventFolding.ts`)
Pure functions that derive state from events:
- `foldTransactionState()` - Compute current state
- `foldAuthorityScope()` - Derive actor permissions
- `deriveRoleFromAuthority()` - Compute role (agent/lender/title/insurance)
- `deriveClosingReadiness()` - Aggregate readiness from nodes

#### Decision Context Builder (`buildContext.ts`)
9-step pipeline that assembles complete context:
1. Load canonical events
2. Derive transaction state
3. Load authority grants
4. Derive actor role
5. Load federated assertions
6. Derive closing readiness
7. Identify blockers
8. Resolve available commands
9. Return immutable context

**Critical:** This is the ONLY function allowed to build `DecisionContext`

#### Command Resolution (`commandResolution.ts`)
Pure function that returns exactly one command:
```typescript
export function resolveAvailableCommand(ctx: DecisionContext): CommandResolution {
  // 1. Hard blockers dominate
  if (ctx.closingReadiness === 'blocked') {
    return { type: 'none', reason: ctx.blockingReason };
  }

  // 2. Agent commands
  if (ctx.role === 'agent' && ctx.transactionState === 'under_contract' &&
      ctx.closingReadiness === 'ready' && ctx.authority.mayAdvanceToClosing) {
    return { type: 'advance_to_closing' };
  }

  // 3. Lender/title/insurance attestations
  // ...

  return { type: 'none', reason: 'No applicable action' };
}
```

---

### Federation Layer

**Location:** `apps/web/lib/federation/`

#### Federated Nodes
External systems (lender, title, insurance) with:
- `node_id` - Unique identifier
- `public_key` - Cryptographic identity
- `allowed_event_types` - Explicit trust boundaries
- `enabled` - Revocable participation

#### Federated Events
Signed facts from external nodes:
- Immutable (append-only log)
- Non-authoritative by default (inputs, not commands)
- Signature verified (hard reject if invalid)
- Interpreted to automation proposals

#### Event Intake APIs
- `/api/federation/lender/events` - Loan status, conditions, clear-to-close
- `/api/federation/title/events` - Title reports, exceptions, clearance
- `/api/federation/insurance/events` - Policy binding, coverage changes

Each API enforces:
1. Node identity verification
2. Event type authorization
3. Signature verification
4. Immutable log insertion
5. **No side effects** (intake ≠ execution)

#### Event Interpretation
Maps external facts to internal proposals:
```typescript
interpretLenderEvent(event) → {
  proposedCommand: { type: 'FLAG_LENDER_CONDITIONS', payload: {...} },
  readinessImpact: { node: 'lender_approval', satisfied: false },
  requiresHumanReview: true
}
```

---

### Automation System

**Location:** `apps/web/lib/automation/`

#### Core Principle
**Agents observe → interpret → recommend**
**Humans command**
**System executes with enforcement**

#### Automation Registry
Static, declarative spec (not user config):
```typescript
{
  id: 'request-missing-docs',
  triggerEvents: ['CONTRACT_ACCEPTED'],
  agent: 'doc-collector',
  autoApprove: false // Requires human approval
}
```

#### Automation Flow
1. Event committed → `afterEventCommit` hook
2. Select matching automations → `selectAutomations()`
3. Enqueue agent run → `enqueueAgentRun()`
4. Agent invocation → `runAgent()` with decision context
5. Agent proposes command
6. Proposal validation → `handleProposedCommand()` (enforcement re-entry)
7. If auto-approve: execute. If not: human inbox.

#### Dead-Letter Queue
All automation failures captured:
- `automation_dead_letters` table
- Full input snapshot
- Error stack trace
- Failure stage (agent_invocation, proposal_generation, etc.)
- Replayable with context

---

### MLS Coexistence

**Location:** `apps/web/lib/mls/`

#### Core Principle
**MLS is advisory, never authoritative**

#### Architecture
- `mls_snapshots` - Append-only log of MLS data
- `mls_sources` - Configuration for MLSs
- `mls_attributions` - Link transactions to listings (association, not dependency)

#### Translation Layer (Critical Moat)
```typescript
interpretMLSSnapshot(snapshot) → {
  inferredStatus: 'active',
  price: 499000,
  mlsStatus: 'active', // Advisory only
  propertyAddress: '123 Main St'
}

compareMLSWithInternal('active', 'under_contract') → {
  conflict: true,
  reason: 'MLS shows Active but deal is Under Contract internally'
}
```

**When MLS says "Active" and RealEstate-OS says "Under Contract":**
→ RealEstate-OS wins internally

---

### Audit Narrative Generator

**Location:** `apps/web/lib/narrative/`

#### Purpose
Generate deterministic, plain-English narratives from event streams.

#### Structure
```typescript
{
  summary: { propertyAddress, currentState, closingReadiness, blockingIssues },
  timeline: [ { timestamp, eventType, actor, action, justification, outcome, eventId } ],
  authorityChain: [ { actor, authorityGranted, grantedBy, grantedAt, eventId } ],
  readinessAnalysis: { overallStatus, reasoning, nodes: [ ... ] },
  federatedInteractions: [ { nodeId, nodeType, interactions: [ ... ] } ]
}
```

#### Key Properties
- **Deterministic:** Same events → same narrative, word for word
- **Replayable:** Any authorized party can reproduce
- **Verifiable:** Every event ID traceable to immutable log
- **Exportable:** JSON, text, PDF

#### Demo Moment
> "This is the same explanation we give regulators."

---

## UI Architecture

### Design Philosophy
**Projection-Only UI** (not interactive dashboards)

- Server components (no client-side state recalculation)
- Read-only (no accidental authority)
- Deterministic (no guesses, no spinners)
- Explainable (every red has a reason)

### Executive Closing Readiness Dashboard

**Location:** `apps/web/app/transactions/[id]/executive/`

#### Components
1. **DealHeader** - Immutable facts (address, parties, dates)
2. **ClosingReadinessScorecard** - Horizontal status bar
   - Green = satisfied
   - Red = blocking
   - Amber = fragile
3. **BlockingIssuesPanel** - True blockers with source, reason, control
4. **AtRiskPanel** - Dependencies that will block if not resolved
5. **ResolvedFoundationsPanel** - Completed items with verification
6. **FederatedAuthorityPanel** - External nodes as peers
7. **AuditConfidenceStrip** - System integrity statement

#### Data Flow
```typescript
const decisionContext = await buildDecisionContext({ actorId, transactionId });
// ↓ Single source of truth
// ↓ No component fetches independently
// ↓ No recalculation on client
return <ExecutiveDashboard context={decisionContext} />;
```

---

### Audit Narrative Page

**Location:** `apps/web/app/transactions/[id]/narrative/`

#### Purpose
Legal-grade, read-only narrative view.

#### Features
- Plain-English timeline
- Authority chain
- Readiness analysis
- Federated interactions log
- **Export Regulator Packet (PDF)** - One-click download

#### Demo Script
1. Show narrative page
2. Scroll through timeline
3. Click "Export Regulator Packet (PDF)"
4. Say: **"We can hand this to a regulator. Today."**

---

## Database Schema

### Event Sourcing Core

#### `events` table
```sql
create table events (
  id uuid primary key,
  entity_type text not null,
  entity_id uuid not null,
  event_type text not null,
  payload jsonb not null,
  actor_id text,
  occurred_at timestamptz default now()
);
```

**Critical Properties:**
- Append-only (no updates, no deletes)
- Immutable (once committed, permanent)
- Auditable (complete history)
- Replayable (derive state at any point)

---

### Federation Tables

#### `federated_nodes`
```sql
create table federated_nodes (
  node_id text primary key,
  node_type text not null check (node_type in ('lender', 'title', 'insurance')),
  public_key text not null,
  allowed_event_types text[] not null,
  enabled boolean default true
);
```

#### `federated_events`
```sql
create table federated_events (
  id uuid primary key,
  source_node text not null references federated_nodes(node_id),
  aggregate_id uuid not null,
  event_type text not null,
  payload jsonb not null,
  signature text not null,
  received_at timestamptz default now(),
  processed boolean default false
);
```

---

### Automation Tables

#### `automation_proposals`
```sql
create table automation_proposals (
  id uuid primary key,
  automation_id text not null,
  agent text not null,
  aggregate_id uuid not null,
  triggering_event_id uuid not null,
  proposed_command_type text not null,
  proposed_payload jsonb not null,
  justification text not null,
  status text check (status in ('pending', 'approved', 'rejected')) default 'pending',
  created_at timestamptz default now()
);
```

#### `automation_dead_letters`
```sql
create table automation_dead_letters (
  id uuid primary key,
  automation_id text not null,
  agent text not null,
  aggregate_id uuid not null,
  triggering_event_id uuid not null,
  failure_stage text not null,
  error_message text not null,
  error_stack text,
  input_snapshot jsonb not null,
  created_at timestamptz default now(),
  resolved boolean default false
);
```

---

## Testing Strategy

### Test Categories

#### 1. Pure Function Unit Tests
Location: `apps/web/lib/execution/__tests__/`

Tests for:
- Event folding (state derivation)
- Authority derivation (role computation)
- Command resolution (THE LAW)

**Philosophy:** Test invariants, not behavior.

Example:
```typescript
test('deriveRoleFromAuthority fails closed on ambiguous authority', () => {
  const authority = {
    mayAdvanceToClosing: true,
    mayIssueAttestation: ['LoanClearedToClose'] // Two roles!
  };

  const role = deriveRoleFromAuthority(authority);
  expect(role).toBeNull(); // Fail closed
});
```

#### 2. Integration Tests
Tests for:
- `buildDecisionContext` pipeline
- Event folding + authority derivation
- Command resolution with real events

#### 3. Adversarial Tests
Tests trying to break the system:
- Agent attempts illegal advance
- Lender tries to issue agent command
- Automation bypasses enforcement
- Replay attacks on federated events

**Philosophy:** If adversarial tests pass, system is defensible.

---

## Enterprise Sales

### Positioning

**What We Are:**
> "RealEstate-OS is a transaction system of record that governs authority, readiness, and risk across the entire real estate closing lifecycle."

**What We Are NOT:**
- Not a CRM
- Not a task manager
- Not a productivity tool
- Not "AI for real estate"

**The Killer Line:**
> "They manage activity. We govern transactions."

---

### Demo Flow (30 minutes)

1. **Start with Executive Readiness Screen** (5 min)
   - Show scorecard (green/red/amber nodes)
   - Click blocking issue
   - Say: "Every red has a reason"

2. **Show Audit Narrative** (8 min)
   - Load narrative page
   - Scroll through timeline
   - Show authority chain
   - Click "Export Regulator Packet (PDF)"
   - Say: **"This is what we give regulators"**

3. **Demonstrate Authority Enforcement** (5 min)
   - Show agent page
   - Point to grayed-out button
   - Say: "If you can't click it, the law forbids it"

4. **Show Federated Trust** (3 min)
   - Show federated authority panel
   - Say: "External nodes propose, never command"

5. **Close** (2 min)
   - Recap three pillars
   - Say: **"Can we afford NOT to use this?"**

---

### Pricing Strategy

**Per-Transaction or Per-Office** (NOT per-agent)

#### Tier 1 - Transaction Governance Core
**$50K-$150K/year**
For brokerages with 50-500 agents

#### Tier 2 - Enterprise Automation Layer
**$150K-$500K/year**
For regional & national firms

#### Tier 3 - Institutional Control Plane
**$500K-$2M+/year**
For top 1% brokerages

**ROI Proof:**
- Enterprise brokerage: 200 deals/year
- Failed closing rate: 10%
- Cost per failure: $25K
- **Annual cost of failures: $500K**
- If RealEstate-OS reduces failures by 20%: **$100K/year saved**

---

## Deployment Architecture

### Production Stack
- **Frontend:** Next.js (React Server Components)
- **Backend:** Node.js (API routes)
- **Database:** Supabase (PostgreSQL + Realtime)
- **Federation:** Signature verification (Ed25519)
- **PDF Generation:** PDFKit or external service
- **Automation:** BullMQ or Inngest (durable queue)

### Key Operational Characteristics
- **Immutable event log** (never delete events)
- **Fail-closed enforcement** (deny on error)
- **Deterministic replay** (time-travel to any state)
- **Cryptographic signatures** (all federated events)
- **Audit trail** (complete accountability)

---

## Architectural Moats

### Why This Can't Be Copied

1. **Event Sourcing Foundation**
   CRMs can't bolt this on. Requires ground-up redesign.

2. **Authority Derivation**
   Role computed from events, not stored. Fundamentally different.

3. **Federated Sovereignty**
   External nodes as peers, not integrations.

4. **Deterministic Narratives**
   Same events = same explanation. Reproducible.

5. **Fail-Closed Enforcement**
   No optimistic assumptions. Error = safest context.

---

## Conclusion

RealEstate-OS is not a CRM with event sourcing bolted on.

It is **transaction infrastructure** built from the ground up on immutable facts, derived authority, and fail-closed enforcement.

Most CRMs sell productivity.
**We sell certainty.**

Most CRMs manage activity.
**We govern transactions.**

Most CRMs provide reports.
**We provide governance.**

---

**The question isn't "Should we use this?"**
**The question is: "Can we afford not to, when the deal is real and the risk is ours?"**

---

## Quick Links

- [Enterprise Demo Script](./ENTERPRISE_DEMO_SCRIPT.md)
- [Enterprise Sales Package](./ENTERPRISE_SALES_PACKAGE.md)
- [Migrations](./supabase/migrations/)
- [Execution Spine](./apps/web/lib/execution/)
- [Federation Layer](./apps/web/lib/federation/)
- [Audit Narratives](./apps/web/lib/narrative/)
- [Executive UI](./apps/web/app/transactions/[id]/executive/)
