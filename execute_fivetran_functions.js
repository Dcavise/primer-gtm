// Script to execute the Fivetran-compatible SQL functions
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import 'dotenv/config';

// Get the SQL script content
const sqlScript = fs.readFileSync('./create_fivetran_compatible_functions.sql', 'utf8');

// Create a Supabase client with admin privileges using environment variables
const supabaseUrl = process.env.SUPABASE_URL || 'https://pudncilureqpzxrxfupr.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
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
});

async function executeSQL() {
  try {
    console.log('Executing SQL to create Fivetran-compatible functions...');
    
    // Execute the SQL script
    const { data, error } = await supabase.rpc('execute_sql_query', {
      query_text: sqlScript,
      query_params: []
    });
    
    if (error) {
      console.error('Error executing SQL:', error);
      return;
    }
    
    console.log('Success! Fivetran-compatible functions created.');
    console.log('Now your application can work with Fivetran-synced data using the fallback functions.');
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

executeSQL();