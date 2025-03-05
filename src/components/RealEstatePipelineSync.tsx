
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, RefreshCw } from 'lucide-react';
import useRealEstatePipelineSync from '@/hooks/useRealEstatePipelineSync';
import SyncStatusDisplay from './RealEstatePipeline/SyncStatusDisplay';
import SyncErrorAlert from './RealEstatePipeline/SyncErrorAlert';
import SyncStatsInfo from './RealEstatePipeline/SyncStatsInfo';

export const RealEstatePipelineSync: React.FC = () => {
  const { syncStats, syncRealEstateData } = useRealEstatePipelineSync();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Real Estate Pipeline Sync</CardTitle>
        <CardDescription>
          Sync real estate pipeline data from Google Sheets to the database
        </CardDescription>
      </CardHeader>
      <CardContent>
        {syncStats.error && <SyncErrorAlert error={syncStats.error} />}
        
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-sm items-center">
            <span className="text-muted-foreground">Status:</span>
            <SyncStatusDisplay 
              status={syncStats.status} 
              lastSynced={syncStats.lastSynced} 
            />
          </div>
          
          <SyncStatsInfo 
            lastSynced={syncStats.lastSynced}
            syncedRecords={syncStats.syncedRecords}
          />
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
