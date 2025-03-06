-- Update SQL functions to use fivetran_views schema instead of salesforce schema
-- This file removes references to the salesforce schema and replaces them with fivetran_views

-- Update query_salesforce_table function to use fivetran_views
CREATE OR REPLACE FUNCTION public.query_salesforce_table(table_name text, limit_count integer) 
RETURNS SETOF json 
LANGUAGE plpgsql 
SECURITY DEFINER AS $function$ 
BEGIN 
  IF table_name IS NULL OR table_name = '' THEN 
    RAISE EXCEPTION 'Table name cannot be null or empty'; 
  END IF; 
  
  IF limit_count IS NULL OR limit_count <= 0 THEN 
    RAISE EXCEPTION 'Limit count must be a positive integer'; 
  END IF; 
  
  RETURN QUERY EXECUTE format('SELECT row_to_json(t) FROM (SELECT * FROM fivetran_views.%I LIMIT %L) t', table_name, limit_count); 
END; 
$function$;

COMMENT ON FUNCTION public.query_salesforce_table IS 'Safely query a table in the fivetran_views schema with a limit';
REVOKE ALL ON FUNCTION public.query_salesforce_table FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.query_salesforce_table TO authenticated;
GRANT EXECUTE ON FUNCTION public.query_salesforce_table TO service_role;

-- Update get_leads_with_campus_info_fivetran function
CREATE OR REPLACE FUNCTION public.get_leads_with_campus_info_fivetran(limit_count integer DEFAULT 100)
RETURNS SETOF json 
LANGUAGE sql 
SECURITY DEFINER AS $function$
  SELECT row_to_json(combined) FROM (
    SELECT l.*, c.name as campus_name, c.address as campus_address, 
           c.city as campus_city, c.state as campus_state 
    FROM fivetran_views.lead l 
    LEFT JOIN fivetran_views.campuses c ON l.campus_c = c.id
    LIMIT $1
  ) combined;
$function$;

-- Update get_lead_count_by_week_campus_fivetran function
CREATE OR REPLACE FUNCTION public.get_lead_count_by_week_campus_fivetran(weeks_back integer DEFAULT 12)
RETURNS SETOF json 
LANGUAGE sql 
SECURITY DEFINER AS $function$
  SELECT row_to_json(result) FROM (
    WITH weekly_leads AS (
      SELECT 
        c.name as campus_name,
        date_trunc('week', l.createddate) as week,
        COUNT(*) as lead_count
      FROM fivetran_views.lead l
      LEFT JOIN fivetran_views.campuses c ON 
        (l.campus_c = c.id OR
         (l.postalcode = c.zip OR (l.city = c.city AND l.state = c.state)))
      WHERE l.createddate > current_date - ($1 || ' weeks')::interval
      GROUP BY c.name, date_trunc('week', l.createddate)
      ORDER BY c.name, date_trunc('week', l.createddate)
    )
    SELECT * FROM weekly_leads
  ) result;
$function$;

-- Update get_leads_by_geography_with_campus_fivetran function
CREATE OR REPLACE FUNCTION public.get_leads_by_geography_with_campus_fivetran(limit_count integer DEFAULT 1000)
RETURNS SETOF json 
LANGUAGE sql 
SECURITY DEFINER AS $function$
  SELECT row_to_json(combined) FROM (
    SELECT 
      l.id, l.firstname, l.lastname, l.email, l.phone, l.postalcode, 
      l.city, l.state, l.country, l.status, l.createddate,
      c.name as campus_name, c.id as campus_id
    FROM fivetran_views.lead l
    LEFT JOIN fivetran_views.campuses c ON 
      (l.campus_c = c.id OR
       (l.postalcode = c.zip OR (l.city = c.city AND l.state = c.state)))
    ORDER BY l.createddate DESC
    LIMIT $1
  ) combined;
$function$;

-- Update test_salesforce_connection function
CREATE OR REPLACE FUNCTION public.test_salesforce_connection()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  result RECORD;
  lead_count INTEGER;
  opportunity_count INTEGER;
  campus_count INTEGER;
BEGIN
  -- Test access to lead table
  BEGIN
    EXECUTE 'SELECT COUNT(*) FROM fivetran_views.lead LIMIT 1' INTO lead_count;
  EXCEPTION WHEN OTHERS THEN
    lead_count := -1;
  END;
  
  -- Test access to opportunity table
  BEGIN
    EXECUTE 'SELECT COUNT(*) FROM fivetran_views.opportunity LIMIT 1' INTO opportunity_count;
  EXCEPTION WHEN OTHERS THEN
    opportunity_count := -1;
  END;
  
  -- Test access to campuses table
  BEGIN
    EXECUTE 'SELECT COUNT(*) FROM fivetran_views.campuses LIMIT 1' INTO campus_count;
  EXCEPTION WHEN OTHERS THEN
    campus_count := -1;
  END;
  
  -- Return results
  RETURN json_build_object(
    'success', lead_count >= 0 OR opportunity_count >= 0,
    'lead_access', lead_count >= 0,
    'opportunity_access', opportunity_count >= 0,
    'campuses_access', campus_count >= 0,
    'timestamp', NOW()
  );
END;
$function$;

COMMENT ON FUNCTION public.test_salesforce_connection IS 'Tests connection to fivetran_views schema tables';
REVOKE ALL ON FUNCTION public.test_salesforce_connection FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.test_salesforce_connection TO authenticated;
GRANT EXECUTE ON FUNCTION public.test_salesforce_connection TO service_role;

-- Update get_weekly_lead_trends function
CREATE OR REPLACE FUNCTION public.get_weekly_lead_trends(
  start_date date,
  end_date date,
  p_campus_id text DEFAULT NULL
)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT row_to_json(result) FROM (
    WITH weekly_data AS (
      SELECT
        date_trunc('week', l.createddate)::date as week_start,
        COUNT(l.id) as lead_count,
        COUNT(CASE WHEN l.isconverted = true THEN l.id END) as conversion_count
      FROM fivetran_views.lead l
      WHERE 
        l.createddate BETWEEN start_date AND end_date
        AND (p_campus_id IS NULL OR l.campus_c = p_campus_id)
      GROUP BY date_trunc('week', l.createddate)
      ORDER BY date_trunc('week', l.createddate)
    )
    SELECT
      week_start,
      lead_count,
      conversion_count,
      CASE 
        WHEN lead_count > 0 THEN ROUND((conversion_count::numeric / lead_count) * 100, 2)
        ELSE 0
      END as conversion_rate
    FROM weekly_data
  ) result;
END;
$function$;

-- Update get_weekly_lead_trends by campus function
CREATE OR REPLACE FUNCTION public.get_weekly_lead_trends(
  start_date date,
  end_date date
)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT row_to_json(result) FROM (
    WITH weekly_data AS (
      SELECT
        date_trunc('week', l.createddate)::date as week_start,
        c.name as campus_name,
        COUNT(l.id) as lead_count,
        COUNT(CASE WHEN l.isconverted = true THEN l.id END) as conversion_count
      FROM fivetran_views.lead l
      LEFT JOIN fivetran_views.campuses c ON l.campus_c = c.id
      WHERE l.createddate BETWEEN start_date AND end_date
      GROUP BY date_trunc('week', l.createddate), c.name
      ORDER BY date_trunc('week', l.createddate), c.name
    )
    SELECT
      week_start,
      campus_name,
      lead_count,
      conversion_count,
      CASE 
        WHEN lead_count > 0 THEN ROUND((conversion_count::numeric / lead_count) * 100, 2)
        ELSE 0
      END as conversion_rate
    FROM weekly_data
  ) result;
END;
$function$;

-- Ensure permissions are correctly set for all updated functions
REVOKE ALL ON FUNCTION public.get_leads_with_campus_info_fivetran FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_leads_with_campus_info_fivetran TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_lead_count_by_week_campus_fivetran FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_lead_count_by_week_campus_fivetran TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_leads_by_geography_with_campus_fivetran FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_leads_by_geography_with_campus_fivetran TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_weekly_lead_trends FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_weekly_lead_trends TO authenticated, service_role;