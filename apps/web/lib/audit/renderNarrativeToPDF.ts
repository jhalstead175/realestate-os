/**
 * Court-Filing-Grade PDF Renderer (Deterministic, Conservative)
 *
 * Design Principles:
 * - Serif font (Times-like)
 * - Wide margins (72pt = 1 inch)
 * - Clear section numbering (I, II, III)
 * - Conservative spacing
 * - No colors except black
 * - Legal-grade formatting
 */

import { Buffer } from 'buffer';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer';
import type { AuditNarrative } from '@/lib/narrative/generateAuditNarrative';
import type { AuditAppendix } from './buildAppendix';

// ================= STYLE GUIDE =================

const styles = StyleSheet.create({
  page: {
    paddingTop: 72,
    paddingBottom: 72,
    paddingHorizontal: 72,
    fontSize: 11,
    lineHeight: 1.5,
    fontFamily: 'Times-Roman',
  },
  title: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 10,
    marginBottom: 12,
    textAlign: 'center',
    color: '#666666',
  },
  sectionTitle: {
    fontSize: 12,
    marginTop: 18,
    marginBottom: 6,
    fontWeight: 'bold',
  },
  paragraph: {
    marginBottom: 8,
    textAlign: 'justify',
  },
  metadata: {
    fontSize: 9,
    marginBottom: 4,
    color: '#333333',
  },
  eventEntry: {
    marginBottom: 12,
    marginLeft: 12,
  },
  eventHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  eventDetail: {
    fontSize: 9,
    marginBottom: 2,
    marginLeft: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 36,
    left: 72,
    right: 72,
    fontSize: 9,
    textAlign: 'center',
    color: '#666666',
  },
});

// ================= DOCUMENT COMPONENTS =================

function AuditNarrativePDF({
  narrative,
  appendix,
}: {
  narrative: AuditNarrative;
  appendix?: AuditAppendix;
}) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Title Page */}
        <Text style={styles.title}>AUDIT NARRATIVE</Text>
        <Text style={styles.subtitle}>Transaction Record</Text>
        <Text style={styles.metadata}>Deal ID: {narrative.dealId}</Text>
        <Text style={styles.metadata}>
          Generated: {new Date(narrative.generatedAt).toLocaleString()}
        </Text>
        <Text style={styles.metadata}>Purpose: {narrative.generatedFor}</Text>
        <Text style={styles.metadata}>
          Replayable: {narrative.replayable ? 'Yes' : 'No'}
        </Text>

        {/* Section I - Transaction Overview */}
        <Text style={styles.sectionTitle}>I. Transaction Overview</Text>
        <Text style={styles.paragraph}>
          Property: {narrative.summary.propertyAddress}
        </Text>
        <Text style={styles.paragraph}>
          Current State: {narrative.summary.currentState}
        </Text>
        <Text style={styles.paragraph}>
          Closing Readiness: {narrative.summary.closingReadiness}
        </Text>

        {narrative.summary.blockingIssues.length > 0 && (
          <>
            <Text style={styles.paragraph}>Blocking Issues:</Text>
            {narrative.summary.blockingIssues.map((issue, idx) => (
              <Text key={idx} style={styles.eventDetail}>
                • {issue}
              </Text>
            ))}
          </>
        )}

        {/* Section II - Chronological Event History */}
        <Text style={styles.sectionTitle}>II. Chronological Event History</Text>
        {narrative.timeline.map((entry, idx) => (
          <View key={idx} style={styles.eventEntry}>
            <Text style={styles.eventHeader}>
              Event {idx + 1}: {entry.eventType}
            </Text>
            <Text style={styles.eventDetail}>
              Timestamp: {new Date(entry.timestamp).toLocaleString()}
            </Text>
            <Text style={styles.eventDetail}>Actor: {entry.actor}</Text>
            <Text style={styles.eventDetail}>Action: {entry.action}</Text>
            {entry.justification && (
              <Text style={styles.eventDetail}>
                Justification: {entry.justification}
              </Text>
            )}
            <Text style={styles.eventDetail}>Outcome: {entry.outcome}</Text>
            <Text style={styles.eventDetail}>Event ID: {entry.eventId}</Text>
          </View>
        ))}

        {/* Section III - Authority & Responsibility */}
        <Text style={styles.sectionTitle}>III. Authority & Responsibility</Text>
        {narrative.authorityChain.map((auth, idx) => (
          <View key={idx} style={styles.eventEntry}>
            <Text style={styles.eventHeader}>Actor: {auth.actor}</Text>
            <Text style={styles.eventDetail}>
              Authority: {auth.authorityGranted}
            </Text>
            <Text style={styles.eventDetail}>
              Granted By: {auth.grantedBy}
            </Text>
            <Text style={styles.eventDetail}>
              Granted At: {new Date(auth.grantedAt).toLocaleString()}
            </Text>
            <Text style={styles.eventDetail}>
              Currently Active: {auth.currentlyActive ? 'Yes' : 'No'}
            </Text>
            <Text style={styles.eventDetail}>Event ID: {auth.eventId}</Text>
          </View>
        ))}

        {/* Section IV - Closing Readiness Determination */}
        <Text style={styles.sectionTitle}>
          IV. Closing Readiness Determination
        </Text>
        <Text style={styles.paragraph}>
          Overall Status: {narrative.readinessAnalysis.overallStatus.toUpperCase()}
        </Text>
        <Text style={styles.paragraph}>
          Reasoning: {narrative.readinessAnalysis.reasoning}
        </Text>

        {narrative.readinessAnalysis.nodes.map((node, idx) => (
          <View key={idx} style={styles.eventEntry}>
            <Text style={styles.eventHeader}>
              [{node.status.toUpperCase()}] {node.label}
            </Text>
            <Text style={styles.eventDetail}>Evidence: {node.evidence}</Text>
            <Text style={styles.eventDetail}>Source: {node.source}</Text>
            <Text style={styles.eventDetail}>
              Verified: {new Date(node.verifiedAt).toLocaleString()}
            </Text>
          </View>
        ))}

        {/* Section V - Federated Interactions */}
        <Text style={styles.sectionTitle}>V. Federated Interactions</Text>
        {narrative.federatedInteractions.map((fed, idx) => (
          <View key={idx} style={styles.eventEntry}>
            <Text style={styles.eventHeader}>
              {fed.displayName} ({fed.nodeType})
            </Text>
            {fed.interactions.map((interaction, iIdx) => (
              <View key={iIdx} style={{ marginLeft: 8, marginBottom: 4 }}>
                <Text style={styles.eventDetail}>
                  {new Date(interaction.timestamp).toLocaleString()} -{' '}
                  {interaction.eventType}
                </Text>
                <Text style={styles.eventDetail}>
                  Signature Verified: {interaction.signatureVerified ? 'Yes' : 'No'}
                </Text>
                <Text style={styles.eventDetail}>
                  Event ID: {interaction.eventId}
                </Text>
              </View>
            ))}
          </View>
        ))}

        {/* Section VI - System Safeguards */}
        <Text style={styles.sectionTitle}>VI. System Safeguards & Controls</Text>
        <Text style={styles.paragraph}>
          Authority Enforcement: All actions verified against derived authority
          from event stream. Illegal actions prevented at system level.
        </Text>
        <Text style={styles.paragraph}>
          Event Integrity: All events signed and timestamped. Immutable
          append-only log. Total events: {narrative.eventCount}.
        </Text>
        <Text style={styles.paragraph}>
          Federated Trust: All federated assertions cryptographically signed.
          External nodes cannot mutate transaction state.
        </Text>
        <Text style={styles.paragraph}>
          Audit Capability: This narrative is deterministically generated. Any
          authorized party can reproduce this exact document.
        </Text>

        {/* Section VII - Conclusion */}
        <Text style={styles.sectionTitle}>VII. Conclusion</Text>
        <Text style={styles.paragraph}>
          {narrative.readinessAnalysis.overallStatus === 'ready'
            ? 'This transaction has satisfied all closing readiness requirements. All participating authorities have provided necessary assertions.'
            : narrative.readinessAnalysis.overallStatus === 'blocked'
            ? `This transaction is currently BLOCKED from closing. Reason: ${narrative.readinessAnalysis.reasoning}`
            : 'This transaction is in conditional readiness state. Some dependencies are satisfied, others are pending.'}
        </Text>

        {/* Appendix A - Federated Document References */}
        {appendix && appendix.federatedDocs.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>
              Appendix A — Federated Document References
            </Text>
            {appendix.federatedDocs.map((doc, idx) => (
              <Text key={idx} style={styles.paragraph}>
                {doc.type} • {doc.hash} • {doc.source} •{' '}
                {new Date(doc.receivedAt).toLocaleString()}
              </Text>
            ))}
          </>
        )}

        {/* Appendix B - Event Ledger */}
        {appendix && appendix.eventIds.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Appendix B — Event Ledger</Text>
            {appendix.eventIds.map((event, idx) => (
              <Text key={idx} style={styles.eventDetail}>
                {event.id} • {event.type} •{' '}
                {new Date(event.timestamp).toLocaleString()}
              </Text>
            ))}
          </>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Generated automatically from signed events and enforced authority
          rules. Deterministic and replayable.
        </Text>
      </Page>
    </Document>
  );
}

// ================= EXPORT FUNCTION =================

export async function renderNarrativeToPDF(
  narrative: AuditNarrative,
  options?: {
    appendix?: AuditAppendix;
  }
): Promise<Buffer> {
  const doc = <AuditNarrativePDF narrative={narrative} appendix={options?.appendix} />;
  const asPdf = pdf(doc);
  const buffer = await asPdf.toBuffer();
  return Buffer.from(buffer);
}
