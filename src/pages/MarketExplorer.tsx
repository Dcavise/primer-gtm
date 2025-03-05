
import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getApiKey } from "@/services/api-config";
import { toast } from "sonner";
import { LoadingState } from "@/components/LoadingState";
import { MarketSelector } from "@/components/MarketSelector";
import { marketCoordinates } from "@/utils/marketCoordinates";
import { useCampuses } from "@/hooks/salesforce/useCampuses";
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
    // Log campuses for debugging
    console.log("Available campuses:", campuses);
    
    async function initializeMap() {
      try {
        setIsLoading(true);
        // Get the Mapbox token from Supabase edge function
        const token = await getApiKey('mapbox');
        setMapboxToken(token);
        
        if (!mapContainer.current) return;
        
        // Initialize Mapbox GL map
        mapboxgl.accessToken = token;
        
        // Get market coordinates
        let coords = marketCoordinates["default"];
        
        // If a campus is selected, find its matching coordinates
        if (selectedMarket !== "default") {
          // Try to find a direct match in marketCoordinates
          if (marketCoordinates[selectedMarket]) {
            coords = marketCoordinates[selectedMarket];
          } else {
            // Otherwise, look for a campus with this ID and try to match by name
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
      let coords = marketCoordinates["default"];
      
      // Similar logic as above to find the right coordinates
      if (selectedMarket !== "default") {
        if (marketCoordinates[selectedMarket]) {
          coords = marketCoordinates[selectedMarket];
        } else {
          const selectedCampus = campuses.find(c => c.campus_id === selectedMarket);
          if (selectedCampus) {
            const matchingMarketKey = Object.keys(marketCoordinates).find(key => 
              marketCoordinates[key].name.toLowerCase() === selectedCampus.campus_name.toLowerCase()
            );
            
            if (matchingMarketKey) {
              coords = marketCoordinates[matchingMarketKey];
            }
          }
        }
      }
      
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
  }, [selectedMarket, campuses]);

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
            campuses={campuses}
            isLoading={isLoading && campuses.length === 0}
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
