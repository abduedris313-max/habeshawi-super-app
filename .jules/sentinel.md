# Sentinel Security Journal

## 2026-11-02 - HTTP Security Headers and IFrame Compatibility
**Vulnerability:** The Express backend lacked defense-in-depth HTTP security headers (missing `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`) and leaked Express fingerprinting via the default `X-Powered-By` header.
**Learning:** In Habeshawi Super App, mini-apps (such as preview templates or embedded utilities) can be rendered within iframes inside the host dashboard. Using `X-Frame-Options: DENY` would break internal iframe embedding of local mini-apps. Therefore, `X-Frame-Options: SAMEORIGIN` is the appropriate defense, preventing clickjacking and external third-party embedding while supporting native super app iframe views.
**Prevention:** Always pair `app.disable('x-powered-by')` with explicit security headers middleware in Express applications, taking into account internal multi-view or iframe architectures.
