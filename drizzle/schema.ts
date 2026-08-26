import { int, json, longtext, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const scans = mysqlTable("scans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectName: varchar("projectName", { length: 180 }).notNull(),
  status: mysqlEnum("status", ["completed", "failed"]).default("completed").notNull(),
  filesScanned: int("filesScanned").notNull(),
  criticalCount: int("criticalCount").notNull().default(0),
  highCount: int("highCount").notNull().default(0),
  mediumCount: int("mediumCount").notNull().default(0),
  lowCount: int("lowCount").notNull().default(0),
  infoCount: int("infoCount").notNull().default(0),
  sourceKey: varchar("sourceKey", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const findings = mysqlTable("findings", {
  id: int("id").autoincrement().primaryKey(),
  scanId: int("scanId").notNull(),
  ruleId: varchar("ruleId", { length: 32 }).notNull(),
  severity: mysqlEnum("severity", ["critical", "high", "medium", "low", "info"]).notNull(),
  category: mysqlEnum("category", ["security", "quality", "duplication"]).notNull(),
  title: varchar("title", { length: 240 }).notNull(),
  message: text("message").notNull(),
  remediation: text("remediation").notNull(),
  explanation: text("explanation"),
  file: varchar("file", { length: 500 }).notNull(),
  line: int("line").notNull(),
  language: varchar("language", { length: 32 }).notNull(),
  snippet: text("snippet"),
});

export const teams = mysqlTable("teams", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  ownerId: int("ownerId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export const teamMembers = mysqlTable("teamMembers", {
  id: int("id").autoincrement().primaryKey(),
  teamId: int("teamId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("teamRole", ["owner", "admin", "member"]).default("member").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export const scheduledScans = mysqlTable("scheduledScans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectName: varchar("projectName", { length: 180 }).notNull(),
  repositoryUrl: varchar("repositoryUrl", { length: 500 }).notNull(),
  cronExpression: varchar("cronExpression", { length: 80 }).notNull(),
  scheduleTaskUid: varchar("scheduleTaskUid", { length: 65 }),
  enabled: int("enabled").notNull().default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const scanSources = mysqlTable("scanSources", {
  id: int("id").autoincrement().primaryKey(),
  scanId: int("scanId").notNull(),
  storageKey: varchar("storageKey", { length: 500 }).notNull(),
  originalName: varchar("originalName", { length: 255 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Scan = typeof scans.$inferSelect;
export type FindingRow = typeof findings.$inferSelect;
