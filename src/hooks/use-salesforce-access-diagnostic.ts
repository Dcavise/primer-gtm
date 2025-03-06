
import { useState } from 'react';
import { troubleshootSchemaAccess, testCrossSchemaMethods } from '@/utils/salesforce-access';
import { supabase } from '@/integrations/supabase/client';
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
  timestamp?: string;
  connectionInfo?: {
    url?: string;
    errorPath?: string;
  };
}

export const useSalesforceAccessDiagnostic = () => {
  const [status, setStatus] = useState<DiagnosticStatus>('idle');
  const [results, setResults] = useState<DiagnosticResult>({});

  const testSimpleQuery = async () => {
    try {
      // Try a simple query on the public schema
      const { data, error } = await supabase
        .from('campuses')
        .select('count')
        .limit(1);
      
      return { success: !error, data, error };
    } catch (err) {
      const error = err as Error;
      return { success: false, error: error.message };
    }
  };

  const runDiagnostics = async () => {
    try {
      setStatus('running');
      logger.info('Starting Salesforce access diagnostics');
      
      // Step 1: Check schema access
      const schemaResults = await troubleshootSchemaAccess();
      
      // Step 2: Test cross-schema methods
      const methodResults = await testCrossSchemaMethods();
      
      // Step 3: Test a simple query
      const simpleQueryResults = await testSimpleQuery();
      
      // Get URL info for troubleshooting
      const supabaseUrl = (window as any).SUPABASE_URL || 
                          (process.env.SUPABASE_URL || 'Not available');
      
      // Compile results
      const availableSchemas = schemaResults.schemas 
        ? Object.entries(schemaResults.schemas)
            .filter(([_, info]) => (info as any)?.accessible)
            .map(([name]) => name)
        : [];
            
      const availableFunctions = methodResults.results
        ? Object.entries(methodResults.results)
            .filter(([_, info]) => (info as any)?.success)
            .map(([name]) => name)
        : [];
      
      const diagnosticResults: DiagnosticResult = {
        connectionSuccess: schemaResults.success || simpleQueryResults.success,
        salesforceAccess: schemaResults.salesforceAccessible,
        publicAccess: schemaResults.schemas?.public?.accessible || simpleQueryResults.success,
        availableSchemas,
        availableFunctions,
        timestamp: new Date().toISOString(),
        connectionInfo: {
          url: supabaseUrl,
          errorPath: window.location.href
        },
        detailedResults: {
          schemas: schemaResults.schemas,
          functions: methodResults.results,
          simpleQuery: simpleQueryResults
        }
      };
      
      setResults(diagnosticResults);
      setStatus('complete');
      logger.info('Diagnostics complete', diagnosticResults);
      
      return diagnosticResults;
    } catch (error) {
      const err = error as Error;
      logger.error('Error running diagnostics:', err);
      setResults({ 
        error: err.message,
        timestamp: new Date().toISOString()
      });
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
    hasError: status === 'error',
    resetResults: () => {
      setResults({});
      setStatus('idle');
    }
  };
};
