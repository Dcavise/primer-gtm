import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { SummaryStats } from './types';

export const useStats = (selectedCampusId: string | null) => {
  const [stats, setStats] = useState<SummaryStats>({
    fellowsCount: 0,
    leadsCount: 0,
    activeOpportunitiesCount: 0,
    closedWonOpportunitiesCount: 0
  });
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  useEffect(() => {
    fetchStats();
    setLastRefreshed(new Date());
  }, [selectedCampusId]);

  const fetchStats = async () => {
    try {
      console.log("Fetching stats for campus:", selectedCampusId || "all campuses");
      
      // Log available campuses for debugging
      const { data: allCampuses } = await supabase.from('campuses').select('campus_id, campus_name');
      console.log("Available campuses:", allCampuses);
      
      // Fetch fellows count with proper filtering
      let query = supabase
        .from('fellows')
        .select('*', { count: 'exact' });
      
      // Only exclude specific statuses, keeping NULL values
      // Using .not() with 'eq' will allow NULL values to pass through
      query = query.not('fte_employment_status', 'eq', 'Exiting')
                   .not('fte_employment_status', 'eq', 'Declined FTE Offer');
      
      if (selectedCampusId) {
        // Since campus_id is now the primary key, we can just use it directly
        // without having to fetch the campus name first
        console.log(`Selected campus ID: ${selectedCampusId}`);
        
        // We still use the OR filter for backwards compatibility with existing data
        // that might reference campus by name in the 'campus' field
        query = query.or(`campus_id.eq.${selectedCampusId},campus.eq.${selectedCampusId},campus.ilike.%${selectedCampusId}%`);
        console.log(`Using enhanced campus filter for campus_id: ${selectedCampusId}`);
      }
      
      const { count: fellowsCount, error: fellowsError, data: fellowsData } = await query;
      
      if (fellowsError) throw fellowsError;
      
      // Log fellows data for debugging
      console.log(`Found ${fellowsCount || 0} fellows matching criteria`);
      if (fellowsData && fellowsData.length > 0) {
        console.log("Sample of fellows data:", fellowsData.slice(0, 5));
        
        // Log employment status distribution for debugging
        const statusCounts = fellowsData.reduce((acc, fellow) => {
          const status = fellow.fte_employment_status || 'NULL';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        console.log("Employment status distribution:", statusCounts);
      }
      
      // Fetch leads count - now directly using campus_id which is the primary key
      let leadsQuery = supabase
        .from('salesforce_leads')
        .select('lead_id', { count: 'exact', head: true });
      
      if (selectedCampusId) {
        leadsQuery = leadsQuery.eq('campus_id', selectedCampusId);
      }
      
      const { count: leadsCount, error: leadsError } = await leadsQuery;
      
      if (leadsError) throw leadsError;
      
      // Fetch active opportunities count - using campus_id directly
      let activeOppsQuery = supabase
        .from('salesforce_opportunities')
        .select('opportunity_id', { count: 'exact', head: true })
        .not('stage', 'in', '("Closed Won","Closed Lost")');
      
      if (selectedCampusId) {
        activeOppsQuery = activeOppsQuery.eq('campus_id', selectedCampusId);
      }
      
      const { count: activeOppsCount, error: activeOppsError } = await activeOppsQuery;
      
      if (activeOppsError) throw activeOppsError;
      
      // Fetch closed won opportunities count - using campus_id directly
      let closedWonOppsQuery = supabase
        .from('salesforce_opportunities')
        .select('opportunity_id', { count: 'exact', head: true })
        .eq('stage', 'Closed Won');
      
      if (selectedCampusId) {
        closedWonOppsQuery = closedWonOppsQuery.eq('campus_id', selectedCampusId);
      }
      
      const { count: closedWonOppsCount, error: closedWonOppsError } = await closedWonOppsQuery;
      
      if (closedWonOppsError) throw closedWonOppsError;
      
      console.log("Stats fetched successfully:", {
        fellowsCount,
        leadsCount: leadsCount,
        activeOppsCount: activeOppsCount,
        closedWonOppsCount: closedWonOppsCount
      });
      
      // Update stats
      setStats({
        fellowsCount: fellowsCount || 0,
        leadsCount: leadsCount || 0,
        activeOpportunitiesCount: activeOppsCount || 0,
        closedWonOpportunitiesCount: closedWonOppsCount || 0
      });
      
      setLastRefreshed(new Date());
      
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load analytics data');
    }
  };

  return {
    stats,
    lastRefreshed,
    fetchStats
  };
};
