
export function formatDate(dateString: string): string {
  if (!dateString) return "Unknown";
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return dateString;
    }
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
}

export function formatNumber(num: number): string {
  if (isNaN(num)) return "N/A";
  
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0
  }).format(num);
}

export function formatPercent(num: number): string {
  if (isNaN(num)) return "N/A";
  
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1
  }).format(num);
}
