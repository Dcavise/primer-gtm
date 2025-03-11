-- Function to get campus names
-- This function accepts an array of campus IDs and returns an array of campus names
-- To be used in the getFamilyRecord function

CREATE OR REPLACE FUNCTION fivetran_views.get_campus_names(campus_ids text[])
RETURNS TABLE(campus_id text, campus_name text) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id AS campus_id,
    c.name AS campus_name
  FROM 
    fivetran_views.campus_c c
  WHERE 
    c.id = ANY(campus_ids);
END;
$$ LANGUAGE plpgsql;

-- Function to get a single campus name
CREATE OR REPLACE FUNCTION fivetran_views.get_campus_name(campus_id text)
RETURNS text AS $$
DECLARE
  v_campus_name text;
BEGIN
  SELECT name INTO v_campus_name
  FROM fivetran_views.campus_c
  WHERE id = campus_id;
  
  RETURN COALESCE(v_campus_name, 'Unknown Campus');
END;
$$ LANGUAGE plpgsql;