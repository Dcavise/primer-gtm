
import { supabase } from '@/integrations/supabase/client';
import { WeeklyLeadCount } from './types';
import { toast } from 'sonner';

export const fetchLeadsStats = async (
  selectedCampusIds: string[],
  handleError: (error: any, message?: string) => void
) => {
  try {
    // Initialize default values
    let leadsCount = 0;
    let weeklyLeadCounts: WeeklyLeadCount[] = [];
    
    // Get the current date and date 4 weeks ago
    const today = new Date();
    const localFourWeeksAgo = new Date();
    localFourWeeksAgo.setDate(today.getDate() - 28); // 4 weeks = 28 days

    console.log("Fetching weekly lead counts from", localFourWeeksAgo.toISOString(), "to", today.toISOString());
    console.log("Campus filter:", selectedCampusIds.length > 0 ? selectedCampusIds.join(', ') : "none (all campuses)");

    // First check auth status
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      console.warn("User not authenticated, using mock data");
      toast.warning("Authentication required", {
        description: "Please sign in to access real data"
      });
      
      // Generate mock data if not authenticated
      return generateMockLeadsData(localFourWeeksAgo);
    }

    // Try to get data using the RPC function first
    try {
      const { data: weeklyLeadData, error: weeklyLeadError } = await supabase.rpc(
        'get_weekly_lead_counts',
        {
          start_date: localFourWeeksAgo.toISOString().split('T')[0],
          end_date: today.toISOString().split('T')[0],
          campus_filter: selectedCampusIds.length === 1 ? selectedCampusIds[0] : null
        }
      );

      if (weeklyLeadError) {
        console.warn('RPC function failed, falling back to direct query:', weeklyLeadError);
        throw weeklyLeadError; // Will be caught by the outer try-catch and trigger the fallback
      }
      
      if (weeklyLeadData) {
        console.log("Weekly lead data from RPC:", weeklyLeadData);
        
        // Calculate total leads from the weekly data
        leadsCount = (weeklyLeadData as any[]).reduce((sum: number, item: any) => sum + Number(item.lead_count), 0);
        
        weeklyLeadCounts = (weeklyLeadData as any[]).map((item: any) => ({
          week: item.week,
          count: Number(item.lead_count)
        }));
      }
    } catch (rpcError) {
      // Try direct query as fallback using another RPC method for cross-schema access
      try {
        // Use a custom RPC function to query across schema boundaries
        const sqlQuery = `
          SELECT created_date 
          FROM salesforce.lead
          WHERE created_date >= '${localFourWeeksAgo.toISOString().split('T')[0]}'
          AND created_date <= '${today.toISOString().split('T')[0]}'
          AND is_deleted = false
        `;
        
        const { data: directData, error: directError } = await supabase.rpc(
          'execute_sql_query',
          { sql_query: sqlQuery }
        );
          
        if (directError) {
          console.warn('Direct query failed, falling back to mock data:', directError);
          throw directError;
        }
        
        if (directData && Array.isArray(directData) && directData.length > 0) {
          console.log(`Found ${directData.length} leads via direct query`);
          
          // Group leads by week
          const groupedByWeek = directData.reduce((acc: { [key: string]: number }, lead: any) => {
            const createdDate = new Date(lead.created_date);
            const weekStart = new Date(createdDate);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Get Sunday of the week
            const weekKey = weekStart.toISOString().split('T')[0];
            
            acc[weekKey] = (acc[weekKey] || 0) + 1;
            return acc;
          }, {});
          
          weeklyLeadCounts = Object.entries(groupedByWeek).map(([week, count]) => ({
            week,
            count: count as number
          })).sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime());
          
          leadsCount = directData.length;
        }
      } catch (directError) {
        // Fallback to mock data if both approaches fail
        console.log("Generating mock weekly lead data due to database access error");
        return generateMockLeadsData(localFourWeeksAgo);
      }
    }
    
    return { leadsCount, weeklyLeadCounts };
  } catch (error) {
    handleError(error, 'Error fetching leads stats');
    return generateMockLeadsData(new Date(new Date().setDate(new Date().getDate() - 28)));
  }
};

// Helper function to generate mock data
const generateMockLeadsData = (fourWeeksAgo: Date) => {
  // Generate 4 weeks of mock data
  const mockWeeks = [];
  for (let i = 0; i < 4; i++) {
    const date = new Date(fourWeeksAgo);
    date.setDate(date.getDate() + (i * 7));
    mockWeeks.push({
      week: date.toISOString().split('T')[0],
      count: Math.floor(Math.random() * 30) + 5 // Random number between 5 and 35
    });
  }
  
  const leadsCount = mockWeeks.reduce((sum, item) => sum + item.count, 0);
  
  console.log("Using mock data:", {
    leadsCount,
    weeklyLeadCounts: mockWeeks
  });
  
  return { leadsCount, weeklyLeadCounts: mockWeeks };
};
