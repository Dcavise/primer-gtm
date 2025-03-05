
import React, { useState } from 'react';
import { useSalesforceData } from '@/hooks/use-salesforce-data';
import { DashboardHeader } from '@/components/salesforce/DashboardHeader';
import { CampusSelector } from '@/components/salesforce/CampusSelector';
import { StatsCardGrid } from '@/components/salesforce/StatsCardGrid';
import { SyncErrorAlert } from '@/components/salesforce/SyncErrorAlert';
import { MetricsDashboard } from '@/components/salesforce/MetricsDashboard';

const SalesforceLeadsPage: React.FC = () => {
  const [selectedCampusId, setSelectedCampusId] = useState<string | null>(null);
  const [selectedCampusName, setSelectedCampusName] = useState<string | null>(null);
  
  const {
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
    lastRefreshed,
    syncSalesforceData
  } = useSalesforceData(selectedCampusId);

  const handleSelectCampus = (campusId: string | null, campusName: string | null) => {
    setSelectedCampusId(campusId);
    setSelectedCampusName(campusName);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-to-r from-blue-600 to-blue-500 text-white py-8 px-6">
        <div className="container mx-auto max-w-5xl">
          <h1 className="text-2xl md:text-3xl font-semibold">Salesforce Analytics</h1>
          <p className="text-white/80 mt-2">
            View and analyze Salesforce data across all campuses
          </p>
        </div>
      </header>
      
      <main className="container mx-auto p-4">
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
          opportunityStageCounts={opportunityStageCounts}
          selectedCampusId={selectedCampusId}
          selectedCampusName={selectedCampusName}
        />
        
        <MetricsDashboard
          leadsMetrics={leadsMetrics}
          opportunityMetrics={opportunityMetrics}
          attendanceMetrics={attendanceMetrics}
          selectedCampusName={selectedCampusName}
          selectedCampusId={selectedCampusId}
        />
      </main>
    </div>
  );
};

export default SalesforceLeadsPage;
