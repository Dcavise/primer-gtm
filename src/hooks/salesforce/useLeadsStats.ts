
import { supabase } from '@/integrations/supabase-client';
import { WeeklyLeadCount } from './types';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

export const fetchLeadsStats = async (
  selectedCampusIds: string[],
  handleError: (error: any, message?: string) => void
) => {
  try {
    logger.timeStart('fetchLeadsStats');
    // Initialize default values
    let leadsCount = 0;
    let weeklyLeadCounts: WeeklyLeadCount[] = [];
    
    // Get the current date and date 4 weeks ago
    const today = new Date();
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(today.getDate() - 28); // 4 weeks = 28 days

    logger.info(`Fetching weekly lead counts from ${fourWeeksAgo.toISOString()} to ${today.toISOString()}`);
    logger.info(`Campus filter: ${selectedCampusIds.length > 0 ? selectedCampusIds.join(', ') : "none (all campuses)"}`);

    // First check auth status
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      logger.warn("User not authenticated, using mock data");
      toast.warning("Authentication required", {
        description: "Please sign in to access real data"
      });
      
      // Generate mock data if not authenticated
      return generateMockLeadsData(fourWeeksAgo);
    }

    // Try to get data using the RPC function first
    try {
      logger.debug('Attempting to fetch data using get_weekly_lead_counts RPC');
      const { data: weeklyLeadData, error: weeklyLeadError } = await supabase.rpc(
        'get_weekly_lead_counts',
        {
          start_date: fourWeeksAgo.toISOString().split('T')[0],
          end_date: today.toISOString().split('T')[0],
          campus_filter: selectedCampusIds.length === 1 ? selectedCampusIds[0] : null
        }
      );

      if (weeklyLeadError) {
        logger.warn('RPC function failed, falling back to direct query:', weeklyLeadError);
        throw weeklyLeadError; // Will be caught by the outer try-catch and trigger the fallback
      }
      
      if (weeklyLeadData) {
        logger.debug("Weekly lead data from RPC:", weeklyLeadData);
        
        // Use type assertion to help TypeScript understand the data structure
        const typedWeeklyData = weeklyLeadData as { week: string; lead_count: number }[];
        
        // Calculate total leads from the weekly data
        leadsCount = typedWeeklyData.reduce((sum: number, item) => sum + Number(item.lead_count), 0);
        
        weeklyLeadCounts = typedWeeklyData.map((item) => ({
          week: item.week,
          count: Number(item.lead_count)
        }));
        
        logger.info(`Successfully retrieved ${leadsCount} leads across ${weeklyLeadCounts.length} weeks`);
      }
    } catch (rpcError) {
      // Try direct query as fallback using the fivetran utility
      try {
        logger.debug('Attempting fallback with fivetran_views direct access');
        
        const { querySalesforceTable } = await import('@/utils/salesforce-fivetran-access');
        
        // Query lead data directly
        const { data: directData, error: directError } = await querySalesforceTable('lead');
          
        if (directError) {
          logger.warn('Direct query failed, falling back to mock data:', directError);
          throw directError;
        }
        
        if (directData && Array.isArray(directData) && directData.length > 0) {
          logger.debug(`Found ${directData.length} leads via direct query`);
          
          // Type assertion for direct query results
          const typedDirectData = directData as { created_date: string }[];
          
          // Group leads by week
          const groupedByWeek = typedDirectData.reduce((acc: { [key: string]: number }, lead) => {
            const createdDate = new Date(lead.created_date);
            const weekStart = new Date(createdDate);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Get Sunday of the week
            const weekKey = weekStart.toISOString().split('T')[0];
            
            acc[weekKey] = (acc[weekKey] || 0) + 1;
            return acc;
          }, {});
          
          logger.debug('Grouped leads by week:', groupedByWeek);
          
          weeklyLeadCounts = Object.entries(groupedByWeek).map(([week, count]) => ({
            week,
            count: count as number
          })).sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime());
          
          leadsCount = directData.length;
          logger.info(`Successfully processed ${leadsCount} leads from direct query`);
        }
      } catch (directError) {
        // Fallback to mock data if both approaches fail
        logger.error("Both data retrieval methods failed, falling back to mock data", directError);
        return generateMockLeadsData(fourWeeksAgo);
      }
    }
    
    logger.timeEnd('fetchLeadsStats');
    return { leadsCount, weeklyLeadCounts };
  } catch (error) {
    logger.error('Error fetching leads stats', error);
    handleError(error, 'Error fetching leads stats');
    // Make sure to use the fourWeeksAgo variable that's defined within this function's scope
    const localFourWeeksAgo = new Date();
    localFourWeeksAgo.setDate(localFourWeeksAgo.getDate() - 28);
    return generateMockLeadsData(localFourWeeksAgo);
  }
};

// Helper function to generate mock data
const generateMockLeadsData = (fourWeeksAgo: Date) => {
  logger.info("Generating mock leads data");
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
  
  logger.debug("Mock data generated:", {
    leadsCount,
    weeklyLeadCounts: mockWeeks
  });
  
  return { leadsCount, weeklyLeadCounts: mockWeeks };
};
