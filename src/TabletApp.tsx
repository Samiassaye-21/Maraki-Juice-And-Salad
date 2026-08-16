import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabaseClient';
import { FoodMenuItem, TabletOrder, TabletOrderItem, TabletPaymentMethod, RestaurantSystemConfig } from './types';
import { DEFAULT_RESTAURANT_CONFIG, DEFAULT_FOOD_MENU } from './data/initialData';
import { getAutoShiftType } from './utils/shiftUtils';
import { ShoppingCart, CheckCircle, Trash2, Plus, Minus, Send, User, RefreshCw, Wifi, WifiOff, Globe } from 'lucide-react';

const T = {
  en: {
    title: 'Maraki Order Entry', staffName: 'Staff Name', staffPlaceholder: 'Enter your name...',
    customerName: 'Customer Name (optional)', customerPlaceholder: 'Customer name...',
    juice: 'Juice', food: 'Food', cart: 'Cart', total: 'Total',
    paymentMethod: 'Payment Method', cash: 'Cash', transfer: 'Transfer',
    submitOrder: 'Submit Order', orderSuccess: 'Order Submitted!', orderSuccessMsg: 'Order saved successfully.',
    emptyCart: 'Cart is empty', addItems: 'Tap items to add', staffRequired: 'Please enter your name',
    offlineBanner: 'Offline — orders will sync when connected', onlineBanner: 'Online',
    pendingSync: 'pending sync', notes: 'Special notes', notesPlaceholder: 'Allergies, extras...',
    dayShift: 'Day Shift', nightShift: 'Night Shift', birr: 'Br',
  },
  am: {
    title: 'ማራኪ ትዕዛዝ መስጫ', staffName: 'የሠራተኛ ስም', staffPlaceholder: 'ስምዎን ያስገቡ...',
    customerName: 'የደንበኛ ስም (አማራጭ)', customerPlaceholder: 'የደንበኛ ስም...',
    juice: 'ጭማቂ', food: 'ምግብ', cart: 'ቅርጫት', total: 'ጠቅላላ',
    paymentMethod: 'የክፍያ ዘዴ', cash: 'ጥሬ ገንዘብ', transfer: 'ዝውውር',
    submitOrder: 'ትዕዛዝ ላክ', orderSuccess: 'ትዕዛዝ ተልኳል!', orderSuccessMsg: 'ትዕዛዙ ተቀምጧል።',
    emptyCart: 'ቅርጫቱ ባዶ ነው', addItems: 'ዕቃዎችን ይምረጡ', staffRequired: 'እባክዎ ስምዎን ያስገቡ',
    offlineBanner: 'ከኔት ውጭ — ሲገናኝ ይሄዳሉ', onlineBanner: 'ኦንላይን',
    pendingSync: 'ሊሄዱ ይጠብቃሉ', notes: 'ልዩ ማስታወሻ', notesPlaceholder: 'አለርጂ፣ ተጨማሪ...',
    dayShift: 'የቀን ሸፍት', nightShift: 'የሌሊት ሸፍት', birr: 'ብር',
  }
};

export default function TabletApp() {
  const [lang, setLang] = useState<'en' | 'am'>('en');
  const t = T[lang];
  const [config, setConfig] = useState<RestaurantSystemConfig>(DEFAULT_RESTAURANT_CONFIG);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [staffName, setStaffName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState<'juice' | 'food'>('juice');
  const [cart, setCart] = useState<TabletOrderItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<TabletPaymentMethod>('cash');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successTotal, setSuccessTotal] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const shiftType = getAutoShiftType().shiftType;
  const shiftLabel = shiftType === 'day' ? t.dayShift : t.nightShift;

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
        id: order.id, client_order_id: order.clientOrderId, staff_name: order.staffName,
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

  const savePending = (order: TabletOrder) => {
    const stored = localStorage.getItem('maraki_tablet_pending');
    const arr: TabletOrder[] = stored ? JSON.parse(stored) : [];
    arr.push(order);
    localStorage.setItem('maraki_tablet_pending', JSON.stringify(arr));
    setPendingSyncCount(arr.length);
  };

  const juiceItem = {
    id: 'juice-cup', name: 'Juice Cup / ጭማቂ', price: config.defaultJuiceUnitPrice,
    category: 'special' as const, available: true, cat: 'juice' as const,
  };
  const allMenuItems = [
    juiceItem,
    ...(config.foodMenu || []).filter(f => f.available !== false).map(f => ({ ...f, cat: 'food' as const })),
  ];
  const menuItems = allMenuItems.filter(m => m.cat === category);

  const addToCart = (item: typeof allMenuItems[0]) => {
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

  const handleSubmit = async () => {
    if (!staffName.trim()) { setErrorMsg(t.staffRequired); return; }
    if (!cart.length) return;
    setErrorMsg('');
    setIsSubmitting(true);
    const now = new Date();
    const id = 'to-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    const order: TabletOrder = {
      id, clientOrderId: id, staffName: staffName.trim(),
      customerName: customerName.trim() || undefined,
      items: cart, totalAmount: cartTotal, paymentMethod, shiftType,
      status: 'active', notes: notes.trim() || undefined,
      orderTime: now.toISOString(), date: now.toISOString().split('T')[0], createdAt: now.getTime(),
    };
    if (isOnline) {
      const { error } = await supabase.from('tablet_orders').insert({
        id: order.id, client_order_id: order.clientOrderId, staff_name: order.staffName,
        customer_name: order.customerName || null, items: order.items,
        total_amount: order.totalAmount, payment_method: order.paymentMethod,
        shift_type: order.shiftType, status: order.status, notes: order.notes || null,
        order_time: order.orderTime, date: order.date, created_at_ts: order.createdAt,
      });
      if (error && error.code !== '23505') savePending(order);
    } else {
      savePending(order);
    }
    setIsSubmitting(false);
    setSuccessTotal(cartTotal);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setCart([]); setCustomerName(''); setNotes(''); setPaymentMethod('cash');
    }, 2500);
  };

  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-[#0B1D2C] flex flex-col items-center justify-center gap-6 z-50">
        <div className="bg-emerald-500 rounded-full p-6 shadow-2xl">
          <CheckCircle className="w-16 h-16 text-white" strokeWidth={1.5} />
        </div>
        <h2 className="text-3xl font-black text-white">{t.orderSuccess}</h2>
        <p className="text-white/60 text-lg">{t.orderSuccessMsg}</p>
        <div className="text-white text-3xl font-black mt-2">{t.birr} {successTotal.toLocaleString()}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f5f0] flex flex-col font-sans select-none">
      <div className="bg-[#0B1D2C] text-white px-4 py-3 flex items-center justify-between shadow-lg sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <img src="/logo.jpg" alt="Maraki" className="h-8 w-8 object-contain rounded" onError={e => ((e.currentTarget as HTMLImageElement).style.display = 'none')} />
          <div>
            <div className="font-black text-sm tracking-wide">ማራኪ · MARAKI</div>
            <div className="text-white/50 text-xs">{shiftLabel}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {pendingSyncCount > 0 && (
            <div className="flex items-center gap-1 bg-amber-500/20 text-amber-300 text-xs px-2 py-1 rounded-full">
              <RefreshCw className="w-3 h-3" /><span>{pendingSyncCount} {t.pendingSync}</span>
            </div>
          )}
          <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${isOnline ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          </div>
          <button onClick={() => setLang(l => l === 'en' ? 'am' : 'en')}
            className="flex items-center gap-1 text-xs text-white/60 hover:text-white px-2 py-1 rounded-full border border-white/10 hover:border-white/30 transition-colors">
            <Globe className="w-3 h-3" />{lang === 'en' ? 'አማ' : 'EN'}
          </button>
        </div>
      </div>
      {!isOnline && (
        <div className="bg-amber-500 text-white text-center text-xs py-1.5 font-semibold">{t.offlineBanner}</div>
      )}

      <div className="flex flex-1" style={{ height: 'calc(100vh - 56px)', overflow: 'hidden' }}>
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-white border-b border-black/10 px-4 py-3 flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="text-xs font-bold text-black/40 uppercase tracking-widest mb-1 block">{t.staffName} *</label>
              <div className={`flex items-center gap-2 border-2 rounded-xl px-3 py-2.5 bg-[#f7f5f0] transition-colors ${errorMsg ? 'border-red-400' : 'border-black/20 focus-within:border-[#0B1D2C]'}`}>
                <User className="w-4 h-4 text-black/30" />
                <input value={staffName} onChange={e => { setStaffName(e.target.value); setErrorMsg(''); }}
                  placeholder={t.staffPlaceholder}
                  className="flex-1 bg-transparent text-[#0B1D2C] text-sm font-semibold outline-none placeholder:text-black/25" />
              </div>
              {errorMsg && <p className="text-red-500 text-xs mt-1 font-semibold">{errorMsg}</p>}
            </div>
            <div className="flex-1">
              <label className="text-xs font-bold text-black/40 uppercase tracking-widest mb-1 block">{t.customerName}</label>
              <div className="flex items-center gap-2 border-2 border-black/20 rounded-xl px-3 py-2.5 bg-[#f7f5f0] focus-within:border-[#0B1D2C] transition-colors">
                <input value={customerName} onChange={e => setCustomerName(e.target.value)}
                  placeholder={t.customerPlaceholder}
                  className="flex-1 bg-transparent text-[#0B1D2C] text-sm outline-none placeholder:text-black/25" />
              </div>
            </div>
          </div>

          <div className="flex bg-white border-b border-black/10">
            {(['juice', 'food'] as const).map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`flex-1 py-3.5 text-sm font-bold tracking-wide transition-all border-b-2 ${
                  category === cat ? 'border-[#0B1D2C] text-[#0B1D2C] bg-[#0B1D2C]/5' : 'border-transparent text-black/35 hover:text-black/60'
                }`}>
                {cat === 'juice' ? '🥤 ' + t.juice : '🍽️ ' + t.food}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {menuItems.map(item => {
                const inCart = cart.find(c => c.menuItemId === item.id);
                return (
                  <button key={item.id} onClick={() => addToCart(item)}
                    className={'relative rounded-2xl p-4 text-left transition-all active:scale-95 shadow-sm border-2 ' + (inCart ? 'bg-[#0B1D2C] border-[#0B1D2C] text-white' : 'bg-white border-black/10 text-[#0B1D2C] hover:border-black/30 hover:shadow-md')}>
                    <div className="text-2xl mb-2">{category === 'juice' ? '🥤' : '🍽️'}</div>
                    <div className="font-bold text-xs leading-tight mb-1.5 line-clamp-2">{item.name}</div>
                    <div className={'text-sm font-black ' + (inCart ? 'text-white' : 'text-[#0B1D2C]')}>
                      {t.birr} {item.price.toLocaleString()}
                    </div>
                    {inCart && (
                      <div className="absolute top-2 right-2 bg-emerald-400 text-white text-xs font-black rounded-full w-5 h-5 flex items-center justify-center">
                        {inCart.quantity}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="w-72 sm:w-80 bg-white border-l border-black/10 flex flex-col shadow-xl">
          <div className="px-4 py-3 border-b border-black/10 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-[#0B1D2C]">
              <ShoppingCart className="w-4 h-4" />
              <span>{t.cart}</span>
              {cartCount > 0 && <span className="bg-[#0B1D2C] text-white text-xs font-black px-2 py-0.5 rounded-full">{cartCount}</span>}
            </div>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="text-black/30 hover:text-red-500 transition-colors p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-black/25 gap-2 py-8">
                <ShoppingCart className="w-10 h-10" strokeWidth={1} />
                <p className="text-sm font-semibold">{t.emptyCart}</p>
                <p className="text-xs">{t.addItems}</p>
              </div>
            ) : (
              <div className="divide-y divide-black/5">
                {cart.map(item => (
                  <div key={item.menuItemId} className="px-4 py-3 flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs text-[#0B1D2C] truncate">{item.name}</div>
                      <div className="text-xs text-black/40">{t.birr} {item.unitPrice} x {item.quantity}</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
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
                      {t.birr} {item.totalPrice.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-4 py-2 border-t border-black/10">
            <label className="text-xs font-bold text-black/35 uppercase tracking-widest mb-1 block">{t.notes}</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder={t.notesPlaceholder}
              className="w-full text-xs border border-black/15 rounded-lg px-2 py-1.5 resize-none outline-none focus:border-[#0B1D2C]/50 text-[#0B1D2C] placeholder:text-black/20 bg-[#f7f5f0]" />
          </div>

          <div className="px-4 py-3 border-t border-black/10">
            <label className="text-xs font-bold text-black/40 uppercase tracking-widest mb-2 block">{t.paymentMethod}</label>
            <div className="flex gap-2">
              {(['cash', 'transfer'] as const).map(pm => (
                <button key={pm} onClick={() => setPaymentMethod(pm)}
                  className={'flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border-2 ' + (paymentMethod === pm ? 'bg-[#0B1D2C] text-white border-[#0B1D2C]' : 'bg-[#f7f5f0] text-[#0B1D2C]/50 border-black/10 hover:border-black/30')}>
                  {pm === 'cash' ? '💵 ' + t.cash : '📲 ' + t.transfer}
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 pt-3 pb-5 border-t border-black/10 bg-[#f7f5f0]">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-[#0B1D2C]/50 text-sm">{t.total}</span>
              <span className="text-2xl font-black text-[#0B1D2C]">{t.birr} {cartTotal.toLocaleString()}</span>
            </div>
            <button onClick={handleSubmit} disabled={cart.length === 0 || isSubmitting}
              className={'w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg ' + (cart.length === 0 ? 'bg-black/15 text-black/25 cursor-not-allowed' : 'bg-[#0B1D2C] text-white hover:bg-[#162E44]')}>
              {isSubmitting
                ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <><Send className="w-4 h-4" /> {t.submitOrder}</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
