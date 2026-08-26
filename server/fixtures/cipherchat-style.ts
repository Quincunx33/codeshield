import type { ScanInputFile } from "../../shared/scanner";

export const cipherchatStyleFiles: ScanInputFile[] = [
  { path: "src/StorageCacheManager.tsx", content: "<span>System ({sysPercent}%)</span>" },
  { path: "src/compressor.ts", content: "await ffmpeg.exec(['-i', inputName, outputName]);" },
  { path: "src/App.tsx", content: "const username = 'user-' + Math.random();" },
  { path: "functions/api/gemini/chat.ts", content: "if (reaction && Math.random() > 0.25) return null;" },
  { path: "functions/api/unsafe.py", content: "import os\nos.system(command)" },
  { path: "functions/api/auth.ts", content: 'const API_KEY = "secret-value-123";\nconst result = eval(input);' },
];

export const cipherchatExpected = {
  filesScanned: 6,
  securitySafeFiles: ["src/StorageCacheManager.tsx", "src/compressor.ts", "src/App.tsx", "functions/api/gemini/chat.ts"],
  truePositiveFile: "functions/api/unsafe.py",
  secretFile: "functions/api/auth.ts",
  maxCritical: 1,
  maxHigh: 2,
  maxMedium: 0,
};
