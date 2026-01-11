# Phase 2 - Enforcement-Bound UI Implementation

## Overview

Phase 2 connects the UI to the enforcement spine. The UI cannot bypass authority,  cannot assume legality, and rehydrates from events.

**Core Principle:** UI intent is irrelevant. The execution spine guards all actions.

## Architecture

```
┌──────────────────────────────────────────────────────┐
│            Server Components (Next.js)                │
│  buildDecisionContext() → resolveAvailableCommand()  │
└─────────────┬────────────────────────────────────────┘
              │ serialized DecisionContext + commands
              ▼
┌──────────────────────────────────────────────────────┐
│              Client Components                        │
│  CommandRailContainer → CommandRail → Modal          │
│  DealEventBridge → useEventStream                    │
└─────────────┬────────────────────────────────────────┘
              │ selected command + context hash
              ▼
┌──────────────────────────────────────────────────────┐
│                 API Route (Guard)                     │
│  validate context hash → emit event                   │
└─────────────┬────────────────────────────────────────┘
              │ event emitted
              ▼
┌──────────────────────────────────────────────────────┐
│              Event Stream (Supabase)                  │
│  Client observes → pending resolved → page refreshes │
└──────────────────────────────────────────────────────┘
```

## Phase 2.1 - CommandRail → Confirmation → API

### Components

#### 1. CommandConfirmModal

**Location:** `components/federation/CommandConfirmModal.tsx`

Dumb component - handles UI only. NO awareness of:
- Command type
- Authority
- State
- Readiness

```typescript
export function CommandConfirmModal({
  open,
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel
}: {...})
```

**Properties:**
- Confirmation is metadata only
- Does not change legality or behavior
- Just delays execution

#### 2. invokeCommand Helper

**Location:** `lib/api/invokeCommand.ts`

Client-side helper that:
- Does NOT retry
- Does NOT transform
- Does NOT swallow errors

```typescript
export async function invokeCommand({
  command,
  contextHash
}: {
  command: {
    type: string;
    eventType: string;
    payload: unknown;
  };
  contextHash: string;
})
```

**Error Handling:**
- Throws on non-OK response
- Lets errors bubble up
- No silent failures

#### 3. CommandRailContainer

**Location:** `components/federation/CommandRailContainer.tsx`

Stateful wrapper around CommandRail.

**Critical Properties:**
- Modal does not decide whether command exists
- Command cannot be altered
- Context hash passed through untouched
- API remains final gate

```typescript
export function CommandRailContainer({
  commands,
  contextHash
}: {
  commands: CommandDescriptor[];
  contextHash: string;
})
```

**Flow:**
1. User clicks command
2. If requires confirmation → show modal
3. Else → execute immediately
4. Execute calls `invokeCommand()`
5. API validates and executes
6. Page rehydrates

#### 4. CommandDescriptor Type

**Location:** `lib/commands/types.ts`

```typescript
export interface CommandDescriptor {
  type: string;
  label: string;
  enabled: boolean;
  eventType: string;
  payload: unknown;
  requiresConfirmation?: boolean;
  confirmationCopy?: {
    title: string;
    body: string;
    confirmLabel?: string;
  };
}
```

**Confirmation Contract:**
- Metadata only
- Does not affect legality
- Just user experience

## Phase 2.2 - Safe Optimistic UI via Event Stream Rehydration

### Hard Constraints

- ✅ UI never mutates state locally
- ✅ UI never assumes success
- ✅ Authority & legality remain server-only
- ✅ Event stream is the only state mutator
- ✅ Optimism = visual pending, not logical advancement

### Conceptual Model

```
Command Click
    ↓
API accepts command
    ↓
Event written to stream
    ↓
Client observes event (Supabase Realtime)
    ↓
Decision context rebuilt
    ↓
UI rehydrates
```

**Optimism window:** Between API accept and event observed.

### Components

#### 1. usePendingEvents Hook

**Location:** `lib/events/usePendingEvents.ts`

Ephemeral client-side registry of pending events.

```typescript
export function usePendingEvents() {
  const [pending, setPending] = useState<Set<string>>(new Set());

  function markPending(eventId: string);
  function resolve(eventId: string);

  return { pending, markPending, resolve };
}
```

**Properties:**
- NOT persisted
- NOT authoritative
- Cleared on reload

Perfect.

#### 2. useEventStream Hook

**Location:** `lib/events/useEventStream.ts`

Read-only event observation via Supabase Realtime.

```typescript
export function useEventStream({
  aggregateId,
  onEventObserved
}: {
  aggregateId: string;
  onEventObserved: (eventId: string) => void;
})
```

**Subscription:**
```typescript
supabase
  .channel(`events:${aggregateId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'events',
    filter: `entity_id=eq.${aggregateId}`
  }, (payload) => {
    onEventObserved(payload.new.id);
  })
  .subscribe();
```

**Properties:**
- Observes facts
- Does NOT interpret them
- Bubbles event ID only

#### 3. DealEventBridge Component

**Location:** `components/federation/DealEventBridge.tsx`

Headless bridge component.

```typescript
export function DealEventBridge({ aggregateId }: { aggregateId: string }) {
  const { resolve } = usePendingEvents();

  useEventStream({
    aggregateId,
    onEventObserved: (eventId) => {
      resolve(eventId);
    }
  });

  return null; // Headless
}
```

**Rehydration Flow:**
1. Event arrives
2. Pending registry updated
3. Server projection updates
4. Page revalidates
5. `buildDecisionContext()` runs again
6. New RealityStrip / CommandRail render

No client state reconciliation needed.

### Visual Optimism

**CommandRailContainer Integration:**

```typescript
const { pending: pendingEvents, markPending } = usePendingEvents();

// After command invocation:
if (res?.eventId) {
  markPending(res.eventId);
}

// Disable commands while pending:
const hasPending = pendingEvents.size > 0;

<CommandRail
  commands={commands.map(c => ({
    ...c,
    enabled: c.enabled && !hasPending
  }))}
/>
```

**Effects:**
- "Updating..." spinner can show
- Commands temporarily disabled
- Prevents double-submit

**Does NOT:**
- Unlock anything early
- Mutate state locally
- Assume success

## Enforcement Guarantees

| Layer | Guarantee |
|-------|-----------|
| UI | Can only render approved commands |
| Modal | Only delays execution |
| API | Rebuilds decision context |
| API | Revalidates command legality |
| Event Stream | Observable facts only |
| RLS | Blocks unauthorized event writes |

**Even if:**
- Modal is bypassed
- JS is tampered
- Payload is replayed
- Hash is reused

**→ Command is rejected.**

## Data Flow Example

### 1. Agent Advances to Closing

**Step 1: Server Component Renders**
```typescript
// app/deals/[id]/page.tsx
const { decisionContext, availableCommands, contextHash } =
  await buildDecisionContext({
    userId: auth.userId,
    aggregateId: params.id
  });

return (
  <>
    <DealEventBridge aggregateId={params.id} />
    <RealityStrip state={decisionContext.state} />
    <CommandRailContainer
      commands={availableCommands}
      contextHash={contextHash}
    />
  </>
);
```

**Step 2: User Clicks Command**
```typescript
// CommandRailContainer
onSelect={(cmd) => {
  if (cmd.requiresConfirmation) {
    setPending(cmd); // Show modal
  } else {
    execute(cmd); // Execute immediately
  }
}}
```

**Step 3: Command Execution**
```typescript
async function execute(cmd: CommandDescriptor) {
  const res = await invokeCommand({
    command: {
      type: cmd.type,
      eventType: cmd.eventType,
      payload: cmd.payload
    },
    contextHash
  });

  // Mark pending (optimistic UI)
  if (res?.eventId) {
    markPending(res.eventId);
  }
}
```

**Step 4: API Guard**
```typescript
// /api/commands/route.ts
const rebuilt = await buildDecisionContext(/* same inputs */);

if (rebuilt.contextHash !== contextHash) {
  throw new Error('Stale or tampered decision context');
}

const allowed = rebuilt.availableCommands.find(
  c => c.type === command.type
);

if (!allowed || !allowed.enabled) {
  throw new Error('Illegal command');
}

// Emit event
await emitEvent({
  type: command.eventType,
  payload: command.payload
});

return Response.json({ ok: true, eventId });
```

**Step 5: Event Stream**
```typescript
// useEventStream
supabase.on('INSERT', (payload) => {
  onEventObserved(payload.new.id);
});

// DealEventBridge
onEventObserved: (eventId) => {
  resolve(eventId); // Clear pending
}
```

**Step 6: Rehydration**
- Server projection updates
- Page revalidates (Next.js)
- `buildDecisionContext()` runs again
- New commands/state rendered

## Failure Modes

| Failure | Result |
|---------|--------|
| API rejects command | No eventId → no pending |
| Event delayed | UI shows "pending" |
| Event never arrives | Pending clears on reload |
| Event arrives but illegal | Impossible (API gate) |
| Duplicate event | Ignored (ID-based) |
| Network failure | Error thrown, caught by UI |
| Stale context hash | 403 from API |
| Tampering | 403 from API |

## Environment Variables

```bash
# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # For client-side realtime
SUPABASE_SERVICE_KEY=           # For server-side queries

# Federation (for attestations)
FEDERATION_NODE_ID=
FEDERATION_PRIVATE_KEY=
```

## Testing Strategy

### Unit Tests
- CommandConfirmModal renders correctly
- usePendingEvents add/remove works
- useEventStream subscribes/unsubscribes

### Integration Tests
- Command flow: click → modal → API → event → rehydrate
- Guard rejection handling
- Optimistic UI pending state

### E2E Tests
- Full transaction flow
- Multi-party attestation coordination
- Closing readiness validation

## Migration Checklist

- [x] Create CommandConfirmModal component
- [x] Create invokeCommand helper
- [x] Create CommandDescriptor type
- [x] Create CommandRailContainer
- [x] Create usePendingEvents hook
- [x] Create useEventStream hook
- [x] Create DealEventBridge component
- [x] Integrate pending events with CommandRailContainer
- [ ] Update page components to use CommandRailContainer
- [ ] Add DealEventBridge to all transaction pages
- [ ] Test command execution flow
- [ ] Test optimistic UI
- [ ] Test event stream rehydration

## Status

- ✅ Phase 2.1: CommandRail → Confirmation → API (Complete)
- ✅ Phase 2.2: Event Stream Rehydration (Complete)
- ⏳ Phase 2.3: Page Integration (Pending)
- ⏳ Phase 2.4: Production Testing (Pending)

---

**Version:** 1.0.0
**Last Updated:** 2026-01-11
**Status:** READY FOR PAGE INTEGRATION
