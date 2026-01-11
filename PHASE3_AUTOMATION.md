# Phase 3 - Micro-Automation Trigger Wiring

## Prime Directive (Frozen Law)

**Agents do not act. Agents propose.**

Commands still flow through the enforcement spine. No exceptions.

## Mental Model

```
Event committed
   ↓
Automation eligibility evaluated
   ↓
Agent invoked with immutable context
   ↓
Agent emits PROPOSED_COMMAND
   ↓
resolveAvailableCommand() re-validates
   ↓
Human OR auto-approval gate
   ↓
Command emitted as normal event
```

**Automation never skips a layer.**

## Architecture

### 1. Automation Registry

**Location:** `lib/automation/registry.ts`

Static, declarative registry of micro-automations.
- No dynamic registration
- No per-tenant logic
- This is infrastructure, not product config

```typescript
export interface AutomationSpec {
  id: string;
  triggerEvents: string[];
  agent: string;
  autoApprove: boolean;
}

export const AUTOMATIONS: AutomationSpec[] = [
  {
    id: 'request-missing-docs',
    triggerEvents: ['CONTRACT_ACCEPTED'],
    agent: 'doc-collector',
    autoApprove: false // Requires human approval
  },
  {
    id: 'notify-lender',
    triggerEvents: ['ESCROW_OPENED'],
    agent: 'lender-notify',
    autoApprove: true // Auto-approved but still enforced
  }
];
```

### 2. Automation Eligibility Filter

**Location:** `lib/automation/selectAutomations.ts`

Pure function that matches event types to automations.

```typescript
export function selectAutomations(eventType: string): AutomationSpec[] {
  return AUTOMATIONS.filter(a =>
    a.triggerEvents.includes(eventType)
  );
}
```

**This function:**
- Does NOT inspect state
- Does NOT inspect authority
- Only matches declared triggers

### 3. After Event Commit Hook

**Location:** `lib/automation/afterEventCommit.ts`

Invocation point after event is committed.

```typescript
export async function afterEventCommit(event) {
  const automations = selectAutomations(event.event_type);

  for (const automation of automations) {
    await enqueueAgentRun({
      automationId: automation.id,
      agent: automation.agent,
      eventId: event.id,
      aggregateId: event.entity_id
    });
  }
}
```

**This is durable orchestration, not async fire-and-forget.**

### 4. Agent Invocation

**Location:** `lib/automation/runAgent.ts`

Builds immutable decision context and invokes agent.

```typescript
export async function runAgent(request: AutomationRunRequest) {
  // Build decision context (enforcement spine)
  const decision = await buildDecisionContext({
    actorId: 'SYSTEM_AUTOMATION',
    transactionId: aggregateId
  });

  // Build agent context
  const agentContext: AgentContext = {
    automationId,
    triggeringEventId,
    decisionContext: decision,
    availableCommands: [] // TODO: Map from CommandResolution
  };

  // Invoke agent
  const proposal = await invokeAgent(agent, agentContext);

  return proposal;
}
```

**Critical Rule:**

Agents receive:
- Decision context
- Available commands

They do NOT infer legality.

### 5. Agent Output Contract

**Location:** `lib/automation/types.ts`

Agents cannot emit events. They emit proposed commands.

```typescript
export interface ProposedCommand {
  type: string;
  justification: string;
  payload: unknown;
}
```

**Example agent output:**
```json
{
  "type": "REQUEST_DOCUMENTS",
  "justification": "Contract accepted; required disclosures missing",
  "payload": {
    "documents": ["Lead Disclosure", "HOA Docs"]
  }
}
```

### 6. Enforcement Re-Entry

**Location:** `lib/automation/handleProposal.ts`

Proposed commands re-enter the enforcement spine.

```typescript
export async function handleProposedCommand({
  proposal,
  decisionContext,
  autoApprove
}) {
  // Re-validate via enforcement spine
  const allowedCommand = resolveAvailableCommand(decisionContext);

  if (!isLegal) {
    return { status: 'rejected', reason: 'Illegal command' };
  }

  if (!autoApprove) {
    return { status: 'awaiting-human', proposal };
  }

  return { status: 'approved', command: allowedCommand };
}
```

**Automation cannot force approval.**

### 7. Human Review Surface

**Location:** `components/automation/AutomationInbox.tsx`

Displays pending proposals that require human approval.

**Shows:**
- Triggering event
- Agent justification
- Proposed command
- Approve / Reject buttons

**Approval flow:**
- Same API as manual command
- Goes through enforcement spine
- Context hash validated

### 8. Auto-Approved Automations

Even auto-approved flows still enforce:

```
ProposedCommand
   ↓
resolveAvailableCommand()
   ↓
emitEvent()
```

**If legality changes between proposal and execution → fails safely.**

## Data Flow Example

### Automation: Request Missing Documents

**Step 1: Event Committed**
```typescript
await emitEvent({
  entity_type: 'Transaction',
  entity_id: 'txn_123',
  event_type: 'CONTRACT_ACCEPTED',
  payload: { ... }
});
```

**Step 2: After Event Commit**
```typescript
// afterEventCommit hook
const automations = selectAutomations('CONTRACT_ACCEPTED');
// Returns: [{ id: 'request-missing-docs', agent: 'doc-collector', ... }]

await enqueueAgentRun({
  automationId: 'request-missing-docs',
  agent: 'doc-collector',
  eventId: event.id,
  aggregateId: 'txn_123'
});
```

**Step 3: Agent Invocation**
```typescript
// runAgent
const decision = await buildDecisionContext({
  actorId: 'SYSTEM_AUTOMATION',
  transactionId: 'txn_123'
});

const proposal = await invokeAgent('doc-collector', {
  automationId: 'request-missing-docs',
  triggeringEventId: event.id,
  decisionContext: decision,
  availableCommands: decision.availableCommands
});
```

**Step 4: Agent Proposes**
```typescript
// Agent output
return {
  type: 'REQUEST_DOCUMENTS',
  justification: 'Contract accepted; required disclosures missing',
  payload: {
    documents: ['Lead Disclosure', 'HOA Docs']
  }
};
```

**Step 5: Proposal Validation**
```typescript
// handleProposedCommand
const allowedCommand = resolveAvailableCommand(decisionContext);

if (!isLegal) {
  return { status: 'rejected', reason: 'Illegal command' };
}

// autoApprove = false for this automation
return { status: 'awaiting-human', proposal };
```

**Step 6: Human Review**
```typescript
// AutomationInbox UI
<button onClick={() => handleApprove(proposal)}>
  Approve
</button>

// handleApprove calls same command API
await invokeCommand({
  command: {
    type: proposal.type,
    eventType: 'DocumentsRequested',
    payload: proposal.payload
  },
  contextHash
});
```

**Step 7: Command Execution**
```typescript
// API route guard
const { context, command } = await guardCommand({
  actorId: userId,
  transactionId: 'txn_123',
  expectedCommandType: 'REQUEST_DOCUMENTS'
});

// Emit event
await emitEvent({
  entity_type: 'Transaction',
  entity_id: 'txn_123',
  event_type: 'DocumentsRequested',
  payload: proposal.payload
});
```

## Revocation, Replay, Audit

Because everything is event-driven:

### Disable Automation
```typescript
// Remove from registry
export const AUTOMATIONS: AutomationSpec[] = [
  // Commented out:
  // { id: 'request-missing-docs', ... }
];
```

**Result:** No new runs queued

### Replay Event Stream
```typescript
// Re-run automation on historical events
const events = await loadEvents({ entityType: 'Transaction' });

for (const event of events) {
  await afterEventCommit(event);
}
```

**Result:** Agents re-run with current context

### Audit Trail
```sql
-- Complete audit trail
SELECT
  triggering_event.id as trigger_id,
  triggering_event.event_type as trigger_type,
  agent_proposal.payload->>'justification' as justification,
  approval_event.id as approval_id,
  final_event.id as execution_id
FROM events triggering_event
LEFT JOIN automation_proposals ON ...
LEFT JOIN events approval_event ON ...
LEFT JOIN events final_event ON ...
WHERE triggering_event.entity_id = 'txn_123'
ORDER BY triggering_event.occurred_at;
```

**Shows:**
- Triggering event
- Agent input
- Proposal
- Approval
- Emitted event

**This is legal-grade traceability.**

## Failure Modes

| Failure | Result |
|---------|--------|
| Agent invocation fails | Logged, no proposal |
| Proposal illegal | Rejected by enforcement |
| Human rejects proposal | No command emitted |
| Legality changes | Re-validation catches |
| Queue failure | Retry with backoff |
| Agent timeout | Logged, no proposal |

## Testing Strategy

### Unit Tests
```typescript
describe('selectAutomations', () => {
  it('matches event types to automations', () => {
    const automations = selectAutomations('CONTRACT_ACCEPTED');
    expect(automations).toHaveLength(1);
    expect(automations[0].id).toBe('request-missing-docs');
  });
});

describe('handleProposedCommand', () => {
  it('rejects illegal proposals', async () => {
    const result = await handleProposedCommand({
      proposal: { type: 'ILLEGAL_COMMAND', ... },
      decisionContext: blockedContext,
      autoApprove: true
    });
    expect(result.status).toBe('rejected');
  });
});
```

### Integration Tests
```typescript
describe('automation flow', () => {
  it('executes auto-approved automation', async () => {
    // Emit event
    const event = await emitEvent({ event_type: 'ESCROW_OPENED', ... });

    // Wait for automation
    await waitFor(() => {
      expect(getLatestEvent()).toHaveProperty('event_type', 'LenderNotified');
    });
  });
});
```

## Agent Implementation Guide

### Agent Interface

```typescript
interface Agent {
  analyze(context: AgentContext): Promise<ProposedCommand | null>;
}
```

### Example Agent

```typescript
class DocCollectorAgent implements Agent {
  async analyze(context: AgentContext): Promise<ProposedCommand | null> {
    const { decisionContext, availableCommands } = context;

    // Analyze state
    const state = decisionContext.transactionState;
    if (state !== 'under_contract') {
      return null; // Not applicable
    }

    // Check available commands
    const canRequestDocs = availableCommands.some(
      c => c.type === 'REQUEST_DOCUMENTS'
    );

    if (!canRequestDocs) {
      return null; // Not legal
    }

    // Propose command
    return {
      type: 'REQUEST_DOCUMENTS',
      justification: 'Required disclosures missing',
      payload: {
        documents: ['Lead Disclosure', 'HOA Docs']
      }
    };
  }
}
```

## Status

- ✅ Automation registry implemented
- ✅ Selection filter implemented
- ✅ Agent invocation implemented
- ✅ Proposal handler implemented
- ✅ Human review UI implemented
- ⏳ Agent implementations (pending)
- ⏳ Durable queue integration (pending)
- ⏳ Production testing (pending)

## Next Steps

1. **Implement Agent Router**
   - Route agent name to implementation
   - OpenAI/Anthropic integration

2. **Durable Queue**
   - BullMQ, Inngest, or similar
   - Retry logic
   - Dead letter queue

3. **Proposal Storage**
   - Store pending proposals
   - Approval workflow
   - Expiration

4. **Monitoring**
   - Agent invocation metrics
   - Proposal approval rate
   - Rejection reasons

---

**Version:** 1.0.0
**Last Updated:** 2026-01-11
**Status:** READY FOR AGENT IMPLEMENTATION
