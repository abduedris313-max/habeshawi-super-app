# Sentinel's Journal - Critical Security Learnings

## 2026-11-05 - Frame Embedding Requirements for Mini-App Sandboxing
**Vulnerability:** Missing `X-Frame-Options` and clickjacking protection on Express responses allowed full framing from arbitrary third-party origins.
**Learning:** Default clickjacking remediation often enforces `X-Frame-Options: DENY`, but this application embeds internal preview templates and mini-apps within iframe viewports on the same origin (`/templates/*`, admin preview panes). Enforcing `DENY` breaks the developer sandbox previews. `SAMEORIGIN` is strictly required. Additionally, `Cross-Origin-Opener-Policy: same-origin-allow-popups` is required to allow Firebase and Google OAuth authentication popups to function without blocking window communication.
**Prevention:** Whenever configuring framing or cross-origin policies for this super-app architecture, preserve `SAMEORIGIN` framing permissions and allow popup openers for authentication workflows.
