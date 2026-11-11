# Sentinel Security Journal

## 2026-11-11 - Defensive HTTP Security Headers and Cross-Origin Popup Compatibility
**Vulnerability:** The Express server previously lacked standard defense-in-depth HTTP security headers (exposing `X-Powered-By: Express`, missing `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Cross-Origin-Opener-Policy`).
**Learning:** In a Super App architecture embedding mini-apps in iframes and utilizing Firebase / Google OAuth popups:
1. `X-Frame-Options` must be `SAMEORIGIN` instead of `DENY` so developer templates and internal mini-apps can render inside host iframes.
2. `Cross-Origin-Opener-Policy` must be `same-origin-allow-popups` rather than strict `same-origin` to ensure OAuth login popup flows function properly.
**Prevention:** Maintain centralized Express security middleware applying defensive response headers with exceptions tailored to embedded iframe and OAuth popup requirements.
