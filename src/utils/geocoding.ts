
import { toast } from "sonner";

// Define coordinate type
export interface Coordinates {
  lat: number;
  lng: number;
}

// Function to geocode an address using Google Maps API
export const geocodeAddress = async (address: string): Promise<{ 
  address: string;
  coordinates: Coordinates;
} | null> => {
  try {
    console.log(`Geocoding address: ${address}`);
    
    // Make API request to our supabase function that wraps Google Maps API
    const response = await fetch(`https://nwyyfupafwpjapozjqmz.supabase.co/functions/v1/geocode-address`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ address })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Geocoding API error: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    
    if (!result || !result.coordinates) {
      throw new Error("No results found for this address");
    }
    
    console.log(`Successfully geocoded address to: ${result.formattedAddress} (${result.coordinates.lat}, ${result.coordinates.lng})`);
    
    return {
      address: result.formattedAddress || address,
      coordinates: {
        lat: result.coordinates.lat,
        lng: result.coordinates.lng
      }
    };
  } catch (error) {
    console.error("Error geocoding address:", error);
    toast.error("Geocoding failed", {
      description: "Could not find coordinates for the provided address. Please verify the address and try again."
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
