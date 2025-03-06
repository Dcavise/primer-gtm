
import { useState } from 'react';
import { troubleshootSchemaAccess, testCrossSchemaMethods } from '@/utils/salesforce-access';
import { logger } from '@/utils/logger';

type DiagnosticStatus = 'idle' | 'running' | 'complete' | 'error';

interface DiagnosticResult {
  connectionSuccess?: boolean;
  salesforceAccess?: boolean;
  publicAccess?: boolean;
  availableSchemas?: string[];
  availableFunctions?: string[];
  detailedResults?: any;
  error?: string;
}

export const useSalesforceAccessDiagnostic = () => {
  const [status, setStatus] = useState<DiagnosticStatus>('idle');
  const [results, setResults] = useState<DiagnosticResult>({});

  const runDiagnostics = async () => {
    try {
      setStatus('running');
      logger.info('Starting Salesforce access diagnostics');
      
      // Step 1: Check schema access
      const schemaResults = await troubleshootSchemaAccess();
      
      // Step 2: Test cross-schema methods
      const methodResults = await testCrossSchemaMethods();
      
      // Compile results
      const availableSchemas = schemaResults.schemas 
        ? Object.entries(schemaResults.schemas)
            .filter(([_, info]) => info.accessible)
            .map(([name]) => name)
        : [];
            
      const availableFunctions = methodResults.results
        ? Object.entries(methodResults.results)
            .filter(([_, info]) => info.success)
            .map(([name]) => name)
        : [];
      
      const diagnosticResults: DiagnosticResult = {
        connectionSuccess: schemaResults.success,
        salesforceAccess: schemaResults.salesforceAccessible,
        publicAccess: schemaResults.schemas?.public?.accessible || false,
        availableSchemas,
        availableFunctions,
        detailedResults: {
          schemas: schemaResults.schemas,
          functions: methodResults.results
        }
      };
      
      setResults(diagnosticResults);
      setStatus('complete');
      logger.info('Diagnostics complete', diagnosticResults);
      
      return diagnosticResults;
    } catch (error) {
      const err = error as Error;
      logger.error('Error running diagnostics:', err);
      setResults({ error: err.message });
      setStatus('error');
      return { error: err.message };
    }
  };

  return {
    status,
    results,
    runDiagnostics,
    isRunning: status === 'running',
    hasResults: status === 'complete',
    hasError: status === 'error'
  };
};
