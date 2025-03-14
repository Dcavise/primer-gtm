import { useState, useEffect } from "react";
import {
  PeriodType,
  PeriodChanges,
  getIntervalUnit,
  calculatePeriodChanges,
  getSortedPeriods,
  getUniqueCampuses,
} from "../utils/dateUtils";
// Import the new data access module
import { getWeeklyLeadCounts } from "../utils/salesforce-data-access";

export type FormattedLeadMetric = {
  period_type: string;
  period_date: string;
  formatted_date: string;
  campus_name: string;
  lead_count: number;
};

export type FormattedLeadsResponse = {
  raw: FormattedLeadMetric[];
  periods: string[];
  campuses: string[];
  totals: Record<string, number>;
  campusTotals: Record<string, number>;
  latestPeriod: string | null;
  latestTotal: number;
  changes: PeriodChanges;
  timeSeriesData: Array<{
    period: string;
    formatted_date: string;
    total: number;
    campuses: Record<string, number>;
  }>;
  getLeadCount: (periodDate: string, campusName: string) => number;
  periodType: string;
};

export type UseFormattedLeadsOptions = {
  period?: PeriodType;
  lookbackUnits?: number;
  campusId?: string | null;
  enabled?: boolean;
  refetchKey?: number;
};

/**
 * Hook to fetch formatted lead metrics data
 * TODO: Implement new data-fetching logic using salesforce-data-access.ts
 * instead of the current mock implementation
 */
export function useFormattedLeadsMetrics({
  period = "week",
  lookbackUnits = 12,
  campusId = null,
  enabled = true,
  refetchKey = 0,
}: UseFormattedLeadsOptions = {}) {
  const [data, setData] = useState<FormattedLeadsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Calculate date range based on period and lookback units
    const endDate = new Date();
    const startDate = new Date();
    
    if (period === "day") {
      startDate.setDate(startDate.getDate() - lookbackUnits);
    } else if (period === "week") {
      startDate.setDate(startDate.getDate() - (lookbackUnits * 7));
    } else {
      startDate.setMonth(startDate.getMonth() - lookbackUnits);
    }
    
    // Convert dates to ISO string format
    const startDateString = startDate.toISOString().split('T')[0];
    const endDateString = endDate.toISOString().split('T')[0];
    
    // Fetch data using the new data access function
    getWeeklyLeadCounts(startDateString, endDateString, campusId)
      .then(response => {
        if (response.success && response.data) {
          // Transform the data to match the expected format
          const transformedData = response.data.map(item => ({
            period_type: period,
            period_date: item.week,
            formatted_date: formatDateForDisplay(new Date(item.week)),
            campus_name: campusId || "All Campuses",
            lead_count: item.lead_count
          }));
          
          // Process the transformed data
          const processedData = processFormattedMetrics(transformedData, period);
          setData(processedData);
        } else {
          // Fallback to mock data if the API call fails
          const mockData = generateMockData(period, lookbackUnits, campusId);
          setData(mockData);
          console.warn("Fallback to mock data due to API error:", response.error);
        }
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching lead metrics:", error);
        // Fallback to mock data on error
        const mockData = generateMockData(period, lookbackUnits, campusId);
        setData(mockData);
        setLoading(false);
      });
  }, [period, lookbackUnits, campusId, enabled, refetchKey]);
  
  // Helper function to format dates consistently
  function formatDateForDisplay(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = String(date.getFullYear()).slice(2);
    return `${month}/${day}/${year}`;
  }

  return { data, loading, error };
}

// Helper function to create an empty response with the correct structure
function createEmptyResponse(period: PeriodType): FormattedLeadsResponse {
  return {
    periods: [],
    campuses: [],
    totals: {},
    campusTotals: {},
    raw: [],
    latestPeriod: null,
    latestTotal: 0,
    changes: { raw: {}, percentage: {} },
    timeSeriesData: [],
    getLeadCount: () => 0,
    periodType: period,
  };
}

// Generate mock data for UI development
function generateMockData(period: PeriodType, lookbackUnits: number, campusId: string | null): FormattedLeadsResponse {
  const mockCampuses = ["Atlanta", "Miami", "New York", "Birmingham", "Chicago"];
  const filteredCampuses = campusId ? [campusId] : mockCampuses;
  
  // Generate dates for the past periods based on period type
  const dates: string[] = [];
  const now = new Date();
  for (let i = 0; i < lookbackUnits; i++) {
    const date = new Date(now);
    if (period === "day") {
      date.setDate(date.getDate() - i);
    } else if (period === "week") {
      date.setDate(date.getDate() - (i * 7));
    } else {
      date.setMonth(date.getMonth() - i);
    }
    dates.push(date.toISOString().split('T')[0]);
  }
  
  // Generate mock metrics data
  const mockMetrics: FormattedLeadMetric[] = [];
  dates.forEach(date => {
    filteredCampuses.forEach(campus => {
      // Generate a random number between 5 and 25
      const count = Math.floor(Math.random() * 20) + 5;
      
      // Format date for display
      const dateObj = new Date(date);
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const year = String(dateObj.getFullYear()).slice(2);
      const formatted_date = `${month}/${day}/${year}`;
      
      mockMetrics.push({
        period_type: period,
        period_date: date,
        formatted_date,
        campus_name: campus,
        lead_count: count
      });
    });
  });
  
  // Process mock data
  return processFormattedMetrics(mockMetrics, period);
}

/**
 * Processes the raw metrics data into the expected format
 * This function is preserved as it handles data processing logic
 * independent of the data source
 */
const processFormattedMetrics = (
  rawData: FormattedLeadMetric[],
  period: PeriodType
): FormattedLeadsResponse => {
  // If no data, return empty response
  if (!rawData || rawData.length === 0) {
    console.warn("No data to process in processFormattedMetrics");
    return createEmptyResponse(period);
  }

  try {
    // Get sorted periods from the data
    const periods = getSortedPeriods(rawData);
    
    // Ensure we have at least one period
    if (periods.length === 0) {
      console.warn("No periods found in data");
      return createEmptyResponse(period);
    }

    // Get unique campuses from the data
    const campuses = getUniqueCampuses(rawData);

    // Calculate totals for each period
    const totals: Record<string, number> = {};
    const campusTotals: Record<string, number> = {};

    // Prepare time series data
    const timeSeriesData: Array<{
      period: string;
      formatted_date: string;
      total: number;
      campuses: Record<string, number>;
    }> = [];

    // Group data by period
    const periodGroups = periods.reduce((groups: Record<string, FormattedLeadMetric[]>, period) => {
      groups[period] = rawData.filter((item) => item.period_date === period);
      return groups;
    }, {});

    // Process each period group
    periods.forEach((period) => {
      const periodData = periodGroups[period] || [];
      const campusValues: Record<string, number> = {};
      let periodTotal = 0;

      // Sum values for each campus in this period
      periodData.forEach((item) => {
        const campus = item.campus_name;
        const value = item.lead_count || 0;
        campusValues[campus] = (campusValues[campus] || 0) + value;
        periodTotal += value;

        // Add to campus totals
        campusTotals[campus] = (campusTotals[campus] || 0) + value;
      });

      // Set the total for this period
      totals[period] = periodTotal;

      // Format the date for display - consistent with the UI needs
      const periodDate = new Date(period);
      const isToday = new Date().toDateString() === periodDate.toDateString();
      let formatted_date = "";
      
      // Get consistent display format
      if (isToday && period === "day") {
        formatted_date = "Today";
      } else {
        // Format as MM/DD/YY for consistency
        const month = String(periodDate.getMonth() + 1).padStart(2, '0');
        const day = String(periodDate.getDate()).padStart(2, '0');
        const year = String(periodDate.getFullYear()).slice(2);
        formatted_date = `${month}/${day}/${year}`;
      }

      // Add to time series data
      timeSeriesData.push({
        period,
        formatted_date,
        total: periodTotal,
        campuses: campusValues,
      });
    });

    // Calculate period changes
    const changes = calculatePeriodChanges(periods, totals);

    // Create a function to get lead counts by period and campus
    const getLeadCount = (periodDate: string, campusName: string): number => {
      const periodData = timeSeriesData.find((item) => item.period === periodDate);
      if (!periodData) return 0;

      // If "All Campuses" is requested, return the total
      if (campusName === "All Campuses") {
        return periodData.total;
      }

      // Otherwise, return the campus-specific value
      return periodData.campuses[campusName] || 0;
    };

    return {
      raw: rawData,
      periods,
      campuses,
      totals,
      campusTotals,
      latestPeriod: periods[0] || null,
      latestTotal: totals[periods[0]] || 0,
      changes,
      timeSeriesData,
      getLeadCount,
      periodType: period,
    };
  } catch (error) {
    console.error("Error processing formatted metrics:", error);
    return createEmptyResponse(period);
  }
};
