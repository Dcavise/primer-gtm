// Script to deploy essential SQL functions directly
import { createClient } from '@supabase/supabase-js';
// import 'dotenv/config'; // Not needed since we're using hardcoded values

// Create a Supabase client with admin privileges
const supabaseUrl = 'https://pudncilureqpzxrxfupr.supabase.co';
// Use the correct service_role key
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

async function deployFunctions() {
  try {
    console.log('Deploying essential SQL functions for Salesforce data access...');
    
    // Create minimum necessary functions for LeadsByWeekChart
    // 1. First, create a simple direct function that doesn't rely on others
    const createSimpleLeadCount = `
      -- Simple function to count leads by date with minimal dependencies
      CREATE OR REPLACE FUNCTION public.get_simple_lead_count_by_week(
        lookback_weeks integer DEFAULT 12
      )
      RETURNS SETOF json
      LANGUAGE plpgsql
      SECURITY DEFINER AS $$$
      DECLARE
        lead_table_columns text[];
        date_column text;
        query_text text;
        schema_exists boolean;
      BEGIN
        -- First check if salesforce schema exists
        SELECT EXISTS (
          SELECT 1 FROM information_schema.schemata WHERE schema_name = 'salesforce'
        ) INTO schema_exists;
        
        IF NOT schema_exists THEN
          RETURN QUERY SELECT json_build_object(
            'error', 'Salesforce schema does not exist',
            'timestamp', NOW()
          );
          RETURN;
        END IF;

        -- Check if lead table exists and get its columns
        SELECT array_agg(column_name) INTO lead_table_columns
        FROM information_schema.columns 
        WHERE table_schema = 'salesforce' AND table_name = 'lead';
        
        IF lead_table_columns IS NULL THEN
          -- Try the public schema as a fallback
          SELECT array_agg(column_name) INTO lead_table_columns
          FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = 'lead';
          
          IF lead_table_columns IS NULL THEN
            RETURN QUERY SELECT json_build_object(
              'error', 'Lead table does not exist in salesforce or public schema',
              'timestamp', NOW()
            );
            RETURN;
          ELSE
            -- Use public schema
            IF 'created_date' = ANY(lead_table_columns) THEN
              date_column := 'created_date';
            ELSIF 'createddate' = ANY(lead_table_columns) THEN
              date_column := 'createddate';
            ELSIF 'systemmodstamp' = ANY(lead_table_columns) THEN
              date_column := 'systemmodstamp';
            ELSE
              RETURN QUERY SELECT json_build_object(
                'error', 'No suitable date column found in public.lead table',
                'available_columns', lead_table_columns,
                'timestamp', NOW()
              );
              RETURN;
            END IF;
            
            query_text := format('
              WITH lead_weeks AS (
                SELECT
                  date_trunc(''week'', %I)::date as week_start,
                  COUNT(*) as lead_count
                FROM
                  public.lead
                GROUP BY
                  week_start
                ORDER BY
                  week_start DESC
                LIMIT %L
              )
              SELECT json_build_object(
                ''week_start'', lw.week_start,
                ''lead_count'', lw.lead_count
              )
              FROM lead_weeks lw;
            ', date_column, lookback_weeks);
            
            RETURN QUERY EXECUTE query_text;
          END IF;
        ELSE
          -- Use salesforce schema
          IF 'created_date' = ANY(lead_table_columns) THEN
            date_column := 'created_date';
          ELSIF 'createddate' = ANY(lead_table_columns) THEN
            date_column := 'createddate';
          ELSIF 'systemmodstamp' = ANY(lead_table_columns) THEN
            date_column := 'systemmodstamp';
          ELSE
            RETURN QUERY SELECT json_build_object(
              'error', 'No suitable date column found in salesforce.lead table',
              'available_columns', lead_table_columns,
              'timestamp', NOW()
            );
            RETURN;
          END IF;
          
          query_text := format('
            WITH lead_weeks AS (
              SELECT
                date_trunc(''week'', %I)::date as week_start,
                COUNT(*) as lead_count
              FROM
                salesforce.lead
              GROUP BY
                week_start
              ORDER BY
                week_start DESC
              LIMIT %L
            )
            SELECT json_build_object(
              ''week_start'', lw.week_start,
              ''lead_count'', lw.lead_count
            )
            FROM lead_weeks lw;
          ', date_column, lookback_weeks);
          
          RETURN QUERY EXECUTE query_text;
        END IF;
      END;
      $$;
      COMMENT ON FUNCTION public.get_simple_lead_count_by_week IS 'Simple count of leads grouped by week with minimal schema dependencies';
      GRANT EXECUTE ON FUNCTION public.get_simple_lead_count_by_week TO authenticated;
      GRANT EXECUTE ON FUNCTION public.get_simple_lead_count_by_week TO service_role;
    `;

    // 2. Create a fallback function too
    const createFallbackFunction = `
      -- Create a minimal fallback function for compatibility
      CREATE OR REPLACE FUNCTION public.get_fallback_lead_count_by_week_campus(weeks_back integer DEFAULT 12)
      RETURNS SETOF json 
      LANGUAGE plpgsql 
      SECURITY DEFINER AS $$$
      BEGIN
        -- Just call the simple function to ensure at least something works
        RETURN QUERY SELECT * FROM public.get_simple_lead_count_by_week(weeks_back);
      END;
      $$;
      COMMENT ON FUNCTION public.get_fallback_lead_count_by_week_campus IS 'Fallback function that calls simple lead count';
      GRANT EXECUTE ON FUNCTION public.get_fallback_lead_count_by_week_campus TO authenticated;
      GRANT EXECUTE ON FUNCTION public.get_fallback_lead_count_by_week_campus TO service_role;
    `;

    // Execute functions in order
    const { data: simpleResult, error: simpleError } = await supabase.rpc('execute_sql_query', {
      query_text: createSimpleLeadCount
    });
    
    if (simpleError) {
      console.error('Error creating simple lead count function:', simpleError);
    } else {
      console.log('Successfully created simple lead count function');
    }

    const { data: fallbackResult, error: fallbackError } = await supabase.rpc('execute_sql_query', {
      query_text: createFallbackFunction
    });
    
    if (fallbackError) {
      console.error('Error creating fallback function:', fallbackError);
    } else {
      console.log('Successfully created fallback function');
    }

    console.log('Deployment complete. Please check the Supabase dashboard to verify the functions were created.');
    
  } catch (err) {
    console.error('Unexpected error during deployment:', err);
  }
}

deployFunctions();