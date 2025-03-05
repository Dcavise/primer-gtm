
import React from 'react';
import { Loader2, CheckCircle, AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

interface SyncStatusDisplayProps {
  syncStatus: SyncStatus;
  lastSyncTime: string | null;
  openSyncModal: () => void;
}

export const SyncStatusDisplay: React.FC<SyncStatusDisplayProps> = ({ 
  syncStatus, 
  lastSyncTime,
  openSyncModal
}) => {
  const getSyncStatusDisplay = () => {
    switch (syncStatus) {
      case 'syncing':
        return 'Syncing...';
      case 'success':
        return 'Synced';
      case 'error':
        return 'Failed';
      default:
        return lastSyncTime ? 'Synced' : 'Not synced yet';
    }
  };

  const getSyncStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return lastSyncTime ? 
          <CheckCircle className="h-4 w-4 text-green-500" /> : 
          <Clock className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <div className="flex justify-between items-center p-4 bg-white rounded-lg shadow mb-6">
      <div className="flex items-center gap-2">
        {getSyncStatusIcon()}
        <span className="font-medium">{getSyncStatusDisplay()}</span>
        {lastSyncTime && (
          <span className="text-sm text-muted-foreground ml-2">
            Last updated: {new Date(lastSyncTime).toLocaleString()}
          </span>
        )}
      </div>
      <Button onClick={openSyncModal} size="sm" className="ml-auto">
        <RefreshCw className="mr-2 h-4 w-4" />
        Sync Data
      </Button>
    </div>
  );
};

export default SyncStatusDisplay;
