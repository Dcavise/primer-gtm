import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin } from '@/integrations/supabase/admin-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

export const SupabaseConnectionTest: React.FC = () => {
  const [regularStatus, setRegularStatus] = useState<string>('Not tested');
  const [regularLoading, setRegularLoading] = useState<boolean>(false);
  const [adminStatus, setAdminStatus] = useState<string>('Not tested');
  const [adminLoading, setAdminLoading] = useState<boolean>(false);
  const [sfStatus, setSfStatus] = useState<string>('Not tested');
  const [sfLoading, setSfLoading] = useState<boolean>(false);
  const [envVariables, setEnvVariables] = useState<string>('');
  const [envLoading, setEnvLoading] = useState<boolean>(false);

  const testRegularConnection = async () => {
    setRegularLoading(true);
    setRegularStatus('Testing...');
    try {
      // Test with a simple query to the campuses table
      const { data, error } = await supabase
        .from('campuses')
        .select('id, campus_name')
        .limit(1);

      if (error) {
        console.error('Regular connection error:', error);
        setRegularStatus(`Error: ${error.message}`);
        toast({
          title: "Connection Error",
          description: `Regular client error: ${error.message}`,
          variant: "destructive"
        });
      } else {
        const resultText = data.length > 0 
          ? `Success! Found ${data.length} campuses. First one: ${data[0].campus_name}`
          : 'Success! Connected but no data found';
        setRegularStatus(resultText);
        toast({
          title: "Connection Success",
          description: "Regular client connection successful",
          variant: "default"
        });
      }
    } catch (err) {
      console.error('Regular connection exception:', err);
      setRegularStatus(`Exception: ${err.message}`);
      toast({
        title: "Connection Exception",
        description: `Regular client exception: ${err.message}`,
        variant: "destructive"
      });
    } finally {
      setRegularLoading(false);
    }
  };

  const testAdminConnection = async () => {
    setAdminLoading(true);
    setAdminStatus('Testing...');
    try {
      // Test admin connection with a simple query
      const { data, error } = await supabaseAdmin
        .from('campuses')
        .select('id, campus_name')
        .limit(1);

      if (error) {
        console.error('Admin connection error:', error);
        setAdminStatus(`Error: ${error.message}`);
        toast({
          title: "Connection Error",
          description: `Admin client error: ${error.message}`,
          variant: "destructive"
        });
      } else {
        const resultText = data.length > 0 
          ? `Success! Found ${data.length} campuses using admin client. First one: ${data[0].campus_name}`
          : 'Success! Connected but no data found';
        setAdminStatus(resultText);
        toast({
          title: "Connection Success",
          description: "Admin client connection successful",
          variant: "default"
        });
      }
    } catch (err) {
      console.error('Admin connection exception:', err);
      setAdminStatus(`Exception: ${err.message}`);
      toast({
        title: "Connection Exception",
        description: `Admin client exception: ${err.message}`,
        variant: "destructive"
      });
    } finally {
      setAdminLoading(false);
    }
  };

  const testSalesforceSchema = async () => {
    setSfLoading(true);
    setSfStatus('Testing...');
    
    try {
      // First attempt: Try the direct RPC call to check salesforce schema
      try {
        const { data, error } = await supabaseAdmin.rpc('execute_sql_query', {
          query_text: 'SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = \'salesforce\')',
          query_params: []
        });

        if (error) throw error;
        
        const exists = data && data[0] && data[0].exists;
        setSfStatus(`Success! Salesforce schema exists: ${exists ? 'Yes' : 'No'}`);
        toast({
          title: exists ? "Salesforce Schema Found" : "Salesforce Schema Not Found",
          description: exists 
            ? "Successfully verified Salesforce schema exists" 
            : "Connected to database but Salesforce schema doesn't exist",
        });
        return;
      } catch (rpcError: any) {
        // RPC function not found or not accessible, try alternative
        console.warn('RPC method unavailable:', rpcError.message);
        
        // Alternative: Just check if we can connect to the database with admin client
        const { data: adminData, error: adminError } = await supabaseAdmin
          .from('campuses')
          .select('*')
          .limit(1);

        if (adminError) throw adminError;
        
        setSfStatus(`Admin connection successful but execute_sql_query RPC is not available. Error: ${rpcError.message}`);
        toast({
          title: "RPC Function Not Available",
          description: "Admin connection works but the execute_sql_query function is missing. Contact your Supabase administrator.",
          variant: "default"
        });
      }
    } catch (error: any) {
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
        SUPABASE_SERVICE_ROLE: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY ? 'Set (hidden for security)' : 'Not set',
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
          Test the connection to Supabase using different clients
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Regular Client (Using Anon Key)</h3>
            <div className="flex space-x-2">
              <Button
                onClick={testRegularConnection}
                disabled={regularLoading}
                variant="outline"
              >
                {regularLoading ? 'Testing...' : 'Test Regular Connection'}
              </Button>
            </div>
            <div className="bg-muted p-2 rounded-md">
              <pre className="text-xs">{regularStatus}</pre>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Admin Client (Using Service Role Key)</h3>
            <div className="flex space-x-2">
              <Button
                onClick={testAdminConnection}
                disabled={adminLoading}
                variant="outline"
              >
                {adminLoading ? 'Testing...' : 'Test Admin Connection'}
              </Button>
            </div>
            <div className="bg-muted p-2 rounded-md">
              <pre className="text-xs">{adminStatus}</pre>
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