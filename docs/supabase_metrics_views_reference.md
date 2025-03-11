# Supabase Metrics Views Reference - fivetran_views Schema

## Overview
The Primer GTM application uses several dedicated views in the fivetran_views schema for displaying and analyzing lead metrics. These views are crucial for the application's reporting and visualization capabilities.

## Available Metrics Views

### 1. date_dimension
A date reference table used for joining with metric data to provide comprehensive date-based reporting even when no data exists for certain dates.

### 2. lead_metrics_daily
Daily aggregation of lead metrics with the following key fields:
- **period_type**: 'day' (constant for this view)
- **period_date**: The specific date
- **formatted_date**: Pre-formatted date string (e.g., "MM/DD/YY")
- **campus_name**: Name of the campus
- **lead_count**: Count of leads for the given date and campus

### 3. lead_metrics_weekly
Weekly aggregation of lead metrics with the following key fields:
- **period_type**: 'week' (constant for this view)
- **period_date**: The starting date of the week
- **formatted_date**: Pre-formatted date string (e.g., "MM/DD/YY")
- **campus_name**: Name of the campus
- **lead_count**: Count of leads for the given week and campus

### 4. lead_metrics_monthly
Monthly aggregation of lead metrics with the following key fields:
- **period_type**: 'month' (constant for this view)
- **period_date**: The starting date of the month
- **formatted_date**: Pre-formatted date string (e.g., "MM/DD/YY")
- **campus_name**: Name of the campus
- **lead_count**: Count of leads for the given month and campus

### 5. current_period_metrics
Contains metrics for the current period (day, week, or month) for quick access to the most recent data.

### 6. combined_lead_metrics
Unified view of all lead metrics that combines daily, weekly, and monthly aggregations into a single view for flexible reporting.

## Common Fields Across Views
- **period_type**: Indicates the aggregation level ('day', 'week', or 'month')
- **period_date**: The date for the period
- **formatted_date**: A pre-formatted date string for display (e.g., "MM/DD/YY")
- **campus_name**: Name of the campus
- **lead_count**: Count of leads for the given period and campus

## Important Usage Notes

### Data Ordering for UI Display
When displaying period-based data in the UI, the visual presentation should follow a chronological order:
- Oldest periods should appear on the left
- Most recent period should be closest to the trend line (on the right)

### SQL Query Best Practices
- Use `ORDER BY period_date DESC` to get the newest data first
- The UI should reverse this order for display purposes
- Always qualify table names with the `fivetran_views` schema (e.g., `fivetran_views.lead_metrics_daily`)
- Never reference the public schema for these views

### Frontend Integration
- The `useFormattedLeadsMetrics` hook should be used to fetch and format data from these views
- This hook handles proper sorting and formatting for UI display

## Related Functions
The following functions work with these metrics views:
- **get_lead_metrics**: Retrieves lead metrics for specified time period
- **get_lead_metrics** (overload 1): Retrieves lead metrics with lookback period
- **get_lead_metrics** (overload 2): Alternative lead metrics function
- **get_lead_metrics_test**: Test function for lead metrics

See the [Supabase Function Reference](./supabase_functions_reference.md) for detailed function documentation.
