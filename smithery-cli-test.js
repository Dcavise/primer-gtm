#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Supabase API key
const supabaseApiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1ZG5jaWx1cmVxcHp4cnhmdXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExMjM1NTUsImV4cCI6MjA1NjY5OTU1NX0.0lZySUmlC3nQs-62Ka-0rE6d9on3KIAt6U16g4YYpxY";

// Command to run
const command = `npx -y @smithery/cli@latest run @joshuarileydev/supabase-mcp-server --config '{"supabaseApiKey":"${supabaseApiKey}"}' --test`;

async function main() {
  console.log('Testing connection to Smithery Supabase MCP server...');
  console.log(`Running command: ${command}`);
  
  try {
    const { stdout, stderr } = await execAsync(command, { timeout: 30000 });
    
    if (stderr) {
      console.error('Command stderr:', stderr);
    }
    
    console.log('Command stdout:', stdout);
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Error executing command:', error.message);
    
    if (error.stdout) {
      console.log('Command stdout:', error.stdout);
    }
    
    if (error.stderr) {
      console.error('Command stderr:', error.stderr);
    }
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 