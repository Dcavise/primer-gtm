-- Function to count leads by date with period and campus filtering
-- This function queries the lead table directly using COUNT(DISTINCT id)
CREATE OR REPLACE FUNCTION fivetran_views.get_lead_metrics(
  time_period TEXT DEFAULT 'week',
  lookback_units INTEGER DEFAULT 12,
  campus_name TEXT DEFAULT NULL,
  include_all_campuses BOOLEAN DEFAULT FALSE
)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER AS $$$
DECLARE
  schema_exists BOOLEAN;
  fivetran_schema_exists BOOLEAN;
  lead_table_exists BOOLEAN;
  query_text TEXT;
  campus_filter TEXT;
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

  -- Check if lead table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'fivetran_views' AND table_name = 'lead'
  ) INTO lead_table_exists;
  
  IF NOT lead_table_exists THEN
    RETURN QUERY SELECT json_build_object(
      'error', 'fivetran_views.lead table does not exist',
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
  
  -- Determine campus filtering logic
  IF include_all_campuses THEN
    -- No campus filter for "All Campuses"
    campus_filter := '';
  ELSIF campus_name IS NOT NULL THEN
    -- Filter by specific campus
    campus_filter := format(' AND (l.preferred_campus_c = %L)', campus_name);
  ELSE
    -- Default behavior when campus_name is NULL and include_all_campuses is FALSE
    campus_filter := '';
  END IF;
  
  -- Build direct query on lead table using COUNT(DISTINCT id)
  query_text := format('
    SELECT json_build_object(
      ''period_start'', period_start,
      ''period_type'', %L,
      ''campus_name'', campus_name,
      ''campus_id'', NULL,
      ''lead_count'', lead_count
    )
    FROM (
      SELECT 
        date_trunc(%L, l.created_date)::date AS period_start,
        l.preferred_campus_c AS campus_name,
        COUNT(DISTINCT l.id) AS lead_count
      FROM 
        fivetran_views.lead l
      WHERE 
        l.created_date >= (CURRENT_DATE - (%L || '' %s'')::interval)
        %s
      GROUP BY 
        period_start, l.preferred_campus_c
      ORDER BY 
        period_start DESC, l.preferred_campus_c
    ) subquery
    ORDER BY period_start DESC, lead_count DESC;
  ', 
    time_period,
    time_period, 
    lookback_units, 
    time_period, 
    campus_filter
  );
  
  -- For debugging
  RAISE NOTICE 'Executing query: %', query_text;
  
  -- Execute the query
  RETURN QUERY EXECUTE query_text;
END;
$$;

-- Add comments and grants
COMMENT ON FUNCTION fivetran_views.get_lead_metrics IS 'Counts distinct leads directly from lead table, grouped by day/week/month and campus, with filtering options';
GRANT EXECUTE ON FUNCTION fivetran_views.get_lead_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION fivetran_views.get_lead_metrics TO service_role;

-- Backward compatibility function
CREATE OR REPLACE FUNCTION public.get_simple_lead_count_by_week(
  lookback_weeks integer DEFAULT 12
)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER AS $$$
BEGIN
  -- Call the new function with week as time period and include_all_campuses=true
  RETURN QUERY SELECT * FROM fivetran_views.get_lead_metrics('week', lookback_weeks, NULL, TRUE);
END;
$$;

COMMENT ON FUNCTION public.get_simple_lead_count_by_week IS 'Compatibility wrapper for get_lead_metrics function';
GRANT EXECUTE ON FUNCTION public.get_simple_lead_count_by_week TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_simple_lead_count_by_week TO service_role;