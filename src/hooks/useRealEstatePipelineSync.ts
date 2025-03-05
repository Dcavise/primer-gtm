
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type SyncStats = {
  lastSynced: string | null;
  syncedRecords: number | null;
  status: 'idle' | 'syncing' | 'success' | 'error';
  error: string | null;
  debugInfo?: string | null;
};

// Adding real estate property type for pipeline analytics
type RealEstateProperty = Tables<'real_estate_pipeline'>;

export const useRealEstatePipelineSync = () => {
  const [syncStats, setSyncStats] = useState<SyncStats>({
    lastSynced: null,
    syncedRecords: null,
    status: 'idle',
    error: null,
    debugInfo: null
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [properties, setProperties] = useState<RealEstateProperty[]>([]);

  // Fetch the last sync status and properties when hook is initialized
  useEffect(() => {
    fetchLastSyncStatus();
    fetchProperties();
  }, []);

  // Subscribe to real-time updates of the real_estate_pipeline table
  useEffect(() => {
    const channel = supabase
      .channel('real_estate_pipeline_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'real_estate_pipeline' }, 
        (payload) => {
          console.log('Real-time update received:', payload);
          // When we detect changes to the real_estate_pipeline table, 
          // refresh our sync status and properties to stay current
          fetchLastSyncStatus();
          fetchProperties();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Fetch the last sync status from Supabase
  const fetchLastSyncStatus = async () => {
    try {
      console.log("Fetching last sync status...");
      
      // Query the most recently updated record to get the last_updated timestamp
      const { data, error } = await supabase
        .from('real_estate_pipeline')
        .select('last_updated')
        .order('last_updated', { ascending: false })
        .limit(1);

      if (error) {
        console.error("Error fetching last sync status:", error);
        return;
      }

      console.log("Last sync data:", data);

      if (data && data.length > 0) {
        // Get count of records
        const { count, error: countError } = await supabase
          .from('real_estate_pipeline')
          .select('*', { count: 'exact', head: true });

        if (countError) {
          console.error("Error counting records:", countError);
          return;
        }

        console.log(`Found ${count} records in real_estate_pipeline table`);

        setSyncStats(prev => ({
          ...prev,
          lastSynced: data[0].last_updated,
          syncedRecords: count || 0
        }));
      } else {
        console.log("No records found in real_estate_pipeline table");
        setSyncStats(prev => ({
          ...prev,
          syncedRecords: 0
        }));
      }
    } catch (err) {
      console.error("Error in fetchLastSyncStatus:", err);
    }
  };

  // Fetch real estate properties for analytics
  const fetchProperties = async () => {
    try {
      console.log("Fetching properties...");
      
      const { data, error } = await supabase
        .from('real_estate_pipeline')
        .select('*');
      
      if (error) {
        console.error("Error fetching properties:", error);
        return;
      }
      
      console.log(`Fetched ${data?.length || 0} properties`);
      
      if (data && data.length > 0) {
        console.log("Sample property data:", data[0]);
      }
      
      setProperties(data || []);
    } catch (err) {
      console.error("Error in fetchProperties:", err);
    }
  };

  const startSync = async () => {
    setIsSyncing(true);
    await syncRealEstateData();
    setIsSyncing(false);
  };

  const stopSync = () => {
    // This is a placeholder for stopping a sync in progress
    // Currently not implemented in the backend
    setIsSyncing(false);
    toast.info("Sync operation stopped");
  };

  const syncRealEstateData = async () => {
    setSyncStats(prev => ({ 
      ...prev, 
      status: 'syncing', 
      error: null, 
      debugInfo: null 
    }));
    
    try {
      toast.info("Starting Real Estate Pipeline sync...");
      console.log("Invoking sync-real-estate-pipeline function");
      
      const { data, error } = await supabase.functions.invoke('sync-real-estate-pipeline');
      
      console.log("Edge function response:", data);
      
      if (error) {
        console.error("Function error:", error);
        setSyncStats(prev => ({ 
          ...prev, 
          status: 'error',
          error: error.message || 'An error occurred during sync',
          debugInfo: JSON.stringify(error)
        }));
        toast.error(`Sync failed: ${error.message}`);
        return;
      }
      
      if (!data || !data.success) {
        const errorMessage = data?.error || 'Unknown error';
        console.error("Sync error:", errorMessage);
        setSyncStats(prev => ({ 
          ...prev, 
          status: 'error',
          error: errorMessage,
          debugInfo: JSON.stringify(data)
        }));
        toast.error(`Sync failed: ${errorMessage}`);
        return;
      }
      
      console.log("Sync completed successfully:", data);
      setSyncStats({
        lastSynced: new Date().toISOString(),
        syncedRecords: data.result?.inserted || 0,
        status: 'success',
        error: null,
        debugInfo: JSON.stringify(data.result)
      });
      toast.success(`Successfully synced ${data.result?.inserted || 0} real estate records`);
      
      // Refresh our data after successful sync
      fetchLastSyncStatus();
      fetchProperties();
    } catch (err: any) {
      console.error("Error during sync:", err);
      setSyncStats(prev => ({ 
        ...prev, 
        status: 'error',
        error: err.message || 'An unexpected error occurred',
        debugInfo: JSON.stringify(err)
      }));
      toast.error(`Sync error: ${err.message || 'Unknown error'}`);
    }
  };

  return {
    syncStatus: syncStats.status,
    syncStats,
    syncError: syncStats.error,
    syncDebugInfo: syncStats.debugInfo,
    lastSyncTime: syncStats.lastSynced,
    pipelineAnalytics: properties,
    isSyncing,
    startSync,
    stopSync,
    syncRealEstateData,
    fetchLastSyncStatus
  };
};

export default useRealEstatePipelineSync;
