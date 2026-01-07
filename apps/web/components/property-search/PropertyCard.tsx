'use client';

import { Property } from '@realestate-os/shared';
import { Bed, Bath, Square, MapPin, ExternalLink, Heart, Share2, Phone } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils';
import { useState } from 'react';

interface PropertyCardProps {
  property: Property;
  onSave?: (propertyId: string) => void;
  onContact?: (property: Property) => void;
  onShare?: (property: Property) => void;
  isSaved?: boolean;
}

export function PropertyCard({ 
  property, 
  onSave, 
  onContact, 
  onShare,
  isSaved = false 
}: PropertyCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    sold: 'bg-blue-100 text-blue-800',
    withdrawn: 'bg-gray-100 text-gray-800',
    expired: 'bg-red-100 text-red-800'
  };

  const propertyTypeLabels = {
    single_family: 'Single Family',
    condo: 'Condo',
    townhouse: 'Townhouse',
    multi_family: 'Multi-Family',
    land: 'Land',
    commercial: 'Commercial'
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full">
      <div 
        className="relative h-64 overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {property.images.length > 0 ? (
          <>
            <Image
              src={property.images[currentImageIndex]}
              alt={property.address}
              fill
              className="object-cover transition-transform duration-500 hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {isHovered && property.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {property.images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(idx);
                    }}
                    className={`w-2 h-2 rounded-full ${idx === currentImageIndex ? 'bg-white' : 'bg-white/50'}`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <div className="text-gray-400 text-center">
              <div className="text-4xl mb-2">🏠</div>
              <div className="text-sm">No Image Available</div>
            </div>
          </div>
        )}
        
        <div className="absolute top-4 left-4">
          <Badge className={`${statusColors[property.status]} font-semibold`}>
            {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
          </Badge>
        </div>
        
        <div className="absolute top-4 right-4 flex space-x-2">
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 bg-white/90 backdrop-blur-sm hover:bg-white"
            onClick={() => onSave?.(property.id)}
          >
            <Heart className={`h-4 w-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 bg-white/90 backdrop-blur-sm hover:bg-white"
            onClick={() => onShare?.(property)}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <div className="text-white font-bold text-xl">
            {formatPrice(property.listing_price)}
          </div>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <div className="flex items-center text-sm text-gray-500 mb-1">
              <MapPin className="h-4 w-4 mr-1" />
              {property.city}, {property.state}
            </div>
            <h3 className="font-semibold text-lg line-clamp-1">{property.address}</h3>
            <p className="text-sm text-gray-600">{property.neighborhood}</p>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              {property.bedrooms && (
                <div className="flex items-center">
                  <Bed className="h-4 w-4 mr-1 text-gray-500" />
                  <span className="font-medium">{property.bedrooms} bd</span>
                </div>
              )}
              {property.bathrooms && (
                <div className="flex items-center">
                  <Bath className="h-4 w-4 mr-1 text-gray-500" />
                  <span className="font-medium">{property.bathrooms} ba</span>
                </div>
              )}
              {property.square_feet && (
                <div className="flex items-center">
                  <Square className="h-4 w-4 mr-1 text-gray-500" />
                  <span className="font-medium">{property.square_feet.toLocaleString()} sqft</span>
                </div>
              )}
            </div>
            <Badge variant="outline">
              {propertyTypeLabels[property.property_type]}
            </Badge>
          </div>
          
          {property.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {property.description}
            </p>
          )}
          
          {property.features.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-2">
              {property.features.slice(0, 3).map((feature, index) => (
                <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                  {feature}
                </span>
              ))}
              {property.features.length > 3 && (
                <span className="text-xs text-gray-500 px-2 py-1">
                  +{property.features.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex space-x-2">
        <Button 
          className="flex-1"
          onClick={() => onContact?.(property)}
        >
          <Phone className="h-4 w-4 mr-2" />
          Contact Agent
        </Button>
        {property.virtual_tour_url && (
          <Button 
            variant="outline" 
            asChild
            className="flex-1"
          >
            <a href={property.virtual_tour_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Virtual Tour
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}