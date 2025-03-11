import { useState } from "react";
import { supabase } from "@/integrations/supabase-client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export function useRealEstateSync() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const refreshRealEstateData = async () => {
    setIsRefreshing(true);
    try {
      // Simply invalidate the cache to fetch fresh data from Supabase
      await queryClient.invalidateQueries({
        queryKey: ["real-estate-pipeline"],
      });
      toast.success("Real estate data refreshed successfully");
    } catch (error) {
      console.error("Error refreshing real estate data:", error);
      toast.error("Failed to refresh real estate data");
    } finally {
      setIsRefreshing(false);
    }
  };

  return {
    isRefreshing,
    refreshRealEstateData,
  };
}
