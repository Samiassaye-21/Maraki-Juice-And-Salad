-- ==============================================================
-- MARAKI JUICE & SALAD - SUPABASE DATABASE SCHEMA
-- Free PostgreSQL Backend for Counter POS & Admin Management
-- ==============================================================

-- 1. Enable UUID Extension (optional utility)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Menu Items Table
CREATE TABLE IF NOT EXISTS public.menu_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    menu_type TEXT NOT NULL CHECK (menu_type IN ('Juice', 'Food')),
    price NUMERIC NOT NULL CHECK (price >= 0),
    container_type TEXT NOT NULL CHECK (container_type IN ('cup', 'box')),
    is_available BOOLEAN DEFAULT true,
    emoji TEXT,
    image_url TEXT,
    bg_gradient TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    shift TEXT NOT NULL CHECK (shift IN ('Day Shift', 'Night Shift')),
    staff_name TEXT NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN ('In-Store', 'BEU Delivery')),
    beu_order_id TEXT,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('Cash', 'Telebirr', 'CBE Birr', 'Adari')),
    total_amount NUMERIC NOT NULL CHECK (total_amount >= 0),
    cups_used INTEGER DEFAULT 0 CHECK (cups_used >= 0),
    boxes_used INTEGER DEFAULT 0 CHECK (boxes_used >= 0),
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Adari (አዳሪ) Customer Credit Ledger
CREATE TABLE IF NOT EXISTS public.adari_ledger (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    phone TEXT,
    amount NUMERIC NOT NULL CHECK (amount >= 0),
    status TEXT DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid')),
    order_id TEXT REFERENCES public.orders(id) ON DELETE SET NULL,
    items JSONB DEFAULT '[]'::jsonb,
    settled_at TIMESTAMP WITH TIME ZONE,
    settled_method TEXT CHECK (settled_method IS NULL OR settled_method IN ('Cash', 'Telebirr', 'CBE Birr')),
    settled_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Expenses Table (Emergency Shop & Bulk Raw Materials)
CREATE TABLE IF NOT EXISTS public.expenses (
    id TEXT PRIMARY KEY,
    shift TEXT,
    staff_name TEXT,
    expense_type TEXT NOT NULL CHECK (expense_type IN ('urgent_shop', 'bulk_raw_material')),
    title TEXT NOT NULL,
    amount NUMERIC NOT NULL CHECK (amount >= 0),
    category TEXT DEFAULT 'General',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Packaging Audits Table (Cup & Box Reconciliation)
CREATE TABLE IF NOT EXISTS public.packaging_audits (
    id TEXT PRIMARY KEY,
    shift TEXT NOT NULL,
    audit_date DATE DEFAULT CURRENT_DATE,
    opening_cups INTEGER DEFAULT 0,
    opening_boxes INTEGER DEFAULT 0,
    cups_sold INTEGER DEFAULT 0,
    boxes_sold INTEGER DEFAULT 0,
    waste_cups INTEGER DEFAULT 0,
    waste_boxes INTEGER DEFAULT 0,
    closing_cups_physical INTEGER,
    closing_boxes_physical INTEGER,
    discrepancy_cups INTEGER GENERATED ALWAYS AS (opening_cups - cups_sold - waste_cups - COALESCE(closing_cups_physical, 0)) STORED,
    discrepancy_boxes INTEGER GENERATED ALWAYS AS (opening_boxes - boxes_sold - waste_boxes - COALESCE(closing_boxes_physical, 0)) STORED,
    audited_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Row Level Security (RLS) - Public read & insert for fast POS operations
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adari_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packaging_audits ENABLE ROW LEVEL SECURITY;

-- Allow read & write access for authenticated & anonymous shop clients
CREATE POLICY "Public read menu items" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Public insert/update menu items" ON public.menu_items FOR ALL USING (true);

CREATE POLICY "Public read orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Public insert orders" ON public.orders FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read adari" ON public.adari_ledger FOR SELECT USING (true);
CREATE POLICY "Public insert/update adari" ON public.adari_ledger FOR ALL USING (true);

CREATE POLICY "Public read expenses" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "Public insert expenses" ON public.expenses FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read packaging audits" ON public.packaging_audits FOR SELECT USING (true);
CREATE POLICY "Public insert packaging audits" ON public.packaging_audits FOR INSERT WITH CHECK (true);

-- 8. Seed Initial Maraki Menu Catalog
INSERT INTO public.menu_items (id, name, menu_type, price, container_type, is_available, emoji, image_url, bg_gradient)
VALUES 
    ('j1', 'Special Avocado & Mango (Spris)', 'Juice', 180, 'cup', true, '🥑🥭', 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=400&q=80', 'from-amber-400 to-orange-500'),
    ('j2', 'Pure Fresh Mango Juice', 'Juice', 150, 'cup', true, '🥭', 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=400&q=80', 'from-orange-400 to-amber-500'),
    ('j3', 'Tropical Papaya & Orange', 'Juice', 140, 'cup', true, '🍊', 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=400&q=80', 'from-amber-500 to-red-400'),
    ('j4', 'Green Detox (Apple & Cucumber)', 'Juice', 190, 'cup', true, '🥬🍏', 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?auto=format&fit=crop&w=400&q=80', 'from-emerald-400 to-teal-500'),
    ('f1', 'Tropical Fruit Salad Bowl', 'Food', 240, 'box', true, '🥗🍍', 'https://images.unsplash.com/photo-1519996529931-28324d5a630e?auto=format&fit=crop&w=400&q=80', 'from-emerald-500 to-lime-500'),
    ('f2', 'Chicken Avocado Salad Bowl', 'Food', 320, 'box', true, '🍗🥑', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80', 'from-orange-500 to-emerald-600'),
    ('f3', 'Mediterranean Tuna Salad', 'Food', 290, 'box', true, '🐟🥗', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80', 'from-teal-500 to-blue-500')
ON CONFLICT (id) DO NOTHING;
