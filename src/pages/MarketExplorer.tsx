
import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getApiKey } from "@/services/api-config";
import { toast } from "sonner";
import { LoadingState } from "@/components/LoadingState";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MarketExplorer = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
        
        const newMap = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/light-v11',
          center: [-98.5795, 39.8283], // Center of USA
          zoom: 3.5,
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
    
    initializeMap();
    
    // Clean up map instance when component unmounts
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

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
                    if (map.current) {
                      map.current.flyTo({
                        center: [-98.5795, 39.8283],
                        zoom: 3.5,
                        pitch: 30,
                        bearing: 0
                      });
                    }
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
