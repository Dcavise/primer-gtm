# Primer GTM Project Guide

## Build & Development
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run build:dev`: Build for development
- `npm run lint`: Run ESLint
- `npm run lint:fix`: Run ESLint with auto-fix
- `npm run format`: Run Prettier formatting
- `vitest`: Run all tests
- `vitest src/path/to/file.test.ts`: Run specific test
- `vitest --coverage`: Generate test coverage report

## Code Style
- **TypeScript**: Use strict types (though strictNullChecks is disabled)
- **React Components**: Use functional components with React.FC<Props> type
- **Naming**: PascalCase for components, camelCase for functions/variables
- **Imports**: Group by: React/core, UI components, hooks/utils
- **Path Aliases**: Use `@/` for src directory imports
- **Hooks**: Prefix custom hooks with "use" (e.g., useLeadsStats)
- **Error Handling**: Use try/catch with proper error reporting
- **UI Components**: Use shadcn/ui components from Radix UI
- **State Management**: Use React Query for remote data
- **Testing**: Vitest with React Testing Library in jsdom environment

## Project Structure
- Features in `/src/features/` (organized by business domain)
  - Each feature contains its own components, hooks, routes, and services
- Components in `/src/components/` (shared UI components)
- Hooks in `/src/hooks/` (domain-specific in subfolders)
- Services for API connections in `/src/services/`
- Utils in `/src/utils/` for shared utilities

## Code Organization Rules
- All feature-specific components should be in `/src/features/[feature]/components/`
- All feature-specific hooks should be in `/src/features/[feature]/hooks/`
- Only shared components go in `/src/components/`
- All component imports should use `@/` path aliases

## Supabase Database Structure

### Important Guidelines
- **Always use the fivetran_views schema**, not the public schema
- When accessing tables, use schema-qualified names (e.g., `fivetran_views.lead`)
- For function calls, use direct schema name (e.g., `fivetran_views.search_families`) 
- For campus information, use `current_campus_name` and `opportunity_campus_names` fields from the family record instead of IDs

### Key Tables
- `account` - Families/organizations
- `contact` - Individual contacts
- `lead` - Prospective students/families
- `opportunity` - Enrollment opportunities
- `campus_c` - Campus locations (contains both ID and name fields)

### Important Functions
- **get_family_record**: Retrieves detailed family record by family ID (now includes campus names)
- **get_campus_names**: Retrieves campus names for an array of campus IDs
- **get_campus_name**: Retrieves a single campus name for a given campus ID
- **search_families**: Searches for families matching search term
- **get_lead_metrics**: Retrieves lead metrics for specified time period

### Family Record Structure
The family record now includes these additional fields:
- `current_campus_name`: Human-readable name of the family's campus
- `opportunity_campus_names`: Array of campus names corresponding to each opportunity

### Metrics Views
- `lead_metrics_daily` - Daily aggregation of lead metrics
- `lead_metrics_weekly` - Weekly aggregation of lead metrics
- `lead_metrics_monthly` - Monthly aggregation of lead metrics

### Documentation
Full database documentation is available in the `/docs/` directory:
- Main Index: `/docs/supabase_documentation_index.md`
- Functions Reference: `/docs/supabase_functions_reference.md`
- Schema Reference: `/docs/supabase_schema_reference_*.md`
- Metrics Views Reference: `/docs/supabase_metrics_views_reference.md`