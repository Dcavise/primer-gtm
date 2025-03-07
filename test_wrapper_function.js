import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Supabase URL and key from .env file
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY;

// Create client
const supabase = createClient(supabaseUrl, supabaseKey);

async function testQueryFunction() {
  console.log('Testing query_salesforce_table function with wrapper views...');
  
  try {
    // Test the function with lead table
    const { data, error } = await supabase.rpc('query_salesforce_table', {
      table_name: 'lead',
      limit_count: 1
    });
    
    if (error) {
      console.error('Error calling function:', error);
      return { success: false, error };
    }
    
    if (data && data.length > 0) {
      console.log('Successfully queried lead table through function');
      console.log('Sample data fields:', Object.keys(data[0]).slice(0, 5));
      
      // Try one more table for verification
      const { data: oppData, error: oppError } = await supabase.rpc('query_salesforce_table', {
        table_name: 'opportunity',
        limit_count: 1
      });
      
      if (!oppError && oppData && oppData.length > 0) {
        console.log('Successfully queried opportunity table through function');
        console.log('Sample data fields:', Object.keys(oppData[0]).slice(0, 5));
      }
      
      return { success: true, data };
    } else {
      console.log('Query returned no data');
      return { success: true, data: [] };
    }
  } catch (error) {
    console.error('Exception calling function:', error);
    return { success: false, error };
  }
}

// Run the test
testQueryFunction()
  .then(result => {
    console.log('\nTest result:', result.success ? 'Success' : 'Failed');
  })
  .catch(err => {
    console.error('Unexpected error during test:', err);
  });