import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Supabase URL and key from .env file
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY;

// Create client
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to test fivetran_views schema directly
async function testFivetranViews() {
  console.log('Attempting to query fivetran_views.lead directly...');
  
  try {
    // Try direct query to fivetran_views.lead
    const { data, error } = await supabase.rpc('execute_sql_query', {
      query_text: 'SELECT * FROM fivetran_views.lead LIMIT 1'
    });
    
    if (error) {
      console.error('Error querying fivetran_views.lead:', error);
      return { success: false, error };
    }
    
    if (data && data.length > 0) {
      console.log('Successfully queried fivetran_views.lead');
      console.log('Sample data fields:', Object.keys(data[0]).slice(0, 5));
      return { success: true, data };
    } else {
      console.log('Query returned no data');
      return { success: true, data: [] };
    }
  } catch (error) {
    console.error('Exception querying fivetran_views.lead:', error);
    return { success: false, error };
  }
}

// Function to create a direct wrapper view
async function createWrapperView() {
  console.log('Creating wrapper view...');
  
  try {
    // Create a view that wraps fivetran_views.lead
    const { data, error } = await supabase.rpc('execute_sql_query', {
      query_text: `
        CREATE OR REPLACE VIEW public.lead_view AS
        SELECT * FROM fivetran_views.lead;
      `
    });
    
    if (error) {
      console.error('Error creating wrapper view:', error);
      return { success: false, error };
    }
    
    console.log('Successfully created wrapper view');
    return { success: true };
  } catch (error) {
    console.error('Exception creating wrapper view:', error);
    return { success: false, error };
  }
}

// Function to test the wrapper view
async function testWrapperView() {
  console.log('Testing wrapper view...');
  
  try {
    // Query the wrapper view
    const { data, error } = await supabase.rpc('execute_sql_query', {
      query_text: 'SELECT * FROM public.lead_view LIMIT 1'
    });
    
    if (error) {
      console.error('Error querying wrapper view:', error);
      return { success: false, error };
    }
    
    if (data && data.length > 0) {
      console.log('Successfully queried wrapper view');
      console.log('Sample data fields:', Object.keys(data[0]).slice(0, 5));
      return { success: true, data };
    } else {
      console.log('Wrapper view query returned no data');
      return { success: true, data: [] };
    }
  } catch (error) {
    console.error('Exception querying wrapper view:', error);
    return { success: false, error };
  }
}

// Run the tests
async function runTests() {
  console.log('=== Testing Fivetran Views Schema ===');
  
  // Test fivetran_views.lead directly
  const directResult = await testFivetranViews();
  
  if (!directResult.success) {
    console.log('Direct query failed, not proceeding with view creation');
    return;
  }
  
  // Create wrapper view
  const createResult = await createWrapperView();
  
  if (!createResult.success) {
    console.log('View creation failed');
    return;
  }
  
  // Test wrapper view
  const viewResult = await testWrapperView();
  
  console.log('\n=== Results Summary ===');
  console.log('Direct Query Success:', directResult.success);
  console.log('View Creation Success:', createResult.success);
  console.log('View Query Success:', viewResult.success);
}

runTests()
  .catch(err => {
    console.error('Unexpected error during tests:', err);
  });