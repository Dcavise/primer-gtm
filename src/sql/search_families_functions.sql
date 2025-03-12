-- Drop existing functions first to avoid conflicts
DROP FUNCTION IF EXISTS fivetran_views.search_families(text);
DROP FUNCTION IF EXISTS fivetran_views.search_families_consistent(text);

-- Create the main search function
CREATE OR REPLACE FUNCTION fivetran_views.search_families(search_term text)
RETURNS TABLE (
    family_id text,
    family_name text,
    pdc_family_id_c text,
    current_campus_c text,
    current_campus_name text,
    contact_count integer,
    opportunity_count integer,
    opportunity_is_won_flags boolean[],
    opportunity_school_years text[],
    opportunity_campuses text[],
    opportunity_stages text[]
) 
LANGUAGE sql
AS $$
    SELECT 
        fs.family_id::text,
        fs.family_name,
        fs.pdc_family_id_c,
        fs.current_campus_c,
        c.name as current_campus_name,
        fs.contact_count,
        fs.opportunity_count,
        fs.opportunity_is_won_flags,
        ARRAY[''] as opportunity_school_years,
        fs.opportunity_preferred_campuses as opportunity_campuses,
        fs.opportunity_stages
    FROM 
        fivetran_views.comprehensive_family_records_with_students fs
    LEFT JOIN
        fivetran_views.campus_c c ON fs.current_campus_c = c.id
    WHERE 
        fs.family_name ILIKE '%' || search_term || '%' OR
        c.name ILIKE '%' || search_term || '%' OR
        EXISTS (
            SELECT 1 
            FROM generate_subscripts(fs.opportunity_names, 1) AS i 
            WHERE 
                fs.opportunity_names[i] ILIKE '%' || search_term || '%'
        ) OR
        EXISTS (
            SELECT 1 
            FROM fivetran_views.opportunity o
            WHERE 
                o.account_id = fs.family_id::varchar AND
                (o.student_first_name_c ILIKE '%' || search_term || '%' OR
                 o.student_last_name_c ILIKE '%' || search_term || '%')
        ) OR
        EXISTS (
            SELECT 1 
            FROM fivetran_views.derived_students s
            WHERE 
                s.family_id = fs.family_id::varchar AND
                (s.first_name ILIKE '%' || search_term || '%' OR
                 s.last_name ILIKE '%' || search_term || '%' OR
                 s.full_name ILIKE '%' || search_term || '%')
        ) OR
        EXISTS (
            SELECT 1 
            FROM generate_subscripts(fs.contact_last_names, 1) AS i 
            WHERE 
                fs.contact_last_names[i] ILIKE '%' || search_term || '%' OR
                fs.contact_emails[i] ILIKE '%' || search_term || '%' OR
                fs.contact_phones[i] ILIKE '%' || search_term || '%'
        ) OR
        EXISTS (
            SELECT 1 
            FROM fivetran_views.contact c
            WHERE 
                c.account_id = fs.family_id::varchar AND
                (c.first_name ILIKE '%' || search_term || '%' OR
                 c.last_name ILIKE '%' || search_term || '%' OR
                 c.email ILIKE '%' || search_term || '%' OR
                 c.phone ILIKE '%' || search_term || '%')
        ) OR
        EXISTS (
            SELECT 1 
            FROM generate_subscripts(fs.student_first_names, 1) AS i 
            WHERE 
                fs.student_first_names[i] ILIKE '%' || search_term || '%' OR
                fs.student_last_names[i] ILIKE '%' || search_term || '%' OR
                fs.student_full_names[i] ILIKE '%' || search_term || '%'
        )
    LIMIT 20
$$;

-- Create the consistent version of the search function
CREATE OR REPLACE FUNCTION fivetran_views.search_families_consistent(search_term text)
RETURNS TABLE (
    family_id text,
    family_name text,
    pdc_family_id_c text,
    current_campus_c text,
    current_campus_name text,
    contact_count integer,
    opportunity_count integer,
    opportunity_is_won_flags boolean[],
    opportunity_school_years text[],
    opportunity_campuses text[],
    opportunity_stages text[]
) 
LANGUAGE sql
STABLE
AS $$
    SELECT * FROM fivetran_views.search_families(search_term);
$$;
