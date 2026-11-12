# Sentinel Journal

Critical security learnings and codebase-specific security findings.

## 2026-08-20 - Defense-in-depth HTTP Headers with Iframe and OAuth Constraints
**Vulnerability:** Express server was missing security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, COOP) and exposed the `X-Powered-By: Express` header, leaving client browsers open to MIME-sniffing, clickjacking, and server fingerprinting.
**Learning:** In this application, mini-apps and developer sandbox templates are embedded in iframes within the host shell. Setting `X-Frame-Options: DENY` would break mini-app rendering; `SAMEORIGIN` is required. Additionally, Firebase/Google OAuth uses popup windows, which would be blocked by `Cross-Origin-Opener-Policy: same-origin`; `same-origin-allow-popups` must be used instead.
**Prevention:** Always account for internal iframe architecture and third-party popup-based OAuth flows when configuring HTTP security headers.
