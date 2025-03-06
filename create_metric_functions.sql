-- SQL Functions for Metrics
-- This script recreates functions and views for calculated metrics

-- Example: Function to calculate lead conversion rate by source
CREATE OR REPLACE FUNCTION public.calculate_lead_conversion_rate_by_source()
RETURNS SETOF json
LANGUAGE sql
SECURITY DEFINER AS $$
  SELECT 
    json_build_object(
      'source', l.source,
      'total_leads', COUNT(l.id),
      'converted_leads', SUM(CASE WHEN l.is_converted = true THEN 1 ELSE 0 END),
      'conversion_rate', (SUM(CASE WHEN l.is_converted = true THEN 1 ELSE 0 END)::float / COUNT(l.id)) * 100
    )
  FROM 
    salesforce.lead l
  GROUP BY 
    l.source
  ORDER BY 
    conversion_rate DESC;
$$;
COMMENT ON FUNCTION public.calculate_lead_conversion_rate_by_source IS 'Calculate lead conversion rates by source';
GRANT EXECUTE ON FUNCTION public.calculate_lead_conversion_rate_by_source TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_lead_conversion_rate_by_source TO service_role;

-- Example: View for lead status breakdown
CREATE OR REPLACE VIEW public.lead_status_breakdown AS
  SELECT 
    l.status,
    COUNT(*) as lead_count,
    (COUNT(*)::float / (SELECT COUNT(*) FROM salesforce.lead)) * 100 as percentage
  FROM 
    salesforce.lead l
  GROUP BY 
    l.status
  ORDER BY 
    lead_count DESC;
COMMENT ON VIEW public.lead_status_breakdown IS 'Breakdown of leads by status';
GRANT SELECT ON public.lead_status_breakdown TO authenticated;
GRANT SELECT ON public.lead_status_breakdown TO service_role;

-- Example: Function to get leads by geography with campus overlap
CREATE OR REPLACE FUNCTION public.get_leads_by_geography_with_campus()
RETURNS SETOF json
LANGUAGE sql
SECURITY DEFINER AS $$
  SELECT 
    json_build_object(
      'city', l.city,
      'state', l.state,
      'lead_count', COUNT(l.id),
      'campus_count', COUNT(DISTINCT c.id),
      'campus_names', string_agg(DISTINCT c.name, ', ')
    )
  FROM 
    salesforce.lead l
  LEFT JOIN 
    public.campuses c ON 
      (l.city = c.city AND l.state = c.state)
      OR (l.postal_code = c.zip_code)
  GROUP BY 
    l.city, l.state
  HAVING 
    COUNT(l.id) > 5
  ORDER BY 
    lead_count DESC;
$$;
COMMENT ON FUNCTION public.get_leads_by_geography_with_campus IS 'Get leads grouped by geography with campus information';
GRANT EXECUTE ON FUNCTION public.get_leads_by_geography_with_campus TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_leads_by_geography_with_campus TO service_role;
