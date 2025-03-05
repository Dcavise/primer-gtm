
import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { geocodeAddress } from '@/utils/maps';

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
  mapId = 'DEMO_MAP_ID' // Default map ID
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch the Google Maps API key from Supabase Edge Function
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-api-keys', {
          body: { key: 'maps_platform_api' }
        });
        
        if (error) {
          console.error('Error fetching Google Maps API key:', error);
          setError('Failed to load map API key');
          toast.error('Map loading error', {
            description: 'Could not retrieve the map API key'
          });
          setIsLoading(false);
          return;
        }
        
        if (!data || !data.key) {
          setError('No API key returned');
          setIsLoading(false);
          return;
        }
        
        setApiKey(data.key);
      } catch (error) {
        console.error('Error in fetchApiKey:', error);
        setError('Failed to load map API key');
        setIsLoading(false);
      }
    };
    
    fetchApiKey();
  }, []);

  // Geocode the address using our centralized geocoding function
  useEffect(() => {
    if (!address) return;
    
    const handleGeocoding = async () => {
      try {
        const result = await geocodeAddress(address);
        
        if (result) {
          setCoordinates(result.coordinates);
        } else {
          setError(`Could not find coordinates for address: ${address}`);
        }
      } catch (error) {
        console.error('Error geocoding address:', error);
        setError('Error finding location coordinates');
        toast.error('Map loading error', {
          description: 'Could not determine the location coordinates'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    handleGeocoding();
  }, [address]);

  // Load the Google Maps JS API and render the map
  useEffect(() => {
    if (!apiKey || !coordinates) return;
    
    // Check if the script is already loaded
    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      existingScript.remove();
    }
    
    // Create a new script element
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=console.debug&libraries=maps,marker&v=beta`;
    script.async = true;
    
    // When the script loads, create the map
    script.onload = () => {
      if (mapRef.current) {
        // Need to delay the map creation to ensure the custom elements are registered
        setTimeout(() => {
          try {
            // Clear the container first
            mapRef.current!.innerHTML = '';
            
            // Create map element
            const mapElement = document.createElement('gmp-map');
            mapElement.setAttribute('center', `${coordinates.lat},${coordinates.lng}`);
            mapElement.setAttribute('zoom', zoom.toString());
            mapElement.setAttribute('map-id', mapId);
            mapElement.style.height = '100%';
            mapElement.style.width = '100%';
            
            // Create marker element
            const markerElement = document.createElement('gmp-advanced-marker');
            markerElement.setAttribute('position', `${coordinates.lat},${coordinates.lng}`);
            markerElement.setAttribute('title', address);
            
            // Add marker to map and map to container
            mapElement.appendChild(markerElement);
            mapRef.current!.appendChild(mapElement);
          } catch (error) {
            console.error('Error rendering map:', error);
            setError('Error rendering map');
          }
        }, 100);
      }
    };
    
    script.onerror = () => {
      console.error('Failed to load Google Maps JavaScript API');
      setError('Failed to load map');
      setIsLoading(false);
    };
    
    // Add the script to the document
    document.head.appendChild(script);
    
    // Cleanup function
    return () => {
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [apiKey, coordinates, zoom, mapId, address]);

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

  return <div ref={mapRef} style={{ height, width }} />;
};

export default GoogleMap;
