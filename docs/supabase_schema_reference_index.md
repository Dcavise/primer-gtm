# Supabase Schema Reference - fivetran_views Schema

This reference documents the complete database schema for the fivetran_views schema used in the Primer GTM application.

## Table Contents

### [Part 1: Account, Account Relations, and Account History](./supabase_schema_reference_part1.md)
- account
- account_contact_relation 
- account_contact_role
- account_feed
- account_history

### [Part 2: Campus and Contact](./supabase_schema_reference_part2.md)
- campus_c
- contact

### [Part 3: Lead and Opportunity](./supabase_schema_reference_part3.md)
- lead
- opportunity

### [Part 4: Fellowship Program](./supabase_schema_reference_part4.md)
- fellows

## Important Notes
- All tables are in the fivetran_views schema, not the public schema
- Most tables include Fivetran-specific fields (_fivetran_deleted, _fivetran_synced) for tracking synchronization
- References between tables are maintained via ID fields (e.g., account_id, contact_id)
- Many fields have custom extensions (ending with _c) specific to the Primer GTM application
- Timestamps are stored with timezone information

## Related Documentation
- [Supabase Function Reference](./supabase_functions_reference.md) - Documentation of all functions in the fivetran_views schema
