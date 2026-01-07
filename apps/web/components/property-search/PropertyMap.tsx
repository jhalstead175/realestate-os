'use client';

import { Property } from '@realestate-os/shared';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils';

// Fix for Leaflet icons in Next.js
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';

interface PropertyMapProps {
  properties: Property[];
  selectedProperty?: Property;
  onPropertySelect: (property: Property) => void;
  center?: [number, number];
  zoom?: number;
}

// Custom markers
const createPropertyIcon = (price: number, status: string) => {
  const statusColors = {
    active: '#10b981', // green
    pending: '#f59e0b', // yellow
    sold: '#3b82f6', // blue
    withdrawn: '#6b7280', // gray
    expired: '#ef4444' // red
  };

  return L.divIcon({
    html: `
      <div class="relative">
        <div class="absolute -top-2 -left-2 bg-white rounded-full p-1 shadow-lg">
          <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white" 
               style="background-color: ${statusColors[status as keyof typeof statusColors]}">
            $${(price / 1000).toFixed(0)}k
          </div>
        </div>
      </div>
    `,
    className: 'custom-property-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });
};

export function PropertyMap({ 
  properties, 
  selectedProperty, 
  onPropertySelect,
  center = [39.8283, -98.5795], // Center of US
  zoom = 4
}: PropertyMapProps) {
  const [mapCenter, setMapCenter] = useState<[number, number]>(center);
  const [mapZoom, setMapZoom] = useState(zoom);

  // Filter properties with coordinates
  const propertiesWithCoords = properties.filter(p => p.latitude && p.longitude);

  // Auto-center map when properties change
  useEffect(() => {
    if (propertiesWithCoords.length > 0) {
      const avgLat = propertiesWithCoords.reduce((sum, p) => sum + (p.latitude || 0), 0) / propertiesWithCoords.length;
      const avgLng = propertiesWithCoords.reduce((sum, p) => sum + (p.longitude || 0), 0) / propertiesWithCoords.length;
      setMapCenter([avgLat, avgLng]);
      setMapZoom(propertiesWithCoords.length === 1 ? 12 : 10);
    }
  }, [propertiesWithCoords]);

  if (typeof window === 'undefined') {
    return (
      <div className="w-full h-[600px] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-gray-400">Loading map...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-[600px] rounded-lg overflow-hidden shadow-lg">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        className="w-full h-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {propertiesWithCoords.map((property) => (
          <Marker
            key={property.id}
            position={[property.latitude!, property.longitude!]}
            icon={createPropertyIcon(property.listing_price, property.status)}
            eventHandlers={{
              click: () => onPropertySelect(property)
            }}
          >
            <Popup>
              <Card className="w-64 border-0 shadow-none">
                <CardContent className="p-3">
                  <div className="space-y-2">
                    <div className="font-semibold text-sm line-clamp-1">
                      {property.address}
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      {formatPrice(property.listing_price)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {property.bedrooms} bd | {property.bathrooms} ba | {property.square_feet?.toLocaleString()} sqft
                    </div>
                    <div className="text-xs text-gray-500">
                      {property.city}, {property.state}
                    </div>
                    <div className="pt-2">
                      <button
                        onClick={() => onPropertySelect(property)}
                        className="w-full text-sm bg-blue-600 hover:bg-blue-700 text-white py-1.5 px-3 rounded-md transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}