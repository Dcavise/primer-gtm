
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { AlertCircle, RefreshCw, Users, ArrowUpRight, CheckCircle, Clock } from 'lucide-react';
import { formatDate } from '@/utils/format';

interface SummaryStats {
  fellowsCount: number;
  leadsCount: number;
  activeOpportunitiesCount: number;
  closedWonOpportunitiesCount: number;
}

interface Campus {
  campus_id: string;
  campus_name: string;
}

interface SyncStatus {
  leads: 'idle' | 'loading' | 'success' | 'error';
  opportunities: 'idle' | 'loading' | 'success' | 'error';
  fellows: 'idle' | 'loading' | 'success' | 'error';
}

const SalesforceLeadsPage: React.FC = () => {
  const [stats, setStats] = useState<SummaryStats>({
    fellowsCount: 0,
    leadsCount: 0,
    activeOpportunitiesCount: 0,
    closedWonOpportunitiesCount: 0
  });
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [selectedCampusId, setSelectedCampusId] = useState<string | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [showDetailedError, setShowDetailedError] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    leads: 'idle',
    opportunities: 'idle',
    fellows: 'idle'
  });
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  useEffect(() => {
    fetchCampuses();
    fetchStats();
    setLastRefreshed(new Date());
  }, [selectedCampusId]);

  const fetchCampuses = async () => {
    try {
      const { data, error } = await supabase
        .from('campuses')
        .select('*')
        .order('campus_name');

      if (error) throw error;
      setCampuses(data || []);
    } catch (error) {
      console.error('Error fetching campuses:', error);
      toast.error('Failed to load campuses');
    }
  };

  const fetchStats = async () => {
    try {
      console.log("Fetching stats for campus:", selectedCampusId || "all campuses");
      
      // Fetch fellows count
      let fellowsQuery = supabase
        .from('fellows')
        .select('fellow_id', { count: 'exact' });
      
      if (selectedCampusId) {
        fellowsQuery = fellowsQuery.eq('campus_id', selectedCampusId);
      }
      
      const { count: fellowsCount, error: fellowsError } = await fellowsQuery;
      
      if (fellowsError) throw fellowsError;
      
      // Fetch leads count
      let leadsQuery = supabase
        .from('salesforce_leads')
        .select('lead_id', { count: 'exact' });
      
      if (selectedCampusId) {
        leadsQuery = leadsQuery.eq('campus_id', selectedCampusId);
      }
      
      const { count: leadsCount, error: leadsError } = await leadsQuery;
      
      if (leadsError) throw leadsError;
      
      // Fetch active opportunities count (not Closed Won or Closed Lost)
      let activeOppsQuery = supabase
        .from('salesforce_opportunities')
        .select('opportunity_id', { count: 'exact' })
        .not('stage', 'in', '("Closed Won","Closed Lost")');
      
      if (selectedCampusId) {
        activeOppsQuery = activeOppsQuery.eq('campus_id', selectedCampusId);
      }
      
      const { count: activeOppsCount, error: activeOppsError } = await activeOppsQuery;
      
      if (activeOppsError) throw activeOppsError;
      
      // Fetch closed won opportunities count
      let closedWonOppsQuery = supabase
        .from('salesforce_opportunities')
        .select('opportunity_id', { count: 'exact' })
        .eq('stage', 'Closed Won');
      
      if (selectedCampusId) {
        closedWonOppsQuery = closedWonOppsQuery.eq('campus_id', selectedCampusId);
      }
      
      const { count: closedWonOppsCount, error: closedWonOppsError } = await closedWonOppsQuery;
      
      if (closedWonOppsError) throw closedWonOppsError;
      
      console.log("Stats fetched successfully:", {
        fellowsCount,
        leadsCount,
        activeOppsCount: activeOppsCount,
        closedWonOppsCount: closedWonOppsCount
      });
      
      // Update stats
      setStats({
        fellowsCount: fellowsCount || 0,
        leadsCount: leadsCount || 0,
        activeOpportunitiesCount: activeOppsCount || 0,
        closedWonOpportunitiesCount: closedWonOppsCount || 0
      });
      
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load analytics data');
    }
  };

  const syncSalesforceData = async () => {
    setSyncLoading(true);
    setSyncError(null);
    setShowDetailedError(false);
    
    setSyncStatus({
      leads: 'loading',
      opportunities: 'loading',
      fellows: 'loading'
    });
    
    toast.info("Starting complete Salesforce data sync...");
    console.log("Starting complete data sync process");
    
    try {
      console.log("Invoking sync-salesforce-leads function");
      const leadsResponse = await supabase.functions.invoke('sync-salesforce-leads');
      
      console.log("Leads sync response:", leadsResponse);
      
      if (leadsResponse.error) {
        console.error("Leads sync error:", leadsResponse.error);
        setSyncStatus(prev => ({ ...prev, leads: 'error' }));
        toast.error(`Error syncing leads: ${leadsResponse.error.message || 'Unknown error'}`);
      } else if (!leadsResponse.data || !leadsResponse.data.success) {
        console.error("Leads sync failed:", leadsResponse.data);
        setSyncStatus(prev => ({ ...prev, leads: 'error' }));
        toast.error(`Leads sync failed: ${leadsResponse.data?.error || 'Unknown error'}`);
      } else {
        setSyncStatus(prev => ({ ...prev, leads: 'success' }));
        toast.success(`Synced ${leadsResponse.data.synced || 0} leads`);
      }
      
      console.log("Invoking sync-salesforce-opportunities function");
      const oppsResponse = await supabase.functions.invoke('sync-salesforce-opportunities');
      
      console.log("Opportunities sync response:", oppsResponse);
      
      if (oppsResponse.error) {
        console.error("Opportunities sync error:", oppsResponse.error);
        setSyncStatus(prev => ({ ...prev, opportunities: 'error' }));
        toast.error(`Error syncing opportunities: ${oppsResponse.error.message || 'Unknown error'}`);
      } else if (!oppsResponse.data || !oppsResponse.data.success) {
        console.error("Opportunities sync failed:", oppsResponse.data);
        setSyncStatus(prev => ({ ...prev, opportunities: 'error' }));
        toast.error(`Opportunities sync failed: ${oppsResponse.data?.error || 'Unknown error'}`);
      } else {
        setSyncStatus(prev => ({ ...prev, opportunities: 'success' }));
        toast.success(`Synced ${oppsResponse.data.synced || 0} opportunities`);
      }
      
      console.log("Invoking sync-fellows-data function");
      const fellowsResponse = await supabase.functions.invoke('sync-fellows-data');
      
      console.log("Fellows sync response:", fellowsResponse);
      
      if (fellowsResponse.error) {
        console.error("Fellows sync error:", fellowsResponse.error);
        setSyncStatus(prev => ({ ...prev, fellows: 'error' }));
        toast.error(`Error syncing fellows: ${fellowsResponse.error.message || 'Unknown error'}`);
      } else if (!fellowsResponse.data || !fellowsResponse.data.success) {
        console.error("Fellows sync failed:", fellowsResponse.data);
        setSyncStatus(prev => ({ ...prev, fellows: 'error' }));
        toast.error(`Fellows sync failed: ${fellowsResponse.data?.error || 'Unknown error'}`);
      } else {
        setSyncStatus(prev => ({ ...prev, fellows: 'success' }));
        toast.success(`Synced ${fellowsResponse.data.result?.inserted || 0} fellows`);
      }
      
      const hasErrors = Object.values(syncStatus).some(status => status === 'error');
      
      if (hasErrors) {
        console.warn("Some sync operations failed");
        toast.warning("Some data sync operations completed with errors. Check console for details.");
      } else {
        console.log("All sync operations completed successfully");
        toast.success("All data synchronized successfully!");
      }
      
      fetchStats();
      fetchCampuses();
      setLastRefreshed(new Date());
      
    } catch (error: any) {
      console.error('Error in sync process:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      setSyncError(errorMessage);
      toast.error(`Error in sync process: ${errorMessage}`);
    } finally {
      setSyncLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Salesforce Analytics</h1>
        <div className="flex flex-col items-end">
          <Button 
            onClick={syncSalesforceData} 
            disabled={syncLoading}
            className="flex items-center gap-2"
          >
            {syncLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {syncLoading ? 'Refreshing...' : 'Refresh Data'}
          </Button>
          {lastRefreshed && (
            <span className="text-xs text-muted-foreground mt-1">
              Last refreshed: {lastRefreshed.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {syncError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Syncing Data</AlertTitle>
          <AlertDescription>
            {syncError}
            {!showDetailedError && (
              <button 
                onClick={() => setShowDetailedError(true)}
                className="text-xs underline ml-2"
              >
                Show Details
              </button>
            )}
            {showDetailedError && (
              <pre className="mt-2 text-xs bg-black/10 p-2 rounded whitespace-pre-wrap">
                {syncError}
              </pre>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Select
            value={selectedCampusId || "all"}
            onValueChange={(value) => setSelectedCampusId(value === "all" ? null : value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select campus" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Campuses</SelectItem>
              {campuses.map(campus => (
                <SelectItem key={campus.campus_id} value={campus.campus_id}>
                  {campus.campus_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            {selectedCampusId ? `Showing data for selected campus` : 'Showing data for all campuses'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Fellows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats.fellowsCount}</div>
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {selectedCampusId ? 'Fellows at this campus' : 'Total Fellows'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats.leadsCount}</div>
              <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {selectedCampusId ? 'Leads for this campus' : 'Total Leads'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats.activeOpportunitiesCount}</div>
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Not Closed Won/Lost
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Closed Won
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats.closedWonOpportunitiesCount}</div>
              <CheckCircle className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Successful opportunities
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SalesforceLeadsPage;
