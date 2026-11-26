import React, { useState, useMemo, useEffect } from 'react';
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
  Sparkles as WandSparkles
} from 'lucide-react';
import { toEthiopianDateString, toEthiopianShortDate } from './BusinessManagement';
import WaiterPendingLedgerModal from './WaiterPendingLedgerModal';
import ShiftSlipModal from './ShiftSlipModal';
import {
  aggregateChefOrders,
  compareChefVsIncomeSheet,
  toLocalIsoDate,
  getShiftDefaultWaiters,
  saveShiftDefaultWaiters
} from '../utils/reconciliationHelpers';

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
  }, [settlementsHistory]);

  // 4. Stored Waiter Pending Debts
  const [pendingDebts, setPendingDebts] = useState(() => {
    const saved = localStorage.getItem('maraki_waiter_pending_debts');
    if (saved) return JSON.parse(saved);
    // Seed initial debts matching manual examples
    return [
      {
        id: 'deb-1',
        waiterName: 'አስቴር (Aster)',
        itemType: 'food',
        dishName: 'Special Burger',
        unitPrice: 250,
        totalUnits: 2,
        remainingUnits: 2,
        totalAmount: 500,
        remainingAmount: 500,
        shift: 'Day',
        date: selectedDate,
        createdAt: new Date().toISOString(),
        status: 'pending'
      },
      {
        id: 'deb-2',
        waiterName: 'ዳዊት (Dawit)',
        itemType: 'juice',
        dishName: 'Juice Cups',
        unitPrice: DEFAULT_JUICE_PRICE,
        totalUnits: 3,
        remainingUnits: 3,
        totalAmount: 510,
        remainingAmount: 510,
        shift: 'Day',
        date: selectedDate,
        createdAt: new Date().toISOString(),
        status: 'pending'
      }
    ];
  });
  useEffect(() => {
    localStorage.setItem('maraki_waiter_pending_debts', JSON.stringify(pendingDebts));
  }, [pendingDebts]);

  // Modal state for full Pending Debts Ledger Page
  const [showPendingLedgerModal, setShowPendingLedgerModal] = useState(false);

  // Sync pending debts if updated elsewhere or in other windows
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
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
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

  // Resolve Chef Sent Orders (prop or localStorage fallback)
  const resolvedOrders = useMemo(() => {
    if (orders && orders.length > 0) return orders;
    try {
      const saved = localStorage.getItem('maraki_chef_sent_orders');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }, [orders]);

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
    if (!chefSummary || chefSummary.totalOrders === 0) return;
    const next = {};
    Object.entries(chefSummary.dishCounts).forEach(([key, info]) => {
      const qty = mode === 'takeaway' ? info.takeawayQty : info.qty;
      if (qty > 0) next[key] = qty;
    });
    setFoodAssignments(next);
  };

  const filteredDishes = useMemo(() => {
    if (activeFoodCategory === 'All') return dishesList;
    return dishesList.filter(d => d.category === activeFoodCategory);
  }, [dishesList, activeFoodCategory]);

  const updateDishQty = (dishId, delta) => {
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
  // Connected dynamically to the pending page ledger.
  // Defaults to empty ({}) so the shift starts at +0 ETB until explicitly selected by cashier.
  const [recoverySelections, setRecoverySelections] = useState({});

  const activeDebtsForShift = useMemo(() => {
    return pendingDebts.filter(d => d.status === 'pending');
  }, [pendingDebts]);

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
    setRecoverySelections(prev => {
      const cur = prev[debtId] || { selected: true, unitsToRecover: debt.remainingUnits };
      const next = Math.max(1, Math.min(debt.remainingUnits, cur.unitsToRecover + delta));
      return {
        ...prev,
        [debtId]: { selected: true, unitsToRecover: next }
      };
    });
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
      setRecoverySelections({});
      setDailyExpenses([]);
      setBankTransfers([]);
      localStorage.removeItem('maraki_shift_manual_transfers');
    }
  }, [selectedDate, selectedShift]);

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

    // Update Pending Debts
    // 1. Add new pending debt if entered (Itemized by dish & juice)
    if (deductedPendingDebt > 0) {
      const newDebts = [];
      pendingFoodItems.forEach((item, idx) => {
        if (item.qty > 0) {
          newDebts.push({
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
            createdAt: new Date().toISOString(),
            status: 'pending'
          });
        }
      });

      if (Number(pendingJuiceCupsInput) > 0) {
        newDebts.push({
          id: `deb-${Date.now()}-juice`,
          waiterName: pendingWaiterName,
          itemType: 'juice',
          dishName: 'Juice Cups (የጁስ ኩባያዎች)',
          unitPrice: effectiveJuicePrice,
          totalUnits: Number(pendingJuiceCupsInput),
          remainingUnits: Number(pendingJuiceCupsInput),
          totalAmount: Number(pendingJuiceCupsInput) * effectiveJuicePrice,
          remainingAmount: Number(pendingJuiceCupsInput) * effectiveJuicePrice,
          shift: selectedShift,
          date: selectedDate,
          createdAt: new Date().toISOString(),
          status: 'pending'
        });
      }

      setPendingDebts(prev => [...newDebts, ...prev]);
    }

    // 2. Decrement or complete recovered debts
    setPendingDebts(prev => {
      return prev.map(d => {
        const sel = recoverySelections[d.id];
        if (sel && sel.selected) {
          const remUnits = Math.max(0, d.remainingUnits - sel.unitsToRecover);
          const remAmt = remUnits * d.unitPrice;
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
    <div className={embeddedMode ? 'bg-[#FDFBF7] text-slate-800 pb-24 rounded-3xl border border-emerald-100 shadow-sm overflow-hidden font-sans antialiased' : 'min-h-screen bg-[#FDFBF7] text-slate-800 pb-28 selection:bg-emerald-600 selection:text-white font-sans antialiased'}>
      
      {/* ============================================================== */}
      {/* 1. TOP HEADER & SHIFT / DATE NAVIGATION (EMERALD POS THEME)     */}
      {/* ============================================================== */}
      <header className={`bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white ${embeddedMode ? 'rounded-t-3xl' : 'sticky top-0 z-40'} shadow-lg shadow-emerald-800/10`}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          
          {/* Brand & Manual Module Indicator */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-xl shadow-inner">
              📋
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-base sm:text-lg tracking-tight text-white drop-shadow-sm">
                  DAILY INCOME SHEET
                </h1>
                <span className="text-[10px] font-black uppercase tracking-wider bg-white text-emerald-800 px-2 py-0.5 rounded-full shadow-sm">
                  የፈረቃ ገቢ ማጠቃለያ
                </span>
              </div>
              <p className="text-[11px] text-emerald-100 font-bold">
                Anti-Skimming Settlement Engine & Drawer Cash Lock
              </p>
            </div>
          </div>

          {/* Quick Station Switches, History & Waiter Debts Ledger */}
          <div className="flex items-center gap-2">
            
            {/* Waiter Pending Debts Ledger Button */}
            <button
              type="button"
              onClick={() => setShowPendingLedgerModal(true)}
              className="px-2.5 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-black flex items-center gap-1.5 border border-white/25 transition-all shadow-sm active:scale-95"
              title="Waiter Pending Debts Ledger"
            >
              <Clock className="w-3.5 h-3.5 text-emerald-200" />
              <span className="hidden sm:inline">Waiter Debts</span>
              <span className="text-[10px] bg-emerald-900/60 px-1.5 py-0.2 rounded-full text-emerald-200 border border-white/20">
                {activeDebtsForShift.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowHistoryModal(true)}
              className="px-2.5 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-black flex items-center gap-1 border border-white/25 transition-all shadow-sm"
              title="Shift Settlements History"
            >
              <History className="w-3.5 h-3.5 text-emerald-200" />
              <span className="hidden sm:inline">Shift History</span>
              <span className="text-[10px] bg-emerald-900/60 px-1.5 py-0.2 rounded-full text-emerald-200 border border-white/20">
                {settlementsHistory.length}
              </span>
            </button>

            {onSwitchToChef && (
              <button
                type="button"
                onClick={onSwitchToChef}
                className="px-2.5 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-black flex items-center gap-1 border border-white/25 transition-all shadow-sm"
              >
                <span>👩‍🍳 Chef POS</span>
              </button>
            )}

            {onSwitchToOwner && (
              <button
                type="button"
                onClick={onSwitchToOwner}
                className="px-2.5 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-black flex items-center gap-1 border border-white/25 transition-all shadow-sm"
              >
                <span>👑 Owner Center</span>
              </button>
            )}

            {onLockReconciliation && !embeddedMode && (
              <button
                type="button"
                onClick={onLockReconciliation}
                className="px-2.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/35 text-white rounded-xl text-xs font-black flex items-center gap-1 border border-rose-300/30 transition-all shadow-sm"
                title="Lock Shift Reconciliation"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Lock</span>
              </button>
            )}

            {onBackToPortal && (
              <button
                type="button"
                onClick={onBackToPortal}
                className="px-2.5 py-1.5 bg-black/20 hover:bg-black/30 text-emerald-100 rounded-xl text-xs font-black flex items-center gap-1 border border-white/15 transition-all shadow-sm"
              >
                <span>← Portal</span>
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
          <div className="bg-slate-900 text-white px-4 py-3.5 rounded-2xl border border-emerald-500/30 shadow-md flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </span>
              <div>
                <p className="text-xs sm:text-sm font-black">
                  🔒 {selectedShift} Shift ({selectedDate}) Is Closed & Saved
                </p>
                <p className="text-[11px] text-slate-300 font-bold">
                  Drawer Cash: {currentSavedSettlement.physicalCashInDrawer?.toLocaleString()} ETB • Carry-over saved for next shift
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => { setIsPostSaveSlip(false); setActivePrintTicket(currentSavedSettlement); }}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-black"
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
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black"
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
                  2. FOOD BOX RECONCILIATION ("THE ANTI-SKIMMING ENGINE")
                </h2>
                <p className="text-[11px] text-slate-500 font-bold">
                  Kitchen packaging consumption vs waitstaff sales output (Total Boxes Sold ≡ Chef Sent Total)
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

          {/* LIVE CHEF SENT ORDERS CROSS-CHECK BAR + RED ALARM ENGINE */}
          <div className={`rounded-2xl p-4 border-2 transition-all ${
            !chefComparison.hasChefOrders
              ? 'bg-slate-50 border-slate-200 text-slate-700'
              : chefComparison.hasMismatch
                ? 'bg-rose-50 border-rose-500 text-rose-950 shadow-md shadow-rose-500/15'
                : 'bg-emerald-50/80 border-emerald-400 text-emerald-950'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg font-black ${
                  !chefComparison.hasChefOrders
                    ? 'bg-slate-200 text-slate-600'
                    : chefComparison.hasMismatch
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-emerald-600 text-white'
                }`}>
                  {chefComparison.hasMismatch ? <BellRing className="w-5 h-5" /> : chefComparison.hasChefOrders ? <CheckCircle2 className="w-5 h-5" /> : <ClipboardCheck className="w-5 h-5" />}
                </span>
                <div>
                  <h3 className="text-xs sm:text-sm font-black">
                    {!chefComparison.hasChefOrders
                      ? 'Chef Orders Cross-Check: 0 Chef POS Orders Logged for This Shift'
                      : chefComparison.hasMismatch
                        ? '🚨 RED ALARM: TOTAL FOOD COUNT DOES NOT MATCH CHEF SENT ORDERS!'
                        : '✅ CHEF SENT TOTAL ≡ INCOME SHEET TOTAL MATCHED'}
                  </h3>
                  <p className="text-[11px] font-bold opacity-80 mt-0.5">
                    {chefComparison.hasChefOrders ? (
                      <>
                        Chef POS Sent: <strong>{chefSummary.totalOrders} orders</strong> ({chefComparison.chefTakeawayBoxes} Takeaway boxes
                        {chefComparison.chefHomeDishes > 0 ? ` + ${chefComparison.chefHomeDishes} Home dine-in` : ''} = <strong>{chefComparison.chefTotalFood} total</strong>) •
                        Income Sheet Entered: <strong>{chefComparison.incomeSheetTotal} boxes/food</strong>
                        {chefComparison.hasDishTypeVariance && (
                          <span className="ml-2 text-emerald-800 font-black">
                            (Different dish types clicked, total count matches — OK ✔)
                          </span>
                        )}
                      </>
                    ) : (
                      'When Chef sends orders from Kitchen POS for this date & shift, total box count will automatically cross-check below.'
                    )}
                  </p>
                </div>
              </div>

              {chefComparison.hasChefOrders && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleLoadFromChefOrders('takeaway')}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 text-[11px] font-black transition-all shadow-2xs active:scale-95"
                    title="Auto-fill Income Sheet dishes using Chef Takeaway orders"
                  >
                    Sync Takeaway ({chefComparison.chefTakeawayBoxes})
                  </button>
                  {chefComparison.chefHomeDishes > 0 && (
                    <button
                      type="button"
                      onClick={() => handleLoadFromChefOrders('all')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black transition-all shadow-2xs active:scale-95"
                      title="Auto-fill all Chef Food (Takeaway + Home)"
                    >
                      Sync All Food ({chefComparison.chefTotalFood})
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Dish-by-Dish Discrepancy Table when Red Alarm fires */}
            {chefComparison.hasMismatch && chefComparison.dishDiffs.length > 0 && (
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

          {/* Dish Category Selector */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-black text-slate-700">
              Assign Sold Food Dishes:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {['All', 'Sandwiches', 'Salad', 'Pasta & Rice', 'Eggs & Firfir'].map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveFoodCategory(cat)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-black transition-all ${
                    activeFoodCategory === cat
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'All' ? '🌟 All Dishes' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Stepper Dishes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto p-2 border border-slate-200 rounded-2xl bg-slate-50/70">
            {filteredDishes.map(dish => {
              const qty = foodAssignments[dish.id] || 0;
              const subtotal = qty * dish.price;
              return (
                <div 
                  key={dish.id}
                  className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between gap-2 ${
                    qty > 0 
                      ? 'bg-white border-2 border-emerald-500 shadow-sm' 
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-200'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-slate-900 truncate">
                      {dish.name}
                    </p>
                    <p className="text-[10px] text-emerald-700 font-bold">
                      {dish.price} ETB {qty > 0 && `• ${subtotal.toLocaleString()} ETB`}
                    </p>
                  </div>

                  {/* Stepper: [-] Qty [+] */}
                  <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => updateDishQty(dish.id, -1)}
                      disabled={qty === 0}
                      className="w-6 h-6 rounded-lg bg-slate-200 hover:bg-slate-300 disabled:opacity-30 text-slate-800 flex items-center justify-center font-black active:scale-90"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-black text-emerald-900">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateDishQty(dish.id, 1)}
                      className="w-6 h-6 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center font-black active:scale-90"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* THE 3 ANTI-SKIMMING RECONCILIATION STATES (STATE A, B, C) */}
          <div className="pt-1">
            {isFoodBoxesBalanced ? (
              <div className="bg-emerald-50 border-2 border-emerald-500/70 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-2 text-emerald-900 animate-in fade-in shadow-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-lg">
                    ✔
                  </span>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-emerald-900">
                      Food Boxes Balanced: {totalAssignedBoxes} / {targetFoodSold} assigned ({totalFoodRevenue.toLocaleString()} ETB)
                    </h3>
                    <p className="text-[11px] text-emerald-700 font-bold">
                      የኩሽና ቦክስና የአስተናጋጆች ትዕዛዝ ሙሉ በሙሉ ተመጣጥኗል (Save Settlement Enabled)
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black px-3 py-1 bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-300">
                  STATE A: BALANCED ✔
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
                      Under-assigned: {Math.abs(boxDifference)} boxes remaining to assign
                    </h3>
                    <p className="text-[11px] text-amber-700 font-bold">
                      ከኩሽና ከወጡት ቦክሶች {Math.abs(boxDifference)} የሚሆኑት አልተመደቡም፤ እባክዎ ምግቦቹን ይመድቡ
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black px-3 py-1 bg-amber-100 text-amber-800 rounded-xl border border-amber-300 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" />
                  <span>STATE B: UNDER-ASSIGNED ⚠️</span>
                </span>
              </div>
            ) : (
              <div className="bg-rose-50 border-2 border-rose-500/70 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-2 text-rose-900 animate-in fade-in shadow-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center text-lg">
                    ❌
                  </span>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-rose-900">
                      Over-assigned: Assigned exceeds physical boxes by {boxDifference}
                    </h3>
                    <p className="text-[11px] text-rose-700 font-bold">
                      የተመደቡት ምግቦች ብዛት በኩሽና ከተፈጁት ቦክሶች በ {boxDifference} በልጠዋል
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black px-3 py-1 bg-rose-100 text-rose-800 rounded-xl border border-rose-300 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" />
                  <span>STATE C: OVER-ASSIGNED ❌</span>
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
                <h2 className="text-sm sm:text-base font-black text-slate-900">
                  4. RECOVERING PENDING PAYMENTS FROM WAITERS
                </h2>
                <p className="text-[11px] text-slate-500 font-bold">
                  Past shift debts collected from waitstaff (Adds directly to cash drawer)
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPendingLedgerModal(true)}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-700" />
                <span>📋 Open Waiter Debts Ledger →</span>
              </button>
              <span className="text-xs font-black text-emerald-900 bg-emerald-100/80 border border-emerald-200 px-3 py-1.5 rounded-xl">
                + {recoveredCashAdded.toLocaleString()} ETB Collected
              </span>
            </div>
          </div>

          {/* List of Pending Debt Tickets with Steppers */}
          <div className="space-y-3">
            {activeDebtsForShift.length === 0 ? (
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
                <p className="text-xs text-slate-700 font-bold">
                  ✓ No pending debts across shifts
                </p>
                <p className="text-[11px] text-slate-500">
                  New debts can be logged in Section 3 above or inside the Waiter Debts Ledger page.
                </p>
                <button
                  type="button"
                  onClick={() => setShowPendingLedgerModal(true)}
                  className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-black inline-flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <span>Open Waiter Debts Ledger</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ) : (
              activeDebtsForShift.map(debt => {
                const sel = recoverySelections[debt.id];
                const isSelected = sel?.selected || false;
                const unitsToRecover = sel?.unitsToRecover || debt.remainingUnits;
                const recoveredAmt = unitsToRecover * debt.unitPrice;

                return (
                  <div
                    key={debt.id}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-wrap items-center justify-between gap-3 ${
                      isSelected 
                        ? 'bg-emerald-50/90 border-2 border-emerald-500 text-slate-900 shadow-sm' 
                        : 'bg-slate-50 border border-slate-200 text-slate-600 hover:border-emerald-200'
                    }`}
                  >
                    {/* Checkbox & Waiter Info */}
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleDebtSelection(debt.id)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-white border-slate-300 cursor-pointer accent-emerald-600"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs text-slate-900">
                            Waiter: {debt.waiterName}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-emerald-800 border border-slate-200 shadow-2xs">
                            {debt.itemType === 'food' ? '🍱 Food' : '🥤 Juice'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {debt.remainingUnits} {debt.itemType === 'food' ? 'boxes' : 'cups'} • {debt.remainingAmount} ETB • {debt.shift} ({debt.dishName})
                        </p>
                      </div>
                    </div>

                    {/* Stepper: Recover Units [-] chosen / max [+] */}
                    {isSelected && (
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-slate-600 font-bold">
                          Recover Units:
                        </span>
                        <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-xl border border-slate-200 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => updateDebtUnitsToRecover(debt.id, -1)}
                            disabled={unitsToRecover <= 1}
                            className="w-5 h-5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-800 flex items-center justify-center font-black"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="px-2 text-xs font-black text-emerald-900">
                            {unitsToRecover} / {debt.remainingUnits}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateDebtUnitsToRecover(debt.id, 1)}
                            disabled={unitsToRecover >= debt.remainingUnits}
                            className="w-5 h-5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white flex items-center justify-center font-black"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                        <span className="font-black text-xs text-emerald-900 min-w-16 text-right">
                          + {recoveredAmt.toLocaleString()} ETB
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
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

    </div>
  );
}
