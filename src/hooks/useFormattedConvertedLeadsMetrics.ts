import { useFormattedConvertedLeadsMetrics as useFeatureFormattedConvertedLeadsMetrics } from '@/features/salesforce/hooks';

/**
 * @deprecated Use the hook from @/features/salesforce/hooks/useFormattedMetrics instead
 * This is a wrapper around the feature-based hook for backward compatibility
 */
export function useFormattedConvertedLeadsMetrics(options = {}) {
  return useFeatureFormattedConvertedLeadsMetrics(options);
}