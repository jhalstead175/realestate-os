/**
 * Timeline Component
 *
 * Displays chronological event history.
 * Calming, read-only, truth-preserving.
 */

import { TimelineItem } from './TimelineItem';

interface TimelineEvent {
  id: string;
  type: string;
  createdAt: string;
  actorType: string;
  summary: string;
}

interface Props {
  events: TimelineEvent[];
}

export function Timeline({ events }: Props) {
  if (!events || events.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No events recorded yet.
      </div>
    );
  }

  return (
    <div className="relative border-l border-gray-200">
      {events.map((e, idx) => (
        <TimelineItem
          key={e.id}
          event={e}
          isFirst={idx === 0}
          isLast={idx === events.length - 1}
        />
      ))}
    </div>
  );
}
