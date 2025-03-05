
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { SummaryStats, EmploymentStatusCount, WeeklyLeadCount } from './types';

export const useStats = (selectedCampusId: string | null) => {
  const [stats, setStats] = useState<SummaryStats>({
    fellowsCount: 0,
    leadsCount: 0,
    activeOpportunitiesCount: 0,
    closedWonOpportunitiesCount: 0
  });
  const [employmentStatusCounts, setEmploymentStatusCounts] = useState<EmploymentStatusCount[]>([]);
  const [weeklyLeadCounts, setWeeklyLeadCounts] = useState<WeeklyLeadCount[]>([]);
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
        
        // Calculate employment status distribution
        const statusCounts = fellowsData.reduce((acc, fellow) => {
          const status = fellow.fte_employment_status || 'Open';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        console.log("Employment status distribution:", statusCounts);
        
        // Convert to array format for the chart
        const statusCountsArray = Object.entries(statusCounts).map(([status, count]) => ({
          status,
          count
        }));
        
        // Sort by count in descending order
        statusCountsArray.sort((a, b) => b.count - a.count);
        setEmploymentStatusCounts(statusCountsArray);
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

      // Fetch weekly lead counts for the last 4 weeks
      const today = new Date();
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(today.getDate() - 28); // 4 weeks = 28 days

      // Call the custom SQL function to get weekly lead counts
      const { data: weeklyLeadData, error: weeklyLeadError } = await supabase.rpc(
        'get_weekly_lead_counts',  // Fixed: Use the correctly named function
        {
          start_date: fourWeeksAgo.toISOString().split('T')[0],
          end_date: today.toISOString().split('T')[0],
          campus_filter: selectedCampusId
        }
      );

      if (weeklyLeadError) {
        console.error('Error fetching weekly lead counts:', weeklyLeadError);
        
        // Fallback: Manually fetch and calculate weekly leads if the RPC fails
        console.log('Falling back to manual weekly lead count calculation');
        
        let manualLeadsQuery = supabase
          .from('salesforce_leads')
          .select('lead_id, created_date')
          .gte('created_date', fourWeeksAgo.toISOString().split('T')[0]);
        
        if (selectedCampusId) {
          manualLeadsQuery = manualLeadsQuery.eq('campus_id', selectedCampusId);
        }
        
        const { data: leadsData, error: manualLeadError } = await manualLeadsQuery;
        
        if (manualLeadError) throw manualLeadError;
        
        if (leadsData) {
          // Group by week and count
          const weeklyData: Record<string, number> = {};
          
          // Generate last 4 weeks
          for (let i = 0; i < 4; i++) {
            const weekDate = new Date();
            weekDate.setDate(today.getDate() - (7 * i));
            const weekStart = new Date(weekDate);
            weekStart.setDate(weekDate.getDate() - weekDate.getDay()); // Start of week (Sunday)
            const weekKey = weekStart.toISOString().split('T')[0];
            weeklyData[weekKey] = 0;
          }
          
          // Count leads per week
          leadsData.forEach(lead => {
            if (lead.created_date) {
              const leadDate = new Date(lead.created_date);
              const weekStart = new Date(leadDate);
              weekStart.setDate(leadDate.getDate() - leadDate.getDay()); // Start of week (Sunday)
              const weekKey = weekStart.toISOString().split('T')[0];
              
              if (weeklyData[weekKey] !== undefined) {
                weeklyData[weekKey] += 1;
              }
            }
          });
          
          // Convert to array format for the chart
          const weeklyCountsArray = Object.entries(weeklyData).map(([week, count]) => ({
            week,
            count
          }));
          
          // Sort by week
          weeklyCountsArray.sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime());
          setWeeklyLeadCounts(weeklyCountsArray);
        }
      } else {
        // Use the results from the RPC - fix to handle possibly null data
        if (weeklyLeadData) {
          const formattedWeeklyData = weeklyLeadData.map(item => ({
            week: item.week,
            count: Number(item.lead_count)
          }));
          
          setWeeklyLeadCounts(formattedWeeklyData);
        } else {
          // If no data is returned, set empty array
          setWeeklyLeadCounts([]);
        }
      }
      
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
    employmentStatusCounts,
    weeklyLeadCounts,
    lastRefreshed,
    fetchStats
  };
};
