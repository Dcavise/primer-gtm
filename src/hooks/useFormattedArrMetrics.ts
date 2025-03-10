import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase-client';
import { 
  FormattedLeadsResponse, 
  UseFormattedLeadsOptions,
  FormattedLeadMetric
} from './useFormattedLeadsMetrics';
import { calculatePeriodChanges } from '../utils/dateUtils';

// Interface for raw ARR metrics from Supabase views
interface FormattedArrMetric extends Omit<FormattedLeadMetric, 'lead_count'> {
  total_contribution: number;
}

/**
 * Hook to fetch pre-formatted ARR (Annual Recurring Revenue) metrics from Supabase views
 * Uses the database views for consistent date formatting
 * Specifically for tuition offers that have been accepted for the 25/26 school year
 */
export function useFormattedArrMetrics({
  period = 'week',
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
        
        // Build the query using the period-specific ARR metrics view
        const viewName = 
          period === 'day' ? 'arr_metrics_daily' : 
          period === 'week' ? 'arr_metrics_weekly' : 'arr_metrics_monthly';
          
        let query = `
          SELECT
            period_type,
            period_date,
            formatted_date,
            campus_name,
            total_contribution
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
        const intervalUnit = period === 'day' ? 'day' : period === 'week' ? 'week' : 'month';
        query += `
          AND period_date >= DATE_TRUNC('${intervalUnit}', CURRENT_DATE) - INTERVAL '${lookbackUnits} ${intervalUnit}'
          ORDER BY period_date DESC
        `;
        
        console.log('EXECUTING FORMATTED ARR METRICS QUERY:');
        console.log(query);
        
        // Execute the query
        const { data: rawData, error: queryError } = await supabase.rpc('execute_sql_query', {
          query_text: query
        });
        
        console.log('Query response:', { rawData, queryError });
        
        if (queryError) {
          console.error('Query error details:', queryError);
          throw new Error(`SQL query error: ${queryError.message || 'Unknown error'}`);
        }
        
        // Check if we have valid data - Supabase might return raw data as undefined or null even if no error
        if (!rawData || !Array.isArray(rawData)) {
          console.warn('No data returned from formatted ARR metrics query:', typeof rawData);
          console.log('Raw data value:', rawData);
          setData(createEmptyResponse(period));
          setError(null);
          setLoading(false);
          return;
        }
        
        // Normalize the data to ensure all required fields are present
        const normalizedData = rawData.map(item => ({
          period_type: item.period_type || period,
          period_date: item.period_date,
          formatted_date: item.formatted_date,
          // Default to "All Campuses" if campus_name is missing
          campus_name: item.campus_name || "All Campuses",
          total_contribution: Number(item.total_contribution)
        }));
        
        // If we still have no data after normalization, return empty response
        if (normalizedData.length === 0) {
          setData(createEmptyResponse(period));
          setError(null);
          setLoading(false);
          return;
        }
        
        console.log(`Query returned ${rawData.length} rows`);
        console.log('Sample data:', rawData.slice(0, 3));
        
        // Process the normalized data into the expected format
        const processedData = processFormattedMetrics(normalizedData, period);
        setData(processedData);
        setError(null);
      } catch (err) {
        console.error('Error fetching formatted ARR metrics:', err);
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
    periodType: period
  };
}

// Process the raw data into the expected format for the UI
function processFormattedMetrics(rawData: FormattedArrMetric[], period: string): FormattedLeadsResponse {
  // Map ARR metrics to the shape expected by FormattedLeadsResponse
  // We'll treat the ARR amount as if it were a "lead_count" for compatibility
  const mappedData = rawData.map(item => ({
    ...item,
    lead_count: item.total_contribution
  })) as unknown as FormattedLeadMetric[];
  
  // Get unique periods, sorted by date (newest to oldest)
  // This matches the DESC order from our SQL query
  const periods = [...new Set(mappedData.map(item => item.period_date))]
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  
  // Get unique campuses
  const campuses = [...new Set(mappedData.map(item => item.campus_name))]
    .filter(name => name !== 'No Campus Match');
  
  // Calculate period totals
  const totals = periods.reduce((acc, period) => {
    const periodData = mappedData.filter(item => item.period_date === period);
    acc[period] = periodData.reduce((sum, item) => sum + Number(item.lead_count), 0);
    return acc;
  }, {} as Record<string, number>);
  
  // Calculate campus totals across all periods
  const campusTotals = campuses.reduce((acc, campus) => {
    const campusData = mappedData.filter(item => item.campus_name === campus);
    acc[campus] = campusData.reduce((sum, item) => sum + Number(item.lead_count), 0);
    return acc;
  }, {} as Record<string, number>);
  
  // Calculate period-over-period changes
  const changes = calculatePeriodChanges(periods, totals);
  
  // Format data for time series charts - use the formatted_date for display
  const timeSeriesData = periods.map(period => {
    const periodItems = mappedData.filter(item => item.period_date === period);
    const displayDate = periodItems.length > 0 ? periodItems[0].formatted_date : period;
    
    return {
      period,
      formatted_date: displayDate, // Use the pre-formatted date
      total: totals[period],
      campuses: campuses.reduce((acc, campus) => {
        const match = periodItems.find(item => item.campus_name === campus);
        acc[campus] = match ? Number(match.lead_count) : 0;
        return acc;
      }, {} as Record<string, number>)
    };
  });
  
  // Helper function to get ARR amount for a specific period and campus
  const getLeadCount = (periodDate: string, campusName: string): number => {
    const match = rawData.find(item => 
      item.period_date === periodDate && 
      item.campus_name === campusName
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
    periodType: period
  };
}


