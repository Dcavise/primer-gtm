import React, { useState, useMemo, useEffect } from "react";
// Import individual UI components
import { Card } from "../components/ui/card";
import { CardContent } from "../components/ui/card";
import { CardHeader } from "../components/ui/card";
import { CardTitle } from "../components/ui/card";
import { CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Popover } from "../components/ui/popover";
import { PopoverContent } from "../components/ui/popover";
import { PopoverTrigger } from "../components/ui/popover";
import { Skeleton } from "../components/ui/skeleton";
import { DollarSign as DollarSignIcon } from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { useCampuses } from "../hooks/useCampuses";
import { useFormattedLeadsMetrics } from "../hooks/useFormattedLeadsMetrics";
import { useFormattedConvertedLeadsMetrics } from "../hooks/useFormattedConvertedLeadsMetrics";
import { useFormattedClosedWonMetrics } from "../hooks/useFormattedClosedWonMetrics";
import { useFormattedArrMetrics } from "../hooks/useFormattedArrMetrics";
import { useFormattedCumulativeARRMetrics, FormattedCumulativeARRResponse } from "../hooks/useFormattedCumulativeARRMetrics";
import { useTotalEnrolled } from "../hooks/useTotalEnrolled";
import { useGradeBandEnrollment } from "../hooks/useGradeBandEnrollment";
import { LoadingState } from "../components/LoadingState";
import ErrorState from "../components/ErrorState";

// Sample metrics data for non-lead metrics
const admissionsMetrics = [
  {
    id: "leads-converted",
    name: "Leads Converted",
    weekToDate: { value: 42.8, change: +2.8 },
    last7Days: { value: 24.3, change: +0.1 },
    last28Days: { value: 112.8, change: -0.3 },
  },
  {
    id: "admission-offered",
    name: "Admission Offered",
    weekToDate: { value: 22.5, change: -5.9 },
    last7Days: { value: 12.1, change: -22.1 },
    last28Days: { value: 84.9, change: +60.2 },
  },
  {
    id: "closed-won",
    name: "New Closed Won",
    weekToDate: { value: 16.7, change: +2.5 },
    last7Days: { value: 8.1, change: +4.8 },
    last28Days: { value: 28.5, change: -7.5 },
  },
  {
    id: "arr-added",
    name: "ARR Added",
    weekToDate: { value: 27.2, change: +3.8 },
    last7Days: { value: 12.5, change: +6.2 },
    last28Days: { value: 105.8, change: +8.3 },
  },
];

const AdmissionsAnalytics = () => {
  // State for period selection - isolated to this component only
  const [periodType, setPeriodType] = useState<"day" | "week" | "month">("week");
  const [selectedCampus, setSelectedCampus] = useState<string>("all");

  // Default lookback units based on period - specific to this component
  const lookbackUnits = periodType === "day" ? 30 : periodType === "week" ? 12 : 6;

  // This serves as documentation that the period selection is exclusive to this component
  // while the campus filter is global and can be used by other components

  // Fetch campus data for dropdown
  const { campuses, isLoading: loadingCampuses } = useCampuses();

  // For filtering by campus, we use the campus name itself
  const campusFilter = useMemo(() => {
    if (selectedCampus === "all" || loadingCampuses) {
      return null;
    }
    return selectedCampus.trim(); // Remove any whitespace
  }, [selectedCampus, loadingCampuses]);

  // Fetch total enrolled count based on the campus filter
  const {
    count: totalEnrolledCount,
    loading: loadingTotalEnrolled,
    error: totalEnrolledError,
  } = useTotalEnrolled({
    campusId: campusFilter,
  });

  // Fetch grade band enrollment data
  const {
    data: gradeBandData,
    loading: loadingGradeBand,
    error: gradeBandError,
  } = useGradeBandEnrollment({
    campusId: campusFilter,
  });

  // Immediately log the grade band data after fetching
  console.log("%c Grade Band Data READY TO USE:", "color: red; font-weight: bold;", {
    gradeBandData,
    loadingGradeBand,
    gradeBandError,
    campusFilter,
  });

  // Debug gradeBandData
  useEffect(() => {
    console.log("%c Grade Band Data in component:", "color: purple; font-weight: bold", {
      gradeBandData,
      loadingGradeBand,
      gradeBandError,
      dataLength: gradeBandData?.length || 0,
      campusFilter,
    });

    // Check if data is in the expected format
    if (gradeBandData) {
      gradeBandData.forEach((item, index) => {
        console.log(`Grade band item ${index}:`, item);
      });
    }
  }, [gradeBandData, loadingGradeBand, gradeBandError, campusFilter]);

  // Fetch leads metrics from the formatted Supabase view
  const {
    data: metricsData,
    loading: loadingMetrics,
    error: metricsError,
  } = useFormattedLeadsMetrics({
    period: periodType,
    lookbackUnits,
    campusId: campusFilter,
  });

  // Fetch converted leads metrics from the Supabase view
  const {
    data: convertedMetricsData,
    loading: loadingConvertedMetrics,
    error: convertedMetricsError,
  } = useFormattedConvertedLeadsMetrics({
    period: periodType,
    lookbackUnits,
    campusId: campusFilter,
  });

  // Fetch closed won metrics from the Supabase view
  const {
    data: closedWonMetricsData,
    loading: loadingClosedWonMetrics,
    error: closedWonMetricsError,
  } = useFormattedClosedWonMetrics({
    period: periodType,
    lookbackUnits,
    campusId: campusFilter,
  });

  // Fetch ARR metrics from the Supabase view
  const {
    data: arrMetricsData,
    loading: loadingArrMetrics,
    error: arrMetricsError,
  } = useFormattedArrMetrics({
    period: periodType,
    lookbackUnits,
    campusId: campusFilter,
  });
  
  // Fetch Cumulative ARR metrics from the Supabase view
  const {
    data: cumulativeArrMetricsData,
    loading: loadingCumulativeArrMetrics,
    error: cumulativeArrMetricsError,
  } = useFormattedCumulativeARRMetrics({
    period: periodType,
    lookbackUnits,
    campusId: campusFilter,
  });
  
  // State for storing cumulative ARR data
  const [cumulativeArrData, setCumulativeArrData] = useState<FormattedCumulativeARRResponse | null>(null);
  
  // Update cumulative ARR data when it changes and add debugging
  useEffect(() => {
    if (cumulativeArrMetricsData) {
      console.log("cumulativeArrMetricsData structure:", cumulativeArrMetricsData);
      console.log("Sample data:", cumulativeArrMetricsData.timeSeriesData?.slice(0, 3));
      console.log("Selected campus:", selectedCampus);
      console.log("Filtered data for campus:", 
        cumulativeArrMetricsData.timeSeriesData?.filter(item => 
          selectedCampus === 'all' || item.campuses[selectedCampus]
        )
      );
      setCumulativeArrData(cumulativeArrMetricsData);
    }
  }, [cumulativeArrMetricsData, selectedCampus]);

  // Helper to format values for display
  const formatValue = (value: number | null | undefined, isARR: boolean = false) => {
    // Check for null, undefined, NaN, 0, or empty string converted to a number
    if (value === null || value === undefined || isNaN(Number(value)) || Number(value) === 0) {
      return isARR ? "$0" : "0";
    }

    const numValue = Number(value);

    if (isARR) {
      // Format ARR values with $ and 'k' for thousands
      return numValue >= 1000 ? `$${(numValue / 1000).toFixed(1)}k` : `$${numValue.toFixed(0)}`;
    } else {
      // Format all other metrics with just the number and 'k' for thousands
      return numValue >= 1000 ? `${(numValue / 1000).toFixed(1)}k` : `${numValue.toFixed(0)}`;
    }
  };

  // Helper to format change percentages
  const formatChange = (change: number) => {
    // Check for null, undefined, or NaN
    if (change === null || change === undefined || Number.isNaN(change)) {
      return "0.0";
    }

    const numChange = Number(change);
    const sign = numChange > 0 ? "+" : "";
    return `${sign}${numChange.toFixed(1)}`;
  };

  // Helper to get appropriate color class for change values
  const getChangeColor = (change: number) => {
    return change >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  };

  // Generate default date columns based on period type and metric type
  const generateDefaultDateColumns = (
    periodType: "day" | "week" | "month",
    metricType: "leads" | "converted" | "closedWon" | "arr" | "cumulativeArr" = "leads"
  ) => {
    const today = new Date();
    const result = [];

    for (let i = 0; i < 5; i++) {
      const date = new Date(today);

      if (periodType === "day") {
        date.setDate(date.getDate() - i);
      } else if (periodType === "week") {
        date.setDate(date.getDate() - i * 7);
      } else {
        // month
        date.setMonth(date.getMonth() - i);
      }

      let displayDate = `${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getDate().toString().padStart(2, "0")}/${date.getFullYear().toString().slice(2)}`;

      if (i === 0) {
        if (periodType === "day") displayDate = "Today";
        else if (periodType === "week") displayDate = "Week to Date";
        else if (periodType === "month") displayDate = "Month to Date";
      }

      // Create the base object with common properties
      const baseObject = {
        period: date.toISOString(),
        date: displayDate,
      };

      // Add the metric-specific property
      if (metricType === "leads") {
        result.push({
          ...baseObject,
          leadsCreated: 0,
          percentChange: 0,
        });
      } else if (metricType === "converted") {
        result.push({
          ...baseObject,
          leadsConverted: 0,
          percentChange: 0,
        });
      } else if (metricType === "closedWon") {
        result.push({
          ...baseObject,
          closedWon: 0,
          percentChange: 0,
        });
      } else if (metricType === "arr") {
        result.push({
          ...baseObject,
          arrAmount: 0,
          percentChange: 0,
        });
      } else if (metricType === "cumulativeArr") {
        result.push({
          ...baseObject,
          cumulativeArrAmount: 0,
          percentChange: 0,
        });
      }
    }

    return result;
  };

  // Get a unified list of all periods from all data sources
  const allPeriods = useMemo(() => {
    // Collect all unique periods from all data sources
    const periodSet = new Set<string>();

    // Add periods from leads metrics
    if (metricsData && !loadingMetrics && metricsData.periods.length > 0) {
      metricsData.periods.forEach((period) => periodSet.add(period));
    }

    // Add periods from converted leads metrics
    if (
      convertedMetricsData &&
      !loadingConvertedMetrics &&
      convertedMetricsData.periods.length > 0
    ) {
      convertedMetricsData.periods.forEach((period) => periodSet.add(period));
    }

    // Add periods from closed won metrics
    if (
      closedWonMetricsData &&
      !loadingClosedWonMetrics &&
      closedWonMetricsData.periods.length > 0
    ) {
      closedWonMetricsData.periods.forEach((period) => periodSet.add(period));
    }

    // Add periods from ARR metrics
    if (arrMetricsData && !loadingArrMetrics && arrMetricsData.periods.length > 0) {
      arrMetricsData.periods.forEach((period) => periodSet.add(period));
    }
    
    // Add periods from Cumulative ARR metrics
    if (cumulativeArrMetricsData && !loadingCumulativeArrMetrics && cumulativeArrMetricsData.periods.length > 0) {
      cumulativeArrMetricsData.periods.forEach((period) => periodSet.add(period));
    }

    // Convert to array and sort
    const allPeriodsArray = Array.from(periodSet);

    // If we have periods, sort them by date (newest first)
    if (allPeriodsArray.length > 0) {
      allPeriodsArray.sort((a, b) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateB.getTime() - dateA.getTime();
      });

      // Return only the 5 most recent periods
      return allPeriodsArray.slice(0, 5);
    }

    // If no periods found, return empty array
    return [];
  }, [
    metricsData,
    loadingMetrics,
    convertedMetricsData,
    loadingConvertedMetrics,
    closedWonMetricsData,
    loadingClosedWonMetrics,
    arrMetricsData,
    loadingArrMetrics,
    cumulativeArrMetricsData,
    loadingCumulativeArrMetrics,
  ]);

  // Process data for the column display
  const columnData = useMemo(() => {
    if (!metricsData || loadingMetrics || allPeriods.length === 0) {
      return generateDefaultDateColumns(periodType, "leads");
    }

    // Map periods to display format
    return allPeriods.map((period, index) => {
      // Find the formatted date for this period
      const periodItem = metricsData?.timeSeriesData?.find((item) => item.period === period);
      let displayDate = periodItem?.formatted_date || "";

      // For the most recent period, use a special label
      if (index === 0) {
        if (periodType === "day") displayDate = "Today";
        else if (periodType === "week") displayDate = "Week to Date";
        else if (periodType === "month") displayDate = "Month to Date";
      }

      return {
        period,
        date: displayDate || period, // Fallback to period if formatted_date is not available
        leadsCreated: metricsData?.totals?.[period] ?? 0,
        percentChange: metricsData?.changes?.percentage?.[period] ?? 0,
      };
    });
  }, [metricsData, loadingMetrics, periodType, allPeriods]);

  // Process data for the converted leads display
  const convertedColumnData = useMemo(() => {
    if (!convertedMetricsData || loadingConvertedMetrics || allPeriods.length === 0) {
      return generateDefaultDateColumns(periodType, "converted");
    }

    // Map periods to display format
    return allPeriods.map((period, index) => {
      // Find the formatted date for this period
      const periodItem = convertedMetricsData?.timeSeriesData?.find(
        (item) => item.period === period
      );
      let displayDate = periodItem?.formatted_date || "";

      // For the most recent period, use a special label
      if (index === 0) {
        if (periodType === "day") displayDate = "Today";
        else if (periodType === "week") displayDate = "Week to Date";
        else if (periodType === "month") displayDate = "Month to Date";
      }

      return {
        period,
        date: displayDate || period, // Fallback to period if formatted_date is not available
        leadsConverted: convertedMetricsData?.totals?.[period] ?? 0,
        percentChange: convertedMetricsData?.changes?.percentage?.[period] ?? 0,
      };
    });
  }, [convertedMetricsData, loadingConvertedMetrics, periodType, allPeriods]);

  // Process data for the closed won display
  const closedWonColumnData = useMemo(() => {
    if (!closedWonMetricsData || loadingClosedWonMetrics || allPeriods.length === 0) {
      return generateDefaultDateColumns(periodType, "closedWon");
    }

    // Map periods to display format
    return allPeriods.map((period, index) => {
      // Find the formatted date for this period
      const periodItem = closedWonMetricsData?.timeSeriesData?.find(
        (item) => item.period === period
      );
      let displayDate = periodItem?.formatted_date || "";

      // For the most recent period, use a special label
      if (index === 0) {
        if (periodType === "day") displayDate = "Today";
        else if (periodType === "week") displayDate = "Week to Date";
        else if (periodType === "month") displayDate = "Month to Date";
      }

      return {
        period,
        date: displayDate || period, // Fallback to period if formatted_date is not available
        closedWon: closedWonMetricsData?.totals?.[period] ?? 0,
        percentChange: closedWonMetricsData?.changes?.percentage?.[period] ?? 0,
      };
    });
  }, [closedWonMetricsData, loadingClosedWonMetrics, periodType, allPeriods]);

  // Process data for the ARR display
  const arrColumnData = useMemo(() => {
    if (!arrMetricsData || loadingArrMetrics || allPeriods.length === 0) {
      return generateDefaultDateColumns(periodType, "arr");
    }

    // Map periods to display format
    return allPeriods.map((period, index) => {
      // Find the formatted date for this period
      const periodItem = arrMetricsData?.timeSeriesData?.find((item) => item.period === period);
      let displayDate = periodItem?.formatted_date || "";

      // For the most recent period, use a special label
      if (index === 0) {
        if (periodType === "day") displayDate = "Today";
        else if (periodType === "week") displayDate = "Week to Date";
        else if (periodType === "month") displayDate = "Month to Date";
      }

      return {
        period,
        date: displayDate || period, // Fallback to period if formatted_date is not available
        arrAmount: arrMetricsData?.totals?.[period] ?? 0,
        percentChange: arrMetricsData?.changes?.percentage?.[period] ?? 0,
      };
    });
  }, [arrMetricsData, loadingArrMetrics, periodType, allPeriods]);
  
  // Process data for the Cumulative ARR display
  const cumulativeArrColumnData = useMemo(() => {
    if (!cumulativeArrMetricsData || loadingCumulativeArrMetrics || allPeriods.length === 0) {
      return generateDefaultDateColumns(periodType, "cumulativeArr");
    }

    // Map periods to display format
    return allPeriods.map((period, index) => {
      // Find the formatted date for this period
      const periodItem = cumulativeArrMetricsData?.timeSeriesData?.find((item) => item.period === period);
      let displayDate = periodItem?.formatted_date || "";

      // For the most recent period, use a special label
      if (index === 0) {
        if (periodType === "day") displayDate = "Today";
        else if (periodType === "week") displayDate = "Week to Date";
        else if (periodType === "month") displayDate = "Month to Date";
      }

      return {
        period,
        date: displayDate || period, // Fallback to period if formatted_date is not available
        cumulativeArrAmount: cumulativeArrMetricsData?.totals?.[period] ?? 0,
        percentChange: cumulativeArrMetricsData?.changes?.percentage?.[period] ?? 0,
      };
    });
  }, [cumulativeArrMetricsData, loadingCumulativeArrMetrics, periodType, allPeriods]);
  
  // Calculate ARR data for the metrics table
  const cumulativeArrRowData = useMemo(() => {
    if (!cumulativeArrData) return null;
    
    console.log("Raw cumulative ARR data:", cumulativeArrData);
    console.log("Building cumulativeArrRowData with:", { 
      selectedCampus,
      periods: cumulativeArrData.periods,
      availableCampuses: cumulativeArrData.campuses,
      timeSeriesLength: cumulativeArrData.timeSeriesData.length
    });
    
    const { periods, timeSeriesData, campuses, campusTotals, changes, getARRValue } = cumulativeArrData;
    // Get periods for column headers - reverse to get oldest first
    const columnPeriods = [...periods].reverse();
    console.log("Reversed column periods:", columnPeriods);
    
    // Format ARR values as currency
    const formatARR = (value: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(value);
    };
    // Check and log values for debugging
    const valuesByPeriod = columnPeriods.map(period => {
      if (!selectedCampus || selectedCampus === 'all') {
        const periodData = timeSeriesData.find(d => d.period === period);
        return {
          period,
          foundPeriodData: !!periodData,
          total: periodData ? periodData.total : 0
        };
      } else {
        const value = getARRValue(period, selectedCampus);
        return {
          period,
          campus: selectedCampus,
          campusValue: value
        };
      }
    });
    
    console.log("Values by period:", valuesByPeriod);
    
    return {
      periods: columnPeriods,
      rowData: {
        id: 'arr',
        name: '25/26 Cumulative ARR',
        description: 'Cumulative Annual Recurring Revenue for 25/26 school year',
        icon: DollarSignIcon,
        values: columnPeriods.map(period => {
          // For 'all' campus view or no selection, show the total for this period
          if (!selectedCampus || selectedCampus === 'all') {
            const periodData = timeSeriesData.find(d => d.period === period);
            return {
              rawValue: periodData ? periodData.total : 0,
              displayValue: formatARR(periodData ? periodData.total : 0),
            };
          } 
          // For specific campus, show just that campus value
          else {
            const value = getARRValue(period, selectedCampus);
            return {
              rawValue: value,
              displayValue: formatARR(value),
            };
          }
        }),
        // Current value is the latest (right-most) column
        current: {
          rawValue: columnPeriods.length > 0 
            ? (selectedCampus && selectedCampus !== 'all'
              ? getARRValue(columnPeriods[columnPeriods.length - 1], selectedCampus)
              : timeSeriesData.find(d => d.period === columnPeriods[columnPeriods.length - 1])?.total || 0)
            : 0,
          displayValue: formatARR(
            columnPeriods.length > 0 
            ? (selectedCampus && selectedCampus !== 'all'
              ? getARRValue(columnPeriods[columnPeriods.length - 1], selectedCampus)
              : timeSeriesData.find(d => d.period === columnPeriods[columnPeriods.length - 1])?.total || 0)
            : 0
          ),
        },
        // Change from previous period
        change: {
          rawValue: changes.raw[columnPeriods[columnPeriods.length - 1]] || 0,
          displayValue: formatARR(changes.raw[columnPeriods[columnPeriods.length - 1]] || 0),
          percentageChange: changes.percentage[columnPeriods[columnPeriods.length - 1]] || 0,
          isPositive: (changes.raw[columnPeriods[columnPeriods.length - 1]] || 0) >= 0,
        },
        // Custom formatter for this row (currency format)
        valueFormatter: formatARR,
      },
    };
  }, [cumulativeArrData, selectedCampus]);

  // If there's an error, show error state
  if (
    metricsError ||
    convertedMetricsError ||
    closedWonMetricsError ||
    arrMetricsError ||
    cumulativeArrMetricsError ||
    totalEnrolledError ||
    gradeBandError
  ) {
    return (
      <ErrorState
        message="Failed to load admissions data"
        error={
          metricsError ||
          convertedMetricsError ||
          closedWonMetricsError ||
          arrMetricsError ||
          cumulativeArrMetricsError ||
          totalEnrolledError ||
          gradeBandError
        }
      />
    );
  }

  return (
    <div
      className="container mx-auto py-6 px-8 max-w-7xl bg-gray-50"
      data-component-name="AdmissionsAnalytics"
    >
      {/* Dashboard header */}
      <Card className="mb-8 border border-platinum bg-white overflow-hidden rounded-lg shadow-sm">
        <div className="px-0">
          <div className="flex flex-wrap items-center justify-between p-5 bg-white">
            {/* Campus Selection */}
            <div className="w-full md:w-1/3 mb-3 md:mb-0 md:mr-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full border border-platinum rounded-md px-4 py-2 shadow-sm hover:border-french-gray focus:outline-none bg-white justify-between"
                  >
                    <div className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2 text-slate-gray"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      <span>
                        {loadingMetrics || loadingCampuses ? (
                          <Skeleton className="h-5 w-24" />
                        ) : selectedCampus === "all" ? (
                          "All Campuses"
                        ) : (
                          selectedCampus
                        )}
                      </span>
                    </div>
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 15 15"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="ml-2 h-4 w-4 shrink-0 opacity-50"
                    >
                      <path
                        d="M4.93179 5.43179C4.75605 5.60753 4.75605 5.89245 4.93179 6.06819C5.10753 6.24392 5.39245 6.24392 5.56819 6.06819L7.49999 4.13638L9.43179 6.06819C9.60753 6.24392 9.89245 6.24392 10.0682 6.06819C10.2439 5.89245 10.2439 5.60753 10.0682 5.43179L7.81819 3.18179C7.73379 3.0974 7.61933 3.04999 7.49999 3.04999C7.38064 3.04999 7.26618 3.0974 7.18179 3.18179L4.93179 5.43179ZM10.0682 9.56819C10.2439 9.39245 10.2439 9.10753 10.0682 8.93179C9.89245 8.75606 9.60753 8.75606 9.43179 8.93179L7.49999 10.8636L5.56819 8.93179C5.39245 8.75606 5.10753 8.75606 4.93179 8.93179C4.75605 9.10753 4.75605 9.39245 4.93179 9.56819L7.18179 11.8182C7.26618 11.9026 7.38064 11.95 7.49999 11.95C7.61933 11.95 7.73379 11.9026 7.81819 11.8182L10.0682 9.56819Z"
                        fill="currentColor"
                        fillRule="evenodd"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[300px]" align="start">
                  {loadingMetrics ? (
                    <div className="p-4">
                      <Skeleton className="h-6 w-full mb-2" />
                      <Skeleton className="h-6 w-full mb-2" />
                      <Skeleton className="h-6 w-full" />
                    </div>
                  ) : (
                    <div className="p-1 overflow-auto max-h-[300px]">
                      {/* All Campuses option */}
                      <div
                        className={`p-2 rounded cursor-pointer ${selectedCampus === "all" ? "bg-slate-100 font-medium" : "hover:bg-slate-50"}`}
                        onClick={() => setSelectedCampus("all")}
                      >
                        All Campuses
                      </div>

                      {/* Campus list */}
                      {campuses.map((campus) => (
                        <div
                          key={campus.campus_id}
                          className={`p-2 rounded cursor-pointer ${selectedCampus === campus.campus_name ? "bg-slate-100 font-medium" : "hover:bg-slate-50"}`}
                          onClick={() => setSelectedCampus(campus.campus_name)}
                        >
                          {campus.campus_name}
                        </div>
                      ))}
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>

            {/* Period Type Selection - THIS FILTER IS EXCLUSIVE TO ADMISSIONS ANALYTICS */}
            <div className="flex space-x-2" data-isolated-filter="true">
              <button
                className={`px-4 py-2 rounded-md ${periodType === "day" ? "text-seasalt" : "bg-seasalt text-outer-space border border-platinum"}`}
                style={periodType === "day" ? { backgroundColor: "#474b4f" } : {}}
                onClick={() => setPeriodType("day")}
              >
                Daily
              </button>
              <button
                className={`px-4 py-2 rounded-md ${periodType === "week" ? "text-seasalt" : "bg-seasalt text-outer-space border border-platinum"}`}
                style={periodType === "week" ? { backgroundColor: "#474b4f" } : {}}
                onClick={() => setPeriodType("week")}
              >
                Weekly
              </button>
              <button
                className={`px-4 py-2 rounded-md ${periodType === "month" ? "text-seasalt" : "bg-seasalt text-outer-space border border-platinum"}`}
                style={periodType === "month" ? { backgroundColor: "#474b4f" } : {}}
                onClick={() => setPeriodType("month")}
              >
                Monthly
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Enrollment Section */}
      <div
        className={`grid grid-cols-1 ${selectedCampus !== "all" ? "md:grid-cols-2" : ""} gap-4 mb-8`}
      >
        {/* 25/26 Enrolled KPI Card - Full width when All Campuses selected */}
        <Card className="border border-platinum bg-white overflow-hidden rounded-lg shadow-sm h-full">
          <div className="flex flex-col items-center justify-center h-full py-5">
            <h3
              className="text-lg font-semibold tracking-tight text-slate-gray text-center mb-2"
              data-component-name="_c4"
            >
              25/26 Enrolled
            </h3>

            <div className="flex flex-col items-center justify-center py-4">
              {loadingTotalEnrolled ? (
                <Skeleton className="h-12 w-28" />
              ) : (
                <div className="text-5xl font-bold text-outer-space text-center">
                  {totalEnrolledCount}
                </div>
              )}
            </div>

            <p className="text-sm text-slate-gray font-medium text-center mt-0">
              School Year 25/26
            </p>
          </div>
        </Card>

        {/* Grade Band Enrollment Table - Only visible when a specific campus is selected */}
        {selectedCampus !== "all" && (
          <Card className="border border-platinum bg-white overflow-hidden rounded-lg shadow-sm">
            <div className="flex flex-col space-y-1.5 p-6 pb-2">
              <h3 className="text-lg font-semibold tracking-tight text-slate-gray">
                Grade Band Enrollment
              </h3>
            </div>
            <CardContent>
              {loadingGradeBand ? (
                <div className="space-y-2">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left pb-2 font-medium text-slate-gray text-base">
                          Grade Band
                        </th>
                        <th className="text-right pb-2 font-medium text-slate-gray text-base">
                          Students
                        </th>
                        <th className="text-right pb-2 font-medium text-slate-gray text-base">
                          Capacity
                        </th>
                        <th className="text-right pb-2 font-medium text-slate-gray text-base">
                          % Full
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Dynamic grade band data that responds to campus selection */}
                      {["K-2", "3-5", "6-8"].map((band) => {
                        // Find the matching data item, if it exists
                        const dataItem =
                        
                          gradeBandData && Array.isArray(gradeBandData)
                            ? gradeBandData.find((item) => item?.grade_band === band)
                            : null;

                        // Get count from data or default to 0
                        const count =
                          dataItem && typeof dataItem.enrollment_count === "number"
                            ? dataItem.enrollment_count
                            : 0;

                        // Calculate percentage of capacity
                        const capacity = 25; // Hardcoded capacity per grade band
                        const percentFull = Math.round((count / capacity) * 100);

                        // Determine color based on percentage full
                        const colorClass =
                          percentFull >= 90
                            ? "bg-red-100 text-red-800"
                            : percentFull >= 75
                              ? "bg-amber-100 text-amber-800"
                              : "bg-green-100 text-green-800";

                        return (
                          <tr key={band} className="border-b border-platinum last:border-0">
                            <td className="py-2 text-left font-medium">{band}</td>
                            <td className="py-2 text-right">{count}</td>
                            <td className="py-2 text-right">{capacity}</td>
                            <td className="py-2 text-right">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${colorClass}`}
                              >
                                {percentFull}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Metrics Table */}
      <div className="mb-8 bg-white rounded-lg border border-platinum shadow-sm">
        {loadingMetrics ||
        loadingConvertedMetrics ||
        loadingClosedWonMetrics ||
        loadingArrMetrics ||
        loadingCumulativeArrMetrics ? (
          <div className="p-4">
            <LoadingState />
          </div>
        ) : (
          <div className="px-4 py-4">
            {/* Table Header */}
            <div className="flex border-b pb-3 mb-2 text-base font-medium text-slate-gray bg-gray-50 p-2 rounded-t">
              <div className="w-1/6 pl-2">Metric</div>
              {/* Reverse column data for display to show older periods on the left */}
              {[...columnData].reverse().map((item, index) => (
                <div key={index} className="w-1/6 text-center font-medium">
                  {item.date || "N/A"}
                </div>
              ))}
              <div className="w-1/3 pr-2 pl-4 text-center">Trend</div>
            </div>

            {/* Table Body */}
            <div className="flex flex-col divide-y">
              {/* Leads Created Row - Always uses real data */}
              <div className="flex py-3 items-center border-b border-platinum hover:bg-gray-50">
                <div className="w-1/6 font-medium text-outer-space text-sm">Leads Created</div>

                {/* Reverse column data for display to show older periods on the left */}
                {[...columnData].reverse().map((item, index) => (
                  <div key={index} className="w-1/6 text-center">
                    <div className="font-semibold text-eerie-black text-lg">
                      {formatValue(item.leadsCreated ?? 0)}
                    </div>
                    <div
                      className={`mt-1 text-xs px-2 py-0.5 rounded-full inline-block font-medium ${getChangeColor(item.percentChange ?? 0)}`}
                    >
                      {formatChange(item.percentChange ?? 0)}%
                    </div>
                  </div>
                ))}

                {/* Leads Created Trend */}
                <div className="w-1/3 h-16 pl-4">
                  <ResponsiveContainer width="100%" height="100%">
                    {metricsData?.timeSeriesData && metricsData.timeSeriesData.length > 0 ? (
                      <LineChart
                        data={metricsData.timeSeriesData.filter((item) =>
                          allPeriods.includes(item.period)
                        )}
                      >
                        <XAxis dataKey="formatted_date" hide />
                        <YAxis hide />
                        <Line
                          type="monotone"
                          dataKey="total"
                          stroke="#474b4f"
                          strokeWidth={2}
                          dot={{ r: 3, fill: "#474b4f", strokeWidth: 0 }}
                          activeDot={{
                            r: 4,
                            fill: "#474b4f",
                            stroke: "#fff",
                            strokeWidth: 1,
                          }}
                        />
                      </LineChart>
                    ) : (
                      <LineChart data={[{ formatted_date: "", total: 0 }]}>
                        <XAxis dataKey="formatted_date" hide />
                        <YAxis hide />
                        <Line
                          type="monotone"
                          dataKey="total"
                          stroke="#474b4f"
                          strokeWidth={2}
                          dot={{ r: 3, fill: "#474b4f", strokeWidth: 0 }}
                          activeDot={{
                            r: 4,
                            fill: "#474b4f",
                            stroke: "#fff",
                            strokeWidth: 1,
                          }}
                        />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Leads Converted Row - Uses real data */}
              <div className="flex py-3 items-center border-b border-platinum hover:bg-gray-50">
                <div className="w-1/6 font-medium text-outer-space text-sm">Leads Converted</div>

                {/* Reverse column data for display to show older periods on the left */}
                {[...convertedColumnData].reverse().map((item, index) => (
                  <div key={index} className="w-1/6 text-center">
                    <div className="font-semibold text-eerie-black text-lg">
                      {formatValue(item.leadsConverted ?? 0)}
                    </div>
                    <div
                      className={`mt-1 text-xs px-2 py-0.5 rounded-full inline-block font-medium ${getChangeColor(item.percentChange ?? 0)}`}
                    >
                      {formatChange(item.percentChange ?? 0)}%
                    </div>
                  </div>
                ))}

                {/* Leads Converted Trend */}
                <div className="w-1/3 h-16 pl-4">
                  <ResponsiveContainer width="100%" height="100%">
                    {convertedMetricsData?.timeSeriesData &&
                    convertedMetricsData.timeSeriesData.length > 0 ? (
                      <LineChart
                        data={convertedMetricsData.timeSeriesData.filter((item) =>
                          allPeriods.includes(item.period)
                        )}
                      >
                        <XAxis dataKey="formatted_date" hide />
                        <YAxis hide />
                        <Line
                          type="monotone"
                          dataKey="total"
                          stroke="#474b4f"
                          strokeWidth={2}
                          dot={{ r: 3, fill: "#474b4f", strokeWidth: 0 }}
                          activeDot={{
                            r: 4,
                            fill: "#474b4f",
                            stroke: "#fff",
                            strokeWidth: 1,
                          }}
                        />
                      </LineChart>
                    ) : (
                      <LineChart data={[{ formatted_date: "", total: 0 }]}>
                        <XAxis dataKey="formatted_date" hide />
                        <YAxis hide />
                        <Line
                          type="monotone"
                          dataKey="total"
                          stroke="#474b4f"
                          strokeWidth={2}
                          dot={{ r: 3, fill: "#474b4f", strokeWidth: 0 }}
                          activeDot={{
                            r: 4,
                            fill: "#474b4f",
                            stroke: "#fff",
                            strokeWidth: 1,
                          }}
                        />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Other Metrics Rows - Using sample data */}
              {/* New Closed Won Row - Uses real data */}
              <div className="flex py-3 items-center border-b border-platinum hover:bg-gray-50">
                <div className="w-1/6 font-medium text-outer-space text-sm">New Closed Won</div>

                {/* Reverse column data for display to show older periods on the left */}
                {[...closedWonColumnData].reverse().map((item, index) => (
                  <div key={index} className="w-1/6 text-center">
                    <div className="font-semibold text-eerie-black text-lg">
                      {formatValue(item.closedWon ?? 0)}
                    </div>
                    <div
                      className={`mt-1 text-xs px-2 py-0.5 rounded-full inline-block font-medium ${getChangeColor(item.percentChange ?? 0)}`}
                    >
                      {formatChange(item.percentChange ?? 0)}%
                    </div>
                  </div>
                ))}

                {/* New Closed Won Trend */}
                <div className="w-1/3 h-16 pl-4">
                  <ResponsiveContainer width="100%" height="100%">
                    {closedWonMetricsData?.timeSeriesData &&
                    closedWonMetricsData.timeSeriesData.length > 0 ? (
                      <LineChart
                        data={closedWonMetricsData.timeSeriesData.filter((item) =>
                          allPeriods.includes(item.period)
                        )}
                      >
                        <XAxis dataKey="formatted_date" hide />
                        <YAxis hide />
                        <Line
                          type="monotone"
                          dataKey="total"
                          stroke="#474b4f"
                          strokeWidth={2}
                          dot={{ r: 3, fill: "#474b4f", strokeWidth: 0 }}
                          activeDot={{
                            r: 4,
                            fill: "#474b4f",
                            stroke: "#fff",
                            strokeWidth: 1,
                          }}
                        />
                      </LineChart>
                    ) : (
                      <LineChart data={[{ formatted_date: "", total: 0 }]}>
                        <XAxis dataKey="formatted_date" hide />
                        <YAxis hide />
                        <Line
                          type="monotone"
                          dataKey="total"
                          stroke="#474b4f"
                          strokeWidth={2}
                          dot={{ r: 3, fill: "#474b4f", strokeWidth: 0 }}
                          activeDot={{
                            r: 4,
                            fill: "#474b4f",
                            stroke: "#fff",
                            strokeWidth: 1,
                          }}
                        />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Other Metrics Rows - Using sample data */}
              {/* ARR Added Row - Uses real data */}
              <div className="flex py-3 items-center hover:bg-gray-50">
                <div className="w-1/6 font-medium text-outer-space text-sm">ARR Added</div>

                {/* Reverse column data for display to show older periods on the left */}
                {[...arrColumnData].reverse().map((item, index) => (
                  <div key={index} className="w-1/6 text-center">
                    <div className="font-semibold text-eerie-black text-lg">
                      {formatValue(item.arrAmount ?? 0, true)}
                    </div>
                    <div
                      className={`mt-1 text-xs px-2 py-0.5 rounded-full inline-block font-medium ${getChangeColor(item.percentChange ?? 0)}`}
                    >
                      {formatChange(item.percentChange ?? 0)}%
                    </div>
                  </div>
                ))}

                {/* ARR Added Trend */}
                <div className="w-1/3 h-16 pl-4">
                  <ResponsiveContainer width="100%" height="100%">
                    {arrMetricsData?.timeSeriesData && arrMetricsData.timeSeriesData.length > 0 ? (
                      <LineChart
                        data={arrMetricsData.timeSeriesData.filter((item) =>
                          allPeriods.includes(item.period)
                        )}
                      >
                        <XAxis dataKey="formatted_date" hide />
                        <YAxis hide />
                        <Line
                          type="monotone"
                          dataKey="total"
                          stroke="#474b4f"
                          strokeWidth={2}
                          dot={{ r: 3, fill: "#474b4f", strokeWidth: 0 }}
                          activeDot={{
                            r: 4,
                            fill: "#474b4f",
                            stroke: "#fff",
                            strokeWidth: 1,
                          }}
                        />
                      </LineChart>
                    ) : (
                      <LineChart data={[{ formatted_date: "", total: 0 }]}>
                        <XAxis dataKey="formatted_date" hide />
                        <YAxis hide />
                        <Line
                          type="monotone"
                          dataKey="total"
                          stroke="#474b4f"
                          strokeWidth={2}
                          dot={{ r: 3, fill: "#474b4f", strokeWidth: 0 }}
                          activeDot={{
                            r: 4,
                            fill: "#474b4f",
                            stroke: "#fff",
                            strokeWidth: 1,
                          }}
                        />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Cumulative ARR Row - Basic debug version */}
              <div className="flex py-3 items-center border-t border-platinum hover:bg-gray-50">
                <div className="w-1/6 font-medium text-outer-space text-sm">25/26 Cumulative ARR</div>
                
                {/* Show raw data to debug */}
                <div className="w-5/6">
                  {cumulativeArrMetricsData ? (
                    <pre className="text-xs overflow-auto max-h-32">
                      {JSON.stringify({
                        latestPeriod: cumulativeArrMetricsData.latestPeriod,
                        latestTotal: cumulativeArrMetricsData.latestTotal,
                        campuses: cumulativeArrMetricsData.campuses.slice(0, 3),
                        periods: cumulativeArrMetricsData.periods.slice(0, 3),
                      }, null, 2)}
                    </pre>
                  ) : (
                    "Loading data..."
                  )}
                </div>
              </div>

              {/* Any other metrics rows - Using sample data */}
              {admissionsMetrics
                .filter(
                  (metric) =>
                    metric.id !== "leads-converted" &&
                    metric.id !== "admission-offered" &&
                    metric.id !== "closed-won" &&
                    metric.id !== "arr-added"
                )
                .map((metric) => (
                  <div
                    key={metric.id}
                    className="flex py-3 items-center border-b border-platinum hover:bg-gray-50"
                  >
                    <div className="w-1/6 font-medium text-outer-space text-sm">{metric.name}</div>

                    {/* Generate mock data cells based on period type - reversed for display */}
                    {[...columnData].reverse().map((_, index) => {
                      // Generate a random value and change for demonstration
                      const value = Math.floor(Math.random() * 15) + 5;
                      const change = Math.random() * 20 - 10;

                      return (
                        <div key={index} className="w-1/6 text-center">
                          <div className="font-semibold text-eerie-black">{formatValue(value)}</div>
                          <div
                            className={`mt-1 text-xs px-2 py-0.5 rounded-full inline-block ${getChangeColor(change)}`}
                          >
                            {formatChange(change)}%
                          </div>
                        </div>
                      );
                    })}

                    {/* Trend Line Chart */}
                    <div className="w-1/3 h-16 pl-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={metricsData?.timeSeriesData.filter((item) =>
                            allPeriods.includes(item.period)
                          )}
                        >
                          <XAxis dataKey="formatted_date" hide />
                          <YAxis hide />
                          <Line
                            type="monotone"
                            dataKey="total"
                            stroke="#474b4f"
                            strokeWidth={2}
                            dot={{ r: 3, fill: "#474b4f", strokeWidth: 0 }}
                            activeDot={{
                              r: 4,
                              fill: "#474b4f",
                              stroke: "#fff",
                              strokeWidth: 1,
                            }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdmissionsAnalytics;
