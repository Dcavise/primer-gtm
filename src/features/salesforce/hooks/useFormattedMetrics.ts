import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase-client';
import { 
  PeriodType, 
  PeriodChanges,
  getViewSuffix,
  getIntervalUnit,
  getPeriodDateFilter,
  calculatePeriodChanges,
  getSortedPeriods,
  getUniqueCampuses
} from '@/utils/dateUtils';

export type FormattedMetric = {
  period_type: string;
  period_date: string;
  formatted_date: string;
  campus_name: string;
  count: number;
};

export type FormattedMetricsResponse = {
  raw: FormattedMetric[];
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
  getCount: (periodDate: string, campusName: string) => number;
  periodType: string;
  metricType: MetricType;
};

export type MetricType = 'leads' | 'convertedLeads' | 'arr' | 'closedWon';

export type UseFormattedMetricsOptions = {
  metricType?: MetricType;
  period?: PeriodType;
  lookbackUnits?: number;
  campusId?: string | null;
  enabled?: boolean;
  refetchKey?: number;
};

/**
 * Consolidated hook to fetch pre-formatted metrics from Supabase views
 * Uses the database views for consistent date formatting
 * Supports multiple metric types: leads, convertedLeads, arr, closedWon
 */
export function useFormattedMetrics({
  metricType = 'leads',
  period = 'week',
  lookbackUnits = 12,
  campusId = null,
  enabled = true,
  refetchKey = 0,
}: UseFormattedMetricsOptions = {}) {
  const [data, setData] = useState<FormattedMetricsResponse | null>(null);
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
        
        // Determine which view to use based on metric type and period
        const viewSuffix = getViewSuffix(period);
        let viewName: string;
        let countField: string = 'lead_count'; // Default field name
        
        switch (metricType) {
          case 'leads':
            viewName = `lead_metrics_${viewSuffix}`;
            break;
          case 'convertedLeads':
            viewName = `converted_leads_${viewSuffix}`;
            break;
          case 'arr':
            viewName = `arr_metrics_${viewSuffix}`;
            countField = 'arr_amount';
            break;
          case 'closedWon':
            viewName = `closed_won_metrics_${viewSuffix}`;
            countField = 'opportunity_count';
            break;
          default:
            viewName = `lead_metrics_${viewSuffix}`;
            break;
        }
          
        let query = `
          SELECT
            period_type,
            period_date,
            formatted_date,
            campus_name,
            ${countField} as count
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
        const dateFilter = getPeriodDateFilter(period, lookbackUnits);
        query += `
          AND period_date >= ${dateFilter}
          ORDER BY period_date DESC
        `;
        
        console.log(`EXECUTING FORMATTED ${metricType.toUpperCase()} METRICS QUERY:`);
        console.log(query);
        
        // Execute the query
        const { data: rawData, error: queryError } = await supabase.rpc('execute_sql_query', {
          query: query
        });
        
        if (queryError) {
          console.error('Query error details:', queryError);
          throw new Error(`SQL query error: ${queryError.message || 'Unknown error'}`);
        }
        
        // Check if we have valid data
        if (!rawData || !Array.isArray(rawData)) {
          console.warn('No data returned from formatted metrics query:', typeof rawData);
          setData(createEmptyResponse(period, metricType));
          setError(null);
          setLoading(false);
          return;
        }
        
        // Normalize the data to ensure all required fields are present
        const normalizedData = rawData.map(item => ({
          period_type: item.period_type || period,
          period_date: item.period_date,
          formatted_date: item.formatted_date,
          campus_name: item.campus_name || "All Campuses",
          count: Number(item.count)
        }));
        
        // If we still have no data after normalization, return empty response
        if (normalizedData.length === 0) {
          setData(createEmptyResponse(period, metricType));
          setError(null);
          setLoading(false);
          return;
        }
        
        // Process the normalized data into the expected format
        const processedData = processFormattedMetrics(normalizedData, period, metricType);
        setData(processedData);
        setError(null);
      } catch (err) {
        console.error(`Error fetching formatted ${metricType} metrics:`, err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [metricType, period, lookbackUnits, campusId, enabled, refetchKey]);

  return { data, loading, error };
}

// Helper function to create an empty response with the correct structure
function createEmptyResponse(period: PeriodType, metricType: MetricType): FormattedMetricsResponse {
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
    getCount: () => 0,
    periodType: period,
    metricType
  };
}

// Process the raw data into the expected format for the UI
function processFormattedMetrics(
  rawData: FormattedMetric[], 
  period: PeriodType, 
  metricType: MetricType
): FormattedMetricsResponse {
  // Get unique periods, sorted by date (newest to oldest)
  const periods = getSortedPeriods(rawData);
  
  // Get unique campuses
  const campuses = getUniqueCampuses(rawData);
  
  // Calculate period totals
  const totals = periods.reduce((acc, period) => {
    const periodData = rawData.filter(item => item.period_date === period);
    acc[period] = periodData.reduce((sum, item) => sum + Number(item.count), 0);
    return acc;
  }, {} as Record<string, number>);
  
  // Calculate campus totals across all periods
  const campusTotals = campuses.reduce((acc, campus) => {
    const campusData = rawData.filter(item => item.campus_name === campus);
    acc[campus] = campusData.reduce((sum, item) => sum + Number(item.count), 0);
    return acc;
  }, {} as Record<string, number>);
  
  // Calculate period-over-period changes
  const changes = calculatePeriodChanges(periods, totals);
  
  // Format data for time series charts - use the formatted_date for display
  const timeSeriesData = periods.map(period => {
    const periodItems = rawData.filter(item => item.period_date === period);
    const displayDate = periodItems.length > 0 ? periodItems[0].formatted_date : period;
    
    return {
      period,
      formatted_date: displayDate, // Use the pre-formatted date
      total: totals[period],
      campuses: campuses.reduce((acc, campus) => {
        const match = periodItems.find(item => item.campus_name === campus);
        acc[campus] = match ? Number(match.count) : 0;
        return acc;
      }, {} as Record<string, number>)
    };
  });
  
  // Helper function to get metric count for a specific period and campus
  const getCount = (periodDate: string, campusName: string): number => {
    const match = rawData.find(item => 
      item.period_date === periodDate && 
      item.campus_name === campusName
    );
    return match ? Number(match.count) : 0;
  };
  
  // Get the latest period and its total
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
    getCount,
    periodType: period,
    metricType
  };
}

// Legacy type exports for backward compatibility
export type FormattedLeadMetric = FormattedMetric;
export type FormattedLeadsResponse = FormattedMetricsResponse;
export type UseFormattedLeadsOptions = UseFormattedMetricsOptions;