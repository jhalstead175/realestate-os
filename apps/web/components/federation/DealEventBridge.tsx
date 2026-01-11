/**
 * Deal Event Bridge
 *
 * Headless bridge component that connects event stream to pending events.
 *
 * When event arrives:
 * - Pending registry updated
 * - Server projection updates
 * - Page revalidates
 * - buildDecisionContext() runs again
 * - New RealityStrip / CommandRail render
 *
 * No client state reconciliation needed.
 */

'use client';

import { useEventStream } from '@/lib/events/useEventStream';
import { usePendingEvents } from '@/lib/events/usePendingEvents';

export function DealEventBridge({ aggregateId }: { aggregateId: string }) {
  const { resolve } = usePendingEvents();

  useEventStream({
    aggregateId,
    onEventObserved: (eventId) => {
      resolve(eventId);
    },
  });

  return null; // Headless
}
