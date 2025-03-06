-- Function to check if a schema exists and list its tables
CREATE OR REPLACE FUNCTION public.test_schema_exists(schema_name text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  schema_exists boolean;
  schema_tables text[];
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM information_schema.schemata
    WHERE schema_name = $1
  ) INTO schema_exists;
  
  IF schema_exists THEN
    SELECT array_agg(table_name::text)
    FROM information_schema.tables
    WHERE table_schema = $1
    AND table_type = 'BASE TABLE'
    INTO schema_tables;
  END IF;
  
  RETURN json_build_object(
    'exists', schema_exists,
    'tables', COALESCE(schema_tables, ARRAY[]::text[])
  );
END;
$$;

COMMENT ON FUNCTION public.test_schema_exists IS 'Check if a schema exists and list its tables';
GRANT EXECUTE ON FUNCTION public.test_schema_exists TO authenticated;
GRANT EXECUTE ON FUNCTION public.test_schema_exists TO service_role; 