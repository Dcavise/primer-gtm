import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, MousePointerClick } from "lucide-react";

// Type for visitor data
interface Visitor {
  id: string;
  lat: number;
  lng: number;
  lastActive: Date;
  isActive: boolean;
}

// Type for KPI metrics
interface Metrics {
  websiteVisits: number;
  leadsSubmitted: number;
}

// Mock Google Maps API key (this would normally be fetched from an edge function)
const MOCK_GOOGLE_MAPS_API_KEY = "AIzaSyMOCK_EXAMPLE_KEY_FOR_DEVELOPMENT";

const LiveLook: React.FC = () => {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    websiteVisits: 0,
    leadsSubmitted: 0
  });
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Generate random coordinates within the US
  const generateRandomUSCoordinates = () => {
    // Approximate US bounds
    const minLat = 24.396308; // Southern tip of Florida
    const maxLat = 49.384358; // Northern border
    const minLng = -125.000000; // West Coast
    const maxLng = -66.934570; // East Coast

    const lat = minLat + Math.random() * (maxLat - minLat);
    const lng = minLng + Math.random() * (maxLng - minLng);
    
    return { lat, lng };
  };

  // Generate dummy visitor data
  useEffect(() => {
    // Initial visitors (10-20 random visitors)
    const initialVisitorCount = 10 + Math.floor(Math.random() * 10);
    const initialVisitors: Visitor[] = [];
    
    for (let i = 0; i < initialVisitorCount; i++) {
      const { lat, lng } = generateRandomUSCoordinates();
      initialVisitors.push({
        id: `visitor-${i}`,
        lat,
        lng,
        lastActive: new Date(),
        isActive: true
      });
    }
    
    setVisitors(initialVisitors);
    
    // Set initial metrics
    setMetrics({
      websiteVisits: 120 + Math.floor(Math.random() * 80),
      leadsSubmitted: 8 + Math.floor(Math.random() * 12)
    });

    // Simulate visitors coming and going
    const interval = setInterval(() => {
      setVisitors(prevVisitors => {
        // Update existing visitors (some may become inactive)
        const updatedVisitors = prevVisitors.map(visitor => {
          // 5% chance an active visitor leaves
          if (visitor.isActive && Math.random() < 0.05) {
            return { ...visitor, isActive: false, lastActive: new Date() };
          }
          return visitor;
        });
        
        // Add new visitors (0-2 per interval)
        const newVisitorCount = Math.floor(Math.random() * 3);
        const newVisitors: Visitor[] = [];
        
        for (let i = 0; i < newVisitorCount; i++) {
          const { lat, lng } = generateRandomUSCoordinates();
          newVisitors.push({
            id: `visitor-${Date.now()}-${i}`,
            lat,
            lng,
            lastActive: new Date(),
            isActive: true
          });
        }
        
        // Remove visitors who have been inactive for more than 30 seconds
        const filteredVisitors = updatedVisitors.filter(visitor => 
          visitor.isActive || 
          (new Date().getTime() - visitor.lastActive.getTime() < 30000)
        );
        
        // Update metrics when new visitors are added
        if (newVisitorCount > 0) {
          setMetrics(prev => ({
            ...prev,
            websiteVisits: prev.websiteVisits + newVisitorCount,
            // 10% chance a new visitor submits a lead
            leadsSubmitted: prev.leadsSubmitted + (Math.random() < 0.1 ? 1 : 0)
          }));
        }
        
        return [...filteredVisitors, ...newVisitors];
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Load Google Maps - using a simpler approach with an iframe to avoid TypeScript errors
  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      setMapLoaded(true);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="container mx-auto max-w-6xl py-6 px-4">
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Live Look</h1>
          <p className="text-muted-foreground mt-2">
            Real-time view of website visitors across the United States
          </p>
        </div>

        {/* KPI Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Website Visits (Last 24 Hours)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Users className="h-5 w-5 text-blue-500 mr-2" />
                <span className="text-3xl font-bold">{metrics.websiteVisits}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Leads Submitted (Last 24 Hours)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <MousePointerClick className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-3xl font-bold">{metrics.leadsSubmitted}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Map View */}
        <Card className="relative overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Visitor Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative h-[500px] rounded-md overflow-hidden">
              {/* Map Container */}
              <div ref={mapRef} className="w-full h-full">
                {mapLoaded ? (
                  <iframe 
                    src={`https://www.google.com/maps/embed/v1/view?key=${MOCK_GOOGLE_MAPS_API_KEY}&center=39.8283,-98.5795&zoom=4&maptype=roadmap`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
                    <p className="text-muted-foreground">Loading map...</p>
                  </div>
                )}
              </div>
              
              {/* Visitor Dots (Overlay on top of the map) */}
              {mapLoaded && visitors.map(visitor => (
                <div 
                  key={visitor.id}
                  className={`absolute w-3 h-3 rounded-full transform -translate-x-1/2 -translate-y-1/2 ${
                    visitor.isActive 
                      ? 'bg-red-500 animate-pulse' 
                      : 'bg-gray-400 opacity-50'
                  }`}
                  style={{
                    left: `${((visitor.lng + 125) / (125 + 66.93457)) * 100}%`,
                    top: `${((49.384358 - visitor.lat) / (49.384358 - 24.396308)) * 100}%`,
                    transition: 'opacity 1s ease-out',
                    zIndex: 10
                  }}
                />
              ))}
              
              {/* Legend */}
              <div className="absolute bottom-4 right-4 bg-white dark:bg-slate-700 p-2 rounded-md shadow-md z-20">
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse mr-2"></div>
                  <span className="text-xs">Active Visitor</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-gray-400 opacity-50 mr-2"></div>
                  <span className="text-xs">Recently Left</span>
                </div>
              </div>
              
              {/* Current Visitor Count */}
              <Badge className="absolute top-4 right-4 z-20" variant="outline">
                <Users className="h-3 w-3 mr-1" />
                {visitors.filter(v => v.isActive).length} active visitors
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LiveLook; 