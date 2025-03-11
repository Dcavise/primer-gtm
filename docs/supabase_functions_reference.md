# Supabase Function Reference - fivetran_views Schema


## Core User Functions

- **create_user_profile**: Creates a new user profile
  - Arguments: user_id uuid, name text, email text, ...
  - Return type: void
  - Security: Definer

- **handle_new_user**: Trigger function for new user creation
  - Arguments: -
  - Return type: trigger
  - Security: Definer


## Data Query Functions

- **execute_sql_query**: Executes a custom SQL query
  - Arguments: query_text text
  - Return type: json
  - Security: Definer


## Campus Functions

### get_campus_names

#### Description

Returns campus names for given campus IDs

#### Arguments

- `campus_ids` (text[]): Array of campus IDs

#### Returns

- `campus_id` (text): Campus ID
- `campus_name` (text): Campus name

### get_campus_name

#### Description

Returns campus name for a single campus ID

#### Arguments

- `campus_id` (text): Campus ID

#### Returns

- `campus_name` (text): Campus name or 'Unknown Campus' if not found

- **get_campus_names**: Retrieves campus names for given IDs
  - Arguments: campus_ids text[]
  - Return type: TABLE(id character varying, name character varying)
  - Security: Definer

- **get_total_arr**: Gets total ARR amount, optionally filtered by campus
  - Arguments: campus_filter text DEFAULT NULL
  - Return type: TABLE(total_arr_amount numeric)
  - Security: Invoker


## Family Record Functions

- **get_family_by_any_id**: Retrieves comprehensive family records by any ID type
  - Arguments: p_id text
  - Return type: SETOF fivetran_views.comprehensive_family_records
  - Security: Invoker

- **get_family_by_standard_id**: Retrieves family records by standard ID
  - Arguments: p_id text
  - Return type: SETOF fivetran_views.family_standard_ids
  - Security: Invoker

- **get_family_record**: Retrieves detailed family record by family ID
  - Arguments: p_family_id uuid
  - Return type: Complex TABLE with family details, contacts, opportunities, and tuition information
  - Security: Invoker

- **search_families**: Searches for families matching the search term
  - Arguments: search_term text
  - Return type: SETOF json
  - Security: Definer

- **search_families_consistent**: Searches for families with consistent results
  - Arguments: search_term text
  - Return type: SETOF json
  - Security: Definer


## Metrics Functions

- **get_lead_metrics**: Retrieves lead metrics for specified time period
  - Arguments: time_period text DEFAULT 'week'
  - Return type: TABLE(period_start date, period_type text, campus_name text, campus_id text, lead_count bigint)
  - Security: Invoker

- **get_lead_metrics** (overload 1): Retrieves lead metrics with lookback period
  - Arguments: period_type text, lookback_units integer
  - Return type: TABLE(period_start date, distinct_lead_count bigint)
  - Security: Invoker

- **get_lead_metrics** (overload 2): Alternative lead metrics function
  - Arguments: period_type text, lookback_units integer
  - Return type: TABLE(period_start date, distinct_lead_count bigint)
  - Security: Invoker

- **get_lead_metrics_test**: Test function for lead metrics
  - Arguments: -
  - Return type: TABLE(period_start date, distinct_lead_count bigint)
  - Security: Invoker


## Important Notes

- Functions with "Definer" security execute with the privileges of the user who created the function
- Functions with "Invoker" security execute with the privileges of the user calling the function
- Family record data includes comprehensive information about contacts, opportunities, and tuition offers
- Multiple get_lead_metrics functions exist with different parameter signatures
- Always use the fivetran_views schema when calling these functions, not the public schema
- When making function calls, either use the schema-qualified name (e.g., 'fivetran_views.search_families') or just the function name without schema qualification when appropriate
