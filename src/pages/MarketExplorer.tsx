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
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MarketExplorer = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMarket, setSelectedMarket] = useState<string>("default");
  const { campuses, fetchCampuses } = useCampuses();

  useEffect(() => {
    // Fetch campuses when component mounts
    fetchCampuses();
  }, [fetchCampuses]);

  useEffect(() => {
    async function initializeMapbox() {
      try {
        if (!mapboxToken) {
          const token = await getApiKey('mapbox');
          setMapboxToken(token);
          return; // The next useEffect will handle map creation
        }

        if (!mapContainer.current || map.current) return;

        // Initialize the map
        mapboxgl.accessToken = mapboxToken;
        const newMap = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/light-v11',
          center: marketCoordinates.default.center, // Default center
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

        // Set the map reference
        map.current = newMap;

        // Wait for map to load before setting isLoading to false
        newMap.on('load', () => {
          setIsLoading(false);
          toast.success("Map loaded successfully", {
            description: "Market explorer is ready to use"
          });
        });
      } catch (error) {
        console.error("Error initializing map:", error);
        toast.error("Failed to load map", {
          description: "Please check your connection and try again"
        });
        setIsLoading(false);
      }
    }

    initializeMapbox();

    // Cleanup map instance when component unmounts
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapboxToken]);

  useEffect(() => {
    if (!map.current || !mapboxToken) return;

    let coords = marketCoordinates.default;
    
    // Find the coordinates for the selected market
    if (selectedMarket !== "default") {
      // Try to find direct match in marketCoordinates
      if (marketCoordinates[selectedMarket]) {
        coords = marketCoordinates[selectedMarket];
      } else {
        // Otherwise, look for campus with this ID and try to match by name
        const selectedCampus = campuses.find(c => c.campus_id === selectedMarket);
        if (selectedCampus) {
          // Try to find coordinates by campus name
          const matchingMarketKey = Object.keys(marketCoordinates).find(key => 
            marketCoordinates[key].name.toLowerCase() === selectedCampus.campus_name.toLowerCase()
          );
          
          if (matchingMarketKey) {
            coords = marketCoordinates[matchingMarketKey];
          }
        }
      }
    }
    
    // Animate to the new location
    map.current.flyTo({
      center: coords.center,
      zoom: coords.zoom,
      pitch: 30,
      duration: 2000
    });
  }, [selectedMarket, campuses, mapboxToken]);

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
            
            {isLoading ? (
              <LoadingState message="Loading map..." className="h-[600px]" />
            ) : (
              <div className="relative rounded-md overflow-hidden shadow-md mt-4">
                <div 
                  ref={mapContainer} 
                  className="w-full h-[600px]"
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
