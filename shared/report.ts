import type { ScanReport } from "./scanner";

export function serializeJsonReport(report: ScanReport): string { return JSON.stringify(report, null, 2); }
export function serializeHtmlReport(report: ScanReport): string {
  const rows = report.findings.map((finding) => `<li><b>${finding.severity.toUpperCase()} · ${escapeHtml(finding.title)}</b><br/>${escapeHtml(finding.file)}:${finding.line}<br/>${escapeHtml(finding.message)}<br/><small>${escapeHtml(finding.remediation)}</small></li>`).join("");
  return `<html><head><meta charset="utf-8"><title>${escapeHtml(report.projectName)}</title><style>body{font:15px system-ui;background:#0b1220;color:#e8eef7;padding:32px}li{margin:12px 0;padding:14px;border:1px solid #25344c;border-radius:10px}b{color:#67e8f9}</style></head><body><h1>${escapeHtml(report.projectName)}</h1><p>${report.filesScanned} files scanned · ${report.findings.length} findings</p><ol>${rows}</ol></body></html>`;
}
function escapeHtml(value: string): string { return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character); }
