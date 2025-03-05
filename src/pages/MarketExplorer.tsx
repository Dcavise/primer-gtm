
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LoadingState } from "@/components/LoadingState";
import { MarketSelector } from "@/components/MarketSelector";
import { marketCoordinates } from "@/utils/marketCoordinates";
import { useCampuses } from "@/hooks/salesforce/useCampuses";
import { Navbar } from "@/components/Navbar";
import { geocodeAddress, initializeMapboxToken, createCustomMarker } from "@/utils/geocoding";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from '@tanstack/react-query';

const MarketExplorer = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<string>("default");
  const { campuses } = useCampuses();
  const [mapInitialized, setMapInitialized] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  
  // Initialize Mapbox token once
  const { isLoading: isTokenLoading, error: tokenError } = useQuery({
    queryKey: ['mapbox-token-init'],
    queryFn: async () => {
      console.log("Initializing Mapbox token (ONCE ONLY)");
      return initializeMapboxToken();
    },
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 2
  });

  // Clear all markers from the map
  const clearMarkers = useCallback(() => {
    markers.current.forEach(marker => marker.remove());
    markers.current = [];
  }, []);
  
  // Create demo markers for the US overview
  const createDemoMap = useCallback((mapInstance: mapboxgl.Map) => {
    if (!mapInstance) return;
    
    console.log("Creating demo map for All Campuses view");
    
    try {
      clearMarkers();
      
      const demoLocations = [
        { name: "San Francisco", coordinates: marketCoordinates.sf.center, color: "#1F77B4" },
        { name: "New York City", coordinates: marketCoordinates.nyc.center, color: "#FF7F0E" },
        { name: "Chicago", coordinates: marketCoordinates.chi.center, color: "#2CA02C" },
        { name: "Los Angeles", coordinates: marketCoordinates.la.center, color: "#D62728" },
        { name: "Boston", coordinates: marketCoordinates.bos.center, color: "#9467BD" },
        { name: "Seattle", coordinates: marketCoordinates.sea.center, color: "#8C564B" },
        { name: "Miami", coordinates: marketCoordinates.mia.center, color: "#E377C2" },
        { name: "Austin", coordinates: marketCoordinates.aus.center, color: "#7F7F7F" },
        { name: "Denver", coordinates: marketCoordinates.den.center, color: "#BCBD22" },
        { name: "Atlanta", coordinates: marketCoordinates.atl.center, color: "#17BECF" }
      ];
      
      demoLocations.forEach(location => {
        try {
          const el = createCustomMarker(location.color);
          
          const popup = new mapboxgl.Popup({ offset: 25 })
            .setText(location.name);
          
          const marker = new mapboxgl.Marker(el)
            .setLngLat(location.coordinates)
            .setPopup(popup)
            .addTo(mapInstance);
            
          markers.current.push(marker);
        } catch (err) {
          console.error(`Error adding marker for ${location.name}:`, err);
        }
      });
      
      // Smoothly fly to the default view
      mapInstance.flyTo({
        center: marketCoordinates.default.center,
        zoom: marketCoordinates.default.zoom,
        pitch: 30,
        duration: 2000,
        essential: true
      });
    } catch (error) {
      console.error("Error creating demo map:", error);
    }
  }, [clearMarkers]);
  
  // Initialize map once Mapbox token is ready
  useEffect(() => {
    if (isTokenLoading || mapInitialized || !mapContainer.current || map.current) return;
    
    try {
      console.log("Initializing Mapbox map...");
      
      // Create the map instance
      const newMap = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: marketCoordinates.default.center,
        zoom: marketCoordinates.default.zoom,
        pitch: 30,
        antialias: true,
        attributionControl: false,
        failIfMajorPerformanceCaveat: true
      });

      // Add navigation controls
      newMap.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        }),
        'top-right'
      );
      
      // Add attribution in a more discreet location
      newMap.addControl(
        new mapboxgl.AttributionControl({
          compact: true
        }),
        'bottom-right'
      );

      // Store map reference
      map.current = newMap;

      // Event handlers for map
      newMap.on('load', () => {
        console.log("✅ Map loaded successfully");
        setMapError(null);
        setMapInitialized(true);
        
        toast.success("Map loaded successfully", {
          description: "Market explorer is ready to use"
        });
        
        if (selectedMarket === "default" && newMap) {
          createDemoMap(newMap);
        }
      });

      newMap.on('error', (e) => {
        console.error("Mapbox error:", e);
        const errorMessage = e.error ? e.error.message : "Unknown error";
        setMapError(`Map failed to load correctly: ${errorMessage}`);
        toast.error(`Map failed to load correctly: ${errorMessage}`);
      });
      
      // Return cleanup function
      return () => {
        clearMarkers();
        if (map.current) {
          console.log("Cleaning up map instance");
          map.current.remove();
          map.current = null;
          setMapInitialized(false);
        }
      };
    } catch (error) {
      console.error("Error initializing map:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setMapError(`Failed to load map: ${errorMessage}`);
      toast.error(`Failed to load map: ${errorMessage}`);
    }
  }, [isTokenLoading, selectedMarket, createDemoMap, mapInitialized, clearMarkers]);

  // Update map when selected market changes
  useEffect(() => {
    if (!mapInitialized || !map.current) return;
    
    const updateMapView = async () => {
      console.log("Updating map view for selected market:", selectedMarket);
      
      try {
        // Clear existing markers
        clearMarkers();
        
        // Set default coordinates
        let coordinates = marketCoordinates.default.center;
        let zoom = marketCoordinates.default.zoom;
        
        // If default view is selected, show the demo map with multiple markers
        if (selectedMarket === "default") {
          if (map.current) {
            createDemoMap(map.current);
          }
          return;
        }
        
        // Find the selected campus
        const selectedCampus = campuses.find(c => c.campus_id === selectedMarket);
        
        if (!selectedCampus) {
          console.warn("Selected campus not found:", selectedMarket);
          return;
        }
        
        console.log("Selected campus:", selectedCampus.campus_name);
        
        // First check if we have pre-defined coordinates for this market
        const campusNameLower = selectedCampus.campus_name.toLowerCase();
        let found = false;
        
        // Check for predefined coordinates in our marketCoordinates map
        for (const [key, value] of Object.entries(marketCoordinates)) {
          if (value.name.toLowerCase() === campusNameLower) {
            coordinates = value.center;
            zoom = value.zoom;
            found = true;
            console.log("Found campus in marketCoordinates:", value.name);
            break;
          }
        }
        
        // If not found in predefined coordinates, geocode it
        if (!found) {
          const addressToGeocode = `${selectedCampus.campus_name}${selectedCampus.State ? `, ${selectedCampus.State.trim()}` : ''}`;
          console.log("Geocoding address:", addressToGeocode);
          
          try {
            const result = await geocodeAddress(addressToGeocode, {
              types: ['place', 'locality', 'neighborhood'],
              limit: 1,
              autocomplete: false,
              country: 'us'
            });
            
            if (result) {
              coordinates = [result.coordinates.lng, result.coordinates.lat];
              zoom = 11;
              console.log("Geocoding result:", result);
            } else {
              console.log("Geocoding failed, using default view");
              toast.warning(`Couldn't find exact location for ${selectedCampus.campus_name}`, {
                description: "Using approximate view"
              });
            }
          } catch (error) {
            console.error("Error geocoding address:", error);
            toast.error("Error finding location", {
              description: "Using default view instead"
            });
          }
        }
        
        // Add marker for the selected campus
        if (map.current) {
          try {
            const el = createCustomMarker('#1F77B4');
            
            // Create and add the marker
            const marker = new mapboxgl.Marker(el)
              .setLngLat(coordinates as [number, number])
              .setPopup(new mapboxgl.Popup().setText(selectedCampus.campus_name))
              .addTo(map.current);
              
            // Store the marker reference
            markers.current.push(marker);
              
            // Fly to the coordinates with smooth animation
            map.current.flyTo({
              center: coordinates,
              zoom: zoom,
              pitch: 30,
              duration: 2000,
              essential: true
            });
          } catch (error) {
            console.error("Error adding marker or flying to location:", error);
          }
        }
      } catch (error) {
        console.error("Error updating map view:", error);
        toast.error("Error updating map view", {
          description: error instanceof Error ? error.message : "Unknown error"
        });
      }
    };
    
    updateMapView();
  }, [selectedMarket, campuses, createDemoMap, mapInitialized, clearMarkers]);

  const handleMarketChange = (marketId: string) => {
    console.log("Market changed to:", marketId);
    setSelectedMarket(marketId);
  };

  const isLoading = isTokenLoading;

  const displayError = mapError || (tokenError 
    ? `Failed to initialize Mapbox: ${tokenError instanceof Error ? tokenError.message : "Unknown error"}`
    : null);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-to-r from-slate-gray to-slate-gray-400 text-white py-8 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl md:text-3xl font-semibold">Market Explorer</h1>
            <Navbar />
          </div>
          <p className="text-white/80 mt-2">
            Explore real estate markets across the country
          </p>
        </div>
      </header>

      <main className="container mx-auto p-4 max-w-5xl">
        <Card className="shadow-lg border-0">
          <CardContent className="pt-6">
            <MarketSelector
              selectedMarketId={selectedMarket}
              onSelectMarket={handleMarketChange}
              campuses={campuses}
              isLoading={isLoading && campuses.length === 0}
            />
            
            {displayError && (
              <Alert className="mb-4 border-red-400 bg-red-50">
                <AlertDescription className="text-red-800">
                  {displayError}
                </AlertDescription>
              </Alert>
            )}
            
            {isLoading ? (
              <LoadingState message="Loading map..." className="h-[600px]" />
            ) : (
              <div className="relative rounded-md overflow-hidden shadow-md mt-4">
                <div 
                  ref={mapContainer} 
                  className="w-full h-[600px] bg-gray-100 relative"
                  data-testid="map-container"
                />
                <div className="absolute bottom-5 right-5 flex gap-2">
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => setSelectedMarket("default")}
                  >
                    Reset View
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default MarketExplorer;
