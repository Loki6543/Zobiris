"""Standard-library tests for the read-only ZOBIRIS budget tool."""
import importlib.util
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

MODULE = Path(__file__).with_name("zobiris_budget.py")
spec = importlib.util.spec_from_file_location("zobiris_budget", MODULE)
budget = importlib.util.module_from_spec(spec)
spec.loader.exec_module(budget)


class BudgetTests(unittest.TestCase):
    def test_estimator_rounds_up(self):
        self.assertEqual(budget.estimate_tokens("a"), 1)
        self.assertEqual(budget.estimate_tokens("a" * 32), 10)

    def test_excludes_archives_and_vendor(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "ok.md").write_text("hello " * 100)
            (root / "archive.zip").write_bytes(b"bad" * 100)
            (root / "node_modules").mkdir()
            (root / "node_modules" / "no.js").write_text("secret")
            res = budget.analyze(root, ".", None, 250_000, None, 0, 10)
            self.assertEqual(res["included_files"], 1)
            self.assertEqual(res["skipped_files"], 1)

    def test_cache_eligibility_is_not_hit(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "large.md").write_text("a" * 3000)
            res = budget.analyze(root, ".", None, 250_000, None, 0, 10)
            self.assertTrue(res["cache_eligible_by_size_only"])
            self.assertFalse(res["cache_hit_confirmed"])

    def test_policy_exit_code_and_json(self):
        with tempfile.TemporaryDirectory() as tmp:
            (Path(tmp) / "code.py").write_text("x" * 1000)
            proc = subprocess.run(
                [sys.executable, str(MODULE), "--target", ".",
                 "--max-fable-uncached", "10", "--json"],
                cwd=tmp, capture_output=True, text=True,
            )
            self.assertEqual(proc.returncode, 2)
            self.assertTrue(json.loads(proc.stdout)["policy_exceeded"])


if __name__ == "__main__":
    unittest.main()
