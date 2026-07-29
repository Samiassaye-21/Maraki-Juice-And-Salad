CREATE TABLE shifts (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  shift_type TEXT NOT NULL,
  worker_name TEXT NOT NULL,
  juice_cups JSONB NOT NULL,
  food_takeaways JSONB NOT NULL,
  juice_cups_sold INTEGER NOT NULL,
  juice_revenue INTEGER NOT NULL,
  food_takeaways_sold INTEGER NOT NULL,
  food_revenue INTEGER NOT NULL,
  gross_income INTEGER NOT NULL,
  digital_transfers INTEGER NOT NULL,
  daily_expenses INTEGER NOT NULL,
  expense_items JSONB NOT NULL,
  new_pending_payments_amount INTEGER NOT NULL,
  recovered_pending_amount INTEGER NOT NULL,
  delivery_credit_amount INTEGER NOT NULL,
  net_cash_due_to_owner INTEGER NOT NULL,
  notes TEXT,
  is_closed BOOLEAN NOT NULL DEFAULT false,
  timestamp BIGINT NOT NULL
);

-- 2. Create Pending Payments Table
CREATE TABLE pending_payments (
  id TEXT PRIMARY KEY,
  shift_type TEXT NOT NULL,
  customer_name TEXT,
  description TEXT NOT NULL,
  juice_cups_count INTEGER NOT NULL,
  food_takeaways_count INTEGER NOT NULL,
  itemized_breakdown JSONB,
  amount INTEGER NOT NULL,
  date TEXT NOT NULL,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  paid_date TEXT
);

-- 3. Create Delivery Records Table
CREATE TABLE delivery_records (
  id TEXT PRIMARY KEY,
  delivery_rider_name TEXT NOT NULL,
  description TEXT NOT NULL,
  juice_cups_count INTEGER NOT NULL,
  food_takeaways_count INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  date TEXT NOT NULL,
  shift_type TEXT NOT NULL,
  is_settled_weekly BOOLEAN NOT NULL DEFAULT false,
  settled_date TEXT
);

-- 4. Create Config Table (Single Row)
CREATE TABLE config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  default_juice_unit_price INTEGER NOT NULL,
  default_food_unit_price INTEGER NOT NULL,
  food_menu JSONB NOT NULL,
  currency_symbol TEXT NOT NULL,
  day_shift_worker_name TEXT NOT NULL,
  night_shift_worker_name TEXT NOT NULL,
  restaurant_name TEXT NOT NULL
);

-- Insert Default Config
INSERT INTO config (
  id,
  default_juice_unit_price, 
  default_food_unit_price, 
  food_menu, 
  currency_symbol, 
  day_shift_worker_name, 
  night_shift_worker_name, 
  restaurant_name
) VALUES (
  1,
  170, 
  220, 
  '[{"id": "fm-1", "name": "ማራኪ ኮመቦ ሳላድ", "price": 430, "category": "special", "available": true}, {"id": "fm-2", "name": "ሳላድ", "price": 320, "category": "special", "available": true}, {"id": "fm-3", "name": "ፓስታ በሳላድ", "price": 320, "category": "fast_food", "available": true}, {"id": "fm-4", "name": "ሩዝ በሳላድ", "price": 320, "category": "fast_food", "available": true}, {"id": "fm-5", "name": "ፓስታ በአትክልት", "price": 320, "category": "fast_food", "available": true}, {"id": "fm-6", "name": "ሩዝ በአትክልት", "price": 320, "category": "fast_food", "available": true}, {"id": "fm-7", "name": "ፓስታ በአንቁላል", "price": 320, "category": "fast_food", "available": true}, {"id": "fm-8", "name": "ሩዝ በእንቁላል", "price": 320, "category": "fast_food", "available": true}, {"id": "fm-9", "name": "እንቁላል ፍርፍር", "price": 230, "category": "breakfast", "available": true}, {"id": "fm-10", "name": "እንቁላል ስልስ", "price": 230, "category": "breakfast", "available": true}, {"id": "fm-11", "name": "እንቁላል ሳንድዊች", "price": 120, "category": "breakfast", "available": true}, {"id": "fm-12", "name": "አትክልት ሳንድዊች", "price": 100, "category": "breakfast", "available": true}, {"id": "fm-13", "name": "ፍሩት ፓንች", "price": 320, "category": "special", "available": true}, {"id": "fm-14", "name": "ፍርፍር", "price": 200, "category": "traditional", "available": true}, {"id": "fm-15", "name": "ፓስታ በስጎ", "price": 200, "category": "fast_food", "available": true}, {"id": "fm-16", "name": "ቴስቲሶያ", "price": 200, "category": "traditional", "available": true}]'::jsonb, 
  'Br ETB', 
  'Makeda (Day Shift)', 
  'Tewodros (Night Shift)', 
  'Maraki Juice and Salad'
) ON CONFLICT (id) DO NOTHING;

-- Turn off Row Level Security for easy local dev testing
-- WARNING: In a production app facing the internet, you should enable RLS and set policies!
ALTER TABLE shifts DISABLE ROW LEVEL SECURITY;
ALTER TABLE pending_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE config DISABLE ROW LEVEL SECURITY;

-- 5. Create Inventory Purchase Trips Table
CREATE TABLE purchase_trips (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  notes TEXT,
  grand_total NUMERIC NOT NULL DEFAULT 0,
  created_at_ts BIGINT NOT NULL
);

-- 6. Create Purchase Trip Items Table
CREATE TABLE purchase_trip_items (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL REFERENCES purchase_trips(id) ON DELETE CASCADE,
  material_id TEXT,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  price_per_unit NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0
);

-- 7. Create Unified Financial Ledger Table
CREATE TABLE ledger_entries (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  sign INTEGER NOT NULL CHECK (sign IN (1, -1)),
  reference_id TEXT NOT NULL,
  created_at_ts BIGINT NOT NULL
);

ALTER TABLE purchase_trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_trip_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries DISABLE ROW LEVEL SECURITY;

