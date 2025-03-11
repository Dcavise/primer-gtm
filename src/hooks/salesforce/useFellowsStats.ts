import { supabase } from "@/integrations/supabase-client";
import { EmploymentStatusCount } from "./types";

export const fetchFellowsStats = async (
  selectedCampusIds: string[],
  handleError: (error: any, message?: string) => void,
) => {
  try {
    console.log(
      "Fetching fellows stats for campuses:",
      selectedCampusIds.length > 0
        ? selectedCampusIds.join(", ")
        : "all campuses",
    );

    // Fetch fellows count with proper filtering
    let query = supabase.from("fellows").select("*", { count: "exact" });

    // Only exclude specific statuses, keeping NULL values
    query = query
      .not("fte_employment_status", "eq", "Exiting")
      .not("fte_employment_status", "eq", "Declined FTE Offer");

    if (selectedCampusIds.length > 0) {
      // Create a filter for each campus ID
      const filters = selectedCampusIds
        .map(
          (campusId) =>
            `campus_id.eq.${campusId},campus.eq.${campusId},campus.ilike.%${campusId}%`,
        )
        .join(",");

      query = query.or(filters);
      console.log(
        `Using enhanced campus filter for campus_ids: ${selectedCampusIds.join(", ")}`,
      );
    }

    const {
      count: fellowsCount,
      error: fellowsError,
      data: fellowsData,
    } = await query;

    if (fellowsError) throw fellowsError;

    // Log fellows data for debugging
    console.log(`Found ${fellowsCount || 0} fellows matching criteria`);

    // Process employment status data
    let employmentStatusCounts: EmploymentStatusCount[] = [];

    if (fellowsData && fellowsData.length > 0) {
      console.log("Sample of fellows data:", fellowsData.slice(0, 5));

      // Calculate employment status distribution
      const statusCounts = fellowsData.reduce(
        (acc, fellow) => {
          const status = fellow.fte_employment_status || "Open";
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      console.log("Employment status distribution:", statusCounts);

      // Convert to array format for the chart
      const statusCountsArray = Object.entries(statusCounts).map(
        ([status, count]) => ({
          status,
          count,
        }),
      );

      // Sort by count in descending order
      statusCountsArray.sort((a, b) => b.count - a.count);
      employmentStatusCounts = statusCountsArray;
    }

    return { fellowsCount: fellowsCount || 0, employmentStatusCounts };
  } catch (error) {
    handleError(error, "Error fetching fellows stats");
    return { fellowsCount: 0, employmentStatusCounts: [] };
  }
};
