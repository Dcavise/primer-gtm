# Primer GTM Supabase Documentation

This directory contains comprehensive documentation for the Supabase database used in the Primer GTM application. All database objects are located in the **fivetran_views** schema, not the public schema.

## Documentation Index

### Database Schema
- [Schema Reference Index](./supabase_schema_reference_index.md) - Navigation index for all table documentation
  - [Tables Part 1: Account and Relations](./supabase_schema_reference_part1.md) - account, account_contact_relation, account_contact_role, account_feed, account_history
  - [Tables Part 2: Campus and Contact](./supabase_schema_reference_part2.md) - campus_c, contact
  - [Tables Part 3: Lead and Opportunity](./supabase_schema_reference_part3.md) - lead, opportunity

### Database Functions
- [Functions Reference](./supabase_functions_reference.md) - Complete list of available functions in the fivetran_views schema

### Metrics Views
- [Metrics Views Reference](./supabase_metrics_views_reference.md) - Documentation for lead metrics views used for reporting

## Important Guidelines

### Schema Usage
- **Always use the fivetran_views schema**, not the public schema
- When accessing tables, use schema-qualified names (e.g., `fivetran_views.lead`)
- For function calls, use direct schema name (e.g., `fivetran_views.search_families`) or just the function name when appropriate

### Data Handling
- Most tables include Fivetran-specific fields (`_fivetran_deleted`, `_fivetran_synced`) for tracking synchronization
- References between tables are maintained via ID fields (e.g., `account_id`, `contact_id`)
- Many fields have custom extensions (ending with `_c`) specific to the Primer GTM application
- Timestamps are stored with timezone information

### UI Integration
- For metrics views, use the `useFormattedLeadsMetrics` hook to fetch and format data
- When displaying period-based data, present in chronological order with oldest periods on the left
- SQL queries should use `ORDER BY period_date DESC` to get the newest data first, but UI should reverse this for display

## Common Tables and Views

### Core Data Tables
- `account` - Families/organizations
- `contact` - Individual contacts
- `lead` - Prospective students/families
- `opportunity` - Enrollment opportunities
- `campus_c` - Campus locations

### Metric Views
- `date_dimension` - Date reference table
- `lead_metrics_daily` - Daily aggregation of lead metrics
- `lead_metrics_weekly` - Weekly aggregation of lead metrics
- `lead_metrics_monthly` - Monthly aggregation of lead metrics
- `current_period_metrics` - Current period metrics
- `combined_lead_metrics` - Combined view of all lead metrics
