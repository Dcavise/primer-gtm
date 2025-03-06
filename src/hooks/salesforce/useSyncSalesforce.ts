
import { useState } from 'react';
import { toast } from 'sonner';
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
    
    toast.info("Data source is changing. Sync functionality is currently unavailable.");
    console.log("Data source is changing. Sync functionality is currently unavailable.");
    
    try {
      // Mock sync process since the edge functions have been removed
      setTimeout(() => {
        setSyncStatus({
          leads: 'idle',
          opportunities: 'idle',
          fellows: 'idle'
        });
        
        toast.info("The Salesforce sync functionality has been removed as the data source is changing.");
        
        onSyncComplete();
        setSyncLoading(false);
      }, 1500);
      
    } catch (error: any) {
      console.error('Error in sync process:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      setSyncError(errorMessage);
      toast.error(`Error in sync process: ${errorMessage}`);
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
