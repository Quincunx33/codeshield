import { describe, expect, it } from "vitest";
import { serializeHtmlReport, serializeJsonReport } from "../shared/report";
import { scanFiles } from "../shared/scanner";

describe("report serializers", () => {
  const report = scanFiles("<safe project>", [{ path: "x.py", content: 'password = "secret-123456"' }]);
  it("preserves the versioned JSON contract", () => { const parsed = JSON.parse(serializeJsonReport(report)); expect(parsed.schemaVersion).toBe("1.0"); expect(parsed.findings[0].file).toBe("x.py"); });
  it("escapes untrusted project and finding text in HTML", () => { const html = serializeHtmlReport(report); expect(html).toContain("&lt;safe project&gt;"); expect(html).not.toContain("<safe project>"); });
});
