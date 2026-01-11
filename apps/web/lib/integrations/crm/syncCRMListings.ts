/**
 * CRM Sync Worker
 *
 * Pulls listings from CRM systems (Salesforce, HubSpot, Follow Up Boss, etc.)
 *
 * CRITICAL: Syncs property data and contact info ONLY.
 * NEVER syncs authority, roles, or permissions.
 */

import { supabaseServer } from '@/lib/supabase/server';

export interface CRMListing {
  crmListingId: string;
  propertyAddress: string;
  listingPrice?: number;
  listingStatus?: string;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  agentEmail?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  lastActivityAt?: string;
  activitySummary?: string;
  lastModifiedAt: string;
}

/**
 * Sync listings from CRM
 *
 * @param crmSystem - CRM system name (e.g., 'salesforce', 'hubspot')
 * @param listings - Listings fetched from CRM API
 */
export async function syncCRMListings(
  crmSystem: string,
  listings: CRMListing[]
): Promise<{ created: number; updated: number; errors: number }> {
  let created = 0;
  let updated = 0;
  let errors = 0;

  // Log sync start
  const { data: syncLog } = await supabaseServer
    .from('external_sync_log')
    .insert({
      source: 'crm',
      system_name: crmSystem,
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
        .from('crm_listings')
        .select('id')
        .eq('crm_system', crmSystem)
        .eq('crm_listing_id', listing.crmListingId)
        .single();

      if (existing) {
        // Update existing listing
        const { error } = await supabaseServer
          .from('crm_listings')
          .update({
            property_address: listing.propertyAddress,
            listing_price: listing.listingPrice,
            listing_status: listing.listingStatus,
            property_type: listing.propertyType,
            bedrooms: listing.bedrooms,
            bathrooms: listing.bathrooms,
            square_feet: listing.squareFeet,
            agent_email: listing.agentEmail,
            client_name: listing.clientName,
            client_email: listing.clientEmail,
            client_phone: listing.clientPhone,
            last_activity_at: listing.lastActivityAt,
            activity_summary: listing.activitySummary,
            last_modified_at: listing.lastModifiedAt,
            synced_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) {
          console.error('Failed to update CRM listing:', error);
          errors++;
        } else {
          updated++;
        }
      } else {
        // Create new listing
        const { error } = await supabaseServer.from('crm_listings').insert({
          crm_system: crmSystem,
          crm_listing_id: listing.crmListingId,
          property_address: listing.propertyAddress,
          listing_price: listing.listingPrice,
          listing_status: listing.listingStatus,
          property_type: listing.propertyType,
          bedrooms: listing.bedrooms,
          bathrooms: listing.bathrooms,
          square_feet: listing.squareFeet,
          agent_email: listing.agentEmail,
          client_name: listing.clientName,
          client_email: listing.clientEmail,
          client_phone: listing.clientPhone,
          last_activity_at: listing.lastActivityAt,
          activity_summary: listing.activitySummary,
          last_modified_at: listing.lastModifiedAt,
          synced_at: new Date().toISOString(),
          sync_source: `crm:${crmSystem}`,
        });

        if (error) {
          console.error('Failed to create CRM listing:', error);
          errors++;
        } else {
          created++;
        }
      }
    } catch (error) {
      console.error('Error syncing CRM listing:', error);
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
    `CRM sync complete: ${created} created, ${updated} updated, ${errors} errors`
  );

  return { created, updated, errors };
}

/**
 * Auto-reconcile CRM listings with internal deals
 *
 * Attempts to match CRM listings to internal transactions by property address.
 * Does NOT import authority — only links for informational purposes.
 */
export async function reconcileCRMListings(): Promise<number> {
  // Load unmatched CRM listings
  const { data: unmatched } = await supabaseServer
    .from('crm_listings')
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
        .from('crm_listings')
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
        .from('crm_listings')
        .update({
          reconciliation_status: 'conflict',
        })
        .eq('id', listing.id);
    }
  }

  console.log(`Reconciled ${matchedCount} CRM listings to internal deals`);

  return matchedCount;
}
