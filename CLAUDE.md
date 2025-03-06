# Primer GTM Codebase Guide

## Key Commands
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run lint`: Run ESLint
- `vitest`: Run all tests
- `vitest src/hooks/salesforce/__tests__/useLeadsStats.test.ts`: Run specific test
- `vitest --coverage`: Generate test coverage report

## Code Style
- **TypeScript**: Use strict types, interfaces for props
- **React Components**: Use functional components with React.FC<Props> type
- **Naming**: PascalCase for components, camelCase for functions/variables
- **Imports**: Group by: React, UI components, icons, then hooks/utils
- **Hooks**: Prefix custom hooks with "use" (e.g., useLeadsStats)
- **Error Handling**: Use try/catch with error reporting
- **UI Components**: Use shadcn/ui components from ./components/ui
- **State Management**: Use React Query for remote data
- **Testing**: Jest/Vitest with React Testing Library
- **Formatting**: Follow ESLint configuration

## Project Structure
- Components in `/src/components/` (organized by domain)
- Hooks in `/src/hooks/` (domain-specific in subfolders)
- Pages in `/src/pages/`
- API services in `/src/services/`
- Backend Edge Functions in `/supabase/functions/`