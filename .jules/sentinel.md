## 2026-03-30 - Unauthenticated Central App Repository Mutation Routes
**Vulnerability:** The central repository REST endpoints (`POST /api/repository/apps`, `PUT /api/repository/apps/:id`, and `DELETE /api/repository/apps/:id`) lacked authentication middleware, allowing any unauthenticated client to publish, modify, or delete mini-app packages from the catalog.
**Learning:** Backend routes serving multi-tenant administrative catalog mutations must explicitly enforce authentication (`requireAuth`) even if frontend administrative consoles implement client-side authorization checks.
**Prevention:** Always wrap all state-modifying Express API endpoints (POST/PUT/DELETE) with `requireAuth` or equivalent token-validation middleware.
