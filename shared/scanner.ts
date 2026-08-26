export type SupportedLanguage = "c" | "cpp" | "python" | "java" | "unknown";
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
  explanation?: string;
};

export type ScanInputFile = { path: string; content: string };
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
};

const extMap: Record<string, SupportedLanguage> = {
  c: "c", h: "c", cc: "cpp", cpp: "cpp", cxx: "cpp", hpp: "cpp", py: "python", java: "java", kt: "java", kts: "java",
};
function languageFor(path: string): SupportedLanguage {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return extMap[ext] ?? "unknown";
}
function finding(ruleId: string, severity: Severity, category: Finding["category"], title: string, message: string, remediation: string, file: string, line: number, language: SupportedLanguage, snippet: string): Finding {
  return { id: `${ruleId}-${file}-${line}`.replace(/[^a-zA-Z0-9_-]/g, "_"), ruleId, severity, category, title, message, remediation, file, line, language, snippet: snippet.trim().slice(0, 180) };
}

export function scanFiles(projectName: string, files: ScanInputFile[]): ScanReport {
  const started = Date.now();
  const findings: Finding[] = [];
  const supported = files.filter((file) => languageFor(file.path) !== "unknown");
  const seenLines = new Map<string, { file: string; line: number; language: SupportedLanguage }>();
  for (const file of supported) {
    const language = languageFor(file.path);
    const lines = file.content.split(/\r?\n/);
    lines.forEach((raw, index) => {
      const line = index + 1;
      const text = raw.trim();
      const lower = text.toLowerCase();
      if (/(password|passwd|secret|api[_-]?key|token)\s*[:=]\s*["'][^"']{6,}["']/i.test(text)) {
        findings.push(finding("SEC001", "critical", "security", "Hard-coded secret", "A credential-like value is embedded directly in source code.", "Move the value to a secret manager or environment variable, then rotate the exposed credential.", file.path, line, language, raw));
      }
      const risky: Array<[RegExp, string, Severity, string, string]> = [
        [/\b(eval|exec)\s*\(/i, "Dynamic code execution", "high", "Dynamic execution can execute attacker-controlled input.", "Avoid dynamic execution; use a safe parser or strict allow-list."],
        [/\b(system|popen)\s*\(/i, "Shell command execution", "high", "Shell execution can enable command injection when input is not strictly validated.", "Use a safe process API with argument arrays and validate all inputs."],
        [/\b(strcpy|strcat|sprintf|gets)\s*\(/i, "Unsafe C/C++ memory API", "high", "This API can cause buffer overflow or memory corruption.", "Use bounded alternatives and validate buffer sizes."],
        [/\b(Math\.random|java\.util\.Random)\b/i, "Non-cryptographic randomness", "medium", "General-purpose randomness is not suitable for secrets or security tokens.", "Use a cryptographically secure random generator."],
      ];
      for (const [pattern, title, severity, message, remediation] of risky) if (pattern.test(text)) findings.push(finding(`SEC${title.replace(/[^A-Z]/gi, "").slice(0, 5).toUpperCase()}`, severity, "security", title, message, remediation, file.path, line, language, raw));
      if (/\b(TODO|FIXME|HACK)\b/i.test(text)) findings.push(finding("QLT001", "low", "quality", "Unresolved work marker", "This line contains a TODO, FIXME, or HACK marker.", "Resolve the marker or track it as a documented issue before release.", file.path, line, language, raw));
      const normalized = text.replace(/\s+/g, " ").trim();
      if (normalized.length >= 50 && !normalized.startsWith("//") && !normalized.startsWith("#") && !normalized.startsWith("/*")) {
        const previous = seenLines.get(normalized);
        if (previous && previous.file !== file.path) findings.push(finding("DUP001", "low", "duplication", "Repeated code signal", `This line closely matches ${previous.file}:${previous.line} in another file.`, "Extract shared logic into a reusable function or module.", file.path, line, language, raw));
        else seenLines.set(normalized, { file: file.path, line, language });
      }
      if (text.length > 140) findings.push(finding("QLT002", "info", "quality", "Long source line", "Long lines reduce readability and can hide defects during review.", "Split the expression or apply the language formatter.", file.path, line, language, raw));
      if (language === "python" && /except\s*:/i.test(lower)) findings.push(finding("QLT003", "medium", "quality", "Broad exception handler", "Catching every exception can hide defects and make failures difficult to diagnose.", "Catch the narrowest expected exception types and log meaningful context.", file.path, line, language, raw));
    });
  }
  const order: Severity[] = ["critical", "high", "medium", "low", "info"];
  findings.sort((a, b) => order.indexOf(a.severity) - order.indexOf(b.severity) || a.file.localeCompare(b.file) || a.line - b.line);
  const summary = { critical: 0, high: 0, medium: 0, low: 0, info: 0 } as Record<Severity, number>;
  findings.forEach((item) => summary[item.severity]++);
  return { schemaVersion: "1.0", projectName: projectName || "Untitled project", createdAt: new Date().toISOString(), durationMs: Date.now() - started, filesScanned: supported.length, languages: Array.from(new Set(supported.map((file) => languageFor(file.path)))), summary, findings };
}

export function demoFiles(): ScanInputFile[] {
  return [
    { path: "src/auth.py", content: 'API_KEY = "sk-live-example-secret"\ntry:\n    token = eval(user_input)\nexcept:\n    pass\n# TODO: replace with vault' },
    { path: "src/legacy.cpp", content: 'void copy(char* input) {\n  char target[32];\n  strcpy(target, input);\n  system(input);\n}' },
    { path: "src/Token.java", content: 'String password = "demo-password-12345";\nRandom r = new Random();' },
  ];
}
