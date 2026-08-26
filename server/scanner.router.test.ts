import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
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
  it("requires authentication for persisted scans", async () => {
    const caller = appRouter.createCaller({ user: null, req: base, res: response });
    await expect(caller.scanner.run({ projectName: "unauthorized", files: [{ path: "x.py", content: "print(1)" }] })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
  it("rejects an authenticated archive with no supported source files", async () => {
    const caller = appRouter.createCaller({ user, req: base, res: response });
    await expect(caller.scanner.run({ projectName: "empty archive", files: [], archiveBase64: Buffer.from("not-a-zip").toString("base64"), archiveName: "empty.zip" })).rejects.toThrow();
  });
  it("accepts an authenticated code scan without requiring a database in unit tests", async () => {
    const caller = appRouter.createCaller({ user, req: base, res: response });
    const report = await caller.scanner.run({ projectName: "authorized", files: [{ path: "x.cpp", content: "strcpy(target, input);" }] });
    expect(report.scanId).toEqual(expect.any(Number));
    expect(report.findings[0]?.file).toBe("x.cpp");
  });
});
