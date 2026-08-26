# Second-pass UI smoke verification

On 2026-08-26, the deployed dashboard was opened and a real anonymous pasted-code scan was submitted through the visible form. Input: `src/security.py` containing an intentional hard-coded secret and `eval(user_input)`. The dashboard transitioned from “Awaiting your first scan” to the real report view and displayed 1 critical finding, 1 high finding, 0 medium, 0 low, and 0 info across 1 supported file. JSON, HTML, Reset, severity filters, and AI context controls were visible. No browser-console or failed-network errors were found in the runtime logs.
