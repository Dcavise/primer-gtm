import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase-client";

export type LeadMetric = {
  period_start: string;
  period_type: string;
  campus_name: string;
  campus_id: string;
  lead_count: number;
};

// Helper function to convert period to milliseconds for date calculations
function getMillisecondsForPeriod(period: string): number {
  const DAY_IN_MS = 24 * 60 * 60 * 1000;
  switch (period) {
    case "day":
      return DAY_IN_MS;
    case "week":
      return 7 * DAY_IN_MS;
    case "month":
      return 30 * DAY_IN_MS;
    case "quarter":
      return 90 * DAY_IN_MS;
    case "year":
      return 365 * DAY_IN_MS;
    default:
      return 7 * DAY_IN_MS; // default to week
  }
}

export type LeadMetricsResponse = {
  raw: LeadMetric[];
  periods: string[];
  campuses: string[];
  totals: Record<string, number>;
  campusTotals: Record<string, number>;
  latestPeriod: string | null;
  latestTotal: number;
  changes: {
    raw: Record<string, number>;
    percentage: Record<string, number>;
  };
  timeSeriesData: Array<{
    period: string;
    total: number;
    campuses: Record<string, number>;
  }>;
  getLeadCount: (periodStart: string, campusName: string) => number;
  periodType: string;
};

export type UseLeadsCreatedOptions = {
  period?: "day" | "week" | "month";
  lookbackUnits?: number;
  campusId?: string | null; // Now uses campus name directly (from preferred_campus_c)
  enabled?: boolean;
  // For refetching from components
  refetchKey?: number;
};

/**
 * Hook to fetch lead creation metrics from the leads-created Edge Function
 */
export function useLeadsCreated({
  period = "week",
  lookbackUnits = 12,
  campusId = null,
  enabled = true,
  refetchKey = 0,
}: UseLeadsCreatedOptions = {}) {
  const [data, setData] = useState<LeadMetricsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    // Log the current parameters for debugging
    console.log("useLeadsCreated parameters:", {
      period,
      lookbackUnits,
      campusId,
      refetchKey,
    });

    async function fetchData() {
      try {
        setLoading(true);

        // First try the Edge Function
        let responseData;
        try {
          // Use the campus name directly for filtering with enhanced debugging
          // The parameter is named campus_name to match the updated function
          console.log(
            `%c 🔍 EDGE FUNCTION CAMPUS FILTER`,
            "background: #ffe0e0; color: #ff0000; font-weight: bold"
          );
          console.log(`- Campus name parameter: "${campusId}"`);
          console.log(`- Parameter type: ${typeof campusId}`);
          console.log(`- Null check: ${campusId === null ? "IS NULL" : "NOT NULL"}`);
          if (campusId) {
            console.log(`- Length: ${campusId.length}`);
            console.log(`- Whitespace check: "${campusId}" vs "${campusId.trim()}"`);
            console.log(`- Has leading/trailing whitespace: ${campusId !== campusId.trim()}`);

            // Based on the SQL query example, we need to make the campus name match exactly
            console.log(`- SQL filter will use: preferred_campus_c = '${campusId}'`);
            console.log(
              `- For a fuzzy match, the filter would be: preferred_campus_c ILIKE '%${campusId}%'`
            );
          }

          // Create base parameters for edge function call
          const functionParams: {
            period: string;
            lookback_units: number;
            campus_name?: string | null;
            include_all_campuses?: boolean;
          } = {
            period,
            lookback_units: lookbackUnits,
          };

          // For specific campus, add the campus_name parameter
          // For 'all campuses', add include_all_campuses=true to signal no WHERE clause
          if (campusId !== null) {
            functionParams.campus_name = campusId;
            console.log(`- Adding campus_name parameter to edge function call: ${campusId}`);
          } else {
            functionParams.include_all_campuses = true;
            console.log(`- Setting include_all_campuses=true (removes WHERE clause completely)`);
          }

          console.log("Final edge function parameters:", functionParams);

          const { data: edgeFunctionData, error: edgeFunctionError } =
            await supabase.functions.invoke("leads-created", {
              body: functionParams,
            });

          if (edgeFunctionError) throw new Error(edgeFunctionError.message);
          if (!edgeFunctionData.success) throw new Error(edgeFunctionData.error || "Unknown error");

          responseData = edgeFunctionData.data;
        } catch (edgeFunctionError) {
          console.warn("Edge function failed, falling back to direct SQL:", edgeFunctionError);

          // Fall back to direct SQL query if edge function fails
          let query = `
            SELECT
              DATE_TRUNC('${period}', l.created_date) AS period_start,
              COALESCE(l.preferred_campus_c, 'No Campus Match') AS campus_name,
              COUNT(DISTINCT l.id) AS lead_count
            FROM
              fivetran_views.lead l
            WHERE
              l.created_date >= (CURRENT_DATE - INTERVAL '${lookbackUnits} ${period}')
          `;

          console.log(`Using DATE_TRUNC for date aggregation`);

          console.log("Current date in SQL:", new Date().toISOString());
          console.log("Lookback interval:", `${lookbackUnits} ${period}`);
          console.log(
            "Expected date range: from",
            new Date(Date.now() - lookbackUnits * getMillisecondsForPeriod(period)).toISOString(),
            "to",
            new Date().toISOString()
          );

          console.log(
            `%c 🔍 SQL FALLBACK CAMPUS FILTER`,
            "background: #e0e0ff; color: #0000ff; font-weight: bold"
          );
          console.log(`- Campus name parameter: "${campusId}"`);
          console.log(`- Parameter type: ${typeof campusId}`);
          console.log(`- Null check: ${campusId === null ? "IS NULL" : "NOT NULL"}`);

          // Debug information about campus filter
          console.log("Leads SQL query - Campus filter information:");
          console.log(`- Campus name parameter: "${campusId}"`);
          console.log(`- Parameter type: ${typeof campusId}`);
          console.log(`- Null check: ${campusId === null ? "IS NULL" : "NOT NULL"}`);
          
          // Add campus filter if provided
          if (campusId !== null && campusId !== undefined) {
            // Ensure campusId is treated as a string
            const campusIdStr = String(campusId);
            console.log(`- Length: ${campusIdStr.length}`);
            console.log(`- Whitespace check: "${campusIdStr}" vs "${campusIdStr.trim()}"`);
            console.log(`- Has leading/trailing whitespace: ${campusIdStr !== campusIdStr.trim()}`);

            // Ensure we're properly escaping single quotes for SQL
            const escapedCampusId = campusIdStr.replace(/'/g, "''");
            
            // Based on the SQL query example, we need to make the campus name match exactly
            console.log(`- SQL filter will use: preferred_campus_c = '${escapedCampusId}'`);
            
            // Add the campus filter to the WHERE clause
            if (query.includes("WHERE")) {
              query += ` AND preferred_campus_c = '${escapedCampusId}'`;
            } else {
              query += ` WHERE preferred_campus_c = '${escapedCampusId}'`;
            }
          } else {
            console.log("- No campus filter will be applied");
          }
          // Add GROUP BY and ORDER BY clauses - using DATE_TRUNC with the selected period
          query += `
            GROUP BY
              DATE_TRUNC('${period}', l.created_date), 
              l.preferred_campus_c
            ORDER BY
              period_start DESC
          `;

          // Get exact dates for today and recent days for debugging
          const currentDate = new Date();
          const yesterday = new Date(currentDate);
          yesterday.setDate(yesterday.getDate() - 1);
          const dayBefore = new Date(currentDate);
          dayBefore.setDate(dayBefore.getDate() - 2);

          console.log("Today date:", currentDate.toISOString().split("T")[0]);
          console.log("Yesterday date:", yesterday.toISOString().split("T")[0]);
          console.log("Day before yesterday:", dayBefore.toISOString().split("T")[0]);

          console.log(`FULL SQL QUERY: ${query}`);

          // For debugging: Show equivalent of direct query
          const debugDates = [];

          for (let i = 0; i < 7; i++) {
            const date = new Date(currentDate);
            date.setDate(date.getDate() - i);
            debugDates.push(date.toISOString().split("T")[0]);
          }

          console.log("Direct equivalent query would be:");
          console.log(`SELECT DATE(created_date) AS lead_date, COUNT(*) 
            FROM fivetran_views.lead 
            WHERE DATE(created_date) IN ('${debugDates.join("', '")}') 
            GROUP BY lead_date
            ORDER BY lead_date DESC;`);

          // Try execute_sql_query RPC first
          const { data: sqlData, error: sqlError } = await supabase.rpc("execute_sql_query", {
            query_text: query,
          });

          if (sqlError) {
            console.error("SQL RPC Error:", sqlError);

            // If the RPC fails, try a direct query approach
            console.log("Attempting direct query as fallback...");

            // Using the helper function defined at the top level

            // Execute SQL query directly through Supabase
            console.log("Executing SQL query directly through Supabase...");
            try {
              // Make a direct SQL query with the Supabase client
              const { data: directData, error: directError } = await supabase.rpc(
                "execute_sql_query",
                {
                  query_text: query,
                }
              );

              if (directError) {
                console.error("Direct SQL query error:", directError);
                throw directError;
              }

              if (!directData || !Array.isArray(directData) || directData.length === 0) {
                console.warn("No data returned from direct SQL query");
                return processLeadMetrics([], period);
              }

              console.log("Direct SQL query returned:", directData.length, "rows");
              // Type assertion since we've confirmed it's an array above
              return processLeadMetrics(directData as RawLeadMetric[], period);
            } catch (error) {
              console.error("All SQL query methods failed:", error);
              // Return empty data structure when all methods fail
              return processLeadMetrics([], period);
            }
          } else {
            console.log("SQL RPC returned:", Array.isArray(sqlData) ? sqlData.length : 0, "rows");
            // Process the data ourselves - ensure it's the right type with a check and type assertion
            responseData = processLeadMetrics(Array.isArray(sqlData) ? sqlData as RawLeadMetric[] : [], period);
          }
        }

        setData(responseData);
        setError(null);
      } catch (err) {
        console.error("Error fetching lead metrics:", err);
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

// Define a type for the raw metrics data structure
type RawLeadMetric = {
  period_start: string;
  campus_name: string;
  lead_count: number;
};

// Map raw metrics to the expected LeadMetric format
function mapToLeadMetric(raw: RawLeadMetric[]): LeadMetric[] {
  return raw.map((item) => ({
    period_start: item.period_start,
    period_type: "", // Add missing properties required by LeadMetric
    campus_name: item.campus_name,
    campus_id: "", // Add missing properties required by LeadMetric
    lead_count: item.lead_count,
  }));
}

// Fallback processor in case the edge function isn't available
function processLeadMetrics(rawData: RawLeadMetric[], period: string): LeadMetricsResponse {
  if (!rawData || !rawData.length) {
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

  // Get unique periods, sorted by date
  const periods = [...new Set(rawData.map((item) => item.period_start))].sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  // Get unique campuses
  const campuses = [...new Set(rawData.map((item) => item.campus_name))].filter(
    (name) => name !== "No Campus Match"
  ); // Optionally filter out "No Campus Match"

  // Calculate period totals
  const totals = periods.reduce(
    (acc, period) => {
      const periodData = rawData.filter((item) => item.period_start === period);
      acc[period] = periodData.reduce((sum, item) => sum + Number(item.lead_count), 0);
      return acc;
    },
    {} as Record<string, number>
  );

  // Calculate campus totals across all periods
  const campusTotals = campuses.reduce(
    (acc, campus) => {
      const campusData = rawData.filter((item) => item.campus_name === campus);
      acc[campus] = campusData.reduce((sum, item) => sum + Number(item.lead_count), 0);
      return acc;
    },
    {} as Record<string, number>
  );

  // Calculate week-over-week or period-over-period changes
  const changes =
    periods.length > 1 ? calculatePeriodChanges(periods, totals) : { raw: {}, percentage: {} };

  // Format data for time series chart
  const timeSeriesData = periods
    .map((period) => ({
      period,
      total: totals[period],
      campuses: campuses.reduce(
        (acc, campus) => {
          const match = rawData.find(
            (item) => item.period_start === period && item.campus_name === campus
          );
          acc[campus] = match ? Number(match.lead_count) : 0;
          return acc;
        },
        {} as Record<string, number>
      ),
    }))
    .reverse(); // Reverse to get chronological order

  // Return structured data
  return {
    // Raw data for detailed analysis
    raw: mapToLeadMetric(rawData),

    // Aggregated data
    periods,
    campuses,
    totals,
    campusTotals,

    // Latest period information
    latestPeriod: periods[0] || null,
    latestTotal: periods[0] ? totals[periods[0]] : 0,

    // Changes
    changes,

    // Time series data for charts
    timeSeriesData,

    // Helper function
    getLeadCount: (periodStart: string, campusName: string) => {
      const match = rawData.find(
        (item) => item.period_start === periodStart && item.campus_name === campusName
      );
      return match ? Number(match.lead_count) : 0;
    },

    // Period type used for this data
    periodType: period,
  };
}

// Helper to calculate period-over-period changes
function calculatePeriodChanges(periods: string[], totals: Record<string, number>) {
  const raw: Record<string, number> = {};
  const percentage: Record<string, number> = {};

  for (let i = 0; i < periods.length - 1; i++) {
    const currentPeriod = periods[i];
    const previousPeriod = periods[i + 1];

    const currentValue = totals[currentPeriod];
    const previousValue = totals[previousPeriod];

    raw[currentPeriod] = currentValue - previousValue;

    if (previousValue !== 0) {
      percentage[currentPeriod] = ((currentValue - previousValue) / previousValue) * 100;
    } else {
      percentage[currentPeriod] = currentValue > 0 ? 100 : 0;
    }
  }

  return { raw, percentage };
}
