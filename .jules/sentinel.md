## 2025-05-18 - Require Authentication on Gemini AI Proxy Endpoints
**Vulnerability:** Unauthenticated access to `/api/harmony/ai` and `/api/gemini` allowed public calls to Google Gemini AI models.
**Learning:** AI endpoints in `server.ts` were missing authentication middleware, exposing backend API key usage and risking resource exhaustion / quota limits.
**Prevention:** Always secure external service proxies (such as LLM / AI proxy routes) with `requireAuth` middleware unless intentionally public.
