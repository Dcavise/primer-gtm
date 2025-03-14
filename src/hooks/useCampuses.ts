import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Campus } from "@/types";
import { toast } from "sonner";
import { logger } from "@/utils/logger";
import { handleError, tryCatch, ErrorType } from "@/utils/error-handler";
import { getLeadSummaryByCampus } from "../utils/salesforce-data-access";

// Query key for type safety and reuse
export const CAMPUS_QUERY_KEY = ["campuses"] as const;

/**
 * Fetch campuses function that can be used outside of React components
 * Uses salesforce-data-access.ts module with a fallback to mock data
 */
export async function fetchCampuses(): Promise<Campus[]> {
  try {
    // Get campuses from the data access layer
    const response = await getLeadSummaryByCampus();
    
    if (response.success && response.data && response.data.length > 0) {
      // Map the data to the expected Campus interface
      return response.data.map(item => ({
        campus_id: item.campus_name,
        campus_name: item.campus_name
      }));
    } else {
      // Fallback to mock data if no data or error
      logger.warn("Falling back to mock campus data");
      return [
        { campus_id: "Atlanta", campus_name: "Atlanta" },
        { campus_id: "Miami", campus_name: "Miami" },
        { campus_id: "New York", campus_name: "New York" },
        { campus_id: "Birmingham", campus_name: "Birmingham" },
        { campus_id: "Chicago", campus_name: "Chicago" },
      ];
    }
  } catch (error) {
    // Log error and return mock data on exception
    logger.error("Error fetching campuses:", error);
    return [
      { campus_id: "Atlanta", campus_name: "Atlanta" },
      { campus_id: "Miami", campus_name: "Miami" },
      { campus_id: "New York", campus_name: "New York" },
      { campus_id: "Birmingham", campus_name: "Birmingham" },
      { campus_id: "Chicago", campus_name: "Chicago" },
    ];
  }
}

/**
 * Hook for fetching and managing campus data
 * @returns Campus data query with refetch function
 */
export const useCampuses = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: CAMPUS_QUERY_KEY,
    queryFn: fetchCampuses,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  // Manual refresh function that shows a toast notification
  const refreshCampuses = async (): Promise<boolean> => {
    return (
      tryCatch(
        async () => {
          await queryClient.refetchQueries({ queryKey: CAMPUS_QUERY_KEY });
          toast.success("Campus data refreshed");
          return true;
        },
        "Failed to refresh campuses",
        true,
        { context: "refreshCampuses" }
      ) !== null
    );
  };

  return {
    ...query,
    campuses: query.data || [],
    refreshCampuses,
  };
};