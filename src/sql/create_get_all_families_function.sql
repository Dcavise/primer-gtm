-- Function to get all family records
-- This function returns all family records with relevant details
-- It should be created in the fivetran_views schema

CREATE OR REPLACE FUNCTION fivetran_views.get_all_families()
RETURNS TABLE (
  family_id TEXT,
  family_name TEXT,
  pdc_family_id_c TEXT,
  current_campus_c TEXT,
  contact_count INTEGER,
  opportunity_count INTEGER,
  opportunity_is_won_flags BOOLEAN[],
  opportunity_school_years TEXT[],
  opportunity_campuses TEXT[],
  opportunity_stages TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.family_id,
    f.family_name,
    f.pdc_family_id_c, 
    f.current_campus_c,
    f.contact_count,
    f.opportunity_count,
    f.opportunity_is_won_flags,
    f.opportunity_school_years,
    f.opportunity_campuses,
    f.opportunity_stages
  FROM 
    fivetran_views.family_standard_ids f
  -- You can add additional filtering or sorting here if needed
  -- For example, to limit to families with active opportunities:
  -- WHERE EXISTS (
  --   SELECT 1 
  --   FROM generate_subscripts(f.opportunity_is_won_flags, 1) AS i 
  --   WHERE f.opportunity_is_won_flags[i] = TRUE
  -- )
  ORDER BY f.family_name
  LIMIT 100; -- Limit to prevent returning too many records
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION fivetran_views.get_all_families() TO anon, authenticated, service_role;

-- Comment on the function
COMMENT ON FUNCTION fivetran_views.get_all_families() IS 'Returns all family records with relevant details';
