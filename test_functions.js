// Script to test the SQL functions through the Supabase client API
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with the anon key (same as frontend)
const supabaseUrl = 'https://pudncilureqpzxrxfupr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1ZG5jaWx1cmVxcHp4cnhmdXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExMjM1NTUsImV4cCI6MjA1NjY5OTU1NX0.0lZySUmlC3nQs-62Ka-0rE6d9on3KIAt6U16g4YYpxY';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
});

// Test the simple function
async function testSimpleFunction() {
  console.log('Testing get_simple_lead_count_by_week function...');
  
  try {
    const { data, error } = await supabase.rpc(
      'get_simple_lead_count_by_week', 
      { lookback_weeks: 4 }
    );
    
    if (error) {
      console.error('Error calling simple function:', error);
      return;
    }
    
    console.log('Simple function result:', data);
  } catch (err) {
    console.error('Exception calling simple function:', err);
  }
}

// Test the fallback function
async function testFallbackFunction() {
  console.log('\nTesting get_fallback_lead_count_by_week_campus function...');
  
  try {
    const { data, error } = await supabase.rpc(
      'get_fallback_lead_count_by_week_campus', 
      { weeks_back: 4 }
    );
    
    if (error) {
      console.error('Error calling fallback function:', error);
      return;
    }
    
    console.log('Fallback function result:', data);
  } catch (err) {
    console.error('Exception calling fallback function:', err);
  }
}

// Run the tests
async function runTests() {
  await testSimpleFunction();
  await testFallbackFunction();
}

runTests();