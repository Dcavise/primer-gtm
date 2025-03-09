-- Enhanced function to count leads by date with period and campus filtering
CREATE OR REPLACE FUNCTION public.get_lead_metrics(
  time_period TEXT DEFAULT 'week',
  lookback_units INTEGER DEFAULT 12,
  campus_id TEXT DEFAULT NULL
)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE
  schema_exists BOOLEAN;
  fivetran_schema_exists BOOLEAN;
  lead_view_exists BOOLEAN;
  campus_view_exists BOOLEAN;
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
  
  -- Check if campus view exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'fivetran_views' AND table_name = 'campuses'
  ) INTO campus_view_exists;
  
  IF NOT campus_view_exists THEN
    RETURN QUERY SELECT json_build_object(
      'error', 'fivetran_views.campuses does not exist',
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
  
  -- Build dynamic query for counting leads
  query_text := format('
    WITH lead_data AS (
      SELECT
        date_trunc(%L, l.createddate)::date as period_start,
        COUNT(DISTINCT l.id) as lead_count,
        CASE 
          WHEN c.id IS NOT NULL THEN c.name
          ELSE ''No Campus Match''
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
        l.createddate >= (CURRENT_DATE - (%L || '' %s'')::interval)
        %s
      GROUP BY
        period_start, campus_name, c.id
      ORDER BY
        period_start DESC
    )
    SELECT json_build_object(
      ''period_start'', ld.period_start,
      ''period_type'', %L,
      ''campus_name'', ld.campus_name,
      ''campus_id'', ld.campus_id,
      ''lead_count'', ld.lead_count
    )
    FROM lead_data ld
    ORDER BY ld.period_start DESC, ld.lead_count DESC;
  ', 
    time_period, 
    lookback_units, 
    time_period, 
    CASE WHEN campus_id IS NOT NULL THEN format(' AND (l.campus_c = %L OR c.id = %L)', campus_id, campus_id) ELSE '' END,
    time_period
  );
  
  -- Execute the query
  RETURN QUERY EXECUTE query_text;
END;
$$;

COMMENT ON FUNCTION public.get_lead_metrics IS 'Counts distinct leads grouped by day/week/month and campus, with filtering options';
GRANT EXECUTE ON FUNCTION public.get_lead_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_lead_metrics TO service_role;

-- Backward compatibility function
CREATE OR REPLACE FUNCTION public.get_simple_lead_count_by_week(
  lookback_weeks integer DEFAULT 12
)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER AS $$
BEGIN
  -- Call the new function with week as time period
  RETURN QUERY SELECT * FROM public.get_lead_metrics('week', lookback_weeks, NULL);
END;
$$;

COMMENT ON FUNCTION public.get_simple_lead_count_by_week IS 'Compatibility wrapper for get_lead_metrics function';
GRANT EXECUTE ON FUNCTION public.get_simple_lead_count_by_week TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_simple_lead_count_by_week TO service_role; 