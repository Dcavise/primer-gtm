#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import readline from 'readline';

const execAsync = promisify(exec);

// Supabase API key from environment or hardcoded for development
const supabaseApiKey = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuaWZjbWtmZXl1YnB0aHBoaXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk5MzQwMDcsImV4cCI6MjAyNTUxMDAwN30.VV2-GKL_Dv42U7Jj1vwYN35JA-TNa60-1DY9X3Gqgj8";

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt user for input
const prompt = (question) => new Promise((resolve) => {
  rl.question(question, (answer) => resolve(answer));
});

// Function to run a Smithery CLI command
async function runSmitheryCommand(command) {
  try {
    console.log(`Running command: ${command}`);
    const { stdout, stderr } = await execAsync(command, { timeout: 30000 });
    
    if (stderr) {
      console.log('Command stderr:', stderr);
    }
    
    return stdout.trim();
  } catch (error) {
    console.error('Error executing command:', error.message);
    
    if (error.stdout) {
      console.log('Command stdout:', error.stdout);
    }
    
    if (error.stderr) {
      console.error('Command stderr:', error.stderr);
    }
    
    throw error;
  }
}

// Function to list available tools
async function listTools() {
  const command = `npx -y @smithery/cli@latest run @joshuarileydev/supabase-mcp-server --config '{"supabaseApiKey":"${supabaseApiKey}"}' --list-tools`;
  
  try {
    const output = await runSmitheryCommand(command);
    console.log('\nAvailable tools:');
    console.log(output);
    return output;
  } catch (error) {
    console.error('Failed to list tools:', error.message);
    return null;
  }
}

// Function to execute a SQL query
async function executeQuery(query) {
  const escapedQuery = query.replace(/'/g, "\\'");
  const command = `npx -y @smithery/cli@latest run @joshuarileydev/supabase-mcp-server --config '{"supabaseApiKey":"${supabaseApiKey}"}' --call query --args '{"query":"${escapedQuery}"}'`;
  
  try {
    const output = await runSmitheryCommand(command);
    console.log('\nQuery result:');
    console.log(output);
    return output;
  } catch (error) {
    console.error('Failed to execute query:', error.message);
    return null;
  }
}

// Function to get table schema
async function getTableSchema(tableName) {
  const command = `npx -y @smithery/cli@latest run @joshuarileydev/supabase-mcp-server --config '{"supabaseApiKey":"${supabaseApiKey}"}' --call getTableSchema --args '{"tableName":"${tableName}"}'`;
  
  try {
    const output = await runSmitheryCommand(command);
    console.log(`\nSchema for table ${tableName}:`);
    console.log(output);
    return output;
  } catch (error) {
    console.error(`Failed to get schema for table ${tableName}:`, error.message);
    return null;
  }
}

// Function to list tables
async function listTables() {
  const command = `npx -y @smithery/cli@latest run @joshuarileydev/supabase-mcp-server --config '{"supabaseApiKey":"${supabaseApiKey}"}' --call listTables`;
  
  try {
    const output = await runSmitheryCommand(command);
    console.log('\nAvailable tables:');
    console.log(output);
    return output;
  } catch (error) {
    console.error('Failed to list tables:', error.message);
    return null;
  }
}

// Main function
async function main() {
  console.log('Supabase MCP Client');
  console.log('===================');
  
  try {
    // Test connection
    console.log('Testing connection to Smithery Supabase MCP server...');
    await runSmitheryCommand(`npx -y @smithery/cli@latest run @joshuarileydev/supabase-mcp-server --config '{"supabaseApiKey":"${supabaseApiKey}"}' --test`);
    console.log('Connection successful!\n');
    
    // Handle command line arguments
    const args = process.argv.slice(2);
    const command = args[0];
    
    if (command) {
      // Direct command execution
      switch (command) {
        case 'list_tools':
          await listTools();
          break;
          
        case 'list_tables':
          await listTables();
          break;
          
        case 'get_schema':
          const tableName = args[1];
          if (!tableName) {
            console.error('Error: Table name is required for get_schema command');
            console.log('Usage: node supabase-mcp-client.js get_schema <table_name>');
          } else {
            await getTableSchema(tableName);
          }
          break;
          
        case 'query':
          const query = args.slice(1).join(' ');
          if (!query) {
            console.error('Error: SQL query is required for query command');
            console.log('Usage: node supabase-mcp-client.js query "SELECT * FROM table"');
          } else {
            await executeQuery(query);
          }
          break;
          
        default:
          console.log('Unknown command:', command);
          console.log('Available commands: list_tools, list_tables, get_schema, query');
      }
    } else {
      // Interactive menu
      // Main menu loop
      let running = true;
      while (running) {
        console.log('\nOptions:');
        console.log('1. List available tools');
        console.log('2. List tables');
        console.log('3. Get table schema');
        console.log('4. Execute SQL query');
        console.log('5. Exit');
        
        const choice = await prompt('\nEnter your choice (1-5): ');
        
        switch (choice) {
          case '1':
            await listTools();
            break;
            
          case '2':
            await listTables();
            break;
            
          case '3':
            const tableName = await prompt('Enter table name: ');
            await getTableSchema(tableName);
            break;
            
          case '4':
            const query = await prompt('Enter SQL query: ');
            await executeQuery(query);
            break;
            
          case '5':
            running = false;
            console.log('Exiting...');
            break;
            
          default:
            console.log('Invalid choice. Please try again.');
        }
      }
    }
  } catch (error) {
    console.error('An error occurred:', error.message);
  } finally {
    rl.close();
  }
}

// Run the main function
main().catch(error => {
  console.error('Fatal error:', error);
  rl.close();
  process.exit(1);
}); 