
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, RefreshCw, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type SyncStats = {
  lastSynced: string | null;
  syncedRecords: number | null;
  status: 'idle' | 'syncing' | 'success' | 'error';
  error: string | null;
};

export const RealEstatePipelineSync: React.FC = () => {
  const [syncStats, setSyncStats] = useState<SyncStats>({
    lastSynced: null,
    syncedRecords: null,
    status: 'idle',
    error: null
  });

  // Fetch the last sync status when component mounts
  useEffect(() => {
    fetchLastSyncStatus();
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
          // refresh our sync status to stay current
          fetchLastSyncStatus();
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

      if (data && data.length > 0) {
        // Get count of records
        const { count, error: countError } = await supabase
          .from('real_estate_pipeline')
          .select('*', { count: 'exact', head: true });

        if (countError) {
          console.error("Error counting records:", countError);
          return;
        }

        setSyncStats(prev => ({
          ...prev,
          lastSynced: data[0].last_updated,
          syncedRecords: count || 0
        }));
      }
    } catch (err) {
      console.error("Error in fetchLastSyncStatus:", err);
    }
  };

  const syncRealEstateData = async () => {
    setSyncStats(prev => ({ ...prev, status: 'syncing', error: null }));
    
    try {
      toast.info("Starting Real Estate Pipeline sync...");
      console.log("Invoking sync-real-estate-pipeline function");
      
      const { data, error } = await supabase.functions.invoke('sync-real-estate-pipeline');
      
      if (error) {
        console.error("Function error:", error);
        setSyncStats(prev => ({ 
          ...prev, 
          status: 'error',
          error: error.message || 'An error occurred during sync'
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
          error: errorMessage
        }));
        toast.error(`Sync failed: ${errorMessage}`);
        return;
      }
      
      console.log("Sync completed successfully:", data);
      setSyncStats({
        lastSynced: new Date().toISOString(),
        syncedRecords: data.result?.inserted || 0,
        status: 'success',
        error: null
      });
      toast.success(`Successfully synced ${data.result?.inserted || 0} real estate records`);
      
      // Refresh our data after successful sync
      fetchLastSyncStatus();
    } catch (err: any) {
      console.error("Error during sync:", err);
      setSyncStats(prev => ({ 
        ...prev, 
        status: 'error',
        error: err.message || 'An unexpected error occurred'
      }));
      toast.error(`Sync error: ${err.message || 'Unknown error'}`);
    }
  };

  const getSyncStatusDisplay = () => {
    switch (syncStats.status) {
      case 'syncing':
        return 'Syncing...';
      case 'success':
        return 'Synced';
      case 'error':
        return 'Failed';
      default:
        return syncStats.lastSynced ? 'Synced' : 'Not synced yet';
    }
  };

  const getSyncStatusIcon = () => {
    switch (syncStats.status) {
      case 'syncing':
        return <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return syncStats.lastSynced ? 
          <CheckCircle className="h-4 w-4 text-green-500" /> : 
          <Clock className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Real Estate Pipeline Sync</CardTitle>
        <CardDescription>
          Sync real estate pipeline data from Google Sheets to the database
        </CardDescription>
      </CardHeader>
      <CardContent>
        {syncStats.error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex gap-2 items-start text-red-800">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Sync failed</p>
              <p className="text-sm">{syncStats.error}</p>
            </div>
          </div>
        )}
        
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-sm items-center">
            <span className="text-muted-foreground">Status:</span>
            <div className="flex items-center gap-2">
              {getSyncStatusIcon()}
              <span className="font-medium">{getSyncStatusDisplay()}</span>
            </div>
          </div>
          
          {syncStats.lastSynced && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Last synced:</span>
                <span className="font-medium">
                  {new Date(syncStats.lastSynced).toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Records synced:</span>
                <span className="font-medium">{syncStats.syncedRecords}</span>
              </div>
            </>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={syncRealEstateData} 
          disabled={syncStats.status === 'syncing'}
          className="w-full"
        >
          {syncStats.status === 'syncing' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync Now
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RealEstatePipelineSync;
