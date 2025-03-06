
import React, { useState, useEffect } from 'react';
import { useSalesforceData } from '@/hooks/use-salesforce-data';
import { DashboardHeader } from '@/components/salesforce/DashboardHeader';
import { CampusSelector } from '@/components/salesforce/CampusSelector';
import { StatsCardGrid } from '@/components/salesforce/StatsCardGrid';
import { SyncErrorAlert } from '@/components/salesforce/SyncErrorAlert';
import { MetricsDashboard } from '@/components/salesforce/MetricsDashboard';
import { Navbar } from '@/components/Navbar';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SUPABASE_URL } from '@/services/api-config';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const AUTO_REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes in milliseconds

const SalesforceLeadsPage: React.FC = () => {
  const [selectedCampusId, setSelectedCampusId] = useState<string | null>(null);
  const [selectedCampusName, setSelectedCampusName] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [nextRefreshTime, setNextRefreshTime] = useState<Date | null>(null);
  
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

  // Handle auto-refresh functionality
  useEffect(() => {
    let refreshTimer: NodeJS.Timeout | null = null;
    
    if (autoRefresh && !syncLoading) {
      // Set the next refresh time
      const nextTime = new Date();
      nextTime.setTime(nextTime.getTime() + AUTO_REFRESH_INTERVAL);
      setNextRefreshTime(nextTime);
      
      // Set up the refresh timer
      refreshTimer = setInterval(() => {
        console.log("Auto-refreshing Salesforce data...");
        syncSalesforceData();
        
        // Update next refresh time
        const newNextTime = new Date();
        newNextTime.setTime(newNextTime.getTime() + AUTO_REFRESH_INTERVAL);
        setNextRefreshTime(newNextTime);
      }, AUTO_REFRESH_INTERVAL);
      
      console.log(`Auto-refresh enabled - will refresh every ${AUTO_REFRESH_INTERVAL / 60000} minutes`);
    } else {
      setNextRefreshTime(null);
    }
    
    // Cleanup on component unmount or when autoRefresh changes
    return () => {
      if (refreshTimer) {
        clearInterval(refreshTimer);
        console.log("Auto-refresh timer cleared");
      }
    };
  }, [autoRefresh, syncLoading, syncSalesforceData]);

  const handleSelectCampus = (campusId: string | null, campusName: string | null) => {
    setSelectedCampusId(campusId);
    setSelectedCampusName(campusName);
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  const formatTimeLeft = () => {
    if (!nextRefreshTime) return "";
    
    const now = new Date();
    const diffMs = nextRefreshTime.getTime() - now.getTime();
    
    if (diffMs <= 0) return "Refreshing soon...";
    
    const minutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);
    
    return `${minutes}m ${seconds}s`;
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

        <div className="mb-6">
          <DashboardHeader 
            title="Salesforce Data" 
            onRefresh={syncSalesforceData}
            isLoading={syncLoading}
            lastRefreshed={lastRefreshed}
          />
          
          <div className="flex items-center mt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 mr-6">
              <Switch 
                id="auto-refresh" 
                checked={autoRefresh} 
                onCheckedChange={toggleAutoRefresh}
                disabled={syncLoading}
              />
              <Label htmlFor="auto-refresh">Auto-refresh every 15 minutes</Label>
            </div>
            
            {autoRefresh && nextRefreshTime && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Next refresh in: {formatTimeLeft()}</span>
              </div>
            )}
          </div>
        </div>

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
