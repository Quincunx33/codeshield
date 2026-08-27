import { describe, expect, it } from "vitest";
import { findingImpact, plainFindingTitle, reportOutcome } from "../client/src/lib/resultCopy";
import type { Finding, ScanReport } from "../shared/scanner";

const base = (overrides: Partial<ScanReport> = {}): ScanReport => ({ schemaVersion: "1.0", projectName: "Example", createdAt: "2026-08-27T00:00:00.000Z", durationMs: 4, filesScanned: 1, languages: ["python"], summary: { critical: 0, high: 0, medium: 0, low: 0, info: 0 }, findings: [], qualityScore: { score: 10, label: "excellent", breakdown: { maintainability: 0, duplication: 0, hygiene: 0 }, findingsConsidered: 0, basis: "quality signals" }, aiSignals: [], ...overrides });
const finding = (overrides: Partial<Finding> = {}): Finding => ({ id: "SEC001-main_py-1", ruleId: "SEC001", severity: "critical", category: "security", title: "Hard-coded secret", message: "Credential in source", remediation: "Rotate it", file: "main.py", line: 1, language: "python", ...overrides });

describe("plain-language result copy", () => {
  it("explains urgent, review, quality-only, and clean outcomes", () => {
    expect(reportOutcome(base({ summary: { critical: 1, high: 0, medium: 0, low: 0, info: 0 } })).tone).toBe("urgent");
    expect(reportOutcome(base({ summary: { critical: 0, high: 0, medium: 1, low: 0, info: 0 } })).tone).toBe("review");
    expect(reportOutcome(base({ findings: [finding({ severity: "low", category: "quality", title: "Unresolved work marker" })] })).tone).toBe("quality");
    expect(reportOutcome(base()).tone).toBe("safe");
  });
  it("turns technical finding titles and impacts into user-facing language", () => {
    expect(plainFindingTitle(finding())).toBe("A secret is exposed in the code");
    expect(findingImpact(finding())).toContain("credential");
    expect(findingImpact(finding({ category: "duplication", severity: "low", title: "Repeated code signal" }))).toContain("multiple places");
  });
});
