/**
 * Format a number for display with thousands separators
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString('en-US');
};

/**
 * Format a decimal as a percentage, rounded to 1 decimal place
 */
export const formatPercent = (num: number): string => {
  return num.toFixed(1);
};
