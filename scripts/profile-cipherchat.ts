import AdmZip from "adm-zip";
import { scanFiles } from "../shared/scanner";

const archivePath = process.argv[2];
if (!archivePath) throw new Error("Archive path is required");
const supported = /\.(c|h|cc|cpp|cxx|hpp|py|java|kt|kts|js|jsx|ts|tsx)$/i;
const zip = new AdmZip(archivePath);
const files = zip.getEntries().filter((entry) => !entry.isDirectory && supported.test(entry.entryName)).map((entry) => ({ path: entry.entryName, content: entry.getData().toString("utf8") }));
const report = scanFiles("CipherChat6", files);
const grouped = new Map<string, { severity: string; count: number; examples: string[] }>();
for (const item of report.findings) {
  const key = `${item.ruleId} · ${item.title}`;
  const group = grouped.get(key) ?? { severity: item.severity, count: 0, examples: [] };
  group.count++;
  if (group.examples.length < 8) group.examples.push(`${item.file}:${item.line} :: ${item.snippet ?? ""}`);
  grouped.set(key, group);
}
console.log(JSON.stringify({ filesScanned: report.filesScanned, summary: report.summary, groups: [...grouped.entries()].sort((a, b) => b[1].count - a[1].count).map(([name, value]) => ({ name, ...value })) }, null, 2));
