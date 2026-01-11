/**
 * Dead-Letter List Component
 *
 * Client component for displaying and managing dead letters.
 */

'use client';

import { useState } from 'react';

interface DeadLetter {
  id: string;
  automation_id: string;
  agent: string;
  aggregate_id: string;
  triggering_event_id: string;
  failure_stage: string;
  error_message: string;
  error_stack: string | null;
  input_snapshot: unknown;
  created_at: string;
  resolved: boolean;
}

export function DeadLetterList({ items }: { items: DeadLetter[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function handleMarkResolved(id: string) {
    // TODO: Implement resolution API
    console.log('Mark resolved:', id);
  }

  async function handleReplay(item: DeadLetter) {
    // TODO: Implement replay functionality
    console.log('Replay automation:', item);
  }

  if (items.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500 border border-gray-200 rounded-lg">
        No unresolved dead letters
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const isExpanded = expandedId === item.id;

        return (
          <div
            key={item.id}
            className="border border-red-200 rounded-lg p-6 bg-red-50"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-1 bg-red-600 text-white text-xs font-medium rounded">
                    {item.failure_stage}
                  </span>
                  <h3 className="font-semibold text-lg">
                    {item.automation_id}
                  </h3>
                </div>
                <p className="text-sm text-gray-600">
                  Agent: <span className="font-mono">{item.agent}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(item.created_at).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Error Message */}
            <div className="mb-4 p-4 bg-white rounded border border-red-300">
              <p className="text-sm font-medium text-red-700 mb-2">
                Error:
              </p>
              <p className="text-sm text-gray-900 font-mono">
                {item.error_message}
              </p>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
              <div>
                <span className="text-gray-600">Aggregate ID:</span>
                <p className="font-mono text-gray-900">{item.aggregate_id}</p>
              </div>
              <div>
                <span className="text-gray-600">Triggering Event:</span>
                <p className="font-mono text-gray-900">{item.triggering_event_id}</p>
              </div>
            </div>

            {/* Expandable Details */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : item.id)}
              className="text-sm text-blue-600 hover:text-blue-800 mb-4"
            >
              {isExpanded ? '▼ Hide details' : '▶ Show details'}
            </button>

            {isExpanded && (
              <div className="space-y-4">
                {/* Stack Trace */}
                {item.error_stack && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Stack Trace:
                    </p>
                    <pre className="text-xs bg-gray-900 text-green-400 p-4 rounded overflow-x-auto max-h-64 overflow-y-auto">
                      {item.error_stack}
                    </pre>
                  </div>
                )}

                {/* Input Snapshot */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Input Snapshot:
                  </p>
                  <pre className="text-xs bg-gray-100 p-4 rounded overflow-x-auto max-h-64 overflow-y-auto">
                    {JSON.stringify(item.input_snapshot, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-end mt-4">
              <button
                onClick={() => handleReplay(item)}
                className="px-4 py-2 border border-blue-300 rounded-md hover:bg-blue-50 text-sm"
              >
                Replay
              </button>
              <button
                onClick={() => handleMarkResolved(item.id)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
              >
                Mark Resolved
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
