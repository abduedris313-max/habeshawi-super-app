## 2026-08-20 - Unprotected Central Repository Mutation Endpoints
**Vulnerability:** Mutating REST API endpoints (`POST`, `PUT`, `DELETE` `/api/repository/apps`) were lacking authentication middleware, allowing unauthenticated users to alter or delete mini-app entries in the repository catalog.
**Learning:** Endpoints were initially created as memory-backed prototypes without applying the `requireAuth` middleware used elsewhere in `server.ts`.
**Prevention:** Always attach `requireAuth` middleware to all state-modifying backend API routes and ensure client services pass the Firebase Bearer token in request headers.
