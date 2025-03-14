/**
 * Salesforce Data Access Module
 *
 * This module provides data access to Salesforce data
 * Provides a clean abstraction over the data source
 */

import { logger } from "@/utils/logger";

/**
 * Type guard to safely check if data is an array with at least one element
 */
function isArrayWithLength(data: unknown): data is any[] {
  return Array.isArray(data) && data.length > 0;
}

/**
 * Type guard to check if data is a non-null object
 */
function isNonNullObject(data: unknown): data is Record<string, unknown> {
  return typeof data === 'object' && data !== null;
}

/**
 * Query a Salesforce table with mock data
 * @param tableName Name of the Salesforce table (e.g., 'lead', 'opportunity')
 * @param limit Maximum number of records to return
 * @returns Mock query result
 */
export const querySalesforceTable = async (tableName: string, limit = 100) => {
  logger.info(`Mock query for Salesforce table: ${tableName} with limit ${limit}`);

  // Generate mock data based on table name
  const mockData = generateMockDataForTable(tableName, limit);
  return { success: true, data: mockData, error: null };
};

/**
 * Generate mock data for different Salesforce tables
 */
function generateMockDataForTable(tableName: string, limit: number): any[] {
  const mockData: any[] = [];
  
  // Generate different mock data based on table type
  switch (tableName.toLowerCase()) {
    case 'lead':
      for (let i = 0; i < limit; i++) {
        mockData.push({
          id: `lead-${i}`,
          first_name: `First${i}`,
          last_name: `Last${i}`,
          email: `lead${i}@example.com`,
          status: i % 3 === 0 ? 'Qualified' : i % 3 === 1 ? 'Open' : 'Converted',
          created_date: new Date(Date.now() - (i * 86400000)).toISOString() // Different dates
        });
      }
      break;
      
    case 'opportunity':
      for (let i = 0; i < limit; i++) {
        mockData.push({
          id: `opp-${i}`,
          name: `Opportunity ${i}`,
          stage_name: i % 4 === 0 ? 'Closed Won' : i % 4 === 1 ? 'Family Interview' : i % 4 === 2 ? 'Education Review' : 'Admission Offered',
          amount: Math.floor(Math.random() * 20000) + 5000,
          close_date: new Date(Date.now() + ((i % 30) * 86400000)).toISOString(),
          school_year_c: '25/26',
          is_closed: i % 4 === 0,
          is_won: i % 4 === 0
        });
      }
      break;
      
    case 'contact':
      for (let i = 0; i < limit; i++) {
        mockData.push({
          id: `contact-${i}`,
          first_name: `Contact${i}`,
          last_name: `Family${i % 10}`, // Group contacts into families
          email: `contact${i}@example.com`,
          phone: `555-${String(1000 + i).substring(1)}`
        });
      }
      break;
      
    default:
      // Generic data for any other table
      for (let i = 0; i < limit; i++) {
        mockData.push({
          id: `${tableName}-${i}`,
          name: `${tableName} Record ${i}`,
          created_date: new Date(Date.now() - (i * 86400000)).toISOString()
        });
      }
  }
  
  return mockData;
}

/**
 * Get weekly lead counts with mock data
 * @param startDate Start date in ISO format
 * @param endDate End date in ISO format
 * @param campusId Optional campus ID to filter by
 * @returns Mock weekly lead count data
 */
export const getWeeklyLeadCounts = async (
  startDate: string,
  endDate: string,
  campusId: string | null = null
) => {
  logger.info(
    `Mock getting weekly lead counts from ${startDate} to ${endDate}, campus: ${campusId || "all"}`
  );

  // Parse dates to generate appropriate number of weeks
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.ceil(diffDays / 7);
  
  // Generate mock weekly data
  const mockData = [];
  for (let i = 0; i < diffWeeks; i++) {
    const weekDate = new Date(start);
    weekDate.setDate(start.getDate() + (i * 7));
    
    // Higher lead counts for first few weeks, then declining
    let count = Math.max(5, Math.floor(25 - (i * 0.8) + (Math.random() * 10) - 5));
    
    // If campus is specified, reduce the count since it's filtered
    if (campusId) {
      count = Math.floor(count * 0.4);
    }
    
    mockData.push({
      week: weekDate.toISOString().split('T')[0],
      lead_count: count
    });
  }

  return { success: true, data: mockData, error: null };
};

/**
 * Get lead summary statistics by campus with mock data
 * @returns Mock lead count by campus
 */
export const getLeadSummaryByCampus = async () => {
  logger.info("Getting mock lead summary by campus");

  // Generate mock campus data
  const mockData = [
    { campus_name: "Atlanta", campus_state: "GA", lead_count: 87 },
    { campus_name: "Miami", campus_state: "FL", lead_count: 76 },
    { campus_name: "New York", campus_state: "NY", lead_count: 95 },
    { campus_name: "Birmingham", campus_state: "AL", lead_count: 52 },
    { campus_name: "Chicago", campus_state: "IL", lead_count: 43 }
  ];

  return { success: true, data: mockData, error: null };
};

/**
 * Test connection to data source - always returns success in mock version
 * @returns Mock connection test results
 */
export const testDataSourceConnection = async () => {
  logger.info("Testing mock connection to data source");

  return {
    success: true,
    dataSourceAccessible: true,
    leadTableAccessible: true,
    rowCount: 1000,
  };
};

/**
 * Fetch converted leads data with mock data
 * @param startDate Start date in ISO format
 * @param endDate End date in ISO format
 * @param campus Optional campus name to filter by
 * @returns Mock converted leads metric data
 */
export const fetchConvertedLeadsData = async (
  startDate: string,
  endDate: string,
  campus: string | null = null
) => {
  logger.info(
    `Mock fetching converted leads data from ${startDate} to ${endDate}, campus: ${campus || "all"}`
  );

  // Parse dates to generate appropriate number of data points
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.ceil(diffDays / 7);
  
  // Generate mock weekly data
  const mockData = [];
  
  // Get campus list or use the provided campus
  const campuses = campus ? [campus] : ["Atlanta", "Miami", "New York", "Birmingham", "Chicago"];
  
  for (let i = 0; i < diffWeeks; i++) {
    const weekDate = new Date(start);
    weekDate.setDate(start.getDate() + (i * 7));
    const periodDate = weekDate.toISOString().split('T')[0];
    
    // Format date for display (MM/DD/YY)
    const month = String(weekDate.getMonth() + 1).padStart(2, '0');
    const day = String(weekDate.getDate()).padStart(2, '0');
    const year = String(weekDate.getFullYear()).slice(2);
    const formattedDate = `${month}/${day}/${year}`;
    
    // Generate data for each campus or just the specified one
    campuses.forEach(campusName => {
      // Base conversion rate declines slightly over time
      const baseRate = Math.max(1, Math.floor(10 - (i * 0.3)));
      
      // Add some campus-specific variation
      let multiplier = 1.0;
      switch(campusName) {
        case "Atlanta": multiplier = 1.2; break;
        case "Miami": multiplier = 1.1; break;
        case "New York": multiplier = 1.3; break;
        case "Birmingham": multiplier = 0.8; break;
        case "Chicago": multiplier = 0.9; break;
      }
      
      const convertedCount = Math.max(1, Math.floor(baseRate * multiplier + (Math.random() * 3) - 1));
      
      mockData.push({
        period_type: "week",
        period_date: periodDate,
        formatted_date: formattedDate,
        campus_name: campusName,
        converted_count: convertedCount
      });
    });
  }

  return { success: true, data: mockData, error: null };
};

/**
 * Fetch closed won opportunities data with mock data
 * @param startDate Start date in ISO format
 * @param endDate End date in ISO format
 * @param campus Optional campus name to filter by
 * @returns Mock closed won opportunities metric data
 */
export const fetchClosedWonData = async (
  startDate: string,
  endDate: string,
  campus: string | null = null
) => {
  logger.info(
    `Mock fetching closed won data from ${startDate} to ${endDate}, campus: ${campus || "all"}`
  );

  // Parse dates to generate appropriate number of data points
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.ceil(diffDays / 7);
  
  // Generate mock weekly data
  const mockData = [];
  
  // Get campus list or use the provided campus
  const campuses = campus ? [campus] : ["Atlanta", "Miami", "New York", "Birmingham", "Chicago"];
  
  for (let i = 0; i < diffWeeks; i++) {
    const weekDate = new Date(start);
    weekDate.setDate(start.getDate() + (i * 7));
    const periodDate = weekDate.toISOString().split('T')[0];
    
    // Format date for display (MM/DD/YY)
    const month = String(weekDate.getMonth() + 1).padStart(2, '0');
    const day = String(weekDate.getDate()).padStart(2, '0');
    const year = String(weekDate.getFullYear()).slice(2);
    const formattedDate = `${month}/${day}/${year}`;
    
    // Generate data for each campus or just the specified one
    campuses.forEach(campusName => {
      // Lower numbers for closed won compared to leads or conversions
      const baseCount = Math.max(1, Math.floor(5 - (i * 0.15)));
      
      // Add some campus-specific variation
      let multiplier = 1.0;
      switch(campusName) {
        case "Atlanta": multiplier = 1.2; break;
        case "Miami": multiplier = 1.1; break;
        case "New York": multiplier = 1.3; break;
        case "Birmingham": multiplier = 0.7; break;
        case "Chicago": multiplier = 0.8; break;
      }
      
      // Some weeks might have zero closed won
      const closedWonCount = Math.max(0, Math.floor(baseCount * multiplier + (Math.random() * 2) - 1));
      
      mockData.push({
        period_type: "week",
        period_date: periodDate,
        formatted_date: formattedDate,
        campus_name: campusName,
        closed_won_count: closedWonCount
      });
    });
  }

  return { success: true, data: mockData, error: null };
};

/**
 * Fetch ARR data (Annual Recurring Revenue)
 * @param startDate Start date in ISO format
 * @param endDate End date in ISO format
 * @param campus Optional campus name to filter by
 * @returns Mock ARR metric data
 */
export const fetchARRData = async (
  startDate: string,
  endDate: string,
  campus: string | null = null
) => {
  logger.info(
    `Mock fetching ARR data from ${startDate} to ${endDate}, campus: ${campus || "all"}`
  );

  // Parse dates to generate appropriate number of data points
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.ceil(diffDays / 7);
  
  // Generate mock weekly data
  const mockData = [];
  
  // Get campus list or use the provided campus
  const campuses = campus ? [campus] : ["Atlanta", "Miami", "New York", "Birmingham", "Chicago"];
  
  for (let i = 0; i < diffWeeks; i++) {
    const weekDate = new Date(start);
    weekDate.setDate(start.getDate() + (i * 7));
    const periodDate = weekDate.toISOString().split('T')[0];
    
    // Format date for display (MM/DD/YY)
    const month = String(weekDate.getMonth() + 1).padStart(2, '0');
    const day = String(weekDate.getDate()).padStart(2, '0');
    const year = String(weekDate.getFullYear()).slice(2);
    const formattedDate = `${month}/${day}/${year}`;
    
    // Generate data for each campus or just the specified one
    campuses.forEach(campusName => {
      // Base ARR varies by campus and declines slightly week by week
      let baseARR;
      switch(campusName) {
        case "Atlanta": baseARR = 25000; break;
        case "Miami": baseARR = 18000; break;
        case "New York": baseARR = 30000; break;
        case "Birmingham": baseARR = 15000; break;
        case "Chicago": baseARR = 20000; break;
        default: baseARR = 22000;
      }
      
      // Decreasing trend with some randomness
      const arrAmount = Math.max(5000, Math.floor(baseARR - (i * baseARR * 0.05) + (Math.random() * 8000) - 4000));
      
      mockData.push({
        period_type: "week",
        period_date: periodDate,
        formatted_date: formattedDate,
        campus_name: campusName,
        arr_amount: arrAmount
      });
    });
  }

  return { success: true, data: mockData, error: null };
};

/**
 * Fetch cumulative ARR data for the 25/26 school year with mock data
 * @param startDate Start date in ISO format
 * @param endDate End date in ISO format
 * @param campus Optional campus name to filter by
 * @returns Mock cumulative ARR metric data
 */
export const fetchCumulativeARRData = async (
  startDate: string,
  endDate: string,
  campus: string | null = null
) => {
  logger.info(
    `Mock fetching cumulative ARR data from ${startDate} to ${endDate}, campus: ${campus || "all"}`
  );

  // Parse dates to generate appropriate number of data points
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.ceil(diffDays / 7);
  
  // Generate mock weekly data
  const mockData = [];
  
  // Get campus list or use the provided campus
  const campuses = campus ? [campus] : ["Atlanta", "Miami", "New York", "Birmingham", "Chicago", "All Campuses"];
  
  // Initial ARR values for each campus (increasing each week)
  const campusBaseARR: Record<string, number> = {
    "Atlanta": 150000,
    "Miami": 120000,
    "New York": 180000,
    "Birmingham": 75000,
    "Chicago": 85000,
    "All Campuses": 610000, // Sum of all individual campus values
  };
  
  for (let i = 0; i < diffWeeks; i++) {
    const weekDate = new Date(start);
    weekDate.setDate(start.getDate() + (i * 7));
    const periodDate = weekDate.toISOString().split('T')[0];
    
    // Format date for display (MM/DD/YY)
    const month = String(weekDate.getMonth() + 1).padStart(2, '0');
    const day = String(weekDate.getDate()).padStart(2, '0');
    const year = String(weekDate.getFullYear()).slice(2);
    const formattedDate = `${month}/${day}/${year}`;
    
    // Generate data for each campus
    campuses.forEach(campusName => {
      // Increase the ARR for this campus by a small amount each week (cumulative)
      if (i > 0) {
        const weeklyGrowth = Math.floor(Math.random() * 15000) + 5000;
        campusBaseARR[campusName] += weeklyGrowth;
        
        // If we're updating individual campus values, also update the "All Campuses" total
        // but only do this for the first campus to avoid double counting
        if (campusName === "Atlanta" && campuses.includes("All Campuses")) {
          // Calculate total growth across all individual campuses
          let totalGrowth = 0;
          ["Atlanta", "Miami", "New York", "Birmingham", "Chicago"].forEach(c => {
            if (c !== "All Campuses") {
              totalGrowth += Math.floor(Math.random() * 15000) + 5000;
            }
          });
          campusBaseARR["All Campuses"] += totalGrowth;
        }
      }
      
      // Add the data point for this campus and week
      mockData.push({
        period_type: "week",
        period_date: periodDate,
        formatted_date: formattedDate,
        campus_name: campusName,
        cumulative_arr: campusBaseARR[campusName]
      });
    });
  }

  return { success: true, data: mockData, error: null };
};

/**
 * Get total enrolled students count 
 * @param campusId Optional campus ID to filter by
 * @returns Mock enrolled student count
 */
export const getTotalEnrolled = async (campusId: string | null = null) => {
  logger.info(`Getting mock total enrolled for campus: ${campusId || "all"}`);
  
  // Return fixed values based on campus for deterministic results
  if (campusId) {
    switch(campusId) {
      case "Atlanta": return { success: true, data: { count: 125 }, error: null };
      case "Miami": return { success: true, data: { count: 98 }, error: null };
      case "New York": return { success: true, data: { count: 143 }, error: null };
      case "Birmingham": return { success: true, data: { count: 87 }, error: null };
      case "Chicago": return { success: true, data: { count: 112 }, error: null };
      default: return { success: true, data: { count: 100 }, error: null };
    }
  }
  
  // Return total across all campuses
  return { success: true, data: { count: 565 }, error: null };
};

/**
 * Get enrollment by grade band
 * @param campusId Optional campus ID to filter by 
 * @returns Mock grade band enrollment data
 */
export const getGradeBandEnrollment = async (campusId: string | null = null) => {
  logger.info(`Getting mock grade band enrollment for campus: ${campusId || "all"}`);
  
  // Default data if no campus specified or unknown campus
  let mockData = [
    { grade_band: "K-2", enrollment_count: 15 },
    { grade_band: "3-5", enrollment_count: 18 },
    { grade_band: "6-8", enrollment_count: 12 }
  ];
  
  // Return campus-specific data if available
  if (campusId) {
    switch(campusId) {
      case "Atlanta":
        mockData = [
          { grade_band: "K-2", enrollment_count: 22 },
          { grade_band: "3-5", enrollment_count: 19 },
          { grade_band: "6-8", enrollment_count: 16 }
        ];
        break;
      case "Miami":
        mockData = [
          { grade_band: "K-2", enrollment_count: 18 },
          { grade_band: "3-5", enrollment_count: 14 },
          { grade_band: "6-8", enrollment_count: 10 }
        ];
        break;
      case "New York":
        mockData = [
          { grade_band: "K-2", enrollment_count: 24 },
          { grade_band: "3-5", enrollment_count: 22 },
          { grade_band: "6-8", enrollment_count: 20 }
        ];
        break;
      case "Birmingham":
        mockData = [
          { grade_band: "K-2", enrollment_count: 14 },
          { grade_band: "3-5", enrollment_count: 12 },
          { grade_band: "6-8", enrollment_count: 8 }
        ];
        break;
      case "Chicago":
        mockData = [
          { grade_band: "K-2", enrollment_count: 20 },
          { grade_band: "3-5", enrollment_count: 17 },
          { grade_band: "6-8", enrollment_count: 15 }
        ];
        break;
    }
  }
  
  return { success: true, data: mockData, error: null };
};