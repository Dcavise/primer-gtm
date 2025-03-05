
import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getApiKey } from "@/services/api-config";
import { toast } from "sonner";
import { LoadingState } from "@/components/LoadingState";
import { MarketSelector } from "@/components/MarketSelector";
import { marketCoordinates } from "@/utils/marketCoordinates";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MarketExplorer = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMarket, setSelectedMarket] = useState<string>("default");

  useEffect(() => {
    async function initializeMap() {
      try {
        setIsLoading(true);
        // Get the Mapbox token from Supabase edge function
        const token = await getApiKey('mapbox');
        setMapboxToken(token);
        
        if (!mapContainer.current) return;
        
        // Initialize Mapbox GL map
        mapboxgl.accessToken = token;
        
        const coords = marketCoordinates[selectedMarket];
        
        const newMap = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/light-v11',
          center: coords.center,
          zoom: coords.zoom,
          pitch: 30, // Add some tilt for a more dynamic view
        });
        
        // Add navigation controls
        newMap.addControl(
          new mapboxgl.NavigationControl({
            visualizePitch: true,
          }),
          'top-right'
        );
        
        map.current = newMap;
        
        // Show success message
        toast.success("Map loaded successfully", {
          description: "Market explorer is ready to use"
        });

        // Wait for map to load before setting isLoading to false
        newMap.on('load', () => {
          setIsLoading(false);
        });
        
      } catch (error) {
        console.error("Error initializing map:", error);
        toast.error("Failed to load map", {
          description: "Please check your connection and try again"
        });
        setIsLoading(false);
      }
    }
    
    if (map.current) {
      // If map already exists, just update the center and zoom
      const coords = marketCoordinates[selectedMarket];
      map.current.flyTo({
        center: coords.center,
        zoom: coords.zoom,
        pitch: 30,
        duration: 2000
      });
    } else {
      // Initialize map for the first time
      initializeMap();
    }
    
    // Clean up map instance when component unmounts
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [selectedMarket]);

  const handleMarketChange = (marketId: string) => {
    setSelectedMarket(marketId);
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <Card className="shadow-lg border-0">
        <CardHeader className="pb-4">
          <CardTitle className="text-3xl font-bold tracking-tight">Market Explorer</CardTitle>
          <CardDescription>
            Explore real estate markets across the country
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MarketSelector
            selectedMarketId={selectedMarket}
            onSelectMarket={handleMarketChange}
          />
          
          {isLoading ? (
            <LoadingState message="Loading map..." className="h-[600px]" />
          ) : (
            <div className="relative rounded-md overflow-hidden shadow-md">
              <div 
                ref={mapContainer} 
                className="w-full h-[600px]"
              />
              <div className="absolute bottom-5 right-5 flex gap-2">
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => {
                    setSelectedMarket("default");
                  }}
                >
                  Reset View
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketExplorer;
