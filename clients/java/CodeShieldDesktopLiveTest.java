import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

public class CodeShieldDesktopLiveTest {
  public static void main(String[] args) throws Exception {
    String server = System.getenv().getOrDefault("CODESHIELD_SERVER", "http://127.0.0.1:3000/api/trpc");
    String payload = CodeShieldDesktop.buildPayload("API_KEY = \"java-live-secret\"");
    HttpRequest request = HttpRequest.newBuilder(URI.create(server + "/scanner.run"))
      .timeout(Duration.ofSeconds(10))
      .header("Content-Type", "application/json")
      .POST(HttpRequest.BodyPublishers.ofString(payload, StandardCharsets.UTF_8))
      .build();
    HttpClient client = HttpClient.newBuilder().version(HttpClient.Version.HTTP_1_1).connectTimeout(Duration.ofSeconds(5)).build();
    HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
    if (response.statusCode() != 200 || !response.body().contains("Hard-coded secret")) {
      throw new AssertionError("Unexpected scanner response: " + response.statusCode());
    }
    System.out.println("Java live contract passed");
  }
}
