import fs from "node:fs";
import AdmZip from "adm-zip";
import { scanFiles } from "../shared/scanner";

const archivePath = process.argv[2];
if (!archivePath) throw new Error("Archive path is required");
const supported = /\.(c|h|cc|cpp|cxx|hpp|py|java|kt|kts|js|jsx|ts|tsx)$/i;
const zip = new AdmZip(archivePath);
const files = zip.getEntries().filter((entry) => !entry.isDirectory && supported.test(entry.entryName)).map((entry) => ({ path: entry.entryName, content: entry.getData().toString("utf8") }));
const report = scanFiles("CipherChat6", files);
console.log(JSON.stringify({ filesScanned: report.filesScanned, summary: report.summary, top: report.findings.slice(0, 12).map(({ severity, title, file, line }) => ({ severity, title, file, line })) }, null, 2));
