# Integration Authority Firewall

## Core Principle

**Sync listings. Never sync authority.**

---

## What This Means

### ✅ External Systems CAN Provide:
- Property addresses
- Listing prices
- Contact information (names, emails, phone numbers)
- Property details (bedrooms, bathrooms, square footage)
- Listing status (active, pending, closed)
- Activity summaries (last contact, appointments)
- MLS numbers and metadata

### ❌ External Systems CANNOT Provide:
- **Role assignments** (who is the agent, broker, coordinator)
- **Authority grants** (who can do what)
- **Permission levels** (who can approve, close, or advance deals)
- **Closing readiness determinations**
- **Transaction state** (under contract, closing, closed)

---

## Why This Firewall Exists

### Problem: Authority Leaks

If you import authority from external systems, you create **authority leaks**:

1. **CRM says Alice is the agent** → Alice gains authority
2. **Someone changes CRM** → Alice loses authority
3. **CRM reverts change** → Alice regains authority

This is **not deterministic**, **not auditable**, and **not safe**.

### Solution: Authority Derivation

Authority is **always derived from internal events**, never imported:

1. **Event: Grant authority to Alice** → Alice gains authority
2. **Event: Revoke authority from Alice** → Alice loses authority
3. **Events are immutable** → Authority history is permanent

This is **deterministic**, **auditable**, and **safe**.

---

## Implementation

### Database Design

External data is stored in separate tables with clear boundaries:

```sql
-- External data (informational only)
create table crm_listings (
  crm_system text,
  crm_listing_id text,
  property_address text,
  agent_email text,  -- INFORMATIONAL, NOT AUTHORITATIVE
  ...
);

-- Internal authority (authoritative)
create table events (
  event_type text,
  actor_id text,  -- DERIVED FROM EVENTS, NOT CRM
  payload jsonb,
  ...
);
```

### Reconciliation, Not Import

External listings are **reconciled** with internal deals, not **imported**:

- **Matched**: External listing linked to internal deal (for reference only)
- **Unmatched**: External listing has no internal counterpart (informational)
- **Conflict**: Data mismatch between external and internal (flag for review)
- **Ignored**: External listing explicitly marked as not needing reconciliation

### Read-Only by Design

All integration tables have these characteristics:

- ✅ **Append-only sync** (create/update external records)
- ✅ **Read-only for authority** (never used to grant permissions)
- ✅ **Reconciliation views** (show mismatches, don't enforce)
- ✅ **Audit logs** (track what was synced and when)

---

## Use Cases

### ✅ Good: Property Data Sync

**Scenario**: Import property address and listing price from MLS

```typescript
// Good: Sync property data
await syncMLSListings('bright_mls', [
  {
    mlsNumber: '123456',
    propertyAddress: '123 Main St',
    listPrice: 500000,
    status: 'active',
  },
]);
```

**Result**: Property data available for display and reference. No authority granted.

---

### ❌ Bad: Role Import from CRM

**Scenario**: Import "agent" role from CRM

```typescript
// BAD: Do NOT do this
const crmAgent = await getCRMAgent('deal123');
await grantAuthority(crmAgent.email, 'agent');  // WRONG!
```

**Why this is bad**:
- CRM is not authoritative for roles
- Someone could change the CRM and gain authority
- Not auditable or deterministic

**Correct approach**:

```typescript
// Good: Authority derived from internal events
await appendEvent({
  eventType: 'authority_granted',
  actorId: 'broker_1',
  payload: {
    grantedTo: 'agent_1',
    authority: 'close_deals',
    reason: 'Broker decision',
  },
});
```

---

## Reconciliation UI

The reconciliation UI shows external data alongside internal data, **but never overwrites authority**:

```
┌─────────────────────────────────────────────────────────────┐
│ External Listing Reconciliation                             │
├─────────────────────────────────────────────────────────────┤
│ Source: CRM (Salesforce)                                    │
│ External ID: SF-12345                                       │
│ External Address: 123 Main St                               │
│ External Agent: alice@example.com  ← INFORMATIONAL ONLY    │
│                                                             │
│ Status: MATCHED                                             │
│                                                             │
│ Internal Deal ID: uuid-789                                  │
│ Internal Address: 123 Main St                               │
│ Internal Agent: agent_1  ← AUTHORITATIVE (from events)     │
└─────────────────────────────────────────────────────────────┘
```

---

## Demo Lines

**For Executives**:
> *"We sync property data from your CRM and MLS, but authority always comes from the system of record. No one can sneak in permissions through a CRM edit."*

**For Compliance Officers**:
> *"External systems are advisory, not authoritative. All role assignments and permissions are derived from immutable internal events."*

**For Agents**:
> *"Your deal data stays in sync with MLS and CRM, but your authority to act on deals comes from the brokerage, not from external systems."*

---

## Red Flags (Don't Do These)

❌ Importing "assigned agent" from CRM → Use internal authority grants
❌ Syncing "deal owner" from MLS → Use internal actor assignments
❌ Reading "permissions" from external system → Derive from events only
❌ Using CRM status to determine closing readiness → Compute from events
❌ Trusting external "can close" flags → Enforce through authority spine

---

## Summary

| External Systems | Internal System |
|------------------|-----------------|
| **Advisory** | **Authoritative** |
| Property data | Authority grants |
| Contact info | Role assignments |
| Listing status | Closing readiness |
| Activity logs | Transaction state |
| **Read-only** | **Event-sourced** |

**Bottom Line**: External systems tell us *what*, internal events tell us *who can do what*.
