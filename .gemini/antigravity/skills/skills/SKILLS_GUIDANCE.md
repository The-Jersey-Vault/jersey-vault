# Skills Execution & Dispatch Guidance

This file serves as the definitive reference and entry point for Antigravity AI agents operating on this project. Whenever the user requests any task, follow this protocol to trace, combine, and execute the exact right skills from this directory.

---

## 1. Core Workflow Protocol

Whenever a prompt or user request is received:
1. **Analyze Intent & Requirements**: Determine which software domains, phases, and quality standards the request touches (e.g., architecture, frontend React, security, testing, debugging, Git operations, TypeScript types, LLM agent workflows, penetration testing, WAF filtering).
2. **Consult Skills Summary**:
   - Check `skills_summary.xml` in `.gemini/antigravity/skills/skills_summary.xml` to match keywords, patterns, and relevant skills across the 380+ indexed skills without loading unnecessary markdown files.
3. **Multi-Skill Orchestration (Co-Working Skills)**:
   - Complex tasks often require **multiple skills working together** in a single prompt. Trace the complementary skills (e.g., combining `karpathy-guidelines` + `frontend-design` + `react-best-practices`, or `safeline-waf-defense` + `zaproxy-web-security-scan` + `systematic-debugging`).
4. **Read Specific `SKILL.md` Files**:
   - Navigate directly to `.gemini/antigravity/skills/skills/<skill-name>/SKILL.md` for each selected skill.
5. **Apply Strict Execution Standards**:
   - Execute the code changes, verification, and tests strictly conforming to the referenced skills' instructions before completing the task.

---

## 2. Multi-Skill Task Routing Matrix

Use this matrix to quickly select cooperating skills based on the task type:

| Task Domain | Primary Skill | Supporting / Co-Working Skills |
|---|---|---|
| **Web Security Audit & Pentesting** | `zaproxy-web-security-scan` | `safeline-waf-defense`, `security-vulnerability-threat-modeling`, `verification-before-completion` |
| **WAF, Rate Limiting & Perimeter Defense** | `safeline-waf-defense` | `zaproxy-web-security-scan`, `server-security`, `idempotency-patterns` |
| **Mobile & Native API Security** | `mobsf-security-audit` | `api-design-principles`, `zaproxy-web-security-scan`, `auth-implementation-patterns` |
| **Bug Fixing & Incident Resolution** | `systematic-debugging` / `diagnosing-bugs` | `test-driven-development` (`tdd`), `verification-before-completion`, `root-cause-analysis`, `karpathy-guidelines` |
| **Frontend Design & UI Polish** | `frontend-design` | `react-best-practices`, `canvas-design`, `web-artifacts-builder`, `theme-factory` |
| **New Feature Implementation & Spec** | `to-spec` / `implement-spec` | `writing-plans`, `executing-plans`, `react-best-practices`, `backend-architect`, `domain-modeling` |
| **Code Review & Quality Audits** | `code-review` / `ponytail-review` | `ponytail-audit`, `ponytail-debt`, `receiving-code-review`, `karpathy-guidelines`, `grill-with-docs` |
| **TypeScript Architecture & Types** | `ask-matt` / `codebase-design` | `improve-codebase-architecture`, `domain-modeling`, `implement` |
| **Deep Reasoning & Guidelines** | `karpathy-guidelines` | `systematic-debugging`, `implement-spec`, `codebase-design`, `verification-before-completion` |
| **MCP Server & Tool Integration** | `mcp-builder` | `claude-api`, `api-design-principles`, `backend-architect` |
| **Webapp End-to-End Testing** | `webapp-testing` | `tdd`, `test-driven-development`, `verification-before-completion` |
| **Security & Secrets Hardening** | `security-vulnerability-threat-modeling` | `auth-implementation-patterns`, `penetration-testing-methodology`, `server-security`, `zaproxy-web-security-scan` |
| **Database & Concurrency** | `database-design` | `postgresql-expert`, `concurrency-control`, `caching-strategies` |
| **E-Commerce / Payment Gateway** | `payment-integration-patterns` | `idempotency-patterns`, `api-design-principles`, `webhook-handling`, `safeline-waf-defense` |
| **Document & Asset Generation** | `docx` / `pdf` / `xlsx` / `pptx` | `slack-gif-creator`, `canvas-design`, `doc-coauthoring` |
| **Branch & Git Release Management** | `finishing-a-development-branch` / `pr` | `using-git-worktrees`, `git-branching-strategy`, `semantic-versioning`, `git-guardrails-claude-code` |
| **Refactoring & Technical Debt** | `ponytail-debt` | `improve-codebase-architecture`, `refactoring-patterns`, `clean-architecture-principles`, `tdd` |

---

## 3. Detailed Guide to Key Imported Skill Suites

### A. Dedicated Security Testing & Defensive Suites (MobSF, SafeLine, ZAP)
* **`zaproxy-web-security-scan`**: Dynamic security auditing, vulnerability scanning, and OWASP Top 10 negative regression testing based on OWASP ZAP.
* **`safeline-waf-defense`**: Reverse proxy traffic inspection, SQLi/XSS/SSRF perimeter blocking, multi-tier rate limiting, and suspicious request detection based on Chaitin SafeLine WAF.
* **`mobsf-security-audit`**: Mobile & client API hardening, path traversal containment, static secret checks, and secure IPC boundaries based on Mobile Security Framework (MobSF).

### B. Andrej Karpathy Engineering Guidelines (`karpathy-guidelines`)
* **`karpathy-guidelines`**: High-signal engineering philosophy and guidelines distilled from Andrej Karpathy's practices. Emphasizes first-principles thinking, simplicity, minimal abstraction, clean mental models, direct reproducibility, and disciplined verification.

### C. Anthropic Core Skills Suite (`anthropics/skills`)
* **`frontend-design`**: Distinctive, polished, production-grade frontend UI/UX design avoiding generic template aesthetics.
* **`mcp-builder`**: End-to-end authoring and structuring of Model Context Protocol (MCP) servers and tools.
* **`webapp-testing`**: Web application test automation, browser testing, and assertion suites.
* **`claude-api`**: High-efficiency prompt engineering, tool use patterns, and API integration.
* **`web-artifacts-builder`**: Self-contained interactive React/Tailwind/HTML5 application and component prototyping.
* **`canvas-design` & `theme-factory`**: Aesthetic visual hierarchy, coherent palettes, and themed component libraries.
* **`docx`, `pdf`, `xlsx`, `pptx`**: Programmatic document extraction, generation, formatting, and analysis.
* **`skill-creator`**: Authoring well-structured, reproducible agent skills.

### D. Matt Pocock Engineering & Productivity Suite (`mattpocock/skills`)
* **`codebase-design` & `domain-modeling`**: Elegant architectural structuring, entity modeling, and scalable domain design.
* **`diagnosing-bugs` & `tdd`**: Methodical bug diagnosis paired with rigorous Test-Driven Development loops.
* **`to-spec` & `implement-spec`**: Converting fuzzy requirements into bulletproof technical specifications and implementing them strictly to spec.
* **`improve-codebase-architecture`**: Incremental architectural refactoring without breaking production or tests.
* **`code-review` & `grill-with-docs`**: Deep code reviews, documentation-grounded cross-examinations, and PR readiness.
* **`ask-matt`**: Expert-level TypeScript patterns, generics, type-level programming, and API patterns.
* **`wayfinder`, `wizard`, `to-tickets`**: Task breakdown, engineering navigation, and developer workflow acceleration.
* **`grill-me`, `to-questionnaire`, `teaching`, `writing-for-agents`**: High-clarity communication and agent-instruction design.

### E. Superpowers & Ponytail Core Suites
* **`writing-plans` & `executing-plans`**: Transform requirements into detailed, bite-sized, testable implementation steps with verification gates.
* **`systematic-debugging`**: Investigate anomalies methodically—reproduce, isolate root causes, hypothesize, and fix with minimal blast radius.
* **`test-driven-development`**: Write failing unit/integration tests before writing production code, then implement and verify.
* **`ponytail-audit` & `ponytail-review`**: Automated codebase audit covering security, maintainability, architectural integrity, and design drift.
* **`ponytail-debt` & `ponytail-gain`**: Identify, catalog, and prioritize technical debt and high-leverage optimization gains.

---

## 4. Multi-Skill Execution Rules for Agents

1. **Check This Guidance File First**: Before starting any non-trivial task, identify the 2-3 cooperating skills that govern the task from the Routing Matrix.
2. **Never Guess - Read the Spec**: Only open and read the exact `SKILL.md` files required for the task.
3. **Trace Multi-Skill Interactions**:
   - When building UI: combine `frontend-design` + `react-best-practices`.
   - When fixing bugs: combine `diagnosing-bugs` / `systematic-debugging` + `tdd` + `verification-before-completion`.
   - When hardening security: combine `safeline-waf-defense` + `zaproxy-web-security-scan` + `verification-before-completion`.
   - When refactoring: combine `improve-codebase-architecture` + `karpathy-guidelines` + `verification-before-completion`.
4. **Verify Every Change**: Always pair modifications with test executions (`npm test --prefix server`, `npm test --prefix client`).
5. **Document Applied Skills**: When communicating with the user or committing code, explicitly cite which skills were orchestrated to accomplish the task.
