# CodeShield Mix Clients

The clients use the same versioned JSON report returned by the web server. The deterministic scanner remains server-side, while these clients are intentionally thin transports and presentation layers.

## CLI

```bash
python3 clients/cli/codeshield.py ./project --server https://your-codeshield.example/api/trpc --json report.json
```

The CLI walks supported source files, submits their content to the shared `scanner.run` endpoint, prints a readable severity summary, and optionally writes the exact JSON report.

## Java desktop

Compile with a JDK 17+:

```bash
javac clients/java/CodeShieldDesktop.java
java -cp clients/java CodeShieldDesktop
```

Set `CODESHIELD_SERVER` to the API base URL before launching. The Swing window submits a small project payload and displays severity totals plus file/line findings.
