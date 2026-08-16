import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabaseClient';
import { TabletOrder, TabletOrderItem, TabletPaymentMethod, RestaurantSystemConfig } from './types';
import { DEFAULT_RESTAURANT_CONFIG, DEFAULT_FOOD_MENU } from './data/initialData';
import { ShoppingCart, CheckCircle, Trash2, Plus, Minus, Send, RefreshCw, WifiOff, Sun, Moon, ChefHat, ArrowLeft } from 'lucide-react';

type TabletShift = 'day' | 'night' | 'kitchen';

interface ShiftOption { id: TabletShift; amharic: string; english: string; icon: React.ReactNode; color: string; }

const SHIFTS: ShiftOption[] = [
  { id: 'day',     amharic: 'የቀን ሸፍት',    english: 'Day Shift',    icon: <Sun className="w-10 h-10" />,     color: 'bg-amber-500' },
  { id: 'night',   amharic: 'የሌሊት ሸፍት',  english: 'Night Shift',  icon: <Moon className="w-10 h-10" />,    color: 'bg-indigo-600' },
  { id: 'kitchen', amharic: 'ኩሽና',         english: 'Kitchen',      icon: <ChefHat className="w-10 h-10" />, color: 'bg-emerald-600' },
];

export default function TabletApp() {
  const [config, setConfig] = useState<RestaurantSystemConfig>(DEFAULT_RESTAURANT_CONFIG);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // Shift selection (null = show shift picker screen)
  const [shift, setShift] = useState<TabletShift | null>(null);

  // Order state
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState<'juice' | 'food'>('juice');
  const [cart, setCart] = useState<TabletOrderItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<TabletPaymentMethod>('cash');
  const [transferAmount, setTransferAmount] = useState('');  // actual transfer amount received
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState({ total: 0, tip: 0, method: 'cash' as TabletPaymentMethod });

  // Load config
  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('config').select('*').single();
      if (data) {
        setConfig({
          defaultJuiceUnitPrice: data.default_juice_unit_price,
          defaultFoodUnitPrice: data.default_food_unit_price,
          foodMenu: data.food_menu || DEFAULT_FOOD_MENU,
          currencySymbol: data.currency_symbol,
          dayShiftWorkerName: data.day_shift_worker_name,
          nightShiftWorkerName: data.night_shift_worker_name,
          restaurantName: data.restaurant_name,
        });
      }
    }
    load();
    const stored = localStorage.getItem('maraki_tablet_pending');
    if (stored) { try { setPendingSyncCount(JSON.parse(stored).length); } catch {} }
  }, []);

  const retryPendingSync = useCallback(async () => {
    const stored = localStorage.getItem('maraki_tablet_pending');
    if (!stored) return;
    const arr: TabletOrder[] = JSON.parse(stored);
    if (!arr.length) return;
    const remaining: TabletOrder[] = [];
    for (const order of arr) {
      const { error } = await supabase.from('tablet_orders').upsert({
        id: order.id, client_order_id: order.clientOrderId,
        staff_name: (order as any).shiftLabel || order.staffName,
        customer_name: order.customerName || null, items: order.items,
        total_amount: order.totalAmount, payment_method: order.paymentMethod,
        shift_type: order.shiftType, status: order.status, notes: order.notes || null,
        order_time: order.orderTime, date: order.date, created_at_ts: order.createdAt,
      }, { onConflict: 'client_order_id', ignoreDuplicates: true });
      if (error) remaining.push(order);
    }
    localStorage.setItem('maraki_tablet_pending', JSON.stringify(remaining));
    setPendingSyncCount(remaining.length);
  }, []);

  useEffect(() => {
    const goOnline = () => { setIsOnline(true); retryPendingSync(); };
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline); };
  }, [retryPendingSync]);

  const savePending = (order: TabletOrder & { shiftLabel: string }) => {
    const stored = localStorage.getItem('maraki_tablet_pending');
    const arr = stored ? JSON.parse(stored) : [];
    arr.push(order);
    localStorage.setItem('maraki_tablet_pending', JSON.stringify(arr));
    setPendingSyncCount(arr.length);
  };

  // Menu
  const juiceItem = { id: 'juice-cup', name: 'ጭማቂ (Juice Cup)', price: config.defaultJuiceUnitPrice, cat: 'juice' as const };
  const allItems = [
    juiceItem,
    ...(config.foodMenu || []).filter(f => f.available !== false).map(f => ({ ...f, cat: 'food' as const })),
  ];
  const menuItems = allItems.filter(m => m.cat === category);

  const addToCart = (item: typeof allItems[0]) => {
    setCart(prev => {
      const existing = prev.find(c => c.menuItemId === item.id);
      if (existing) {
        return prev.map(c => c.menuItemId === item.id
          ? { ...c, quantity: c.quantity + 1, totalPrice: (c.quantity + 1) * c.unitPrice } : c);
      }
      return [...prev, { menuItemId: item.id, name: item.name, category: item.cat,
        quantity: 1, unitPrice: item.price, totalPrice: item.price }];
    });
  };

  const changeQty = (menuItemId: string, delta: number) => {
    setCart(prev => prev
      .map(c => c.menuItemId === menuItemId
        ? { ...c, quantity: c.quantity + delta, totalPrice: (c.quantity + delta) * c.unitPrice } : c)
      .filter(c => c.quantity > 0));
  };

  const cartTotal = cart.reduce((s, c) => s + c.totalPrice, 0);
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);
  const transferAmt = parseFloat(transferAmount) || 0;
  const tip = paymentMethod === 'transfer' && transferAmt > cartTotal ? transferAmt - cartTotal : 0;

  const selectedShift = SHIFTS.find(s => s.id === shift);

  const handleSubmit = async () => {
    if (!cart.length || !shift) return;
    setIsSubmitting(true);
    const now = new Date();
    const id = 'to-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    const shiftRecord = SHIFTS.find(s => s.id === shift)!;
    const order: TabletOrder & { shiftLabel: string; transferAmount?: number; tip?: number } = {
      id, clientOrderId: id,
      staffName: shiftRecord.amharic,
      shiftLabel: shiftRecord.amharic,
      customerName: customerName.trim() || undefined,
      items: cart, totalAmount: cartTotal, paymentMethod,
      shiftType: (shift === 'kitchen' ? 'day' : shift) as 'day' | 'night',
      status: 'active', notes: notes.trim() || undefined,
      orderTime: now.toISOString(), date: now.toISOString().split('T')[0], createdAt: now.getTime(),
      transferAmount: paymentMethod === 'transfer' ? transferAmt : undefined,
      tip: tip > 0 ? tip : undefined,
    };

    const payload = {
      id: order.id, client_order_id: order.clientOrderId,
      staff_name: shiftRecord.amharic,
      customer_name: order.customerName || null, items: order.items,
      total_amount: order.totalAmount, payment_method: order.paymentMethod,
      shift_type: shift, status: order.status, notes: order.notes || null,
      order_time: order.orderTime, date: order.date, created_at_ts: order.createdAt,
    };

    if (isOnline) {
      const { error } = await supabase.from('tablet_orders').insert(payload);
      if (error && error.code !== '23505') savePending(order);
    } else {
      savePending(order);
    }

    setIsSubmitting(false);
    setSuccessData({ total: cartTotal, tip, method: paymentMethod });
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setCart([]); setCustomerName(''); setNotes('');
      setPaymentMethod('cash'); setTransferAmount('');
    }, 2800);
  };

  // ── SUCCESS SCREEN ─────────────────────────────────────────────────────────
  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-[#0B1D2C] flex flex-col items-center justify-center gap-5 z-50 px-8">
        <div className="bg-emerald-500 rounded-full p-6 shadow-2xl mb-2">
          <CheckCircle className="w-16 h-16 text-white" strokeWidth={1.5} />
        </div>
        <h2 className="text-3xl font-black text-white">ትዕዛዝ ተልኳል!</h2>
        <p className="text-white/50 text-sm">Order submitted successfully</p>
        <div className="mt-4 bg-white/10 rounded-3xl p-6 w-full max-w-xs space-y-3 text-center">
          <div className="text-white/50 text-xs uppercase tracking-widest">ጠቅላላ ዋጋ</div>
          <div className="text-4xl font-black text-white">ብር {successData.total.toLocaleString()}</div>
          {successData.method === 'transfer' && successData.tip > 0 && (
            <div className="bg-emerald-500/20 text-emerald-300 rounded-2xl px-4 py-3 mt-2">
              <div className="text-xs text-emerald-300/70 mb-1">ጠቃሚ (Tip)</div>
              <div className="text-2xl font-black">ብር {successData.tip.toLocaleString()}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── SHIFT PICKER SCREEN ────────────────────────────────────────────────────
  if (!shift) {
    return (
      <div className="min-h-screen bg-[#0B1D2C] flex flex-col items-center justify-center px-6 gap-8">
        {/* Logo + title */}
        <div className="text-center mb-2">
          <img src="/logo.jpg" alt="Maraki" className="h-20 w-20 mx-auto rounded-2xl object-cover mb-4 shadow-2xl"
            onError={e => ((e.currentTarget as HTMLImageElement).style.display = 'none')} />
          <h1 className="text-3xl font-black text-white tracking-tight">ማራኪ</h1>
          <p className="text-white/40 text-sm mt-1">ጭማቂ እና ሰላጣ • Order Entry</p>
        </div>

        {/* Pending sync badge */}
        {pendingSyncCount > 0 && (
          <div className="flex items-center gap-2 bg-amber-500/20 text-amber-300 text-sm px-4 py-2 rounded-full">
            <RefreshCw className="w-4 h-4" />
            <span>{pendingSyncCount} ትዕዛዝ ሊሄዱ ይጠብቃሉ</span>
          </div>
        )}
        {!isOnline && (
          <div className="flex items-center gap-2 bg-red-500/20 text-red-300 text-sm px-4 py-2 rounded-full">
            <WifiOff className="w-4 h-4" /><span>ከኔት ውጭ ነዎት</span>
          </div>
        )}

        <p className="text-white/60 text-lg font-semibold">ሸፍትዎን ይምረጡ</p>

        {/* Shift buttons */}
        <div className="flex flex-col gap-4 w-full max-w-sm">
          {SHIFTS.map(s => (
            <button key={s.id} onClick={() => setShift(s.id)}
              className={`${s.color} rounded-3xl p-6 flex items-center gap-5 shadow-2xl active:scale-95 transition-all text-left`}>
              <div className="text-white opacity-90">{s.icon}</div>
              <div>
                <div className="text-white font-black text-2xl">{s.amharic}</div>
                <div className="text-white/60 text-sm">{s.english}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── ORDER ENTRY SCREEN ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f7f5f0] flex flex-col font-sans select-none">

      {/* Top bar */}
      <div className={`${selectedShift!.color} text-white px-4 py-3 flex items-center justify-between shadow-lg sticky top-0 z-40`}>
        <button onClick={() => setShift(null)} className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <div>
            <div className="font-black text-base leading-tight">{selectedShift!.amharic}</div>
            <div className="text-white/60 text-xs">{selectedShift!.english}</div>
          </div>
        </button>
        <div className="flex items-center gap-2">
          {pendingSyncCount > 0 && (
            <div className="flex items-center gap-1 bg-black/20 text-white text-xs px-2 py-1 rounded-full">
              <RefreshCw className="w-3 h-3" /><span>{pendingSyncCount}</span>
            </div>
          )}
          {!isOnline && (
            <div className="flex items-center gap-1 bg-black/20 text-white text-xs px-2 py-1 rounded-full">
              <WifiOff className="w-3 h-3" /><span>ከኔት ውጭ</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1" style={{ height: 'calc(100vh - 56px)', overflow: 'hidden' }}>

        {/* LEFT: Menu */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Customer name */}
          <div className="bg-white border-b border-black/10 px-4 py-3">
            <label className="text-xs font-bold text-black/40 uppercase tracking-widest mb-1 block">የደንበኛ ስም (አማራጭ)</label>
            <input value={customerName} onChange={e => setCustomerName(e.target.value)}
              placeholder="የደንበኛ ስም..."
              className="w-full border-2 border-black/15 rounded-xl px-3 py-2.5 text-sm text-[#0B1D2C] outline-none focus:border-[#0B1D2C]/50 bg-[#f7f5f0] placeholder:text-black/25 font-semibold" />
          </div>

          {/* Category tabs */}
          <div className="flex bg-white border-b border-black/10">
            {(['juice', 'food'] as const).map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={'flex-1 py-3.5 text-base font-black tracking-wide transition-all border-b-3 ' + (
                  category === cat
                    ? 'border-b-2 border-[#0B1D2C] text-[#0B1D2C] bg-[#0B1D2C]/5'
                    : 'border-b-2 border-transparent text-black/30 hover:text-black/60'
                )}>
                {cat === 'juice' ? '🥤 ጭማቂ' : '🍽️ ምግብ'}
              </button>
            ))}
          </div>

          {/* Menu grid */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {menuItems.map(item => {
                const inCart = cart.find(c => c.menuItemId === item.id);
                return (
                  <button key={item.id} onClick={() => addToCart(item)}
                    className={'relative rounded-2xl p-4 text-left transition-all active:scale-95 shadow-sm border-2 ' +
                      (inCart ? 'bg-[#0B1D2C] border-[#0B1D2C] text-white' : 'bg-white border-black/10 text-[#0B1D2C] hover:border-black/30 hover:shadow-md')}>
                    <div className="text-2xl mb-2">{category === 'juice' ? '🥤' : '🍽️'}</div>
                    <div className={'font-bold text-xs leading-tight mb-1.5 line-clamp-2 ' + (inCart ? 'text-white' : 'text-[#0B1D2C]')}>{item.name}</div>
                    <div className={'text-sm font-black ' + (inCart ? 'text-white' : 'text-[#0B1D2C]')}>ብር {item.price.toLocaleString()}</div>
                    {inCart && (
                      <div className="absolute top-2 right-2 bg-emerald-400 text-white text-xs font-black rounded-full w-6 h-6 flex items-center justify-center">
                        {inCart.quantity}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: Cart + Payment */}
        <div className="w-72 sm:w-80 bg-white border-l border-black/10 flex flex-col shadow-xl">

          {/* Cart header */}
          <div className="px-4 py-3 border-b border-black/10 flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-[#0B1D2C]">
              <ShoppingCart className="w-4 h-4" />
              <span>ቅርጫት</span>
              {cartCount > 0 && <span className="bg-[#0B1D2C] text-white text-xs font-black px-2 py-0.5 rounded-full">{cartCount}</span>}
            </div>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="p-1 text-black/25 hover:text-red-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-black/20 gap-2">
                <ShoppingCart className="w-10 h-10" strokeWidth={1} />
                <p className="text-sm font-bold">ቅርጫቱ ባዶ ነው</p>
                <p className="text-xs">ዕቃዎችን ይምረጡ</p>
              </div>
            ) : (
              <div className="divide-y divide-black/5">
                {cart.map(item => (
                  <div key={item.menuItemId} className="px-4 py-3 flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs text-[#0B1D2C] truncate">{item.name}</div>
                      <div className="text-xs text-black/35">ብር {item.unitPrice} × {item.quantity}</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => changeQty(item.menuItemId, -1)}
                        className="w-7 h-7 rounded-full bg-[#f7f5f0] flex items-center justify-center hover:bg-red-100 hover:text-red-500 text-[#0B1D2C] transition-colors">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-black text-[#0B1D2C] w-4 text-center">{item.quantity}</span>
                      <button onClick={() => changeQty(item.menuItemId, 1)}
                        className="w-7 h-7 rounded-full bg-[#f7f5f0] flex items-center justify-center hover:bg-emerald-100 hover:text-emerald-600 text-[#0B1D2C] transition-colors">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="text-xs font-black text-[#0B1D2C] w-14 text-right shrink-0">
                      ብር {item.totalPrice.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="px-4 py-2 border-t border-black/10">
            <label className="text-xs font-bold text-black/30 uppercase tracking-widest mb-1 block">ልዩ ማስታወሻ</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="አለርጂ፣ ተጨማሪ..."
              className="w-full text-xs border border-black/10 rounded-lg px-2 py-1.5 resize-none outline-none focus:border-[#0B1D2C]/40 text-[#0B1D2C] placeholder:text-black/20 bg-[#f7f5f0]" />
          </div>

          {/* Payment method */}
          <div className="px-4 py-3 border-t border-black/10">
            <label className="text-xs font-bold text-black/35 uppercase tracking-widest mb-2 block">የክፍያ ዘዴ</label>
            <div className="flex gap-2">
              {(['cash', 'transfer'] as const).map(pm => (
                <button key={pm} onClick={() => setPaymentMethod(pm)}
                  className={'flex-1 py-3 rounded-xl text-sm font-black transition-all border-2 ' + (
                    paymentMethod === pm ? 'bg-[#0B1D2C] text-white border-[#0B1D2C]' : 'bg-[#f7f5f0] text-[#0B1D2C]/50 border-black/10 hover:border-black/30'
                  )}>
                  {pm === 'cash' ? '💵 ጥሬ ገንዘብ' : '📲 ዝውውር'}
                </button>
              ))}
            </div>

            {/* Transfer amount input — shown only for transfer */}
            {paymentMethod === 'transfer' && (
              <div className="mt-3 bg-indigo-50 rounded-2xl p-3 border border-indigo-200">
                <label className="text-xs font-bold text-indigo-700 mb-1.5 block">የተላከ ገንዘብ (ዝውውር)</label>
                <div className="flex items-center gap-2 bg-white border-2 border-indigo-300 rounded-xl px-3 py-2 focus-within:border-indigo-500 transition-colors">
                  <span className="text-indigo-500 font-black text-sm">ብር</span>
                  <input
                    type="number" inputMode="numeric"
                    value={transferAmount} onChange={e => setTransferAmount(e.target.value)}
                    placeholder={cartTotal.toString()}
                    className="flex-1 bg-transparent text-[#0B1D2C] font-black text-lg outline-none placeholder:text-black/20" />
                </div>
                {/* Tip display */}
                {transferAmt > 0 && (
                  <div className="mt-2 flex justify-between items-center text-sm">
                    <span className="text-indigo-600/70">የትዕዛዝ ዋጋ</span>
                    <span className="font-bold text-[#0B1D2C]">ብር {cartTotal.toLocaleString()}</span>
                  </div>
                )}
                {tip > 0 && (
                  <div className="mt-1 bg-emerald-100 rounded-xl px-3 py-2 flex justify-between items-center">
                    <span className="text-emerald-700 font-bold text-sm">ጠቃሚ (Tip) ✨</span>
                    <span className="text-emerald-700 font-black text-base">ብር {tip.toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Total + Submit */}
          <div className="px-4 pt-3 pb-5 border-t border-black/10 bg-[#f7f5f0]">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-[#0B1D2C]/50 text-sm">ጠቅላላ</span>
              <span className="text-2xl font-black text-[#0B1D2C]">ብር {cartTotal.toLocaleString()}</span>
            </div>
            <button onClick={handleSubmit} disabled={cart.length === 0 || isSubmitting}
              className={'w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg ' +
                (cart.length === 0 ? 'bg-black/15 text-black/25 cursor-not-allowed' : 'bg-[#0B1D2C] text-white hover:bg-[#162E44]')}>
              {isSubmitting
                ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <><Send className="w-4 h-4" /> ትዕዛዝ ላክ</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
