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