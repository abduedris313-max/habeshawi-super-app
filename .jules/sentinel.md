# Sentinel's Journal - Security Learnings

## 2026-11-07 - HTTP Security Headers & Cross-Origin Opener / Frame Policies
**Vulnerability:** The Express backend lacked HTTP security headers and leaked technology stack information via the `X-Powered-By` header. In addition, missing MIME-sniffing protection (`X-Content-Type-Options: nosniff`) and lack of clickjacking protection created security exposure for hosted views.
**Learning:** In Habeshawi Super App / Harmony OS, mini-app previews and sandbox templates are embedded via iframes (`/templates/*`), meaning setting `X-Frame-Options: DENY` breaks internal iframe runners; `X-Frame-Options: SAMEORIGIN` is required. Furthermore, Firebase Auth uses Google popup authentication flows (`signInWithPopup`), which require `Cross-Origin-Opener-Policy: same-origin-allow-popups` rather than strict `same-origin` to avoid breaking OAuth popup communication.
**Prevention:** Always pair strict clickjacking protection with codebase iframe requirements (`SAMEORIGIN`), configure COOP to allow OAuth popups, and enforce defensive HTTP headers at the top-level Express middleware layer.
