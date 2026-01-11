/**
 * Canonical JSON Serialization
 *
 * Ensures deterministic JSON representation for signing and hashing.
 * This is critical for verification across nodes.
 */

/**
 * Canonicalize data for signing/hashing
 *
 * Rules:
 * - Keys are sorted alphabetically
 * - No whitespace
 * - Consistent encoding of dates, numbers, etc.
 *
 * @param data - Data to canonicalize
 * @returns Canonical JSON string
 */
export function canonicalize(data: unknown): string {
  return JSON.stringify(data, replacer, 0);
}

/**
 * JSON.stringify replacer for canonical encoding
 */
function replacer(_key: string, value: unknown): unknown {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    // Sort object keys
    const sorted: Record<string, unknown> = {};
    Object.keys(value)
      .sort()
      .forEach((k) => {
        sorted[k] = (value as Record<string, unknown>)[k];
      });
    return sorted;
  }

  // Convert Dates to ISO strings
  if (value instanceof Date) {
    return value.toISOString();
  }

  return value;
}
