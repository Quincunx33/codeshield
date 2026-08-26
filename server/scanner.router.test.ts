import { describe, expect, it } from "vitest";
import AdmZip from "adm-zip";
import { appRouter, cronExpressionSchema } from "./routers";
import type { TrpcContext } from "./_core/context";

const base = { protocol: "https", headers: {} } as TrpcContext["req"];
const response = {} as TrpcContext["res"];
const user = { id: 42, openId: "scanner-test", name: "Scanner", email: "scanner@example.com", loginMethod: "test", role: "user" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };

describe("scanner router", () => {
  it("returns a versioned deterministic demo report", async () => {
    const report = await appRouter.createCaller({ user: null, req: base, res: response }).scanner.demo();
    expect(report.schemaVersion).toBe("1.0");
    expect(report.findings.every((item) => item.file && item.line > 0)).toBe(true);
  });
  it("allows anonymous scans without creating persisted history", async () => {
    const caller = appRouter.createCaller({ user: null, req: base, res: response });
    const report = await caller.scanner.run({ projectName: "anonymous", files: [{ path: "x.py", content: "print('ok')" }] });
    expect(report.findings).toEqual([]);
    expect(report.scanId).toBeUndefined();
  });
  it("rejects an empty project name at the API boundary with a clear validation error", async () => {
    const caller = appRouter.createCaller({ user: null, req: base, res: response });
    await expect(caller.scanner.run({ projectName: "", files: [{ path: "Main.py", content: "print('ok')" }] })).rejects.toThrow();
  });
  it("scans an anonymous ZIP containing supported source files", async () => {
    const zip = new AdmZip();
    zip.addFile("project/app.py", Buffer.from("API_KEY = 'secret-value'\\nprint('ok')"));
    zip.addFile("Main.java", Buffer.from("String password = \"password-123456\";"));
    const report = await appRouter.createCaller({ user: null, req: base, res: response }).scanner.run({ projectName: "zip-anonymous", files: [], archiveBase64: zip.toBuffer().toString("base64"), archiveName: "project.zip" });
    expect(report.filesScanned).toBe(2);
    expect(report.findings.some((item) => item.file === "project/app.py")).toBe(true);
    expect(report.findings.some((item) => item.file === "Main.java")).toBe(true);
    expect(report.scanId).toBeUndefined();
  });
  it("scans JavaScript and TypeScript files from an anonymous ZIP", async () => {
    const zip = new AdmZip();
    zip.addFile("web/src/app.ts", Buffer.from('const token = "secret-value-123";\\nconst result = eval(input);'));
    zip.addFile("web/src/client.jsx", Buffer.from("function render() { return <div />; }"));
    const report = await appRouter.createCaller({ user: null, req: base, res: response }).scanner.run({ projectName: "web-archive", files: [], archiveBase64: zip.toBuffer().toString("base64"), archiveName: "web.zip" });
    expect(report.filesScanned).toBe(2);
    expect(report.languages).toEqual(["typescript", "javascript"]);
    expect(report.findings.some((item) => item.file === "web/src/app.ts")).toBe(true);
    expect(report.scanId).toBeUndefined();
  });
  it("rejects an authenticated archive with no supported source files", async () => {
    const caller = appRouter.createCaller({ user, req: base, res: response });
    await expect(caller.scanner.run({ projectName: "empty archive", files: [], archiveBase64: Buffer.from("not-a-zip").toString("base64"), archiveName: "empty.zip" })).rejects.toThrow();
  });
  it("accepts the six-field UTC cron shape and rejects five-field input before scheduling", async () => {
    expect(cronExpressionSchema.parse("0 0 9 * * *")).toBe("0 0 9 * * *");
    expect(() => cronExpressionSchema.parse("0 9 * * *")).toThrow();
  });
  it("denies workspace membership review to a non-owner", async () => {
    const caller = appRouter.createCaller({ user, req: base, res: response });
    await expect(caller.workspace.members({ teamId: 999999 })).rejects.toThrow(/access denied/);
  });
  it("accepts an authenticated code scan without requiring a database in unit tests", async () => {
    const caller = appRouter.createCaller({ user, req: base, res: response });
    const report = await caller.scanner.run({ projectName: "authorized", files: [{ path: "x.cpp", content: "strcpy(target, input);" }] });
    expect(report.scanId).toEqual(expect.any(Number));
    expect(report.findings[0]?.file).toBe("x.cpp");
  });
});
