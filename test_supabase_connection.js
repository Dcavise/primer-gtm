import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Supabase URL and key from .env file
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY;

// Create client
const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    // Test public schema access
    const { data: publicData, error: publicError } = await supabase
      .from('campuses')
      .select('count')
      .limit(1);
    
    console.log('Public schema access:', publicError ? 'Failed' : 'Success');
    
    // Test Fivetran Views schema
    const { data: fivetranData, error: fivetranError } = await supabase
      .rpc('execute_sql_query', {
        query_text: 'SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = \'fivetran_views\')'
      });
    
    const schemaExists = !fivetranError && fivetranData && 
                       fivetranData[0] && fivetranData[0].exists;
    
    console.log('Fivetran Views schema exists:', schemaExists ? 'Yes' : 'No');
    
    // Test accessing a table in fivetran_views
    if (schemaExists) {
      const { data: leadData, error: leadError } = await supabase
        .rpc('execute_sql_query', {
          query_text: 'SELECT COUNT(*) FROM fivetran_views.lead LIMIT 1'
        });
      
      console.log('Fivetran lead table access:', leadError ? 'Failed' : 'Success');
      
      if (!leadError) {
        console.log('Lead count:', leadData[0].count);
      }
    }
    
    // Test query_salesforce_table function
    const { data: testData, error: testError } = await supabase
      .rpc('query_salesforce_table', {
        table_name: 'lead',
        limit_count: 1
      });
    
    console.log('query_salesforce_table function test:', testError ? 'Failed' : 'Success');
    if (testError) {
      console.log('query_salesforce_table error:', testError);
    }
    
    if (!testError && testData) {
      console.log('Sample data fields:', Object.keys(testData[0]).slice(0, 5));
    }
    
    return {
      success: !publicError || (!fivetranError && schemaExists),
      publicSchema: !publicError,
      fivetranViewsSchema: schemaExists,
      queryFunctionWorks: !testError
    };
  } catch (error) {
    console.error('Error testing connection:', error);
    return { success: false, error: error.message };
  }
}

// Run the test and log results
testConnection()
  .then(results => {
    console.log('\nTest results:', results);
    if (results.success) {
      console.log('Connection is working correctly.');
    } else {
      console.log('Connection has issues. Check the results for details.');
    }
  })
  .catch(err => {
    console.error('Error running test:', err);
  });