import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  ClipboardCheck, 
  Sun, 
  Moon, 
  Calendar, 
  User, 
  CheckCircle2, 
  AlertTriangle, 
  DollarSign, 
  Printer, 
  Download, 
  Plus, 
  Minus,
  Trash2,
  X, 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight, 
  RefreshCw,
  Search,
  Check,
  Clock,
  Sparkles,
  Lock,
  Unlock,
  Key,
  ShieldCheck,
  FileText,
  History,
  RotateCcw,
  BellRing,
  Sparkles as WandSparkles,
  LogOut,
  Edit3
} from 'lucide-react';
import { toEthiopianDateString, toEthiopianShortDate } from './BusinessManagement';
import WaiterPendingLedgerModal, { DEFAULT_WAITERS_LIST } from './WaiterPendingLedgerModal';
import ShiftSlipModal from './ShiftSlipModal';
import {
  aggregateChefOrders,
  compareChefVsIncomeSheet,
  toLocalIsoDate,
  getShiftDefaultWaiters,
  saveShiftDefaultWaiters,
  getWaiterPendingSummary,
  consolidateWaiterDebt
} from '../utils/reconciliationHelpers';
import { formatEtb, isFoodItemForBeu, computeBeuPrice, roundPricePrecision } from '../utils/beuHelpers';
import { dbService, isSupabaseConfigured } from '../lib/supabaseClient';

// Standard Maraki price per juice cup
export const DEFAULT_JUICE_PRICE = 170;

// Food Menu list for box assignment (incorporating authentic Maraki items & manual example dishes)
export const DEFAULT_RECONCILIATION_DISHES = [
  { id: 'sb', name: 'ስፔሻል በርገር', englishName: 'Special Burger', category: 'Sandwiches', price: 250 },
  { id: 'cs', name: 'ክለብ ሳንድዊች', englishName: 'Club Sandwich', category: 'Sandwiches', price: 200 },
  { id: 'm1', name: 'ማራኪ ኮምቦ ሳላድ', englishName: 'Maraki Combo Salad', category: 'Salad', price: 430 },
  { id: 'm2', name: 'ሳላድ', englishName: 'Salad', category: 'Salad', price: 320 },
  { id: 'm3', name: 'ፓስታ በሳላድ', englishName: 'Pasta with Salad', category: 'Pasta & Rice', price: 320 },
  { id: 'm4', name: 'ሩዝ በሳላድ', englishName: 'Rice with Salad', category: 'Pasta & Rice', price: 320 },
  { id: 'm5', name: 'ፓስታ በአትክልት', englishName: 'Pasta with Vegetables', category: 'Pasta & Rice', price: 320 },
  { id: 'm6', name: 'ሩዝ በአትክልት', englishName: 'Rice with Vegetables', category: 'Pasta & Rice', price: 320 },
  { id: 'm7', name: 'ፓስታ በእንቁላል', englishName: 'Pasta with Egg', category: 'Pasta & Rice', price: 320 },
  { id: 'm8', name: 'ሩዝ በእንቁላል', englishName: 'Rice with Egg', category: 'Pasta & Rice', price: 320 },
  { id: 'm9', name: 'እንቁላል ፍርፍር', englishName: 'Egg Firfir', category: 'Eggs & Firfir', price: 230 },
  { id: 'm10', name: 'እንቁላል ስልስ', englishName: 'Egg Sils', category: 'Eggs & Firfir', price: 230 },
  { id: 'm11', name: 'እንቁላል ሳንድዊች', englishName: 'Egg Sandwich', category: 'Sandwiches', price: 120 },
  { id: 'm12', name: 'አትክልት ሳንድዊች', englishName: 'Vegetable Sandwich', category: 'Sandwiches', price: 100 },
  { id: 'm13', name: 'ፍሩት ፓንች', englishName: 'Fruit Punch', category: 'Salad', price: 320 },
  { id: 'm14', name: 'ፍርፍር', englishName: 'Firfir', category: 'Eggs & Firfir', price: 200 },
  { id: 'm15', name: 'ፓስታ በስጎ', englishName: 'Pasta with Sugo', category: 'Pasta & Rice', price: 200 },
  { id: 'm16', name: 'ቴስቲሶያ', englishName: 'Tasty Soya', category: 'Eggs & Firfir', price: 200 }
];

export const EXPENSE_CATEGORIES = [
  'Fruit & Veg (ፍራፍሬና አትክልት)',
  'Dairy & Eggs (እንቁላልና ወተት)',
  'Bakery (ዳቦ)',
  'Packaging (ቦክስና ፌስታል)',
  'Cleaning & Supplies (ማጽጃና ዕቃዎች)',
  'Gas & Utilities (ጋዝ/መብራት)',
  'Transport (ትራንስፖርት)',
  'Repairs (ጥገና)',
  'Other (ሌላ ወጪ)'
];

function shiftGregorianIso(dateStr, deltaDays) {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + deltaDays);
  return toLocalIsoDate(d);
}

function getPrevShiftInfo(dateStr, shift) {
  if (shift === 'Night') return { date: dateStr, shift: 'Day' };
  return { date: shiftGregorianIso(dateStr, -1), shift: 'Night' };
}

function getNextShiftInfo(dateStr, shift) {
  if (shift === 'Day') return { date: dateStr, shift: 'Night' };
  return { date: shiftGregorianIso(dateStr, 1), shift: 'Day' };
}

function resolveCarryOverFromHistory(history = [], dateStr, shift) {
  const prev = getPrevShiftInfo(dateStr, shift);
  const prevSettlement = history.find(s => s.date === prev.date && s.shift === prev.shift);

  const savedCups = localStorage.getItem(`maraki_cups_carry_${prev.date}_${prev.shift}`);
  const savedBoxes = localStorage.getItem(`maraki_boxes_carry_${prev.date}_${prev.shift}`);

  const carriedCups =
    prevSettlement && prevSettlement.cupsLeft !== undefined
      ? Number(prevSettlement.cupsLeft)
      : savedCups !== null
        ? Number(savedCups)
        : null;

  const carriedBoxes =
    prevSettlement && prevSettlement.boxesLeft !== undefined
      ? Number(prevSettlement.boxesLeft)
      : savedBoxes !== null
        ? Number(savedBoxes)
        : null;

  return { prevDate: prev.date, prevShift: prev.shift, carriedCups, carriedBoxes };
}

export default function ShiftReconciliation({
  orders = [],
  waiters = [],
  foodMenu = [],
  standardJuicePrice,
  theme = 'light',
  onToggleTheme,
  onRefreshOrders,
  onUpdateOrder,
  onDeleteOrder,
  onBackToPortal,
  onSwitchToChef,
  onSwitchToOwner,
  onSwitchToOwnerPrices,
  onLockReconciliation,
  embeddedMode = false,
  onSavedSettlement
}) {
  const effectiveJuicePrice = useMemo(() => {
    if (standardJuicePrice && Number(standardJuicePrice) > 0) return Number(standardJuicePrice);
    const saved = Number(localStorage.getItem('maraki_standard_juice_price'));
    return saved > 0 ? saved : DEFAULT_JUICE_PRICE;
  }, [standardJuicePrice]);
  // 1. Shift View Mode: 'Day' | 'Night'
  const [selectedShift, setSelectedShift] = useState('Day');

  // 2. Date Selection (Synchronized Ethiopian & Local Date)
  const [selectedDate, setSelectedDate] = useState(() => {
    return toLocalIsoDate(new Date());
  });

  // 3. Stored Historical Settlements
  const [settlementsHistory, setSettlementsHistory] = useState(() => {
    const saved = localStorage.getItem('maraki_shift_settlements');
    return saved ? JSON.parse(saved) : [];
  });
  useEffect(() => {
    localStorage.setItem('maraki_shift_settlements', JSON.stringify(settlementsHistory));
    dbService.saveAppState('maraki_shift_settlements', settlementsHistory);
  }, [settlementsHistory]);

  // 4. Stored Waiter Pending Debts (synced with Supabase / localStorage)
  const [pendingDebts, setPendingDebts] = useState(() => {
    const saved = localStorage.getItem('maraki_waiter_pending_debts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });
  const prevPendingDebtsRef = useRef(pendingDebts);
  useEffect(() => {
    localStorage.setItem('maraki_waiter_pending_debts', JSON.stringify(pendingDebts));
    dbService.saveAppState('maraki_waiter_pending_debts', pendingDebts);
    dbService.syncAdariList(pendingDebts, prevPendingDebtsRef.current);
    prevPendingDebtsRef.current = pendingDebts;
  }, [pendingDebts]);

  // Modal state for full Pending Debts Ledger Page
  const [showPendingLedgerModal, setShowPendingLedgerModal] = useState(false);

  // Sync pending debts & settlements if updated elsewhere or via Supabase
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'maraki_waiter_pending_debts' && e.newValue) {
        try {
          setPendingDebts(JSON.parse(e.newValue));
        } catch (err) {
          console.error('Storage sync error:', err);
        }
      }
    };
    const handleRemoteSync = () => {
      try {
        const s = localStorage.getItem('maraki_shift_settlements');
        if (s) setSettlementsHistory(JSON.parse(s));
        const d = localStorage.getItem('maraki_waiter_pending_debts');
        if (d) {
          const parsed = JSON.parse(d);
          prevPendingDebtsRef.current = parsed;
          setPendingDebts(parsed);
        }
      } catch (err) {
        console.error('Remote sync error:', err);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('maraki-supabase-synced', handleRemoteSync);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('maraki-supabase-synced', handleRemoteSync);
    };
  }, []);

  // ==============================================================
  // SECTION 1 & 2: CARRY-OVER, CLEAN BLANK STATE & CLOSED-SHIFT LOCK
  // ==============================================================
  const carryOverInfo = useMemo(() => {
    return resolveCarryOverFromHistory(settlementsHistory, selectedDate, selectedShift);
  }, [settlementsHistory, selectedDate, selectedShift]);

  const currentSavedSettlement = useMemo(() => {
    return settlementsHistory.find(s => s.date === selectedDate && s.shift === selectedShift) || null;
  }, [settlementsHistory, selectedDate, selectedShift]);

  const [unlockedShiftIds, setUnlockedShiftIds] = useState({});
  const isShiftClosed = Boolean(currentSavedSettlement) && !unlockedShiftIds[currentSavedSettlement?.id];

  const [cupsGiven, setCupsGiven] = useState(() => {
    if (currentSavedSettlement && currentSavedSettlement.cupsGiven !== undefined) {
      return currentSavedSettlement.cupsGiven;
    }
    return carryOverInfo.carriedCups !== null ? carryOverInfo.carriedCups : '';
  });
  const [cupsLeft, setCupsLeft] = useState(() => {
    if (currentSavedSettlement && currentSavedSettlement.cupsLeft !== undefined) {
      return currentSavedSettlement.cupsLeft;
    }
    return '';
  });
  const [beuDeliveryCups, setBeuDeliveryCups] = useState(() => {
    if (currentSavedSettlement && currentSavedSettlement.beuDeliveryCups !== undefined) {
      return currentSavedSettlement.beuDeliveryCups;
    }
    return '';
  });

  // Safe Math: wait until both Given and Left are entered before calculating Sold
  const hasCupsEntered = cupsGiven !== '' && cupsLeft !== '';
  const juiceSold = hasCupsEntered ? Math.max(0, Number(cupsGiven) - Number(cupsLeft)) : 0;
  const inStoreJuiceSold = Math.max(0, juiceSold - Number(beuDeliveryCups || 0));
  const grossJuiceRevenue = juiceSold * effectiveJuicePrice;
  const beuDeliveryDeduction = Number(beuDeliveryCups || 0) * effectiveJuicePrice;

  // ==============================================================
  // SECTION 2: FOOD BOX RECONCILIATION ("Anti-Skimming Engine")
  // ==============================================================
  const [boxesGiven, setBoxesGiven] = useState(() => {
    if (currentSavedSettlement && currentSavedSettlement.boxesGiven !== undefined) {
      return currentSavedSettlement.boxesGiven;
    }
    return carryOverInfo.carriedBoxes !== null ? carryOverInfo.carriedBoxes : '';
  });
  const [boxesLeft, setBoxesLeft] = useState(() => {
    if (currentSavedSettlement && currentSavedSettlement.boxesLeft !== undefined) {
      return currentSavedSettlement.boxesLeft;
    }
    return '';
  });
  const hasBoxesEntered = boxesGiven !== '' && boxesLeft !== '';
  const targetFoodSold = hasBoxesEntered ? Math.max(0, Number(boxesGiven) - Number(boxesLeft)) : 0;

  const [activeFoodCategory, setActiveFoodCategory] = useState('All');
  const [foodAssignments, setFoodAssignments] = useState(() => {
    if (currentSavedSettlement && currentSavedSettlement.foodAssignments) {
      return currentSavedSettlement.foodAssignments;
    }
    return {};
  });
  const [hasManualFoodOverride, setHasManualFoodOverride] = useState(false);
  const [showAddFromMenu, setShowAddFromMenu] = useState(false);
  const [menuAddSearch, setMenuAddSearch] = useState('');
  const [editingChefOrder, setEditingChefOrder] = useState(null);
  const [isSavingChefOrderEdit, setIsSavingChefOrderEdit] = useState(false);
  const [dbFetchedOrders, setDbFetchedOrders] = useState(null);
  const [isSyncingDbOrders, setIsSyncingDbOrders] = useState(false);

  const fetchOrdersDirectlyFromDb = async () => {
    setIsSyncingDbOrders(true);
    try {
      if (isSupabaseConfigured) {
        const fresh = await dbService.fetchOrders();
        if (Array.isArray(fresh)) {
          setDbFetchedOrders(fresh);
          try {
            localStorage.setItem('maraki_chef_sent_orders', JSON.stringify(fresh));
          } catch (e) {}
        }
      }
      if (onRefreshOrders) {
        await onRefreshOrders();
      }
    } finally {
      setIsSyncingDbOrders(false);
    }
  };

  useEffect(() => {
    fetchOrdersDirectlyFromDb();
  }, [selectedDate, selectedShift]);

  // Resolve Chef Sent Orders (fresh DB orders > prop > localStorage)
  const resolvedOrders = useMemo(() => {
    if (Array.isArray(dbFetchedOrders)) {
      if (orders && orders.length > 0) {
        const merged = new Map();
        dbFetchedOrders.forEach(o => merged.set(o.id, o));
        orders.forEach(o => {
          if (!merged.has(o.id)) merged.set(o.id, o);
        });
        return Array.from(merged.values());
      }
      return dbFetchedOrders;
    }
    if (orders && orders.length > 0) return orders;
    try {
      const saved = localStorage.getItem('maraki_chef_sent_orders');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }, [dbFetchedOrders, orders]);

  // Merge foodMenu prop (or localStorage maraki_chef_food_menu_v2) with DEFAULT_RECONCILIATION_DISHES
  const dishesList = useMemo(() => {
    const map = new Map();
    DEFAULT_RECONCILIATION_DISHES.forEach(d => map.set(d.id, d));
    let resolvedMenu = Array.isArray(foodMenu) && foodMenu.length > 0 ? foodMenu : [];
    if (resolvedMenu.length === 0) {
      try {
        const saved = localStorage.getItem('maraki_chef_food_menu_v2');
        if (saved) resolvedMenu = JSON.parse(saved);
      } catch (e) {}
    }
    if (Array.isArray(resolvedMenu)) {
      resolvedMenu
        .filter(item => item.itemType !== 'juice' && item.containerType !== 'cup')
        .forEach(item => {
          map.set(item.id, {
            id: item.id,
            name: item.name,
            englishName: item.englishName || item.name,
            category: item.category || 'Other',
            price: Number(item.price || 0)
          });
        });
    }
    return Array.from(map.values());
  }, [foodMenu]);

  // Chef Orders Cross-Check Engine for selected Date + Shift
  const chefSummary = useMemo(() => {
    return aggregateChefOrders(resolvedOrders, selectedDate, selectedShift, dishesList);
  }, [resolvedOrders, selectedDate, selectedShift, dishesList]);

  const chefComparison = useMemo(() => {
    return compareChefVsIncomeSheet(chefSummary, foodAssignments, dishesList);
  }, [chefSummary, foodAssignments, dishesList]);

  const handleLoadFromChefOrders = (mode = 'all') => {
    setHasManualFoodOverride(false);
    if (!chefSummary || chefSummary.totalOrders === 0) {
      setFoodAssignments({});
      return;
    }
    const next = {};
    Object.entries(chefSummary.dishCounts).forEach(([key, info]) => {
      const qty = mode === 'takeaway' ? info.takeawayQty : info.qty;
      if (qty > 0) next[key] = qty;
    });
    setFoodAssignments(next);
  };

  const filteredDishes = useMemo(() => {
    const q = menuAddSearch.trim().toLowerCase();
    return dishesList.filter(d => {
      if (activeFoodCategory !== 'All' && d.category !== activeFoodCategory) return false;
      if (q) {
        const hay = `${d.name} ${d.englishName || ''} ${d.category || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [dishesList, activeFoodCategory, menuAddSearch]);

  const orderedAssignedDishes = useMemo(() => {
    return Object.entries(foodAssignments)
      .filter(([, qty]) => Number(qty) > 0)
      .map(([dishId, qty]) => {
        const dish = dishesList.find(d => d.id === dishId);
        const chefEntry = chefSummary?.dishCounts?.[dishId];
        return {
          id: dishId,
          name: dish?.name || chefEntry?.name || dishId,
          englishName: dish?.englishName || chefEntry?.englishName || '',
          category: dish?.category || 'Other',
          price: Number(dish?.price ?? chefEntry?.price ?? 0),
          qty: Number(qty || 0),
          fromChef: Boolean(chefEntry && chefEntry.qty > 0),
          chefQty: chefEntry?.qty || 0
        };
      })
      .sort((a, b) => Number(b.fromChef) - Number(a.fromChef) || b.qty - a.qty);
  }, [foodAssignments, dishesList, chefSummary]);

  const fullEditableMenuDishes = useMemo(() => {
    const map = new Map();
    DEFAULT_RECONCILIATION_DISHES.forEach(d => map.set(d.id, d));
    let resolvedMenu = Array.isArray(foodMenu) && foodMenu.length > 0 ? foodMenu : [];
    if (resolvedMenu.length === 0) {
      try {
        const saved = localStorage.getItem('maraki_chef_food_menu_v2');
        if (saved) resolvedMenu = JSON.parse(saved);
      } catch (e) {}
    }
    if (Array.isArray(resolvedMenu)) {
      resolvedMenu.forEach(item => {
        map.set(item.id, item);
      });
    }
    return Array.from(map.values());
  }, [foodMenu]);

  const availableEditWaiters = useMemo(() => {
    const set = new Set(DEFAULT_WAITERS_LIST);
    (waiters || []).forEach(w => {
      const name = typeof w === 'string' ? w : (w.fullName || w.amharic);
      if (name) set.add(name);
    });
    return Array.from(set);
  }, [waiters]);

  const openEditChefOrderModal = (ord) => {
    const isNight = (ord.shiftType || ord.shift || '').toLowerCase().includes('night');
    const isBeu = ord.channel === 'BEU Delivery' || ord.isBeuOrder;
    const isHome = !isBeu && (ord.orderType === 'Home' || ord.channel === 'In-Store Home');
    setEditingChefOrder({
      original: ord,
      id: ord.id,
      shift: isNight ? 'Night' : 'Day',
      serviceMode: isBeu ? 'BEU' : isHome ? 'Home' : 'Takeaway',
      beuOrderId: ord.beuOrderId || '',
      waiterName: ord.waiterName || (isBeu ? 'የቢዩ አሽከርካሪ (BEU Driver)' : 'ሀብታሙ (Habtamu)'),
      items: (ord.items || []).map(i => ({ ...i, qty: Number(i.qty || 1) })),
      addDishId: fullEditableMenuDishes[0]?.id || 'm1'
    });
  };

  const handleEditOrderItemQty = (idx, delta) => {
    setEditingChefOrder(prev => {
      if (!prev) return null;
      const nextItems = prev.items
        .map((it, i) => (i === idx ? { ...it, qty: Math.max(0, Number(it.qty || 0) + delta) } : it))
        .filter(it => it.qty > 0);
      return { ...prev, items: nextItems };
    });
  };

  const handleAddDishToEditingOrder = () => {
    if (!editingChefOrder) return;
    const dish = fullEditableMenuDishes.find(d => d.id === editingChefOrder.addDishId);
    if (!dish) return;
    setEditingChefOrder(prev => {
      if (!prev) return null;
      const existingIdx = prev.items.findIndex(i => i.id === dish.id);
      if (existingIdx >= 0) {
        return {
          ...prev,
          items: prev.items.map((it, idx) => idx === existingIdx ? { ...it, qty: Number(it.qty || 0) + 1 } : it)
        };
      }
      return {
        ...prev,
        items: [
          ...prev.items,
          {
            id: dish.id,
            name: dish.name,
            englishName: dish.englishName || dish.name,
            qty: 1,
            price: Number(dish.price || 0),
            basePrice: Number(dish.price || 0),
            homePrice: dish.homePrice ?? null
          }
        ]
      };
    });
  };

  const handleSaveEditedChefOrder = async (e) => {
    if (e) e.preventDefault();
    if (!editingChefOrder || editingChefOrder.items.length === 0) return;
    setIsSavingChefOrderEdit(true);
    try {
      const isBeu = editingChefOrder.serviceMode === 'BEU';
      const isHome = editingChefOrder.serviceMode === 'Home';
      const shiftLabel = editingChefOrder.shift === 'Night' ? 'Night Shift' : 'Day Shift';
      const channelLabel = isBeu ? 'BEU Delivery' : isHome ? 'In-Store Home' : 'In-Store Takeaway';
      const orderTypeLabel = isHome ? 'Home' : 'Takeaway';

      const recomputedItems = editingChefOrder.items.map(it => {
        const menuDish = fullEditableMenuDishes.find(d => d.id === it.id) || it;
        const baseFinal = Number(menuDish.price ?? it.basePrice ?? it.normalPrice ?? it.price ?? 0);
        const homeVal = menuDish.homePrice !== undefined && menuDish.homePrice !== null ? Number(menuDish.homePrice) : baseFinal;
        const isFood = isFoodItemForBeu(menuDish);
        let unitSoldPrice = baseFinal;
        let itemBeuApplied = false;
        if (isBeu && isFood) {
          unitSoldPrice = computeBeuPrice(baseFinal);
          itemBeuApplied = true;
        } else if (isHome) {
          unitSoldPrice = homeVal;
        }
        return {
          ...it,
          basePrice: baseFinal,
          homePrice: menuDish.homePrice ?? it.homePrice ?? null,
          price: unitSoldPrice,
          normalPrice: itemBeuApplied ? baseFinal : unitSoldPrice,
          beuDeductionPerUnit: itemBeuApplied ? roundPricePrecision(baseFinal - unitSoldPrice) : 0,
          beuDeductionPct: itemBeuApplied ? 15 : 0,
          isBeuItem: itemBeuApplied
        };
      });

      const hasBeuFood = recomputedItems.some(i => i.isBeuItem);
      const normalSubtotal = roundPricePrecision(
        recomputedItems.reduce((s, i) => s + Number(i.normalPrice ?? i.price ?? 0) * Number(i.qty || 0), 0)
      );
      const totalAmount = roundPricePrecision(
        recomputedItems.reduce((s, i) => s + Number(i.price || 0) * Number(i.qty || 0), 0)
      );
      const boxesCount = isHome ? 0 : recomputedItems.reduce((s, i) => s + Number(i.qty || 0), 0);
      const beuDeductionAmount = isBeu && hasBeuFood ? Math.max(0, roundPricePrecision(normalSubtotal - totalAmount)) : 0;

      const updatedOrder = {
        ...editingChefOrder.original,
        shiftType: editingChefOrder.shift,
        shift: shiftLabel,
        orderType: orderTypeLabel,
        channel: channelLabel,
        beuOrderId: isBeu ? editingChefOrder.beuOrderId.trim() : '',
        waiterName: editingChefOrder.waiterName.trim() || editingChefOrder.original.waiterName,
        paymentMethod: isBeu ? 'BEU Account' : 'Kitchen Dispatch',
        items: recomputedItems,
        boxesCount,
        boxesUsed: boxesCount,
        totalAmount,
        isBeuOrder: isBeu,
        beuDeductionPct: isBeu && hasBeuFood ? 15 : 0,
        normalSubtotal,
        beuDeductionAmount
      };

      setDbFetchedOrders(prev => {
        const baseList = Array.isArray(prev) ? prev : resolvedOrders;
        const next = baseList.map(o => (o.id === updatedOrder.id ? updatedOrder : o));
        try {
          localStorage.setItem('maraki_chef_sent_orders', JSON.stringify(next));
        } catch (err) {}
        return next;
      });
      if (onUpdateOrder) {
        await onUpdateOrder(updatedOrder);
      } else {
        await dbService.updateOrder(updatedOrder.id, updatedOrder);
      }
      setHasManualFoodOverride(false);
      setEditingChefOrder(null);
    } finally {
      setIsSavingChefOrderEdit(false);
    }
  };

  const handleDeleteEditedChefOrder = async () => {
    if (!editingChefOrder) return;
    if (!window.confirm('Delete this Chef order from database?')) return;
    const idToDelete = editingChefOrder.id;
    setIsSavingChefOrderEdit(true);
    try {
      setDbFetchedOrders(prev => {
        const baseList = Array.isArray(prev) ? prev : resolvedOrders;
        const next = baseList.filter(o => o.id !== idToDelete);
        try {
          localStorage.setItem('maraki_chef_sent_orders', JSON.stringify(next));
        } catch (err) {}
        return next;
      });
      if (onDeleteOrder) {
        await onDeleteOrder(idToDelete);
      } else {
        await dbService.deleteOrder(idToDelete);
      }
      setHasManualFoodOverride(false);
      setEditingChefOrder(null);
    } finally {
      setIsSavingChefOrderEdit(false);
    }
  };

  const updateDishQty = (dishId, delta) => {
    setHasManualFoodOverride(true);
    setFoodAssignments(prev => {
      const current = prev[dishId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[dishId];
        return copy;
      }
      return { ...prev, [dishId]: next };
    });
  };

  // Section 2 Math & Anti-Skimming Validation
  const totalAssignedBoxes = useMemo(() => {
    return Object.values(foodAssignments).reduce((sum, q) => sum + Number(q || 0), 0);
  }, [foodAssignments]);

  const totalFoodRevenue = useMemo(() => {
    return Object.entries(foodAssignments).reduce((sum, [dishId, qty]) => {
      const dish = dishesList.find(d => d.id === dishId);
      const price = dish ? dish.price : 0;
      return sum + (price * Number(qty || 0));
    }, 0);
  }, [foodAssignments, dishesList]);

  // Anti-Skimming Status: Balanced, Under-assigned, Over-assigned
  const boxDifference = totalAssignedBoxes - targetFoodSold;
  const isFoodBoxesBalanced = boxDifference === 0;
  const isUnderAssigned = boxDifference < 0;
  const isOverAssigned = boxDifference > 0;

  // ==============================================================
  // SECTION 3: PENDING PAYMENTS CREATION (Unpaid With Waiters)
  // Auto-assigned by Shift (Day -> Habtamu, Night -> Wende); Owner-locked
  // ==============================================================
  const [shiftDefaultWaiters, setShiftDefaultWaiters] = useState(() => getShiftDefaultWaiters());
  const [pendingWaiterName, setPendingWaiterName] = useState(() => {
    const defaults = getShiftDefaultWaiters();
    return currentSavedSettlement?.pendingWaiterName || defaults[selectedShift] || 'ሀብታሙ (Habtamu)';
  });
  const [waiterOverrideUnlocked, setWaiterOverrideUnlocked] = useState(false);
  const [showWaiterAuthModal, setShowWaiterAuthModal] = useState(false);
  const [waiterPinInput, setWaiterPinInput] = useState('');
  const [waiterPinError, setWaiterPinError] = useState('');
  const [waiterDraftName, setWaiterDraftName] = useState('');
  const [saveAsShiftDefault, setSaveAsShiftDefault] = useState(false);
  const [pendingJuiceCupsInput, setPendingJuiceCupsInput] = useState('');
  const [pendingFoodItems, setPendingFoodItems] = useState([]);
  const [selectedPendingDishId, setSelectedPendingDishId] = useState('m1');
  const [selectedPendingDishQty, setSelectedPendingDishQty] = useState(1);
  const [addPackModal, setAddPackModal] = useState(null); // null | { type: 'cups' | 'boxes', qty: '50' }

  const openAddPackModal = (type) => {
    setAddPackModal({ type, qty: '50' });
  };

  const handleConfirmAddPack = (e) => {
    if (e) e.preventDefault();
    if (!addPackModal) return;
    const addAmt = Number(addPackModal.qty);
    if (isNaN(addAmt) || addAmt <= 0) return;
    if (addPackModal.type === 'cups') {
      setCupsGiven(prev => String(Number(prev || 0) + addAmt));
    } else {
      setBoxesGiven(prev => String(Number(prev || 0) + addAmt));
    }
    setAddPackModal(null);
  };

  // Sync shift default waiters if updated in Owner Settings (same-tab or cross-tab)
  useEffect(() => {
    const syncDefaults = () => {
      const nextDefaults = getShiftDefaultWaiters();
      setShiftDefaultWaiters(nextDefaults);
      if (!currentSavedSettlement && !waiterOverrideUnlocked) {
        setPendingWaiterName(nextDefaults[selectedShift]);
      }
    };
    const onStorage = (e) => {
      if (e.key === 'maraki_shift_default_waiters_v1') {
        syncDefaults();
      }
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('maraki-shift-waiters-updated', syncDefaults);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('maraki-shift-waiters-updated', syncDefaults);
    };
  }, [selectedShift, currentSavedSettlement, waiterOverrideUnlocked]);

  const handleOpenWaiterOwnerModal = () => {
    setWaiterDraftName(pendingWaiterName);
    setWaiterPinInput('');
    setWaiterPinError('');
    setSaveAsShiftDefault(false);
    setShowWaiterAuthModal(true);
  };

  const handleConfirmWaiterChange = (e) => {
    e.preventDefault();
    const ownerPass = localStorage.getItem('maraki_owner_password') || '1234';
    if (!embeddedMode && waiterPinInput.trim() !== ownerPass) {
      setWaiterPinError('Incorrect Owner Password. Only the Owner can change the waiter.');
      return;
    }
    const cleanName = waiterDraftName.trim();
    if (!cleanName) return;

    setPendingWaiterName(cleanName);
    setWaiterOverrideUnlocked(true);
    if (saveAsShiftDefault) {
      const updated = saveShiftDefaultWaiters({
        ...shiftDefaultWaiters,
        [selectedShift]: cleanName
      });
      setShiftDefaultWaiters(updated);
    }
    setShowWaiterAuthModal(false);
  };

  const handleAddPendingFoodItem = (e) => {
    if (e) e.preventDefault();
    const dish = dishesList.find(d => d.id === selectedPendingDishId);
    if (!dish) return;
    const qty = Math.max(1, Number(selectedPendingDishQty) || 1);

    setPendingFoodItems(prev => {
      const existing = prev.find(item => item.dishId === dish.id);
      if (existing) {
        return prev.map(item => item.dishId === dish.id ? { ...item, qty: item.qty + qty } : item);
      }
      return [
        ...prev,
        {
          id: `pitem-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          dishId: dish.id,
          name: `${dish.name} (${dish.englishName})`,
          qty: qty,
          price: dish.price
        }
      ];
    });
    setSelectedPendingDishQty(1);
  };

  const handleUpdatePendingFoodQty = (dishId, delta) => {
    setPendingFoodItems(prev => {
      return prev
        .map(item => {
          if (item.dishId === dishId) {
            const nextQty = item.qty + delta;
            return nextQty > 0 ? { ...item, qty: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const handleRemovePendingFoodItem = (dishId) => {
    setPendingFoodItems(prev => prev.filter(item => item.dishId !== dishId));
  };

  const totalPendingFoodBoxes = useMemo(() => {
    return pendingFoodItems.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  }, [pendingFoodItems]);

  const totalPendingFoodAmount = useMemo(() => {
    return pendingFoodItems.reduce((sum, item) => sum + ((Number(item.qty) || 0) * (Number(item.price) || 0)), 0);
  }, [pendingFoodItems]);

  const pendingJuiceAmount = (Number(pendingJuiceCupsInput) || 0) * effectiveJuicePrice;
  const deductedPendingDebt = pendingJuiceAmount + totalPendingFoodAmount;

  // ==============================================================
  // SECTION 4: RECOVERING PENDING PAYMENTS FROM WAITERS
  // ==============================================================
  // Selection map: { debtId: { selected: boolean, unitsToRecover: number } }
  // Connected dynamically to the pending page ledger & filtered by Day / Night / All.
  const [recoverySelections, setRecoverySelections] = useState({});
  const [recoveryFilterMode, setRecoveryFilterMode] = useState(selectedShift);

  useEffect(() => {
    setRecoveryFilterMode(selectedShift);
  }, [selectedShift]);

  const recoveryShiftStats = useMemo(() => {
    const allPending = pendingDebts.filter(d => d && d.status === 'pending');
    const dayPending = allPending.filter(d => (d.shift || 'Day') === 'Day');
    const nightPending = allPending.filter(d => (d.shift || 'Day') === 'Night');
    return {
      dayCount: dayPending.length,
      dayAmount: dayPending.reduce((s, d) => s + Number(d.remainingAmount || 0), 0),
      nightCount: nightPending.length,
      nightAmount: nightPending.reduce((s, d) => s + Number(d.remainingAmount || 0), 0),
      allCount: allPending.length,
      allAmount: allPending.reduce((s, d) => s + Number(d.remainingAmount || 0), 0)
    };
  }, [pendingDebts]);

  const activeDebtsForShift = useMemo(() => {
    return pendingDebts.filter(d => {
      if (!d || d.status !== 'pending') return false;
      if (recoveryFilterMode === 'All') return true;
      return (d.shift || 'Day') === recoveryFilterMode;
    });
  }, [pendingDebts, recoveryFilterMode]);

  const otherShiftPendingCount = useMemo(() => {
    const otherShift = selectedShift === 'Day' ? 'Night' : 'Day';
    return pendingDebts.filter(d => d && d.status === 'pending' && (d.shift || 'Day') === otherShift).length;
  }, [pendingDebts, selectedShift]);

  const existingWaiterDebitSummary = useMemo(() => {
    return getWaiterPendingSummary(pendingDebts, pendingWaiterName, selectedShift);
  }, [pendingDebts, pendingWaiterName, selectedShift]);

  const toggleDebtSelection = (debtId) => {
    const debt = pendingDebts.find(d => d.id === debtId);
    if (!debt) return;
    setRecoverySelections(prev => {
      const cur = prev[debtId];
      if (cur && cur.selected) {
        const copy = { ...prev };
        delete copy[debtId];
        return copy;
      }
      return {
        ...prev,
        [debtId]: { selected: true, unitsToRecover: debt.remainingUnits }
      };
    });
  };

  const updateDebtUnitsToRecover = (debtId, delta) => {
    const debt = pendingDebts.find(d => d.id === debtId);
    if (!debt) return;
    const step = Number(debt.unitPrice) === 1 ? delta * 50 : delta;
    setRecoverySelections(prev => {
      const cur = prev[debtId] || { selected: true, unitsToRecover: debt.remainingUnits };
      const next = Math.max(1, Math.min(debt.remainingUnits, cur.unitsToRecover + step));
      return {
        ...prev,
        [debtId]: { selected: true, unitsToRecover: next }
      };
    });
  };

  const setExactDebtRecoverUnits = (debtId, value) => {
    const debt = pendingDebts.find(d => d.id === debtId);
    if (!debt) return;
    const next = Math.max(1, Math.min(debt.remainingUnits, Number(value) || 1));
    setRecoverySelections(prev => ({
      ...prev,
      [debtId]: { selected: true, unitsToRecover: next }
    }));
  };

  const recoveredCashAdded = useMemo(() => {
    let sum = 0;
    Object.entries(recoverySelections).forEach(([debtId, info]) => {
      if (!info.selected) return;
      const debt = pendingDebts.find(d => d.id === debtId && d.status === 'pending');
      if (debt) {
        const units = Math.min(debt.remainingUnits, Math.max(1, Number(info.unitsToRecover) || 1));
        sum += units * debt.unitPrice;
      }
    });
    return sum;
  }, [recoverySelections, pendingDebts]);

  // ==============================================================
  // SECTION 5: DAILY OPERATING EXPENSES
  // ==============================================================
  const [dailyExpenses, setDailyExpenses] = useState(() => {
    return currentSavedSettlement?.dailyExpenses ? [...currentSavedSettlement.dailyExpenses] : [];
  });
  const [newExpName, setNewExpName] = useState('');
  const [newExpCategory, setNewExpCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [newExpAmount, setNewExpAmount] = useState('');

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!newExpName.trim() || !newExpAmount) return;
    const newEntry = {
      id: `exp-${Date.now()}`,
      name: newExpName.trim(),
      category: newExpCategory,
      amount: Number(newExpAmount) || 0
    };
    setDailyExpenses(prev => [...prev, newEntry]);
    setNewExpName('');
    setNewExpAmount('');
  };

  const handleRemoveExpense = (id) => {
    setDailyExpenses(prev => prev.filter(e => e.id !== id));
  };

  const totalDailyExpenses = useMemo(() => {
    return dailyExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }, [dailyExpenses]);

  // ==============================================================
  // SECTION 6: MANUAL BANK & TELEBIRR TRANSFERS (ONE-BY-ONE INPUT)
  // ==============================================================
  const [bankTransfers, setBankTransfers] = useState(() => {
    if (currentSavedSettlement?.bankTransfers) {
      return [...currentSavedSettlement.bankTransfers];
    }
    const saved = localStorage.getItem('maraki_shift_manual_transfers');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.filter(t => t.refNumber !== 'FT248902891' && t.id !== 'txn-1');
      } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    if (!isShiftClosed) {
      localStorage.setItem('maraki_shift_manual_transfers', JSON.stringify(bankTransfers));
      dbService.saveAppState('maraki_shift_manual_transfers', bankTransfers);
    }
  }, [bankTransfers, isShiftClosed]);

  // Unified Shift Switch / Reset Effect:
  // - Closed shift: load exact saved record
  // - New open shift: carry over ONLY Cups Left & Boxes Left from previous shift, blank EVERYTHING else!
  useEffect(() => {
    const existing = settlementsHistory.find(s => s.date === selectedDate && s.shift === selectedShift);
    if (existing) {
      setCupsGiven(existing.cupsGiven !== undefined ? existing.cupsGiven : '');
      setCupsLeft(existing.cupsLeft !== undefined ? existing.cupsLeft : '');
      setBeuDeliveryCups(existing.beuDeliveryCups !== undefined && existing.beuDeliveryCups !== 0 ? existing.beuDeliveryCups : '');
      setBoxesGiven(existing.boxesGiven !== undefined ? existing.boxesGiven : '');
      setBoxesLeft(existing.boxesLeft !== undefined ? existing.boxesLeft : '');
      setFoodAssignments(existing.foodAssignments ? { ...existing.foodAssignments } : {});
      setPendingJuiceCupsInput(existing.pendingJuiceCups ? existing.pendingJuiceCups : '');
      setPendingFoodItems(existing.pendingFoodItems ? [...existing.pendingFoodItems] : []);
      if (existing.pendingWaiterName) setPendingWaiterName(existing.pendingWaiterName);
      setDailyExpenses(existing.dailyExpenses ? [...existing.dailyExpenses] : []);
      setBankTransfers(existing.bankTransfers ? [...existing.bankTransfers] : []);
      setRecoverySelections({});
    } else {
      const carry = resolveCarryOverFromHistory(settlementsHistory, selectedDate, selectedShift);
      setCupsGiven(carry.carriedCups !== null ? carry.carriedCups : '');
      setCupsLeft('');
      setBeuDeliveryCups('');
      setBoxesGiven(carry.carriedBoxes !== null ? carry.carriedBoxes : '');
      setBoxesLeft('');
      setFoodAssignments({});
      setPendingJuiceCupsInput('');
      setPendingFoodItems([]);
      const freshDefaults = getShiftDefaultWaiters();
      setShiftDefaultWaiters(freshDefaults);
      setPendingWaiterName(freshDefaults[selectedShift] || (selectedShift === 'Night' ? 'ወንዴ (Wende)' : 'ሀብታሙ (Habtamu)'));
      setWaiterOverrideUnlocked(false);
      setHasManualFoodOverride(false);
      setRecoverySelections({});
      setDailyExpenses([]);
      setBankTransfers([]);
      localStorage.removeItem('maraki_shift_manual_transfers');
    }
  }, [selectedDate, selectedShift]);

  // If a closed settlement arrives asynchronously from Supabase after initial render, hydrate it
  useEffect(() => {
    if (!currentSavedSettlement || unlockedShiftIds[currentSavedSettlement.id]) return;
    setCupsGiven(currentSavedSettlement.cupsGiven !== undefined ? currentSavedSettlement.cupsGiven : '');
    setCupsLeft(currentSavedSettlement.cupsLeft !== undefined ? currentSavedSettlement.cupsLeft : '');
    setBeuDeliveryCups(currentSavedSettlement.beuDeliveryCups !== undefined && currentSavedSettlement.beuDeliveryCups !== 0 ? currentSavedSettlement.beuDeliveryCups : '');
    setBoxesGiven(currentSavedSettlement.boxesGiven !== undefined ? currentSavedSettlement.boxesGiven : '');
    setBoxesLeft(currentSavedSettlement.boxesLeft !== undefined ? currentSavedSettlement.boxesLeft : '');
    setFoodAssignments(currentSavedSettlement.foodAssignments ? { ...currentSavedSettlement.foodAssignments } : {});
    setPendingJuiceCupsInput(currentSavedSettlement.pendingJuiceCups ? currentSavedSettlement.pendingJuiceCups : '');
    setPendingFoodItems(currentSavedSettlement.pendingFoodItems ? [...currentSavedSettlement.pendingFoodItems] : []);
    if (currentSavedSettlement.pendingWaiterName) setPendingWaiterName(currentSavedSettlement.pendingWaiterName);
    if (currentSavedSettlement.dailyExpenses) setDailyExpenses([...currentSavedSettlement.dailyExpenses]);
    if (currentSavedSettlement.bankTransfers) setBankTransfers([...currentSavedSettlement.bankTransfers]);
  }, [currentSavedSettlement?.id, currentSavedSettlement?.savedAt]);

  // Automatically populate foodAssignments directly from Chef POS DB orders for open shifts
  // Placed after the [selectedDate, selectedShift] reset effect so it populates cleanly after shift switches
  useEffect(() => {
    if (isShiftClosed || currentSavedSettlement || hasManualFoodOverride) return;
    const next = {};
    if (chefSummary && chefSummary.totalOrders > 0) {
      const preferTakeaway = chefSummary.takeawayBoxes > 0;
      Object.entries(chefSummary.dishCounts || {}).forEach(([key, info]) => {
        const qty = preferTakeaway ? info.takeawayQty : info.qty;
        if (qty > 0) next[key] = qty;
      });
    }
    setFoodAssignments(next);
  }, [chefSummary, selectedDate, selectedShift, isShiftClosed, currentSavedSettlement, hasManualFoodOverride]);

  const [newTxnAmount, setNewTxnAmount] = useState('');
  const [newTxnChannel, setNewTxnChannel] = useState('Telebirr (ቴሌብር)');

  const handleAddTransfer = (e) => {
    if (e) e.preventDefault();
    const amt = Number(newTxnAmount);
    if (!amt || amt <= 0) return;

    const newEntry = {
      id: `txn-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      channel: newTxnChannel,
      amount: amt,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setBankTransfers(prev => [...prev, newEntry]);
    setNewTxnAmount('');
  };

  const handleRemoveTransfer = (id) => {
    setBankTransfers(prev => prev.filter(t => t.id !== id));
  };

  const handleClearAllTransfers = () => {
    if (window.confirm('ሁሉንም የተመዘገቡ የባንክና ቴሌብር ዝውውሮች ማጽዳት ይፈልጋሉ? (Clear all transfers?)')) {
      setBankTransfers([]);
    }
  };

  const totalBankTransfers = useMemo(() => {
    return bankTransfers.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [bankTransfers]);

  // ==============================================================
  // SECTION 7: FINAL PHYSICAL CASH IN DRAWER CALCULATION
  // ==============================================================
  // Formula: Total Gross Sales - beU - Expenses + Recovered - Pending - Transfers
  const totalGrossSales = grossJuiceRevenue + totalFoodRevenue;
  const physicalCashInDrawer = totalGrossSales - beuDeliveryDeduction - totalDailyExpenses + recoveredCashAdded - deductedPendingDebt - totalBankTransfers;

  // ==============================================================
  // SAVE SETTLEMENT, SHIFT CLOSE LOCK & OPTION A AUTO-ADVANCE
  // ==============================================================
  const [activePrintTicket, setActivePrintTicket] = useState(null);
  const [isPostSaveSlip, setIsPostSaveSlip] = useState(false);
  const [postSaveNextShift, setPostSaveNextShift] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [saveSuccessBanner, setSaveSuccessBanner] = useState(false);
  const [advanceNotice, setAdvanceNotice] = useState('');

  const handleUnlockClosedShift = () => {
    if (!currentSavedSettlement) return;
    const ownerPass = localStorage.getItem('maraki_owner_password') || '1234';
    const entered = window.prompt('🔒 This shift is closed. Enter Owner Password to unlock & edit:');
    if (entered === ownerPass) {
      setUnlockedShiftIds(prev => ({ ...prev, [currentSavedSettlement.id]: true }));
    } else if (entered !== null) {
      window.alert('Incorrect Owner Password.');
    }
  };

  const handleSaveSettlement = () => {
    if (!hasBoxesEntered || !isFoodBoxesBalanced || isShiftClosed) return;

    if (chefComparison.hasMismatch) {
      const proceed = window.confirm(
        `🚨 RED ALARM: Waiter/Income Sheet total food (${chefComparison.incomeSheetTotal}) does NOT match Chef Sent Orders (${chefComparison.chefTotalFood} total / ${chefComparison.chefTakeawayBoxes} takeaway boxes).\n\n` +
        `Click OK to SAVE ANYWAY and send a RED MISMATCH ALARM to the Owner Dashboard, or Cancel to review and fix it first.`
      );
      if (!proceed) return;
    }

    const settlementId = `set-${selectedDate}-${selectedShift}`;
    const newRecord = {
      id: settlementId,
      date: selectedDate,
      shift: selectedShift,
      cupsGiven: Number(cupsGiven) || 0,
      cupsLeft: Number(cupsLeft) || 0,
      juiceSold,
      inStoreJuiceSold,
      beuDeliveryCups: Number(beuDeliveryCups) || 0,
      grossJuiceRevenue,
      beuDeliveryDeduction,
      boxesGiven: Number(boxesGiven) || 0,
      boxesLeft: Number(boxesLeft) || 0,
      targetFoodSold,
      assignedBoxes: totalAssignedBoxes,
      foodAssignments: { ...foodAssignments },
      totalFoodRevenue,
      totalGrossSales,
      chefAudit: {
        hasChefOrders: chefComparison.hasChefOrders,
        chefOrdersCount: chefSummary.totalOrders,
        chefTakeawayBoxes: chefComparison.chefTakeawayBoxes,
        chefHomeDishes: chefComparison.chefHomeDishes,
        chefTotalFood: chefComparison.chefTotalFood,
        incomeSheetTotal: chefComparison.incomeSheetTotal,
        hasMismatch: chefComparison.hasMismatch,
        hasDishTypeVariance: chefComparison.hasDishTypeVariance,
        discrepancyCount: chefComparison.discrepancyCount,
        discrepancyETB: chefComparison.discrepancyETB,
        dishDiffs: chefComparison.dishDiffs
      },
      pendingJuiceCups: Number(pendingJuiceCupsInput) || 0,
      pendingFoodBoxes: totalPendingFoodBoxes,
      pendingFoodItems: [...pendingFoodItems],
      pendingFoodAmount: totalPendingFoodAmount,
      pendingWaiterName,
      deductedPendingDebt,
      recoveredCashAdded,
      dailyExpenses: [...dailyExpenses],
      totalDailyExpenses,
      bankTransfers: [...bankTransfers],
      totalBankTransfers,
      physicalCashInDrawer,
      status: 'closed',
      savedAt: new Date().toISOString()
    };

    // Save BOTH carry-over Cups Left AND Boxes Left for the next shift (Day->Night or Night->Next Day)
    localStorage.setItem(`maraki_cups_carry_${selectedDate}_${selectedShift}`, (Number(cupsLeft) || 0).toString());
    localStorage.setItem(`maraki_boxes_carry_${selectedDate}_${selectedShift}`, (Number(boxesLeft) || 0).toString());
    dbService.saveAppState(`maraki_cups_carry_${selectedDate}_${selectedShift}`, Number(cupsLeft) || 0);
    dbService.saveAppState(`maraki_boxes_carry_${selectedDate}_${selectedShift}`, Number(boxesLeft) || 0);
    dbService.upsertPackagingAudit(newRecord);

    // Update Settlements History & re-lock if unlocked
    setSettlementsHistory(prev => {
      const filtered = prev.filter(s => s.id !== settlementId);
      return [newRecord, ...filtered];
    });
    setUnlockedShiftIds(prev => {
      const next = { ...prev };
      delete next[settlementId];
      return next;
    });
    if (onSavedSettlement) {
      onSavedSettlement(newRecord);
    }

    // Clear active manual transfers draft now that it's archived inside newRecord
    localStorage.removeItem('maraki_shift_manual_transfers');
    dbService.deleteAppState('maraki_shift_manual_transfers');

    // Update Pending Debts atomically:
    // 1. Apply Section 4 recoveries first
    // 2. Stack/consolidate any new Section 3 debit onto that waiter's existing pending entry (no duplicate daily entry!)
    setPendingDebts(prev => {
      let updatedList = prev.map(d => {
        const sel = recoverySelections[d.id];
        if (sel && sel.selected) {
          const remUnits = Math.max(0, Number(d.remainingUnits) - Number(sel.unitsToRecover || 0));
          const remAmt = remUnits * Number(d.unitPrice || 1);
          return {
            ...d,
            remainingUnits: remUnits,
            remainingAmount: remAmt,
            status: remUnits === 0 ? 'completed' : 'pending',
            settledAt: remUnits === 0 ? new Date().toISOString() : d.settledAt
          };
        }
        return d;
      });

      if (deductedPendingDebt > 0) {
        const nowIso = new Date().toISOString();
        pendingFoodItems.forEach((item, idx) => {
          if (item.qty > 0) {
            updatedList = consolidateWaiterDebt(updatedList, {
              id: `deb-${Date.now()}-food-${idx}`,
              waiterName: pendingWaiterName,
              itemType: 'food',
              dishId: item.dishId,
              dishName: item.name,
              unitPrice: item.price,
              totalUnits: item.qty,
              remainingUnits: item.qty,
              totalAmount: item.qty * item.price,
              remainingAmount: item.qty * item.price,
              shift: selectedShift,
              date: selectedDate,
              createdAt: nowIso,
              status: 'pending'
            });
          }
        });

        if (Number(pendingJuiceCupsInput) > 0) {
          updatedList = consolidateWaiterDebt(updatedList, {
            id: `deb-${Date.now()}-juice`,
            waiterName: pendingWaiterName,
            itemType: 'juice',
            dishId: 'juice-cup',
            dishName: 'Juice Cups (የጁስ ኩባያዎች)',
            unitPrice: effectiveJuicePrice,
            totalUnits: Number(pendingJuiceCupsInput),
            remainingUnits: Number(pendingJuiceCupsInput),
            totalAmount: Number(pendingJuiceCupsInput) * effectiveJuicePrice,
            remainingAmount: Number(pendingJuiceCupsInput) * effectiveJuicePrice,
            shift: selectedShift,
            date: selectedDate,
            createdAt: nowIso,
            status: 'pending'
          });
        }
      }

      return updatedList;
    });

    // Reset recovery selections
    setRecoverySelections({});

    const nextTarget = getNextShiftInfo(selectedDate, selectedShift);
    setPostSaveNextShift(nextTarget);
    setIsPostSaveSlip(true);
    setActivePrintTicket(newRecord);
    setSaveSuccessBanner(true);
    setTimeout(() => setSaveSuccessBanner(false), 4000);
  };

  // Option A: When clicking Done after finishing shift, close slip, lock finished shift,
  // advance to next shift, carry over ONLY Cups Left & Boxes Left, and blank everything else!
  const handleDoneFromSlip = () => {
    setActivePrintTicket(null);
    if (isPostSaveSlip && postSaveNextShift) {
      const target = postSaveNextShift;
      setIsPostSaveSlip(false);
      setPostSaveNextShift(null);
      setSelectedDate(target.date);
      setSelectedShift(target.shift);
      setAdvanceNotice(
        `🔒 Previous shift closed & saved! Switched to ${target.shift} Shift (${target.date}) with carried-over Cups & Boxes only.`
      );
      setTimeout(() => setAdvanceNotice(''), 6000);
    } else {
      setIsPostSaveSlip(false);
    }
  };

  // Helper: Date shift
  const handleShiftDate = (days) => {
    const cur = new Date(selectedDate);
    cur.setDate(cur.getDate() + days);
    setSelectedDate(cur.toISOString().split('T')[0]);
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    let csv = "Date,Shift,Gross Juice,beU Deduct,Food Sales,Total Sales,Pending Deduct,Recovered,Expenses,Bank Transfers,Physical Cash\n";
    settlementsHistory.forEach(s => {
      csv += `${s.date},${s.shift},${s.grossJuiceRevenue},${s.beuDeliveryDeduction},${s.totalFoodRevenue},${s.totalGrossSales},${s.deductedPendingDebt},${s.recoveredCashAdded},${s.totalDailyExpenses},${s.totalBankTransfers},${s.physicalCashInDrawer}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maraki_shift_settlements_${selectedDate}.csv`;
    a.click();
  };

  return (
    <div className={embeddedMode ? 'bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 pb-24 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden font-sans antialiased' : 'min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 pb-28 selection:bg-emerald-600 selection:text-white font-sans antialiased'}>
      
      {/* ============================================================== */}
      {/* 1. TOP HEADER & SHIFT / DATE NAVIGATION                        */}
      {/* ============================================================== */}
      <header className={`bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 ${embeddedMode ? 'rounded-t-3xl' : 'sticky top-0 z-40'} shadow-sm`}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          
          {/* Brand & Manual Module Indicator */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-base sm:text-lg tracking-tight">
                  DAILY INCOME SHEET
                </h1>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 px-2 py-0.5 rounded-full">
                  የፈረቃ ገቢ ማጠቃለያ
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                Anti-Skimming Settlement Engine & Drawer Cash Lock
              </p>
            </div>
          </div>

          {/* Quick Station Actions, History & Waiter Debts Ledger */}
          <div className="flex items-center gap-2">
            
            {/* Waiter Pending Debts Ledger Button */}
            <button
              type="button"
              onClick={() => setShowPendingLedgerModal(true)}
              className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-all shadow-xs active:scale-95"
              title="Waiter Pending Debts Ledger"
            >
              <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Waiter Debts</span>
              <span className="text-[10px] bg-emerald-600 px-1.5 py-0.2 rounded-full text-white">
                {activeDebtsForShift.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowHistoryModal(true)}
              className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black flex items-center gap-1 border border-slate-200 dark:border-slate-700 transition-all shadow-xs"
              title="Shift Settlements History"
            >
              <History className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Shift History</span>
              <span className="text-[10px] bg-emerald-600 px-1.5 py-0.2 rounded-full text-white">
                {settlementsHistory.length}
              </span>
            </button>

            {onToggleTheme && !embeddedMode && (
              <button
                type="button"
                onClick={onToggleTheme}
                className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 transition-all"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              </button>
            )}

            {onBackToPortal && !embeddedMode && (
              <button
                type="button"
                onClick={onBackToPortal}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            )}
          </div>

        </div>

        {/* Date Navigator & Shift Toggle (☀️ Day vs 🌙 Night) */}
        <div className="bg-white/95 backdrop-blur-md border-b border-emerald-100 px-4 py-2 text-slate-800">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
            
            {/* Ethiopian Date Navigator */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleShiftDate(-1)}
                className="p-1.5 bg-slate-100 hover:bg-emerald-50 rounded-xl text-slate-700 transition-colors"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-black text-emerald-900">
                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                <span>{toEthiopianDateString(selectedDate)}</span>
                <span className="text-[10px] text-slate-400 font-bold">({selectedDate})</span>
              </div>

              <button
                type="button"
                onClick={() => handleShiftDate(1)}
                className="p-1.5 bg-slate-100 hover:bg-emerald-50 rounded-xl text-slate-700 transition-colors"
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setSelectedDate(toLocalIsoDate(new Date()))}
                className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 text-[11px] font-bold text-slate-700 rounded-xl transition-colors"
              >
                Today
              </button>
            </div>

            {/* Shift Filter: ( ☀️ Day ) [ 🌙 Night ] */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedShift('Day')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                  selectedShift === 'Day'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>☀️ Day (ቀን ፈረቃ)</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedShift('Night')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                  selectedShift === 'Night'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>🌙 Night (ማታ ፈረቃ)</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Save Success / Auto-Advance Notice Banners */}
      {advanceNotice && (
        <div className="max-w-6xl mx-auto px-4 mt-3">
          <div className="bg-emerald-50 border-2 border-emerald-400 text-emerald-950 px-4 py-3 rounded-2xl text-xs font-black flex items-center justify-between gap-2 shadow-sm">
            <span>{advanceNotice}</span>
            <button type="button" onClick={() => setAdvanceNotice('')} className="text-emerald-700 hover:text-emerald-950">✕</button>
          </div>
        </div>
      )}

      {saveSuccessBanner && (
        <div className="max-w-6xl mx-auto px-4 mt-3">
          <div className="bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-2xl text-xs font-black flex items-center justify-between shadow-lg animate-in fade-in">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>የፈረቃው ሂሳብ ሙሉ በሙሉ ተዘግቶ በሲስተሙ ተመዝግቧል! (Shift Settlement Saved & Closed)</span>
            </span>
            <button 
              type="button"
              onClick={() => { setIsPostSaveSlip(false); setActivePrintTicket(settlementsHistory[0]); }}
              className="underline text-emerald-200 hover:text-white"
            >
              View Slip
            </button>
          </div>
        </div>
      )}

      {/* Closed Shift Lock Banner */}
      {isShiftClosed && currentSavedSettlement && (
        <div className="max-w-6xl mx-auto px-4 mt-3">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-4 py-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-500/30 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </span>
              <div>
                <p className="text-xs sm:text-sm font-black">
                  {selectedShift} Shift ({selectedDate}) Is Closed & Saved
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-300 font-bold">
                  Drawer Cash: {currentSavedSettlement.physicalCashInDrawer?.toLocaleString()} ETB • Carry-over saved for next shift
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => { setIsPostSaveSlip(false); setActivePrintTicket(currentSavedSettlement); }}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-800 dark:text-white text-xs font-black"
              >
                View / Share Slip
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = getNextShiftInfo(selectedDate, selectedShift);
                  setSelectedDate(next.date);
                  setSelectedShift(next.shift);
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black"
              >
                Next Open Shift →
              </button>
              <button
                type="button"
                onClick={handleUnlockClosedShift}
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/30 text-xs font-black"
              >
                🔓 Owner Unlock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content: 7 Progressive Settlement Cards */}
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* ============================================================== */}
        {/* CARD 1: 🥤 JUICE CUPS (170 ETB / cup) & beU Delivery            */}
        {/* ============================================================== */}
        <section className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-100 shadow-md shadow-emerald-900/5 space-y-4 text-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100/70 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-lg">
                🥤
              </span>
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900">
                  1. JUICE CUPS INVENTORY & beU DELIVERY
                </h2>
                <p className="text-[11px] text-slate-500 font-bold">
                  Juice cups audit and beU digital order deductions (Standard: {effectiveJuicePrice} ETB / cup)
                  {onSwitchToOwnerPrices && (
                    <button
                      type="button"
                      onClick={onSwitchToOwnerPrices}
                      className="ml-2 text-emerald-700 hover:underline font-black"
                    >
                      [Edit Price]
                    </button>
                  )}
                </p>
              </div>
            </div>
            {carryOverInfo.carriedCups !== null && (
              <span className="text-[11px] font-black text-emerald-800 bg-emerald-100/80 border border-emerald-300 px-2.5 py-1 rounded-xl">
                🔄 Carried from {carryOverInfo.prevShift} ({carryOverInfo.prevDate}): {carryOverInfo.carriedCups} cups
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Cups Given */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-700 block">
                  Cups Given (የተሰጡ ኩባያዎች)
                </label>
                {!isShiftClosed && (
                  <button
                    type="button"
                    onClick={() => openAddPackModal('cups')}
                    className="px-2.5 py-1 rounded-xl bg-emerald-100 hover:bg-emerald-600 text-emerald-800 hover:text-white border border-emerald-200 text-[11px] font-black flex items-center gap-1 shadow-2xs transition-all active:scale-95"
                  >
                    <Plus className="w-3 h-3 stroke-[3]" />
                    <span>Add Pack</span>
                  </button>
                )}
              </div>
              <input
                type="number"
                min="0"
                disabled={isShiftClosed}
                value={cupsGiven}
                onChange={(e) => setCupsGiven(e.target.value)}
                className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-lg font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/10 disabled:bg-slate-100"
                placeholder="Enter count"
              />
              <span className="text-[10px] text-slate-400 font-bold block">
                Total plastic cups issued for shift
              </span>
            </div>

            {/* Cups Left */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1.5">
              <label className="text-xs font-black text-slate-700 block">
                Cups Left (የተረፉ ኩባያዎች)
              </label>
              <input
                type="number"
                min="0"
                disabled={isShiftClosed}
                value={cupsLeft}
                onChange={(e) => setCupsLeft(e.target.value)}
                className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-lg font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/10 disabled:bg-slate-100"
                placeholder="Enter count"
              />
              <span className="text-[10px] text-slate-400 font-bold block">
                Remaining unsold on shelf (carries over next shift)
              </span>
            </div>

            {/* beU Delivery Cups */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1.5">
              <label className="text-xs font-black text-slate-700 block flex items-center justify-between">
                <span>beU Delivery (በቢዩ የተላኩ)</span>
                <span className="text-emerald-700 text-[10px] font-black">Bank Credit</span>
              </label>
              <input
                type="number"
                min="0"
                disabled={isShiftClosed}
                value={beuDeliveryCups}
                onChange={(e) => setBeuDeliveryCups(e.target.value)}
                className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-lg font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/10 disabled:bg-slate-100"
                placeholder="0"
              />
              <span className="text-[10px] text-slate-400 font-bold block">
                Deposited directly to company bank account
              </span>
            </div>

          </div>

          {/* Section 1 Output Calculation Bar */}
          <div className="bg-emerald-50/70 rounded-2xl p-3.5 border border-emerald-200/60 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-700">
            <div className="flex items-center gap-2">
              <span className="font-black text-slate-900">
                Total Sold: <span className="text-emerald-800 font-black">{juiceSold} cups</span>
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600 font-bold">
                ({inStoreJuiceSold} in-house + {Number(beuDeliveryCups || 0)} beU)
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-slate-700">
                Gross Juice Sales: <strong className="text-slate-900 text-sm font-black">{grossJuiceRevenue.toLocaleString()} ETB</strong>
              </span>
              <span className="text-rose-600 font-bold">
                (beU Deduction: -{beuDeliveryDeduction.toLocaleString()} ETB)
              </span>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* CARD 2: 🍱 FOOD BOX RECONCILIATION ("Anti-Skimming Engine")     */}
        {/* ============================================================== */}
        <section className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-100 shadow-md shadow-emerald-900/5 space-y-4 text-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100/70 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-lg">
                🍱
              </span>
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900">
                  2. FOOD BOX RECONCILIATION
                </h2>
                <p className="text-[11px] text-slate-500 font-bold">
                  Chef POS orders fetched from database and verified against physical takeaway boxes
                </p>
              </div>
            </div>
            {carryOverInfo.carriedBoxes !== null && (
              <span className="text-[11px] font-black text-emerald-800 bg-emerald-100/80 border border-emerald-300 px-2.5 py-1 rounded-xl">
                🔄 Carried from {carryOverInfo.prevShift} ({carryOverInfo.prevDate}): {carryOverInfo.carriedBoxes} boxes
              </span>
            )}
          </div>

          {/* Boxes Given, Boxes Left, Target Food Sold */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-700 block">
                  Boxes Given (የተሰጡ ቦክሶች)
                </label>
                {!isShiftClosed && (
                  <button
                    type="button"
                    onClick={() => openAddPackModal('boxes')}
                    className="px-2.5 py-1 rounded-xl bg-emerald-100 hover:bg-emerald-600 text-emerald-800 hover:text-white border border-emerald-200 text-[11px] font-black flex items-center gap-1 shadow-2xs transition-all active:scale-95"
                  >
                    <Plus className="w-3 h-3 stroke-[3]" />
                    <span>Add Pack</span>
                  </button>
                )}
              </div>
              <input
                type="number"
                min="0"
                disabled={isShiftClosed}
                value={boxesGiven}
                onChange={(e) => setBoxesGiven(e.target.value)}
                className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-lg font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/10 disabled:bg-slate-100"
                placeholder="Enter count"
              />
              <span className="text-[10px] text-slate-400 font-bold block">
                Empty takeaway boxes issued to kitchen
              </span>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1.5">
              <label className="text-xs font-black text-slate-700 block">
                Boxes Left (የተረፉ ቦክሶች)
              </label>
              <input
                type="number"
                min="0"
                disabled={isShiftClosed}
                value={boxesLeft}
                onChange={(e) => setBoxesLeft(e.target.value)}
                className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-lg font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/10 disabled:bg-slate-100"
                placeholder="Enter count"
              />
              <span className="text-[10px] text-slate-400 font-bold block">
                Remaining unused boxes (carries over next shift)
              </span>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1.5">
              <label className="text-xs font-black text-slate-700 block">
                Target Food Sold (የሚጠበቅ ምግብ ሽያጭ)
              </label>
              <div className="w-full bg-emerald-100/60 border border-emerald-300 rounded-xl px-3.5 py-2 text-lg font-black text-emerald-900">
                {targetFoodSold} <span className="text-xs text-emerald-700 font-bold">boxes</span>
              </div>
              <span className="text-[10px] text-slate-400 font-bold block">
                {hasBoxesEntered ? 'Boxes Given - Boxes Left = Dishes served' : 'Enter Boxes Given & Left to calculate'}
              </span>
            </div>

          </div>

          {/* LIVE CHEF SENT ORDERS CROSS-CHECK BAR */}
          <div className={`rounded-2xl p-4 border-2 transition-all ${
            !chefComparison.hasChefOrders
              ? 'bg-slate-50 border-slate-200 text-slate-700'
              : !hasBoxesEntered
                ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                : chefComparison.hasMismatch
                  ? 'bg-rose-50 border-rose-500 text-rose-950 shadow-md shadow-rose-500/15'
                  : 'bg-emerald-50/80 border-emerald-400 text-emerald-950'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg font-black ${
                  !chefComparison.hasChefOrders
                    ? 'bg-slate-200 text-slate-600'
                    : hasBoxesEntered && chefComparison.hasMismatch
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-emerald-600 text-white'
                }`}>
                  {hasBoxesEntered && chefComparison.hasMismatch ? <BellRing className="w-5 h-5" /> : chefComparison.hasChefOrders ? <CheckCircle2 className="w-5 h-5" /> : <ClipboardCheck className="w-5 h-5" />}
                </span>
                <div>
                  <h3 className="text-xs sm:text-sm font-black">
                    {!chefComparison.hasChefOrders
                      ? `No Chef Orders in Database for ${selectedDate} (${selectedShift} Shift)`
                      : !hasBoxesEntered
                        ? `Chef Orders Loaded from Database: ${chefSummary.totalOrders} order(s) (${chefComparison.chefTakeawayBoxes} Takeaway boxes)`
                        : chefComparison.hasMismatch
                          ? '🚨 Mismatch: Sheet Dishes Do Not Match Chef Orders'
                          : '✅ Chef Orders Matched Physical Boxes & Sheet'}
                  </h3>
                  <p className="text-[11px] font-bold opacity-80 mt-0.5">
                    {chefComparison.hasChefOrders ? (
                      <>
                        Chef POS Sent: <strong>{chefSummary.totalOrders} orders</strong> ({chefComparison.chefTakeawayBoxes} Takeaway boxes
                        {chefComparison.chefHomeDishes > 0 ? ` + ${chefComparison.chefHomeDishes} Home dine-in` : ''} = <strong>{chefComparison.chefTotalFood} total</strong>) •
                        Sheet Entered: <strong>{chefComparison.incomeSheetTotal} boxes/food</strong>
                      </>
                    ) : (
                      'Orders submitted by the Chef appear here automatically from the database.'
                    )}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={fetchOrdersDirectlyFromDb}
                  disabled={isSyncingDbOrders}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-black flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 disabled:opacity-60"
                  title="Fetch latest Chef POS orders directly from database"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingDbOrders ? 'animate-spin' : ''}`} />
                  <span>{isSyncingDbOrders ? 'Fetching DB...' : 'Fetch DB Orders'}</span>
                </button>
                {chefComparison.hasChefOrders && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleLoadFromChefOrders('takeaway')}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 text-[11px] font-black transition-all shadow-2xs active:scale-95"
                      title="Auto-fill Income Sheet dishes using Chef Takeaway orders"
                    >
                      {hasManualFoodOverride ? `Reset to Takeaway (${chefComparison.chefTakeawayBoxes})` : `⚡ Takeaway Auto-Loaded (${chefComparison.chefTakeawayBoxes})`}
                    </button>
                    {chefComparison.chefHomeDishes > 0 && (
                      <button
                        type="button"
                        onClick={() => handleLoadFromChefOrders('all')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black transition-all shadow-2xs active:scale-95"
                        title="Auto-fill all Chef Food (Takeaway + Home)"
                      >
                        Include Home Food ({chefComparison.chefTotalFood})
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Real Chef Orders Display Directly Inside Section 2 */}
            {chefSummary.matchedOrders.length > 0 && (
              <div className="mt-3 pt-3 border-t border-emerald-200/70 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-black text-slate-700">
                  <span>📋 Chef Sent Orders for {selectedDate} ({selectedShift} Shift):</span>
                  <span className="text-emerald-700">{chefSummary.matchedOrders.length} order(s) fetched</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-0.5">
                  {chefSummary.matchedOrders.map((ord) => {
                    const ordQty = (ord.items || []).reduce((s, i) => s + Number(i.qty || 0), 0);
                    const isHomeOrd = ord.orderType === 'Home' || ord.channel === 'In-Store Home';
                    const isBeuOrd = ord.channel === 'BEU Delivery' || ord.isBeuOrder;
                    return (
                      <div key={ord.id} className="bg-white rounded-xl p-2.5 border border-slate-200 flex items-start justify-between gap-2 text-xs shadow-2xs">
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-mono font-black text-slate-900">#{String(ord.id).slice(-6).toUpperCase()}</span>
                            <span className="text-[10px] text-slate-400 font-bold">{ord.timestamp || ''}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-black ${
                              isBeuOrd
                                ? 'bg-teal-50 text-teal-800 border border-teal-200'
                                : isHomeOrd
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            }`}>
                              {isBeuOrd ? '🛵 BEU' : isHomeOrd ? '🏠 Home' : '📦 Takeaway'}
                            </span>
                            {ord.waiterName && (
                              <span className="text-[10px] font-bold text-slate-600 truncate">• {ord.waiterName}</span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-700 font-bold truncate">
                            {(ord.items || []).map(i => `${i.qty}× ${i.name}`).join(', ')}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] font-black text-emerald-800">
                            {isHomeOrd ? `${ordQty} dish` : `${ordQty} box`}
                          </span>
                          <button
                            type="button"
                            onClick={() => openEditChefOrderModal(ord)}
                            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 border border-slate-200 text-[10px] font-black flex items-center gap-1 transition-all"
                            title="Edit Shift, Waiter, Service or Dishes for this Chef Order"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Dish-by-Dish Discrepancy Table when Mismatch fires */}
            {hasBoxesEntered && chefComparison.hasMismatch && chefComparison.dishDiffs.length > 0 && (
              <div className="mt-3 pt-3 border-t border-rose-200 overflow-x-auto">
                <p className="text-[11px] font-black text-rose-800 uppercase tracking-wider mb-2">
                  Exact Dish-by-Dish Mismatch Breakdown (Chef vs Income Sheet):
                </p>
                <table className="w-full text-left text-xs bg-white rounded-xl overflow-hidden border border-rose-200">
                  <thead className="bg-rose-100/80 text-rose-900 font-black">
                    <tr>
                      <th className="py-2 px-3">Dish</th>
                      <th className="py-2 px-3 text-center">Chef Sent</th>
                      <th className="py-2 px-3 text-center">Income Sheet</th>
                      <th className="py-2 px-3 text-right">Difference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-100">
                    {chefComparison.dishDiffs.map(d => (
                      <tr key={d.id} className="font-bold text-slate-800">
                        <td className="py-2 px-3">
                          <span className="font-black text-slate-900">{d.name}</span>
                          {d.englishName && <span className="text-[10px] text-slate-400 ml-1">({d.englishName})</span>}
                        </td>
                        <td className="py-2 px-3 text-center font-black text-emerald-800">
                          {d.chefQty}
                          {d.chefHomeQty > 0 && (
                            <span className="text-[10px] text-slate-400 block">({d.chefTakeawayQty} box + {d.chefHomeQty} home)</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center font-black text-slate-900">{d.incomeQty}</td>
                        <td className="py-2 px-3 text-right font-black text-rose-700">
                          {d.diff > 0 ? `+${d.diff} extra` : `${d.diff} missing`}
                          <span className="text-[10px] block text-rose-500">
                            ({d.diffETB > 0 ? `+${d.diffETB.toLocaleString()}` : d.diffETB.toLocaleString()} ETB)
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Ordered Dishes Only (Highlighted) + Quick "+ Add from Menu" Button */}
          <div className="pt-2 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-800">
                  Ordered &amp; Assigned Dishes:
                </span>
                <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200">
                  {orderedAssignedDishes.length} type(s) • {totalAssignedBoxes} total • {totalFoodRevenue.toLocaleString()} ETB
                </span>
              </div>
              {!isShiftClosed && (
                <button
                  type="button"
                  onClick={() => setShowAddFromMenu(prev => !prev)}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                >
                  {showAddFromMenu ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5 stroke-[3]" />}
                  <span>{showAddFromMenu ? 'Close Menu Picker' : '+ Add from Menu'}</span>
                </button>
              )}
            </div>

            {/* Optional Compact Menu Picker (Opens ONLY when clicking "+ Add from Menu") */}
            {showAddFromMenu && !isShiftClosed && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-emerald-200 space-y-3 animate-in fade-in">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {['All', 'Sandwiches', 'Salad', 'Pasta & Rice', 'Eggs & Firfir'].map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setActiveFoodCategory(cat)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition-all ${
                          activeFoodCategory === cat
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {cat === 'All' ? '🌟 All' : cat}
                      </button>
                    ))}
                  </div>
                  <div className="relative flex-1 min-w-[180px] max-w-xs">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                    <input
                      type="text"
                      value={menuAddSearch}
                      onChange={(e) => setMenuAddSearch(e.target.value)}
                      placeholder="Search menu dish..."
                      className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto">
                  {filteredDishes.map(dish => {
                    const currentQty = foodAssignments[dish.id] || 0;
                    return (
                      <button
                        key={dish.id}
                        type="button"
                        onClick={() => updateDishQty(dish.id, 1)}
                        className={`p-2.5 rounded-xl border text-left flex items-center justify-between gap-2 transition-all active:scale-95 ${
                          currentQty > 0
                            ? 'bg-emerald-50 border-emerald-500 shadow-2xs'
                            : 'bg-white border-slate-200 hover:border-emerald-400'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-900 truncate">{dish.name}</p>
                          <p className="text-[10px] font-bold text-emerald-700">
                            {dish.price} ETB {currentQty > 0 ? `• Added (${currentQty})` : ''}
                          </p>
                        </div>
                        <span className="px-2 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-black shrink-0">
                          + Add
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Highlighted Ordered Dishes List (Only Selected / Chef-Ordered Foods) */}
            {orderedAssignedDishes.length === 0 ? (
              <div className="p-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 text-center space-y-2">
                <p className="text-xs font-bold text-slate-600">
                  No food dishes ordered by Chef for this shift yet.
                </p>
                {!isShiftClosed && (
                  <button
                    type="button"
                    onClick={() => setShowAddFromMenu(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Dish from Menu</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {orderedAssignedDishes.map(dish => {
                  const subtotal = dish.qty * dish.price;
                  return (
                    <div
                      key={dish.id}
                      className="p-3 rounded-2xl bg-emerald-50/90 border-2 border-emerald-500 ring-2 ring-emerald-500/15 shadow-sm flex items-center justify-between gap-2 transition-all"
                    >
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-black text-slate-900 truncate">
                            {dish.name}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border ${
                            dish.fromChef
                              ? 'bg-white text-emerald-800 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            {dish.fromChef ? '🍳 From Chef' : '➕ Menu Added'}
                          </span>
                          <span className="text-[10px] text-emerald-800 font-black">
                            {dish.price} × {dish.qty} = {subtotal.toLocaleString()} ETB
                          </span>
                        </div>
                      </div>

                      {/* Stepper: [-] Qty [+] */}
                      <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-xl border border-emerald-300 shadow-2xs shrink-0">
                        <button
                          type="button"
                          disabled={isShiftClosed}
                          onClick={() => updateDishQty(dish.id, -1)}
                          className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-rose-100 hover:text-rose-700 disabled:opacity-30 text-slate-800 flex items-center justify-center font-black active:scale-90"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-black text-emerald-900">
                          {dish.qty}
                        </span>
                        <button
                          type="button"
                          disabled={isShiftClosed}
                          onClick={() => updateDishQty(dish.id, 1)}
                          className="w-6 h-6 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white flex items-center justify-center font-black active:scale-90"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* PHYSICAL BOX vs ORDERS VERIFICATION SUMMARY */}
          <div className="pt-1">
            {!hasBoxesEntered ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-2 text-slate-700">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-base">
                    📦
                  </span>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900">
                      Chef/Sheet Dishes Loaded: {totalAssignedBoxes} dishes ({totalFoodRevenue.toLocaleString()} ETB)
                    </h3>
                    <p className="text-[11px] text-slate-500 font-bold">
                      Enter "Boxes Given" and "Boxes Left" above to verify physical takeaway boxes before saving the shift
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black px-3 py-1 bg-slate-100 text-slate-700 rounded-xl border border-slate-200">
                  Waiting for Box Count
                </span>
              </div>
            ) : isFoodBoxesBalanced ? (
              <div className="bg-emerald-50 border-2 border-emerald-500/70 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-2 text-emerald-900 animate-in fade-in shadow-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-lg">
                    ✔
                  </span>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-emerald-900">
                      Food Boxes Verified: {totalAssignedBoxes} / {targetFoodSold} boxes matched ({totalFoodRevenue.toLocaleString()} ETB)
                    </h3>
                    <p className="text-[11px] text-emerald-700 font-bold">
                      የኩሽና ቦክስና የተመዘገቡ ምግቦች ሙሉ በሙሉ ተመጣጥነዋል (Ready to Save Shift)
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black px-3 py-1 bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-300">
                  MATCHED ✔
                </span>
              </div>
            ) : isUnderAssigned ? (
              <div className="bg-amber-50 border-2 border-amber-500/70 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-2 text-amber-900 animate-in fade-in shadow-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-lg">
                    ⚠️
                  </span>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-amber-900">
                      {Math.abs(boxDifference)} Physical Box(es) Used Without Matching Food Orders
                    </h3>
                    <p className="text-[11px] text-amber-700 font-bold">
                      Boxes Given − Boxes Left = {targetFoodSold} boxes used, but Chef/Sheet orders show {totalAssignedBoxes}. Check physical box count or add missing dishes.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black px-3 py-1 bg-amber-100 text-amber-800 rounded-xl border border-amber-300 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" />
                  <span>{Math.abs(boxDifference)} Box(es) Missing</span>
                </span>
              </div>
            ) : (
              <div className="bg-rose-50 border-2 border-rose-500/70 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-2 text-rose-900 animate-in fade-in shadow-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center text-lg">
                    ⚠️
                  </span>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-rose-900">
                      {boxDifference} More Dish(es) Entered Than Physical Boxes Used ({totalAssignedBoxes} dishes vs {targetFoodSold} boxes)
                    </h3>
                    <p className="text-[11px] text-rose-700 font-bold">
                      Please check "Boxes Left" count above or verify if any dish was Dine-In (Home) rather than a takeaway box
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black px-3 py-1 bg-rose-100 text-rose-800 rounded-xl border border-rose-300 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Check Box Count (+{boxDifference})</span>
                </span>
              </div>
            )}
          </div>
        </section>

        {/* ============================================================== */}
        {/* CARD 3: ⏳ PENDING PAYMENTS (UNPAID WITH WAITERS)               */}
        {/* Multi-Dish Itemized Food & Juice Pending Debts Engine          */}
        {/* ============================================================== */}
        <section className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-100 shadow-md shadow-emerald-900/5 space-y-4 text-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100/70 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-lg">
                ⏳
              </span>
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900">
                  3. PENDING PAYMENTS (UNPAID WITH WAITERS)
                </h2>
                <p className="text-[11px] text-slate-500 font-bold">
                  Uncollected food & juice orders held by waitstaff (Itemized Multi-Dish Debts)
                </p>
              </div>
            </div>

            {/* Quick Live Summary Pills */}
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-600">
                🥤 Juice: <strong className="text-emerald-700">{pendingJuiceCupsInput || 0} cups</strong> ({pendingJuiceAmount.toLocaleString()} ETB)
              </span>
              <span className="px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-600">
                🍱 Food: <strong className="text-emerald-700">{totalPendingFoodBoxes} boxes</strong> ({totalPendingFoodAmount.toLocaleString()} ETB)
              </span>
            </div>
          </div>

          {/* Top Row: Waiter Selection & Juice Cups Input */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Waiter Name (Auto by Shift: Day=Habtamu, Night=Wende; Owner Authority to Change) */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                  <span>Waiter Name (ባለዕዳ አስተናጋጅ) *</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black">
                    {selectedShift === 'Day' ? '☀️ Day Auto' : '🌙 Night Auto'}
                  </span>
                </label>
                {!isShiftClosed && (
                  <button
                    type="button"
                    onClick={handleOpenWaiterOwnerModal}
                    className="text-[10px] font-black px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1 shadow-2xs transition-all"
                    title="Owner permission required to change shift waiter"
                  >
                    <Lock className="w-3 h-3 text-emerald-400" />
                    <span>Change (Owner)</span>
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  readOnly={!waiterOverrideUnlocked}
                  disabled={isShiftClosed}
                  value={pendingWaiterName}
                  onChange={(e) => waiterOverrideUnlocked && setPendingWaiterName(e.target.value)}
                  className={`w-full border rounded-xl px-3 py-2 text-xs font-black outline-none ${
                    waiterOverrideUnlocked && !isShiftClosed
                      ? 'bg-white border-emerald-400 text-slate-900 focus:ring-2 focus:ring-emerald-500/15'
                      : 'bg-slate-100 border-slate-200 text-slate-800 cursor-not-allowed'
                  }`}
                />
              </div>
              <span className="text-[10px] text-slate-500 font-bold block">
                {waiterOverrideUnlocked
                  ? '🔓 Unlocked by Owner for this shift'
                  : `🔒 Locked to shift default (${selectedShift === 'Day' ? 'Day → Habtamu' : 'Night → Wende'}). Only Owner can change.`}
              </span>
              {(existingWaiterDebitSummary.totalExistingAmount > 0 || deductedPendingDebt > 0) && (
                <div className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] space-y-1">
                  <div className="flex items-center justify-between font-bold text-amber-900">
                    <span>Previous Existing Debit ({selectedShift}):</span>
                    <span>{existingWaiterDebitSummary.totalExistingAmount.toLocaleString()} ETB</span>
                  </div>
                  {deductedPendingDebt > 0 && (
                    <div className="flex items-center justify-between font-bold text-rose-700">
                      <span>+ New Debit Added Now:</span>
                      <span>+{deductedPendingDebt.toLocaleString()} ETB</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between font-black text-slate-900 pt-1 border-t border-amber-200/80">
                    <span>Total Consolidated Debit (Same Entry):</span>
                    <span className="text-emerald-800">
                      {(existingWaiterDebitSummary.totalExistingAmount + deductedPendingDebt).toLocaleString()} ETB
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Pending Juice (Cups) */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1">
              <label className="text-xs font-black text-slate-700 block">
                Pending Juice (Uncollected Juice Cups)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={pendingJuiceCupsInput}
                  onChange={(e) => setPendingJuiceCupsInput(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-emerald-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                  placeholder="0"
                />
                <span className="text-xs font-black text-slate-700 whitespace-nowrap bg-white px-3 py-2 rounded-xl border border-slate-200">
                  {pendingJuiceAmount.toLocaleString()} ETB
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block">
                {effectiveJuicePrice} ETB / cup deducted from physical drawer cash
              </span>
            </div>
          </div>

          {/* ITEMIZE PENDING FOOD DISHES CONTAINER */}
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">🍱</span>
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Pending Food Dishes (Multi-Item Breakdown)
                </span>
              </div>
              <span className="text-[11px] font-black text-emerald-800 bg-emerald-100/80 border border-emerald-200 px-2.5 py-0.5 rounded-lg">
                Total: {totalPendingFoodBoxes} boxes • {totalPendingFoodAmount.toLocaleString()} ETB
              </span>
            </div>

            {/* Add Dish Line Form */}
            <form onSubmit={handleAddPendingFoodItem} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
              {/* Select Dish (6 cols) */}
              <div className="sm:col-span-6">
                <label className="text-[10px] font-black text-slate-500 block mb-1">
                  Choose Food Dish
                </label>
                <select
                  value={selectedPendingDishId}
                  onChange={(e) => setSelectedPendingDishId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
                >
                  {dishesList.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.englishName}) — {d.price} ETB
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity (3 cols) */}
              <div className="sm:col-span-3">
                <label className="text-[10px] font-black text-slate-500 block mb-1">
                  Box Quantity (Qty)
                </label>
                <input
                  type="number"
                  min="1"
                  value={selectedPendingDishQty}
                  onChange={(e) => setSelectedPendingDishQty(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-black text-emerald-800 outline-none focus:border-emerald-500"
                />
              </div>

              {/* Add Button (3 cols) */}
              <div className="sm:col-span-3">
                <button
                  type="submit"
                  className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-lg flex items-center justify-center gap-1 shadow-sm transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>+ Add Dish</span>
                </button>
              </div>
            </form>

            {/* Itemized Food List */}
            <div className="space-y-2">
              {pendingFoodItems.length === 0 ? (
                <div className="p-3 bg-white rounded-xl border border-dashed border-slate-200 text-center text-[11px] text-slate-500 font-bold">
                  No pending food dishes added yet. Choose a dish and quantity above, then click "+ Add Dish".
                </div>
              ) : (
                pendingFoodItems.map((item) => (
                  <div
                    key={item.dishId}
                    className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3 text-xs hover:border-emerald-300 transition-all shadow-xs"
                  >
                    {/* Item Info */}
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black shrink-0">
                        🍱
                      </span>
                      <div className="truncate">
                        <span className="font-black text-slate-900 block truncate">{item.name}</span>
                        <span className="text-[10px] text-slate-500 font-bold block">
                          {item.price} ETB / ቦክስ
                        </span>
                      </div>
                    </div>

                    {/* Stepper & Total */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200">
                        <button
                          type="button"
                          onClick={() => handleUpdatePendingFoodQty(item.dishId, -1)}
                          className="w-5 h-5 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 flex items-center justify-center font-black"
                          title="ቀንስ"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="px-2 font-black text-emerald-900 min-w-6 text-center">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdatePendingFoodQty(item.dishId, 1)}
                          className="w-5 h-5 rounded bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center font-black"
                          title="ጨምር"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>

                      <span className="font-black text-emerald-900 min-w-16 text-right">
                        {(item.qty * item.price).toLocaleString()} ETB
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemovePendingFoodItem(item.dishId)}
                        className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                        title="ይህን ምግብ አስወግድ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pending Deduction Banner */}
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-rose-900">
            <div className="font-bold flex items-center gap-2">
              <span className="text-base">⛔</span>
              <div>
                <span>
                  የሚቀነስ ጠቅላላ ዕዳ ({pendingJuiceCupsInput || 0} ኩባያ ጁስ + {totalPendingFoodBoxes} ቦክስ ምግብ):
                </span>
                <p className="text-[10px] text-rose-700 font-normal mt-0.5">
                  ባለዕዳ፡ {pendingWaiterName} {pendingFoodItems.length > 0 && `(${pendingFoodItems.map(i => `${i.qty}x ${i.name.split(' ')[0]}`).join(', ')})`}
                </p>
              </div>
            </div>
            <span className="text-base font-black text-rose-700 whitespace-nowrap self-end sm:self-auto">
              - {deductedPendingDebt.toLocaleString()} ETB
            </span>
          </div>
        </section>

        {/* ============================================================== */}
        {/* CARD 4: 🔄 RECOVERING PENDING PAYMENTS FROM WAITERS            */}
        {/* ============================================================== */}
        <section className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-100 shadow-md shadow-emerald-900/5 space-y-4 text-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100/70 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-lg">
                🔄
              </span>
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900 flex flex-wrap items-center gap-2">
                  <span>4. RECOVERING PENDING PAYMENTS FROM WAITERS</span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200">
                    {recoveryFilterMode === 'All'
                      ? '📋 All Shifts'
                      : recoveryFilterMode === 'Night'
                        ? '🌙 Night Shift Pending'
                        : '☀️ Day Shift Pending'}
                  </span>
                </h2>
                <p className="text-[11px] text-slate-500 font-bold">
                  Tap any shift box below (Day, Night, or All) to quickly inspect & collect unpaid waiter balances
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPendingLedgerModal(true)}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
                title="Open Waiter Debts Ledger"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-700" />
                <span>📋 Waiter Debts Ledger →</span>
              </button>
              <span className="text-xs font-black text-emerald-900 bg-emerald-100/80 border border-emerald-200 px-3 py-1.5 rounded-xl">
                + {recoveredCashAdded.toLocaleString()} ETB Collected
              </span>
            </div>
          </div>

          {/* 3 QUICK SHIFT SUMMARY BOXES (DAY / NIGHT / ALL) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setRecoveryFilterMode('Day')}
              className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-center justify-between gap-2 ${
                recoveryFilterMode === 'Day'
                  ? 'bg-emerald-50 border-emerald-600 shadow-sm'
                  : 'bg-slate-50 border-slate-200 hover:border-emerald-300'
              }`}
            >
              <div>
                <span className="text-[11px] font-black text-slate-500 block">☀️ Day Shift Pending</span>
                <span className="text-base font-black text-slate-900">{recoveryShiftStats.dayAmount.toLocaleString()} ETB</span>
              </div>
              <span className={`px-2.5 py-1 rounded-xl text-xs font-black ${
                recoveryFilterMode === 'Day' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
              }`}>
                {recoveryShiftStats.dayCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setRecoveryFilterMode('Night')}
              className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-center justify-between gap-2 ${
                recoveryFilterMode === 'Night'
                  ? 'bg-emerald-50 border-emerald-600 shadow-sm'
                  : 'bg-slate-50 border-slate-200 hover:border-emerald-300'
              }`}
            >
              <div>
                <span className="text-[11px] font-black text-slate-500 block">🌙 Night Shift Pending</span>
                <span className="text-base font-black text-slate-900">{recoveryShiftStats.nightAmount.toLocaleString()} ETB</span>
              </div>
              <span className={`px-2.5 py-1 rounded-xl text-xs font-black ${
                recoveryFilterMode === 'Night' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
              }`}>
                {recoveryShiftStats.nightCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setRecoveryFilterMode('All')}
              className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-center justify-between gap-2 ${
                recoveryFilterMode === 'All'
                  ? 'bg-emerald-50 border-emerald-600 shadow-sm'
                  : 'bg-slate-50 border-slate-200 hover:border-emerald-300'
              }`}
            >
              <div>
                <span className="text-[11px] font-black text-slate-500 block">📋 All Shifts Pending</span>
                <span className="text-base font-black text-slate-900">{recoveryShiftStats.allAmount.toLocaleString()} ETB</span>
              </div>
              <span className={`px-2.5 py-1 rounded-xl text-xs font-black ${
                recoveryFilterMode === 'All' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
              }`}>
                {recoveryShiftStats.allCount}
              </span>
            </button>
          </div>

          {/* Pending Payment Boxes Grid */}
          <div>
            {activeDebtsForShift.length === 0 ? (
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
                <p className="text-xs text-slate-700 font-bold">
                  {recoveryFilterMode === 'All'
                    ? '✓ No pending debts across shifts'
                    : `✓ No pending debts for ${recoveryFilterMode} Shift`}
                </p>
                <p className="text-[11px] text-slate-500">
                  {recoveryFilterMode !== 'All' && otherShiftPendingCount > 0
                    ? `${otherShiftPendingCount} pending debit(s) exist in the other shift — click All Shifts box above to view.`
                    : 'New debts can be logged in Section 3 above or inside the Waiter Debts Ledger page.'}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {recoveryFilterMode !== 'All' && recoveryShiftStats.allCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setRecoveryFilterMode('All')}
                      className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-slate-800 border border-slate-200 rounded-xl text-xs font-black inline-flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <span>Show All Shifts ({recoveryShiftStats.allCount})</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPendingLedgerModal(true)}
                    className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-black inline-flex items-center gap-1.5 transition-all shadow-xs"
                  >
                    <span>Open Waiter Debts Ledger</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeDebtsForShift.map(debt => {
                const sel = recoverySelections[debt.id];
                const isSelected = sel?.selected || false;
                const unitsToRecover = sel?.unitsToRecover || debt.remainingUnits;
                const recoveredAmt = unitsToRecover * debt.unitPrice;
                const isConsolidated = Number(debt.unitPrice) === 1;

                return (
                  <div
                    key={debt.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                      isSelected 
                        ? 'bg-emerald-50/90 border-2 border-emerald-500 text-slate-900 shadow-sm' 
                        : 'bg-slate-50 border border-slate-200 text-slate-600 hover:border-emerald-300'
                    }`}
                  >
                    {/* Box Header: Checkbox + Waiter + Shift */}
                    <div className="flex items-start justify-between gap-2">
                      <label className="flex items-start gap-2.5 cursor-pointer flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleDebtSelection(debt.id)}
                          className="w-4 h-4 mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 bg-white border-slate-300 cursor-pointer accent-emerald-600 shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="font-black text-xs text-slate-900 block truncate">
                            {debt.waiterName}
                          </span>
                          <div className="flex flex-wrap items-center gap-1 mt-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-emerald-800 border border-slate-200">
                              {isConsolidated ? '📑 Consolidated' : debt.itemType === 'food' ? '🍱 Food' : '🥤 Juice'}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                              {debt.shift === 'Night' ? '🌙 Night' : '☀️ Day'}
                            </span>
                          </div>
                        </div>
                      </label>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-black text-emerald-800 block">
                          {Number(debt.remainingAmount).toLocaleString()} ETB
                        </span>
                        {!isConsolidated && (
                          <span className="text-[10px] font-bold text-slate-500">
                            {debt.remainingUnits} {debt.itemType === 'food' ? 'boxes' : 'cups'}
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 font-medium line-clamp-2 border-t border-slate-200/70 pt-2">
                      {debt.dishName}{debt.date ? ` • ${debt.date}` : ''}
                    </p>

                    {/* Stepper: Recover Units or ETB Amount */}
                    {isSelected && (
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-emerald-200">
                        <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-xl border border-slate-200 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => updateDebtUnitsToRecover(debt.id, -1)}
                            disabled={unitsToRecover <= 1}
                            className="w-5 h-5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-800 flex items-center justify-center font-black"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          {isConsolidated ? (
                            <input
                              type="number"
                              min="1"
                              max={debt.remainingUnits}
                              value={unitsToRecover}
                              onChange={(e) => setExactDebtRecoverUnits(debt.id, e.target.value)}
                              className="w-16 text-center text-xs font-black text-emerald-900 bg-transparent outline-none"
                            />
                          ) : (
                            <span className="px-1.5 text-xs font-black text-emerald-900">
                              {unitsToRecover} / {debt.remainingUnits}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => updateDebtUnitsToRecover(debt.id, 1)}
                            disabled={unitsToRecover >= debt.remainingUnits}
                            className="w-5 h-5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white flex items-center justify-center font-black"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {isConsolidated && unitsToRecover < debt.remainingUnits && (
                            <button
                              type="button"
                              onClick={() => setExactDebtRecoverUnits(debt.id, debt.remainingUnits)}
                              className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-900 text-[10px] font-black"
                            >
                              Full
                            </button>
                          )}
                          <span className="font-black text-xs text-emerald-900">
                            +{recoveredAmt.toLocaleString()} ETB
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              </div>
            )}
          </div>

          {/* Section 4 Footer helper bar */}
          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="text-slate-600 font-bold flex items-center gap-2">
              <span className="text-emerald-700">ℹ️</span>
              <span>
                በክፍል 4 ምልክት የተደረገባቸው ዕዳዎች በቀጥታ ወደ ካዝና ጥሬ ገንዘብ ይደመራሉ። ሂሳቡ ሲዘጋ የዕዳው መጠን ይቀነሳል።
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowPendingLedgerModal(true)}
              className="text-emerald-700 hover:text-emerald-800 font-black underline flex items-center gap-1"
            >
              <span>ሁሉንም የአስተናጋጆች ዕዳ መዝገብ እይ (Manage All Debts) →</span>
            </button>
          </div>
        </section>

        {/* ============================================================== */}
        {/* CARD 5: 💸 DAILY OPERATING EXPENSES                             */}
        {/* ============================================================== */}
        <section className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-100 shadow-md shadow-emerald-900/5 space-y-4 text-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100/70 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-lg">
                💸
              </span>
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900">
                  5. DAILY OPERATING EXPENSES
                </h2>
                <p className="text-[11px] text-slate-500 font-bold">
                  Daily cash expenses paid from drawer (Deducted from drawer cash)
                </p>
              </div>
            </div>
            <span className="text-xs font-black text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-xl">
              - {totalDailyExpenses.toLocaleString()} ETB
            </span>
          </div>

          {/* List of Current Daily Expenses */}
          <div className="space-y-2">
            {dailyExpenses.map(exp => (
              <div 
                key={exp.id}
                className="bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-900">{exp.name}</span>
                  <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded-lg border border-slate-200 font-bold">
                    {exp.category}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-black text-rose-700">
                    {exp.amount.toLocaleString()} ETB
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveExpense(exp.id)}
                    className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                    title="Delete expense"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Inline Add Expense Form */}
          <form onSubmit={handleAddExpense} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-200">
            <input
              type="text"
              required
              value={newExpName}
              onChange={(e) => setNewExpName(e.target.value)}
              placeholder="Expense item (e.g. Ice / በረዶ, Packaging)"
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white"
            />
            <select
              value={newExpCategory}
              onChange={(e) => setNewExpCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white"
            >
              {EXPENSE_CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              type="number"
              required
              step="any"
              value={newExpAmount}
              onChange={(e) => setNewExpAmount(e.target.value)}
              placeholder="Amount (ETB)"
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-emerald-900 outline-none focus:border-emerald-500 focus:bg-white"
            />
            <button
              type="submit"
              className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-all shadow-sm active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Expense</span>
            </button>
          </form>
        </section>

        {/* ============================================================== */}
        {/* CARD 6: 💳 BANK & TELEBIRR TRANSFERS (MANUAL ONE-BY-ONE INPUT) */}
        {/* ============================================================== */}
        <section className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-100 shadow-md shadow-emerald-900/5 space-y-4 text-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100/70 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-lg">
                💳
              </span>
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900">
                  6. BANK & TELEBIRR TRANSFERS (MANUAL INPUT)
                </h2>
                <p className="text-[11px] text-slate-500 font-bold">
                  Customer digital payments — enter one by one directly (Manual One-by-One Input)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {bankTransfers.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllTransfers}
                  className="text-[11px] text-slate-500 hover:text-rose-600 underline font-bold px-2 py-1"
                >
                  Clear All
                </button>
              )}
              <span className="text-xs font-black text-emerald-900 bg-emerald-100/80 border border-emerald-200 px-3 py-1 rounded-xl">
                - {totalBankTransfers.toLocaleString()} ETB ({bankTransfers.length} transfers)
              </span>
            </div>
          </div>

          {/* Quick Preset Amount Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-slate-500 font-bold mr-1">
              Quick Presets:
            </span>
            {[100, 150, 180, 200, 250, 300, 430, 500, 1000].map(amt => (
              <button
                key={amt}
                type="button"
                onClick={() => setNewTxnAmount(amt.toString())}
                className="px-2.5 py-1 bg-slate-50 hover:bg-emerald-50 text-emerald-900 border border-slate-200 hover:border-emerald-300 rounded-xl text-xs font-black transition-all active:scale-95"
              >
                +{amt}
              </button>
            ))}
          </div>

          {/* Inline Manual Add Transfer Form (Fast: Amount + Channel Only) */}
          <form onSubmit={handleAddTransfer} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            {/* Amount */}
            <div className="sm:col-span-5">
              <label className="text-[11px] font-black text-slate-700 block mb-1">
                Amount (ETB) *
              </label>
              <input
                type="number"
                required
                step="any"
                min="1"
                value={newTxnAmount}
                onChange={(e) => setNewTxnAmount(e.target.value)}
                placeholder="e.g. 250"
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-black text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
              />
            </div>

            {/* Channel / Service */}
            <div className="sm:col-span-4">
              <label className="text-[11px] font-black text-slate-700 block mb-1">
                Channel / Bank *
              </label>
              <select
                value={newTxnChannel}
                onChange={(e) => setNewTxnChannel(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
              >
                <option value="Telebirr (ቴሌብር)">📱 Telebirr (ቴሌብር)</option>
                <option value="CBE Birr (ንግድ ባንክ)">🏦 CBE Birr (ንግድ ባንክ)</option>
                <option value="Awash Bank (አዋሽ)">🏛️ Awash Bank (አዋሽ ባንክ)</option>
                <option value="Dashen Bank (ዳሽን)">🏦 Dashen Bank (ዳሽን ባንክ)</option>
                <option value="Other Bank (ሌላ ባንክ)">💳 Other Bank (ሌላ ባንክ)</option>
              </select>
            </div>

            {/* Submit Button */}
            <div className="sm:col-span-3">
              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ Add Transfer</span>
              </button>
            </div>
          </form>

          {/* List of Entered Transfers (One by One) */}
          <div className="space-y-2 pt-1">
            {bankTransfers.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-500 font-bold space-y-1">
                <p>ℹ️ No digital bank or Telebirr transfers recorded yet for this shift.</p>
                <p className="text-[11px] text-slate-400">
                  Select payment channel and amount above to log customer transfers one by one.
                </p>
              </div>
            ) : (
              bankTransfers.map((txn, index) => (
                <div
                  key={txn.id || index}
                  className="bg-slate-50 px-4 py-3 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-white text-slate-600 text-[10px] font-black flex items-center justify-center border border-slate-200 shadow-2xs">
                      #{index + 1}
                    </span>
                    <span className="text-xs font-black text-emerald-900 bg-white border border-emerald-200 px-3 py-1 rounded-xl shadow-2xs">
                      {txn.channel}
                    </span>
                    {txn.time && (
                      <span className="text-[11px] font-bold text-slate-400">
                        {txn.time}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-black text-base text-emerald-900">
                      {txn.amount.toLocaleString()} <span className="text-xs text-slate-500">ETB</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTransfer(txn.id)}
                      className="p-1.5 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-colors border border-slate-200 hover:border-rose-200"
                      title="Delete transfer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* ============================================================== */}
        {/* CARD 7: 💵 AUTOMATIC CASH DRAWER RECONCILIATION                */}
        {/* ============================================================== */}
        <section className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-5 sm:p-7 border border-emerald-700/50 shadow-2xl space-y-5">
          <div className="flex items-center gap-2.5 border-b border-emerald-800/80 pb-3">
            <span className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center text-lg shadow-inner">
              💵
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white">
                7. AUTOMATIC CASH DRAWER RECONCILIATION
              </h2>
              <p className="text-[11px] text-emerald-200 font-bold">
                Shift Physical Cash Handoff Target
              </p>
            </div>
          </div>

          {/* Mathematical Formula Breakdown Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
              <span className="text-[10px] text-emerald-200 block">Gross Juice</span>
              <span className="text-white font-black">+{grossJuiceRevenue.toLocaleString()} ETB</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
              <span className="text-[10px] text-emerald-200 block">Food Sales</span>
              <span className="text-white font-black">+{totalFoodRevenue.toLocaleString()} ETB</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
              <span className="text-[10px] text-rose-300 block">beU Deduction</span>
              <span className="text-rose-200 font-black">-{beuDeliveryDeduction.toLocaleString()} ETB</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
              <span className="text-[10px] text-rose-300 block">New Pending</span>
              <span className="text-rose-200 font-black">-{deductedPendingDebt.toLocaleString()} ETB</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
              <span className="text-[10px] text-emerald-200 block">Recovered Debts</span>
              <span className="text-emerald-300 font-black">+{recoveredCashAdded.toLocaleString()} ETB</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
              <span className="text-[10px] text-rose-300 block">Daily Expenses</span>
              <span className="text-rose-200 font-black">-{totalDailyExpenses.toLocaleString()} ETB</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
              <span className="text-[10px] text-emerald-200 block">Bank Transfers</span>
              <span className="text-emerald-200 font-black">-{totalBankTransfers.toLocaleString()} ETB</span>
            </div>

            <div className="bg-white/15 backdrop-blur-md p-3 rounded-2xl border border-white/20">
              <span className="text-[10px] text-emerald-200 block font-bold">Total Gross Sales</span>
              <span className="text-white font-black">{totalGrossSales.toLocaleString()} ETB</span>
            </div>

          </div>

          {/* Prominent Physical Cash Display */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-emerald-400/40 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-200 block">
                Physical Cash in Drawer (የካዝና ጥሬ ገንዘብ):
              </span>
              <p className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-1">
                {physicalCashInDrawer.toLocaleString()} <span className="text-lg text-emerald-300 font-bold">ETB</span>
              </p>
            </div>
            <div className="text-right">
              <span className={`text-xs font-black px-3.5 py-1.5 rounded-full border shadow-sm ${
                isFoodBoxesBalanced
                  ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40'
                  : 'bg-amber-500/20 text-amber-200 border-amber-400/40'
              }`}>
                {isFoodBoxesBalanced ? '✔ Fully Reconciled & Balanced' : '⚠️ Balance Food Boxes First'}
              </span>
            </div>
          </div>

        </section>

      </main>

      {/* ============================================================== */}
      {/* FLOATING ACTION BOTTOM BAR (Save Settlement & Total Summary)    */}
      {/* ============================================================== */}
      <div className={embeddedMode ? 'sticky bottom-2 mx-4 mt-4 bg-white/95 backdrop-blur-md border border-emerald-200 rounded-2xl py-3 px-4 shadow-xl z-30 text-slate-800' : 'fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-emerald-100 py-3 px-4 shadow-2xl z-40 text-slate-800'}>
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500 font-bold">
                Total Sales ({selectedShift === 'Day' ? 'Day' : 'Night'}):
              </span>
              <span className="text-base font-black text-slate-900">
                ETB {totalGrossSales.toLocaleString()}
              </span>
              {chefComparison.hasMismatch && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-600 text-white animate-pulse">
                  🚨 Chef Mismatch ({chefComparison.dishDiffs.length} items)
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Drawer Cash: <strong className="text-emerald-700 font-black">{physicalCashInDrawer.toLocaleString()} ETB</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>

            <button
              type="button"
              disabled={!hasBoxesEntered || !isFoodBoxesBalanced || isShiftClosed}
              onClick={handleSaveSettlement}
              className={`py-3 px-6 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all active:scale-95 shadow-lg ${
                isShiftClosed
                  ? 'bg-slate-800 text-emerald-300 border border-slate-700 cursor-not-allowed'
                  : hasBoxesEntered && isFoodBoxesBalanced
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
                    : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed opacity-75'
              }`}
            >
              {isShiftClosed ? (
                <>
                  <Lock className="w-4 h-4" />
                  <span>🔒 SHIFT CLOSED</span>
                </>
              ) : !hasBoxesEntered ? (
                <>
                  <Lock className="w-4 h-4" />
                  <span>ENTER BOXES GIVEN & LEFT</span>
                </>
              ) : isFoodBoxesBalanced ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>✔ SAVE & CLOSE SHIFT</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>🔒 LOCKED: BALANCE FOOD BOXES FIRST</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: THERMAL & DIGITAL SHIFT RECONCILIATION SLIP           */}
      {/* ============================================================== */}
      <ShiftSlipModal
        slip={activePrintTicket}
        isPostSave={isPostSaveSlip}
        onClose={handleDoneFromSlip}
      />



      {/* ============================================================== */}
      {/* MODAL 3: PAST SETTLEMENTS HISTORY LOG                          */}
      {/* ============================================================== */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-emerald-100 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto text-slate-800">
            <div className="flex items-center justify-between border-b border-emerald-100/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-inner">
                  <History className="w-4 h-4" />
                </div>
                <h3 className="font-black text-sm text-slate-900">Shift Settlements History Log</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowHistoryModal(false)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              {settlementsHistory.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6 font-bold">
                  No shift settlements recorded yet
                </p>
              ) : (
                settlementsHistory.map(item => (
                  <div 
                    key={item.id}
                    className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900">
                          {toEthiopianDateString(item.date)}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          item.shift === 'Day' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-200 text-slate-800 border border-slate-300'
                        }`}>
                          {item.shift === 'Day' ? '☀️ Day' : '🌙 Night'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                        Sales: {item.totalGrossSales.toLocaleString()} ETB • Drawer Cash: <strong className="text-emerald-800">{item.physicalCashInDrawer.toLocaleString()} ETB</strong>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => { setIsPostSaveSlip(false); setActivePrintTicket(item); setShowHistoryModal(false); }}
                      className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 rounded-xl text-xs font-black flex items-center gap-1.5 border border-slate-200 hover:border-emerald-300 shadow-2xs transition-all"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Slip</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: WAITER PENDING DEBTS LEDGER MODAL PAGE                */}
      {/* ============================================================== */}
      <WaiterPendingLedgerModal
        isOpen={showPendingLedgerModal}
        onClose={() => setShowPendingLedgerModal(false)}
        pendingDebts={pendingDebts}
        onUpdateDebts={(updated) => {
          setPendingDebts(updated);
          // Clean up recoverySelections if any debt was removed or settled
          setRecoverySelections(prev => {
            const next = { ...prev };
            Object.keys(next).forEach(id => {
              const d = updated.find(item => item.id === id);
              if (!d || d.status !== 'pending' || d.remainingUnits <= 0) {
                delete next[id];
              }
            });
            return next;
          });
        }}
        waitersList={waiters}
        foodMenu={dishesList}
        standardJuicePrice={effectiveJuicePrice}
      />

      {/* ============================================================== */}
      {/* MODAL 5: OWNER AUTHORITY TO CHANGE SHIFT WAITER                */}
      {/* ============================================================== */}
      {showWaiterAuthModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleConfirmWaiterChange} className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-emerald-200 space-y-4 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Change {selectedShift} Shift Waiter</h3>
                  <p className="text-[10px] text-slate-500 font-bold">Owner Authority Required</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowWaiterAuthModal(false)} className="p-1 text-slate-400 hover:text-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            {Array.isArray(waiters) && waiters.length > 0 && (
              <div>
                <label className="text-[11px] font-black text-slate-700 block mb-1">Quick Pick Waiter:</label>
                <div className="flex flex-wrap gap-1.5">
                  {waiters.map(w => {
                    const label = w.fullName || w.amharic || w;
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setWaiterDraftName(label)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-black border transition-all ${
                          waiterDraftName === label
                            ? 'bg-emerald-600 text-white border-emerald-700'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="text-[11px] font-black text-slate-700 block mb-1">Waiter Name *</label>
              <input
                type="text"
                required
                value={waiterDraftName}
                onChange={(e) => setWaiterDraftName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs font-black outline-none"
              />
            </div>

            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200 cursor-pointer">
              <input
                type="checkbox"
                checked={saveAsShiftDefault}
                onChange={(e) => setSaveAsShiftDefault(e.target.checked)}
                className="rounded text-emerald-600"
              />
              <span>Set as permanent default for all <strong>{selectedShift}</strong> shifts</span>
            </label>

            {!embeddedMode && (
              <div>
                <label className="text-[11px] font-black text-slate-700 block mb-1">Owner Password *</label>
                <input
                  type="password"
                  required
                  value={waiterPinInput}
                  onChange={(e) => setWaiterPinInput(e.target.value)}
                  placeholder="Enter Owner Password..."
                  className="w-full bg-slate-50 border border-slate-300 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs font-black outline-none"
                />
              </div>
            )}

            {waiterPinError && (
              <p className="text-xs font-black text-rose-600">{waiterPinError}</p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowWaiterAuthModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-black"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm"
              >
                Authorize & Apply
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 6: + ADD PACK (TACTILE CUPS / BOXES TOP-UP MODAL)        */}
      {/* ============================================================== */}
      {addPackModal && (() => {
        const isCups = addPackModal.type === 'cups';
        const currentVal = Number(isCups ? cupsGiven : boxesGiven) || 0;
        const addVal = Math.max(0, Number(addPackModal.qty) || 0);
        const nextTotal = currentVal + addVal;
        const unitLabel = isCups ? 'Cups' : 'Boxes';
        const presets = [
          { qty: 25, tag: '½ Pack' },
          { qty: 50, tag: '1 Pack' },
          { qty: 100, tag: '2 Packs' },
          { qty: 150, tag: '3 Packs' },
          { qty: 200, tag: '4 Packs' }
        ];

        return (
          <div
            className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in"
            onClick={() => setAddPackModal(null)}
          >
            <form
              onSubmit={handleConfirmAddPack}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-xs shadow-2xl border border-emerald-200 overflow-hidden text-slate-800"
            >
              {/* Compact Header */}
              <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 px-4 py-2.5 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-sm">
                    {isCups ? '🥤' : '🍱'}
                  </span>
                  <div>
                    <h3 className="text-xs font-black text-white leading-tight">
                      {isCups ? 'Add Juice Cups Pack' : 'Add Boxes Pack'}
                    </h3>
                    <p className="text-[10px] text-emerald-300 font-bold leading-tight">
                      {currentVal} + {addVal} = {nextTotal} {unitLabel}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAddPackModal(null)}
                  className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-3.5 space-y-3">
                {/* 1-Tap Quick Pack Tiles */}
                <div className="grid grid-cols-5 gap-1.5">
                  {presets.map((p) => {
                    const active = Number(addPackModal.qty) === p.qty;
                    return (
                      <button
                        key={p.qty}
                        type="button"
                        onClick={() => setAddPackModal(prev => ({ ...prev, qty: String(p.qty) }))}
                        className={`py-1.5 px-1 rounded-xl border text-center transition-all active:scale-95 ${
                          active
                            ? 'bg-emerald-600 border-emerald-700 text-white shadow-xs'
                            : 'bg-slate-50 hover:bg-emerald-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        <span className="text-[11px] font-black block leading-tight">+{p.qty}</span>
                        <span className={`text-[8px] font-bold block ${active ? 'text-emerald-100' : 'text-slate-400'}`}>
                          {p.tag}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Compact Stepper & Direct Input */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAddPackModal(prev => ({ ...prev, qty: String(Math.max(1, (Number(prev.qty) || 0) - 10)) }))}
                    className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center font-black shrink-0"
                    title="-10"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    autoFocus
                    required
                    value={addPackModal.qty}
                    onChange={(e) => setAddPackModal(prev => ({ ...prev, qty: e.target.value }))}
                    className="flex-1 min-w-0 bg-slate-50 border border-emerald-300 focus:border-emerald-500 rounded-xl px-2.5 py-1.5 text-center text-base font-black text-slate-900 outline-none tabular-nums"
                    placeholder="50"
                  />
                  <button
                    type="button"
                    onClick={() => setAddPackModal(prev => ({ ...prev, qty: String((Number(prev.qty) || 0) + 10) }))}
                    className="w-9 h-9 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 flex items-center justify-center font-black shrink-0"
                    title="+10"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Compact Actions */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAddPackModal(null)}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-black"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addVal <= 0}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-[11px] font-black shadow-sm flex items-center justify-center gap-1 transition-all active:scale-98"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Add {addVal} → {nextTotal}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        );
      })()}

      {/* ============================================================== */}
      {/* MODAL 7: EDIT CHEF ORDER (SHIFT / SERVICE / WAITER / ITEMS)    */}
      {/* ============================================================== */}
      {editingChefOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveEditedChefOrder}
            className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl border border-emerald-200 space-y-4 text-slate-800 my-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">
                    Edit Chef Order #{String(editingChefOrder.id).slice(-6).toUpperCase()}
                  </h3>
                  <p className="text-[11px] font-bold text-slate-500">
                    Fix Shift, Service (Takeaway/Home/BEU), Waiter, or Dishes — synced directly to Supabase
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingChefOrder(null)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Shift Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 block">Shift:</label>
              <div className="grid grid-cols-2 gap-2">
                {['Day', 'Night'].map(sh => (
                  <button
                    key={sh}
                    type="button"
                    onClick={() => setEditingChefOrder(prev => ({ ...prev, shift: sh }))}
                    className={`py-2 px-3 rounded-xl text-xs font-black border-2 transition-all ${
                      editingChefOrder.shift === sh
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {sh === 'Day' ? '☀️ Day Shift' : '🌙 Night Shift'}
                  </button>
                ))}
              </div>
            </div>

            {/* Service / Channel */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 block">Service / Channel:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'Takeaway', label: '📦 Takeaway' },
                  { id: 'Home', label: '🏠 Home' },
                  { id: 'BEU', label: '🛵 BEU' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setEditingChefOrder(prev => ({
                      ...prev,
                      serviceMode: opt.id,
                      waiterName: opt.id === 'BEU' ? 'የቢዩ አሽከርካሪ (BEU Driver)' : prev.waiterName
                    }))}
                    className={`py-2 px-2.5 rounded-xl text-xs font-black border-2 transition-all ${
                      editingChefOrder.serviceMode === opt.id
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {editingChefOrder.serviceMode === 'BEU' && (
                <input
                  type="text"
                  value={editingChefOrder.beuOrderId}
                  onChange={(e) => setEditingChefOrder(prev => ({ ...prev, beuOrderId: e.target.value }))}
                  placeholder="BEU Order # (optional)"
                  className="w-full mt-1.5 bg-slate-50 border border-teal-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none"
                />
              )}
            </div>

            {/* Waiter / Taker */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 block">Waiter / Taker:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select
                  value={availableEditWaiters.includes(editingChefOrder.waiterName) ? editingChefOrder.waiterName : '__custom__'}
                  onChange={(e) => {
                    if (e.target.value !== '__custom__') {
                      setEditingChefOrder(prev => ({ ...prev, waiterName: e.target.value }));
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none"
                >
                  {availableEditWaiters.map(w => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                  {!availableEditWaiters.includes(editingChefOrder.waiterName) && (
                    <option value="__custom__">{editingChefOrder.waiterName || 'Custom'}</option>
                  )}
                </select>
                <input
                  type="text"
                  value={editingChefOrder.waiterName}
                  onChange={(e) => setEditingChefOrder(prev => ({ ...prev, waiterName: e.target.value }))}
                  placeholder="Or type custom waiter..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none"
                />
              </div>
            </div>

            {/* Order Items List + Add Item */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-700 block">Order Dishes ({editingChefOrder.items.length}):</label>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {editingChefOrder.items.map((it, idx) => (
                  <div key={`${it.id}-${idx}`} className="flex items-center justify-between gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
                    <span className="font-black text-slate-900 truncate flex-1">{it.name}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEditOrderItemQty(idx, -1)}
                        className="w-6 h-6 rounded-lg bg-white border border-slate-200 font-black flex items-center justify-center"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-black text-emerald-900">{it.qty}</span>
                      <button
                        type="button"
                        onClick={() => handleEditOrderItemQty(idx, 1)}
                        className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black flex items-center justify-center"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <select
                  value={editingChefOrder.addDishId}
                  onChange={(e) => setEditingChefOrder(prev => ({ ...prev, addDishId: e.target.value }))}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 outline-none"
                >
                  {fullEditableMenuDishes.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.price} ETB)</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddDishToEditingOrder}
                  className="px-3 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-black shrink-0"
                >
                  + Add Dish
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleDeleteEditedChefOrder}
                disabled={isSavingChefOrderEdit}
                className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-black flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingChefOrder(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingChefOrderEdit || editingChefOrder.items.length === 0}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black shadow-sm"
                >
                  {isSavingChefOrderEdit ? 'Saving...' : 'Save Order Changes'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
