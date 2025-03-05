
// Mock census data for testing and fallback purposes
import { CensusData } from "./types.ts";

export function getMockCensusData(): CensusData {
  return {
    totalPopulation: 10000,
    medianHouseholdIncome: 60000,
    medianHomeValue: 250000,
    educationLevelHS: 90,
    educationLevelBachelor: 30,
    unemploymentRate: 5,
    povertyRate: 12,
    medianAge: 35,
    housingUnits: 4500,
    homeownershipRate: 60,
    categories: {
      demographic: [
        { name: "Population", value: "10,000" },
        { name: "Median Age", value: "35" },
        { name: "Population Density", value: "4,200/sq mi" },
        { name: "Population Growth", value: "1.5% annually" },
      ],
      economic: [
        { name: "Median Household Income", value: "$60,000" },
        { name: "Unemployment Rate", value: "5%" },
        { name: "Poverty Rate", value: "12%" },
        { name: "Employment in Services", value: "65%" },
      ],
      housing: [
        { name: "Median Home Value", value: "$250,000" },
        { name: "Homeownership Rate", value: "60%" },
        { name: "Housing Units", value: "4,500" },
        { name: "Rental Vacancy Rate", value: "6%" },
      ],
      education: [
        { name: "Bachelor's Degree or Higher", value: "30%" },
        { name: "High School Graduate or Higher", value: "90%" },
        { name: "School Enrollment", value: "1,800" },
        { name: "Student-Teacher Ratio", value: "16:1" },
      ],
    },
    rawData: {
      // Add mock block groups data for consistency
      blockGroupsInRadius: [
        {
          NAME: "Block Group 1, Census Tract 1, Sample County, Sample State",
          B01003_001E: "2500",
          B19013_001E: "65000",
          B25077_001E: "240000",
          B23025_005E: "120",
          B23025_003E: "1800",
          state: "00",
          county: "000",
          tract: "000100",
          blockGroup: "1",
          distance: 2.5
        },
        {
          NAME: "Block Group 2, Census Tract 1, Sample County, Sample State",
          B01003_001E: "2000",
          B19013_001E: "58000",
          B25077_001E: "220000",
          B23025_005E: "100",
          B23025_003E: "1500",
          state: "00",
          county: "000",
          tract: "000100",
          blockGroup: "2",
          distance: 3.2
        }
      ]
    },
  };
}
