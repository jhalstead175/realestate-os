/**
 * Timeline Item Component
 *
 * Single event in timeline.
 * No colors that imply urgency, no buttons, no editing.
 */

interface TimelineEvent {
  id: string;
  type: string;
  createdAt: string;
  actorType: string;
  summary: string;
}

interface Props {
  event: TimelineEvent;
  isFirst: boolean;
  isLast: boolean;
}

export function TimelineItem({ event, isFirst, isLast }: Props) {
  return (
    <div className="relative pl-8 pb-8">
      {/* Timeline Dot */}
      <span className="absolute left-0 top-0 -translate-x-1/2 flex items-center justify-center w-4 h-4 rounded-full bg-white border-2 border-gray-300" />

      {/* Event Content */}
      <div className="flex flex-col gap-1">
        <time className="text-xs text-gray-400">
          {new Date(event.createdAt).toLocaleString()}
        </time>
        <div className="font-medium text-sm text-gray-900">{event.summary}</div>
        <div className="text-xs text-gray-500">Source: {event.actorType}</div>
      </div>
    </div>
  );
}
