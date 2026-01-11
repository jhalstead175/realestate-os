/**
 * Audit Narrative Page
 *
 * "This is the same explanation we give regulators."
 *
 * Shows deterministic, plain-English narrative of transaction.
 * Read-only. Exportable. Defensible.
 */

import { buildDecisionContext } from '@/lib/execution';
import { generateAuditNarrative, formatNarrativeAsText } from '@/lib/narrative/generateAuditNarrative';

export default async function NarrativePage({
  params,
}: {
  params: { id: string };
}) {
  const transactionId = params.id;

  // Build decision context
  const decisionContext = await buildDecisionContext({
    actorId: 'AUDIT_VIEWER',
    transactionId,
  });

  // Generate narrative
  const narrative = await generateAuditNarrative({
    decisionContext,
    dealId: transactionId,
    purpose: 'Executive Review',
  });

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Narrative</h1>
          <p className="text-sm text-gray-600 mt-1">
            Deal {transactionId}
          </p>
        </div>

        {/* Export Actions */}
        <div className="flex gap-2">
          <a
            href={`/api/narrative/${transactionId}?format=text`}
            download
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
          >
            Download .txt
          </a>
          <a
            href={`/api/narrative/${transactionId}?format=json`}
            download
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            Download .json
          </a>
        </div>
      </div>

      {/* Metadata */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <span className="text-gray-600">Generated:</span>
            <p className="font-medium text-gray-900">
              {new Date(narrative.generatedAt).toLocaleString()}
            </p>
          </div>
          <div>
            <span className="text-gray-600">Purpose:</span>
            <p className="font-medium text-gray-900">{narrative.generatedFor}</p>
          </div>
          <div>
            <span className="text-gray-600">Replayable:</span>
            <p className="font-medium text-gray-900">
              {narrative.replayable ? 'Yes' : 'No'}
            </p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <section className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Summary</h2>

        <div className="space-y-3 text-sm">
          <div>
            <span className="text-gray-600">Property:</span>
            <p className="font-medium text-gray-900">
              {narrative.summary.propertyAddress}
            </p>
          </div>

          <div>
            <span className="text-gray-600">Current State:</span>
            <p className="font-medium text-gray-900">
              {narrative.summary.currentState}
            </p>
          </div>

          <div>
            <span className="text-gray-600">Closing Readiness:</span>
            <p className="font-medium text-gray-900">
              {narrative.summary.closingReadiness}
            </p>
          </div>

          {narrative.summary.blockingIssues.length > 0 && (
            <div>
              <span className="text-gray-600">Blocking Issues:</span>
              <ul className="list-disc list-inside mt-1 text-red-700">
                {narrative.summary.blockingIssues.map((issue, idx) => (
                  <li key={idx}>{issue}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* Timeline */}
      <section className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Timeline of Actions</h2>

        <div className="space-y-4">
          {narrative.timeline.map((entry, idx) => (
            <div
              key={idx}
              className="border-l-2 border-blue-500 pl-4 pb-4 last:pb-0"
            >
              <div className="text-xs text-gray-500 mb-1">
                {new Date(entry.timestamp).toLocaleString()}
              </div>
              <div className="font-medium text-gray-900 mb-1">
                {entry.action}
              </div>
              <div className="text-sm text-gray-700 mb-1">
                Actor: {entry.actor}
              </div>
              {entry.justification && (
                <div className="text-sm text-gray-600 mb-1">
                  Justification: {entry.justification}
                </div>
              )}
              <div className="text-sm text-gray-700 mb-1">
                Outcome: {entry.outcome}
              </div>
              <div className="text-xs font-mono text-gray-500">
                Event ID: {entry.eventId}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Authority Chain */}
      <section className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Authority Chain</h2>

        <div className="space-y-3">
          {narrative.authorityChain.map((auth, idx) => (
            <div
              key={idx}
              className="border border-gray-200 rounded-lg p-4 text-sm"
            >
              <div className="font-medium text-gray-900 mb-2">{auth.actor}</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-600">Authority:</span>
                  <p className="font-mono">{auth.authorityGranted}</p>
                </div>
                <div>
                  <span className="text-gray-600">Granted By:</span>
                  <p>{auth.grantedBy}</p>
                </div>
                <div>
                  <span className="text-gray-600">Granted At:</span>
                  <p>{new Date(auth.grantedAt).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-600">Active:</span>
                  <p className={auth.currentlyActive ? 'text-green-600' : 'text-red-600'}>
                    {auth.currentlyActive ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>
              <div className="text-xs font-mono text-gray-500 mt-2">
                Event ID: {auth.eventId}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Readiness Analysis */}
      <section className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Closing Readiness Analysis</h2>

        <div className="mb-4">
          <div className="text-sm text-gray-600">Overall Status:</div>
          <div className="text-lg font-semibold text-gray-900">
            {narrative.readinessAnalysis.overallStatus.toUpperCase()}
          </div>
          <div className="text-sm text-gray-700 mt-1">
            {narrative.readinessAnalysis.reasoning}
          </div>
        </div>

        <div className="space-y-3">
          {narrative.readinessAnalysis.nodes.map((node, idx) => (
            <div
              key={idx}
              className={`border rounded-lg p-4 ${
                node.status === 'satisfied'
                  ? 'bg-green-50 border-green-200'
                  : node.status === 'blocking'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-yellow-50 border-yellow-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">{node.label}</span>
                <span className="text-xs px-2 py-1 rounded bg-white">
                  {node.status.toUpperCase()}
                </span>
              </div>
              <div className="text-sm text-gray-700 mb-2">
                Evidence: {node.evidence}
              </div>
              <div className="text-xs text-gray-600">
                Source: {node.source} • Verified: {new Date(node.verifiedAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Federated Interactions */}
      <section className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Federated Interactions</h2>

        <div className="space-y-4">
          {narrative.federatedInteractions.map((fed, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg p-4">
              <div className="font-medium text-gray-900 mb-3">
                {fed.displayName} ({fed.nodeType})
              </div>

              <div className="space-y-2">
                {fed.interactions.map((interaction, iIdx) => (
                  <div
                    key={iIdx}
                    className="text-sm bg-gray-50 rounded p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{interaction.eventType}</span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          interaction.signatureVerified
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {interaction.signatureVerified ? 'Verified' : 'Unverified'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mb-1">
                      {new Date(interaction.timestamp).toLocaleString()}
                    </div>
                    <div className="text-xs font-mono text-gray-500">
                      Event ID: {interaction.eventId}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs text-gray-600">
        <p className="mb-2">
          This narrative is deterministically generated from the canonical event stream.
        </p>
        <p>
          Any authorized party can reproduce these conclusions by replaying the events.
          All event IDs are verifiable against the immutable event log.
        </p>
      </div>
    </div>
  );
}
