import { useFormattedMetrics, UseFormattedMetricsOptions, FormattedLeadsResponse } from './useFormattedMetrics';

/**
 * @deprecated Use useFormattedMetrics hook with metricType='convertedLeads' instead
 * Hook to fetch pre-formatted converted lead metrics from Supabase views
 */
export function useFormattedConvertedLeadsMetrics(options: UseFormattedMetricsOptions = {}) {
  const { data, loading, error } = useFormattedMetrics({
    metricType: 'convertedLeads',
    ...options
  });
  
  return { 
    data: data as FormattedLeadsResponse | null, 
    loading, 
    error 
  };
}