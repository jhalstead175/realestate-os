/**
 * Title Signature Verification
 *
 * Stricter than lender verification.
 * Title signatures must cover:
 * - aggregate ID
 * - payload
 * - document references
 *
 * No partial verification allowed.
 */

import { verifySignature } from './verifySignature';

export interface TitleDocumentRef {
  doc_type: string;
  hash: string;
  external_uri?: string;
}

/**
 * Verify title event signature with document custody
 *
 * @returns true if signature is valid over complete payload
 */
export function verifyTitleSignature({
  aggregateId,
  payload,
  documentRefs,
  signature,
  publicKey,
}: {
  aggregateId: string;
  payload: Record<string, unknown>;
  documentRefs?: TitleDocumentRef[];
  signature: string;
  publicKey: string;
}): boolean {
  try {
    // Build complete signed message
    const signedMessage = {
      aggregateId,
      payload,
      documentRefs: documentRefs ?? [],
    };

    // Verify signature over complete message
    return verifySignature({
      payload: signedMessage,
      signature,
      publicKey,
    });
  } catch (error) {
    console.error('Title signature verification failed:', error);
    return false;
  }
}
