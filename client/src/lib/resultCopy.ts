import type { Finding, ScanReport } from "../../../shared/scanner";

export type ReportOutcome = { tone: "urgent" | "review" | "quality" | "safe"; title: string; body: string; action: string };

export function reportOutcome(report: ScanReport): ReportOutcome {
  const urgent = report.summary.critical + report.summary.high;
  if (urgent > 0) return { tone: "urgent", title: `${urgent} urgent ${urgent === 1 ? "issue needs" : "issues need"} attention`, body: "Do not ship this code yet. Start with the red and orange items below, then run the scan again.", action: "Fix urgent issues first" };
  if (report.summary.medium > 0) return { tone: "review", title: "Review recommended before release", body: "No critical or high-risk issue was found, but medium-risk items still deserve a developer review.", action: "Review medium-risk items" };
  if (report.findings.length > 0) return { tone: "quality", title: "No urgent security risk found", body: "The remaining items are quality or informational signals. They are useful cleanup tasks, not emergency security blockers.", action: "Improve code quality" };
  return { tone: "safe", title: "No issues found in this scan", body: "The scanned files passed the current security and quality checks. Keep dependencies and runtime behavior under review too.", action: "Looks good" };
}

export function plainFindingTitle(item: Finding) {
  if (item.title === "Hard-coded secret") return "A secret is exposed in the code";
  if (item.title === "Dynamic code execution") return "The code can execute text as instructions";
  if (item.title === "Shell command execution") return "The code runs a system command";
  if (item.title === "Unsafe C/C++ memory API") return "This memory operation may overflow a buffer";
  if (item.title === "Broad exception handler") return "Errors may be hidden by a broad catch";
  if (item.title === "Repeated code signal") return "The same logic appears in another file";
  if (item.title === "Unresolved work marker") return "A TODO or FIXME is still open";
  return item.title;
}

export function findingImpact(item: Finding) {
  if (item.category === "security") return item.severity === "critical" ? "A credential may be exposed. Treat it as compromised and rotate it." : "An attacker may influence this behavior if input is not tightly controlled.";
  if (item.category === "duplication") return "Changes may need to be repeated in multiple places, increasing maintenance risk.";
  return "This can make the code harder to maintain or review over time.";
}
