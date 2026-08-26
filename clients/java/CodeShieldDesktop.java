import javax.swing.*;
import java.awt.*;
import java.net.URI;
import java.net.http.*;
import java.nio.charset.StandardCharsets;

public class CodeShieldDesktop {
  static String server = System.getenv().getOrDefault("CODESHIELD_SERVER", "http://localhost:3000/api/trpc");
  static String cookie = System.getenv().getOrDefault("CODESHIELD_COOKIE", "");
  static JTextArea output = new JTextArea();
  static String jsonEscape(String value) { return value.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n"); }
  static void scan() {
    String source = "API_KEY = \\\"desktop-demo-secret\\\"\\nvalue = eval(user_input)";
    String payload = "{\\\"json\\\":{\\\"0\\\":{\\\"json\\\":{\\\"projectName\\\":\\\"Java desktop sample\\\",\\\"files\\\":[{\\\"path\\\":\\\"src/Sample.py\\\",\\\"content\\\":\\\"" + jsonEscape(source) + "\\\"}]}}}}";
    try {
      HttpRequest.Builder builder = HttpRequest.newBuilder(URI.create(server + "/scanner.run")).header("Content-Type", "application/json");
      if (!cookie.isBlank()) builder.header("Cookie", cookie);
      HttpRequest request = builder.POST(HttpRequest.BodyPublishers.ofString(payload, StandardCharsets.UTF_8)).build();
      HttpResponse<String> response = HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString());
      String body = response.body();
      String summary = "Status: " + response.statusCode() + "\\n" +
        "Critical: " + count(body, "critical") + "  High: " + count(body, "high") + "  Medium: " + count(body, "medium") + "\\n\\n";
      String access = cookie.isBlank() ? "Anonymous scan · login/session is only needed for saved history and team features\\n\\n" : "Authenticated scan · this result can be saved to history\\n\\n";
      output.setText(access + "CodeShield Mix scan response\\n\\n" + summary + body);
    } catch (Exception error) { output.setText("Scan failed: " + error.getMessage()); }
  }
  static int count(String text, String needle) { int total = 0, at = 0; while ((at = text.indexOf(needle, at)) >= 0) { total++; at += needle.length(); } return total; }
  public static void main(String[] args) {
    SwingUtilities.invokeLater(() -> {
      JFrame frame = new JFrame("CodeShield Mix · Java client"); frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE); frame.setSize(820, 560);
      JPanel top = new JPanel(new BorderLayout(12, 12)); JLabel title = new JLabel("CodeShield Mix  /  Desktop scanner · no login required"); title.setFont(title.getFont().deriveFont(Font.BOLD, 18f)); JButton button = new JButton("Run shared scan"); button.addActionListener(e -> { button.setEnabled(false); new Thread(() -> { scan(); SwingUtilities.invokeLater(() -> button.setEnabled(true)); }).start(); }); top.add(title, BorderLayout.WEST); top.add(button, BorderLayout.EAST);
      output.setEditable(false); output.setFont(new Font(Font.MONOSPACED, Font.PLAIN, 13)); frame.add(top, BorderLayout.NORTH); frame.add(new JScrollPane(output), BorderLayout.CENTER); frame.setLocationRelativeTo(null); frame.setVisible(true);
    });
  }
}
