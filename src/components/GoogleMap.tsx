
import React, { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { useGoogleMapsScript } from '@/hooks/useGoogleMapsScript';
import { geocodeAddress } from '@/services/geocoding-service';
import GoogleMapRenderer from '@/components/maps/GoogleMapRenderer';

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
    libraries: ['maps', 'marker'],
    mapId
  });
  
  // Geocode the address
  useEffect(() => {
    if (!address) return;
    
    const handleGeocoding = async () => {
      try {
        setIsGeocodingLoading(true);
        const result = await geocodeAddress(address);
        
        if (result.coordinates) {
          setCoordinates(result.coordinates);
          setGeocodeError(null);
        } else {
          setGeocodeError(result.error || 'Could not find coordinates for address');
        }
      } catch (error) {
        console.error('Error in geocoding process:', error);
        setGeocodeError('Error finding location coordinates');
      } finally {
        setIsGeocodingLoading(false);
      }
    };
    
    handleGeocoding();
  }, [address]);
  
  // Combine errors from different sources
  const error = scriptError || geocodeError;
  
  // Determine if we're still loading
  const isLoading = isScriptLoading || isGeocodingLoading;
  
  if (error) {
    return (
      <Card className="bg-slate-50 dark:bg-slate-900 flex items-center justify-center" style={{ height, width }}>
        <div className="text-center p-4">
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </Card>
    );
  }
  
  if (isLoading || !coordinates) {
    return <Skeleton className="w-full" style={{ height, width }} />;
  }
  
  return (
    <GoogleMapRenderer
      coordinates={coordinates}
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
