/**
 * MLS Sync Worker
 *
 * Pulls listings from MLS systems (BrightMLS, CalRES, etc.)
 *
 * CRITICAL: Syncs property data ONLY.
 * NEVER syncs authority, roles, or permissions.
 * MLS is advisory, not authoritative.
 */

import { supabaseServer } from '@/lib/supabase/server';

export interface MLSListing {
  mlsNumber: string;
  propertyAddress: string;
  listPrice?: number;
  status?: string; // 'active', 'pending', 'closed', 'withdrawn'
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  lotSize?: number;
  yearBuilt?: number;
  listDate?: string;
  pendingDate?: string;
  closedDate?: string;
  listingAgentId?: string;
  listingOfficeId?: string;
  lastModifiedAt: string;
}

/**
 * Sync listings from MLS
 *
 * @param mlsSystem - MLS system name (e.g., 'bright_mls', 'cal_res')
 * @param listings - Listings fetched from MLS API
 */
export async function syncMLSListings(
  mlsSystem: string,
  listings: MLSListing[]
): Promise<{ created: number; updated: number; errors: number }> {
  let created = 0;
  let updated = 0;
  let errors = 0;

  // Log sync start
  const { data: syncLog } = await supabaseServer
    .from('external_sync_log')
    .insert({
      source: 'mls',
      system_name: mlsSystem,
      sync_started_at: new Date().toISOString(),
      records_fetched: listings.length,
      status: 'running',
    })
    .select()
    .single();

  for (const listing of listings) {
    try {
      // Check if listing already exists
      const { data: existing } = await supabaseServer
        .from('mls_listings')
        .select('id')
        .eq('mls_system', mlsSystem)
        .eq('mls_number', listing.mlsNumber)
        .single();

      if (existing) {
        // Update existing listing
        const { error } = await supabaseServer
          .from('mls_listings')
          .update({
            property_address: listing.propertyAddress,
            list_price: listing.listPrice,
            status: listing.status,
            property_type: listing.propertyType,
            bedrooms: listing.bedrooms,
            bathrooms: listing.bathrooms,
            square_feet: listing.squareFeet,
            lot_size: listing.lotSize,
            year_built: listing.yearBuilt,
            list_date: listing.listDate,
            pending_date: listing.pendingDate,
            closed_date: listing.closedDate,
            listing_agent_id: listing.listingAgentId,
            listing_office_id: listing.listingOfficeId,
            last_modified_at: listing.lastModifiedAt,
            synced_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) {
          console.error('Failed to update MLS listing:', error);
          errors++;
        } else {
          updated++;
        }
      } else {
        // Create new listing
        const { error } = await supabaseServer.from('mls_listings').insert({
          mls_system: mlsSystem,
          mls_number: listing.mlsNumber,
          property_address: listing.propertyAddress,
          list_price: listing.listPrice,
          status: listing.status,
          property_type: listing.propertyType,
          bedrooms: listing.bedrooms,
          bathrooms: listing.bathrooms,
          square_feet: listing.squareFeet,
          lot_size: listing.lotSize,
          year_built: listing.yearBuilt,
          list_date: listing.listDate,
          pending_date: listing.pendingDate,
          closed_date: listing.closedDate,
          listing_agent_id: listing.listingAgentId,
          listing_office_id: listing.listingOfficeId,
          last_modified_at: listing.lastModifiedAt,
          synced_at: new Date().toISOString(),
          sync_source: `mls:${mlsSystem}`,
        });

        if (error) {
          console.error('Failed to create MLS listing:', error);
          errors++;
        } else {
          created++;
        }
      }
    } catch (error) {
      console.error('Error syncing MLS listing:', error);
      errors++;
    }
  }

  // Log sync completion
  if (syncLog) {
    await supabaseServer
      .from('external_sync_log')
      .update({
        sync_completed_at: new Date().toISOString(),
        records_created: created,
        records_updated: updated,
        errors,
        status: errors > 0 ? 'failed' : 'completed',
      })
      .eq('id', syncLog.id);
  }

  console.log(
    `MLS sync complete: ${created} created, ${updated} updated, ${errors} errors`
  );

  return { created, updated, errors };
}

/**
 * Auto-reconcile MLS listings with internal deals
 *
 * Attempts to match MLS listings to internal transactions by property address.
 * Does NOT import authority — only links for informational purposes.
 */
export async function reconcileMLSListings(): Promise<number> {
  // Load unmatched MLS listings
  const { data: unmatched } = await supabaseServer
    .from('mls_listings')
    .select('*')
    .eq('reconciliation_status', 'unmatched');

  if (!unmatched || unmatched.length === 0) {
    return 0;
  }

  let matchedCount = 0;

  for (const listing of unmatched) {
    // Try to match by property address
    const { data: events } = await supabaseServer
      .from('events')
      .select('aggregate_id, payload')
      .eq('event_type', 'deal_created')
      .ilike('payload->>property_address', listing.property_address);

    if (events && events.length === 1) {
      // Exact match found
      const { error } = await supabaseServer
        .from('mls_listings')
        .update({
          matched_aggregate_id: events[0].aggregate_id,
          reconciliation_status: 'matched',
        })
        .eq('id', listing.id);

      if (!error) {
        matchedCount++;
      }
    } else if (events && events.length > 1) {
      // Multiple matches - mark as conflict
      await supabaseServer
        .from('mls_listings')
        .update({
          reconciliation_status: 'conflict',
        })
        .eq('id', listing.id);
    }
  }

  console.log(`Reconciled ${matchedCount} MLS listings to internal deals`);

  return matchedCount;
}
