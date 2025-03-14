import { FormattedLeadMetric } from "../hooks/useFormattedLeadsMetrics";

/**
 * Common types related to date and period handling
 */
export type PeriodType = "day" | "week" | "month";

export type PeriodChanges = {
  raw: Record<string, number>;
  percentage: Record<string, number>;
};

// Generic metric interface that can be used by different metric types
export interface FormattedMetricBase {
  period_type: string;
  period_date: string;
  formatted_date: string;
  campus_name: string;
}

/**
 * Gets the SQL interval unit based on period type
 */
export function getIntervalUnit(period: PeriodType): string {
  return period === "day" ? "day" : period === "week" ? "week" : "month";
}

/**
 * Gets the view name suffix based on period type
 */
export function getViewSuffix(period: PeriodType): string {
  return period === "day" ? "daily" : period === "week" ? "weekly" : "monthly";
}

/**
 * Formats a date based on period type
 * This is for client-side formatting when database pre-formatting is not available
 */
export function formatPeriodDate(date: string, period: PeriodType): string {
  const dateObj = new Date(date);

  if (period === "day") {
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } else if (period === "week") {
    return `Week of ${dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  } else {
    return dateObj.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }
}

/**
 * Calculates period-over-period changes
 * Used for both count-based metrics and monetary metrics
 *
 * @param periods Array of period dates sorted newest to oldest
 * @param totals Record of total values for each period
 * @returns Object containing raw changes and percentage changes
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

  // For each period except the last (oldest)
  // Note: periods array is sorted newest first (periods[0] is most recent)
  for (let i = 0; i < periods.length - 1; i++) {
    const currentPeriod = periods[i]; // Newer period
    const previousPeriod = periods[i + 1]; // Older period (next in array)

    const currentValue = totals[currentPeriod] || 0;
    const previousValue = totals[previousPeriod] || 0;

    // Raw change
    raw[currentPeriod] = currentValue - previousValue;

    // Percentage change: (current-previous)/previous
    if (previousValue === 0) {
      // If previous value is 0, we can't calculate percentage change
      percentage[currentPeriod] = currentValue > 0 ? 100 : 0;
    } else {
      percentage[currentPeriod] = ((currentValue - previousValue) / previousValue) * 100;
    }
  }

  // Handle the oldest period (no previous period to compare to)
  if (periods.length > 0) {
    const oldestPeriod = periods[periods.length - 1];
    raw[oldestPeriod] = 0;
    percentage[oldestPeriod] = 0;
  }

  return { raw, percentage };
}

/**
 * Gets unique periods from raw metrics data and sorts them by date (newest to oldest)
 */
export function getSortedPeriods<T extends FormattedMetricBase>(data: T[]): string[] {
  return [...new Set(data.map((item) => item.period_date))].sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );
}

/**
 * Gets unique campuses from raw metrics data, filtering out any with "No Campus Match"
 */
export function getUniqueCampuses<T extends FormattedMetricBase>(data: T[]): string[] {
  return [...new Set(data.map((item) => item.campus_name))].filter(
    (name) => name !== "No Campus Match"
  );
}

/**
 * Gets the SQL query date filter based on period type and lookback units
 */
export function getPeriodDateFilter(period: PeriodType, lookbackUnits: number): string {
  const intervalUnit = getIntervalUnit(period);
  return `DATE_TRUNC('${intervalUnit}', CURRENT_DATE) - INTERVAL '${lookbackUnits} ${intervalUnit}'`;
}
