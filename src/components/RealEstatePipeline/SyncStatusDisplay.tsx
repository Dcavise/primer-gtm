
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
  ExternalLink,
  Database
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
  const edgeFunctionUrl = `https://pudncilureqpzxrxfupr.supabase.co/functions/v1/sync-real-estate-pipeline-v2`;

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

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
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
              <div className="text-xs text-gray-500 mt-2">
                <p>This integration uses a completely new implementation that:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Fetches all data from Google Sheets</li>
                  <li>Maps columns correctly to database fields</li>
                  <li>Performs a fresh sync on each run</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium">Sync Information</h4>
              <div className="flex items-center text-xs text-gray-500">
                <Database className="h-3 w-3 mr-1" />
                <span>Using v2 Implementation</span>
              </div>
            </div>
            <div className="text-sm bg-gray-50 p-3 rounded-md">
              <div className="mb-1">
                <span className="font-medium">Edge Function:</span> sync-real-estate-pipeline-v2
              </div>
              <div className="text-xs text-gray-500 mt-2">
                <p>The sync process:</p>
                <ol className="list-decimal list-inside mt-1 space-y-1">
                  <li>Clears existing data</li>
                  <li>Processes and validates new data</li>
                  <li>Inserts all records at once</li>
                </ol>
              </div>
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
          View the Edge Function logs in the Supabase dashboard for detailed sync information.
        </p>
      </CardFooter>
    </Card>
  );
};
