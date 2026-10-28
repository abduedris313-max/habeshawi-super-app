## 2026-03-31 - Central Repository Mutation Endpoints Missing Authentication

**Vulnerability:** The central repository REST API endpoints (`POST /api/repository/apps`, `PUT /api/repository/apps/:id`, and `DELETE /api/repository/apps/:id`) in `server.ts` lacked `requireAuth` middleware, allowing unauthenticated clients to manipulate or delete packages in the app store catalog.

**Learning:** When adding REST endpoints for admin or catalog management services, ensure that Express routes enforce authentication using `requireAuth` and client services attach Firebase Bearer tokens via `auth.currentUser.getIdToken()`.

**Prevention:** Always verify that every mutating endpoint (`POST`, `PUT`, `DELETE`, `PATCH`) on the server applies the `requireAuth` middleware and that corresponding service calls pass the `Authorization: Bearer <token>` header.
