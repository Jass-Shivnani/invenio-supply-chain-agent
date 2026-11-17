#!/usr/bin/env python3
"""
Dual-Mode Entrypoint (`python app.py` OR `streamlit run app.py`):
- If launched directly via `python app.py`, starts the built-in zero-dependency web server & CLI (`main.py`).
- If launched via `streamlit run app.py`, renders the Streamlit dashboard.
"""

import os
import sys

def _is_running_in_streamlit() -> bool:
    try:
        from streamlit.runtime.scriptrunner import get_script_run_ctx
        return get_script_run_ctx() is not None
    except Exception:
        return False

if __name__ == "__main__" and not _is_running_in_streamlit():
    from main import start_server
    start_server()
else:
    import pandas as pd
    import streamlit as st
    from database.schema_and_seed import init_and_seed_db, DEFAULT_DB_PATH
    from agents.core_agents import SupplyChainOrchestrator

    st.set_page_config(page_title="Invenio AI | PS-08 Supply Chain Agent", layout="wide")
    if not DEFAULT_DB_PATH.exists():
        init_and_seed_db(DEFAULT_DB_PATH, force_reset=True)

    st.sidebar.title("Invenio AI (PS-08)")
    st.sidebar.caption("11-Agent Supply Chain & Inventory Orchestrator")
    gemini_key = st.sidebar.text_input("Gemini API Key (gemini-2.5-flash)", type="password", value=os.getenv("GEMINI_API_KEY", ""))
    service_z = st.sidebar.select_slider("Target Service Level (Z-Score)", options=[1.28, 1.645, 1.96, 2.33], value=1.645)
    vendor_b_delay = st.sidebar.slider("Simulate Vendor B Delay on Milk (Days)", 0.0, 5.0, 0.0, 0.5)
    if st.sidebar.button("Reset Database to Baseline"):
        init_and_seed_db(DEFAULT_DB_PATH, force_reset=True)
        st.rerun()

    orchestrator = SupplyChainOrchestrator(DEFAULT_DB_PATH)
    delays = {"SKU-MILK-01": {"VEN-B": vendor_b_delay}} if vendor_b_delay > 0 else {}
    state = orchestrator.run_autonomous_loop(service_level_z=service_z, simulated_delays=delays, gemini_api_key=gemini_key)

    st.title("Invenio AI — Autonomous Supply Chain Intelligence & Execution System")
    st.info(f"**{state['engine_mode']}:** {state['orchestrator_brief']}")

    kpis = state["kpis"]
    c1, c2, c3, c4, c5 = st.columns(5)
    c1.metric("Monitored SKUs (3 Nodes)", kpis["total_skus_monitored"], f"{kpis['total_units_in_network']} units")
    c2.metric("High Stockout Risks", kpis["high_stockout_risk_skus"], f"{kpis['moderate_stockout_risk_skus']} moderate")
    c3.metric("Auto-Generated POs", kpis["auto_pos_generated"], f"INR {kpis['total_auto_po_spend']:,.0f}")
    c4.metric("Lateral Rebalances", kpis["lateral_transfers_scheduled"], "WH-A -> WH-B")
    c5.metric("Net Profit Protected", f"INR {kpis['net_cost_and_penalty_saved']:,.0f}", f"{kpis['projected_service_level_pct']}% SLA")

    st.subheader("Auto-Generated Purchase Orders (Agents 5, 6 & 9)")
    st.dataframe(pd.DataFrame(state["purchase_orders"]), use_container_width=True)

    st.subheader("Lateral Warehouse Transfers (Agent 7) & Anomaly Detection (Agent 8)")
    col_a, col_b = st.columns(2)
    with col_a:
        st.dataframe(pd.DataFrame(state["warehouse_transfers"]), use_container_width=True)
    with col_b:
        st.dataframe(pd.DataFrame(state["anomalies"]), use_container_width=True)
