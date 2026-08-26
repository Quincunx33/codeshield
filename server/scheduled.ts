import type { Request, Response } from "express";
import AdmZip from "adm-zip";
import { sdk } from "./_core/sdk";
import { createScan, getScheduledScanByTaskUid } from "./db";
import { scanFiles } from "../shared/scanner";

const supported = /\.(c|h|cc|cpp|cxx|hpp|py|java)$/i;
function archiveUrl(repositoryUrl: string): string {
  const url = new URL(repositoryUrl);
  if (url.hostname === "github.com") { const [owner, repo] = url.pathname.split("/").filter(Boolean); if (!owner || !repo) throw new Error("Invalid GitHub repository URL"); return `https://github.com/${owner}/${repo}/archive/refs/heads/main.zip`; }
  if (url.hostname === "gitlab.com") { const [owner, repo] = url.pathname.split("/").filter(Boolean); if (!owner || !repo) throw new Error("Invalid GitLab repository URL"); return `https://gitlab.com/${owner}/${repo}/-/archive/main/${repo}-main.zip`; }
  throw new Error("Only public GitHub and GitLab repositories are supported");
}

export async function scheduledScanHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
    const job = await getScheduledScanByTaskUid(user.taskUid);
    if (!job || !job.enabled) return res.json({ ok: true, skipped: "orphan-or-disabled" });
    const response = await fetch(archiveUrl(job.repositoryUrl));
    if (!response.ok) throw new Error(`Repository archive returned ${response.status}`);
    const zip = new AdmZip(Buffer.from(await response.arrayBuffer()));
    const files = zip.getEntries().filter((entry) => !entry.isDirectory && supported.test(entry.entryName) && entry.header.size <= 300_000).slice(0, 400).map((entry) => ({ path: entry.entryName.split("/").slice(1).join("/") || entry.entryName, content: entry.getData().toString("utf8") }));
    if (!files.length) return res.json({ ok: true, skipped: "no-supported-files" });
    const report = scanFiles(job.projectName, files);
    const scanId = await createScan(job.userId, report);
    return res.json({ ok: true, scanId, findings: report.findings.length });
  } catch (error) {
    return res.status(500).json({ error: String(error), timestamp: new Date().toISOString() });
  }
}
