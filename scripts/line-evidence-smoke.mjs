import AdmZip from "adm-zip";

const base = process.env.CODESHIELD_BASE_URL || "http://127.0.0.1:3000/api/trpc";
const pastedPayload = { json: { projectName: "line-evidence-pasted", files: [{ path: "src/input.py", content: 'API_KEY = "secret-value-123456"\nvalue = eval(user_input)' }] } };
const pastedResponse = await fetch(`${base}/scanner.run`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(pastedPayload) });
const pastedBody = await pastedResponse.json();
const pasted = pastedBody.result?.data?.json ?? pastedBody;
if (!pastedResponse.ok || pastedBody.error) throw new Error(`pasted scan failed: ${JSON.stringify(pastedBody).slice(0, 400)}`);
const pastedFinding = pasted.findings.find((item) => item.ruleId === "SEC001");
if (pastedFinding?.snippet !== 'API_KEY = "secret-value-123456"' || pastedFinding.line !== 1) throw new Error("pasted scan did not preserve the exact source line");

const zip = new AdmZip();
zip.addFile("src/first.ts", Buffer.from("const sharedWorkflow = createWorkflow(statusCode, userMessage, requestId, correlationId, retryAfter, securityContext);"));
zip.addFile("src/second.ts", Buffer.from("const sharedWorkflow = createWorkflow(statusCode, userMessage, requestId, correlationId, retryAfter, securityContext);"));
const zipPayload = { json: { projectName: "line-evidence-zip", files: [], archiveBase64: zip.toBuffer().toString("base64"), archiveName: "line-evidence.zip" } };
const zipResponse = await fetch(`${base}/scanner.run`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(zipPayload) });
const zipBody = await zipResponse.json();
const zipped = zipBody.result?.data?.json ?? zipBody;
if (!zipResponse.ok || zipBody.error) throw new Error(`ZIP scan failed: ${JSON.stringify(zipBody).slice(0, 400)}`);
const duplicate = zipped.findings.find((item) => item.ruleId === "DUP001");
if (duplicate?.snippet !== duplicate?.related?.snippet || duplicate?.related?.file !== "src/first.ts") throw new Error("ZIP scan did not preserve both authoritative duplicate source lines");
console.log(JSON.stringify({ pasted: { filesScanned: pasted.filesScanned, findingLine: pastedFinding.line, snippet: pastedFinding.snippet }, zip: { filesScanned: zipped.filesScanned, duplicateFile: duplicate.file, duplicateLine: duplicate.line, relatedFile: duplicate.related.file, relatedLine: duplicate.related.line, snippetsMatch: duplicate.snippet === duplicate.related.snippet } }, null, 2));
