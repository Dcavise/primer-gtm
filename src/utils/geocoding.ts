
import { AddressSearchResult, Coordinates } from "@/types";
import { toast } from "sonner";

// Using OpenStreetMap's Nominatim service for geocoding
const GEOCODING_URL = "https://nominatim.openstreetmap.org/search";

export async function geocodeAddress(address: string): Promise<AddressSearchResult | null> {
  try {
    const params = new URLSearchParams({
      q: address,
      format: "json",
      limit: "1",
      addressdetails: "1"
    });
    
    const response = await fetch(`${GEOCODING_URL}?${params}`, {
      headers: {
        "Accept-Language": "en-US,en",
        "User-Agent": "ZoneomicsPermitSearchTool/1.0"
      }
    });
    
    if (!response.ok) {
      throw new Error("Geocoding service unavailable");
    }
    
    const data = await response.json();
    
    if (!data || data.length === 0) {
      toast.error("Address not found. Please try a different address.");
      return null;
    }
    
    const result = data[0];
    
    return {
      address: result.display_name,
      coordinates: {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon)
      }
    };
  } catch (error) {
    console.error("Error geocoding address:", error);
    toast.error("Unable to find the location. Please try a different address.");
    return null;
  }
}

export function createBoundingBox(center: Coordinates, radiusInMeters = 500): {
  bottomLeft: Coordinates,
  topRight: Coordinates
} {
  // Approximate conversion from meters to degrees
  // This is a simplification and will be less accurate at extreme latitudes
  const metersToLatDegrees = 0.000009;
  const metersToLngDegrees = 0.000009 / Math.cos(center.lat * Math.PI / 180);
  
  const latOffset = metersToLatDegrees * radiusInMeters;
  const lngOffset = metersToLngDegrees * radiusInMeters;
  
  return {
    bottomLeft: {
      lat: center.lat - latOffset,
      lng: center.lng - lngOffset
    },
    topRight: {
      lat: center.lat + latOffset,
      lng: center.lng + lngOffset
    }
  };
}
