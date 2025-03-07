import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Supabase URL and key from .env file
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY;

// Create client
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to run a SQL query directly
async function directQuery() {
  console.log('Running direct query on fivetran_views.lead...');
  
  try {
    const { data, error } = await supabase.rpc('execute_sql_query', {
      query_text: 'SELECT * FROM fivetran_views.lead LIMIT 5'
    });
    
    if (error) {
      console.error('Error executing direct query:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('Query returned data:');
      console.log('- Row count:', data.length);
      console.log('- Sample columns:', Object.keys(data[0]).slice(0, 5));
    } else {
      console.log('Query returned no data');
    }
  } catch (err) {
    console.error('Exception executing query:', err);
  }
}

// Run the query
directQuery()
  .catch(err => {
    console.error('Unexpected error:', err);
  });