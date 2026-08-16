import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from './lib/supabaseClient';
import { 
  FoodMenuItem, TabletOrder, TabletOrderItem, TabletPaymentMethod, 
  RestaurantSystemConfig, KitchenOrder, KitchenTaker,
  PendingPaymentItem, DailyExpenseItem, ShiftRecord, InventoryItemState
} from './types';
import { DEFAULT_RESTAURANT_CONFIG, DEFAULT_FOOD_MENU } from './data/initialData';
import { getOperationalDate, getAutoShiftType, formatEthiopianTime, buildShiftLedgerEntries } from './utils/shiftUtils';
import { safeLocalStorage } from './utils/safeStorage';
import { 
  ShoppingCart, CheckCircle, Trash2, Plus, Minus, Send, RefreshCw, 
  WifiOff, Sun, Moon, ChefHat, ArrowLeft, Clock, Check, Bike, 
  Layers, UtensilsCrossed, BarChart3, X, Receipt, Banknote, 
  Smartphone, Sparkles, ChevronDown, ChevronUp, Eye, Lock, Delete, Archive,
  AlertCircle, AlertTriangle, Truck, Package, DollarSign, TrendingDown, TrendingUp, Calendar, Tag, ShieldCheck
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

const COMMON_EXPENSES = [
  { title: 'አቮካዶ (Avocado)', category: 'fruits_juice' as const },
  { title: 'ማንጎ (Mango)', category: 'fruits_juice' as const },
  { title: 'ስኳር (Sugar)', category: 'cooking_ingredients' as const },
  { title: 'ሎሚ (Lemon)', category: 'fruits_juice' as const },
  { title: 'ወተት (Milk)', category: 'cooking_ingredients' as const },
  { title: 'የገበያ አትክልት (Vegetables)', category: 'cooking_ingredients' as const },
  { title: 'የማጠቢያ ሳሙና (Soap/Cleaning)', category: 'other_expense' as const },
  { title: 'ጋዝ መሙላት (Gas/Utility)', category: 'utilities_gas' as const },
];

export default function TabletApp() {
  const [config, setConfig] = useState<RestaurantSystemConfig>(DEFAULT_RESTAURANT_CONFIG);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // Main mode: null = Pick Mode (Day / Night / Kitchen)
  const [shift, setShift] = useState<TabletShift | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summarySubTab, setSummarySubTab] = useState<'active' | 'closed'>('active');

  // ─── Shift Reconciliation Multi-Step Tabs ─────────────────────────────────
  const [reconcileTab, setReconcileTab] = useState<'sales' | 'inventory' | 'expenses' | 'recover_pending' | 'net_cash'>('sales');
  
  // Database-backed historical records
  const [unpaidPendingList, setUnpaidPendingList] = useState<PendingPaymentItem[]>([]);
  const [lastClosedShift, setLastClosedShift] = useState<any | null>(null);

  // Cups & Containers Inventory Counts
  const [juiceOpening, setJuiceOpening] = useState<number>(120);
  const [juiceAdded, setJuiceAdded] = useState<number>(0);
  const [juiceLeftover, setJuiceLeftover] = useState<number>(120);

  const [foodOpening, setFoodOpening] = useState<number>(85);
  const [foodAdded, setFoodAdded] = useState<number>(0);
  const [foodLeftover, setFoodLeftover] = useState<number>(85);

  // Shift Expenses
  const [expenseItems, setExpenseItems] = useState<DailyExpenseItem[]>([]);
  const [newExpTitle, setNewExpTitle] = useState('');
  const [newExpAmount, setNewExpAmount] = useState('');
  const [newExpCategory, setNewExpCategory] = useState<DailyExpenseItem['category']>('fruits_juice');

  // Recovered Pending Debts (Cash collected today from past customers)
  const [selectedRecoveredIds, setSelectedRecoveredIds] = useState<string[]>([]);
  const [customRecoveredAmount, setCustomRecoveredAmount] = useState<string>('');

  // Shift closing notes
  const [shiftNotes, setShiftNotes] = useState('');

  // ─── PIN Verification Modal State for Done action ─────────────────────────
  const [showPinModal, setShowPinModal] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [pinSuccessAnim, setPinSuccessAnim] = useState(false);

  // ─── Open Tabs / Unsettled Pay Later Orders Modal ─────────────────────────
  const [showUnsettledModal, setShowUnsettledModal] = useState(false);
  const [settleFeedbackMsg, setSettleFeedbackMsg] = useState<string | null>(null);

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
      const savedPinsStr = safeLocalStorage.getItem('maraki_shift_pins');
      let savedPins: any = {};
      if (savedPinsStr) {
        try { savedPins = JSON.parse(savedPinsStr); } catch {}
      }

      const { data: cfg } = await supabase.from('config').select('*').single();
      if (cfg) {
        setConfig({
          defaultJuiceUnitPrice: cfg.default_juice_unit_price,
          defaultFoodUnitPrice: cfg.default_food_unit_price,
          foodMenu: cfg.food_menu || DEFAULT_FOOD_MENU,
          currencySymbol: cfg.currency_symbol,
          dayShiftWorkerName: cfg.day_shift_worker_name,
          nightShiftWorkerName: cfg.night_shift_worker_name,
          dayShiftPin: cfg.day_shift_pin || savedPins.dayShiftPin || '1111',
          nightShiftPin: cfg.night_shift_pin || savedPins.nightShiftPin || '2222',
          restaurantName: cfg.restaurant_name,
        });
      } else if (savedPins.dayShiftPin || savedPins.nightShiftPin) {
        setConfig(prev => ({
          ...prev,
          dayShiftPin: savedPins.dayShiftPin || '1111',
          nightShiftPin: savedPins.nightShiftPin || '2222',
        }));
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

      // Load unpaid pending payments (for recovery on tablet)
      const { data: ppData } = await supabase
        .from('pending_payments')
        .select('*')
        .eq('is_paid', false)
        .order('date', { ascending: false });

      if (ppData) {
        setUnpaidPendingList(ppData.map((p: any) => ({
          id: p.id,
          shiftType: p.shift_type,
          customerName: p.customer_name,
          description: p.description,
          juiceCupsCount: p.juice_cups_count,
          foodTakeawaysCount: p.food_takeaways_count,
          itemizedBreakdown: p.itemized_breakdown,
          amount: p.amount,
          date: p.date,
          isPaid: p.is_paid,
          paidDate: p.paid_date,
        })));
      }

      // Load most recent closed shift to get opening stock
      const { data: lastShiftData } = await supabase
        .from('shifts')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1);

      if (lastShiftData && lastShiftData.length > 0) {
        const ls = lastShiftData[0];
        setLastClosedShift(ls);
        if (ls.juice_cups?.remaining_count !== undefined) {
          setJuiceOpening(ls.juice_cups.remaining_count);
        }
        if (ls.food_takeaways?.remaining_count !== undefined) {
          setFoodOpening(ls.food_takeaways.remaining_count);
        }
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

  // Guard: Never show unsettled open tab modal if there are 0 unsettled orders
  useEffect(() => {
    if (showUnsettledModal && unsettledPayLaterOrders.length === 0) {
      setShowUnsettledModal(false);
    }
  }, [showUnsettledModal, unsettledPayLaterOrders]);

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
    const opDate = getOperationalDate(now);
    const id = 'to-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    const shiftRecord = SHIFTS.find(s => s.id === shift)!;
    const finalCustName = customerName.trim() || (
      paymentMethod === 'pay_later' 
        ? 'ክፍት ጠረጴዛ (Open Table)' 
        : (paymentMethod === 'pending' ? 'አዳሪ ደንበኛ (Credit Customer)' : (paymentMethod === 'beu' ? 'BeU Delivery' : undefined))
    );
    const order: TabletOrder = {
      id,
      clientOrderId: id,
      staffName: shiftRecord.amharic,
      customerName: finalCustName,
      items: cart,
      totalAmount: cartTotal,
      paymentMethod,
      originalPaymentMethod: paymentMethod,
      shiftType: shift as 'day' | 'night',
      status: 'active',
      notes: notes.trim() ? (tip > 0 ? `${notes.trim()} (Tip: ${tip} Br)` : notes.trim()) : (tip > 0 ? `Tip: ${tip} Br` : undefined),
      orderTime: now.toISOString(),
      date: opDate,
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
      original_payment_method: order.originalPaymentMethod || order.paymentMethod,
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

      // If pending payment (አዳሪ), also insert into pending_payments table for system ledger
      if (paymentMethod === 'pending') {
        try {
          const ppPayload = {
            id: 'pp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
            shift_type: shift,
            customer_name: finalCustName || 'አዳሪ ደንበኛ',
            description: cart.map(i => `${i.name} ×${i.quantity}`).join(', '),
            juice_cups_count: cart.filter(i => i.category === 'juice').reduce((s, i) => s + i.quantity, 0),
            food_takeaways_count: cart.filter(i => i.category !== 'juice').reduce((s, i) => s + i.quantity, 0),
            itemized_breakdown: cart.reduce((acc, i) => ({ ...acc, [i.name]: i.quantity }), {}),
            amount: cartTotal,
            date: opDate,
            is_paid: false,
          };
          await supabase.from('pending_payments').insert(ppPayload);
        } catch (err) {
          console.error('Failed to log pending payment to Supabase:', err);
        }
      }

      // If BeU delivery order, also insert into delivery_records table
      if (paymentMethod === 'beu') {
        try {
          const delPayload = {
            id: 'del-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
            delivery_rider_name: 'BeU Delivery',
            description: cart.map(i => `${i.name} ×${i.quantity}`).join(', '),
            juice_cups_count: cart.filter(i => i.category === 'juice').reduce((s, i) => s + i.quantity, 0),
            food_takeaways_count: cart.filter(i => i.category !== 'juice').reduce((s, i) => s + i.quantity, 0),
            amount: cartTotal,
            date: opDate,
            shift_type: shift,
            is_settled_weekly: false,
          };
          await supabase.from('delivery_records').insert(delPayload);
        } catch (err) {
          console.error('Failed to log delivery record to Supabase:', err);
        }
      }
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

  // ─── Pay Later / Open Tab Settlement Handlers ──────────────────────────────
  const handleOpenReconcileModal = (targetShift?: 'day' | 'night') => {
    const chosenShift = targetShift || shift;
    if (!chosenShift || chosenShift === 'kitchen') return;
    if (targetShift && targetShift !== shift) {
      setShift(targetShift);
    }

    // Check if there are any unsettled pay_later orders for this shift
    const openOrders = todayTabletOrders.filter(
      o => o.shiftType === chosenShift && o.status === 'active' && o.paymentMethod === 'pay_later'
    );

    if (openOrders.length > 0) {
      // BLOCK and display the alert / open tab resolution modal FIRST before the form opens!
      setShowUnsettledModal(true);
      setSettleFeedbackMsg(`⛔ ሸፍቱን ከመዝጋትዎ በፊት ያልተጠናቀቁ ${openOrders.length} ክፍት ትዕዛዞችን ማስተካከል አለብዎት!`);
      return;
    }

    // If all tabs are resolved, proceed straight to the 5-step reconciliation form
    setShowSummaryModal(true);
  };

  const handleSettlePayLaterOrder = async (order: TabletOrder, newMethod: 'cash' | 'transfer' | 'pending') => {
    // 1. Optimistic update in UI
    setTodayTabletOrders(prev =>
      prev.map(o => o.id === order.id ? { ...o, paymentMethod: newMethod } : o)
    );

    const methodLabels: Record<string, string> = {
      cash: '💵 በጥሬ ገንዘብ ተከፈለ',
      transfer: '📲 በዝውውር ተከፈለ',
      pending: '⏳ ወደ አዳሪ (ዕዳ) ተቀየረ',
    };
    setSettleFeedbackMsg(`${order.customerName || 'ትዕዛዙ'} ${methodLabels[newMethod]}`);
    setTimeout(() => setSettleFeedbackMsg(null), 2500);

    // 2. Update in Supabase
    try {
      await supabase
        .from('tablet_orders')
        .update({ payment_method: newMethod })
        .eq('id', order.id);

      // If converted to pending/Adari, also insert into pending_payments table
      if (newMethod === 'pending') {
        const ppPayload = {
          id: 'pp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
          shift_type: order.shiftType,
          customer_name: order.customerName || 'አዳሪ ደንበኛ',
          description: (order.items || []).map(i => `${i.name} ×${i.quantity}`).join(', '),
          juice_cups_count: (order.items || []).filter(i => i.category === 'juice').reduce((s, i) => s + i.quantity, 0),
          food_takeaways_count: (order.items || []).filter(i => i.category !== 'juice').reduce((s, i) => s + i.quantity, 0),
          itemized_breakdown: (order.items || []).reduce((acc, i) => ({ ...acc, [i.name]: i.quantity }), {}),
          amount: order.totalAmount,
          date: order.date,
          is_paid: false,
        };
        await supabase.from('pending_payments').insert(ppPayload);
        refreshAllData();
      }
    } catch (err) {
      console.error('Failed to update settled order in Supabase:', err);
    }
  };

  const handleVoidPayLaterOrder = async (orderId: string) => {
    setTodayTabletOrders(prev => prev.filter(o => o.id !== orderId));
    try {
      await supabase.from('tablet_orders').update({ status: 'voided' }).eq('id', orderId);
    } catch (err) {
      console.error('Failed to void order in Supabase:', err);
    }
  };

  // ─── Shift End-of-Day Financial Calculations ───────────────────────────────
  // ALL non-voided orders for current shift (active + closed)
  const shiftOrders = useMemo(() => {
    if (!shift || shift === 'kitchen') return [];
    return todayTabletOrders.filter(o => o.shiftType === shift && o.status !== 'voided');
  }, [todayTabletOrders, shift]);

  // Only active orders (not yet closed) for current shift
  const shiftActiveOrders = useMemo(() => {
    if (!shift || shift === 'kitchen') return [];
    return todayTabletOrders.filter(o => o.shiftType === shift && o.status === 'active');
  }, [todayTabletOrders, shift]);

  // Unsettled Pay Later Orders (still waiting for payment during this shift)
  const unsettledPayLaterOrders = useMemo(() => {
    return shiftActiveOrders.filter(o => o.paymentMethod === 'pay_later');
  }, [shiftActiveOrders]);

  // All Pay Later Orders created during this shift (unsettled + settled)
  const shiftPayLaterOrders = useMemo(() => {
    return shiftActiveOrders.filter(
      o => o.paymentMethod === 'pay_later' || o.originalPaymentMethod === 'pay_later'
    );
  }, [shiftActiveOrders]);

  // Closed past orders for current shift (history)
  const shiftClosedOrders = useMemo(() => {
    if (!shift || shift === 'kitchen') return [];
    return todayTabletOrders.filter(o => o.shiftType === shift && o.status === 'closed');
  }, [todayTabletOrders, shift]);

  // Summary tab toggles between active and closed orders
  const displayedOrdersForSummary = summarySubTab === 'active' ? shiftActiveOrders : shiftClosedOrders;

  // Stats always computed from ALL non-voided orders regardless of sub-tab
  const shiftStats = useMemo(() => {
    const targetOrders = shiftOrders; // ALL non-voided orders for this shift
    const totalRev = targetOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const cashTotal = targetOrders.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + o.totalAmount, 0);
    const transferTotal = targetOrders.filter(o => o.paymentMethod === 'transfer').reduce((sum, o) => sum + o.totalAmount, 0);
    const pendingTotal = targetOrders.filter(o => o.paymentMethod === 'pending').reduce((sum, o) => sum + o.totalAmount, 0);
    const beuTotal = targetOrders.filter(o => o.paymentMethod === 'beu').reduce((sum, o) => sum + o.totalAmount, 0);
    const payLaterTotal = targetOrders.filter(o => o.paymentMethod === 'pay_later').reduce((sum, o) => sum + o.totalAmount, 0);
    
    let tipTotal = 0;
    let juiceCount = 0;
    let foodCount = 0;
    const itemMap: Record<string, { name: string; category: string; quantity: number; totalRevenue: number; unitPrice: number }> = {};

    targetOrders.forEach(o => {
      if (o.notes) {
        const match = o.notes.match(/Tip:\s*(\d+(\.\d+)?)/i);
        if (match) tipTotal += parseFloat(match[1]);
      }
      (o.items || []).forEach(it => {
        if (it.category === 'juice') juiceCount += it.quantity;
        else foodCount += it.quantity;
        const key = it.menuItemId || it.name;
        if (!itemMap[key]) {
          itemMap[key] = { name: it.name, category: it.category, quantity: 0, totalRevenue: 0, unitPrice: it.unitPrice };
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
      pendingTotal, 
      beuTotal, 
      payLaterTotal,
      tipTotal, 
      juiceCount, 
      foodCount, 
      orderCount: targetOrders.length, 
      itemBreakdown 
    };
  }, [shiftOrders]);

  // Daily Expenses Calculation
  const totalDailyExpenses = useMemo(() => {
    return expenseItems.reduce((sum, e) => sum + e.amount, 0);
  }, [expenseItems]);

  // Recovered Pending Payments Calculation
  const totalRecoveredPending = useMemo(() => {
    const fromSelected = unpaidPendingList
      .filter(p => selectedRecoveredIds.includes(p.id))
      .reduce((sum, p) => sum + p.amount, 0);
    const fromCustom = parseFloat(customRecoveredAmount) || 0;
    return fromSelected + fromCustom;
  }, [unpaidPendingList, selectedRecoveredIds, customRecoveredAmount]);

  // Cups & Takeaways Inventory Totals
  const totalJuiceInStock = juiceOpening + juiceAdded;
  const calculatedJuiceSold = Math.max(0, totalJuiceInStock - juiceLeftover);
  const calculatedJuiceRev = calculatedJuiceSold * (config.defaultJuiceUnitPrice || 170);

  const totalFoodInStock = foodOpening + foodAdded;
  const calculatedFoodSold = Math.max(0, totalFoodInStock - foodLeftover);
  const calculatedFoodRev = calculatedFoodSold * (config.defaultFoodUnitPrice || 220);

  // Final Net Cash Handover Due to Owner:
  // Cash Sales + Recovered Pending Cash - Daily Shift Expenses Paid
  const netCashDueToOwner = useMemo(() => {
    return Math.max(0, shiftStats.cashTotal + totalRecoveredPending - totalDailyExpenses);
  }, [shiftStats.cashTotal, totalRecoveredPending, totalDailyExpenses]);

  // General Day / Night stats for Home Cards
  const dayAllOrders = useMemo(() => todayTabletOrders.filter(o => o.shiftType === 'day' && o.status !== 'voided'), [todayTabletOrders]);
  const dayActiveOrders = useMemo(() => dayAllOrders.filter(o => o.status === 'active'), [dayAllOrders]);
  const dayClosedOrders = useMemo(() => dayAllOrders.filter(o => o.status === 'closed'), [dayAllOrders]);
  const dayShiftTotalRev = useMemo(() => dayAllOrders.reduce((s, o) => s + o.totalAmount, 0), [dayAllOrders]);
  const dayClosedTotalRev = useMemo(() => dayClosedOrders.reduce((s, o) => s + o.totalAmount, 0), [dayClosedOrders]);

  const nightAllOrders = useMemo(() => todayTabletOrders.filter(o => o.shiftType === 'night' && o.status !== 'voided'), [todayTabletOrders]);
  const nightActiveOrders = useMemo(() => nightAllOrders.filter(o => o.status === 'active'), [nightAllOrders]);
  const nightClosedOrders = useMemo(() => nightAllOrders.filter(o => o.status === 'closed'), [nightAllOrders]);
  const nightShiftTotalRev = useMemo(() => nightAllOrders.reduce((s, o) => s + o.totalAmount, 0), [nightAllOrders]);
  const nightClosedTotalRev = useMemo(() => nightClosedOrders.reduce((s, o) => s + o.totalAmount, 0), [nightClosedOrders]);

  // ─── Shift Expense Item Management ──────────────────────────────────────────
  const handleAddExpense = (title: string, amountNum: number, cat: DailyExpenseItem['category']) => {
    if (!title.trim() || amountNum <= 0) return;
    const item: DailyExpenseItem = {
      id: 'exp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      title: title.trim(),
      category: cat,
      amount: amountNum,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
    setExpenseItems(prev => [item, ...prev]);
    setNewExpTitle('');
    setNewExpAmount('');
  };

  const handleRemoveExpense = (id: string) => {
    setExpenseItems(prev => prev.filter(e => e.id !== id));
  };

  // Toggle Recovered Pending Item
  const handleToggleRecoveredPending = (id: string) => {
    setSelectedRecoveredIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // ─── PIN Validation & Shift Closing Execution ──────────────────────────────
  const handleAttemptOpenPinModal = () => {
    if (unsettledPayLaterOrders.length > 0) {
      setShowUnsettledModal(true);
      setSettleFeedbackMsg(`⛔ ሸፍቱን መዝጋት አይቻልም! ገና ያልተጠናቀቁ ${unsettledPayLaterOrders.length} ክፍት ትዕዛዞች አሉ።`);
      return;
    }
    setEnteredPin('');
    setPinError(false);
    setShowPinModal(true);
  };

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

  const validateEnteredPin = async (pinToTest: string) => {
    // STRICT REJECTION: Reject and prevent shift close if unresolved open tabs exist
    if (unsettledPayLaterOrders.length > 0) {
      setShowPinModal(false);
      setShowUnsettledModal(true);
      setSettleFeedbackMsg(`⛔ ሸፍቱን መዝጋት አይቻልም! ገና ያልተጠናቀቁ ${unsettledPayLaterOrders.length} ክፍት ትዕዛዞች አሉ።`);
      return;
    }

    const savedPinsStr = safeLocalStorage.getItem('maraki_shift_pins');
    let savedPins: any = {};
    if (savedPinsStr) {
      try { savedPins = JSON.parse(savedPinsStr); } catch {}
    }

    const configuredPin = shift === 'day' 
      ? (savedPins.dayShiftPin || config.dayShiftPin || '1111') 
      : (savedPins.nightShiftPin || config.nightShiftPin || '2222');

    const validPins = [
      configuredPin,
      '2026' // Master admin emergency override
    ].filter(Boolean);

    if (validPins.includes(pinToTest)) {
      setPinSuccessAnim(true);

      const activeIds = shiftActiveOrders.map(o => o.id);
      const now = new Date();
      const opDate = getOperationalDate(now);
      const shiftId = 'shift-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
      const workerName = shift === 'day' ? config.dayShiftWorkerName : config.nightShiftWorkerName;

      // Construct Full ShiftRecord for main system
      const newShiftRecord: ShiftRecord = {
        id: shiftId,
        date: opDate,
        shiftType: shift as 'day' | 'night',
        workerName,
        juiceCups: {
          openingCount: Number(juiceOpening) || 0,
          addedCount: Number(juiceAdded) || 0,
          remainingCount: Number(juiceLeftover) || 0,
          unitPrice: config.defaultJuiceUnitPrice || 170,
        },
        foodTakeaways: {
          openingCount: Number(foodOpening) || 0,
          addedCount: Number(foodAdded) || 0,
          remainingCount: Number(foodLeftover) || 0,
          unitPrice: config.defaultFoodUnitPrice || 220,
        },
        juiceCupsSold: Math.max(calculatedJuiceSold, shiftStats.juiceCount),
        juiceRevenue: Math.max(calculatedJuiceRev, shiftStats.juiceCount * (config.defaultJuiceUnitPrice || 170)),
        foodTakeawaysSold: Math.max(calculatedFoodSold, shiftStats.foodCount),
        foodRevenue: Math.max(calculatedFoodRev, shiftStats.foodCount * (config.defaultFoodUnitPrice || 220)),
        grossIncome: shiftStats.totalRev,
        digitalTransfers: shiftStats.transferTotal,
        dailyExpenses: totalDailyExpenses,
        expenseItems,
        newPendingPaymentsAmount: shiftStats.pendingTotal,
        recoveredPendingAmount: totalRecoveredPending,
        deliveryCreditAmount: shiftStats.beuTotal,
        netCashDueToOwner,
        notes: shiftNotes.trim() || undefined,
        isClosed: true,
        timestamp: Date.now(),
      };

      try {
        // 1. Insert complete ShiftRecord into shifts table
        await supabase.from('shifts').insert({
          id: newShiftRecord.id,
          date: newShiftRecord.date,
          shift_type: newShiftRecord.shiftType,
          worker_name: newShiftRecord.workerName,
          juice_cups: newShiftRecord.juiceCups,
          food_takeaways: newShiftRecord.foodTakeaways,
          juice_cups_sold: newShiftRecord.juiceCupsSold,
          juice_revenue: newShiftRecord.juiceRevenue,
          food_takeaways_sold: newShiftRecord.foodTakeawaysSold,
          food_revenue: newShiftRecord.foodRevenue,
          gross_income: newShiftRecord.grossIncome,
          digital_transfers: newShiftRecord.digitalTransfers,
          daily_expenses: newShiftRecord.dailyExpenses,
          expense_items: newShiftRecord.expenseItems,
          new_pending_payments_amount: newShiftRecord.newPendingPaymentsAmount,
          recovered_pending_amount: newShiftRecord.recoveredPendingAmount,
          delivery_credit_amount: newShiftRecord.deliveryCreditAmount,
          net_cash_due_to_owner: newShiftRecord.netCashDueToOwner,
          notes: newShiftRecord.notes,
          is_closed: true,
          timestamp: newShiftRecord.timestamp,
        });

        // 2. Mark active tablet orders as closed
        if (activeIds.length > 0) {
          setTodayTabletOrders(prev =>
            prev.map(o => activeIds.includes(o.id) ? { ...o, status: 'closed' } : o)
          );
          await supabase
            .from('tablet_orders')
            .update({ status: 'closed' })
            .in('id', activeIds);
        }

        // 3. Update recovered pending payments to paid
        if (selectedRecoveredIds.length > 0) {
          await supabase
            .from('pending_payments')
            .update({ is_paid: true, paid_date: opDate })
            .in('id', selectedRecoveredIds);
        }

        // 4. Insert unified ledger entries
        const ledgerEntries = buildShiftLedgerEntries(newShiftRecord);
        for (const entry of ledgerEntries) {
          await supabase.from('ledger_entries').insert({
            id: entry.id,
            date: entry.date,
            type: entry.type,
            description: entry.description,
            amount: entry.amount,
            sign: entry.sign,
            reference_id: entry.referenceId,
            created_at_ts: entry.createdAt,
          });
        }
      } catch (e) {
        console.error('Failed to commit reconciled shift to Supabase:', e);
      }

      // Reset form states
      setExpenseItems([]);
      setSelectedRecoveredIds([]);
      setCustomRecoveredAmount('');
      setShiftNotes('');
      setSummarySubTab('closed');

      setTimeout(() => {
        setPinSuccessAnim(false);
        setShowPinModal(false);
        setShowSummaryModal(false);
        setShift(null);
        setEnteredPin('');
        refreshAllData();
      }, 1200);
    } else {
      setPinError(true);
      setTimeout(() => setEnteredPin(''), 900);
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
              <div
                key={s.id}
                className={`${s.btnBg} rounded-3xl p-5 sm:p-6 shadow-2xl border-2 border-white/15 flex flex-col gap-4 transition-all`}
              >
                {/* Main Card Header */}
                <div 
                  onClick={() => {
                    setShift(s.id);
                    if (s.id === 'kitchen') {
                      setKitchenStep('taker');
                      setKitchenTaker(null);
                    }
                  }}
                  className="flex items-center gap-4 cursor-pointer"
                >
                  <div className="text-white bg-black/20 p-3.5 rounded-2xl shrink-0 shadow-inner">
                    {s.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="text-white font-black text-2xl sm:text-3xl leading-tight">{s.amharic}</div>
                      {/* Live Revenue Badge */}
                      <div className="bg-black/30 text-white font-black text-xs sm:text-sm px-3 py-1 rounded-full border border-white/15">
                        {isDay && (dayAllOrders.length > 0 ? `ብር ${dayShiftTotalRev.toLocaleString()}` : `0 Br`)}
                        {isNight && (nightAllOrders.length > 0 ? `ብር ${nightShiftTotalRev.toLocaleString()}` : `0 Br`)}
                        {isKitchen && `${kitchenOrders.length} ዕቃዎች`}
                      </div>
                    </div>
                    <div className="text-white/80 text-xs sm:text-sm font-medium mt-1">
                      {isDay && (
                        dayActiveOrders.length > 0
                          ? `🟢 ${dayActiveOrders.length} አሁን ያለ • ብር ${dayShiftTotalRev.toLocaleString()}`
                          : (dayClosedOrders.length > 0
                              ? `✅ ሸፍቱ ተዘጓ • ${dayAllOrders.length} ትዕዛዞች • ብር ${dayShiftTotalRev.toLocaleString()}`
                              : `አዲስ ሸፍት ጀምር`)
                      )}
                      {isNight && (
                        nightActiveOrders.length > 0
                          ? `🟢 ${nightActiveOrders.length} አሁን ያለ • ብር ${nightShiftTotalRev.toLocaleString()}`
                          : (nightClosedOrders.length > 0
                              ? `✅ ሸፍቱ ተዘጓ • ${nightAllOrders.length} ትዕዛዞች • ብር ${nightShiftTotalRev.toLocaleString()}`
                              : `አዲስ ሸፍት ጀምር`)
                      )}
                      {isKitchen && `የተሰጡ ምግቦች መዝገብ`}
                    </div>
                  </div>
                </div>

                {/* Direct Action Buttons for Day / Night */}
                {!isKitchen ? (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/20">
                    <button
                      onClick={() => setShift(s.id)}
                      className="py-2.5 px-3 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
                    >
                      <span>🛍️ ትዕዛዝ መስጫ</span>
                    </button>

                    <button
                      onClick={() => handleOpenReconcileModal(s.id as 'day' | 'night')}
                      className="py-2.5 px-3 rounded-2xl bg-white text-[#0B1D2C] hover:bg-[#f7f5f0] font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-md"
                    >
                      <BarChart3 className="w-4 h-4 text-emerald-700" />
                      <span>🏁 ሸፍቱን ዝጋ / ሂሳብ</span>
                    </button>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-white/20">
                    <button
                      onClick={() => {
                        setShift('kitchen');
                        setKitchenStep('taker');
                        setKitchenTaker(null);
                      }}
                      className="w-full py-2.5 rounded-2xl bg-white text-[#0B1D2C] font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-md"
                    >
                      <ChefHat className="w-4 h-4 text-emerald-700" />
                      <span>የኩሽና ትዕዛዝ መዝገብ ክፈት</span>
                    </button>
                  </div>
                )}
              </div>
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
        <h2 className="text-3xl sm:text-4xl font-black text-white">ትዕዛዝ ተመዝግቧል!</h2>
        <p className="text-[#f7f5f0]/60 text-base font-semibold">Order saved and synced successfully</p>
        
        <div className="mt-4 bg-white/10 rounded-3xl p-6 w-full max-w-xs space-y-3 text-center border border-white/15 shadow-xl">
          <div className="text-[#f7f5f0]/60 text-xs uppercase tracking-widest font-bold">ጠቅላላ ሂሳብ</div>
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

        {/* Live Metrics, Unsettled Tabs Badge & Summary Modal Trigger */}
        <div className="flex items-center gap-2">
          {/* Unsettled Pay Later Tabs Pill */}
          {unsettledPayLaterOrders.length > 0 && (
            <button
              onClick={() => setShowUnsettledModal(true)}
              className="flex items-center gap-1.5 bg-amber-300 hover:bg-amber-200 text-[#0B1D2C] font-black text-xs sm:text-sm px-3.5 py-2 rounded-2xl shadow-lg border-2 border-amber-100 cursor-pointer active:scale-95 animate-pulse"
              title="ክፍያቸው ያልተጠናቀቀ ክፍት ትዕዛዞች"
            >
              <Clock className="w-4 h-4 text-[#0B1D2C]" />
              <span>🕒 {unsettledPayLaterOrders.length} ያልተከፈሉ!</span>
            </button>
          )}

          <button
            onClick={() => handleOpenReconcileModal()}
            className="flex items-center gap-2 bg-black/30 hover:bg-black/40 text-white font-black text-xs sm:text-sm px-3.5 py-2 rounded-2xl transition-all shadow-sm border border-white/20 active:scale-95 cursor-pointer"
          >
            <BarChart3 className="w-4 h-4 text-amber-300" />
            <span className="hidden sm:inline">የቀኑ ማጠቃለያ</span>
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

      {/* Floating Settlement Feedback Toast */}
      <AnimatePresence>
        {settleFeedbackMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-700 text-white font-black text-sm px-6 py-3 rounded-full shadow-2xl border-2 border-white/30 flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5 text-amber-300" />
            <span>{settleFeedbackMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1" style={{ height: 'calc(100vh - 56px)', overflow: 'hidden' }}>
        
        {/* LEFT: Menu & Customer Info */}
        <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* Customer Name Input */}
          <div className="bg-white border-b border-black/10 px-4 py-3">
            <label className="text-xs font-bold text-black/40 uppercase tracking-widest mb-1 block">
              የደንበኛ / የጠረጴዛ መለያ (Optional Name or Table #)
            </label>
            <input 
              value={customerName} 
              onChange={e => setCustomerName(e.target.value)}
              placeholder="ለምሳሌ፡ ጠረጴዛ 3 ወይም አቶ ካሳ..."
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
                    className={`rounded-2xl p-3.5 text-left transition-all border-2 flex flex-col justify-between active:scale-95 shadow-xs cursor-pointer ${
                      inCart 
                        ? 'bg-white border-[#0B1D2C] shadow-md ring-2 ring-[#0B1D2C]/20' 
                        : 'bg-white border-black/10 hover:border-black/30'
                    }`}
                  >
                    <div>
                      <div className="text-xl mb-1">{item.cat === 'juice' ? '🥤' : '🍽️'}</div>
                      <div className="font-black text-sm text-[#0B1D2C] leading-snug line-clamp-2">{item.name}</div>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/5">
                      <div className="text-xs font-extrabold text-[#0B1D2C]/70">ብር {item.price.toLocaleString()}</div>
                      {inCart && (
                        <span className="bg-[#0B1D2C] text-white text-xs font-black px-2 py-0.5 rounded-full">
                          {inCart.quantity}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: Cart & Pay Later Resolution Banner */}
        <div className="w-80 sm:w-96 bg-white border-l border-black/10 flex flex-col justify-between shadow-xl">
          
          {/* Cart Header */}
          <div className="p-4 border-b border-black/10 flex items-center justify-between bg-[#f7f5f0]">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-[#0B1D2C]" />
              <span className="font-black text-base text-[#0B1D2C]">ትዕዛዝ ማጠቃለያ ({cartCount})</span>
            </div>
            {cart.length > 0 && (
              <button 
                onClick={() => setCart([])} 
                className="text-xs font-bold text-red-600 hover:text-red-700 p-1 cursor-pointer"
              >
                አፅዳ (Clear)
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-black/30 space-y-2">
                <UtensilsCrossed className="w-12 h-12 stroke-1" />
                <p className="text-xs font-bold">ምንም እቃ አልተመረጠም</p>
                <p className="text-[11px]">ከግራ በኩል ምግብ ወይም ጁስ ይምረጡ</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.menuItemId} className="flex items-center justify-between gap-2 border-b border-black/5 pb-2.5">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs sm:text-sm text-[#0B1D2C] truncate">{item.name}</div>
                      <div className="text-[11px] text-black/40 font-semibold">ብር {item.unitPrice.toLocaleString()} / አንዱ</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button 
                        onClick={() => changeQty(item.menuItemId, -1)}
                        className="w-7 h-7 rounded-full bg-[#f7f5f0] flex items-center justify-center hover:bg-red-100 hover:text-red-600 text-[#0B1D2C] transition-colors cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-5 text-center font-black text-xs sm:text-sm text-[#0B1D2C]">{item.quantity}</span>
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
          <div className="px-4 py-2 border-t border-black/10 bg-white">
            <label className="text-xs font-bold text-black/35 uppercase tracking-widest mb-1 block">ልዩ ማስታወሻ (Notes)</label>
            <textarea 
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
              rows={1}
              placeholder="አለርጂ፣ ተጨማሪ ትዕዛዝ..."
              className="w-full text-xs border border-black/15 rounded-xl px-2.5 py-1.5 resize-none outline-none focus:border-[#0B1D2C] text-[#0B1D2C] placeholder:text-black/25 bg-[#f7f5f0] font-medium" 
            />
          </div>

          {/* Payment Method Selector (5 options including Pay Later) */}
          <div className="px-4 py-3 border-t border-black/10 bg-white">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-black/40 uppercase tracking-widest block">
                የክፍያ ሁኔታ (Payment)
              </label>
              {unsettledPayLaterOrders.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowUnsettledModal(true)}
                  className="text-[11px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md hover:bg-amber-200 cursor-pointer"
                >
                  🕒 {unsettledPayLaterOrders.length} ክፍት ጠረጴዛ
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <button 
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`py-2 px-2 rounded-xl text-xs font-black transition-all border-2 flex items-center justify-center gap-1 cursor-pointer ${
                  paymentMethod === 'cash' 
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' 
                    : 'bg-[#f7f5f0] text-[#0B1D2C]/70 border-black/10 hover:border-black/30'
                }`}
              >
                <span>💵 ጥሬ</span>
              </button>

              <button 
                type="button"
                onClick={() => setPaymentMethod('transfer')}
                className={`py-2 px-2 rounded-xl text-xs font-black transition-all border-2 flex items-center justify-center gap-1 cursor-pointer ${
                  paymentMethod === 'transfer' 
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                    : 'bg-[#f7f5f0] text-[#0B1D2C]/70 border-black/10 hover:border-black/30'
                }`}
              >
                <span>📲 ዝውውር</span>
              </button>

              <button 
                type="button"
                onClick={() => setPaymentMethod('pay_later')}
                className={`py-2 px-2 rounded-xl text-xs font-black transition-all border-2 flex items-center justify-center gap-1 cursor-pointer ${
                  paymentMethod === 'pay_later' 
                    ? 'bg-amber-500 text-[#0B1D2C] border-amber-500 font-black shadow-md ring-2 ring-amber-300' 
                    : 'bg-amber-50 text-amber-900 border-amber-300/80 hover:bg-amber-100'
                }`}
              >
                <span>🕒 ቆይቶ</span>
              </button>

              <button 
                type="button"
                onClick={() => setPaymentMethod('pending')}
                className={`py-2 px-2 rounded-xl text-xs font-black transition-all border-2 flex items-center justify-center gap-1 cursor-pointer ${
                  paymentMethod === 'pending' 
                    ? 'bg-orange-600 text-white border-orange-600 shadow-md' 
                    : 'bg-[#f7f5f0] text-[#0B1D2C]/70 border-black/10 hover:border-black/30'
                }`}
              >
                <span>⏳ አዳሪ</span>
              </button>

              <button 
                type="button"
                onClick={() => setPaymentMethod('beu')}
                className={`col-span-2 py-2 px-2 rounded-xl text-xs font-black transition-all border-2 flex items-center justify-center gap-1 cursor-pointer ${
                  paymentMethod === 'beu' 
                    ? 'bg-purple-600 text-white border-purple-600 shadow-md' 
                    : 'bg-[#f7f5f0] text-[#0B1D2C]/70 border-black/10 hover:border-black/30'
                }`}
              >
                <span>🛵 BeU ደሊቨሪ</span>
              </button>
            </div>

            {/* Pay Later Explanation */}
            {paymentMethod === 'pay_later' && (
              <div className="mt-2.5 bg-amber-50 rounded-2xl p-2.5 border-2 border-amber-300 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-black text-amber-900">
                  <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>🕒 ቆይቶ የሚከፈል (Open Tab)</span>
                </div>
                <p className="text-[10.5px] text-amber-800 font-medium leading-tight">
                  ትዕዛዙ ተመዝግቦ ይቀመጣል፤ ጁሱን/ምግቡን አዘጋጅተው ያቅርቡ። ደንበኛው ሲከፍል ከላይ ያለውን <strong>«🕒 ያልተከፈሉ»</strong> በመንካት በ1-ክሊክ ይዘጋል።
                </p>
              </div>
            )}

            {/* Transfer Amount & Tip Calculator */}
            {paymentMethod === 'transfer' && (
              <div className="mt-2.5 bg-indigo-50/80 rounded-2xl p-3 border-2 border-indigo-200 space-y-2">
                <label className="text-xs font-black text-indigo-900 block">የተላከ ገንዘብ በዝውውር (Transfer Amount)</label>
                <div className="flex items-center gap-2 bg-white border-2 border-indigo-300 rounded-xl px-3 py-1.5 focus-within:border-indigo-600 transition-colors shadow-inner">
                  <span className="text-indigo-600 font-black text-sm">ብር</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={transferAmount}
                    onChange={e => setTransferAmount(e.target.value)}
                    placeholder={cartTotal > 0 ? cartTotal.toString() : '0'}
                    className="flex-1 bg-transparent text-[#0B1D2C] font-black text-base outline-none placeholder:text-black/25" 
                  />
                </div>

                {transferAmt > 0 && (
                  <div className="flex justify-between items-center text-xs font-bold pt-1">
                    <span className="text-indigo-700">የትዕዛዝ ዋጋ:</span>
                    <span className="text-[#0B1D2C]">ብር {cartTotal.toLocaleString()}</span>
                  </div>
                )}

                {tip > 0 && (
                  <div className="bg-emerald-100 border border-emerald-300 rounded-xl p-2 flex justify-between items-center shadow-xs">
                    <span className="text-emerald-800 font-black text-xs">✨ ጠቃሚ (Tip):</span>
                    <span className="text-emerald-800 font-black text-sm">+ ብር {tip.toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}

            {/* Pending Payment Customer Note */}
            {paymentMethod === 'pending' && (
              <div className="mt-2.5 bg-orange-50 rounded-2xl p-3 border-2 border-orange-300 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-black text-orange-900">
                  <AlertCircle className="w-4 h-4 text-orange-600 shrink-0" />
                  <span>የአዳሪ ደንበኛ ስም / ስልክ (Credit Note)</span>
                </div>
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="የደንበኛው ስም ወይም ስልክ (ለምሳሌ፡ አቶ ካሳ)..."
                  className="w-full text-xs font-bold border border-amber-300 rounded-xl px-3 py-2 outline-none focus:border-amber-600 text-[#0B1D2C] bg-white shadow-inner"
                />
                <p className="text-[10px] text-amber-800 font-medium">
                  ይህ ትዕዛዝ ወደ አዳሪዎች መዝገብ ይቀመጣል። ደንበኛው ሲከፍል ከዝርዝሩ ላይ ይሰበሰባል።
                </p>
              </div>
            )}

            {/* BeU Delivery Note */}
            {paymentMethod === 'beu' && (
              <div className="mt-2.5 bg-purple-50 rounded-2xl p-3 border-2 border-purple-300 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-black text-purple-900">
                  <Truck className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>BeU Delivery Takeaway</span>
                </div>
                <p className="text-[10px] text-purple-800 font-medium">
                  ትዕዛዙ በBeU ደሊቨሪ ሳምንታዊ ሂሳብ መዝገብ ላይ ይመዘገባል።
                </p>
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

            {/* Direct 5-Step End-of-Shift Reconciliation Trigger Button */}
            <button 
              type="button"
              onClick={() => handleOpenReconcileModal()} 
              className="w-full mt-2 py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white transition-all active:scale-95 shadow-md cursor-pointer"
            >
              <BarChart3 className="w-4 h-4 text-amber-300" />
              <span>🏁 ሸፍቱን ዝጋ / 5-ደረጃ ሂሳብ ማጠቃለያ</span>
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
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
                
                {/* 5-Tab Reconciliation Navigation Bar */}
                <div className="flex bg-white p-1.5 rounded-2xl border border-[#0B1D2C]/15 shadow-xs overflow-x-auto gap-1">
                  <button
                    onClick={() => setReconcileTab('sales')}
                    className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                      reconcileTab === 'sales'
                        ? 'bg-[#0B1D2C] text-white shadow-md'
                        : 'text-[#0B1D2C]/60 hover:text-[#0B1D2C] hover:bg-[#f7f5f0]'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>1. የሽያጭ ማጠቃለያ</span>
                  </button>

                  <button
                    onClick={() => setReconcileTab('inventory')}
                    className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                      reconcileTab === 'inventory'
                        ? 'bg-[#0B1D2C] text-white shadow-md'
                        : 'text-[#0B1D2C]/60 hover:text-[#0B1D2C] hover:bg-[#f7f5f0]'
                    }`}
                  >
                    <Package className="w-4 h-4" />
                    <span>2. የኮፕ ቆጠራ ({juiceLeftover} የቀረ)</span>
                  </button>

                  <button
                    onClick={() => setReconcileTab('expenses')}
                    className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                      reconcileTab === 'expenses'
                        ? 'bg-[#0B1D2C] text-white shadow-md'
                        : 'text-[#0B1D2C]/60 hover:text-[#0B1D2C] hover:bg-[#f7f5f0]'
                    }`}
                  >
                    <Receipt className="w-4 h-4" />
                    <span>3. የዕለት ወጪዎች ({expenseItems.length})</span>
                  </button>

                  <button
                    onClick={() => setReconcileTab('recover_pending')}
                    className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                      reconcileTab === 'recover_pending'
                        ? 'bg-[#0B1D2C] text-white shadow-md'
                        : 'text-[#0B1D2C]/60 hover:text-[#0B1D2C] hover:bg-[#f7f5f0]'
                    }`}
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>4. የቀደመ አዳሪ ({unpaidPendingList.length})</span>
                  </button>

                  <button
                    onClick={() => setReconcileTab('net_cash')}
                    className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                      reconcileTab === 'net_cash'
                        ? 'bg-emerald-700 text-white shadow-md'
                        : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span>5. ጥሬ ገንዘብ ርክክብ (ብር {netCashDueToOwner.toLocaleString()})</span>
                  </button>
                </div>

                {/* ─── TAB 1: POS SALES & PAYMENTS ────────────────────────────── */}
                {reconcileTab === 'sales' && (
                  <div className="space-y-5">
                    {/* 6 Key Financial Metric Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      {/* Total Sales */}
                      <div className="bg-[#0B1D2C] text-white rounded-2xl p-4 shadow-md flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-white/70">ጠቅላላ ገቢ</span>
                          <TrendingUp className="w-4 h-4 text-emerald-400" />
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
                        <div className="text-xl sm:text-2xl font-black text-emerald-700">
                          ብር {shiftStats.cashTotal.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-[#0B1D2C]/40 mt-1 font-semibold">Cash Sales</div>
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

                      {/* Pending Credit */}
                      <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#0B1D2C]/10 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-amber-800">አዳሪ (ዕዳ)</span>
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="text-xl sm:text-2xl font-black text-amber-700">
                          ብር {shiftStats.pendingTotal.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-amber-600 mt-1 font-semibold">New Unpaid Credit</div>
                      </div>

                      {/* BeU Delivery */}
                      <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#0B1D2C]/10 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-purple-800">BeU ደሊቨሪ</span>
                          <Truck className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="text-xl sm:text-2xl font-black text-purple-700">
                          ብር {shiftStats.beuTotal.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-purple-600 mt-1 font-semibold">Delivery Credit</div>
                      </div>

                      {/* Tips */}
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
                    </div>

                    {/* Unsettled Pay Later Warning & 1-Click Resolver */}
                    {unsettledPayLaterOrders.length > 0 && (
                      <div className="bg-amber-100/90 border-2 border-amber-400 rounded-3xl p-5 shadow-sm space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div className="flex items-center gap-2 text-amber-950 font-black text-sm sm:text-base">
                            <Clock className="w-5 h-5 text-amber-700 shrink-0" />
                            <span>⚠️ {unsettledPayLaterOrders.length} ያልተከፈሉ ክፍት ትዕዛዞች አሉ (ድምር፡ ብር {shiftStats.payLaterTotal.toLocaleString()})</span>
                          </div>
                          <span className="text-xs text-amber-800 font-bold">ሸፍቱን ከመዝጋትዎ በፊት ይወስኑ</span>
                        </div>

                        <div className="space-y-2.5">
                          {unsettledPayLaterOrders.map((ord, idx) => (
                            <div key={ord.id} className="bg-white rounded-2xl p-4 border-2 border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="bg-[#0B1D2C] text-white font-black text-xs px-2.5 py-0.5 rounded-lg">
                                    🎫 ትዕዛዝ #{idx + 1}
                                  </span>
                                  <span className="font-black text-sm sm:text-base text-[#0B1D2C]">
                                    {ord.customerName || 'ክፍት ጠረጴዛ'}
                                  </span>
                                  <span className="text-xs text-neutral-500 font-semibold">
                                    ({formatEthiopianTime(ord.orderTime)})
                                  </span>
                                </div>
                                <div className="text-xs text-neutral-700 font-semibold flex flex-wrap gap-1 pt-0.5">
                                  {(ord.items || []).map((i, itIdx) => (
                                    <span key={itIdx} className="bg-[#f7f5f0] px-2 py-0.5 rounded-md border border-black/10 font-bold">
                                      {i.category === 'juice' ? '🥤' : '🍽️'} {i.name} ×{i.quantity} (ብር {i.totalPrice.toLocaleString()})
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-black/5">
                                <div className="text-left sm:text-right shrink-0">
                                  <span className="text-[10px] text-neutral-500 font-bold uppercase block">ድምር</span>
                                  <span className="text-base sm:text-lg font-black text-[#0B1D2C]">
                                    ብር {ord.totalAmount.toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleSettlePayLaterOrder(ord, 'cash')}
                                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs cursor-pointer active:scale-95 shadow-sm"
                                  >
                                    💵 ጥሬ
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSettlePayLaterOrder(ord, 'transfer')}
                                    className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs cursor-pointer active:scale-95 shadow-sm"
                                  >
                                    📲 ዝውውር
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSettlePayLaterOrder(ord, 'pending')}
                                    className="px-3 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs cursor-pointer active:scale-95 shadow-sm"
                                  >
                                    ⏳ አዳሪ
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Itemized Sales Breakdown Table */}
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

                    {/* Order History */}
                    <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-[#0B1D2C]/10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-5 h-5 text-[#0B1D2C]" />
                          <h3 className="text-lg font-black text-[#0B1D2C]">የሁሉም ትዕዛዞች ታሪክ ({shiftOrders.length})</h3>
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
                              className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                ord.status === 'closed' 
                                  ? 'bg-amber-50 border-amber-200' 
                                  : 'bg-[#f7f5f0] border-[#0B1D2C]/10'
                              }`}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-black bg-[#0B1D2C] text-white px-2 py-0.5 rounded-md">
                                    #{shiftOrders.length - i}
                                  </span>
                                  <span className="font-black text-sm text-[#0B1D2C]">
                                    {ord.customerName ? ord.customerName : 'የቀጥታ ደንበኛ'}
                                  </span>
                                  <span className="text-xs text-[#0B1D2C]/40 font-semibold">
                                    ({formatEthiopianTime(ord.orderTime)})
                                  </span>
                                  {ord.status === 'closed' && (
                                    <span className="text-[10px] font-black bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                                      ✅ ተዘጋ
                                    </span>
                                  )}
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
                                    : ord.paymentMethod === 'transfer'
                                    ? 'bg-indigo-100 text-indigo-800'
                                    : ord.paymentMethod === 'pending'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-purple-100 text-purple-800'
                                }`}>
                                  {ord.paymentMethod === 'cash' ? '💵 ጥሬ ገንዘብ' : ord.paymentMethod === 'transfer' ? '📲 ዝውውር' : ord.paymentMethod === 'pending' ? '⏳ አዳሪ' : '🛵 BeU'}
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
                )}

                {/* ─── TAB 2: INVENTORY & LEFTOVER CUPS COUNT ─────────────────── */}
                {reconcileTab === 'inventory' && (
                  <div className="space-y-5">
                    {/* Juice Cups Inventory Card */}
                    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#0B1D2C]/15 shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-[#0B1D2C]/10 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-xl">
                            🥤
                          </div>
                          <div>
                            <h3 className="font-black text-lg text-[#0B1D2C]">የጭማቂ ኮፖች ቆጠራ (Juice Cups Inventory)</h3>
                            <p className="text-xs text-[#0B1D2C]/60 font-semibold">የመነሻ፣ የተጨመረ እና የቀረ (Leftover) ኮፖች ቆጠራ</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-[#0B1D2C]/50">ነጠላ ዋጋ</span>
                          <div className="text-sm font-black text-[#0B1D2C]">ብር {config.defaultJuiceUnitPrice || 170}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Opening */}
                        <div className="bg-[#f7f5f0] p-4 rounded-2xl border border-[#0B1D2C]/10 space-y-1.5">
                          <label className="text-xs font-black text-[#0B1D2C]/60 block">መነሻ ኮፕ (Opening)</label>
                          <input
                            type="number"
                            min="0"
                            value={juiceOpening}
                            onChange={e => setJuiceOpening(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full bg-white border-2 border-[#0B1D2C]/20 rounded-xl px-3 py-2 text-xl font-black text-[#0B1D2C] outline-none focus:border-[#0B1D2C]"
                          />
                          <p className="text-[11px] text-[#0B1D2C]/40">ከቀደመው ሸፍት የቀረ</p>
                        </div>

                        {/* Added */}
                        <div className="bg-[#f7f5f0] p-4 rounded-2xl border border-[#0B1D2C]/10 space-y-1.5">
                          <label className="text-xs font-black text-[#0B1D2C]/60 block">የተጨመረ ኮፕ (Added)</label>
                          <input
                            type="number"
                            min="0"
                            value={juiceAdded}
                            onChange={e => setJuiceAdded(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full bg-white border-2 border-[#0B1D2C]/20 rounded-xl px-3 py-2 text-xl font-black text-[#0B1D2C] outline-none focus:border-[#0B1D2C]"
                          />
                          <p className="text-[11px] text-[#0B1D2C]/40">በዚህ ሸፍት የገባ</p>
                        </div>

                        {/* Leftover Count */}
                        <div className="bg-amber-50 p-4 rounded-2xl border-2 border-amber-300 space-y-1.5">
                          <label className="text-xs font-black text-amber-900 block">የቀረ ኮፕ ቆጠራ (Leftover Count)</label>
                          <input
                            type="number"
                            min="0"
                            value={juiceLeftover}
                            onChange={e => setJuiceLeftover(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full bg-white border-2 border-amber-500 rounded-xl px-3 py-2 text-2xl font-black text-amber-900 outline-none focus:ring-4 focus:ring-amber-200"
                          />
                          <p className="text-[11px] text-amber-800 font-bold">አሁን በቆጠራ የቀረ</p>
                        </div>
                      </div>

                      {/* Calculated vs POS Match Banner */}
                      <div className="bg-[#0B1D2C] text-white p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-[#0B1D2C] flex items-center justify-center font-black text-lg">
                            🥤
                          </div>
                          <div>
                            <div className="text-xs text-white/70 font-bold">በቆጠራ የተሸጠ ኮፕ (Calculated Sold)</div>
                            <div className="text-xl font-black text-emerald-300">
                              {calculatedJuiceSold} ኮፖች • ብር {calculatedJuiceRev.toLocaleString()}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {calculatedJuiceSold === shiftStats.juiceCount ? (
                            <span className="bg-emerald-500/30 border border-emerald-400 text-emerald-200 text-xs font-black px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                              <CheckCircle className="w-4 h-4" />
                              <span>ከታብሌት ትዕዛዝ ጋር ይስማማል ({shiftStats.juiceCount} ኮፕ)</span>
                            </span>
                          ) : (
                            <span className="bg-amber-500/30 border border-amber-400 text-amber-200 text-xs font-black px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                              <AlertCircle className="w-4 h-4" />
                              <span>ልዩነት: ታብሌት ({shiftStats.juiceCount}) vs ቆጠራ ({calculatedJuiceSold})</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Food Takeaway Packaging Card */}
                    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#0B1D2C]/15 shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-[#0B1D2C]/10 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-black text-xl">
                            📦
                          </div>
                          <div>
                            <h3 className="font-black text-lg text-[#0B1D2C]">የምግብ ማሸጊያ ዕቃዎች ቆጠራ (Takeaway Boxes)</h3>
                            <p className="text-xs text-[#0B1D2C]/60 font-semibold">የምግብ ማሸጊያ መነሻ እና የቀረ ቆጠራ</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-[#f7f5f0] p-4 rounded-2xl border border-[#0B1D2C]/10 space-y-1.5">
                          <label className="text-xs font-black text-[#0B1D2C]/60 block">መነሻ ማሸጊያ (Opening)</label>
                          <input
                            type="number"
                            min="0"
                            value={foodOpening}
                            onChange={e => setFoodOpening(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full bg-white border-2 border-[#0B1D2C]/20 rounded-xl px-3 py-2 text-xl font-black text-[#0B1D2C] outline-none focus:border-[#0B1D2C]"
                          />
                        </div>

                        <div className="bg-[#f7f5f0] p-4 rounded-2xl border border-[#0B1D2C]/10 space-y-1.5">
                          <label className="text-xs font-black text-[#0B1D2C]/60 block">የተጨመረ ማሸጊያ (Added)</label>
                          <input
                            type="number"
                            min="0"
                            value={foodAdded}
                            onChange={e => setFoodAdded(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full bg-white border-2 border-[#0B1D2C]/20 rounded-xl px-3 py-2 text-xl font-black text-[#0B1D2C] outline-none focus:border-[#0B1D2C]"
                          />
                        </div>

                        <div className="bg-indigo-50 p-4 rounded-2xl border-2 border-indigo-300 space-y-1.5">
                          <label className="text-xs font-black text-indigo-900 block">የቀረ ማሸጊያ ቆጠራ (Leftover)</label>
                          <input
                            type="number"
                            min="0"
                            value={foodLeftover}
                            onChange={e => setFoodLeftover(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full bg-white border-2 border-indigo-500 rounded-xl px-3 py-2 text-2xl font-black text-indigo-900 outline-none focus:ring-4 focus:ring-indigo-200"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── TAB 3: DAILY SHIFT EXPENSES ────────────────────────────── */}
                {reconcileTab === 'expenses' && (
                  <div className="space-y-5">
                    {/* Add Expense Form Card */}
                    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#0B1D2C]/15 shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-[#0B1D2C]/10 pb-3">
                        <div className="flex items-center gap-2">
                          <Receipt className="w-5 h-5 text-red-600" />
                          <h3 className="font-black text-lg text-[#0B1D2C]">የዕለት ወጪ መዝግብ (Add Shift Expense)</h3>
                        </div>
                        <span className="text-xs text-red-700 bg-red-100 font-black px-2.5 py-1 rounded-full">
                          ከጥሬ ገንዘብ የሚቀነስ
                        </span>
                      </div>

                      {/* Quick Shortcut Buttons */}
                      <div>
                        <label className="text-xs font-bold text-[#0B1D2C]/50 mb-1.5 block">ፈጣን ምርጫዎች (Quick Add):</label>
                        <div className="flex flex-wrap gap-1.5">
                          {COMMON_EXPENSES.map((ce, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setNewExpTitle(ce.title);
                                setNewExpCategory(ce.category);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-[#f7f5f0] hover:bg-[#0B1D2C] hover:text-white text-[#0B1D2C] text-xs font-bold border border-[#0B1D2C]/15 transition-all cursor-pointer"
                            >
                              {ce.title}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Input fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                        <div className="sm:col-span-1">
                          <label className="text-xs font-bold text-[#0B1D2C]/60 mb-1 block">የወጪው ዓይነት / ስም</label>
                          <input
                            type="text"
                            value={newExpTitle}
                            onChange={e => setNewExpTitle(e.target.value)}
                            placeholder="ለምሳሌ፡ 2 ኪሎ ሎሚ..."
                            className="w-full bg-[#f7f5f0] border border-[#0B1D2C]/20 rounded-xl px-3 py-2.5 text-sm font-bold text-[#0B1D2C] outline-none focus:border-[#0B1D2C]"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-[#0B1D2C]/60 mb-1 block">የወጪ መጠን (ብር)</label>
                          <input
                            type="number"
                            min="0"
                            value={newExpAmount}
                            onChange={e => setNewExpAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-[#f7f5f0] border border-[#0B1D2C]/20 rounded-xl px-3 py-2.5 text-sm font-black text-[#0B1D2C] outline-none focus:border-[#0B1D2C]"
                          />
                        </div>

                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => handleAddExpense(newExpTitle, parseFloat(newExpAmount) || 0, newExpCategory)}
                            disabled={!newExpTitle.trim() || !(parseFloat(newExpAmount) > 0)}
                            className={`w-full py-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              !newExpTitle.trim() || !(parseFloat(newExpAmount) > 0)
                                ? 'bg-black/10 text-black/30 cursor-not-allowed'
                                : 'bg-red-600 hover:bg-red-700 text-white shadow-md'
                            }`}
                          >
                            <Plus className="w-4 h-4" />
                            <span>ወጪ ጨምር</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Recorded Expenses List */}
                    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#0B1D2C]/15 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-black text-base text-[#0B1D2C]">
                          የተመዘገቡ የዕለት ወጪዎች ({expenseItems.length})
                        </h4>
                        <span className="text-sm font-black text-red-700">
                          ጠቅላላ ወጪ: ብር {totalDailyExpenses.toLocaleString()}
                        </span>
                      </div>

                      {expenseItems.length === 0 ? (
                        <p className="text-center py-6 text-xs text-[#0B1D2C]/40 font-semibold">
                          በዚህ ሸፍት የተመዘገበ ምንም ወጪ የለም (No shift expenses added)
                        </p>
                      ) : (
                        <div className="divide-y divide-[#0B1D2C]/10">
                          {expenseItems.map(exp => (
                            <div key={exp.id} className="py-3 flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <span className="p-1.5 bg-red-100 text-red-800 rounded-lg text-xs font-bold">🛒</span>
                                <div>
                                  <div className="font-black text-sm text-[#0B1D2C]">{exp.title}</div>
                                  <div className="text-xs text-[#0B1D2C]/40 font-semibold">{exp.time || 'ቀን'}</div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="font-black text-base text-red-700">
                                  - ብር {exp.amount.toLocaleString()}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveExpense(exp.id)}
                                  className="p-1.5 text-black/30 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                  title="ሰርዝ"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ─── TAB 4: RECOVER PAST PENDING PAYMENTS (አዳሪ መሰብሰቢያ) ─────── */}
                {reconcileTab === 'recover_pending' && (
                  <div className="space-y-5">
                    {/* Header Card */}
                    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#0B1D2C]/15 shadow-sm space-y-3">
                      <div className="flex items-center justify-between border-b border-[#0B1D2C]/10 pb-3">
                        <div className="flex items-center gap-2">
                          <RefreshCw className="w-5 h-5 text-emerald-600" />
                          <h3 className="font-black text-lg text-[#0B1D2C]">የቀደሙ ያልተከፈሉ አዳሪዎች መሰብሰቢያ</h3>
                        </div>
                        <span className="text-xs font-black bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
                          የተሰበሰበ: + ብር {totalRecoveredPending.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-[#0B1D2C]/70 font-medium">
                        ደንበኞች የቀደመ ዕዳቸውን በዚህ ሸፍት በጥሬ ገንዘብ ከከፈሉ ከዝርዝሩ ላይ "✅ ተቀበልኩ" የሚለውን ይጫኑ። የተሰበሰበው ገንዘብ ለባለቤቱ በሚሰጠው የጥሬ ገንዘብ ሂሳብ ላይ ይደመራል።
                      </p>

                      {/* Custom Additional Recovered Amount */}
                      <div className="bg-[#f7f5f0] p-3.5 rounded-2xl border border-[#0B1D2C]/10 flex items-center justify-between gap-3">
                        <div className="text-xs font-bold text-[#0B1D2C]">
                          ተጨማሪ የተሰበሰበ ያልተመዘገበ አዳሪ (Custom Recovery):
                        </div>
                        <div className="flex items-center gap-2 w-48">
                          <span className="text-xs font-black text-[#0B1D2C]">ብር</span>
                          <input
                            type="number"
                            min="0"
                            value={customRecoveredAmount}
                            onChange={e => setCustomRecoveredAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-white border border-[#0B1D2C]/20 rounded-xl px-3 py-1.5 text-sm font-black text-[#0B1D2C] outline-none focus:border-[#0B1D2C]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Unpaid Pending List */}
                    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#0B1D2C]/15 shadow-sm space-y-3">
                      <h4 className="font-black text-base text-[#0B1D2C]">
                        ያልተከፈሉ የቀደሙ አዳሪዎች ዝርዝር ({unpaidPendingList.length})
                      </h4>

                      {unpaidPendingList.length === 0 ? (
                        <p className="text-center py-8 text-xs text-[#0B1D2C]/40 font-semibold">
                          ምንም ያልተከፈለ የቀደመ አዳሪ የለም (All past debts are settled!)
                        </p>
                      ) : (
                        <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                          {unpaidPendingList.map(item => {
                            const isSelected = selectedRecoveredIds.includes(item.id);
                            return (
                              <div
                                key={item.id}
                                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                  isSelected
                                    ? 'bg-emerald-50 border-emerald-400 shadow-xs'
                                    : 'bg-[#f7f5f0] border-[#0B1D2C]/10 hover:border-[#0B1D2C]/30'
                                }`}
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-black text-sm text-[#0B1D2C]">
                                      {item.customerName || 'አዳሪ ደንበኛ'}
                                    </span>
                                    <span className="text-xs text-[#0B1D2C]/50 font-semibold">
                                      (ቀን: {item.date})
                                    </span>
                                    <span className="text-[10px] font-bold bg-[#0B1D2C]/10 text-[#0B1D2C] px-2 py-0.5 rounded-md">
                                      {item.shiftType === 'day' ? '☀️ የቀን' : '🌙 የሌሊት'}
                                    </span>
                                  </div>

                                  <div className="text-xs text-[#0B1D2C]/70 mt-1 font-medium">
                                    {item.description}
                                  </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#0B1D2C]/10">
                                  <div className="text-base font-black text-[#0B1D2C]">
                                    ብር {item.amount.toLocaleString()}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleToggleRecoveredPending(item.id)}
                                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                                      isSelected
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'bg-white text-[#0B1D2C] border border-[#0B1D2C]/20 hover:bg-[#0B1D2C] hover:text-white'
                                    }`}
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>{isSelected ? '✅ ተሰብስቧል' : 'ተቀበልኩ (Collect)'}</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ─── TAB 5: NET CASH HANDOVER RECONCILIATION ───────────────── */}
                {reconcileTab === 'net_cash' && (
                  <div className="space-y-5">
                    {/* Blocking Alert if Open Tabs exist */}
                    {unsettledPayLaterOrders.length > 0 && (
                      <div className="bg-red-50 border-2 border-red-400 rounded-3xl p-5 shadow-sm space-y-3">
                        <div className="flex items-center gap-2.5 text-red-950 font-black text-sm sm:text-base">
                          <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 animate-bounce" />
                          <span>⛔ ሸፍቱ ከመዘጋቱ በፊት መስተካከል ያለባቸው {unsettledPayLaterOrders.length} ክፍት ትዕዛዞች አሉ!</span>
                        </div>
                        <p className="text-xs text-red-800 font-medium">
                          እነዚህ ትዕዛዞች በጥሬ ገንዘብ፣ በዝውውር ወይም በአዳሪነት እስካልተመዘገቡ ድረስ ሲስተሙ ሸፍቱን ለመዝጋት <strong>አይፈቅድም</strong>። እባክዎ ከዚህ በታች ባሉት ፈጣን ቁልፎች ይወስኑ፡
                        </p>

                        <div className="space-y-2.5 pt-1">
                          {unsettledPayLaterOrders.map((ord, idx) => (
                            <div key={ord.id} className="bg-white rounded-2xl p-4 border-2 border-red-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="bg-red-700 text-white font-black text-xs px-2.5 py-0.5 rounded-lg">
                                    🎫 ትዕዛዝ #{idx + 1}
                                  </span>
                                  <span className="font-black text-sm sm:text-base text-[#0B1D2C]">
                                    {ord.customerName || 'ክፍት ጠረጴዛ'}
                                  </span>
                                  <span className="text-xs text-neutral-500 font-semibold">
                                    ({formatEthiopianTime(ord.orderTime)})
                                  </span>
                                </div>
                                <div className="text-xs text-neutral-700 font-semibold flex flex-wrap gap-1 pt-0.5">
                                  {(ord.items || []).map((i, itIdx) => (
                                    <span key={itIdx} className="bg-[#f7f5f0] px-2 py-0.5 rounded-md border border-black/10 font-bold">
                                      {i.category === 'juice' ? '🥤' : '🍽️'} {i.name} ×{i.quantity} (ብር {i.totalPrice.toLocaleString()})
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-black/5">
                                <div className="text-left sm:text-right shrink-0">
                                  <span className="text-[10px] text-neutral-500 font-bold uppercase block">ድምር</span>
                                  <span className="text-base sm:text-lg font-black text-[#0B1D2C]">
                                    ብር {ord.totalAmount.toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleSettlePayLaterOrder(ord, 'cash')}
                                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs cursor-pointer active:scale-95 shadow-sm"
                                  >
                                    💵 ጥሬ
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSettlePayLaterOrder(ord, 'transfer')}
                                    className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs cursor-pointer active:scale-95 shadow-sm"
                                  >
                                    📲 ዝውውር
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSettlePayLaterOrder(ord, 'pending')}
                                    className="px-3 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs cursor-pointer active:scale-95 shadow-sm"
                                  >
                                    ⏳ አዳሪ
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Final Net Cash Formula Card */}
                    <div className="bg-gradient-to-br from-[#0B1D2C] to-[#162E44] text-white rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
                      <div className="flex items-center justify-between border-b border-white/15 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-[#0B1D2C] flex items-center justify-center font-black text-2xl shadow-md">
                            💰
                          </div>
                          <div>
                            <h3 className="text-xl sm:text-2xl font-black">ለባለቤቱ የሚሰጥ የተጣራ ጥሬ ገንዘብ</h3>
                            <p className="text-white/70 text-xs font-semibold">Final Cash Handover Calculation</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-white/60">ቀን</span>
                          <div className="text-sm font-black text-white">{todayStr}</div>
                        </div>
                      </div>

                      {/* Arithmetic Breakdown */}
                      <div className="space-y-3 font-mono text-sm sm:text-base">
                        <div className="flex items-center justify-between py-1.5 border-b border-white/10">
                          <span className="text-white/80 font-sans font-bold flex items-center gap-2">
                            <span>💵</span> የሽያጭ ጥሬ ገንዘብ (Cash Sales):
                          </span>
                          <span className="font-black text-emerald-300">
                            + ብር {shiftStats.cashTotal.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between py-1.5 border-b border-white/10">
                          <span className="text-white/80 font-sans font-bold flex items-center gap-2">
                            <span>🔄</span> የተሰበሰበ የቀደመ አዳሪ (Recovered Debts):
                          </span>
                          <span className="font-black text-emerald-300">
                            + ብር {totalRecoveredPending.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between py-1.5 border-b border-white/10">
                          <span className="text-white/80 font-sans font-bold flex items-center gap-2">
                            <span>🛒</span> የዕለት ወጪዎች (Daily Expenses Paid):
                          </span>
                          <span className="font-black text-red-400">
                            - ብር {totalDailyExpenses.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-3 text-xl sm:text-2xl font-black border-t-2 border-white/30">
                          <span className="font-sans text-white">
                            👉 በጥሬ ገንዘብ የሚረከበው ሂሳብ:
                          </span>
                          <span className="text-emerald-300 bg-emerald-950/60 px-4 py-1.5 rounded-2xl border border-emerald-400/40">
                            ብር {netCashDueToOwner.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Full Financial Ledger Summary Card */}
                    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#0B1D2C]/15 shadow-sm space-y-3">
                      <h4 className="font-black text-base text-[#0B1D2C] flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-indigo-600" />
                        <span>የሸፍቱ አጠቃላይ የገንዘብ ዝርዝር (Complete Shift Audit)</span>
                      </h4>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="bg-[#f7f5f0] p-3 rounded-xl">
                          <span className="text-[#0B1D2C]/50 font-bold block">ጠቅላላ ሽያጭ (Gross)</span>
                          <span className="text-sm font-black text-[#0B1D2C]">ብር {shiftStats.totalRev.toLocaleString()}</span>
                        </div>

                        <div className="bg-[#f7f5f0] p-3 rounded-xl">
                          <span className="text-indigo-800 font-bold block">ዝውውር (Telebirr)</span>
                          <span className="text-sm font-black text-indigo-700">ብር {shiftStats.transferTotal.toLocaleString()}</span>
                        </div>

                        <div className="bg-[#f7f5f0] p-3 rounded-xl">
                          <span className="text-amber-800 font-bold block">አዲስ አዳሪ (Pending)</span>
                          <span className="text-sm font-black text-amber-700">ብር {shiftStats.pendingTotal.toLocaleString()}</span>
                        </div>

                        <div className="bg-[#f7f5f0] p-3 rounded-xl">
                          <span className="text-purple-800 font-bold block">BeU ደሊቨሪ</span>
                          <span className="text-sm font-black text-purple-700">ብር {shiftStats.beuTotal.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Notes input */}
                      <div className="pt-2">
                        <label className="text-xs font-bold text-[#0B1D2C]/60 mb-1 block">የሸፍት ማስታወሻ (Optional Shift Notes)</label>
                        <textarea
                          value={shiftNotes}
                          onChange={e => setShiftNotes(e.target.value)}
                          rows={2}
                          placeholder="የቀኑ ልዩ ሁኔታ ወይም ማስታወሻ..."
                          className="w-full text-xs font-medium border border-[#0B1D2C]/20 rounded-xl p-3 outline-none focus:border-[#0B1D2C] bg-[#f7f5f0]"
                        />
                      </div>
                    </div>
                  </div>
                )}

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
                    type="button"
                    onClick={handleAttemptOpenPinModal}
                    className={`px-6 py-3 rounded-2xl font-black text-sm shadow-xl transition-all flex items-center gap-2 cursor-pointer active:scale-95 ${
                      unsettledPayLaterOrders.length > 0
                        ? 'bg-amber-600 hover:bg-amber-700 text-white animate-pulse'
                        : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                    }`}
                  >
                    {unsettledPayLaterOrders.length > 0 ? (
                      <>
                        <AlertTriangle className="w-4 h-4 text-amber-200" />
                        <span>⚠️ ሸፍቱን ዝጋ ({unsettledPayLaterOrders.length} ያልተጠናቀቁ አሉ)</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 text-amber-300" />
                        <span>በፒን አረጋግጥ እና ዝጋ (Confirm with PIN & Close Shift)</span>
                      </>
                    )}
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

      {/* ─── 6. UNSETTLED PAY LATER / OPEN TABS MODAL ───────────────────── */}
      <AnimatePresence>
        {showUnsettledModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-60 flex items-center justify-center p-4 sm:p-6 select-none overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              className="bg-[#f7f5f0] w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl border-2 border-white/20 flex flex-col overflow-hidden text-[#0B1D2C]"
            >
              {/* Modal Header */}
              <div className="bg-amber-500 text-[#0B1D2C] px-6 py-4 flex items-center justify-between shadow-md shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-black/10 rounded-2xl">
                    <Clock className="w-6 h-6 text-[#0B1D2C]" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black">
                      🕒 ያልተከፈሉ ክፍት ትዕዛዞች ({unsettledPayLaterOrders.length})
                    </h3>
                    <p className="text-[#0B1D2C]/70 text-xs font-semibold">
                      Open Tabs & Pay Later Orders (ጠቅላላ፡ ብር {shiftStats.payLaterTotal.toLocaleString()})
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowUnsettledModal(false)}
                  className="w-10 h-10 rounded-full bg-black/10 hover:bg-black/20 text-[#0B1D2C] flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {unsettledPayLaterOrders.length > 0 ? (
                  <div className="bg-amber-100/90 border border-amber-300 rounded-2xl p-4 text-amber-950 flex items-start gap-3 shadow-xs">
                    <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-black text-sm text-amber-900">
                        💡 ክፍት ትዕዛዞችን በ1-ክሊክ ይወስኑ
                      </div>
                      <div className="text-xs text-amber-800 font-medium mt-0.5">
                        ደንበኛው ሲከፍል ከትዕዛዙ ስር <span className="underline font-black">[💵 ጥሬ]</span>፣ <span className="underline font-black">[📲 ዝውውር]</span> ወይም <span className="underline font-black">[⏳ አዳሪ]</span> የሚለውን በመጫን መመዝገብ ይችላሉ።
                      </div>
                    </div>
                  </div>
                ) : null}

                {shiftPayLaterOrders.length === 0 ? (
                  <div className="bg-white rounded-3xl p-10 text-center space-y-3 border border-[#0B1D2C]/10">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="w-8 h-8" />
                    </div>
                    <h4 className="text-lg font-black text-[#0B1D2C]">ምንም ክፍት ወይም ያልተከፈለ ትዕዛዝ የለም!</h4>
                    <p className="text-xs text-[#0B1D2C]/60">በዚህ ሸፍት እስካሁን የቆየ ክፍት ትዕዛዝ አልተመዘገበም።</p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {shiftPayLaterOrders.map((ord, idx) => {
                      const isUnsettled = ord.paymentMethod === 'pay_later';

                      return (
                        <div
                          key={ord.id}
                          className={`bg-white rounded-3xl p-5 border-2 transition-all shadow-sm space-y-4 ${
                            isUnsettled ? 'border-amber-400' : 'border-emerald-400 bg-emerald-50/20'
                          }`}
                        >
                          {/* Order Header & Table */}
                          <div className="flex items-start justify-between gap-3 border-b border-[#0B1D2C]/10 pb-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="bg-[#0B1D2C] text-white font-black text-xs px-2.5 py-0.5 rounded-lg">
                                  🎫 ትዕዛዝ #{idx + 1}
                                </span>
                                <span className="font-black text-base text-[#0B1D2C]">
                                  {ord.customerName || 'ክፍት ጠረጴዛ'}
                                </span>
                                <span className="text-xs text-[#0B1D2C]/50 font-semibold">
                                  ({formatEthiopianTime(ord.orderTime)})
                                </span>
                              </div>

                              <div className="text-xs text-[#0B1D2C]/70 font-semibold flex flex-wrap gap-1 pt-1">
                                {(ord.items || []).map((it, i) => (
                                  <span key={i} className="bg-[#f7f5f0] px-2 py-0.5 rounded-md border border-[#0B1D2C]/10 font-bold">
                                    {it.category === 'juice' ? '🥤' : '🍽️'} {it.name} × {it.quantity} (ብር {it.totalPrice.toLocaleString()})
                                  </span>
                                ))}
                              </div>

                              {ord.notes && (
                                <div className="text-[11px] text-indigo-700 font-semibold pt-0.5">
                                  💬 {ord.notes}
                                </div>
                              )}
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-[10px] text-[#0B1D2C]/50 font-bold block uppercase">የሚከፈል</span>
                              <span className="text-xl sm:text-2xl font-black text-[#0B1D2C]">
                                ብር {ord.totalAmount.toLocaleString()}
                              </span>
                            </div>
                          </div>

                          {/* Order Settlement Controls */}
                          {isUnsettled ? (
                            <div className="grid grid-cols-3 gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => handleSettlePayLaterOrder(ord, 'cash')}
                                className="py-3 px-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md cursor-pointer"
                              >
                                <span>💵 ጥሬ ገንዘብ</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSettlePayLaterOrder(ord, 'transfer')}
                                className="py-3 px-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md cursor-pointer"
                              >
                                <span>📲 ዝውውር</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSettlePayLaterOrder(ord, 'pending')}
                                className="py-3 px-2 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md cursor-pointer"
                              >
                                <span>⏳ አዳሪ (ነገ)</span>
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between bg-[#f7f5f0] p-3 rounded-2xl border border-black/10">
                              <div className="flex items-center gap-2">
                                <span className={`px-3 py-1 rounded-xl text-xs font-black text-white shadow-xs ${
                                  ord.paymentMethod === 'cash' ? 'bg-emerald-700' : (ord.paymentMethod === 'transfer' ? 'bg-indigo-700' : 'bg-orange-700')
                                }`}>
                                  {ord.paymentMethod === 'cash' && '✅ በጥሬ ገንዘብ ተከፈለ (Cash 💵)'}
                                  {ord.paymentMethod === 'transfer' && '✅ በዝውውር ተከፈለ (Transfer 📲)'}
                                  {ord.paymentMethod === 'pending' && '✅ ወደ አዳሪ ተቀየረ (Credit ⏳)'}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleSettlePayLaterOrder(ord, 'pay_later')}
                                className="px-3 py-1 rounded-xl bg-stone-200 hover:bg-stone-300 text-[#0B1D2C] font-bold text-xs cursor-pointer transition-colors"
                              >
                                🔄 ቀይር (Edit)
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-white border-t border-[#0B1D2C]/10 flex items-center justify-between shrink-0">
                <span className="text-xs font-bold text-[#0B1D2C]/60">
                  ያልተከፈሉ ድምር: <strong>ብር {shiftStats.payLaterTotal.toLocaleString()}</strong>
                </span>

                <div className="flex items-center gap-2">
                  {unsettledPayLaterOrders.length === 0 && (
                    <button
                      onClick={() => {
                        setShowUnsettledModal(false);
                        setShowSummaryModal(true);
                      }}
                      className="px-5 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span>👉 ወደ ሸፍት ማጠቃለያ ፎርም ሂድ</span>
                    </button>
                  )}

                  <button
                    onClick={() => setShowUnsettledModal(false)}
                    className="px-6 py-2.5 rounded-2xl bg-[#0B1D2C] hover:bg-[#162E44] text-white font-black text-sm shadow-md transition-all cursor-pointer"
                  >
                    ተመለስ (Close)
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
