import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { useSupabaseQuery } from './useSupabaseQuery';

export interface WeeklyLeadCount {
  week: string;
  count: number;
}

interface LeadStats {
  leadsCount: number;
  weeklyLeadCounts: WeeklyLeadCount[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Hook for fetching and managing lead statistics
 * @param selectedCampusIds - Array of campus IDs to filter by
 * @returns Lead statistics and control functions
 */
export function useLeadsStats(selectedCampusIds: string[]): LeadStats {
  const [leadsCount, setLeadsCount] = useState(0);
  const [weeklyLeadCounts, setWeeklyLeadCounts] = useState<WeeklyLeadCount[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // Use our base Supabase query hook
  const { 
    loading: isLoading, 
    error, 
    executeRpc 
  } = useSupabaseQuery<{
    leadsCount: number;
    weeklyLeadCounts: WeeklyLeadCount[];
  }>({
    logTiming: true,
    mockDataFn: () => generateMockLeadsData()
  });

  // Function to fetch lead stats
  const fetchLeadStats = useCallback(async () => {
    // Get the current date and date 4 weeks ago
    const today = new Date();
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(today.getDate() - 28); // 4 weeks = 28 days

    logger.info(`Fetching weekly lead counts from ${fourWeeksAgo.toISOString()} to ${today.toISOString()}`);
    logger.info(`Campus filter: ${selectedCampusIds.length > 0 ? selectedCampusIds.join(', ') : "none (all campuses)"}`);

    // Get weekly lead counts data
    const weeklyLeadData = await executeRpc<Array<{ week: string; lead_count: number }>>(
      'get_weekly_lead_counts',
      {
        start_date: fourWeeksAgo.toISOString().split('T')[0],
        end_date: today.toISOString().split('T')[0],
        campus_filter: selectedCampusIds.length === 1 ? selectedCampusIds[0] : null
      }
    );

    if (weeklyLeadData && Array.isArray(weeklyLeadData)) {
      // Calculate total leads from the weekly data
      const totalLeads = weeklyLeadData.reduce((sum, item) => sum + Number(item.lead_count), 0);
      setLeadsCount(totalLeads);
      
      // Transform the weekly data
      const formattedWeeklyData = weeklyLeadData.map((item) => ({
        week: item.week,
        count: Number(item.lead_count)
      }));
      
      setWeeklyLeadCounts(formattedWeeklyData);
      setLastRefreshed(new Date());
      return { leadsCount: totalLeads, weeklyLeadCounts: formattedWeeklyData };
    }
    
    // Fallback to mock data if needed
    const mockData = generateMockLeadsData();
    setLeadsCount(mockData.leadsCount);
    setWeeklyLeadCounts(mockData.weeklyLeadCounts);
    setLastRefreshed(new Date());
    return mockData;
  }, [executeRpc, selectedCampusIds]);

  // Fetch data on mount and when campuses change
  useEffect(() => {
    fetchLeadStats();
  }, [fetchLeadStats]);

  // Helper function to generate mock data
  function generateMockLeadsData() {
    logger.info("Generating mock leads data");
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    
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
    
    const totalLeadsCount = mockWeeks.reduce((sum, item) => sum + item.count, 0);
    
    return { leadsCount: totalLeadsCount, weeklyLeadCounts: mockWeeks };
  }

  return {
    leadsCount,
    weeklyLeadCounts,
    isLoading,
    error,
    refresh: fetchLeadStats
  };
}