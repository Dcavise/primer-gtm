import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create Supabase client using standard (non-MCP) variables
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
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
    
    console.log('Connection successful\!');
    console.log('Sample data:', data);
    return true;
  } catch (error) {
    console.error('Error testing connection:');
    console.error(error);
    return false;
  }
}

testConnection().catch(console.error);
