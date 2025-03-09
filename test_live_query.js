import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY || 'your-service-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function runLiveQuery() {
  console.log('Testing direct lead query for "All Campuses"');
  try {
    // This is the direct query equivalent to what the function does for "All Campuses"
    const allCampusesQuery = `
      SELECT 
        date_trunc('week', l.created_date)::date AS period_start,
        l.preferred_campus_c AS campus_name,
        COUNT(DISTINCT l.id) AS lead_count
      FROM 
        fivetran_views.lead l
      WHERE 
        l.created_date >= (CURRENT_DATE - (12 || ' week')::interval)
      GROUP BY 
        period_start, l.preferred_campus_c
      ORDER BY 
        period_start DESC, l.preferred_campus_c
      LIMIT 20;
    `;

    console.log('Executing query for "All Campuses":');
    const { data: allCampusesData, error: allCampusesError } = await supabase.rpc('execute_sql_query', {
      query_text: allCampusesQuery
    });

    if (allCampusesError) {
      console.error('Error executing All Campuses query:', allCampusesError);
    } else {
      console.log(`Retrieved ${allCampusesData.length} rows for All Campuses`);
      console.log('First 5 rows:');
      allCampusesData.slice(0, 5).forEach((row, i) => {
        console.log(`${i + 1}:`, row);
      });

      // Get unique campus names
      const campusNames = [...new Set(allCampusesData.map(row => row.campus_name))];
      console.log('\nUnique campus names found:', campusNames);
    }

    // Now test Birmingham campus filter
    console.log('\n\nTesting direct lead query for "Birmingham"');
    const birminghamQuery = `
      SELECT 
        date_trunc('week', l.created_date)::date AS period_start,
        l.preferred_campus_c AS campus_name,
        COUNT(DISTINCT l.id) AS lead_count
      FROM 
        fivetran_views.lead l
      WHERE 
        l.created_date >= (CURRENT_DATE - (12 || ' week')::interval)
        AND (l.preferred_campus_c = 'Birmingham')
      GROUP BY 
        period_start, l.preferred_campus_c
      ORDER BY 
        period_start DESC, l.preferred_campus_c
      LIMIT 20;
    `;

    console.log('Executing query for "Birmingham":');
    const { data: birminghamData, error: birminghamError } = await supabase.rpc('execute_sql_query', {
      query_text: birminghamQuery
    });

    if (birminghamError) {
      console.error('Error executing Birmingham query:', birminghamError);
    } else {
      console.log(`Retrieved ${birminghamData.length} rows for Birmingham`);
      console.log('All rows:');
      birminghamData.forEach((row, i) => {
        console.log(`${i + 1}:`, row);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

runLiveQuery()
  .catch(console.error)
  .finally(() => process.exit());