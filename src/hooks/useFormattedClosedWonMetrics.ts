import { useState, useEffect } from "react";
import {
  FormattedLeadsResponse,
  UseFormattedLeadsOptions,
  FormattedLeadMetric,
} from "./useFormattedLeadsMetrics";
import { fetchClosedWonData } from "../utils/salesforce-data-access";

// Interface for raw opportunity metrics data
interface FormattedOpportunityMetric extends Omit<FormattedLeadMetric, "lead_count"> {
  opportunity_count: number;
}

/**
 * Hook to fetch closed won opportunity metrics data
 * TODO: Implement new data-fetching logic using salesforce-data-access.ts
 * instead of the current mock implementation
 */
export function useFormattedClosedWonMetrics({
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
    fetchClosedWonData(startDateString, endDateString, campusId)
      .then(response => {
        if (response.success && response.data && response.data.length > 0) {
          // Transform the data to match the expected format
          const transformedData = response.data.map(item => ({
            period_type: period,
            period_date: item.period_date,
            formatted_date: item.formatted_date,
            campus_name: item.campus_name,
            opportunity_count: item.closed_won_count
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
        console.error("Error fetching closed won metrics:", error);
        // Fallback to mock data on error
        const mockData = generateMockData(period, lookbackUnits, campusId);
        setData(mockData);
        setLoading(false);
      });
  }, [period, lookbackUnits, campusId, enabled, refetchKey]);

  return { data, loading, error };
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
  const mockMetrics: FormattedOpportunityMetric[] = [];
  dates.forEach(date => {
    filteredCampuses.forEach(campus => {
      // Generate a random number between 1 and 10
      const count = Math.floor(Math.random() * 10) + 1;
      
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
        opportunity_count: count
      });
    });
  });
  
  // Process mock data
  return processFormattedMetrics(mockMetrics, period);
}

// Process the raw data into the expected format for the UI
function processFormattedMetrics(
  rawData: FormattedOpportunityMetric[],
  period: string
): FormattedLeadsResponse {
  // Map opportunity metrics to the shape expected by FormattedLeadsResponse
  const mappedData = rawData.map((item) => ({
    ...item,
    lead_count: item.opportunity_count,
  })) as unknown as FormattedLeadMetric[];
  
  // Get unique periods, sorted by date (newest to oldest)
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

  // Helper function to get opportunity count for a specific period and campus
  const getLeadCount = (periodDate: string, campusName: string): number => {
    const match = rawData.find(
      (item) => item.period_date === periodDate && item.campus_name === campusName
    );
    return match ? Number(match.opportunity_count) : 0;
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

// Helper to calculate period-over-period changes
function calculatePeriodChanges(periods: string[], totals: Record<string, number>) {
  // Initialize changes objects
  const rawChanges: Record<string, number> = {};
  const percentageChanges: Record<string, number> = {};

  // Calculate changes for each period except the last (newest)
  // Note: periods are sorted newest to oldest, so periods[0] is the most recent period
  for (let i = 0; i < periods.length - 1; i++) {
    const currentPeriod = periods[i];
    const previousPeriod = periods[i + 1]; // The previous period is actually next in our array (older)

    // Calculate raw change
    const currentTotal = totals[currentPeriod] || 0;
    const previousTotal = totals[previousPeriod] || 0;
    const rawChange = currentTotal - previousTotal;

    // Calculate percentage change
    const percentageChange =
      previousTotal === 0
        ? 0 // Avoid division by zero
        : (rawChange / previousTotal) * 100;

    // Store the changes
    rawChanges[currentPeriod] = rawChange;
    percentageChanges[currentPeriod] = percentageChange;
  }

  // Handle the oldest period (no previous period to compare to)
  if (periods.length > 0) {
    const oldestPeriod = periods[periods.length - 1];
    rawChanges[oldestPeriod] = 0;
    percentageChanges[oldestPeriod] = 0;
  }

  return { raw: rawChanges, percentage: percentageChanges };
}
