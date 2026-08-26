import fs from "node:fs";
import { describe, expect, it } from "vitest";
import AdmZip from "adm-zip";
import { scanFiles } from "../shared/scanner";

const archivePath = process.env.CODESHIELD_CIPHERCHAT_ARCHIVE;
const supported = /\.(c|h|cc|cpp|cxx|hpp|py|java|kt|kts|js|jsx|ts|tsx)$/i;

describe("uploaded CipherChat archive regression", () => {
  it("preserves the verified archive-wide severity bounds when an archive is supplied", () => {
    if (!archivePath || !fs.existsSync(archivePath)) return;
    const zip = new AdmZip(archivePath);
    const files = zip.getEntries().filter((entry) => !entry.isDirectory && supported.test(entry.entryName)).map((entry) => ({ path: entry.entryName, content: entry.getData().toString("utf8") }));
    const report = scanFiles("CipherChat6", files);
    expect(report.filesScanned).toBe(68);
    expect(report.summary.critical).toBe(0);
    expect(report.summary.high).toBe(0);
    expect(report.summary.medium).toBe(0);
    expect(report.summary.low).toBeLessThanOrEqual(29);
    expect(report.summary.info).toBeLessThanOrEqual(19);
  });
});
