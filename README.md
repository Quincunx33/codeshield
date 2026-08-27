<div align="center">

![CodeShield](https://codeshldmix-6okjdbit.manus.space/manus-storage/codeshield-readme-hero_a7957a3e.png)

# CodeShield

**Unified source-code security and quality scanning for real projects.**

[![Live dashboard](https://img.shields.io/badge/Live%20dashboard-Open%20CodeShield-16d9e8?style=for-the-badge)](https://codeshldmix-6okjdbit.manus.space/)
[![Schema](https://img.shields.io/badge/report%20schema-1.0-5eead4?style=flat-square)](https://codeshldmix-6okjdbit.manus.space/)
[![Languages](https://img.shields.io/badge/languages-C%20%7C%20C%2B%2B%20%7C%20Python%20%7C%20Java%20%7C%20Kotlin%20%7C%20JS%20%7C%20TS-172554?style=flat-square)](https://codeshldmix-6okjdbit.manus.space/)

[**Launch the live dashboard →**](https://codeshldmix-6okjdbit.manus.space/)

</div>

## What it does

CodeShield is a deterministic, evidence-first scanner for pasted source code and project ZIP archives. It reports security risk, maintainability issues, repeated code, and AI-generated-code likelihood as separate signals so a quality score is not confused with a security verdict.

The scanner is designed for practical review: every finding carries a file path, line location, severity, rule identifier, evidence snippet, explanation, and remediation guidance. Anonymous users can run scans; sign-in is only needed for saved history, team workspaces, and recurring repository scans.

> **Important:** AI-generated-code likelihood is pattern-based evidence, not proof of authorship. CodeShield is a review aid, not a replacement for human review, dependency auditing, secure build pipelines, or runtime testing.

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

The repository includes a GitLab CI quality gate and a portable local gate command for integrating the scanner contract into review workflows. Generate a JSON report, then run the gate with the default high-severity policy:

```bash
pnpm quality:gate codeshield-report.json

# Override the blocking threshold for a stricter or more permissive policy
CODESHIELD_FAIL_ON=medium pnpm quality:gate codeshield-report.json
```

Supported thresholds are `critical`, `high`, `medium`, `low`, and `info`. The GitLab pipeline uses `CODESHIELD_FAIL_ON=high` by default and can override it through CI variables. In the dashboard, every finding includes language-aware syntax coloring, a focused line number, a copy-line action, and an expandable ±2-line context view. No credentials, session data, uploaded archives, or environment files belong in the repository; the remote repository is kept private.

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

The current release was validated with independent vulnerable, clean, mixed-language, safe-context, duplicate-code, commented-code, AI-pattern, syntax-highlighting, and quality-gate fixtures. The final suite includes **51 Vitest tests**, TypeScript checking, and a production build. A corrected genuine 30-minute run completed **448,953 local iterations**, **448,953 ZIP/API requests**, **448,953 pasted-code requests**, and **4,489,530 file scans** with zero runtime failures, false-positive violations, line-evidence failures, or deterministic mismatches; average API latency was 2 ms and maximum latency was 53 ms.

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

The project uses React, TypeScript, Express, tRPC, Drizzle ORM, Vitest, Python 3, and Java 17. Do not commit environment files, API credentials, session cookies, or uploaded source archives. The repository is private and is audited before publication for token-shaped strings, private keys, generated logs, and source archives.

## Live application

Try the deployed dashboard at **[codeshldmix-6okjdbit.manus.space](https://codeshldmix-6okjdbit.manus.space/)**. Paste a source file or upload a ZIP archive to receive a line-level report. No login is required to run a scan.

## License

No license has been selected yet. Until a license is added, treat the repository as source-available for evaluation rather than granting broad redistribution rights.
