
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Coordinates } from "@/types";

/**
 * Interface for address components returned by Google Maps API
 */
export interface AddressComponents {
  [key: string]: {
    long_name: string;
    short_name: string;
  };
}

/**
 * Interface for geocoding result
 */
export interface GeocodingResult {
  formattedAddress: string;
  coordinates: Coordinates;
  addressComponents?: AddressComponents;
  placeId?: string;
  types?: string[];
}

// Add a type declaration for the window object to include Google Maps properties
declare global {
  interface Window {
    google?: any;
    initMap?: () => void;
  }
}

/**
 * Geocodes an address using Google Maps API via Supabase edge function
 * @param address The address to geocode
 * @returns Promise with geocoding result or null if unsuccessful
 */
export const geocodeAddress = async (address: string): Promise<GeocodingResult | null> => {
  try {
    console.log(`Geocoding address: ${address}`);
    
    if (!address || address.trim() === '') {
      toast.error("Invalid address", {
        description: "Please provide a valid address to search."
      });
      return null;
    }
    
    // Call the google-maps edge function with geocode operation
    console.log(`Using google-maps edge function to geocode address`);
    
    const { data, error } = await supabase.functions.invoke('google-maps', {
      body: { 
        operation: 'geocode',
        address 
      }
    });
    
    if (error) {
      console.error(`Geocoding edge function error:`, error);
      toast.error("Geocoding failed", {
        description: error.message || "Could not find coordinates for the provided address."
      });
      return null;
    }
    
    if (!data || !data.coordinates) {
      console.error("Invalid geocoding result structure:", data);
      toast.error("Address location error", {
        description: "The system couldn't determine exact coordinates for this address."
      });
      return null;
    }
    
    console.log(`Successfully geocoded address to: ${data.formattedAddress} (${data.coordinates.lat}, ${data.coordinates.lng})`);
    
    return {
      formattedAddress: data.formattedAddress,
      coordinates: data.coordinates,
      addressComponents: data.addressComponents,
      placeId: data.placeId,
      types: data.types
    };
  } catch (error) {
    console.error("Error geocoding address:", error);
    
    toast.error("Geocoding failed", {
      description: "Could not find coordinates for the provided address. Please check the address and try again."
    });
    
    return null;
  }
};

/**
 * Creates a bounding box around a point with a specified radius
 * @param center Center coordinates
 * @param radiusInMeters Radius in meters
 * @returns Bounding box with bottom left and top right coordinates
 */
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
