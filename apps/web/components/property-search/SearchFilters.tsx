'use client';

import { PropertySearchFilters } from '@realestate-os/shared';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

interface SearchFiltersProps {
  filters: PropertySearchFilters;
  onChange: (filters: PropertySearchFilters) => void;
  availableCities: string[];
  availableStates: string[];
}

const propertyTypes = [
  { value: 'single_family', label: 'Single Family' },
  { value: 'condo', label: 'Condo' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'multi_family', label: 'Multi-Family' },
  { value: 'land', label: 'Land' },
  { value: 'commercial', label: 'Commercial' }
];

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'sold', label: 'Sold' },
  { value: 'withdrawn', label: 'Withdrawn' }
];

const sortOptions = [
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest Listings' },
  { value: 'sqft_desc', label: 'Largest Sq Ft' },
  { value: 'lot_desc', label: 'Largest Lot Size' }
];

const bedroomOptions = [1, 2, 3, 4, 5, 6];
const bathroomOptions = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

export function SearchFilters({ 
  filters, 
  onChange, 
  availableCities, 
  availableStates 
}: SearchFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = (key: keyof PropertySearchFilters, value: any) => {
    onChange({ ...filters, [key]: value });
  };

  const clearFilter = (key: keyof PropertySearchFilters) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onChange(newFilters);
  };

  const clearAll = () => {
    onChange({});
  };

  const activeFilters = Object.keys(filters).filter(key => 
    filters[key as keyof PropertySearchFilters] !== undefined && 
    filters[key as keyof PropertySearchFilters] !== ''
  ).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <h3 className="font-semibold">Filters</h3>
          {activeFilters > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFilters} active
            </Badge>
          )}
        </div>
        {activeFilters > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAll}>
            <X className="h-4 w-4 mr-1" />
            Clear all
          </Button>
        )}
      </div>

      {/* Quick Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Select
          value={filters.propertyType || ''}
          onValueChange={(value) => updateFilter('propertyType', value || undefined)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Property Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Types</SelectItem>
            {propertyTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.bedrooms?.toString() || ''}
          onValueChange={(value) => updateFilter('bedrooms', value ? parseInt(value) : undefined)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Bedrooms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any</SelectItem>
            {bedroomOptions.map((beds) => (
              <SelectItem key={beds} value={beds.toString()}>
                {beds}+ beds
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status || ''}
          onValueChange={(value) => updateFilter('status', value || undefined)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Status</SelectItem>
            {statusOptions.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.sortBy || 'newest'}
          onValueChange={(value) => updateFilter('sortBy', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((sort) => (
              <SelectItem key={sort.value} value={sort.value}>
                {sort.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="space-y-6 p-4 border rounded-lg">
          {/* Price Range */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <label className="text-sm font-medium">Price Range</label>
              <span className="text-sm text-gray-500">
                ${(filters.minPrice || 0).toLocaleString()} - ${(filters.maxPrice || 2000000).toLocaleString()}
              </span>
            </div>
            <Slider
              min={0}
              max={5000000}
              step={10000}
              value={[filters.minPrice || 0, filters.maxPrice || 2000000]}
              onValueChange={([min, max]) => {
                updateFilter('minPrice', min);
                updateFilter('maxPrice', max);
              }}
              className="py-2"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                placeholder="Min Price"
                value={filters.minPrice || ''}
                onChange={(e) => updateFilter('minPrice', e.target.value ? parseInt(e.target.value) : undefined)}
              />
              <Input
                type="number"
                placeholder="Max Price"
                value={filters.maxPrice || ''}
                onChange={(e) => updateFilter('maxPrice', e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>
          </div>

          {/* Square Feet */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <label className="text-sm font-medium">Square Feet</label>
              <span className="text-sm text-gray-500">
                {(filters.minSquareFeet || 0).toLocaleString()} - {(filters.maxSquareFeet || 10000).toLocaleString()} sqft
              </span>
            </div>
            <Slider
              min={0}
              max={10000}
              step={100}
              value={[filters.minSquareFeet || 0, filters.maxSquareFeet || 10000]}
              onValueChange={([min, max]) => {
                updateFilter('minSquareFeet', min);
                updateFilter('maxSquareFeet', max);
              }}
              className="py-2"
            />
          </div>

          {/* Location */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Location</label>
            <div className="grid grid-cols-2 gap-4">
              <Select
                value={filters.cities?.[0] || ''}
                onValueChange={(value) => updateFilter('cities', value ? [value] : undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="City" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Cities</SelectItem>
                  {availableCities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.states?.[0] || ''}
                onValueChange={(value) => updateFilter('states', value ? [value] : undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All States</SelectItem>
                  {availableStates.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bathrooms */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Bathrooms</label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={filters.bathrooms === undefined ? "default" : "outline"}
                size="sm"
                onClick={() => updateFilter('bathrooms', undefined)}
              >
                Any
              </Button>
              {bathroomOptions.map((baths) => (
                <Button
                  key={baths}
                  type="button"
                  variant={filters.bathrooms === baths ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateFilter('bathrooms', baths)}
                >
                  {baths}+
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      <Button
        variant="ghost"
        size="sm"
        className="w-full"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? 'Show less' : 'Show more filters'}
      </Button>

      {/* Active Filter Badges */}
      {activeFilters > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {filters.propertyType && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {propertyTypes.find(t => t.value === filters.propertyType)?.label}
              <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter('propertyType')} />
            </Badge>
          )}
          {filters.bedrooms && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {filters.bedrooms}+ beds
              <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter('bedrooms')} />
            </Badge>
          )}
          {filters.minPrice && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Min ${filters.minPrice.toLocaleString()}
              <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter('minPrice')} />
            </Badge>
          )}
          {/* Add more badges for other filters */}
        </div>
      )}
    </div>
  );
}