
import React, { useState } from 'react';
import { useSalesforceData } from '@/hooks/use-salesforce-data';
import { DashboardHeader } from '@/components/salesforce/DashboardHeader';
import { CampusSelector } from '@/components/salesforce/CampusSelector';
import { StatsCardGrid } from '@/components/salesforce/StatsCardGrid';
import { SyncErrorAlert } from '@/components/salesforce/SyncErrorAlert';

const SalesforceLeadsPage: React.FC = () => {
  const [selectedCampusId, setSelectedCampusId] = useState<string | null>(null);
  
  const {
    stats,
    campuses,
    syncLoading,
    syncError,
    lastRefreshed,
    syncSalesforceData
  } = useSalesforceData(selectedCampusId);

  return (
    <div className="container mx-auto p-4">
      <DashboardHeader
        title="Salesforce Analytics"
        onRefresh={syncSalesforceData}
        isLoading={syncLoading}
        lastRefreshed={lastRefreshed}
      />

      {syncError && <SyncErrorAlert error={syncError} />}

      <CampusSelector 
        campuses={campuses}
        selectedCampusId={selectedCampusId}
        onSelectCampus={setSelectedCampusId}
      />

      <StatsCardGrid 
        stats={stats}
        selectedCampusId={selectedCampusId}
      />
    </div>
  );
};

export default SalesforceLeadsPage;
