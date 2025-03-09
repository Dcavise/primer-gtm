import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'service_role_key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCampusFilter() {
  console.log("=== Testing get_lead_metrics Function with Campus Filtering ===\n");
  
  try {
    // Test cases
    const tests = [
      {
        name: "Test 1: All Campuses",
        params: {
          period: 'week',
          lookbackUnits: 12,
          campusName: null,
          includeAllCampuses: true
        }
      },
      {
        name: "Test 2: Birmingham Campus",
        params: {
          period: 'week',
          lookbackUnits: 12,
          campusName: 'Birmingham',
          includeAllCampuses: false
        }
      }
    ];
    
    for (const test of tests) {
      console.log(`\nRunning ${test.name}`);
      const { period, lookbackUnits, campusName, includeAllCampuses } = test.params;
      
      // Build function call with parameters
      let functionCall = `SELECT * FROM fivetran_views.get_lead_metrics('${period}', ${lookbackUnits}`;
      
      if (campusName !== null) {
        functionCall += `, '${campusName}'`;
      } else {
        functionCall += `, NULL`;
      }
      
      functionCall += `, ${includeAllCampuses})`;
      
      console.log(`Executing: ${functionCall}`);
      
      const { data, error } = await supabase.rpc('execute_sql_query', {
        query_text: functionCall
      });
      
      if (error) {
        console.error('Error executing query:', error);
        continue;
      }
      
      // Generate raw SQL for illustration
      const rawSql = `
SELECT 
  date_trunc('${period}', l.created_date)::date AS period_start,
  l.preferred_campus_c AS campus_name,
  COUNT(DISTINCT l.id) AS lead_count
FROM 
  fivetran_views.lead l
WHERE 
  l.created_date >= (CURRENT_DATE - (${lookbackUnits} || ' ${period}')::interval)
  ${campusName !== null ? `AND (l.preferred_campus_c = '${campusName}')` : ''}
GROUP BY 
  period_start, l.preferred_campus_c
ORDER BY 
  period_start DESC, l.preferred_campus_c;
`;
      
      console.log('Raw SQL query equivalent:');
      console.log(rawSql);
      
      console.log(`Retrieved ${data?.length || 0} ${period}ly data points`);
      
      if (data?.length > 0) {
        console.log('Sample data:', data[0]);
        
        // Show unique campus names in result
        const campusNames = [...new Set(data.map(item => JSON.parse(item).campus_name))];
        console.log(`Unique campus names in result: ${campusNames.join(', ')}`);
      } else {
        console.log('No data found.');
      }
    }
  } catch (err) {
    console.error('Error testing function:', err);
  }
}

// Run the test
testCampusFilter()
  .catch(console.error)
  .finally(() => {
    console.log('\nTests complete!');
    process.exit(0);
  });