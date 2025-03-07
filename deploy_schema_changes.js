import dotenv from 'dotenv';
import fs from 'fs';
import fetch from 'node-fetch';

dotenv.config();

async function executeSQLFile(filePath) {
  // Read the SQL file
  const sqlContent = fs.readFileSync(filePath, 'utf8');
  
  // Supabase API endpoint for executing SQL
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY;
  
  console.log(`Connecting to Supabase: ${supabaseUrl}`);
  console.log('Using Service Key (first 10 chars):', supabaseServiceKey.substring(0, 10) + '...');
  
  // Split the SQL file into individual statements based on function definitions
  // Each function starts with CREATE OR REPLACE FUNCTION and ends with $function$;
  const functionPattern = /CREATE OR REPLACE FUNCTION.*?\$function\$;/gs;
  const functionMatches = sqlContent.match(functionPattern);
  
  if (!functionMatches) {
    console.error('No function definitions found in the SQL file.');
    return;
  }
  
  console.log(`Found ${functionMatches.length} function definitions to execute.`);
  
  // Execute each function definition
  let successCount = 0;
  for (let i = 0; i < functionMatches.length; i++) {
    const functionDef = functionMatches[i];
    console.log(`\nExecuting function definition ${i + 1}/${functionMatches.length}...`);
    
    try {
      // Extract the function name for logging
      const functionNameMatch = functionDef.match(/FUNCTION public\.([^\(]+)/);
      const functionName = functionNameMatch ? functionNameMatch[1] : `function-${i+1}`;
      
      console.log(`Executing ${functionName}...`);
      
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql_query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({
          query_text: functionDef,
          query_params: []
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error executing ${functionName}: ${response.status}`, errorText);
        continue;
      }
      
      successCount++;
      console.log(`Successfully executed ${functionName}`);
      
      // Execute GRANT statements after each function
      // Find if there are any GRANT statements following this function
      const functionIndex = sqlContent.indexOf(functionDef) + functionDef.length;
      const nextFunctionIndex = i < functionMatches.length - 1 ? 
        sqlContent.indexOf(functionMatches[i + 1]) : 
        sqlContent.length;
      
      const betweenFunctions = sqlContent.substring(functionIndex, nextFunctionIndex);
      const grantStatements = betweenFunctions.match(/GRANT.*?;/g);
      
      if (grantStatements) {
        for (const grant of grantStatements) {
          console.log(`Executing grant: ${grant}`);
          
          const grantResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql_query`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({
              query_text: grant,
              query_params: []
            })
          });
          
          if (!grantResponse.ok) {
            const grantErrorText = await grantResponse.text();
            console.error(`Error executing grant: ${grantResponse.status}`, grantErrorText);
          } else {
            console.log('Grant executed successfully');
          }
        }
      }
    } catch (error) {
      console.error(`Error for function ${i + 1}:`, error);
    }
  }
  
  console.log(`\nExecution complete: ${successCount}/${functionMatches.length} functions executed successfully.`);
}

// Execute the SQL file
const sqlFilePath = process.argv[2] || '/Users/davidcavise/primer-gtm/update_salesforce_schema_references.sql';
console.log(`Executing SQL file: ${sqlFilePath}`);
executeSQLFile(sqlFilePath);