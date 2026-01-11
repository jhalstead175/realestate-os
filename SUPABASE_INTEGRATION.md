# Supabase Integration - Execution Spine

## Overview

This document describes the Supabase + Next.js integration for the Execution Spine enforcement layer.

The execution spine is now connected to real database queries instead of mocks.

## Architecture

```
┌─────────────────────────────────────────────────┐
│              Next.js API Routes                  │
│  (Command endpoints with guard enforcement)     │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│           Execution Spine (lib/execution/)       │
│  buildDecisionContext → resolveAvailableCommand  │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│          Database Layer (lib/db/)                │
│  events | authorities | attestations             │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│                 Supabase                         │
│  events table | federation_attestations table    │
└──────────────────────────────────────────────────┘
```

## Database Access Layer

### Location: `lib/db/`

Three modules, each with single responsibility:

#### 1. Events (`lib/db/events.ts`)

**Read:**
- `loadTransactionEvents(transactionId)` - Load events for transaction
- `loadEvents({ entityType, entityId })` - Generic event loader

**Write:**
- `emitEvent(event)` - **ONLY** write operation in database layer

**Schema:**
```sql
events (
  id uuid primary key,
  entity_type text,
  entity_id text,
  event_type text,
  payload jsonb,
  actor_id text,
  occurred_at timestamp
)
```

#### 2. Authorities (`lib/db/authorities.ts`)

**Read:**
- `loadAuthorityEvents({ actorId, transactionId })` - Load authority grants/revokes

**Write:**
- `grantAuthority(params)` - Emit AuthorityGranted event
- `revokeAuthority(params)` - Emit AuthorityRevoked event

**Events:**
- `AuthorityGranted` - Grants scope to actor for transaction
- `AuthorityRevoked` - Revokes all authority from actor

#### 3. Attestations (`lib/db/attestations.ts`)

**Read:**
- `loadAttestations(transactionId)` - Load all attestations for transaction
- `getLatestAttestation({ transactionId, attestationType })` - Get most recent attestation

**Write:**
- `storeAttestation(params)` - Store federation attestation

**Schema:**
```sql
federation_attestations (
  id uuid primary key,
  entity_fingerprint text,
  attestation_type text,
  payload jsonb,
  signature text,
  from_node_id text,
  attested_at timestamp
)
```

## Execution Spine Integration

### buildDecisionContext (Updated)

**Location:** `lib/execution/buildContext.ts`

Now uses real database queries instead of mocks:

```typescript
import { loadEvents } from '@/lib/db/events';
import { loadAuthorityEvents } from '@/lib/db/authorities';
import { loadAttestations } from '@/lib/db/attestations';

export async function buildDecisionContext(input: {
  actorId: string;
  transactionId: string;
}): Promise<DecisionContext> {
  // STEP 1: Load canonical events (real DB query)
  const events = await loadEvents({
    entityType: 'Transaction',
    entityId: transactionId,
  });

  // STEP 2: Derive transaction state (pure function)
  const transactionState = foldTransactionState(events);

  // STEP 3: Load authority grants (real DB query)
  const authorityEvents = await loadAuthorityEvents({
    actorId,
    transactionId,
  });

  // STEP 4: Fold authority (pure function)
  const authority = foldAuthority(authorityEvents);

  // STEP 5: Derive role (pure function)
  const role = deriveRoleFromAuthority(authority);

  // ... continue pipeline
}
```

## Command API Endpoints

### Location: `app/api/commands/`

Three enforcement gates:

#### 1. Advance to Closing

**Endpoint:** `POST /api/commands/advance-to-closing`

**Request:**
```json
{
  "actorId": "agent_1",
  "transactionId": "txn_123",
  "justification": "All readiness conditions met"
}
```

**Enforcement:**
```typescript
const { context, command } = await guardCommand({
  actorId,
  transactionId,
  expectedCommandType: 'advance_to_closing',
});
```

**Guard Logic:**
- Builds decision context from events
- Resolves available command
- If command type doesn't match → 403 Forbidden
- If matches → emits `TransactionStateAdvanced` event

#### 2. Issue Attestation

**Endpoint:** `POST /api/commands/issue-attestation`

**Request:**
```json
{
  "actorId": "lender_1",
  "transactionId": "txn_123",
  "attestationType": "LoanClearedToClose",
  "payload": { ... },
  "justification": "Funds verified"
}
```

**Enforcement:**
```typescript
const { context, command } = await guardAttestationIssuance({
  actorId,
  transactionId,
  attestationType,
});
```

**Guard Logic:**
- Verifies actor has authority to issue this attestation type
- Lender can only issue `LoanClearedToClose`
- Title can only issue `TitleClearToClose`
- Insurance can only issue `BinderIssued`

#### 3. Withdraw Attestation

**Endpoint:** `POST /api/commands/withdraw-attestation`

**Request:**
```json
{
  "actorId": "lender_1",
  "transactionId": "txn_123",
  "attestationType": "FinancingWithdrawn",
  "reason": "Appraisal came in low",
  "justification": "Required by underwriting"
}
```

**Enforcement:**
```typescript
const { context, command } = await guardAttestationWithdrawal({
  actorId,
  transactionId,
  attestationType,
});
```

**Effect:**
- Immediately blocks closing readiness
- Propagates across federation

## Fail-Closed Architecture

All layers fail closed on error:

### Database Layer
```typescript
if (error) {
  console.error('Failed to load events:', error);
  throw error; // Bubble up
}
```

### Execution Spine
```typescript
try {
  // Build context
} catch (error) {
  // Return blocked context
  return createBlockedContext({
    actorId,
    reason: 'Unable to verify authority',
  });
}
```

### API Layer
```typescript
try {
  const { context, command } = await guardCommand(...);
  // Execute
} catch (error) {
  return NextResponse.json({ success: false, error }, { status: 403 });
}
```

**No optimistic assumptions. Ever.**

## Environment Variables

Required for command execution:

```bash
# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_KEY=

# Federation (for attestations)
FEDERATION_NODE_ID=
FEDERATION_PRIVATE_KEY=
```

## Data Flow Examples

### Example 1: Agent Advances to Closing

1. **UI triggers command:**
   ```typescript
   await fetch('/api/commands/advance-to-closing', {
     method: 'POST',
     body: JSON.stringify({
       actorId: 'agent_1',
       transactionId: 'txn_123',
       justification: 'All conditions met'
     })
   });
   ```

2. **API endpoint guards:**
   - Loads events from `events` table
   - Loads authority from `events` table
   - Loads attestations from `federation_attestations` table
   - Folds transaction state from events
   - Folds authority from authority events
   - Derives role from authority
   - Computes closing readiness from attestations
   - Resolves available command
   - If `advance_to_closing` → proceed
   - Else → 403 Forbidden

3. **Event emitted:**
   ```sql
   INSERT INTO events (
     entity_type,
     entity_id,
     event_type,
     payload,
     actor_id
   ) VALUES (
     'Transaction',
     'txn_123',
     'TransactionStateAdvanced',
     '{"from_state": "under_contract", "to_state": "closing"}',
     'agent_1'
   );
   ```

4. **State derived on next read:**
   - `loadTransactionEvents('txn_123')` includes new event
   - `foldTransactionState(events)` returns `'closing'`

### Example 2: Lender Issues Attestation

1. **UI triggers:**
   ```typescript
   await fetch('/api/commands/issue-attestation', {
     method: 'POST',
     body: JSON.stringify({
       actorId: 'lender_1',
       transactionId: 'txn_123',
       attestationType: 'LoanClearedToClose',
       payload: { loan_number: 'L123' }
     })
   });
   ```

2. **Guard enforces:**
   - Verifies lender has authority
   - Verifies attestation type matches authority
   - If doesn't match → 403

3. **Attestation created and signed:**
   ```typescript
   const attestation = await createAttestation({
     type: 'LoanClearedToClose',
     entity_fingerprint: 'transaction_txn_123',
     payload: { loan_number: 'L123' }
   }, privateKey);
   ```

4. **Stored in database:**
   ```sql
   INSERT INTO federation_attestations (
     entity_fingerprint,
     attestation_type,
     payload,
     signature,
     from_node_id
   ) VALUES (...);
   ```

5. **Closing readiness recomputed:**
   - Next `buildDecisionContext` call loads this attestation
   - `computeClosingReadiness` sees `LoanClearedToClose` present
   - Readiness state may advance to `'ready'`

## Testing

### Unit Tests
Already implemented in `lib/execution/__tests__/`:
- `eventFolding.test.ts` - Pure function tests
- `commandResolution.test.ts` - Command resolution logic
- `commandResolution.adversarial.test.ts` - Illegal action attempts

### Integration Tests
```typescript
// Test database layer
const events = await loadTransactionEvents('test_txn');
expect(events).toBeArray();

// Test full pipeline
const context = await buildDecisionContext({
  actorId: 'test_actor',
  transactionId: 'test_txn'
});
expect(context).toHaveProperty('role');
```

### API Tests
```typescript
// Test guard enforcement
const response = await fetch('/api/commands/advance-to-closing', {
  method: 'POST',
  body: JSON.stringify({
    actorId: 'unauthorized_actor',
    transactionId: 'txn_123'
  })
});
expect(response.status).toBe(403);
```

## Migration Path

### Phase 1: Parallel Execution (Current)
- Execution spine runs alongside old logic
- Database layer implemented
- Command endpoints created
- No UI binding yet

### Phase 2: Shadow Enforcement
- UI bound to execution spine
- Guards log rejections but don't block
- Audit illegal attempt logs

### Phase 3: Full Enforcement
- Remove old logic
- Execution spine is sole authority
- UI cannot bypass guards

## Monitoring

### Metrics to Track
- `db.events.load_time` - Time to load events
- `db.authorities.load_time` - Time to load authority
- `execution.context_build_time` - Time to build context
- `execution.guard_rejections` - Failed guard attempts
- `api.commands.latency` - Command API latency

### Logging
All layers log errors:
```typescript
console.error('buildDecisionContext failed:', error);
console.error('Failed to load events:', error);
console.error('Advance to closing failed:', error);
```

## Status

- ✅ Database access layer implemented
- ✅ Execution spine connected to database
- ✅ Command API endpoints created
- ✅ Guard enforcement active
- ⏳ UI binding (next phase)
- ⏳ Production testing

---

**Version:** 1.0.0
**Last Updated:** 2026-01-11
**Status:** READY FOR PHASE 2 (UI Binding)
