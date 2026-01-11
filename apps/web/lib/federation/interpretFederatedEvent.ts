/**
 * Federated Event Interpreter
 *
 * Translates external facts into internal command proposals.
 * Federated events are INPUTS, not commands.
 *
 * These interpretations feed automation proposals, not direct state changes.
 */

import type { FederatedEvent } from './types';
import type { ProposedCommand } from '@/lib/automation';

export interface ReadinessImpact {
  node: string;
  satisfied: boolean;
  reason?: string;
  blocking?: boolean;
}

export interface FederatedEventInterpretation {
  proposedCommand?: ProposedCommand;
  readinessImpact?: ReadinessImpact;
  requiresHumanReview: boolean;
}

/**
 * Interpret lender federated event
 *
 * Lenders inform readiness and propose informational commands
 */
export function interpretLenderEvent(
  event: FederatedEvent
): FederatedEventInterpretation | null {
  switch (event.event_type) {
    case 'LOAN_STATUS_UPDATED': {
      const status = event.payload.status as string;

      return {
        readinessImpact: {
          node: 'lender_approval',
          satisfied: status === 'APPROVED' || status === 'CLEAR_TO_CLOSE',
          reason: event.payload.reason as string | undefined,
        },
        requiresHumanReview: false,
      };
    }

    case 'CONDITIONS_OUTSTANDING': {
      return {
        proposedCommand: {
          type: 'FLAG_LENDER_CONDITIONS',
          justification: 'Lender reported outstanding conditions',
          payload: {
            conditions: event.payload.conditions,
            source_event_id: event.id,
          },
        },
        readinessImpact: {
          node: 'lender_conditions',
          satisfied: false,
          reason: 'Outstanding lender conditions',
        },
        requiresHumanReview: true,
      };
    }

    case 'DOCUMENT_RECEIVED': {
      return {
        proposedCommand: {
          type: 'MARK_DOCUMENT_RECEIVED',
          justification: `Lender confirmed receipt: ${event.payload.document_type}`,
          payload: {
            document_type: event.payload.document_type,
            source_event_id: event.id,
          },
        },
        requiresHumanReview: false,
      };
    }

    case 'CLEAR_TO_CLOSE': {
      return {
        readinessImpact: {
          node: 'lender_clear_to_close',
          satisfied: true,
          reason: 'Lender issued clear to close',
        },
        requiresHumanReview: false,
      };
    }

    case 'APPRAISAL_COMPLETED':
    case 'UNDERWRITING_COMPLETED':
    case 'FUNDING_CONFIRMED': {
      // Informational events that update readiness
      return {
        readinessImpact: {
          node: `lender_${event.event_type.toLowerCase()}`,
          satisfied: true,
        },
        requiresHumanReview: false,
      };
    }

    default:
      console.warn('Unknown lender event type:', event.event_type);
      return null;
  }
}

/**
 * Interpret title federated event
 *
 * Title facts are evidentiary and may block readiness
 */
export function interpretTitleEvent(
  event: FederatedEvent
): FederatedEventInterpretation | null {
  switch (event.event_type) {
    case 'TITLE_REPORT_ISSUED': {
      return {
        readinessImpact: {
          node: 'title_report',
          satisfied: true,
          reason: 'Preliminary title report issued',
        },
        requiresHumanReview: false,
      };
    }

    case 'TITLE_EXCEPTION_FOUND': {
      const severity = event.payload.severity as string;

      return {
        proposedCommand: {
          type: 'FLAG_TITLE_EXCEPTION',
          justification: `Title exception found: ${event.payload.description}`,
          payload: {
            exception_type: event.payload.exception_type,
            description: event.payload.description,
            severity,
            document_refs: event.payload._documentRefs,
            source_event_id: event.id,
          },
        },
        readinessImpact: {
          node: 'title_clearance',
          satisfied: false,
          reason: event.payload.description as string,
          blocking: severity === 'blocking',
        },
        requiresHumanReview: true,
      };
    }

    case 'TITLE_CLEARED': {
      return {
        readinessImpact: {
          node: 'title_clearance',
          satisfied: true,
          reason: 'Title cleared by title company',
        },
        requiresHumanReview: false,
      };
    }

    case 'SETTLEMENT_STATEMENT_READY': {
      return {
        proposedCommand: {
          type: 'ATTACH_SETTLEMENT_STATEMENT',
          justification: 'Title company provided settlement statement',
          payload: {
            document_refs: event.payload._documentRefs,
            source_event_id: event.id,
          },
        },
        requiresHumanReview: true,
      };
    }

    case 'COMMITMENT_ISSUED': {
      return {
        readinessImpact: {
          node: 'title_commitment',
          satisfied: true,
          reason: 'Title commitment issued',
        },
        requiresHumanReview: false,
      };
    }

    case 'TITLE_SEARCH_COMPLETED': {
      return {
        readinessImpact: {
          node: 'title_search',
          satisfied: true,
        },
        requiresHumanReview: false,
      };
    }

    default:
      console.warn('Unknown title event type:', event.event_type);
      return null;
  }
}

/**
 * Interpret insurance federated event
 *
 * Insurance attests to coverage; the system decides sufficiency
 */
export function interpretInsuranceEvent(
  event: FederatedEvent
): FederatedEventInterpretation | null {
  switch (event.event_type) {
    case 'POLICY_BOUND': {
      const effectiveDate = event.payload.effective_date as string;
      const expirationDate = event.payload.expiration_date as string;

      return {
        readinessImpact: {
          node: 'insurance_bound',
          satisfied: true,
          reason: `Policy bound, effective ${effectiveDate}`,
        },
        requiresHumanReview: false,
      };
    }

    case 'BINDER_ISSUED': {
      return {
        readinessImpact: {
          node: 'insurance_binder',
          satisfied: true,
          reason: 'Insurance binder issued',
        },
        requiresHumanReview: false,
      };
    }

    case 'COVERAGE_CHANGED': {
      return {
        proposedCommand: {
          type: 'NOTIFY_COVERAGE_CHANGE',
          justification: 'Insurance coverage was modified',
          payload: {
            previous_coverage: event.payload.previous_coverage,
            new_coverage: event.payload.new_coverage,
            source_event_id: event.id,
          },
        },
        requiresHumanReview: true,
      };
    }

    case 'COVERAGE_LAPSED': {
      return {
        proposedCommand: {
          type: 'FLAG_COVERAGE_LAPSE',
          justification: 'Insurance coverage has lapsed',
          payload: {
            lapse_date: event.payload.lapse_date,
            reason: event.payload.reason,
            source_event_id: event.id,
          },
        },
        readinessImpact: {
          node: 'insurance_bound',
          satisfied: false,
          reason: 'Coverage lapsed',
          blocking: true,
        },
        requiresHumanReview: true,
      };
    }

    case 'QUOTE_ISSUED': {
      return {
        readinessImpact: {
          node: 'insurance_quote',
          satisfied: true,
        },
        requiresHumanReview: false,
      };
    }

    case 'POLICY_ISSUED': {
      return {
        readinessImpact: {
          node: 'insurance_policy',
          satisfied: true,
          reason: 'Insurance policy issued',
        },
        requiresHumanReview: false,
      };
    }

    default:
      console.warn('Unknown insurance event type:', event.event_type);
      return null;
  }
}

/**
 * Interpret federated event based on source node type
 */
export function interpretFederatedEvent(
  event: FederatedEvent,
  nodeType: 'lender' | 'title' | 'insurance'
): FederatedEventInterpretation | null {
  switch (nodeType) {
    case 'lender':
      return interpretLenderEvent(event);
    case 'title':
      return interpretTitleEvent(event);
    case 'insurance':
      return interpretInsuranceEvent(event);
    default:
      return null;
  }
}
