
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

/**
 * Format a date string to a readable format (MM/DD/YYYY)
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  // Check if the date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }
  
  // Format as MM/DD/YYYY
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${month}/${day}/${year}`;
};
