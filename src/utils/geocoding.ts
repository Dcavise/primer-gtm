
import { getApiKey } from "@/services/api-config";
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
    // Use Mapbox for geocoding
    const result = await geocodeWithMapbox(address);
    
    if (!result) {
      throw new Error("Geocoding failed");
    }
    
    return result;
  } catch (error) {
    console.error("Geocoding error:", error);
    toast.error("Could not find this address", {
      description: "Please check the address and try again"
    });
    return null;
  }
}

async function geocodeWithMapbox(address: string): Promise<GeocodingResult | null> {
  try {
    let token = '';
    try {
      token = await getApiKey('mapbox');
      if (!token || token.trim() === '') {
        throw new Error("No Mapbox token available");
      }
    } catch (error) {
      console.error("Error fetching Mapbox token:", error);
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
