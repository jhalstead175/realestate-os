/**
 * Federation Inbox API
 *
 * Receives attestation envelopes from other federation nodes.
 * Verifies signatures and stores attestations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyInboxEnvelope, verifyAttestation } from '@repo/federation';
import { supabaseServer } from '@/lib/supabase/server';

// Zod schema for inbox envelope validation
const InboxEnvelopeSchema = z.object({
  envelope_id: z.string().uuid(),
  from_node_id: z.string().uuid(),
  to_node_id: z.string().uuid(),
  attestations: z.array(
    z.object({
      attestation_id: z.string().uuid(),
      issuing_node_id: z.string().uuid(),
      attestation_type: z.enum([
        'StateTransitioned',
        'AuthorityVerified',
        'ComplianceVerified',
        'AuditNarrativeGenerated',
        'ReputationSnapshot',
      ]),
      entity_fingerprint: z.string(),
      payload: z.record(z.unknown()),
      issued_at: z.string().datetime(),
      signature: z.string(),
    })
  ),
  envelope_signature: z.string(),
  sent_at: z.string().datetime(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const envelope = InboxEnvelopeSchema.parse(body);

    // Look up sender node to get public key
    const { data: senderNode, error: nodeError } = await supabaseServer
      .from('federation_nodes')
      .select('node_id, public_key, status')
      .eq('node_id', envelope.from_node_id)
      .single();

    if (nodeError || !senderNode) {
      return NextResponse.json(
        { error: 'Unknown sender node' },
        { status: 404 }
      );
    }

    if (senderNode.status !== 'active') {
      return NextResponse.json(
        { error: 'Sender node is not active' },
        { status: 403 }
      );
    }

    // Verify envelope signature
    const envelopeValid = await verifyInboxEnvelope(
      envelope,
      senderNode.public_key
    );

    if (!envelopeValid) {
      // Store failed verification
      await supabaseServer.from('federation_inbox').insert({
        from_node_id: envelope.from_node_id,
        envelope: envelope,
        verification_status: 'invalid',
        verification_error: 'Invalid envelope signature',
        verified_at: new Date().toISOString(),
      });

      return NextResponse.json(
        { error: 'Invalid envelope signature' },
        { status: 401 }
      );
    }

    // Verify each attestation signature
    const validAttestations = [];
    const invalidAttestations = [];

    for (const attestation of envelope.attestations) {
      const attestationValid = await verifyAttestation(
        attestation,
        senderNode.public_key
      );

      if (attestationValid) {
        validAttestations.push(attestation);
      } else {
        invalidAttestations.push(attestation.attestation_id);
      }
    }

    if (invalidAttestations.length > 0) {
      // Store partial failure
      await supabaseServer.from('federation_inbox').insert({
        from_node_id: envelope.from_node_id,
        envelope: envelope,
        verification_status: 'invalid',
        verification_error: `Invalid attestation signatures: ${invalidAttestations.join(', ')}`,
        verified_at: new Date().toISOString(),
      });

      return NextResponse.json(
        {
          error: 'Some attestations failed verification',
          invalid_attestations: invalidAttestations,
        },
        { status: 400 }
      );
    }

    // Store valid envelope
    const { error: inboxError } = await supabaseServer
      .from('federation_inbox')
      .insert({
        from_node_id: envelope.from_node_id,
        envelope: envelope,
        verification_status: 'valid',
        verified_at: new Date().toISOString(),
      });

    if (inboxError) {
      console.error('Failed to store inbox envelope:', inboxError);
      return NextResponse.json(
        { error: 'Failed to store envelope' },
        { status: 500 }
      );
    }

    // Store all valid attestations
    const attestationsToStore = validAttestations.map((a) => ({
      attestation_id: a.attestation_id,
      issuing_node_id: a.issuing_node_id,
      attestation_type: a.attestation_type,
      entity_fingerprint: a.entity_fingerprint,
      payload: a.payload,
      issued_at: a.issued_at,
      signature: a.signature,
    }));

    const { error: attestationsError } = await supabaseServer
      .from('federation_attestations')
      .insert(attestationsToStore);

    if (attestationsError) {
      console.error('Failed to store attestations:', attestationsError);
      return NextResponse.json(
        { error: 'Failed to store attestations' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      envelope_id: envelope.envelope_id,
      attestations_received: validAttestations.length,
    });
  } catch (error) {
    console.error('Inbox error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid envelope format', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
