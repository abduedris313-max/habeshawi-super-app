# Sentinel Security Journal

## 2026-03-30 - Central Repository Mutation Endpoints Missing Authentication
**Vulnerability:** Central repository CRUD endpoints (`POST`, `PUT`, `DELETE` at `/api/repository/apps`) were exposed on the Express backend without authentication middleware, allowing any unauthenticated network caller to alter or remove mini-app catalog manifests.
**Learning:** In multi-tenant apps with central repositories, read-only endpoints (`GET /api/repository/apps`) can remain public for catalog browsing, but all state-changing endpoints must enforce `requireAuth` middleware and clients must attach Firebase Bearer tokens.
**Prevention:** Ensure all Express POST/PUT/DELETE routes in `server.ts` are audited against authentication requirements and wrapped with `requireAuth` middleware.
