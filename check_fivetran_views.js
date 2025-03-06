import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Supabase URL and key from .env file
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY;

// Create client
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to run a query and print results
async function runAndPrintQuery(description, queryText) {
  console.log(`\n=== ${description} ===`);
  
  try {
    const { data, error } = await supabase.rpc('execute_sql_query', {
      query_text: queryText
    });
    
    if (error) {
      console.error('Error executing query:', error);
      return { success: false, error };
    }
    
    if (data && data.length > 0) {
      console.log('Query returned data:');
      console.log('- Row count:', data.length);
      console.log('- Sample columns:', Object.keys(data[0]).slice(0, 7));
      console.log('- First row preview:', JSON.stringify(data[0]).substring(0, 300) + '...');
    } else {
      console.log('Query returned no data');
    }
    
    return { success: true, data };
  } catch (err) {
    console.error('Exception executing query:', err);
    return { success: false, error: err };
  }
}

async function checkTables() {
  // Check fivetran_views.lead
  await runAndPrintQuery(
    'Check fivetran_views.lead table', 
    'SELECT * FROM fivetran_views.lead LIMIT 2'
  );
  
  // Check schemas list
  await runAndPrintQuery(
    'List all schemas', 
    `SELECT schema_name FROM information_schema.schemata 
     WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
     ORDER BY schema_name`
  );
  
  // Check lead table in fivetran_views schema
  await runAndPrintQuery(
    'Check lead table column info', 
    `SELECT column_name, data_type 
     FROM information_schema.columns 
     WHERE table_schema = 'fivetran_views' 
     AND table_name = 'lead'
     LIMIT 10`
  );
  
  // Check public schema views
  await runAndPrintQuery(
    'Check public schema views', 
    `SELECT table_name 
     FROM information_schema.views 
     WHERE table_schema = 'public' 
     AND table_name LIKE 'salesforce_%'
     LIMIT 10`
  );
  
  // Test one of the public views
  await runAndPrintQuery(
    'Test public.salesforce_lead view', 
    'SELECT * FROM public.salesforce_lead LIMIT 2'
  );
}

checkTables()
  .catch(err => {
    console.error('Unexpected error:', err);
  });