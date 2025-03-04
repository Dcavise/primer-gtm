
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
}

export const PropertyMap = ({ address, schools = [], coordinates: propCoordinates }: PropertyMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(propCoordinates || null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  
  // Clean up markers when component unmounts
  useEffect(() => {
    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;
    
    const initializeMap = async () => {
      try {
        setLoading(true);
        
        // Get coordinates either from props or by geocoding with Google Maps
        let coords = coordinates;
        if (!coords) {
          if (address) {
            console.log("Geocoding address for map:", address);
            const geocodingResult = await geocodeAddress(address);
            if (geocodingResult) {
              coords = geocodingResult.coordinates;
              setCoordinates(geocodingResult.coordinates);
              console.log("Geocoded coordinates for map:", coords);
            } else {
              throw new Error("Could not geocode address");
            }
          } else {
            throw new Error("No address provided");
          }
        }

        // Get Mapbox API key
        console.log("Fetching Mapbox token for map visualization");
        const mapboxAccessToken = await getApiKey('mapbox');
        
        if (!mapboxAccessToken) {
          throw new Error("Mapbox API key not available");
        }
        
        console.log("Mapbox token retrieved successfully for visualization");
        
        // Set mapbox access token
        mapboxgl.accessToken = mapboxAccessToken;
        
        // Only create map if it doesn't exist
        if (!map.current) {
          console.log("Initializing Mapbox map with coordinates:", coords);
          
          map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [coords!.lng, coords!.lat],
            zoom: 14
          });
          
          // Add navigation controls
          map.current.addControl(
            new mapboxgl.NavigationControl(),
            'top-right'
          );
          
          // Handle map load event
          map.current.on('load', () => {
            if (!map.current) return;
            
            console.log("Map loaded successfully");
            
            // Add property marker
            const propertyMarker = new mapboxgl.Marker({ color: '#3b82f6' })
              .setLngLat([coords!.lng, coords!.lat])
              .setPopup(new mapboxgl.Popup().setHTML(`<div class="font-medium">${address}</div>`))
              .addTo(map.current);
            
            markersRef.current.push(propertyMarker);
            
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
            
            // Create a bounds object that includes the property and all schools
            if (schools.length > 0) {
              const bounds = new mapboxgl.LngLatBounds([coords!.lng, coords!.lat]);
              
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
            }
            
            setLoading(false);
          });
        }
      } catch (err) {
        console.error("Error initializing map:", err);
        setError(err instanceof Error ? err.message : "Unknown error initializing map");
        setLoading(false);
      }
    };
    
    initializeMap();
    
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [address, schools, coordinates]);
  
  if (loading) {
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
