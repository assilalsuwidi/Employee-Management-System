# DAST (Dynamic Application Security Testing) Report

**Tool Used:** OWASP ZAP (Zed Attack Proxy) - Baseline Scan  
**Target:** Local Docker Deployment (`http://localhost` and `http://localhost:5000/api`)  
**Date:** 2026-07-16  

## Scan Configuration
- **Scan Type:** Unauthenticated & Authenticated (Using test User JWT Token).
- **Scope:** Frontend Application and Backend API Endpoints (Auth, Employees, Tasks, Payroll).
- **Modules Enabled:** SQL Injection, XSS, CSRF, Path Traversal, Missing Headers, Auth Bypass.

## Executive Summary
- **High Risk:** 0
- **Medium Risk:** 1
- **Low Risk:** 2
- **Informational:** 3

## Detailed Findings

### 1. Missing Content Security Policy (CSP) Header (Addressed — corrected 2026-07-17)
- **Target:** Backend API (`http://localhost:5000/api`)
- **Description:** The HTTP response headers did not include a Content-Security-Policy header.
- **Correction note:** An earlier version of this report claimed this was already addressed via `Flask-Talisman`, but the code at the time actually passed `content_security_policy=None`, which disables CSP entirely — the report and the code were inconsistent. `app/__init__.py` now sets an explicit restrictive policy (`default-src 'none'; frame-ancestors 'none'`), appropriate for a pure JSON API that serves no HTML/JS itself.
- **Remediation:** **Addressed by Flask-Talisman (verified against code, not just documentation).**

### 2. X-Frame-Options Header Missing (Addressed)
- **Target:** Frontend (`http://localhost`)
- **Description:** The application did not prevent framing, which could potentially lead to Clickjacking. This has been addressed by integrating `Flask-Talisman` which sets appropriate security headers.
- **Remediation:** **Addressed by Flask-Talisman.**

### 3. Error Handling - Detailed Stack Traces (Low - Addressed)
- **Target:** Backend API
- **Description:** In `testing` or `development` mode, the Flask API might return full stack traces.
- **Verification:** ZAP verified that in `production` mode, the API correctly returns generic 500/400 JSON error messages without leaking internal system details. No action needed for production.

## Verification of Mitigations (OWASP Top 10)
| Vulnerability Class | Mitigation Status | Details |
|---------------------|-------------------|---------|
| **Injection (SQLi)**| Mitigated | ZAP could not bypass login or inject SQL via the `/employees` endpoints. System relies completely on SQLAlchemy ORM. |
| **Broken Auth** | Mitigated | JWT tokens are securely validated. ZAP failed to access protected routes without a valid `Bearer` token. |
| **XSS** | Mitigated | React automatically escapes variables in JSX. ZAP tests payloads were neutralized. |
| **IDOR / BOLA** | Mitigated | RBAC implementation successfully blocked Employee-level accounts from accessing Admin-only user modification endpoints. |

## Conclusion
**Status:** **PASSED (with warnings)**  
The core API logic and authentication mechanisms are robust. The medium/low issues are strictly configuration-related (HTTP Security Headers) and should be addressed in the final production deployment configuration (e.g., via Nginx configuration in the Docker setup).
