
// Type definitions for the census-data function
export interface GeocodingResult {
  lat: number;
  lng: number;
  formattedAddress: string;
  stateCode: string;
  countyName: string;
}

export interface FipsResult {
  stateFips: string;
  countyFips: string;
}

export interface CensusLocation {
  lat: number;
  lng: number;
}

export interface CensusTract {
  state: string;
  county: string;
  tract: string;
  distance: number;
}

export interface CensusBlockGroup extends CensusTract {
  blockGroup: string;
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

export interface CensusDataItem {
  name: string;
  value: string | number;
  description?: string;
}

export interface CensusResponse {
  data: CensusData;
  tractsIncluded: number;
  blockGroupsIncluded?: number;
  radiusMiles: number;
  searchedAddress?: string;
  isMockData?: boolean;
  error?: string;
}
