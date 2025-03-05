
import React, { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Coordinates } from '@/types';

interface GoogleMapRendererProps {
  coordinates: Coordinates;
  address: string;
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  height?: string;
  width?: string;
  zoom?: number;
  mapId?: string;
}

const GoogleMapRenderer: React.FC<GoogleMapRendererProps> = ({
  coordinates,
  address,
  isLoaded,
  isLoading,
  error,
  height = '300px',
  width = '100%',
  zoom = 15,
  mapId = 'DEMO_MAP_ID'
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  
  // Create the map once the script is loaded and we have coordinates
  useEffect(() => {
    if (!isLoaded || !coordinates || !mapRef.current) return;
    
    try {
      // Wait for the custom elements to be defined
      if (!customElements.get('gmp-map')) {
        // If not ready yet, try again in a moment
        const timer = setTimeout(() => {
          // Force re-render by triggering the effect again
          const currentRef = mapRef.current;
          if (currentRef) {
            currentRef.innerHTML = '';
            renderMap();
          }
        }, 200);
        return () => clearTimeout(timer);
      }
      
      renderMap();
    } catch (error) {
      console.error('Error rendering map:', error);
    }
  }, [isLoaded, coordinates, zoom, mapId, address]);
  
  const renderMap = () => {
    if (!mapRef.current || !coordinates) return;
    
    // Clear the container first
    mapRef.current.innerHTML = '';
    
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
    mapRef.current.appendChild(mapElement);
  };
  
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

export default GoogleMapRenderer;
