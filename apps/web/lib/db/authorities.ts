/**
 * Database Access Layer - Authorities
 *
 * Server-only queries for authority events.
 * Authority is derived from events, not stored state.
 */

import { supabaseServer } from '@/lib/supabase/server';

/**
 * Load authority events for actor in transaction
 *
 * Returns AuthorityGranted and AuthorityRevoked events in chronological order.
 */
export async function loadAuthorityEvents(params: {
  actorId: string;
  transactionId: string;
}) {
  const { data, error } = await supabaseServer
    .from('events')
    .select('*')
    .eq('entity_type', 'Authority')
    .or(`payload->actor_id.eq.${params.actorId},actor_id.eq.${params.actorId}`)
    .or(
      `payload->transaction_id.eq.${params.transactionId},payload->object_id.eq.${params.transactionId}`
    )
    .in('event_type', ['AuthorityGranted', 'AuthorityRevoked'])
    .order('occurred_at', { ascending: true });

  if (error) {
    console.error('Failed to load authority events:', error);
    throw error;
  }

  return data ?? [];
}

/**
 * Grant authority to actor
 *
 * Emits AuthorityGranted event.
 */
export async function grantAuthority(params: {
  actorId: string;
  transactionId: string;
  scope: string[];
  grantedBy: string;
  validFrom?: Date;
  validUntil?: Date;
}) {
  const { data, error } = await supabaseServer
    .from('events')
    .insert({
      entity_type: 'Authority',
      entity_id: `authority_${params.actorId}_${params.transactionId}`,
      event_type: 'AuthorityGranted',
      payload: {
        actor_id: params.actorId,
        transaction_id: params.transactionId,
        scope: params.scope,
        granted_by: params.grantedBy,
        valid_from: params.validFrom?.toISOString(),
        valid_until: params.validUntil?.toISOString(),
      },
      actor_id: params.grantedBy,
      occurred_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to grant authority:', error);
    throw error;
  }

  return data;
}

/**
 * Revoke authority from actor
 *
 * Emits AuthorityRevoked event.
 */
export async function revokeAuthority(params: {
  actorId: string;
  transactionId: string;
  revokedBy: string;
  reason?: string;
}) {
  const { data, error } = await supabaseServer
    .from('events')
    .insert({
      entity_type: 'Authority',
      entity_id: `authority_${params.actorId}_${params.transactionId}`,
      event_type: 'AuthorityRevoked',
      payload: {
        actor_id: params.actorId,
        transaction_id: params.transactionId,
        reason: params.reason,
      },
      actor_id: params.revokedBy,
      occurred_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to revoke authority:', error);
    throw error;
  }

  return data;
}
