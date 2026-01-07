export interface Property {
  id: string;
  mls_id: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  neighborhood?: string;
  listing_price: number;
  status: 'active' | 'pending' | 'sold' | 'withdrawn' | 'expired';
  property_type: 'single_family' | 'condo' | 'townhouse' | 'multi_family' | 'land' | 'commercial';
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  lot_size?: number;
  year_built?: number;
  description?: string;
  features: string[];
  images: string[];
  virtual_tour_url?: string;
  listing_date: string;
  latitude?: number;
  longitude?: number;
  is_idx: boolean;
  idx_provider?: string;
  created_at: string;
}

export interface PropertySearchFilters {
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  propertyType?: string;
  cities?: string[];
  states?: string[];
  zipCodes?: string[];
  status?: string;
  minSquareFeet?: number;
  maxSquareFeet?: number;
  minLotSize?: number;
  maxLotSize?: number;
  minYearBuilt?: number;
  maxYearBuilt?: number;
  features?: string[];
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'sqft_desc' | 'lot_desc';
  page?: number;
  pageSize?: number;
}

export interface SavedSearch {
  id: string;
  name: string;
  user_id: string;
  lead_id?: string;
  filters: PropertySearchFilters;
  email_alerts: boolean;
  frequency: 'realtime' | 'daily' | 'weekly';
  last_sent_at?: string;
  created_at: string;
}

export interface Lead {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted';
  lead_score: number;
  budget_min?: number;
  budget_max?: number;
  preferred_locations?: string[];
  bedrooms_min?: number;
  bedrooms_max?: number;
  saved_searches?: SavedSearch[];
  notes?: string;
  assigned_to?: string;
  last_contacted_at?: string;
  created_at: string;
  updated_at: string;
}