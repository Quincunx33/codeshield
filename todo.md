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

# Project-name validation bug

- [x] Allow ZIP scans with a blank project name by deriving a safe name from the archive filename
- [x] Validate pasted-code scans with a clear project-name message before sending the request
- [x] Add regression coverage for blank project name ZIP scans, including shared derivation helper cases

# Broader archive support

- [x] Support JavaScript and TypeScript source extensions in archive and pasted-code scanning
- [x] Make unsupported archive errors list accepted source extensions and detected archive context, including discovered extensions
- [x] Add regression coverage for JavaScript/TypeScript ZIP projects through scanner.run with a real archive

# AI-generated code detection

- [x] Add transparent AI-likelihood scoring signals to scan reports without claiming authorship certainty
- [x] Show AI-likelihood score, confidence, and evidence reasons in the web findings view
- [x] Include AI-detection fields in JSON/HTML reports and client output
- [x] Add regression tests for high-signal and low-signal code samples
- [x] Add AI-likelihood sections to HTML reports and client-visible summaries in CLI and Java
- [x] Test AI-signal serialization and cross-client output consistency
- [x] Render explicit AI-likelihood file/score/confidence/reason summaries in the Java client
- [x] Add deterministic CLI and Java output-format checks for AI signals

# Evidence-rich report improvement

- [x] Add exact line ranges, matched evidence snippets, score breakdown, and verification guidance to AI signals
- [x] Keep dashboard and HTML reports concise with expandable evidence instead of dumping raw detail
- [x] Add focused tests for evidence fields and compact report rendering
- [x] Add compact disclosure-style evidence details to HTML AI-signal reports
- [x] Assert populated line range, evidence, score breakdown, verification, and remediation fields in scanner tests
- [x] Verify HTML includes the evidence-rich AI signal details

# Uploaded report validation

- [x] Safely inventory the uploaded CipherChat ZIP without executing project code
- [x] Compare report totals and supported-file counts with the archive
- [x] Inspect the reported High and Medium locations in source context
- [x] Classify actionable risks versus scanner noise and explain confidence; assessment saved in docs/cipherchat-report-assessment.md

# False-positive reduction

- [x] Add context-aware exclusions for safe library calls and non-security randomness
- [x] Reduce low-value duplicate and long-line noise from default security findings
- [x] Preserve true-positive detection for secrets, eval, and shell/process execution with explicit C/C++/Python regression coverage
- [x] Add uploaded-CipherChat regression fixtures and compare finding counts before/after with a durable checked fixture
- [x] Add explicit C/C++/Python shell-process true-positive regression tests
- [x] Add a durable fixture-based test for known CipherChat false-positive patterns and reduced severity counts
- [x] Document the language scope of shell/process detection in scanner tests
- [x] Add a checked CipherChat-style fixture bundle with expected safe-pattern findings and severity upper bounds

# Full uploaded-archive precision audit

- [x] Run the complete CipherChat ZIP through the current scanner and profile every remaining finding category
- [x] Inspect representative source contexts for all repeated security and quality patterns
- [x] Refine rules based on the real archive while preserving true-positive detection
- [x] Add durable full-archive-derived regression coverage and document before/after counts; archive-wide test asserts 68 files and 0 critical/high/medium

# Full archive noise refinement

- [x] Exclude common boilerplate, imports, exports, response wrappers, and markup from duplicate-code signals
- [x] Exclude SVG/HTML/template-heavy lines from long-line quality signals
- [x] Re-run the entire CipherChat ZIP and preserve true security findings with durable count assertions
- [x] Add executable full-archive-derived severity upper-bound assertions to the test suite
- [x] Assert safe CipherChat patterns and true-positive secret/eval/shell cases together in one durable regression suite
- [x] Add an optional archive-path regression test that asserts the uploaded CipherChat ZIP summary when supplied in the test environment

# Multi-fixture validation

- [x] Create independent vulnerable, clean, mixed-language, and false-positive edge-case fixture projects
- [x] Scan every new fixture and record severity/category results
- [x] Add durable assertions for expected findings and clean-project behavior
- [x] Correct any rule gaps revealed by the independent fixtures; no new gaps found

# Deep verification pass

- [x] Inspect scanner rule boundaries, archive extraction, API validation, and client contracts
- [x] Test all supported languages with true-positive, clean, and safe-context samples
- [x] Test ZIP traversal, malformed archives, unsupported files, empty archives, and size boundaries
- [x] Run deterministic repeatability, input fuzz, large-file, and multi-file stress checks
- [x] Verify web API, JSON/HTML reports, Python CLI, Java client, and production build together
- [x] Fix verified client serialization defect and add a regression test
- [x] Fix Python CLI and Java desktop client tRPC payload/route formatting discovered by live HTTP smoke test
- [x] Add executable live-contract checks for both external clients against the running API

# Second deep verification pass

- [x] Audit rule accuracy, finding IDs, severity summaries, and JSON/HTML report consistency
- [x] Test compressed, duplicate, unusual-path, binary, and concurrent ZIP scans
- [x] Exercise API failures, repeated scans, and live dashboard scan smoke checks
- [x] Verify CLI/Java output consistency against the shared API response
- [x] Fix newly verified commented-code false positives and add durable regression

# Scan progress UX

- [x] Add animated scan loading state with clear progress stages and status text
- [x] Add real-time indeterminate activity indicator while a scan request is running; exact percentage intentionally not claimed without server progress events
- [x] Preserve accessible reduced-motion and error/completion states
- [x] Add progress-state tests and verify responsive dashboard visuals

# Progress truthfulness follow-up

- [x] Replace simulated percentage claims with truthful indeterminate activity while server scan phases are unavailable
- [x] Verify the pending loading state in a delayed browser-driven desktop scan and responsive mobile layout
- [x] Add durable progress helper regression coverage and preserve existing success/error mutation handling
- [x] Align progress regressions with the active Home.tsx pending panel and remove unused percentage helper logic
