
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
    rawData: {},
  };
}
