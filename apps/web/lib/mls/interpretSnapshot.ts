/**
 * MLS Snapshot Interpreter
 *
 * The Translation Layer (Critical Moat)
 *
 * This produces context, not commands.
 * No automation fires from MLS alone.
 *
 * MLS data is:
 * - Contextual
 * - Advisory
 * - Informative
 *
 * Never:
 * - Authoritative
 * - Decisive
 * - Enforceable
 */

import type { InterpretedMLSSnapshot } from './types';

/**
 * Interpret MLS snapshot
 *
 * Maps raw MLS data to standardized context.
 * Different MLSs have different schemas; this normalizes.
 */
export function interpretMLSSnapshot(
  snapshot: Record<string, unknown>
): InterpretedMLSSnapshot {
  // Different MLSs use different field names
  // This would need to be MLS-specific in production

  const status = normalizeMLSStatus(snapshot.StandardStatus as string);

  return {
    // Inferred, not authoritative
    inferredStatus: snapshot.StandardStatus as string || 'unknown',

    // Property details
    price: extractNumber(snapshot.ListPrice),
    propertyAddress: extractString(snapshot.UnparsedAddress),
    beds: extractNumber(snapshot.BedroomsTotal),
    baths: extractNumber(snapshot.BathroomsTotalInteger),
    sqft: extractNumber(snapshot.LivingArea),

    // Agent/Office attribution
    listingAgent: extractString(snapshot.ListAgentFullName),
    listingOffice: extractString(snapshot.ListOfficeName),

    // Timestamps
    lastUpdated: extractString(snapshot.ModificationTimestamp) || new Date().toISOString(),

    // Status (advisory only)
    mlsStatus: status,
  };
}

/**
 * Normalize MLS status to standard set
 *
 * Different MLSs use different status values
 */
function normalizeMLSStatus(
  rawStatus: string
): 'active' | 'pending' | 'sold' | 'expired' | 'withdrawn' | 'unknown' {
  if (!rawStatus) return 'unknown';

  const normalized = rawStatus.toLowerCase();

  if (normalized.includes('active')) return 'active';
  if (normalized.includes('pending')) return 'pending';
  if (normalized.includes('sold') || normalized.includes('closed')) return 'sold';
  if (normalized.includes('expired')) return 'expired';
  if (normalized.includes('withdrawn') || normalized.includes('canceled')) return 'withdrawn';

  return 'unknown';
}

/**
 * Extract number from various formats
 */
function extractNumber(value: unknown): number | null {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(/[^0-9.-]/g, ''));
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

/**
 * Extract string safely
 */
function extractString(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return null;
  return String(value);
}

/**
 * Compare MLS status with internal state
 *
 * Example:
 * - MLS says "Active"
 * - RealEstate-OS says "Under Contract"
 * → RealEstate-OS wins internally
 *
 * This function detects discrepancies for operator awareness.
 */
export function compareMLSWithInternal(
  mlsStatus: string,
  internalState: string
): {
  conflict: boolean;
  reason?: string;
} {
  // Normalize for comparison
  const mls = mlsStatus.toLowerCase();
  const internal = internalState.toLowerCase();

  // No conflict if they match semantically
  if (
    (mls.includes('active') && internal.includes('qualified')) ||
    (mls.includes('pending') && internal.includes('contract')) ||
    (mls.includes('sold') && internal.includes('completed'))
  ) {
    return { conflict: false };
  }

  // Detect conflicts
  if (mls.includes('active') && internal.includes('contract')) {
    return {
      conflict: true,
      reason: 'MLS shows Active but deal is Under Contract internally',
    };
  }

  if (mls.includes('pending') && internal === 'qualified') {
    return {
      conflict: true,
      reason: 'MLS shows Pending but deal is only Qualified internally',
    };
  }

  // Default: Potential conflict (investigate)
  return {
    conflict: true,
    reason: 'MLS status does not match internal state',
  };
}
