## 2026-08-20 - Central Repository Catalog Unauthenticated Endpoint Protection
**Vulnerability:** Central repository app catalog mutation endpoints (`POST`, `PUT`, `DELETE` `/api/repository/apps`) were unauthenticated, allowing unauthenticated remote callers to create, modify, or delete app packages in the catalog.
**Learning:** Shared backend REST endpoints that perform write operations for administrative tools or central catalogs must enforce `requireAuth` middleware matching Cloud SQL user endpoints.
**Prevention:** Always verify that state-mutating Express routes (POST, PUT, DELETE) use authentication middleware (`requireAuth`) and that client services pass Firebase ID tokens in Authorization headers.
