import React, { useState } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SyncErrorAlertProps {
  error: string;
  details?: Record<string, any>;
}

export const SyncErrorAlert: React.FC<SyncErrorAlertProps> = ({
  error,
  details,
}) => {
  const [showDetailedError, setShowDetailedError] = useState(false);

  return (
    <Alert variant="destructive" className="mb-6">
      <div className="flex items-start">
        <AlertCircle className="h-4 w-4 mt-0.5" />
        <div className="ml-2">
          <AlertTitle>Error Syncing Data</AlertTitle>
          <AlertDescription className="mt-1">
            <p>{error}</p>

            {details && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 p-0 h-auto text-xs flex items-center text-destructive hover:text-destructive hover:bg-transparent"
                onClick={() => setShowDetailedError(!showDetailedError)}
              >
                {showDetailedError ? (
                  <>
                    Hide Details <ChevronUp className="h-3 w-3 ml-1" />
                  </>
                ) : (
                  <>
                    Show Details <ChevronDown className="h-3 w-3 ml-1" />
                  </>
                )}
              </Button>
            )}

            {showDetailedError && details && (
              <div className="mt-2 text-xs bg-destructive/10 p-3 rounded whitespace-pre-wrap">
                <strong>Error Details:</strong>
                <pre className="mt-1 overflow-auto max-h-36">
                  {JSON.stringify(details, null, 2)}
                </pre>
              </div>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
};
