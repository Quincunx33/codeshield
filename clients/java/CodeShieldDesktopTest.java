public class CodeShieldDesktopTest {
  public static void main(String[] args) {
    String body = "{\"aiSignals\":[{\"file\":\"src/app.ts\",\"score\":72,\"confidence\":\"high\",\"reasons\":[\"tutorial-style phrasing\"]}]}";
    String output = CodeShieldDesktop.aiSummary(body);
    if (!output.contains("src/app.ts") || !output.contains("72%") || !output.contains("high confidence") || !output.contains("tutorial-style phrasing")) {
      throw new AssertionError("AI signal summary missing expected fields: " + output);
    }
  }
}
