
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
    let { data: weeklyLeadData, error: weeklyLeadError } = await supabase.rpc(
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
        
        // If a campus is selected, we use the simplified data
        if (selectedCampusId) {
          weeklyLeadCounts = weeklyLeadData.map(item => ({
            week: item.week,
            count: Number(item.lead_count)
          }));
        } else {
          // For "All Campuses" view, we need to fetch additional data to show campus breakdown
          const { data: detailedData, error: detailedError } = await supabase
            .from('salesforce_leads')
            .select('lead_id, created_date, campus_id, preferred_campus')
            .gte('created_date', fourWeeksAgo.toISOString().split('T')[0]);
          
          if (detailedError) {
            console.error('Error fetching detailed leads data:', detailedError);
          } else if (detailedData) {
            // Get campus names map
            const { data: campusData } = await supabase.from('campuses').select('campus_id, campus_name');
            const campusMap = new Map();
            if (campusData) {
              campusData.forEach(campus => campusMap.set(campus.campus_id, campus.campus_name));
            }
            
            // Create a mapping of leads data grouped by week
            const weeklyDetailedMap = new Map();
            
            weeklyLeadData.forEach(item => {
              const week = item.week;
              const weekLeads = detailedData.filter(lead => {
                if (!lead.created_date) return false;
                const leadDate = new Date(lead.created_date);
                const weekStart = new Date(lead.created_date);
                weekStart.setDate(leadDate.getDate() - leadDate.getDay());
                return weekStart.toISOString().split('T')[0] === week;
              });
              
              weeklyDetailedMap.set(week, weekLeads);
            });
            
            // Transform to the expected format
            weeklyLeadCounts = weeklyLeadData.map(item => {
              const weekLeads = weeklyDetailedMap.get(item.week) || [];
              const leadsByGroup = weekLeads.reduce((groups, lead) => {
                if (!groups[lead.campus_id || 'unknown']) {
                  groups[lead.campus_id || 'unknown'] = { 
                    count: 0, 
                    campus_name: lead.campus_id ? campusMap.get(lead.campus_id) || lead.preferred_campus : 'Uncategorized'
                  };
                }
                groups[lead.campus_id || 'unknown'].count++;
                return groups;
              }, {});
              
              // Find the largest group for this week
              let largestGroup = { id: 'unknown', count: 0, name: 'Uncategorized' };
              Object.entries(leadsByGroup).forEach(([id, data]: [string, any]) => {
                if (data.count > largestGroup.count) {
                  largestGroup = { id, count: data.count, name: data.campus_name };
                }
              });
              
              return {
                week: item.week,
                count: Number(item.lead_count),
                campus_id: largestGroup.id !== 'unknown' ? largestGroup.id : undefined,
                campus_name: largestGroup.name !== 'Uncategorized' ? largestGroup.name : undefined
              };
            });
          }
        }
        
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
    .select('lead_id, created_date, campus_id, preferred_campus');
  
  if (selectedCampusId) {
    manualLeadsQuery = manualLeadsQuery.eq('campus_id', selectedCampusId);
  }
  
  manualLeadsQuery = manualLeadsQuery.gte('created_date', fourWeeksAgo.toISOString().split('T')[0]);
  
  const { data: leadsData, error: manualLeadError } = await manualLeadsQuery;
  
  if (manualLeadError) throw manualLeadError;
  
  if (leadsData) {
    console.log(`Got ${leadsData.length} leads for manual counting`);
    
    // Get campus names map
    const { data: campusData } = await supabase.from('campuses').select('campus_id, campus_name');
    const campusMap = new Map();
    if (campusData) {
      campusData.forEach(campus => campusMap.set(campus.campus_id, campus.campus_name));
    }
    
    // Group by week and count
    const weeklyData: Record<string, { count: number, campusId?: string, campusName?: string }> = {};
    
    // Generate last 4 weeks
    for (let i = 0; i < 4; i++) {
      const weekDate = new Date();
      weekDate.setDate(today.getDate() - (7 * i));
      const weekStart = new Date(weekDate);
      weekStart.setDate(weekDate.getDate() - weekDate.getDay()); // Start of week (Sunday)
      const weekKey = weekStart.toISOString().split('T')[0];
      weeklyData[weekKey] = { count: 0 };
    }
    
    // Count leads per week and track campus info
    const leadsByCampus: Record<string, Record<string, number>> = {};
    
    leadsData.forEach(lead => {
      if (lead.created_date) {
        const leadDate = new Date(lead.created_date);
        const weekStart = new Date(leadDate);
        weekStart.setDate(leadDate.getDate() - leadDate.getDay()); // Start of week (Sunday)
        const weekKey = weekStart.toISOString().split('T')[0];
        
        if (weeklyData[weekKey] !== undefined) {
          weeklyData[weekKey].count += 1;
          
          // Track campus data
          if (!leadsByCampus[weekKey]) {
            leadsByCampus[weekKey] = {};
          }
          
          const campusKey = lead.campus_id || 'unknown';
          if (!leadsByCampus[weekKey][campusKey]) {
            leadsByCampus[weekKey][campusKey] = 0;
          }
          leadsByCampus[weekKey][campusKey] += 1;
        }
      }
    });
    
    // Find the most common campus for each week
    Object.keys(weeklyData).forEach(weekKey => {
      if (leadsByCampus[weekKey]) {
        let maxCount = 0;
        let maxCampusId = '';
        
        Object.entries(leadsByCampus[weekKey]).forEach(([campusId, count]) => {
          if (count > maxCount && campusId !== 'unknown') {
            maxCount = count;
            maxCampusId = campusId;
          }
        });
        
        if (maxCampusId) {
          weeklyData[weekKey].campusId = maxCampusId;
          weeklyData[weekKey].campusName = campusMap.get(maxCampusId) || 'Unknown Campus';
        }
      }
    });
    
    // Convert to array format for the chart
    const weeklyCountsArray = Object.entries(weeklyData).map(([week, data]) => ({
      week,
      count: data.count,
      campus_id: data.campusId,
      campus_name: data.campusName
    }));
    
    // Sort by week
    weeklyCountsArray.sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime());
    console.log("Manual weekly counts:", weeklyCountsArray);
    return weeklyCountsArray;
  }
  
  return [];
};
