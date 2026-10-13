# Sentinel Security Journal

## 2026-08-20 - Missing Authentication on Central Repository Catalog Endpoints
**Vulnerability:** Central repository mutation endpoints (`POST /api/repository/apps`, `PUT /api/repository/apps/:id`, `DELETE /api/repository/apps/:id`) were exposed without authentication middleware.
**Learning:** Shared repository endpoints accessible to both SuperApp and App Store Console must enforce `requireAuth` middleware to prevent unauthenticated clients from publishing, editing, or deleting packages in server memory.
**Prevention:** Always verify that all backend write/mutation routes (POST, PUT, PATCH, DELETE) have appropriate `requireAuth` authentication middleware applied.
