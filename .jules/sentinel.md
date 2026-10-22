# Sentinel Security Journal

## 2026-03-30 - Authentication Missing on App Central Repository API Routes
**Vulnerability:** Unauthenticated clients could call `POST`, `PUT`, and `DELETE` on `/api/repository/apps` to manipulate or delete packages from the central app catalog.
**Learning:** Catalog management endpoints were originally implemented as in-memory helpers for developer preview without applying the existing `requireAuth` Express middleware.
**Prevention:** Always apply authentication middleware (`requireAuth`) on Express REST routes that mutate system or catalog state, and pass Bearer tokens from client SDK services.
