import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Supabase URL and key from .env file
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY;

// Create client
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFunctionDefinition() {
  console.log('Checking query_salesforce_table function definition...');
  
  try {
    // Check function definition
    const { data, error } = await supabase
      .rpc('execute_sql_query', {
        query_text: `
          SELECT 
            p.proname AS function_name,
            pg_get_functiondef(p.oid) AS function_definition
          FROM 
            pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
          WHERE 
            n.nspname = 'public' 
            AND p.proname = 'query_salesforce_table'
        `,
        query_params: []
      });
    
    if (error) {
      console.error('Error checking function definition:', error);
      return { success: false, error };
    }
    
    if (data && data.length > 0) {
      console.log('Function definition found:');
      console.log(data[0].function_definition);
      return { success: true, definition: data[0].function_definition };
    } else {
      console.log('Function not found');
      return { success: false, error: 'Function not found' };
    }
  } catch (error) {
    console.error('Error:', error);
    return { success: false, error };
  }
}

checkFunctionDefinition()
  .then(result => {
    if (!result.success) {
      console.log('Failed to get function definition');
    }
  })
  .catch(err => {
    console.error('Unexpected error:', err);
  });