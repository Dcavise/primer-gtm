/**
 * Chart color utilities based on the design system
 */

// Standard color palette for charts throughout the application
export const chartColors = [
  "#1F77B4", // Blue
  "#FF7F0E", // Orange
  "#2CA02C", // Green
  "#D62728", // Red
  "#9467BD", // Purple
  "#8C564B", // Brown
  "#E377C2", // Pink
  "#7F7F7F", // Gray
  "#BCBD22", // Olive
  "#17BECF", // Cyan
];

// Primary categorical colors for distinct values (maintain backward compatibility)
export const CATEGORICAL_COLORS = chartColors.slice(0, 5);

// Colors for trend lines
export const TREND_COLORS = {
  primary: chartColors[0], // Blue
  secondary: chartColors[1], // Orange
  baseline: "#C0C0C0", // Gray
};

// KPI indicator colors
export const KPI_COLORS = {
  positive: chartColors[2], // Green
  negative: chartColors[3], // Red
  neutral: "#C0C0C0", // Gray
  warning: "#FFD700", // Gold
};

/**
 * Get color for categorical data
 * @param index The index to use for color selection
 * @returns A color from the categorical palette
 */
export function getCategoryColor(index: number): string {
  return CATEGORICAL_COLORS[index % CATEGORICAL_COLORS.length];
}

/**
 * Get color from the standard palette based on an index
 * @param index The index to use for color selection
 * @returns A color from the standard palette
 */
export function getChartColor(index: number): string {
  return chartColors[index % chartColors.length];
}

/**
 * Get color for KPI based on value trend
 * @param value Numeric value to determine color
 * @returns Color based on whether value is positive, negative, or neutral
 */
export function getKpiColor(value: number): string {
  if (value > 0) return KPI_COLORS.positive;
  if (value < 0) return KPI_COLORS.negative;
  return KPI_COLORS.neutral;
}

/**
 * Generate color scale for sequential data
 * @param value Current value
 * @param min Minimum value in range
 * @param max Maximum value in range
 * @returns A color representing the value's position in the range
 */
export function getSequentialColorScale(value: number, min: number, max: number): string {
  // Simple implementation - could be enhanced with interpolation
  if (value <= min) return "#F7FBFF"; // Light blue
  if (value >= max) return "#08306B"; // Dark blue
  return "#6BAED6"; // Medium blue
}

/**
 * Returns a subset of the color palette for a specific chart type
 * @param chartType The type of chart that needs colors
 * @returns An array of colors appropriate for the chart type
 */
export function getColorsByChartType(
  chartType: "leads" | "opportunities" | "enrollments" | "conversions"
): string[] {
  switch (chartType) {
    case "leads":
      return chartColors.slice(0, 4);
    case "opportunities":
      return chartColors.slice(0, 5);
    case "enrollments":
      return [chartColors[2], chartColors[0], chartColors[4]]; // Green, Blue, Purple
    case "conversions":
      return [chartColors[1], chartColors[0], chartColors[2]]; // Orange, Blue, Green
    default:
      return chartColors;
  }
}
