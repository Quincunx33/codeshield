public class CodeShieldDesktopTest {
  public static void main(String[] args) {
    String body = "{\"aiSignals\":[{\"file\":\"src/app.ts\",\"score\":72,\"confidence\":\"high\",\"reasons\":[\"tutorial-style phrasing\"]}]}";
    String output = CodeShieldDesktop.aiSummary(body);
    String payload = CodeShieldDesktop.buildPayload("API_KEY = \"secret\"\nvalue = eval(input)");
    if (!payload.startsWith("{\"json\":{\"projectName\":" ) || payload.contains("\"0\"")) {
      throw new AssertionError("Unexpected tRPC payload: " + payload);
    }
    if (!output.contains("src/app.ts") || !output.contains("72%") || !output.contains("high confidence") || !output.contains("tutorial-style phrasing")) {
      throw new AssertionError("AI signal summary missing expected fields: " + output);
    }
  }
}
