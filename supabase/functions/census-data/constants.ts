
// Constants used throughout the census-data function

// FIPS code mappings
export const stateFipsCodes: Record<string, string> = {
  "AL": "01", "AK": "02", "AZ": "04", "AR": "05", "CA": "06", "CO": "08", "CT": "09", "DE": "10",
  "DC": "11", "FL": "12", "GA": "13", "HI": "15", "ID": "16", "IL": "17", "IN": "18", "IA": "19",
  "KS": "20", "KY": "21", "LA": "22", "ME": "23", "MD": "24", "MA": "25", "MI": "26", "MN": "27",
  "MS": "28", "MO": "29", "MT": "30", "NE": "31", "NV": "32", "NH": "33", "NJ": "34", "NM": "35",
  "NY": "36", "NC": "37", "ND": "38", "OH": "39", "OK": "40", "OR": "41", "PA": "42", "RI": "44",
  "SC": "45", "SD": "46", "TN": "47", "TX": "48", "UT": "49", "VT": "50", "VA": "51", "WA": "53",
  "WV": "54", "WI": "55", "WY": "56"
};

// Convert state FIPS codes to names
export const stateNamesByFips: Record<string, string> = Object.entries(stateFipsCodes).reduce(
  (acc, [name, code]) => ({ ...acc, [code]: name }), {}
);

// Common coordinates for major counties
export const countyCoordinates: Record<string, { lat: number, lng: number }> = {
  "17031": { lat: 41.8781, lng: -87.6298 }, // Chicago, Cook County, IL
  "36061": { lat: 40.7831, lng: -73.9712 }, // Manhattan, NY
  "06037": { lat: 34.0522, lng: -118.2437 }, // Los Angeles, CA
  "04013": { lat: 33.4484, lng: -112.0740 }, // Phoenix, AZ
  "48201": { lat: 29.7604, lng: -95.3698 }, // Houston, TX
  "42101": { lat: 39.9526, lng: -75.1652 }, // Philadelphia, PA
  "12086": { lat: 25.7617, lng: -80.1918 }, // Miami, FL
};

// Common HTTP headers for CORS
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
