import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase-client";
import {
  SummaryStats,
  EmploymentStatusCount,
  WeeklyLeadCount,
  OpportunityStageCount,
} from "./types";
import { useBaseStats } from "./useBaseStats";
import { fetchFellowsStats } from "./useFellowsStats";
import { fetchLeadsStats } from "./useLeadsStats";
import { fetchOpportunitiesStats } from "./useOpportunitiesStats";
import { logger } from "@/utils/logger";

export const useStats = (selectedCampusIds: string[]) => {
  const { stats, setStats, lastRefreshed, setLastRefreshed, handleError } =
    useBaseStats();
  const [employmentStatusCounts, setEmploymentStatusCounts] = useState<
    EmploymentStatusCount[]
  >([]);
  const [weeklyLeadCounts, setWeeklyLeadCounts] = useState<WeeklyLeadCount[]>(
    [],
  );
  const [opportunityStageCounts, setOpportunityStageCounts] = useState<
    OpportunityStageCount[]
  >([]);

  useEffect(() => {
    logger.info(
      `useStats effect triggered with ${selectedCampusIds.length} campus IDs`,
    );
    fetchStats();
    setLastRefreshed(new Date());
  }, [selectedCampusIds]);

  const fetchStats = async () => {
    try {
      logger.timeStart("fetchAllStats");
      logger.info(
        `Fetching stats for campuses: ${selectedCampusIds.length > 0 ? selectedCampusIds.join(", ") : "all campuses"}`,
      );

      // Log available campuses for debugging
      const { data: allCampuses, error: campusesError } = await supabase
        .from("campuses")
        .select("campus_id, campus_name");

      if (campusesError) {
        logger.error("Error fetching campuses:", campusesError);
      } else {
        logger.debug("Available campuses:", allCampuses);
      }

      // Fetch fellows stats
      logger.timeStart("fetchFellowsStats");
      const fellowsResult = await fetchFellowsStats(
        selectedCampusIds,
        handleError,
      );
      logger.timeEnd("fetchFellowsStats");
      logger.debug("Fellows stats result:", fellowsResult);
      setEmploymentStatusCounts(fellowsResult.employmentStatusCounts);

      // Fetch leads stats
      logger.timeStart("fetchLeadsStats-fromUseStats");
      const leadsResult = await fetchLeadsStats(selectedCampusIds, handleError);
      logger.timeEnd("fetchLeadsStats-fromUseStats");
      logger.debug("Leads stats result:", leadsResult);
      setWeeklyLeadCounts(leadsResult.weeklyLeadCounts);

      // Fetch opportunities stats
      logger.timeStart("fetchOpportunitiesStats-fromUseStats");
      const opportunitiesResult = await fetchOpportunitiesStats(
        selectedCampusIds,
        handleError,
      );
      logger.timeEnd("fetchOpportunitiesStats-fromUseStats");
      logger.debug("Opportunities stats result:", opportunitiesResult);
      setOpportunityStageCounts(opportunitiesResult.opportunityStageCounts);

      // Update combined stats
      const updatedStats: SummaryStats = {
        fellowsCount: fellowsResult.fellowsCount,
        leadsCount: leadsResult.leadsCount,
        activeOpportunitiesCount: opportunitiesResult.activeOpportunitiesCount,
        closedWonOpportunitiesCount:
          opportunitiesResult.closedWonOpportunitiesCount,
      };

      logger.info("Stats fetched successfully:", updatedStats);

      // Update stats
      setStats(updatedStats);
      setLastRefreshed(new Date());
      logger.timeEnd("fetchAllStats");
    } catch (error) {
      logger.error("Error in fetchStats", error);
      handleError(error);
    }
  };

  return {
    stats,
    employmentStatusCounts,
    weeklyLeadCounts,
    opportunityStageCounts,
    lastRefreshed,
    fetchStats,
  };
};
