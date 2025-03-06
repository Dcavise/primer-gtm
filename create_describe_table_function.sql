-- Function to describe table structure
CREATE OR REPLACE FUNCTION public.describe_table(schema_name text, table_name text) 
RETURNS SETOF json 
LANGUAGE sql 
SECURITY DEFINER 
AS $$ 
  SELECT row_to_json(info) 
  FROM (
    SELECT 
      column_name, 
      data_type, 
      is_nullable 
    FROM 
      information_schema.columns 
    WHERE 
      table_schema = $1 AND 
      table_name = $2 
    ORDER BY 
      ordinal_position
  ) info; 
$$; 
COMMENT ON FUNCTION public.describe_table IS 'Get column information for a table'; 
GRANT EXECUTE ON FUNCTION public.describe_table TO authenticated; 
GRANT EXECUTE ON FUNCTION public.describe_table TO service_role;
