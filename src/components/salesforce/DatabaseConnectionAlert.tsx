
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Database, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SchemaStatus {
  public: boolean;
  salesforce: boolean;
}

interface DatabaseConnectionAlertProps {
  status: 'checking' | 'connected' | 'error';
  schemaStatus?: SchemaStatus;
  onRetry?: () => void;
}

export const DatabaseConnectionAlert: React.FC<DatabaseConnectionAlertProps> = ({ 
  status,
  schemaStatus = { public: false, salesforce: false },
  onRetry 
}) => {
  if (status === 'connected') {
    return null;
  }

  const getSchemaStatusText = () => {
    if (status === 'checking') return null;
    
    return (
      <div className="mt-1 space-y-1">
        <p className="text-sm flex items-center">
          {schemaStatus.public ? 
            <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" /> : 
            <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />}
          Public schema: {schemaStatus.public ? 'Connected' : 'Not connected'}
        </p>
        <p className="text-sm flex items-center">
          {schemaStatus.salesforce ? 
            <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" /> : 
            <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />}
          Salesforce schema: {schemaStatus.salesforce ? 'Connected' : 'Not connected'}
        </p>
      </div>
    );
  };

  return (
    <Alert variant={status === 'checking' ? 'default' : 'destructive'} className="mb-6">
      <div className="flex items-start">
        {status === 'checking' ? (
          <Database className="h-4 w-4 mt-0.5" />
        ) : (
          <AlertTriangle className="h-4 w-4 mt-0.5" />
        )}
        <div className="ml-2 flex-1">
          <AlertTitle>
            {status === 'checking' ? 'Checking Database Connection' : 'Database Connection Error'}
          </AlertTitle>
          <AlertDescription className="mt-1">
            {status === 'checking' ? (
              'Checking connection to the Supabase database...'
            ) : (
              <div>
                <p className="mb-2">
                  There was an issue connecting to the database. 
                </p>
                {getSchemaStatusText()}
                <ul className="list-disc pl-5 mb-3 mt-3 text-sm space-y-1">
                  <li>Permission issues accessing the salesforce schema</li>
                  <li>Missing tables or views that the application expects</li>
                  <li>Network connectivity problems</li>
                </ul>
                <p className="mb-3 text-sm">
                  The application will display mock data where possible. If you need to see actual data, please contact your administrator.
                </p>
                {onRetry && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onRetry}
                    className="mt-1"
                  >
                    Retry Connection
                  </Button>
                )}
              </div>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
};
