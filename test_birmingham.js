import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'service_role_key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBirminghamLeads() {
  console.log("=== Testing get_lead_metrics Function with Birmingham campus ===\n");
  
  try {
    // Direct SQL query approach
    const campusName = 'Birmingham';
    const period = 'week';
    const lookbackUnits = 12;
    
    // Build the query with parameters
    const query = `SELECT * FROM fivetran_views.get_lead_metrics('${period}', ${lookbackUnits}, '${campusName}')`;
    
    console.log(`Executing query: ${query}`);
    
    const { data, error } = await supabase.rpc('execute_sql_query', {
      query_text: query
    });
    
    if (error) {
      console.error('Error executing query:', error);
      return;
    }
    
    console.log(`Retrieved ${data.length} ${period}ly data points for campus '${campusName}'`);
    
    if (data.length > 0) {
      console.log('Sample data:', data[0]);
      
      // Show raw SQL query that would be executed
      const rawSqlQuery = `
SELECT 
  date_trunc('${period}', l.created_date)::date AS period_start,
  l.preferred_campus_c AS campus_name,
  COUNT(DISTINCT l.id) AS lead_count
FROM 
  fivetran_views.lead l
WHERE 
  l.created_date >= (CURRENT_DATE - (${lookbackUnits} || ' ${period}')::interval)
  AND (l.preferred_campus_c = '${campusName}')
GROUP BY 
  period_start, l.preferred_campus_c
ORDER BY 
  period_start DESC, l.preferred_campus_c;
`;
      
      console.log('\nRaw SQL query that would be executed:');
      console.log(rawSqlQuery);
    } else {
      console.log('No data found for Birmingham campus.');
    }
  } catch (err) {
    console.error('Error testing function:', err);
  }
}

// Run the test
testBirminghamLeads()
  .catch(console.error)
  .finally(() => {
    console.log('\nTest complete!');
    process.exit(0);
  });