import { describe, expect, it } from "vitest";
import { scanFiles } from "../shared/scanner";

describe("shared scanner contract", () => {
  it("detects deterministic risks with exact file and line references", () => {
    const report = scanFiles("fixture", [{ path: "src/main.py", content: 'API_KEY = "secret-value-123"\nvalue = eval(input())\n# TODO: rotate key' }]);
    expect(report.schemaVersion).toBe("1.0");
    expect(report.languages).toEqual(["python"]);
    expect(report.findings.some((item) => item.ruleId === "SEC001" && item.file === "src/main.py" && item.line === 1 && item.severity === "critical")).toBe(true);
    expect(report.findings.some((item) => item.title === "Dynamic code execution" && item.line === 2)).toBe(true);
    expect(report.summary.critical).toBe(1);
    expect(report.findings[0]?.severity).toBe("critical");
  });
  it("scans C++ and Java using the same report shape", () => {
    const report = scanFiles("multi", [{ path: "a.cpp", content: "char* x; strcpy(x, input);" }, { path: "Token.java", content: 'String password = "password-123456";' }]);
    expect(report.filesScanned).toBe(2);
    expect(report.languages).toEqual(["cpp", "java"]);
    expect(report.findings.every((item) => item.file && item.line > 0 && item.remediation)).toBe(true);
  });
});
