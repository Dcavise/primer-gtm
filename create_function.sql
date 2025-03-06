-- Create fallback function
CREATE OR REPLACE FUNCTION public.get_fallback_lead_count_by_week_campus(weeks_back integer DEFAULT 12)
RETURNS SETOF json 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $function$
BEGIN
  -- Just call the simple function to ensure at least something works
  RETURN QUERY SELECT * FROM public.get_simple_lead_count_by_week(weeks_back);
END;
$function$;

-- Add grants and comments
COMMENT ON FUNCTION public.get_fallback_lead_count_by_week_campus IS 'Fallback function that calls simple lead count';
GRANT EXECUTE ON FUNCTION public.get_fallback_lead_count_by_week_campus TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_fallback_lead_count_by_week_campus TO service_role;