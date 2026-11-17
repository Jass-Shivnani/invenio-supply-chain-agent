<div align="center">

# 📦 Invenio AI
### Autonomous Multi-Echelon Supply Chain & Enterprise Inventory Management System

[![Python 3.12](https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.0-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Material UI](https://img.shields.io/badge/MUI-v7-007FFF?style=for-the-badge&logo=mui&logoColor=white)](https://mui.com/)
[![SQLite](https://img.shields.io/badge/SQLite-Unified_Graph-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Google Gemini](https://img.shields.io/badge/Gemini-2.5_Flash-8E75B2?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Tests](https://img.shields.io/badge/Pytest-15%2F15%20Passed-brightgreen?style=for-the-badge&logo=pytest&logoColor=white)](tests/)

**Course:** Agentic AI and Enterprise Applications (`NCMPEL64`) — VESIT Department of Computer Engineering  
**Problem Statement:** `PS-08` — Logistics & Omnichannel Autonomous Supply Chain Optimization  

---

### 👥 Team (Division D17B)
| Roll No. | Name | Email |
| :---: | :--- | :--- |
| **50** | **Jass Shivnani** | `2023.jass.shivnani@ves.ac.in` |
| **44** | **Khushi Sadhuramani** | `2023.khushi.sadhuramani@ves.ac.in` |
| **43** | **Navya Rangwani** | `2023.navya.rangwani@ves.ac.in` |

</div>

---

## 🌟 Executive Summary

**Invenio AI** is a production-grade, full-stack inventory management platform powered by an **11-Agent Autonomous Supply Chain Intelligence Engine**. Moving beyond static min/max thresholds, Invenio AI operates a continuous closed-loop cycle:

$$\text{Sense Demand} \longrightarrow \text{Quantify Stockout Risk} \longrightarrow \text{Solve Lateral Transfers} \longrightarrow \text{Score Multi-Vendor SLAs} \longrightarrow \text{Auto-Execute Purchase Orders}$$

The system continuously tracks inventory across **three fulfillment nodes**:
* 🏭 **Warehouse A (Bhiwandi Mega Hub)** — Bulk regional distribution center
* ❄️ **Warehouse B (Turbhe Cold & Dry Hub)** — Temperature-controlled & quick-dispatch node
* 🏪 **Store C (Chembur Fulfillment Center)** — Omnichannel micro-fulfillment store

---

## 🏗️ Architecture & 11 Specialized Agents

```
┌────────────────────────────────────────────────────────────────────────┐
│             NEXT.JS 16 ENTERPRISE FRONTEND (React 19 + MUI)            │
│  http://localhost:3000                                                 │
│                                                                        │
│  [Dashboard]  [Products]  [Inventory]  [Purchase Orders]  [Sales]     │
│  ⭐ NEW: [AI Supply Chain Copilot Hub] (/ai-agent)                     │
│     ├── 1-Click Action Cards (Approve POs, Execute Lateral Transfers)  │
│     ├── Real-time Anomaly Radar (Demand bursts, Audit shrinkage)       │
│     ├── Live What-If Delay & Shock Simulator (Vendor strikes)          │
│     └── Conversational Supply Chain Copilot (Gemini 2.5 Flash)         │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │ REST API (localhost:8000)
                                    │ JSON / CORS Enabled
┌───────────────────────────────────▼────────────────────────────────────┐
│              FASTAPI AGENTIC BACKEND (Python 3.12)                     │
│  http://localhost:8000                                                 │
│                                                                        │
│  Agent 1: InventoryTrackingAgent       (Multi-echelon unified graph)   │
│  Agent 2: DemandForecastingAgent       (Holt-Winters double smoothing) │
│  Agent 3: StockoutRiskAgent            (Runout horizon vs lead time)   │
│  Agent 4: ReorderDecisionAgent         (Dynamic volatility safety stock)│
│  Agent 5: VendorIntelligenceAgent      (Multi-constraint vendor scoring)│
│  Agent 6: PurchaseOrderAgent           (Structured PO generation)      │
│  Agent 7: WarehouseOptimizationAgent   (Lateral transshipment solver)  │
│  Agent 8: AnomalyDetectionAgent        (Z-Score demand & audit audits) │
│  Agent 9: CostOptimizationAgent        (Procurement vs holding vs loss)│
│  Agent 10: ReportingDashboardAgent     (KPI synthesis & protected SLA) │
│  Agent 11: SupplyChainOrchestrator     (Closed-loop Google Gemini brain│
└───────────────────────────────────▲────────────────────────────────────┘
                                    │
                         [ SQLite Relational DB ]
        (Nodes, Demand History, Multi-Tier Vendors, POs, Transshipments)
```

### Detailed Agent Specifications

| Agent ID | Name | Mathematical Formulation / Core Logic | Primary Output |
| :---: | :--- | :--- | :--- |
| **Agent 1** | `InventoryTrackingAgent` | Multi-node graph aggregation across WH-A, WH-B, and ST-C with buffer thresholds | Real-time available vs reserved stock per facility |
| **Agent 2** | `DemandForecastingAgent` | Holt-Winters double exponential smoothing ($\alpha=0.45, \beta=0.25$) with seasonal indexing & promo uplift | 7-day projected daily demand ($\hat{d}_{t+k}$) |
| **Agent 3** | `StockoutRiskAgent` | Exact runout horizon ($T_{\text{runout}} = \text{Stock} / \hat{d}$) evaluated against lead-time deficit | High / Moderate / Healthy risk tiering |
| **Agent 4** | `ReorderDecisionAgent` | Dynamic Volatility Safety Stock: $$SS = Z \cdot \sqrt{L \cdot \sigma_d^2 + \hat{d}^2 \cdot \sigma_L^2}$$ | Profit-aware EOQ / Newsvendor order quantity |
| **Agent 5** | `VendorIntelligenceAgent` | Multi-criteria vendor scoring: Price, Delivery Speed, Reliability, On-Time %, and Bulk Discount Tiers | Optimal supplier selection + What-If delay routing |
| **Agent 6** | `PurchaseOrderAgent` | Automated structured PO generation (`PO-1024` onwards) with priority & SLA deadlines | Structured PO records with full telemetry |
| **Agent 7** | `WarehouseOptimizationAgent` | Solves inter-hub stock shift ($WH_A \to WH_B$) prior to external purchasing | Prevents stockouts internally; saves procurement capital |
| **Agent 8** | `AnomalyDetectionAgent` | Statistical Z-score demand burst detection ($|Z| > 2.8$) and physical audit vs ledger shrinkage | Root cause tagging (Promo spike vs theft/shrinkage) |
| **Agent 9** | `CostOptimizationAgent` | Total Cost Optimization: $$TC = C_{\text{procurement}} + C_{\text{holding}} + C_{\text{penalty}}$$ | Net financial penalty protected |
| **Agent 10** | `ReportingDashboardAgent`| Synthesizes network KPIs, stockout risk distribution, and projected SLA | Executive metrics & telemetry stream |
| **Agent 11** | `SupplyChainOrchestrator`| Closed-loop Gemini 2.5 Flash cognitive tool calling + deterministic solver | Action execution & live audit feed |

---

## 🚀 Quick Start Guide

### Option 1: 1-Click Pre-Compiled Launcher (Windows)
Double-click **`run_full_system.bat`** in the repository root.  
This automatically:
1. Starts the FastAPI Agentic Backend on `http://localhost:8000`
2. Starts the **Pre-Compiled Production Next.js Server** on `http://localhost:3000` (sub-50ms instant page loads)
3. Opens your default web browser to the dashboard

*(To run hot-reload development mode instead, double-click `run_dev_mode.bat`)*

---

### Option 2: Manual Terminal Startup

#### 1. Start the FastAPI Agentic Backend
```powershell
# Install Python dependencies
pip install -r requirements.txt

# Run the FastAPI server
python -m uvicorn api_server:app --reload --port 8000
```
* **API Health Check:** `http://localhost:8000/api/health`
* **Interactive Swagger Documentation:** `http://localhost:8000/docs`
* **Agentic Telemetry Stream:** `http://localhost:8000/api/ai/state`

#### 2. Start the Next.js Enterprise Frontend
```powershell
cd frontend

# Install frontend dependencies (first time only)
npm install --legacy-peer-deps

# Start development server
npm run dev
```
* **Web App URL:** `http://localhost:3000`
* **AI Copilot Hub:** `http://localhost:3000/ai-agent`

---

### Option 3: Terminal CLI Runner
To inspect the agentic cycle directly inside your terminal with rich ASCII tables:

```powershell
python cli.py

# Simulate a 2-day delivery delay on Vendor B for Milk:
python cli.py --delay-vendor-b 2.0

# Export complete network telemetry to JSON:
python cli.py --export-json network_state.json
```

---

## 🧪 Automated Verification Suite (15 Test Cases)

The project includes an automated test suite validating quantitative models, Gemini function calling, multi-hub balance constraints, and POS store deductions:

```powershell
python -m pytest -v tests/
```

```
tests/test_enterprise_edge_cases.py::TestEnterpriseEdgeCases::test_audit_feed_entries_have_physical_locations PASSED [  6%]
tests/test_enterprise_edge_cases.py::TestEnterpriseEdgeCases::test_customer_phone_lookup PASSED [ 13%]
tests/test_enterprise_edge_cases.py::TestEnterpriseEdgeCases::test_multi_hub_stock_balance_constraint PASSED [ 20%]
tests/test_enterprise_edge_cases.py::TestEnterpriseEdgeCases::test_pos_sale_deducts_chembur_stock PASSED [ 26%]
tests/test_enterprise_edge_cases.py::TestEnterpriseEdgeCases::test_supplier_delay_disruption_reranks_to_vendor_c PASSED [ 33%]
tests/test_llm_agent_suite.py::TestLLMDecisionEngine::test_copilot_chat_local_intelligence PASSED     [ 40%]
tests/test_llm_agent_suite.py::TestLLMDecisionEngine::test_deterministic_solver_with_audit_trail PASSED [ 46%]
tests/test_ps08_suite.py::TestInvenioPS08Suite::test_tc01_milk_stockout_and_po_1024 PASSED             [ 53%]
tests/test_ps08_suite.py::TestInvenioPS08Suite::test_tc02_rice_forecast_and_deficit PASSED             [ 60%]
tests/test_ps08_suite.py::TestInvenioPS08Suite::test_tc03_warehouse_lateral_rebalancing PASSED         [ 66%]
tests/test_ps08_suite.py::TestInvenioPS08Suite::test_tc04_anomaly_detection_demand_spike_and_shrinkage PASSED [ 73%]
tests/test_ps08_suite.py::TestInvenioPS08Suite::test_tc05_dynamic_safety_stock_volatility_scaling PASSED [ 80%]
tests/test_ps08_suite.py::TestInvenioPS08Suite::test_tc06_multi_vendor_delay_simulation PASSED         [ 86%]
tests/test_ps08_suite.py::TestInvenioPS08Suite::test_tc07_bulk_discount_tier_optimization PASSED     [ 93%]
tests/test_ps08_suite.py::TestInvenioPS08Suite::test_tc08_healthy_sku_zero_false_positive_po PASSED   [100%]
=================================== 15 passed in 0.23s ===================================
```

### Verified Benchmark Scenarios
* **TC-01 (Milk Runout & PO-1024):** Total stock = 120u, daily demand = 50u/d $\to$ runout in 2.4 days against a 3-day lead time. Agent selects Vendor B (Amul Express, 2d SLA @ ₹55) over Vendor A (5d SLA @ ₹50), eliminating stockout gap and protecting ₹2,618 in penalties.
* **TC-02 (Basmati Rice Forecast Trend):** Demand accelerates from 100u $\to$ 160u/day. Lead-time demand deficit calculated at 460 units. Sizing triggers 800-unit bulk procurement.
* **TC-03 (Lateral Warehouse Rebalancing):** WH-A holds 195 units surplus Wheat Atta while WH-B holds only 35 units (stockout risk). Agent 7 executes transfer TR-201 (50 units WH-A $\to$ WH-B) at ₹475 transfer cost, saving ₹15,025 in unnecessary external purchasing.
* **TC-04 (Anomaly Detection):** Identifies a +308% demand spike anomaly on Greek Yogurt ($Z = 68.25$) due to an active promotion, and flags a 4-unit physical audit shrinkage on Industrial Drills at WH-B ($Z = 4.8$).
* **TC-05 (Dynamic Safety Stock):** Sunflower Oil experiences high demand volatility; dynamic formula scales safety buffer from static 48 units to 100 units.
* **TC-06 (Multi-Vendor Delay Simulation):** When Vendor B is simulated with a +2.0 day delivery delay, Agent 5 dynamically reroutes orders to alternate vendors to safeguard network SLA.
* **TC-07 (Bulk Discount Tiers):** Verifies that volume discounts (e.g. $\ge 500$ units on Basmati Rice) are factored into EOQ total cost optimization.
* **TC-08 (Zero False Positives):** Stable SKUs with sufficient buffers (USB-C Fast Cable) correctly yield zero unnecessary reorders.

---

## 🖥️ Application Features & Walkthrough

### 1. AI Supply Chain Copilot Hub (`/ai-agent`)
* **Real-time Risk Radar:** Live table detailing daily demand, Holt-Winters 7-day forecast, days until runout, dynamic safety stock, and agent risk tier.
* **Human-in-the-Loop 1-Click Approvals:**
  * `[1-Click Approve Lateral Rebalance]`: Transfers stock from WH-A to WH-B instantly in SQLite.
  * `[1-Click Auto-Restock POs]`: Sizes and generates purchase orders for all at-risk SKUs.
* **Interactive AI Copilot Chat:** Conversational agent capable of explaining vendor selections, querying stock levels across warehouses, and analyzing anomalies.
* **What-If Delay Simulator:** Sliders to simulate supplier delays and observe routing changes in real time.

### 2. Live Inventory & Multi-Warehouse Tracking (`/inventory`)
* Real-time stock distribution breakdown across Bhiwandi Mega Hub, Turbhe Cold Hub, and Chembur Fulfillment Center.
* Dynamic low-stock alerts triggered when available stock breaches dynamic safety thresholds.

### 3. Purchase Order Lifecycle Management (`/purchase-orders`)
* Full PO lifecycle: $\text{DRAFT} \to \text{AGENT\_RECOMMENDED} \to \text{APPROVED} \to \text{IN\_TRANSIT} \to \text{RECEIVED}$.
* **Automated Stock Crediting:** Marking a PO as "Received" automatically credits the inventory into Warehouse A and records an audit transaction log.

### 4. Point of Sale & Billing (`/sales`, `/invoices`)
* POS sales interface with GST and Non-GST invoice generation.
* Completing a sale automatically decrements physical inventory at Store C (Chembur).

---

## 📡 REST API Reference

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/health` | `GET` | Health check and active agent count (11 agents) |
| `/api/ai/state` | `GET` | Full multi-agent state: KPIs, forecast, risk matrix, POs, and anomalies |
| `/api/ai/auto-restock` | `POST` | Triggers Agents 4, 5, 6 & 9 to size and stage optimal POs |
| `/api/ai/execute-rebalance` | `POST` | Executes lateral transshipment (WH-A to WH-B) |
| `/api/ai/chat` | `POST` | Conversational Copilot reasoning with action suggestions |
| `/api/simulate` | `POST` | Simulates vendor delivery delay or demand spike shocks |
| `/products` | `GET / POST` | Products catalog with multi-warehouse stock totals |
| `/inventory/{sku}` | `GET / PUT` | Warehouse node inventory details and stock adjustments |
| `/inventory/low-stock` | `GET` | SKUs currently breaching minimum buffer levels |
| `/purchase-orders` | `GET / POST` | Purchase order management |
| `/purchase-orders/{id}/receive`| `POST` | Marks PO received and automatically increments warehouse inventory |
| `/invoices` | `GET / POST` | Sales invoice creation and automatic stock deduction |
| `/transactions` | `GET` | Comprehensive stock movement audit trail |

---

## 📂 Project Structure

```
invenio-ps08-supply-chain-agent/
├── agents/
│   ├── core_agents.py           # Implementation of all 11 autonomous agents
│   └── __init__.py
├── database/
│   ├── schema_and_seed.py       # SQLite relational schema, seed catalog & demand history
│   └── __init__.py
├── data/
│   └── invenio_supply_chain.db  # Pre-seeded SQLite multi-warehouse database
├── frontend/                    # Next.js 16 Enterprise Management Web App
│   ├── app/
│   │   ├── page.tsx             # Dashboard with Live AI Command Bar
│   │   ├── ai-agent/page.tsx    # Autonomous AI Copilot Hub & What-If Simulator
│   │   ├── inventory/page.tsx   # Multi-warehouse stock tracking
│   │   ├── products/page.tsx    # Product catalog management
│   │   ├── purchase-orders/page.tsx # PO lifecycle & Auto-Restock button
│   │   ├── sales/               # POS sale checkout & receipts
│   │   └── invoices/            # Invoices & billing records
│   ├── components/              # Layout, Navigation & Providers
│   ├── contexts/                # AuthContext with Local Admin Fallback
│   ├── lib/api.ts               # Axios API client wired to FastAPI backend
│   └── package.json
├── tests/
│   └── test_ps08_suite.py       # Pytest suite with 8 automated test cases (TC-01 - TC-08)
├── api_server.py                # Unified FastAPI Backend Server
├── cli.py                       # Rich terminal CLI runner
├── run_full_system.bat          # 1-Click Windows Launcher (Backend + Frontend)
├── run_full_system.ps1          # PowerShell 1-Click Launcher
├── requirements.txt             # Python dependencies
├── .env.example                 # Environment configuration template
└── README.md                    # Project documentation
```

---

## 📜 License

Academic & Educational Project — Developed for **NCMPEL64 (Agentic AI and Enterprise Applications)** at VESIT Department of Computer Engineering.
