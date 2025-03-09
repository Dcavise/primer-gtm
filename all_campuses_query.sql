-- This is the exact SQL query that will run when "All Campuses" is selected
-- in the AdmissionsAnalytics component

SELECT 
  date_trunc('week', l.created_date)::date AS period_start,
  l.preferred_campus_c AS campus_name,
  COUNT(DISTINCT l.id) AS lead_count
FROM 
  fivetran_views.lead l
WHERE 
  l.created_date >= (CURRENT_DATE - (12 || ' week')::interval)
GROUP BY 
  period_start, l.preferred_campus_c
ORDER BY 
  period_start DESC, l.preferred_campus_c;

-- For specific campus like "Birmingham":
/*
SELECT 
  date_trunc('week', l.created_date)::date AS period_start,
  l.preferred_campus_c AS campus_name,
  COUNT(DISTINCT l.id) AS lead_count
FROM 
  fivetran_views.lead l
WHERE 
  l.created_date >= (CURRENT_DATE - (12 || ' week')::interval)
  AND (l.preferred_campus_c = 'Birmingham')
GROUP BY 
  period_start, l.preferred_campus_c
ORDER BY 
  period_start DESC, l.preferred_campus_c;
*/