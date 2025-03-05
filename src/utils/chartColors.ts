
/**
 * Chart color utilities based on the design system
 */

// Primary categorical colors for distinct values
export const CATEGORICAL_COLORS = [
  '#1F77B4', // Blue
  '#FF7F0E', // Orange
  '#2CA02C', // Green
  '#D62728', // Red
  '#9467BD'  // Purple
];

// Colors for trend lines
export const TREND_COLORS = {
  primary: '#1F77B4',    // Blue
  secondary: '#FF7F0E',  // Orange
  baseline: '#C0C0C0'    // Gray
};

// KPI indicator colors
export const KPI_COLORS = {
  positive: '#2CA02C',  // Green
  negative: '#D62728',  // Red
  neutral: '#C0C0C0',   // Gray
  warning: '#FFD700'    // Gold
};

// Get color for categorical data
export function getCategoryColor(index: number): string {
  return CATEGORICAL_COLORS[index % CATEGORICAL_COLORS.length];
}

// Get color for KPI based on value trend
export function getKpiColor(value: number): string {
  if (value > 0) return KPI_COLORS.positive;
  if (value < 0) return KPI_COLORS.negative;
  return KPI_COLORS.neutral;
}

// Generate color scale for sequential data
export function getSequentialColorScale(value: number, min: number, max: number): string {
  // Simple implementation - could be enhanced with interpolation
  if (value <= min) return '#F7FBFF'; // Light blue
  if (value >= max) return '#08306B'; // Dark blue
  return '#6BAED6'; // Medium blue
}
