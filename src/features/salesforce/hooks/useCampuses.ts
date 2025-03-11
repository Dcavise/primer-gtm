import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
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
  const { data, error } = await supabase
    .from("campuses")
    .select("*")
    .order("campus_name", { ascending: true });

  if (error) {
    handleError(
      {
        code: error.code,
        message: error.message,
      },
      false,
      { context: "fetchCampuses" }
    );

    throw new Error("Failed to fetch campuses data");
  }

  return data || [];
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
