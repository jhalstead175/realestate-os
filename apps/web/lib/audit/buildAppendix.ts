/**
 * Appendix Builder
 *
 * Constructs exhibits for audit narrative:
 * - Appendix A: Federated Document References (with hashes)
 * - Appendix B: Event Ledger (complete event ID list)
 *
 * Critical for legal discovery and regulatory compliance.
 */

export interface FederatedDocReference {
  type: string;
  hash: string;
  source: string;
  receivedAt: string;
}

export interface EventLedgerEntry {
  id: string;
  type: string;
  timestamp: string;
}

export interface AuditAppendix {
  federatedDocs: FederatedDocReference[];
  eventIds: EventLedgerEntry[];
}

/**
 * Build appendix from federated events and canonical events
 *
 * @param federatedEvents - Signed facts from external nodes
 * @param events - Canonical event stream
 * @returns Structured appendix data
 */
export function buildAppendix({
  federatedEvents,
  events,
}: {
  federatedEvents: any[];
  events: any[];
}): AuditAppendix {
  // Appendix A: Federated Document References
  const federatedDocs: FederatedDocReference[] = federatedEvents.map((e) => {
    const documentRefs = e.payload?._documentRefs || [];
    const hashes = documentRefs.map((d: any) => d.hash).join(', ');

    return {
      type: e.event_type,
      hash: hashes || 'N/A',
      source: e.source_node,
      receivedAt: e.received_at,
    };
  });

  // Appendix B: Event Ledger
  const eventIds: EventLedgerEntry[] = events.map((e) => ({
    id: e.id,
    type: e.event_type,
    timestamp: e.occurred_at || e.created_at,
  }));

  return {
    federatedDocs,
    eventIds,
  };
}
