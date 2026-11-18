-- ==============================================================
-- MARAKI JUICE & SALAD - SUPABASE DATABASE SCHEMA
-- Free PostgreSQL Backend for Counter POS & Admin Management
-- ==============================================================

-- 1. Enable UUID Extension (optional utility)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Menu Items Table (100% Takeaway Food Items)
CREATE TABLE IF NOT EXISTS public.menu_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    english_name TEXT,
    category TEXT,
    menu_type TEXT NOT NULL DEFAULT 'Food' CHECK (menu_type IN ('Juice', 'Food')),
    price NUMERIC NOT NULL CHECK (price >= 0),
    container_type TEXT NOT NULL DEFAULT 'box' CHECK (container_type IN ('cup', 'box')),
    is_available BOOLEAN DEFAULT true,
    emoji TEXT,
    image_url TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    shift TEXT NOT NULL CHECK (shift IN ('Day Shift', 'Night Shift')),
    staff_name TEXT NOT NULL,
    waiter_name TEXT,
    channel TEXT NOT NULL CHECK (channel IN ('In-Store', 'BEU Delivery')),
    beu_order_id TEXT,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('Cash', 'Telebirr', 'CBE Birr', 'Adari', 'BEU Account')),
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

-- 8. Seed Official 16 Takeaway Food Menu Items
INSERT INTO public.menu_items (id, name, english_name, category, menu_type, price, container_type, is_available, emoji, image_url, description)
VALUES 
    ('m1', 'ማራኪ ኮምቦ ሳላድ', 'Maraki Combo Salad', 'Salad', 'Food', 430, 'box', true, '🥗✨', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80', 'የተሟላ ማራኪ ኮምቦ ሳላድ በአቮካዶ፣ ዶሮና ትኩስ አትክልት'),
    ('m2', 'ሳላድ', 'Salad', 'Salad', 'Food', 320, 'box', true, '🥗', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80', 'ትኩስ ሰላጣ ከአትክልትና ድሬሲንግ ጋር'),
    ('m3', 'ፓስታ በሳላድ', 'Pasta with Salad', 'Pasta & Rice', 'Food', 320, 'box', true, '🍝🥗', 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80', 'ጣፋጭ የተቀቀለ ፓስታ ከትኩስ ሰላጣ ጋር'),
    ('m4', 'ሩዝ በሳላድ', 'Rice with Salad', 'Pasta & Rice', 'Food', 320, 'box', true, '🍚🥗', 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80', 'ጥሩ ተደርጎ የተዘጋጀ ሩዝ ከሰላጣ ጋር'),
    ('m5', 'ፓስታ በአትክልት', 'Pasta with Vegetables', 'Pasta & Rice', 'Food', 320, 'box', true, '🍝🥦', 'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?auto=format&fit=crop&w=600&q=80', 'ፓስታ ከተለያዩ ትኩስ አትክልቶች ጋር'),
    ('m6', 'ሩዝ በአትክልት', 'Rice with Vegetables', 'Pasta & Rice', 'Food', 320, 'box', true, '🍚🥕', 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80', 'በካሮት፣ አተርና ጥቅል ጎመን የተዘጋጀ አትክልት ሩዝ'),
    ('m7', 'ፓስታ በእንቁላል', 'Pasta with Egg', 'Pasta & Rice', 'Food', 320, 'box', true, '🍝🥚', 'https://images.unsplash.com/photo-1546549032-9571cd6b27df?auto=format&fit=crop&w=600&q=80', 'ፓስታ በእንቁላል ተዘጋጅቶ የቀረበ'),
    ('m8', 'ሩዝ በእንቁላል', 'Rice with Egg', 'Pasta & Rice', 'Food', 320, 'box', true, '🍚🥚', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80', 'በእንቁላል የተጠበሰ ጣፋጭ ሩዝ'),
    ('m9', 'እንቁላል ፍርፍር', 'Egg Firfir', 'Eggs & Firfir', 'Food', 230, 'box', true, '🍳', 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80', 'በባህላዊ መንገድ በሽንኩርትና ቃሪያ የተዘጋጀ እንቁላል ፍርፍር'),
    ('m10', 'እንቁላል ስልስ', 'Egg Sils', 'Eggs & Firfir', 'Food', 230, 'box', true, '🍳🍅', 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=600&q=80', 'በጣፋጭ የቲማቲም ስልስ የተሰራ ትኩስ እንቁላል'),
    ('m11', 'እንቁላል ሳንድዊች', 'Egg Sandwich', 'Sandwiches', 'Food', 120, 'box', true, '🥪🥚', 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80', 'ትኩስ የእንቁላል ሳንድዊች በሰላጣና ቲማቲም'),
    ('m12', 'አትክልት ሳንድዊች', 'Vegetable Sandwich', 'Sandwiches', 'Food', 100, 'box', true, '🥪🥑', 'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=600&q=80', 'በአቮካዶና ትኩስ አትክልት የተዘጋጀ ሳንድዊች'),
    ('m13', 'ፍሩት ፓንች', 'Fruit Punch', 'Salad', 'Food', 320, 'box', true, '🍍🥭', 'https://images.unsplash.com/photo-1519996529931-28324d5a630e?auto=format&fit=crop&w=600&q=80', 'ማንጎ፣ ፓፓያ፣ አናናስና ሙዝ በማር የተዘጋጀ የፍራፍሬ ቦውል'),
    ('m14', 'ፍርፍር', 'Firfir', 'Eggs & Firfir', 'Food', 200, 'box', true, '🥘', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80', 'በበርበሬና ቅመማቅመም የተዘጋጀ የእንጀራ ፍርፍር'),
    ('m15', 'ፓስታ በስጎ', 'Pasta with Sugo', 'Pasta & Rice', 'Food', 200, 'box', true, '🍝🍅', 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80', 'በልዩ የቲማቲም ስጎ የተሰራ ትኩስ ፓስታ'),
    ('m16', 'ቴስቲሶያ', 'Tasty Soya', 'Eggs & Firfir', 'Food', 200, 'box', true, '🍲🌱', 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=600&q=80', 'በጥሩ ቅመም የተዘጋጀ ጣፋጭ የአኩሪ አተር ወጥ (ቴስቲሶያ)')
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name,
    english_name = EXCLUDED.english_name,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    container_type = EXCLUDED.container_type,
    image_url = EXCLUDED.image_url,
    description = EXCLUDED.description;
