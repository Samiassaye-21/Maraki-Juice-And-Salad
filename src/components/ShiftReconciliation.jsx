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
  RotateCcw
} from 'lucide-react';
import { toEthiopianDateString, toEthiopianShortDate } from './BusinessManagement';

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

export default function ShiftReconciliation({
  orders = [],
  waiters = [],
  foodMenu = [],
  onBackToPortal,
  onSwitchToChef,
  onSwitchToOwner
}) {
  // 1. Shift View Mode: 'Day' | 'Night'
  const [selectedShift, setSelectedShift] = useState('Day');

  // 2. Date Selection (Synchronized Ethiopian Date)
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
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

  // ==============================================================
  // SECTION 1: JUICE CUPS (170 ETB / cup) & beU Delivery State
  // ==============================================================
  // Check if carry-over cups from previous Day shift exist
  const carryOverCups = useMemo(() => {
    const key = `maraki_cups_carry_${selectedDate}_Day`;
    const saved = localStorage.getItem(key);
    return saved ? Number(saved) : null;
  }, [selectedDate]);

  const [cupsGiven, setCupsGiven] = useState(() => {
    return 100;
  });
  const [cupsLeft, setCupsLeft] = useState(20);
  const [beuDeliveryCups, setBeuDeliveryCups] = useState(10);

  // When switching to Night shift, auto-fill Cups Given from Day shift's Cups Left if available
  useEffect(() => {
    if (selectedShift === 'Night') {
      const daySettlement = settlementsHistory.find(s => s.date === selectedDate && s.shift === 'Day');
      if (daySettlement && daySettlement.cupsLeft !== undefined) {
        setCupsGiven(daySettlement.cupsLeft);
      } else if (carryOverCups !== null) {
        setCupsGiven(carryOverCups);
      }
    }
  }, [selectedShift, selectedDate, settlementsHistory, carryOverCups]);

  // Section 1 Math
  const juiceSold = Math.max(0, Number(cupsGiven || 0) - Number(cupsLeft || 0));
  const inStoreJuiceSold = Math.max(0, juiceSold - Number(beuDeliveryCups || 0));
  const grossJuiceRevenue = juiceSold * DEFAULT_JUICE_PRICE;
  const beuDeliveryDeduction = Number(beuDeliveryCups || 0) * DEFAULT_JUICE_PRICE;

  // ==============================================================
  // SECTION 2: FOOD BOX RECONCILIATION ("Anti-Skimming Engine")
  // ==============================================================
  const [boxesGiven, setBoxesGiven] = useState(50);
  const [boxesLeft, setBoxesLeft] = useState(15);
  const targetFoodSold = Math.max(0, Number(boxesGiven || 0) - Number(boxesLeft || 0));

  const [activeFoodCategory, setActiveFoodCategory] = useState('All');
  const [foodAssignments, setFoodAssignments] = useState(() => {
    // Default initial assignment matching manual example (20 Special Burger + 15 Club Sandwich = 35 boxes)
    return {
      'sb': 20,
      'cs': 15
    };
  });

  const dishesList = useMemo(() => {
    return DEFAULT_RECONCILIATION_DISHES;
  }, []);

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
  // ==============================================================
  const [pendingJuiceCupsInput, setPendingJuiceCupsInput] = useState(4);
  const [pendingFoodBoxesInput, setPendingFoodBoxesInput] = useState(2);
  const [pendingFoodDishId, setPendingFoodDishId] = useState('sb'); // Default: Special Burger
  const [pendingWaiterName, setPendingWaiterName] = useState('አቤል (Waiter Abel)');
  const [pendingNote, setPendingNote] = useState('');

  const selectedPendingDish = useMemo(() => {
    return dishesList.find(d => d.id === pendingFoodDishId) || dishesList[0];
  }, [dishesList, pendingFoodDishId]);

  const pendingFoodAmount = (Number(pendingFoodBoxesInput) || 0) * (selectedPendingDish?.price || 0);
  const pendingJuiceAmount = (Number(pendingJuiceCupsInput) || 0) * DEFAULT_JUICE_PRICE;
  const deductedPendingDebt = pendingJuiceAmount + pendingFoodAmount;

  // ==============================================================
  // SECTION 4: RECOVERING PENDING PAYMENTS FROM WAITERS
  // ==============================================================
  // Selection map: { debtId: { selected: boolean, unitsToRecover: number } }
  const [recoverySelections, setRecoverySelections] = useState(() => {
    return {
      'deb-1': { selected: true, unitsToRecover: 1 }, // Aster: 1 of 2 boxes recovered (+250 ETB)
      'deb-2': { selected: true, unitsToRecover: 3 }  // Dawit: 3 of 3 cups recovered (+510 ETB)
    };
  });

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
      const debt = pendingDebts.find(d => d.id === debtId);
      if (debt) {
        sum += (Number(info.unitsToRecover) || 0) * debt.unitPrice;
      }
    });
    return sum;
  }, [recoverySelections, pendingDebts]);

  // ==============================================================
  // SECTION 5: DAILY OPERATING EXPENSES
  // ==============================================================
  const [dailyExpenses, setDailyExpenses] = useState([
    { id: 'exp-1', name: 'ሎሚ (Lemons - Fruit & Veg)', category: 'Fruit & Veg (ፍራፍሬና አትክልት)', amount: 300 }
  ]);
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
  // SECTION 6: BANK TRANSFERS & SMS ANTI-FRAUD VERIFICATION
  // ==============================================================
  const [bankTransfers, setBankTransfers] = useState([
    {
      id: 'txn-1',
      refNumber: 'FT248902891',
      channel: 'Telebirr',
      amount: 2500,
      isVerified: true
    }
  ]);
  const [newTxnRef, setNewTxnRef] = useState('');
  const [newTxnAmount, setNewTxnAmount] = useState('');
  const [newTxnChannel, setNewTxnChannel] = useState('Telebirr');

  // Manager PIN Override State
  const [showPinModalForTxn, setShowPinModalForTxn] = useState(null);
  const [pinOverrideInput, setPinOverrideInput] = useState('');
  const [pinError, setPinError] = useState(null);

  const handleAddTransfer = (e) => {
    e.preventDefault();
    if (!newTxnRef.trim() || !newTxnAmount) return;
    // Auto-verify if ref starts with FT or TXN, otherwise requires manager PIN
    const isAutoVerified = newTxnRef.trim().toUpperCase().startsWith('FT') || newTxnRef.trim().toUpperCase().startsWith('TXN');
    const newEntry = {
      id: `txn-${Date.now()}`,
      refNumber: newTxnRef.trim().toUpperCase(),
      channel: newTxnChannel,
      amount: Number(newTxnAmount) || 0,
      isVerified: isAutoVerified
    };
    setBankTransfers(prev => [...prev, newEntry]);
    setNewTxnRef('');
    setNewTxnAmount('');
  };

  const handleRemoveTransfer = (id) => {
    setBankTransfers(prev => prev.filter(t => t.id !== id));
  };

  const handleVerifyWithPin = (e) => {
    e.preventDefault();
    if (pinOverrideInput.trim() === '1234' || pinOverrideInput.trim() === '0000') {
      if (showPinModalForTxn) {
        setBankTransfers(prev => prev.map(t => t.id === showPinModalForTxn.id ? { ...t, isVerified: true } : t));
      }
      setShowPinModalForTxn(null);
      setPinOverrideInput('');
      setPinError(null);
    } else {
      setPinError('❌ የተሳሳተ ማናጀር ፒን ነው (Default PIN: 1234)');
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
  // SAVE SETTLEMENT & PRINT TICKET MODAL
  // ==============================================================
  const [activePrintTicket, setActivePrintTicket] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [saveSuccessBanner, setSaveSuccessBanner] = useState(false);

  const handleSaveSettlement = () => {
    if (!isFoodBoxesBalanced) return;

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
      pendingJuiceCups: Number(pendingJuiceCupsInput) || 0,
      pendingFoodBoxes: Number(pendingFoodBoxesInput) || 0,
      pendingWaiterName,
      deductedPendingDebt,
      recoveredCashAdded,
      dailyExpenses: [...dailyExpenses],
      totalDailyExpenses,
      bankTransfers: [...bankTransfers],
      totalBankTransfers,
      physicalCashInDrawer,
      savedAt: new Date().toISOString()
    };

    // Save carry-over cups for the day
    localStorage.setItem(`maraki_cups_carry_${selectedDate}_${selectedShift}`, (Number(cupsLeft) || 0).toString());

    // Update Settlements History
    setSettlementsHistory(prev => {
      const filtered = prev.filter(s => s.id !== settlementId);
      return [newRecord, ...filtered];
    });

    // Update Pending Debts
    // 1. Add new pending debt if entered
    if (deductedPendingDebt > 0) {
      const newDebtItem = {
        id: `deb-${Date.now()}`,
        waiterName: pendingWaiterName,
        itemType: pendingFoodAmount > 0 ? 'food' : 'juice',
        dishName: selectedPendingDish?.name || 'Juice/Food',
        unitPrice: selectedPendingDish?.price || DEFAULT_JUICE_PRICE,
        totalUnits: Number(pendingFoodBoxesInput || pendingJuiceCupsInput || 1),
        remainingUnits: Number(pendingFoodBoxesInput || pendingJuiceCupsInput || 1),
        totalAmount: deductedPendingDebt,
        remainingAmount: deductedPendingDebt,
        shift: selectedShift,
        date: selectedDate,
        createdAt: new Date().toISOString(),
        status: 'pending'
      };
      setPendingDebts(prev => [newDebtItem, ...prev]);
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
            status: remUnits === 0 ? 'completed' : 'pending'
          };
        }
        return d;
      });
    });

    setActivePrintTicket(newRecord);
    setSaveSuccessBanner(true);
    setTimeout(() => setSaveSuccessBanner(false), 4000);
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
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-28 selection:bg-amber-500 selection:text-slate-950 font-sans">
      
      {/* ============================================================== */}
      {/* 1. TOP HEADER & SHIFT / DATE NAVIGATION                         */}
      {/* ============================================================== */}
      <header className="bg-slate-950/90 backdrop-blur-md sticky top-0 z-40 border-b border-slate-800 shadow-xl">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          
          {/* Brand & Manual Module Indicator */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-400/30 flex items-center justify-center text-xl shadow-inner">
              📋
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-base sm:text-lg tracking-tight text-white">
                  DAILY INCOME SHEET
                </h1>
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full shadow-sm">
                  የፈረቃ ገቢ ማጠቃለያ
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-bold">
                Anti-Skimming Settlement Engine & Drawer Cash Lock
              </p>
            </div>
          </div>

          {/* Quick Station Switches & History */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowHistoryModal(true)}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-black flex items-center gap-1 border border-slate-700 transition-all"
              title="ያለፉ ፈረቃዎች"
            >
              <History className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">ያለፉ ፈረቃዎች</span>
              <span className="text-[10px] bg-slate-900 px-1.5 py-0.2 rounded-full text-amber-300">
                {settlementsHistory.length}
              </span>
            </button>

            {onSwitchToChef && (
              <button
                type="button"
                onClick={onSwitchToChef}
                className="px-2.5 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 rounded-xl text-xs font-black flex items-center gap-1 border border-emerald-500/30 transition-all"
              >
                <span>👩‍🍳 Chef POS</span>
              </button>
            )}

            {onSwitchToOwner && (
              <button
                type="button"
                onClick={onSwitchToOwner}
                className="px-2.5 py-1.5 bg-amber-600/30 hover:bg-amber-600/40 text-amber-300 rounded-xl text-xs font-black flex items-center gap-1 border border-amber-500/30 transition-all"
              >
                <span>👑 Owner Center</span>
              </button>
            )}

            {onBackToPortal && (
              <button
                type="button"
                onClick={onBackToPortal}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-black flex items-center gap-1 border border-slate-700 transition-all"
              >
                <span>← ፖርታል</span>
              </button>
            )}
          </div>

        </div>

        {/* Date Navigator & Shift Toggle (☀️ Day vs 🌙 Night) */}
        <div className="bg-slate-950 border-t border-slate-800/80 px-4 py-2">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
            
            {/* Ethiopian Date Navigator */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleShiftDate(-1)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300"
                title="ቀዳሚ ቀን"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-black text-amber-300">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>{toEthiopianDateString(selectedDate)}</span>
                <span className="text-[10px] text-slate-500 font-bold">({selectedDate})</span>
              </div>

              <button
                type="button"
                onClick={() => handleShiftDate(1)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300"
                title="ቀጣይ ቀን"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-300 rounded-xl"
              >
                ዛሬ (Today)
              </button>
            </div>

            {/* Shift Filter: ( ☀️ Day ) [ 🌙 Night ] */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedShift('Day')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                  selectedShift === 'Day'
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                    : 'text-slate-400 hover:text-slate-200'
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
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>🌙 Night (ማታ ፈረቃ)</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Save Success Toast Banner */}
      {saveSuccessBanner && (
        <div className="max-w-6xl mx-auto px-4 mt-3">
          <div className="bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-2xl text-xs font-black flex items-center justify-between shadow-lg animate-in fade-in">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>የፈረቃው ሂሳብ ሙሉ በሙሉ ተዘግቶ በሲስተሙ ተመዝግቧል! (Shift Settlement Saved Successfully)</span>
            </span>
            <button 
              type="button"
              onClick={() => setActivePrintTicket(settlementsHistory[0])}
              className="underline text-emerald-200 hover:text-white"
            >
              ደረሰኝ እይ / አትም
            </button>
          </div>
        </div>
      )}

      {/* Main Content: 7 Progressive Settlement Cards */}
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* ============================================================== */}
        {/* CARD 1: 🥤 JUICE CUPS (170 ETB / cup) & beU Delivery            */}
        {/* ============================================================== */}
        <section className="bg-slate-950 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center text-lg">
                🥤
              </span>
              <div>
                <h2 className="text-sm sm:text-base font-black text-white">
                  1. JUICE CUPS INVENTORY & beU DELIVERY
                </h2>
                <p className="text-[11px] text-slate-400 font-bold">
                  የጁስ ኩባያዎች ቁጥጥርና የቢዩ ዲሊቨሪ ተቀናሽ (Standard: {DEFAULT_JUICE_PRICE} ETB / cup)
                </p>
              </div>
            </div>
            {selectedShift === 'Night' && carryOverCups !== null && (
              <span className="text-[11px] font-black text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-xl">
                🔄 ከቀን ፈረቃ የተላለፈ፡ {carryOverCups} ኩባያ
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Cups Given */}
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-1.5">
              <label className="text-xs font-black text-slate-300 block">
                የተሰጡ ኩባያዎች (Cups Given)
              </label>
              <input
                type="number"
                min="0"
                value={cupsGiven}
                onChange={(e) => setCupsGiven(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-lg font-black text-amber-300 outline-none focus:border-amber-400"
                placeholder="100"
              />
              <span className="text-[10px] text-slate-500 font-bold block">
                ለፈረቃው የገቡ ፕላስቲክ ኩባያዎች
              </span>
            </div>

            {/* Cups Left */}
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-1.5">
              <label className="text-xs font-black text-slate-300 block">
                የተረፉ ኩባያዎች (Cups Left)
              </label>
              <input
                type="number"
                min="0"
                value={cupsLeft}
                onChange={(e) => setCupsLeft(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-lg font-black text-cyan-300 outline-none focus:border-cyan-400"
                placeholder="20"
              />
              <span className="text-[10px] text-slate-500 font-bold block">
                ሳይሸጡ በመደርደሪያ የቀሩ
              </span>
            </div>

            {/* beU Delivery Cups */}
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-1.5">
              <label className="text-xs font-black text-slate-300 block flex items-center justify-between">
                <span>beU Delivery (በቢዩ የተላኩ)</span>
                <span className="text-amber-400 text-[10px]">ባንክ ገቢ</span>
              </label>
              <input
                type="number"
                min="0"
                value={beuDeliveryCups}
                onChange={(e) => setBeuDeliveryCups(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-lg font-black text-rose-300 outline-none focus:border-rose-400"
                placeholder="10"
              />
              <span className="text-[10px] text-slate-500 font-bold block">
                ገንዘቡ ቀጥታ ወደ ድርጅት ባንክ የሚገባ
              </span>
            </div>

          </div>

          {/* Section 1 Output Calculation Bar */}
          <div className="bg-slate-900/90 rounded-2xl p-3.5 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-black text-white">
                የተሸጠ፡ <span className="text-amber-300 font-black">{juiceSold} ኩባያ</span>
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300 font-bold">
                ({inStoreJuiceSold} በቤት ውስጥ + {beuDeliveryCups} በቢዩ)
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-slate-300">
                ጠቅላላ ጁስ ገቢ፡ <strong className="text-white text-sm">{grossJuiceRevenue.toLocaleString()} ETB</strong>
              </span>
              <span className="text-rose-400 font-bold">
                (ቢዩ ተቀናሽ፡ -{beuDeliveryDeduction.toLocaleString()} ETB)
              </span>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* CARD 2: 🍱 FOOD BOX RECONCILIATION ("Anti-Skimming Engine")     */}
        {/* ============================================================== */}
        <section className="bg-slate-950 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-lg">
                🍱
              </span>
              <div>
                <h2 className="text-sm sm:text-base font-black text-white">
                  2. FOOD BOX RECONCILIATION ("THE ANTI-SKIMMING ENGINE")
                </h2>
                <p className="text-[11px] text-slate-400 font-bold">
                  የኩሽና ቦክስ ፍጆታ ከሽያጭ ጋር ማስታረቂያ (Chef output ≡ Waitstaff sales)
                </p>
              </div>
            </div>
          </div>

          {/* Boxes Given, Boxes Left, Target Food Sold */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-1.5">
              <label className="text-xs font-black text-slate-300 block">
                የተሰጡ ቦክሶች (Boxes Given)
              </label>
              <input
                type="number"
                min="0"
                value={boxesGiven}
                onChange={(e) => setBoxesGiven(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-lg font-black text-amber-300 outline-none focus:border-amber-400"
                placeholder="50"
              />
              <span className="text-[10px] text-slate-500 font-bold block">
                ወደ ኩሽና የገቡ ባዶ ቦክሶች
              </span>
            </div>

            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-1.5">
              <label className="text-xs font-black text-slate-300 block">
                የተረፉ ቦክሶች (Boxes Left)
              </label>
              <input
                type="number"
                min="0"
                value={boxesLeft}
                onChange={(e) => setBoxesLeft(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-lg font-black text-cyan-300 outline-none focus:border-cyan-400"
                placeholder="15"
              />
              <span className="text-[10px] text-slate-500 font-bold block">
                በኩሽና የተረፉ ባዶ ቦክሶች
              </span>
            </div>

            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-1.5">
              <label className="text-xs font-black text-slate-300 block">
                የሚጠበቅ ምግብ ሽያጭ (Target Food Sold)
              </label>
              <div className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-lg font-black text-emerald-300">
                {targetFoodSold} <span className="text-xs text-slate-400 font-bold">ቦክስ</span>
              </div>
              <span className="text-[10px] text-slate-500 font-bold block">
                የተሰጡ - የተረፉ = ከኩሽና የወጡ ምግቦች
              </span>
            </div>

          </div>

          {/* Dish Category Selector */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-black text-slate-300">
              የተሸጡ ምግቦችን ይመድቡ (Assign Sold Food):
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {['All', 'Sandwiches', 'Salad', 'Pasta & Rice', 'Eggs & Firfir'].map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveFoodCategory(cat)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition-all ${
                    activeFoodCategory === cat
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat === 'All' ? '🌟 ሁሉም (All)' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Stepper Dishes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto p-1 border border-slate-800/80 rounded-2xl bg-slate-900/50">
            {filteredDishes.map(dish => {
              const qty = foodAssignments[dish.id] || 0;
              const subtotal = qty * dish.price;
              return (
                <div 
                  key={dish.id}
                  className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between gap-2 ${
                    qty > 0 
                      ? 'bg-slate-900 border-amber-500/40 shadow-sm' 
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-400'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-white truncate">
                      {dish.name}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {dish.price} ETB {qty > 0 && `• ${subtotal.toLocaleString()} ETB`}
                    </p>
                  </div>

                  {/* Stepper: [-] Qty [+] */}
                  <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => updateDishQty(dish.id, -1)}
                      disabled={qty === 0}
                      className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white flex items-center justify-center font-black active:scale-90"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-black text-amber-300">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateDishQty(dish.id, 1)}
                      className="w-6 h-6 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center font-black active:scale-90"
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
              <div className="bg-emerald-950/80 border-2 border-emerald-500/50 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-2 text-emerald-300 animate-in fade-in">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg">
                    ✔
                  </span>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black">
                      Food Boxes Balanced: {totalAssignedBoxes} / {targetFoodSold} assigned ({totalFoodRevenue.toLocaleString()} ETB)
                    </h3>
                    <p className="text-[11px] text-emerald-200/80 font-bold">
                      የኩሽና ቦክስና የአስተናጋጆች ትዕዛዝ ሙሉ በሙሉ ተመጣጥኗል (Save Settlement Enabled)
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black px-3 py-1 bg-emerald-500/20 rounded-xl border border-emerald-400/30">
                  STATE A: BALANCED ✔
                </span>
              </div>
            ) : isUnderAssigned ? (
              <div className="bg-amber-950/80 border-2 border-amber-500/50 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-2 text-amber-300 animate-in fade-in">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-lg">
                    ⚠️
                  </span>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black">
                      Under-assigned: {Math.abs(boxDifference)} boxes remaining to assign
                    </h3>
                    <p className="text-[11px] text-amber-200/80 font-bold">
                      ከኩሽና ከወጡት ቦክሶች {Math.abs(boxDifference)} የሚሆኑት አልተመደቡም፤ እባክዎ ምግቦቹን ይመድቡ
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black px-3 py-1 bg-amber-500/20 rounded-xl border border-amber-400/30 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" />
                  <span>STATE B: UNDER-ASSIGNED ⚠️</span>
                </span>
              </div>
            ) : (
              <div className="bg-rose-950/80 border-2 border-rose-500/50 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-2 text-rose-300 animate-in fade-in">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center text-lg">
                    ❌
                  </span>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black">
                      Over-assigned: Assigned exceeds physical boxes by {boxDifference}
                    </h3>
                    <p className="text-[11px] text-rose-200/80 font-bold">
                      የተመደቡት ምግቦች ብዛት በኩሽና ከተፈጁት ቦክሶች በ {boxDifference} በልጠዋል
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black px-3 py-1 bg-rose-500/20 rounded-xl border border-rose-400/30 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" />
                  <span>STATE C: OVER-ASSIGNED ❌</span>
                </span>
              </div>
            )}
          </div>
        </section>

        {/* ============================================================== */}
        {/* CARD 3: ⏳ PENDING PAYMENTS (UNPAID WITH WAITERS)               */}
        {/* ============================================================== */}
        <section className="bg-slate-950 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-800/80 pb-3">
            <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center text-lg">
              ⏳
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white">
                3. PENDING PAYMENTS (UNPAID WITH WAITERS)
              </h2>
              <p className="text-[11px] text-slate-400 font-bold">
                በአስተናጋጆች እጅ የቀሩ ሳይሰበሰቡ የወጡ ትዕዛዞች (Deducted so cashier is not penalized)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Pending Juice (Cups) */}
            <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 space-y-1">
              <label className="text-xs font-black text-slate-300 block">
                Pending Juice (Cups)
              </label>
              <input
                type="number"
                min="0"
                value={pendingJuiceCupsInput}
                onChange={(e) => setPendingJuiceCupsInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-sm font-black text-amber-300"
                placeholder="4"
              />
              <span className="text-[10px] text-slate-500 block">
                {Number(pendingJuiceCupsInput || 0) * DEFAULT_JUICE_PRICE} ETB
              </span>
            </div>

            {/* Pending Food (Boxes) */}
            <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 space-y-1">
              <label className="text-xs font-black text-slate-300 block">
                Pending Food (Boxes)
              </label>
              <input
                type="number"
                min="0"
                value={pendingFoodBoxesInput}
                onChange={(e) => setPendingFoodBoxesInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-sm font-black text-amber-300"
                placeholder="2"
              />
              <span className="text-[10px] text-slate-500 block">
                ያልተከፈለባቸው ቦክሶች
              </span>
            </div>

            {/* Food Type (Dropdown) */}
            <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 space-y-1">
              <label className="text-xs font-black text-slate-300 block">
                Food Type (Item)
              </label>
              <select
                value={pendingFoodDishId}
                onChange={(e) => setPendingFoodDishId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-black text-white"
              >
                {dishesList.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.price} ETB)
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-slate-500 block">
                የምግብ ዓይነት ምርጫ
              </span>
            </div>

            {/* Waiter Name */}
            <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 space-y-1">
              <label className="text-xs font-black text-slate-300 block">
                Waiter Name (ባለዕዳ አስተናጋጅ)
              </label>
              <input
                type="text"
                value={pendingWaiterName}
                onChange={(e) => setPendingWaiterName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-black text-white"
                placeholder="Waiter Abel"
              />
              <span className="text-[10px] text-slate-500 block">
                ገንዘቡ የሚጠበቅበት አስተናጋጅ
              </span>
            </div>

          </div>

          {/* Pending Deduction Banner */}
          <div className="bg-rose-950/60 border border-rose-500/40 rounded-2xl p-3.5 flex items-center justify-between text-xs text-rose-300">
            <span className="font-bold flex items-center gap-2">
              <span>⛔</span>
              <span>
                Deducted Pending ({pendingJuiceCupsInput} cups + {pendingFoodBoxesInput} {selectedPendingDish?.name}):
              </span>
            </span>
            <span className="text-sm font-black">
              - {deductedPendingDebt.toLocaleString()} ETB
            </span>
          </div>
        </section>

        {/* ============================================================== */}
        {/* CARD 4: 🔄 RECOVERING PENDING PAYMENTS FROM WAITERS            */}
        {/* ============================================================== */}
        <section className="bg-slate-950 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-lg">
                🔄
              </span>
              <div>
                <h2 className="text-sm sm:text-base font-black text-white">
                  4. RECOVERING PENDING PAYMENTS FROM WAITERS
                </h2>
                <p className="text-[11px] text-slate-400 font-bold">
                  ከቀደምት ፈረቃዎች በአስተናጋጆች የተመለሱ የገንዘብ ዕዳዎች (Adds directly to cash drawer)
                </p>
              </div>
            </div>
            <span className="text-xs font-black text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-3 py-1 rounded-xl">
              + {recoveredCashAdded.toLocaleString()} ETB ተሰብስቧል
            </span>
          </div>

          {/* List of Pending Debt Tickets with Steppers */}
          <div className="space-y-3">
            {activeDebtsForShift.length === 0 ? (
              <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 text-center text-xs text-slate-400 font-bold">
                ✓ ምንም ያልተሰበሰበ የአስተናጋጅ ዕዳ የለም (No pending debts)
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
                        ? 'bg-slate-900 border-cyan-500/40 shadow-sm' 
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    {/* Checkbox & Waiter Info */}
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleDebtSelection(debt.id)}
                        className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500 bg-slate-950 border-slate-700 cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs text-white">
                            Waiter: {debt.waiterName}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700">
                            {debt.itemType === 'food' ? '🍱 Food' : '🥤 Juice'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {debt.remainingUnits} {debt.itemType === 'food' ? 'boxes' : 'cups'} • {debt.remainingAmount} ETB • {debt.shift} ({debt.dishName})
                        </p>
                      </div>
                    </div>

                    {/* Stepper: Recover Units [-] chosen / max [+] */}
                    {isSelected && (
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-slate-400 font-bold">
                          Recover Units:
                        </span>
                        <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800">
                          <button
                            type="button"
                            onClick={() => updateDebtUnitsToRecover(debt.id, -1)}
                            disabled={unitsToRecover <= 1}
                            className="w-5 h-5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white flex items-center justify-center font-black"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="px-2 text-xs font-black text-cyan-300">
                            {unitsToRecover} / {debt.remainingUnits}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateDebtUnitsToRecover(debt.id, 1)}
                            disabled={unitsToRecover >= debt.remainingUnits}
                            className="w-5 h-5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white flex items-center justify-center font-black"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                        <span className="font-black text-xs text-cyan-300 min-w-16 text-right">
                          + {recoveredAmt.toLocaleString()} ETB
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* ============================================================== */}
        {/* CARD 5: 💸 DAILY OPERATING EXPENSES                             */}
        {/* ============================================================== */}
        <section className="bg-slate-950 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center text-lg">
                💸
              </span>
              <div>
                <h2 className="text-sm sm:text-base font-black text-white">
                  5. DAILY OPERATING EXPENSES
                </h2>
                <p className="text-[11px] text-slate-400 font-bold">
                  ከጥሬ ገንዘብ መመዝገቢያ የወጡ የዕለት ወጪዎች (Deducted from drawer cash)
                </p>
              </div>
            </div>
            <span className="text-xs font-black text-rose-400 bg-rose-950/60 border border-rose-500/30 px-3 py-1 rounded-xl">
              - {totalDailyExpenses.toLocaleString()} ETB
            </span>
          </div>

          {/* List of Current Daily Expenses */}
          <div className="space-y-2">
            {dailyExpenses.map(exp => (
              <div 
                key={exp.id}
                className="bg-slate-900 px-4 py-2.5 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-black text-white">{exp.name}</span>
                  <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
                    {exp.category}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-black text-rose-300">
                    {exp.amount.toLocaleString()} ETB
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveExpense(exp.id)}
                    className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                    title="ወጪ ሰርዝ"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Inline Add Expense Form */}
          <form onSubmit={handleAddExpense} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-800/80">
            <input
              type="text"
              required
              value={newExpName}
              onChange={(e) => setNewExpName(e.target.value)}
              placeholder="የወጪ ስም (e.g. በረዶ / Ice, ፌስታል)"
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-amber-400"
            />
            <select
              value={newExpCategory}
              onChange={(e) => setNewExpCategory(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-xs font-bold text-slate-300 outline-none"
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
              placeholder="መጠን (ETB)"
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-black text-amber-300 outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              className="py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ወጪ መዝግብ</span>
            </button>
          </form>
        </section>

        {/* ============================================================== */}
        {/* CARD 6: 💳 BANK TRANSFERS & SMS ANTI-FRAUD VERIFICATION        */}
        {/* ============================================================== */}
        <section className="bg-slate-950 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center text-lg">
                💳
              </span>
              <div>
                <h2 className="text-sm sm:text-base font-black text-white">
                  6. BANK TRANSFERS & SMS ANTI-FRAUD VERIFICATION
                </h2>
                <p className="text-[11px] text-slate-400 font-bold">
                  በቴሌብርና በባንክ የተከፈሉ (Deducted from drawer cash because funds are in bank)
                </p>
              </div>
            </div>
            <span className="text-xs font-black text-purple-400 bg-purple-950/60 border border-purple-500/30 px-3 py-1 rounded-xl">
              - {totalBankTransfers.toLocaleString()} ETB
            </span>
          </div>

          {/* Transfers List */}
          <div className="space-y-2">
            {bankTransfers.map(txn => (
              <div
                key={txn.id}
                className="bg-slate-900 px-4 py-3 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="font-black text-white tracking-wider">
                    {txn.refNumber}
                  </span>
                  <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
                    {txn.channel}
                  </span>
                  {txn.isVerified ? (
                    <span className="text-[10px] font-black text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>VERIFIED SMS</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowPinModalForTxn(txn)}
                      className="text-[10px] font-black text-rose-300 bg-rose-950/60 border border-rose-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 hover:bg-rose-900"
                    >
                      <AlertTriangle className="w-3 h-3" />
                      <span>UNVERIFIED (PIN Override)</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-black text-white">
                    {txn.amount.toLocaleString()} ETB
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTransfer(txn.id)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Inline Add Transfer Form */}
          <form onSubmit={handleAddTransfer} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-800/80">
            <input
              type="text"
              required
              value={newTxnRef}
              onChange={(e) => setNewTxnRef(e.target.value)}
              placeholder="Reference # (e.g. FT248902891)"
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white uppercase outline-none focus:border-purple-400"
            />
            <select
              value={newTxnChannel}
              onChange={(e) => setNewTxnChannel(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-xs font-bold text-slate-300 outline-none"
            >
              <option value="Telebirr">Telebirr (ቴሌብር)</option>
              <option value="CBE Birr">CBE Birr (ንግድ ባንክ)</option>
              <option value="Awash Bank">Awash Bank (አዋሽ)</option>
              <option value="Other Bank">Other Bank</option>
            </select>
            <input
              type="number"
              required
              step="any"
              value={newTxnAmount}
              onChange={(e) => setNewTxnAmount(e.target.value)}
              placeholder="መጠን (ETB)"
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-black text-purple-300 outline-none focus:border-purple-400"
            />
            <button
              type="submit"
              className="py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ዝውውር ጨምር</span>
            </button>
          </form>
        </section>

        {/* ============================================================== */}
        {/* CARD 7: 💵 AUTOMATIC CASH DRAWER RECONCILIATION                */}
        {/* ============================================================== */}
        <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-3xl p-5 sm:p-7 border-2 border-amber-500/30 shadow-2xl space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
            <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-lg">
              💵
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white">
                7. AUTOMATIC CASH DRAWER RECONCILIATION
              </h2>
              <p className="text-[11px] text-amber-300 font-bold">
                ጥሬ ገንዘብ ማስታረቂያ (Physical Cash Handoff Target)
              </p>
            </div>
          </div>

          {/* Mathematical Formula Breakdown Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Gross Juice</span>
              <span className="text-emerald-400 font-black">+{grossJuiceRevenue.toLocaleString()} ETB</span>
            </div>

            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Food Sales</span>
              <span className="text-emerald-400 font-black">+{totalFoodRevenue.toLocaleString()} ETB</span>
            </div>

            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">beU Deduction</span>
              <span className="text-rose-400 font-black">-{beuDeliveryDeduction.toLocaleString()} ETB</span>
            </div>

            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">New Pending</span>
              <span className="text-rose-400 font-black">-{deductedPendingDebt.toLocaleString()} ETB</span>
            </div>

            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Recovered Debts</span>
              <span className="text-cyan-400 font-black">+{recoveredCashAdded.toLocaleString()} ETB</span>
            </div>

            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Daily Expenses</span>
              <span className="text-rose-400 font-black">-{totalDailyExpenses.toLocaleString()} ETB</span>
            </div>

            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Bank Transfers</span>
              <span className="text-purple-400 font-black">-{totalBankTransfers.toLocaleString()} ETB</span>
            </div>

            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-amber-400 block font-bold">Total Gross Sales</span>
              <span className="text-white font-black">{totalGrossSales.toLocaleString()} ETB</span>
            </div>

          </div>

          {/* Prominent Physical Cash Display */}
          <div className="bg-slate-950 rounded-2xl p-5 border border-amber-500/40 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-amber-400 block">
                በካዝና መገኘት ያለበት ጥሬ ገንዘብ (Physical Cash in Drawer):
              </span>
              <p className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-1">
                {physicalCashInDrawer.toLocaleString()} <span className="text-lg text-amber-400 font-bold">ETB</span>
              </p>
            </div>
            <div className="text-right">
              <span className={`text-xs font-black px-3 py-1 rounded-full border ${
                isFoodBoxesBalanced
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-950 text-amber-300 border-amber-500/40'
              }`}>
                {isFoodBoxesBalanced ? '✔ ሂሳቡ ሙሉ በሙሉ ተመጣጥኗል' : '⚠️ ቦክሶችን ማስታረቅ ያስፈልጋል'}
              </span>
            </div>
          </div>

        </section>

      </main>

      {/* ============================================================== */}
      {/* FLOATING ACTION BOTTOM BAR (Save Settlement & Total Summary)    */}
      {/* ============================================================== */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 py-3 px-4 shadow-2xl z-40">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-bold">
                Total Sales ({selectedShift === 'Day' ? 'Day' : 'Night'}):
              </span>
              <span className="text-base font-black text-white">
                ETB {totalGrossSales.toLocaleString()}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              ጥሬ ገንዘብ፡ <strong className="text-amber-300">{physicalCashInDrawer.toLocaleString()} ETB</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV አውርድ</span>
            </button>

            <button
              type="button"
              disabled={!isFoodBoxesBalanced}
              onClick={handleSaveSettlement}
              className={`py-3 px-6 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all active:scale-95 shadow-xl ${
                isFoodBoxesBalanced
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
              }`}
            >
              {isFoodBoxesBalanced ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>✔ SAVE SETTLEMENT (ርክክቡን አጽድቅ)</span>
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
      {/* MODAL 1: THERMAL SHIFT RECONCILIATION SLIP (80mm)               */}
      {/* ============================================================== */}
      {activePrintTicket && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white text-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto font-mono text-xs">
            
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-slate-500 text-[11px]">የፈረቃ ርክክብ ደረሰኝ (Shift Ticket)</span>
              <button 
                type="button"
                onClick={() => setActivePrintTicket(null)}
                className="text-slate-400 hover:text-slate-900 p-1 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Receipt Content */}
            <div className="border border-slate-300 p-4 rounded-xl space-y-2 bg-slate-50 text-[11px] leading-relaxed">
              <div className="text-center space-y-0.5 border-b pb-2">
                <h3 className="font-black text-sm tracking-tight text-slate-900">MARAKI JUICE & SALAD</h3>
                <p className="text-[10px] text-slate-600">DAILY SHIFT SETTLEMENT SLIP</p>
                <p className="text-[10px] text-slate-500">{toEthiopianDateString(activePrintTicket.date)}</p>
              </div>

              <div className="flex justify-between">
                <span>ፈረቃ (Shift):</span>
                <strong>{activePrintTicket.shift === 'Day' ? 'Day (☀️ የቀን)' : 'Night (🌙 የማታ)'}</strong>
              </div>

              <div className="flex justify-between border-t pt-1">
                <span>🥤 ጁስ ሽያጭ ({activePrintTicket.juiceSold} ኩባያ):</span>
                <span>{activePrintTicket.grossJuiceRevenue.toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 pl-2">
                <span>- beU Delivery ({activePrintTicket.beuDeliveryCups}):</span>
                <span>-{activePrintTicket.beuDeliveryDeduction.toLocaleString()} ETB</span>
              </div>

              <div className="flex justify-between border-t pt-1">
                <span>🍱 ምግብ ሽያጭ ({activePrintTicket.assignedBoxes} ቦክስ):</span>
                <span>{activePrintTicket.totalFoodRevenue.toLocaleString()} ETB</span>
              </div>

              <div className="flex justify-between border-t pt-1 font-black">
                <span>ጠቅላላ ሽያጭ (Gross):</span>
                <span>{activePrintTicket.totalGrossSales.toLocaleString()} ETB</span>
              </div>

              <div className="flex justify-between text-rose-600">
                <span>- የተመዘገበ ዕዳ (Pending):</span>
                <span>-{activePrintTicket.deductedPendingDebt.toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between text-cyan-700">
                <span>+ የተሰበሰበ ዕዳ (Recovered):</span>
                <span>+{activePrintTicket.recoveredCashAdded.toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>- የዕለት ወጪ (Expenses):</span>
                <span>-{activePrintTicket.totalDailyExpenses.toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between text-purple-700">
                <span>- የባንክ ዝውውር (Transfers):</span>
                <span>-{activePrintTicket.totalBankTransfers.toLocaleString()} ETB</span>
              </div>

              <div className="border-t-2 border-dashed pt-2 flex justify-between font-black text-xs text-slate-900">
                <span>💵 ጥሬ ገንዘብ (Drawer Cash):</span>
                <span className="text-sm">{activePrintTicket.physicalCashInDrawer.toLocaleString()} ETB</span>
              </div>

              {/* Signatures */}
              <div className="pt-6 grid grid-cols-2 gap-4 text-center text-[10px] text-slate-500 border-t border-slate-300">
                <div>
                  <div className="border-b border-dashed border-slate-400 mb-1 h-6"></div>
                  <span>አስረካቢ (Cashier)</span>
                </div>
                <div>
                  <div className="border-b border-dashed border-slate-400 mb-1 h-6"></div>
                  <span>ተረካቢ (Manager)</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-black text-xs flex items-center justify-center gap-1.5 hover:bg-slate-800 transition-all shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>ደረሰኙን አትም (Print Slip)</span>
            </button>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: MANAGER PIN OVERRIDE FOR UNVERIFIED TRANSFERS          */}
      {/* ============================================================== */}
      {showPinModalForTxn && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center text-xl mx-auto">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-sm text-white">የማናጀር ፒን ማረጋገጫ (Manager PIN Override)</h3>
              <p className="text-[11px] text-slate-400 font-bold mt-1">
                ይህ የባንክ ዝውውር ({showPinModalForTxn.refNumber}) በ SMS አልተረጋገጠም፤ ለማጽደቅ የማናጀር ፒን ያስገቡ።
              </p>
            </div>

            <form onSubmit={handleVerifyWithPin} className="space-y-3">
              <input
                type="password"
                autoFocus
                required
                maxLength={6}
                value={pinOverrideInput}
                onChange={(e) => setPinOverrideInput(e.target.value)}
                placeholder="Manager PIN (e.g. 1234)"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-center text-lg font-black text-amber-300 tracking-widest outline-none"
              />
              {pinError && (
                <p className="text-xs text-rose-400 font-bold">{pinError}</p>
              )}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowPinModalForTxn(null); setPinOverrideInput(''); setPinError(null); }}
                  className="flex-1 py-2 bg-slate-900 text-slate-400 rounded-xl text-xs font-bold"
                >
                  ሰርዝ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-amber-500 text-slate-950 rounded-xl text-xs font-black"
                >
                  አጽድቅ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: PAST SETTLEMENTS HISTORY LOG                          */}
      {/* ============================================================== */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-sm text-white">ያለፉ ፈረቃዎች ማጠቃለያ (Settlements History)</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              {settlementsHistory.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6 font-bold">
                  ምንም የተመዘገበ የፈረቃ ሂሳብ የለም
                </p>
              ) : (
                settlementsHistory.map(item => (
                  <div 
                    key={item.id}
                    className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-white">
                          {toEthiopianDateString(item.date)}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          item.shift === 'Day' ? 'bg-amber-400/20 text-amber-300' : 'bg-purple-400/20 text-purple-300'
                        }`}>
                          {item.shift === 'Day' ? '☀️ Day' : '🌙 Night'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        ሽያጭ፡ {item.totalGrossSales.toLocaleString()} ETB • ጥሬ ገንዘብ፡ {item.physicalCashInDrawer.toLocaleString()} ETB
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => { setActivePrintTicket(item); setShowHistoryModal(false); }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-black flex items-center gap-1 border border-slate-700"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>ደረሰኝ</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
