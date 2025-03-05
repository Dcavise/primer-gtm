
import { supabase } from '@/integrations/supabase/client';
import { WeeklyLeadCount } from './types';

export const fetchLeadsStats = async (
  selectedCampusId: string | null,
  handleError: (error: any, message?: string) => void
) => {
  try {
    // Fetch leads count
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

    console.log("Fetching weekly lead counts from", fourWeeksAgo.toISOString(), "to", today.toISOString());
    console.log("Campus filter:", selectedCampusId || "none (all campuses)");

    // Call the custom SQL function to get weekly lead counts
    const { data: weeklyLeadData, error: weeklyLeadError } = await supabase.rpc(
      'get_weekly_lead_counts',
      {
        start_date: fourWeeksAgo.toISOString().split('T')[0],
        end_date: today.toISOString().split('T')[0],
        campus_filter: selectedCampusId
      }
    );

    let weeklyLeadCounts: WeeklyLeadCount[] = [];

    if (weeklyLeadError) {
      console.error('Error fetching weekly lead counts:', weeklyLeadError);
      weeklyLeadCounts = await fallbackWeeklyLeadCounts(selectedCampusId, fourWeeksAgo, today);
    } else {
      // Use the results from the RPC - fix to handle possibly null data
      if (weeklyLeadData) {
        console.log("Weekly lead data from RPC:", weeklyLeadData);
        weeklyLeadCounts = weeklyLeadData.map(item => ({
          week: item.week,
          count: Number(item.lead_count)
        }));
        
        console.log("Formatted weekly data:", weeklyLeadCounts);
      }
    }
    
    return { leadsCount: leadsCount || 0, weeklyLeadCounts };
  } catch (error) {
    handleError(error, 'Error fetching leads stats');
    return { leadsCount: 0, weeklyLeadCounts: [] };
  }
};

// Fallback method to manually calculate weekly lead counts
const fallbackWeeklyLeadCounts = async (
  selectedCampusId: string | null,
  fourWeeksAgo: Date,
  today: Date
): Promise<WeeklyLeadCount[]> => {
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
    console.log(`Got ${leadsData.length} leads for manual counting`);
    
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
    console.log("Manual weekly counts:", weeklyCountsArray);
    return weeklyCountsArray;
  }
  
  return [];
};
