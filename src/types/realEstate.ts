
export interface RealEstateProperty {
  id: number;
  created_at: string;
  site_name: string | null;
  address: string | null;
  market: string | null;
  phase: string | null;
  sf_available: string | null;
  zoning: string | null;
  permitted_use: string | null;
  parking: string | null;
  ll_poc: string | null; // Landlord point of contact
  ll_phone: string | null;
  ll_email: string | null;
  ahj_zoning_confirmation: string | null;
  ahj_building_records: string | null;
  survey_status: string | null;
  test_fit_status: string | null;
  loi_status: string | null;
  lease_status: string | null;
  status_notes: string | null;
  fire_sprinklers: string | null;
  fiber: string | null;
}

export type PropertyPhase = 'Prospecting' | 'Discovery' | 'Qualification' | 'Proposal' | 'Negotiation' | 'Contract' | 'Closed' | string;
