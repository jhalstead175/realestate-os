/**
 * Command API - Issue Attestation
 *
 * Lender/Title/Insurance nodes issue attestations here.
 * Guard enforces that only authorized nodes can issue specific attestation types.
 */

import { NextRequest, NextResponse } from 'next/server';
import { guardAttestationIssuance } from '@/lib/execution';
import { createAttestation } from '@repo/federation';
import { storeAttestation } from '@/lib/db/attestations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { actorId, transactionId, attestationType, payload, justification } =
      body;

    // ENFORCEMENT: Guard with execution spine
    const { context, command } = await guardAttestationIssuance({
      actorId,
      transactionId,
      attestationType,
    });

    // Guard passed, create and sign attestation
    const entityFingerprint = `transaction_${transactionId}`;

    // Get node's private key from environment
    const privateKey = process.env.FEDERATION_PRIVATE_KEY!;
    const nodeId = process.env.FEDERATION_NODE_ID!;

    if (!privateKey || !nodeId) {
      throw new Error('Federation credentials not configured');
    }

    // Create signed attestation
    const attestation = await createAttestation(
      {
        type: attestationType,
        entity_fingerprint: entityFingerprint,
        payload: {
          ...payload,
          justification,
          issued_by_role: context.role,
        },
        attested_at: new Date().toISOString(),
      },
      privateKey
    );

    // Store attestation
    await storeAttestation({
      entityFingerprint,
      attestationType,
      payload: attestation.payload,
      signature: attestation.signature,
      fromNodeId: nodeId,
    });

    return NextResponse.json({
      success: true,
      attestation,
      message: `${attestationType} attestation issued`,
    });
  } catch (error) {
    console.error('Issue attestation failed:', error);

    const message =
      error instanceof Error ? error.message : 'Failed to issue attestation';

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 403 }
    );
  }
}
