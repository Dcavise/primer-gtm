// Re-export all hooks and types for easier imports
export * from './useCampuses';
export * from './useLeadsStats';
export * from './useFellowsStats';
export * from './useDashboardData';
export * from './useSupabaseQuery';

// Consolidated metrics hook
export * from './useFormattedMetrics';

// Backward compatibility hooks
export * from './useFormattedLeadsMetrics';
export * from './useFormattedConvertedLeadsMetrics';
export * from './useFormattedArrMetrics';
export * from './useFormattedClosedWonMetrics';