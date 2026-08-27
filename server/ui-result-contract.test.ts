import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("dashboard result UX contract", () => {
  it("keeps the plain-language verdict, action hierarchy, and responsive result classes", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
    expect(source).toContain("Scan result");
    expect(source).toContain("reportOutcome(showReport)");
    expect(source).toContain("What to do next");
    expect(source).toContain("How to fix:");
    expect(source).toContain("Technical evidence");
    expect(source).toContain("flex flex-wrap items-center gap-3 text-[11px]");
    expect(source).toContain("max-w-2xl text-sm leading-6");
    expect(source).toContain("findingImpact(item)");
    expect(source).toContain("Code at {item.file}:{item.line}");
    expect(source).toContain("Source line unavailable in this report");
    expect(source).toContain("item.related &&");
    expect(source).toContain("Matching line in {item.related.file}");
  });
});
