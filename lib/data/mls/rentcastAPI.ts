// lib/data/mls/rentcastAPI.ts
import axios from 'axios';

const RENTCAST_API_KEY = process.env.RENTCAST_API_KEY;
const RENTCAST_BASE_URL = 'https://api.rentcast.io/v1';

/**
 * ⬤ RENTCAST MLS DATA
 * Professional-grade property data
 * Includes rental estimates, comps, and more
 */

export class RentCastAPI {
  private headers = {
    'Authorization': `Bearer ${RENTCAST_API_KEY}`,
    'Content-Type': 'application/json',
  };

  /**
   * Search properties with MLS-level detail
   */
  async searchProperties(params: {
    location?: string;
    lat?: number;
    lon?: number;
    radius?: number; // miles
    minPrice?: number;
    maxPrice?: number;
    propertyType?: string;
    status?: 'for_sale' | 'for_rent' | 'sold';
    limit?: number;
  }) {
    try {
      const response = await axios.get(`${RENTCAST_BASE_URL}/properties`, {
        headers: this.headers,
        params: {
          ...params,
          limit: params.limit || 50,
        }
      });

      return response.data.map(this.transformToObsidianSchema);
    } catch (error) {
      console.error('⬤ RENTCAST API ERROR:', error.response?.data || error.message);
      return [];
    }
  }

  /**
   * Get detailed property info (MLS-level detail)
   */
  async getPropertyDetail(propertyId: string) {
    try {
      const response = await axios.get(`${RENTCAST_BASE_URL}/properties/${propertyId}`, {
        headers: this.headers,
      });

      return this.transformToObsidianSchema(response.data);
    } catch (error) {
      console.error('⬤ RENTCAST DETAIL ERROR:', error);
      return null;
    }
  }

  /**
   * Get rental estimates (for yield calculation)
   */
  async getRentalEstimates(address: string) {
    try {
      const response = await axios.get(`${RENTCAST_BASE_URL}/rental-estimates`, {
        headers: this.headers,
        params: { address }
      });

      return response.data;
    } catch (error) {
      console.error('⬤ RENTCAST RENTAL ERROR:', error);
      return null;
    }
  }

  /**
   * Get comparable sales (for valuation)
   */
  async getComparableSales(params: {
    lat: number;
    lon: number;
    radius?: number;
    bedrooms?: number;
    bathrooms?: number;
    squareFeet?: number;
  }) {
    try {
      const response = await axios.get(`${RENTCAST_BASE_URL}/comparables/sales`, {
        headers: this.headers,
        params: {
          ...params,
          radius: params.radius || 0.5, // 0.5 mile radius
          limit: 10,
        }
      });

      return response.data;
    } catch (error) {
      console.error('⬤ RENTCAST COMPS ERROR:', error);
      return [];
    }
  }

  /**
   * Transform RentCast data to our Obsidian schema
   */
  private transformToObsidianSchema(rentcastData: any) {
    // Calculate yield from rental estimate
    const monthlyRent = rentcastData.rentalEstimates?.median || 
                       rentcastData.monthlyRent || 
                       rentcastData.price * 0.005; // 0.5% rule fallback
    
    const annualRent = monthlyRent * 12;
    const yieldPercent = (annualRent / rentcastData.price) * 100;

    return {
      // Core property data
      external_id: `rentcast_${rentcastData.id}`,
      address: rentcastData.address?.line1 || '',
      city: rentcastData.address?.city || '',
      state: rentcastData.address?.state || '',
      zip: rentcastData.address?.postalCode || '',
      
      // Financials
      current_value: rentcastData.price || 0,
      estimated_yield: parseFloat(yieldPercent.toFixed(2)),
      monthly_rent_estimate: monthlyRent,
      
      // Property details
      bedrooms: rentcastData.bedrooms || 0,
      bathrooms: rentcastData.bathrooms || 0,
      square_feet: rentcastData.squareFootage || 0,
      lot_size: rentcastData.lotSize || 0,
      year_built: rentcastData.yearBuilt || 0,
      property_type: rentcastData.propertyType || 'Unknown',
      
      // MLS-specific data
      mls_id: rentcastData.mlsId,
      mls_status: rentcastData.status,
      days_on_mls: rentcastData.daysOnMarket,
      listing_date: rentcastData.listedDate,
      
      // Photos
      photos: rentcastData.photos || [],
      
      // Our Sicario fields
      status: 'monitoring',
      acquisition_strategy: this.determineStrategy(rentcastData),
      anomaly_score: this.calculateAnomalyScore(rentcastData),
      
      // Source tracking
      data_source: 'rentcast',
      last_updated: new Date().toISOString(),
      raw_data: rentcastData, // Keep original for reference
    };
  }

  /**
   * Determine Sicario strategy based on property data
   */
  private determineStrategy(property: any): string {
    if (property.daysOnMarket > 90) return 'ghost_offer_long_market';
    if (property.price < property.comparableSales?.median * 0.85) return 'silent_auction_undervalued';
    if (property.status === 'for_rent') return 'lease_to_own';
    return 'standard_monitoring';
  }

  /**
   * Calculate anomaly score (0-1, higher = more unusual)
   */
  private calculateAnomalyScore(property: any): number {
    let score = 0;
    
    // Price anomaly
    const priceVsComps = property.price / (property.comparableSales?.median || property.price);
    if (priceVsComps < 0.8 || priceVsComps > 1.2) score += 0.4;
    
    // Days on market anomaly
    if (property.daysOnMarket > 120) score += 0.3;
    
    // Rent vs price anomaly
    const rentRatio = (property.monthlyRent * 12) / property.price;
    if (rentRatio < 0.04 || rentRatio > 0.12) score += 0.3;
    
    return parseFloat(score.toFixed(2));
  }
}

// Singleton instance
export const rentcastAPI = new RentCastAPI();