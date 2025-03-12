import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Create MCP config directory if it doesn't exist
const mcpConfigDir = path.join(__dirname, '.cursor');
if (!fs.existsSync(mcpConfigDir)) {
  fs.mkdirSync(mcpConfigDir, { recursive: true });
}

// Create MCP config file
const mcpConfig = {
  supabase: {
    url: process.env.VITE_SUPABASE_URL || 'https://pudncilureqpzxrxfupr.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1ZG5jaWx1cmVxcHp4cnhmdXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExMjM1NTUsImV4cCI6MjA1NjY5OTU1NX0.0lZySUmlC3nQs-62Ka-0rE6d9on3KIAt6U16g4YYpxY',
    serviceKey: process.env.VITE_SUPABASE_SERVICE_KEY || '',
    projectRef: process.env.SUPABASE_PROJECT_REF || 'pudncilureqpzxrxfupr'
  },
  connection: {
    schema: 'fivetran_views'
  }
};

// Write config to file
const mcpConfigPath = path.join(mcpConfigDir, 'mcp.json');
fs.writeFileSync(mcpConfigPath, JSON.stringify(mcpConfig, null, 2));

console.log(`MCP configuration written to ${mcpConfigPath}`);

// Test Supabase connection
const supabase = createClient(
  mcpConfig.supabase.url,
  mcpConfig.supabase.key
);

async function testConnection() {
  try {
    console.log('Testing connection to Supabase...');
    
    // Test connection with a simple query
    const { data, error } = await supabase
      .from('campuses')
      .select('*')
      .limit(1);
      
    if (error) {
      console.error('Connection test failed:');
      console.error(error);
      return false;
    }
    
    console.log('Connection successful!');
    console.log('Sample data:', data);
    
    // Check for fivetran_views schema
    const { data: schemaData, error: schemaError } = await supabase.rpc('execute_sql_query', {
      query_text: "SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = 'fivetran_views')"
    });
    
    if (schemaError) {
      console.error('Schema check failed:');
      console.error(schemaError);
    } else {
      console.log('fivetran_views schema exists:', schemaData[0].exists ? 'Yes' : 'No');
    }
    
    // Display next steps
    console.log('\nNext steps:');
    console.log('1. Install the Supabase MCP Server if not already installed:');
    console.log('   npm install -g supabase-mcp-server');
    console.log('2. Start the MCP Server:');
    console.log('   mcp-server');
    console.log('3. When using VSCode with Cursor extension, it should now connect to your Supabase project');
    
    return true;
  } catch (error) {
    console.error('Error testing connection:');
    console.error(error);
    return false;
  }
}

testConnection().catch(console.error);