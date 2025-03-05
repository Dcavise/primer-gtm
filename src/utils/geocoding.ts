
import { getApiKey } from "@/services/api-config";
import { toast } from "sonner";
import mapboxgl from 'mapbox-gl';

// Track if the token has been initialized
let tokenInitialized = false;

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface GeocodingResult {
  address: string;
  coordinates: Coordinates;
  context?: {
    country?: string;
    region?: string;
    place?: string;
    neighborhood?: string;
    postcode?: string;
  };
  featureType?: string;
  bbox?: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
}

export interface GeocodingOptions {
  types?: Array<'country' | 'region' | 'postcode' | 'district' | 'place' | 'locality' | 'neighborhood' | 'street' | 'address'>;
  limit?: number;
  proximity?: Coordinates;
  autocomplete?: boolean;
  language?: string;
  country?: string | string[];
}

/**
 * Sets the Mapbox access token for the application
 */
export async function initializeMapboxToken(): Promise<boolean> {
  // If already initialized, return true immediately
  if (tokenInitialized && mapboxgl.accessToken) {
    console.log("Mapbox token already initialized");
    return true;
  }
  
  try {
    const token = await getApiKey('mapbox');
    if (!token || token.trim() === '') {
      throw new Error("No Mapbox token available");
    }
    
    // Set the token for the entire mapboxgl instance
    mapboxgl.accessToken = token;
    
    // Set the worker URL for CSP compatibility
    if (typeof mapboxgl.workerUrl === 'undefined') {
      mapboxgl.workerUrl = "https://api.mapbox.com/mapbox-gl-js/v3.10.0/mapbox-gl-csp-worker.js";
    }
    
    console.log("Successfully initialized Mapbox token");
    tokenInitialized = true;
    return true;
  } catch (error) {
    console.error("Error initializing Mapbox token:", error);
    toast.error("Could not authenticate with Mapbox", {
      description: "Please check your API configuration"
    });
    return false;
  }
}

/**
 * Geocode an address string into coordinates using Mapbox
 */
export async function geocodeAddress(
  address: string, 
  options: GeocodingOptions = {}
): Promise<GeocodingResult | null> {
  if (!address || address.trim() === '') {
    console.warn("Empty address provided to geocodeAddress");
    return null;
  }
  
  try {
    console.log(`Geocoding address with Mapbox: ${address}`);
    
    // Get Mapbox token if not already set
    if (!mapboxgl.accessToken || !tokenInitialized) {
      const tokenInitResult = await initializeMapboxToken();
      if (!tokenInitResult) {
        throw new Error("Failed to initialize Mapbox token");
      }
    }
    
    const encodedAddress = encodeURIComponent(address);
    
    // Build URL with options
    let url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${mapboxgl.accessToken}`;
    
    // Add options to URL if provided
    if (options.types && options.types.length > 0) {
      url += `&types=${options.types.join(',')}`;
    }
    
    if (options.limit) {
      url += `&limit=${options.limit}`;
    }
    
    if (options.proximity) {
      url += `&proximity=${options.proximity.lng},${options.proximity.lat}`;
    }
    
    if (options.autocomplete !== undefined) {
      url += `&autocomplete=${options.autocomplete}`;
    }
    
    if (options.language) {
      url += `&language=${options.language}`;
    }
    
    if (options.country) {
      const countries = Array.isArray(options.country) 
        ? options.country.join(',') 
        : options.country;
      url += `&country=${countries}`;
    }

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

      // Extract context information (country, region, etc.)
      const context: GeocodingResult['context'] = {};
      
      if (result.context) {
        for (const ctx of result.context) {
          if (ctx.id.startsWith('country')) {
            context.country = ctx.text;
          } else if (ctx.id.startsWith('region')) {
            context.region = ctx.text;
          } else if (ctx.id.startsWith('place')) {
            context.place = ctx.text;
          } else if (ctx.id.startsWith('neighborhood')) {
            context.neighborhood = ctx.text;
          } else if (ctx.id.startsWith('postcode')) {
            context.postcode = ctx.text;
          }
        }
      }

      // Create result object
      const geocodingResult: GeocodingResult = {
        address: formattedAddress,
        coordinates,
        context,
        featureType: result.place_type?.[0],
        bbox: result.bbox
      };

      console.log("Successfully geocoded with Mapbox:", formattedAddress, geocodingResult);
      return geocodingResult;
    } else {
      console.warn("No results found for geocoding:", address);
      return null;
    }
  } catch (error) {
    console.error("Mapbox geocoding error:", error);
    toast.error("Geocoding failed", {
      description: error instanceof Error ? error.message : "Unknown error"
    });
    return null;
  }
}

/**
 * Reverse geocode coordinates into an address
 */
export async function reverseGeocode(
  coordinates: Coordinates,
  options: Omit<GeocodingOptions, 'autocomplete' | 'proximity'> = {}
): Promise<GeocodingResult | null> {
  try {
    console.log(`Reverse geocoding coordinates: ${coordinates.lat}, ${coordinates.lng}`);
    
    // Get Mapbox token if not already set
    if (!mapboxgl.accessToken || !tokenInitialized) {
      const tokenInitResult = await initializeMapboxToken();
      if (!tokenInitResult) {
        throw new Error("Failed to initialize Mapbox token");
      }
    }
    
    // Build URL with options
    let url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${coordinates.lng},${coordinates.lat}.json?access_token=${mapboxgl.accessToken}`;
    
    // Add options to URL if provided
    if (options.types && options.types.length > 0) {
      url += `&types=${options.types.join(',')}`;
    }
    
    if (options.limit) {
      url += `&limit=${options.limit}`;
    }
    
    if (options.language) {
      url += `&language=${options.language}`;
    }
    
    if (options.country) {
      const countries = Array.isArray(options.country) 
        ? options.country.join(',') 
        : options.country;
      url += `&country=${countries}`;
    }

    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Mapbox API returned status ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const result = data.features[0];
      const formattedAddress = result.place_name;
      
      // Extract context information (country, region, etc.)
      const context: GeocodingResult['context'] = {};
      
      if (result.context) {
        for (const ctx of result.context) {
          if (ctx.id.startsWith('country')) {
            context.country = ctx.text;
          } else if (ctx.id.startsWith('region')) {
            context.region = ctx.text;
          } else if (ctx.id.startsWith('place')) {
            context.place = ctx.text;
          } else if (ctx.id.startsWith('neighborhood')) {
            context.neighborhood = ctx.text;
          } else if (ctx.id.startsWith('postcode')) {
            context.postcode = ctx.text;
          }
        }
      }

      // Create result object
      const geocodingResult: GeocodingResult = {
        address: formattedAddress,
        coordinates: {
          lng: coordinates.lng,
          lat: coordinates.lat
        },
        context,
        featureType: result.place_type?.[0],
        bbox: result.bbox
      };

      console.log("Successfully reverse geocoded with Mapbox:", formattedAddress, geocodingResult);
      return geocodingResult;
    } else {
      console.warn("No results found for reverse geocoding:", coordinates);
      return null;
    }
  } catch (error) {
    console.error("Mapbox reverse geocoding error:", error);
    toast.error("Reverse geocoding failed", {
      description: error instanceof Error ? error.message : "Unknown error"
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

/**
 * Creates a marker element with custom styling
 */
export function createCustomMarker(color: string = '#1F77B4', size: number = 20): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'mapboxgl-marker';
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.borderRadius = '50%';
  el.style.backgroundColor = color;
  el.style.border = '2px solid white';
  el.style.boxShadow = '0 0 4px rgba(0,0,0,0.3)';
  return el;
}
