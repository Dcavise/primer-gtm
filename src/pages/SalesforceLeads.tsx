
import React, { useState, useEffect } from 'react';
import { useSalesforceData } from '@/hooks/use-salesforce-data';
import { DashboardHeader } from '@/components/salesforce/DashboardHeader';
import { CampusSelector } from '@/components/salesforce/CampusSelector';
import { StatsCardGrid } from '@/components/salesforce/StatsCardGrid';
import { SyncErrorAlert } from '@/components/salesforce/SyncErrorAlert';
import { MetricsDashboard } from '@/components/salesforce/MetricsDashboard';
import { Navbar } from '@/components/Navbar';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SUPABASE_URL } from '@/services/api-config';

const SalesforceLeadsPage: React.FC = () => {
  const [selectedCampusId, setSelectedCampusId] = useState<string | null>(null);
  const [selectedCampusName, setSelectedCampusName] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  
  useEffect(() => {
    // Check database connection on component mount
    const checkConnection = async () => {
      try {
        console.log("Checking Supabase connectivity from Salesforce Leads page");
        console.log("Supabase URL:", SUPABASE_URL);
        
        const { data, error } = await supabase.from('campuses').select('count').limit(1);
        
        if (error) {
          console.error("Database connectivity test failed:", error);
          setConnectionStatus('error');
        } else {
          console.log("Database connectivity test successful");
          setConnectionStatus('connected');
        }
      } catch (error) {
        console.error("Unexpected error during connectivity test:", error);
        setConnectionStatus('error');
      }
    };
    
    checkConnection();
  }, []);
  
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
    databaseConnection,
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
        {(connectionStatus === 'error' || databaseConnection === 'error') && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Database Connection Error</AlertTitle>
            <AlertDescription>
              Could not connect to the database. This may affect data loading and functionality.
              Please check your network connection and try again.
            </AlertDescription>
          </Alert>
        )}
        
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
