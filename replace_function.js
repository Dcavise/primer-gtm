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

async function replaceFunctions() {
  console.log('Replacing functions to use fivetran_views schema...');
  
  const steps = [
    {
      name: 'Drop query_salesforce_table',
      query: 'DROP FUNCTION IF EXISTS public.query_salesforce_table(text, integer)'
    },
    {
      name: 'Create new query_salesforce_table',
      query: `
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
          
          RETURN QUERY EXECUTE format('SELECT row_to_json(t) FROM (SELECT * FROM fivetran_views.%I LIMIT %L) t', 
                                table_name, limit_count);
        END;
        $$
      `
    },
    {
      name: 'Grant execute to query_salesforce_table',
      query: 'GRANT EXECUTE ON FUNCTION public.query_salesforce_table(text, integer) TO authenticated, service_role'
    },
    {
      name: 'Create alternative query_salesforce_wrapper',
      query: `
        CREATE OR REPLACE FUNCTION public.query_salesforce_wrapper(table_name text, limit_count integer)
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
          
          -- Use the public schema wrapper views
          RETURN QUERY EXECUTE format('SELECT row_to_json(t) FROM (SELECT * FROM public.salesforce_%I LIMIT %L) t', 
                                    table_name, limit_count);
        END;
        $$
      `
    },
    {
      name: 'Grant execute to query_salesforce_wrapper',
      query: 'GRANT EXECUTE ON FUNCTION public.query_salesforce_wrapper(text, integer) TO authenticated, service_role'
    }
  ];
  
  for (const step of steps) {
    console.log(`\nExecuting step: ${step.name}`);
    const result = await runQuery(step.query);
    
    if (!result.success) {
      console.log(`Step failed: ${step.name}`);
    } else {
      console.log(`Step succeeded: ${step.name}`);
    }
  }
}

// Execute the replacements
replaceFunctions()
  .then(() => {
    console.log('\nFunction replacement completed. Testing functions...');
    // Test both functions
    return Promise.all([
      supabase.rpc('query_salesforce_table', { table_name: 'lead', limit_count: 1 }),
      supabase.rpc('query_salesforce_wrapper', { table_name: 'lead', limit_count: 1 })
    ]);
  })
  .then(([direct, wrapper]) => {
    console.log('\nTest Results:');
    console.log('query_salesforce_table success:', !direct.error);
    if (direct.error) console.log('  Error:', direct.error.message);
    else console.log('  Data fields:', Object.keys(direct.data[0]).slice(0, 5));
    
    console.log('query_salesforce_wrapper success:', !wrapper.error);
    if (wrapper.error) console.log('  Error:', wrapper.error.message);
    else console.log('  Data fields:', Object.keys(wrapper.data[0]).slice(0, 5));
  })
  .catch(err => {
    console.error('Unexpected error:', err);
  });