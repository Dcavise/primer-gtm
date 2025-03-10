import { useFormattedMetrics, UseFormattedMetricsOptions, FormattedLeadsResponse } from './useFormattedMetrics';

/**
 * @deprecated Use useFormattedMetrics hook with metricType='closedWon' instead
 * Hook to fetch pre-formatted closed won opportunity metrics from Supabase views
 */
export function useFormattedClosedWonMetrics(options: UseFormattedMetricsOptions = {}) {
  const { data, loading, error } = useFormattedMetrics({
    metricType: 'closedWon',
    ...options
  });
  
  return { 
    data: data as FormattedLeadsResponse | null, 
    loading, 
    error 
  };
}