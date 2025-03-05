
import React from 'react';
import { Loader2, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

interface SyncStatusDisplayProps {
  status: SyncStatus;
  lastSynced: string | null;
}

export const SyncStatusDisplay: React.FC<SyncStatusDisplayProps> = ({ 
  status, 
  lastSynced 
}) => {
  const getSyncStatusDisplay = () => {
    switch (status) {
      case 'syncing':
        return 'Syncing...';
      case 'success':
        return 'Synced';
      case 'error':
        return 'Failed';
      default:
        return lastSynced ? 'Synced' : 'Not synced yet';
    }
  };

  const getSyncStatusIcon = () => {
    switch (status) {
      case 'syncing':
        return <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return lastSynced ? 
          <CheckCircle className="h-4 w-4 text-green-500" /> : 
          <Clock className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <div className="flex items-center gap-2">
      {getSyncStatusIcon()}
      <span className="font-medium">{getSyncStatusDisplay()}</span>
    </div>
  );
};

export default SyncStatusDisplay;
