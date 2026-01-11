/**
 * Command API - Withdraw Attestation
 *
 * Lender/Title/Insurance nodes withdraw attestations here.
 * This immediately blocks closing readiness.
 */

import { NextRequest, NextResponse } from 'next/server';
import { guardAttestationWithdrawal } from '@/lib/execution';
import { createAttestation } from '@repo/federation';
import { storeAttestation } from '@/lib/db/attestations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      actorId,
      transactionId,
      attestationType,
      reason,
      justification,
    } = body;

    if (!reason) {
      throw new Error('Withdrawal reason is required');
    }

    // ENFORCEMENT: Guard with execution spine
    const { context, command } = await guardAttestationWithdrawal({
      actorId,
      transactionId,
      attestationType,
    });

    // Guard passed, create withdrawal attestation
    const entityFingerprint = `transaction_${transactionId}`;

    // Get node's private key from environment
    const privateKey = process.env.FEDERATION_PRIVATE_KEY!;
    const nodeId = process.env.FEDERATION_NODE_ID!;

    if (!privateKey || !nodeId) {
      throw new Error('Federation credentials not configured');
    }

    // Create signed withdrawal attestation
    const attestation = await createAttestation(
      {
        type: attestationType, // e.g., FinancingWithdrawn
        entity_fingerprint: entityFingerprint,
        payload: {
          reason,
          justification,
          withdrawn_by_role: context.role,
          withdrawn_at: new Date().toISOString(),
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
      message: `${attestationType} withdrawal recorded`,
    });
  } catch (error) {
    console.error('Withdraw attestation failed:', error);

    const message =
      error instanceof Error
        ? error.message
        : 'Failed to withdraw attestation';

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 403 }
    );
  }
}
