import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  findings,
  repositories,
  scanSources,
  scans,
  users,
  scheduledScans,
} from "../drizzle/schema";
import type { ScanReport } from "../shared/scanner";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  values.lastSignedIn = user.lastSignedIn ?? new Date();
  updateSet.lastSignedIn = values.lastSignedIn;
  if (user.role) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  await db
    .insert(users)
    .values(values)
    .onDuplicateKeyUpdate({ set: updateSet });
}
export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);
  return result[0];
}
export async function createScan(
  userId: number,
  report: ScanReport,
  source?: { storageKey: string; originalName: string }
) {
  const db = await getDb();
  if (!db) return undefined;
  const [result] = await db
    .insert(scans)
    .values({
      userId,
      projectName: report.projectName,
      filesScanned: report.filesScanned,
      criticalCount: report.summary.critical,
      highCount: report.summary.high,
      mediumCount: report.summary.medium,
      lowCount: report.summary.low,
      infoCount: report.summary.info,
    })
    .$returningId();
  const scanId = result.id;
  if (source)
    await db
      .insert(scanSources)
      .values({
        scanId,
        storageKey: source.storageKey,
        originalName: source.originalName,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });
  if (report.findings.length)
    await db
      .insert(findings)
      .values(
        report.findings.map(item => ({
          scanId,
          ruleId: item.ruleId,
          severity: item.severity,
          category: item.category,
          title: item.title,
          message: item.message,
          remediation: item.remediation,
          explanation: item.explanation ?? null,
          file: item.file,
          line: item.line,
          language: item.language,
          snippet: item.snippet ?? null,
        }))
      );
  return scanId;
}
export async function listScans(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(scans)
    .where(eq(scans.userId, userId))
    .orderBy(desc(scans.createdAt))
    .limit(30);
}
export async function getScan(userId: number, scanId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const scan = (
    await db.select().from(scans).where(eq(scans.id, scanId)).limit(1)
  )[0];
  if (!scan || scan.userId !== userId) return undefined;
  const source = (
    await db
      .select()
      .from(scanSources)
      .where(eq(scanSources.scanId, scanId))
      .limit(1)
  )[0];
  if (source && source.expiresAt.getTime() <= Date.now()) return undefined;
  const items = await db
    .select()
    .from(findings)
    .where(eq(findings.scanId, scanId));
  return { scan, findings: items, source: source ?? null };
}
export async function listRepositories(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(repositories)
    .where(eq(repositories.userId, userId))
    .orderBy(desc(repositories.updatedAt))
    .limit(20);
}
export async function saveRepository(input: {
  userId: number;
  name: string;
  repositoryUrl: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const existing = (
    await db
      .select()
      .from(repositories)
      .where(
        and(
          eq(repositories.userId, input.userId),
          eq(repositories.repositoryUrl, input.repositoryUrl)
        )
      )
      .limit(1)
  )[0];
  if (existing) {
    await db
      .update(repositories)
      .set({ name: input.name })
      .where(
        and(
          eq(repositories.id, existing.id),
          eq(repositories.userId, input.userId)
        )
      );
    return existing.id;
  }
  const [row] = await db.insert(repositories).values(input).$returningId();
  return row.id;
}
export async function setRepositoryLastScan(
  id: number,
  userId: number,
  lastScanId: number
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(repositories)
    .set({ lastScanId })
    .where(and(eq(repositories.id, id), eq(repositories.userId, userId)));
}
export async function listScheduledScans(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(scheduledScans)
    .where(eq(scheduledScans.userId, userId))
    .orderBy(desc(scheduledScans.createdAt));
}
export async function createScheduledScanRecord(input: {
  userId: number;
  projectName: string;
  repositoryUrl: string;
  cronExpression: string;
  scheduleTaskUid: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [row] = await db.insert(scheduledScans).values(input).$returningId();
  return row.id;
}
export async function bindScheduledScanTask(
  id: number,
  userId: number,
  scheduleTaskUid: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db
    .update(scheduledScans)
    .set({ scheduleTaskUid })
    .where(and(eq(scheduledScans.id, id), eq(scheduledScans.userId, userId)));
}
export async function getScheduledScanByTaskUid(taskUid: string) {
  const db = await getDb();
  if (!db) return undefined;
  return (
    await db
      .select()
      .from(scheduledScans)
      .where(eq(scheduledScans.scheduleTaskUid, taskUid))
      .limit(1)
  )[0];
}
export async function setScheduledScanEnabled(
  id: number,
  userId: number,
  enabled: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db
    .update(scheduledScans)
    .set({ enabled })
    .where(and(eq(scheduledScans.id, id), eq(scheduledScans.userId, userId)));
}
