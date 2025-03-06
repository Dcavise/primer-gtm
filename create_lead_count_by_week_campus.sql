-- Function to count leads created, grouped by week and campus
-- First create the function with both naming conventions for compatibility
CREATE OR REPLACE FUNCTION public.get_lead_count_by_week_and_campus(
  lookback_weeks integer DEFAULT 12
)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE
  schema_exists boolean;
  lead_table_exists boolean;
  created_date_column_exists boolean;
BEGIN
  -- Check if salesforce schema exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.schemata WHERE schema_name = 'salesforce'
  ) INTO schema_exists;
  
  IF NOT schema_exists THEN
    RETURN QUERY SELECT json_build_object(
      'error', 'Salesforce schema does not exist',
      'schema_exists', false
    );
    RETURN;
  END IF;
  
  -- Check if lead table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'salesforce' AND table_name = 'lead'
  ) INTO lead_table_exists;
  
  IF NOT lead_table_exists THEN
    RETURN QUERY SELECT json_build_object(
      'error', 'Salesforce lead table does not exist',
      'schema_exists', true,
      'lead_table_exists', false
    );
    RETURN;
  END IF;
  
  -- Check if needed columns exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'salesforce' AND table_name = 'lead' AND column_name = 'created_date'
  ) INTO created_date_column_exists;
  
  IF NOT created_date_column_exists THEN
    -- Try an alternative column if created_date doesn't exist
    RETURN QUERY 
    WITH alternative_lead_data AS (
      SELECT
        date_trunc('week', COALESCE(l.createddate, l.systemmodstamp, current_date))::date as week_start,
        count(*) as lead_count,
        'No Campus Match' as campus_name,
        NULL as campus_id
      FROM
        salesforce.lead l
      GROUP BY
        week_start
      ORDER BY
        week_start DESC
      LIMIT 20
    )
    SELECT json_build_object(
      'week_start', ald.week_start,
      'campus_name', ald.campus_name,
      'campus_id', ald.campus_id,
      'lead_count', ald.lead_count,
      'note', 'Using alternative date column as created_date not found'
    )
    FROM alternative_lead_data ald;
    RETURN;
  END IF;
  
  -- If all checks pass, run the original query
  RETURN QUERY
  WITH lead_data AS (
    SELECT
      date_trunc('week', l.created_date)::date as week_start,
      l.city,
      l.state,
      l.postal_code,
      COUNT(*) as lead_count
    FROM
      salesforce.lead l
    WHERE
      l.created_date >= (CURRENT_DATE - (lookback_weeks || ' weeks')::interval)
    GROUP BY
      week_start, l.city, l.state, l.postal_code
  ),
  campus_matches AS (
    SELECT
      ld.week_start,
      COALESCE(c.name, 'No Campus Match') as campus_name,
      c.id as campus_id,
      SUM(ld.lead_count) as lead_count
    FROM
      lead_data ld
    LEFT JOIN
      public.campuses c ON
        (ld.city = c.city AND ld.state = c.state)
        OR (ld.postal_code = c.zip_code)
    GROUP BY
      ld.week_start, c.name, c.id
  )
  SELECT
    json_build_object(
      'week_start', cm.week_start,
      'campus_name', cm.campus_name,
      'campus_id', cm.campus_id,
      'lead_count', cm.lead_count
    )
  FROM
    campus_matches cm
  ORDER BY
    cm.week_start DESC, cm.lead_count DESC;
END;
$$;
COMMENT ON FUNCTION public.get_lead_count_by_week_and_campus IS 'Count leads grouped by week and campus, with a default 12-week lookback period';
GRANT EXECUTE ON FUNCTION public.get_lead_count_by_week_and_campus TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_lead_count_by_week_and_campus TO service_role;

-- Create an alias using the underscore name format for compatibility with existing code
CREATE OR REPLACE FUNCTION public.get_lead_count_by_week_campus(
  lookback_weeks integer DEFAULT 12
)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER AS $$
BEGIN
  -- Simply call the original function
  RETURN QUERY SELECT * FROM public.get_lead_count_by_week_and_campus(lookback_weeks);
END;
$$;
COMMENT ON FUNCTION public.get_lead_count_by_week_campus IS 'Alias for get_lead_count_by_week_and_campus function with underscore format';
GRANT EXECUTE ON FUNCTION public.get_lead_count_by_week_campus TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_lead_count_by_week_campus TO service_role;
