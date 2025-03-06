// Script to execute the Fivetran views SQL using Supabase admin client
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Get the SQL script content
const sqlScript = fs.readFileSync('./create_fivetran_views.sql', 'utf8');

// Create a Supabase client with admin privileges
const supabaseUrl = 'https://pudncilureqpzxrxfupr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1ZG5jaWx1cmVxcHp4cnhmdXByIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTEyMzU1NSwiZXhwIjoyMDU2Njk5NTU1fQ.iqKJG8oVO_APMtp2B9gLZ8wIf7Xc4LuM_Qmfz5_WiZs';
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
    console.log('Executing SQL to create Fivetran-compatible views...');
    
    // Execute the SQL script
    const { data, error } = await supabase.rpc('execute_sql_query', {
      query_text: sqlScript,
      query_params: []
    });
    
    if (error) {
      console.error('Error executing SQL:', error);
      return;
    }
    
    console.log('Success! Fivetran-compatible views created in fivetran_views schema.');
    console.log('Please configure Fivetran to use the fivetran_views schema instead of public.');
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

executeSQL();