import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Supabase URL and key from .env file
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY;

// Create client
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Query a Salesforce table via fivetran_views
 */
async function querySalesforceTable(tableName, limit = 100) {
  console.log(`Querying Salesforce table: ${tableName} with limit ${limit}`);
  
  try {
    const { data, error } = await supabase.rpc('execute_sql_query', {
      query_text: `SELECT * FROM fivetran_views.${tableName} LIMIT ${limit}`
    });
    
    if (error) {
      console.error(`Error querying Salesforce table ${tableName}:`, error);
      return { success: false, data: null, error };
    }
    
    console.log(`Successfully queried ${tableName}, got ${data?.length || 0} records`);
    return { success: true, data, error: null };
  } catch (error) {
    console.error(`Exception querying Salesforce table ${tableName}:`, error);
    return { 
      success: false, 
      data: null, 
      error
    };
  }
}

/**
 * Get weekly lead counts
 */
async function getWeeklyLeadCounts(startDate, endDate, campusId = null) {
  console.log(`Getting weekly lead counts from ${startDate} to ${endDate}, campus: ${campusId || 'all'}`);
  
  try {
    // Build the query based on parameters
    let query = `
      WITH weekly_data AS (
        SELECT
          date_trunc('week', l.createddate)::date as week,
          COUNT(l.id) as lead_count
        FROM fivetran_views.lead l
        WHERE l.createddate BETWEEN '${startDate}' AND '${endDate}'
    `;
    
    // Add campus filter if provided
    if (campusId) {
      query += ` AND l.campus_c = '${campusId}'`;
    }
    
    // Finish the query
    query += `
        GROUP BY date_trunc('week', l.createddate)
        ORDER BY date_trunc('week', l.createddate)
      )
      SELECT * FROM weekly_data
    `;
    
    const { data, error } = await supabase.rpc('execute_sql_query', {
      query_text: query
    });
    
    if (error) {
      console.error('Error getting weekly lead counts:', error);
      return { success: false, data: null, error };
    }
    
    console.log(`Got ${data?.length || 0} weeks of lead count data`);
    return { success: true, data, error: null };
  } catch (error) {
    console.error('Exception getting weekly lead counts:', error);
    return { 
      success: false, 
      data: null, 
      error
    };
  }
}

/**
 * Test functions in sequence
 */
async function runTests() {
  console.log('=== Testing Query Salesforce Table ===');
  const leadQuery = await querySalesforceTable('lead', 5);
  console.log('Lead query success:', leadQuery.success);
  if (leadQuery.success && leadQuery.data) {
    console.log('Lead count:', leadQuery.data.length);
    console.log('Sample fields:', Object.keys(leadQuery.data[0]).slice(0, 5));
  }
  
  // Get dates for weekly lead counts
  const today = new Date();
  const sixWeeksAgo = new Date();
  sixWeeksAgo.setDate(today.getDate() - 42);
  
  console.log('\n=== Testing Weekly Lead Counts ===');
  const weeklyCounts = await getWeeklyLeadCounts(
    sixWeeksAgo.toISOString().split('T')[0],
    today.toISOString().split('T')[0]
  );
  
  console.log('Weekly counts success:', weeklyCounts.success);
  if (weeklyCounts.success && weeklyCounts.data) {
    console.log('Weekly data points:', weeklyCounts.data.length);
    if (weeklyCounts.data.length > 0) {
      console.log('Sample data:', weeklyCounts.data[0]);
    }
  }
  
  console.log('\nTests complete!');
}

// Run the tests
runTests()
  .catch(err => {
    console.error('Error running tests:', err);
  });