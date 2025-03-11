// Google Maps utility functions

// Default locations for map center
export const DEFAULT_LOCATIONS = {
  USA: {
    lat: 39.8283,
    lng: -98.5795,
    zoom: 4,
  },
  NEW_YORK: {
    lat: 40.7484,
    lng: -73.9857,
    zoom: 12,
  },
  LOS_ANGELES: {
    lat: 34.0522,
    lng: -118.2437,
    zoom: 12,
  },
  CHICAGO: {
    lat: 41.8781,
    lng: -87.6298,
    zoom: 12,
  },
};

// Generate a Google Maps URL
export function getGoogleMapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

// Generate an embed URL for Google Maps iframe
export function getGoogleMapsEmbedUrl(address: string, apiKey: string): string {
  return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(address)}&zoom=14`;
}

// Format coordinates for display
export function formatCoordinates(lat: number, lng: number): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

// Convert address to query string
export function addressToQueryString(
  address: string,
  city: string,
  state: string,
  zip: string
): string {
  return encodeURIComponent(`${address}, ${city}, ${state} ${zip}`);
}

// Get directions URL
export function getDirectionsUrl(from: string, to: string): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}`;
}
