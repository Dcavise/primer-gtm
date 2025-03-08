# Feature-Based Architecture

This application follows a feature-based architecture where each feature is a self-contained module with its own:

- Routes
- Components
- Hooks
- Utilities
- Services

## Structure

```
src/
  features/
    auth/               # Authentication feature
      components/       # Auth-specific components
      hooks/           # Auth-specific hooks
      services/        # Auth-specific services
      routes.tsx       # Auth routes configuration
    
    realEstate/         # Real Estate feature
      components/
      hooks/
      services/
      routes.tsx
    
    salesforce/         # Salesforce data feature
      components/
      hooks/
      services/
      routes.tsx
    
    propertyResearch/   # Property research feature
      components/
      hooks/
      services/
      routes.tsx
    
    liveLook/           # Live visualization feature
      components/
      hooks/
      services/
      routes.tsx
    
    common/             # Shared utilities and components
      components/       # Common UI components
      utils/            # Common utilities
      services/         # Shared services (DB, API, etc.)
      routes.tsx        # Common routes (404, etc.)
      
    registry.tsx        # Feature registry
```

## Adding a New Feature

To add a new feature:

1. Create a new folder under `src/features/`
2. Add a `routes.tsx` file defining your feature routes
3. Register your feature in `registry.tsx`
4. Add components, hooks, and services specific to your feature

## Feature Registry

The feature registry (`registry.tsx`) is the central place where all features are registered. It provides methods to:

- Get all routes for the application
- Get authenticated routes (requiring login)
- Get authentication routes
- Get features for navigation

## Navigation

The navigation is dynamically built based on registered features. Each feature can define navigation items in its `routes.tsx` file.

## Development Guidelines

- Keep features self-contained
- Use shared utilities from `common` when needed
- Export common interfaces, types, and utilities from each feature's index.ts