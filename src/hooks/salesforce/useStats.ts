
import { useState, useEffect } from 'react';
import { SummaryStats, EmploymentStatusCount, WeeklyLeadCount, OpportunityStageCount } from './types';
import { useBaseStats } from './useBaseStats';
import { fetchFellowsStats } from './useFellowsStats';
import { fetchLeadsStats } from './useLeadsStats';
import { fetchOpportunitiesStats } from './useOpportunitiesStats';

export const useStats = (selectedCampusId: string | null) => {
  const { stats, setStats, lastRefreshed, setLastRefreshed, handleError } = useBaseStats();
  const [employmentStatusCounts, setEmploymentStatusCounts] = useState<EmploymentStatusCount[]>([]);
  const [weeklyLeadCounts, setWeeklyLeadCounts] = useState<WeeklyLeadCount[]>([]);
  const [opportunityStageCounts, setOpportunityStageCounts] = useState<OpportunityStageCount[]>([]);

  useEffect(() => {
    fetchStats();
    setLastRefreshed(new Date());
  }, [selectedCampusId]);

  const fetchStats = async () => {
    try {
      console.log("Fetching stats for campus:", selectedCampusId || "all campuses");
      
      // Log available campuses for debugging
      const { data: allCampuses, error: campusesError } = await 
        supabase.from('campuses').select('campus_id, campus_name');
      
      if (campusesError) {
        console.error("Error fetching campuses:", campusesError);
      } else {
        console.log("Available campuses:", allCampuses);
      }
      
      // Fetch fellows stats
      const fellowsResult = await fetchFellowsStats(selectedCampusId, handleError);
      setEmploymentStatusCounts(fellowsResult.employmentStatusCounts);
      
      // Fetch leads stats
      const leadsResult = await fetchLeadsStats(selectedCampusId, handleError);
      setWeeklyLeadCounts(leadsResult.weeklyLeadCounts);
      
      // Fetch opportunities stats
      const opportunitiesResult = await fetchOpportunitiesStats(selectedCampusId, handleError);
      setOpportunityStageCounts(opportunitiesResult.opportunityStageCounts);
      
      // Update combined stats
      const updatedStats: SummaryStats = {
        fellowsCount: fellowsResult.fellowsCount,
        leadsCount: leadsResult.leadsCount,
        activeOpportunitiesCount: opportunitiesResult.activeOpportunitiesCount,
        closedWonOpportunitiesCount: opportunitiesResult.closedWonOpportunitiesCount
      };
      
      console.log("Stats fetched successfully:", updatedStats);
      
      // Update stats
      setStats(updatedStats);
      setLastRefreshed(new Date());
      
    } catch (error) {
      handleError(error);
    }
  };

  return {
    stats,
    employmentStatusCounts,
    weeklyLeadCounts,
    opportunityStageCounts,
    lastRefreshed,
    fetchStats
  };
};

// Add missing import that was used in the code
import { supabase } from '@/integrations/supabase/client';
