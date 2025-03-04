
export interface Coordinates {
  lat: number;
  lng: number;
}

export interface PermitSearchParams {
  top_right_lat: number;
  top_right_lng: number;
  bottom_left_lat: number;
  bottom_left_lng: number;
  exact_address?: string; // Add this new parameter for exact address matching
}

export interface PermitLocation {
  lat: string;
  lon: string;
}

export interface PermitPin {
  location: PermitLocation;
}

export interface Permit {
  id: string;
  record_id: string;
  applicant: string;
  project_type: string;
  address: string;
  postcode: string;
  city: string;
  state: string;
  latitude: string;
  longitude: string;
  pin: PermitPin;
  department_id: string;
  project_brief: string;
  project_name: string;
  zoning_classification_pre: string;
  zoning_classification_post: string;
  status: string;
  date: string;
  applicant_contact: string;
  record_link: string;
  document_link: string;
  contact_phone_number: string;
  contact_email: string;
  contact_website: string;
  parcel_number: string;
  block: string;
  lot: string;
  owner: string;
  authority: string;
  owner_address: string;
  owner_phone: string;
  created_date: string;
  last_updated_date: string;
  comments: string;
  remarks: string;
  source: string;
  suburb: string;
}

export interface PermitResponse {
  permits: Permit[];
  total: number;
}

export interface AddressSearchResult {
  address: string;
  coordinates: Coordinates;
}

export type SearchStatus = 'idle' | 'loading' | 'success' | 'error';

export interface CensusLocation {
  lat: number;
  lng: number;
}

export interface CensusTract {
  state: string;
  county: string;
  tract: string;
  distance: number; // distance in miles from the search point
}

export interface CensusDataItem {
  name: string;
  value: string | number;
  description?: string;
}

export interface CensusData {
  totalPopulation?: number;
  medianHouseholdIncome?: number;
  medianHomeValue?: number;
  educationLevelHS?: number;
  educationLevelBachelor?: number;
  unemploymentRate?: number;
  povertyRate?: number;
  medianAge?: number;
  housingUnits?: number;
  homeownershipRate?: number;
  rawData: Record<string, any>;
  categories: {
    demographic: CensusDataItem[];
    economic: CensusDataItem[];
    housing: CensusDataItem[];
    education: CensusDataItem[];
  };
}

export interface CensusResponse {
  data: CensusData;
  tractsIncluded: number;
  radiusMiles: number;
}

export * from './schools';
