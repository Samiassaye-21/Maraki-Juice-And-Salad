import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sun, 
  Moon, 
  Check, 
  Plus, 
  Minus, 
  DollarSign, 
  Receipt, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Clock, 
  User, 
  CupSoda, 
  UtensilsCrossed, 
  Send,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Package,
  Bike,
  Trash2,
  Hourglass,
  Info
} from 'lucide-react';
import { ShiftRecord, ShiftType, RestaurantSystemConfig, DailyExpenseItem } from '../types';
import { supabase } from '../lib/supabaseClient';
import { 
  getOperationalDate, 
  getAutoShiftType, 
  formatEthiopianTime, 
  formatCurrency, 
  calculateShiftTotals
} from '../utils/shiftUtils';

interface ShiftEntryViewProps {
  config: RestaurantSystemConfig;
}

export const ShiftEntryView: React.FC<ShiftEntryViewProps> = ({ config }) => {
  const autoShift = getAutoShiftType();
  const [shiftType, setShiftType] = useState<ShiftType>(autoShift.shiftType);
  const [shiftDate, setShiftDate] = useState<string>(getOperationalDate());
  const [workerName, setWorkerName] = useState<string>(
    autoShift.shiftType === 'night' ? config.nightShiftWorkerName : config.dayShiftWorkerName
  );

  // Sync default worker name when shiftType changes
  useEffect(() => {
    setWorkerName(shiftType === 'night' ? config.nightShiftWorkerName : config.dayShiftWorkerName);
  }, [shiftType, config]);

  // Inventory Inputs
  const [juiceOpening, setJuiceOpening] = useState<number>(120);
  const [juiceAdded, setJuiceAdded] = useState<number>(0);
  const [juiceLeftover, setJuiceLeftover] = useState<number>(85);
  const [juicePrice, setJuicePrice] = useState<number>(config.defaultJuiceUnitPrice || 170);

  const [foodOpening, setFoodOpening] = useState<number>(85);
  const [foodAdded, setFoodAdded] = useState<number>(0);
  const [foodLeftover, setFoodLeftover] = useState<number>(60);
  const [foodPrice, setFoodPrice] = useState<number>(config.defaultFoodUnitPrice || 220);

  // Financial Deductions & Additions
  const [digitalTransfers, setDigitalTransfers] = useState<number>(0);
  
  // Itemized Expenses
  const [expenseTitleInput, setExpenseTitleInput] = useState<string>('');
  const [expenseAmountInput, setExpenseAmountInput] = useState<string>('');
  const [expenseItemsList, setExpenseItemsList] = useState<DailyExpenseItem[]>([]);

  // Pending Debts in CUPS & FOOD BOXES
  const [newPendingJuiceCups, setNewPendingJuiceCups] = useState<number>(0);
  const [newPendingFoodBoxes, setNewPendingFoodBoxes] = useState<number>(0);

  const [recoveredJuiceCups, setRecoveredJuiceCups] = useState<number>(0);
  const [recoveredFoodBoxes, setRecoveredFoodBoxes] = useState<number>(0);

  // BeU Delivery Credit in CUPS & FOOD BOXES
  const [deliveryJuiceCups, setDeliveryJuiceCups] = useState<number>(0);
  const [deliveryFoodBoxes, setDeliveryFoodBoxes] = useState<number>(0);

  const [notes, setNotes] = useState<string>('');

  // Summary stats from database
  const [totalUnpaidPendingAmount, setTotalUnpaidPendingAmount] = useState<number>(0);
  const [totalUnpaidJuiceCups, setTotalUnpaidJuiceCups] = useState<number>(0);
  const [totalUnpaidFoodBoxes, setTotalUnpaidFoodBoxes] = useState<number>(0);
  const [unpaidPendingCount, setUnpaidPendingCount] = useState<number>(0);

  // UI state
  const [saving, setSaving] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [pendingSubmissions, setPendingSubmissions] = useState<ShiftRecord[]>([]);

  // Calculate total daily expenses from itemized list
  const dailyExpenses = expenseItemsList.reduce((sum, item) => sum + item.amount, 0);

  // Auto calculate ETB amounts from cups & boxes
  const newPendingAmount = (newPendingJuiceCups * juicePrice) + (newPendingFoodBoxes * foodPrice);
  const recoveredPendingAmount = (recoveredJuiceCups * juicePrice) + (recoveredFoodBoxes * foodPrice);
  const deliveryCreditAmount = (deliveryJuiceCups * juicePrice) + (deliveryFoodBoxes * foodPrice);

  // Fetch unpaid pending debt totals from Supabase
  const fetchUnpaidPendingTotals = async () => {
    const { data } = await supabase
      .from('pending_payments')
      .select('*')
      .eq('is_paid', false);

    if (data) {
      let totalAmt = 0;
      let totalCups = 0;
      let totalBoxes = 0;
      data.forEach((p: any) => {
        totalAmt += p.amount || 0;
        totalCups += p.juice_cups_count || 0;
        totalBoxes += p.food_takeaways_count || 0;
      });
      setTotalUnpaidPendingAmount(totalAmt);
      setTotalUnpaidJuiceCups(totalCups);
      setTotalUnpaidFoodBoxes(totalBoxes);
      setUnpaidPendingCount(data.length);
    }
  };

  // Fetch worker's pending approval submissions
  const fetchPendingSubmissions = async () => {
    const { data } = await supabase
      .from('shifts')
      .select('*')
      .eq('is_closed', false)
      .order('timestamp', { ascending: false });

    if (data) {
      const formatted: ShiftRecord[] = data.map((r: any) => ({
        id: r.id,
        date: r.date,
        shiftType: r.shift_type as ShiftType,
        workerName: r.worker_name,
        juiceCups: r.juice_cups,
        foodTakeaways: r.food_takeaways,
        juiceCupsSold: r.juice_cups_sold,
        juiceRevenue: r.juice_revenue,
        foodTakeawaysSold: r.food_takeaways_sold,
        foodRevenue: r.food_revenue,
        grossIncome: r.gross_income,
        digitalTransfers: r.digital_transfers,
        dailyExpenses: r.daily_expenses,
        expenseItems: r.expense_items || [],
        newPendingPaymentsAmount: r.new_pending_payments_amount,
        recoveredPendingAmount: r.recovered_pending_amount,
        deliveryCreditAmount: r.delivery_credit_amount,
        deliveryCupsCount: r.delivery_cups_count || 0,
        deliveryBoxesCount: r.delivery_boxes_count || 0,
        newPendingCupsCount: r.new_pending_cups_count || 0,
        newPendingBoxesCount: r.new_pending_boxes_count || 0,
        recoveredCupsCount: r.recovered_cups_count || 0,
        recoveredBoxesCount: r.recovered_boxes_count || 0,
        netCashDueToOwner: r.net_cash_due_to_owner,
        notes: r.notes,
        isClosed: r.is_closed,
        approvalStatus: r.approval_status || 'pending_approval',
        timestamp: Number(r.timestamp),
      }));
      setPendingSubmissions(formatted);
    }
  };

  // Load last closed shift stock & unpaid debts on mount
  useEffect(() => {
    fetchUnpaidPendingTotals();
    fetchPendingSubmissions();

    supabase
      .from('shifts')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const lastShift = data.find((s: any) => s.is_closed);
          if (lastShift) {
            setJuiceOpening(lastShift.juice_cups?.remainingCount || 120);
            setJuiceLeftover(Math.max(0, (lastShift.juice_cups?.remainingCount || 120) - 25));
            setFoodOpening(lastShift.food_takeaways?.remainingCount || 85);
            setFoodLeftover(Math.max(0, (lastShift.food_takeaways?.remainingCount || 85) - 15));
          }
        }
      });
  }, []);

  // Handlers for adding/removing itemized daily expenses
  const handleAddExpenseItem = () => {
    if (!expenseTitleInput.trim()) {
      alert('እባክዎን የወጪውን ምክንያት ያስገቡ (Please enter expense reason)');
      return;
    }
    const amt = parseFloat(expenseAmountInput);
    if (isNaN(amt) || amt <= 0) {
      alert('እባክዎን ትክክለኛ የብር መጠን ያስገቡ (Please enter valid amount)');
      return;
    }

    const newItem: DailyExpenseItem = {
      id: `exp-${Date.now()}`,
      title: expenseTitleInput.trim(),
      category: 'other_expense',
      amount: amt,
    };

    setExpenseItemsList((prev) => [...prev, newItem]);
    setExpenseTitleInput('');
    setExpenseAmountInput('');
  };

  const handleRemoveExpenseItem = (id: string) => {
    setExpenseItemsList((prev) => prev.filter((it) => it.id !== id));
  };

  // Calculate live shift totals using shiftUtils
  const totals = calculateShiftTotals(
    juiceOpening,
    juiceAdded,
    juiceLeftover,
    juicePrice,
    foodOpening,
    foodAdded,
    foodLeftover,
    foodPrice,
    digitalTransfers,
    dailyExpenses,
    newPendingAmount,
    recoveredPendingAmount,
    deliveryCreditAmount
  );

  const handleSaveShift = async () => {
    if (!workerName.trim()) {
      alert('እባክዎን የሰራተኛውን ስም ያስገቡ (Please enter worker name)');
      return;
    }

    setSaving(true);
    const now = new Date();
    const newShiftRecord: ShiftRecord = {
      id: `sh-m-${Date.now()}`,
      date: shiftDate,
      shiftType,
      workerName: workerName.trim(),
      juiceCups: {
        openingCount: juiceOpening,
        addedCount: juiceAdded,
        remainingCount: juiceLeftover,
        unitPrice: juicePrice,
      },
      foodTakeaways: {
        openingCount: foodOpening,
        addedCount: foodAdded,
        remainingCount: foodLeftover,
        unitPrice: foodPrice,
      },
      juiceCupsSold: totals.juiceCupsSold,
      juiceRevenue: totals.juiceRevenue,
      foodTakeawaysSold: totals.foodTakeawaysSold,
      foodRevenue: totals.foodRevenue,
      grossIncome: totals.grossIncome,
      digitalTransfers,
      dailyExpenses,
      expenseItems: expenseItemsList,
      newPendingPaymentsAmount: newPendingAmount,
      recoveredPendingAmount,
      deliveryCreditAmount,
      deliveryCupsCount: deliveryJuiceCups,
      deliveryBoxesCount: deliveryFoodBoxes,
      newPendingCupsCount: newPendingJuiceCups,
      newPendingBoxesCount: newPendingFoodBoxes,
      recoveredCupsCount: recoveredJuiceCups,
      recoveredBoxesCount: recoveredFoodBoxes,
      netCashDueToOwner: totals.netCashDueToOwner,
      notes: notes.trim(),
      isClosed: false, // NOT closed automatically until Admin approves!
      approvalStatus: 'pending_approval',
      timestamp: now.getTime(),
    };

    // Save to Supabase shifts table as pending approval
    const { error: shiftErr } = await supabase.from('shifts').insert({
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
      delivery_cups_count: newShiftRecord.deliveryCupsCount,
      delivery_boxes_count: newShiftRecord.deliveryBoxesCount,
      new_pending_cups_count: newShiftRecord.newPendingCupsCount,
      new_pending_boxes_count: newShiftRecord.newPendingBoxesCount,
      recovered_cups_count: newShiftRecord.recoveredCupsCount,
      recovered_boxes_count: newShiftRecord.recoveredBoxesCount,
      net_cash_due_to_owner: newShiftRecord.netCashDueToOwner,
      notes: newShiftRecord.notes,
      is_closed: false,
      approval_status: 'pending_approval',
      timestamp: newShiftRecord.timestamp,
    });

    if (shiftErr) {
      setSaving(false);
      alert('Error submitting shift: ' + shiftErr.message);
      return;
    }

    // Refresh pending submissions
    await fetchPendingSubmissions();

    setSaving(false);
    setShowSuccess(true);

    setTimeout(() => {
      setShowSuccess(false);
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-12 relative overflow-x-hidden">
      {/* ─── Success Animation Overlay ─────────────────────────────────────── */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-indigo-900/95 p-6 backdrop-blur-md text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.4 }}
              className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-indigo-600 mb-4 shadow-2xl"
            >
              <Hourglass className="w-14 h-14 text-amber-500 animate-spin" />
            </motion.div>
            <h2 className="text-3xl font-black text-white">የሸፍት መረጃው ተልኳል!</h2>
            <p className="text-indigo-200 text-base font-semibold mt-2 max-w-xs">
              አስተዳዳሪው አይቶ ሲያጸድቀው በሲስተሙ ውስጥ ይገባል።
            </p>
            <p className="text-xs text-indigo-300/80 mt-1">
              Sent to Admin for Approval
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Top Header Bar ────────────────────────────────────────────────── */}
      <div className="bg-slate-800/90 border-b border-slate-700/80 sticky top-0 z-30 backdrop-blur-md px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
              <Moon className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h1 className="font-black text-white text-base tracking-tight leading-tight">
                የሸፍት ገቢ መዝገብ
              </h1>
              <p className="text-[11px] text-slate-400">Mobile Shift Income Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{formatEthiopianTime(new Date())}</span>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* ─── Card 0: Unpaid Pending Debt Summary Banner ─────────────────── */}
        <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/40 border border-amber-500/40 rounded-3xl p-4 space-y-2 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-amber-200 text-sm leading-tight">
                  ያልተከፈለ እዳ ድምር (Total Unpaid Debts)
                </h3>
                <p className="text-[11px] text-amber-300/70">Unsettled Customer Credit Left</p>
              </div>
            </div>
            <span className="text-xs font-black text-amber-300 bg-amber-500/20 px-2.5 py-1 rounded-full border border-amber-500/40">
              {unpaidPendingCount} Debts
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-2 border-t border-amber-500/20">
            <div className="text-xs text-amber-200/90 font-medium flex items-center gap-2">
              <span className="bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                🥤 {totalUnpaidJuiceCups} Cups
              </span>
              <span className="bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                🍱 {totalUnpaidFoodBoxes} Boxes
              </span>
            </div>
            <div className="text-xl font-black text-amber-300">
              {formatCurrency(totalUnpaidPendingAmount, config.currencySymbol)}
            </div>
          </div>
        </div>

        {/* ─── Card 1: Shift & Worker Details ─────────────────────────────── */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-4 space-y-3.5 shadow-md">
          {/* Shift Toggle */}
          <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-700">
            <button
              onClick={() => setShiftType('night')}
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                shiftType === 'night'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Moon className="w-4 h-4 text-amber-300" />
              <span>ሌሊት ሸፍት (Night Shift)</span>
            </button>
            <button
              onClick={() => setShiftType('day')}
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                shiftType === 'day'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sun className="w-4 h-4 text-amber-950" />
              <span>ቀን ሸፍት (Day Shift)</span>
            </button>
          </div>

          {/* Operational Date & Worker Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mb-1">
                <Calendar className="w-3 h-3 text-indigo-400" />
                <span>የሸፍት ቀን (Date)</span>
              </label>
              <input
                type="date"
                value={shiftDate}
                onChange={(e) => setShiftDate(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-700 rounded-2xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mb-1">
                <User className="w-3 h-3 text-indigo-400" />
                <span>የሰራተኛ ስም (Worker)</span>
              </label>
              <input
                type="text"
                value={workerName}
                onChange={(e) => setWorkerName(e.target.value)}
                placeholder="Worker Name"
                className="w-full bg-slate-900/80 border border-slate-700 rounded-2xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* ─── Card 2: Juice Stock & Sales (የጁስ ሂሳብ) ────────────────────── */}
        <div className="bg-slate-800/80 border border-amber-500/30 rounded-3xl p-4 space-y-3 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <CupSoda className="w-4 h-4" />
              </div>
              <h2 className="font-extrabold text-white text-sm">የጁስ ሂሳብ (Juice Sales)</h2>
            </div>
            <span className="text-xs font-black text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
              {totals.juiceCupsSold} Cups Sold
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] font-semibold text-slate-400">መጀመሪያ (Opening)</label>
              <input
                type="number"
                value={juiceOpening}
                onChange={(e) => setJuiceOpening(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white text-center"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-400">የተጨመረ (Added)</label>
              <input
                type="number"
                value={juiceAdded}
                onChange={(e) => setJuiceAdded(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white text-center"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-400">የቀረ (Remaining)</label>
              <input
                type="number"
                value={juiceLeftover}
                onChange={(e) => setJuiceLeftover(Number(e.target.value))}
                className="w-full bg-slate-900 border border-amber-500/50 rounded-xl px-2.5 py-1.5 text-xs font-black text-amber-300 text-center"
              />
            </div>
          </div>

          <div className="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-2xl border border-slate-700/60 text-xs">
            <span className="text-slate-400">Juice Price: {juicePrice} ETB/cup</span>
            <span className="font-extrabold text-amber-300 text-sm">
              = {formatCurrency(totals.juiceRevenue, config.currencySymbol)}
            </span>
          </div>
        </div>

        {/* ─── Card 3: Food Sales (የምግብ ሂሳብ) ──────────────────────────── */}
        <div className="bg-slate-800/80 border border-emerald-500/30 rounded-3xl p-4 space-y-3 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <h2 className="font-extrabold text-white text-sm">የምግብ ሂሳብ (Food Sales)</h2>
            </div>
            <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
              {totals.foodTakeawaysSold} Takeaways
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] font-semibold text-slate-400">መጀመሪያ (Opening)</label>
              <input
                type="number"
                value={foodOpening}
                onChange={(e) => setFoodOpening(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white text-center"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-400">የተጨመረ (Added)</label>
              <input
                type="number"
                value={foodAdded}
                onChange={(e) => setFoodAdded(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white text-center"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-400">የቀረ (Remaining)</label>
              <input
                type="number"
                value={foodLeftover}
                onChange={(e) => setFoodLeftover(Number(e.target.value))}
                className="w-full bg-slate-900 border border-emerald-500/50 rounded-xl px-2.5 py-1.5 text-xs font-black text-emerald-300 text-center"
              />
            </div>
          </div>

          <div className="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-2xl border border-slate-700/60 text-xs">
            <span className="text-slate-400">Food Price: {foodPrice} ETB/unit</span>
            <span className="font-extrabold text-emerald-300 text-sm">
              = {formatCurrency(totals.foodRevenue, config.currencySymbol)}
            </span>
          </div>
        </div>

        {/* ─── Card 4: BeU Delivery Orders (BeU ዴሊቨሪ ሂሳብ) ────────────────── */}
        <div className="bg-slate-800/80 border border-teal-500/30 rounded-3xl p-4 space-y-3 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                <Bike className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-extrabold text-white text-sm">BeU ዴሊቨሪ ሂሳብ (BeU Delivery)</h2>
                <p className="text-[10px] text-slate-400">Night & Day Shift Delivery Orders</p>
              </div>
            </div>
            <span className="text-xs font-black text-teal-300 bg-teal-500/10 border border-teal-500/30 px-2.5 py-0.5 rounded-full">
              -{formatCurrency(deliveryCreditAmount, config.currencySymbol)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-semibold text-slate-400">BeU Juice Cups (የጁስ ብዛት)</label>
              <input
                type="number"
                value={deliveryJuiceCups || ''}
                onChange={(e) => setDeliveryJuiceCups(Number(e.target.value))}
                placeholder="0 cups"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-teal-300 text-center"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-400">BeU Food Boxes (የምግብ ብዛት)</label>
              <input
                type="number"
                value={deliveryFoodBoxes || ''}
                onChange={(e) => setDeliveryFoodBoxes(Number(e.target.value))}
                placeholder="0 boxes"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-teal-300 text-center"
              />
            </div>
          </div>
        </div>

        {/* ─── Card 5: Itemized Daily Expenses with Reasons (የዕለት ወጪዎች በዝርዝር) ── */}
        <div className="bg-slate-800/80 border border-rose-500/30 rounded-3xl p-4 space-y-3 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-extrabold text-white text-sm">የዕለት ወጪዎች በዝርዝር (Daily Expenses)</h2>
                <p className="text-[10px] text-slate-400">Write reason & amount for every expense</p>
              </div>
            </div>
            <span className="text-xs font-black text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2.5 py-0.5 rounded-full">
              Total: {dailyExpenses} ETB
            </span>
          </div>

          {/* Expense Input Builder */}
          <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-700/80 space-y-2">
            <div className="grid grid-cols-5 gap-2">
              <div className="col-span-3">
                <label className="text-[10px] font-semibold text-slate-400">የወጪ ምክንያት (Reason)</label>
                <input
                  type="text"
                  value={expenseTitleInput}
                  onChange={(e) => setExpenseTitleInput(e.target.value)}
                  placeholder="e.g. አትክልት፣ ጋዝ፣ ወተት"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-rose-500"
                />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-semibold text-slate-400">መጠን (Amount ETB)</label>
                <input
                  type="number"
                  value={expenseAmountInput}
                  onChange={(e) => setExpenseAmountInput(e.target.value)}
                  placeholder="0 ETB"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-rose-300 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddExpenseItem}
              className="w-full py-2 bg-rose-600/80 hover:bg-rose-600 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ የወጪ ዘርዝር ጨምር (Add Expense)</span>
            </button>
          </div>

          {/* List of Added Expense Items */}
          {expenseItemsList.length > 0 && (
            <div className="divide-y divide-slate-700/60 bg-slate-900/50 rounded-2xl overflow-hidden border border-slate-700/50">
              {expenseItemsList.map((it) => (
                <div key={it.id} className="flex items-center justify-between p-2.5 text-xs">
                  <span className="font-semibold text-slate-200">{it.title}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-rose-400">{it.amount} ETB</span>
                    <button
                      onClick={() => handleRemoveExpenseItem(it.id)}
                      className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── Card 6: Transfers, Debts & Deductions ──────────────────────── */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-4 space-y-3.5 shadow-md">
          <h2 className="font-extrabold text-white text-sm border-b border-slate-700/80 pb-2">
            ዲጂታል ክፍያና እዳዎች (Transfers & Customer Debts)
          </h2>

          <div className="space-y-3">
            {/* 1. Digital Transfers */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-semibold">1. Telebirr / CBE Birr (ለባለቤቱ የተላከ)</span>
                <span className="text-slate-400 font-mono text-[11px]">Deduction (-)</span>
              </div>
              <input
                type="number"
                value={digitalTransfers || ''}
                onChange={(e) => setDigitalTransfers(Number(e.target.value))}
                placeholder="0 ETB"
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-3 py-2 text-xs font-bold text-indigo-300 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* 2. New Pending Debts (Entered in Cups & Boxes) */}
            <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-700/80 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-amber-300 font-extrabold">2. አዲስ ያልተከፈለ እዳ (New Credit Given)</span>
                <span className="text-amber-400 font-black text-xs">
                  = -{formatCurrency(newPendingAmount, config.currencySymbol)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400">Juice Cups (የጁስ ብዛት)</label>
                  <input
                    type="number"
                    value={newPendingJuiceCups || ''}
                    onChange={(e) => setNewPendingJuiceCups(Number(e.target.value))}
                    placeholder="0 cups"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-amber-300 text-center focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-400">Food Boxes (የምግብ ብዛት)</label>
                  <input
                    type="number"
                    value={newPendingFoodBoxes || ''}
                    onChange={(e) => setNewPendingFoodBoxes(Number(e.target.value))}
                    placeholder="0 boxes"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-amber-300 text-center focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* 3. Recovered Debts (Entered in Cups & Boxes) */}
            <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-700/80 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-emerald-300 font-extrabold">3. የተመለሰ አሮጌ እዳ (Old Debts Collected)</span>
                <span className="text-emerald-400 font-black text-xs">
                  = +{formatCurrency(recoveredPendingAmount, config.currencySymbol)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400">Juice Cups (የጁስ ብዛት)</label>
                  <input
                    type="number"
                    value={recoveredJuiceCups || ''}
                    onChange={(e) => setRecoveredJuiceCups(Number(e.target.value))}
                    placeholder="0 cups"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-emerald-300 text-center focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-400">Food Boxes (የምግብ ብዛት)</label>
                  <input
                    type="number"
                    value={recoveredFoodBoxes || ''}
                    onChange={(e) => setRecoveredFoodBoxes(Number(e.target.value))}
                    placeholder="0 boxes"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-emerald-300 text-center focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Card 7: Final Shift Income Summary & Cash Handover ───────────── */}
        <div className="bg-gradient-to-br from-indigo-900 via-purple-950 to-slate-950 border border-indigo-500/40 rounded-3xl p-5 shadow-xl space-y-3">
          <div className="flex justify-between items-center text-xs text-indigo-200">
            <span>Gross Sales (ጠቅላላ ሽያጭ):</span>
            <span className="font-extrabold text-white text-base">
              {formatCurrency(totals.grossIncome, config.currencySymbol)}
            </span>
          </div>

          <div className="border-t border-indigo-500/30 pt-3">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-1">
              ለባለቤቱ የሚገባ ጥሬ ገንዘብ (Net Cash Due)
            </p>
            <h3 className="text-3xl font-black text-white">
              {formatCurrency(totals.netCashDueToOwner, config.currencySymbol)}
            </h3>
            <p className="text-[11px] text-slate-300/80 mt-1">
              Actual cash to hand over after transfers and shift expenses.
            </p>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSaveShift}
            disabled={saving}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white font-extrabold text-lg shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-3"
          >
            {saving ? (
              <div className="w-6 h-6 border-3 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>የሸፍት ገቢ ላክ (Submit Shift for Approval)</span>
              </>
            )}
          </button>
        </div>

        {/* ─── Card 8: Pending Submissions Awaiting Approval ────────────────── */}
        {pendingSubmissions.length > 0 && (
          <div className="bg-slate-800/60 border border-amber-500/30 rounded-3xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-amber-300 border-b border-slate-700/60 pb-2">
              <span className="flex items-center gap-1.5">
                <Hourglass className="w-4 h-4 text-amber-400" />
                <span>በአስተዳዳሪው ጸደቃ በመጠበቅ ላይ ያሉ (Pending Approval)</span>
              </span>
              <span className="bg-amber-500/20 px-2 py-0.5 rounded-full text-amber-300">
                {pendingSubmissions.length}
              </span>
            </div>

            <div className="divide-y divide-slate-700/40">
              {pendingSubmissions.map((s) => (
                <div key={s.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-white flex items-center gap-1.5">
                      <span>{s.shiftType === 'night' ? '🌙 Night' : '☀️ Day'} Shift — {s.date}</span>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                        ⏳ Pending
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-400">{s.workerName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-emerald-400">
                      {formatCurrency(s.netCashDueToOwner, config.currencySymbol)}
                    </p>
                    <p className="text-[10px] text-slate-400">Gross: {s.grossIncome} ETB</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShiftEntryView;
