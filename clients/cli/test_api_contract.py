import pathlib
import sys
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).parent))
import codeshield


class CliApiContractTest(unittest.TestCase):
    def test_uses_single_procedure_trpc_payload(self):
        payload = codeshield.build_payload("contract", [{"path": "main.py", "content": "print(1)"}])
        self.assertEqual(payload, {"json": {"projectName": "contract", "files": [{"path": "main.py", "content": "print(1)"}]}})
        self.assertNotIn("0", payload["json"])


if __name__ == "__main__":
    unittest.main()
