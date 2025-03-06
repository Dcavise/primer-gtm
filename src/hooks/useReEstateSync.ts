
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useRealEstateSync() {
  const [isSyncing, setIsSyncing] = useState(false);

  const syncRealEstateData = async () => {
    setIsSyncing(true);
    try {
      // Trigger the sync-real-estate-pipeline-v2 edge function
      const response = await fetch('https://pudncilureqpzxrxfupr.supabase.co/functions/v1/sync-real-estate-pipeline-v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.auth.getSession().then(({ data }) => data.session?.access_token)}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error syncing real estate data:', errorText);
        toast.error('Failed to sync real estate data');
        return;
      }

      const result = await response.json();
      console.log('Sync result:', result);
      
      if (result.success) {
        toast.success(`Successfully synced ${result.result.inserted} real estate records`);
      } else {
        toast.error(`Failed to sync: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error triggering sync:', error);
      toast.error('Failed to sync real estate data');
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    isSyncing,
    syncRealEstateData
  };
}
