import { useState, useEffect } from "react";
import {
  PeriodType,
  PeriodChanges,
  getViewSuffix,
  getIntervalUnit,
  getPeriodDateFilter,
  calculatePeriodChanges,
  getSortedPeriods,
  getUniqueCampuses,
  FormattedMetricBase
} from "../utils/dateUtils";
import { fetchCumulativeARRData } from "../utils/salesforce-fivetran-access";

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
 */
export function useFormattedCumulativeARRMetrics({
  period = "week",
  lookbackUnits = 12,
  campusId = null,
  enabled = true,
  refetchKey = 0,
}: UseFormattedCumulativeARROptions = {}) {
  const [data, setData] = useState<FormattedCumulativeARRResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        setLoading(true);
        console.log("=== FETCHING CUMULATIVE ARR DATA ===");
        console.log(`Period: ${period}, Campus ID: ${campusId || 'all'}, Lookback: ${lookbackUnits}`);

        // Calculate dates based on lookback period
        const today = new Date();
        const intervalUnit = getIntervalUnit(period);
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - (lookbackUnits * (period === "day" ? 1 : period === "week" ? 7 : 30)));
        
        const formattedStartDate = startDate.toISOString().split('T')[0];
        const formattedEndDate = today.toISOString().split('T')[0];
        console.log(`Date range: ${formattedStartDate} to ${formattedEndDate}`);

        // Fetch ARR data
        const { success, data: rawData, error: queryError } = await fetchCumulativeARRData(
          formattedStartDate,
          formattedEndDate,
          campusId
        );

        if (!success || queryError) {
          console.error("API Error:", queryError);
          throw new Error(`Failed to fetch ARR data: ${queryError?.message || "Unknown error"}`);
        }

        // Check if we have valid data
        if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
          console.warn("No data returned from ARR metrics query");
          setData(createEmptyResponse(period));
          setError(null);
          setLoading(false);
          return;
        }

        console.log(`Query returned ${rawData.length} cumulative ARR data rows`);
        console.log("Raw ARR data sample:", rawData.slice(0, 3));
        
        // Log all campus names to debug filtering issues
        const campusNames = [...new Set(rawData.map(item => item.campus_name))];
        console.log("Campus names in result:", campusNames);
        
        if (campusId) {
          console.log(`Filtering for campus: "${campusId}"`);
          console.log("Matching campus items:", rawData.filter(item => 
            item.campus_name?.toLowerCase() === campusId?.toLowerCase()
          ).length);
        }

        // Normalize the data to ensure all required fields are present
        const normalizedData = rawData.map((item) => ({
          period_type: item.period_type || period,
          period_date: item.period_date,
          formatted_date: item.formatted_date,
          campus_name: item.campus_name || "All Campuses",
          cumulative_arr: Number(item.cumulative_arr || 0),
        }));

        console.log("Normalized data sample:", normalizedData.slice(0, 3));

        // Process the normalized data into the expected format
        const processedData = processFormattedMetrics(normalizedData, period);
        console.log("Final processed data structure:", {
          dataStructure: Object.keys(processedData),
          periods: processedData.periods.length,
          campuses: processedData.campuses,
          latestPeriod: processedData.latestPeriod,
          latestTotal: processedData.latestTotal,
          timeSeriesLength: processedData.timeSeriesData.length
        });
        
        setData(processedData);
        setError(null);
      } catch (err) {
        console.error("Error fetching formatted cumulative ARR metrics:", err);
        setError(err instanceof Error ? err : new Error("Unknown error"));
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [period, lookbackUnits, campusId, enabled, refetchKey]);

  return { data, loading, error };
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
  console.log("Processing cumulative ARR metrics...");
  
  // Get unique periods, sorted by date (newest to oldest)
  const periods = getSortedPeriods(rawData);
  console.log("Sorted periods:", periods);

  // Get unique campuses
  const campuses = getUniqueCampuses(rawData);
  console.log("Unique campuses:", campuses);

  // Calculate period totals
  const totals = periods.reduce(
    (acc, period) => {
      const periodData = rawData.filter((item) => item.period_date === period);
      const periodTotal = periodData.reduce((sum, item) => sum + Number(item.cumulative_arr), 0);
      console.log(`Period ${period} has ${periodData.length} items, total ARR: ${periodTotal}`);
      acc[period] = periodTotal;
      return acc;
    },
    {} as Record<string, number>
  );
  
  console.log("Period totals:", totals);

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
  console.log("Calculating changes with periods:", periods);
  console.log("Period totals for change calculation:", totals);
  const changes = calculatePeriodChanges(periods, totals);
  console.log("Calculated changes:", changes);

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
    totals,
    campusTotals,
    latestPeriod,
    latestTotal,
    changes,
    timeSeriesData,
    getARRValue,
    periodType: period,
  };
}