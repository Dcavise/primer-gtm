import { useState, useEffect } from "react";
import { supabase } from "../integrations/supabase-client";
import {
  PeriodType,
  PeriodChanges,
  getViewSuffix,
  getIntervalUnit,
  getPeriodDateFilter,
  calculatePeriodChanges,
  getSortedPeriods,
  getUniqueCampuses,
} from "../utils/dateUtils";

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
 * Hook to fetch pre-formatted lead metrics from Supabase views
 * Uses the database views for consistent date formatting
 */
export function useFormattedLeadsMetrics({
  period = "week",
  lookbackUnits = 12,
  campusId = null,
  enabled = true,
  refetchKey = 0,
}: UseFormattedLeadsOptions = {}) {
  const [data, setData] = useState<FormattedLeadsResponse | null>(null);
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

        // Build the query using the period-specific lead metrics view
        // Each view contains pre-formatted data for that period type
        const viewSuffix = getViewSuffix(period);
        const viewName = `lead_metrics_${viewSuffix}`;

        let query = `
          SELECT
            period_type,
            period_date,
            formatted_date,
            campus_name,
            lead_count
          FROM
            fivetran_views.${viewName}
          WHERE 1=1
        `;

        // Add campus filter if provided
        if (campusId !== null) {
          // Ensure we're properly escaping single quotes for SQL
          const escapedCampusId = campusId.replace(/'/g, "''");
          query += ` AND campus_name = '${escapedCampusId}'`;
        }

        // Add date filter based on lookback units
        // Note: The views already include date filters, but we'll add this for extra control
        const dateFilter = getPeriodDateFilter(period, lookbackUnits);
        query += `
          AND period_date >= ${dateFilter}
          ORDER BY period_date DESC
        `;

        console.log("EXECUTING FORMATTED METRICS QUERY:");
        console.log(query);

        // Execute the query
        const { data: rawData, error: queryError } = await supabase.rpc(
          "execute_sql_query",
          {
            query_text: query,
          },
        );

        console.log("Query response:", { rawData, queryError });

        if (queryError) {
          console.error("Query error details:", queryError);
          throw new Error(
            `SQL query error: ${queryError.message || "Unknown error"}`,
          );
        }

        // Check if we have valid data - Supabase might return raw data as undefined or null even if no error
        if (!rawData || !Array.isArray(rawData)) {
          console.warn(
            "No data returned from formatted metrics query:",
            typeof rawData,
          );
          console.log("Raw data value:", rawData);
          setData(createEmptyResponse(period));
          setError(null);
          setLoading(false);
          return;
        }

        // Normalize the data to ensure all required fields are present
        const normalizedData = rawData.map((item) => ({
          period_type: item.period_type || period,
          period_date: item.period_date,
          formatted_date: item.formatted_date,
          // Default to "All Campuses" if campus_name is missing
          campus_name: item.campus_name || "All Campuses",
          lead_count: Number(item.lead_count),
        }));

        // If we still have no data after normalization, return empty response
        if (normalizedData.length === 0) {
          setData(createEmptyResponse(period));
          setError(null);
          setLoading(false);
          return;
        }

        console.log(`Query returned ${rawData.length} rows`);
        console.log("Sample data:", rawData.slice(0, 3));

        // Process the normalized data into the expected format
        const processedData = processFormattedMetrics(normalizedData, period);
        setData(processedData);
        setError(null);
      } catch (err) {
        console.error("Error fetching formatted lead metrics:", err);
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

// Process the raw data into the expected format for the UI
function processFormattedMetrics(
  rawData: FormattedLeadMetric[],
  period: PeriodType,
): FormattedLeadsResponse {
  // Get unique periods, sorted by date (newest to oldest)
  const periods = getSortedPeriods(rawData);

  // Get unique campuses
  const campuses = getUniqueCampuses(rawData);

  // Calculate period totals
  const totals = periods.reduce(
    (acc, period) => {
      const periodData = rawData.filter((item) => item.period_date === period);
      acc[period] = periodData.reduce(
        (sum, item) => sum + Number(item.lead_count),
        0,
      );
      return acc;
    },
    {} as Record<string, number>,
  );

  // Calculate campus totals across all periods
  const campusTotals = campuses.reduce(
    (acc, campus) => {
      const campusData = rawData.filter((item) => item.campus_name === campus);
      acc[campus] = campusData.reduce(
        (sum, item) => sum + Number(item.lead_count),
        0,
      );
      return acc;
    },
    {} as Record<string, number>,
  );

  // Calculate period-over-period changes
  const changes = calculatePeriodChanges(periods, totals);

  // Format data for time series charts - use the formatted_date for display
  const timeSeriesData = periods.map((period) => {
    const periodItems = rawData.filter((item) => item.period_date === period);
    const displayDate =
      periodItems.length > 0 ? periodItems[0].formatted_date : period;

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
        {} as Record<string, number>,
      ),
    };
  });

  // Helper function to get lead count for a specific period and campus
  const getLeadCount = (periodDate: string, campusName: string): number => {
    const match = rawData.find(
      (item) =>
        item.period_date === periodDate && item.campus_name === campusName,
    );
    return match ? Number(match.lead_count) : 0;
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
    getLeadCount,
    periodType: period,
  };
}
