import { describe, expect, it } from "vitest";
import AdmZip from "adm-zip";
import { appRouter } from "./routers";
import { scanFiles } from "../shared/scanner";

const base = { protocol: "https", headers: {} } as any;
const response = {} as any;

function run(name: string, files: { path: string; content: string }[]) {
  return scanFiles(name, files);
}

describe("deep scanner validation", () => {
  it("classifies every supported extension and ignores unsupported files", () => {
    const report = run("extensions", [
      { path: "a.c", content: "int main() { return 0; }" },
      { path: "b.h", content: "#pragma once" },
      { path: "c.cc", content: "int value = 1;" },
      { path: "d.cxx", content: "int value = 1;" },
      { path: "e.hpp", content: "#pragma once" },
      { path: "f.py", content: "value = 1" },
      { path: "g.java", content: "class G {}" },
      { path: "h.kt", content: "fun main() {}" },
      { path: "i.kts", content: "println(1)" },
      { path: "j.js", content: "const value = 1;" },
      { path: "k.jsx", content: "const App = () => <div />;" },
      { path: "l.ts", content: "const value: number = 1;" },
      { path: "m.tsx", content: "const App = () => <div />;" },
      { path: "README.md", content: "not source" },
    ]);
    expect(report.filesScanned).toBe(13);
    expect(report.languages).toEqual(["c", "cpp", "python", "java", "javascript", "typescript"]);
  });

  it("is deterministic apart from timestamp and duration fields", () => {
    const files = [{ path: "src/a.py", content: "KEY = 'secret-value-123'\nvalue = eval(input())" }];
    const first = run("repeat", files);
    const second = run("repeat", files);
    expect(second.findings).toEqual(first.findings);
    expect(second.summary).toEqual(first.summary);
    expect(second.aiSignals).toEqual(first.aiSignals);
  });

  it("handles empty, unicode, comments, and boundary-length source without crashing", () => {
    const report = run("boundaries", [
      { path: "empty.py", content: "" },
      { path: "unicode.ts", content: "const label = 'বাংলা 日本語 العربية';" },
      { path: "comments.java", content: "// system(input)\n/* eval(input) */\nclass Safe {}" },
      { path: "large.cpp", content: "int value = 1;\n".repeat(10000) },
    ]);
    expect(report.filesScanned).toBe(4);
    expect(report.findings.every((item) => item.line > 0)).toBe(true);
  });

  it("rejects traversal paths in archives while scanning safe entries", async () => {
    const zip = new AdmZip();
    zip.addFile("outside.py", Buffer.from("API_KEY = 'secret-value'"));
    const traversalEntry = zip.getEntry("outside.py");
    if (!traversalEntry) throw new Error("fixture entry missing");
    traversalEntry.entryName = "../outside.py";
    zip.addFile("safe/src/main.py", Buffer.from("print('safe')"));
    const report = await appRouter.createCaller({ user: null, req: base, res: response }).scanner.run({
      projectName: "traversal-check",
      files: [],
      archiveBase64: zip.toBuffer().toString("base64"),
      archiveName: "traversal.zip",
    });
    expect(report.filesScanned).toBe(1);
    expect(report.findings.some((item) => item.file.includes("outside"))).toBe(false);
  });

  it("caps archive extraction at 400 supported files", async () => {
    const zip = new AdmZip();
    for (let index = 0; index < 405; index += 1) zip.addFile(`src/file-${index}.py`, Buffer.from("value = 1"));
    const report = await appRouter.createCaller({ user: null, req: base, res: response }).scanner.run({
      projectName: "file-cap",
      files: [],
      archiveBase64: zip.toBuffer().toString("base64"),
      archiveName: "file-cap.zip",
    });
    expect(report.filesScanned).toBe(400);
  });

  it("truncates oversized archive source entries without failing the scan", async () => {
    const zip = new AdmZip();
    zip.addFile("src/large.py", Buffer.from("value = 1\n".repeat(40000)));
    const report = await appRouter.createCaller({ user: null, req: base, res: response }).scanner.run({
      projectName: "source-cap",
      files: [],
      archiveBase64: zip.toBuffer().toString("base64"),
      archiveName: "source-cap.zip",
    });
    expect(report.filesScanned).toBe(1);
    expect(report.findings.every((item) => item.line > 0)).toBe(true);
  });

  it("enforces pasted-input count, content, and archive payload limits", async () => {
    const caller = appRouter.createCaller({ user: null, req: base, res: response });
    const tooManyFiles = Array.from({ length: 401 }, (_, index) => ({ path: `file-${index}.py`, content: "value = 1" }));
    await expect(caller.scanner.run({ projectName: "too-many", files: tooManyFiles })).rejects.toThrow();
    await expect(caller.scanner.run({ projectName: "too-large", files: [{ path: "large.py", content: "x".repeat(300001) }] })).rejects.toThrow();
    const rawOverLimit = Buffer.alloc(6_000_001).toString("base64");
    await expect(caller.scanner.run({ projectName: "large-archive", files: [], archiveBase64: rawOverLimit, archiveName: "large.zip" })).rejects.toThrow(/6 MB/);
  });

  it("rejects a truly empty ZIP archive with a controlled error", async () => {
    const caller = appRouter.createCaller({ user: null, req: base, res: response });
    const emptyZip = new AdmZip();
    await expect(caller.scanner.run({ projectName: "empty-archive", files: [], archiveBase64: emptyZip.toBuffer().toString("base64"), archiveName: "empty.zip" })).rejects.toThrow(/No supported source files/);
  });

  it("rejects malformed and unsupported archives with controlled errors", async () => {
    const caller = appRouter.createCaller({ user: null, req: base, res: response });
    await expect(caller.scanner.run({ projectName: "bad", files: [], archiveBase64: "not-base64", archiveName: "bad.zip" })).rejects.toThrow();
    const zip = new AdmZip();
    zip.addFile("README.md", Buffer.from("documentation"));
    await expect(caller.scanner.run({ projectName: "unsupported", files: [], archiveBase64: zip.toBuffer().toString("base64"), archiveName: "unsupported.zip" })).rejects.toThrow(/No supported source files/);
  });
});
