# Multi-Party Federation Integration Guide

## Overview

This document describes how **lenders, title companies, and insurance providers** integrate with RealEstate-OS federation as sovereign nodes—coordinating execution certainty without surrendering control, data, or taking on regulatory liability.

## Core Principle

**You do not intermediate money.**
**You intermediate certainty.**

RealEstate-OS coordinates:
- Authority verification
- State transitions
- Timing synchronization

It **never**:
- Holds funds
- Quotes rates
- Binds coverage
- Clears title

This positioning keeps the platform:
- ❌ Out of banking regulation (CFPB)
- ❌ Out of insurance licensing (DOI)
- ❌ Out of escrow liability
- ✅ Positioned as execution infrastructure

## Strategic Value for Each Party

### Why Lenders Join

**Pain points solved:**
- Document churn (endless re-requests)
- Timeline uncertainty (when will this close?)
- Agent misinformation (borrower is "good to go")

**What federation provides:**
- Provable transaction state
- Authority verification
- Predictable closing timelines
- Reduced last-minute surprises

### Why Title Companies Join

**Pain points solved:**
- Unclear authority (who can actually sign?)
- Last-minute changes (new liens appear)
- Incomplete provenance

**What federation provides:**
- Authority chain verification
- Real-time state updates
- Defect disclosure before closing
- Reduced closing delays

### Why Insurance Providers Join

**Pain points solved:**
- Ambiguous risk (property condition unknown)
- Undisclosed defects
- Post-binding surprises (title issues emerge)

**What federation provides:**
- Property fact verification
- Title status visibility
- Transaction state awareness
- Risk hygiene before binding

## Node Types & Attestation Authority

Each node type has **specific attestation capabilities** and **scoped read access**.

### Brokerage Node

**May attest:**
- `StateTransitioned` - Deal progression
- `AuthorityVerified` - Representation authority
- `ComplianceVerified` - Regulatory compliance

**May read:**
- Transaction state
- Property state
- Authority chains
- Offers & negotiation
- Contingencies

**May NOT see:**
- Loan underwriting details
- Title chain specifics
- Insurance risk assessment

### Lender Node

**May attest:**
- `BorrowerPrequalified` - Initial qualification
- `FundsVerified` - Proof of funds confirmed
- `LoanClearedToClose` - Final underwriting approval
- `FinancingWithdrawn` - Loan cancelled

**May read:**
- Transaction state
- Contingencies (financing-related)

**May NOT see:**
- Offer details
- Negotiation history
- Agent communications
- Buyer/seller personal communications

**Critical**: Lender never shares credit scores, income details, or rate sheets—only execution certainty.

### Title Node

**May attest:**
- `ChainOfTitleVerified` - Ownership chain confirmed
- `EncumbrancesDisclosed` - Liens/easements identified
- `TitleClearToClose` - No blocking defects
- `TitleDefectDetected` - Issue found

**May read:**
- Property identity
- Ownership assertions
- Authority grants

**May NOT see:**
- Offer amounts
- Financing details
- Negotiation

**Critical**: Documents stay internal. Only readiness state is attested.

### Insurance Node

**May attest:**
- `RiskAccepted` - Underwriting approved
- `BinderIssued` - Coverage bound
- `CoverageConditional` - Conditions exist
- `CoverageWithdrawn` - Coverage cancelled

**May read:**
- Property facts
- Title status
- Transaction state

**May NOT see:**
- Buyer identity (beyond property owner)
- Financing details
- Agent communications

**Critical**: No premiums, no underwriting notes—only risk acceptance state.

## Closing Readiness: The Shared Coordination Layer

### The Problem This Solves

Traditional real estate closing involves **30+ phone calls** asking:
- "Is the loan ready?"
- "Is title clear?"
- "Is insurance bound?"
- "Can we close?"

### The Solution: Derived Meta-State

**Closing Readiness** is computed from attestations:

| Requirement | Source Node | Attestation |
|-------------|-------------|-------------|
| Funds ready | Lender | `LoanClearedToClose` |
| Title clear | Title | `TitleClearToClose` |
| Insurance bound | Insurance | `BinderIssued` |
| Authority valid | Brokerage | `AuthorityVerified` |
| Contingencies resolved | Brokerage | `StateTransitioned` |

When **all requirements are satisfied**, the transaction is provably ready to close.

This replaces phone calls with **cryptographically signed proof**.

## Integration Flow

### Step 1: Node Registration

Each organization registers as a federation node:

```sql
INSERT INTO federation_nodes (
  node_id,
  organization_name,
  node_type,
  jurisdiction,
  public_key,
  policy_manifest_hash,
  status
) VALUES (
  gen_random_uuid(),
  'Acme Lending',
  'lender',
  'NC',
  'BASE64_ENCODED_PUBLIC_KEY',
  'POLICY_MANIFEST_HASH',
  'active'
);
```

### Step 2: Authority Grant

The coordinating brokerage grants limited authority:

```typescript
{
  "subject_actor_id": "LENDER_NODE_ID",
  "object_type": "Transaction",
  "object_id": "TRANSACTION_ID",
  "relationship_type": "participates_in",
  "authority_scope": {
    "may_read_state": true,
    "may_attest": [
      "FundsVerified",
      "LoanClearedToClose"
    ]
  },
  "effective_at": "2026-02-01T00:00:00Z",
  "expires_at": "2026-06-01T00:00:00Z"
}
```

### Step 3: Attest to Readiness

When the lender completes underwriting:

```typescript
import { createAttestation } from '@repo/federation';

const attestation = await createAttestation({
  issuing_node_id: LENDER_NODE_ID,
  attestation_type: 'LoanClearedToClose',
  entity_fingerprint: TRANSACTION_FINGERPRINT,
  payload: {
    confidence: 0.98,
    conditions: [] // No remaining conditions
  },
  private_key: LENDER_PRIVATE_KEY
});

// Post to brokerage inbox
await fetch('https://brokerage.api/federation/inbox', {
  method: 'POST',
  body: JSON.stringify({
    envelope_id: crypto.randomUUID(),
    from_node_id: LENDER_NODE_ID,
    to_node_id: BROKERAGE_NODE_ID,
    attestations: [attestation],
    envelope_signature: ENVELOPE_SIG,
    sent_at: new Date().toISOString()
  })
});
```

### Step 4: Closing Readiness Updates

The system automatically recomputes closing readiness:

```typescript
import { refreshClosingReadiness } from '@/lib/federation/closingReadiness';

// Called when new attestation arrives
const readiness = await refreshClosingReadiness(transactionFingerprint);

if (readiness.ready) {
  // All parties ready - trigger closing workflow
  console.log('Transaction ready to close');
} else {
  // Show blocking requirements
  const blocking = readiness.requirements
    .filter(r => !r.satisfied)
    .map(r => r.blocking_reason);
  console.log('Blocked by:', blocking);
}
```

## Reputation System

Each node type accumulates **role-specific reputation**:

### Lender Reputation Metrics

- **Clearance accuracy**: How often "cleared to close" actually closes
- **Time to clear**: Average days from application to clearance
- **Withdrawal rate**: How often financing is withdrawn

### Title Reputation Metrics

- **Defect miss rate**: Defects found after "clear to close"
- **Clearance reliability**: Percentage of searches resulting in clearance
- **Exception accuracy**: How well exceptions are disclosed

### Insurance Reputation Metrics

- **Binder revocation rate**: How often coverage is withdrawn
- **Coverage accuracy**: How well coverage matches property needs

**Strategic consequence**: High-trust nodes gain:
- Faster routing
- Preferred workflows
- Reduced friction

**Exit cost**: Leaving federation resets reputation to zero.

## What This Prevents

### For Lenders

✅ **No more**: "Buyer says they're approved but loan falls through"
✅ **No more**: Last-minute document requests
✅ **No more**: Closing delays due to title issues

### For Title Companies

✅ **No more**: "Who actually has authority to sign?"
✅ **No more**: Surprise liens appearing day-of-closing
✅ **No more**: Authority disputes

### For Insurance

✅ **No more**: Binding coverage on properties with title defects
✅ **No more**: Post-binding surprises
✅ **No more**: Coverage disputes

## Regulatory Defensibility

Your organization can **truthfully say**:

> "We participate in a coordination protocol that improves execution quality and consumer protection. We do not intermediate transactions, set prices, or replace existing systems."

And the architecture **proves it**:

- ✅ You control your own data
- ✅ You control your own underwriting
- ✅ You control your own pricing
- ✅ You only attest to readiness states
- ✅ You improve transparency
- ✅ You reduce consumer harm

This is **legally unassailable**.

## API Endpoints

### Receive Attestations (Inbox)

```
POST /api/federation/inbox
```

**Body:**
```json
{
  "envelope_id": "uuid",
  "from_node_id": "uuid",
  "to_node_id": "uuid",
  "attestations": [...],
  "envelope_signature": "base64",
  "sent_at": "ISO-8601"
}
```

**Response:**
```json
{
  "success": true,
  "envelope_id": "uuid",
  "attestations_received": 3
}
```

### Verify Attestations

```
POST /api/federation/verify
```

**Body:**
```json
{
  "entity_fingerprint": "hash",
  "attestation_type": "LoanClearedToClose"
}
```

**Response:**
```json
{
  "entity_fingerprint": "hash",
  "attestations": [...],
  "verification_chain": [...]
}
```

### Discover Nodes

```
GET /api/federation/nodes?jurisdiction=NC
```

**Response:**
```json
{
  "nodes": [
    {
      "node_id": "uuid",
      "organization_name": "Acme Lending",
      "node_type": "lender",
      "jurisdiction": "NC",
      "public_key": "base64",
      "reputation_score": 87.3
    }
  ]
}
```

## Integration Checklist

### Initial Setup

- [ ] Generate Ed25519 keypair
- [ ] Register as federation node
- [ ] Receive authority grant from brokerage
- [ ] Configure inbox endpoint
- [ ] Test signature verification

### Operational Integration

- [ ] Map internal states to attestation types
- [ ] Implement attestation generation
- [ ] Queue attestations for dispatch
- [ ] Handle incoming verification requests
- [ ] Monitor reputation score

### Compliance

- [ ] Document that no funds/pricing/coverage is shared
- [ ] Demonstrate read-only access to permitted data
- [ ] Show cryptographic verification of all attestations
- [ ] Maintain audit trail of all attestations

## Support & Resources

- **Technical docs**: `/FEDERATION.md`
- **API reference**: `/api/federation/*`
- **Federation console**: `/federation`
- **Issue tracker**: GitHub Issues

## Questions?

**Q: Do we have to share our internal data?**
A: No. Only minimal readiness states are attested. Entity fingerprints prevent ID exposure.

**Q: What if we leave the network?**
A: You can leave anytime. Your data stays yours. Reputation resets, but no other penalty.

**Q: Who sees our attestations?**
A: Only nodes with explicit authority grants. Attestations are targeted, not broadcast.

**Q: How is this different from an MLS?**
A: MLS aggregates listings. This coordinates execution. Complementary, not competitive.

**Q: What about antitrust?**
A: You control your pricing, underwriting, and business operations. This only coordinates timing and readiness—legally defensible as pro-consumer infrastructure.

---

**Status**: Multi-party federation operational
**Version**: 2.0.0 (extended from brokerage-only v1.0.0)
**Last Updated**: 2026-01-11
