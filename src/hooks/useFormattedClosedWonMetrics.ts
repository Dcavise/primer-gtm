import { useFormattedClosedWonMetrics as useFeatureFormattedClosedWonMetrics } from '@/features/salesforce/hooks';

/**
 * @deprecated Use the hook from @/features/salesforce/hooks/useFormattedMetrics instead
 * This is a wrapper around the feature-based hook for backward compatibility
 */
export function useFormattedClosedWonMetrics(options = {}) {
  return useFeatureFormattedClosedWonMetrics(options);
}