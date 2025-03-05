
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
import { Loader2, RefreshCw } from 'lucide-react';

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
          <DialogTitle>Sync Real Estate Pipeline</DialogTitle>
          <DialogDescription>
            Sync real estate pipeline data from Google Sheets to the database
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm mb-4">
            This will pull the latest real estate pipeline data from Google Sheets 
            and update the database. The process may take a few moments to complete.
          </p>
          
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
