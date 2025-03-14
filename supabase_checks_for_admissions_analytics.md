# Supabase Backend Verification for AdmissionsAnalytics

## Overview
This checklist helps verify that your Supabase backend properly supports the AdmissionsAnalytics component. Complete these checks to ensure synchronization between frontend and backend.

## Database Schema Checks

1. Verify fivetran_views schema exists and is accessible:
```sql
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'fivetran_views';
```

2. Check metric views existence and structure:
```sql
-- Check lead_metrics_daily view
SELECT EXISTS (
  SELECT FROM information_schema.views 
  WHERE table_schema = 'fivetran_views' AND table_name = 'lead_metrics_daily'
);

-- Check lead_metrics_weekly view
SELECT EXISTS (
  SELECT FROM information_schema.views 
  WHERE table_schema = 'fivetran_views' AND table_name = 'lead_metrics_weekly'
);

-- Check lead_metrics_monthly view
SELECT EXISTS (
  SELECT FROM information_schema.views 
  WHERE table_schema = 'fivetran_views' AND table_name = 'lead_metrics_monthly'
);
```

3. Verify grade_enrollment_summary view:
```sql
SELECT EXISTS (
  SELECT FROM information_schema.views 
  WHERE table_schema = 'fivetran_views' AND table_name = 'grade_enrollment_summary'
);

-- Check view structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'fivetran_views' AND table_name = 'grade_enrollment_summary';
```

4. Verify opportunity table and required fields:
```sql
-- Check required fields for opportunity table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'fivetran_views' AND table_name = 'opportunity' 
AND column_name IN ('stage_name', 'school_year_c', 'preferred_campus_c');
```

## Data Integrity Checks

5. Check lead metrics data:
```sql
-- Check if lead metrics have recent data (adjust time period as needed)
SELECT COUNT(*) FROM fivetran_views.lead_metrics_weekly WHERE period_date >= CURRENT_DATE - INTERVAL '30 days';
SELECT COUNT(*) FROM fivetran_views.lead_metrics_monthly WHERE period_date >= CURRENT_DATE - INTERVAL '90 days';
```

6. Test campus data retrieval:
```sql
-- Check if campuses can be queried correctly
SELECT DISTINCT preferred_campus_c as campus_name
FROM fivetran_views.lead
WHERE preferred_campus_c IS NOT NULL
ORDER BY preferred_campus_c;
```

7. Verify enrollment data:
```sql
-- Test total enrollment query
SELECT COUNT(DISTINCT id) as enrolled_count
FROM fivetran_views.opportunity
WHERE stage_name = 'Closed Won'
AND school_year_c = '25/26';

-- Check if grade_enrollment_summary has data
SELECT grade, COUNT(*) 
FROM fivetran_views.grade_enrollment_summary 
GROUP BY grade;
```

## Function Checks

8. Verify execute_sql_query RPC function:
```sql
-- Check if function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name = 'execute_sql_query';
```

## Data Formatting Tests

9. Test a full lead metrics query:
```sql
-- Verify lead_metrics_weekly return data matches expected format
SELECT
  period_type,
  period_date,
  formatted_date,
  campus_name,
  lead_count
FROM
  fivetran_views.lead_metrics_weekly
WHERE period_date >= CURRENT_DATE - INTERVAL '90 days'
ORDER BY period_date DESC
LIMIT 10;
```

10. Test converted metrics, closed won metrics, and ARR metrics:
```sql
-- Run sample queries to verify these metrics exist and return data
SELECT * FROM fivetran_views.converted_leads_metrics_weekly LIMIT 5;
SELECT * FROM fivetran_views.closed_won_metrics_weekly LIMIT 5;
SELECT * FROM fivetran_views.arr_metrics_weekly LIMIT 5;
```

## Client Configuration Check

11. Verify environment variables are set correctly:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

## Permission Checks

12. Verify RLS policies or user permissions:
```sql
-- Check if the current user can access the required tables
SELECT has_table_privilege('fivetran_views.lead', 'SELECT');
SELECT has_table_privilege('fivetran_views.opportunity', 'SELECT');
SELECT has_table_privilege('fivetran_views.lead_metrics_weekly', 'SELECT');
```

## Error Case Testing

13. Test database connection with incorrect campus filter:
```sql
-- This should return empty results rather than error
SELECT COUNT(DISTINCT id) as enrolled_count
FROM fivetran_views.opportunity
WHERE stage_name = 'Closed Won'
AND school_year_c = '25/26'
AND preferred_campus_c = 'NonExistentCampus';
```

## Frontend Integration Test

14. Perform an end-to-end test using these curl commands:

```bash
# Test campus retrieval
curl -X POST 'https://YOUR_SUPABASE_URL/rest/v1/rpc/execute_sql_query' \
-H 'apikey: YOUR_ANON_KEY' \
-H 'Authorization: Bearer YOUR_ANON_KEY' \
-H 'Content-Type: application/json' \
-d '{
  "query_text": "SELECT DISTINCT preferred_campus_c as campus_name FROM fivetran_views.lead WHERE preferred_campus_c IS NOT NULL ORDER BY preferred_campus_c"
}'

# Test lead metrics
curl -X POST 'https://YOUR_SUPABASE_URL/rest/v1/rpc/execute_sql_query' \
-H 'apikey: YOUR_ANON_KEY' \
-H 'Authorization: Bearer YOUR_ANON_KEY' \
-H 'Content-Type: application/json' \
-d '{
  "query_text": "SELECT period_type, period_date, formatted_date, campus_name, lead_count FROM fivetran_views.lead_metrics_weekly WHERE period_date >= CURRENT_DATE - INTERVAL \'90 days\' ORDER BY period_date DESC LIMIT 5"
}'
```
