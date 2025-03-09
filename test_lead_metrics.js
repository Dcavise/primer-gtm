import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Supabase URL and key from .env file
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY;

// Create client
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Test the get_lead_metrics function with different parameters
 */
async function testLeadMetrics() {
  console.log('=== Testing get_lead_metrics Function ===');
  
  try {
    // Test 1: Default parameters (week, 12 weeks, no campus filter) using direct SQL
    console.log('\nTest 1: Default parameters (week, 12 weeks)');
    const { data: weeklyData, error: weeklyError } = await supabase.rpc('execute_sql_query', {
      query_text: 'SELECT * FROM fivetran_views.get_lead_metrics()'
    });
    
    if (weeklyError) {
      console.error('Error retrieving weekly metrics:', weeklyError);
    } else {
      console.log(`Retrieved ${weeklyData.length} weekly data points`);
      if (weeklyData.length > 0) {
        console.log('Sample data:', weeklyData[0]);
      }
    }
    
    // Test 2: Monthly data (3 months) using direct SQL
    console.log('\nTest 2: Monthly data (3 months)');
    const { data: monthlyData, error: monthlyError } = await supabase.rpc('execute_sql_query', {
      query_text: "SELECT * FROM fivetran_views.get_lead_metrics('month', 3)"
    });
    
    if (monthlyError) {
      console.error('Error retrieving monthly metrics:', monthlyError);
    } else {
      console.log(`Retrieved ${monthlyData.length} monthly data points`);
      if (monthlyData.length > 0) {
        console.log('Sample data:', monthlyData[0]);
      }
    }
    
    // Test 3: Daily data with campus filter (if you have a campus ID)
    // First get a list of campuses
    console.log('\nGetting list of available campuses...');
    const { data: campusData, error: campusError } = await supabase.rpc('execute_sql_query', {
      query_text: 'SELECT id, name FROM fivetran_views.campuses LIMIT 5'
    });
    
    if (campusError) {
      console.error('Error retrieving campuses:', campusError);
    } else if (campusData && campusData.length > 0) {
      const testCampusId = campusData[0].id;
      console.log(`Found campus: ${campusData[0].name} (ID: ${testCampusId})`);
      
      console.log('\nTest 3: Daily data with campus filter');
      const { data: filteredData, error: filteredError } = await supabase.rpc('execute_sql_query', {
        query_text: `SELECT * FROM fivetran_views.get_lead_metrics('day', 30, '${testCampusId}')`
      });
      
      if (filteredError) {
        console.error('Error retrieving filtered metrics:', filteredError);
      } else {
        console.log(`Retrieved ${filteredData.length} daily data points for campus ${testCampusId}`);
        if (filteredData.length > 0) {
          console.log('Sample data:', filteredData[0]);
        }
      }
    } else {
      console.log('No campuses found to test with campus filter');
    }
    
    // Test 4: Test backward compatibility function
    console.log('\nTest 4: Testing backward compatibility function');
    const { data: compatData, error: compatError } = await supabase.rpc('execute_sql_query', {
      query_text: 'SELECT * FROM public.get_simple_lead_count_by_week(6)'
    });
    
    if (compatError) {
      console.error('Error testing compatibility function:', compatError);
    } else {
      console.log(`Retrieved ${compatData.length} weekly data points via compatibility function`);
      if (compatData.length > 0) {
        console.log('Sample data:', compatData[0]);
      }
    }
    
  } catch (error) {
    console.error('Unexpected error during testing:', error);
  }
  
  console.log('\nTests complete!');
}

// Run the tests
testLeadMetrics()
  .catch(err => {
    console.error('Error running tests:', err);
  });