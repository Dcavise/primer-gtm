
import { useState, useEffect } from 'react';
import { useStats } from './salesforce/useStats';
import { useCampuses } from './salesforce/useCampuses';
import { useSyncSalesforce } from './salesforce/useSyncSalesforce';
import { useMetrics } from './salesforce/useMetrics';
import { supabase } from '@/integrations/supabase/client';
import { 
  SummaryStats, 
  Campus, 
  SyncStatus, 
  EmploymentStatusCount, 
  WeeklyLeadCount, 
  OpportunityStageCount,
  LeadsMetricsData,
  OpportunityMetricsData,
  AttendanceMetricsData
} from './salesforce/types';

export type { 
  SummaryStats, 
  Campus, 
  SyncStatus, 
  EmploymentStatusCount, 
  WeeklyLeadCount, 
  OpportunityStageCount,
  LeadsMetricsData,
  OpportunityMetricsData,
  AttendanceMetricsData
};

export const useSalesforceData = (selectedCampusId: string | null) => {
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [databaseConnection, setDatabaseConnection] = useState<'checking' | 'connected' | 'error'>('checking');
  
  // Check database connection on mount
  useEffect(() => {
    const checkDatabaseConnection = async () => {
      try {
        console.log("Checking Supabase database connection...");
        console.log("Supabase URL:", supabase.supabaseUrl);
        
        const { data, error } = await supabase.from('salesforce_leads').select('count').limit(1);
        
        if (error) {
          console.error("Database connection error:", error);
          setDatabaseConnection('error');
        } else {
          console.log("Successfully connected to Supabase database");
          setDatabaseConnection('connected');
        }
      } catch (error) {
        console.error("Error checking database connection:", error);
        setDatabaseConnection('error');
      }
    };
    
    checkDatabaseConnection();
  }, []);
  
  const { stats, employmentStatusCounts, weeklyLeadCounts, opportunityStageCounts, fetchStats } = useStats(selectedCampusId);
  const { campuses, fetchCampuses } = useCampuses();
  const { leadsMetrics, opportunityMetrics, attendanceMetrics } = useMetrics(selectedCampusId);
  const { syncLoading, syncError, syncStatus, syncSalesforceData } = useSyncSalesforce(() => {
    fetchStats();
    fetchCampuses();
    setLastRefreshed(new Date());
  });
  
  // Add diagnostic info
  useEffect(() => {
    if (databaseConnection === 'error') {
      console.error("Database connection issue detected - this may affect data retrieval");
    }
    
    if (!campuses || campuses.length === 0) {
      console.warn("No campuses data available - this may indicate a database connection issue");
    }
  }, [databaseConnection, campuses]);

  return {
    stats,
    employmentStatusCounts,
    weeklyLeadCounts,
    opportunityStageCounts,
    leadsMetrics,
    opportunityMetrics,
    attendanceMetrics,
    campuses,
    syncLoading,
    syncError,
    syncStatus,
    lastRefreshed,
    databaseConnection,
    fetchStats,
    fetchCampuses,
    syncSalesforceData
  };
};
