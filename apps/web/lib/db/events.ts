/**
 * Database Access Layer - Events
 *
 * Server-only queries for event-sourced data.
 * Uses service role client (bypasses RLS).
 */

import { supabaseServer } from '@/lib/supabase/server';

/**
 * Load transaction events
 *
 * Returns events in chronological order (occurred_at ASC).
 */
export async function loadTransactionEvents(transactionId: string) {
  const { data, error } = await supabaseServer
    .from('events')
    .select('*')
    .eq('entity_type', 'Transaction')
    .eq('entity_id', transactionId)
    .order('occurred_at', { ascending: true });

  if (error) {
    console.error('Failed to load transaction events:', error);
    throw error;
  }

  return data ?? [];
}

/**
 * Load all events for entity
 *
 * Generic loader for any entity type.
 */
export async function loadEvents(params: {
  entityType: string;
  entityId: string;
}) {
  const { data, error } = await supabaseServer
    .from('events')
    .select('*')
    .eq('entity_type', params.entityType)
    .eq('entity_id', params.entityId)
    .order('occurred_at', { ascending: true });

  if (error) {
    console.error('Failed to load events:', error);
    throw error;
  }

  return data ?? [];
}

/**
 * Emit event (write to event log)
 *
 * This is the ONLY write operation in the database layer.
 */
export async function emitEvent(event: {
  entity_type: string;
  entity_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  actor_id?: string;
}) {
  const { data, error } = await supabaseServer
    .from('events')
    .insert({
      entity_type: event.entity_type,
      entity_id: event.entity_id,
      event_type: event.event_type,
      payload: event.payload,
      actor_id: event.actor_id,
      occurred_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to emit event:', error);
    throw error;
  }

  return data;
}
