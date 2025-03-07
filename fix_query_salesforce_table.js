import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Supabase URL and key from .env file
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY;

// Create client
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateFunction() {
  console.log('Updating query_salesforce_table function...');
  
  // The updated function definition - with comments intentionally removed for simplicity
  const functionDef = `
  CREATE OR REPLACE FUNCTION public.query_salesforce_table(table_name text, limit_count integer) 
  RETURNS SETOF json 
  LANGUAGE plpgsql 
  SECURITY DEFINER AS $$
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
  `;
  
  try {
    // Update the function
    const { data, error } = await supabase
      .rpc('execute_sql_query', {
        query_text: functionDef,
        query_params: []
      });
    
    if (error) {
      console.error('Error updating function:', error);
      return { success: false, error };
    }
    
    console.log('Function updated successfully');
    
    // Update grants
    const grantQuery = `
      COMMENT ON FUNCTION public.query_salesforce_table IS 'Safely query a table in the fivetran_views schema with a limit';
      REVOKE ALL ON FUNCTION public.query_salesforce_table FROM PUBLIC;
      GRANT EXECUTE ON FUNCTION public.query_salesforce_table TO authenticated;
      GRANT EXECUTE ON FUNCTION public.query_salesforce_table TO service_role;
    `;
    
    const { data: grantData, error: grantError } = await supabase
      .rpc('execute_sql_query', {
        query_text: grantQuery,
        query_params: []
      });
    
    if (grantError) {
      console.error('Error setting grants:', grantError);
      return { success: true, functionUpdated: true, grantsUpdated: false };
    }
    
    console.log('Grants updated successfully');
    
    return { success: true, functionUpdated: true, grantsUpdated: true };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error };
  }
}

updateFunction()
  .then(result => {
    console.log('Result:', result);
    if (result.success) {
      console.log('Function update complete');
    } else {
      console.log('Function update failed');
    }
  })
  .catch(err => {
    console.error('Unexpected error:', err);
  });