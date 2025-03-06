
import { supabase } from '@/integrations/supabase/client';
import { WeeklyLeadCount } from './types';

export const fetchLeadsStats = async (
  selectedCampusIds: string[],
  handleError: (error: any, message?: string) => void
) => {
  try {
    // Instead of direct table access, use RPC functions that we've created in Supabase
    let leadsCount = 0;
    let weeklyLeadCounts: WeeklyLeadCount[] = [];
    
    // Get the current date and date 4 weeks ago
    const today = new Date();
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(today.getDate() - 28); // 4 weeks = 28 days

    console.log("Fetching weekly lead counts from", fourWeeksAgo.toISOString(), "to", today.toISOString());
    console.log("Campus filter:", selectedCampusIds.length > 0 ? selectedCampusIds.join(', ') : "none (all campuses)");

    // Call the custom SQL function to get weekly lead counts
    let { data: weeklyLeadData, error: weeklyLeadError } = await supabase.rpc(
      'get_weekly_lead_counts',
      {
        start_date: fourWeeksAgo.toISOString().split('T')[0],
        end_date: today.toISOString().split('T')[0],
        campus_ids: selectedCampusIds.length > 0 ? selectedCampusIds : null
      }
    );

    if (weeklyLeadError) {
      console.error('Error fetching weekly lead counts:', weeklyLeadError);
      throw weeklyLeadError;
    } 
    
    if (weeklyLeadData) {
      console.log("Weekly lead data from RPC:", weeklyLeadData);
      
      // Calculate total leads from the weekly data
      leadsCount = weeklyLeadData.reduce((sum: number, item: any) => sum + Number(item.lead_count), 0);
      
      weeklyLeadCounts = weeklyLeadData.map((item: any) => ({
        week: item.week,
        count: Number(item.lead_count)
      }));
    }
    
    return { leadsCount, weeklyLeadCounts };
  } catch (error) {
    handleError(error, 'Error fetching leads stats');
    return { leadsCount: 0, weeklyLeadCounts: [] };
  }
};
