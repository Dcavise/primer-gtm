import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export interface SummaryStats {
  fellowsCount: number;
  leadsCount: number;
  activeOpportunitiesCount: number;
  closedWonOpportunitiesCount: number;
}

export interface Campus {
  campus_id: string;
  campus_name: string;
}

export interface SyncStatus {
  leads: 'idle' | 'loading' | 'success' | 'error';
  opportunities: 'idle' | 'loading' | 'success' | 'error';
  fellows: 'idle' | 'loading' | 'success' | 'error';
}

export const useSalesforceData = (selectedCampusId: string | null) => {
  const [stats, setStats] = useState<SummaryStats>({
    fellowsCount: 0,
    leadsCount: 0,
    activeOpportunitiesCount: 0,
    closedWonOpportunitiesCount: 0
  });
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
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
      
      // Log available campuses for debugging
      const { data: allCampuses } = await supabase.from('campuses').select('campus_id, campus_name');
      console.log("Available campuses:", allCampuses);
      
      // Fetch fellows count with proper filtering
      let query = supabase
        .from('fellows')
        .select('*', { count: 'exact' });
      
      // Only exclude specific statuses, keeping NULL values
      // Using .not() with 'eq' will allow NULL values to pass through
      query = query.not('fte_employment_status', 'eq', 'Exiting')
                   .not('fte_employment_status', 'eq', 'Declined FTE Offer');
      
      if (selectedCampusId) {
        // Get the campus name for the selected campus ID
        const { data: campusData } = await supabase
          .from('campuses')
          .select('campus_name')
          .eq('campus_id', selectedCampusId)
          .single();
        
        const campusName = campusData?.campus_name;
        console.log(`Selected campus: ID=${selectedCampusId}, Name=${campusName}`);
        
        if (campusName) {
          // Use OR filter with multiple conditions for more reliable campus matching
          query = query.or(`campus_id.eq.${selectedCampusId},campus.eq.${campusName},campus.ilike.%${campusName}%`);
          console.log(`Using enhanced campus filter: campus_id=${selectedCampusId} OR campus=${campusName} OR campus ILIKE %${campusName}%`);
        } else {
          console.log(`Campus name not found for ID: ${selectedCampusId}, using ID only`);
          query = query.eq('campus_id', selectedCampusId);
        }
      }
      
      const { count: fellowsCount, error: fellowsError, data: fellowsData } = await query;
      
      if (fellowsError) throw fellowsError;
      
      // Log fellows data for debugging
      console.log(`Found ${fellowsCount || 0} fellows matching criteria`);
      if (fellowsData && fellowsData.length > 0) {
        console.log("Sample of fellows data:", fellowsData.slice(0, 5));
        
        // Log employment status distribution for debugging
        const statusCounts = fellowsData.reduce((acc, fellow) => {
          const status = fellow.fte_employment_status || 'NULL';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        console.log("Employment status distribution:", statusCounts);
      }
      
      // Fetch leads count
      let leadsQuery = supabase
        .from('salesforce_leads')
        .select('lead_id', { count: 'exact', head: true });
      
      if (selectedCampusId) {
        leadsQuery = leadsQuery.eq('campus_id', selectedCampusId);
      }
      
      const { count: leadsCount, error: leadsError } = await leadsQuery;
      
      if (leadsError) throw leadsError;
      
      // Fetch active opportunities count (not Closed Won or Closed Lost)
      let activeOppsQuery = supabase
        .from('salesforce_opportunities')
        .select('opportunity_id', { count: 'exact', head: true })
        .not('stage', 'in', '("Closed Won","Closed Lost")');
      
      if (selectedCampusId) {
        activeOppsQuery = activeOppsQuery.eq('campus_id', selectedCampusId);
      }
      
      const { count: activeOppsCount, error: activeOppsError } = await activeOppsQuery;
      
      if (activeOppsError) throw activeOppsError;
      
      // Fetch closed won opportunities count
      let closedWonOppsQuery = supabase
        .from('salesforce_opportunities')
        .select('opportunity_id', { count: 'exact', head: true })
        .eq('stage', 'Closed Won');
      
      if (selectedCampusId) {
        closedWonOppsQuery = closedWonOppsQuery.eq('campus_id', selectedCampusId);
      }
      
      const { count: closedWonOppsCount, error: closedWonOppsError } = await closedWonOppsQuery;
      
      if (closedWonOppsError) throw closedWonOppsError;
      
      console.log("Stats fetched successfully:", {
        fellowsCount,
        leadsCount: leadsCount,
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
      
      setLastRefreshed(new Date());
      
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load analytics data');
    }
  };

  const syncSalesforceData = async () => {
    setSyncLoading(true);
    setSyncError(null);
    
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

  return {
    stats,
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
