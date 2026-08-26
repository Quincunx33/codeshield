import pathlib
import sys
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).parent))
import codeshield


class CliApiContractTest(unittest.TestCase):
    def test_formats_golden_report_summary(self):
        report = {"summary": {"critical": 1, "high": 1, "medium": 0, "low": 0, "info": 0}}
        rendered = codeshield.format_summary(report)
        self.assertIn("CRITICAL  1", rendered)
        self.assertIn("HIGH      1", rendered)
        self.assertIn("INFO      0", rendered)

    def test_uses_single_procedure_trpc_payload(self):
        payload = codeshield.build_payload("contract", [{"path": "main.py", "content": "print(1)"}])
        self.assertEqual(payload, {"json": {"projectName": "contract", "files": [{"path": "main.py", "content": "print(1)"}]}})
        self.assertNotIn("0", payload["json"])


if __name__ == "__main__":
    unittest.main()
