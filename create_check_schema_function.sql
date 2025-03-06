-- Function to check if schema exists and list its tables
CREATE OR REPLACE FUNCTION public.check_schema_tables(schema_name text) 
RETURNS SETOF json 
LANGUAGE sql 
SECURITY DEFINER 
AS $$ 
  WITH schema_exists AS (
    SELECT EXISTS (
      SELECT 1 
      FROM information_schema.schemata 
      WHERE schema_name = $1
    ) AS exists
  ),
  schema_tables AS (
    SELECT 
      table_name
    FROM 
      information_schema.tables
    WHERE 
      table_schema = $1 AND
      table_type = 'BASE TABLE'
    ORDER BY 
      table_name
  )
  SELECT 
    CASE 
      WHEN (SELECT exists FROM schema_exists) = false THEN
        json_build_object(
          'schema_exists', false,
          'schema_name', $1,
          'tables', NULL
        )
      ELSE
        json_build_object(
          'schema_exists', true,
          'schema_name', $1,
          'tables', (
            SELECT json_agg(table_name) FROM schema_tables
          )
        )
    END;
$$; 
COMMENT ON FUNCTION public.check_schema_tables IS 'Check if schema exists and list its tables'; 
GRANT EXECUTE ON FUNCTION public.check_schema_tables TO authenticated; 
GRANT EXECUTE ON FUNCTION public.check_schema_tables TO service_role; 