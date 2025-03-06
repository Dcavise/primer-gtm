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

// Get tables from fivetran_views schema
async function listFivetranTables() {
  console.log('Getting tables from fivetran_views schema...');
  
  const result = await runQuery(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'fivetran_views'
    AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  
  if (!result.success) {
    console.error('Failed to get tables');
    return [];
  }
  
  if (!result.data || result.data.length === 0) {
    console.log('No tables found in fivetran_views schema');
    return [];
  }
  
  const tables = result.data.map(row => row.table_name);
  console.log(`Found ${tables.length} tables in fivetran_views schema`);
  return tables;
}

// Create wrapper views in public schema
async function createWrapperViews(tables) {
  console.log('Creating wrapper views in public schema...');
  
  let successCount = 0;
  
  for (const table of tables) {
    console.log(`Creating view for ${table}...`);
    
    // First drop any existing view
    await runQuery(`DROP VIEW IF EXISTS public.salesforce_${table}`);
    
    // Create the view
    const createResult = await runQuery(`
      CREATE OR REPLACE VIEW public.salesforce_${table} AS
      SELECT * FROM fivetran_views.${table}
    `);
    
    if (!createResult.success) {
      console.log(`Failed to create view for ${table}`);
      continue;
    }
    
    console.log(`Successfully created view public.salesforce_${table}`);
    
    // Grant permissions
    const grantResult = await runQuery(`
      GRANT SELECT ON public.salesforce_${table} TO authenticated, service_role
    `);
    
    if (!grantResult.success) {
      console.log(`Warning: Failed to grant permissions on view for ${table}`);
    }
    
    successCount++;
  }
  
  return { successCount, totalCount: tables.length };
}

// Fix the query_salesforce_table function
async function updateQueryFunction() {
  console.log('Updating query_salesforce_table function...');
  
  // First drop the function
  await runQuery('DROP FUNCTION IF EXISTS public.query_salesforce_table(text, integer)');
  
  // Create the updated function
  const functionResult = await runQuery(`
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
      
      -- Use fivetran_views directly
      RETURN QUERY EXECUTE format('SELECT row_to_json(t) FROM (SELECT * FROM fivetran_views.%I LIMIT %L) t', 
                              table_name, limit_count);
    END;
    $$
  `);
  
  if (!functionResult.success) {
    console.log('Failed to update function');
    return false;
  }
  
  console.log('Successfully updated query_salesforce_table function');
  
  // Set permissions
  await runQuery(`COMMENT ON FUNCTION public.query_salesforce_table IS 'Safely query a table in fivetran_views schema with a limit'`);
  await runQuery(`REVOKE ALL ON FUNCTION public.query_salesforce_table(text, integer) FROM PUBLIC`);
  await runQuery(`GRANT EXECUTE ON FUNCTION public.query_salesforce_table(text, integer) TO authenticated, service_role`);
  
  return true;
}

// Create a wrapper function
async function createWrapperFunction() {
  console.log('Creating query_salesforce_view function to use views...');
  
  // First drop the function if it exists
  await runQuery('DROP FUNCTION IF EXISTS public.query_salesforce_view(text, integer)');
  
  // Create the function
  const functionResult = await runQuery(`
    CREATE OR REPLACE FUNCTION public.query_salesforce_view(table_name text, limit_count integer)
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
  `);
  
  if (!functionResult.success) {
    console.log('Failed to create wrapper function');
    return false;
  }
  
  console.log('Successfully created query_salesforce_view function');
  
  // Set permissions
  await runQuery(`COMMENT ON FUNCTION public.query_salesforce_view IS 'Safely query a Salesforce table through public schema views'`);
  await runQuery(`REVOKE ALL ON FUNCTION public.query_salesforce_view(text, integer) FROM PUBLIC`);
  await runQuery(`GRANT EXECUTE ON FUNCTION public.query_salesforce_view(text, integer) TO authenticated, service_role`);
  
  return true;
}

// Test the functions
async function testFunctions() {
  console.log('\nTesting updated functions...');
  
  // Test query_salesforce_table
  const directResult = await supabase.rpc('query_salesforce_table', { 
    table_name: 'lead', 
    limit_count: 1 
  });
  
  console.log('query_salesforce_table success:', !directResult.error);
  if (directResult.error) {
    console.log('  Error:', directResult.error.message);
  } else if (directResult.data && directResult.data.length > 0) {
    console.log('  Data fields:', Object.keys(directResult.data[0]).slice(0, 5));
  }
  
  // Test query_salesforce_view
  const viewResult = await supabase.rpc('query_salesforce_view', { 
    table_name: 'lead', 
    limit_count: 1 
  });
  
  console.log('query_salesforce_view success:', !viewResult.error);
  if (viewResult.error) {
    console.log('  Error:', viewResult.error.message);
  } else if (viewResult.data && viewResult.data.length > 0) {
    console.log('  Data fields:', Object.keys(viewResult.data[0]).slice(0, 5));
  }
  
  return {
    directSuccess: !directResult.error,
    viewSuccess: !viewResult.error
  };
}

// Run the script
async function main() {
  console.log('=== Fixing Salesforce Tables ===');
  
  // 1. Get the tables from fivetran_views
  const tables = await listFivetranTables();
  
  if (tables.length === 0) {
    console.log('No tables found, aborting!');
    return;
  }
  
  // 2. Create the wrapper views
  const viewsResult = await createWrapperViews(tables);
  
  // 3. Update the query function
  const functionUpdated = await updateQueryFunction();
  
  // 4. Create wrapper function
  const wrapperCreated = await createWrapperFunction();
  
  // 5. Test the functions
  const testResult = await testFunctions();
  
  // Print summary
  console.log('\n=== Fix Results ===');
  console.log(`Found tables: ${tables.length}`);
  console.log(`Created views: ${viewsResult.successCount}/${viewsResult.totalCount}`);
  console.log(`Updated query_salesforce_table: ${functionUpdated ? 'Yes' : 'No'}`);
  console.log(`Created query_salesforce_view: ${wrapperCreated ? 'Yes' : 'No'}`);
  console.log(`Function tests: Direct=${testResult.directSuccess ? 'Success' : 'Failed'}, View=${testResult.viewSuccess ? 'Success' : 'Failed'}`);
}

main()
  .catch(err => {
    console.error('Unexpected error:', err);
  });