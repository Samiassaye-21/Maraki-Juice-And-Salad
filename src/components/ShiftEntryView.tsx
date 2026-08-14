import React, { useState, useEffect, useRef } from 'react';
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
  Tag,
  PenTool
} from 'lucide-react';
import { ShiftRecord, ShiftType, RestaurantSystemConfig, DailyExpenseItem } from '../types';
import { supabase } from '../lib/supabaseClient';
import { 
  getOperationalDate, 
  getAutoShiftType, 
  formatEthiopianTime, 
  formatCurrency, 
  calculateShiftTotals,
  embedSignatureInNotes,
  isCanvasBlank,
  compareSignaturePattern
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

  // Canvas Signature Pad State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState<string>('');

  const startDrawing = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#111111';

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    setHasSigned(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureUrl(canvas.toDataURL('image/png'));
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasSigned(false);
    setSignatureUrl('');
  };

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
  const [expenseList, setExpenseList] = useState<DailyExpenseItem[]>([]);
  const [expenseTitleInput, setExpenseTitleInput] = useState<string>('');
  const [expenseAmountInput, setExpenseAmountInput] = useState<string>('');

  // Pending Debts in CUPS & FOOD BOXES
  const [newPendingJuiceCups, setNewPendingJuiceCups] = useState<number>(0);
  const [newPendingFoodBoxes, setNewPendingFoodBoxes] = useState<number>(0);

  const [recoveredJuiceCups, setRecoveredJuiceCups] = useState<number>(0);
  const [recoveredFoodBoxes, setRecoveredFoodBoxes] = useState<number>(0);

  // BeU Delivery Orders in CUPS & FOOD BOXES
  const [deliveryJuiceCups, setDeliveryJuiceCups] = useState<number>(0);
  const [deliveryFoodBoxes, setDeliveryFoodBoxes] = useState<number>(0);

  const [notes, setNotes] = useState<string>('');

  // Unpaid Pending Debt Summary stats from database
  const [totalUnpaidPendingAmount, setTotalUnpaidPendingAmount] = useState<number>(0);
  const [totalUnpaidJuiceCups, setTotalUnpaidJuiceCups] = useState<number>(0);
  const [totalUnpaidFoodBoxes, setTotalUnpaidFoodBoxes] = useState<number>(0);
  const [unpaidPendingCount, setUnpaidPendingCount] = useState<number>(0);

  // UI state
  const [saving, setSaving] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);

  // Calculated Birr amounts
  const dailyExpensesTotal = expenseList.reduce((sum, item) => sum + item.amount, 0);
  const newPendingAmount = (newPendingJuiceCups * juicePrice) + (newPendingFoodBoxes * foodPrice);
  const recoveredPendingAmount = (recoveredJuiceCups * juicePrice) + (recoveredFoodBoxes * foodPrice);
  const deliveryCreditAmount = (deliveryJuiceCups * juicePrice) + (deliveryFoodBoxes * foodPrice);

  // Add Itemized Expense
  const handleAddExpenseItem = () => {
    if (!expenseTitleInput.trim() || !expenseAmountInput || Number(expenseAmountInput) <= 0) {
      alert('እባክዎን የወጪውን ምክንያትና የገንዘብ መጠን ያስገቡ (Please enter expense title and valid amount)');
      return;
    }

    const newItem: DailyExpenseItem = {
      id: `exp-${Date.now()}`,
      title: expenseTitleInput.trim(),
      amount: Number(expenseAmountInput),
      category: 'other_expense',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setExpenseList((prev) => [...prev, newItem]);
    setExpenseTitleInput('');
    setExpenseAmountInput('');
  };

  const handleRemoveExpenseItem = (id: string) => {
    setExpenseList((prev) => prev.filter((item) => item.id !== id));
  };

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

  // Load last closed shift stock & unpaid debts on mount
  useEffect(() => {
    fetchUnpaidPendingTotals();

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
    dailyExpensesTotal,
    newPendingAmount,
    recoveredPendingAmount,
    deliveryCreditAmount
  );

  const handleSaveShift = async () => {
    if (!workerName.trim()) {
      alert('እባክዎን የሰራተኛውን ስም ያስገቡ (Please enter worker name)');
      return;
    }

    const currentSigUrl = (canvasRef.current && !isCanvasBlank(canvasRef.current))
      ? canvasRef.current.toDataURL('image/png')
      : signatureUrl;

    // 1. Signature Blank Check
    if (isCanvasBlank(canvasRef.current)) {
      alert('እባክዎን ፊርማዎን ያንሱ! (Please draw your signature before submitting)');
      return;
    }

    // 2. Master Reference Signature Pattern Match Check
    const masterSignature = shiftType === 'night' 
      ? config.nightWorkerSignatureUrl 
      : config.dayWorkerSignatureUrl;

    if (!masterSignature) {
      alert(`⚠️ ለ${workerName} በሲስተሙ የተመዘገበ ፊርማ የለም! እባክዎን አስቀድመው በሲስተም ማስተካከያ (Settings) የሰራተኛውን ፊርማ ይመዝግቡ። (No registered reference signature found for ${workerName}. Please register the worker signature in System Settings first.)`);
      return;
    }

    const { matchScore, isValid } = await compareSignaturePattern(currentSigUrl, masterSignature);
    if (!isValid) {
      alert(`⚠️ ፊርማው ከተመዘገበው ሰራተኛ ፊርማ ጋር አይመሳሰልም! (Signature match score: ${matchScore}%. Signature does not match registered signature for ${workerName})`);
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
      dailyExpenses: dailyExpensesTotal,
      expenseItems: expenseList,
      newPendingPaymentsAmount: newPendingAmount,
      recoveredPendingAmount,
      deliveryCreditAmount,
      netCashDueToOwner: totals.netCashDueToOwner,
      notes: notes.trim(),
      signatureUrl: signatureUrl || undefined,
      isClosed: false, // PENDING APPROVAL WORKFLOW
      timestamp: now.getTime(),
    };

    const combinedNotes = embedSignatureInNotes(newShiftRecord.notes, signatureUrl);

    // Insert into Supabase with is_closed = false (Pending Admin Approval)
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
      net_cash_due_to_owner: newShiftRecord.netCashDueToOwner,
      notes: combinedNotes,
      is_closed: false, // Pending approval
      timestamp: newShiftRecord.timestamp,
    });

    if (shiftErr) {
      setSaving(false);
      alert('Error submitting shift: ' + shiftErr.message);
      return;
    }

    setSaving(false);
    setShowSuccess(true);

    setTimeout(() => {
      setShowSuccess(false);
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-[#f7f5f0] text-[#403c21] font-sans pb-12 relative overflow-x-hidden">
      {/* ─── Success Animation Overlay ─────────────────────────────────────── */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#403c21]/95 p-6 backdrop-blur-md text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.4 }}
              className="w-24 h-24 rounded-full bg-[#403c21] flex items-center justify-center text-[#403c21] mb-4 shadow-2xl"
            >
              <CheckCircle2 className="w-16 h-16" strokeWidth={3} />
            </motion.div>
            <h2 className="text-3xl font-extrabold text-white">የሸፍት ገቢ ለአስተዳዳሪው ተልኳል!</h2>
            <p className="text-neutral-300 text-base font-medium mt-2 max-w-xs">
              Shift submitted for Admin approval. Once reviewed by admin, it will enter system records.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Top Header Bar ────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#403c21]/20 sticky top-0 z-30 backdrop-blur-md px-4 py-3 text-[#403c21]">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-[#f7f5f0] flex items-center justify-center text-[#403c21] shadow-xs border border-[#403c21]/20">
              <Moon className="w-5 h-5 text-[#403c21]" />
            </div>
            <div>
              <h1 className="font-extrabold text-[#403c21] text-base tracking-tight leading-tight">
                የሸፍት ገቢ መዝገብ
              </h1>
              <p className="text-[11px] text-neutral-500 font-medium">Mobile Shift Income Entry</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#f7f5f0] border border-[#403c21]/20 text-[#403c21] text-xs font-extrabold">
            <Clock className="w-3.5 h-3.5 text-[#403c21]" />
            <span>{formatEthiopianTime(new Date())}</span>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* ─── Card 0: Unpaid Pending Debt Summary Banner (Clean White Card) ─────────────────── */}
        <div className="bg-white text-[#403c21] rounded-3xl p-5 space-y-3 shadow-xs border border-[#403c21]/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#f7f5f0] text-[#403c21] flex items-center justify-center border border-[#403c21]/20">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-[#403c21] text-sm leading-tight">
                  ያልተከፈለ እዳ ድምር (Total Unpaid Debts)
                </h3>
                <p className="text-[11px] text-neutral-500 font-medium">Unsettled Customer Credit Left</p>
              </div>
            </div>
            <span className="text-xs font-extrabold text-[#f7f5f0] bg-[#403c21] px-3.5 py-1 rounded-full shadow-xs">
              {unpaidPendingCount} Debts
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-2 border-t border-[#403c21]/15">
            <div className="text-xs text-neutral-600 font-medium flex items-center gap-2">
              <span className="bg-[#f7f5f0] px-3 py-1 rounded-full border border-[#403c21]/20 text-[#403c21] font-extrabold">
                🥤 {totalUnpaidJuiceCups} Cups
              </span>
              <span className="bg-[#f7f5f0] px-3 py-1 rounded-full border border-[#403c21]/20 text-[#403c21] font-extrabold">
                🍱 {totalUnpaidFoodBoxes} Boxes
              </span>
            </div>
            <div className="text-2xl font-extrabold text-[#403c21]">
              {formatCurrency(totalUnpaidPendingAmount, config.currencySymbol)}
            </div>
          </div>
        </div>

        {/* ─── Card 1: Shift & Worker Details ─────────────────────────────── */}
        <div className="bg-white border border-[#403c21]/20 rounded-3xl p-4 space-y-3.5 shadow-md">
          {/* Shift Toggle */}
          <div className="flex items-center gap-2 bg-[#f7f5f0] p-1.5 rounded-full border border-[#403c21]/20">
            <button
              onClick={() => setShiftType('night')}
              className={`flex-1 py-2 rounded-full font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                shiftType === 'night'
                  ? 'bg-[#403c21] text-white shadow-md'
                  : 'text-neutral-600 hover:text-[#403c21]'
              }`}
            >
              <Moon className={`w-4 h-4 ${shiftType === 'night' ? 'text-[#403c21]' : 'text-neutral-500'}`} />
              <span>ሌሊት ሸፍት (Night Shift)</span>
            </button>
            <button
              onClick={() => setShiftType('day')}
              className={`flex-1 py-2 rounded-full font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                shiftType === 'day'
                  ? 'bg-[#403c21] text-white shadow-md'
                  : 'text-neutral-600 hover:text-[#403c21]'
              }`}
            >
              <Sun className={`w-4 h-4 ${shiftType === 'day' ? 'text-[#403c21]' : 'text-neutral-500'}`} />
              <span>ቀን ሸፍት (Day Shift)</span>
            </button>
          </div>

          {/* Operational Date & Worker Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-neutral-600 flex items-center gap-1 mb-1">
                <Calendar className="w-3 h-3 text-[#403c21]" />
                <span>የሸፍት ቀን (Date)</span>
              </label>
              <input
                type="date"
                value={shiftDate}
                onChange={(e) => setShiftDate(e.target.value)}
                className="w-full bg-white border border-[#403c21]/30 rounded-full px-3.5 py-2 text-xs font-bold text-[#403c21] focus:outline-none focus:border-[#403c21] focus:ring-4 focus:ring-[#403c21]/20 shadow-xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-neutral-600 flex items-center gap-1 mb-1">
                <User className="w-3 h-3 text-[#403c21]" />
                <span>የሰራተኛ ስም (Worker)</span>
              </label>
              <input
                type="text"
                value={workerName}
                onChange={(e) => setWorkerName(e.target.value)}
                placeholder="Worker Name"
                className="w-full bg-white border border-[#403c21]/30 rounded-full px-3.5 py-2 text-xs font-bold text-[#403c21] focus:outline-none focus:border-[#403c21] focus:ring-4 focus:ring-[#403c21]/20 shadow-xs"
              />
            </div>
          </div>
        </div>

        {/* ─── Card 2: Juice Stock & Sales (የጁስ ሂሳብ) ────────────────────── */}
        <div className="bg-white border border-[#403c21]/20 rounded-3xl p-4 space-y-3 shadow-md">
          <div className="flex items-center justify-between border-b border-[#403c21]/15 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#403c21]/10 text-[#403c21] flex items-center justify-center border border-[#403c21]/30">
                <CupSoda className="w-4 h-4" />
              </div>
              <h2 className="font-extrabold text-[#403c21] text-sm">የጁስ ሂሳብ (Juice Sales)</h2>
            </div>
            <span className="text-xs font-bold text-[#f7f5f0] bg-[#403c21] px-3 py-0.5 rounded-full shadow-xs">
              {totals.juiceCupsSold} Cups Sold
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] font-bold text-neutral-500 block mb-1">መጀመሪያ (Opening)</label>
              <input
                type="number"
                value={juiceOpening}
                onChange={(e) => setJuiceOpening(Number(e.target.value))}
                className="w-full bg-white border border-[#403c21]/30 rounded-full px-2.5 py-1.5 text-xs font-bold text-[#403c21] text-center focus:outline-none focus:border-[#403c21]"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-neutral-500 block mb-1">የተጨመረ (Added)</label>
              <input
                type="number"
                value={juiceAdded}
                onChange={(e) => setJuiceAdded(Number(e.target.value))}
                className="w-full bg-white border border-[#403c21]/30 rounded-full px-2.5 py-1.5 text-xs font-bold text-[#403c21] text-center focus:outline-none focus:border-[#403c21]"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-neutral-500 block mb-1">የቀረ (Remaining)</label>
              <input
                type="number"
                value={juiceLeftover}
                onChange={(e) => setJuiceLeftover(Number(e.target.value))}
                className="w-full bg-white border-2 border-[#403c21] rounded-full px-2.5 py-1.5 text-xs font-extrabold text-[#403c21] text-center focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between bg-[#f7f5f0] p-2.5 rounded-full border border-[#403c21]/20 text-xs px-4">
            <span className="text-neutral-600 font-medium">Juice Price: {juicePrice} ETB/cup</span>
            <span className="font-extrabold text-[#403c21] text-sm">
              = {formatCurrency(totals.juiceRevenue, config.currencySymbol)}
            </span>
          </div>
        </div>

        {/* ─── Card 3: Food Sales (የምግብ ሂሳብ) ──────────────────────────── */}
        <div className="bg-white border border-[#403c21]/20 rounded-3xl p-4 space-y-3 shadow-md">
          <div className="flex items-center justify-between border-b border-[#403c21]/15 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#403c21]/10 text-[#403c21] flex items-center justify-center border border-[#403c21]/30">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <h2 className="font-extrabold text-[#403c21] text-sm">የምግብ ሂሳብ (Food Sales)</h2>
            </div>
            <span className="text-xs font-bold text-[#f7f5f0] bg-[#403c21] px-3 py-0.5 rounded-full shadow-xs">
              {totals.foodTakeawaysSold} Takeaways
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] font-bold text-neutral-500 block mb-1">መጀመሪያ (Opening)</label>
              <input
                type="number"
                value={foodOpening}
                onChange={(e) => setFoodOpening(Number(e.target.value))}
                className="w-full bg-white border border-[#403c21]/30 rounded-full px-2.5 py-1.5 text-xs font-bold text-[#403c21] text-center focus:outline-none focus:border-[#403c21]"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-neutral-500 block mb-1">የተጨመረ (Added)</label>
              <input
                type="number"
                value={foodAdded}
                onChange={(e) => setFoodAdded(Number(e.target.value))}
                className="w-full bg-white border border-[#403c21]/30 rounded-full px-2.5 py-1.5 text-xs font-bold text-[#403c21] text-center focus:outline-none focus:border-[#403c21]"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-neutral-500 block mb-1">የቀረ (Remaining)</label>
              <input
                type="number"
                value={foodLeftover}
                onChange={(e) => setFoodLeftover(Number(e.target.value))}
                className="w-full bg-white border-2 border-[#403c21] rounded-full px-2.5 py-1.5 text-xs font-extrabold text-[#403c21] text-center focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between bg-[#f7f5f0] p-2.5 rounded-full border border-[#403c21]/20 text-xs px-4">
            <span className="text-neutral-600 font-medium">Food Price: {foodPrice} ETB/unit</span>
            <span className="font-extrabold text-[#403c21] text-sm">
              = {formatCurrency(totals.foodRevenue, config.currencySymbol)}
            </span>
          </div>
        </div>

        {/* ─── Card 4: Financial Deductions & Additions ─────────────────────── */}
        <div className="bg-white border border-[#403c21]/20 rounded-3xl p-4 space-y-3.5 shadow-md">
          <h2 className="font-extrabold text-[#403c21] text-sm border-b border-[#403c21]/15 pb-2">
            ዲጂታል ክፍያ፣ ወጪዎችና እዳዎች (Transfers, Expenses & Debts)
          </h2>

          <div className="space-y-3">
            {/* 1. Digital Transfers */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#403c21] font-bold">1. Telebirr / CBE Birr (ለባለቤቱ የተላከ)</span>
                <span className="text-neutral-500 font-mono text-[11px]">Deduction (-)</span>
              </div>
              <input
                type="number"
                value={digitalTransfers || ''}
                onChange={(e) => setDigitalTransfers(Number(e.target.value))}
                placeholder="0 ETB"
                className="w-full bg-white border border-[#403c21]/30 rounded-full px-3.5 py-2 text-xs font-extrabold text-[#403c21] focus:outline-none focus:border-[#403c21] shadow-xs"
              />
            </div>

            {/* 2. Itemized Daily Expenses with Reasons */}
            <div className="bg-[#f7f5f0] p-3.5 rounded-2xl border border-[#403c21]/20 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#403c21] font-bold">2. የዕለት ወጪዎች (Itemized Expenses)</span>
                <span className="text-[#403c21] font-extrabold text-xs">
                  Total = -{formatCurrency(dailyExpensesTotal, config.currencySymbol)}
                </span>
              </div>

              {/* Added Expense List */}
              {expenseList.length > 0 && (
                <div className="divide-y divide-[#403c21]/15 border-y border-[#403c21]/15 my-1 py-1">
                  {expenseList.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-xs py-1">
                      <span className="text-[#403c21] font-medium">{item.title}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#403c21]">{item.amount} ETB</span>
                        <button
                          onClick={() => handleRemoveExpenseItem(item.id)}
                          className="text-neutral-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Inputs to Add New Expense Item */}
              <div className="grid grid-cols-5 gap-2 pt-1">
                <input
                  type="text"
                  value={expenseTitleInput}
                  onChange={(e) => setExpenseTitleInput(e.target.value)}
                  placeholder="የወጪ ምክንያት (Reason)"
                  className="col-span-3 bg-white border border-[#403c21]/30 rounded-full px-3 py-1.5 text-xs text-[#403c21] focus:outline-none focus:border-[#403c21]"
                />
                <input
                  type="number"
                  value={expenseAmountInput}
                  onChange={(e) => setExpenseAmountInput(e.target.value)}
                  placeholder="Birr"
                  className="col-span-2 bg-white border border-[#403c21]/30 rounded-full px-3 py-1.5 text-xs text-[#403c21] font-bold text-center focus:outline-none focus:border-[#403c21]"
                />
              </div>

              <button
                onClick={handleAddExpenseItem}
                className="w-full py-2.5 rounded-full bg-white text-[#403c21] border-2 border-[#403c21] text-xs font-bold flex items-center justify-center gap-1 cursor-pointer hover:bg-[#f7f5f0] shadow-xs active:scale-95 transition-all"
              >
                <Plus className="w-3.5 h-3.5 text-[#403c21]" />
                <span>ወጪ ጨምር (Add Expense Line)</span>
              </button>
            </div>

            {/* 3. BeU Delivery Credit Orders */}
            <div className="bg-[#f7f5f0] p-3.5 rounded-2xl border border-[#403c21]/20 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#403c21] font-bold flex items-center gap-1">
                  <Bike className="w-3.5 h-3.5 text-[#403c21]" /> 3. BeU Delivery (የዴሊቨሪ ሂሳብ)
                </span>
                <span className="text-[#403c21] font-extrabold text-xs">
                  = -{formatCurrency(deliveryCreditAmount, config.currencySymbol)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-neutral-500 block mb-1">Juice Cups (የጁስ ብዛት)</label>
                  <input
                    type="number"
                    value={deliveryJuiceCups || ''}
                    onChange={(e) => setDeliveryJuiceCups(Number(e.target.value))}
                    placeholder="0 cups"
                    className="w-full bg-white border border-[#403c21]/30 rounded-full px-2.5 py-1.5 text-xs font-bold text-[#403c21] text-center focus:outline-none focus:border-[#403c21]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-neutral-500 block mb-1">Food Boxes (የምግብ ብዛት)</label>
                  <input
                    type="number"
                    value={deliveryFoodBoxes || ''}
                    onChange={(e) => setDeliveryFoodBoxes(Number(e.target.value))}
                    placeholder="0 boxes"
                    className="w-full bg-white border border-[#403c21]/30 rounded-full px-2.5 py-1.5 text-xs font-bold text-[#403c21] text-center focus:outline-none focus:border-[#403c21]"
                  />
                </div>
              </div>
            </div>

            {/* 4. New Pending Debts (Entered in Cups & Boxes) */}
            <div className="bg-[#f7f5f0] p-3.5 rounded-2xl border border-[#403c21]/20 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#403c21] font-bold">4. አዲስ ያልተከፈለ እዳ (New Credit Given)</span>
                <span className="text-[#403c21] font-extrabold text-xs">
                  = -{formatCurrency(newPendingAmount, config.currencySymbol)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-neutral-500 block mb-1">Juice Cups (የጁስ ብዛት)</label>
                  <input
                    type="number"
                    value={newPendingJuiceCups || ''}
                    onChange={(e) => setNewPendingJuiceCups(Number(e.target.value))}
                    placeholder="0 cups"
                    className="w-full bg-white border border-[#403c21]/30 rounded-full px-2.5 py-1.5 text-xs font-bold text-[#403c21] text-center focus:outline-none focus:border-[#403c21]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-neutral-500 block mb-1">Food Boxes (የምግብ ብዛት)</label>
                  <input
                    type="number"
                    value={newPendingFoodBoxes || ''}
                    onChange={(e) => setNewPendingFoodBoxes(Number(e.target.value))}
                    placeholder="0 boxes"
                    className="w-full bg-white border border-[#403c21]/30 rounded-full px-2.5 py-1.5 text-xs font-bold text-[#403c21] text-center focus:outline-none focus:border-[#403c21]"
                  />
                </div>
              </div>
            </div>

            {/* 5. Recovered Debts (Entered in Cups & Boxes) */}
            <div className="bg-[#f7f5f0] p-3.5 rounded-2xl border border-[#403c21]/20 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#403c21] font-bold">5. የተመለሰ አሮጌ እዳ (Old Debts Collected)</span>
                <span className="text-[#403c21] font-extrabold text-xs">
                  = +{formatCurrency(recoveredPendingAmount, config.currencySymbol)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-neutral-500 block mb-1">Juice Cups (የጁስ ብዛት)</label>
                  <input
                    type="number"
                    value={recoveredJuiceCups || ''}
                    onChange={(e) => setRecoveredJuiceCups(Number(e.target.value))}
                    placeholder="0 cups"
                    className="w-full bg-white border border-[#403c21]/30 rounded-full px-2.5 py-1.5 text-xs font-bold text-[#403c21] text-center focus:outline-none focus:border-[#403c21]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-neutral-500 block mb-1">Food Boxes (የምግብ ብዛት)</label>
                  <input
                    type="number"
                    value={recoveredFoodBoxes || ''}
                    onChange={(e) => setRecoveredFoodBoxes(Number(e.target.value))}
                    placeholder="0 boxes"
                    className="w-full bg-white border border-[#403c21]/30 rounded-full px-2.5 py-1.5 text-xs font-bold text-[#403c21] text-center focus:outline-none focus:border-[#403c21]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Card 4.5: Digital Signature Pad ───────────────────────────── */}
        <div className="bg-white border border-[#403c21]/20 rounded-3xl p-4 space-y-2.5 shadow-md">
          <div className="flex items-center justify-between border-b border-[#403c21]/15 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#403c21]/10 text-[#403c21] flex items-center justify-center">
                <PenTool className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-extrabold text-[#403c21] text-sm">የሰራተኛ ፊርማ (Worker Signature)</h2>
                <p className="text-[10px] text-neutral-500">Sign with finger or mouse below</p>
              </div>
            </div>
            {hasSigned && (
              <button
                type="button"
                onClick={clearSignature}
                className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200 cursor-pointer hover:bg-rose-100"
              >
                አጽዳ (Clear)
              </button>
            )}
          </div>

          <div className="bg-[#f7f5f0] rounded-2xl p-1 border border-[#403c21]/20 overflow-hidden relative">
            <canvas
              ref={canvasRef}
              width={340}
              height={110}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-28 touch-none bg-white cursor-crosshair rounded-xl border border-neutral-200 shadow-inner"
            />
            {!hasSigned && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-neutral-400 text-xs font-bold">
                ✍️ እዚህ ጋር በጣትዎ ይፈረሙ (Draw Signature Here)
              </div>
            )}
          </div>
        </div>

        {/* ─── Card 5: Final Shift Income Summary & Cash Handover (Clean White Card) ───────────── */}
        <div className="bg-white text-[#403c21] border border-[#403c21]/20 rounded-3xl p-5 shadow-md space-y-4">
          <div className="flex justify-between items-center text-xs text-neutral-600 font-medium">
            <span>Gross Sales (ጠቅላላ ሽያጭ):</span>
            <span className="font-extrabold text-[#403c21] text-base">
              {formatCurrency(totals.grossIncome, config.currencySymbol)}
            </span>
          </div>

          <div className="border-t border-[#403c21]/15 pt-3">
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#403c21] mb-1">
              ለባለቤቱ የሚገባ ጥሬ ገንዘብ (Net Cash Due)
            </p>
            <h3 className="text-4xl font-extrabold text-[#403c21]">
              {formatCurrency(totals.netCashDueToOwner, config.currencySymbol)}
            </h3>
            <p className="text-[11px] text-neutral-500 mt-1 font-medium">
              Actual cash to hand over after transfers and shift expenses.
            </p>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSaveShift}
            disabled={saving}
            className="w-full h-14 rounded-full bg-[#403c21] hover:bg-[#33301a] text-[#f7f5f0] font-extrabold text-lg shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-3 active:scale-95 transition-all"
          >
            {saving ? (
              <div className="w-6 h-6 border-3 border-[#403c21]/40 border-t-[#403c21] rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-5 h-5 text-[#403c21]" />
                <span>የሸፍት ገቢ ላክ (Submit for Admin Approval)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShiftEntryView;

