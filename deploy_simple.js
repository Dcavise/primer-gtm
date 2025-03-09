// Simple deployment script for the lead metrics function
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client
const supabaseUrl = 'https://pudncilureqpzxrxfupr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1ZG5jaWx1cmVxcHp4cnhmdXByIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTEyMzU1NSwiZXhwIjoyMDU2Njk5NTU1fQ.iqKJG8oVO_APMtp2B9gLZ8wIf7Xc4LuM_Qmfz5_WiZs';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

// Function to execute a SQL query
async function executeQuery(query) {
  const { data, error } = await supabase.rpc('execute_sql_query', { query_text: query });
  if (error) {
    console.error('Error executing query:', error);
    return null;
  }
  return data;
}

async function main() {
  console.log('Creating schema...');
  await executeQuery('CREATE SCHEMA IF NOT EXISTS fivetran_views');
  await executeQuery('GRANT USAGE ON SCHEMA fivetran_views TO authenticated, service_role');
  
  console.log('Creating test views...');
  // Create test lead view
  await executeQuery(`
    CREATE OR REPLACE VIEW fivetran_views.lead AS
    SELECT 
      md5(random()::text)::text as id,
      now() - (random() * interval '90 days') as createddate,
      'Campus ' || (floor(random() * 5) + 1)::text as preferred_campus_c,
      md5(random()::text)::text as campus_c
    FROM generate_series(1, 1000)
  `);
  
  // Create test campuses view
  await executeQuery(`
    CREATE OR REPLACE VIEW fivetran_views.campuses AS
    SELECT
      md5(n::text)::text as id,
      'Campus ' || n as name,
      '123 Main St' as address,
      'City ' || n as city,
      'State ' || n as state,
      '1000' || n as zip
    FROM generate_series(1, 5) n
  `);
  
  console.log('Creating function...');
  // Create the metrics function
  await executeQuery(`
    CREATE OR REPLACE FUNCTION fivetran_views.get_lead_metrics(
      time_period TEXT DEFAULT 'week',
      lookback_units INTEGER DEFAULT 12,
      campus_id TEXT DEFAULT NULL
    )
    RETURNS TABLE(
      period_start DATE,
      period_type TEXT,
      campus_name TEXT,
      campus_id TEXT,
      lead_count BIGINT
    )
    LANGUAGE SQL
    STABLE
    AS $$
      WITH lead_data AS (
        SELECT
          date_trunc(time_period, l.createddate)::date as period_start,
          COUNT(DISTINCT l.id) as lead_count,
          CASE 
            WHEN c.id IS NOT NULL THEN c.name
            ELSE 'No Campus Match'
          END as campus_name,
          CASE 
            WHEN c.id IS NOT NULL THEN c.id
            ELSE NULL
          END as campus_id
        FROM
          fivetran_views.lead l
        LEFT JOIN
          fivetran_views.campuses c ON 
          (l.preferred_campus_c = c.name OR l.campus_c = c.id)
        WHERE
          l.createddate >= (CURRENT_DATE - (lookback_units || ' ' || time_period)::interval)
          AND (campus_id IS NULL OR l.campus_c = campus_id OR c.id = campus_id)
        GROUP BY
          period_start, campus_name, c.id
        ORDER BY
          period_start DESC
      )
      SELECT
        ld.period_start,
        time_period as period_type,
        ld.campus_name,
        ld.campus_id,
        ld.lead_count
      FROM lead_data ld
      ORDER BY ld.period_start DESC, ld.lead_count DESC
    $$
  `);
  
  await executeQuery(`
    GRANT EXECUTE ON FUNCTION fivetran_views.get_lead_metrics TO authenticated, service_role
  `);
  
  console.log('Creating compatibility function...');
  // Create compatibility function
  await executeQuery(`
    CREATE OR REPLACE FUNCTION public.get_simple_lead_count_by_week(
      lookback_weeks integer DEFAULT 12
    )
    RETURNS SETOF json
    LANGUAGE SQL
    STABLE
    AS $$
      SELECT json_build_object(
        'week_start', period_start,
        'lead_count', lead_count
      )
      FROM fivetran_views.get_lead_metrics('week', lookback_weeks, NULL)
    $$
  `);
  
  await executeQuery(`
    GRANT EXECUTE ON FUNCTION public.get_simple_lead_count_by_week TO authenticated, service_role
  `);
  
  console.log('Testing function...');
  const testData = await executeQuery('SELECT * FROM fivetran_views.get_lead_metrics()');
  console.log('Test result:', testData);
  
  console.log('Deployment complete!');
}

main().catch(err => {
  console.error('Deployment failed:', err);
});