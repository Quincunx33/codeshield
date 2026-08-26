import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { createScan, getScan, listScans, getDb } from "./db";
import { and, eq } from "drizzle-orm";
import { teamMembers, teams, users } from "../drizzle/schema";
import { demoFiles, scanFiles } from "../shared/scanner";
import { invokeLLM } from "./_core/llm";
import AdmZip from "adm-zip";
import { nanoid } from "nanoid";
import { parse as parseCookie } from "cookie";
import { createHeartbeatJob, updateHeartbeatJob } from "./_core/heartbeat";
import { listScheduledScans, createScheduledScanRecord, setScheduledScanEnabled } from "./db";
import { storagePut } from "./storage";

const fileSchema = z.object({ path: z.string().min(1).max(500), content: z.string().max(300_000) });
export const cronExpressionSchema = z.string().regex(/^0 \d{1,2} \d{1,2} \* \* \*$/);
export const appRouter = router({
  system: systemRouter,
  auth: router({ me: publicProcedure.query((opts) => opts.ctx.user), logout: publicProcedure.mutation(({ ctx }) => { ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 }); return { success: true } as const; }) }),
  workspace: router({
    create: protectedProcedure.input(z.object({ name: z.string().min(2).max(160) })).mutation(async ({ ctx, input }) => { const db = await getDb(); if (!db) throw new Error("Database unavailable"); const [created] = await db.insert(teams).values({ name: input.name, ownerId: ctx.user.id }).$returningId(); await db.insert(teamMembers).values({ teamId: created.id, userId: ctx.user.id, role: "owner" }); return { id: created.id, name: input.name, role: "owner" as const }; }),
    list: protectedProcedure.query(async ({ ctx }) => { const db = await getDb(); if (!db) return []; return db.select({ id: teams.id, name: teams.name, role: teamMembers.role }).from(teamMembers).innerJoin(teams, eq(teamMembers.teamId, teams.id)).where(eq(teamMembers.userId, ctx.user.id)); }),
    members: protectedProcedure.input(z.object({ teamId: z.number().int().positive() })).query(async ({ ctx, input }) => { const db = await getDb(); if (!db) return []; const team = (await db.select().from(teams).where(eq(teams.id, input.teamId)).limit(1))[0]; if (!team || team.ownerId !== ctx.user.id) throw new Error("Workspace access denied"); return db.select({ id: teamMembers.id, userId: users.id, name: users.name, email: users.email, role: teamMembers.role }).from(teamMembers).innerJoin(users, eq(teamMembers.userId, users.id)).where(eq(teamMembers.teamId, input.teamId)); }),
    invite: protectedProcedure.input(z.object({ teamId: z.number().int().positive(), email: z.string().email(), role: z.enum(["admin", "member"]).default("member") })).mutation(async ({ ctx, input }) => { const db = await getDb(); if (!db) throw new Error("Database unavailable"); const team = (await db.select().from(teams).where(eq(teams.id, input.teamId)).limit(1))[0]; if (!team || team.ownerId !== ctx.user.id) throw new Error("Only the workspace owner can invite members"); const member = (await db.select().from(users).where(eq(users.email, input.email)).limit(1))[0]; if (!member) throw new Error("That user must sign in once before they can be invited"); await db.insert(teamMembers).values({ teamId: input.teamId, userId: member.id, role: input.role }); return { success: true }; }),
    setRole: protectedProcedure.input(z.object({ teamId: z.number().int().positive(), userId: z.number().int().positive(), role: z.enum(["admin", "member"]) })).mutation(async ({ ctx, input }) => { const db = await getDb(); if (!db) throw new Error("Database unavailable"); const team = (await db.select().from(teams).where(eq(teams.id, input.teamId)).limit(1))[0]; if (!team || team.ownerId !== ctx.user.id) throw new Error("Only the workspace owner can change roles"); await db.update(teamMembers).set({ role: input.role }).where(and(eq(teamMembers.teamId, input.teamId), eq(teamMembers.userId, input.userId))); return { success: true }; }),
  }),
  schedules: router({
    list: protectedProcedure.query(({ ctx }) => listScheduledScans(ctx.user.id)),
    create: protectedProcedure.input(z.object({ projectName: z.string().min(1).max(180), repositoryUrl: z.string().url().max(500), cronExpression: cronExpressionSchema })).mutation(async ({ ctx, input }) => { const session = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? ""; const job = await createHeartbeatJob({ name: `codeshield-${ctx.user.id}-${nanoid(8)}`, cron: input.cronExpression, path: "/api/scheduled/runScan", payload: {}, description: `Recurring CodeShield scan for ${input.projectName}` }, session); const id = await createScheduledScanRecord({ userId: ctx.user.id, projectName: input.projectName, repositoryUrl: input.repositoryUrl, cronExpression: input.cronExpression, scheduleTaskUid: job.taskUid }); return { id, taskUid: job.taskUid, nextExecutionAt: job.nextExecutionAt ?? null }; }),
    setEnabled: protectedProcedure.input(z.object({ id: z.number().int().positive(), enabled: z.boolean() })).mutation(async ({ ctx, input }) => { const session = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? ""; const rows = await listScheduledScans(ctx.user.id); const row = rows.find((item) => item.id === input.id); if (!row?.scheduleTaskUid) throw new Error("Schedule not found"); await updateHeartbeatJob(row.scheduleTaskUid, { enable: input.enabled }, session); await setScheduledScanEnabled(input.id, ctx.user.id, input.enabled ? 1 : 0); return { success: true }; }),
  }),
  scanner: router({
    demo: publicProcedure.query(() => scanFiles("Demo project", demoFiles())),
    run: publicProcedure.input(z.object({ projectName: z.string().min(1).max(180), files: z.array(fileSchema).max(400).default([]), archiveBase64: z.string().max(8_000_000).optional(), archiveName: z.string().max(255).optional() })).mutation(async ({ ctx, input }) => {
      let files = input.files;
      let source: { storageKey: string; originalName: string } | undefined;
      if (input.archiveBase64) {
        const raw = Buffer.from(input.archiveBase64, "base64");
        if (raw.length > 6_000_000) throw new Error("Archive exceeds the 6 MB temporary upload limit");
        if (ctx.user) { const storage = await storagePut(`temporary-scans/${ctx.user.id}/${nanoid(16)}.zip`, raw, "application/zip"); source = { storageKey: storage.key, originalName: input.archiveName || "source.zip" }; }
        const zip = new AdmZip(raw);
        const entries = zip.getEntries().filter((entry) => !entry.isDirectory);
        const supportedEntries = entries.filter((entry) => !entry.entryName.includes("..") && !entry.entryName.startsWith("/") && /\.(c|h|cc|cpp|cxx|hpp|py|java|kt|kts|js|jsx|ts|tsx)$/i.test(entry.entryName));
        files = supportedEntries.slice(0, 400).map((entry) => ({ path: entry.entryName, content: entry.getData().toString("utf8").slice(0, 300_000) }));
        if (!files.length) {
          const extensions = Array.from(new Set(entries.map((entry) => entry.entryName.includes(".") ? `.${entry.entryName.split(".").pop()?.toLowerCase()}` : "[no extension]"))).slice(0, 8).join(", ");
          throw new Error(`No supported source files found. Archive contained ${entries.length} file(s)${extensions ? ` (${extensions})` : ""}. Add C/C++, Python, Java/Kotlin, JavaScript, or TypeScript files.`);
        }
      }
      const report = scanFiles(input.projectName, files);
      const scanId = ctx.user ? await createScan(ctx.user.id, report, source) : undefined;
      return { ...report, scanId };
    }),
    history: protectedProcedure.query(({ ctx }) => listScans(ctx.user.id)),
    detail: protectedProcedure.input(z.object({ scanId: z.number().int().positive() })).query(({ ctx, input }) => getScan(ctx.user.id, input.scanId)),
    explain: protectedProcedure.input(z.object({ title: z.string(), message: z.string(), remediation: z.string(), language: z.string(), snippet: z.string().optional() })).mutation(async ({ input }) => {
      const response = await invokeLLM({ messages: [
        { role: "system", content: "You explain deterministic code scanner findings. Return concise, practical JSON with riskExplanation and remediationSuggestion. Never claim a finding is valid without the rule evidence. Do not include secrets from the snippet." },
        { role: "user", content: JSON.stringify({ finding: input }) },
      ], response_format: { type: "json_schema", json_schema: { name: "finding_explanation", strict: true, schema: { type: "object", properties: { riskExplanation: { type: "string" }, remediationSuggestion: { type: "string" } }, required: ["riskExplanation", "remediationSuggestion"], additionalProperties: false } } } });
      const content = response.choices?.[0]?.message?.content;
      if (typeof content !== "string") throw new Error("No explanation returned");
      return JSON.parse(content) as { riskExplanation: string; remediationSuggestion: string };
    }),
  }),
});
export type AppRouter = typeof appRouter;
