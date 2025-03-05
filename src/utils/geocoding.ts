
import { toast } from "sonner";

// Define coordinate type
export interface Coordinates {
  lat: number;
  lng: number;
}

// Function to geocode an address using a simple mocked implementation
export const geocodeAddress = async (address: string): Promise<{ 
  address: string;
  coordinates: Coordinates;
} | null> => {
  try {
    // Since we've removed Mapbox implementation, we'll use a simple mock
    // In a real implementation, this would call a geocoding service
    
    // Create a deterministic coordinate based on the address string
    // This is just for demo purposes - in reality you would use a real geocoding service
    const mockLat = 40 + (address.length % 10) * 0.1;
    const mockLng = -74 + (address.charCodeAt(0) % 10) * 0.1;
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      address: address,
      coordinates: {
        lat: mockLat,
        lng: mockLng
      }
    };
  } catch (error) {
    console.error("Error geocoding address:", error);
    toast.error("Geocoding failed", {
      description: "Could not find coordinates for the provided address."
    });
    return null;
  }
};

// Create a bounding box around a point with a specified radius
export const createBoundingBox = (
  center: Coordinates,
  radiusInMeters: number
): {
  bottomLeft: Coordinates;
  topRight: Coordinates;
} => {
  // Earth's radius in meters
  const earthRadius = 6378137;
  
  // Convert radius from meters to degrees
  const radiusInDegrees = radiusInMeters / earthRadius * (180 / Math.PI);
  
  // Calculate the bounding box
  return {
    bottomLeft: {
      lat: center.lat - radiusInDegrees,
      lng: center.lng - radiusInDegrees / Math.cos(center.lat * Math.PI / 180)
    },
    topRight: {
      lat: center.lat + radiusInDegrees,
      lng: center.lng + radiusInDegrees / Math.cos(center.lat * Math.PI / 180)
    }
  };
};
