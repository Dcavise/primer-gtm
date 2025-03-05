
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/utils/format';
import { 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink 
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// Google API constants (must match the ones in the edge function)
const SPREADSHEET_ID = "1sNaNYFCYEEPmh8t_uISJ9av2HatheCdce3ssRkgOFYU";

interface SyncStatusDisplayProps {
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  lastSyncTime: string | null;
  syncDebugInfo: string | null;
  openSyncModal: () => void;
}

export const SyncStatusDisplay: React.FC<SyncStatusDisplayProps> = ({
  syncStatus,
  lastSyncTime,
  syncDebugInfo,
  openSyncModal,
}) => {
  const [showDebug, setShowDebug] = useState(false);

  const statusConfig = {
    idle: {
      icon: <Clock className="h-5 w-5 text-gray-400" />,
      label: 'Not synced yet',
      color: 'bg-gray-100 text-gray-600',
    },
    syncing: {
      icon: <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />,
      label: 'Syncing...',
      color: 'bg-blue-100 text-blue-600',
    },
    success: {
      icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      label: 'Sync successful',
      color: 'bg-green-100 text-green-600',
    },
    error: {
      icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
      label: 'Sync failed',
      color: 'bg-red-100 text-red-600',
    },
  };

  const { icon, label, color } = statusConfig[syncStatus];
  const googleSheetsUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Real Estate Pipeline Sync Status</span>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={openSyncModal}
              className="flex items-center"
              disabled={syncStatus === 'syncing'}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Data'}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {icon}
            <span className="font-medium">{label}</span>
            <span className={`text-xs px-2 py-1 rounded-full ${color}`}>
              {syncStatus}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            {lastSyncTime ? (
              <>Last synced: {formatDateTime(lastSyncTime)}</>
            ) : (
              <>Never synced</>
            )}
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium">Data Source</h4>
            <a 
              href={googleSheetsUrl}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline flex items-center"
            >
              View Google Sheet <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </div>
          <div className="text-sm bg-gray-50 p-3 rounded-md">
            <div className="mb-1">
              <span className="font-medium">Spreadsheet ID:</span> {SPREADSHEET_ID}
            </div>
          </div>
        </div>

        {syncDebugInfo && (
          <div className="mt-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center text-sm p-0"
              onClick={() => setShowDebug(!showDebug)}
            >
              {showDebug ? (
                <>
                  <ChevronUp className="mr-1 h-4 w-4" />
                  Hide Debug Info
                </>
              ) : (
                <>
                  <ChevronDown className="mr-1 h-4 w-4" />
                  Show Debug Info
                </>
              )}
            </Button>
            
            {showDebug && (
              <div className="bg-gray-50 p-3 rounded-md mt-2 overflow-auto max-h-60 text-xs">
                <pre className="text-gray-700 whitespace-pre-wrap">
                  {syncDebugInfo}
                </pre>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="bg-gray-50 text-sm text-gray-600">
        <p>
          Need help? Check the Supabase Edge Function logs for more details.
        </p>
      </CardFooter>
    </Card>
  );
};
