
import { AddressSearchResult, Coordinates } from "@/types";
import { toast } from "sonner";

// Using OpenStreetMap's Nominatim service for geocoding
const GEOCODING_URL = "https://nominatim.openstreetmap.org/search";
// Google Maps Geocoding API key
const GOOGLE_MAPS_API_KEY = "AIzaSyCPAIVrJFBNaO9gMtvHwKfzUwqS1WUkz3c";
const GOOGLE_GEOCODING_URL = "https://maps.googleapis.com/maps/api/geocode/json";

export async function geocodeAddress(address: string): Promise<AddressSearchResult | null> {
  try {
    // First attempt with OpenStreetMap
    const result = await geocodeWithOpenStreetMap(address);
    
    // If OSM fails, try with Google Maps API
    if (!result) {
      console.log("OpenStreetMap geocoding failed, trying Google Maps API");
      return await geocodeWithGoogleMaps(address);
    }
    
    return result;
  } catch (error) {
    console.error("Error geocoding address:", error);
    toast.error("Unable to find the location. Please try a different address.");
    return null;
  }
}

async function geocodeWithOpenStreetMap(address: string): Promise<AddressSearchResult | null> {
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
      throw new Error("OpenStreetMap geocoding service unavailable");
    }
    
    const data = await response.json();
    
    if (!data || data.length === 0) {
      console.log("No results found with OpenStreetMap");
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
    console.error("Error with OpenStreetMap geocoding:", error);
    return null;
  }
}

async function geocodeWithGoogleMaps(address: string): Promise<AddressSearchResult | null> {
  try {
    const params = new URLSearchParams({
      address: address,
      key: GOOGLE_MAPS_API_KEY
    });
    
    const response = await fetch(`${GOOGLE_GEOCODING_URL}?${params}`);
    
    if (!response.ok) {
      throw new Error("Google Maps geocoding service unavailable");
    }
    
    const data = await response.json();
    
    if (data.status !== "OK" || !data.results || data.results.length === 0) {
      // This is a true geocoding error - address couldn't be found
      toast.error("Address not found. Please try a different address or check the format.");
      return null;
    }
    
    const result = data.results[0];
    const formattedAddress = result.formatted_address;
    const location = result.geometry.location;
    
    return {
      address: formattedAddress,
      coordinates: {
        lat: location.lat,
        lng: location.lng
      }
    };
  } catch (error) {
    console.error("Error with Google Maps geocoding:", error);
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
