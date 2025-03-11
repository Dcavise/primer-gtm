/**
 * Format a number for display with thousands separators
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString("en-US");
};

/**
 * Format a decimal as a percentage, rounded to 1 decimal place
 */
export const formatPercent = (num: number): string => {
  return num.toFixed(1);
};

/**
 * Format a date string or Date object to a readable format (MM/DD/YYYY)
 */
export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  // Check if the date is valid
  if (isNaN(dateObj.getTime())) {
    return "Invalid date";
  }

  // Format as MM/DD/YYYY
  const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
  const day = dateObj.getDate().toString().padStart(2, "0");
  const year = dateObj.getFullYear();

  return `${month}/${day}/${year}`;
};

/**
 * Format a date with time (MM/DD/YYYY, HH:MM:SS)
 */
export const formatDateTime = (date: string | Date): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  // Check if the date is valid
  if (isNaN(dateObj.getTime())) {
    return "Invalid date";
  }

  return dateObj.toLocaleString();
};
