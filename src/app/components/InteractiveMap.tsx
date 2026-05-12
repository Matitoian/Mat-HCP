import { useState } from 'react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { MapPin, Navigation, ExternalLink } from 'lucide-react';

interface LatLng {
  lat: number;
  lng: number;
}

interface InteractiveMapProps {
  propertyLocation?: LatLng;
  propertyName?: string;
  county?: string;
}

// County coordinates for coastal Kenya
const countyCoordinates: Record<string, LatLng> = {
  'Mombasa': { lat: -4.0435, lng: 39.6682 },
  'Kilifi': { lat: -3.6307, lng: 39.8493 },
  'Kwale': { lat: -4.1820, lng: 39.4561 },
  'Lamu': { lat: -2.2717, lng: 40.9020 },
};

export function InteractiveMap({ propertyLocation, propertyName, county = 'Mombasa' }: InteractiveMapProps) {
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const destination = propertyLocation || countyCoordinates[county];

  const getUserLocation = () => {
    setLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLoadingLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Use default location for demo (TUM)
          setUserLocation({ lat: -4.0388, lng: 39.6691 });
          setLoadingLocation(false);
        }
      );
    }
  };

  // Generate static map URL using OpenStreetMap
  const getStaticMapUrl = () => {
    const zoom = 13;
    const width = 800;
    const height = 400;
    
    // Using OpenStreetMap static map service
    return `https://www.openstreetmap.org/export/embed.html?bbox=${destination.lng - 0.05},${destination.lat - 0.025},${destination.lng + 0.05},${destination.lat + 0.025}&layer=mapnik&marker=${destination.lat},${destination.lng}`;
  };

  // Google Maps directions URL
  const getDirectionsUrl = () => {
    if (userLocation) {
      return `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${destination.lat},${destination.lng}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${destination.lat},${destination.lng}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-blue-600" />
          <span className="font-medium">Location Map</span>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={getUserLocation}
            disabled={loadingLocation}
            size="sm"
            variant="outline"
          >
            <Navigation className="h-4 w-4 mr-2" />
            {loadingLocation ? 'Getting Location...' : userLocation ? 'Update Location' : 'My Location'}
          </Button>
          <Button
            onClick={() => window.open(getDirectionsUrl(), '_blank')}
            size="sm"
            variant="default"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Get Directions
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div style={{ height: '400px', width: '100%', position: 'relative' }}>
          <iframe
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            marginHeight={0}
            marginWidth={0}
            src={getStaticMapUrl()}
            style={{ border: 0 }}
            title="Property Location Map"
          />
        </div>
      </Card>

      {/* Location Info */}
      <Card className="p-4">
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-sm text-gray-600 mb-1">Property Location</h4>
            <p className="font-medium">{propertyName || `${county} Area`}</p>
            <p className="text-sm text-gray-500">
              Coordinates: {destination.lat.toFixed(4)}, {destination.lng.toFixed(4)}
            </p>
          </div>

          {userLocation && (
            <div className="pt-3 border-t">
              <h4 className="font-semibold text-sm text-gray-600 mb-1">Your Location</h4>
              <p className="text-sm text-gray-500">
                Coordinates: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Distance: ~{Math.round(
                  Math.sqrt(
                    Math.pow((destination.lat - userLocation.lat) * 111, 2) +
                    Math.pow((destination.lng - userLocation.lng) * 111, 2)
                  )
                )} km
              </p>
            </div>
          )}

          {/* Nearby Landmarks */}
          <div className="pt-3 border-t">
            <h4 className="font-semibold text-sm text-gray-600 mb-2">Nearby Landmarks</h4>
            <div className="space-y-1 text-sm">
              {county === 'Mombasa' && (
                <>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-3 w-3" />
                    <span>TUM - Technical University of Mombasa</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-3 w-3" />
                    <span>Fort Jesus Museum</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-3 w-3" />
                    <span>Nyali Beach</span>
                  </div>
                </>
              )}
              {county === 'Kilifi' && (
                <>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-3 w-3" />
                    <span>Pwani University</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-3 w-3" />
                    <span>Kilifi Bridge</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-3 w-3" />
                    <span>Bofa Beach</span>
                  </div>
                </>
              )}
              {county === 'Kwale' && (
                <>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-3 w-3" />
                    <span>Diani Beach</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-3 w-3" />
                    <span>Shimba Hills National Reserve</span>
                  </div>
                </>
              )}
              {county === 'Lamu' && (
                <>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-3 w-3" />
                    <span>Lamu Old Town (UNESCO Site)</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-3 w-3" />
                    <span>Shela Beach</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
