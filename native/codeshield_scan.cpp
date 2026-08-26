#include <fstream>
#include <iostream>
#include <regex>
#include <string>

// Lightweight native foundation for future AST-backed rules. The web engine remains
// the contract authority; this executable emits compatible line-level JSON findings.
int main(int argc, char** argv) {
  if (argc < 2) { std::cerr << "usage: codeshield_scan <source-file>\n"; return 2; }
  std::ifstream input(argv[1]); if (!input) { std::cerr << "cannot open source file\n"; return 1; }
  std::string line; int lineNo = 0; std::regex risky(R"(\b(strcpy|strcat|sprintf|gets|system|popen)\s*\()");
  while (std::getline(input, line)) { ++lineNo; if (std::regex_search(line, risky)) {
    std::cout << "{\"schemaVersion\":\"1.0\",\"ruleId\":\"NATIVE001\",\"severity\":\"high\",\"category\":\"security\",\"file\":\"" << argv[1] << "\",\"line\":" << lineNo << ",\"title\":\"Risky native API\",\"message\":\"A memory-unsafe or shell-execution API was detected.\"}\n";
  }}
  return 0;
}
