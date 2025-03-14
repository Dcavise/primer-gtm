import { useQuery } from "@tanstack/react-query";
import { RealEstateProperty, PropertyPhase, BooleanStatus, SurveyStatus, TestFitStatus, LeaseStatus } from "@/types/realEstate";
import { logger } from "@/utils/logger";

interface UseRealEstatePipelineOptions {
  campusId?: string | null;
}

// Generate mock real estate property data
const generateMockProperties = (campusId?: string | null): RealEstateProperty[] => {
  // Pipeline phases to distribute properties across
  const phases: PropertyPhase[] = [
    "0. New Site",
    "1. Initial Diligence",
    "2. Survey",
    "3. Test Fit",
    "4. Plan Production",
    "5. Permitting",
    "6. Construction",
    "7. Set Up",
    "Hold",
    "Deprioritize"
  ];
  
  // Sample addresses with state/city info for realistic data
  const addresses = [
    { address: "6007 111th Street East, Bradenton, FL 34211", state: "FL", city: "Bradenton" },
    { address: "4400 Mobile Hwy, Pensacola, FL 32609", state: "FL", city: "Pensacola" },
    { address: "2301 McFarland Blvd E, Tuscaloosa, AL 35404", state: "AL", city: "Tuscaloosa" },
    { address: "7900 Eastern Blvd, Montgomery, AL 36117", state: "AL", city: "Montgomery" },
    { address: "2122 E Rio Salado Pkwy, Tempe, AZ 85281", state: "AZ", city: "Tempe" },
    { address: "7000 E Mayo Blvd, Phoenix, AZ 85054", state: "AZ", city: "Phoenix" },
    { address: "1901 Bagby St, Houston, TX 77002", state: "TX", city: "Houston" },
    { address: "700 W 7th St, Austin, TX 78701", state: "TX", city: "Austin" },
    { address: "301 Pine St, Seattle, WA 98101", state: "WA", city: "Seattle" },
    { address: "4300 University Way NE, Seattle, WA 98105", state: "WA", city: "Seattle" },
    { address: "1600 Amphitheatre Pkwy, Mountain View, CA 94043", state: "CA", city: "Mountain View" },
    { address: "1 Market St, San Francisco, CA 94105", state: "CA", city: "San Francisco" },
    { address: "111 8th Ave, New York, NY 10011", state: "NY", city: "New York" },
    { address: "350 5th Ave, New York, NY 10118", state: "NY", city: "New York" },
    { address: "233 S Wacker Dr, Chicago, IL 60606", state: "IL", city: "Chicago" },
    { address: "401 N Michigan Ave, Chicago, IL 60611", state: "IL", city: "Chicago" },
    { address: "1100 Peachtree St NE, Atlanta, GA 30309", state: "GA", city: "Atlanta" },
    { address: "675 Ponce De Leon Ave NE, Atlanta, GA 30308", state: "GA", city: "Atlanta" },
    { address: "210 Peachtree St NW, Atlanta, GA 30303", state: "GA", city: "Atlanta" },
    { address: "200 Central Ave, St. Petersburg, FL 33701", state: "FL", city: "St. Petersburg" },
  ];
  
  // Sample Landlord POCs for realistic data
  const landlordPOCs = [
    { name: "John Smith", phone: "555-123-4567", email: "jsmith@example.com" },
    { name: "Sarah Johnson", phone: "555-234-5678", email: "sjohnson@example.com" },
    { name: "David Williams", phone: "555-345-6789", email: "dwilliams@example.com" },
    { name: "Emily Davis", phone: "555-456-7890", email: "edavis@example.com" },
    { name: "Michael Brown", phone: "555-567-8901", email: "mbrown@example.com" },
  ];
  
  // Sample site names for realistic data
  const siteNames = [
    "Riverwood Plaza",
    "Market Square Building",
    "Innovation Center",
    "The Cornerstone",
    "Westside Commons",
    "Gateway Plaza",
    "Parkside Square",
    "Highland Center",
    "Eastpoint Mall",
    "Tech Hub",
  ];
  
  // Sample zoning types for realistic data
  const zoningTypes = ["Commercial", "Mixed-Use", "Business", "Retail", "Office"];
  
  // Sample permitted uses for realistic data
  const permittedUses = ["School", "Educational Facility", "Day Care", "Community Center", "Learning Center"];
  
  // Create an array of 30 mock properties
  const properties: RealEstateProperty[] = [];
  
  for (let i = 0; i < 30; i++) {
    // Distribute properties across phases somewhat randomly but deterministically
    const phaseIndex = i % phases.length;
    const phase = phases[phaseIndex];
    
    // Select address deterministically
    const addressIndex = i % addresses.length;
    const address = addresses[addressIndex];
    
    // Select POC deterministically
    const pocIndex = i % landlordPOCs.length;
    const poc = landlordPOCs[pocIndex];
    
    // Select site name deterministically
    const siteNameIndex = i % siteNames.length;
    const siteName = siteNames[siteNameIndex];
    
    // Generate created_at date between 1-365 days ago
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - (i * 12 + 5));
    
    // Generate SF available (between 5000-20000)
    const sfAvailable = `${5000 + (i * 500)}`;
    
    // Determine boolean statuses based on phase
    const booleanStatuses: Record<string, BooleanStatus> = {
      "fire_sprinklers": phaseIndex > 3 ? "true" : phaseIndex > 1 ? "false" : "unknown",
      "fiber": phaseIndex > 4 ? "true" : phaseIndex > 2 ? "false" : "unknown",
      "ahj_zoning_confirmation": phaseIndex > 2 ? "true" : "unknown",
    };
    
    // Determine survey status based on phase
    const surveyStatus: SurveyStatus = 
      phaseIndex >= 2 ? "complete" : 
      phaseIndex == 1 ? "pending" : 
      "unknown";
    
    // Determine test fit status based on phase
    const testFitStatus: TestFitStatus = 
      phaseIndex >= 3 ? "complete" : 
      phaseIndex == 2 ? "pending" : 
      "unknown";
    
    // Determine lease status based on phase
    const leaseStatus: LeaseStatus = 
      phaseIndex >= 5 ? "signed" : 
      phaseIndex == 4 ? "sent" : 
      phaseIndex == 3 ? "pending" : 
      null;
    
    // Create the property object
    const property: RealEstateProperty = {
      id: i + 1,
      created_at: createdAt.toISOString(),
      site_name: siteName,
      address: address.address,
      market: `${address.city}, ${address.state}`,
      phase: phase,
      phase_group: phase.startsWith("0.") || phase.startsWith("1.") || phase.startsWith("2.") || phase.startsWith("3.") 
        ? "Diligence" 
        : phase.startsWith("4.") 
          ? "LOI" 
          : phase.startsWith("5.") 
            ? "Lease" 
            : "Build Out",
      sf_available: sfAvailable,
      zoning: zoningTypes[i % zoningTypes.length],
      permitted_use: permittedUses[i % permittedUses.length],
      parking: `${(i % 5) + 2} per 1000 SF`,
      ll_poc: poc.name,
      ll_phone: poc.phone,
      ll_email: poc.email,
      ahj_zoning_confirmation: booleanStatuses.ahj_zoning_confirmation,
      ahj_building_records: `Record #${10000 + i}`,
      survey_status: surveyStatus,
      test_fit_status: testFitStatus,
      loi_status: leaseStatus,
      lease_status: leaseStatus,
      status_notes: i % 3 === 0 ? `Status update as of ${new Date().toLocaleDateString()}: proceeding as planned` : null,
      fire_sprinklers: booleanStatuses.fire_sprinklers,
      fiber: booleanStatuses.fiber
    };
    
    properties.push(property);
  }
  
  // Filter by campusId if provided
  if (campusId) {
    // For mock purposes, just filter to a subset based on campus ID
    // This is just a simple demonstration - in a real implementation
    // we would match on actual campus IDs
    return properties.filter((_, index) => index % 3 === parseInt(campusId.slice(-1)) % 3);
  }
  
  return properties;
};

export const useRealEstatePipeline = (options: UseRealEstatePipelineOptions = {}) => {
  const { campusId } = options;

  return useQuery({
    queryKey: ["real-estate-pipeline", { campusId }],
    queryFn: async (): Promise<RealEstateProperty[]> => {
      // Simulate a network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Generate mock data based on campusId filter
      const mockData = generateMockProperties(campusId);
      
      // Log some information for debugging purposes
      logger.debug(`Generated ${mockData.length} mock real estate properties`);

      if (campusId) {
        logger.debug(`Filtered by campus ID: ${campusId}, found ${mockData.length} properties`);
      }

      return mockData;
    },
    // Enable automatic refetching
    refetchOnWindowFocus: true,
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
  });
};