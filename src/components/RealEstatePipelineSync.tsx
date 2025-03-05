
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const RealEstatePipelineSync: React.FC = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [syncResult, setSyncResult] = useState<{ processed: number } | null>(null);
  const { toast } = useToast();

  const syncRealEstatePipeline = async () => {
    try {
      setIsSyncing(true);
      setSyncResult(null);

      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('sync-real-estate-pipeline', {
        method: 'POST'
      });

      if (error) {
        throw new Error(`Error syncing data: ${error.message}`);
      }

      console.log("Sync result:", data);

      // Update state with results
      setLastSynced(new Date());
      setSyncResult(data.result);

      toast({
        title: "Sync Successful",
        description: `Successfully processed ${data.result.processed} rows of Real Estate Pipeline data.`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error in syncRealEstatePipeline:", error);
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "An error occurred during sync",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-bold">Real Estate Pipeline Data Sync</CardTitle>
        <Button
          onClick={syncRealEstatePipeline}
          disabled={isSyncing}
          className="flex gap-2 items-center"
        >
          {isSyncing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Sync Now
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {lastSynced && (
            <p className="text-sm text-muted-foreground">
              Last synced: {lastSynced.toLocaleString()}
            </p>
          )}
          {syncResult && (
            <p className="text-sm">
              {syncResult.processed} rows processed in the last sync
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
