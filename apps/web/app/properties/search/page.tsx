'use client';

import { useState, useEffect, useCallback } from 'react';
import { Property, PropertySearchFilters } from '@realestate-os/shared';
import { PropertyCard } from '@/components/property-search/PropertyCard';
import { SearchFilters } from '@/components/property-search/SearchFilters';
import { PropertyMap } from '@/components/property-search/PropertyMap';
import { LeadCaptureModal } from '@/components/property-search/LeadCaptureModal';
import { SaveSearchModal } from '@/components/property-search/SaveSearchModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Grid3X3, Map, List, Filter, Download, Share2 } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { createClient } from '@/lib/supabase/client';
import { BridgeIDX } from '@/lib/idx/bridge-interactive';

export default function PropertySearchPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'map' | 'list'>('grid');
  const [filters, setFilters] = useState<PropertySearchFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showSaveSearchModal, setShowSaveSearchModal] = useState(false);
  const [savedProperties, setSavedProperties] = useState<Set<string>>(new Set());
  
  const supabase = createClient();
  const debouncedFilters = useDebounce(filters, 500);
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch properties
  const fetchProperties = useCallback(async (searchFilters: PropertySearchFilters) => {
    setLoading(true);
    try {
      // First try Supabase (our database)
      const { data: dbProperties, error } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && dbProperties) {
        setProperties(dbProperties);
      }

      // If we have IDX credentials, fetch from IDX too
      if (process.env.NEXT_PUBLIC_BRIDGE_API_KEY) {
        const idx = new BridgeIDX(
          process.env.NEXT_PUBLIC_BRIDGE_API_KEY,
          process.env.NEXT_PUBLIC_BRIDGE_BROKER_ID!
        );
        
        const idxProperties = await idx.searchProperties({
          status: 'active',
          pageSize: 25,
          ...searchFilters
        });

        // Merge and deduplicate properties
        const mergedProperties = [...dbProperties, ...idxProperties];
        const uniqueProperties = Array.from(
          new Map(mergedProperties.map(p => [p.mls_id, p])).values()
        );
        
        setProperties(uniqueProperties);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Apply filters
  useEffect(() => {
    const filtered = properties.filter(property => {
      // Search query filter
      if (debouncedSearch) {
        const searchLower = debouncedSearch.toLowerCase();
        const searchable = [
          property.address,
          property.city,
          property.state,
          property.zip_code,
          property.neighborhood,
          property.description
        ].join(' ').toLowerCase();
        
        if (!searchable.includes(searchLower)) return false;
      }

      // Property type filter
      if (filters.propertyType && property.property_type !== filters.propertyType) {
        return false;
      }

      // Price filter
      if (filters.minPrice && property.listing_price < filters.minPrice) return false;
      if (filters.maxPrice && property.listing_price > filters.maxPrice) return false;

      // Bedrooms filter
      if (filters.bedrooms && property.bedrooms && property.bedrooms < filters.bedrooms) {
        return false;
      }

      // Bathrooms filter
      if (filters.bathrooms && property.bathrooms && property.bathrooms < filters.bathrooms) {
        return false;
      }

      // Square feet filter
      if (filters.minSquareFeet && property.square_feet && property.square_feet < filters.minSquareFeet) {
        return false;
      }
      if (filters.maxSquareFeet && property.square_feet && property.square_feet > filters.maxSquareFeet) {
        return false;
      }

      // Status filter
      if (filters.status && property.status !== filters.status) {
        return false;
      }

      // Location filters
      if (filters.cities?.length && !filters.cities.includes(property.city)) {
        return false;
      }
      if (filters.states?.length && !filters.states.includes(property.state)) {
        return false;
      }

      return true;
    });

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (filters.sortBy) {
        case 'price_asc':
          return a.listing_price - b.listing_price;
        case 'price_desc':
          return b.listing_price - a.listing_price;
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'sqft_desc':
          return (b.square_feet || 0) - (a.square_feet || 0);
        case 'lot_desc':
          return (b.lot_size || 0) - (a.lot_size || 0);
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    setFilteredProperties(sorted);
  }, [properties, filters, debouncedSearch]);

  // Load saved properties
  useEffect(() => {
    const loadSavedProperties = async () => {
      const { data: saved } = await supabase
        .from('saved_properties')
        .select('property_id');
      
      if (saved) {
        setSavedProperties(new Set(saved.map(s => s.property_id)));
      }
    };
    loadSavedProperties();
  }, [supabase]);

  // Initial fetch
  useEffect(() => {
    fetchProperties({});
  }, [fetchProperties]);

  // Handle property save
  const handleSaveProperty = async (propertyId: string) => {
    if (savedProperties.has(propertyId)) {
      // Remove from saved
      await supabase
        .from('saved_properties')
        .delete()
        .eq('property_id', propertyId);
      
      setSavedProperties(prev => {
        const newSet = new Set(prev);
        newSet.delete(propertyId);
        return newSet;
      });
    } else {
      // Add to saved
      await supabase
        .from('saved_properties')
        .insert({ property_id: propertyId });
      
      setSavedProperties(prev => new Set([...prev, propertyId]));
    }
  };

  // Handle contact agent
  const handleContactAgent = (property: Property) => {
    setSelectedProperty(property);
    setShowLeadModal(true);
  };

  // Extract unique cities and states for filters
  const availableCities = Array.from(new Set(properties.map(p => p.city))).sort();
  const availableStates = Array.from(new Set(properties.map(p => p.state))).sort();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Search Bar */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-2">
            Find Your Dream Home
          </h1>
          <p className="text-blue-100 mb-8">
            Search {properties.length.toLocaleString()} properties nationwide
          </p>
          
          <div className="bg-white rounded-xl p-2 shadow-2xl">
            <div className="flex flex-col md:flex-row gap-2">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Enter city, neighborhood, or ZIP code"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-14 text-lg border-0 focus-visible:ring-0"
                />
              </div>
              <Button 
                size="lg" 
                className="h-14 px-8 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Filter className="h-5 w-5 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-1/4">
            <div className="sticky top-8 space-y-6">
              <SearchFilters
                filters={filters}
                onChange={setFilters}
                availableCities={availableCities}
                availableStates={availableStates}
              />
              
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <h4 className="font-semibold mb-3">Save This Search</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Get email alerts when new properties match your criteria.
                </p>
                <Button 
                  className="w-full"
                  onClick={() => setShowSaveSearchModal(true)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Save Search
                </Button>
              </div>

              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <h4 className="font-semibold mb-3">Search Stats</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Properties</span>
                    <span className="font-semibold">{properties.length.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Showing</span>
                    <span className="font-semibold">{filteredProperties.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Average Price</span>
                    <span className="font-semibold">
                      ${Math.round(filteredProperties.reduce((sum, p) => sum + p.listing_price, 0) / (filteredProperties.length || 1)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Properties List */}
          <div className="lg:w-3/4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <h2 className="text-2xl font-bold">
                  {filteredProperties.length} Properties Found
                </h2>
                {searchQuery && (
                  <p className="text-gray-600">
                    Results for "{searchQuery}"
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'map' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('map')}
                  >
                    <Map className="h-4 w-4" />
                  </Button>
                </div>

                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>

            {/* Properties Display */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 h-64 rounded-lg mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : viewMode === 'map' ? (
              <PropertyMap
                properties={filteredProperties}
                selectedProperty={selectedProperty || undefined}
                onPropertySelect={setSelectedProperty}
              />
            ) : viewMode === 'list' ? (
              <div className="space-y-4">
                {filteredProperties.map((property) => (
                  <div key={property.id} className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="md:w-1/3">
                        <div className="h-48 md:h-full rounded-lg bg-gray-100 overflow-hidden">
                          {property.images[0] ? (
                            <img
                              src={property.images[0]}
                              alt={property.address}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              No Image
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="md:w-2/3 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg">{property.address}</h3>
                            <p className="text-gray-600">
                              {property.city}, {property.state} {property.zip_code}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-green-600">
                              ${property.listing_price.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-500">
                              ${Math.round(property.listing_price / (property.square_feet || 1)).toLocaleString()}/sqft
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm">
                          {property.bedrooms && (
                            <span>{property.bedrooms} beds</span>
                          )}
                          {property.bathrooms && (
                            <span>{property.bathrooms} baths</span>
                          )}
                          {property.square_feet && (
                            <span>{property.square_feet.toLocaleString()} sqft</span>
                          )}
                          <span>{property.property_type.replace('_', ' ')}</span>
                        </div>
                        {property.description && (
                          <p className="text-gray-600 line-clamp-2">
                            {property.description}
                          </p>
                        )}
                        <div className="flex justify-between items-center pt-2">
                          <div className="flex space-x-2">
                            <Button 
                              size="sm"
                              onClick={() => handleContactAgent(property)}
                            >
                              Contact Agent
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleSaveProperty(property.id)}
                            >
                              {savedProperties.has(property.id) ? 'Saved' : 'Save'}
                            </Button>
                          </div>
                          <div className="text-sm text-gray-500">
                            Listed {new Date(property.listing_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProperties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    onSave={handleSaveProperty}
                    onContact={handleContactAgent}
                    isSaved={savedProperties.has(property.id)}
                  />
                ))}
              </div>
            )}

            {/* No Results */}
            {!loading && filteredProperties.length === 0 && (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🏠</div>
                <h3 className="text-xl font-semibold mb-2">No properties found</h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your filters or search criteria
                </p>
                <Button onClick={() => setFilters({})}>
                  Clear All Filters
                </Button>
              </div>
            )}

            {/* Pagination */}
            {filteredProperties.length > 0 && (
              <div className="flex justify-center mt-8">
                <div className="flex items-center space-x-2">
                  <Button variant="outline" disabled>
                    Previous
                  </Button>
                  <Button variant="default">1</Button>
                  <Button variant="outline">2</Button>
                  <Button variant="outline">3</Button>
                  <Button variant="outline">Next</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showLeadModal && selectedProperty && (
        <LeadCaptureModal
          property={selectedProperty}
          isOpen={showLeadModal}
          onClose={() => setShowLeadModal(false)}
        />
      )}

      {showSaveSearchModal && (
        <SaveSearchModal
          filters={filters}
          isOpen={showSaveSearchModal}
          onClose={() => setShowSaveSearchModal(false)}
        />
      )}
    </div>
  );
}