# Small-file stress validation

The shared deterministic engine was exercised with a corpus of 1,120 independent small source files per run: 40 rounds across C, C++, Python, Java, Kotlin, JavaScript, and TypeScript, with safe, intentional-risk, comment-only, and UI-randomness cases. The corpus was scanned repeatedly and compared for finding, summary, quality-score, and AI-signal stability.

A 300-iteration repeated stress loop completed with zero failures. Every iteration passed the true-positive, safe-context exclusion, language coverage, finding-invariant, bounded quality-score, and repeatability assertions. The test also confirmed that commented-out security-looking code and ordinary UI randomness do not become security findings.

## Archive/API stress

A real ZIP containing six small files was submitted through the running `/api/trpc/scanner.run` endpoint in 40 concurrent requests. All 40 returned valid reports in 174 ms total, with deterministic findings, summary, quality score, and AI-signal output across responses. Each report preserved the intentional C shell true positive, ignored commented-out security-looking code, reported five findings, returned a 9.1/10 quality score, and produced one AI-likelihood signal.
