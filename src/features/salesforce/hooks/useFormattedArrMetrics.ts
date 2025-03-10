import { useFormattedMetrics, UseFormattedMetricsOptions, FormattedLeadsResponse } from './useFormattedMetrics';

/**
 * @deprecated Use useFormattedMetrics hook with metricType='arr' instead
 * Hook to fetch pre-formatted ARR metrics from Supabase views
 */
export function useFormattedArrMetrics(options: UseFormattedMetricsOptions = {}) {
  const { data, loading, error } = useFormattedMetrics({
    metricType: 'arr',
    ...options
  });
  
  return { 
    data: data as FormattedLeadsResponse | null, 
    loading, 
    error 
  };
}