
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
import { logger } from '@/utils/logger';
import { troubleshootSchemaAccess } from '@/utils/salesforce-access';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, AlertTriangle } from 'lucide-react';

const SalesforceLeadsPage: React.FC = () => {
  const [selectedCampusIds, setSelectedCampusIds] = useState<string[]>([]);
  const [selectedCampusNames, setSelectedCampusNames] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [schemaStatus, setSchemaStatus] = useState<{ public: boolean, salesforce: boolean }>({ public: false, salesforce: false });
  const [errorDetails, setErrorDetails] = useState<Record<string, any> | undefined>(undefined);
  
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
      
      // First try the standard connection check
      const connectionResult = await checkDatabaseConnection();
      logger.debug('Database connection result:', connectionResult);
      
      // If that fails, try the more detailed troubleshooting
      if (!connectionResult.connected) {
        logger.info('Standard connection check failed, running detailed diagnostics');
        const diagnosticResult = await troubleshootSchemaAccess();
        logger.debug('Diagnostic result:', diagnosticResult);
        
        setSchemaStatus({
          public: diagnosticResult.schemas?.public?.accessible || false,
          salesforce: diagnosticResult.salesforceAccessible || false
        });
        
        // Store detailed error information
        setErrorDetails({
          diagnosticResults: diagnosticResult,
          connectionResults: connectionResult
        });
      } else {
        setSchemaStatus(connectionResult.schemas);
        setErrorDetails(undefined);
      }
      
      setConnectionStatus(connectionResult.connected ? 'connected' : 'error');
    } catch (error) {
      logger.error("Error checking database connection:", error);
      setConnectionStatus('error');
      setSchemaStatus({ public: false, salesforce: false });
      setErrorDetails({ error: String(error) });
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

  const renderDataLoadingError = () => {
    if (connectionStatus !== 'error' && !syncError) return null;
    
    return (
      <Card className="mb-6">
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              Failed to load dashboard data. Please try again later.
            </AlertDescription>
          </Alert>
          
          <div className="mt-4 text-sm text-slate-600">
            <p>Possible causes:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Database connection issues</li>
              <li>Schema permission problems</li>
              <li>Missing or invalid SQL functions</li>
              <li>Network connectivity problems</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-to-r from-slate-700 to-slate-600 text-white py-8 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl md:text-3xl font-semibold">Salesforce Analytics</h1>
            <Navbar />
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
            schemaStatus={schemaStatus}
            onRetry={checkConnection}
          />
        )}
        
        {syncError && <SyncErrorAlert error={syncError} details={errorDetails} />}

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

        {connectionStatus === 'error' && renderDataLoadingError()}
        
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
