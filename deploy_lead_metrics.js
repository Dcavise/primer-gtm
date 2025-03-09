// Script to deploy the new get_lead_metrics function
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Create a Supabase client with appropriate credentials
const supabaseUrl = 'https://pudncilureqpzxrxfupr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1ZG5jaWx1cmVxcHp4cnhmdXByIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTEyMzU1NSwiZXhwIjoyMDU2Njk5NTU1fQ.iqKJG8oVO_APMtp2B9gLZ8wIf7Xc4LuM_Qmfz5_WiZs';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    headers: {
      'x-client-info': 'primer-analytics-dashboard-admin',
    },
  },
});

// Execute a SQL statement without semicolons
async function executeSql(sql) {
  const { data, error } = await supabase.rpc('execute_sql_query', {
    query_text: sql
  });
  
  return { data, error };
}

async function deployLeadMetricsFunction() {
  try {
    console.log('Deploying lead metrics functions...');
    
    // First, make sure the fivetran_views schema exists
    console.log('Ensuring fivetran_views schema exists...');
    const createSchema = `
      CREATE SCHEMA IF NOT EXISTS fivetran_views;
      GRANT USAGE ON SCHEMA fivetran_views TO authenticated, service_role;
    `;
    
    const { error: schemaError } = await executeSql(createSchema);
    if (schemaError) {
      console.error('Error creating schema:', schemaError);
      return;
    }
    
    // Create main function
    console.log('Creating get_lead_metrics function...');
    const createFunction = `
    CREATE OR REPLACE FUNCTION fivetran_views.get_lead_metrics(
      time_period TEXT DEFAULT 'week',
      lookback_units INTEGER DEFAULT 12,
      campus_name TEXT DEFAULT NULL
    )
    RETURNS SETOF json
    LANGUAGE plpgsql
    SECURITY DEFINER AS $$
    DECLARE
      schema_exists BOOLEAN;
      fivetran_schema_exists BOOLEAN;
      lead_view_exists BOOLEAN;
      query_text TEXT;
    BEGIN
      -- First check if fivetran_views schema exists
      SELECT EXISTS (
        SELECT 1 FROM information_schema.schemata WHERE schema_name = 'fivetran_views'
      ) INTO fivetran_schema_exists;
      
      IF NOT fivetran_schema_exists THEN
        RETURN QUERY SELECT json_build_object(
          'error', 'fivetran_views schema does not exist',
          'timestamp', NOW()
        );
        RETURN;
      END IF;
    
      -- Check if lead view exists
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'fivetran_views' AND table_name = 'lead'
      ) INTO lead_view_exists;
      
      IF NOT lead_view_exists THEN
        RETURN QUERY SELECT json_build_object(
          'error', 'fivetran_views.lead does not exist',
          'timestamp', NOW()
        );
        RETURN;
      END IF;
      
      -- Validate time_period parameter
      IF time_period NOT IN ('day', 'week', 'month') THEN
        RETURN QUERY SELECT json_build_object(
          'error', 'Invalid time_period parameter. Must be one of: day, week, month',
          'timestamp', NOW()
        );
        RETURN;
      END IF;
      
      -- Build query using Supabase's recommended approach
      query_text := format('
        WITH lead_counts AS (
          SELECT 
            date_trunc(%L, l.createddate)::date AS period_start,
            l.preferred_campus_c AS campus_name,
            COUNT(DISTINCT l.id) AS lead_count
          FROM 
            fivetran_views.lead l
          WHERE 
            l.createddate >= (CURRENT_DATE - (%L || '' %s'')::interval)
            %s
          GROUP BY 
            period_start, l.preferred_campus_c
          ORDER BY 
            period_start DESC, l.preferred_campus_c
        )
        SELECT json_build_object(
          ''period_start'', lc.period_start,
          ''period_type'', %L,
          ''campus_name'', lc.campus_name,
          ''campus_id'', NULL,
          ''lead_count'', lc.lead_count
        )
        FROM lead_counts lc
        ORDER BY lc.period_start DESC, lc.lead_count DESC;
      ', 
        time_period, 
        lookback_units, 
        time_period, 
        -- Filter condition follows Supabase's recommended pattern
        CASE WHEN campus_name IS NOT NULL THEN 
          format(' AND (l.preferred_campus_c = %L)', campus_name) 
        ELSE '' END,
        time_period
      );
      
      -- Execute the query
      RETURN QUERY EXECUTE query_text;
    END;
    $$
    `;
    
    const { error: functionError } = await executeSql(createFunction);
    if (functionError) {
      console.error('Error creating lead metrics function:', functionError);
      return;
    }
    
    // Add grants and comments
    console.log('Adding grants and comments...');
    const addGrants = `
    COMMENT ON FUNCTION fivetran_views.get_lead_metrics IS 'Counts distinct leads grouped by day/week/month and campus, with filtering options';
    GRANT EXECUTE ON FUNCTION fivetran_views.get_lead_metrics TO authenticated;
    GRANT EXECUTE ON FUNCTION fivetran_views.get_lead_metrics TO service_role;
    `;
    
    const { error: grantsError } = await executeSql(addGrants);
    if (grantsError) {
      console.error('Error adding grants and comments:', grantsError);
      return;
    }
    
    // Create compatibility function
    console.log('Creating backward compatibility function...');
    const createCompatFunction = `
    CREATE OR REPLACE FUNCTION public.get_simple_lead_count_by_week(
      lookback_weeks integer DEFAULT 12
    )
    RETURNS SETOF json
    LANGUAGE plpgsql
    SECURITY DEFINER AS $$
    BEGIN
      -- Call the new function with week as time period
      RETURN QUERY SELECT * FROM fivetran_views.get_lead_metrics('week', lookback_weeks, NULL);
    END;
    $$
    `;
    
    const { error: compatError } = await executeSql(createCompatFunction);
    if (compatError) {
      console.error('Error creating compatibility function:', compatError);
      return;
    }
    
    // Add grants for compatibility function
    console.log('Adding grants for compatibility function...');
    const addCompatGrants = `
    COMMENT ON FUNCTION public.get_simple_lead_count_by_week IS 'Compatibility wrapper for get_lead_metrics function';
    GRANT EXECUTE ON FUNCTION public.get_simple_lead_count_by_week TO authenticated;
    GRANT EXECUTE ON FUNCTION public.get_simple_lead_count_by_week TO service_role;
    `;
    
    const { error: compatGrantsError } = await executeSql(addCompatGrants);
    if (compatGrantsError) {
      console.error('Error adding grants for compatibility function:', compatGrantsError);
      return;
    }
    
    console.log('All functions deployed successfully!');
    
    // Create test views if not exists for when fivetran_views.lead doesn't exist
    console.log('Creating test views for development (if they don\'t exist)...');
    const createTestViews = `
    -- Create test lead view if it doesn't exist
    CREATE VIEW IF NOT EXISTS fivetran_views.lead AS
    SELECT 
      uuid_generate_v4()::text as id,
      now() - (random() * interval '90 days') as createddate,
      'New Campus ' || (floor(random() * 5) + 1)::text as preferred_campus_c,
      uuid_generate_v4()::text as campus_c
    FROM generate_series(1, 1000);
    
    -- Create campuses view if it doesn't exist
    CREATE VIEW IF NOT EXISTS fivetran_views.campuses AS
    SELECT
      uuid_generate_v4()::text as id,
      'New Campus ' || n as name,
      '123 Main St' as address,
      'City ' || n as city,
      'State ' || n as state,
      '1000' || n as zip
    FROM generate_series(1, 5) n;
    `;
    
    const { error: testViewsError } = await executeSql(createTestViews);
    if (testViewsError) {
      console.log('Note: Could not create test views. This is normal in production:', testViewsError.message);
    } else {
      console.log('Created test views for development');
    }
    
    // Test that the function works
    console.log('\nTesting the new function...');
    const { data: testData, error: testError } = await executeSql('SELECT * FROM fivetran_views.get_lead_metrics()');
    
    if (testError) {
      console.error('Function test failed:', testError);
    } else {
      console.log('Function test successful!');
      console.log('Sample data:', testData && testData.length > 0 ? testData[0] : 'No data returned');
    }
    
  } catch (err) {
    console.error('Unexpected error during deployment:', err);
  }
}

deployLeadMetricsFunction();