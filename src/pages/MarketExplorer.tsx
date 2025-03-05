
import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getApiKey } from "@/services/api-config";
import { toast } from "sonner";
import { LoadingState } from "@/components/LoadingState";
import { MarketSelector } from "@/components/MarketSelector";
import { marketCoordinates } from "@/utils/marketCoordinates";
import { useCampuses } from "@/hooks/salesforce/useCampuses";
import { Navbar } from "@/components/Navbar";
import { geocodeAddress } from "@/utils/geocoding";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Alert, AlertDescription } from "@/components/ui/alert";

const MarketExplorer = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMarket, setSelectedMarket] = useState<string>("default");
  const { campuses, fetchCampuses } = useCampuses();
  const mapInitialized = useRef(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Fetch API key and campuses when component mounts
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Fetch Mapbox token
        const token = await getApiKey('mapbox');
        console.log("Mapbox token fetched successfully:", token ? "Token exists" : "Token is empty");
        
        if (!token) {
          setMapError("Mapbox token is empty or invalid");
          setIsLoading(false);
          return;
        }
        
        setMapboxToken(token);
        
        // Fetch campuses
        await fetchCampuses();
      } catch (error) {
        console.error("Error initializing data:", error);
        setMapError("Failed to initialize data. Please check your connection and try again.");
        toast.error("Failed to initialize data", {
          description: "Please check your connection and try again"
        });
        setIsLoading(false);
      }
    };

    initializeData();
  }, [fetchCampuses]);

  // Initialize map once we have the token
  useEffect(() => {
    if (!mapboxToken || !mapContainer.current || mapInitialized.current) return;
    
    try {
      console.log("Initializing Mapbox map with token", mapboxToken.substring(0, 10) + "...");
      console.log("Map container exists:", !!mapContainer.current);
      
      // Set the access token for mapboxgl
      mapboxgl.accessToken = mapboxToken;
      
      console.log("Creating new map instance");
      const newMap = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: marketCoordinates.default.center,
        zoom: marketCoordinates.default.zoom,
        pitch: 30,
      });

      // Add navigation controls
      newMap.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        }),
        'top-right'
      );

      // Set map reference and mark as initialized
      map.current = newMap;
      mapInitialized.current = true;

      // Wait for map to load before updating state
      newMap.on('load', () => {
        console.log("Map loaded successfully");
        setIsLoading(false);
        setMapError(null);
        toast.success("Map loaded successfully", {
          description: "Market explorer is ready to use"
        });
        
        // If "All Campuses" is selected, create a demo map with sample data points
        if (selectedMarket === "default") {
          createDemoMap(newMap);
        }
      });

      // Handle map load error
      newMap.on('error', (e) => {
        console.error("Mapbox error:", e);
        setMapError(`Map failed to load correctly: ${e.error ? e.error.message : "Unknown error"}`);
        toast.error("Map failed to load correctly", {
          description: e.error ? e.error.message : "Unknown error"
        });
      });
    } catch (error) {
      console.error("Error initializing map:", error);
      setMapError(`Failed to load map: ${error instanceof Error ? error.message : "Unknown error"}`);
      toast.error("Failed to load map", {
        description: "Please check your connection and try again"
      });
      setIsLoading(false);
    }

    // Cleanup map instance when component unmounts
    return () => {
      if (map.current) {
        console.log("Cleaning up map instance");
        map.current.remove();
        map.current = null;
        mapInitialized.current = false;
      }
    };
  }, [mapboxToken, selectedMarket]);

  // Update map view when selected market changes
  useEffect(() => {
    if (!map.current || !mapInitialized.current) return;
    
    const updateMapView = async () => {
      console.log("Updating map view for selected market:", selectedMarket);
      
      // Remove previous demo markers if they exist
      if (map.current) {
        const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
        existingMarkers.forEach(marker => marker.remove());
      }
      
      // Default coordinates
      let coordinates = marketCoordinates.default.center;
      let zoom = marketCoordinates.default.zoom;
      
      if (selectedMarket === "default") {
        // If "All Campuses" is selected, show demo map
        if (map.current && map.current.loaded()) {
          createDemoMap(map.current);
        }
      } else {
        const selectedCampus = campuses.find(c => c.campus_id === selectedMarket);
        
        if (selectedCampus) {
          console.log("Selected campus:", selectedCampus);
          // First try to find in marketCoordinates
          const campusNameLower = selectedCampus.campus_name.toLowerCase();
          let found = false;
          
          for (const [key, value] of Object.entries(marketCoordinates)) {
            if (value.name.toLowerCase() === campusNameLower) {
              coordinates = value.center;
              zoom = value.zoom;
              found = true;
              console.log("Found campus in marketCoordinates:", value.name);
              break;
            }
          }
          
          // If not found in marketCoordinates, use geocoding
          if (!found) {
            try {
              // Format the address as "Campus Name, State"
              const addressToGeocode = `${selectedCampus.campus_name}${selectedCampus.State ? `, ${selectedCampus.State.trim()}` : ''}`;
              console.log("Geocoding address:", addressToGeocode);
              
              const result = await geocodeAddress(addressToGeocode);
              if (result) {
                // Convert to mapbox format [lng, lat]
                coordinates = [result.coordinates.lng, result.coordinates.lat];
                zoom = 11; // Standard city zoom level
                console.log("Geocoding result:", result);
              } else {
                console.log("Geocoding failed, using default view");
                toast.warning(`Couldn't find exact location for ${selectedCampus.campus_name}`, {
                  description: "Using approximate view"
                });
              }
            } catch (error) {
              console.error("Error geocoding address:", error);
            }
          }
        }
      }
      
      // Animate to the new location
      if (map.current) {
        console.log("Flying to coordinates:", coordinates, "with zoom:", zoom);
        map.current.flyTo({
          center: coordinates,
          zoom: zoom,
          pitch: 30,
          duration: 2000
        });
      }
    };
    
    updateMapView();
  }, [selectedMarket, campuses]);

  // Create a demo map with sample data points for "All Campuses" view
  const createDemoMap = (mapInstance: mapboxgl.Map) => {
    console.log("Creating demo map for All Campuses view");
    
    // Use a subset of the market coordinates as sample data points
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
    
    // Add markers for each location
    demoLocations.forEach(location => {
      // Create a DOM element for the marker
      const el = document.createElement('div');
      el.className = 'mapboxgl-marker';
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = location.color;
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 0 4px rgba(0,0,0,0.3)';
      
      // Add a popup with the location name
      const popup = new mapboxgl.Popup({ offset: 25 })
        .setText(location.name);
      
      // Add marker to map
      new mapboxgl.Marker(el)
        .setLngLat(location.coordinates)
        .setPopup(popup)
        .addTo(mapInstance);
    });
    
    // Zoom out to see all of the United States
    mapInstance.flyTo({
      center: marketCoordinates.default.center,
      zoom: marketCoordinates.default.zoom,
      pitch: 30,
      duration: 2000
    });
  };

  const handleMarketChange = (marketId: string) => {
    setSelectedMarket(marketId);
  };

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
            
            {mapError && (
              <Alert className="mb-4 border-red-400 bg-red-50">
                <AlertDescription className="text-red-800">
                  {mapError}
                </AlertDescription>
              </Alert>
            )}
            
            {isLoading ? (
              <LoadingState message="Loading map..." className="h-[600px]" />
            ) : (
              <div className="relative rounded-md overflow-hidden shadow-md mt-4">
                <div 
                  ref={mapContainer} 
                  className="w-full h-[600px] bg-gray-100"
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
