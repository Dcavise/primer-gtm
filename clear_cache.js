import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Supabase URL and key from .env file
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY;

// Create client
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to run a SQL query
async function runQuery(queryText) {
  try {
    const { data, error } = await supabase.rpc('execute_sql_query', {
      query_text: queryText
    });
    
    if (error) {
      console.error('Error executing query:', error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (err) {
    console.error('Exception executing query:', err);
    return { success: false, error: err };
  }
}

// Function to try and clear cache or refresh functions
async function refreshFunctions() {
  console.log('Refreshing functions and clearing caches...');
  
  // Check for existing functions
  const functionsList = await runQuery(`
    SELECT proname, pronamespace 
    FROM pg_proc 
    WHERE proname IN ('query_salesforce_table', 'query_salesforce_view')
  `);
  
  if (functionsList.success && functionsList.data) {
    console.log('Found functions:', functionsList.data);
  } else {
    console.log('No functions found');
  }
  
  // Create a simple test function
  const testFunctionResult = await runQuery(`
    CREATE OR REPLACE FUNCTION public.test_fivetran_access(table_name text)
    RETURNS SETOF json
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      RETURN QUERY EXECUTE format('SELECT row_to_json(t) FROM (SELECT * FROM fivetran_views.%I LIMIT 1) t', 
                            table_name);
    END;
    $$
  `);
  
  console.log('Created test function:', testFunctionResult.success);
  
  // Try to access directly
  try {
    const testResult = await supabase.rpc('test_fivetran_access', { table_name: 'lead' });
    
    console.log('Test function result:', testResult.error ? 'Failed' : 'Success');
    if (testResult.error) {
      console.log('  Error:', testResult.error.message);
    } else if (testResult.data && testResult.data.length > 0) {
      console.log('  Data fields:', Object.keys(testResult.data[0]).slice(0, 5));
    }
  } catch (err) {
    console.error('Error calling test function:', err);
  }
  
  // Create a direct view access function
  const viewFunctionResult = await runQuery(`
    CREATE OR REPLACE FUNCTION public.test_view_access()
    RETURNS SETOF json
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      RETURN QUERY SELECT row_to_json(t) FROM (SELECT * FROM public.salesforce_lead LIMIT 1) t;
    END;
    $$
  `);
  
  console.log('Created view function:', viewFunctionResult.success);
  
  // Try the view function
  try {
    const viewResult = await supabase.rpc('test_view_access');
    
    console.log('View function result:', viewResult.error ? 'Failed' : 'Success');
    if (viewResult.error) {
      console.log('  Error:', viewResult.error.message);
    } else if (viewResult.data && viewResult.data.length > 0) {
      console.log('  Data fields:', Object.keys(viewResult.data[0]).slice(0, 5));
    }
  } catch (err) {
    console.error('Error calling view function:', err);
  }
}

// Run the function
refreshFunctions()
  .catch(err => {
    console.error('Unexpected error:', err);
  });