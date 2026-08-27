export type SupportedLanguage = "c" | "cpp" | "python" | "java" | "javascript" | "typescript" | "unknown";
export type Severity = "critical" | "high" | "medium" | "low" | "info";

export type Finding = {
  id: string;
  ruleId: string;
  severity: Severity;
  category: "security" | "quality" | "duplication";
  title: string;
  message: string;
  remediation: string;
  file: string;
  line: number;
  language: SupportedLanguage;
  snippet?: string;
  related?: { file: string; line: number; snippet: string };
  explanation?: string;
};

export type ScanInputFile = { path: string; content: string };

export function deriveProjectName(providedName: string | undefined, archiveName?: string): string {
  const explicit = providedName?.trim();
  if (explicit) return explicit;
  const derived = archiveName?.replace(/\.zip$/i, "").replace(/[-_]+/g, " ").trim();
  return derived || "Uploaded archive";
}
export type AiSignal = { file: string; lineStart: number; lineEnd: number; evidence: string; score: number; confidence: "low" | "medium" | "high"; reasons: string[]; scoreBreakdown: { commentDensity: number; phrasing: number; unresolvedMarkers: number; formatting: number; breadth: number }; verification: string; remediation: string };
export type QualityScore = { score: number; label: "excellent" | "good" | "needs-attention" | "poor"; breakdown: { maintainability: number; duplication: number; hygiene: number }; findingsConsidered: number; basis: string };

export type ScanReport = {
  schemaVersion: "1.0";
  scanId?: number;
  projectName: string;
  createdAt: string;
  durationMs: number;
  filesScanned: number;
  languages: SupportedLanguage[];
  summary: Record<Severity, number>;
  findings: Finding[];
  qualityScore: QualityScore;
  aiSignals: AiSignal[];
};

const extMap: Record<string, SupportedLanguage> = {
  c: "c", h: "c", cc: "cpp", cpp: "cpp", cxx: "cpp", hpp: "cpp", py: "python", java: "java", kt: "java", kts: "java", js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript",
};
function languageFor(path: string): SupportedLanguage {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return extMap[ext] ?? "unknown";
}
function finding(ruleId: string, severity: Severity, category: Finding["category"], title: string, message: string, remediation: string, file: string, line: number, language: SupportedLanguage, snippet: string, related?: Finding["related"]): Finding {
  return { id: `${ruleId}-${file}-${line}`.replace(/[^a-zA-Z0-9_-]/g, "_"), ruleId, severity, category, title, message, remediation, file, line, language, snippet: snippet.trim().slice(0, 180), ...(related ? { related: { ...related, snippet: related.snippet.trim().slice(0, 180) } } : {}) };
}

export function scanFiles(projectName: string, files: ScanInputFile[]): ScanReport {
  const started = Date.now();
  const findings: Finding[] = [];
  const aiSignals: AiSignal[] = [];
  const supported = files.filter((file) => languageFor(file.path) !== "unknown");
  const seenLines = new Map<string, { file: string; line: number; language: SupportedLanguage; snippet: string }>();
  const duplicateCounts = new Map<string, number>();
  for (const file of supported) {
    const language = languageFor(file.path);
    const lines = file.content.split(/\r?\n/);
    let inBlockComment = false;
    lines.forEach((raw, index) => {
      const line = index + 1;
      const text = raw.trim();
      const lower = text.toLowerCase();
      const commentOnly = inBlockComment || /^(\/\/|#|\/\*|\*|\*\/)/.test(text);
      if (!inBlockComment && /^\/\*/.test(text) && !text.includes("*/")) inBlockComment = true;
      if (inBlockComment && text.includes("*/")) inBlockComment = false;
      if (!commentOnly && /(password|passwd|secret|api[_-]?key|token)\s*[:=]\s*["'][^"']{6,}["']/i.test(text)) {
        findings.push(finding("SEC001", "critical", "security", "Hard-coded secret", "A credential-like value is embedded directly in source code.", "Move the value to a secret manager or environment variable, then rotate the exposed credential.", file.path, line, language, raw));
      }
      const risky: Array<[RegExp, string, Severity, string, string]> = [
        [/\b(eval|exec)\s*\(/i, "Dynamic code execution", "high", "Dynamic execution can execute attacker-controlled input.", "Avoid dynamic execution; use a safe parser or strict allow-list."],
        [/\b(system|popen)\s*\(/i, "Shell command execution", "high", "Shell execution can enable command injection when input is not strictly validated.", "Use a safe process API with argument arrays and validate all inputs."],
        [/\b(strcpy|strcat|sprintf|gets)\s*\(/i, "Unsafe C/C++ memory API", "high", "This API can cause buffer overflow or memory corruption.", "Use bounded alternatives and validate buffer sizes."],
      ];
      for (const [pattern, title, severity, message, remediation] of risky) {
        const safeFfmpegCall = title === "Dynamic code execution" && /\bffmpeg\.exec\s*\(/i.test(text);
        const shellCallInSupportedLanguage = title !== "Shell command execution" || ["c", "cpp", "python"].includes(language);
        if (!commentOnly && pattern.test(text) && !safeFfmpegCall && shellCallInSupportedLanguage) findings.push(finding(`SEC${title.replace(/[^A-Z]/gi, "").slice(0, 5).toUpperCase()}`, severity, "security", title, message, remediation, file.path, line, language, raw));
      }
      const contextStart = Math.max(0, index - 10);
      const contextEnd = Math.min(lines.length, index + 11);
      const randomSecurityContext = /\b(secret|token|password|passwd|nonce|session|auth|otp|csrf|credential|api[_-]?key)\b/i.test(lines.slice(contextStart, contextEnd).join("\n"));
      if (!commentOnly && /\b(Math\.random|java\.util\.Random)\b/i.test(text) && randomSecurityContext) findings.push(finding("SECNCR", "medium", "security", "Non-cryptographic randomness", "General-purpose randomness is used in a file that handles security-sensitive material; confirm it is not used for a secret or security token.", "Use a cryptographically secure random generator for secrets, tokens, nonces, and authentication values.", file.path, line, language, raw));
      if (/\b(TODO|FIXME|HACK)\b/i.test(text)) findings.push(finding("QLT001", "low", "quality", "Unresolved work marker", "This line contains a TODO, FIXME, or HACK marker.", "Resolve the marker or track it as a documented issue before release.", file.path, line, language, raw));
      const normalized = text.replace(/\s+/g, " ").trim();
      const boilerplateDuplicate = /^(import|export|from)\b|^return new Response\b|^['\"]?[A-Za-z-]+['\"]?\s*:\s*['\"]|^for \(|^if \(/i.test(normalized);
      const duplicateCandidate = normalized.length >= 80 && !boilerplateDuplicate && !normalized.startsWith("//") && !normalized.startsWith("#") && !normalized.startsWith("/*");
      if (duplicateCandidate) {
        const previous = seenLines.get(normalized);
        if (previous && previous.file !== file.path) {
          const pairKey = [previous.file, file.path].sort().join("::");
          const count = duplicateCounts.get(pairKey) ?? 0;
          if (count < 5) { findings.push(finding("DUP001", "low", "duplication", "Repeated code signal", `This line closely matches ${previous.file}:${previous.line} in another file.`, "Extract shared logic into a reusable function or module.", file.path, line, language, raw, { file: previous.file, line: previous.line, snippet: previous.snippet })); duplicateCounts.set(pairKey, count + 1); }
        } else seenLines.set(normalized, { file: file.path, line, language, snippet: raw });
      }
      const markupHeavy = /<\/?(svg|div|span|button|a)\b|\b(style|className|systemInstructionText)\s*=|^\s*`[^`]*<[^`]*`\s*;?$/i.test(text);
      if (text.length > 220 && !markupHeavy) findings.push(finding("QLT002", "info", "quality", "Long source line", "Very long executable lines reduce readability and can hide defects during review.", "Split the expression or apply the language formatter.", file.path, line, language, raw));
      if (language === "python" && /except\s*:/i.test(lower)) findings.push(finding("QLT003", "medium", "quality", "Broad exception handler", "Catching every exception can hide defects and make failures difficult to diagnose.", "Catch the narrowest expected exception types and log meaningful context.", file.path, line, language, raw));
    });
  }
  const order: Severity[] = ["critical", "high", "medium", "low", "info"];
  findings.sort((a, b) => order.indexOf(a.severity) - order.indexOf(b.severity) || a.file.localeCompare(b.file) || a.line - b.line);
  for (const file of supported) {
    const lines = file.content.split(/\r?\n/);
    const reasons: string[] = [];
    const scoreBreakdown = { commentDensity: 0, phrasing: 0, unresolvedMarkers: 0, formatting: 0, breadth: 0 };
    const commentLines = lines.filter((line) => /^\s*(\/\/|#|\/\*|\*)/.test(line)).length;
    if (commentLines >= 3 && commentLines / Math.max(lines.length, 1) > 0.25) { scoreBreakdown.commentDensity = 20; reasons.push("high explanatory-comment density"); }
    if (/\b(Here is|This function|This class|Generated by|AI-generated|implementation details|edge cases)\b/i.test(file.content)) { scoreBreakdown.phrasing = 25; reasons.push("tutorial-style or generation-marker phrasing"); }
    if (/\b(todo|fixme)\b/i.test(file.content) && /\b(robust|efficient|seamless|comprehensive)\b/i.test(file.content)) { scoreBreakdown.unresolvedMarkers = 15; reasons.push("generic planning language paired with unresolved markers"); }
    const longLines = lines.filter((line) => line.trim().length > 120).length;
    if (longLines >= 2) { scoreBreakdown.formatting = 10; reasons.push("repeated long, uniformly formatted lines"); }
    if (lines.length >= 12 && reasons.length >= 1) scoreBreakdown.breadth = 10;
    const score = Math.min(100, Object.values(scoreBreakdown).reduce((sum, value) => sum + value, 0));
    if (score >= 35) {
      const evidenceLine = lines.findIndex((line) => /\b(Here is|This function|This class|Generated by|AI-generated|implementation details|edge cases|todo|fixme)\b/i.test(line));
      const lineStart = evidenceLine >= 0 ? evidenceLine + 1 : 1;
      const lineEnd = Math.min(lines.length, lineStart + 2);
      aiSignals.push({ file: file.path, lineStart, lineEnd, evidence: lines.slice(lineStart - 1, lineEnd).join("\\n").trim().slice(0, 300), score, confidence: score >= 65 ? "high" : "medium", reasons, scoreBreakdown, verification: "Review the cited lines against commit history, author context, and generated-code policy before taking action.", remediation: "Keep human review and tests as the decision gate; rewrite or document generated sections where maintainability or ownership is unclear." });
    }
  }
  const summary = { critical: 0, high: 0, medium: 0, low: 0, info: 0 } as Record<Severity, number>;
  findings.forEach((item) => summary[item.severity]++);
  const qualityDeductions = { maintainability: 0, duplication: 0, hygiene: 0 };
  for (const item of findings) {
    if (item.category === "duplication") qualityDeductions.duplication += 0.25;
    else if (item.ruleId === "QLT003") qualityDeductions.maintainability += 1.0;
    else if (item.ruleId === "QLT001") qualityDeductions.hygiene += 0.4;
    else if (item.ruleId === "QLT002") qualityDeductions.maintainability += 0.15;
  }
  const deductions = qualityDeductions.maintainability + qualityDeductions.duplication + qualityDeductions.hygiene;
  const qualityScoreValue = Math.max(0, Math.min(10, Math.round((10 - deductions) * 10) / 10));
  const qualityScore: QualityScore = { score: qualityScoreValue, label: qualityScoreValue >= 9 ? "excellent" : qualityScoreValue >= 7 ? "good" : qualityScoreValue >= 5 ? "needs-attention" : "poor", breakdown: qualityDeductions, findingsConsidered: findings.filter((item) => item.category !== "security").length, basis: "Maintainability, duplication, and code-hygiene findings only; security risk and AI-likelihood signals are reported separately." };
  return { schemaVersion: "1.0", projectName: projectName || "Untitled project", createdAt: new Date().toISOString(), durationMs: Date.now() - started, filesScanned: supported.length, languages: Array.from(new Set(supported.map((file) => languageFor(file.path)))), summary, findings, qualityScore, aiSignals };
}

export function demoFiles(): ScanInputFile[] {
  return [
    { path: "src/auth.py", content: 'API_KEY = "sk-live-example-secret"\ntry:\n    token = eval(user_input)\nexcept:\n    pass\n# TODO: replace with vault' },
    { path: "src/legacy.cpp", content: 'void copy(char* input) {\n  char target[32];\n  strcpy(target, input);\n  system(input);\n}' },
    { path: "src/Token.java", content: 'String password = "demo-password-12345";\nRandom r = new Random();' },
  ];
}
