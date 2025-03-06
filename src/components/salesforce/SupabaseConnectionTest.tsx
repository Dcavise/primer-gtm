import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

export const SupabaseConnectionTest: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<string>('Not tested');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sfStatus, setSfStatus] = useState<string>('Not tested');
  const [sfLoading, setSfLoading] = useState<boolean>(false);
  const [envVariables, setEnvVariables] = useState<string>('');
  const [envLoading, setEnvLoading] = useState<boolean>(false);

  const testConnection = async () => {
    setIsLoading(true);
    setConnectionStatus('Testing...');
    try {
      // Use the unified client's testConnection method
      const result = await supabase.testConnection();

      if (result.success) {
        const publicAccess = result.publicSchema;
        const fivetranAccess = result.fivetranViewsSchema;
        const adminUsed = result.usedAdminClient;
        
        const statusText = `
          Connection Test:
          - Public schema access: ${publicAccess ? 'Success' : 'Failed'}
          - Fivetran views schema access: ${fivetranAccess ? 'Success' : 'Failed'}
          - Used admin client: ${adminUsed ? 'Yes' : 'No'}
        `;
        
        setConnectionStatus(statusText);
        
        toast({
          title: "Connection Test Results",
          description: publicAccess 
            ? `Successfully connected to database${fivetranAccess ? ' with Salesforce access' : ''}`
            : "Connected but limited schema access",
          variant: publicAccess ? "default" : "warning",
        });
      } else {
        setConnectionStatus(`Error: ${result.error?.message || 'Connection failed'}`);
        toast({
          title: "Connection Failed",
          description: `Error: ${result.error?.message || 'Unknown error'}`,
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('Connection test exception:', err);
      setConnectionStatus(`Exception: ${err.message}`);
      toast({
        title: "Connection Exception",
        description: `Exception: ${err.message}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testSalesforceSchema = async () => {
    setSfLoading(true);
    setSfStatus('Testing...');
    
    try {
      // Test Salesforce table access using querySalesforceTable
      const { success, data, error, usingAdminClient } = await supabase.querySalesforceTable('lead', 1);

      if (success && data) {
        // Check for additional SF tables
        const tables = ['contact', 'opportunity', 'account'];
        const tableResults = await Promise.all(
          tables.map(async (table) => {
            const result = await supabase.querySalesforceTable(table, 1);
            return { table, accessible: result.success };
          })
        );
        
        const accessibleTables = tableResults
          .filter(result => result.accessible)
          .map(result => result.table);
        
        const statusText = `
          Salesforce Schema Access:
          - Lead table access: Success
          - Using admin client: ${usingAdminClient ? 'Yes' : 'No'}
          - Additional tables: ${accessibleTables.length > 0 ? accessibleTables.join(', ') : 'None'}
          - Sample data fields: ${Object.keys(data[0] || {}).slice(0, 5).join(', ')}...
        `;
        
        setSfStatus(statusText);
        
        toast({
          title: "Salesforce Access Verified",
          description: `Successfully accessed Salesforce data${usingAdminClient ? ' (using admin client)' : ''}`,
          variant: "default"
        });
      } else {
        // Check if schema exists even if table access failed
        try {
          const schemaResult = await supabase.executeRPC('execute_sql_query', {
            query_text: 'SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = \'fivetran_views\')'
          });
          
          const schemaExists = schemaResult.success && schemaResult.data && 
                               schemaResult.data[0] && schemaResult.data[0].exists;
          
          setSfStatus(`
            Salesforce Schema Check:
            - fivetran_views schema: ${schemaExists ? 'Exists' : 'Not found'}
            - Table access: Failed
            - Error: ${error?.message || 'Unknown error'}
          `);
        } catch (schemaError) {
          setSfStatus(`Error: ${error?.message || schemaError.message || 'Unknown error'}`);
        }
        
        toast({
          title: "Salesforce Access Failed",
          description: `Could not access Salesforce data: ${error?.message || 'Unknown error'}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Salesforce schema check failed:', error);
      setSfStatus(`Error: ${error.message || JSON.stringify(error)}`);
      toast({
        title: "Connection Error",
        description: `Failed to check Salesforce schema: ${error.message || "Unknown error"}`,
        variant: "destructive"
      });
    } finally {
      setSfLoading(false);
    }
  };

  const dumpEnvVariables = () => {
    setEnvLoading(true);
    try {
      // Get environment variables safely
      const envVars = {
        SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'Not set',
        SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set (hidden for security)' : 'Not set',
        SUPABASE_SERVICE_KEY: import.meta.env.VITE_SUPABASE_SERVICE_KEY ? 'Set (hidden for security)' : 'Not set',
        NODE_ENV: import.meta.env.MODE || 'Not set',
        BASE_URL: import.meta.env.BASE_URL || 'Not set',
      };
      
      setEnvVariables(JSON.stringify(envVars, null, 2));
    } catch (err) {
      console.error('Error dumping env variables:', err);
      setEnvVariables(`Error dumping env variables: ${err.message}`);
    } finally {
      setEnvLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Supabase Connection Test</CardTitle>
        <CardDescription>
          Test the connection to Supabase and Salesforce data access
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Database Connection Test</h3>
            <div className="flex space-x-2">
              <Button
                onClick={testConnection}
                disabled={isLoading}
                variant="outline"
              >
                {isLoading ? 'Testing...' : 'Test Connection'}
              </Button>
            </div>
            <div className="bg-muted p-2 rounded-md">
              <pre className="text-xs">{connectionStatus}</pre>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Salesforce Schema Access</h3>
            <div className="flex space-x-2">
              <Button
                onClick={testSalesforceSchema}
                disabled={sfLoading}
                variant="outline"
              >
                {sfLoading ? 'Testing...' : 'Test Salesforce Schema'}
              </Button>
            </div>
            <div className="bg-muted p-2 rounded-md">
              <pre className="text-xs">{sfStatus}</pre>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Environment Variables</h3>
            <div className="flex space-x-2">
              <Button
                onClick={dumpEnvVariables}
                disabled={envLoading}
                variant="outline"
              >
                {envLoading ? 'Loading...' : 'Show Environment Variables'}
              </Button>
            </div>
            {envVariables && (
              <div className="bg-muted p-2 rounded-md">
                <pre className="text-xs whitespace-pre-wrap">{envVariables}</pre>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};