/**
 * Federation Verify API
 *
 * Allows other nodes to verify attestations for an entity.
 * Returns provable chain of attestations without exposing internal data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';

// Zod schema for verification request
const VerificationRequestSchema = z.object({
  entity_fingerprint: z.string(),
  attestation_type: z
    .enum([
      'StateTransitioned',
      'AuthorityVerified',
      'ComplianceVerified',
      'AuditNarrativeGenerated',
      'ReputationSnapshot',
    ])
    .optional(),
  after_date: z.string().datetime().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const verificationRequest = VerificationRequestSchema.parse(body);

    // Build query
    let query = supabaseServer
      .from('federation_attestations')
      .select('*, issuing_node:federation_nodes(node_id, public_key)')
      .eq('entity_fingerprint', verificationRequest.entity_fingerprint)
      .order('issued_at', { ascending: false });

    // Apply optional filters
    if (verificationRequest.attestation_type) {
      query = query.eq('attestation_type', verificationRequest.attestation_type);
    }

    if (verificationRequest.after_date) {
      query = query.gte('issued_at', verificationRequest.after_date);
    }

    const { data: attestations, error } = await query;

    if (error) {
      console.error('Failed to query attestations:', error);
      return NextResponse.json(
        { error: 'Failed to retrieve attestations' },
        { status: 500 }
      );
    }

    if (!attestations || attestations.length === 0) {
      return NextResponse.json({
        entity_fingerprint: verificationRequest.entity_fingerprint,
        attestations: [],
        verification_chain: [],
      });
    }

    // Build verification chain
    const verificationChain = attestations.map((a) => ({
      issuing_node: a.issuing_node_id,
      public_key: a.issuing_node.public_key,
      signature_valid: true, // Already verified on ingest
    }));

    // Return attestations with verification metadata
    return NextResponse.json({
      entity_fingerprint: verificationRequest.entity_fingerprint,
      attestations: attestations.map((a) => ({
        attestation_id: a.attestation_id,
        issuing_node_id: a.issuing_node_id,
        attestation_type: a.attestation_type,
        entity_fingerprint: a.entity_fingerprint,
        payload: a.payload,
        issued_at: a.issued_at,
        signature: a.signature,
      })),
      verification_chain: verificationChain,
    });
  } catch (error) {
    console.error('Verify error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request format', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
