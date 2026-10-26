## 2025-05-18 - Authentication requirement on Central Repository REST APIs
**Vulnerability:** Unauthenticated POST, PUT, DELETE REST endpoints `/api/repository/apps` allowed any client to mutate or clear the in-memory mini-app catalog.
**Learning:** While Firestore rules required `isAuthenticated()` for `central_apps_catalog`, Express endpoints in `server.ts` were missing `requireAuth` middleware.
**Prevention:** Always enforce `requireAuth` on Express mutation endpoints matching database authorization rules, and ensure client services pass `Authorization: Bearer <token>` using `auth.currentUser?.getIdToken()`.
