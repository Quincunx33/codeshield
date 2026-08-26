import { describe, expect, it } from "vitest";
import { scanFiles } from "../shared/scanner";
import { cleanProject, mixedProject, safeEdgeProject, vulnerableProject } from "./fixtures/multi-fixtures";

describe("independent multi-project scanner validation", () => {
  it("finds intentional security problems in a separate vulnerable project", () => {
    const report = scanFiles("vulnerable-sample", vulnerableProject);
    expect(report.filesScanned).toBe(3);
    expect(report.summary.critical).toBeGreaterThanOrEqual(1);
    expect(report.findings.some((item) => item.title === "Dynamic code execution")).toBe(true);
    expect(report.findings.some((item) => item.title === "Shell command execution")).toBe(true);
    expect(report.findings.some((item) => item.ruleId === "SEC001")).toBe(true);
  });

  it("keeps a production-style clean project free of security findings", () => {
    const report = scanFiles("clean-sample", cleanProject);
    expect(report.filesScanned).toBe(3);
    expect(report.findings.filter((item) => item.category === "security")).toEqual([]);
  });

  it("covers multiple supported languages in one independent project", () => {
    const report = scanFiles("mixed-sample", mixedProject);
    expect(report.filesScanned).toBe(4);
    expect(report.languages).toEqual(["typescript", "python", "cpp", "java"]);
    expect(report.findings.every((item) => item.file && item.line > 0 && item.remediation)).toBe(true);
  });

  it("does not turn known safe UI and library patterns into security findings", () => {
    const report = scanFiles("safe-edge-sample", safeEdgeProject);
    expect(report.findings.filter((item) => item.category === "security")).toEqual([]);
  });
});
