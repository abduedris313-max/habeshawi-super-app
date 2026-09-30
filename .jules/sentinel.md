# Sentinel Security Journal

## 2026-08-20 - Unauthenticated Central Repository App Mutations
**Vulnerability:** Central repository app catalog mutation endpoints (`POST /api/repository/apps`, `PUT /api/repository/apps/:id`, `DELETE /api/repository/apps/:id`) were unprotected by authentication middleware in `server.ts`.
**Learning:** In-memory or database catalog routes added for app store management can easily be overlooked during auth reviews if only `app.get()` routes were tested.
**Prevention:** Ensure all write operations (POST, PUT, PATCH, DELETE) on app catalog and system resources strictly enforce `requireAuth` middleware and pass Firebase ID token in authorization headers.
