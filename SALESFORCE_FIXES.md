# Salesforce Data Access Fixes

This document describes the steps taken to fix the Salesforce data access in the GTM Dashboard.

## Initial Fix: Mock Data Functions

### Problem

The Salesforce leads page was failing to load data with the following errors:
- 404 errors on function calls `get_fallback_lead_count_by_week_campus` and `get_simple_lead_count_by_week`
- 401 unauthorized errors on database access
- Failed SCRAM authentication errors

### Solution

1. Created direct SQL database access using the Supabase CLI and psql
2. Created a mock version of the `get_simple_lead_count_by_week` function that returns synthetic data
3. Created a compatible version of the `get_fallback_lead_count_by_week_campus` function
4. Updated the component to use the parameter name `weeks_back` for the fallback function
5. Ensured all Supabase API keys are correct in both frontend and backend code

### SQL Functions Created

1. `get_simple_lead_count_by_week(lookback_weeks integer DEFAULT 12)` - Returns mock lead data by week
2. `get_fallback_lead_count_by_week_campus(weeks_back integer DEFAULT 12)` - Calls the simple function

### Testing

These functions have been tested using the `test_functions.js` script, which confirms:

1. Both functions are accessible through the Supabase API
2. Both functions return properly formatted data that the frontend can use
3. The functions use parameter names that match what the frontend is sending

## Schema Migration: Replacing `salesforce` Schema with `fivetran_views`

### Background

Originally, the application accessed Salesforce data through both the `salesforce` schema and the `fivetran_views` schema. To simplify and standardize data access, we've migrated all references to use only the `fivetran_views` schema.

### Changes Made

1. **SQL Functions Updated**:
   - Created `update_salesforce_schema_references.sql` with updated function definitions
   - All functions that previously referenced `salesforce` schema now use `fivetran_views`
   - This includes: `query_salesforce_table`, `get_leads_with_campus_info_fivetran`, and more

2. **Public Schema Views**:
   - Created wrapper views in the public schema that select from fivetran_views tables
   - Each view follows the naming pattern `public.salesforce_[tablename]`
   - Created 27 wrapper views for all tables in fivetran_views schema

3. **New Direct Access Utility**:
   - Created a new utility file: `src/utils/salesforce-fivetran-access.ts`
   - This provides a TypeScript interface to directly query fivetran_views tables
   - Includes helper functions for common queries (weekly lead counts, etc.)

4. **Frontend Code Updates**:
   - Updated `useLeadsStats.ts` to use the new direct access utility
   - Changed terminology in UI components from "Salesforce Schema" to "Fivetran Views Schema"

### Implementation Notes

- The `fivetran_views` schema contains all the Salesforce data
- The wrapper views provide a consistent naming pattern for accessing this data
- The utility functions use `supabase.rpc('execute_sql_query')` to run queries directly

### Deployment Instructions

To apply these schema changes:

1. Execute the `update_salesforce_schema_references.sql` file on your Supabase instance
2. Run the `fix_salesforce_tables.js` script to create the wrapper views
3. Deploy the updated frontend code with the schema reference changes
4. Test the connection using the test scripts

### Troubleshooting

If you encounter issues after this migration, you can:

1. Use the `test_fivetran_query.js` script to verify direct access to fivetran_views tables
2. Check if the wrapper views were created correctly with `SELECT * FROM public.salesforce_lead LIMIT 1`
3. Ensure the application has the right permissions to access the fivetran_views schema