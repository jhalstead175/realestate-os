/**
 * Federation Package
 *
 * Core federation primitives for cross-brokerage interoperability.
 *
 * This package provides:
 * - Type-safe federation protocol
 * - Ed25519 signing and verification
 * - Attestation generation and validation
 * - Policy manifest management
 *
 * @packageDocumentation
 */

// Types
export type {
  FederationNode,
  PolicyManifest,
  Attestation,
  AttestationType,
  AttestationPayload,
  InboxEnvelope,
  EntityFingerprint,
  ReputationSnapshot,
  OutboxItem,
  VerificationRequest,
  VerificationResponse,
} from './types.js';

// Cryptography
export {
  generateKeypair,
  sign,
  verify,
  hash,
  createEntityFingerprint,
  verifyChain,
} from './crypto.js';

// Canonicalization
export { canonicalize } from './canonicalize.js';

// Attestations
export {
  createAttestation,
  verifyAttestation,
  createInboxEnvelope,
  verifyInboxEnvelope,
  createAttestationsFromEvents,
} from './attestations.js';

// Policy Manifests
export {
  createPolicyManifest,
  computePolicyManifestHash,
  areManifestsCompatible,
  DEFAULT_MANIFEST_CONFIG,
} from './policyManifest.js';
