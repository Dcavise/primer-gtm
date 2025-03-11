const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get environment variables for Supabase access
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

// Create a Supabase client with the service key for admin access
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function deployGetCampusNameFunctions() {
  console.log('Deploying get_campus_names functions...');

  try {
    // Read the SQL file contents
    const sqlFilePath = path.join(__dirname, 'create_get_campus_names_function.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    // Execute the SQL directly using the execute_sql_query RPC function
    const { data, error } = await supabase.rpc('execute_sql_query', {
      query_text: sqlContent
    });

    if (error) {
      console.error('Error deploying campus name functions:', error);
      return false;
    }

    console.log('Campus name functions deployed successfully!');
    return true;
  } catch (err) {
    console.error('Exception during deployment:', err);
    return false;
  }
}

async function main() {
  console.log('Starting deployment of campus names functions...');
  
  const success = await deployGetCampusNameFunctions();
  
  if (success) {
    console.log('Deployment completed successfully!');
  } else {
    console.error('Deployment failed.');
    process.exit(1);
  }
}

main();