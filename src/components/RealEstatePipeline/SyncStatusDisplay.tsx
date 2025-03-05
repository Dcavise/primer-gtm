
import React, { useState } from 'react';
import { Loader2, CheckCircle, AlertTriangle, Clock, RefreshCw, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Google API constants (must match the ones in the edge function)
const SPREADSHEET_ID = "1sNaNYFCYEEPmh8t_uISJ9av2HatheCdce3ssRkgOFYU";

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

interface SyncStatusDisplayProps {
  syncStatus: SyncStatus;
  lastSyncTime: string | null;
  syncDebugInfo?: string | null;
  openSyncModal: () => void;
}

export const SyncStatusDisplay: React.FC<SyncStatusDisplayProps> = ({ 
  syncStatus, 
  lastSyncTime,
  syncDebugInfo,
  openSyncModal
}) => {
  const [showDebug, setShowDebug] = useState(false);

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
    <div className="flex flex-col bg-white rounded-lg shadow mb-6">
      <div className="flex justify-between items-center p-4">
        <div className="flex items-center gap-2">
          {getSyncStatusIcon()}
          <span className="font-medium">{getSyncStatusDisplay()}</span>
          {lastSyncTime && (
            <span className="text-sm text-muted-foreground ml-2">
              Last updated: {new Date(lastSyncTime).toLocaleString()}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {syncDebugInfo && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowDebug(!showDebug)}
            >
              {showDebug ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Hide Debug
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Show Debug
                </>
              )}
            </Button>
          )}
          <Button onClick={openSyncModal} size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync Data
          </Button>
        </div>
      </div>
      
      {showDebug && syncDebugInfo && (
        <div className="px-4 pb-4 pt-0">
          <div className="text-xs mb-2 flex items-center text-blue-700">
            <Info className="h-4 w-4 mr-1" />
            <span>Using Google Sheet ID: <code className="bg-blue-50 px-1 rounded">{SPREADSHEET_ID}</code></span>
          </div>
          <div className="bg-gray-100 p-3 rounded-md overflow-x-auto">
            <pre className="text-xs whitespace-pre-wrap">{syncDebugInfo}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default SyncStatusDisplay;
