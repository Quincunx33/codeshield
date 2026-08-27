#!/usr/bin/env node
import { readFile } from "node:fs/promises";

const order = ["info", "low", "medium", "high", "critical"];
const threshold = (process.env.CODESHIELD_FAIL_ON || "high").toLowerCase();
const reportPath = process.argv[2];

if (!order.includes(threshold)) {
  console.error(`Invalid CODESHIELD_FAIL_ON=${threshold}. Use one of: ${order.join(", ")}.`);
  process.exit(2);
}

const input = reportPath && reportPath !== "-" ? await readFile(reportPath, "utf8") : await new Promise((resolve, reject) => {
  let data = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => { data += chunk; });
  process.stdin.on("end", () => resolve(data));
  process.stdin.on("error", reject);
});

let report;
try {
  report = JSON.parse(input);
} catch {
  console.error("CodeShield quality gate could not parse the report as JSON.");
  process.exit(2);
}

const findings = Array.isArray(report.findings) ? report.findings : [];
const blocking = findings.filter((finding) => order.indexOf(String(finding.severity).toLowerCase()) >= order.indexOf(threshold));
console.log(`CodeShield quality gate: fail on ${threshold.toUpperCase()}+ · ${blocking.length} blocking finding(s) · ${findings.length} total`);
for (const finding of blocking.slice(0, 20)) console.log(`- ${String(finding.severity).toUpperCase()} ${finding.file}:${finding.line} ${finding.title}`);
if (blocking.length > 20) console.log(`- …and ${blocking.length - 20} more`);
process.exitCode = blocking.length ? 1 : 0;
