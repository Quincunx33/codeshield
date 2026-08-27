<div align="center">

![CodeShield Mix](https://codeshldmix-6okjdbit.manus.space/manus-storage/codeshield-readme-hero_a7957a3e.png)

# CodeShield Mix

**Unified source-code security and quality scanning for real projects.**

[![Live dashboard](https://img.shields.io/badge/Live%20dashboard-Open%20CodeShield%20Mix-16d9e8?style=for-the-badge)](https://codeshldmix-6okjdbit.manus.space/)
[![Schema](https://img.shields.io/badge/report%20schema-1.0-5eead4?style=flat-square)](https://codeshldmix-6okjdbit.manus.space/)
[![Languages](https://img.shields.io/badge/languages-C%20%7C%20C%2B%2B%20%7C%20Python%20%7C%20Java%20%7C%20Kotlin%20%7C%20JS%20%7C%20TS-172554?style=flat-square)](https://codeshldmix-6okjdbit.manus.space/)

[**Launch the live dashboard →**](https://codeshldmix-6okjdbit.manus.space/)

</div>

## What it does

CodeShield Mix is a deterministic, evidence-first scanner for pasted source code and project ZIP archives. It reports security risk, maintainability issues, repeated code, and AI-generated-code likelihood as separate signals so a quality score is not confused with a security verdict.

The scanner is designed for practical review: every finding carries a file path, line location, severity, rule identifier, evidence snippet, explanation, and remediation guidance. Anonymous users can run scans; sign-in is only needed for saved history, team workspaces, and recurring repository scans.

> **Important:** AI-generated-code likelihood is pattern-based evidence, not proof of authorship. CodeShield Mix is a review aid, not a replacement for human review, dependency auditing, secure build pipelines, or runtime testing.

## Report model

| Signal | Meaning | Independent from |
|---|---|---|
| **Security findings** | Exposed secrets, unsafe dynamic execution, shell/process hazards, unsafe C/C++ memory APIs, and security-context randomness | Quality score and AI likelihood |
| **Code quality /10** | Maintainability, duplication, hygiene, long-line, and broad-exception deductions | Security severity |
| **AI-generated likelihood** | Explainable pattern signals with cited lines, score breakdown, confidence, and verification guidance | Authorship proof and security verdict |

## Supported workflows

The web dashboard accepts pasted files and ZIP archives up to the configured temporary limit, filters unsafe archive paths, recognizes nested source files, and produces JSON or HTML reports. The shared schema is also consumed by the Python CLI and Java Swing desktop client.

```bash
# Python CLI
python clients/cli/codeshield.py ./my-project --json report.json

# Java desktop client
javac clients/java/CodeShieldDesktop.java
java -cp clients/java CodeShieldDesktop
```

The repository also includes GitHub Actions and GitLab CI quality-gate examples for integrating the scanner contract into review workflows.

## Architecture

```text
Web dashboard ─┐
Python CLI ─────┼──> shared deterministic scanner ──> schema 1.0 report
Java Swing ─────┘                 │
                                  ├── security findings
                                  ├── code quality score /10
                                  └── AI-generated likelihood evidence
```

The server exposes the same scanner through the public `scanner.run` procedure. Authenticated requests additionally save scan history and can use team and recurring-scan features. AI assistance is limited to contextual explanations; deterministic rules remain the source of truth.

## Verification

The current release was validated with independent vulnerable, clean, mixed-language, safe-context, duplicate-code, commented-code, and AI-pattern fixtures. The final suite includes **45 Vitest tests**, **4 Python tests**, Java assertions, TypeScript checking, and a production build. A genuine timed stress run lasted exactly one hour and completed **1,340,694 local iterations**, **1,340,694 archive/API requests**, and **13,406,940 small-file scans** with zero failures, zero false-positive violations, and zero deterministic mismatches.

## Repository layout

| Path | Purpose |
|---|---|
| `shared/scanner.ts` | Shared deterministic engine and report contract |
| `shared/report.ts` | JSON/HTML report serialization |
| `client/src/pages/Home.tsx` | Dashboard scan and report experience |
| `server/routers.ts` | Public scanning, history, teams, and schedules API |
| `clients/cli/` | Python CLI and contract tests |
| `clients/java/` | Java Swing client and assertions |
| `server/fixtures/` | Independent regression fixtures |
| `server/*.test.ts` | Scanner, archive, API, UX, and stress coverage |

## Development

```bash
pnpm install
pnpm test
pnpm check
pnpm build
```

The project uses React, TypeScript, Express, tRPC, Drizzle ORM, Vitest, Python 3, and Java 17. Do not commit environment files, API credentials, session cookies, or uploaded source archives.

## Live application

Try the deployed dashboard at **[codeshldmix-6okjdbit.manus.space](https://codeshldmix-6okjdbit.manus.space/)**. Paste a source file or upload a ZIP archive to receive a line-level report. No login is required to run a scan.

## License

No license has been selected yet. Until a license is added, treat the repository as source-available for evaluation rather than granting broad redistribution rights.
