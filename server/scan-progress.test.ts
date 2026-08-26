import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { scanStages } from "../client/src/lib/scanProgress";

describe("dashboard scan progress state", () => {
  it("defines the four visible activity stages", () => {
    expect(scanStages).toEqual(["Preparing source", "Running deterministic rules", "Ranking evidence", "Finalizing report"]);
  });

  it("keeps the live Home.tsx pending and completion contract intact", () => {
    const source = readFileSync(new URL("../client/src/pages/Home.tsx", import.meta.url), "utf8");
    expect(source).toContain("runScan.isPending");
    expect(source).toContain('className="scan-progress-panel"');
    expect(source).toContain('role="progressbar"');
    expect(source).toContain('aria-valuetext="Code analysis is in progress"');
    expect(source).toContain("setReport(data)");
    expect(source).toContain("toast.error(error.message)");
  });
});
