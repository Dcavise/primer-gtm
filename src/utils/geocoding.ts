
import { getApiKey, GOOGLE_MAPS_API_KEY } from "@/services/api-config";
import { toast } from "sonner";

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
    
    console.log("Geocoding address:", address);
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

      console.log("Successfully geocoded address:", formattedAddress, coordinates);
      return { address: formattedAddress, coordinates };
    } else {
      console.error("Geocoding failed:", data.status, data);
      toast.error("Could not find this address", {
        description: "Please check the address and try again"
      });
      return null;
    }
  } catch (error) {
    console.error("Geocoding error:", error);
    toast.error("Could not find this address", {
      description: "Please check the address and try again"
    });
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
