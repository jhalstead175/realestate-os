/**
 * Pending Events Registry
 *
 * Ephemeral client-side registry of pending events.
 *
 * This registry:
 * - Is NOT persisted
 * - Is NOT authoritative
 * - Is cleared on reload
 *
 * Perfect. Optimism = visual pending, not logical advancement.
 */

'use client';

import { useState } from 'react';

export function usePendingEvents() {
  const [pending, setPending] = useState<Set<string>>(new Set());

  function markPending(eventId: string) {
    setPending((prev) => new Set(prev).add(eventId));
  }

  function resolve(eventId: string) {
    setPending((prev) => {
      const next = new Set(prev);
      next.delete(eventId);
      return next;
    });
  }

  return { pending, markPending, resolve };
}
