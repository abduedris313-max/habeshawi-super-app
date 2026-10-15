# Sentinel Security Journal

## 2025-05-18 - Missing Authentication on Central Repository Management Endpoints
**Vulnerability:** Unauthenticated `POST`, `PUT`, and `DELETE` endpoints for `/api/repository/apps` allowed any anonymous client to publish, update, or remove mini app packages in the central repository catalog.
**Learning:** Development console APIs and central repository sync endpoints were created without applying authentication middleware, assuming local-only or internal consumption.
**Prevention:** Always apply `requireAuth` middleware to any HTTP route that creates, updates, or deletes catalog state or database resources.
