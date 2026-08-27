# CodeShield 30-Minute Stress-Test Report

## Run window

The corrected stress pass ran from **2026-08-27T18:42:22.227Z** through **2026-08-27T19:12:22.229Z**, for **1,800,002 ms** against the local CodeShield tRPC API at `http://127.0.0.1:3000/api/trpc`.

## Workload and results

| Metric | Result |
|---|---:|
| Local deterministic scan iterations | 448,953 |
| ZIP/API scan requests | 448,953 |
| Pasted-code API requests | 448,953 |
| Supported files scanned locally | 4,489,530 |
| Runtime failures | 0 |
| False-positive boundary violations | 0 |
| Line-evidence invariant failures | 0 |
| Deterministic mismatches | 0 |
| Average ZIP/API latency | 2 ms |
| Maximum ZIP/API latency | 53 ms |
| Last error | None |

The corpus exercised C, C++, Python, Java, Kotlin, JavaScript, and TypeScript examples, including intentional shell/memory-risk cases, clean and safe-context code, commented-out risky code, duplicate-code samples, and AI-likelihood patterns. ZIP/API checks verified required true positives and excluded the documented commented-code false positive. Pasted-code checks verified exact file/line/snippet preservation for a hard-coded secret on line 1 and dynamic execution on line 2. ZIP checks verified that duplicate findings retained matching source snippets from both authoritative file locations.

## Verdict

**PASS.** The scanner completed the full requested 30-minute run with no crashes, no API failures, no deterministic mismatches, no false-positive violations in the tested boundaries, and no line-level evidence losses. No code fix was required after this corrected run.
