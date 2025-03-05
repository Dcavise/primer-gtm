
import React, { useState } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface SyncErrorAlertProps {
  error: string;
}

export const SyncErrorAlert: React.FC<SyncErrorAlertProps> = ({ error }) => {
  const [showDetailedError, setShowDetailedError] = useState(false);

  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error Syncing Data</AlertTitle>
      <AlertDescription>
        {error}
        {!showDetailedError && (
          <button 
            onClick={() => setShowDetailedError(true)}
            className="text-xs underline ml-2"
          >
            Show Details
          </button>
        )}
        {showDetailedError && (
          <pre className="mt-2 text-xs bg-black/10 p-2 rounded whitespace-pre-wrap">
            {error}
          </pre>
        )}
      </AlertDescription>
    </Alert>
  );
};
