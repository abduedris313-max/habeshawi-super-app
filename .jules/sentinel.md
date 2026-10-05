## 2026-08-28 - Repository Catalog Mutation Routes Authentication Gap
**Vulnerability:** Mutation routes (`POST`, `PUT`, `DELETE` `/api/repository/apps`) for the central repository catalog were completely unauthenticated, permitting unauthorized callers to add, alter, or remove mini app entries in memory catalog.
**Learning:** In-memory runtime routes exposed for multi-app registries must always apply authorization middleware even if primary persistent data resides in Firebase/Firestore.
**Prevention:** Protect all backend mutation REST endpoints with `requireAuth` middleware and pass Bearer ID tokens from client request callers.
