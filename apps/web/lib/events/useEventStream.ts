/**
 * Event Stream Subscription
 *
 * Read-only event observation via Supabase Realtime.
 *
 * This listener:
 * - Observes facts
 * - Does NOT interpret them
 */

'use client';

import { useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Client-side Supabase client (uses anon key)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function useEventStream({
  aggregateId,
  onEventObserved,
}: {
  aggregateId: string;
  onEventObserved: (eventId: string) => void;
}) {
  useEffect(() => {
    const channel = supabase
      .channel(`events:${aggregateId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'events',
          filter: `entity_id=eq.${aggregateId}`,
        },
        (payload) => {
          onEventObserved(payload.new.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [aggregateId, onEventObserved]);
}
