import unittest
from codeshield import format_ai_signals

class AiOutputTest(unittest.TestCase):
    def test_formats_signal_with_disclaimer_and_evidence(self):
        output = format_ai_signals({'aiSignals': [{'file': 'src/app.ts', 'score': 72, 'confidence': 'high', 'reasons': ['tutorial-style phrasing']}]})
        self.assertIn('72% high', output)
        self.assertIn('src/app.ts', output)
        self.assertIn('pattern-based, not authorship proof', output)

if __name__ == '__main__': unittest.main()
