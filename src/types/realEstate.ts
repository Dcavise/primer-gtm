
export interface RealEstateProperty {
  id: number;
  created_at: string;
  site_name: string | null;
  address: string | null;
  market: string | null;
  phase: PropertyPhase | null;
  phase_group: string | null;
  sf_available: string | null;
  zoning: string | null;
  permitted_use: string | null;
  parking: string | null;
  ll_poc: string | null; // Landlord point of contact
  ll_phone: string | null;
  ll_email: string | null;
  ahj_zoning_confirmation: BooleanStatus;
  ahj_building_records: string | null;
  survey_status: SurveyStatus;
  test_fit_status: TestFitStatus;
  loi_status: LeaseStatus;
  lease_status: LeaseStatus;
  status_notes: string | null;
  fire_sprinklers: BooleanStatus;
  fiber: BooleanStatus;
  // Add an index signature to allow for dynamic properties
  [key: string]: any;
}

// This precisely matches the enum defined in Supabase
export type PropertyPhase = 
  | '0. New Site'
  | '1. Initial Diligence'
  | '2. Survey'
  | '3. Test Fit'
  | '4. Plan Production'
  | '5. Permitting'
  | '6. Construction'
  | '7. Set Up'
  | 'Hold'
  | 'Deprioritize';

// Define type aliases for the enum values to improve code readability
export type BooleanStatus = "true" | "false" | "unknown" | null;
export type SurveyStatus = "complete" | "pending" | "unknown" | null;
export type TestFitStatus = "unknown" | "pending" | "complete" | null;
export type LeaseStatus = "pending" | "sent" | "signed" | null;
