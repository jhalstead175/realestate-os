# Cross-Brokerage Federation Architecture

## Overview

This document describes the **cross-brokerage federation moat** implemented in RealEstate-OS. This is not a feature—it is foundational infrastructure that makes the platform non-replicable, non-extractable, and politically survivable.

## What Federation Means

A federated brokerage network allows multiple **sovereign brokerages** to:

- Retain full data ownership
- Maintain policy control
- Preserve internal authority

While participating in:

- Shared protocols
- Verifiable trust
- Limited, permissioned interoperability

**This is not data sharing. This is mutual intelligibility.**

## Architecture Layers

The federation moat consists of three layers:

### Layer 1: Technical Protocol

- **Federation Nodes**: Registered brokerages with Ed25519 keypairs
- **Attestations**: Signed, minimal proofs of events (no PII)
- **Inbox/Outbox**: Message queues for cross-node communication
- **Policy Manifests**: Semantic compatibility contracts

### Layer 2: Legal & Semantic Alignment

- **Shared Ontology Charter**: Common event taxonomy and state machines
- **Policy Hash Commitments**: Provable policy compliance without disclosure
- **Portable Audit Narratives**: Verifiable legal artifacts across nodes

### Layer 3: Trust & Reputation (The Uncopyable Moat)

- **Node Reputation Ledger**: Computed from attestations only
- **Reputation as Routing Power**: High-trust nodes gain velocity
- **Exit Cost**: Leaving resets reputation and creates friction

## Core Components

### 1. Federation Package (`@repo/federation`)

Located at: `packages/federation/`

Provides:
- Type-safe federation protocol
- Ed25519 signing and verification
- Attestation generation and validation
- Policy manifest management
- Canonical JSON serialization

### 2. Database Schema

Located at: `supabase/migrations/001_federation_core.sql`

Tables:
- `federation_nodes` - Node registry
- `federation_attestations` - Signed proofs
- `federation_inbox` - Incoming attestations
- `federation_outbox` - Outgoing queue
- `federation_reputation_snapshots` - Computed scores

### 3. API Endpoints

Located at: `apps/web/app/api/federation/`

Endpoints:
- `/inbox` - Receive attestations from other nodes
- `/verify` - Verify attestations for an entity
- `/nodes` - Public key discovery
- `/dispatch` - Process outbox (protected)

### 4. Federation Libraries

Located at: `apps/web/lib/federation/`

- `emitAttestations.ts` - Convert internal events to attestations
- `reputation.ts` - Compute reputation from attestations
- `acl/` - Anti-corruption layer for boundary protection

### 5. Federation Console

Located at: `apps/web/app/federation/page.tsx`

A minimalist command bridge showing:
- Active nodes
- Inbox/outbox health
- Reputation scoreboard
- Network status

## Environment Variables

Required configuration:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_role_key

# Federation
FEDERATION_NODE_ID=your_node_uuid
FEDERATION_PRIVATE_KEY=base64_encoded_ed25519_private_key
FEDERATION_DISPATCH_SECRET=random_secret_for_dispatch_endpoint

# Optional
FEDERATION_JURISDICTION=NC  # Your jurisdiction code
FEDERATION_SALT=random_salt_for_fingerprints
```

## How It Works

### Attestation Flow

1. **Internal Event Occurs**
   - Transaction state changes
   - Authority is granted
   - Compliance is verified

2. **Attestation Emitted**
   - Event is converted to minimal, PII-free attestation
   - Entity fingerprint created (non-reversible)
   - Attestation is signed with node's private key

3. **Queued for Dispatch**
   - Attestations are added to outbox
   - Grouped by destination node

4. **Dispatched to Federation**
   - Outbox worker creates signed envelope
   - POSTs to destination node's `/inbox`
   - Destination verifies signatures

5. **Reputation Updated**
   - Attestations are analyzed periodically
   - Reputation scores computed (0-100)
   - High-trust nodes gain routing preference

### Verification Flow

1. **Counterparty Needs Proof**
   - Another node wants to verify an entity's state
   - Provides entity fingerprint

2. **Query Attestations**
   - Calls `/verify` endpoint
   - Receives signed attestation chain

3. **Verify Signatures**
   - Downloads issuing node's public key
   - Verifies each attestation signature
   - Trusts the chain if valid

## Security Model

### What Is Protected

- **PII**: Never crosses node boundaries
- **Internal IDs**: Replaced with fingerprints
- **Business Logic**: Stays internal
- **Authority**: Scoped to jurisdiction

### What Is Shared

- **State Transitions**: Minimal metadata only
- **Authority Proofs**: Scope, not details
- **Compliance Status**: Pass/fail, not evidence
- **Reputation**: Derived metrics only

### Cryptographic Guarantees

- **Ed25519 Signatures**: Every attestation is signed
- **Entity Fingerprints**: SHA-256 hashed with salt
- **Envelope Integrity**: Entire message signed
- **Non-Repudiation**: All actions are provable

## Integration Guide

### Emitting Attestations from Your Code

```typescript
import { emitAttestationsFromEvents } from '@/lib/federation/emitAttestations';

// After writing events to your internal event log
await emitAttestationsFromEvents({
  events: [
    {
      event_id: '...',
      event_type: 'TransactionStateAdvanced',
      entity_type: 'Transaction',
      entity_id: '...',
      payload: { prior_state: 'under_contract', new_state: 'closing' },
      occurred_at: new Date(),
    },
  ],
  issuing_node_id: process.env.FEDERATION_NODE_ID!,
  private_key: process.env.FEDERATION_PRIVATE_KEY!,
  jurisdiction: 'NC',
  salt: process.env.FEDERATION_SALT!,
});
```

### Dispatching Attestations (Scheduled Job)

```bash
# Call dispatch endpoint (e.g., via cron or Vercel cron)
curl -X POST https://yourapp.com/api/federation/dispatch \
  -H "Authorization: Bearer YOUR_DISPATCH_SECRET"
```

### Computing Reputation (Daily Job)

```typescript
import { computeAllReputations } from '@/lib/federation/reputation';

// Run daily
const result = await computeAllReputations();
console.log(`Computed: ${result.computed}, Failed: ${result.failed}`);
```

## Why This Is a Moat

### Threat: Big Tech Clones

**Why it fails**: No trust ledger. Starting from zero reputation means zero routing power.

### Threat: MLS Incumbents

**Why it fails**: MLS provides listings, not execution semantics or provable workflows.

### Threat: New Startups

**Why it fails**: No federation gravity. Network effects compound with every node.

### Threat: Data Hoarders

**Why it fails**: Closed systems have zero cross-node credibility.

## Regulatory Defensibility

This architecture is **regulator-friendly by design**:

- ✅ Does not centralize listings
- ✅ Does not control pricing
- ✅ Does not exclude competitors
- ✅ Improves transparency
- ✅ Improves auditability
- ✅ Improves consumer protection

It is **not** a marketplace. It is **infrastructure**.

## Next Steps

1. **Register Your Node**
   - Generate keypair: `import { generateKeypair } from '@repo/federation'`
   - Insert into `federation_nodes` table
   - Configure environment variables

2. **Run Migrations**
   - Apply `001_federation_core.sql` to your Supabase project

3. **Configure Scheduled Jobs**
   - Outbox dispatch (every 5 minutes)
   - Reputation compute (daily)

4. **Monitor Federation Console**
   - Visit `/federation` to see network health

## Further Reading

See the full architectural audit in the project root for:
- Canonical ontology design
- Event-sourced schema
- State machine enforcement
- Authority-bound RLS
- Agent command loop
- Counterfactual replay
- Automatic audit narratives

---

**Status**: Foundational infrastructure implemented
**Compatibility**: v1.0.0 ontology/event dictionary
**Last Updated**: 2026-01-11
