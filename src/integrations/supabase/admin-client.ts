import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://pudncilureqpzxrxfupr.supabase.co";
// Use the correct service role key provided by the user
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1ZG5jaWx1cmVxcHp4cnhmdXByIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTEyMzU1NSwiZXhwIjoyMDU2Njk5NTU1fQ.iqKJG8oVO_APMtp2B9gLZ8wIf7Xc4LuM_Qmfz5_WiZs";

// Create a client with special headers for admin operations
// This uses the service role key which has full access to the database
export const supabaseAdmin = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        'x-client-info': 'primer-analytics-dashboard-admin',
      },
    },
    db: {
      schema: 'public',
    },
  }
);

/**
 * Check if we can access the Salesforce schema
 * This now uses direct SQL queries which should work with the service role key
 */
export const checkSalesforceAccess = async () => {
  try {
    // Query to check if salesforce schema exists
    const { data, error } = await supabaseAdmin.rpc('execute_sql_query', {
      query_text: 'SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = \'salesforce\')',
      query_params: []
    });
    
    if (error) {
      console.error('Error checking Salesforce schema access:', error);
      return { success: false, error };
    }
    
    const exists = data && data[0] && data[0].exists;
    return { success: true, exists };
  } catch (err) {
    console.error('Exception checking Salesforce schema access:', err);
    return { success: false, error: err };
  }
};

/**
 * Execute a direct SQL query against the Salesforce schema
 * This requires the service role key
 */
export const querySalesforceSchema = async (query: string, params?: any[]) => {
  try {
    const { data, error } = await supabaseAdmin.rpc('execute_sql_query', {
      query_text: query,
      query_params: params || []
    });
    
    if (error) {
      console.error('Error executing SQL query:', error);
      return { success: false, error, data: null };
    }
    
    return { success: true, error: null, data };
  } catch (err) {
    console.error('Exception executing SQL query:', err);
    return { success: false, error: err, data: null };
  }
}; 