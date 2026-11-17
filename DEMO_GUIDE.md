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
[ 00:00 - 01:15 ] Act 1: The Multi-Hub Problem & Executive Architecture     (Speaker: Jass)
[ 01:15 - 02:45 ] Act 2: Demand Sensing, Volatility & Anomaly Radar         (Speaker: Khushi)
[ 02:45 - 04:00 ] Act 3: Shift Surplus Stock Between Hubs (Live Audit Log)  (Speaker: Navya)
[ 04:00 - 05:30 ] Act 4: Multi-Vendor Intelligence & Closed-Loop PO Receipt (Speaker: Jass)
[ 05:30 - 07:00 ] Act 5: Executive Synthesis & Faculty Q&A Defense          (All Team Members)
```

---

## 📋 Pre-Demo Setup Checklist (Do This 2 Minutes Before Evaluation)

1. Launch the system using the pre-compiled production launcher:
   * Double-click **`run_full_system.bat`**.
   * It starts the FastAPI backend on port 8000 and the **pre-compiled production Next.js server** on port 3000.
   * Browser opens to `http://localhost:3000` with **instant zero-lag page navigation** (all 24 routes pre-compiled).
2. Set browser zoom to **90% or 100%** for optimal dashboard view.
3. Open two tabs:
   * **Tab 1:** `http://localhost:3000` (Main Operational Dashboard)
   * **Tab 2:** `http://localhost:3000/ai-agent` (Autonomous Command Center)
4. If you rehearsed earlier and want a completely fresh benchmark state:
   * Click the **Reset Baseline** button in the top right of `/ai-agent`.

---

## 🎙️ Step-by-Step Presentation Script

---

### ACT 1: The Multi-Hub Problem & Executive Architecture (0:00 – 1:15)
**Speaker: Jass Shivnani**  
**Screen Display:** `http://localhost:3000` (Main Dashboard) $\to$ Switch to `http://localhost:3000/ai-agent`

#### 🗣️ Spoken Lines:
> *"Respected Evaluators and Faculty, welcome to our presentation on **Invenio AI** — an autonomous multi-agent inventory and supply chain operating system.*
>
> *Traditional inventory software relies on **static min/max reorder levels**. In practice, static buffers fail catastrophically: when promotional demand surges or supplier lead times drift, stores run dry while central warehouses sit on excess stock.*
>
> *Invenio AI replaces passive tracking with **autonomous cognitive agents**. Rather than merely reporting numbers, our agents execute a continuous closed-loop cycle: **Sense Demand $\to$ Quantify Stockout Risk $\to$ Shift Surplus Between Hubs $\to$ Evaluate Suppliers $\to$ Authorize Restock**.*
>
> *Our system operates on a real SQLite relational database tracking three physical fulfillment hubs across the Mumbai Metropolitan Region:*
> 1. ***Bhiwandi Central Mega Hub (WH-A)*** — bulk regional reserve storage.
> 2. ***Turbhe Cold Hub (WH-B)*** — temperature-controlled cold-chain distribution.
> 3. ***Chembur Retail Store (ST-C)*** — direct point-of-sale customer fulfillment.
>
> *Let us look at how our agents identify and neutralize stockout risks before customer sales are lost."*

---

### ACT 2: Demand Sensing, Volatility & Anomaly Radar (1:15 – 2:45)
**Speaker: Khushi Sadhuramani**  
**Screen Display:** `http://localhost:3000/ai-agent` (Focus on Executive KPI Strip and Multi-Hub Flow)

#### 🖱️ Live Action:
* Point to the **Stockout Risk Deficits** card showing `2 Critical SKUs`.
* Point to the **Multi-Hub Flow**: show Bhiwandi (1,240 units, 62% filled) and Turbhe (280 units, 35% filled).

#### 🗣️ Spoken Lines:
> *"Looking at our Executive KPIs, our demand forecasting agent continuously applies Holt-Winters double exponential smoothing with parameters $\alpha=0.45$ for level and $\beta=0.25$ for trend, augmented with seasonal indexing.*
>
> *For **Pasteurized Full-Cream Milk**, the network holds 120 units against a daily burn rate of 50 units. The agent calculates our **exact days of stock left at only 2.4 days**, while baseline supplier lead time is 3 days. A traditional system reports stock is above minimum, but our agent flags an immediate -0.6 day deficit.*
>
> *Simultaneously, observe **Probiotic Greek Yogurt**. Normal daily demand was 25 units. During an active summer promotion, demand spiked to 102 units per day.*
>
> *Our anomaly detection agent performed statistical Z-score analysis, identifying a $+308\%$ demand surge with a **Z-Score of 68.25**. The agent recognized this as a promotional burst rather than random shrinkage, and automatically scaled our **Adaptive Buffer Stock** to 109 units to protect regional availability."*

---

### ACT 3: Shift Surplus Stock Between Hubs (2:45 – 4:00)
**Speaker: Navya Rangwani**  
**Screen Display:** `http://localhost:3000/ai-agent` (Action Card: *Shift Surplus Stock Between Hubs*)

#### 🖱️ Live Action:
* Show the action card: **Shift Surplus Stock Between Hubs**.
* Point out the details: *Bhiwandi (Bay 4) $\to$ Turbhe (Rack 12), 50 units Whole Wheat Atta*.
* Click the button: **`[Authorize Inter-Hub Stock Shift (TR-201)]`**.
* Immediately point to the **Live Agent Activity & Audit Feed** on the right side: show the new audit card appear with exact bay/rack locations and **+₹15,025 saved**.

#### 🗣️ Spoken Lines:
> *"When a stockout threat appears, traditional systems immediately place expensive rush orders with external suppliers. But Invenio AI's **Inter-Hub Stock Optimizer** evaluates our internal distribution network first.*
>
> *Notice the imbalance: Turbhe Cold Hub held only 35 units of Whole Wheat Atta, facing runout in just 19 hours (0.8 days). Meanwhile, our Bhiwandi Central Mega Hub held 195 units — a healthy surplus above its 80-unit safety buffer.*
>
> *Instead of ordering from external suppliers at high rush rates, the agent scheduled an inter-hub shift: moving 50 units from Bhiwandi to Turbhe for just ₹475 transit cost.*
>
> *(Click 'Authorize Inter-Hub Stock Shift' now)*
>
> *Notice what just happened in real time. The database decremented Bhiwandi by 50 units, credited Turbhe to a healthy 85 units, and logged the complete trace to our **Live Agent Activity Feed**: exact source (Bay 4), destination (Rack 12), reason, and **₹15,025 saved in procurement capital**.*
>
> *Now let us navigate to our **Inventory** tab to see this verified in our multi-hub ledger."*

*(Click `/inventory` in sidebar — page loads instantly)*

> *"Here in the Multi-Hub Matrix, we can see the exact physical stock levels across Bhiwandi, Turbhe, and Chembur updated live."*

---

### ACT 4: Multi-Vendor Intelligence & Closed-Loop Procurement (4:00 – 5:30)
**Speaker: Jass Shivnani**  
**Screen Display:** `http://localhost:3000/purchase-orders` (Purchase Orders ledger)

#### 🖱️ Live Action:
* Point to the button: **`[Authorize Autonomous Restock]`**.
* Click it (shows loading spinner, then success message).
* In the table, highlight `PO-1024` for Full-Cream Milk.
* Point to the badge: `Autonomous` and the rationale: *Selected Vendor B (Amul Express, 2.0d SLA) over Vendor A (5.0d delay risk). Avoided ₹2,618 penalty.*
* Click **`[Receive]`** on `PO-1024`. Confirm the prompt. Status turns to `Received` (green chip).

#### 🗣️ Spoken Lines:
> *"For deficits that cannot be balanced internally, our **Supplier Intelligence and Procurement Agents** take over.*
>
> *For our critical Milk deficit, the agent evaluated three dairy suppliers. Vendor A offered ₹50 per unit, but required a 5-day lead time. Vendor B (Amul Express) charged ₹55, but guaranteed a 2-day cold-chain SLA. If a buyer blindly chose Vendor A to save ₹5 on unit price, our retail store would be completely dry for 2.6 days, incurring severe stockout penalties. Our agent mathematically selected Amul Express, avoiding **₹2,618 in stockout penalties**.*
>
> *(Click 'Authorize Autonomous Restock')*
>
> *Our agents sized the optimal economic order quantity, factored in bulk discount tiers, and generated Purchase Order PO-1024.*
>
> *(Click 'Receive' on PO-1024)*
>
> *When shipment arrives at the bay, clicking 'Receive' immediately increments our warehouse stock by +200 units, writes an audit record in the transactions ledger, and closes the operational loop. Total capital protected across our network: **₹17,643** at a **98.5% service level**."*

---

### ACT 5: Executive Synthesis & Faculty Defense (5:30 – 7:00)
**Speakers: All Team Members**

#### 🗣️ Spoken Lines (Jass):
> *"To conclude: Invenio AI bridges the gap between academic agentic AI research and real-world enterprise software. It eliminates stockouts, cuts procurement spend through inter-hub stock shifts, and maintains high service levels with complete transparency and zero guesswork.*
>
> *We are now open to questions from the faculty panel. Thank you."*

---

## 🛡️ Anticipated Faculty Q&A Defense Matrix

### Q1: "Why use dedicated quantitative agents alongside LLMs?"
* **Answer (Jass):** *"Pure LLM reasoning for numerical supply chain calculations can hallucinate or introduce latency. Mathematical operations like Holt-Winters exponential smoothing, EOQ sizing, and multi-hub inventory allocation must be deterministic and $O(1)$. In Invenio AI, specialized mathematical agents handle the high-speed algorithmic modeling, while Google Gemini 2.5 Flash operates as the Cognitive Orchestrator for function calling, anomaly interpretation, and conversational executive copiloting."*

### Q2: "How does your Adaptive Buffer Stock formula work?"
* **Answer (Khushi):** *"Static systems assume constant demand and lead times. Our volatility-adjusted buffer formula is:*
  $$SS = Z \cdot \sqrt{L \cdot \sigma_d^2 + \hat{d}^2 \cdot \sigma_L^2}$$
  *Where $Z$ is the service level factor, $L$ is lead time, $\sigma_d^2$ is demand variance, and $\sigma_L^2$ is supplier lead-time variance. When demand volatility spiked on Sunflower Oil or Greek Yogurt, the agent automatically expanded safety stock. When demand was steady on USB Cables, it contracted the buffer to avoid holding-cost bloat."*

### Q3: "What prevents inter-hub stock shifts from creating a deficit at the source warehouse?"
* **Answer (Navya):** *"The Inter-Hub Stock Optimizer enforces a strict constraint before scheduling any shift:*
  $$\text{Shift Quantity} \le \text{Current Stock}_{\text{Source}} - \text{Min Buffer}_{\text{Source}}$$
  *At Bhiwandi Hub, total wheat stock was 195 units against a minimum buffer of 80 units. Shifting 50 units left Bhiwandi with 145 units — comfortably above its safety threshold. If source stock is insufficient, the agent rejects lateral movement and routes an order to external suppliers."*

### Q4: "Is this connected to a real database or simulated in-memory?"
* **Answer (Navya):** *"It is 100% persistent in SQLite (`data/invenio_supply_chain.db`) with foreign key constraints, PRAGMA checks, and transaction auditing. Every invoice POS checkout decrements Chembur stock, every inter-hub shift moves units between warehouse node records, and every received PO credits warehouse stock and logs a transaction."*

### Q5: "How fast does the application run during the demo?"
* **Answer (Jass):** *"The entire application is pre-compiled for production using Next.js Turbopack. All 24 static and dynamic routes are pre-rendered into optimized bundles, delivering sub-50ms page transitions with zero runtime compilation delays."*
