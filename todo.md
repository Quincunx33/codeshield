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
