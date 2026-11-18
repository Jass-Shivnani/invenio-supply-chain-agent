"""
SQLite Relational + Unified Inventory Graph Schema & Seed Data for Invenio AI (PS-08).
Includes exact PS-08 benchmark scenarios (Milk, Rice, Wheat Lateral Transfer, Yogurt +300% Spike,
Sunflower Oil High Volatility, and Invenio Electronics/Hardware SKUs) plus rich enterprise catalog
covering 28 products, multi-vendor tiers, multi-hub inventory nodes, customer database, invoices,
purchase orders, transactions, and agent audit trails.
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
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
    agent_id TEXT NOT NULL,
    agent_name TEXT NOT NULL,
    action_type TEXT NOT NULL,
    sku TEXT NOT NULL,
    product_name TEXT NOT NULL,
    location_from TEXT DEFAULT 'N/A',
    location_to TEXT DEFAULT 'N/A',
    quantity INTEGER DEFAULT 0,
    why_reason TEXT NOT NULL,
    financial_impact REAL DEFAULT 0.0,
    details_json TEXT DEFAULT '{}'
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

CREATE TABLE IF NOT EXISTS customers (
    customer_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    email TEXT,
    address TEXT,
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

    # 1. Seed Warehouses & Fulfillment Centers
    warehouses = [
        ("WH-A", "Warehouse A (Bhiwandi Mega Hub)", "Regional Warehouse", "Bhiwandi, MMR", 5000, 0.90),
        ("WH-B", "Warehouse B (Turbhe Cold & Dry Hub)", "Regional Warehouse", "Navi Mumbai", 3500, 1.00),
        ("ST-C", "Store C (Chembur Online & Retail Node)", "Store & Micro-Fulfillment", "Chembur, Mumbai", 1500, 1.15),
    ]
    cur.executemany(
        "INSERT OR REPLACE INTO warehouses VALUES (?, ?, ?, ?, ?, ?)",
        warehouses,
    )

    # 2. Seed Categories (7 Categories)
    categories = [
        ("CAT-DAIRY", "Dairy & Perishables", "Fresh cold-chain products & daily essentials"),
        ("CAT-GRAIN", "Staples & Grains", "Rice, Wheat, and high-volume pulses"),
        ("CAT-COOK", "Cooking Essentials", "Edible oils, pure ghee, salt & organic spices"),
        ("CAT-BEV", "Beverages & Snacks", "Premium tea, roasted dry fruits & filter coffee"),
        ("CAT-ELEC", "Electronics (Invenio)", "Computer peripherals, smart chargers & fast cables"),
        ("CAT-IND", "Industrial Hardware", "B2B power tools, angle grinders & PPE equipment"),
        ("CAT-PACK", "Packaging & Logistics", "Corrugated boxes, bubble wraps & tamper-proof tapes"),
    ]
    cur.executemany(
        "INSERT OR REPLACE INTO categories VALUES (?, ?, ?)",
        categories,
    )

    # 3. Seed Products (28 Products)
    # Note: SKUs 01 to 08 preserve exact PS-08 test constraints.
    products = [
        # --- PS-08 Core Benchmarks ---
        ("SKU-MILK-01", "Pasteurized Full-Cream Milk (1L Pack)", "Dairy & Perishables", 68.0, 1.50, 28.0, 3.0, 0.35, 0.95, "Summer Peak (+12%)", 1.00),
        ("SKU-RICE-02", "Royal Aged Basmati Rice (5kg Bag)", "Staples & Grains", 460.0, 2.20, 95.0, 6.0, 0.30, 0.95, "Festival Staple (+14%)", 1.05),
        ("SKU-WHEAT-03", "Chakki Fresh Whole Wheat Atta (10kg)", "Staples & Grains", 410.0, 2.00, 80.0, 4.0, 0.30, 0.95, "Steady Staple", 1.00),
        ("SKU-YOGURT-04", "Probiotic Greek Yogurt Tub (400g)", "Dairy & Perishables", 115.0, 2.50, 42.0, 2.0, 0.35, 0.95, "Summer Promo (+300%)", 1.25),
        ("SKU-OIL-05", "Cold-Pressed Sunflower Oil (1L Pouch)", "Cooking Essentials", 185.0, 1.40, 48.0, 4.0, 0.30, 0.98, "High Volatility", 1.00),
        ("SKU-MOUSE-06", "Invenio Pro Wireless Ergonomic Mouse", "Electronics (Invenio)", 1199.0, 3.50, 310.0, 5.0, 0.30, 0.95, "Back-to-Campus", 1.05),
        ("SKU-CABLE-07", "Braided USB-C 100W PD Fast Cable", "Electronics (Invenio)", 499.0, 1.10, 120.0, 4.0, 0.25, 0.95, "Steady Accessory", 1.00),
        ("SKU-DRILL-08", "Brushless Cordless Hammer Drill 850W", "Industrial Hardware", 4850.0, 8.50, 950.0, 5.0, 0.30, 0.98, "Contractor Surge", 1.10),

        # --- Expanded Dairy & Perishables ---
        ("SKU-BUTTER-09", "Amul Pasteurized Salted Butter (500g)", "Dairy & Perishables", 275.0, 1.80, 55.0, 3.0, 0.30, 0.96, "Steady Dairy", 1.00),
        ("SKU-PANEER-10", "Fresh Malai Paneer Vacuum Block (200g)", "Dairy & Perishables", 95.0, 2.20, 35.0, 2.0, 0.35, 0.97, "Perishable Quick-Turn", 1.00),
        ("SKU-CURD-11", "Mother Dairy Classic Dahi Tub (1kg)", "Dairy & Perishables", 85.0, 1.40, 25.0, 2.0, 0.30, 0.95, "Daily Breakfast", 1.00),
        ("SKU-CHEESE-12", "Amul Processed Cheese Slices (200g / 10pk)", "Dairy & Perishables", 145.0, 1.60, 40.0, 3.0, 0.25, 0.95, "Steady Grocery", 1.00),

        # --- Expanded Staples & Grains ---
        ("SKU-KOLAM-13", "Wada Kolam Daily Steam Rice (10kg Bag)", "Staples & Grains", 680.0, 2.40, 110.0, 5.0, 0.30, 0.95, "Household Staple", 1.00),
        ("SKU-TOORDAL-14", "Unpolished Desi Toor Dal (1kg Pack)", "Staples & Grains", 165.0, 1.20, 38.0, 4.0, 0.30, 0.95, "High Turnover", 1.00),
        ("SKU-MOONG-15", "Organic Yellow Moong Dal Split (1kg Pack)", "Staples & Grains", 140.0, 1.10, 32.0, 4.0, 0.25, 0.95, "Steady Pulse", 1.00),
        ("SKU-MAIDA-16", "Super Fine Bakery Maida (5kg Bag)", "Staples & Grains", 210.0, 1.50, 45.0, 4.0, 0.25, 0.94, "Commercial Bakery", 1.00),

        # --- Expanded Cooking Essentials ---
        ("SKU-GHEE-17", "Amul Pure Cow Desi Ghee (1L Tin)", "Cooking Essentials", 650.0, 2.00, 120.0, 4.0, 0.25, 0.96, "High Margin Staple", 1.05),
        ("SKU-MUSTARD-18", "Fortune Kachi Ghani Mustard Oil (1L Bottle)", "Cooking Essentials", 155.0, 1.30, 35.0, 4.0, 0.30, 0.95, "Kitchen Essential", 1.00),
        ("SKU-SALT-19", "Tata Vacuum Evaporated Iodized Salt (1kg Pouch)", "Cooking Essentials", 28.0, 0.40, 12.0, 3.0, 0.20, 0.98, "High Velocity", 1.00),
        ("SKU-SPICE-20", "Everest Pure Turmeric & Coriander Combo (500g)", "Cooking Essentials", 175.0, 1.10, 30.0, 4.0, 0.25, 0.95, "Steady Grocery", 1.00),

        # --- Expanded Beverages & Snacks ---
        ("SKU-TEA-21", "Wagh Bakri Premium Assam Leaf Tea (1kg Pack)", "Beverages & Snacks", 490.0, 1.80, 85.0, 5.0, 0.30, 0.96, "Breakfast Essential", 1.00),
        ("SKU-COFFEE-22", "Nescafe Classic Instant Coffee Jar (200g)", "Beverages & Snacks", 385.0, 1.50, 75.0, 4.0, 0.25, 0.95, "Office Favorite", 1.00),
        ("SKU-ALMOND-23", "California Select Whole Almonds (500g Pouch)", "Beverages & Snacks", 420.0, 2.20, 95.0, 5.0, 0.25, 0.95, "Dry Fruit High Demand", 1.05),

        # --- Expanded Electronics (Invenio) ---
        ("SKU-KEYBOARD-24", "Invenio Tenkeyless RGB Mechanical Keyboard", "Electronics (Invenio)", 2499.0, 4.50, 450.0, 5.0, 0.25, 0.96, "Developer Favorite", 1.00),
        ("SKU-CHARGER-25", "Invenio 65W GaN Dual USB-C Fast Charger", "Electronics (Invenio)", 1499.0, 2.80, 260.0, 4.0, 0.25, 0.95, "Tech Gadget", 1.00),
        ("SKU-WEBCAM-26", "Invenio Vision 1080p 60fps Pro Webcam", "Electronics (Invenio)", 1899.0, 3.20, 320.0, 5.0, 0.25, 0.95, "Remote Work Kit", 1.00),

        # --- Expanded Industrial Hardware ---
        ("SKU-GRINDER-27", "Bosch Heavy-Duty Angle Grinder 850W 100mm", "Industrial Hardware", 2850.0, 5.50, 520.0, 4.0, 0.25, 0.97, "Workshop Tool", 1.00),
        ("SKU-HELMET-28", "Karam Industrial Safety Helmet with Visor", "Industrial Hardware", 420.0, 1.20, 80.0, 3.0, 0.25, 0.95, "Site Safety Equipment", 1.00),
    ]
    cur.executemany(
        "INSERT OR REPLACE INTO products VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        products,
    )

    # 4. Seed Multi-Warehouse Inventory Graph (84 Nodes = 28 products * 3 locations)
    inventory_nodes = [
        # --- Core PS-08 Nodes (Preserved for Benchmark TC-01..08) ---
        ("SKU-MILK-01", "WH-A", 65, 0, 65, 80, 300),
        ("SKU-MILK-01", "WH-B", 35, 0, 35, 60, 220),
        ("SKU-MILK-01", "ST-C", 20, 0, 20, 40, 120),

        ("SKU-RICE-02", "WH-A", 260, 0, 260, 350, 1200),
        ("SKU-RICE-02", "WH-B", 160, 0, 160, 250, 900),
        ("SKU-RICE-02", "ST-C", 80, 0, 80, 120, 400),

        ("SKU-WHEAT-03", "WH-A", 195, 0, 195, 80, 180),
        ("SKU-WHEAT-03", "WH-B", 35, 0, 35, 85, 250),
        ("SKU-WHEAT-03", "ST-C", 30, 0, 30, 30, 120),

        ("SKU-YOGURT-04", "WH-A", 50, 0, 50, 60, 250),
        ("SKU-YOGURT-04", "WH-B", 30, 0, 30, 45, 180),
        ("SKU-YOGURT-04", "ST-C", 15, 0, 15, 25, 100),

        ("SKU-OIL-05", "WH-A", 110, 0, 110, 130, 450),
        ("SKU-OIL-05", "WH-B", 60, 0, 60, 90, 300),
        ("SKU-OIL-05", "ST-C", 40, 0, 40, 50, 160),

        ("SKU-MOUSE-06", "WH-A", 45, 0, 45, 55, 250),
        ("SKU-MOUSE-06", "WH-B", 25, 0, 25, 35, 150),
        ("SKU-MOUSE-06", "ST-C", 15, 0, 15, 20, 80),

        ("SKU-CABLE-07", "WH-A", 180, 0, 180, 60, 400),
        ("SKU-CABLE-07", "WH-B", 100, 0, 100, 40, 250),
        ("SKU-CABLE-07", "ST-C", 60, 0, 60, 25, 120),

        ("SKU-DRILL-08", "WH-A", 12, 0, 12, 18, 80),
        ("SKU-DRILL-08", "WH-B", 10, 0, 6, 14, 60),
        ("SKU-DRILL-08", "ST-C", 6, 0, 6, 8, 30),

        # --- Expanded SKUs (SKU-09 to SKU-28) ---
        ("SKU-BUTTER-09", "WH-A", 80, 0, 80, 50, 200),
        ("SKU-BUTTER-09", "WH-B", 45, 0, 45, 35, 150),
        ("SKU-BUTTER-09", "ST-C", 25, 0, 25, 20, 80),

        ("SKU-PANEER-10", "WH-A", 50, 0, 50, 40, 150),
        ("SKU-PANEER-10", "WH-B", 40, 0, 40, 30, 120),
        ("SKU-PANEER-10", "ST-C", 20, 0, 20, 15, 60),

        ("SKU-CURD-11", "WH-A", 90, 0, 90, 60, 250),
        ("SKU-CURD-11", "WH-B", 60, 0, 60, 45, 180),
        ("SKU-CURD-11", "ST-C", 35, 0, 35, 25, 100),

        ("SKU-CHEESE-12", "WH-A", 70, 0, 70, 40, 180),
        ("SKU-CHEESE-12", "WH-B", 50, 0, 50, 30, 120),
        ("SKU-CHEESE-12", "ST-C", 30, 0, 30, 20, 80),

        ("SKU-KOLAM-13", "WH-A", 180, 0, 180, 120, 600),
        ("SKU-KOLAM-13", "WH-B", 120, 0, 120, 80, 400),
        ("SKU-KOLAM-13", "ST-C", 50, 0, 50, 35, 150),

        ("SKU-TOORDAL-14", "WH-A", 140, 0, 140, 90, 400),
        ("SKU-TOORDAL-14", "WH-B", 95, 0, 95, 60, 280),
        ("SKU-TOORDAL-14", "ST-C", 45, 0, 45, 30, 120),

        ("SKU-MOONG-15", "WH-A", 120, 0, 120, 80, 350),
        ("SKU-MOONG-15", "WH-B", 80, 0, 80, 50, 240),
        ("SKU-MOONG-15", "ST-C", 40, 0, 40, 25, 100),

        ("SKU-MAIDA-16", "WH-A", 110, 0, 110, 70, 300),
        ("SKU-MAIDA-16", "WH-B", 70, 0, 70, 45, 200),
        ("SKU-MAIDA-16", "ST-C", 30, 0, 30, 20, 90),

        ("SKU-GHEE-17", "WH-A", 60, 0, 60, 35, 180),
        ("SKU-GHEE-17", "WH-B", 40, 0, 40, 25, 120),
        ("SKU-GHEE-17", "ST-C", 20, 0, 20, 15, 60),

        ("SKU-MUSTARD-18", "WH-A", 130, 0, 130, 80, 350),
        ("SKU-MUSTARD-18", "WH-B", 80, 0, 80, 50, 220),
        ("SKU-MUSTARD-18", "ST-C", 45, 0, 45, 30, 110),

        ("SKU-SALT-19", "WH-A", 400, 0, 400, 200, 1000),
        ("SKU-SALT-19", "WH-B", 250, 0, 250, 150, 700),
        ("SKU-SALT-19", "ST-C", 150, 0, 150, 80, 350),

        ("SKU-SPICE-20", "WH-A", 150, 0, 150, 90, 400),
        ("SKU-SPICE-20", "WH-B", 100, 0, 100, 60, 250),
        ("SKU-SPICE-20", "ST-C", 50, 0, 50, 30, 120),

        ("SKU-TEA-21", "WH-A", 120, 0, 120, 70, 350),
        ("SKU-TEA-21", "WH-B", 85, 0, 85, 50, 220),
        ("SKU-TEA-21", "ST-C", 45, 0, 45, 25, 100),

        ("SKU-COFFEE-22", "WH-A", 95, 0, 95, 55, 250),
        ("SKU-COFFEE-22", "WH-B", 65, 0, 65, 40, 180),
        ("SKU-COFFEE-22", "ST-C", 30, 0, 30, 20, 80),

        ("SKU-ALMOND-23", "WH-A", 80, 0, 80, 45, 200),
        ("SKU-ALMOND-23", "WH-B", 50, 0, 50, 30, 140),
        ("SKU-ALMOND-23", "ST-C", 25, 0, 25, 15, 70),

        ("SKU-KEYBOARD-24", "WH-A", 35, 0, 35, 20, 100),
        ("SKU-KEYBOARD-24", "WH-B", 20, 0, 20, 12, 60),
        ("SKU-KEYBOARD-24", "ST-C", 10, 0, 10, 8, 30),

        ("SKU-CHARGER-25", "WH-A", 55, 0, 55, 30, 150),
        ("SKU-CHARGER-25", "WH-B", 35, 0, 35, 20, 90),
        ("SKU-CHARGER-25", "ST-C", 20, 0, 20, 12, 50),

        ("SKU-WEBCAM-26", "WH-A", 40, 0, 40, 25, 110),
        ("SKU-WEBCAM-26", "WH-B", 25, 0, 25, 15, 70),
        ("SKU-WEBCAM-26", "ST-C", 15, 0, 15, 10, 40),

        ("SKU-GRINDER-27", "WH-A", 18, 0, 18, 12, 50),
        ("SKU-GRINDER-27", "WH-B", 12, 0, 12, 8, 35),
        ("SKU-GRINDER-27", "ST-C", 6, 0, 6, 4, 15),

        ("SKU-HELMET-28", "WH-A", 75, 0, 75, 40, 200),
        ("SKU-HELMET-28", "WH-B", 45, 0, 45, 25, 120),
        ("SKU-HELMET-28", "ST-C", 20, 0, 20, 12, 60),
    ]
    cur.executemany(
        "INSERT OR REPLACE INTO inventory_nodes (sku, warehouse_id, current_stock, reserved_stock, physical_audit_count, min_node_buffer, max_node_capacity) VALUES (?, ?, ?, ?, ?, ?, ?)",
        inventory_nodes,
    )

    # 5. Seed 14-Day Demand History per SKU (28 Series)
    demand_series = {
        # Core Benchmarks
        "SKU-MILK-01": [48, 51, 49, 50, 52, 48, 50, 49, 51, 50, 48, 52, 50, 50],
        "SKU-RICE-02": [98, 100, 102, 100, 118, 120, 122, 148, 150, 152, 138, 140, 142, 140],
        "SKU-WHEAT-03": [39, 41, 40, 38, 42, 40, 41, 39, 40, 41, 39, 40, 41, 40],
        "SKU-YOGURT-04": [24, 26, 25, 23, 27, 25, 24, 26, 25, 24, 26, 25, 98, 102],
        "SKU-OIL-05": [40, 92, 35, 98, 44, 88, 32, 104, 41, 90, 38, 96, 45, 67],
        "SKU-MOUSE-06": [16, 17, 18, 17, 19, 18, 17, 19, 20, 18, 19, 20, 19, 20],
        "SKU-CABLE-07": [21, 23, 22, 20, 24, 22, 21, 23, 22, 21, 23, 22, 22, 22],
        "SKU-DRILL-08": [7, 8, 8, 9, 7, 8, 9, 8, 8, 9, 7, 9, 8, 9],

        # Expanded Items
        "SKU-BUTTER-09": [22, 24, 25, 23, 26, 25, 24, 25, 27, 26, 24, 25, 26, 25],
        "SKU-PANEER-10": [28, 30, 29, 31, 30, 29, 32, 30, 31, 29, 30, 31, 30, 30],
        "SKU-CURD-11": [35, 36, 38, 37, 39, 38, 37, 38, 40, 39, 38, 39, 38, 38],
        "SKU-CHEESE-12": [18, 19, 20, 19, 21, 20, 19, 20, 22, 21, 20, 21, 20, 20],
        "SKU-KOLAM-13": [42, 45, 44, 46, 45, 44, 47, 45, 46, 44, 45, 46, 45, 45],
        "SKU-TOORDAL-14": [32, 34, 35, 33, 36, 35, 34, 35, 37, 36, 34, 35, 36, 35],
        "SKU-MOONG-15": [26, 28, 27, 29, 28, 27, 30, 28, 29, 27, 28, 29, 28, 28],
        "SKU-MAIDA-16": [20, 22, 21, 23, 22, 21, 24, 22, 23, 21, 22, 23, 22, 22],
        "SKU-GHEE-17": [14, 15, 16, 15, 17, 16, 15, 16, 18, 17, 15, 16, 17, 16],
        "SKU-MUSTARD-18": [30, 32, 31, 33, 32, 31, 34, 32, 33, 31, 32, 33, 32, 32],
        "SKU-SALT-19": [65, 68, 67, 70, 69, 68, 72, 70, 71, 69, 70, 71, 70, 70],
        "SKU-SPICE-20": [28, 30, 29, 31, 30, 29, 32, 30, 31, 29, 30, 31, 30, 30],
        "SKU-TEA-21": [24, 26, 25, 27, 26, 25, 28, 26, 27, 25, 26, 27, 26, 26],
        "SKU-COFFEE-22": [18, 20, 19, 21, 20, 19, 22, 20, 21, 19, 20, 21, 20, 20],
        "SKU-ALMOND-23": [15, 16, 17, 16, 18, 17, 16, 17, 19, 18, 16, 17, 18, 17],
        "SKU-KEYBOARD-24": [6, 7, 7, 8, 6, 7, 8, 7, 7, 8, 6, 8, 7, 8],
        "SKU-CHARGER-25": [12, 14, 13, 15, 14, 13, 16, 14, 15, 13, 14, 15, 14, 14],
        "SKU-WEBCAM-26": [8, 9, 9, 10, 8, 9, 10, 9, 9, 10, 8, 10, 9, 10],
        "SKU-GRINDER-27": [4, 5, 5, 6, 4, 5, 6, 5, 5, 6, 4, 6, 5, 5],
        "SKU-HELMET-28": [14, 15, 16, 15, 17, 16, 15, 16, 18, 17, 15, 16, 17, 16],
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

    # 6. Seed Multi-Vendor Catalog
    vendors = [
        # SKU-MILK-01 (Vendor B Amul selected in PS-08 benchmark)
        ("VEN-A", "SKU-MILK-01", "Vendor A (Govind Dairy Bulk)", 50.0, 5.0, 0.6, 0.91, 0.89, 0.015, 100, 300, 4.0),
        ("VEN-B", "SKU-MILK-01", "Vendor B (Amul Express Cold-Chain)", 55.0, 2.0, 0.2, 0.985, 0.99, 0.004, 100, 300, 3.0),
        ("VEN-C", "SKU-MILK-01", "Vendor C (Mother Dairy Metro Direct)", 58.0, 2.5, 0.3, 0.95, 0.94, 0.008, 80, 250, 2.5),

        # SKU-RICE-02
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

        # Expanded Items Vendors
        ("VEN-B1", "SKU-BUTTER-09", "Amul Dairy Central Depot", 210.0, 2.0, 0.2, 0.98, 0.98, 0.003, 50, 150, 4.0),
        ("VEN-P1", "SKU-PANEER-10", "Gowardhan Fresh Dairy", 68.0, 1.5, 0.2, 0.97, 0.96, 0.006, 40, 100, 5.0),
        ("VEN-CD1", "SKU-CURD-11", "Mother Dairy Metro Hub", 58.0, 2.0, 0.3, 0.96, 0.95, 0.005, 50, 150, 3.5),
        ("VEN-CH1", "SKU-CHEESE-12", "Britannia Commercial Foods", 108.0, 3.0, 0.3, 0.95, 0.94, 0.008, 40, 120, 4.5),
        ("VEN-K1", "SKU-KOLAM-13", "Nagpur Rice Millers Union", 490.0, 5.0, 0.7, 0.92, 0.90, 0.010, 100, 300, 5.5),
        ("VEN-TD1", "SKU-TOORDAL-14", "Latur Dal Mill Association", 122.0, 4.0, 0.5, 0.93, 0.91, 0.009, 80, 200, 5.0),
        ("VEN-MD1", "SKU-MOONG-15", "Gujarat Agro Mandi Direct", 102.0, 4.0, 0.4, 0.94, 0.93, 0.008, 70, 180, 4.5),
        ("VEN-MA1", "SKU-MAIDA-16", "Pawan Flour Mills Thane", 155.0, 3.5, 0.4, 0.95, 0.94, 0.007, 60, 150, 5.0),
        ("VEN-GH1", "SKU-GHEE-17", "Amul Gujarat B2B Direct", 510.0, 3.0, 0.3, 0.98, 0.98, 0.004, 30, 90, 4.0),
        ("VEN-MU1", "SKU-MUSTARD-18", "Adani Wilmar Express Depot", 118.0, 3.5, 0.4, 0.96, 0.95, 0.006, 80, 240, 5.0),
        ("VEN-SA1", "SKU-SALT-19", "Tata Consumer Products Depot", 19.5, 2.5, 0.3, 0.99, 0.99, 0.002, 200, 600, 4.0),
        ("VEN-SP1", "SKU-SPICE-20", "Everest Spices Navi Mumbai Hub", 128.0, 3.0, 0.3, 0.97, 0.96, 0.005, 60, 180, 5.0),
        ("VEN-TE1", "SKU-TEA-21", "Wagh Bakri Tea Logistics", 370.0, 4.0, 0.5, 0.95, 0.94, 0.008, 50, 150, 5.0),
        ("VEN-CO1", "SKU-COFFEE-22", "Nestle India Wholesale Hub", 295.0, 3.0, 0.3, 0.97, 0.96, 0.006, 40, 120, 4.5),
        ("VEN-AL1", "SKU-ALMOND-23", "Kashmir & California Importers", 315.0, 4.5, 0.5, 0.94, 0.93, 0.009, 30, 90, 6.0),
        ("VEN-KB1", "SKU-KEYBOARD-24", "Invenio Hardware OEM Hub", 1650.0, 4.0, 0.5, 0.96, 0.95, 0.008, 20, 60, 7.0),
        ("VEN-CG1", "SKU-CHARGER-25", "Shenzhen Power Tech OEM", 920.0, 5.0, 0.6, 0.95, 0.94, 0.009, 30, 90, 6.5),
        ("VEN-WC1", "SKU-WEBCAM-26", "VisionTech Peripherals", 1220.0, 4.0, 0.4, 0.96, 0.95, 0.007, 25, 75, 6.0),
        ("VEN-GR1", "SKU-GRINDER-27", "Bosch Power Tools Dist.", 2150.0, 3.0, 0.3, 0.98, 0.98, 0.004, 10, 30, 5.0),
        ("VEN-HE1", "SKU-HELMET-28", "Karam Safety Gear Depot", 290.0, 3.0, 0.3, 0.97, 0.96, 0.005, 40, 120, 5.5),
    ]
    cur.executemany(
        "INSERT OR REPLACE INTO vendors VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        vendors,
    )

    # 7. Seed Admin and Manager Users
    users = [
        ("USR-01", "Jass Shivnani", "jass@invenio.ai", "admin", "+91 98765 43210"),
        ("USR-02", "Operations Manager", "manager@invenio.ai", "manager", "+91 98765 43211"),
        ("USR-03", "Store Fulfillment Chembur", "store_c@invenio.ai", "staff", "+91 98765 43212"),
        ("USR-04", "Warehouse Lead Bhiwandi", "bhiwandi_lead@invenio.ai", "staff", "+91 98765 43213"),
    ]
    cur.executemany(
        "INSERT OR REPLACE INTO users (user_id, name, email, role, phone) VALUES (?, ?, ?, ?, ?)",
        users,
    )

    # 8. Seed Retail & B2B Customers (15 Diverse Customers)
    customers = [
        ("CUST-01", "Aarav Sharma", "9876543210", "aarav@gmail.com", "Flat 402, Chembur Central Heights, Mumbai"),
        ("CUST-02", "Pooja Mehta", "9820011223", "pooja.m@yahoo.com", "Plot 12, Sion West Heritage, Mumbai"),
        ("CUST-03", "Rohan Joshi", "9819955443", "rohan.j@corp.in", "Sector 17, Vashi Commercial Complex, Navi Mumbai"),
        ("CUST-04", "Vikram Patel", "9811122233", "vikram.patel@patelagro.com", "Shop 5, APMC Market, Vashi, Navi Mumbai"),
        ("CUST-05", "Anita Deshmukh", "9833445566", "anita.d@outlook.com", "15 Riverside Enclave, Powai, Mumbai"),
        ("CUST-06", "Rajesh Nair", "9867112233", "rajesh.nair@malabarkitchen.in", "Station Road, Ghatkopar East, Mumbai"),
        ("CUST-07", "Kavita Rao", "9845098765", "kavita.rao@techstart.io", "Hiranandani Gardens, Powai, Mumbai"),
        ("CUST-08", "Sunil Kothari", "9821334455", "kotharibrothers@gmail.com", "Near Jain Temple, Mulund West, Mumbai"),
        ("CUST-09", "Farhan Qureshi", "9892001122", "farhan.catering@gmail.com", "Kurla West Commercial Area, Mumbai"),
        ("CUST-10", "Deepak Verma", "9870123456", "deepak@vermatools.in", "Bhiwandi Industrial Estate Gala 4, Thane"),
        ("CUST-11", "Meera Sen", "9819009988", "meera.sen@designstudio.in", "Bandra Kurla Complex, G-Block, Mumbai"),
        ("CUST-12", "Suresh Gupta", "9833887766", "guptakirana@rediffmail.com", "Govandi Station Road, Chembur, Mumbai"),
        ("CUST-13", "Neha Singhania", "9820776655", "neha@singhaniagroup.com", "Worli Sea Face Towers, Mumbai"),
        ("CUST-14", "Manish Tiwari", "9819443322", "manish.tiwari@fastmail.com", "Thane West Ghodbunder Road, Thane"),
        ("CUST-15", "Aditya Kulkarni", "9867998877", "aditya.k@kulkarniworks.in", "Turbhe MIDC Road 12, Navi Mumbai"),
    ]
    cur.executemany(
        "INSERT OR REPLACE INTO customers (customer_id, name, phone, email, address) VALUES (?, ?, ?, ?, ?)",
        customers,
    )

    # 9. Seed Realistic Invoices (16 Historical & Active Invoices)
    sample_invoices = [
        (
            "INV-2026-001", "INV-2026-001", "Aarav Sharma", "9876543210", 210.0, "PAID", "2026-11-18",
            json.dumps([
                {"productId": "SKU-MILK-01", "productName": "Pasteurized Full-Cream Milk (1L Pack)", "quantity": 2, "unitPrice": 65.0, "total": 130.0},
                {"productId": "SKU-YOGURT-04", "productName": "Probiotic Greek Yogurt (400g)", "quantity": 1, "unitPrice": 80.0, "total": 80.0}
            ])
        ),
        (
            "INV-2026-002", "INV-2026-002", "Pooja Mehta", "9820011223", 775.0, "PAID", "2026-11-18",
            json.dumps([
                {"productId": "SKU-WHEAT-03", "productName": "Chakki Fresh Whole Wheat Atta (10kg)", "quantity": 1, "unitPrice": 365.0, "total": 365.0},
                {"productId": "SKU-RICE-02", "productName": "Premium Basmati Rice (5kg Bag)", "quantity": 1, "unitPrice": 410.0, "total": 410.0}
            ])
        ),
        (
            "INV-2026-003", "INV-2026-003", "Rohan Joshi", "9819955443", 1698.0, "PAID", "2026-11-17",
            json.dumps([
                {"productId": "SKU-MOUSE-06", "productName": "Invenio Pro Wireless Ergonomic Mouse", "quantity": 1, "unitPrice": 1199.0, "total": 1199.0},
                {"productId": "SKU-CABLE-07", "productName": "Braided USB-C 100W PD Fast Cable", "quantity": 1, "unitPrice": 499.0, "total": 499.0}
            ])
        ),
        (
            "INV-2026-004", "INV-2026-004", "Rajesh Nair", "9867112233", 3140.0, "PAID", "2026-11-17",
            json.dumps([
                {"productId": "SKU-KOLAM-13", "productName": "Wada Kolam Daily Steam Rice (10kg Bag)", "quantity": 3, "unitPrice": 680.0, "total": 2040.0},
                {"productId": "SKU-GHEE-17", "productName": "Amul Pure Cow Desi Ghee (1L Tin)", "quantity": 1, "unitPrice": 650.0, "total": 650.0},
                {"productId": "SKU-TEA-21", "productName": "Wagh Bakri Premium Assam Leaf Tea (1kg Pack)", "quantity": 1, "unitPrice": 450.0, "total": 450.0}
            ])
        ),
        (
            "INV-2026-005", "INV-2026-005", "Farhan Qureshi", "9892001122", 4850.0, "PAID", "2026-11-17",
            json.dumps([
                {"productId": "SKU-DRILL-08", "productName": "Brushless Cordless Hammer Drill 850W", "quantity": 1, "unitPrice": 4850.0, "total": 4850.0}
            ])
        ),
        (
            "INV-2026-006", "INV-2026-006", "Anita Deshmukh", "9833445566", 825.0, "PAID", "2026-11-16",
            json.dumps([
                {"productId": "SKU-BUTTER-09", "productName": "Amul Pasteurized Salted Butter (500g)", "quantity": 1, "unitPrice": 275.0, "total": 275.0},
                {"productId": "SKU-CHEESE-12", "productName": "Amul Processed Cheese Slices (200g)", "quantity": 2, "unitPrice": 145.0, "total": 290.0},
                {"productId": "SKU-PANEER-10", "productName": "Fresh Malai Paneer Block (200g)", "quantity": 2, "unitPrice": 130.0, "total": 260.0}
            ])
        ),
        (
            "INV-2026-007", "INV-2026-007", "Suresh Gupta", "9833887766", 2490.0, "PAID", "2026-11-16",
            json.dumps([
                {"productId": "SKU-OIL-05", "productName": "Cold-Pressed Sunflower Oil (1L Pouch)", "quantity": 6, "unitPrice": 185.0, "total": 1110.0},
                {"productId": "SKU-MUSTARD-18", "productName": "Fortune Kachi Ghani Mustard Oil (1L Bottle)", "quantity": 6, "unitPrice": 155.0, "total": 930.0},
                {"productId": "SKU-SALT-19", "productName": "Tata Vacuum Evaporated Iodized Salt (1kg)", "quantity": 15, "unitPrice": 30.0, "total": 450.0}
            ])
        ),
        (
            "INV-2026-008", "INV-2026-008", "Vikram Patel", "9811122233", 4280.0, "PAID", "2026-11-16",
            json.dumps([
                {"productId": "SKU-TOORDAL-14", "productName": "Unpolished Desi Toor Dal (1kg Pack)", "quantity": 12, "unitPrice": 165.0, "total": 1980.0},
                {"productId": "SKU-MOONG-15", "productName": "Organic Yellow Moong Dal Split (1kg Pack)", "quantity": 10, "unitPrice": 140.0, "total": 1400.0},
                {"productId": "SKU-MAIDA-16", "productName": "Super Fine Bakery Maida (5kg Bag)", "quantity": 4, "unitPrice": 225.0, "total": 900.0}
            ])
        ),
        (
            "INV-2026-009", "INV-2026-009", "Kavita Rao", "9845098765", 3998.0, "PAID", "2026-11-15",
            json.dumps([
                {"productId": "SKU-KEYBOARD-24", "productName": "Invenio Mechanical Tenkeyless RGB Keyboard", "quantity": 1, "unitPrice": 2499.0, "total": 2499.0},
                {"productId": "SKU-CHARGER-25", "productName": "Invenio 65W GaN Dual USB-C Fast Charger", "quantity": 1, "unitPrice": 1499.0, "total": 1499.0}
            ])
        ),
        (
            "INV-2026-010", "INV-2026-010", "Deepak Verma", "9870123456", 5700.0, "PAID", "2026-11-15",
            json.dumps([
                {"productId": "SKU-GRINDER-27", "productName": "Bosch Heavy-Duty Angle Grinder 850W", "quantity": 2, "unitPrice": 2850.0, "total": 5700.0}
            ])
        ),
        (
            "INV-2026-011", "INV-2026-011", "Aditya Kulkarni", "9867998877", 2100.0, "PAID", "2026-11-15",
            json.dumps([
                {"productId": "SKU-HELMET-28", "productName": "Karam Industrial Safety Helmet with Visor", "quantity": 5, "unitPrice": 420.0, "total": 2100.0}
            ])
        ),
        (
            "INV-2026-012", "INV-2026-012", "Sunil Kothari", "9821334455", 1475.0, "PAID", "2026-11-14",
            json.dumps([
                {"productId": "SKU-ALMOND-23", "productName": "California Select Whole Almonds (500g Pouch)", "quantity": 2, "unitPrice": 420.0, "total": 840.0},
                {"productId": "SKU-COFFEE-22", "productName": "Nescafe Classic Instant Coffee Jar (200g)", "quantity": 1, "unitPrice": 385.0, "total": 385.0},
                {"productId": "SKU-CURD-11", "productName": "Mother Dairy Classic Dahi Tub (1kg)", "quantity": 3, "unitPrice": 85.0, "total": 250.0}
            ])
        ),
        (
            "INV-2026-013", "INV-2026-013", "Meera Sen", "9819009988", 1899.0, "PAID", "2026-11-14",
            json.dumps([
                {"productId": "SKU-WEBCAM-26", "productName": "Invenio Vision 1080p 60fps Pro Webcam", "quantity": 1, "unitPrice": 1899.0, "total": 1899.0}
            ])
        ),
        (
            "INV-2026-014", "INV-2026-014", "Manish Tiwari", "9819443322", 645.0, "PAID", "2026-11-13",
            json.dumps([
                {"productId": "SKU-SPICE-20", "productName": "Everest Pure Turmeric & Coriander Combo", "quantity": 2, "unitPrice": 175.0, "total": 350.0},
                {"productId": "SKU-TEA-21", "productName": "Wagh Bakri Premium Assam Leaf Tea (500g)", "quantity": 1, "unitPrice": 295.0, "total": 295.0}
            ])
        ),
        (
            "INV-2026-015", "INV-2026-015", "Neha Singhania", "9820776655", 3850.0, "PAID", "2026-11-13",
            json.dumps([
                {"productId": "SKU-GHEE-17", "productName": "Amul Pure Cow Desi Ghee (1L Tin)", "quantity": 4, "unitPrice": 650.0, "total": 2600.0},
                {"productId": "SKU-RICE-02", "productName": "Royal Aged Basmati Rice (5kg Bag)", "quantity": 2, "unitPrice": 460.0, "total": 920.0},
                {"productId": "SKU-ALMOND-23", "productName": "California Select Whole Almonds (500g)", "quantity": 1, "unitPrice": 330.0, "total": 330.0}
            ])
        ),
        (
            "INV-2026-016", "INV-2026-016", "Suresh Gupta", "9833887766", 1250.0, "DRAFT", "2026-11-18",
            json.dumps([
                {"productId": "SKU-SALT-19", "productName": "Tata Vacuum Evaporated Iodized Salt (1kg)", "quantity": 25, "unitPrice": 28.0, "total": 700.0},
                {"productId": "SKU-MUSTARD-18", "productName": "Fortune Kachi Ghani Mustard Oil (1L Bottle)", "quantity": 3, "unitPrice": 155.0, "total": 465.0},
                {"productId": "SKU-CURD-11", "productName": "Mother Dairy Classic Dahi Tub (1kg)", "quantity": 1, "unitPrice": 85.0, "total": 85.0}
            ])
        ),
    ]
    cur.executemany(
        "INSERT OR REPLACE INTO invoices (invoice_id, invoice_number, customer_name, customer_phone, total, status, date, items_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        sample_invoices,
    )

    # 10. Seed Realistic Purchase Orders
    purchase_orders = [
        (
            "PO-1020", "SKU-RICE-02", "Royal Aged Basmati Rice (5kg Bag)", "VEN-R1", "Punjab Agro Mills (Standard Rail)",
            800, 340.0, 6.0, 255680.0, 6.0, "CRITICAL", "RECEIVED",
            "Optimal bulk replenishment across Rail Corridor with 6% tier discount.", 18400.0, "2026-11-10 10:30:00"
        ),
        (
            "PO-1021", "SKU-MILK-01", "Pasteurized Full-Cream Milk (1L Pack)", "VEN-B", "Vendor B (Amul Express Cold-Chain)",
            200, 55.0, 3.0, 10670.0, 2.0, "URGENT", "RECEIVED",
            "Fast 2.0-day SLA chosen to avoid complete cold-chain stockout.", 2618.0, "2026-11-12 14:15:00"
        ),
        (
            "PO-1022", "SKU-OIL-05", "Cold-Pressed Sunflower Oil (1L Pouch)", "VEN-O1", "Gemini Edibles Bulk Depot",
            300, 138.0, 5.0, 39330.0, 4.5, "NORMAL", "IN_TRANSIT",
            "Scaled safety buffer due to +48% demand volatility spike.", 4200.0, "2026-11-14 09:00:00"
        ),
        (
            "PO-1023", "SKU-MOUSE-06", "Invenio Pro Wireless Ergonomic Mouse", "VEN-M2", "Bhiwandi Tech Distribution",
            100, 740.0, 6.0, 69560.0, 2.5, "NORMAL", "APPROVED",
            "Bhiwandi local distribution selected for lower freight cost.", 5800.0, "2026-11-15 16:20:00"
        ),
        (
            "PO-1024", "SKU-YOGURT-04", "Probiotic Greek Yogurt Tub (400g)", "VEN-Y1", "Epigamia Cold-Chain Express",
            150, 78.0, 5.0, 11115.0, 1.5, "URGENT", "GENERATED",
            "Surge capacity restock for +308% active summer yogurt promotion.", 3200.0, "2026-11-17 11:45:00"
        ),
        (
            "PO-1025", "SKU-SALT-19", "Tata Vacuum Evaporated Iodized Salt (1kg Pouch)", "VEN-SA1", "Tata Consumer Products Depot",
            500, 19.5, 4.0, 9360.0, 2.5, "LOW", "RECEIVED",
            "Periodic buffer top-up across high velocity retail nodes.", 1200.0, "2026-11-11 08:30:00"
        ),
        (
            "PO-1026", "SKU-GHEE-17", "Amul Pure Cow Desi Ghee (1L Tin)", "VEN-GH1", "Amul Gujarat B2B Direct",
            80, 510.0, 4.0, 39168.0, 3.0, "NORMAL", "IN_TRANSIT",
            "Direct creamery dispatch for festival premium demand.", 6400.0, "2026-11-16 13:00:00"
        ),
        (
            "PO-1027", "SKU-KEYBOARD-24", "Invenio Tenkeyless RGB Mechanical Keyboard", "VEN-KB1", "Invenio Hardware OEM Hub",
            40, 1650.0, 7.0, 61380.0, 4.0, "NORMAL", "PENDING",
            "Stock replenishment for software engineers and campus store.", 8200.0, "2026-11-18 07:15:00"
        ),
    ]
    cur.executemany(
        """
        INSERT OR REPLACE INTO purchase_orders
        (po_id, sku, product_name, vendor_id, vendor_name, order_quantity, unit_price, discount_applied_pct,
         total_cost, delivery_deadline_days, priority, status, selection_reason, expected_profit_protected, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        purchase_orders,
    )

    # 11. Seed Inter-Warehouse Transfers
    transfers = [
        ("TRF-101", "SKU-WHEAT-03", "Chakki Fresh Whole Wheat Atta (10kg)", "WH-A", "WH-B", 50, 450.0, 15025.0, "Turbhe running out in 0.8 days; Bhiwandi has 195 units surplus.", "COMPLETED"),
        ("TRF-102", "SKU-SALT-19", "Tata Vacuum Evaporated Iodized Salt (1kg)", "WH-A", "ST-C", 100, 220.0, 2400.0, "Chembur retail store buffer replenishment.", "COMPLETED"),
        ("TRF-103", "SKU-MILK-01", "Pasteurized Full-Cream Milk (1L Pack)", "WH-A", "WH-B", 25, 180.0, 3100.0, "Turbhe cold-chain urgent buffer stabilization.", "SCHEDULED"),
        ("TRF-104", "SKU-CABLE-07", "Braided USB-C 100W PD Fast Cable", "WH-A", "ST-C", 40, 150.0, 5800.0, "Online quick-commerce micro-fulfillment surge.", "COMPLETED"),
    ]
    cur.executemany(
        """
        INSERT OR REPLACE INTO warehouse_transfers
        (transfer_id, sku, product_name, from_warehouse, to_warehouse, quantity, transfer_cost, procurement_cost_saved, reason, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        transfers,
    )

    # 12. Seed Real Stock Transactions (32 Entries for Movement History)
    transactions = [
        ("TXN-001", "SKU-RICE-02", "STOCK_IN", 800, "2026-11-11", "Bulk purchase order received from Punjab Agro", "PO-1020"),
        ("TXN-002", "SKU-MILK-01", "STOCK_IN", 200, "2026-11-13", "Urgent stock received from Amul Express", "PO-1021"),
        ("TXN-003", "SKU-SALT-19", "STOCK_IN", 500, "2026-11-12", "Periodic stock top-up from Tata Consumer", "PO-1025"),
        ("TXN-004", "SKU-WHEAT-03", "LATERAL_TRANSFER", 50, "2026-11-15", "Shifted from Bhiwandi to Turbhe cold hub", "TRF-101"),
        ("TXN-005", "SKU-SALT-19", "LATERAL_TRANSFER", 100, "2026-11-16", "Shifted from Bhiwandi to Chembur store", "TRF-102"),
        ("TXN-006", "SKU-CABLE-07", "LATERAL_TRANSFER", 40, "2026-11-16", "Shifted from Bhiwandi to Chembur store", "TRF-104"),
        ("TXN-007", "SKU-DRILL-08", "STOCK_ADJUSTMENT", 4, "2026-11-14", "Physical audit reconciliation (4 units damaged in bay B-04)", "AUDIT-08"),
        ("TXN-008", "SKU-MILK-01", "STOCK_OUT", 2, "2026-11-18", "Sale POS Checkout", "INV-2026-001"),
        ("TXN-009", "SKU-YOGURT-04", "STOCK_OUT", 1, "2026-11-18", "Sale POS Checkout", "INV-2026-001"),
        ("TXN-010", "SKU-WHEAT-03", "STOCK_OUT", 1, "2026-11-18", "Sale POS Checkout", "INV-2026-002"),
        ("TXN-011", "SKU-RICE-02", "STOCK_OUT", 1, "2026-11-18", "Sale POS Checkout", "INV-2026-002"),
        ("TXN-012", "SKU-MOUSE-06", "STOCK_OUT", 1, "2026-11-17", "Sale POS Checkout", "INV-2026-003"),
        ("TXN-013", "SKU-CABLE-07", "STOCK_OUT", 1, "2026-11-17", "Sale POS Checkout", "INV-2026-003"),
        ("TXN-014", "SKU-KOLAM-13", "STOCK_OUT", 3, "2026-11-17", "Sale POS Checkout", "INV-2026-004"),
        ("TXN-015", "SKU-GHEE-17", "STOCK_OUT", 1, "2026-11-17", "Sale POS Checkout", "INV-2026-004"),
        ("TXN-016", "SKU-TEA-21", "STOCK_OUT", 1, "2026-11-17", "Sale POS Checkout", "INV-2026-004"),
        ("TXN-017", "SKU-DRILL-08", "STOCK_OUT", 1, "2026-11-17", "Sale POS Checkout", "INV-2026-005"),
        ("TXN-018", "SKU-BUTTER-09", "STOCK_OUT", 1, "2026-11-16", "Sale POS Checkout", "INV-2026-006"),
        ("TXN-019", "SKU-CHEESE-12", "STOCK_OUT", 2, "2026-11-16", "Sale POS Checkout", "INV-2026-006"),
        ("TXN-020", "SKU-PANEER-10", "STOCK_OUT", 2, "2026-11-16", "Sale POS Checkout", "INV-2026-006"),
        ("TXN-021", "SKU-OIL-05", "STOCK_OUT", 6, "2026-11-16", "Sale POS Checkout", "INV-2026-007"),
        ("TXN-022", "SKU-MUSTARD-18", "STOCK_OUT", 6, "2026-11-16", "Sale POS Checkout", "INV-2026-007"),
        ("TXN-023", "SKU-SALT-19", "STOCK_OUT", 15, "2026-11-16", "Sale POS Checkout", "INV-2026-007"),
        ("TXN-024", "SKU-TOORDAL-14", "STOCK_OUT", 12, "2026-11-16", "Sale POS Checkout", "INV-2026-008"),
        ("TXN-025", "SKU-MOONG-15", "STOCK_OUT", 10, "2026-11-16", "Sale POS Checkout", "INV-2026-008"),
        ("TXN-026", "SKU-MAIDA-16", "STOCK_OUT", 4, "2026-11-16", "Sale POS Checkout", "INV-2026-008"),
        ("TXN-027", "SKU-KEYBOARD-24", "STOCK_OUT", 1, "2026-11-15", "Sale POS Checkout", "INV-2026-009"),
        ("TXN-028", "SKU-CHARGER-25", "STOCK_OUT", 1, "2026-11-15", "Sale POS Checkout", "INV-2026-009"),
        ("TXN-029", "SKU-GRINDER-27", "STOCK_OUT", 2, "2026-11-15", "Sale POS Checkout", "INV-2026-010"),
        ("TXN-030", "SKU-HELMET-28", "STOCK_OUT", 5, "2026-11-15", "Sale POS Checkout", "INV-2026-011"),
        ("TXN-031", "SKU-ALMOND-23", "STOCK_OUT", 2, "2026-11-14", "Sale POS Checkout", "INV-2026-012"),
        ("TXN-032", "SKU-WEBCAM-26", "STOCK_OUT", 1, "2026-11-14", "Sale POS Checkout", "INV-2026-013"),
    ]
    cur.executemany(
        """
        INSERT OR REPLACE INTO transactions
        (transaction_id, product_id, type, quantity, date, reason, reference)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        transactions,
    )

    # 13. Seed Comprehensive Agent Audit Trail (Where & Why)
    initial_audits = [
        (
            "AGENT-01", "Multi-Hub Inventory Tracker", "NETWORK_SYNC", "ALL", "Network-Wide",
            "Bhiwandi Hub (WH-A)", "Turbhe Cold Hub (WH-B)", 0,
            "Synchronized 28 active SKUs across Bhiwandi, Turbhe, and Chembur nodes. Network discrepancies: 0 units.",
            0.0, json.dumps({"active_skus": 28, "total_nodes": 84, "sync_status": "OPTIMAL"})
        ),
        (
            "AGENT-08", "Demand Anomaly Detector", "DEMAND_SURGE", "SKU-YOGURT-04", "Probiotic Greek Yogurt (400g)",
            "Turbhe Cold Hub (WH-B)", "Chembur Retail Store (ST-C)", 102,
            "Detected +308% sudden demand surge (102 units/day vs 25 units/day normal, Z-Score = 68.25) during summer promotion. Scaled dynamic safety buffer.",
            3200.0, json.dumps({"z_score": 68.25, "promo_surge_pct": 308})
        ),
        (
            "AGENT-05", "Supplier Intelligence Evaluator", "VENDOR_SCORING", "SKU-MILK-01", "Pasteurized Full-Cream Milk (1L Pack)",
            "Vendor B (Amul Express)", "Turbhe Cold Hub (WH-B)", 200,
            "Evaluated 3 suppliers: Vendor B selected (98.5% reliability, 2.0-day SLA @ ₹55/u). Rejected Vendor A (5.0-day lead time risk of total stockout).",
            2618.0, json.dumps({"recommended_vendor": "VEN-B", "avoided_stockout_penalty": 2618.0})
        ),
        (
            "AGENT-07", "Inter-Hub Stock Optimizer", "TRANSFER_RECOMMENDED", "SKU-WHEAT-03", "Chakki Fresh Whole Wheat Atta (10kg)",
            "Bhiwandi Central Hub (WH-A)", "Turbhe Cold Hub (WH-B)", 50,
            "Identified Turbhe running out in 0.8 days (35 units remaining). Bhiwandi holds 195 units surplus. Recommended 50-unit local shift saving ₹15,025 over new supplier orders.",
            15025.0, json.dumps({"from": "WH-A", "to": "WH-B", "qty": 50, "transit_hours": 4})
        ),
        (
            "AGENT-09", "Bulk Discount Optimizer", "TIER_OPTIMIZATION", "SKU-RICE-02", "Royal Aged Basmati Rice (5kg Bag)",
            "Punjab Agro Mills (Rail)", "Bhiwandi Central Hub (WH-A)", 800,
            "Dispatched 800-unit bulk purchase order unlocking 6.0% supplier tier discount, saving ₹16,320 in net procurement cost.",
            16320.0, json.dumps({"tier_unlocked": ">= 500 units", "discount_pct": 6.0, "total_saved": 16320.0})
        ),
        (
            "AGENT-02", "Dynamic Buffer Controller", "BUFFER_SCALED", "SKU-OIL-05", "Cold-Pressed Sunflower Oil (1L Pouch)",
            "Turbhe Cold Hub (WH-B)", "Turbhe Cold Hub (WH-B)", 28,
            "Detected high daily demand volatility (σ=28.4 units). Auto-scaled node safety buffer from 50 to 78 units at 98% target service level.",
            1850.0, json.dumps({"volatility_std": 28.4, "new_buffer": 78, "service_level": 0.98})
        ),
        (
            "AGENT-06", "Inventory Shrinkage Guard", "AUDIT_DISCREPANCY", "SKU-DRILL-08", "Brushless Cordless Hammer Drill 850W",
            "Turbhe Bay B-04", "Discrepancy Investigation", 4,
            "Flagged 4-unit shrinkage mismatch (physical count: 6, system ledger: 10). Reconciled inventory and alerted warehouse manager.",
            3800.0, json.dumps({"physical_count": 6, "system_count": 10, "discrepancy": -4})
        ),
        (
            "AGENT-03", "Inter-Hub Quick Fulfillment", "TRANSFER_RECOMMENDED", "SKU-SALT-19", "Tata Vacuum Evaporated Iodized Salt (1kg)",
            "Bhiwandi Central Hub (WH-A)", "Chembur Retail Store (ST-C)", 100,
            "Store C retail stock fell below weekend safety buffer. Shifted 100 units from Bhiwandi surplus at negligible transit cost.",
            2400.0, json.dumps({"from": "WH-A", "to": "ST-C", "qty": 100})
        ),
        (
            "AGENT-POS", "Retail Checkout Agent", "STOCK_DISPATCH", "SKU-MOUSE-06", "Invenio Pro Wireless Ergonomic Mouse",
            "ST-C (Chembur Store)", "Customer Direct", 2,
            "Retail POS customer order INV-2026-003 fulfilled at Chembur counter.",
            1698.0, json.dumps({"invoice_id": "INV-2026-003", "customer": "Rohan Joshi"})
        ),
        (
            "AGENT-POS", "Retail Checkout Agent", "STOCK_DISPATCH", "SKU-KOLAM-13", "Wada Kolam Daily Steam Rice (10kg Bag)",
            "ST-C (Chembur Store)", "Customer Direct", 5,
            "Retail POS customer order INV-2026-004 fulfilled at Chembur counter.",
            3140.0, json.dumps({"invoice_id": "INV-2026-004", "customer": "Rajesh Nair"})
        ),
        (
            "AGENT-04", "Supplier SLA Monitor", "LEAD_TIME_AUDIT", "SKU-MILK-01", "Pasteurized Full-Cream Milk (1L Pack)",
            "Vendor B (Amul Express)", "Turbhe Cold Hub (WH-B)", 0,
            "Verified on-time arrival within 1.9 days SLA (target 2.0d). Vendor reliability score maintained at 98.5%.",
            0.0, json.dumps({"vendor_id": "VEN-B", "actual_lead_time": 1.9, "sla": 2.0})
        ),
        (
            "AGENT-07", "Inter-Hub Stock Optimizer", "TRANSFER_COMPLETED", "SKU-CABLE-07", "Braided USB-C 100W PD Fast Cable",
            "Bhiwandi Central Hub (WH-A)", "Chembur Retail Store (ST-C)", 40,
            "Completed transfer of 40 units to support quick-commerce online fulfillment spike.",
            5800.0, json.dumps({"transfer_id": "TRF-104", "status": "COMPLETED"})
        ),
    ]
    cur.executemany(
        """
        INSERT INTO agent_audit_logs (agent_id, agent_name, action_type, sku, product_name,
                                      location_from, location_to, quantity, why_reason, financial_impact, details_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        initial_audits,
    )

    conn.commit()
    conn.close()
    return db_path

if __name__ == "__main__":
    p = init_and_seed_db()
    print(f"Seeded SQLite database at: {p}")
