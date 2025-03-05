
import React, { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const RealEstatePipelineSync: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncedRecords, setSyncedRecords] = useState<number | null>(null);

  const syncRealEstateData = async () => {
    setIsLoading(true);
    setSyncError(null);
    
    try {
      toast.info("Starting Real Estate Pipeline sync...");
      console.log("Invoking sync-real-estate-pipeline function");
      
      const { data, error } = await supabase.functions.invoke('sync-real-estate-pipeline');
      
      if (error) {
        console.error("Function error:", error);
        setSyncError(error.message || 'An error occurred during sync');
        toast.error(`Sync failed: ${error.message}`);
        return;
      }
      
      if (!data || !data.success) {
        const errorMessage = data?.error || 'Unknown error';
        console.error("Sync error:", errorMessage);
        setSyncError(errorMessage);
        toast.error(`Sync failed: ${errorMessage}`);
        return;
      }
      
      console.log("Sync completed successfully:", data);
      setLastSynced(new Date().toISOString());
      setSyncedRecords(data.result?.inserted || 0);
      toast.success(`Successfully synced ${data.result?.inserted || 0} real estate records`);
    } catch (err: any) {
      console.error("Error during sync:", err);
      setSyncError(err.message || 'An unexpected error occurred');
      toast.error(`Sync error: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
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
        {syncError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex gap-2 items-start text-red-800">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Sync failed</p>
              <p className="text-sm">{syncError}</p>
            </div>
          </div>
        )}
        
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Status:</span>
            <span className="font-medium">
              {isLoading ? 'Syncing...' : lastSynced ? 'Synced' : 'Not synced yet'}
            </span>
          </div>
          
          {lastSynced && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Last synced:</span>
                <span className="font-medium">
                  {new Date(lastSynced).toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Records synced:</span>
                <span className="font-medium">{syncedRecords}</span>
              </div>
            </>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={syncRealEstateData} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
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
