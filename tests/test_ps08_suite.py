"""
Automated 8-Case Verification Suite (TC-01 to TC-08) for Invenio AI (PS-08).
Compatible with both python3 -m unittest and pytest.
"""

import tempfile
import unittest
from pathlib import Path
from database.schema_and_seed import init_and_seed_db
from agents.core_agents import SupplyChainOrchestrator


class TestInvenioPS08Suite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp_dir = tempfile.TemporaryDirectory()
        cls.db_file = Path(cls.tmp_dir.name) / "test_invenio.db"
        init_and_seed_db(cls.db_file, force_reset=True)
        cls.orch = SupplyChainOrchestrator(cls.db_file)
        cls.state = cls.orch.run_autonomous_loop()

    @classmethod
    def tearDownClass(cls):
        cls.tmp_dir.cleanup()

    def test_tc01_milk_stockout_and_po_1024(self):
        """TC-01: Verifies PS-08 Page 1-5 Milk scenario (120 stock, 50/day demand, 2.4d runout, Vendor B selected, PO-1024 for 200u @ INR 11,000)."""
        milk = next(r for r in self.state["sku_reports"] if r["sku"] == "SKU-MILK-01")
        self.assertEqual(milk["inventory"]["total_available_stock"], 120)
        self.assertEqual(milk["risk"]["days_until_runout"], 2.4)
        self.assertEqual(milk["risk"]["risk_level"], "HIGH")
        self.assertEqual(milk["purchase_order"]["po_id"], "PO-1024")
        self.assertEqual(milk["purchase_order"]["order_quantity"], 200)
        self.assertEqual(milk["purchase_order"]["vendor_id"], "VEN-B")
        self.assertEqual(milk["purchase_order"]["total_cost"], 11000.0)

    def test_tc02_rice_forecast_and_deficit(self):
        """TC-02: Verifies PS-08 Page 3-4 Rice scenario (160/day forecast, 500 stock, 6d lead time, 600 required, 100 deficit, 800 order qty)."""
        rice = next(r for r in self.state["sku_reports"] if r["sku"] == "SKU-RICE-02")
        self.assertEqual(rice["forecast"]["forecast_next_7d_daily"], 160.0)
        self.assertEqual(rice["risk"]["required_stock"], 600)
        self.assertEqual(rice["risk"]["deficit_units"], 100)
        self.assertEqual(rice["reorder"]["recommended_order_qty"], 800)

    def test_tc03_warehouse_lateral_rebalancing(self):
        """TC-03: Verifies PS-08 Page 5-6 Warehouse Optimization (Transfer 50 units of Wheat from WH-A to WH-B without external PO)."""
        wheat = next(r for r in self.state["sku_reports"] if r["sku"] == "SKU-WHEAT-03")
        self.assertTrue(wheat["warehouse_optimization"]["lateral_transfer_recommended"])
        tr = wheat["warehouse_optimization"]["transfers"][0]
        self.assertEqual(tr["from_warehouse"], "WH-A")
        self.assertEqual(tr["to_warehouse"], "WH-B")
        self.assertEqual(tr["quantity"], 50)
        self.assertIsNone(wheat["purchase_order"])

    def test_tc04_anomaly_detection_demand_spike_and_shrinkage(self):
        """TC-04: Verifies PS-08 Page 6 Anomaly Detection (+300% demand spike on Yogurt & 4-unit audit mismatch on Drill)."""
        types = {(a["sku"], a["anomaly_type"]) for a in self.state["anomalies"]}
        self.assertIn(("SKU-YOGURT-04", "DEMAND_SPIKE"), types)
        self.assertIn(("SKU-DRILL-08", "INVENTORY_MISMATCH"), types)

    def test_tc05_dynamic_safety_stock_volatility_scaling(self):
        """TC-05: Verifies PS-08 Page 8 Dynamic Safety Stock expands buffer under high demand volatility (SKU-OIL-05)."""
        oil = next(r for r in self.state["sku_reports"] if r["sku"] == "SKU-OIL-05")
        self.assertGreater(oil["reorder"]["dynamic_safety_stock"], oil["reorder"]["fixed_safety_stock"])
        self.assertGreaterEqual(oil["reorder"]["volatility_buffer_delta"], 25)

    def test_tc06_multi_vendor_delay_simulation(self):
        """TC-06: Verifies PS-08 Page 9 Multi-Vendor Simulation (What if Vendor B delays 2 days? recomputes vendor ranking)."""
        sim_state = self.orch.run_autonomous_loop(
            simulated_delays={"SKU-MILK-01": {"VEN-B": 2.0}},
            persist_pos=False,
        )
        milk_sim = next(r for r in sim_state["sku_reports"] if r["sku"] == "SKU-MILK-01")
        ven_b_eval = next(v for v in milk_sim["vendor_intelligence"]["all_vendors"] if v["vendor_id"] == "VEN-B")
        self.assertEqual(ven_b_eval["effective_lead_time_days"], 4.0)
        self.assertEqual(ven_b_eval["unmet_lead_time_days"], 1.6)

    def test_tc07_bulk_discount_tier_optimization(self):
        """TC-07: Verifies bulk discount tier application on high-volume Rice procurement (>= 600 units)."""
        rice = next(r for r in self.state["sku_reports"] if r["sku"] == "SKU-RICE-02")
        self.assertGreater(rice["purchase_order"]["discount_applied_pct"], 0.0)

    def test_tc08_healthy_sku_zero_false_positive_po(self):
        """TC-08: Verifies healthy stock SKU (SKU-CABLE-07 with 340 units) does not trigger unnecessary POs."""
        cable = next(r for r in self.state["sku_reports"] if r["sku"] == "SKU-CABLE-07")
        self.assertIn(cable["risk"]["risk_level"], ("OVERSTOCK", "LOW"))
        self.assertIsNone(cable["purchase_order"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
