import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase-client";
import { Campus } from "@/types";
import { toast } from "sonner";
import { logger } from "@/utils/logger";
import { handleError, tryCatch, ErrorType } from "@/utils/error-handler";

// Query key for type safety and reuse
export const CAMPUS_QUERY_KEY = ["campuses"] as const;

/**
 * Fetch campuses function that can be used outside of React components
 */
export async function fetchCampuses(): Promise<Campus[]> {
  try {
    // Get campuses that have at least one closed won opportunity for the 25/26 school year
    const { data: campusData, error: campusError } = await supabase.rpc("execute_sql_query", {
      query_text: `
        SELECT DISTINCT o.preferred_campus_c as campus_name
        FROM fivetran_views.opportunity o
        WHERE o.preferred_campus_c IS NOT NULL
          AND o.is_closed = true
          AND o.is_won = true
          AND o.school_year_c = '25/26'
        ORDER BY o.preferred_campus_c
      `,
    });

    if (campusError) {
      console.error("Error fetching campus data with closed won opportunities:", campusError);
      throw new Error("Failed to fetch campus data");
    }

    // Check if campusData is an array before mapping
    if (!campusData || !Array.isArray(campusData)) {
      console.error("Invalid campus data format:", campusData);
      return [];
    }

    // Map results to the expected Campus interface format
    const campuses = campusData.map((item: { campus_name: string }) => ({
      campus_id: item.campus_name, // Use the campus name as the ID for filtering
      campus_name: item.campus_name,
    }));

    console.log("Fetched", campuses.length, "campuses with closed won opportunities for 25/26");
    return campuses;
  } catch (err) {
    console.error("Error in fetchCampuses:", err);
    throw new Error(
      "Failed to fetch campuses data: " + (err instanceof Error ? err.message : String(err))
    );
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