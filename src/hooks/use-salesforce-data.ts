import { useState, useEffect } from 'react';
import { useStats } from './salesforce/useStats';
import { useCampuses } from './salesforce/useCampuses';
import { useSyncSalesforce } from './salesforce/useSyncSalesforce';
import { useMetrics } from './salesforce/useMetrics';
import { supabase } from '@/integrations/supabase/client';
import { SUPABASE_URL, checkDatabaseConnection } from '@/lib/serverComms';
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

export const useSalesforceData = (selectedCampusIds: string[]) => {
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [databaseConnection, setDatabaseConnection] = useState<'checking' | 'connected' | 'error'>('checking');
  const [schemaStatus, setSchemaStatus] = useState<{ public: boolean, salesforce: boolean }>({ public: false, salesforce: false });
  
  // Check database connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        console.log("Checking Supabase database connection to both schemas...");
        console.log("Supabase URL:", SUPABASE_URL);
        
        const connectionStatus = await checkDatabaseConnection();
        
        if (!connectionStatus.connected) {
          console.error("Database connection issue detected:", connectionStatus);
          setDatabaseConnection('error');
          setSchemaStatus(connectionStatus.schemas);
        } else {
          console.log("Successfully connected to Supabase database and schemas:", connectionStatus);
          setDatabaseConnection('connected');
          setSchemaStatus(connectionStatus.schemas);
        }
      } catch (error) {
        console.error("Error checking database connection:", error);
        setDatabaseConnection('error');
        setSchemaStatus({ public: false, salesforce: false });
      }
    };
    
    checkConnection();
  }, []);
  
  // Reset connection check when user auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        console.log("User signed in, rechecking database connection...");
        setDatabaseConnection('checking');
        checkDatabaseConnection().then(connectionStatus => {
          if (!connectionStatus.connected) {
            setDatabaseConnection('error');
            setSchemaStatus(connectionStatus.schemas);
          } else {
            setDatabaseConnection('connected');
            setSchemaStatus(connectionStatus.schemas);
          }
        });
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  const { stats, employmentStatusCounts, weeklyLeadCounts, opportunityStageCounts, fetchStats } = useStats(selectedCampusIds);
  const { campuses, fetchCampuses } = useCampuses();
  const { leadsMetrics, opportunityMetrics, attendanceMetrics } = useMetrics(selectedCampusIds);
  const { syncLoading, syncError, syncStatus, syncSalesforceData } = useSyncSalesforce(() => {
    fetchStats();
    fetchCampuses();
    setLastRefreshed(new Date());
  });
  
  // Add diagnostic info
  useEffect(() => {
    if (databaseConnection === 'error') {
      console.error("Database connection issue detected - this may affect data retrieval");
      if (schemaStatus.public && !schemaStatus.salesforce) {
        console.warn("Connected to public schema but not salesforce schema - this indicates a permission issue");
      } else if (!schemaStatus.public && !schemaStatus.salesforce) {
        console.error("Unable to connect to any database schemas - check authentication and network");
      }
    }
    
    if (!campuses || campuses.length === 0) {
      console.warn("No campuses data available - this may indicate a database connection issue");
    }
  }, [databaseConnection, schemaStatus, campuses]);
  
  // Allow user to retry connection
  const retryConnection = async () => {
    setDatabaseConnection('checking');
    const connectionStatus = await checkDatabaseConnection();
    if (!connectionStatus.connected) {
      setDatabaseConnection('error');
      setSchemaStatus(connectionStatus.schemas);
    } else {
      setDatabaseConnection('connected');
      setSchemaStatus(connectionStatus.schemas);
      fetchStats();
      fetchCampuses();
    }
  };

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
    schemaStatus,
    fetchStats,
    fetchCampuses,
    syncSalesforceData,
    retryConnection
  };
};
