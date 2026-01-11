/**
 * Federation Cryptography
 *
 * Handles signing and verification using Ed25519.
 * This is the trust foundation of the federation.
 */

import { ed25519 } from '@noble/ed25519';
import { canonicalize } from './canonicalize.js';

/**
 * Generate a new Ed25519 keypair
 * Used during node registration
 */
export async function generateKeypair(): Promise<{
  privateKey: string;
  publicKey: string;
}> {
  const privateKey = ed25519.utils.randomPrivateKey();
  const publicKey = await ed25519.getPublicKeyAsync(privateKey);

  return {
    privateKey: Buffer.from(privateKey).toString('base64'),
    publicKey: Buffer.from(publicKey).toString('base64'),
  };
}

/**
 * Sign data using Ed25519 private key
 *
 * @param data - The data to sign (will be canonicalized)
 * @param privateKeyBase64 - Base64-encoded private key
 * @returns Base64-encoded signature
 */
export async function sign(
  data: unknown,
  privateKeyBase64: string
): Promise<string> {
  const canonical = canonicalize(data);
  const message = new TextEncoder().encode(canonical);
  const privateKey = Buffer.from(privateKeyBase64, 'base64');

  const signature = await ed25519.signAsync(message, privateKey);
  return Buffer.from(signature).toString('base64');
}

/**
 * Verify a signature using Ed25519 public key
 *
 * @param data - The data that was signed (will be canonicalized)
 * @param signatureBase64 - Base64-encoded signature
 * @param publicKeyBase64 - Base64-encoded public key
 * @returns true if signature is valid
 */
export async function verify(
  data: unknown,
  signatureBase64: string,
  publicKeyBase64: string
): Promise<boolean> {
  try {
    const canonical = canonicalize(data);
    const message = new TextEncoder().encode(canonical);
    const signature = Buffer.from(signatureBase64, 'base64');
    const publicKey = Buffer.from(publicKeyBase64, 'base64');

    return await ed25519.verifyAsync(signature, message, publicKey);
  } catch {
    return false;
  }
}

/**
 * Hash data using SHA-256
 *
 * @param data - The data to hash (will be canonicalized)
 * @returns Hex-encoded hash
 */
export async function hash(data: unknown): Promise<string> {
  const canonical = canonicalize(data);
  const message = new TextEncoder().encode(canonical);

  // Use Web Crypto API (works in Node.js 16+)
  const hashBuffer = await crypto.subtle.digest('SHA-256', message);
  return Buffer.from(hashBuffer).toString('hex');
}

/**
 * Create entity fingerprint
 * Non-reversible identifier for cross-node references
 *
 * @param entityType - Type of entity (e.g., "Transaction")
 * @param entityId - Internal entity ID
 * @param jurisdiction - Jurisdiction code
 * @param salt - Secret salt (node-specific, never shared)
 * @returns Hex-encoded fingerprint
 */
export async function createEntityFingerprint(
  entityType: string,
  entityId: string,
  jurisdiction: string,
  salt: string
): Promise<string> {
  const composite = {
    entity_type: entityType,
    entity_id: entityId,
    jurisdiction,
    salt,
  };

  return await hash(composite);
}

/**
 * Verify hash chain integrity
 * Ensures attestations form a valid chain
 *
 * @param attestations - Ordered list of attestations
 * @returns true if chain is valid
 */
export async function verifyChain(
  attestations: Array<{
    attestation_id: string;
    payload: unknown;
    signature: string;
    issuing_node_public_key: string;
  }>
): Promise<boolean> {
  for (const attestation of attestations) {
    const isValid = await verify(
      {
        attestation_id: attestation.attestation_id,
        payload: attestation.payload,
      },
      attestation.signature,
      attestation.issuing_node_public_key
    );

    if (!isValid) {
      return false;
    }
  }

  return true;
}
