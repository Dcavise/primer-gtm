import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Supabase URL and key from .env file
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY;

// Create client
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to run a query
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

// Get list of tables from fivetran_views schema
async function listFivetranTables() {
  console.log('Listing tables in fivetran_views schema...');
  
  const queryResult = await runQuery(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'fivetran_views'
    AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  
  if (!queryResult.success) {
    console.log('Failed to list tables');
    return [];
  }
  
  if (!queryResult.data || queryResult.data.length === 0) {
    console.log('No tables found in fivetran_views schema');
    return [];
  }
  
  const tables = queryResult.data.map(row => row.table_name);
  console.log(`Found ${tables.length} tables in fivetran_views schema:`, tables);
  return tables;
}

// Create a wrapper view for each table
async function createWrapperViews(tables) {
  console.log('\nCreating wrapper views...');
  
  let successCount = 0;
  
  for (const table of tables) {
    console.log(`Creating view for ${table}...`);
    
    const viewQuery = `
      CREATE OR REPLACE VIEW public.salesforce_${table} AS
      SELECT * FROM fivetran_views.${table};
    `;
    
    const createResult = await runQuery(viewQuery);
    
    if (!createResult.success) {
      console.log(`Failed to create view for ${table}`);
      continue;
    }
    
    console.log(`Successfully created view public.salesforce_${table}`);
    
    // Grant permissions
    const grantResult = await runQuery(`
      GRANT SELECT ON public.salesforce_${table} TO authenticated, service_role;
    `);
    
    if (!grantResult.success) {
      console.log(`Warning: Failed to grant permissions on view for ${table}`);
    } else {
      console.log(`Granted permissions on view for ${table}`);
    }
    
    successCount++;
  }
  
  return successCount;
}

// Create a function to use the views
async function createWrapperFunction() {
  console.log('\nCreating wrapper function...');
  
  const functionQuery = `
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
      
      RETURN QUERY EXECUTE format('SELECT row_to_json(t) FROM (SELECT * FROM public.salesforce_%I LIMIT %L) t', 
                                table_name, limit_count);
    END;
    $$;
  `;
  
  const functionResult = await runQuery(functionQuery);
  
  if (!functionResult.success) {
    console.log('Failed to create wrapper function');
    return false;
  }
  
  console.log('Successfully created wrapper function');
  
  // Set permissions
  const permissionQueries = [
    `COMMENT ON FUNCTION public.query_salesforce_table IS 'Safely query a Salesforce table through public schema views'`,
    `REVOKE ALL ON FUNCTION public.query_salesforce_table(text, integer) FROM PUBLIC`,
    `GRANT EXECUTE ON FUNCTION public.query_salesforce_table(text, integer) TO authenticated, service_role`
  ];
  
  for (const query of permissionQueries) {
    const permResult = await runQuery(query);
    if (!permResult.success) {
      console.log(`Warning: Failed to execute permission query: ${query}`);
    }
  }
  
  return true;
}

// Run the migration
async function runMigration() {
  console.log('=== Creating Salesforce Data Access Layer ===');
  
  // List tables
  const tables = await listFivetranTables();
  
  if (tables.length === 0) {
    console.log('No tables found, migration cancelled');
    return;
  }
  
  // Create views
  const viewsCreated = await createWrapperViews(tables);
  
  // Create function
  const functionCreated = await createWrapperFunction();
  
  console.log('\n=== Migration Results ===');
  console.log(`Tables found: ${tables.length}`);
  console.log(`Views created: ${viewsCreated}`);
  console.log(`Function created: ${functionCreated ? 'Yes' : 'No'}`);
  
  if (viewsCreated > 0 && functionCreated) {
    console.log('\nMigration completed successfully!');
  } else {
    console.log('\nMigration completed with errors');
  }
}

runMigration()
  .catch(err => {
    console.error('Unexpected error during migration:', err);
  });