-- Create a schema for Fivetran-compatible views
CREATE SCHEMA IF NOT EXISTS fivetran_views;

-- Grant usage on the schema to authenticated users and service_role
GRANT USAGE ON SCHEMA fivetran_views TO authenticated, service_role;

-- Create a view for campuses with UUID converted to text
CREATE OR REPLACE VIEW fivetran_views.campuses AS
SELECT 
    id::text as id,
    -- Include all other columns as-is
    name,
    address,
    city,
    state,
    zip,
    country,
    latitude,
    longitude,
    created_at,
    updated_at,
    is_active,
    region,
    salesforce_id
FROM public.campuses;

-- Create a view for comment_mentions with UUIDs converted to text
CREATE OR REPLACE VIEW fivetran_views.comment_mentions AS
SELECT 
    id::text as id,
    comment_id::text as comment_id,
    -- Include all other columns as-is
    user_id,
    created_at,
    updated_at
FROM public.comment_mentions;

-- Grant select permissions on the views
GRANT SELECT ON ALL TABLES IN SCHEMA fivetran_views TO authenticated, service_role;

-- Comment explaining the purpose
COMMENT ON SCHEMA fivetran_views IS 'Schema containing views with Fivetran-compatible data types (UUID converted to TEXT)';
COMMENT ON VIEW fivetran_views.campuses IS 'View of public.campuses with UUID converted to TEXT for Fivetran compatibility';
COMMENT ON VIEW fivetran_views.comment_mentions IS 'View of public.comment_mentions with UUID converted to TEXT for Fivetran compatibility';