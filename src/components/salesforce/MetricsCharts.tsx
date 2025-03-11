import React, { useCallback, useMemo, memo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TimeSeriesData } from "@/hooks/salesforce/types";
import { chartColors } from "@/utils/chartColors";

// Define types for better safety
interface ChartDataPoint {
  date: string;
  [key: string]: string | number;
}

interface MetricsChartsProps {
  timeSeriesData: TimeSeriesData[];
  period: "daily" | "weekly" | "monthly";
}

export const MetricsCharts: React.FC<MetricsChartsProps> = memo(({ timeSeriesData, period }) => {
  // Memoize filtered data
  const displayData = useMemo(
    () => timeSeriesData.slice(0, 2), // Show only the first two metrics for simplicity
    [timeSeriesData]
  );

  // Helper function to get week number - memoized
  const getWeekNumber = useCallback((date: Date): number => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }, []);

  // Format date for x-axis based on the period - memoized
  const formatXAxis = useCallback(
    (value: string): string => {
      const date = new Date(value);
      if (period === "daily") {
        return date.toLocaleDateString("en-US", {
          month: "numeric",
          day: "numeric",
        });
      } else if (period === "weekly") {
        return `W${getWeekNumber(date)}`;
      } else {
        return date.toLocaleDateString("en-US", { month: "short" });
      }
    },
    [period, getWeekNumber]
  );

  // Format tooltip label - memoized
  const formatTooltipLabel = useCallback((label: string): string => {
    return new Date(label).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }, []);

  // Combine data for all time series - memoized
  const combinedData = useMemo<ChartDataPoint[]>(() => {
    const result: ChartDataPoint[] = [];

    if (displayData[0]?.data) {
      for (let i = 0; i < displayData[0].data.length; i++) {
        const dataPoint: ChartDataPoint = {
          date: displayData[0].data[i].date,
        };

        displayData.forEach((series) => {
          if (series.data[i]) {
            dataPoint[series.id] = series.data[i].value;
          }
        });

        result.push(dataPoint);
      }
    }

    return result;
  }, [displayData]);

  // Memoize chart line components
  const lineComponents = useMemo(
    () =>
      displayData.map((series, index) => (
        <Line
          key={series.id}
          type="monotone"
          dataKey={series.id}
          name={series.name}
          stroke={chartColors[index % chartColors.length]}
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 6 }}
        />
      )),
    [displayData]
  );

  // Memoize legend components
  const legendComponents = useMemo(
    () =>
      displayData.map((series, index) => (
        <div key={series.id} className="flex items-center">
          <div
            className="w-3 h-3 rounded-full mr-2"
            style={{
              backgroundColor: chartColors[index % chartColors.length],
            }}
          />
          <span className="text-sm">{series.name}</span>
        </div>
      )),
    [displayData]
  );

  // Format tooltip value - memoized
  const formatTooltipValue = useCallback((value: number) => {
    return [Number(value).toLocaleString("en-US"), ""];
  }, []);

  return (
    <div className="w-full mt-4">
      <div className="grid grid-cols-1 gap-y-8">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={combinedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="date" tickFormatter={formatXAxis} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} width={45} />
              <Tooltip formatter={formatTooltipValue} labelFormatter={formatTooltipLabel} />
              {lineComponents}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex justify-center space-x-6">{legendComponents}</div>
      </div>
    </div>
  );
});
