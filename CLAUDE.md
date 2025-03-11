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
- **The application database schema is fivetran_views, not public**
- When accessing tables, use schema-qualified names (e.g., `fivetran_views.lead`)
- For function calls, use direct schema name (e.g., `fivetran_views.search_families`) 
- For campus information, use `current_campus_name` and `opportunity_campus_names` fields from the family record instead of IDs
- When displaying student information, use the new structured `students` array from enhanced family records

### Key Tables
- `account` - Families/organizations
- `contact` - Individual contacts
- `lead` - Prospective students/families
- `opportunity` - Enrollment opportunities
- `campus_c` - Campus locations (contains both ID and name fields)
- `derived_students` - Virtual students derived from opportunities
- `opportunity_student_map` - Maps opportunities to students

### Important Functions
- **get_family_record**: Retrieves detailed family record by family ID (now includes campus names)
- **get_enhanced_family_record**: Retrieves family record with structured student data
- **get_campus_names**: Retrieves campus names for an array of campus IDs
- **get_campus_name**: Retrieves a single campus name for a given campus ID
- **search_families**: Searches for families matching search term
- **get_lead_metrics**: Retrieves lead metrics for specified time period
- **populate_derived_students**: Builds the derived students from opportunity data
- **set_opportunity_student_override**: Manually assigns an opportunity to a specific student

### Enhanced Family Record Structure
The enhanced family record includes a structured approach to students and opportunities:

```typescript
interface EnhancedFamilyRecord {
  family_id: string;
  family_name: string;
  pdc_family_id_c: string;
  current_campus_c: string;
  current_campus_name: string;
  
  // Structured student data
  students: {
    id: string;
    first_name: string;
    last_name: string;
    full_name: string;
    opportunities: {
      id: string;
      name: string;
      stage: string;
      school_year: string;
      is_won: boolean;
      created_date: string;
      record_type_id: string;
      campus: string;
      campus_name?: string;
    }[];
  }[];
  
  // Structured contact data
  contacts: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    last_activity_date: string;
  }[];
  
  // Count fields
  contact_count: number;
  opportunity_count: number;
  student_count: number;
  
  // Legacy fields (for backward compatibility)
  opportunity_ids?: string[];
  opportunity_names?: string[];
  opportunity_stages?: string[];
  opportunity_school_years?: string[];
  opportunity_is_won?: boolean[];
}
```

### Student Data Structure
Each student record includes:
- Student identification (first/last name)
- Array of all opportunities across different school years
- Each opportunity includes its stage, campus, and other details

### Data Synchronization
The student data is synchronized with opportunity data through scheduled updates:

1. **Periodic Refresh**: The `populate_derived_students()` function is scheduled to run periodically to process new opportunities
2. **Manual Updates**: Special cases can be handled with the `set_opportunity_student_override()` function
3. **Implementation**: Using Option 3 (Scheduled Updates) for efficient batch processing of Fivetran data syncs

To manually refresh the student data, you can run:
```sql
SELECT fivetran_views.populate_derived_students();
```

### Handling Special Cases
The system includes a way to handle special cases like Ivana Buritica with the `opportunity_student_map` table:
- `is_manual_override` flag for manually corrected mappings
- The `set_opportunity_student_override` function to assign specific opportunities to students

Example of manually mapping an opportunity to a specific student:
```sql
SELECT fivetran_views.set_opportunity_student_override(
  '006UH00000IPT46YAH',  -- Opportunity ID
  'Ivana',                -- Student first name
  'Buritica'              -- Student last name
);
```

### Views and Aggregations
- `enhanced_family_records` - Provides structured student and opportunity data
- `lead_metrics_daily` - Daily aggregation of lead metrics
- `lead_metrics_weekly` - Weekly aggregation of lead metrics
- `lead_metrics_monthly` - Monthly aggregation of lead metrics

### Frontend Integration
The frontend now includes:
- `useEnhancedFamilyData` hook for the new data structure
- `EnhancedFamilyDetail` component to display structured student data
- Improved display of student enrollment across multiple school years

### Documentation
Full database documentation is available in the `/docs/` directory:
- Main Index: `/docs/supabase_documentation_index.md`
- Functions Reference: `/docs/supabase_functions_reference.md`
- Schema Reference: `/docs/supabase_schema_reference_*.md`
- Metrics Views Reference: `/docs/supabase_metrics_views_reference.md`