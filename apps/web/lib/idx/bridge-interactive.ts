// Bridge Interactive IDX API integration
export class BridgeIDX {
  private apiKey: string
  private brokerId: string
  private baseUrl = 'https://api.bridgeinteractive.com'

  constructor(apiKey: string, brokerId: string) {
    this.apiKey = apiKey
    this.brokerId = brokerId
  }

  async searchProperties(filters: PropertySearchFilters) {
    const params = new URLSearchParams({
      brokerid: this.brokerId,
      format: 'json',
      ...this.mapFiltersToParams(filters)
    })

    const response = await fetch(
      `${this.baseUrl}/listing/query?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`IDX API error: ${response.statusText}`)
    }

    const data = await response.json()
    return this.normalizeProperties(data.listings)
  }

  private mapFiltersToParams(filters: PropertySearchFilters) {
    const params: Record<string, string> = {}

    if (filters.minPrice) params.minprice = filters.minPrice.toString()
    if (filters.maxPrice) params.maxprice = filters.maxPrice.toString()
    if (filters.bedrooms) params.beds = filters.bedrooms.toString()
    if (filters.bathrooms) params.baths = filters.bathrooms.toString()
    if (filters.propertyType) params.proptype = filters.propertyType
    if (filters.city) params.city = filters.city
    if (filters.state) params.state = filters.state
    if (filters.zipCode) params.postalcode = filters.zipCode
    if (filters.status) params.status = filters.status
    if (filters.sortBy) params.sortby = filters.sortBy
    if (filters.page) params.page = filters.page.toString()
    if (filters.pageSize) params.pagesize = filters.pageSize.toString()

    return params
  }

  private normalizeProperties(listings: any[]): NormalizedProperty[] {
    return listings.map(listing => ({
      mls_id: listing.MLSId,
      address: listing.UnparsedAddress,
      city: listing.City,
      state: listing.StateOrProvince,
      zip_code: listing.PostalCode,
      listing_price: parseFloat(listing.ListPrice || '0'),
      bedrooms: parseInt(listing.BedroomsTotal || '0'),
      bathrooms: parseFloat(listing.BathroomsTotal || '0'),
      square_feet: parseInt(listing.LivingArea || '0'),
      property_type: this.mapPropertyType(listing.PropertyType),
      year_built: parseInt(listing.YearBuilt || '0'),
      description: listing.PublicRemarks,
      images: listing.Media?.map((m: any) => m.MediaURL) || [],
      lot_size: parseInt(listing.LotSizeArea || '0'),
      status: this.mapStatus(listing.MLSStatus),
      latitude: parseFloat(listing.Latitude || '0'),
      longitude: parseFloat(listing.Longitude || '0'),
      listing_date: listing.ListingDate,
      is_idx: true,
      idx_provider: 'bridge_interactive'
    }))
  }

  private mapPropertyType(type: string): string {
    const mapping: Record<string, string> = {
      'Residential': 'single_family',
      'Single Family': 'single_family',
      'Condo': 'condo',
      'Townhouse': 'townhouse',
      'Multi-Family': 'multi_family',
      'Land': 'land',
      'Commercial': 'commercial'
    }
    return mapping[type] || 'single_family'
  }

  private mapStatus(status: string): string {
    const mapping: Record<string, string> = {
      'Active': 'active',
      'Pending': 'pending',
      'Sold': 'sold',
      'Withdrawn': 'withdrawn',
      'Expired': 'expired'
    }
    return mapping[status] || 'active'
  }

  async getPropertyDetails(mlsId: string) {
    const params = new URLSearchParams({
      brokerid: this.brokerId,
      mlsid: mlsId,
      format: 'json'
    })

    const response = await fetch(
      `${this.baseUrl}/listing?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`IDX API error: ${response.statusText}`)
    }

    const data = await response.json()
    return this.normalizeProperties([data])[0]
  }
}

export interface PropertySearchFilters {
  minPrice?: number
  maxPrice?: number
  bedrooms?: number
  bathrooms?: number
  propertyType?: string
  city?: string
  state?: string
  zipCode?: string
  status?: string
  sortBy?: string
  page?: number
  pageSize?: number
}

export interface NormalizedProperty {
  mls_id: string
  address: string
  city: string
  state: string
  zip_code: string
  listing_price: number
  bedrooms: number
  bathrooms: number
  square_feet: number
  property_type: string
  year_built: number
  description: string
  images: string[]
  lot_size: number
  status: string
  latitude: number
  longitude: number
  listing_date?: string
  is_idx: boolean
  idx_provider: string
}