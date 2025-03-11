import { useQuery, useQueries } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import { WeeklyLeadCount } from "./useLeadsStats";
import { EmploymentStatusCount } from "./useFellowsStats";

export interface OpportunityStageCount {
  stage: string;
  count: number;
}

export interface DashboardStats {
  leadsCount: number;
  weeklyLeadCounts: WeeklyLeadCount[];
  fellowsCount: number;
  employmentStatusCounts: EmploymentStatusCount[];
  activeOpportunitiesCount: number;
  closedWonOpportunitiesCount: number;
  opportunityStageCounts: OpportunityStageCount[];
  lastRefreshed: Date | null;
}

interface DashboardDataResult {
  stats: DashboardStats;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Centralized hook for fetching all dashboard data using React Query
 * @param selectedCampusIds - Array of campus IDs to filter by
 * @returns Dashboard stats and control functions
 */
export function useDashboardData(
  selectedCampusIds: string[],
): DashboardDataResult {
  // Get the current date and date 4 weeks ago for weekly data
  const today = new Date();
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(today.getDate() - 28);

  const campusFilter =
    selectedCampusIds.length === 1 ? selectedCampusIds[0] : null;

  // Define all queries
  const results = useQueries({
    queries: [
      // Weekly lead counts query
      {
        queryKey: ["weeklyLeads", { campusIds: selectedCampusIds }],
        queryFn: async (): Promise<WeeklyLeadCount[]> => {
          const { data, error } = await supabase.executeRPC(
            "get_weekly_lead_counts",
            {
              start_date: fourWeeksAgo.toISOString().split("T")[0],
              end_date: today.toISOString().split("T")[0],
              campus_filter: campusFilter,
            },
          );

          if (error) throw error;

          return (data || []).map((item: any) => ({
            week: item.week,
            count: Number(item.lead_count),
          }));
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
      },

      // Fellows count query
      {
        queryKey: ["fellows", { campusIds: selectedCampusIds }],
        queryFn: async () => {
          let query = supabase.regular
            .from("fellows")
            .select("*", { count: "exact" })
            .not("fte_employment_status", "eq", "Exiting")
            .not("fte_employment_status", "eq", "Declined FTE Offer");

          if (selectedCampusIds.length > 0) {
            const filters = selectedCampusIds
              .map(
                (campusId) =>
                  `campus_id.eq.${campusId},campus.eq.${campusId},campus.ilike.%${campusId}%`,
              )
              .join(",");

            query = query.or(filters);
          }

          const { data, error, count } = await query;

          if (error) throw error;

          // Calculate employment status counts
          const statusCounts: Record<string, number> = {};
          (data || []).forEach((fellow) => {
            const status = fellow.fte_employment_status || "Open";
            statusCounts[status] = (statusCounts[status] || 0) + 1;
          });

          const employmentStatusCounts = Object.entries(statusCounts)
            .map(([status, count]) => ({ status, count }))
            .sort((a, b) => b.count - a.count);

          return {
            fellowsCount: count || 0,
            employmentStatusCounts,
          };
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
      },

      // Active opportunities query
      {
        queryKey: ["activeOpportunities", { campusIds: selectedCampusIds }],
        queryFn: async () => {
          let query = supabase.regular
            .from("opportunity")
            .select("*", { count: "exact" })
            .eq("is_closed", false);

          if (selectedCampusIds.length > 0) {
            query = query.in("campus_id", selectedCampusIds);
          }

          const { error, count } = await query;

          if (error) throw error;

          return count || 0;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
      },

      // Closed won opportunities query
      {
        queryKey: ["closedWonOpportunities", { campusIds: selectedCampusIds }],
        queryFn: async () => {
          let query = supabase.regular
            .from("opportunity")
            .select("*", { count: "exact" })
            .eq("is_closed", true)
            .eq("is_won", true);

          if (selectedCampusIds.length > 0) {
            query = query.in("campus_id", selectedCampusIds);
          }

          const { error, count } = await query;

          if (error) throw error;

          return count || 0;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
      },

      // Opportunity stages query
      {
        queryKey: ["opportunityStages", { campusIds: selectedCampusIds }],
        queryFn: async () => {
          let query = supabase.regular
            .from("opportunity")
            .select("stage_name")
            .eq("is_closed", false);

          if (selectedCampusIds.length > 0) {
            query = query.in("campus_id", selectedCampusIds);
          }

          const { data, error } = await query;

          if (error) throw error;

          // Group by stage
          const stageGroups: Record<string, number> = {};
          (data || []).forEach((opp) => {
            const stage = opp.stage_name || "Unknown";
            stageGroups[stage] = (stageGroups[stage] || 0) + 1;
          });

          const opportunityStageCounts = Object.entries(stageGroups)
            .map(([stage, count]) => ({ stage, count }))
            .sort((a, b) => b.count - a.count);

          return opportunityStageCounts;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
      },
    ],
  });

  // Extract data and loading states
  const [
    weeklyLeadsQuery,
    fellowsQuery,
    activeOpportunitiesQuery,
    closedWonOpportunitiesQuery,
    opportunityStagesQuery,
  ] = results;

  // Calculate total leads count from weekly data
  const leadsCount =
    weeklyLeadsQuery.data?.reduce((sum, item) => sum + item.count, 0) || 0;

  // Combined loading and error states
  const isLoading = results.some(
    (query) => query.isLoading || query.isFetching,
  );
  const isError = results.some((query) => query.isError);
  const errorMessages = results
    .filter((query) => query.error)
    .map((query) => String(query.error));

  // Combine errors
  const error =
    errorMessages.length > 0 ? new Error(errorMessages.join("; ")) : null;

  // Refetch all queries
  const refetch = async () => {
    logger.info("Refetching all dashboard data");
    await Promise.all(results.map((query) => query.refetch()));
  };

  // Combined stats
  const stats: DashboardStats = {
    leadsCount,
    weeklyLeadCounts: weeklyLeadsQuery.data || [],
    fellowsCount: fellowsQuery.data?.fellowsCount || 0,
    employmentStatusCounts: fellowsQuery.data?.employmentStatusCounts || [],
    activeOpportunitiesCount: activeOpportunitiesQuery.data || 0,
    closedWonOpportunitiesCount: closedWonOpportunitiesQuery.data || 0,
    opportunityStageCounts: opportunityStagesQuery.data || [],
    lastRefreshed: isLoading ? null : new Date(),
  };

  return {
    stats,
    isLoading,
    isError,
    error,
    refetch,
  };
}
