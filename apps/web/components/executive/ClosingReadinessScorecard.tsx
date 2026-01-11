/**
 * Closing Readiness Scorecard
 *
 * The Anchor - Visual truth at a glance.
 *
 * Horizontal bar showing key readiness nodes:
 * - Green = satisfied
 * - Red = blocking
 * - Amber = satisfied but fragile
 *
 * Hover/click reveals exact reason.
 */

'use client';

import { useState } from 'react';

export interface ReadinessNode {
  id: string;
  label: string;
  status: 'satisfied' | 'blocking' | 'fragile' | 'unknown';
  reason?: string;
  source?: string;
  lastUpdated?: string;
}

export function ClosingReadinessScorecard({
  nodes,
}: {
  nodes: ReadinessNode[];
}) {
  const [expandedNode, setExpandedNode] = useState<string | null>(null);

  function getStatusColor(status: ReadinessNode['status']): string {
    switch (status) {
      case 'satisfied':
        return 'bg-green-500';
      case 'blocking':
        return 'bg-red-500';
      case 'fragile':
        return 'bg-amber-500';
      case 'unknown':
        return 'bg-gray-400';
    }
  }

  function getStatusIcon(status: ReadinessNode['status']): string {
    switch (status) {
      case 'satisfied':
        return '✓';
      case 'blocking':
        return '✕';
      case 'fragile':
        return '⚠';
      case 'unknown':
        return '?';
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4">Closing Readiness</h2>

      {/* Horizontal Scorecard */}
      <div className="flex gap-2 mb-4">
        {nodes.map((node) => {
          const isExpanded = expandedNode === node.id;

          return (
            <button
              key={node.id}
              onClick={() => setExpandedNode(isExpanded ? null : node.id)}
              className={`
                flex-1 py-3 px-4 rounded-md text-white font-medium
                transition-all duration-200
                ${getStatusColor(node.status)}
                ${isExpanded ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
                hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
              `}
            >
              <div className="text-sm">{node.label}</div>
              <div className="text-2xl">{getStatusIcon(node.status)}</div>
            </button>
          );
        })}
      </div>

      {/* Expanded Detail */}
      {expandedNode && (
        <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
          {(() => {
            const node = nodes.find((n) => n.id === expandedNode);
            if (!node) return null;

            return (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {node.label}
                </h3>

                {node.reason && (
                  <p className="text-sm text-gray-700 mb-2">{node.reason}</p>
                )}

                {node.source && (
                  <p className="text-xs text-gray-600">
                    Source: <span className="font-mono">{node.source}</span>
                  </p>
                )}

                {node.lastUpdated && (
                  <p className="text-xs text-gray-500 mt-1">
                    Last updated: {new Date(node.lastUpdated).toLocaleString()}
                  </p>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
