---
name: safeline-waf-defense
description: Web Application Firewall (WAF) defensive architecture, reverse proxy traffic filtering, SQL injection, XSS, SSRF, path traversal mitigation, and automated bot challenge defenses based on Chaitin SafeLine WAF.
---

# SafeLine WAF Defensive Architecture Skill

This skill provides production-grade Web Application Firewall (WAF) defensive rules, reverse proxy traffic inspection patterns, and perimeter filtering derived from **Chaitin SafeLine** (`https://github.com/chaitin/SafeLine.git`).

---

## 1. WAF Defense Philosophy & Capabilities

SafeLine operates as an intelligent reverse-proxy shield between external clients and web applications, actively mitigating:
- **Injection Attacks**: SQL Injection (SQLi), Command Injection, Cross-Site Scripting (XSS), XML External Entity (XXE), and LDAP Injection.
- **Traversal & Smuggling**: Path Traversal (`../`), HTTP Request Smuggling, and CRLF Header Injection.
- **Abuse & Denial of Service**: Automated brute-force attacks, high-frequency HTTP request floods, credential stuffing, and bot scrapers.
- **Server-Side Request Forgery (SSRF)**: Blocking requests targeting cloud metadata endpoints (e.g., `169.254.169.254`) and internal subnets.

---

## 2. Web Application Hardening Guidelines

When applying SafeLine WAF defensive patterns to an application:

1. **Traffic Inspection & Pattern Matching**:
   - Detect and reject anomalous URI paths containing directory traversal or script tags before routing to business logic.
   - Example pattern: `/(\.\.[\/\\]|wp-login|eval\(|<script|select.*from|<.*>)/i`.
2. **Perimeter Rate Limiting & Abuse Defense**:
   - Apply multi-tiered rate limiting:
     - General Storefront APIs: standard IP window limiting (e.g., 100-150 requests/15 mins).
     - Sensitive Authentication Endpoints: strict burst limiting (e.g., 15-20 requests/15 mins).
     - Financial / Order Creation Endpoints: anti-replay throttling (e.g., 20-30 requests/15 mins).
3. **HTTP Strict Security Headers**:
   - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
4. **Origin & CORS Confinement**:
   - Restrict CORS headers to explicitly authorized production domains and localhost development ports.
   - Refuse wildcard (`*`) access when credentials or authentication cookies are accepted.
