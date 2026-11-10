# Sentinel Security Journal

## 2026-11-09 - Enforcing Authentication on Central Repository Mutations
**Vulnerability:** Mutation REST endpoints for the Central Repository (`POST`, `PUT`, `DELETE` on `/api/repository/apps`) were missing authentication middleware, allowing any unauthenticated network client to publish, overwrite, or delete catalog packages.
**Learning:** In the Habeshawi Super App architecture, catalog mutation endpoints directly update in-memory catalog state and sync with the admin console. Backend endpoints exposed for administrator tooling must consistently enforce `requireAuth` middleware using Firebase ID token verification, and client admin services must attach the Firebase Bearer token in their request headers.
**Prevention:** Always pair administrative REST mutation routes with `requireAuth` middleware in `server.ts` and ensure client services pass `Bearer ${token}` via `auth.currentUser.getIdToken()`.
