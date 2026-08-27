import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const gate = join(process.cwd(), "scripts/quality-gate.mjs");
const reportPath = join(mkdtempSync(join(tmpdir(), "codeshield-gate-")), "report.json");

writeFileSync(reportPath, JSON.stringify({ findings: [
  { severity: "medium", file: "src/a.py", line: 3, title: "Broad exception handler" },
  { severity: "high", file: "src/b.py", line: 7, title: "Dynamic code execution" },
] }));

describe("quality gate", () => {
  it("fails on high by default and allows a medium threshold to include medium findings", () => {
    const defaultRun = spawnSync(process.execPath, [gate, reportPath], { encoding: "utf8" });
    expect(defaultRun.status).toBe(1);
    expect(defaultRun.stdout).toContain("1 blocking finding");
    const mediumRun = spawnSync(process.execPath, [gate, reportPath], { env: { ...process.env, CODESHIELD_FAIL_ON: "medium" }, encoding: "utf8" });
    expect(mediumRun.status).toBe(1);
    expect(mediumRun.stdout).toContain("2 blocking finding");
    const criticalRun = spawnSync(process.execPath, [gate, reportPath], { env: { ...process.env, CODESHIELD_FAIL_ON: "critical" }, encoding: "utf8" });
    expect(criticalRun.status).toBe(0);
  });

  it("rejects an invalid threshold", () => {
    const result = spawnSync(process.execPath, [gate, reportPath], { env: { ...process.env, CODESHIELD_FAIL_ON: "urgent" }, encoding: "utf8" });
    expect(result.status).toBe(2);
    expect(result.stderr).toContain("Invalid CODESHIELD_FAIL_ON");
  });
});
