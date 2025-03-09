import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase-client';

export type LeadMetric = {
  period_start: string;
  period_type: string;
  campus_name: string;
  campus_id: string;
  lead_count: number;
};

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
  period?: 'day' | 'week' | 'month';
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
  period = 'week',
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
    console.log('useLeadsCreated parameters:', { period, lookbackUnits, campusId, refetchKey });

    async function fetchData() {
      try {
        setLoading(true);
        
        // First try the Edge Function
        let responseData;
        try {
          // Use the campus name directly for filtering with enhanced debugging
          // The parameter is named campus_name to match the updated function
          console.log(`%c 🔍 EDGE FUNCTION CAMPUS FILTER`, 'background: #ffe0e0; color: #ff0000; font-weight: bold');
          console.log(`- Campus name parameter: "${campusId}"`);
          console.log(`- Parameter type: ${typeof campusId}`);
          console.log(`- Null check: ${campusId === null ? 'IS NULL' : 'NOT NULL'}`);
          if (campusId) {
            console.log(`- Length: ${campusId.length}`);
            console.log(`- Whitespace check: "${campusId}" vs "${campusId.trim()}"`);
            console.log(`- Has leading/trailing whitespace: ${campusId !== campusId.trim()}`);
            
            // Based on the SQL query example, we need to make the campus name match exactly
            console.log(`- SQL filter will use: preferred_campus_c = '${campusId}'`);
            console.log(`- For a fuzzy match, the filter would be: preferred_campus_c ILIKE '%${campusId}%'`);
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
          
          console.log('Final edge function parameters:', functionParams);
          
          const { data: edgeFunctionData, error: edgeFunctionError } = await supabase.functions.invoke('leads-created', {
            body: functionParams
          });
          
          if (edgeFunctionError) throw new Error(edgeFunctionError.message);
          if (!edgeFunctionData.success) throw new Error(edgeFunctionData.error || 'Unknown error');
          
          responseData = edgeFunctionData.data;
        } catch (edgeFunctionError) {
          console.warn('Edge function failed, falling back to direct SQL:', edgeFunctionError);
          
          // Fall back to direct SQL query if edge function fails
          let query = `SELECT * FROM fivetran_views.get_lead_metrics('${period}', ${lookbackUnits}`;
          
          console.log(`%c 🔍 SQL FALLBACK CAMPUS FILTER`, 'background: #e0e0ff; color: #0000ff; font-weight: bold');
          console.log(`- Campus name parameter: "${campusId}"`);
          console.log(`- Parameter type: ${typeof campusId}`);
          console.log(`- Null check: ${campusId === null ? 'IS NULL' : 'NOT NULL'}`);
          
          // Different handling for specific campus vs. all campuses
          if (campusId !== null) {
            console.log(`- Length: ${campusId.length}`);
            console.log(`- Whitespace check: "${campusId}" vs "${campusId.trim()}"`);
            console.log(`- Has leading/trailing whitespace: ${campusId !== campusId.trim()}`);
            
            // Pass the campus name as a quoted string parameter
            // Ensure we're properly escaping single quotes for SQL
            const escapedCampusId = campusId.replace(/'/g, "''");
            
            // Use case-insensitive matching for ALL campus selections
            // This ensures we match campus names regardless of case differences
            query += `, '${escapedCampusId}', false, true`;
            console.log(`- Final SQL parameter (escaped): '${escapedCampusId}'`);
            console.log(`- SQL will use: WHERE preferred_campus_c ILIKE '${escapedCampusId}' (case-insensitive)`);
            console.log(`- This applies to ALL campus selections for consistent behavior`);
          } else {
            // For 'all campuses', we pass a special parameter that tells the SQL function
            // to completely omit the WHERE clause for preferred_campus_c
            query += `, NULL, true, false`; // Parameters: campus_name, include_all_campuses, use_case_insensitive
            console.log(`- Passing NULL + include_all_campuses=true`);
            console.log(`- This will completely remove the WHERE preferred_campus_c clause`);
          }
          query += `)`;
          
          const { data: sqlData, error: sqlError } = await supabase.rpc('execute_sql_query', {
            query_text: query
          });
          
          if (sqlError) throw sqlError;
          
          // Process the data ourselves
          responseData = processLeadMetrics(sqlData, period);
        }
        
        setData(responseData);
        setError(null);
      } catch (err) {
        console.error('Error fetching lead metrics:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [period, lookbackUnits, campusId, enabled, refetchKey]);

  return { data, loading, error };
}

// Fallback processor in case the edge function isn't available
function processLeadMetrics(rawData: any[], period: string): LeadMetricsResponse {
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
      periodType: period
    };
  }
  
  // Get unique periods, sorted by date
  const periods = [...new Set(rawData.map(item => item.period_start))]
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  
  // Get unique campuses
  const campuses = [...new Set(rawData.map(item => item.campus_name))]
    .filter(name => name !== 'No Campus Match'); // Optionally filter out "No Campus Match"
  
  // Calculate period totals
  const totals = periods.reduce((acc, period) => {
    const periodData = rawData.filter(item => item.period_start === period);
    acc[period] = periodData.reduce((sum, item) => sum + Number(item.lead_count), 0);
    return acc;
  }, {} as Record<string, number>);
  
  // Calculate campus totals across all periods
  const campusTotals = campuses.reduce((acc, campus) => {
    const campusData = rawData.filter(item => item.campus_name === campus);
    acc[campus] = campusData.reduce((sum, item) => sum + Number(item.lead_count), 0);
    return acc;
  }, {} as Record<string, number>);
  
  // Calculate week-over-week or period-over-period changes
  const changes = periods.length > 1 ? 
    calculatePeriodChanges(periods, totals) : 
    { raw: {}, percentage: {} };
  
  // Format data for time series chart
  const timeSeriesData = periods.map(period => ({
    period,
    total: totals[period],
    campuses: campuses.reduce((acc, campus) => {
      const match = rawData.find(item => 
        item.period_start === period && 
        item.campus_name === campus
      );
      acc[campus] = match ? Number(match.lead_count) : 0;
      return acc;
    }, {} as Record<string, number>)
  })).reverse(); // Reverse to get chronological order
  
  // Return structured data
  return {
    // Raw data for detailed analysis
    raw: rawData,
    
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
      const match = rawData.find(item => 
        item.period_start === periodStart && 
        item.campus_name === campusName
      );
      return match ? Number(match.lead_count) : 0;
    },
    
    // Period type used for this data
    periodType: period
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