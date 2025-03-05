
// Market coordinates for major cities
export interface MarketCoordinates {
  center: [number, number]; // [longitude, latitude]
  zoom: number;
  name: string;
}

export const marketCoordinates: Record<string, MarketCoordinates> = {
  default: {
    center: [-98.5795, 39.8283], // Center of USA
    zoom: 3.5,
    name: "United States"
  },
  "sf": {
    center: [-122.4194, 37.7749],
    zoom: 11,
    name: "San Francisco"
  },
  "nyc": {
    center: [-74.0060, 40.7128],
    zoom: 11,
    name: "New York City"
  },
  "chi": {
    center: [-87.6298, 41.8781],
    zoom: 11,
    name: "Chicago"
  },
  "la": {
    center: [-118.2437, 34.0522],
    zoom: 11,
    name: "Los Angeles"
  },
  "bos": {
    center: [-71.0589, 42.3601],
    zoom: 11,
    name: "Boston"
  },
  "sea": {
    center: [-122.3321, 47.6062],
    zoom: 11,
    name: "Seattle"
  },
  "mia": {
    center: [-80.1918, 25.7617],
    zoom: 11,
    name: "Miami"
  },
  "aus": {
    center: [-97.7431, 30.2672],
    zoom: 11,
    name: "Austin"
  },
  "den": {
    center: [-104.9903, 39.7392],
    zoom: 11,
    name: "Denver"
  },
  "atl": {
    center: [-84.3880, 33.7490],
    zoom: 11,
    name: "Atlanta"
  }
};
