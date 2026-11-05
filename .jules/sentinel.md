# Sentinel Journal

## 2026-11-05 - Frame embedding constraints for mini-apps
**Vulnerability:** Missing security headers on Express server, exposing the application to MIME-type sniffing, lack of clickjacking protection, and information leakage via `X-Powered-By`.
**Learning:** In Habeshawi Super App, mini-apps and preview templates are embedded in iframes within the host application. Setting `X-Frame-Options: DENY` would break developer console preview containers and embedded mini-apps; `X-Frame-Options: SAMEORIGIN` must be used instead.
**Prevention:** Ensure security header configurations explicitly allow same-origin iframe embedding (`SAMEORIGIN`) while protecting against external clickjacking.
