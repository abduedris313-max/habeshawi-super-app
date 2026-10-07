# Sentinel Security Journal

## 2026-10-07 - Unauthenticated Central Repository Catalog API Endpoints
**Vulnerability:** The central repository app management REST API endpoints (`POST /api/repository/apps`, `PUT /api/repository/apps/:id`, `DELETE /api/repository/apps/:id`) lacked authentication middleware, allowing unauthenticated remote clients to publish, modify, or delete mini apps in the catalog.
**Learning:** Endpoints created for internal admin services or developer consoles can easily be left unauthenticated if developed separately from standard auth-protected endpoints.
**Prevention:** Always enforce authentication middleware (`requireAuth`) on all state-modifying (POST, PUT, DELETE, PATCH) API endpoints by default, and require explicit opt-out annotations for intentionally public routes.
