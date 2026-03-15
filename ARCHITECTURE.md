# Project Architecture & Guidelines

## Backend API Routing Strategy: Flat Routes

To maintain a clean and scalable API architecture, the Hostech project follows a **Flat Routes** convention. This means we avoid deeply nested resource paths in favor of a flatter structure controlled by filters.

### Principle
**No nested resource routes more than 1 level deep.**

- ✅ **Correct (Flat)**: `/rooms?filter[floor_id]={id}`
- ❌ **Incorrect (Nested)**: `/floors/{id}/rooms`

### Why Flat Routes?
1. **Consistency**: All resources are accessed consistently through their primary endpoint.
2. **Flexibility**: Filtering by different criteria (property, floor, status) becomes much more uniform.
3. **Simplicity**: Backend routing and Frontend API clients remain simple and don't need to construct complex URLs.
4. **Performance**: It's often easier to optimize single-resource queries than complex nested ones.

### Frontend Implementation
When writing API calls in the `frontend/src/features/[module]/api/` directory:
- Use parameters for filtering instead of nesting URLs.
- Ensure all sorting and filtering fields are permitted by the backend `allowedSorts` and `allowedFilters` in the corresponding Service.

### Backend Implementation
When defining routes and controllers:
- Use `spatie/laravel-query-builder` to handle filters and sorting on the single resource endpoint.
- Always include the necessary `allowedFilters` and `allowedSorts` in the Service class.
