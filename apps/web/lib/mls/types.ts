/**
 * MLS Types
 *
 * MLS is a read-only, untrusted, periodic data source.
 * MLS data is contextual, advisory, informative — never authoritative.
 */

export interface MLSSnapshot {
  id: string;
  mls_id: string;
  listing_id: string;
  snapshot: Record<string, unknown>;
  retrieved_at: string;
  transaction_id: string | null;
  processed: boolean;
  processed_at: string | null;
}

export interface MLSSource {
  mls_id: string;
  display_name: string;
  region: string | null;
  enabled: boolean;
  ingestion_frequency_hours: number;
  credentials: Record<string, unknown> | null;
  trust_level: 'advisory' | 'contextual';
  last_ingestion_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MLSAttribution {
  id: string;
  transaction_id: string;
  mls_id: string;
  listing_id: string;
  attributed_at: string;
  attributed_by: string | null;
  active: boolean;
}

/**
 * Interpreted MLS data
 *
 * This is context, not commands.
 * No automation fires from MLS alone.
 */
export interface InterpretedMLSSnapshot {
  inferredStatus: string;
  price: number | null;
  lastUpdated: string;
  propertyAddress: string | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  listingAgent: string | null;
  listingOffice: string | null;
  // MLS status is advisory only
  mlsStatus: 'active' | 'pending' | 'sold' | 'expired' | 'withdrawn' | 'unknown';
}
