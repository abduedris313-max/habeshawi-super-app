## 2026-03-30 - Unprotected Central Repository Mutation Endpoints
**Vulnerability:** The central repository endpoints (`POST /api/repository/apps`, `PUT /api/repository/apps/:id`, `DELETE /api/repository/apps/:id`) were missing authentication middleware, allowing any unauthenticated client to upload, alter, or remove mini app manifests.
**Learning:** While user endpoints (`/api/users`) enforced `requireAuth`, the repository catalog CRUD endpoints in `server.ts` were left without middleware during initial console development.
**Prevention:** Always apply `requireAuth` middleware to state-mutating Express API routes (POST, PUT, DELETE) handling central app store assets or persistent memory objects.
