
export interface Coordinates {
  lat: number;
  lng: number;
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

// Updated SalesforceLead interface without converted_account_id and converted_contact_id
export interface SalesforceLead {
  id: string;
  lead_id: string;
  first_name: string | null;
  last_name: string;
  created_date: string | null;
  converted_date: string | null;
  converted: boolean | null;
  is_converted: boolean | null;
  stage: string | null;
  lead_source: string | null;
  preferred_campus: string | null;
  campus_id: string | null;
  converted_opportunity_id: string | null;
  updated_at: string;
}

// Updated SalesforceOpportunity interface with campus_id field
export interface SalesforceOpportunity {
  id: string;
  opportunity_id: string;
  opportunity_name: string | null;
  stage: string | null;
  close_date: string | null;
  created_at: string;
  updated_at: string;
  preferred_campus: string | null;
  campus_id: string | null;
}

// Updated SalesforceAccount to match actual structure
export interface SalesforceAccount {
  id: string;
  account_id: string;
  account_name: string;
  created_at?: string;
  updated_at?: string;
}

export interface SalesforceContact {
  id: string;
  contact_id: string;
  account_id: string | null;
  first_name: string | null;
  last_name: string;
  email: string | null;
  created_at: string;
  updated_at: string;
}

