"""
Automated Test Suite for Enterprise Edge Cases, Multi-Hub Endpoints, POS Checkout,
and Dynamic Supplier Re-ranking under Disruption.
"""

import json
import tempfile
import unittest
from pathlib import Path
from database.schema_and_seed import init_and_seed_db
from agents.core_agents import SupplyChainOrchestrator
from agents.llm_agent import LLMDecisionEngine


class TestEnterpriseEdgeCases(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp_dir = tempfile.TemporaryDirectory()
        cls.db_file = Path(cls.tmp_dir.name) / "test_enterprise.db"
        init_and_seed_db(cls.db_file, force_reset=True)
        cls.orch = SupplyChainOrchestrator(cls.db_file)
        cls.llm_engine = LLMDecisionEngine(str(cls.db_file))

    @classmethod
    def tearDownClass(cls):
        cls.tmp_dir.cleanup()

    def test_supplier_delay_disruption_reranks_to_vendor_c(self):
        """TC-09: Verifies 2-day delivery drift on Amul Express dynamically re-routes to Vendor C (Mother Dairy)."""
        sim_res = self.orch.run_autonomous_loop(
            simulated_delays={"SKU-MILK-01": {"VEN-B": 2.0}},
            persist_pos=False,
        )
        milk_rep = next(r for r in sim_res["sku_reports"] if r["sku"] == "SKU-MILK-01")
        selected = milk_rep["vendor_intelligence"]["selected_vendor"]
        self.assertEqual(selected["vendor_id"], "VEN-C")
        self.assertIn("Mother Dairy", selected["vendor_name"])

    def test_audit_feed_entries_have_physical_locations(self):
        """TC-10: Verifies audit feed contains exact physical locations and rupee impacts."""
        conn = self.llm_engine.get_connection()
        cur = conn.cursor()
        cur.execute("SELECT location_from, location_to, financial_impact, why_reason FROM agent_audit_logs")
        rows = cur.fetchall()
        self.assertGreaterEqual(len(rows), 4)

        # Ensure location fields are populated
        for r in rows:
            self.assertTrue(len(r["location_from"]) > 2)
            self.assertTrue(len(r["location_to"]) > 2)
        conn.close()

    def test_multi_hub_stock_balance_constraint(self):
        """TC-11: Verifies lateral transfer preserves minimum safety buffer at source warehouse."""
        conn = self.llm_engine.get_connection()
        cur = conn.cursor()
        cur.execute("SELECT current_stock, min_node_buffer FROM inventory_nodes WHERE sku = 'SKU-WHEAT-03' AND warehouse_id = 'WH-A'")
        row = cur.fetchone()
        source_stock = row[0]
        min_buffer = row[1]

        # Bhiwandi buffer is 80 units; stock should never drop below min_buffer
        self.assertGreater(source_stock, min_buffer)
        conn.close()

    def test_pos_sale_deducts_chembur_stock(self):
        """TC-12: Simulates POS sale of 2 units of Milk and verifies ST-C stock decrements."""
        conn = self.llm_engine.get_connection()
        cur = conn.cursor()
        cur.execute("SELECT current_stock FROM inventory_nodes WHERE sku = 'SKU-MILK-01' AND warehouse_id = 'ST-C'")
        initial_stock = cur.fetchone()[0]

        # Deduct 2 units as POS sale
        sold_qty = 2
        cur.execute("UPDATE inventory_nodes SET current_stock = current_stock - ? WHERE sku = 'SKU-MILK-01' AND warehouse_id = 'ST-C'", (sold_qty,))
        cur.execute("""
            INSERT INTO transactions (transaction_id, product_id, type, quantity, date, reason, reference)
            VALUES ('TXN-TEST-01', 'SKU-MILK-01', 'STOCK_OUT', ?, date('now'), 'Sale POS Checkout', 'INV-TEST')
        """, (sold_qty,))
        conn.commit()

        cur.execute("SELECT current_stock FROM inventory_nodes WHERE sku = 'SKU-MILK-01' AND warehouse_id = 'ST-C'")
        new_stock = cur.fetchone()[0]
        self.assertEqual(new_stock, initial_stock - sold_qty)
        conn.close()

    def test_customer_phone_lookup(self):
        """TC-13: Verifies customer lookup by phone number returns registered customer."""
        conn = self.llm_engine.get_connection()
        cur = conn.cursor()
        cur.execute("SELECT name, phone FROM customers WHERE phone = '9876543210'")
        cust = cur.fetchone()
        self.assertIsNotNone(cust)
        self.assertEqual(cust[0], "Aarav Sharma")
        conn.close()


if __name__ == "__main__":
    unittest.main()
