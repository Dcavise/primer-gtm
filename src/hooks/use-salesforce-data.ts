
import { useState } from 'react';
import { useStats } from './salesforce/useStats';
import { useCampuses } from './salesforce/useCampuses';
import { useSyncSalesforce } from './salesforce/useSyncSalesforce';
import { useMetrics } from './salesforce/useMetrics';
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
  
  const { stats, employmentStatusCounts, weeklyLeadCounts, opportunityStageCounts, fetchStats } = useStats(selectedCampusId);
  const { campuses, fetchCampuses } = useCampuses();
  const { leadsMetrics, opportunityMetrics, attendanceMetrics } = useMetrics(selectedCampusId);
  const { syncLoading, syncError, syncStatus, syncSalesforceData } = useSyncSalesforce(() => {
    fetchStats();
    fetchCampuses();
    setLastRefreshed(new Date());
  });

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
    fetchStats,
    fetchCampuses,
    syncSalesforceData
  };
};
