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

export interface Campus {
  id: string;
  campus_id: string;
  campus_name: string;
  created_at: string;
  updated_at: string;
}

export interface Fellow {
  id: number;
  fellow_id: number | null;
  fellow_name: string;
  campus: string | null;
  campus_id: string | null;
  campus_name?: string | null;
  cohort: number | null;
  grade_band: string | null;
  fte_employment_status: string | null;
  updated_at: string | null;
}

export interface SalesforceOpportunity {
  id: string;
  opportunity_id: string;
  lead_id: string;
  stage: string | null;
  created_at: string;
  updated_at: string;
}

export * from './schools';
