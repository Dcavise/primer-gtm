
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface SyncErrorAlertProps {
  error: string;
}

export const SyncErrorAlert: React.FC<SyncErrorAlertProps> = ({ error }) => {
  return (
    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex gap-2 items-start text-red-800">
      <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-medium">Sync failed</p>
        <p className="text-sm">{error}</p>
      </div>
    </div>
  );
};

export default SyncErrorAlert;
