public class CodeShieldDesktopTest {
  public static void main(String[] args) {
    String body = "{\"aiSignals\":[{\"file\":\"src/app.ts\",\"score\":72,\"confidence\":\"high\",\"reasons\":[\"tutorial-style phrasing\"]}]}";
    String output = CodeShieldDesktop.aiSummary(body);
    String golden;
    try { golden = java.nio.file.Files.readString(java.nio.file.Path.of("clients/golden-report.json")); } catch (Exception error) { throw new AssertionError("Golden report fixture missing", error); }
    String quality = CodeShieldDesktop.qualitySummary(golden);
    String summary = CodeShieldDesktop.summaryText(golden);
    if (!quality.contains("Code quality: 10.0/10 (excellent)") || !quality.contains("AI-generated likelihood reported separately")) {
      throw new AssertionError("Unexpected quality summary: " + quality);
    }
    if (!summary.equals("Critical: 1  High: 1  Medium: 0  Low: 0  Info: 0")) {
      throw new AssertionError("Unexpected summary: " + summary);
    }
    String payload = CodeShieldDesktop.buildPayload("API_KEY = \\\"secret\\\"\\nvalue = eval(input)");
    if (!payload.startsWith("{\"json\":{\"projectName\":" ) || payload.contains("\"0\"")) {
      throw new AssertionError("Unexpected tRPC payload: " + payload);
    }
    if (!output.contains("src/app.ts") || !output.contains("72%") || !output.contains("high confidence") || !output.contains("tutorial-style phrasing")) {
      throw new AssertionError("AI signal summary missing expected fields: " + output);
    }
  }
}
