/**
 * Database Access Layer - Public API
 *
 * Server-only database queries.
 * All queries use service role client (bypasses RLS).
 */

// Events
export {
  loadTransactionEvents,
  loadEvents,
  emitEvent,
} from './events';

// Authorities
export {
  loadAuthorityEvents,
  grantAuthority,
  revokeAuthority,
} from './authorities';

// Attestations
export {
  loadAttestations,
  getLatestAttestation,
  storeAttestation,
} from './attestations';
