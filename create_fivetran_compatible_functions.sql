-- Create versions of cross-schema functions compatible with fivetran_views
-- These functions replace references to public.campuses with fivetran_views.campuses

-- Function to get leads with campus info using fivetran_views
CREATE OR REPLACE FUNCTION public.get_leads_with_campus_info_fivetran(limit_count integer DEFAULT 100)
RETURNS SETOF json LANGUAGE sql SECURITY DEFINER AS $$$
  SELECT row_to_json(combined) FROM (
    SELECT l.*, c.name as campus_name, c.address as campus_address, 
           c.city as campus_city, c.state as campus_state 
    FROM salesforce.lead l 
    LEFT JOIN fivetran_views.campuses c ON l.campus_c = c.id
    LIMIT $1
  ) combined;
$$;

-- Revoke public access and grant to authenticated and service_role
REVOKE ALL ON FUNCTION public.get_leads_with_campus_info_fivetran FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_leads_with_campus_info_fivetran TO authenticated, service_role;

-- Function to get lead count by week and campus using fivetran_views
CREATE OR REPLACE FUNCTION public.get_lead_count_by_week_campus_fivetran(weeks_back integer DEFAULT 12)
RETURNS SETOF json LANGUAGE sql SECURITY DEFINER AS $$$
  SELECT row_to_json(result) FROM (
    WITH weekly_leads AS (
      SELECT 
        c.name as campus_name,
        date_trunc('week', l.createddate) as week,
        COUNT(*) as lead_count
      FROM salesforce.lead l
      LEFT JOIN fivetran_views.campuses c ON 
        (l.campus_c = c.id OR
         (l.postalcode = c.zip OR (l.city = c.city AND l.state = c.state)))
      WHERE l.createddate > current_date - ($1 || ' weeks')::interval
      GROUP BY c.name, date_trunc('week', l.createddate)
      ORDER BY c.name, date_trunc('week', l.createddate)
    )
    SELECT * FROM weekly_leads
  ) result;
$$;

-- Revoke public access and grant to authenticated and service_role
REVOKE ALL ON FUNCTION public.get_lead_count_by_week_campus_fivetran FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_lead_count_by_week_campus_fivetran TO authenticated, service_role;

-- Function to get leads by geography with campus using fivetran_views
CREATE OR REPLACE FUNCTION public.get_leads_by_geography_with_campus_fivetran(limit_count integer DEFAULT 1000)
RETURNS SETOF json LANGUAGE sql SECURITY DEFINER AS $$$
  SELECT row_to_json(combined) FROM (
    SELECT 
      l.id, l.firstname, l.lastname, l.email, l.phone, l.postalcode, 
      l.city, l.state, l.country, l.status, l.createddate,
      c.name as campus_name, c.id as campus_id
    FROM salesforce.lead l
    LEFT JOIN fivetran_views.campuses c ON 
      (l.campus_c = c.id OR
       (l.postalcode = c.zip OR (l.city = c.city AND l.state = c.state)))
    ORDER BY l.createddate DESC
    LIMIT $1
  ) combined;
$$;

-- Revoke public access and grant to authenticated and service_role
REVOKE ALL ON FUNCTION public.get_leads_by_geography_with_campus_fivetran FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_leads_by_geography_with_campus_fivetran TO authenticated, service_role;

-- Update database functions wrapper to use both original and fivetran functions
CREATE OR REPLACE FUNCTION public.get_fallback_leads_with_campus(limit_count integer DEFAULT 100)
RETURNS SETOF json LANGUAGE plpgsql SECURITY DEFINER AS $$$
BEGIN
  -- First try with the fivetran compatible function
  BEGIN
    RETURN QUERY SELECT * FROM public.get_leads_with_campus_info_fivetran(limit_count);
    RETURN;
  EXCEPTION WHEN OTHERS THEN
    -- If an error occurs, try the original function
    RETURN QUERY SELECT * FROM public.get_leads_with_campus_info(limit_count);
  END;
END;
$$;

-- Revoke public access and grant to authenticated and service_role
REVOKE ALL ON FUNCTION public.get_fallback_leads_with_campus FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_fallback_leads_with_campus TO authenticated, service_role;

-- Fallback function for lead count by week and campus
CREATE OR REPLACE FUNCTION public.get_fallback_lead_count_by_week_campus(weeks_back integer DEFAULT 12)
RETURNS SETOF json LANGUAGE plpgsql SECURITY DEFINER AS $$$
BEGIN
  -- First try with the fivetran compatible function
  BEGIN
    RETURN QUERY SELECT * FROM public.get_lead_count_by_week_campus_fivetran(weeks_back);
    RETURN;
  EXCEPTION WHEN OTHERS THEN
    -- Then try the underscore version
    BEGIN
      RETURN QUERY SELECT * FROM public.get_lead_count_by_week_campus(weeks_back);
      RETURN;
    EXCEPTION WHEN OTHERS THEN
      -- Finally try the original function with "and" in the name
      BEGIN 
        RETURN QUERY SELECT * FROM public.get_lead_count_by_week_and_campus(weeks_back);
      EXCEPTION WHEN OTHERS THEN
        -- If all functions fail, try the simple lead count function
        RETURN QUERY SELECT * FROM public.get_simple_lead_count_by_week(weeks_back);
      END;
    END;
  END;
END;
$$$;

-- Revoke public access and grant to authenticated and service_role
REVOKE ALL ON FUNCTION public.get_fallback_lead_count_by_week_campus FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_fallback_lead_count_by_week_campus TO authenticated, service_role;

-- Fallback function for leads by geography
CREATE OR REPLACE FUNCTION public.get_fallback_leads_by_geography_with_campus(limit_count integer DEFAULT 1000)
RETURNS SETOF json LANGUAGE plpgsql SECURITY DEFINER AS $$$
BEGIN
  -- First try with the fivetran compatible function
  BEGIN
    RETURN QUERY SELECT * FROM public.get_leads_by_geography_with_campus_fivetran(limit_count);
    RETURN;
  EXCEPTION WHEN OTHERS THEN
    -- If an error occurs, try the original function
    RETURN QUERY SELECT * FROM public.get_leads_by_geography_with_campus(limit_count);
  END;
END;
$$;

-- Revoke public access and grant to authenticated and service_role
REVOKE ALL ON FUNCTION public.get_fallback_leads_by_geography_with_campus FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_fallback_leads_by_geography_with_campus TO authenticated, service_role;

-- Comment explaining the purpose
COMMENT ON FUNCTION public.get_leads_with_campus_info_fivetran IS 'Version of get_leads_with_campus_info compatible with fivetran_views schema';
COMMENT ON FUNCTION public.get_lead_count_by_week_campus_fivetran IS 'Version of get_lead_count_by_week_campus compatible with fivetran_views schema';
COMMENT ON FUNCTION public.get_leads_by_geography_with_campus_fivetran IS 'Version of get_leads_by_geography_with_campus compatible with fivetran_views schema';
COMMENT ON FUNCTION public.get_fallback_leads_with_campus IS 'Tries fivetran function first, falls back to original function if error occurs';
COMMENT ON FUNCTION public.get_fallback_lead_count_by_week_campus IS 'Tries fivetran function first, falls back to original function if error occurs';
COMMENT ON FUNCTION public.get_fallback_leads_by_geography_with_campus IS 'Tries fivetran function first, falls back to original function if error occurs';