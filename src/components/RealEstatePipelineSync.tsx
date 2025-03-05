
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
import { Loader2, RefreshCw, Info, Database } from 'lucide-react';

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
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Refresh Real Estate Pipeline</DialogTitle>
          <DialogDescription>
            Refresh real estate pipeline data from the database
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="flex items-center gap-2 mb-3 bg-blue-50 text-blue-700 p-2 rounded-md text-sm">
            <Database className="h-4 w-4" />
            <span className="font-medium">Using Supabase Database</span>
          </div>
          
          <p className="text-sm mb-4">
            This will fetch the latest real estate pipeline data from the Supabase database. 
            The process may take a few moments to complete.
          </p>
          
          <div className="text-xs p-3 bg-gray-50 rounded-md text-gray-700 mb-4">
            <p className="font-medium mb-1">Data Source:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>CSV uploaded to Supabase real_estate_pipeline table</li>
              <li>Data is fetched directly from the database</li>
              <li>No external sync process required</li>
            </ol>
          </div>
          
          {isSyncing && (
            <div className="flex items-center justify-center p-4 bg-blue-50 rounded-md text-blue-700">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              <span>Fetching data, please wait...</span>
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
              Stop
            </Button>
          ) : (
            <Button
              type="button"
              onClick={startSync}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Data
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RealEstatePipelineSync;
