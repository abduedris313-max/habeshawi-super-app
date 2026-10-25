## 2026-03-30 - Authorization Bypass in Admin Account Registration
**Vulnerability:** A logic error in `registerAdminAccount` (`admin/services/adminAuthService.ts`) allowed users requesting the `admin` role to bypass secret key validation due to a redundant `else if (desiredRole === 'admin')` branch.
**Learning:** Fallback branches in authorization and role assignment functions can inadvertently grant elevated permissions if not strictly chained after secret/token validations.
**Prevention:** Ensure role assignment logic falls back to lowest-privilege defaults (e.g. `'developer'`) whenever secret or credential verification fails.
