
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, AreaChart, Activity } from 'lucide-react';

interface SyncStatsInfoProps {
  syncStats: {
    lastSynced: string | null;
    syncedRecords: number | null;
    status: 'idle' | 'syncing' | 'success' | 'error';
    error: string | null;
  };
}

export const SyncStatsInfo: React.FC<SyncStatsInfoProps> = ({ syncStats }) => {
  if (!syncStats.lastSynced) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Pipeline Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No data has been synced yet. Please start a sync operation.</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
          <BarChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{syncStats.syncedRecords || 0}</div>
          <p className="text-xs text-muted-foreground">
            Properties in pipeline
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
          <AreaChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {syncStats.lastSynced ? new Date(syncStats.lastSynced).toLocaleDateString() : 'N/A'}
          </div>
          <p className="text-xs text-muted-foreground">
            {syncStats.lastSynced ? new Date(syncStats.lastSynced).toLocaleTimeString() : 'Never synced'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sync Status</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold capitalize">{syncStats.status}</div>
          <p className="text-xs text-muted-foreground">
            {syncStats.status === 'success' ? 'Data is up to date' : 
             syncStats.status === 'syncing' ? 'Data is being updated' : 
             syncStats.status === 'error' ? 'Last sync failed' : 
             'Ready to sync'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SyncStatsInfo;
