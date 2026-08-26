import type { ScanInputFile } from "../../shared/scanner";

export const vulnerableProject: ScanInputFile[] = [
  { path: "src/auth.py", content: 'API_KEY = "demo-secret-123456"\nvalue = eval(input())\nos.system(user_command)' },
  { path: "src/native.c", content: "void run(char *input) { system(input); strcpy(buffer, input); }" },
  { path: "src/Token.java", content: 'String password = "password-123456";' },
];

export const cleanProject: ScanInputFile[] = [
  { path: "src/auth.py", content: "import secrets\nnonce = secrets.token_urlsafe(24)\ndef load_user(user_id: str):\n    return repository.find(user_id)" },
  { path: "src/native.cpp", content: "std::string read_value(const std::string& input) { return input.substr(0, 128); }" },
  { path: "src/Token.java", content: "SecureRandom random = new SecureRandom();\nString token = HexFormat.of().formatHex(random.generateSeed(32));" },
];

export const mixedProject: ScanInputFile[] = [
  { path: "src/client.tsx", content: "export function render(value: string) { return <span>{value}</span>; }" },
  { path: "src/service.py", content: "def normalize(value):\n    return value.strip()" },
  { path: "src/engine.cpp", content: "std::string normalize(const std::string& value) { return value; }" },
  { path: "src/Worker.java", content: "public final class Worker { public void run() { } }" },
];

export const safeEdgeProject: ScanInputFile[] = [
  { path: "src/compressor.ts", content: "await ffmpeg.exec(['-i', inputName, outputName]);" },
  { path: "src/Storage.tsx", content: "<span>System ({sysPercent}%)</span>" },
  { path: "src/profile.ts", content: "const username = 'user-' + Math.random();" },
  { path: "src/reactions.ts", content: "if (reaction && Math.random() > 0.25) return null;" },
];
