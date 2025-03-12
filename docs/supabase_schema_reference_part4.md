# Supabase Schema Reference - Part 4: Fellowship Program

This document contains the schema reference for the fellowship program tables in the fivetran_views schema.

## fellows

Table for tracking fellowship program participants and their hiring process.

| Column Name    | Data Type                 | Description                                               | Constraints                                      |
|----------------|---------------------------|-----------------------------------------------------------|--------------------------------------------------|
| id             | UUID                      | Unique identifier for the fellow                           | PRIMARY KEY, DEFAULT gen_random_uuid()           |
| fellow_name    | TEXT                      | Full name of the fellow                                    | NOT NULL                                         |
| cohort         | TEXT                      | Cohort number that the fellow belongs to                   | CHECK (cohort IN ('1', '2', '3', 'unknown'))     |
| grade_band     | TEXT                      | Grade band the fellow teaches or is qualified for          |                                                  |
| hiring_stage   | TEXT                      | Current stage in the hiring process                        | CHECK (hiring_stage IN ('new', 'fellow', 'offer', 'hired', 'rejected', 'declined')) |
| campus_id      | TEXT                      | Reference to the campus the fellow is associated with      | REFERENCES fivetran_views.campus_c(id)           |
| applied_date   | DATE                      | Date when the fellow applied                               |                                                  |
| offered_date   | DATE                      | Date when an offer was extended to the fellow              |                                                  |
| status         | TEXT                      | Current status of the fellow in the program                | CHECK (status IN ('hired', 'open', 'closed', 'unknown')) |
| comment_id     | UUID                      | Reference to hiring comments (for future implementation)   |                                                  |
| created_at     | TIMESTAMP WITH TIME ZONE  | Timestamp when the record was created                      | DEFAULT now()                                    |
| updated_at     | TIMESTAMP WITH TIME ZONE  | Timestamp when the record was last updated                 | DEFAULT now(), automatically updated on change   |

### Indexes

| Index Name             | Columns       | Type      | Description                                  |
|------------------------|---------------|-----------|----------------------------------------------|
| idx_fellows_campus_id  | campus_id     | B-tree    | Improves join performance with campus table  |

### Relationships

- **campus_id**: References the `id` column in the `fivetran_views.campus_c` table
- **comment_id**: Will reference a future `hiring_comments` table (not yet implemented)

### Triggers

- **set_fellows_updated_at**: BEFORE UPDATE trigger that automatically updates the `updated_at` timestamp when a record is modified

## Important Notes

- This table is in the `fivetran_views` schema, not the public schema
- The `cohort`, `hiring_stage`, and `status` fields have constraints to enforce valid values (picklists)
- The table includes timestamp tracking for creation and updates
- The `campus_id` field creates a relationship with the `campus_c` table for campus information
- A planned relationship with a future `hiring_comments` table is accommodated with the `comment_id` field
