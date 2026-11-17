"""
Automated Test Suite for LLM Decision Engine, Audit Logging, and Multi-Hub Matrix.
"""

import json
import tempfile
import unittest
from pathlib import Path
from database.schema_and_seed import init_and_seed_db
from agents.llm_agent import LLMDecisionEngine


class TestLLMDecisionEngine(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp_dir = tempfile.TemporaryDirectory()
        cls.db_file = Path(cls.tmp_dir.name) / "test_llm.db"
        init_and_seed_db(cls.db_file, force_reset=True)
        cls.engine = LLMDecisionEngine(str(cls.db_file))

    @classmethod
    def tearDownClass(cls):
        cls.tmp_dir.cleanup()

    def test_deterministic_solver_with_audit_trail(self):
        """Verifies quantitative fallback executes shift and creates rich audit trail."""
        res = self.engine.run_cognitive_cycle()
        self.assertEqual(res["status"], "SUCCESS")
        self.assertIn("decisions_executed", res)
        self.assertGreaterEqual(len(res["decisions_executed"]), 2)

        # Verify audit records written into SQLite
        conn = self.engine.get_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM agent_audit_logs ORDER BY log_id DESC")
        logs = cur.fetchall()
        self.assertGreater(len(logs), 0)

        # Check that where and why fields are populated
        first_log = dict(logs[0])
        self.assertTrue(len(first_log["why_reason"]) > 10)
        self.assertIn(first_log["action_type"], ["STOCK_TRANSFER", "PURCHASE_ORDER", "DEMAND_SURGE"])
        conn.close()

    def test_copilot_chat_local_intelligence(self):
        """Verifies copilot answers milk and transfer questions accurately."""
        reply_milk = self.engine.chat_with_copilot("Why was Vendor B chosen for Milk?")
        self.assertIn("Amul Express", reply_milk["reply"])
        self.assertIn("2.4 days", reply_milk["reply"])

        reply_wheat = self.engine.chat_with_copilot("Tell me about the wheat rebalance")
        self.assertIn("Turbhe", reply_wheat["reply"])
        self.assertIn("Bhiwandi", reply_wheat["reply"])


if __name__ == "__main__":
    unittest.main()
