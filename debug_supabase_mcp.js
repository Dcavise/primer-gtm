import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';

// Load environment variables
dotenv.config();

const execPromise = promisify(exec);

// Check if MCP is installed
async function checkMCPInstallation() {
  try {
    const { stdout } = await execPromise('supabase --version');
    console.log('Supabase CLI version:', stdout.trim());
    return true;
  } catch (error) {
    console.error('Supabase CLI is not installed or not in PATH');
    console.log('Install with: npm install -g supabase');
    return false;
  }
}

// Get MCP version and status
async function getMCPStatus() {
  try {
    const { stdout: statusOutput } = await execPromise('supabase status');
    console.log('\nMCP Status:');
    console.log(statusOutput);
    return true;
  } catch (error) {
    console.error('Failed to get MCP status:', error.message);
    return false;
  }
}

// Test Supabase connection using env variables
async function testSupabaseConnection() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY;
  const projectRef = process.env.SUPABASE_PROJECT_REF;
  const dbPassword = process.env.SUPABASE_DB_PASSWORD;

  console.log('\nSupabase Configuration:');
  console.log('URL:', supabaseUrl);
  console.log('Project Ref:', projectRef);
  console.log('Service Key:', supabaseKey ? '✅ Present' : '❌ Missing');
  console.log('DB Password:', dbPassword ? '✅ Present' : '❌ Missing');

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Test connection by getting the database version
    const { data, error } = await supabase.rpc('execute_sql_query', {
      query_text: 'SELECT version()'
    });

    if (error) {
      console.error('\nConnection test failed:');
      console.error(error);
      return false;
    }

    console.log('\nConnection test successful:');
    console.log('Database version:', data[0].version);

    // Test access to fivetran_views schema
    const { data: schemaData, error: schemaError } = await supabase.rpc('execute_sql_query', {
      query_text: "SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = 'fivetran_views')"
    });

    if (schemaError) {
      console.error('\nSchema test failed:');
      console.error(schemaError);
    } else {
      console.log('\nfivetran_views schema exists:', schemaData[0].exists ? '✅ Yes' : '❌ No');
    }

    return true;
  } catch (error) {
    console.error('\nConnection test failed with exception:');
    console.error(error);
    return false;
  }
}

// Check MCP configuration
async function checkMCPConfig() {
  console.log('\nChecking MCP configuration...');
  
  try {
    // Try to read the MCP config
    const { stdout: configOutput } = await execPromise('supabase --project-ref pudncilureqpzxrxfupr link');
    console.log(configOutput);
    
    return true;
  } catch (error) {
    console.error('Failed to read MCP config:', error.message);
    console.log('\nTroubleshooting steps:');
    console.log('1. Run: supabase login');
    console.log(`2. Run: supabase link --project-ref ${process.env.SUPABASE_PROJECT_REF}`);
    console.log('3. When prompted, enter the database password from your .env file');
    return false;
  }
}

async function main() {
  console.log('=== Supabase MCP Diagnostics ===\n');
  
  const mcpInstalled = await checkMCPInstallation();
  if (!mcpInstalled) {
    return;
  }
  
  await getMCPStatus();
  await testSupabaseConnection();
  await checkMCPConfig();
  
  console.log('\n=== Diagnostics Complete ===');
  console.log('\nRecommended next steps:');
  console.log('1. Check that Supabase MCP is running (supabase start)');
  console.log('2. Make sure your project is linked (supabase link --project-ref pudncilureqpzxrxfupr)');
  console.log('3. Verify your .env file contains correct credentials');
  console.log('4. Test database connection using test_supabase_connection.js');
}

main().catch(console.error);