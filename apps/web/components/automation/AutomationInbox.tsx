/**
 * Automation Inbox
 *
 * Human review surface for pending automation proposals.
 *
 * Displays:
 * - Triggering event
 * - Agent justification
 * - Proposed command
 * - Approve / Reject buttons
 *
 * Approval → same API as manual command
 * (flows through enforcement spine)
 */

'use client';

import type { ProposedCommand } from '@/lib/automation';

interface PendingProposal {
  id: string;
  automationId: string;
  agent: string;
  triggeringEvent: {
    id: string;
    type: string;
    occurred_at: string;
  };
  proposal: ProposedCommand;
  contextHash: string;
}

export function AutomationInbox({
  proposals,
}: {
  proposals: PendingProposal[];
}) {
  async function handleApprove(proposal: PendingProposal) {
    // TODO: Call command API with proposal
    // Same flow as manual command
    console.log('Approving proposal:', proposal);
  }

  async function handleReject(proposal: PendingProposal) {
    // TODO: Mark proposal as rejected
    console.log('Rejecting proposal:', proposal);
  }

  if (proposals.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        No pending automation proposals
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {proposals.map((proposal) => (
        <div
          key={proposal.id}
          className="border border-gray-200 rounded-lg p-6 bg-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-lg">
                {proposal.proposal.type}
              </h3>
              <p className="text-sm text-gray-600">
                Triggered by: {proposal.triggeringEvent.type}
              </p>
            </div>
            <div className="text-xs text-gray-500">
              Agent: <span className="font-mono">{proposal.agent}</span>
            </div>
          </div>

          {/* Justification */}
          <div className="mb-4 p-4 bg-gray-50 rounded">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Justification:
            </p>
            <p className="text-sm text-gray-900">
              {proposal.proposal.justification}
            </p>
          </div>

          {/* Payload Preview */}
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Payload:</p>
            <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
              {JSON.stringify(proposal.proposal.payload, null, 2)}
            </pre>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => handleReject(proposal)}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Reject
            </button>
            <button
              onClick={() => handleApprove(proposal)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Approve
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
