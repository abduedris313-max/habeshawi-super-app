## 2026-08-20 - Central Repository API Route Authentication Requirement
**Vulnerability:** Central Repository package mutation endpoints (`POST`, `PUT`, `DELETE` `/api/repository/apps`) were publicly accessible without authentication, allowing unauthenticated package tampering.
**Learning:** `requireAuth` middleware validates Firebase Bearer ID tokens on express routes (`req.headers.authorization`). Client-side admin services should pass `Authorization: Bearer ${token}` using `auth.currentUser?.getIdToken()`.
**Prevention:** Always attach `requireAuth` middleware to all mutation/write REST endpoints handling system catalog or administrative data.
