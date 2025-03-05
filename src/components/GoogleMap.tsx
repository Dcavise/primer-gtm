
import React, { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { useGoogleMapsScript } from '@/hooks/useGoogleMapsScript';
import { geocodeAddress } from '@/services/geocoding-service';
import GoogleMapRenderer from '@/components/maps/GoogleMapRenderer';
import { toast } from 'sonner';
import { MapPin } from 'lucide-react';

interface GoogleMapProps {
  address: string;
  height?: string;
  width?: string;
  zoom?: number;
  mapId?: string;
}

const GoogleMap: React.FC<GoogleMapProps> = ({
  address,
  height = '300px',
  width = '100%',
  zoom = 15,
  mapId = 'DEMO_MAP_ID'
}) => {
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const [isGeocodingLoading, setIsGeocodingLoading] = useState(true);
  
  // Load Google Maps API script
  const { isLoaded, isLoading: isScriptLoading, error: scriptError } = useGoogleMapsScript({
    libraries: ['maps', 'places'],
    mapId
  });
  
  // Geocode the address
  useEffect(() => {
    if (!address) {
      setIsGeocodingLoading(false);
      setGeocodeError('No address provided');
      return;
    }
    
    const handleGeocoding = async () => {
      try {
        console.log(`Starting geocoding for address: ${address}`);
        setIsGeocodingLoading(true);
        const result = await geocodeAddress(address);
        
        if (result.coordinates) {
          console.log(`Geocoding successful: ${JSON.stringify(result.coordinates)}`);
          setCoordinates(result.coordinates);
          setGeocodeError(null);
        } else {
          console.error(`Geocoding error: ${result.error}`);
          setGeocodeError(result.error || 'Could not find coordinates for address');
          toast.error('Location error', { 
            description: result.error || 'Could not determine coordinates for this address'
          });
        }
      } catch (error) {
        console.error('Error in geocoding process:', error);
        setGeocodeError('Error finding location coordinates');
        toast.error('Location error', { 
          description: 'Could not determine coordinates for this address'
        });
      } finally {
        setIsGeocodingLoading(false);
      }
    };
    
    handleGeocoding();
  }, [address]);
  
  // Debug logging for component state
  useEffect(() => {
    console.log('GoogleMap component state:', { 
      isLoaded, 
      isScriptLoading, 
      scriptError,
      coordinates,
      geocodeError,
      isGeocodingLoading
    });
  }, [isLoaded, isScriptLoading, scriptError, coordinates, geocodeError, isGeocodingLoading]);
  
  // Combine errors from different sources
  const error = scriptError || geocodeError;
  
  // Determine if we're still loading
  const isLoading = isScriptLoading || isGeocodingLoading;
  
  // If we have coordinates but Google Maps failed to load, show a fallback
  if (coordinates && scriptError) {
    return (
      <Card className="bg-slate-50 dark:bg-slate-900 p-4" style={{ height, width }}>
        <div className="flex flex-col h-full justify-center items-center">
          <MapPin className="h-8 w-8 text-primary mb-2" />
          <p className="text-center font-medium">{address}</p>
          <p className="text-xs text-muted-foreground mt-2">
            Map loading failed. Coordinates: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
          </p>
        </div>
      </Card>
    );
  }
  
  if (error && !coordinates) {
    return (
      <Card className="bg-slate-50 dark:bg-slate-900 flex items-center justify-center" style={{ height, width }}>
        <div className="text-center p-4">
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </Card>
    );
  }
  
  if (isLoading && !coordinates) {
    return <Skeleton className="w-full" style={{ height, width }} />;
  }
  
  return (
    <GoogleMapRenderer
      coordinates={coordinates!}
      address={address}
      isLoaded={isLoaded}
      isLoading={isLoading}
      error={error}
      height={height}
      width={width}
      zoom={zoom}
      mapId={mapId}
    />
  );
};

export default GoogleMap;
