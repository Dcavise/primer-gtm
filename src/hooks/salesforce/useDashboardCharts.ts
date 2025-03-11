import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase-client";
import { logger } from "@/utils/logger";

/**
 * Type definitions for dashboard chart data
 */
export interface WeeklyLeadData {
  week: string;
  count: number;
}

export interface OpportunityStageData {
  stage_name: string;
  campus_name?: string;
  state?: string;
  count: number;
  percentage?: number;
}

/**
 * Hook for fetching dashboard chart data
 */
export const useDashboardCharts = (
  selectedCampusIds: string[],
  selectedCampusNames: string[],
) => {
  // Weekly lead data query
  const weeklyLeadsQuery = useQuery({
    queryKey: ["weeklyLeads", { campusIds: selectedCampusIds }],
    queryFn: async (): Promise<WeeklyLeadData[]> => {
      // Calculate date range (last 4 weeks)
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 28);

      const { data, error } = await supabase.rpc("get_weekly_lead_counts", {
        start_date: startDate.toISOString().split("T")[0],
        end_date: new Date().toISOString().split("T")[0],
        campus_filter:
          selectedCampusIds.length === 1 ? selectedCampusIds[0] : null,
      });

      if (error) {
        logger.error("Error fetching weekly lead counts:", error);
        throw error;
      }

      // Format data for chart display
      return data.map((item: any) => ({
        week: new Date(item.week).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        count: item.lead_count,
      }));
    },
  });

  // Opportunity stages query
  const opportunityStagesQuery = useQuery({
    queryKey: ["opportunityStages", { campusIds: selectedCampusIds }],
    queryFn: async (): Promise<OpportunityStageData[]> => {
      const { data, error } = await supabase.rpc(
        "get_opportunities_by_stage_campus",
      );

      if (error) {
        logger.error("Error fetching opportunity stages:", error);
        throw error;
      }

      // Filter by campus if selected
      let processedData = data;
      if (selectedCampusIds.length > 0) {
        processedData = data.filter((item: any) =>
          selectedCampusIds.includes(item.campus_id),
        );
      }

      // Group by stage and sum counts
      const stageGroups: Record<string, number> = {};
      processedData.forEach((item: any) => {
        stageGroups[item.stage_name] =
          (stageGroups[item.stage_name] || 0) + Number(item.count);
      });

      const result = Object.entries(stageGroups).map(([stage_name, count]) => ({
        stage_name,
        count,
        campus_name:
          selectedCampusIds.length === 0
            ? "All Campuses"
            : selectedCampusIds.length === 1
              ? selectedCampusNames[0]
              : "Selected Campuses",
        state: "",
        percentage: 0,
      }));

      // Limit to top 5 stages
      return result.sort((a, b) => b.count - a.count).slice(0, 5);
    },
  });

  // Combined loading and error states
  const isLoading =
    weeklyLeadsQuery.isLoading || opportunityStagesQuery.isLoading;
  const error = weeklyLeadsQuery.error || opportunityStagesQuery.error;

  return {
    weeklyLeadData: weeklyLeadsQuery.data || [],
    opportunityData: opportunityStagesQuery.data || [],
    isLoading,
    error: error ? String(error) : null,
  };
};
