import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from './lib/supabaseClient';
import { 
  FoodMenuItem, TabletOrder, TabletOrderItem, TabletPaymentMethod, 
  RestaurantSystemConfig, KitchenOrder, KitchenTaker 
} from './types';
import { DEFAULT_RESTAURANT_CONFIG, DEFAULT_FOOD_MENU } from './data/initialData';
import { getOperationalDate, getAutoShiftType, formatEthiopianTime } from './utils/shiftUtils';
import { 
  ShoppingCart, CheckCircle, Trash2, Plus, Minus, Send, RefreshCw, 
  WifiOff, Sun, Moon, ChefHat, ArrowLeft, Clock, Check, Bike, 
  Layers, UtensilsCrossed, BarChart3, X, Receipt, Banknote, 
  Smartphone, Sparkles, ChevronDown, ChevronUp, Eye, Lock, Delete
} from 'lucide-react';

type TabletShift = 'day' | 'night' | 'kitchen';

interface ShiftOption {
  id: TabletShift;
  amharic: string;
  english: string;
  icon: React.ReactNode;
  color: string;
  btnBg: string;
}

const SHIFTS: ShiftOption[] = [
  { id: 'day',     amharic: 'የቀን ሸፍት',    english: 'Day Shift (2:00 morning – 2:00 evening)',   icon: <Sun className="w-9 h-9" />,     color: 'bg-amber-500',   btnBg: 'bg-amber-500 hover:bg-amber-600' },
  { id: 'night',   amharic: 'የሌሊት ሸፍት',  english: 'Night Shift (2:00 evening – 2:00 morning)', icon: <Moon className="w-9 h-9" />,    color: 'bg-indigo-600',  btnBg: 'bg-indigo-600 hover:bg-indigo-700' },
  { id: 'kitchen', amharic: 'ኩሽና',         english: 'Kitchen Check (ምግብ መስጫ)',                icon: <ChefHat className="w-9 h-9" />, color: 'bg-emerald-700', btnBg: 'bg-emerald-700 hover:bg-emerald-800' },
];

// PIN Configuration for Done/Exit action
const DAY_SHIFT_PINS = ['1111', '1234', '2026', '0000'];
const NIGHT_SHIFT_PINS = ['2222', '1234', '2026', '0000'];

const KITCHEN_TAKERS: { id: KitchenTaker; emoji: string; label: string; subLabel: string; color: string; border: string }[] = [
  { id: 'day_shift',    emoji: '☀️', label: 'ቀን ሸፍት',   subLabel: 'Day Shift (2:00 ጧት – 2:00 ማታ)',  color: 'bg-amber-50 hover:bg-amber-100/80', border: 'border-amber-400' },
  { id: 'night_shift',  emoji: '🌙', label: 'ሌሊት ሸፍት', subLabel: 'Night Shift (2:00 ማታ – 2:00 ጧት)', color: 'bg-indigo-50 hover:bg-indigo-100/80', border: 'border-indigo-400' },
  { id: 'beu_delivery', emoji: '🚴', label: 'BeU ዴሊቨሪ', subLabel: 'Delivery Rider Takeaway',          color: 'bg-emerald-50 hover:bg-emerald-100/80', border: 'border-emerald-400' },
];

const FOOD_CATEGORIES = [
  { id: 'all',         label: 'ሁሉም (All)',        emoji: '🍽️' },
  { id: 'special',     label: 'ልዩ (Special)',      emoji: '⭐' },
  { id: 'fast_food',   label: 'ፈጣን ምግብ (Fast)',    emoji: '🍝' },
  { id: 'breakfast',   label: 'ቁርስ (Breakfast)',   emoji: '🍳' },
  { id: 'traditional', label: 'ባሕላዊ (Traditional)', emoji: '🥘' },
];

const CATEGORY_EMOJI: Record<string, string> = {
  special: '⭐',
  fast_food: '🍝',
  breakfast: '🍳',
  traditional: '🥘',
};

export default function TabletApp() {
  const [config, setConfig] = useState<RestaurantSystemConfig>(DEFAULT_RESTAURANT_CONFIG);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // Main mode: null = Pick Mode (Day / Night / Kitchen)
  const [shift, setShift] = useState<TabletShift | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  // ─── PIN Verification Modal State for Done action ─────────────────────────
  const [showPinModal, setShowPinModal] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [pinSuccessAnim, setPinSuccessAnim] = useState(false);

  // ─── Shift Customer Order State (Day / Night) ──────────────────────────────
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState<'juice' | 'food'>('juice');
  const [cart, setCart] = useState<TabletOrderItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<TabletPaymentMethod>('cash');
  const [transferAmount, setTransferAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState({ total: 0, tip: 0, method: 'cash' as TabletPaymentMethod });

  // ─── Today's Orders from Tablet ────────────────────────────────────────────
  const [todayTabletOrders, setTodayTabletOrders] = useState<TabletOrder[]>([]);

  // ─── Kitchen Order Entry State (Kitchen Mode) ──────────────────────────────
  const [kitchenStep, setKitchenStep] = useState<'taker' | 'food'>('taker');
  const [kitchenTaker, setKitchenTaker] = useState<KitchenTaker | null>(null);
  const [kitchenCategory, setKitchenCategory] = useState<string>('all');
  const [kitchenSelectedFood, setKitchenSelectedFood] = useState<FoodMenuItem | null>(null);
  const [kitchenQuantity, setKitchenQuantity] = useState<number>(1);
  const [kitchenOrders, setKitchenOrders] = useState<KitchenOrder[]>([]);
  const [isKitchenSaving, setIsKitchenSaving] = useState(false);
  const [kitchenSuccessAnim, setKitchenSuccessAnim] = useState(false);

  const todayStr = getOperationalDate();

  // Load config, today's tablet orders, & today's kitchen orders
  const refreshAllData = useCallback(async () => {
    try {
      const { data: cfg } = await supabase.from('config').select('*').single();
      if (cfg) {
        setConfig({
          defaultJuiceUnitPrice: cfg.default_juice_unit_price,
          defaultFoodUnitPrice: cfg.default_food_unit_price,
          foodMenu: cfg.food_menu || DEFAULT_FOOD_MENU,
          currencySymbol: cfg.currency_symbol,
          dayShiftWorkerName: cfg.day_shift_worker_name,
          nightShiftWorkerName: cfg.night_shift_worker_name,
          dayShiftPin: cfg.day_shift_pin || '1111',
          nightShiftPin: cfg.night_shift_pin || '2222',
          restaurantName: cfg.restaurant_name,
        });
      }

      // Load today's tablet orders
      const { data: tOrders } = await supabase
        .from('tablet_orders')
        .select('*')
        .eq('date', todayStr)
        .order('created_at_ts', { ascending: false });

      if (tOrders) {
        setTodayTabletOrders(tOrders.map((r: any) => ({
          id: r.id,
          clientOrderId: r.client_order_id,
          staffName: r.staff_name,
          customerName: r.customer_name,
          items: r.items || [],
          totalAmount: r.total_amount,
          paymentMethod: r.payment_method,
          shiftType: r.shift_type,
          status: r.status,
          notes: r.notes,
          orderTime: r.order_time,
          date: r.date,
          createdAt: Number(r.created_at_ts),
        })));
      }

      // Load today's kitchen orders
      const { data: koData } = await supabase
        .from('kitchen_orders')
        .select('*')
        .eq('date', todayStr)
        .order('created_at_ts', { ascending: false });

      if (koData) {
        setKitchenOrders(koData.map((r: any) => ({
          id: r.id,
          foodItemId: r.food_item_id,
          foodItemName: r.food_item_name,
          quantity: r.quantity,
          taker: r.taker as KitchenTaker,
          shiftType: r.shift_type,
          orderTime: r.order_time,
          date: r.date,
          notes: r.notes,
          createdAt: Number(r.created_at_ts),
        })));
      }
    } catch (e) {
      console.error('Error refreshing tablet data:', e);
    }
  }, [todayStr]);

  useEffect(() => {
    refreshAllData();

    const stored = localStorage.getItem('maraki_tablet_pending');
    if (stored) {
      try { setPendingSyncCount(JSON.parse(stored).length); } catch {}
    }
  }, [refreshAllData]);

  // Online / Offline & Sync
  const retryPendingSync = useCallback(async () => {
    const stored = localStorage.getItem('maraki_tablet_pending');
    if (!stored) return;
    const arr: TabletOrder[] = JSON.parse(stored);
    if (!arr.length) return;
    const remaining: TabletOrder[] = [];
    for (const order of arr) {
      const { error } = await supabase.from('tablet_orders').upsert({
        id: order.id,
        client_order_id: order.clientOrderId,
        staff_name: order.staffName,
        customer_name: order.customerName || null,
        items: order.items,
        total_amount: order.totalAmount,
        payment_method: order.paymentMethod,
        shift_type: order.shiftType,
        status: order.status,
        notes: order.notes || null,
        order_time: order.orderTime,
        date: order.date,
        created_at_ts: order.createdAt,
      }, { onConflict: 'client_order_id', ignoreDuplicates: true });
      if (error) remaining.push(order);
    }
    localStorage.setItem('maraki_tablet_pending', JSON.stringify(remaining));
    setPendingSyncCount(remaining.length);
    if (remaining.length === 0) refreshAllData();
  }, [refreshAllData]);

  useEffect(() => {
    const goOnline = () => { setIsOnline(true); retryPendingSync(); };
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [retryPendingSync]);

  const savePending = (order: TabletOrder) => {
    const stored = localStorage.getItem('maraki_tablet_pending');
    const arr = stored ? JSON.parse(stored) : [];
    arr.push(order);
    localStorage.setItem('maraki_tablet_pending', JSON.stringify(arr));
    setPendingSyncCount(arr.length);
  };

  // ─── Shift Customer Order Handlers ─────────────────────────────────────────
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
      return [...prev, {
        menuItemId: item.id, name: item.name, category: item.cat,
        quantity: 1, unitPrice: item.price, totalPrice: item.price,
      }];
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

  const handleSubmitCustomerOrder = async () => {
    if (!cart.length || !shift) return;
    setIsSubmitting(true);
    const now = new Date();
    const id = 'to-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    const shiftRecord = SHIFTS.find(s => s.id === shift)!;
    const order: TabletOrder = {
      id,
      clientOrderId: id,
      staffName: shiftRecord.amharic,
      customerName: customerName.trim() || undefined,
      items: cart,
      totalAmount: cartTotal,
      paymentMethod,
      shiftType: shift as 'day' | 'night',
      status: 'active',
      notes: notes.trim() ? (tip > 0 ? `${notes.trim()} (Tip: ${tip} Br)` : notes.trim()) : (tip > 0 ? `Tip: ${tip} Br` : undefined),
      orderTime: now.toISOString(),
      date: now.toISOString().split('T')[0],
      createdAt: now.getTime(),
    };

    // Optimistic UI update
    setTodayTabletOrders(prev => [order, ...prev]);

    const payload = {
      id: order.id,
      client_order_id: order.clientOrderId,
      staff_name: shiftRecord.amharic,
      customer_name: order.customerName || null,
      items: order.items,
      total_amount: order.totalAmount,
      payment_method: order.paymentMethod,
      shift_type: shift,
      status: order.status,
      notes: order.notes || null,
      order_time: order.orderTime,
      date: order.date,
      created_at_ts: order.createdAt,
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
      setCart([]);
      setCustomerName('');
      setNotes('');
      setPaymentMethod('cash');
      setTransferAmount('');
    }, 2400);
  };

  // ─── Shift End-of-Day Financial Calculations ───────────────────────────────
  const shiftOrders = useMemo(() => {
    if (!shift || shift === 'kitchen') return [];
    return todayTabletOrders.filter(o => o.shiftType === shift && o.status !== 'voided');
  }, [todayTabletOrders, shift]);

  const shiftStats = useMemo(() => {
    const totalRev = shiftOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const cashTotal = shiftOrders.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + o.totalAmount, 0);
    const transferTotal = shiftOrders.filter(o => o.paymentMethod === 'transfer').reduce((sum, o) => sum + o.totalAmount, 0);
    
    let tipTotal = 0;
    let juiceCount = 0;
    let foodCount = 0;
    const itemMap: Record<string, { name: string; category: string; quantity: number; totalRevenue: number; unitPrice: number }> = {};

    shiftOrders.forEach(o => {
      // Tip parse
      if (o.notes) {
        const match = o.notes.match(/Tip:\s*(\d+(\.\d+)?)/i);
        if (match) tipTotal += parseFloat(match[1]);
      }

      (o.items || []).forEach(it => {
        if (it.category === 'juice') juiceCount += it.quantity;
        else foodCount += it.quantity;

        const key = it.menuItemId || it.name;
        if (!itemMap[key]) {
          itemMap[key] = {
            name: it.name,
            category: it.category,
            quantity: 0,
            totalRevenue: 0,
            unitPrice: it.unitPrice,
          };
        }
        itemMap[key].quantity += it.quantity;
        itemMap[key].totalRevenue += it.totalPrice;
      });
    });

    const itemBreakdown = Object.values(itemMap).sort((a, b) => b.quantity - a.quantity);

    return {
      totalRev,
      cashTotal,
      transferTotal,
      tipTotal,
      juiceCount,
      foodCount,
      orderCount: shiftOrders.length,
      itemBreakdown,
    };
  }, [shiftOrders]);

  // General Day / Night stats for Home Cards
  const dayShiftOrders = useMemo(() => todayTabletOrders.filter(o => o.shiftType === 'day' && o.status !== 'voided'), [todayTabletOrders]);
  const dayShiftTotalRev = useMemo(() => dayShiftOrders.reduce((s, o) => s + o.totalAmount, 0), [dayShiftOrders]);

  const nightShiftOrders = useMemo(() => todayTabletOrders.filter(o => o.shiftType === 'night' && o.status !== 'voided'), [todayTabletOrders]);
  const nightShiftTotalRev = useMemo(() => nightShiftOrders.reduce((s, o) => s + o.totalAmount, 0), [nightShiftOrders]);

  // ─── PIN Validation for Done Action ─────────────────────────────────────────
  const handleKeypadPress = (digit: string) => {
    if (enteredPin.length >= 4) return;
    const next = enteredPin + digit;
    setEnteredPin(next);
    setPinError(false);

    if (next.length === 4) {
      validateEnteredPin(next);
    }
  };

  const handleKeypadDelete = () => {
    setEnteredPin(prev => prev.slice(0, -1));
    setPinError(false);
  };

  const handleKeypadClear = () => {
    setEnteredPin('');
    setPinError(false);
  };

  const validateEnteredPin = (pinToTest: string) => {
    const configuredPin = shift === 'day' 
      ? (config.dayShiftPin || '1111') 
      : (config.nightShiftPin || '2222');

    const validPins = [
      configuredPin,
      shift === 'day' ? '1111' : '2222',
      '1234',
      '2026',
      '0000'
    ];

    if (validPins.includes(pinToTest)) {
      // PIN is correct!
      setPinSuccessAnim(true);
      setTimeout(() => {
        setPinSuccessAnim(false);
        setShowPinModal(false);
        setShowSummaryModal(false);
        setShift(null); // Return to home screen
        setEnteredPin('');
      }, 1000);
    } else {
      // Incorrect PIN
      setPinError(true);
      setTimeout(() => {
        setEnteredPin('');
      }, 900);
    }
  };

  // ─── Kitchen Order Handlers ────────────────────────────────────────────────
  const handleSaveKitchenOrder = async (food: FoodMenuItem, qty: number) => {
    if (!kitchenTaker) return;
    setIsKitchenSaving(true);

    const now = new Date();
    const autoShift = getAutoShiftType(now);
    const shiftType = kitchenTaker === 'beu_delivery' ? autoShift.shiftType : (kitchenTaker === 'night_shift' ? 'night' : 'day');
    const opDate = getOperationalDate(now);

    const newOrder: KitchenOrder = {
      id: 'ko-' + Date.now(),
      foodItemId: food.id,
      foodItemName: food.name,
      quantity: qty,
      taker: kitchenTaker,
      shiftType,
      orderTime: now.toISOString(),
      date: opDate,
      createdAt: Date.now(),
    };

    setKitchenOrders(prev => [newOrder, ...prev]);

    if (isOnline) {
      const { error } = await supabase.from('kitchen_orders').insert({
        id: newOrder.id,
        food_item_id: newOrder.foodItemId,
        food_item_name: newOrder.foodItemName,
        quantity: newOrder.quantity,
        taker: newOrder.taker,
        shift_type: newOrder.shiftType,
        order_time: newOrder.orderTime,
        date: newOrder.date,
        created_at_ts: newOrder.createdAt,
      });
      if (error) console.error('Error saving kitchen order:', error);
    }

    setIsKitchenSaving(false);
    setKitchenSelectedFood(null);
    setKitchenQuantity(1);
    setKitchenSuccessAnim(true);
    setTimeout(() => setKitchenSuccessAnim(false), 1300);
  };

  const handleDeleteKitchenOrder = async (id: string) => {
    setKitchenOrders(prev => prev.filter(o => o.id !== id));
    await supabase.from('kitchen_orders').delete().eq('id', id);
  };

  const activeKitchenFoods = (config.foodMenu || DEFAULT_FOOD_MENU).filter(f => f.available !== false);
  const filteredKitchenFoods = kitchenCategory === 'all' 
    ? activeKitchenFoods 
    : activeKitchenFoods.filter(f => f.category === kitchenCategory);

  const selectedTakerObj = KITCHEN_TAKERS.find(t => t.id === kitchenTaker);

  // ─── 1. SHIFT PICKER SCREEN (Home on tablet launch) ────────────────────────
  if (!shift) {
    return (
      <div className="min-h-screen bg-[#0B1D2C] flex flex-col items-center justify-center px-6 py-8 select-none">
        <div className="text-center mb-6">
          <img 
            src="/logo.jpg" 
            alt="Maraki" 
            className="h-20 w-20 mx-auto rounded-3xl object-cover mb-4 shadow-2xl border border-white/10"
            onError={e => ((e.currentTarget as HTMLImageElement).style.display = 'none')} 
          />
          <h1 className="text-4xl font-black text-white tracking-tight">ማራኪ • MARAKI</h1>
          <p className="text-[#f7f5f0]/70 text-base font-semibold mt-1">የቀን፣ የሌሊት እና የኩሽና ትዕዛዝ መስጫ</p>
        </div>

        <div className="text-center mb-6">
          <p className="text-white/80 text-lg font-bold">እባክዎ የስራ ክፍልዎን ይምረጡ</p>
          <p className="text-white/40 text-xs uppercase tracking-widest mt-0.5">Select Working Mode</p>
        </div>

        {/* 3 Large Action Cards with Today's Live Running Totals */}
        <div className="flex flex-col gap-4 w-full max-w-lg">
          {SHIFTS.map(s => {
            const isDay = s.id === 'day';
            const isNight = s.id === 'night';
            const isKitchen = s.id === 'kitchen';

            return (
              <button
                key={s.id}
                onClick={() => {
                  setShift(s.id);
                  if (s.id === 'kitchen') {
                    setKitchenStep('taker');
                    setKitchenTaker(null);
                  }
                }}
                className={`${s.btnBg} rounded-3xl p-5 sm:p-6 flex items-center gap-5 shadow-2xl active:scale-95 transition-all text-left border-2 border-white/10 cursor-pointer`}
              >
                <div className="text-white bg-black/20 p-3.5 rounded-2xl shrink-0 shadow-inner">
                  {s.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="text-white font-black text-2xl sm:text-3xl leading-tight">{s.amharic}</div>
                    {/* Live Badge */}
                    <div className="bg-black/30 text-white font-black text-xs sm:text-sm px-3 py-1 rounded-full border border-white/15">
                      {isDay && `ብር ${dayShiftTotalRev.toLocaleString()}`}
                      {isNight && `ብር ${nightShiftTotalRev.toLocaleString()}`}
                      {isKitchen && `${kitchenOrders.length} ዕቃዎች`}
                    </div>
                  </div>
                  <div className="text-white/75 text-xs sm:text-sm font-medium mt-1">
                    {isDay && `የዛሬ ሽያጭ: ${dayShiftOrders.length} ትዕዛዞች ተመዝግበዋል`}
                    {isNight && `የዛሬ ሽያጭ: ${nightShiftOrders.length} ትዕዛዞች ተመዝግበዋል`}
                    {isKitchen && `የተሰጡ ምግቦች መዝገብ`}
                  </div>
                </div>
                <div className="text-white/50 text-2xl font-black">→</div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── 2. KITCHEN CHECK FLOW (Cook / Chef Order Logging) ─────────────────────
  if (shift === 'kitchen') {
    return (
      <div className="min-h-screen bg-[#f7f5f0] flex flex-col font-sans select-none">
        {/* Top Bar */}
        <div className="bg-[#0B1D2C] text-white px-4 py-3.5 flex items-center justify-between shadow-lg sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShift(null)} 
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-xs font-bold hidden sm:inline">ዋና ገጽ (Home)</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                <ChefHat className="w-5 h-5" />
              </div>
              <div>
                <div className="font-black text-base leading-tight">ኩሽና • Kitchen Check</div>
                <div className="text-white/50 text-xs">ቀን: {todayStr}</div>
              </div>
            </div>
          </div>

          {/* Current Taker indicator or switch button */}
          {kitchenStep === 'food' && selectedTakerObj && (
            <button 
              onClick={() => setKitchenStep('taker')}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-3.5 py-1.5 rounded-2xl transition-all shadow-sm border border-emerald-400/40 cursor-pointer"
            >
              <span className="text-lg">{selectedTakerObj.emoji}</span>
              <span>ተቀባይ: <strong>{selectedTakerObj.label}</strong></span>
              <span className="text-white/60 text-xs ml-1">(ቀይር)</span>
            </button>
          )}
        </div>

        {/* ─── KITCHEN STEP 1: WHO IS RECEIVING? (ተቀባይ ማን ነው?) ─── */}
        {kitchenStep === 'taker' ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 max-w-2xl mx-auto w-full">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-3xl bg-[#0B1D2C] text-white flex items-center justify-center mx-auto mb-3 shadow-lg">
                <UtensilsCrossed className="w-8 h-8" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-[#0B1D2C]">ተቀባይ ማን ነው?</h2>
              <p className="text-[#0B1D2C]/60 text-sm sm:text-base font-semibold mt-1">
                ምግቡን የወሰደው የቀን ወይስ የሌሊት ሸፍት ነው? (Select Receiver)
              </p>
            </div>

            {/* 3 Receiver Cards */}
            <div className="flex flex-col gap-4 w-full">
              {KITCHEN_TAKERS.map(t => {
                const autoInfo = getAutoShiftType();
                const isAutoActive = t.id === autoInfo.defaultTaker;

                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setKitchenTaker(t.id);
                      setKitchenStep('food');
                      setKitchenSelectedFood(null);
                      setKitchenQuantity(1);
                    }}
                    className={`relative flex items-center gap-5 p-5 sm:p-6 rounded-3xl border-3 ${t.border} ${t.color} text-[#0B1D2C] shadow-md active:scale-95 transition-all text-left cursor-pointer`}
                  >
                    <span className="text-5xl sm:text-6xl p-2 bg-white rounded-2xl shadow-xs shrink-0">{t.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl sm:text-3xl font-black text-[#0B1D2C]">{t.label}</span>
                        {isAutoActive && (
                          <span className="text-xs bg-[#0B1D2C] text-white font-bold px-2.5 py-1 rounded-full shadow-xs">
                            አሁን ያለው (Active)
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-semibold text-[#0B1D2C]/70 mt-1">{t.subLabel}</div>
                    </div>
                    <div className="text-[#0B1D2C]/40 text-2xl font-black">→</div>
                  </button>
                );
              })}
            </div>

            {/* Today's Dispatched Summary */}
            {kitchenOrders.length > 0 && (
              <div className="mt-8 w-full bg-white rounded-3xl p-5 border border-[#0B1D2C]/10 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-xs font-black uppercase text-[#0B1D2C]/60 tracking-wider">
                    <Clock className="w-4 h-4 text-[#0B1D2C]" />
                    <span>የዛሬ የኩሽና ትዕዛዞች (Today Dispatched: {kitchenOrders.length} ዕቃዎች)</span>
                  </div>
                </div>
                <div className="divide-y divide-[#0B1D2C]/5 max-h-48 overflow-y-auto">
                  {kitchenOrders.slice(0, 5).map(o => (
                    <div key={o.id} className="py-2.5 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {o.taker === 'day_shift' ? '☀️' : o.taker === 'night_shift' ? '🌙' : '🚴'}
                        </span>
                        <span className="font-black text-[#0B1D2C]">{o.foodItemName}</span>
                        <span className="text-xs text-[#0B1D2C]/50 font-bold">× {o.quantity}</span>
                      </div>
                      <span className="text-xs font-bold text-[#0B1D2C]/40">
                        {formatEthiopianTime(o.orderTime)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ─── KITCHEN STEP 2: CHOOSE FOOD CATEGORIES & QUANTITY ─── */
          <div className="flex flex-1" style={{ height: 'calc(100vh - 60px)', overflow: 'hidden' }}>
            
            {/* LEFT: Food Category Picker & Items Grid */}
            <div className="flex-1 flex flex-col overflow-hidden">
              
              {/* Category Filter Pills */}
              <div className="bg-white border-b border-[#0B1D2C]/10 px-4 py-3 flex gap-2 overflow-x-auto">
                {FOOD_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setKitchenCategory(cat.id)}
                    className={`px-4 py-2.5 rounded-2xl text-sm font-bold shrink-0 transition-all flex items-center gap-1.5 border-2 cursor-pointer ${
                      kitchenCategory === cat.id
                        ? 'bg-[#0B1D2C] text-white border-[#0B1D2C] shadow-md scale-102'
                        : 'bg-[#f7f5f0] text-[#0B1D2C]/70 border-[#0B1D2C]/15 hover:border-[#0B1D2C]/40'
                    }`}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>

              {/* Food Items Grid */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
                  {filteredKitchenFoods.map(food => {
                    const isSelected = kitchenSelectedFood?.id === food.id;
                    const emoji = CATEGORY_EMOJI[food.category || 'special'] || '🍽️';

                    return (
                      <button
                        key={food.id}
                        onClick={() => {
                          setKitchenSelectedFood(food);
                          if (!kitchenSelectedFood || kitchenSelectedFood.id !== food.id) {
                            setKitchenQuantity(1);
                          }
                        }}
                        className={`relative rounded-3xl p-4 text-left transition-all active:scale-95 shadow-sm border-3 flex flex-col justify-between min-h-[120px] cursor-pointer ${
                          isSelected
                            ? 'bg-[#0B1D2C] border-[#0B1D2C] text-white shadow-xl'
                            : 'bg-white border-[#0B1D2C]/15 text-[#0B1D2C] hover:border-[#0B1D2C]/40 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <span className="text-3xl">{emoji}</span>
                          {isSelected && (
                            <span className="bg-emerald-400 text-[#0B1D2C] text-xs font-black px-2 py-0.5 rounded-full">
                              የተመረጠ
                            </span>
                          )}
                        </div>
                        <div>
                          <div className={`font-black text-sm sm:text-base leading-snug line-clamp-2 ${isSelected ? 'text-white' : 'text-[#0B1D2C]'}`}>
                            {food.name}
                          </div>
                          <div className={`text-xs font-bold mt-1 ${isSelected ? 'text-[#f7f5f0]/70' : 'text-[#0B1D2C]/50'}`}>
                            ብር {food.price.toLocaleString()}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT: Selected Food Quantity & Dispatch Action Panel */}
            <div className="w-80 sm:w-96 bg-white border-l border-[#0B1D2C]/10 flex flex-col shadow-2xl">
              
              {/* Receiver Badge */}
              <div className="p-4 bg-[#f7f5f0] border-b border-[#0B1D2C]/10 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#0B1D2C]/50 uppercase tracking-wider">ተቀባይ ክፍል</div>
                  <div className="font-black text-base text-[#0B1D2C] flex items-center gap-1.5 mt-0.5">
                    <span>{selectedTakerObj?.emoji}</span>
                    <span>{selectedTakerObj?.label}</span>
                  </div>
                </div>
                <button
                  onClick={() => setKitchenStep('taker')}
                  className="text-xs font-bold bg-white text-[#0B1D2C] px-3 py-1.5 rounded-xl border border-[#0B1D2C]/20 hover:bg-[#0B1D2C] hover:text-white transition-colors cursor-pointer"
                >
                  ቀይር
                </button>
              </div>

              {/* Quantity Selector Section */}
              <div className="flex-1 p-5 flex flex-col justify-center items-center text-center">
                {kitchenSelectedFood ? (
                  <div className="w-full space-y-5">
                    <div className="text-5xl">{CATEGORY_EMOJI[kitchenSelectedFood.category || 'special'] || '🍽️'}</div>
                    <div>
                      <h3 className="text-2xl font-black text-[#0B1D2C]">{kitchenSelectedFood.name}</h3>
                      <p className="text-sm font-bold text-[#0B1D2C]/50 mt-1">ስንት እቃ ተሰጠ? (How many portions?)</p>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center justify-center gap-6 py-2">
                      <button
                        onClick={() => setKitchenQuantity(q => Math.max(1, q - 1))}
                        className="w-16 h-16 rounded-2xl bg-[#f7f5f0] hover:bg-red-50 hover:text-red-600 border-2 border-[#0B1D2C]/20 flex items-center justify-center active:scale-90 text-[#0B1D2C] transition-all shadow-xs cursor-pointer"
                      >
                        <Minus className="w-7 h-7" strokeWidth={3} />
                      </button>

                      <span className="text-6xl font-black text-[#0B1D2C] w-20 text-center">
                        {kitchenQuantity}
                      </span>

                      <button
                        onClick={() => setKitchenQuantity(q => q + 1)}
                        className="w-16 h-16 rounded-2xl bg-[#0B1D2C] hover:bg-[#162E44] text-white flex items-center justify-center active:scale-90 transition-all shadow-md cursor-pointer"
                      >
                        <Plus className="w-7 h-7" strokeWidth={3} />
                      </button>
                    </div>

                    {/* Quick portion chips */}
                    <div className="flex justify-center gap-2 pt-2">
                      {[1, 2, 3, 5, 10].map(n => (
                        <button
                          key={n}
                          onClick={() => setKitchenQuantity(n)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all border cursor-pointer ${
                            kitchenQuantity === n
                              ? 'bg-[#0B1D2C] text-white border-[#0B1D2C]'
                              : 'bg-[#f7f5f0] text-[#0B1D2C]/70 border-[#0B1D2C]/20 hover:border-[#0B1D2C]/50'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-[#0B1D2C]/30 space-y-3">
                    <UtensilsCrossed className="w-16 h-16 mx-auto stroke-1" />
                    <p className="font-bold text-base text-[#0B1D2C]/60">እባክዎ ከግራ በኩል ምግብ ይምረጡ</p>
                    <p className="text-xs">Tap any food item to set quantity</p>
                  </div>
                )}
              </div>

              {/* Save Button */}
              <div className="p-4 border-t border-[#0B1D2C]/10 bg-[#f7f5f0]">
                <button
                  onClick={() => kitchenSelectedFood && handleSaveKitchenOrder(kitchenSelectedFood, kitchenQuantity)}
                  disabled={!kitchenSelectedFood || isKitchenSaving}
                  className={`w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl cursor-pointer ${
                    !kitchenSelectedFood
                      ? 'bg-black/15 text-black/30 cursor-not-allowed'
                      : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-700/30'
                  }`}
                >
                  {isKitchenSaving ? (
                    <div className="w-6 h-6 border-3 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-6 h-6" strokeWidth={3} />
                      <span>አስቀምጥ (Save Order)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Today's Dispatched List for Kitchen */}
              <div className="border-t border-[#0B1D2C]/10 p-3 bg-white max-h-44 overflow-y-auto">
                <div className="text-xs font-black text-[#0B1D2C]/60 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>የዛሬ የኩሽና መዝገብ ({kitchenOrders.length})</span>
                </div>
                {kitchenOrders.length === 0 ? (
                  <p className="text-xs text-[#0B1D2C]/40 text-center py-2">ዛሬ ምንም ምግብ አልተሰጠም</p>
                ) : (
                  <div className="space-y-1.5">
                    {kitchenOrders.slice(0, 4).map(o => (
                      <div key={o.id} className="flex items-center justify-between text-xs bg-[#f7f5f0] p-2 rounded-xl border border-[#0B1D2C]/10">
                        <div className="flex items-center gap-1.5">
                          <span>{o.taker === 'day_shift' ? '☀️' : o.taker === 'night_shift' ? '🌙' : '🚴'}</span>
                          <span className="font-bold text-[#0B1D2C]">{o.foodItemName}</span>
                          <span className="text-emerald-700 font-black">× {o.quantity}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteKitchenOrder(o.id)}
                          className="text-[#0B1D2C]/30 hover:text-red-500 transition-colors p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Success Toast Overlay */}
            <AnimatePresence>
              {kitchenSuccessAnim && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 pointer-events-none"
                >
                  <div className="bg-white rounded-3xl p-8 shadow-2xl flex flex-col items-center gap-3 border-2 border-emerald-500 text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center animate-bounce">
                      <Check className="w-10 h-10" strokeWidth={3} />
                    </div>
                    <h3 className="text-2xl font-black text-[#0B1D2C]">ተቀምጧል!</h3>
                    <p className="text-sm font-bold text-neutral-600">ምግቡ በኩሽና መዝገብ ላይ ተመዝግቧል</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    );
  }

  // ─── 3. DAY / NIGHT SHIFT CUSTOMER ORDER FLOW ──────────────────────────────
  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-[#0B1D2C] flex flex-col items-center justify-center gap-5 z-50 px-8 select-none">
        <div className="bg-emerald-500 rounded-full p-6 shadow-2xl mb-2 animate-bounce">
          <CheckCircle className="w-16 h-16 text-white" strokeWidth={1.5} />
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-white">ትዕዛዝ ተልኳል!</h2>
        <p className="text-[#f7f5f0]/60 text-base font-semibold">Order saved and synced successfully</p>
        
        <div className="mt-4 bg-white/10 rounded-3xl p-6 w-full max-w-xs space-y-3 text-center border border-white/15 shadow-xl">
          <div className="text-[#f7f5f0]/60 text-xs uppercase tracking-widest font-bold">ጠቅላላ የተከፈለ</div>
          <div className="text-4xl font-black text-white">ብር {successData.total.toLocaleString()}</div>
          
          {successData.method === 'transfer' && successData.tip > 0 && (
            <div className="bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 rounded-2xl px-4 py-3 mt-2">
              <div className="text-xs text-emerald-300/80 mb-1 font-bold">✨ የተሰጠ ጠቃሚ (Tip)</div>
              <div className="text-2xl font-black">ብር {successData.tip.toLocaleString()}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f5f0] flex flex-col font-sans select-none relative">
      
      {/* ── Top Bar ── */}
      <div className={`${selectedShift!.color} text-white px-4 py-3 flex items-center justify-between shadow-lg sticky top-0 z-40`}>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShift(null)} 
            className="flex items-center gap-2 text-white/90 hover:text-white active:scale-95 transition-all cursor-pointer"
          >
            <div className="p-1.5 rounded-xl bg-black/20">
              <ArrowLeft className="w-5 h-5" />
            </div>
            <div>
              <div className="font-black text-base leading-tight">{selectedShift!.amharic}</div>
              <div className="text-white/70 text-xs">{selectedShift!.english}</div>
            </div>
          </button>
        </div>

        {/* Live Metrics & Summary Modal Trigger */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowSummaryModal(true)}
            className="flex items-center gap-2 bg-black/30 hover:bg-black/40 text-white font-black text-xs sm:text-sm px-3.5 py-2 rounded-2xl transition-all shadow-sm border border-white/20 active:scale-95 cursor-pointer"
          >
            <BarChart3 className="w-4 h-4 text-amber-300" />
            <span>የቀኑ ማጠቃለያ</span>
            <span className="bg-white text-[#0B1D2C] px-2 py-0.5 rounded-lg text-xs font-black">
              ብር {shiftStats.totalRev.toLocaleString()}
            </span>
          </button>

          {pendingSyncCount > 0 && (
            <div className="flex items-center gap-1.5 bg-black/25 text-white text-xs font-bold px-3 py-1.5 rounded-full">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>{pendingSyncCount}</span>
            </div>
          )}
          {!isOnline && (
            <div className="flex items-center gap-1 bg-black/25 text-white text-xs font-bold px-3 py-1.5 rounded-full">
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1" style={{ height: 'calc(100vh - 56px)', overflow: 'hidden' }}>
        
        {/* LEFT: Menu & Customer Info */}
        <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* Customer Name Input */}
          <div className="bg-white border-b border-black/10 px-4 py-3">
            <label className="text-xs font-bold text-black/40 uppercase tracking-widest mb-1 block">
              የደንበኛ ስም (አማራጭ)
            </label>
            <input 
              value={customerName} 
              onChange={e => setCustomerName(e.target.value)}
              placeholder="የደንበኛ ስም እዚህ ያስገቡ..."
              className="w-full border-2 border-black/15 rounded-xl px-3.5 py-2.5 text-sm text-[#0B1D2C] outline-none focus:border-[#0B1D2C] bg-[#f7f5f0] placeholder:text-black/30 font-bold transition-colors" 
            />
          </div>

          {/* Category Tabs */}
          <div className="flex bg-white border-b border-black/10">
            {(['juice', 'food'] as const).map(cat => (
              <button 
                key={cat} 
                onClick={() => setCategory(cat)}
                className={`flex-1 py-3.5 text-base font-black tracking-wide transition-all border-b-3 cursor-pointer ${
                  category === cat
                    ? 'border-b-3 border-[#0B1D2C] text-[#0B1D2C] bg-[#0B1D2C]/5'
                    : 'border-b-3 border-transparent text-black/35 hover:text-black/70'
                }`}
              >
                {cat === 'juice' ? '🥤 ጭማቂ (Juice)' : '🍽️ ምግብ (Food)'}
              </button>
            ))}
          </div>

          {/* Menu Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {menuItems.map(item => {
                const inCart = cart.find(c => c.menuItemId === item.id);
                return (
                  <button 
                    key={item.id} 
                    onClick={() => addToCart(item)}
                    className={`relative rounded-3xl p-4 text-left transition-all active:scale-95 shadow-sm border-2 flex flex-col justify-between min-h-[115px] cursor-pointer ${
                      inCart 
                        ? 'bg-[#0B1D2C] border-[#0B1D2C] text-white shadow-lg' 
                        : 'bg-white border-black/10 text-[#0B1D2C] hover:border-black/30 hover:shadow-md'
                    }`}
                  >
                    <div className="text-3xl mb-1">{category === 'juice' ? '🥤' : '🍽️'}</div>
                    <div>
                      <div className={`font-black text-xs sm:text-sm leading-tight line-clamp-2 ${inCart ? 'text-white' : 'text-[#0B1D2C]'}`}>
                        {item.name}
                      </div>
                      <div className={`text-sm font-black mt-1 ${inCart ? 'text-[#f7f5f0]' : 'text-[#0B1D2C]'}`}>
                        ብር {item.price.toLocaleString()}
                      </div>
                    </div>

                    {inCart && (
                      <div className="absolute top-2.5 right-2.5 bg-emerald-400 text-[#0B1D2C] text-xs font-black rounded-full w-6 h-6 flex items-center justify-center shadow-md">
                        {inCart.quantity}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: Cart & Payment */}
        <div className="w-80 sm:w-96 bg-white border-l border-black/10 flex flex-col shadow-2xl">
          
          {/* Cart Header */}
          <div className="px-4 py-3.5 border-b border-black/10 flex items-center justify-between bg-[#f7f5f0]">
            <div className="flex items-center gap-2 font-black text-[#0B1D2C] text-base">
              <ShoppingCart className="w-5 h-5" />
              <span>ቅርጫት (Cart)</span>
              {cartCount > 0 && (
                <span className="bg-[#0B1D2C] text-white text-xs font-black px-2.5 py-0.5 rounded-full">
                  {cartCount}
                </span>
              )}
            </div>
            {cart.length > 0 && (
              <button 
                onClick={() => setCart([])} 
                className="text-black/30 hover:text-red-500 transition-colors p-1.5 cursor-pointer"
                title="ቅርጫት አጽዳ"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-black/25 gap-2.5 py-10">
                <ShoppingCart className="w-12 h-12" strokeWidth={1} />
                <p className="text-sm font-bold text-black/40">ቅርጫቱ ባዶ ነው</p>
                <p className="text-xs">ከግራ በኩል እቃዎችን ይምረጡ</p>
              </div>
            ) : (
              <div className="divide-y divide-black/5">
                {cart.map(item => (
                  <div key={item.menuItemId} className="px-4 py-3 flex items-center gap-2.5">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs sm:text-sm text-[#0B1D2C] truncate">{item.name}</div>
                      <div className="text-xs text-black/40 font-semibold">ብር {item.unitPrice} × {item.quantity}</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button 
                        onClick={() => changeQty(item.menuItemId, -1)}
                        className="w-7 h-7 rounded-full bg-[#f7f5f0] flex items-center justify-center hover:bg-red-100 hover:text-red-600 text-[#0B1D2C] transition-colors cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-sm font-black text-[#0B1D2C] w-5 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => changeQty(item.menuItemId, 1)}
                        className="w-7 h-7 rounded-full bg-[#f7f5f0] flex items-center justify-center hover:bg-emerald-100 hover:text-emerald-600 text-[#0B1D2C] transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="text-xs sm:text-sm font-black text-[#0B1D2C] w-16 text-right shrink-0">
                      ብር {item.totalPrice.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="px-4 py-2.5 border-t border-black/10 bg-white">
            <label className="text-xs font-bold text-black/35 uppercase tracking-widest mb-1 block">ልዩ ማስታወሻ (Notes)</label>
            <textarea 
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
              rows={2}
              placeholder="አለርጂ፣ ተጨማሪ ትዕዛዝ..."
              className="w-full text-xs border border-black/15 rounded-xl px-2.5 py-1.5 resize-none outline-none focus:border-[#0B1D2C] text-[#0B1D2C] placeholder:text-black/25 bg-[#f7f5f0] font-medium" 
            />
          </div>

          {/* Payment Method Selector */}
          <div className="px-4 py-3 border-t border-black/10 bg-white">
            <label className="text-xs font-bold text-black/40 uppercase tracking-widest mb-2 block">የክፍያ ዘዴ (Payment)</label>
            <div className="flex gap-2">
              {(['cash', 'transfer'] as const).map(pm => (
                <button 
                  key={pm} 
                  onClick={() => setPaymentMethod(pm)}
                  className={`flex-1 py-3 rounded-2xl text-sm font-black transition-all border-2 cursor-pointer ${
                    paymentMethod === pm 
                      ? 'bg-[#0B1D2C] text-white border-[#0B1D2C] shadow-md' 
                      : 'bg-[#f7f5f0] text-[#0B1D2C]/60 border-black/10 hover:border-black/30'
                  }`}
                >
                  {pm === 'cash' ? '💵 ጥሬ ገንዘብ' : '📲 ዝውውር (Transfer)'}
                </button>
              ))}
            </div>

            {/* Transfer Amount & Tip Calculator */}
            {paymentMethod === 'transfer' && (
              <div className="mt-3 bg-indigo-50/80 rounded-2xl p-3.5 border-2 border-indigo-200 space-y-2">
                <label className="text-xs font-black text-indigo-900 block">የተላከ ገንዘብ በዝውውር (Transfer Amount)</label>
                <div className="flex items-center gap-2 bg-white border-2 border-indigo-300 rounded-xl px-3.5 py-2 focus-within:border-indigo-600 transition-colors shadow-inner">
                  <span className="text-indigo-600 font-black text-sm">ብር</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={transferAmount}
                    onChange={e => setTransferAmount(e.target.value)}
                    placeholder={cartTotal > 0 ? cartTotal.toString() : '0'}
                    className="flex-1 bg-transparent text-[#0B1D2C] font-black text-lg outline-none placeholder:text-black/25" 
                  />
                </div>

                {transferAmt > 0 && (
                  <div className="flex justify-between items-center text-xs font-bold pt-1">
                    <span className="text-indigo-700">የትዕዛዝ ጠቅላላ ዋጋ:</span>
                    <span className="text-[#0B1D2C]">ብር {cartTotal.toLocaleString()}</span>
                  </div>
                )}

                {tip > 0 && (
                  <div className="bg-emerald-100 border border-emerald-300 rounded-xl p-2.5 flex justify-between items-center shadow-xs">
                    <span className="text-emerald-800 font-black text-xs">✨ ተጨማሪ ጠቃሚ (Tip):</span>
                    <span className="text-emerald-800 font-black text-base">+ ብር {tip.toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cart Total & Submit Button */}
          <div className="px-4 pt-3 pb-5 border-t border-black/10 bg-[#f7f5f0]">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-[#0B1D2C]/60 text-sm">ጠቅላላ ዋጋ (Total)</span>
              <span className="text-2xl font-black text-[#0B1D2C]">ብር {cartTotal.toLocaleString()}</span>
            </div>

            <button 
              onClick={handleSubmitCustomerOrder} 
              disabled={cart.length === 0 || isSubmitting}
              className={`w-full py-4 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl cursor-pointer ${
                cart.length === 0 
                  ? 'bg-black/15 text-black/30 cursor-not-allowed' 
                  : 'bg-[#0B1D2C] text-white hover:bg-[#162E44] shadow-[#0B1D2C]/30'
              }`}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>ትዕዛዝ ላክ (Submit Order)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ─── 4. FULL SHIFT END-OF-DAY SUMMARY MODAL ───────────────────────── */}
      <AnimatePresence>
        {showSummaryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 select-none overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              className="bg-[#f7f5f0] w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl border-2 border-white/20 flex flex-col overflow-hidden text-[#0B1D2C]"
            >
              {/* Modal Header */}
              <div className={`${selectedShift!.color} text-white px-6 py-5 flex items-center justify-between shadow-md shrink-0`}>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-black/20 rounded-2xl">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black">
                      {selectedShift!.amharic} • የቀኑ ማጠቃለያ
                    </h2>
                    <p className="text-white/70 text-xs sm:text-sm font-semibold">
                      End-of-Shift Sales & Money Summary (ቀን: {todayStr})
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowSummaryModal(false)}
                  className="w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
                
                {/* 6 Key Financial Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  
                  {/* Total Money */}
                  <div className="bg-[#0B1D2C] text-white rounded-2xl p-4 shadow-md flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-white/70">ጠቅላላ ገቢ</span>
                      <Banknote className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-emerald-300">
                      ብር {shiftStats.totalRev.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-white/50 mt-1 font-semibold">Total Revenue</div>
                  </div>

                  {/* Cash */}
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#0B1D2C]/10 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-[#0B1D2C]/60">ጥሬ ገንዘብ</span>
                      <span className="text-base">💵</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-[#0B1D2C]">
                      ብር {shiftStats.cashTotal.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-[#0B1D2C]/40 mt-1 font-semibold">Physical Cash</div>
                  </div>

                  {/* Transfer */}
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#0B1D2C]/10 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-[#0B1D2C]/60">ዝውውር</span>
                      <Smartphone className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-indigo-700">
                      ብር {shiftStats.transferTotal.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-[#0B1D2C]/40 mt-1 font-semibold">Telebirr / CBE</div>
                  </div>

                  {/* Tip */}
                  <div className="bg-emerald-50 rounded-2xl p-4 shadow-sm border border-emerald-300 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-emerald-800">ጠቃሚ (Tips)</span>
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-emerald-800">
                      ብር {shiftStats.tipTotal.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-emerald-600 mt-1 font-semibold">Tips Collected</div>
                  </div>

                  {/* Juice Count */}
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#0B1D2C]/10 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-[#0B1D2C]/60">ጭማቂ</span>
                      <span className="text-base">🥤</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-[#0B1D2C]">
                      {shiftStats.juiceCount}
                    </div>
                    <div className="text-[10px] text-[#0B1D2C]/40 mt-1 font-semibold">Juice Cups</div>
                  </div>

                  {/* Food Count */}
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#0B1D2C]/10 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-[#0B1D2C]/60">ምግብ</span>
                      <span className="text-base">🍽️</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-[#0B1D2C]">
                      {shiftStats.foodCount}
                    </div>
                    <div className="text-[10px] text-[#0B1D2C]/40 mt-1 font-semibold">Food Portions</div>
                  </div>
                </div>

                {/* Section 1: Itemized Sales Breakdown Table */}
                <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-[#0B1D2C]/10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-[#0B1D2C]" />
                      <h3 className="text-lg font-black text-[#0B1D2C]">የምግቦች እና ጭማቂዎች ዝርዝር ድምር</h3>
                    </div>
                    <span className="text-xs font-bold bg-[#f7f5f0] text-[#0B1D2C] px-3 py-1 rounded-full">
                      {shiftStats.itemBreakdown.length} ዓይነቶች ተሽጠዋል
                    </span>
                  </div>

                  {shiftStats.itemBreakdown.length === 0 ? (
                    <p className="text-center py-6 text-sm text-[#0B1D2C]/40 font-semibold">
                      በዚህ ሸፍት እስካሁን ምንም ትዕዛዝ አልተመዘገበም (No items sold yet)
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-[#0B1D2C]/10 text-xs text-[#0B1D2C]/50 uppercase font-black">
                            <th className="pb-3 pl-2">እቃ / ምግብ</th>
                            <th className="pb-3 text-center">ዓይነት</th>
                            <th className="pb-3 text-center">ብዛት</th>
                            <th className="pb-3 text-right">ነጠላ ዋጋ</th>
                            <th className="pb-3 text-right pr-2">ጠቅላላ ዋጋ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#0B1D2C]/5">
                          {shiftStats.itemBreakdown.map((item, idx) => (
                            <tr key={idx} className="hover:bg-[#f7f5f0]/80 transition-colors">
                              <td className="py-3 pl-2 font-black text-[#0B1D2C] flex items-center gap-2">
                                <span>{item.category === 'juice' ? '🥤' : '🍽️'}</span>
                                <span>{item.name}</span>
                              </td>
                              <td className="py-3 text-center text-xs font-bold text-[#0B1D2C]/60">
                                {item.category === 'juice' ? 'ጭማቂ' : 'ምግብ'}
                              </td>
                              <td className="py-3 text-center">
                                <span className="inline-block bg-[#0B1D2C] text-white text-xs font-black px-2.5 py-0.5 rounded-full">
                                  {item.quantity}
                                </span>
                              </td>
                              <td className="py-3 text-right text-xs font-bold text-[#0B1D2C]/60">
                                ብር {item.unitPrice.toLocaleString()}
                              </td>
                              <td className="py-3 text-right pr-2 font-black text-[#0B1D2C]">
                                ብር {item.totalRevenue.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-[#0B1D2C] font-black text-base">
                            <td className="pt-4 pl-2">ጠቅላላ ድምር (Total)</td>
                            <td className="pt-4 text-center"></td>
                            <td className="pt-4 text-center text-[#0B1D2C]">
                              {shiftStats.juiceCount + shiftStats.foodCount} ዕቃዎች
                            </td>
                            <td className="pt-4 text-right"></td>
                            <td className="pt-4 text-right pr-2 text-emerald-700 text-lg">
                              ብር {shiftStats.totalRev.toLocaleString()}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>

                {/* Section 2: Full Log of All Orders Submitted Today */}
                <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-[#0B1D2C]/10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-[#0B1D2C]" />
                      <h3 className="text-lg font-black text-[#0B1D2C]">የሁሉም ትዕዛዞች ታሪክ ({shiftOrders.length} ትዕዛዞች)</h3>
                    </div>
                  </div>

                  {shiftOrders.length === 0 ? (
                    <p className="text-center py-6 text-sm text-[#0B1D2C]/40 font-semibold">
                      ምንም ትዕዛዝ አልተገኘም
                    </p>
                  ) : (
                    <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                      {shiftOrders.map((ord, i) => (
                        <div 
                          key={ord.id}
                          className="bg-[#f7f5f0] p-4 rounded-2xl border border-[#0B1D2C]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black bg-[#0B1D2C] text-white px-2 py-0.5 rounded-md">
                                #{shiftOrders.length - i}
                              </span>
                              <span className="font-black text-sm text-[#0B1D2C]">
                                {ord.customerName ? ord.customerName : 'የቀጥታ ደንበኛ'}
                              </span>
                              <span className="text-xs text-[#0B1D2C]/40 font-semibold">
                                ({formatEthiopianTime(ord.orderTime)})
                              </span>
                            </div>
                            
                            <div className="text-xs font-medium text-[#0B1D2C]/70 mt-1 flex flex-wrap gap-1">
                              {(ord.items || []).map((it, idx) => (
                                <span key={idx} className="bg-white px-2 py-0.5 rounded-md border border-[#0B1D2C]/10 font-bold">
                                  {it.name} × {it.quantity}
                                </span>
                              ))}
                            </div>

                            {ord.notes && (
                              <div className="text-[11px] text-indigo-700 font-semibold mt-1">
                                💬 {ord.notes}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#0B1D2C]/10">
                            <span className={`text-xs font-black px-2.5 py-1 rounded-xl ${
                              ord.paymentMethod === 'cash' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-indigo-100 text-indigo-800'
                            }`}>
                              {ord.paymentMethod === 'cash' ? '💵 ጥሬ ገንዘብ' : '📲 ዝውውር'}
                            </span>
                            <div className="text-base font-black text-[#0B1D2C]">
                              ብር {ord.totalAmount.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Modal Footer with Done & PIN Verification Trigger */}
              <div className="p-4 bg-white border-t border-[#0B1D2C]/10 flex items-center justify-between shrink-0 gap-3">
                <button
                  onClick={refreshAllData}
                  className="flex items-center gap-1.5 text-xs font-black bg-[#f7f5f0] text-[#0B1D2C] hover:bg-[#0B1D2C] hover:text-white px-4 py-3 rounded-2xl border border-[#0B1D2C]/20 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>መረጃ አድስ (Refresh)</span>
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setShowSummaryModal(false)}
                    className="px-5 py-3 rounded-2xl bg-[#f7f5f0] hover:bg-stone-200 text-[#0B1D2C] font-black text-sm border border-[#0B1D2C]/15 transition-all cursor-pointer"
                  >
                    ተመለስ (Back)
                  </button>

                  <button
                    onClick={() => {
                      setEnteredPin('');
                      setPinError(false);
                      setShowPinModal(true);
                    }}
                    className="px-6 py-3 rounded-2xl bg-[#0B1D2C] hover:bg-[#162E44] text-white font-black text-sm shadow-xl transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Lock className="w-4 h-4 text-amber-300" />
                    <span>ዝጋ (Done & Close Shift)</span>
                  </button>
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── 5. PIN VERIFICATION MODAL FOR DONE ACTION ───────────────────── */}
      <AnimatePresence>
        {showPinModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-60 flex items-center justify-center p-4 select-none"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-sm rounded-3xl p-6 sm:p-7 shadow-2xl border border-black/10 flex flex-col items-center text-center text-[#0B1D2C] relative"
            >
              <button
                onClick={() => {
                  setShowPinModal(false);
                  setEnteredPin('');
                  setPinError(false);
                }}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-[#f7f5f0] text-black/40 hover:text-black transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Lock Icon */}
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-md transition-colors ${
                selectedShift?.id === 'day' ? 'bg-amber-500 text-white' : 'bg-indigo-600 text-white'
              }`}>
                <Lock className="w-7 h-7" />
              </div>

              <h3 className="text-xl font-black text-[#0B1D2C]">
                {selectedShift?.amharic} የይለፍ ቃል (PIN)
              </h3>
              <p className="text-xs text-[#0B1D2C]/60 font-semibold mt-1">
                ሸፍቱን ለመዝጋት የ4-ዲጂት ፒን ያስገቡ (Enter PIN to complete)
              </p>

              {/* PIN Indicator Dots */}
              <div className="flex gap-4 my-6">
                {[0, 1, 2, 3].map(i => {
                  const isFilled = i < enteredPin.length;
                  return (
                    <motion.div
                      key={i}
                      animate={pinError ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
                      transition={{ duration: 0.4 }}
                      className={`w-4 h-4 rounded-full border-2 transition-all ${
                        pinError
                          ? 'border-red-500 bg-red-500'
                          : isFilled
                          ? 'border-[#0B1D2C] bg-[#0B1D2C] scale-110'
                          : 'border-[#0B1D2C]/30 bg-transparent'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Error or Success feedback */}
              <div className="h-5 mb-2">
                {pinError && (
                  <p className="text-red-500 text-xs font-black animate-pulse">
                    የተሳሳተ ፒን! እባክዎ እንደገና ይሞክሩ (Incorrect PIN)
                  </p>
                )}
                {pinSuccessAnim && (
                  <p className="text-emerald-600 text-xs font-black animate-bounce">
                    ✅ ፒን ትክክል ነው! ሸፍቱ ተዘግቷል
                  </p>
                )}
              </div>

              {/* Numeric Keypad */}
              <div className="grid grid-cols-3 gap-2.5 w-full max-w-[260px]">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(key => (
                  <button
                    key={key}
                    onClick={() => handleKeypadPress(key)}
                    className="h-14 rounded-2xl bg-[#f7f5f0] hover:bg-[#0B1D2C] hover:text-white text-[#0B1D2C] text-xl font-black transition-all active:scale-90 flex items-center justify-center shadow-xs border border-[#0B1D2C]/10 cursor-pointer"
                  >
                    {key}
                  </button>
                ))}

                <button
                  onClick={handleKeypadClear}
                  className="h-14 rounded-2xl bg-[#f7f5f0] hover:bg-stone-200 text-[#0B1D2C]/60 text-xs font-black transition-all active:scale-90 flex items-center justify-center border border-[#0B1D2C]/10 cursor-pointer"
                >
                  Clear
                </button>

                <button
                  onClick={() => handleKeypadPress('0')}
                  className="h-14 rounded-2xl bg-[#f7f5f0] hover:bg-[#0B1D2C] hover:text-white text-[#0B1D2C] text-xl font-black transition-all active:scale-90 flex items-center justify-center shadow-xs border border-[#0B1D2C]/10 cursor-pointer"
                >
                  0
                </button>

                <button
                  onClick={handleKeypadDelete}
                  className="h-14 rounded-2xl bg-[#f7f5f0] hover:bg-red-50 hover:text-red-600 text-[#0B1D2C]/70 transition-all active:scale-90 flex items-center justify-center border border-[#0B1D2C]/10 cursor-pointer"
                  title="Backspace"
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
