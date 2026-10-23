## 2026-03-30 - Unauthenticated Central Repository API Mutation Endpoints
**Vulnerability:** Central repository management REST endpoints (`POST /api/repository/apps`, `PUT /api/repository/apps/:id`, `DELETE /api/repository/apps/:id`) were unauthenticated, allowing any unauthenticated client to create, modify, or delete mini-app packages in memory catalog.
**Learning:** REST endpoints added for developer console synchronization omitted the `requireAuth` middleware used by user endpoints.
**Prevention:** Apply `requireAuth` middleware to all state-modifying backend routes and ensure client services pass `Authorization: Bearer <token>` headers.
