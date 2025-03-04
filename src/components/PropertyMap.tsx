
import React, { useEffect, useRef, useState } from "react";
import { LoadingState } from "@/components/LoadingState";
import { School } from "@/types/schools";
import { geocodeAddress } from "@/utils/geocoding";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { getApiKey } from "@/services/api-config";

interface PropertyMapProps {
  address: string;
  schools?: School[];
  coordinates?: { lat: number; lng: number } | null;
  isVisible?: boolean;
}

export const PropertyMap = ({ address, schools = [], coordinates: propCoordinates, isVisible = true }: PropertyMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(propCoordinates || null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const mapInitializedRef = useRef(false);
  
  // Clean up map and markers when component unmounts
  useEffect(() => {
    return () => {
      console.log("Cleaning up map and markers");
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      
      if (map.current) {
        map.current.remove();
        map.current = null;
        mapInitializedRef.current = false;
      }
    };
  }, []);

  // When tab visibility changes, resize the map to ensure proper rendering
  useEffect(() => {
    if (isVisible && map.current) {
      console.log("Map tab is now visible, resizing map");
      // Delay to ensure DOM is ready
      setTimeout(() => {
        if (map.current) {
          console.log("Resizing map after visibility change");
          map.current.resize();
        }
      }, 200); // Increased delay to ensure DOM is fully ready
    }
  }, [isVisible]);

  // Initialize map or get coordinates if needed
  useEffect(() => {
    if (!isVisible || !mapContainer.current) return;
    
    const getCoordinates = async () => {
      if (coordinates) return coordinates;
      
      if (!address) {
        throw new Error("No address provided");
      }
      
      console.log("Geocoding address for map:", address);
      const geocodingResult = await geocodeAddress(address);
      if (!geocodingResult) {
        throw new Error("Could not geocode address");
      }
      
      setCoordinates(geocodingResult.coordinates);
      console.log("Geocoded coordinates for map:", geocodingResult.coordinates);
      return geocodingResult.coordinates;
    };
    
    const initializeMap = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Skip initialization if already done
        if (mapInitializedRef.current && map.current) {
          console.log("Map already initialized");
          setLoading(false);
          return;
        }
        
        console.log("Starting map initialization process");
        
        // Get coordinates
        const coords = await getCoordinates();
        
        // Get Mapbox token
        console.log("Fetching Mapbox token");
        const mapboxToken = await getApiKey('mapbox');
        
        if (!mapboxToken) {
          throw new Error("Mapbox API key not available");
        }
        
        // Set Mapbox token
        mapboxgl.accessToken = mapboxToken;
        
        console.log("Creating new Mapbox map instance");
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/standard',
          center: [coords.lng, coords.lat],
          zoom: 13,
          antialias: true
        });
        
        // Add controls
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
        
        // Add event listeners for debugging
        map.current.on('error', (e) => {
          console.error("Mapbox error:", e.error);
          setError(`Map error: ${e.error?.message || 'Unknown error'}`);
        });
        
        // Wait for map to load
        map.current.on('load', () => {
          if (!map.current) return;
          
          console.log("Map loaded successfully");
          mapInitializedRef.current = true;
          setLoading(false);
          
          // Add property marker
          addPropertyMarker(coords);
          
          // Add school markers
          addSchoolMarkers();
          
          // Fit bounds to include all markers
          fitBoundsToMarkers(coords);
        });
      } catch (err) {
        console.error("Error initializing map:", err);
        setError(err instanceof Error ? err.message : "Unknown error initializing map");
        setLoading(false);
      }
    };
    
    const addPropertyMarker = (coords: { lat: number; lng: number }) => {
      if (!map.current) return;
      
      // Add property marker
      const propertyMarker = new mapboxgl.Marker({ color: '#3b82f6' })
        .setLngLat([coords.lng, coords.lat])
        .setPopup(new mapboxgl.Popup().setHTML(`<div class="font-medium">${address}</div>`))
        .addTo(map.current);
      
      markersRef.current.push(propertyMarker);
    };
    
    const addSchoolMarkers = () => {
      if (!map.current) return;
      
      // Add school markers
      schools.forEach((school, index) => {
        if (school.location?.coordinates?.latitude && school.location?.coordinates?.longitude) {
          // Create a custom HTML element for the marker
          const el = document.createElement('div');
          el.className = 'flex items-center justify-center bg-blue-50 dark:bg-blue-900 rounded-full border-2 border-blue-500 w-6 h-6 text-xs font-bold text-blue-700 dark:text-blue-300';
          el.innerHTML = `${index + 1}`;
          
          // Create the marker
          const schoolMarker = new mapboxgl.Marker(el)
            .setLngLat([school.location.coordinates.longitude, school.location.coordinates.latitude])
            .setPopup(
              new mapboxgl.Popup({ offset: 25 })
                .setHTML(`
                  <div>
                    <div class="font-medium">${school.name}</div>
                    <div class="text-xs text-gray-500">
                      ${school.location.distanceMiles?.toFixed(1) || '?'} miles away
                    </div>
                    ${school.ratings?.overall ? 
                      `<div class="text-xs mt-1 font-medium ${getRatingColorClass(school.ratings.overall)}">
                        Rating: ${school.ratings.overall}/10
                      </div>` : 
                      ''
                    }
                  </div>
                `)
            )
            .addTo(map.current!);
          
          markersRef.current.push(schoolMarker);
        }
      });
    };
    
    const fitBoundsToMarkers = (coords: { lat: number; lng: number }) => {
      if (!map.current || schools.length === 0) return;
      
      // Create a bounds object that includes the property and all schools
      const bounds = new mapboxgl.LngLatBounds([coords.lng, coords.lat]);
      
      schools.forEach(school => {
        if (school.location?.coordinates?.latitude && school.location?.coordinates?.longitude) {
          bounds.extend([
            school.location.coordinates.longitude,
            school.location.coordinates.latitude
          ]);
        }
      });
      
      // Adjust the map to fit all markers with padding
      map.current.fitBounds(bounds, {
        padding: 60,
        maxZoom: 15
      });
    };
    
    // Execute initialization
    initializeMap();
  }, [address, schools, coordinates, isVisible]);
  
  if (loading && isVisible) {
    return <LoadingState className="h-full" message="Loading map..." />;
  }
  
  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <Alert variant="destructive" className="w-full max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div ref={mapContainer} className="h-full w-full" />
  );
};

// Helper function to get text color class based on rating
function getRatingColorClass(rating: number): string {
  if (rating >= 8) return 'text-green-600';
  if (rating >= 6) return 'text-blue-600';
  if (rating >= 4) return 'text-amber-600';
  return 'text-red-600';
}
