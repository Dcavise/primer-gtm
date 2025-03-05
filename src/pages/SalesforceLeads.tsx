
import React, { useState } from 'react';
import { useSalesforceData } from '@/hooks/use-salesforce-data';
import { DashboardHeader } from '@/components/salesforce/DashboardHeader';
import { CampusSelector } from '@/components/salesforce/CampusSelector';
import { StatsCardGrid } from '@/components/salesforce/StatsCardGrid';
import { SyncErrorAlert } from '@/components/salesforce/SyncErrorAlert';

const SalesforceLeadsPage: React.FC = () => {
  const [selectedCampusId, setSelectedCampusId] = useState<string | null>(null);
  const [selectedCampusName, setSelectedCampusName] = useState<string | null>(null);
  
  const {
    stats,
    employmentStatusCounts,
    weeklyLeadCounts,
    campuses,
    syncLoading,
    syncError,
    lastRefreshed,
    syncSalesforceData
  } = useSalesforceData(selectedCampusId);

  const handleSelectCampus = (campusId: string | null, campusName: string | null) => {
    setSelectedCampusId(campusId);
    setSelectedCampusName(campusName);
  };

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
        onSelectCampus={handleSelectCampus}
      />

      <StatsCardGrid 
        stats={stats}
        employmentStatusCounts={employmentStatusCounts}
        weeklyLeadCounts={weeklyLeadCounts}
        selectedCampusId={selectedCampusId}
        selectedCampusName={selectedCampusName}
      />
    </div>
  );
};

export default SalesforceLeadsPage;
