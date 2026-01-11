/**
 * Execution Spine - Public API
 *
 * This is the enforcement layer that makes illegal actions impossible.
 *
 * If the selector is correct, the system is correct.
 */

// Core types
export type {
  TransactionState,
  ClosingReadinessState,
  AuthorityScope,
  DecisionContext,
  CommandResolution,
} from './types';

// Decision context builder (entry point)
export { buildDecisionContext, validateDecisionContext } from './buildContext';

// Command resolution (the law)
export {
  resolveAvailableCommand,
  getActionLabel,
  getActionColor,
  requiresJustification,
} from './commandResolution';

// Event folding (state derivation)
export {
  foldTransactionState,
  foldAuthority,
  deriveRoleFromAuthority,
  detectBlockingEvent,
  hasUnresolvedContingencies,
} from './eventFolding';

// Server selectors (for direct use if needed)
export {
  getTransactionState,
  getClosingReadiness,
  getAuthorityScope,
} from './selectors';

// API guards (enforcement at endpoint layer)
export {
  guardCommand,
  guardAttestationIssuance,
  guardAttestationWithdrawal,
  getCommandResolution,
} from './apiGuard';
