import { useState, useEffect } from "react";
import {
  FormattedLeadsResponse,
  UseFormattedLeadsOptions,
  FormattedLeadMetric,
} from "./useFormattedLeadsMetrics";
import { calculatePeriodChanges } from "../utils/dateUtils";
import { fetchARRData } from "../utils/salesforce-data-access";

// Interface for raw ARR metrics data
interface FormattedArrMetric extends Omit<FormattedLeadMetric, "lead_count"> {
  total_contribution: number;
}

/**
 * Hook to fetch ARR (Annual Recurring Revenue) metrics data
 * TODO: Implement new data-fetching logic using salesforce-data-access.ts
 * instead of the current mock implementation
 */
export function useFormattedArrMetrics({
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
    fetchARRData(startDateString, endDateString, campusId)
      .then(response => {
        if (response.success && response.data && response.data.length > 0) {
          // Transform the data to match the expected format
          const transformedData = response.data.map(item => ({
            period_type: period,
            period_date: item.period_date,
            formatted_date: item.formatted_date,
            campus_name: item.campus_name,
            total_contribution: item.arr_amount
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
        console.error("Error fetching ARR metrics:", error);
        // Fallback to mock data on error
        const mockData = generateMockData(period, lookbackUnits, campusId);
        setData(mockData);
        setLoading(false);
      });
  }, [period, lookbackUnits, campusId, enabled, refetchKey]);

  return { data, loading, error };
}

// Generate mock data for UI development
function generateMockData(period: string, lookbackUnits: number, campusId: string | null): FormattedLeadsResponse {
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
  const mockMetrics: FormattedArrMetric[] = [];
  dates.forEach(date => {
    filteredCampuses.forEach(campus => {
      // Generate a random dollar amount between $5000 and $20000
      const contribution = Math.floor(Math.random() * 15000) + 5000;
      
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
        total_contribution: contribution
      });
    });
  });
  
  // Process mock data
  return processFormattedMetrics(mockMetrics, period);
}

// Helper function to create an empty response with the correct structure
function createEmptyResponse(period: string): FormattedLeadsResponse {
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

// Process the raw data into the expected format for the UI
function processFormattedMetrics(
  rawData: FormattedArrMetric[],
  period: string
): FormattedLeadsResponse {
  // Map ARR metrics to the shape expected by FormattedLeadsResponse
  // We'll treat the ARR amount as if it were a "lead_count" for compatibility
  const mappedData = rawData.map((item) => ({
    ...item,
    lead_count: item.total_contribution,
  })) as unknown as FormattedLeadMetric[];

  // Get unique periods, sorted by date (newest to oldest)
  // This matches the DESC order from our SQL query
  const periods = [...new Set(mappedData.map((item) => item.period_date))].sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  // Get unique campuses
  const campuses = [...new Set(mappedData.map((item) => item.campus_name))].filter(
    (name) => name !== "No Campus Match"
  );

  // Calculate period totals
  const totals = periods.reduce(
    (acc, period) => {
      const periodData = mappedData.filter((item) => item.period_date === period);
      acc[period] = periodData.reduce((sum, item) => sum + Number(item.lead_count), 0);
      return acc;
    },
    {} as Record<string, number>
  );

  // Calculate campus totals across all periods
  const campusTotals = campuses.reduce(
    (acc, campus) => {
      const campusData = mappedData.filter((item) => item.campus_name === campus);
      acc[campus] = campusData.reduce((sum, item) => sum + Number(item.lead_count), 0);
      return acc;
    },
    {} as Record<string, number>
  );

  // Calculate period-over-period changes
  const changes = calculatePeriodChanges(periods, totals);

  // Format data for time series charts - use the formatted_date for display
  const timeSeriesData = periods.map((period) => {
    const periodItems = mappedData.filter((item) => item.period_date === period);
    const displayDate = periodItems.length > 0 ? periodItems[0].formatted_date : period;

    return {
      period,
      formatted_date: displayDate, // Use the pre-formatted date
      total: totals[period],
      campuses: campuses.reduce(
        (acc, campus) => {
          const match = periodItems.find((item) => item.campus_name === campus);
          acc[campus] = match ? Number(match.lead_count) : 0;
          return acc;
        },
        {} as Record<string, number>
      ),
    };
  });

  // Helper function to get ARR amount for a specific period and campus
  const getLeadCount = (periodDate: string, campusName: string): number => {
    const match = rawData.find(
      (item) => item.period_date === periodDate && item.campus_name === campusName
    );
    return match ? Number(match.total_contribution) : 0;
  };

  // Get the latest period and its total
  const latestPeriod = periods.length > 0 ? periods[0] : null;
  const latestTotal = latestPeriod ? totals[latestPeriod] : 0;

  return {
    raw: mappedData,
    periods,
    campuses,
    totals,
    campusTotals,
    latestPeriod,
    latestTotal,
    changes,
    timeSeriesData,
    getLeadCount,
    periodType: period,
  };
}
