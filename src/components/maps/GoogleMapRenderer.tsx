
import React, { useEffect, useRef, useState } from 'react';
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
  const [mapRenderAttempts, setMapRenderAttempts] = useState(0);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [mapRendered, setMapRendered] = useState(false);
  
  // Create the map once the script is loaded and we have coordinates
  useEffect(() => {
    if (!coordinates || !mapRef.current) return;
    
    // Clear any previous errors
    setRenderError(null);
    
    // If Google Maps API isn't available but we have coordinates, show static map as fallback
    if (!isLoaded && !isLoading && mapRenderAttempts > 2) {
      console.log("Falling back to static map");
      if (mapRef.current) {
        const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${coordinates.lat},${coordinates.lng}&zoom=${zoom}&size=600x400&markers=color:red%7C${coordinates.lat},${coordinates.lng}`;
        const img = document.createElement('img');
        img.src = staticMapUrl;
        img.alt = `Map of ${address}`;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '0.375rem';
        
        // Clear the container first
        mapRef.current.innerHTML = '';
        mapRef.current.appendChild(img);
        setMapRendered(true);
        return;
      }
    }
    
    const tryRenderMap = () => {
      try {
        console.log("Attempting to render map, attempt:", mapRenderAttempts);
        
        // Skip if we've already rendered successfully
        if (mapRendered) return true;
        
        // Clear the container first
        if (mapRef.current) {
          mapRef.current.innerHTML = '';
        }
        
        // Using standard Google Maps JavaScript API
        if (window.google && window.google.maps) {
          console.log("Rendering with standard Google Maps API");
          
          const mapOptions = {
            center: { lat: coordinates.lat, lng: coordinates.lng },
            zoom: zoom,
            mapId: mapId
          };
          
          const map = new window.google.maps.Map(mapRef.current, mapOptions);
          
          new window.google.maps.Marker({
            position: { lat: coordinates.lat, lng: coordinates.lng },
            map,
            title: address
          });
          
          setMapRendered(true);
          return true;
        } 
        // Fallback to using Google Maps Platform elements if available
        else if (window.customElements && customElements.get('gmp-map')) {
          console.log("Rendering with Google Maps Platform web components");
          
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
          
          setMapRendered(true);
          return true;
        } else {
          console.log("Neither Google Maps API nor web components are available yet");
          return false;
        }
      } catch (error) {
        console.error('Error rendering map:', error);
        setRenderError(`Error rendering map: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return false;
      }
    };
    
    // Try to render the map
    const success = tryRenderMap();
    
    // If not successful and we haven't tried too many times, retry after a delay
    if (!success && mapRenderAttempts < 5) {
      const timer = setTimeout(() => {
        setMapRenderAttempts(prev => prev + 1);
      }, 1000); // Increased timeout for better chances
      
      return () => clearTimeout(timer);
    }
    
    // If we've tried too many times, set an error
    if (!success && mapRenderAttempts >= 5 && !mapRendered) {
      // Try to show a static map as last resort
      if (mapRef.current) {
        const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${coordinates.lat},${coordinates.lng}&zoom=${zoom}&size=600x400&markers=color:red%7C${coordinates.lat},${coordinates.lng}`;
        const img = document.createElement('img');
        img.src = staticMapUrl;
        img.alt = `Map of ${address}`;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '0.375rem';
        
        // Clear the container first
        mapRef.current.innerHTML = '';
        mapRef.current.appendChild(img);
        setMapRendered(true);
      } else {
        setRenderError("Unable to render map after multiple attempts. Please refresh the page.");
      }
    }
  }, [isLoaded, coordinates, zoom, mapId, address, mapRenderAttempts, isLoading, mapRendered]);
  
  if (error || renderError) {
    return (
      <Card className="bg-slate-50 dark:bg-slate-900 flex items-center justify-center" style={{ height, width }}>
        <div className="text-center p-4">
          <p className="text-muted-foreground text-sm">{error || renderError}</p>
        </div>
      </Card>
    );
  }
  
  if (isLoading && !coordinates) {
    return <Skeleton className="w-full" style={{ height, width }} />;
  }
  
  return (
    <div 
      ref={mapRef} 
      style={{ height, width }} 
      className="rounded-md overflow-hidden border border-border"
    />
  );
};

export default GoogleMapRenderer;
