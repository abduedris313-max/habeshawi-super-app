## 2026-03-30 - Central Repository Management API Endpoints Authentication Protection
**Vulnerability:** Express REST endpoints for central repository app package mutation (`POST`, `PUT`, `DELETE` at `/api/repository/apps`) were exposed publicly without authentication middleware. Any unauthenticated caller could publish, edit, or delete app packages.
**Learning:** Development/in-memory catalog routes were initially created for admin prototyping without authorization hooks.
**Prevention:** Enforce `requireAuth` middleware on all administrative backend routes and pass Firebase ID tokens from client services.
