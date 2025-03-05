
import { getApiKey, GOOGLE_MAPS_API_KEY } from "@/services/api-config";
import { toast } from "sonner";
import mapboxgl from "mapbox-gl";

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface GeocodingResult {
  address: string;
  coordinates: Coordinates;
}

export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  if (!address || address.trim() === '') {
    console.warn("Empty address provided to geocodeAddress");
    return null;
  }
  
  try {
    // Primarily use Google Maps for geocoding
    const googleResult = await geocodeWithGoogleMaps(address);
    if (googleResult) {
      return googleResult;
    }
    
    // Only fall back to Mapbox if Google Maps fails
    console.warn("Google Maps geocoding failed, trying Mapbox as fallback");
    try {
      const mapboxResult = await geocodeWithMapbox(address);
      if (mapboxResult) {
        return mapboxResult;
      }
    } catch (error) {
      console.error("Mapbox fallback also failed:", error);
    }
    
    // If we get here, both services failed
    throw new Error("All geocoding services failed");
    
  } catch (error) {
    console.error("Geocoding error:", error);
    toast.error("Could not find this address", {
      description: "Please check the address and try again"
    });
    return null;
  }
}

async function geocodeWithGoogleMaps(address: string): Promise<GeocodingResult | null> {
  try {
    // Try to get the Google Maps API key securely from Supabase
    let apiKey;
    try {
      // First try POST request format
      apiKey = await getApiKey('google_maps');
      if (!apiKey) {
        console.warn("Empty Google Maps API key received from edge function");
        throw new Error("Empty API key");
      }
    } catch (error) {
      console.warn("Failed to get Google Maps API key from edge function, using fallback:", error);
      // Fall back to the deprecated but still functional API key as backup
      apiKey = GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        throw new Error("No Google Maps API key available");
      }
    }
    
    console.log("Geocoding address with Google Maps:", address);
    const encodedAddress = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Maps API returned status ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();

    if (data.status === "OK" && data.results && data.results.length > 0) {
      const result = data.results[0];
      const formattedAddress = result.formatted_address;
      const coordinates: Coordinates = {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
      };

      console.log("Successfully geocoded with Google Maps:", formattedAddress, coordinates);
      return { address: formattedAddress, coordinates };
    } else {
      console.error("Google Maps geocoding failed:", data.status, data);
      return null;
    }
  } catch (error) {
    console.error("Google Maps geocoding error:", error);
    return null; // Return null instead of throwing to allow fallback
  }
}

async function geocodeWithMapbox(address: string): Promise<GeocodingResult | null> {
  try {
    let token;
    try {
      token = await getApiKey('mapbox');
      if (!token) {
        throw new Error("No Mapbox token available");
      }
    } catch (error) {
      console.error("Error fetching Mapbox token:", error);
      // No fallback for Mapbox token
      throw error;
    }
    
    console.log("Geocoding address with Mapbox:", address);
    const encodedAddress = encodeURIComponent(address);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${token}`;

    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Mapbox API returned status ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const result = data.features[0];
      const formattedAddress = result.place_name;
      
      // Mapbox returns coordinates as [longitude, latitude]
      const coordinates: Coordinates = {
        lng: result.center[0],
        lat: result.center[1]
      };

      console.log("Successfully geocoded with Mapbox:", formattedAddress, coordinates);
      return { address: formattedAddress, coordinates };
    } else {
      console.error("Mapbox geocoding failed:", data);
      return null;
    }
  } catch (error) {
    console.error("Mapbox geocoding error:", error);
    return null;
  }
}

export function createBoundingBox(center: Coordinates, radiusInMeters: number) {
  const earthRadiusInMeters = 6371000; // Earth's radius in meters

  const latitudinalMeters = radiusInMeters / earthRadiusInMeters;
  const longitudinalMeters = radiusInMeters / (earthRadiusInMeters * Math.cos(Math.PI * center.lat / 180));

  const latitudinalChange = latitudinalMeters * (180 / Math.PI);
  const longitudinalChange = longitudinalMeters * (180 / Math.PI);

  const bottomLeft = {
    lat: center.lat - latitudinalChange,
    lng: center.lng - longitudinalChange,
  };

  const topRight = {
    lat: center.lat + latitudinalChange,
    lng: center.lng + longitudinalChange,
  };

  return { bottomLeft, topRight };
}
