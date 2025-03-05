
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { SyncStatus } from './types';

export const useSyncSalesforce = (onSyncComplete: () => void) => {
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    leads: 'idle',
    opportunities: 'idle',
    fellows: 'idle'
  });

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
      
      onSyncComplete();
      
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
    syncLoading,
    syncError,
    syncStatus,
    syncSalesforceData
  };
};
