import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Supabase URL and key from .env file
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY;

// Create client
const supabase = createClient(supabaseUrl, supabaseKey);

// Simple function to directly run a query
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

// Function to update the query_salesforce_table function
async function updateFunctionStep() {
  console.log('Step 1: Dropping existing function...');
  
  // First, drop the existing function
  const dropResult = await runQuery(`
    DROP FUNCTION IF EXISTS public.query_salesforce_table(text, integer);
  `);
  
  if (!dropResult.success) {
    console.log('Failed to drop function, but will try to create anyway');
  } else {
    console.log('Successfully dropped function');
  }
  
  console.log('\nStep 2: Creating new function...');
  
  // Create the new function
  const createResult = await runQuery(`
    CREATE OR REPLACE FUNCTION public.query_salesforce_table(table_name text, limit_count integer)
    RETURNS SETOF json
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      IF table_name IS NULL OR table_name = '' THEN
        RAISE EXCEPTION 'Table name cannot be null or empty';
      END IF;
      
      IF limit_count IS NULL OR limit_count <= 0 THEN
        RAISE EXCEPTION 'Limit count must be a positive integer';
      END IF;
      
      RETURN QUERY EXECUTE format('SELECT row_to_json(t) FROM (SELECT * FROM fivetran_views.%I LIMIT %L) t', table_name, limit_count);
    END;
    $$;
  `);
  
  if (!createResult.success) {
    console.log('Failed to create function');
    return false;
  }
  
  console.log('Successfully created function');
  
  console.log('\nStep 3: Setting privileges...');
  
  // Set privileges
  const commentsResult = await runQuery(`
    COMMENT ON FUNCTION public.query_salesforce_table IS 'Safely query a table in the fivetran_views schema with a limit';
  `);
  
  if (!commentsResult.success) {
    console.log('Failed to set comment, but continuing');
  } else {
    console.log('Successfully set comment');
  }
  
  const revokeResult = await runQuery(`
    REVOKE ALL ON FUNCTION public.query_salesforce_table(text, integer) FROM PUBLIC;
  `);
  
  if (!revokeResult.success) {
    console.log('Failed to revoke privileges, but continuing');
  } else {
    console.log('Successfully revoked privileges');
  }
  
  const grantAuthResult = await runQuery(`
    GRANT EXECUTE ON FUNCTION public.query_salesforce_table(text, integer) TO authenticated;
  `);
  
  if (!grantAuthResult.success) {
    console.log('Failed to grant authenticated privileges, but continuing');
  } else {
    console.log('Successfully granted authenticated privileges');
  }
  
  const grantServiceResult = await runQuery(`
    GRANT EXECUTE ON FUNCTION public.query_salesforce_table(text, integer) TO service_role;
  `);
  
  if (!grantServiceResult.success) {
    console.log('Failed to grant service_role privileges');
  } else {
    console.log('Successfully granted service_role privileges');
  }
  
  return true;
}

// Run the update process
updateFunctionStep()
  .then(success => {
    if (success) {
      console.log('\nFunction update completed successfully!');
    } else {
      console.log('\nFunction update had errors. Check logs above.');
    }
  })
  .catch(err => {
    console.error('Unexpected error during update:', err);
  });