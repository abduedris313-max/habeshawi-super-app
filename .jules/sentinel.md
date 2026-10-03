## 2026-08-20 - Unprotected Central Repository Catalog Endpoints
**Vulnerability:** The central repository app management endpoints (`POST`, `PUT`, `DELETE` at `/api/repository/apps`) lacked authentication middleware, allowing any unauthenticated network client to publish, mutate, or delete mini-app entries in memory.
**Learning:** In multi-service/dashboard backends with mixed public and restricted routes, ensure all administrative or catalog mutation endpoints consistently enforce token verification middleware like `requireAuth`.
**Prevention:** Always verify that every state-changing route (POST/PUT/PATCH/DELETE) attached to `app` includes authentication and role authorization checks.
