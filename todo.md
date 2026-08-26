# Project TODO

- [x] Define the shared scanner API contract and versioned JSON report schema
- [x] Add deterministic scanning rules for C, C++, Python, and Java
- [x] Add findings with file and line references, severity ranking, categories, and remediation guidance
- [x] Add authenticated scan metadata, findings, timestamps, and history persistence
- [x] Add secure temporary source archive upload and cleanup boundaries (expiry enforced at detail access)
- [x] Add LLM enrichment for explanations and context-aware remediation suggestions
- [x] Add downloadable HTML and JSON reports
- [x] Build the web dashboard for scan launch, finding filters, severity summaries, and history review
- [x] Build the CLI client with machine-readable JSON and terminal summary output
- [x] Build the Java desktop client against the shared scanner API
- [x] Add automated tests for scanner API procedures, persistence/history retrieval, report generation, CLI syntax/behavior, and Java client compilation/contract behavior
- [x] Verify upload/auth/error boundaries, production build, responsive UI, Python CLI syntax, and Java compilation
- [x] Fix demo report findings list to use the visible fallback report when no authenticated scan has run

# Refinement backlog

- [x] Replace language-list marketing copy with outcome-focused product copy throughout the dashboard
- [x] Add GitHub/GitLab repository integration entry point and CI/CD quality-gate configuration (CI gate artifact added; provider repository import remains next step)
- [x] Add a native C++ scanner engine foundation and shared JSON bridge
- [x] Add complete team workspace membership UI, invitations, and role-based access controls
- [x] Add recurring scan management UI and Heartbeat callback workflow using the platform's background scheduling path

# Anonymous scan change

- [x] Allow unauthenticated code and ZIP scans without creating persisted scan history or temporary source records
- [x] Update dashboard, Python CLI, and Java client messaging so login is only required for saved history, teams, and recurring scans
- [x] Add tests for anonymous scan success and authenticated persistence behavior

# ZIP scan bug

- [x] Diagnose why a selected ZIP archive does not produce scan results
- [x] Fix archive encoding, validation, extraction, or result rendering as needed
- [x] Add a regression test for anonymous ZIP scanning with supported source files

# Real-scan-only correction

- [x] Remove demo report fallback and show an empty state before the first real scan
- [x] Correct ZIP archive path handling so top-level and nested supported files are retained with valid references; regression covers both
- [x] Add regression coverage for ZIP entries and real-scan-only initial rendering; visually verified empty initial state
