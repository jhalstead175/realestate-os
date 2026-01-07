// lib/data/sync/rentcastSync.ts
/**
 * ⬤ RENTCAST → SUPABASE SYNC SERVICE
 * Pulls real MLS data and stores in our database
 * Runs automatically or on-demand
 */

import { rentcastAPI } from '../mls/rentcastAPI';
import { supabase } from '../liveHooks';

export class RentCastSync {
  // Target markets for initial data
  private targetMarkets = [
    { location: 'Austin, TX', radius: 10 },
    { location: 'Miami, FL', radius: 10 },
    { location: 'Phoenix, AZ', radius: 10 },
    { location: 'Atlanta, GA', radius: 10 },
  ];

  /**
   * Sync all target markets
   */
  async syncAllMarkets(limitPerMarket = 25) {
    console.log('⬤ STARTING RENTCAST MLS SYNC...');
    
    const results = [];
    for (const market of this.targetMarkets) {
      console.log(`⬤ SYNCING MARKET: ${market.location}`);
      const result = await this.syncMarket(market.location, market.radius, limitPerMarket);
      results.push(result);
    }
    
    console.log('⬤ SYNC COMPLETE:', results);
    return results;
  }

  /**
   * Sync a single market
   */
  async syncMarket(location: string, radius = 10, limit = 25) {
    try {
      // 1. Fetch properties from RentCast
      const properties = await rentcastAPI.searchProperties({
        location,
        radius,
        status: 'for_sale',
        limit,
      });

      console.log(`⬤ FOUND ${properties.length} PROPERTIES IN ${location}`);

      // 2. Upsert to Supabase
      let upserted = 0;
      let errors = 0;

      for (const property of properties) {
        try {
          const { error } = await supabase
            .from('properties')
            .upsert({
              external_id: property.external_id,
              address: property.address,
              city: property.city,
              state: property.state,
              zip: property.zip,
              current_value: property.current_value,
              estimated_yield: property.estimated_yield,
              status: 'monitoring',
              bedrooms: property.bedrooms,
              bathrooms: property.bathrooms,
              square_feet: property.square_feet,
              lot_size: property.lot_size,
              year_built: property.year_built,
              property_type: property.property_type,
              mls_id: property.mls_id,
              mls_status: property.mls_status,
              days_on_mls: property.days_on_mls,
              photos: property.photos,
              data_source: 'rentcast',
              raw_data: property.raw_data,
              acquisition_strategy: property.acquisition_strategy,
              anomaly_score: property.anomaly_score,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'external_id',
              ignoreDuplicates: false,
            });

          if (error) {
            console.error('⬤ UPSERT ERROR:', error);
            errors++;
          } else {
            upserted++;
          }
        } catch (error) {
          console.error('⬤ PROPERTY PROCESS ERROR:', error);
          errors++;
        }
      }

      return {
        market: location,
        found: properties.length,
        upserted,
        errors,
        success: errors === 0,
      };
    } catch (error) {
      console.error('⬤ MARKET SYNC ERROR:', error);
      return {
        market: location,
        found: 0,
        upserted: 0,
        errors: 1,
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update a single property with detailed data
   */
  async updatePropertyDetail(externalId: string) {
    try {
      const rentcastId = externalId.replace('rentcast_', '');
      const detail = await rentcastAPI.getPropertyDetail(rentcastId);
      
      if (!detail) {
        return { success: false, error: 'Detail not found' };
      }

      // Get rental estimates for better yield calculation
      const rentalEstimate = await rentcastAPI.getRentalEstimates(detail.address);
      if (rentalEstimate) {
        detail.monthly_rent_estimate = rentalEstimate.median;
        detail.estimated_yield = (rentalEstimate.median * 12 / detail.current_value) * 100;
      }

      // Get comparable sales
      const comps = await rentcastAPI.getComparableSales({
        lat: detail.raw_data?.latitude || 30.2672, // Austin default
        lon: detail.raw_data?.longitude || -97.7431,
        bedrooms: detail.bedrooms,
        bathrooms: detail.bathrooms,
        squareFeet: detail.square_feet,
      });

      // Update in Supabase
      const { error } = await supabase
        .from('properties')
        .update({
          ...detail,
          comparable_sales: comps,
          last_detail_update: new Date().toISOString(),
        })
        .eq('external_id', externalId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: detail };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Export singleton
export const rentcastSync = new RentCastSync();