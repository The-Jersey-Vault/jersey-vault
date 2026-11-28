---
name: zaproxy-web-security-scan
description: Dynamic application security testing (DAST), automated vulnerability scanning, OWASP Top 10 auditing, active/passive HTTP analysis, and security verification based on OWASP ZAP (Zed Attack Proxy).
---

# ZAP Web Security Testing & Auditing Skill

This skill provides testing patterns, security checklist criteria, and vulnerability remediation workflows inspired by the **Zed Attack Proxy (ZAP / zaproxy)** project (`https://github.com/zaproxy/zaproxy.git`).

---

## 1. Automated & Dynamic Testing Focus Areas

ZAP provides industry-standard penetration testing and automated dynamic scanning against the **OWASP Top 10** vulnerabilities:

1. **Broken Access Control (A01)**:
   - Insecure Direct Object References (IDOR): Verify users cannot access or mutate resources (orders, invoices, profiles) belonging to another user.
   - Privileged Endpoint Bypass: Ensure admin routes reject requests without verified admin claims.
2. **Cryptographic Failures (A02)**:
   - Weak encryption algorithms, cleartext credential storage, unencrypted HTTP traffic.
   - Missing or misconfigured `Strict-Transport-Security` headers.
3. **Injection Flaws (A03)**:
   - SQL Injection, OS Command Injection, Server-Side Template Injection.
   - Ensure all database queries use parameterized interfaces or vetted ORM/query builder abstractions.
4. **Insecure Design & Business Logic Vulnerabilities (A04)**:
   - Client-side price tampering, negative/decimal item quantities, race conditions on coupon redemption.
5. **Security Misconfiguration (A05)**:
   - Default administrative credentials, public stack traces, missing security headers, exposed `.env` or debug endpoints.
6. **Vulnerable and Outdated Components (A06)**:
   - Running dependencies with known CVEs without security patches.
7. **Identification and Authentication Failures (A07)**:
   - Weak password policies, credential stuffing without rate limits, session fixation.
8. **Software and Data Integrity Failures (A08)**:
   - Insecure deserialization, unverified webhook signatures (e.g. payment callbacks), tampered update packages.
9. **Security Logging and Monitoring Failures (A09)**:
   - Inability to log suspicious activity, silent failures on brute-force attempts.
10. **Server-Side Request Forgery (SSRF) (A10)**:
    - User-supplied URLs fetched by the server without IP/hostname allowlist verification.

---

## 2. Dynamic Verification & Audit Playbook

1. **Negative Testing Execution**:
   - Write automated regression tests asserting that invalid inputs, tampered signatures, and unauthorized IDs return `400`, `401`, `403`, or `404` errors rather than succeeding.
2. **Payload Fuzzing**:
   - Test endpoints with boundary values (`-1`, `0`, `9999999`, `null`, `NaN`, string payloads where numbers are expected).
3. **Signature & Webhook Tampering**:
   - Verify that webhook listeners validate HMAC-SHA256 signatures over raw request byte buffers and fail closed if the secret is unconfigured.
