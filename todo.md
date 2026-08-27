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

# AI and quality report revision

- [x] Define an honest AI-generated-code likelihood contract with evidence and non-authorship disclaimer
- [x] Add a transparent overall code-quality score from 0 to 10 with category breakdown
- [x] Show AI likelihood and quality score separately in dashboard, JSON/HTML reports, Python CLI, and Java client
- [x] Add regression tests using vulnerable, clean, mixed-language, and safe fixtures
- [x] Verify the revised report UX and publish the release
- [x] Update report tests for the explicit AI-generated likelihood heading and quality-score section
- [x] Add quality-score rendering to the Python CLI, Java client, and shared golden report checks
- [x] Verify quality score and AI-likelihood sections in desktop and mobile dashboard views
- [x] Make Python and Java contract tests load the committed clients/golden-report.json fixture
- [x] Save the final quality-report checkpoint after those verifications
- [x] Correct the Python golden-report expectation and rerun shared Python/Java contract tests
- [x] Capture mobile responsive layout evidence for the quality-score and AI-likelihood sections
- [x] Publish a final quality-report checkpoint after all corrections pass

# Long small-file stress pass

- [x] Generate many independent small files across C, C++, Python, Java, Kotlin, JavaScript, and TypeScript
- [x] Include clean, intentional-risk, safe-context, comment-only, duplicate, and AI-signal samples
- [x] Run repeated local engine scans plus archive/API stress scans and record counts, score stability, and false positives; 300 repeated passes completed with zero failures
- [x] Fix any defect found and add durable regression coverage; no defect found in this pass
- [x] Run final client/build verification and publish the stress-tested release
- [x] Add duplicate-code and explicit AI-likelihood small-file samples with assertions
- [x] Run archive and live/API small-file stress scenarios and record results
- [x] Run full final verification and save the stress-tested release checkpoint

# Genuine one-hour timed stress test

- [x] Prepare a reproducible wall-clock harness with explicit start/end timestamps
- [x] Run continuous small-file local scans and real archive/API requests for exactly 3,600,000 ms
- [x] Monitor and record iterations, files, requests, failures, latency, deterministic mismatches, and false positives
- [x] Analyze the measured log and add any needed regression coverage; no new regression required
- [x] Run post-hour final verification and publish only after the timed run is complete

# GitHub publication

- [x] Inspect GitHub identity and confirm the requested repository name is available
- [x] Create a polished README with live application link, usage, architecture, testing, and security notes
- [x] Add a branded visual asset to the README without storing credentials or secrets
- [x] Create the private GitHub repository, set description/topics, and push the tested code
- [x] Verify repository files, README rendering/link, metadata, and published remote state

# GitHub rename and workflow-excluded push

- [x] Rename repository references from CodeShield Mix to CodeShield where appropriate
- [x] Update README links, title, description, and topics for the renamed repository
- [x] Rename the GitHub repository to `codeshield` and push all non-workflow files
- [x] Verify the renamed remote, metadata, README, and workflow exclusion

# Human-readable scan results

- [x] Audit current result hierarchy and define understandable outcome states
- [x] Add a plain-language scan verdict with urgency and immediate next action
- [x] Explain quality score and AI likelihood in user-facing language
- [x] Rewrite finding cards around problem, impact, location, and fix
- [x] Keep technical evidence available behind clear expandable details
- [x] Add tests and verify the post-scan result flow on desktop and mobile
- [x] Move plain-language result regression into the active Vitest test glob and rerun typecheck/build
- [x] Document completed-scan browser smoke evidence for verdict, finding cards, technical disclosure, and responsive layout
- [x] Add a source-level responsive contract assertion for the result panel classes

# Visible line-level finding evidence

- [x] Preserve exact source line context for every finding through scan and archive flows
- [x] Include both source locations for duplicate-code findings when authoritative data exists
- [x] Show line-numbered code context visibly in each dashboard finding card
- [x] Add regression tests for snippets, missing-source handling, and duplicate locations
- [x] Verify real ZIP and pasted scans, then publish the evidence update

# 30-minute stress verification

- [x] Prepare a reproducible 30-minute local/API stress harness with timestamps and metrics
- [x] Run continuous multi-language, pasted-code, ZIP, and line-evidence scenarios for 30 minutes
- [x] Analyze crashes, latency, determinism, true positives, and false-positive boundaries
- [x] Apply and verify fixes if the run reveals a defect
- [x] Record and deliver the measured 30-minute stress-test report

# 30-minute stress coverage correction

- [x] Extend the timed harness with repeated pasted-code API scans and explicit snippet/duplicate-location assertions
- [x] Rerun the complete 30-minute pass with local, pasted, ZIP, and line-evidence coverage
- [x] Save a measured stress-test report with timestamps, counts, latency, and verdict before delivery

# Finding UX and CI gate enhancement

- [x] Add language-aware syntax highlighting to finding evidence blocks
- [x] Add copy-line and surrounding-context actions with accessible feedback
- [x] Add configurable CI quality-gate severity threshold and documentation
- [x] Audit working tree, tracked files, and repository history for secrets or sensitive artifacts
- [x] Run tests/build/security checks, remove any sensitive content found, and push only safe code to the private repository

# GitHub Actions workflow

- [x] Add a GitHub Actions workflow that runs CodeShield tests, typecheck, build, and configurable quality gate
- [x] Validate workflow YAML, permissions, secret handling, and repository-sensitive content
- [x] Push the workflow to the private GitHub repository and verify remote visibility and workflow file
