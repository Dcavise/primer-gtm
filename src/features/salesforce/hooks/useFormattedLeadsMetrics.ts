import { useFormattedMetrics, UseFormattedMetricsOptions, FormattedLeadsResponse } from './useFormattedMetrics';

/**
 * @deprecated Use useFormattedMetrics hook with metricType='leads' instead
 * Hook to fetch pre-formatted lead metrics from Supabase views
 */
export function useFormattedLeadsMetrics(options: UseFormattedMetricsOptions = {}) {
  const { data, loading, error } = useFormattedMetrics({
    metricType: 'leads',
    ...options
  });
  
  return { 
    data: data as FormattedLeadsResponse | null, 
    loading, 
    error 
  };
}