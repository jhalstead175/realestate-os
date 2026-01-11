/**
 * Federation Module - Public API
 *
 * Cross-organizational federation layer.
 * Federated nodes exchange signed facts, not mutations.
 *
 * Core Principles:
 * - Sovereignty: Each node owns its own state
 * - Explicit Trust: Trust granted per message type
 * - No Shared Mutability: No system can change another's reality
 * - Asymmetric Authority: External nodes inform, don't decide
 * - Audit First: Every interaction is inspectable
 */

// Types
export type {
  NodeType,
  FederatedNode,
  FederatedEvent,
  FederatedEventSubmission,
  LenderEventType,
  TitleEventType,
  InsuranceEventType,
  FederatedEventType,
} from './types';

// Database Access
export {
  loadFederatedNode,
  insertFederatedEvent,
  loadUnprocessedFederatedEvents,
  markFederatedEventProcessed,
  loadFederatedEventHistory,
  upsertFederatedNode,
  disableFederatedNode,
} from './db';

// Signature Verification
export { verifySignature, generateSignature } from './verifySignature';
export { verifyTitleSignature, type TitleDocumentRef } from './verifyTitleSignature';

// Event Interpretation
export {
  interpretFederatedEvent,
  interpretLenderEvent,
  interpretTitleEvent,
  interpretInsuranceEvent,
  type FederatedEventInterpretation,
  type ReadinessImpact,
} from './interpretFederatedEvent';

// Event Processing
export {
  processFederatedEvents,
  triggerFederatedEventProcessing,
} from './processFederatedEvents';
