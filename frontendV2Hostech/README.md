# Hostech V2 Frontend

Welcome to the new **Hostech V2 Frontend**. This application represents a comprehensive architectural rewrite of the legacy Hostech frontends. It consolidates the previously fragmented Vue/React dashboards into a single, high-performance, strictly-typed monorepo-style SPA built with **React 18**, **TypeScript**, **Vite**, and **Tailwind CSS 3**.

## 🌟 Key Upgrades & Features

1. **Unified Application Architecture**
   Instead of separate apps for Super Admins, Property Owners, Managers, and Tenants, this platform acts as a unified portal. Users log in once, and their dashboard, routing, and available data are contextually scoped to their global `role` and assigned `organizationId`/`propertyId`.

2. **State Management (Zustand & React Query)**
   - **Zustand** is used for global client states (like Authentication rules, UI context, and Scope context).
   - **TanStack React Query** manages Server State with sophisticated data fetching, caching, and background synchronizations against the Laravel backend API.

3. **Advanced Scoping Strategy (`useScopeStore`)**
   Hostech V2 heavily relies on structural scoping. Upon login, the app evaluates what Organization and what Property the user is "focusing" on. 
   - A `PropertySwitcher` sits globally in the header for fast context-switching.
   - Operations that alter data automatically attach `organization_id` or `property_id` headers to keep multitenant constraints safe.

4. **"Antigravity" Design Language**
   The application intentionally rejects boring enterprise aesthetics. 
   - Uses `Framer Motion` extensively for micro-interactions (page transitions, modal presences).
   - Abandons standard HTML `<table>` for styled card grids, infinite scroll lists, and engaging data presentations (check out the `RoomsPage` and `PropertiesPage`).
   - Unified color tokens (`indigo-500` accents, sleek `slate-900` text, distinct interactive hover states).

## 🚀 Directory Structure

```text
/frontendV2Hostech
├── /src
│   ├── /api              # Axios client, interceptors (for JWT refresh logic)
│   ├── /components       
│   │   ├── /ui           # Core design system components (Modal, Toasts, Inputs)
│   │   └── /tenant       # Tenant-specific global components
│   ├── /features         # Feature-based domains (Auth, Properties, Users)
│   │   ├── /auth         # login components, auth stores
│   │   └── /properties   # property switcher, selectors
│   ├── /hooks            # Data fetching hooks (React Query integrations)
│   ├── /layouts          # Layout containers controlling boundaries
│   │   ├── SuperAdminLayout.tsx
│   │   ├── WebAdminLayout.tsx
│   │   └── TenantAppLayout.tsx
│   ├── /pages            # Route-level visual pages
│   │   ├── /admin        # Owner/Manager/Staff context wrappers
│   │   └── /tenant       # Resident context wrappers
│   ├── /routes           # Global AppRoutes controlling ProtectedRoute layers
│   ├── /stores           # Global Zustand stores (like /stores/useScopeStore.ts)
│   └── /utils            # Helpers & formatters
```

## 🔐 Authentication Flow

The `/login` screen uses `useAuthStore` to negotiate with backend endpoints. Upon successful return of tokens:
1. Bearer Token is persisted natively and hydrated by Zustand.
2. Axios intercepts attach it to every subsequent `/api/` query.
3. Access Control routing in `AppRoutes` intercepts unauthenticated or unprivileged paths.

## 🛠 Developer Setup

Ensure you are using at least Node 18 or 20.

```bash
cd frontendV2Hostech
npm install

# Start the local development server (HMR enabled)
npm run dev
```

### Environment Config

Ensure you have mapped your `.env` (or `.env.local`) file properly to interface with the core Laravel backend:
```env
VITE_API_URL="http://localhost:8000/api/"
# Optional alias (same as VITE_API_URL if you prefer this name):
# VITE_API_BASE_URL="http://localhost:8000/api/"
# Optional: log every Axios request/response in the browser console (default: off except in dev)
# VITE_DEBUG_API=1
VITE_APP_NAME="Hostech V2"
```

## 🏗 Contributing

- **New Pages & Components:** Always build leveraging the local `/src/components/ui/` pieces or use Tailwind classes identical to existing structural paradigms.
- **Routing:** Add deep-links and new menus to `WebAdminLayout` or `TenantAppLayout` as necessary conditionally based on user `role`.
- **Query Hooks:** All interactions with `/api/` should be wrapped in custom `useQuery` or `useMutation` hooks isolated in the `/src/hooks` or domain `/src/features/` folders. Do not inline `axios.get()` structurally inside UI components.
