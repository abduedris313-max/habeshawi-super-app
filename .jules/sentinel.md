# Sentinel Security Journal

## 2026-08-20 - Security Headers with Iframe & OAuth Compatibility
**Vulnerability:** Missing standard HTTP security headers allowed potential MIME sniffing, cross-origin referrer leakage, server technology fingerprinting (`X-Powered-By`), and clickjacking.
**Learning:** In the Habeshawi Super App ecosystem, mini-apps and developer sandbox preview templates are rendered via embedded iframes within the main application. Setting `X-Frame-Options: DENY` breaks mini-app previews, requiring `SAMEORIGIN`. Similarly, Firebase Authentication and Google Sign-In rely on cross-origin popup flows, which fail if `Cross-Origin-Opener-Policy` is set to `same-origin`; it must be set to `same-origin-allow-popups`.
**Prevention:** Always evaluate iframe embedding needs and OAuth popup mechanisms before configuring framing and opener policies; enforce `X-Frame-Options: SAMEORIGIN` and `Cross-Origin-Opener-Policy: same-origin-allow-popups` as defense-in-depth across the app.
