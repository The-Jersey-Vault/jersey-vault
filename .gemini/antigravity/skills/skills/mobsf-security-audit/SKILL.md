---
name: mobsf-security-audit
description: Mobile application security assessment, static and dynamic analysis (SAST/DAST), API security, hardcoded secrets detection, and transport layer security verification based on Mobile Security Framework (MobSF).
---

# MobSF Security Framework & Mobile Audit Skill

This skill provides comprehensive defensive guidance and analysis patterns derived from the **Mobile Security Framework (MobSF)** project (`https://github.com/MobSF/Mobile-Security-Framework-MobSF.git`). Use it when auditing mobile APIs, native wrappers (React Native/Capacitor/Cordova), mobile client communications, and web APIs serving mobile endpoints.

---

## 1. Core Threat Domains in Mobile & Web Client Security

1. **Path Safety & Directory Traversal**:
   - Verify every file handling routine checks against path traversal (`..`, absolute paths, null-byte injections, URL-encoded path separators).
   - Use strict realpath containment checks after path resolution.
2. **Input Validation & Command Injection Prevention**:
   - Prevent shell injection in background jobs and conversion utilities: reject `;`, `&&`, `|`, `$(...)`, backticks, and newlines.
   - Enforce strictly typed schemas for parameters passed to native and system processes.
3. **Sensitive Data Exposure & Secret Storage**:
   - Scan for hardcoded keys, API credentials, private tokens, and development secrets in client builds.
   - Enforce server-side security rather than trusting client-side claims or hidden constants.
4. **Transport Layer Security & Network Pinning**:
   - Enforce HTTPS across all network communications.
   - Validate server TLS certificates and guard against Server-Side Request Forgery (SSRF) when servers make outbound requests.
5. **Output Sanitization & CSP**:
   - Sanitize all SVG, HTML, and user-generated uploads to prevent Cross-Site Scripting (XSS).
   - Enforce restrictive Content-Security-Policy (CSP) headers.

---

## 2. Step-by-Step Security Assessment Protocol

When auditing a codebase using MobSF principles:
1. **Source & Manifest Review**:
   - Inspect client configuration, environment variables, and public assets for exposed credentials.
2. **API Endpoint Verification**:
   - Verify all endpoints exposed to mobile and web clients have authentication gates (`Bearer` tokens) and role checks.
3. **Uploads & File Processing**:
   - Validate file uploads using strict MIME detection and file extension whitelists.
   - Prevent execution of uploaded files by storing them off-server (e.g. Cloudflare R2 / S3) or setting non-executable permissions.
4. **Error Handling & Information Disclosure**:
   - Ensure exceptions and 500 status responses never leak server traces, environment variables, or database schemas in production.
