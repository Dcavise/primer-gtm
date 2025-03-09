# Lead Metrics Function Documentation

This document describes the new `fivetran_views.get_lead_metrics` function for analytics purposes.

## Overview

The `get_lead_metrics` function provides flexible metrics for leads created, allowing filtering by time period (day/week/month) and campus. This is designed to replace the older `get_simple_lead_count_by_week` function while maintaining backward compatibility.

## Function Signature

```sql
CREATE OR REPLACE FUNCTION fivetran_views.get_lead_metrics(
  time_period TEXT DEFAULT 'week',
  lookback_units INTEGER DEFAULT 12,
  campus_id TEXT DEFAULT NULL
)
RETURNS SETOF json
```

## Parameters

- `time_period`: Type of period to group by ('day', 'week', or 'month')
- `lookback_units`: Number of periods to look back from current date (e.g., 12 weeks)
- `campus_id`: Optional campus ID to filter leads (NULL for all campuses)

## Return Format

The function returns a set of JSON objects with the following structure:

```json
{
  "period_start": "2025-02-24",       // Start date of the period (ISO format)
  "period_type": "week",              // Type of period (day, week, month)
  "campus_name": "Chicago",           // Name of the campus
  "campus_id": "123e4567-e89b-12d3",  // Campus ID
  "lead_count": 42                    // Count of distinct leads
}
```

## Implementation Details

1. The function checks for the existence of required schemas and tables first
2. It validates the `time_period` parameter to ensure it's one of the allowed values
3. It counts **distinct** lead IDs from `fivetran_views.lead` 
4. It joins to campuses using both direct ID references (`campus_c`) and name references (`preferred_campus_c`)
5. When a campus filter is provided, it filters using both methods

## Usage Examples

Basic usage (weekly data for 12 weeks):
```sql
SELECT * FROM fivetran_views.get_lead_metrics();
```

Monthly data for last 6 months:
```sql
SELECT * FROM fivetran_views.get_lead_metrics('month', 6);
```

Daily data for last 30 days for a specific campus:
```sql
SELECT * FROM fivetran_views.get_lead_metrics('day', 30, '123e4567-e89b-12d3');
```

## Backward Compatibility

The original `get_simple_lead_count_by_week` function now wraps `fivetran_views.get_lead_metrics`, maintaining the same interface for existing code:

```sql
CREATE OR REPLACE FUNCTION public.get_simple_lead_count_by_week(
  lookback_weeks integer DEFAULT 12
)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY SELECT * FROM fivetran_views.get_lead_metrics('week', lookback_weeks, NULL);
END;
$$;
```

## Deployment

Functions are deployed using the `deploy_lead_metrics.js` script, which:

1. Creates or confirms the `fivetran_views` schema
2. Creates the `fivetran_views.get_lead_metrics` function
3. Creates the backward compatibility wrapper in public schema
4. Sets appropriate permissions and comments
5. Creates test views for development environments

## Testing

The test script (`test_lead_metrics.js`) verifies the function works correctly, testing various parameter combinations and the backward compatibility wrapper.