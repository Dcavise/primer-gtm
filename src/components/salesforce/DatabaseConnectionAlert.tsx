
import React, { useState } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Database, CheckCircle2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSalesforceAccessDiagnostic } from '@/hooks/use-salesforce-access-diagnostic';
import { logger } from '@/utils/logger';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

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
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const { status: diagStatus, results, runDiagnostics, isRunning } = useSalesforceAccessDiagnostic();
  
  const handleRunDiagnostics = async () => {
    setShowDiagnostics(true);
    await runDiagnostics();
  };
  
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
  
  const renderDiagnosticResults = () => {
    if (!showDiagnostics) return null;
    
    if (isRunning) {
      return (
        <div className="mt-3 p-3 bg-gray-50 rounded">
          <div className="flex items-center text-sm">
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Running diagnostics...
          </div>
        </div>
      );
    }
    
    if (diagStatus === 'complete') {
      return (
        <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="basic-results">
              <AccordionTrigger className="py-2 text-sm font-medium">
                Basic Diagnostic Results
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-1">
                  <p className="flex items-center mb-1">
                    {results.connectionSuccess ? 
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" /> : 
                      <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />}
                    Database connection: {results.connectionSuccess ? 'Successful' : 'Failed'}
                  </p>
                  <p className="flex items-center mb-1">
                    {results.publicAccess ? 
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" /> : 
                      <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />}
                    Public schema: {results.publicAccess ? 'Accessible' : 'Not accessible'}
                  </p>
                  <p className="flex items-center mb-1">
                    {results.salesforceAccess ? 
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" /> : 
                      <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />}
                    Salesforce schema: {results.salesforceAccess ? 'Accessible' : 'Not accessible'}
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            {results.availableSchemas?.length > 0 && (
              <AccordionItem value="available-schemas">
                <AccordionTrigger className="py-2 text-sm font-medium">
                  Available Schemas
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-5 text-xs space-y-1">
                    {results.availableSchemas.map(schema => (
                      <li key={schema}>{schema}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )}
            
            {results.availableFunctions?.length > 0 && (
              <AccordionItem value="available-functions">
                <AccordionTrigger className="py-2 text-sm font-medium">
                  Available Functions
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-5 text-xs space-y-1">
                    {results.availableFunctions.map(func => (
                      <li key={func}>{func}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )}
            
            {results.detailedResults && (
              <AccordionItem value="detailed-results">
                <AccordionTrigger className="py-2 text-sm font-medium">
                  Detailed Results (Advanced)
                </AccordionTrigger>
                <AccordionContent>
                  <div className="bg-gray-100 p-2 rounded overflow-auto max-h-64">
                    <pre className="text-xs whitespace-pre-wrap">
                      {JSON.stringify(results.detailedResults, null, 2)}
                    </pre>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </div>
      );
    }
    
    if (diagStatus === 'error') {
      return (
        <div className="mt-3 p-3 bg-red-50 rounded text-sm">
          <h4 className="font-medium text-red-700 mb-1">Diagnostic Error:</h4>
          <p className="text-red-600">{results.error}</p>
        </div>
      );
    }
    
    return null;
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
                  There was an issue connecting to the database. This could be due to:
                </p>
                {getSchemaStatusText()}
                <ul className="list-disc pl-5 mb-3 mt-3 text-sm space-y-1">
                  <li>Permission issues accessing the salesforce schema</li>
                  <li>Missing tables or views that the application expects</li>
                  <li>Network connectivity problems</li>
                </ul>
                <p className="mb-3 text-sm">
                  The application will display mock data where possible. If you need to see actual data, please contact your administrator or try the diagnostics below.
                </p>
                <div className="flex flex-wrap gap-2">
                  {onRetry && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={onRetry}
                      className="bg-white"
                    >
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                      Retry Connection
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRunDiagnostics}
                    disabled={isRunning}
                    className="bg-white"
                  >
                    {isRunning ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Database className="h-3.5 w-3.5 mr-1.5" />
                        Run Diagnostics
                      </>
                    )}
                  </Button>
                </div>
                
                {renderDiagnosticResults()}
              </div>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
};
