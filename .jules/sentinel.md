## 2025-05-18 - Enforce Authentication on Central App Catalog Mutation Endpoints
**Vulnerability:** Central repository app catalog endpoints (`POST`, `PUT`, `DELETE` `/api/repository/apps`) were unauthenticated, allowing guests to insert, modify, or delete mini-app catalog packages.
**Learning:** Public endpoints for fetching app manifests were implemented alongside modification endpoints without applying middleware protection (`requireAuth`).
**Prevention:** Always verify that state-mutating Express routes (`POST`, `PUT`, `PATCH`, `DELETE`) inherit proper authentication and authorization middleware.
