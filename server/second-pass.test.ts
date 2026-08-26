import { describe, expect, it } from "vitest";
import AdmZip from "adm-zip";
import { scanFiles } from "../shared/scanner";
import { serializeHtmlReport, serializeJsonReport } from "../shared/report";
import { appRouter } from "./routers";

const base = { protocol: "https", headers: {} } as any;
const response = {} as any;

function assertReportInvariants(report: ReturnType<typeof scanFiles>) {
  const counted = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  for (const finding of report.findings) {
    counted[finding.severity] += 1;
    expect(finding.id).toMatch(/^[A-Z0-9]+-.+-\d+$/);
    expect(finding.file.length).toBeGreaterThan(0);
    expect(finding.line).toBeGreaterThan(0);
    expect(finding.message.length).toBeGreaterThan(0);
    expect(finding.remediation.length).toBeGreaterThan(0);
  }
  expect(report.summary).toEqual(counted);
}

describe("second independent deep verification pass", () => {
  it("keeps finding IDs unique and summary counts exact across mixed rules", () => {
    const report = scanFiles("invariant", [
      { path: "a.py", content: "API_KEY = 'secret-value-123'\neval(input())\nos.system(command)\nexcept:" },
      { path: "b.c", content: "strcpy(target, input);\nsystem(input);" },
      { path: "c.ts", content: "const token = 'secret-value-123';\nconst result = eval(input);" },
    ]);
    assertReportInvariants(report);
    expect(new Set(report.findings.map((item) => item.id)).size).toBe(report.findings.length);
  });

  it("does not report commented-out security-looking code as executable risk", () => {
    const report = scanFiles("comments", [
      { path: "src/example.py", content: "# API_KEY = 'secret-value-123'\n# eval(input())\n# os.system(command)" },
      { path: "src/example.c", content: "// strcpy(target, input);\n/* system(input); */" },
    ]);
    expect(report.findings.filter((item) => item.category === "security")).toEqual([]);
  });

  it("keeps JSON and HTML reports anchored to the same scan identity", () => {
    const report = scanFiles("<second-pass>", [{ path: "src/main.py", content: "API_KEY = 'secret-value-123'" }]);
    const parsed = JSON.parse(serializeJsonReport(report));
    const html = serializeHtmlReport(report);
    expect(parsed.schemaVersion).toBe(report.schemaVersion);
    expect(parsed.projectName).toBe(report.projectName);
    expect(parsed.findings.length).toBe(report.findings.length);
    expect(html).toContain("&lt;second-pass&gt;");
    for (const finding of report.findings) expect(html).toContain(finding.title);
  });

  it("handles compressed archives with spaces, unicode, binary files, and duplicate names", async () => {
    const zip = new AdmZip();
    zip.addFile("Project Space/src/বাংলা.py", Buffer.from("print('ok')"));
    zip.addFile("Project Space/assets/image.bin", Buffer.from([0, 159, 146, 150]));
    zip.addFile("Project Space/src/secret.py", Buffer.from("API_KEY = 'secret-value-123'"));
    zip.addFile("Project Space/src/secret.py", Buffer.from("API_KEY = 'secret-value-123'"));
    const report = await appRouter.createCaller({ user: null, req: base, res: response }).scanner.run({ projectName: "compressed", files: [], archiveBase64: zip.toBuffer().toString("base64"), archiveName: "compressed.zip" });
    expect(report.filesScanned).toBe(2);
    expect(report.findings.filter((item) => item.file.endsWith("secret.py"))).toHaveLength(1);
  });

  it("returns isolated deterministic results for concurrent independent scans", async () => {
    const caller = appRouter.createCaller({ user: null, req: base, res: response });
    const reports = await Promise.all(Array.from({ length: 20 }, (_, index) => caller.scanner.run({ projectName: `parallel-${index}`, files: [{ path: `src/${index}.py`, content: index % 2 ? "print('ok')" : "API_KEY = 'parallel-secret-123'" }] })));
    expect(reports).toHaveLength(20);
    for (const [index, report] of reports.entries()) {
      expect(report.projectName).toBe(`parallel-${index}`);
      expect(report.filesScanned).toBe(1);
      expect(report.scanId).toBeUndefined();
      expect(report.summary.critical).toBe(index % 2 ? 0 : 1);
    }
  });
});
