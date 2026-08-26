import javax.swing.*;
import java.awt.*;
import java.net.URI;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

public class CodeShieldDesktop {
  static String server = System.getenv().getOrDefault("CODESHIELD_SERVER", "http://localhost:3000/api/trpc");
  static String cookie = System.getenv().getOrDefault("CODESHIELD_COOKIE", "");
  static JTextArea output = new JTextArea();
  static String jsonEscape(String value) { return value.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n"); }
  static String buildPayload(String source) { return "{\"json\":{\"projectName\":\"Java desktop sample\",\"files\":[{\"path\":\"src/Sample.py\",\"content\":\"" + jsonEscape(source) + "\"}]}}"; }
  static void scan() {
    String source = "API_KEY = \"desktop-demo-secret\"\nvalue = eval(user_input)";
    String payload = buildPayload(source);
    try {
      HttpRequest.Builder builder = HttpRequest.newBuilder(URI.create(server + "/scanner.run")).header("Content-Type", "application/json");
      if (!cookie.isBlank()) builder.header("Cookie", cookie);
      HttpRequest request = builder.POST(HttpRequest.BodyPublishers.ofString(payload, StandardCharsets.UTF_8)).build();
      HttpClient client = HttpClient.newBuilder().version(HttpClient.Version.HTTP_1_1).connectTimeout(Duration.ofSeconds(10)).build();
      HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
      String body = response.body();
      String summary = "Status: " + response.statusCode() + "\n" + summaryText(body) + "\n\n";
      String access = cookie.isBlank() ? "Anonymous scan · login/session is only needed for saved history and team features\n\n" : "Authenticated scan · this result can be saved to history\n\n";
      output.setText(access + aiSummary(body) + "CodeShield Mix scan response\n\n" + summary + body);
    } catch (Exception error) { output.setText("Scan failed: " + error.getMessage()); }
  }
  static int count(String text, String needle) { int total = 0, at = 0; while ((at = text.indexOf(needle, at)) >= 0) { total++; at += needle.length(); } return total; }
  static int summaryCount(String body, String key) { int summary = body.indexOf("\"summary\""); int field = summary < 0 ? -1 : body.indexOf("\"" + key + "\"", summary); if (field < 0) return 0; int colon = body.indexOf(':', field); int start = colon + 1; while (start < body.length() && !Character.isDigit(body.charAt(start))) start++; int end = start; while (end < body.length() && Character.isDigit(body.charAt(end))) end++; return start < end ? Integer.parseInt(body.substring(start, end)) : 0; }
  static String summaryText(String body) { return "Critical: " + summaryCount(body, "critical") + "  High: " + summaryCount(body, "high") + "  Medium: " + summaryCount(body, "medium") + "  Low: " + summaryCount(body, "low") + "  Info: " + summaryCount(body, "info"); }
  static String aiSummary(String body) {
    int start = body.indexOf("\"aiSignals\"");
    if (start < 0) return "";
    int end = body.indexOf("]", start);
    if (end >= 0) end++;
    else end = body.length();
    String section = body.substring(start, end);
    java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\"file\"\\s*:\\s*\"([^\"]+)\".*?\"score\"\\s*:\\s*(\\d+).*?\"confidence\"\\s*:\\s*\"([^\"]+)\".*?\"reasons\"\\s*:\\s*\\[(.*?)\\]", java.util.regex.Pattern.DOTALL);
    java.util.regex.Matcher matcher = pattern.matcher(section);
    StringBuilder result = new StringBuilder("AI-assisted code signals · pattern-based, not authorship proof\n");
    boolean found = false;
    while (matcher.find()) {
      found = true;
      String reasons = matcher.group(4).replace("\"", "").replace("\\,", ",");
      result.append("  ").append(matcher.group(1)).append(" · ").append(matcher.group(2)).append("% · ").append(matcher.group(3)).append(" confidence · ").append(reasons).append("\n");
    }
    return found ? result.append("\n").toString() : "";
  }
  public static void main(String[] args) {
    SwingUtilities.invokeLater(() -> {
      JFrame frame = new JFrame("CodeShield Mix · Java client"); frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE); frame.setSize(820, 560);
      JPanel top = new JPanel(new BorderLayout(12, 12)); JLabel title = new JLabel("CodeShield Mix  /  Desktop scanner · no login required"); title.setFont(title.getFont().deriveFont(Font.BOLD, 18f)); JButton button = new JButton("Run shared scan"); button.addActionListener(e -> { button.setEnabled(false); new Thread(() -> { scan(); SwingUtilities.invokeLater(() -> button.setEnabled(true)); }).start(); }); top.add(title, BorderLayout.WEST); top.add(button, BorderLayout.EAST);
      output.setEditable(false); output.setFont(new Font(Font.MONOSPACED, Font.PLAIN, 13)); frame.add(top, BorderLayout.NORTH); frame.add(new JScrollPane(output), BorderLayout.CENTER); frame.setLocationRelativeTo(null); frame.setVisible(true);
    });
  }
}
