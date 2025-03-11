import { useState, useCallback, useEffect } from "react";
import { logger } from "@/utils/logger";
import { useSupabaseQuery } from "./useSupabaseQuery";

export interface EmploymentStatusCount {
  status: string;
  count: number;
}

interface FellowsStats {
  fellowsCount: number;
  employmentStatusCounts: EmploymentStatusCount[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Hook for fetching and managing fellows statistics
 * @param selectedCampusIds - Array of campus IDs to filter by
 * @returns Fellows statistics and control functions
 */
export function useFellowsStats(selectedCampusIds: string[]): FellowsStats {
  const [fellowsCount, setFellowsCount] = useState(0);
  const [employmentStatusCounts, setEmploymentStatusCounts] = useState<EmploymentStatusCount[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // Use our base Supabase query hook
  const {
    loading: isLoading,
    error,
    queryTable,
  } = useSupabaseQuery<{
    fellowsCount: number;
    employmentStatusCounts: EmploymentStatusCount[];
  }>({
    logTiming: true,
    mockDataFn: () => generateMockFellowsData(),
  });

  // Function to fetch fellows stats
  const fetchFellowsStats = useCallback(async () => {
    logger.info(
      `Fetching fellows stats for campuses: ${selectedCampusIds.length > 0 ? selectedCampusIds.join(", ") : "all campuses"}`
    );

    // Query fellows data
    const fellowsData = await queryTable<any[]>("fellows", (query) => {
      // Base query excluding specific statuses
      let baseQuery = query
        .select("*", { count: "exact" })
        .not("fte_employment_status", "eq", "Exiting")
        .not("fte_employment_status", "eq", "Declined FTE Offer");

      // Add campus filtering if needed
      if (selectedCampusIds.length > 0) {
        // Create a filter for each campus ID
        const filters = selectedCampusIds
          .map(
            (campusId) =>
              `campus_id.eq.${campusId},campus.eq.${campusId},campus.ilike.%${campusId}%`
          )
          .join(",");

        baseQuery = baseQuery.or(filters);
        logger.info(`Using enhanced campus filter for campus_ids: ${selectedCampusIds.join(", ")}`);
      }

      return baseQuery;
    });

    if (fellowsData && Array.isArray(fellowsData)) {
      logger.info(`Found ${fellowsData.length} fellows matching criteria`);
      setFellowsCount(fellowsData.length);

      // Process employment status data
      if (fellowsData.length > 0) {
        // Calculate employment status distribution
        const statusCounts = fellowsData.reduce(
          (acc, fellow) => {
            const status = fellow.fte_employment_status || "Open";
            acc[status] = (acc[status] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );

        // Convert to array format for the chart
        const statusCountsArray = Object.entries(statusCounts).map(([status, count]) => ({
          status,
          count,
        }));

        // Sort by count in descending order
        statusCountsArray.sort((a, b) => b.count - a.count);
        setEmploymentStatusCounts(statusCountsArray);

        setLastRefreshed(new Date());
        return {
          fellowsCount: fellowsData.length,
          employmentStatusCounts: statusCountsArray,
        };
      }
    }

    // Fallback to mock data if needed
    const mockData = generateMockFellowsData();
    setFellowsCount(mockData.fellowsCount);
    setEmploymentStatusCounts(mockData.employmentStatusCounts);
    setLastRefreshed(new Date());
    return mockData;
  }, [queryTable, selectedCampusIds]);

  // Fetch data on mount and when campuses change
  useEffect(() => {
    fetchFellowsStats();
  }, [fetchFellowsStats]);

  // Helper function to generate mock data
  function generateMockFellowsData() {
    logger.info("Generating mock fellows data");

    const statuses = ["Active", "In Progress", "Open", "On Hold", "Paused"];
    const mockStatusCounts = statuses.map((status) => ({
      status,
      count: Math.floor(Math.random() * 20) + 5,
    }));

    const totalFellows = mockStatusCounts.reduce((sum, item) => sum + item.count, 0);

    return {
      fellowsCount: totalFellows,
      employmentStatusCounts: mockStatusCounts,
    };
  }

  return {
    fellowsCount,
    employmentStatusCounts,
    isLoading,
    error,
    refresh: fetchFellowsStats,
  };
}
