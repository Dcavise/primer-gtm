
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
  try {
    // First try to get the Mapbox token for geocoding
    let mapboxToken;
    try {
      mapboxToken = await getApiKey('mapbox');
      if (mapboxToken) {
        console.log("Using Mapbox for geocoding");
        return await geocodeWithMapbox(address, mapboxToken);
      }
    } catch (error) {
      console.warn("Failed to get Mapbox token, falling back to Google Maps:", error);
    }
    
    // Fall back to Google Maps if Mapbox fails or isn't available
    return await geocodeWithGoogleMaps(address);
    
  } catch (error) {
    console.error("Geocoding error:", error);
    toast.error("Could not find this address", {
      description: "Please check the address and try again"
    });
    return null;
  }
}

async function geocodeWithMapbox(address: string, token: string): Promise<GeocodingResult | null> {
  try {
    console.log("Geocoding address with Mapbox:", address);
    const encodedAddress = encodeURIComponent(address);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${token}`;

    const response = await fetch(url);
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
    throw error;
  }
}

async function geocodeWithGoogleMaps(address: string): Promise<GeocodingResult | null> {
  try {
    // Try to get the Google Maps API key securely from Supabase
    let apiKey;
    try {
      apiKey = await getApiKey('google_maps');
    } catch (error) {
      console.warn("Failed to get Google Maps API key from edge function, using fallback:", error);
      // Fall back to the deprecated but still functional API key as backup
      apiKey = GOOGLE_MAPS_API_KEY;
    }
    
    if (!apiKey) {
      throw new Error("No Google Maps API key available");
    }
    
    console.log("Geocoding address with Google Maps:", address);
    const encodedAddress = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;

    const response = await fetch(url);
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
    throw error;
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
