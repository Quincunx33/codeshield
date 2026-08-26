import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { createScan, getScan, listScans } from "./db";
import { demoFiles, scanFiles } from "../shared/scanner";
import { invokeLLM } from "./_core/llm";
import AdmZip from "adm-zip";
import { nanoid } from "nanoid";
import { storagePut } from "./storage";

const fileSchema = z.object({ path: z.string().min(1).max(500), content: z.string().max(300_000) });
export const appRouter = router({
  system: systemRouter,
  auth: router({ me: publicProcedure.query((opts) => opts.ctx.user), logout: publicProcedure.mutation(({ ctx }) => { ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 }); return { success: true } as const; }) }),
  scanner: router({
    demo: publicProcedure.query(() => scanFiles("Demo project", demoFiles())),
    run: protectedProcedure.input(z.object({ projectName: z.string().min(1).max(180), files: z.array(fileSchema).max(400).default([]), archiveBase64: z.string().max(8_000_000).optional(), archiveName: z.string().max(255).optional() })).mutation(async ({ ctx, input }) => {
      let files = input.files;
      let source: { storageKey: string; originalName: string } | undefined;
      if (input.archiveBase64) {
        const raw = Buffer.from(input.archiveBase64, "base64");
        if (raw.length > 6_000_000) throw new Error("Archive exceeds the 6 MB temporary upload limit");
        const storage = await storagePut(`temporary-scans/${ctx.user.id}/${nanoid(16)}.zip`, raw, "application/zip");
        source = { storageKey: storage.key, originalName: input.archiveName || "source.zip" };
        const zip = new AdmZip(raw);
        files = zip.getEntries().filter((entry) => !entry.isDirectory && !entry.entryName.includes("..") && !entry.entryName.startsWith("/") && /\.(c|h|cc|cpp|cxx|hpp|py|java)$/i.test(entry.entryName)).slice(0, 400).map((entry) => ({ path: entry.entryName, content: entry.getData().toString("utf8").slice(0, 300_000) }));
      }
      if (!files.length) throw new Error("Provide source code or an archive containing supported files");
      const report = scanFiles(input.projectName, files);
      const scanId = await createScan(ctx.user.id, report, source);
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
