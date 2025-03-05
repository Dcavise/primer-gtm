
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, RefreshCw, Users, ArrowUpRight, CheckCircle, Clock } from 'lucide-react';

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

  useEffect(() => {
    fetchCampuses();
    fetchStats();
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

  const syncSalesforceLeads = async () => {
    setSyncLoading(true);
    setSyncError(null);
    setShowDetailedError(false);
    
    try {
      console.log("Invoking sync-salesforce-leads function");
      const response = await supabase.functions.invoke('sync-salesforce-leads');
      
      if (response.error) {
        console.error("Edge function error:", response.error);
        throw new Error(response.error.message || 'Unknown error occurred');
      }
      
      if (!response.data.success) {
        console.error("Sync operation failed:", response.data);
        throw new Error(response.data.error || 'Sync operation failed');
      }
      
      let successMessage = `Successfully synced ${response.data.synced || 0} leads, matched ${response.data.matched || 0} with campuses`;
      
      if (response.data.fixed && response.data.fixed > 0) {
        successMessage += `, fixed ${response.data.fixed} lead campus ID mappings`;
      }
      
      if (response.data.fixedOpportunities && response.data.fixedOpportunities > 0) {
        successMessage += `, fixed ${response.data.fixedOpportunities} opportunity campus ID mappings`;
      }
      
      if (response.data.fixedFellows && response.data.fixedFellows > 0) {
        successMessage += `, fixed ${response.data.fixedFellows} fellow campus ID mappings`;
      }
      
      if (response.data.cleaned && response.data.cleaned > 0) {
        successMessage += `, cleaned ${response.data.cleaned} invalid campus references`;
      }
      
      toast.success(successMessage);
      
      // Refresh the stats after sync
      fetchStats();
      fetchCampuses();
    } catch (error: any) {
      console.error('Error syncing Salesforce leads:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      setSyncError(errorMessage);
      toast.error(`Error syncing leads data: ${errorMessage}`);
    } finally {
      setSyncLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Salesforce Analytics</h1>
        <Button 
          onClick={syncSalesforceLeads} 
          disabled={syncLoading}
          className="flex items-center gap-2"
        >
          {syncLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {syncLoading ? 'Syncing...' : 'Sync Salesforce Data'}
        </Button>
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
        <div className="flex items-center gap-4 mb-4">
          <Button 
            variant={selectedCampusId === null ? "default" : "outline"}
            onClick={() => {
              setSelectedCampusId(null);
              fetchStats();
            }}
          >
            All Campuses
          </Button>
          {campuses.map(campus => (
            <Button 
              key={campus.campus_id}
              variant={selectedCampusId === campus.campus_id ? "default" : "outline"}
              onClick={() => {
                setSelectedCampusId(campus.campus_id);
                fetchStats();
              }}
            >
              {campus.campus_name}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Fellows Card */}
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

        {/* Leads Card */}
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

        {/* Active Opportunities Card */}
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

        {/* Closed Won Opportunities Card */}
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
