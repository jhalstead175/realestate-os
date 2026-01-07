// Shared types for Real Estate OS

export interface Lead {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  lead_score?: number;
  budget_min?: number;
  budget_max?: number;
  preferred_locations?: string[];
  property_preferences?: any;
  notes?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  last_contacted_at?: string;
  bedrooms_min?: number;
  bedrooms_max?: number;
  bathrooms_min?: number;
  bathrooms_max?: number;
  square_feet_min?: number;
  square_feet_max?: number;
  property_type_preferences?: string[];
}

export interface Property {
  id: string;
  mls_id?: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  property_type: 'single_family' | 'condo' | 'townhouse' | 'multi_family' | 'land' | 'commercial';
  listing_price: number;
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  lot_size?: number;
  year_built?: number;
  description?: string;
  features?: string[];
  images: string[];
  status: 'active' | 'pending' | 'sold' | 'off_market';
  listing_date: string;
  neighborhood?: string;
  created_at: string;
  updated_at: string;
}

export interface PropertySearchFilters {
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  minSquareFeet?: number;
  maxSquareFeet?: number;
  status?: string;
  cities?: string[];
  states?: string[];
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'sqft_desc' | 'lot_desc';
}

export interface Transaction {
  id: string;
  property_id: string;
  lead_id?: string;
  status: 'pending' | 'in_progress' | 'closed' | 'cancelled';
  type: 'buy' | 'sell' | 'lease';
  purchase_price?: number;
  closing_date?: string;
  created_at: string;
  updated_at: string;
}
