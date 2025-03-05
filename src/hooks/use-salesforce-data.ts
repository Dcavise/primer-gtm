
import { useState } from 'react';
import { useStats } from './salesforce/useStats';
import { useCampuses } from './salesforce/useCampuses';
import { useSyncSalesforce } from './salesforce/useSyncSalesforce';
import { SummaryStats, Campus, SyncStatus, EmploymentStatusCount, WeeklyLeadCount, OpportunityStageCount } from './salesforce/types';

export type { SummaryStats, Campus, SyncStatus, EmploymentStatusCount, WeeklyLeadCount, OpportunityStageCount };

export const useSalesforceData = (selectedCampusId: string | null) => {
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  
  const { stats, employmentStatusCounts, weeklyLeadCounts, opportunityStageCounts, fetchStats } = useStats(selectedCampusId);
  const { campuses, fetchCampuses } = useCampuses();
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
