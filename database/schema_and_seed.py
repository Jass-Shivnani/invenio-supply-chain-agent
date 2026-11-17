"""
SQLite Relational + Unified Inventory Graph Schema & Seed Data for Invenio AI (PS-08).
Includes exact PS-08 benchmark scenarios (Milk, Rice, Wheat Lateral Transfer, Yogurt +300% Spike,
Sunflower Oil High Volatility, and Invenio Electronics/Hardware SKUs).
"""

import json
import os
import sqlite3
from pathlib import Path

DEFAULT_DB_PATH = Path(__file__).resolve().parent.parent / "data" / "invenio_supply_chain.db"

SCHEMA_SQL = """
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS warehouses (
    warehouse_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    node_type TEXT NOT NULL,
    city TEXT NOT NULL,
    capacity_units INTEGER NOT NULL,
    holding_cost_multiplier REAL DEFAULT 1.0
);

CREATE TABLE IF NOT EXISTS products (
    sku TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    unit_selling_price REAL NOT NULL,
    base_holding_cost_per_day REAL NOT NULL,
    stockout_penalty_per_unit REAL NOT NULL,
    baseline_lead_time_days REAL NOT NULL,
    reorder_trigger_pct REAL DEFAULT 0.30,
    target_service_level REAL DEFAULT 0.95,
    seasonal_tag TEXT DEFAULT 'Neutral',
    seasonal_multiplier REAL DEFAULT 1.0
);

CREATE TABLE IF NOT EXISTS inventory_nodes (
    sku TEXT NOT NULL,
    warehouse_id TEXT NOT NULL,
    current_stock INTEGER NOT NULL,
    reserved_stock INTEGER DEFAULT 0,
    physical_audit_count INTEGER NOT NULL,
    min_node_buffer INTEGER NOT NULL,
    max_node_capacity INTEGER NOT NULL,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (sku, warehouse_id),
    FOREIGN KEY (sku) REFERENCES products(sku),
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(warehouse_id)
);

CREATE TABLE IF NOT EXISTS demand_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku TEXT NOT NULL,
    day_index INTEGER NOT NULL,
    date_label TEXT NOT NULL,
    units_sold INTEGER NOT NULL,
    promo_active INTEGER DEFAULT 0,
    FOREIGN KEY (sku) REFERENCES products(sku)
);

CREATE TABLE IF NOT EXISTS vendors (
    vendor_id TEXT NOT NULL,
    sku TEXT NOT NULL,
    vendor_name TEXT NOT NULL,
    unit_price REAL NOT NULL,
    lead_time_days REAL NOT NULL,
    lead_time_std_days REAL DEFAULT 0.3,
    reliability_score REAL NOT NULL,
    on_time_rate REAL NOT NULL,
    defect_rate REAL NOT NULL,
    moq INTEGER DEFAULT 50,
    bulk_threshold INTEGER DEFAULT 250,
    bulk_discount_pct REAL DEFAULT 0.0,
    PRIMARY KEY (vendor_id, sku),
    FOREIGN KEY (sku) REFERENCES products(sku)
);

CREATE TABLE IF NOT EXISTS purchase_orders (
    po_id TEXT PRIMARY KEY,
    sku TEXT NOT NULL,
    product_name TEXT NOT NULL,
    vendor_id TEXT NOT NULL,
    vendor_name TEXT NOT NULL,
    order_quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    discount_applied_pct REAL DEFAULT 0.0,
    total_cost REAL NOT NULL,
    delivery_deadline_days REAL NOT NULL,
    priority TEXT NOT NULL,
    status TEXT DEFAULT 'GENERATED',
    selection_reason TEXT NOT NULL,
    expected_profit_protected REAL DEFAULT 0.0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS warehouse_transfers (
    transfer_id TEXT PRIMARY KEY,
    sku TEXT NOT NULL,
    product_name TEXT NOT NULL,
    from_warehouse TEXT NOT NULL,
    to_warehouse TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    transfer_cost REAL NOT NULL,
    procurement_cost_saved REAL NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'SCHEDULED',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agent_audit_logs (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id TEXT NOT NULL,
    agent_name TEXT NOT NULL,
    sku TEXT NOT NULL,
    verdict TEXT NOT NULL,
    metrics_json TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    category_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS transactions (
    transaction_id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    type TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    date TEXT NOT NULL,
    reason TEXT,
    reference TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoices (
    invoice_id TEXT PRIMARY KEY,
    invoice_number TEXT NOT NULL,
    customer_name TEXT,
    customer_phone TEXT,
    total REAL NOT NULL,
    status TEXT DEFAULT 'PAID',
    date TEXT NOT NULL,
    items_json TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL,
    phone TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
"""

def init_and_seed_db(db_path: str | Path = DEFAULT_DB_PATH, force_reset: bool = True) -> Path:
    db_path = Path(db_path)
    db_path.parent.mkdir(parents=True, exist_ok=True)
    if force_reset and db_path.exists():
        db_path.unlink()

    conn = sqlite3.connect(str(db_path))
    cur = conn.cursor()
    cur.executescript(SCHEMA_SQL)

    # 1. Seed Warehouses & Fulfillment Centers (Page 2-3 of PS-08 PDF)
    warehouses = [
        ("WH-A", "Warehouse A (Bhiwandi Mega Hub)", "Regional Warehouse", "Bhiwandi, MMR", 5000, 0.90),
        ("WH-B", "Warehouse B (Turbhe Cold & Dry Hub)", "Regional Warehouse", "Navi Mumbai", 3500, 1.00),
        ("ST-C", "Store C (Chembur Online & Retail Node)", "Store & Micro-Fulfillment", "Chembur, Mumbai", 1500, 1.15),
    ]
    cur.executemany(
        "INSERT OR REPLACE INTO warehouses VALUES (?, ?, ?, ?, ?, ?)",
        warehouses,
    )

    # 2. Seed Products (PS-08 Benchmarks + Invenio Catalog)
    products = [
        # PS-08 Example 1: Milk (Stock=120, Daily Demand=50, Lead Time=3d -> Runout 2.4d, Order 200 units from Vendor B @ ₹55 = ₹11,000)
        ("SKU-MILK-01", "Pasteurized Full-Cream Milk (1L Pack)", "Dairy & Perishables", 68.0, 1.50, 28.0, 3.0, 0.35, 0.95, "Summer Peak (+12%)", 1.00),
        # PS-08 Example 2 & 3: Rice (Stock=500, Past demand 100, 120, 150, 140 -> Forecast 160/d, Lead Time=6d, Required=600@100/d or 960@160/d, Reorder 800 units)
        ("SKU-RICE-02", "Royal Aged Basmati Rice (5kg Bag)", "Staples & Grains", 460.0, 2.20, 95.0, 6.0, 0.30, 0.95, "Festival Staple (+14%)", 1.05),
        # PS-08 Example 7: Warehouse Optimization (Warehouse A Overstock vs Warehouse B Stockout Risk -> Transfer 50 units from A to B)
        ("SKU-WHEAT-03", "Chakki Fresh Whole Wheat Atta (10kg)", "Staples & Grains", 410.0, 2.00, 80.0, 4.0, 0.30, 0.95, "Steady Staple", 1.00),
        # PS-08 Example 8: Anomaly Detection (+300% Demand Spike due to promotion)
        ("SKU-YOGURT-04", "Probiotic Greek Yogurt Tub (400g)", "Dairy & Perishables", 115.0, 2.50, 42.0, 2.0, 0.35, 0.95, "Summer Promo (+300%)", 1.25),
        # PS-08 Advanced Feature 1: High Volatility Dynamic Safety Stock
        ("SKU-OIL-05", "Cold-Pressed Sunflower Oil (1L Pouch)", "Cooking Essentials", 185.0, 1.40, 48.0, 4.0, 0.30, 0.98, "High Volatility", 1.00),
        # Invenio Remastered SKU 1: Wireless Ergonomic Mouse (Bulk Discount Optimization)
        ("SKU-MOUSE-06", "Invenio Pro Wireless Ergonomic Mouse", "Electronics (Invenio)", 1199.0, 3.50, 310.0, 5.0, 0.30, 0.95, "Back-to-Campus", 1.05),
        # Invenio Remastered SKU 2: Healthy Stock Baseline
        ("SKU-CABLE-07", "Braided USB-C 100W PD Fast Cable", "Electronics (Invenio)", 499.0, 1.10, 120.0, 4.0, 0.25, 0.95, "Steady Accessory", 1.00),
        # B2B Industrial Hardware SKU: Physical vs System Inventory Mismatch + Supplier Delay Risk
        ("SKU-DRILL-08", "Brushless Cordless Hammer Drill 850W", "Industrial Hardware", 4850.0, 8.50, 950.0, 5.0, 0.30, 0.98, "Contractor Surge", 1.10),
    ]
    cur.executemany(
        "INSERT OR REPLACE INTO products VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        products,
    )

    # 3. Seed Multi-Warehouse Inventory Graph (Warehouse A, Warehouse B, Store C)
    inventory_nodes = [
        # SKU-MILK-01: Total = 120 units (WH-A: 65, WH-B: 35, ST-C: 20)
        ("SKU-MILK-01", "WH-A", 65, 0, 65, 80, 300),
        ("SKU-MILK-01", "WH-B", 35, 0, 35, 60, 220),
        ("SKU-MILK-01", "ST-C", 20, 0, 20, 40, 120),
        # SKU-RICE-02: Total = 500 units (WH-A: 260, WH-B: 160, ST-C: 80)
        ("SKU-RICE-02", "WH-A", 260, 0, 260, 350, 1200),
        ("SKU-RICE-02", "WH-B", 160, 0, 160, 250, 900),
        ("SKU-RICE-02", "ST-C", 80, 0, 80, 120, 400),
        # SKU-WHEAT-03: Total = 260 units (WH-A: 195 OVERSTOCK vs min 90, WH-B: 35 STOCKOUT RISK vs min 85, ST-C: 30)
        ("SKU-WHEAT-03", "WH-A", 195, 0, 195, 80, 180),
        ("SKU-WHEAT-03", "WH-B", 35, 0, 35, 85, 250),
        ("SKU-WHEAT-03", "ST-C", 30, 0, 30, 30, 120),
        # SKU-YOGURT-04: Total = 95 units (WH-A: 50, WH-B: 30, ST-C: 15)
        ("SKU-YOGURT-04", "WH-A", 50, 0, 50, 60, 250),
        ("SKU-YOGURT-04", "WH-B", 30, 0, 30, 45, 180),
        ("SKU-YOGURT-04", "ST-C", 15, 0, 15, 25, 100),
        # SKU-OIL-05: Total = 210 units (WH-A: 110, WH-B: 60, ST-C: 40)
        ("SKU-OIL-05", "WH-A", 110, 0, 110, 130, 450),
        ("SKU-OIL-05", "WH-B", 60, 0, 60, 90, 300),
        ("SKU-OIL-05", "ST-C", 40, 0, 40, 50, 160),
        # SKU-MOUSE-06: Total = 85 units (WH-A: 45, WH-B: 25, ST-C: 15)
        ("SKU-MOUSE-06", "WH-A", 45, 0, 45, 55, 250),
        ("SKU-MOUSE-06", "WH-B", 25, 0, 25, 35, 150),
        ("SKU-MOUSE-06", "ST-C", 15, 0, 15, 20, 80),
        # SKU-CABLE-07: Total = 340 units (Healthy stock)
        ("SKU-CABLE-07", "WH-A", 180, 0, 180, 60, 400),
        ("SKU-CABLE-07", "WH-B", 100, 0, 100, 40, 250),
        ("SKU-CABLE-07", "ST-C", 60, 0, 60, 25, 120),
        # SKU-DRILL-08: Total = 28 units, Physical Audit at WH-B is 6 instead of 10 (4-unit shrinkage mismatch!)
        ("SKU-DRILL-08", "WH-A", 12, 0, 12, 18, 80),
        ("SKU-DRILL-08", "WH-B", 10, 0, 6, 14, 60),
        ("SKU-DRILL-08", "ST-C", 6, 0, 6, 8, 30),
    ]
    cur.executemany(
        "INSERT OR REPLACE INTO inventory_nodes (sku, warehouse_id, current_stock, reserved_stock, physical_audit_count, min_node_buffer, max_node_capacity) VALUES (?, ?, ?, ?, ?, ?, ?)",
        inventory_nodes,
    )

    # 4. Seed 14-Day Demand History per SKU
    demand_series = {
        # Milk: steady ~50 units/day
        "SKU-MILK-01": [48, 51, 49, 50, 52, 48, 50, 49, 51, 50, 48, 52, 50, 50],
        # Rice: matches PS-08 Page 3 progression (100 -> 120 -> 150 -> 140 -> trending toward 160)
        "SKU-RICE-02": [98, 100, 102, 100, 118, 120, 122, 148, 150, 152, 138, 140, 142, 140],
        # Wheat: ~40 units/day overall, healthy total stock via lateral transfer
        "SKU-WHEAT-03": [39, 41, 40, 38, 42, 40, 41, 39, 40, 41, 39, 40, 41, 40],
        # Yogurt: ~25 units/day for 12 days, then +300% promo spike to 100 units/day on days 13-14!
        "SKU-YOGURT-04": [24, 26, 25, 23, 27, 25, 24, 26, 25, 24, 26, 25, 98, 102],
        # Sunflower Oil: high volatility around 65 units/day (swings between 32 and 104)
        "SKU-OIL-05": [40, 92, 35, 98, 44, 88, 32, 104, 41, 90, 38, 96, 45, 67],
        # Mouse: ~18 units/day
        "SKU-MOUSE-06": [16, 17, 18, 17, 19, 18, 17, 19, 20, 18, 19, 20, 19, 20],
        # Cable: ~22 units/day
        "SKU-CABLE-07": [21, 23, 22, 20, 24, 22, 21, 23, 22, 21, 23, 22, 22, 22],
        # Drill: ~8 units/day
        "SKU-DRILL-08": [7, 8, 8, 9, 7, 8, 9, 8, 8, 9, 7, 9, 8, 9],
    }
    demand_rows = []
    for sku, values in demand_series.items():
        for idx, val in enumerate(values, start=1):
            promo = 1 if (sku == "SKU-YOGURT-04" and idx >= 13) else 0
            demand_rows.append((sku, idx, f"2026-11-{idx:02d}", val, promo))
    cur.executemany(
        "INSERT INTO demand_history (sku, day_index, date_label, units_sold, promo_active) VALUES (?, ?, ?, ?, ?)",
        demand_rows,
    )

    # 5. Seed Multi-Vendor Catalog (PS-08 Page 4-5 Vendor A vs Vendor B + full supplier matrix)
    vendors = [
        # SKU-MILK-01: Vendor A (₹50/unit, 5 days) vs Vendor B (₹55/unit, 2 days) -> PS-08 selects Vendor B!
        ("VEN-A", "SKU-MILK-01", "Vendor A (Govind Dairy Bulk)", 50.0, 5.0, 0.6, 0.91, 0.89, 0.015, 100, 300, 4.0),
        ("VEN-B", "SKU-MILK-01", "Vendor B (Amul Express Cold-Chain)", 55.0, 2.0, 0.2, 0.985, 0.99, 0.004, 100, 300, 3.0),
        ("VEN-C", "SKU-MILK-01", "Vendor C (Mother Dairy Metro Direct)", 58.0, 2.5, 0.3, 0.95, 0.94, 0.008, 80, 250, 2.5),

        # SKU-RICE-02: Order 800 units -> Bulk discount applies at >= 500 units
        ("VEN-R1", "SKU-RICE-02", "Punjab Agro Mills (Standard Rail)", 340.0, 6.0, 0.8, 0.90, 0.88, 0.012, 200, 500, 6.0),
        ("VEN-R2", "SKU-RICE-02", "KRBL FastFreight Logistics", 355.0, 3.0, 0.3, 0.975, 0.98, 0.005, 200, 600, 5.0),

        # SKU-WHEAT-03
        ("VEN-W1", "SKU-WHEAT-03", "MP Sharbati Grain Co-op", 305.0, 4.0, 0.4, 0.94, 0.93, 0.008, 100, 300, 5.0),
        ("VEN-W2", "SKU-WHEAT-03", "ITC Agro Express Hub", 320.0, 2.0, 0.2, 0.98, 0.98, 0.004, 100, 300, 4.0),

        # SKU-YOGURT-04
        ("VEN-Y1", "SKU-YOGURT-04", "Epigamia Cold-Chain Express", 78.0, 1.5, 0.2, 0.98, 0.97, 0.005, 80, 200, 5.0),
        ("VEN-Y2", "SKU-YOGURT-04", "Danone Regional Distributor", 72.0, 4.0, 0.6, 0.89, 0.87, 0.018, 100, 250, 6.0),

        # SKU-OIL-05
        ("VEN-O1", "SKU-OIL-05", "Gemini Edibles Bulk Depot", 138.0, 4.5, 0.5, 0.92, 0.91, 0.010, 150, 400, 5.0),
        ("VEN-O2", "SKU-OIL-05", "Saffola Prime Logistics", 144.0, 2.0, 0.2, 0.975, 0.98, 0.004, 120, 300, 4.5),

        # SKU-MOUSE-06
        ("VEN-M1", "SKU-MOUSE-06", "Shenzhen Peripheral Imports", 690.0, 7.0, 1.1, 0.88, 0.85, 0.022, 50, 150, 8.0),
        ("VEN-M2", "SKU-MOUSE-06", "Bhiwandi Tech Distribution", 740.0, 2.5, 0.3, 0.97, 0.96, 0.006, 40, 100, 6.0),

        # SKU-CABLE-07
        ("VEN-C1", "SKU-CABLE-07", "Anker-OEM Mumbai Hub", 240.0, 3.0, 0.3, 0.96, 0.95, 0.007, 100, 300, 5.0),

        # SKU-DRILL-08
        ("VEN-D1", "SKU-DRILL-08", "Shree Krishna B2B Industrial Tools", 3350.0, 2.0, 0.2, 0.985, 0.99, 0.003, 15, 40, 6.0),
        ("VEN-D2", "SKU-DRILL-08", "Generic Tool Importers", 3150.0, 6.5, 0.9, 0.86, 0.84, 0.025, 20, 50, 5.0),
    ]
    cur.executemany(
        "INSERT OR REPLACE INTO vendors VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        vendors,
    )

    # 6. Seed Categories
    categories = [
        ("CAT-DAIRY", "Dairy & Perishables", "Fresh cold-chain products"),
        ("CAT-GRAIN", "Staples & Grains", "Rice, Wheat, and high-volume staples"),
        ("CAT-COOK", "Cooking Essentials", "Edible oils, spices, and groceries"),
        ("CAT-ELEC", "Electronics (Invenio)", "Computer peripherals, smart devices and accessories"),
        ("CAT-IND", "Industrial Hardware", "B2B power tools, equipment, and consumables"),
    ]
    cur.executemany(
        "INSERT OR REPLACE INTO categories VALUES (?, ?, ?)",
        categories,
    )

    # 7. Seed Admin and Manager Users
    users = [
        ("USR-01", "Jass Shivnani", "jass@invenio.ai", "admin", "+91 98765 43210"),
        ("USR-02", "Operations Manager", "manager@invenio.ai", "manager", "+91 98765 43211"),
        ("USR-03", "Store Fulfillment Chembur", "store_c@invenio.ai", "staff", "+91 98765 43212"),
    ]
    cur.executemany(
        "INSERT OR REPLACE INTO users (user_id, name, email, role, phone) VALUES (?, ?, ?, ?, ?)",
        users,
    )

    conn.commit()
    conn.close()
    return db_path

if __name__ == "__main__":
    p = init_and_seed_db()
    print(f"Seeded SQLite database at: {p}")
