
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle 
} from '@/components/ui/dialog';
import { Loader2, RefreshCw, Info, Database, ExternalLink } from 'lucide-react';

// Google API constants (must match the ones in the edge function)
const SPREADSHEET_ID = "1sNaNYFCYEEPmh8t_uISJ9av2HatheCdce3ssRkgOFYU";
const SHEET_RANGE = "Sheet1!A1:Z1000";

interface RealEstatePipelineSyncProps {
  isOpen: boolean;
  onClose: () => void;
  startSync: () => void;
  stopSync: () => void;
  isSyncing: boolean;
}

export const RealEstatePipelineSync: React.FC<RealEstatePipelineSyncProps> = ({
  isOpen,
  onClose,
  startSync,
  stopSync,
  isSyncing
}) => {
  // Build Google Sheets URL for display
  const googleSheetsUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sync Real Estate Pipeline</DialogTitle>
          <DialogDescription>
            Sync real estate pipeline data from Google Sheets to the database
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="flex items-center gap-2 mb-3 bg-blue-50 text-blue-700 p-2 rounded-md text-sm">
            <Database className="h-4 w-4" />
            <span className="font-medium">Using v2 Sync Implementation</span>
          </div>
          
          <p className="text-sm mb-4">
            This will pull the latest real estate pipeline data from Google Sheets 
            and update the database. The process may take a few moments to complete.
          </p>
          
          <div className="text-xs p-3 bg-blue-50 rounded-md text-blue-700 mb-4">
            <div className="flex items-center mb-1">
              <Info className="h-4 w-4 mr-1" />
              <span className="font-semibold">Sync Information:</span>
            </div>
            <p>Spreadsheet ID: <code className="bg-blue-100 px-1 rounded">{SPREADSHEET_ID}</code></p>
            <p>Sheet Range: <code className="bg-blue-100 px-1 rounded">{SHEET_RANGE}</code></p>
            <p className="mt-1">
              <a 
                href={googleSheetsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 hover:text-blue-900 underline"
              >
                View Google Sheet
              </a>
            </p>
          </div>
          
          <div className="text-xs p-3 bg-gray-50 rounded-md text-gray-700 mb-4">
            <p className="font-medium mb-1">How the v2 sync works:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Clears existing database records</li>
              <li>Fetches all data from Google Sheets</li>
              <li>Maps columns correctly (exact matches + case insensitive)</li>
              <li>Converts data types (booleans, numbers)</li>
              <li>Inserts all records in a single operation</li>
            </ol>
          </div>
          
          <div className="text-xs p-3 bg-amber-50 rounded-md text-amber-700 mb-4">
            <div className="flex items-center mb-1">
              <Info className="h-4 w-4 mr-1" />
              <span className="font-semibold">Alternative Method Available:</span>
            </div>
            <p className="mb-2">
              If this sync method doesn't work correctly with your data, try the Google Sheets Script method 
              instead. It runs directly in Google Sheets and has better control over data mapping.
            </p>
            <p>
              Switch to the "Google Sheets Script" tab when you return to the main page.
            </p>
          </div>
          
          {isSyncing && (
            <div className="flex items-center justify-center p-4 bg-blue-50 rounded-md text-blue-700">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              <span>Syncing data, please wait...</span>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSyncing}
          >
            Cancel
          </Button>
          
          {isSyncing ? (
            <Button
              type="button"
              variant="destructive"
              onClick={stopSync}
            >
              Stop Sync
            </Button>
          ) : (
            <Button
              type="button"
              onClick={startSync}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Start Sync
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RealEstatePipelineSync;
