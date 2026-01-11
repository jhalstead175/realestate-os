/**
 * Federation Types
 *
 * Type definitions for cross-organizational federation.
 * Federated nodes exchange signed facts, not mutations.
 */

export type NodeType = 'lender' | 'title' | 'insurance';

/**
 * Federated Node
 *
 * External system with explicit trust boundaries
 */
export interface FederatedNode {
  node_id: string;
  node_type: NodeType;
  display_name: string;
  public_key: string;
  allowed_event_types: string[];
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Federated Event
 *
 * Signed fact from external node
 * These are inputs, not commands
 */
export interface FederatedEvent {
  id: string;
  source_node: string;
  aggregate_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  signature: string;
  received_at: string;
  processed: boolean;
  processed_at: string | null;
}

/**
 * Federated Event Submission
 *
 * Wire format for external node submissions
 */
export interface FederatedEventSubmission {
  nodeId: string;
  aggregateId: string;
  eventType: string;
  payload: Record<string, unknown>;
  signature: string;
}

/**
 * Lender Event Types
 *
 * Explicit enumeration of allowed lender events
 */
export type LenderEventType =
  | 'LOAN_STATUS_UPDATED'
  | 'CONDITIONS_OUTSTANDING'
  | 'DOCUMENT_RECEIVED'
  | 'APPRAISAL_COMPLETED'
  | 'UNDERWRITING_COMPLETED'
  | 'CLEAR_TO_CLOSE'
  | 'FUNDING_CONFIRMED';

/**
 * Title Event Types
 */
export type TitleEventType =
  | 'TITLE_SEARCH_COMPLETED'
  | 'TITLE_EXCEPTION_FOUND'
  | 'TITLE_CLEARED'
  | 'COMMITMENT_ISSUED';

/**
 * Insurance Event Types
 */
export type InsuranceEventType =
  | 'QUOTE_ISSUED'
  | 'BINDER_ISSUED'
  | 'POLICY_ISSUED';

/**
 * All allowed federated event types
 */
export type FederatedEventType =
  | LenderEventType
  | TitleEventType
  | InsuranceEventType;
