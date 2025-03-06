
import React, { useState, useEffect, useCallback } from 'react';
import { useSalesforceData } from '@/hooks/use-salesforce-data';
import { DashboardHeader } from '@/components/salesforce/DashboardHeader';
import { CampusSelector } from '@/components/salesforce/CampusSelector';
import { StatsCardGrid } from '@/components/salesforce/StatsCardGrid';
import { SyncErrorAlert } from '@/components/salesforce/SyncErrorAlert';
import { MetricsDashboard } from '@/components/salesforce/MetricsDashboard';
import { Navbar } from '@/components/Navbar';
import { DatabaseConnectionAlert } from '@/components/salesforce/DatabaseConnectionAlert';
import { checkDatabaseConnection } from '@/integrations/supabase/client';
import { DebugModeToggle } from '@/components/salesforce/DebugModeToggle';
import { logger } from '@/utils/logger';

const SalesforceLeadsPage: React.FC = () => {
  const [selectedCampusIds, setSelectedCampusIds] = useState<string[]>([]);
  const [selectedCampusNames, setSelectedCampusNames] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  
  logger.info('SalesforceLeadsPage rendering');
  
  const {
    stats,
    employmentStatusCounts,
    weeklyLeadCounts,
    opportunityStageCounts,
    leadsMetrics,
    opportunityMetrics,
    attendanceMetrics,
    campuses,
    syncError,
    lastRefreshed,
    databaseConnection
  } = useSalesforceData(selectedCampusIds);

  const checkConnection = useCallback(async () => {
    try {
      logger.info('Checking database connection');
      setConnectionStatus('checking');
      const connectionResult = await checkDatabaseConnection();
      logger.debug('Database connection result:', connectionResult);
      setConnectionStatus(connectionResult.connected ? 'connected' : 'error');
    } catch (error) {
      logger.error("Error checking database connection:", error);
      setConnectionStatus('error');
    }
  }, []);

  useEffect(() => {
    logger.timeStart('initial-connection-check');
    checkConnection();
    logger.timeEnd('initial-connection-check');
  }, [checkConnection]);

  const handleSelectCampuses = (campusIds: string[], campusNames: string[]) => {
    logger.debug('Campus selection changed:', { campusIds, campusNames });
    setSelectedCampusIds(campusIds);
    setSelectedCampusNames(campusNames);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-to-r from-slate-700 to-slate-600 text-white py-8 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl md:text-3xl font-semibold">Salesforce Analytics</h1>
            <div className="flex items-center gap-4">
              <DebugModeToggle />
              <Navbar />
            </div>
          </div>
          <p className="text-white/80 mt-2">
            View and analyze Salesforce data across all campuses
          </p>
        </div>
      </header>
      
      <main className="container mx-auto p-4">
        {connectionStatus !== 'connected' && (
          <DatabaseConnectionAlert 
            status={connectionStatus} 
            onRetry={checkConnection}
          />
        )}
        
        {syncError && <SyncErrorAlert error={syncError} />}

        <div className="mb-6">
          <DashboardHeader 
            title="Salesforce Data" 
            lastRefreshed={lastRefreshed}
          />
        </div>

        <CampusSelector 
          campuses={campuses}
          selectedCampusIds={selectedCampusIds}
          onSelectCampuses={handleSelectCampuses}
        />

        {connectionStatus === 'error' && (
          <div className="mt-8 p-6 bg-slate-100 rounded-lg text-center">
            <h2 className="text-xl font-medium mb-4">Database Connection Issues</h2>
            <p className="mb-2">
              The application is currently showing limited or mock data due to database connection issues.
            </p>
            <p className="text-sm text-slate-500 mb-3">
              {selectedCampusIds.length === 0 
                ? 'No campuses selected' 
                : `Selected Campuses: ${selectedCampusNames.join(', ')}`}
            </p>
          </div>
        )}
        
        <StatsCardGrid 
          stats={stats}
          employmentStatusCounts={employmentStatusCounts}
          weeklyLeadCounts={weeklyLeadCounts}
          opportunityStageCounts={opportunityStageCounts}
          selectedCampusIds={selectedCampusIds}
          selectedCampusNames={selectedCampusNames}
          campuses={campuses}
        />
        
        <MetricsDashboard
          leadsMetrics={leadsMetrics}
          opportunityMetrics={opportunityMetrics}
          attendanceMetrics={attendanceMetrics}
          selectedCampusNames={selectedCampusNames}
          selectedCampusIds={selectedCampusIds}
        />
      </main>
    </div>
  );
};

export default SalesforceLeadsPage;
