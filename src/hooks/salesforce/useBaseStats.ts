import { useState } from "react";
import { toast } from "sonner";
import { SummaryStats } from "./types";

export const useBaseStats = () => {
  const [stats, setStats] = useState<SummaryStats>({
    fellowsCount: 0,
    leadsCount: 0,
    activeOpportunitiesCount: 0,
    closedWonOpportunitiesCount: 0,
  });
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const handleError = (
    error: any,
    message: string = "Failed to load analytics data",
  ) => {
    console.error(message, error);
    toast.error(message);
  };

  return {
    stats,
    setStats,
    lastRefreshed,
    setLastRefreshed,
    handleError,
  };
};
