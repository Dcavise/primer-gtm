import { FormattedLeadMetric } from "../hooks/useFormattedLeadsMetrics";

/**
 * Common types related to date and period handling
 */
export type PeriodType = 'day' | 'week' | 'month';

export type PeriodChanges = {
  raw: Record<string, number>;
  percentage: Record<string, number>;
};

/**
 * Gets the SQL interval unit based on period type
 */
export function getIntervalUnit(period: PeriodType): string {
  return period === 'day' ? 'day' : period === 'week' ? 'week' : 'month';
}

/**
 * Gets the view name suffix based on period type
 */
export function getViewSuffix(period: PeriodType): string {
  return period === 'day' ? 'daily' : period === 'week' ? 'weekly' : 'monthly';
}

/**
 * Formats a date based on period type
 * This is for client-side formatting when database pre-formatting is not available
 */
export function formatPeriodDate(date: string, period: PeriodType): string {
  const dateObj = new Date(date);
  
  if (period === 'day') {
    return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } else if (period === 'week') {
    return `Week of ${dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  } else {
    return dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
}

/**
 * Calculates period-over-period changes
 * Used for both count-based metrics and monetary metrics
 */
export function calculatePeriodChanges(
  periods: string[], 
  totals: Record<string, number>
): PeriodChanges {
  const raw: Record<string, number> = {};
  const percentage: Record<string, number> = {};
  
  // Need at least 2 periods to calculate changes
  if (periods.length < 2) {
    return { raw, percentage };
  }
  
  // For each period except the first (oldest)
  for (let i = 1; i < periods.length; i++) {
    const currentPeriod = periods[i];
    const previousPeriod = periods[i-1];
    
    const currentValue = totals[currentPeriod] || 0;
    const previousValue = totals[previousPeriod] || 0;
    
    // Raw change
    raw[currentPeriod] = currentValue - previousValue;
    
    // Percentage change
    if (previousValue === 0) {
      // If previous value is 0, we can't calculate percentage change
      percentage[currentPeriod] = currentValue > 0 ? 100 : 0;
    } else {
      percentage[currentPeriod] = ((currentValue - previousValue) / previousValue) * 100;
    }
  }
  
  // Handle the oldest period (no previous period to compare to)
  if (periods.length > 0) {
    const oldestPeriod = periods[0];
    raw[oldestPeriod] = 0;
    percentage[oldestPeriod] = 0;
  }
  
  return { raw, percentage };
}

/**
 * Gets unique periods from raw metrics data and sorts them by date (newest to oldest)
 */
export function getSortedPeriods(data: FormattedLeadMetric[]): string[] {
  return [...new Set(data.map(item => item.period_date))]
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
}

/**
 * Gets unique campuses from raw metrics data, filtering out any with "No Campus Match"
 */
export function getUniqueCampuses(data: FormattedLeadMetric[]): string[] {
  return [...new Set(data.map(item => item.campus_name))]
    .filter(name => name !== 'No Campus Match');
}

/**
 * Gets the SQL query date filter based on period type and lookback units
 */
export function getPeriodDateFilter(period: PeriodType, lookbackUnits: number): string {
  const intervalUnit = getIntervalUnit(period);
  return `DATE_TRUNC('${intervalUnit}', CURRENT_DATE) - INTERVAL '${lookbackUnits} ${intervalUnit}'`;
}