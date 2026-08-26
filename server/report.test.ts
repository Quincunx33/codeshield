import { describe, expect, it } from "vitest";
import { serializeHtmlReport, serializeJsonReport } from "../shared/report";
import { scanFiles } from "../shared/scanner";

describe("report serializers", () => {
  const report = scanFiles("<safe project>", [{ path: "x.py", content: 'password = "secret-123456"' }]);
  report.aiSignals.push({ file: "x.py", lineStart: 1, lineEnd: 2, evidence: "password = secret", score: 72, confidence: "high", reasons: ["tutorial-style phrasing"], scoreBreakdown: { commentDensity: 0, phrasing: 25, unresolvedMarkers: 0, formatting: 0, breadth: 0 }, verification: "Review history", remediation: "Keep human review" });
  it("preserves the versioned JSON contract", () => { const parsed = JSON.parse(serializeJsonReport(report)); expect(parsed.schemaVersion).toBe("1.0"); expect(parsed.findings[0].file).toBe("x.py"); });
  it("escapes untrusted project and finding text in HTML", () => { const html = serializeHtmlReport(report); expect(html).toContain("&lt;safe project&gt;"); expect(html).not.toContain("<safe project>"); expect(html).toContain("AI-generated code likelihood"); expect(html).toContain("Code quality score: 10.0/10"); expect(html).toContain("security risk and AI-likelihood signals are reported separately"); expect(html).toContain("72% likelihood"); expect(html).toContain("lines 1-2"); expect(html).toContain("tutorial-style phrasing"); expect(html).toContain("Score breakdown"); expect(html).toContain("Review history"); expect(html).toContain("Keep human review"); expect(html).toContain("<details>"); });
});
