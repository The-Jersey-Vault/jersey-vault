---
name: aislop
description: Unified code-quality and anti-AI-slop auditor. Checks formatting (Biome), linting (oxlint), code complexity, AI-slop patterns (abstractions, dead patterns, duplicate imports, narrative comments), and security risks (hardcoded secrets, risky patterns, injections).
license: MIT
---

# aislop Skill

Catch the slop AI coding tools leave behind. `aislop` runs formatting, linting, code-quality, AI-pattern, architecture, and security checks behind a single command and returns a score out of 100.

## When to Use This Skill
- Whenever performing code review, static analysis, or hygiene auditing on AI-generated or modified code.
- To detect AI-generated slop: hallucinated imports, over-defensive null assertions, dead catch blocks, narrative comments, and structural code bloat.
- To execute targeted linting and correctness checks across JavaScript/TypeScript and Python codebases.

## Engines & Capabilities
1. **Formatting**: Biome, ruff format
2. **Linting**: oxlint, ruff, clippy
3. **Code Quality**: Cyclomatic complexity, max file/function LOC, deep nesting, duplicate blocks
4. **AI-Slop Detection**:
   - `ai-slop/abstractions`: Pointless single-use wrappers and redundant factory functions
   - `ai-slop/dead-patterns`: Unreachable branches, empty catch blocks, unused defensive checks
   - `ai-slop/duplicate-imports`: Redundant import statements and unneeded fallbacks
   - `ai-slop/narrative-comments`: Explanatory comments that narrate the obvious or state LLM disclaimers
   - `ai-slop/hallucinated-imports`: Imports pointing to non-existent packages or files
5. **Security**: Hardcoded credentials, unescaped HTML injections, SQL interpolations, dangerous eval calls.
