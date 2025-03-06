-- Simple function to count leads by date with minimal dependencies
CREATE OR REPLACE FUNCTION public.get_simple_lead_count_by_week(
  lookback_weeks integer DEFAULT 12
)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE
  lead_table_columns text[];
  date_column text;
  query_text text;
BEGIN
  -- Check if lead table exists and get its columns
  SELECT array_agg(column_name) INTO lead_table_columns
  FROM information_schema.columns 
  WHERE table_schema = 'salesforce' AND table_name = 'lead';
  
  IF lead_table_columns IS NULL THEN
    RETURN QUERY SELECT json_build_object(
      'error', 'Salesforce lead table does not exist or has no columns',
      'timestamp', NOW()
    );
    RETURN;
  END IF;
  
  -- Find a suitable date column
  IF 'created_date' = ANY(lead_table_columns) THEN
    date_column := 'created_date';
  ELSIF 'createddate' = ANY(lead_table_columns) THEN
    date_column := 'createddate';
  ELSIF 'systemmodstamp' = ANY(lead_table_columns) THEN
    date_column := 'systemmodstamp';
  ELSE
    -- Return column list to help troubleshoot
    RETURN QUERY SELECT json_build_object(
      'error', 'No suitable date column found in lead table',
      'available_columns', lead_table_columns,
      'timestamp', NOW()
    );
    RETURN;
  END IF;
  
  -- Build dynamic query
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
  
  -- Execute the query
  RETURN QUERY EXECUTE query_text;
END;
$$;
COMMENT ON FUNCTION public.get_simple_lead_count_by_week IS 'Simple count of leads grouped by week with minimal schema dependencies';
GRANT EXECUTE ON FUNCTION public.get_simple_lead_count_by_week TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_simple_lead_count_by_week TO service_role; 