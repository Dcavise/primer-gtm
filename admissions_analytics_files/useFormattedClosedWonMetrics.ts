import { useState, useEffect } from "react";
import { supabase } from "../integrations/supabase-client";
import {
  FormattedLeadsResponse,
  UseFormattedLeadsOptions,
  FormattedLeadMetric,
} from "./useFormattedLeadsMetrics";

// Interface for raw opportunity metrics from Supabase views
interface FormattedOpportunityMetric extends Omit<FormattedLeadMetric, "lead_count"> {
  opportunity_count: number;
}

/**
 * Hook to fetch pre-formatted closed won opportunity metrics from Supabase views
 * Uses the database views for consistent date formatting
 * Specifically for opportunities where stage_name = 'Closed Won'
 */
export function useFormattedClosedWonMetrics({
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

        // Build the query using the period-specific closed won metrics view
        const viewName =
          period === "day"
            ? "closed_won_daily"
            : period === "week"
              ? "closed_won_weekly"
              : "closed_won_monthly";

        let query = `
          SELECT
            period_type,
            period_date,
            formatted_date,
            campus_name,
            opportunity_count
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
        const intervalUnit = period === "day" ? "day" : period === "week" ? "week" : "month";
        query += `
          AND period_date >= DATE_TRUNC('${intervalUnit}', CURRENT_DATE) - INTERVAL '${lookbackUnits} ${intervalUnit}'
          ORDER BY period_date DESC
        `;

        console.log("EXECUTING FORMATTED CLOSED WON METRICS QUERY:");
        console.log(query);

        // Execute the query
        const { data: rawData, error: queryError } = await supabase.rpc("execute_sql_query", {
          query_text: query,
        });

        console.log("Query response:", { rawData, queryError });

        if (queryError) {
          console.error("Query error details:", queryError);
          throw new Error(`SQL query error: ${queryError.message || "Unknown error"}`);
        }

        // Check if we have valid data - Supabase might return raw data as undefined or null even if no error
        if (!rawData || !Array.isArray(rawData)) {
          console.warn("No data returned from formatted closed won metrics query:", typeof rawData);
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
          opportunity_count: Number(item.opportunity_count),
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
        console.error("Error fetching formatted closed won metrics:", err);
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
  rawData: FormattedOpportunityMetric[],
  period: string
): FormattedLeadsResponse {
  // Map opportunity metrics to the shape expected by FormattedLeadsResponse
  const mappedData = rawData.map((item) => ({
    ...item,
    lead_count: item.opportunity_count,
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
