/**
 * Federation Database Access
 *
 * Server-only queries for federated nodes and events.
 */

import { supabaseServer } from '@/lib/supabase/server';
import type { FederatedNode, FederatedEvent } from './types';

/**
 * Load federated node by ID
 *
 * Returns null if node doesn't exist or is disabled
 */
export async function loadFederatedNode(
  nodeId: string
): Promise<FederatedNode | null> {
  const { data, error } = await supabaseServer
    .from('federated_nodes')
    .select('*')
    .eq('node_id', nodeId)
    .eq('enabled', true)
    .single();

  if (error || !data) {
    console.warn('Failed to load federated node:', nodeId, error);
    return null;
  }

  return data as FederatedNode;
}

/**
 * Insert federated event
 *
 * Appends signed fact to immutable log
 */
export async function insertFederatedEvent(event: {
  source_node: string;
  aggregate_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  signature: string;
}): Promise<FederatedEvent> {
  const { data, error } = await supabaseServer
    .from('federated_events')
    .insert({
      source_node: event.source_node,
      aggregate_id: event.aggregate_id,
      event_type: event.event_type,
      payload: event.payload,
      signature: event.signature,
      received_at: new Date().toISOString(),
      processed: false,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to insert federated event: ${error?.message}`);
  }

  return data as FederatedEvent;
}

/**
 * Load unprocessed federated events for an aggregate
 *
 * Used for processing federated facts into automation proposals
 */
export async function loadUnprocessedFederatedEvents(
  aggregateId: string
): Promise<FederatedEvent[]> {
  const { data, error } = await supabaseServer
    .from('federated_events')
    .select('*')
    .eq('aggregate_id', aggregateId)
    .eq('processed', false)
    .order('received_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to load unprocessed events: ${error.message}`);
  }

  return (data ?? []) as FederatedEvent[];
}

/**
 * Mark federated event as processed
 */
export async function markFederatedEventProcessed(
  eventId: string
): Promise<void> {
  const { error } = await supabaseServer
    .from('federated_events')
    .update({
      processed: true,
      processed_at: new Date().toISOString(),
    })
    .eq('id', eventId);

  if (error) {
    throw new Error(`Failed to mark event as processed: ${error.message}`);
  }
}

/**
 * Load all federated events for an aggregate (for history/replay)
 */
export async function loadFederatedEventHistory(
  aggregateId: string
): Promise<FederatedEvent[]> {
  const { data, error } = await supabaseServer
    .from('federated_events')
    .select('*')
    .eq('aggregate_id', aggregateId)
    .order('received_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to load federated event history: ${error.message}`);
  }

  return (data ?? []) as FederatedEvent[];
}

/**
 * Create or update federated node
 *
 * Admin function for node management
 */
export async function upsertFederatedNode(node: {
  node_id: string;
  node_type: 'lender' | 'title' | 'insurance';
  display_name: string;
  public_key: string;
  allowed_event_types: string[];
  enabled?: boolean;
}): Promise<FederatedNode> {
  const { data, error } = await supabaseServer
    .from('federated_nodes')
    .upsert(
      {
        node_id: node.node_id,
        node_type: node.node_type,
        display_name: node.display_name,
        public_key: node.public_key,
        allowed_event_types: node.allowed_event_types,
        enabled: node.enabled ?? true,
      },
      { onConflict: 'node_id' }
    )
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to upsert federated node: ${error?.message}`);
  }

  return data as FederatedNode;
}

/**
 * Disable federated node
 *
 * Revokes trust without deleting history
 */
export async function disableFederatedNode(nodeId: string): Promise<void> {
  const { error } = await supabaseServer
    .from('federated_nodes')
    .update({ enabled: false })
    .eq('node_id', nodeId);

  if (error) {
    throw new Error(`Failed to disable federated node: ${error.message}`);
  }
}
