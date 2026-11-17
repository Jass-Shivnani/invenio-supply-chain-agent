# 🎬 Invenio AI — Master Presentation Script & Live Demo Guide
**Course:** Agentic AI and Enterprise Applications (`NCMPEL64`) — Department of Computer Engineering, VESIT  
**Problem Statement:** `PS-08` — Logistics & Omnichannel Autonomous Supply Chain Optimization  
**Team (Division D17B):**
* **Jass Shivnani** (Roll No. 50 — Lead Architecture & Backend Orchestration)
* **Khushi Sadhuramani** (Roll No. 44 — Demand Forecasting & Anomaly Intelligence)
* **Navya Rangwani** (Roll No. 43 — Multi-Echelon Rebalancing & Procurement Execution)

---

## ⏱️ Demo Timing & Flow Overview (Total: 6–7 Minutes)

```
[ 00:00 - 01:15 ] Act 1: The Multi-Echelon Problem & System Overview       (Speaker: Jass)
[ 01:15 - 02:45 ] Act 2: Demand Sensing, Volatility & Anomaly Radar         (Speaker: Khushi)
[ 02:45 - 04:00 ] Act 3: Lateral Rebalancing & 1-Click Operational Action   (Speaker: Navya)
[ 04:00 - 05:30 ] Act 4: Multi-Vendor Intelligence & Closed-Loop PO Receipt (Speaker: Jass)
[ 05:30 - 07:00 ] Act 5: Executive Synthesis & Faculty Q&A Defense          (All Team Members)
```

---

## 📋 Pre-Demo Setup Checklist (Do This 2 Minutes Before Evaluation)

1. Launch the system using the 1-click launcher:
   * Double-click **`run_full_system.bat`** (or run `powershell -ExecutionPolicy Bypass -File .\run_full_system.ps1`).
   * Browser opens to `http://localhost:3000`.
2. Ensure browser zoom is set to **90% or 100%** so the visual topology map, KPI strip, and tables fit cleanly without scrolling.
3. Open two tabs:
   * **Tab 1:** `http://localhost:3000` (Main Dashboard)
   * **Tab 2:** `http://localhost:3000/ai-agent` (Supply Chain Intelligence Hub)
4. If you rehearsed earlier and want a completely fresh benchmark state:
   * Click the **Reset Network Baseline** icon button (top right of `/ai-agent`).

---

## 🎙️ Step-by-Step Presentation Script

---

### ACT 1: The Multi-Echelon Problem & System Overview (0:00 – 1:15)
**Speaker: Jass Shivnani**  
**Screen Display:** `http://localhost:3000` (Main Dashboard) $\to$ Switch to `http://localhost:3000/ai-agent`

#### 🗣️ Spoken Lines:
> *"Respected Evaluators and Faculty, welcome to our presentation on **Invenio AI** — our solution for Problem Statement PS-08 in Autonomous Supply Chain and Multi-Echelon Inventory Management.*
>
> *Traditional ERP and inventory software like legacy SAP or standard POS systems rely on **static reorder thresholds** — fixed minimum and maximum stock levels. In the real world, static buffers fail catastrophically when demand spikes, promotions activate, or supplier lead times drift.*
>
> *Rather than a simple tracking tool, Invenio AI is built on **11 specialized autonomous agents** operating a continuous, closed-loop cycle: **Sense Demand $\to$ Quantify Risk $\to$ Solve Lateral Transfers $\to$ Score Suppliers $\to$ Auto-Procure**.*
>
> *Our system is not operating on dummy numbers. Everything you see is wired to a live relational database tracking three physical fulfillment nodes across the Mumbai Metropolitan Region:*
> 1. *Our **Bhiwandi Mega Hub (WH-A)** — bulk regional distribution.*
> 2. *Our **Turbhe Cold Hub (WH-B)** — temperature-controlled perishables.*
> 3. *Our **Chembur Retail & Dark Store (ST-C)** — fast customer fulfillment.*
>
> *Let us examine how our agents detect and neutralize stockout risks before customer orders are lost."*

---

### ACT 2: Demand Sensing, Volatility & Anomaly Radar (1:15 – 2:45)
**Speaker: Khushi Sadhuramani**  
**Screen Display:** `http://localhost:3000/ai-agent` (Scroll slightly to Visual Risk Radar & Demand Chart)

#### 🖱️ Live Action:
* Hover over the **Runout Horizon vs Lead Time** progress bar for **Pasteurized Milk** and **Greek Yogurt**.
* In the **Holt-Winters Smoothing Visualizer**, click on the **`YOGURT-04`** pill to show the red surge bar.

#### 🗣️ Spoken Lines:
> *"Moving to our **Risk Radar and Demand Forecasting Engine**, Agent 2 continuously computes Holt-Winters double exponential smoothing with parameters $\alpha=0.45$ for level and $\beta=0.25$ for trend, augmented with seasonal indexing.*
>
> *Notice our visual runout gauges. For **Pasteurized Full-Cream Milk**, our ledger has 120 units across nodes, with a daily consumption of 50 units. Agent 3 calculates our **exact runout horizon at only 2.4 days**, while our baseline supplier lead time is 3 days. A traditional system reports 'stock sufficient' because current stock is above static minimum, but our agentic system flags an **immediate -0.6 day deficit**.*
>
> *Now observe **Probiotic Greek Yogurt** on the chart. Baseline consumption was steady at 25 units per day. On days 13 and 14, an active summer marketing campaign drove demand up to 102 units per day.*
>
> *Agent 8 executes statistical Z-score anomaly detection. It detected a $+308\%$ demand surge with a **Z-Score of 68.25**, successfully classifying it as a promotional burst rather than systemic drift. Instead of relying on a static buffer of 100 units, Agent 4 dynamically scaled our volatility safety stock to 109 units, using our dynamic formula that accounts for both demand variance and lead-time variance."*

---

### ACT 3: Lateral Rebalancing & 1-Click Operational Action (2:45 – 4:00)
**Speaker: Navya Rangwani**  
**Screen Display:** `http://localhost:3000/ai-agent` (Focus on the Multi-Echelon Network Fulfillment Topology map)

#### 🖱️ Live Action:
* Point to the visual transfer bridge vector between **WH-A (Bhiwandi)** and **WH-B (Turbhe)** showing `TR-201: 50u Atta`.
* Click the button: **`[Execute Lateral Transfer (50u Wheat)]`**.
* Show the green confirmation toast appearing immediately, and point to the updated buffers.

#### 🗣️ Spoken Lines:
> *"When a stockout risk is detected, a naive system immediately places an expensive external purchase order. But Invenio AI's **Agent 7 (Warehouse Optimization Agent)** inspects the entire network topology first.*
>
> *Notice the visual node diagram above. For **Chakki Fresh Whole Wheat Atta**, Warehouse B in Turbhe is in critical deficit with only 35 units in stock. However, our Bhiwandi Mega Hub holds an overstocked surplus of 195 units.*
>
> *Instead of ordering from external mills at full price, Agent 7 solved an inter-facility lateral transshipment: transferring 50 units from Bhiwandi to Turbhe at an internal transit cost of just ₹475.*
>
> *(Click the button now)*
>
> *Watch what happens when I approve this transfer. In real time, our SQLite database decrements Bhiwandi by 50 units, increments Turbhe to a healthy 85 units, writes a permanent transaction log, and saves **₹15,025 in procurement capital**. The SKU risk status instantly turns to 'REBALANCED'."*

---

### ACT 4: Multi-Vendor Intelligence & Closed-Loop Procurement (4:00 – 5:30)
**Speaker: Jass Shivnani**  
**Screen Display:** `http://localhost:3000/ai-agent` (What-If Simulator) $\to$ Switch to `/purchase-orders`

#### 🖱️ Live Action:
* On `/ai-agent`, drag the **Simulate Vendor B Delay Slider** from `0.0d` to `2.0d`. Show the yellow disruption notice appear.
* Drag it back to `0.0d`.
* Click **`[Auto-Restock High-Risk SKUs]`**.
* In the sidebar, click **Purchase Orders** (`/purchase-orders`).
* Point out `PO-1024` for Milk, `PO-1025` for Rice, etc.
* Click **`[Receive PO]`** on `PO-1024`.
* Confirm the prompt. Show the status turn to `RECEIVED`.

#### 🗣️ Spoken Lines:
> *"For items that cannot be rebalanced internally, **Agent 5 (Vendor Intelligence)** and **Agent 6 (Purchase Order Agent)** take over.*
>
> *For our critical Milk deficit, we evaluate multiple suppliers. Vendor A offers ₹50 per unit, but requires a 5-day lead time. Vendor B (Amul Express) charges ₹55, but guarantees a 2-day cold-chain SLA. If we chose Vendor A to save ₹5 on unit price, our store would be completely dry for 2.6 days, incurring severe stockout penalties. Our agent mathematically chose Vendor B, saving ₹2,618 in net penalty.*
>
> *Furthermore, look at our **What-If Simulator**. If transport strikes delay Amul by 2 days, our agent live-evaluates Vendor C (Mother Dairy Metro) to guarantee supply.*
>
> *(Click 'Auto-Restock High-Risk SKUs')*
>
> *With one click, our agents size profit-aware EOQ quantities, factor in bulk discount tiers, and persist real Purchase Orders in our system.*
>
> *(Navigate to Purchase Orders tab)*
>
> *Here in our Purchase Orders ledger, we see PO-1024 through PO-1029 generated with vendor selection justifications and delivery deadlines.*
>
> *(Click 'Receive' on PO-1024)*
>
> *When shipment arrives and our warehouse scans the goods, clicking 'Receive' immediately updates our physical inventory ledger by +200 units and closes the loop. Total net profit protected across our network: **₹62,526** at a **98.6% service level**."*

---

### ACT 5: Executive Synthesis & Faculty Defense (5:30 – 7:00)
**Speakers: All Team Members**

#### 🗣️ Spoken Lines (Jass):
> *"To conclude: Invenio AI bridges the gap between academic agentic AI research and enterprise-grade software. We have proven that multi-agent closed-loop intelligence can eradicate stockouts, cut procurement spend through lateral rebalancing, and maintain near-100% service levels.*
>
> *We are now open to questions from the faculty panel. Thank you."*

---

## 🛡️ Anticipated Faculty Q&A Defense Matrix

### Q1: "Why 11 agents instead of one large LLM prompt?"
* **Answer (Jass):** *"Using a single LLM prompt for multi-echelon supply chain is unreliable, slow, and non-deterministic. Mathematical operations like Holt-Winters exponential smoothing, EOQ sizing, and Z-score calculations must be mathematically exact ($O(1)$ and deterministic). We use specialized micro-agents for the quantitative heavy lifting (Agents 1 through 10) and use Google Gemini 2.5 Flash at Agent 11 purely for synthesis, executive reasoning, and natural language copilot interactions."*

### Q2: "How does your Dynamic Safety Stock formula differ from static min/max?"
* **Answer (Khushi):** *"Static min/max assumes constant demand and fixed supplier lead times. Our Dynamic Safety Stock formula is:*
  $$SS = Z \cdot \sqrt{L \cdot \sigma_d^2 + \hat{d}^2 \cdot \sigma_L^2}$$
  *Where $Z$ is our service level factor, $L$ is lead time, $\sigma_d^2$ is demand variance, and $\sigma_L^2$ is supplier lead-time variance. When demand volatility spiked on Sunflower Oil or Yogurt, our agent automatically expanded safety stock from 48 units to 100 units. When volatility normalized on USB Cables, it contracted the buffer to avoid holding-cost bloat."*

### Q3: "What prevents lateral rebalancing from causing a secondary stockout at the source warehouse?"
* **Answer (Navya):** *"Agent 7 enforces a strict constraint before recommending any lateral transfer:*
  $$\text{Transfer Quantity} \le \text{Current Stock}_{\text{Source}} - \text{Min Buffer}_{\text{Source}}$$
  *At Warehouse A, total wheat stock was 195 units against a minimum buffer of 80 units. Transferring 50 units left Bhiwandi with 145 units — well above its safety threshold. If source stock is insufficient, the agent rejects lateral movement and falls back to external procurement."*

### Q4: "How does the system handle bulk discount tiers?"
* **Answer (Jass):** *"Agent 5 and Agent 9 perform a piecewise cost evaluation. For Royal Aged Basmati Rice, Vendor R1 offers a 6% discount on orders $\ge 500$ units. The agent calculated that ordering 800 units at ₹319.60 yields a lower total holding plus procurement cost than ordering a smaller 300-unit batch at the full ₹340 price."*

### Q5: "Is the database actually persistent or in-memory?"
* **Answer (Navya):** *"It is fully persistent in SQLite (`data/invenio_supply_chain.db`) with foreign key constraints, PRAGMA integrity, and audit logging. Every sale on our POS interface decrements stock, every transfer moves stock between node rows, and every received PO writes an audit record in the `transactions` table."*
