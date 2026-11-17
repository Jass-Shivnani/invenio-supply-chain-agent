#!/usr/bin/env python3
"""
CLI Runner for Invenio AI — PS-08 Autonomous Supply Chain & Inventory Management System.
Works out-of-the-box on Windows, macOS, and Linux with zero external dependencies required.
"""

import argparse
import json
import sys
from pathlib import Path

# Prevent Windows cp1252 console crash when printing INR symbol (₹) or box characters
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from database.schema_and_seed import init_and_seed_db, DEFAULT_DB_PATH
from agents.core_agents import SupplyChainOrchestrator


def format_grid_table(rows, headers):
    """Pure-Python grid table formatter (uses tabulate if installed, otherwise built-in formatter)."""
    try:
        from tabulate import tabulate
        return tabulate(rows, headers=headers, tablefmt="grid")
    except ImportError:
        col_widths = [len(str(h)) for h in headers]
        for r in rows:
            for i, cell in enumerate(r):
                col_widths[i] = max(col_widths[i], len(str(cell)))
        sep = "+" + "+".join("-" * (w + 2) for w in col_widths) + "+"
        hdr_sep = "+" + "+".join("=" * (w + 2) for w in col_widths) + "+"
        out = [sep]
        out.append("|" + "|".join(f" {str(h):<{col_widths[i]}} " for i, h in enumerate(headers)) + "|")
        out.append(hdr_sep)
        for r in rows:
            out.append("|" + "|".join(f" {str(c):<{col_widths[i]}} " for i, c in enumerate(r)) + "|")
            out.append(sep)
        return "\n".join(out)


def run_cli_demo(delay_vendor_b: float = 0.0, export_json: str = ""):
    db_path = init_and_seed_db(DEFAULT_DB_PATH, force_reset=True)
    orchestrator = SupplyChainOrchestrator(db_path)

    sim_delays = {"SKU-MILK-01": {"VEN-B": delay_vendor_b}} if delay_vendor_b > 0 else {}
    state = orchestrator.run_autonomous_loop(simulated_delays=sim_delays)

    print("=" * 112)
    print("INVENIO AI — PS-08 AUTONOMOUS SUPPLY CHAIN & INVENTORY MANAGEMENT ORCHESTRATOR")
    print(f"Engine Mode: {state['engine_mode']} | Monitored Nodes: Warehouse A (Bhiwandi), Warehouse B (Turbhe), Store C (Chembur)")
    print("-" * 112)
    print(f"ORCHESTRATOR BRIEF: {state['orchestrator_brief']}")
    print("=" * 112)

    rows_1 = []
    for r in state["sku_reports"]:
        nodes_str = "/".join(str(n["available_stock"]) for n in r["inventory"]["nodes"])
        tot_stock = r["inventory"]["total_available_stock"]
        fc = r["forecast"]
        rk = r["risk"]
        ro = r["reorder"]
        rows_1.append([
            r["sku"],
            r["name"][:26],
            f"{tot_stock} ({nodes_str})",
            f"{fc['current_daily_demand']:g}/d -> {fc['forecast_next_7d_daily']:g}/d",
            f"{rk['days_until_runout']:g}d (LT {rk['lead_time_days']:g}d)",
            f"{ro['dynamic_safety_stock']}u (Fix {ro['fixed_safety_stock']}u)",
            rk["naive_system_verdict"],
            rk["risk_level"],
        ])
    print("\n[1] MULTI-AGENT INVENTORY, FORECAST & STOCKOUT RISK MATRIX (AGENTS 1, 2, 3, 4)")
    print(format_grid_table(
        rows_1,
        headers=["SKU", "Product", "Stock (A/B/C)", "Demand -> 7d Fcst", "Runout / LT", "Dyn. Safety Stock", "Naive System", "Agentic Risk"],
    ))

    rows_2 = []
    for po in state["purchase_orders"]:
        rows_2.append([
            po["po_id"],
            po["sku"],
            po["product_name"][:24],
            f"{po['order_quantity']} units",
            po["vendor_name"],
            f"INR {po['total_cost']:,.0f}",
            f"{po['delivery_deadline_days']:g} days",
            po["priority"],
            f"INR {po['expected_profit_protected']:,.0f}",
        ])
    print("\n[2] AUTONOMOUS PURCHASE ORDERS & VENDOR INTELLIGENCE (AGENTS 5, 6, 9)")
    print(format_grid_table(
        rows_2,
        headers=["PO ID", "SKU", "Product", "Order Qty", "Selected Vendor", "Total Cost", "Delivery SLA", "Priority", "Net Penalty Saved"],
    ))

    rows_3 = []
    for tr in state["warehouse_transfers"]:
        rows_3.append([
            f"Agent 7 ({tr['transfer_id']})",
            tr["sku"],
            f"Transfer {tr['quantity']}u: {tr['from_warehouse']} -> {tr['to_warehouse']}",
            f"Saves INR {tr['procurement_cost_saved']:,.0f} ({tr['reason'][:54]}...)",
        ])
    for an in state["anomalies"]:
        rows_3.append([
            f"Agent 8 ({an['anomaly_type']})",
            an["sku"],
            f"[{an['severity']}] {an['headline']}",
            f"Z={an['z_score']} | {an['root_cause']}",
        ])
    print("\n[3] LATERAL WAREHOUSE REBALANCING & ANOMALY ALERTS (AGENTS 7 & 8)")
    print(format_grid_table(
        rows_3,
        headers=["Agent / Action ID", "SKU", "Autonomous Action / Detection", "Operational & Financial Impact"],
    ))

    if export_json:
        Path(export_json).write_text(json.dumps(state, indent=2), encoding="utf-8")
        print(f"\n[OK] Exported full telemetry state to {export_json}")
    return state


def main():
    parser = argparse.ArgumentParser(description="Invenio AI (PS-08) Autonomous Supply Chain CLI")
    parser.add_argument("--delay-vendor-b", type=float, default=0.0, help="Simulate delay (days) on Vendor B for Milk")
    parser.add_argument("--export-json", type=str, default="", help="Optional path to export full JSON state")
    args = parser.parse_args()
    run_cli_demo(delay_vendor_b=args.delay_vendor_b, export_json=args.export_json)


if __name__ == "__main__":
    main()
