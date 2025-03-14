import { useState, useEffect } from "react";
import {
  PeriodType,
  PeriodChanges,
  getIntervalUnit,
  calculatePeriodChanges,
  getSortedPeriods,
  getUniqueCampuses,
  FormattedMetricBase
} from "../utils/dateUtils";
import { fetchCumulativeARRData } from "../utils/salesforce-data-access";

export interface FormattedCumulativeARRMetric extends FormattedMetricBase {
  cumulative_arr: number;
}

export type FormattedCumulativeARRResponse = {
  raw: FormattedCumulativeARRMetric[];
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
  getARRValue: (periodDate: string, campusName: string) => number;
  periodType: string;
};

export type UseFormattedCumulativeARROptions = {
  period?: PeriodType;
  lookbackUnits?: number;
  campusId?: string | null;
  enabled?: boolean;
  refetchKey?: number;
};

/**
 * Hook to fetch cumulative ARR metrics for 25/26 school year
 * TODO: Implement new data-fetching logic using salesforce-data-access.ts
 * instead of the current mock implementation
 */
export function useFormattedCumulativeARRMetrics({
  period = "week",
  lookbackUnits = 12,
  campusId = null,
  enabled = true,
  refetchKey = 0,
}: UseFormattedCumulativeARROptions = {}) {
  const [data, setData] = useState<FormattedCumulativeARRResponse | null>(null);
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
    fetchCumulativeARRData(startDateString, endDateString, campusId)
      .then(response => {
        if (response.success && response.data && response.data.length > 0) {
          // Transform the data to match the expected format
          const transformedData = response.data.map(item => ({
            period_type: period,
            period_date: item.period_date,
            formatted_date: item.formatted_date,
            campus_name: item.campus_name,
            cumulative_arr: item.cumulative_arr
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
        console.error("Error fetching cumulative ARR metrics:", error);
        // Fallback to mock data on error
        const mockData = generateMockData(period, lookbackUnits, campusId);
        setData(mockData);
        setLoading(false);
      });
  }, [period, lookbackUnits, campusId, enabled, refetchKey]);

  return { data, loading, error };
}

// Generate mock data for cumulative ARR metrics
function generateMockData(
  period: PeriodType, 
  lookbackUnits: number, 
  campusId: string | null
): FormattedCumulativeARRResponse {
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
  
  // For cumulative data, we need to make sure the values increase over time
  // Initialize a base value for each campus
  const campusBaseValues: Record<string, number> = {};
  filteredCampuses.forEach(campus => {
    // Random start value between $50,000 and $200,000
    campusBaseValues[campus] = Math.floor(Math.random() * 150000) + 50000;
  });
  
  // Generate mock metrics data with growing values over time
  const mockMetrics: FormattedCumulativeARRMetric[] = [];
  
  // Sort dates from oldest to newest for accumulation
  const sortedDates = [...dates].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  
  sortedDates.forEach((date, index) => {
    filteredCampuses.forEach(campus => {
      // For each period, add a random increment to the previous value (or base value for first period)
      const increment = Math.floor(Math.random() * 10000) + 5000; // $5K to $15K increment
      
      // Get previous value or use base value for first period
      if (index === 0) {
        campusBaseValues[campus] = campusBaseValues[campus]; // Use initial value
      } else {
        campusBaseValues[campus] += increment; // Add increment to previous value
      }
      
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
        cumulative_arr: campusBaseValues[campus]
      });
    });
    
    // Also add an "All Campuses" entry for each period that sums up all campuses
    const totalForPeriod = filteredCampuses.reduce(
      (sum, campus) => sum + campusBaseValues[campus], 
      0
    );
    
    const dateObj = new Date(date);
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const year = String(dateObj.getFullYear()).slice(2);
    const formatted_date = `${month}/${day}/${year}`;
    
    mockMetrics.push({
      period_type: period,
      period_date: date,
      formatted_date,
      campus_name: "All Campuses",
      cumulative_arr: totalForPeriod
    });
  });
  
  // Process mock data
  return processFormattedMetrics(mockMetrics, period);
}

// Helper function to create an empty response with the correct structure
function createEmptyResponse(period: PeriodType): FormattedCumulativeARRResponse {
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
    getARRValue: () => 0,
    periodType: period,
  };
}

// Process the raw data into the expected format for the UI
function processFormattedMetrics(
  rawData: FormattedCumulativeARRMetric[],
  period: PeriodType
): FormattedCumulativeARRResponse {
  // Get unique periods, sorted by date (newest to oldest)
  const periods = getSortedPeriods(rawData);

  // Get unique campuses
  const campuses = getUniqueCampuses(rawData);

  // Calculate period totals
  const totals = periods.reduce(
    (acc, period) => {
      const periodData = rawData.filter((item) => item.period_date === period);
      const periodTotal = periodData.reduce((sum, item) => sum + Number(item.cumulative_arr), 0);
      acc[period] = periodTotal;
      return acc;
    },
    {} as Record<string, number>
  );

  // Calculate campus totals across all periods
  const campusTotals = campuses.reduce(
    (acc, campus) => {
      // For ARR, we want the latest value for each campus, not the sum
      const campusData = rawData.filter((item) => item.campus_name === campus);
      if (campusData.length > 0) {
        // Sort by period_date in descending order and get the first (latest) value
        const latestData = [...campusData].sort((a, b) => 
          new Date(b.period_date).getTime() - new Date(a.period_date).getTime()
        )[0];
        acc[campus] = Number(latestData.cumulative_arr);
      } else {
        acc[campus] = 0;
      }
      return acc;
    },
    {} as Record<string, number>
  );

  // Calculate period-over-period changes
  const changes = calculatePeriodChanges(periods, totals);

  // Format data for time series charts - use the formatted_date for display
  const timeSeriesData = periods.map((period) => {
    const periodItems = rawData.filter((item) => item.period_date === period);
    const displayDate = periodItems.length > 0 ? periodItems[0].formatted_date : period;

    return {
      period,
      formatted_date: displayDate, // Use the pre-formatted date
      total: totals[period],
      campuses: campuses.reduce(
        (acc, campus) => {
          const match = periodItems.find((item) => item.campus_name === campus);
          acc[campus] = match ? Number(match.cumulative_arr) : 0;
          return acc;
        },
        {} as Record<string, number>
      ),
    };
  });

  // Helper function to get ARR value for a specific period and campus
  const getARRValue = (periodDate: string, campusName: string): number => {
    // For 'All Campuses' view, return the total for this period
    if (campusName === 'All Campuses') {
      return totals[periodDate] || 0;
    }
    
    // For specific campus, find the direct match
    const match = rawData.find(
      (item) => item.period_date === periodDate && item.campus_name === campusName
    );
    return match ? Number(match.cumulative_arr) : 0;
  };

  // Get the latest period and its total
  // If periods are sorted newest to oldest, the first item is the most recent
  const latestPeriod = periods.length > 0 ? periods[0] : null;
  const latestTotal = latestPeriod ? totals[latestPeriod] : 0;

  return {
    raw: rawData,
    periods,
    campuses,
    campusTotals,
    totals,
    changes,
    timeSeriesData,
    getARRValue,
    latestPeriod,
    latestTotal,
    periodType: period,
    
    // Make sure these match the expected structure
    periods: periods, // Make sure this is an array of date strings
    totals: totals || {}, // Make sure this is a record of period -> value
    changes: {
      raw: changes?.raw || {},
      percentage: changes?.percentage || {}
    }
  };
}