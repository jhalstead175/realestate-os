/**
 * Database Access Layer - Attestations
 *
 * Server-only queries for federation attestations.
 */

import { supabaseServer } from '@/lib/supabase/server';

/**
 * Load attestations for transaction
 *
 * Returns all attestations for the given entity fingerprint.
 */
export async function loadAttestations(transactionId: string) {
  const entityFingerprint = `transaction_${transactionId}`;

  const { data, error } = await supabaseServer
    .from('federation_attestations')
    .select('*')
    .eq('entity_fingerprint', entityFingerprint)
    .order('attested_at', { ascending: false }); // Latest first

  if (error) {
    console.error('Failed to load attestations:', error);
    throw error;
  }

  return data ?? [];
}

/**
 * Get latest attestation of specific type
 *
 * Returns the most recent attestation of the given type.
 */
export async function getLatestAttestation(params: {
  transactionId: string;
  attestationType: string;
}) {
  const entityFingerprint = `transaction_${params.transactionId}`;

  const { data, error } = await supabaseServer
    .from('federation_attestations')
    .select('*')
    .eq('entity_fingerprint', entityFingerprint)
    .eq('attestation_type', params.attestationType)
    .order('attested_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Failed to get latest attestation:', error);
    throw error;
  }

  return data;
}

/**
 * Store attestation
 *
 * Inserts attestation into federation_attestations table.
 */
export async function storeAttestation(params: {
  entityFingerprint: string;
  attestationType: string;
  payload: Record<string, unknown>;
  signature: string;
  fromNodeId: string;
}) {
  const { data, error } = await supabaseServer
    .from('federation_attestations')
    .insert({
      entity_fingerprint: params.entityFingerprint,
      attestation_type: params.attestationType,
      payload: params.payload,
      signature: params.signature,
      from_node_id: params.fromNodeId,
      attested_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to store attestation:', error);
    throw error;
  }

  return data;
}
