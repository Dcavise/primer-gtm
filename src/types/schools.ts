
export interface School {
  id: string;
  name: string;
  educationLevel: string;
  type: string;
  grades: {
    range: {
      low: string;
      high: string;
    };
  };
  enrollment: number;
  location: {
    address: {
      streetAddress: string;
      city: string;
      state: string;
      zipCode: string;
    };
    distanceMiles: number;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  links?: {
    website?: string;
    profile?: string;
    ratings?: string;
    reviews?: string;
  };
  phone?: string;
  district?: {
    id: string;
    name: string;
  };
  ratings?: {
    overall?: number;
    academics?: number;
    collegeReadiness?: number;
    equity?: number;
  };
}

export interface SchoolsResponse {
  schools: School[];
  searchedAddress: string;
  coordinates: {
    lat: number;
    lon: number;
  };
  radiusMiles: number;
  totalResults: number;
}
