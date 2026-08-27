import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { scanFiles } from "../shared/scanner";

const root = process.argv[2] ?? ".";
const output = process.argv[3] ?? "codeshield-report.json";
const supported = /\.(c|h|cc|cpp|cxx|hpp|py|java|kt|kts|js|jsx|ts|tsx)$/i;
const ignored = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".webdev",
]);
const configuredIgnore = (process.env.CODESHIELD_IGNORE ?? "")
  .split(",")
  .map(value => value.trim())
  .filter(Boolean);

function collect(directory: string): { path: string; content: string }[] {
  const files: { path: string; content: string }[] = [];
  const walk = (current: string) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      if (
        ignored.has(entry.name) ||
        configuredIgnore.some(pattern =>
          relative(root, join(current, entry.name)).includes(pattern)
        )
      )
        continue;
      const absolute = join(current, entry.name);
      if (entry.isDirectory()) walk(absolute);
      else if (entry.isFile() && supported.test(entry.name))
        files.push({
          path: relative(root, absolute),
          content: readFileSync(absolute, "utf8").slice(0, 300_000),
        });
      if (files.length >= 400) return;
    }
  };
  walk(directory);
  return files;
}

const files = collect(root);
if (!files.length) {
  console.error("No supported source files found.");
  process.exit(2);
}
const report = scanFiles(root, files);
writeFileSync(output, JSON.stringify(report, null, 2));
console.log(
  `CodeShield local scan: ${report.filesScanned} files · ${report.findings.length} findings · report ${output}`
);
