import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sun, 
  Moon, 
  UtensilsCrossed, 
  CupSoda, 
  TrendingDown, 
  TrendingUp, 
  Clock, 
  Truck, 
  CheckCircle2, 
  ShieldCheck,
  Receipt,
  Zap,
  Plus,
  Minus,
  Check,
  Trash2,
  Calculator
} from 'lucide-react';
import { CalculatorModal } from './CalculatorModal';
import { 
  ShiftType, 
  RestaurantSystemConfig, 
  ShiftRecord, 
  PendingPaymentItem, 
  DeliveryAccountRecord 
} from '../types';
import { 
  formatCurrency, 
  cleanNumberInput, 
  cleanStringNumberInput, 
  handleInputFocus, 
  calculateShiftTotals,
  formatEthiopianFullDate,
  getOperationalDate
} from '../utils/shiftUtils';

interface ShiftReconciliationViewProps {
  activeShift: ShiftType;
  setActiveShift: (shift: ShiftType) => void;
  config: RestaurantSystemConfig;
  lastClosedShift?: ShiftRecord;
  pendingPayments: PendingPaymentItem[];
  pendingApprovalShifts?: ShiftRecord[];
  onApproveShift?: (shift: ShiftRecord) => void;
  onRejectShift?: (id: string) => void;
  onSaveShift: (shift: ShiftRecord) => void;
  onAddPendingPayment: (pending: Omit<PendingPaymentItem, 'id' | 'isPaid'>) => void;
  onUpdatePendingPayment?: (updated: PendingPaymentItem) => void;
  onPartialSettlePendingPayment?: (id: string, amountPaid: number, cupsPaid?: number, boxesPaid?: number, skipLedger?: boolean) => void;
  onSettlePendingPayment: (id: string, skipLedger?: boolean) => void;
  onAddDeliveryRecord: (del: Omit<DeliveryAccountRecord, 'id' | 'isSettledWeekly'>) => void;
  currencySymbol: string;
}

export const ShiftReconciliationView: React.FC<ShiftReconciliationViewProps> = ({
  activeShift,
  setActiveShift,
  config,
  lastClosedShift,
  pendingPayments,
  pendingApprovalShifts,
  onApproveShift,
  onRejectShift,
  onSaveShift,
  onAddPendingPayment,
  onUpdatePendingPayment,
  onPartialSettlePendingPayment,
  onSettlePendingPayment,
  onAddDeliveryRecord,
  currencySymbol,
}) => {
  // Shift Date & Worker Name
  const [shiftDate, setShiftDate] = useState<string>(() => getOperationalDate());
  const [workerName, setWorkerName] = useState(
    activeShift === 'day' ? config.dayShiftWorkerName : config.nightShiftWorkerName
  );

  useEffect(() => {
    setWorkerName(activeShift === 'day' ? config.dayShiftWorkerName : config.nightShiftWorkerName);
  }, [activeShift, config]);

  // Inventory Inputs
  const defaultOpeningCups = lastClosedShift ? lastClosedShift.juiceCups.remainingCount : 120;
  const defaultOpeningTakeaways = lastClosedShift ? lastClosedShift.foodTakeaways.remainingCount : 85;

  const [juiceOpening, setJuiceOpening] = useState<number>(defaultOpeningCups);
  const [juiceAdded, setJuiceAdded] = useState<number>(0);
  const [juiceLeftover, setJuiceLeftover] = useState<number>(Math.max(0, defaultOpeningCups - 35));
  const [juicePrice, setJuicePrice] = useState<number>(config.defaultJuiceUnitPrice || 170);

  const [foodOpening, setFoodOpening] = useState<number>(defaultOpeningTakeaways);
  const [foodAdded, setFoodAdded] = useState<number>(0);
  const [foodLeftover, setFoodLeftover] = useState<number>(Math.max(0, defaultOpeningTakeaways - 25));
  const [foodPrice, setFoodPrice] = useState<number>(config.defaultFoodUnitPrice || 220);

  // Food Menu Sales Breakdown
  const [foodSales, setFoodSales] = useState<{ [id: string]: number }>({});
  const [useMenuSalesCalc, setUseMenuSalesCalc] = useState<boolean>(true);
  const [includeUnaccountedInRevenue, setIncludeUnaccountedInRevenue] = useState<boolean>(false);

  // Keep juicePrice updated with config changes
  useEffect(() => {
    if (config?.defaultJuiceUnitPrice) {
      setJuicePrice(config.defaultJuiceUnitPrice);
    }
  }, [config?.defaultJuiceUnitPrice]);

  // Financial Deductions & Additions (Standard Calculator Mode)
  const [digitalTransfers, setDigitalTransfers] = useState<number>(0);
  const [dailyExpensesTotal, setDailyExpensesTotal] = useState<number>(0);
  const [activeCalc, setActiveCalc] = useState<'transfer' | 'expense' | null>(null);

  // New Unpaid Pending Payments
  const [pendingJuiceCups, setPendingJuiceCups] = useState<number>(0);
  const [pendingFoodSales, setPendingFoodSales] = useState<{ [id: string]: number }>({});
  const [pendingCustomerName, setPendingCustomerName] = useState<string>('');

  // Delivery Rider Credit Orders
  const [deliveryCups, setDeliveryCups] = useState<number>(0);
  const [deliveryBoxes, setDeliveryBoxes] = useState<number>(0);
  const [deliveryRiderName, setDeliveryRiderName] = useState<string>('BeU Delivery');

  // Recovered / Collected Past Pending Debts
  const [recoveredJuiceCups, setRecoveredJuiceCups] = useState<number>(0);
  const [recoveredFoodSales, setRecoveredFoodSales] = useState<{ [id: string]: number }>({});
  const [recoveredNote, setRecoveredNote] = useState<string>('');
  const [selectedSettlePendingIds, setSelectedSettlePendingIds] = useState<string[]>([]);
  const [partialPendingCups, setPartialPendingCups] = useState<{ [id: string]: number }>({});
  const [partialPendingBoxes, setPartialPendingBoxes] = useState<{ [id: string]: number }>({});
  const [partialPendingBirr, setPartialPendingBirr] = useState<{ [id: string]: number }>({});

  const [shiftNotes, setShiftNotes] = useState<string>('');
  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (lastClosedShift) {
      setJuiceOpening(lastClosedShift.juiceCups.remainingCount);
      setFoodOpening(lastClosedShift.foodTakeaways.remainingCount);
    }
  }, [lastClosedShift]);

  const newPendingCups = pendingJuiceCups;
  const newPendingBoxes = Object.values(pendingFoodSales).reduce<number>((sum, qty) => sum + (Number(qty) || 0), 0);
  
  const pendingFoodRevenue = Object.entries(pendingFoodSales).reduce<number>((sum, [itemId, qty]) => {
    const item = config.foodMenu?.find(m => m.id === itemId);
    return sum + (item ? item.price * (Number(qty) || 0) : 0);
  }, 0);

  const newPendingAmount = (newPendingCups * juicePrice) + pendingFoodRevenue;
  const deliveryCreditAmount = (deliveryCups * juicePrice) + (deliveryBoxes * foodPrice);
  const unpaidDebts = pendingPayments.filter(p => !p.isPaid);

  const selectedPendingTotalAmount = useMemo(() => {
    return pendingPayments
      .filter(p => !p.isPaid && selectedSettlePendingIds.includes(p.id))
      .reduce((sum, p) => sum + p.amount, 0);
  }, [pendingPayments, selectedSettlePendingIds]);

  const partialDeductionsTotalAmount = useMemo(() => {
    return unpaidDebts.reduce((sum, item) => {
      if (selectedSettlePendingIds.includes(item.id)) return sum;
      const cups = Math.min(item.juiceCupsCount, Math.max(0, partialPendingCups[item.id] || 0));
      const boxes = Math.min(item.foodTakeawaysCount, Math.max(0, partialPendingBoxes[item.id] || 0));
      const birr = Math.max(0, partialPendingBirr[item.id] || 0);
      const itemTotal = (cups * juicePrice) + (boxes * foodPrice) + birr;
      return sum + itemTotal;
    }, 0);
  }, [unpaidDebts, selectedSettlePendingIds, partialPendingCups, partialPendingBoxes, partialPendingBirr, juicePrice, foodPrice]);

  const recoveredFoodRevenue = Object.entries(recoveredFoodSales).reduce<number>((sum, [itemId, qty]) => {
    const item = config.foodMenu?.find(m => m.id === itemId);
    return sum + (item ? item.price * (Number(qty) || 0) : 0);
  }, 0);
  const recoveredPendingAmount = (recoveredJuiceCups * juicePrice) + recoveredFoodRevenue + selectedPendingTotalAmount + partialDeductionsTotalAmount;

  const menuFoodRevenue = Object.entries(foodSales).reduce((sum: number, [itemId, qty]) => {
    const item = config.foodMenu?.find(m => m.id === itemId);
    const numQty = Number(qty) || 0;
    return sum + (item ? item.price * numQty : 0);
  }, 0);

  const totalMenuFoodSold: number = (Object.values(foodSales) as number[]).reduce((sum: number, qty: number) => sum + (Number(qty) || 0), 0);

  const {
    juiceCupsSold,
    juiceRevenue,
    foodTakeawaysSold,
  } = calculateShiftTotals(
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

  // Smart revenue calculation:
  // Itemized dishes calculate at exact prices.
  // Any un-itemized boxes (when worker doesn't know exact dish types) seamlessly fall back to foodPrice.
  const unaccountedBoxes = Math.max(0, foodTakeawaysSold - totalMenuFoodSold);
  
  const foodRevenue = useMenuSalesCalc 
    ? (menuFoodRevenue + (includeUnaccountedInRevenue ? unaccountedBoxes * foodPrice : 0))
    : (foodTakeawaysSold * foodPrice);

  const grossIncome = juiceRevenue + foodRevenue;
  const netCashDueToOwner = grossIncome + recoveredPendingAmount - digitalTransfers - dailyExpensesTotal - newPendingAmount - deliveryCreditAmount;

  const handleSaveShiftRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const recordDate = shiftDate || new Date().toISOString().split('T')[0];

    const newShift: ShiftRecord = {
      id: 'shift-' + Date.now(),
      date: recordDate,
      shiftType: activeShift,
      workerName: workerName || (activeShift === 'day' ? config.dayShiftWorkerName : config.nightShiftWorkerName),
      
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

      juiceCupsSold,
      juiceRevenue,
      foodTakeawaysSold,
      foodRevenue,
      grossIncome,

      digitalTransfers,
      dailyExpenses: dailyExpensesTotal,
      expenseItems: dailyExpensesTotal > 0 ? [{
        id: 'e-' + Date.now(),
        title: 'Cooking Expense',
        category: 'cooking_ingredients',
        amount: dailyExpensesTotal,
        time: new Date().toTimeString().slice(0, 5),
      }] : [],

      newPendingPaymentsAmount: newPendingAmount,
      recoveredPendingAmount,
      deliveryCreditAmount,

      netCashDueToOwner,
      notes: [
        shiftNotes.trim(),
        recoveredPendingAmount > 0 ? `Recovered Debt: ${formatCurrency(recoveredPendingAmount, currencySymbol)} ${recoveredNote.trim() ? '(' + recoveredNote.trim() + ')' : ''}` : ''
      ].filter(Boolean).join(' | '),
      isClosed: true,
      timestamp: Date.now(),
    };

    onSaveShift(newShift);

    if (newPendingAmount > 0) {
      const breakdownMap: { [name: string]: number } = {};
      if (newPendingCups > 0) {
        breakdownMap['Juice & Smoothie Cups'] = newPendingCups;
      }
      Object.entries(pendingFoodSales).forEach(([id, qty]) => {
        const numQty = Number(qty) || 0;
        if (numQty > 0) {
          const item = config.foodMenu?.find(m => m.id === id);
          const name = item ? item.name : 'Food Dish';
          breakdownMap[name] = (breakdownMap[name] || 0) + numQty;
        }
      });

      const foodItemsDesc = Object.entries(pendingFoodSales)
        .filter(([_, qty]) => Number(qty) > 0)
        .map(([id, qty]) => {
           const item = config.foodMenu?.find(m => m.id === id);
           return `${Number(qty)} ${item ? item.name : 'Box'}`;
        }).join(', ');
        
      const itemsDesc = [
        newPendingCups > 0 ? `${newPendingCups} Juice` : '',
        foodItemsDesc
      ].filter(Boolean).join(' + ');

      onAddPendingPayment({
        shiftType: activeShift,
        customerName: pendingCustomerName.trim() || 'Unpaid Customer Credit',
        description: `Unpaid: ${itemsDesc || 'Unknown'} [${activeShift.toUpperCase()} shift]`,
        juiceCupsCount: newPendingCups,
        foodTakeawaysCount: newPendingBoxes,
        itemizedBreakdown: breakdownMap,
        amount: newPendingAmount,
        date: recordDate,
      });
    }

    if (deliveryCreditAmount > 0) {
      const deliveryItemsDesc = [
        deliveryCups > 0 ? `${deliveryCups} Juice Cup${deliveryCups > 1 ? 's' : ''}` : '',
        deliveryBoxes > 0 ? `${deliveryBoxes} Food Box${deliveryBoxes > 1 ? 'es' : ''}` : ''
      ].filter(Boolean).join(' + ');

      onAddDeliveryRecord({
        deliveryRiderName: deliveryRiderName.trim() || 'Delivery Rider / Company',
        description: `Delivery Credit: ${deliveryItemsDesc} (${activeShift.toUpperCase()} shift)`,
        juiceCupsCount: deliveryCups,
        foodTakeawaysCount: deliveryBoxes,
        amount: deliveryCreditAmount,
        date: recordDate,
        shiftType: activeShift,
      });
    }

    // Auto-settle selected pending debt items
    if (selectedSettlePendingIds.length > 0) {
      for (const id of selectedSettlePendingIds) {
        onSettlePendingPayment(id, true);
      }
    }

    // Auto-process partial pending debt deductions
    if (onPartialSettlePendingPayment) {
      unpaidDebts.forEach((item) => {
        if (selectedSettlePendingIds.includes(item.id)) return;
        const cups = Math.min(item.juiceCupsCount, Math.max(0, partialPendingCups[item.id] || 0));
        const boxes = Math.min(item.foodTakeawaysCount, Math.max(0, partialPendingBoxes[item.id] || 0));
        const birr = Math.max(0, partialPendingBirr[item.id] || 0);
        const totalPaid = (cups * juicePrice) + (boxes * foodPrice) + birr;

        if (totalPaid > 0) {
          onPartialSettlePendingPayment(item.id, totalPaid, cups, boxes, true);
        }
      });
    }

    setSavedSuccessMsg(
      `Shift Closed Successfully! Leftovers passed to next shift: ${juiceLeftover} Juice Cups & ${foodLeftover} Food Takeaways.`
    );
  };

  const inputClasses = "w-full px-4 py-2.5 bg-white border border-[#403c21]/30 rounded-full text-[#403c21] text-sm font-bold focus:outline-none focus:border-[#403c21] focus:ring-4 focus:ring-[#403c21]/40 transition-all shadow-xs placeholder:text-[#403c21]/50";
  const leftoverInputClasses = "w-full px-4 py-2.5 bg-white border-2 border-[#403c21] rounded-full text-[#403c21] text-base font-extrabold text-center focus:outline-none transition-all shadow-xs";
  const labelClasses = "block text-xs font-bold text-[#403c21]/80 uppercase tracking-wider mb-1.5";
  const subLabelClasses = "text-xs text-[#403c21]/70 font-medium block text-center mt-1.5";

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6 font-sans text-[#403c21]">
      
      <AnimatePresence>
        {savedSuccessMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="bg-[#403c21] text-white rounded-3xl p-5 shadow-xl border border-[#403c21]/40 flex items-center space-x-3.5"
          >
            <ShieldCheck className="w-6 h-6 text-[#403c21] shrink-0" />
            <p className="text-sm font-semibold leading-snug flex-1 text-white">
              {savedSuccessMsg}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#403c21] hover:bg-[#33301a] text-[#f7f5f0] font-bold text-xs rounded-full shadow-md transition-colors whitespace-nowrap"
            >
              Start New Shift
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {!savedSuccessMsg && (
        <>
          {/* PENDING SHIFT APPROVALS BANNER */}
          {pendingApprovalShifts && pendingApprovalShifts.length > 0 && (
            <div className="bg-white border border-[#403c21]/20 rounded-3xl p-5 shadow-xs text-[#403c21] space-y-4">
              <div className="flex items-center justify-between border-b border-[#403c21]/15 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#f7f5f0] text-[#403c21] flex items-center justify-center border border-[#403c21]/20 animate-pulse">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold tracking-tight text-[#403c21] flex items-center gap-2">
                      <span>ለማረጋገጫ የተላኩ የሸፍት መዝገቦች</span>
                      <span className="bg-[#403c21] text-[#f7f5f0] font-extrabold text-xs px-3 py-0.5 rounded-full">
                        {pendingApprovalShifts.length} PENDING APPROVAL
                      </span>
                    </h2>
                    <p className="text-xs text-neutral-600 font-medium">
                      Review shift details submitted from mobile phone by workers before approving into database.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {pendingApprovalShifts.map((pShift) => (
                  <div 
                    key={pShift.id} 
                    className="bg-[#f7f5f0] border border-[#403c21]/20 rounded-2xl p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-[#403c21]/15 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-[#403c21] text-[#f7f5f0]">
                          {pShift.shiftType === 'night' ? '🌙 Night Shift' : '☀️ Day Shift'}
                        </span>
                        <span className="text-sm font-extrabold text-[#403c21]">{pShift.date}</span>
                        <span className="text-xs text-neutral-600 font-medium">({pShift.workerName})</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-neutral-500 block font-medium">Gross Sales</span>
                        <span className="text-sm font-extrabold text-[#403c21]">
                          {formatCurrency(pShift.grossIncome, currencySymbol)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="bg-white p-2.5 rounded-xl border border-[#403c21]/20 shadow-xs">
                        <span className="text-neutral-500 text-[10px] block font-medium">Juice Sold</span>
                        <span className="font-extrabold text-[#403c21]">
                          {pShift.juiceCupsSold} Cups ({pShift.juiceRevenue} ETB)
                        </span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-[#403c21]/20 shadow-xs">
                        <span className="text-neutral-500 text-[10px] block font-medium">Food Sold</span>
                        <span className="font-extrabold text-[#403c21]">
                          {pShift.foodTakeawaysSold} Boxes ({pShift.foodRevenue} ETB)
                        </span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-[#403c21]/20 shadow-xs">
                        <span className="text-neutral-500 text-[10px] block font-medium">Digital / Exp</span>
                        <span className="font-extrabold text-[#403c21]">
                          -{pShift.digitalTransfers + pShift.dailyExpenses} ETB
                        </span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-[#403c21]/20 shadow-xs">
                        <span className="text-neutral-500 text-[10px] block font-medium">Pending / Del</span>
                        <span className="font-extrabold text-[#403c21]">
                          -{pShift.newPendingPaymentsAmount + pShift.deliveryCreditAmount} ETB
                        </span>
                      </div>
                    </div>

                    {/* Net Cash Handover Highlight */}
                    <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-[#403c21]/20 shadow-xs">
                      <div>
                        <span className="text-xs text-[#403c21] font-extrabold block">ለባለቤቱ የሚገባ ጥሬ ገንዘብ (Net Cash Handover)</span>
                        <span className="text-xs text-neutral-500 font-medium">Actual cash to receive</span>
                      </div>
                      <span className="text-2xl font-extrabold text-[#403c21]">
                        {formatCurrency(pShift.netCashDueToOwner, currencySymbol)}
                      </span>
                    </div>

                    {/* Action Buttons: Approve / Reject */}
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        onClick={() => onApproveShift?.(pShift)}
                        className="flex-1 py-3 rounded-full bg-[#403c21] hover:bg-[#33301a] text-[#f7f5f0] font-extrabold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[#403c21]" />
                        <span>የሸፍት መረጃውን አጽድቅ (Approve & Close Shift)</span>
                      </button>
                      <button
                        onClick={() => onRejectShift?.(pShift.id)}
                        className="px-5 py-3 rounded-full bg-white hover:bg-rose-50 text-rose-600 font-extrabold text-xs border-2 border-rose-600 cursor-pointer active:scale-95 transition-all shadow-xs"
                      >
                        ሰርዝ (Reject)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SHIFT & WORKER SELECTION BAR */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-[#403c21]/20 text-[#403c21]">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-full bg-[#f7f5f0] text-[#403c21] border border-[#403c21]/20">
            {activeShift === 'day' ? <Sun className="w-6 h-6 text-[#403c21]" /> : <Moon className="w-6 h-6 text-[#403c21]" />}
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-[#403c21] capitalize flex items-center space-x-2">
              <span>{activeShift} Shift Reconciliation</span>
            </h2>
            <p className="text-sm font-medium text-neutral-600">
              Count leftover stock & calculate net physical cash handover
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3.5 w-full sm:w-auto">
          <div className="flex flex-col">
            <div className="flex items-center justify-between gap-2 mb-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Date</label>
              {shiftDate && (
                <span className="text-[11px] font-extrabold text-[#403c21] bg-[#f7f5f0] border border-[#403c21]/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <span>🇪🇹</span> {formatEthiopianFullDate(shiftDate)}
                </span>
              )}
            </div>
            <input
              type="date"
              value={shiftDate}
              onChange={(e) => setShiftDate(e.target.value)}
              className="px-3.5 py-2 bg-white border border-[#403c21]/30 rounded-full text-sm text-[#403c21] font-bold focus:outline-none focus:border-[#403c21] cursor-pointer shadow-xs"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">Worker</label>
            <input
              type="text"
              value={workerName}
              onChange={(e) => setWorkerName(e.target.value)}
              className="px-3.5 py-2 bg-white border border-[#403c21]/30 rounded-full text-sm text-[#403c21] font-bold focus:outline-none focus:border-[#403c21] w-full sm:w-44 placeholder-neutral-400 shadow-xs"
              placeholder="Worker Name"
            />
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveShiftRecord} className="space-y-6">
        
        {/* STEP 1: COUNTED INVENTORY */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#403c21] text-[#f7f5f0] font-bold text-sm shadow-sm">
                1
              </span>
              <h3 className="text-lg font-extrabold text-[#403c21]">
                Stock Inventory Count
              </h3>
            </div>
            <span className="text-xs font-semibold text-[#f7f5f0] bg-[#403c21] px-3 py-1 rounded-full border border-[#403c21]/40">
              ⚡ Auto-Calculates
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* JUICE CUPS */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#403c21]/20 shadow-xs space-y-4 text-[#403c21]">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-full bg-[#f7f5f0] text-[#403c21] border border-[#403c21]/20">
                    <CupSoda className="w-5 h-5" />
                  </div>
                  <span className="text-base font-extrabold text-[#403c21]">Juice & Smoothie Cups</span>
                </div>
                <span className="text-xs font-extrabold text-[#403c21] bg-[#f7f5f0] px-3 py-1 rounded-full border border-[#403c21]/20">
                  {juicePrice} {currencySymbol} / cup
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3.5">
                <div>
                  <label className={labelClasses}>Opening</label>
                  <input
                    type="number"
                    min="0"
                    value={juiceOpening}
                    onFocus={handleInputFocus}
                    onChange={(e) => setJuiceOpening(cleanNumberInput(e))}
                    className={`${inputClasses} text-center`}
                  />
                  <span className={subLabelClasses}>
                    {lastClosedShift ? `Last: ${lastClosedShift.juiceCups.remainingCount}` : 'Opening'}
                  </span>
                </div>
                <div>
                  <label className={labelClasses}>+ Added</label>
                  <input
                    type="number"
                    min="0"
                    value={juiceAdded}
                    onFocus={handleInputFocus}
                    onChange={(e) => setJuiceAdded(cleanNumberInput(e))}
                    className={`${inputClasses} text-center`}
                  />
                  <span className={subLabelClasses}>Restocked</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#403c21] uppercase tracking-wider mb-1.5">Leftover</label>
                  <input
                    type="number"
                    min="0"
                    value={juiceLeftover}
                    onFocus={handleInputFocus}
                    onChange={(e) => setJuiceLeftover(cleanNumberInput(e))}
                    className={leftoverInputClasses}
                  />
                  <span className="text-xs text-[#403c21] block text-center mt-1.5 font-bold">Shift End</span>
                </div>
              </div>

              <div className="pt-4 border-t border-[#403c21]/15 flex items-center justify-between text-sm">
                <div>
                  <span className="text-neutral-500 font-medium">Sold: </span>
                  <span className="text-[#403c21] font-extrabold">{juiceCupsSold} cups</span>
                </div>
                <div>
                  <span className="text-neutral-500 font-medium">Revenue: </span>
                  <span className="text-[#403c21] font-extrabold">
                    {formatCurrency(juiceRevenue, currencySymbol)}
                  </span>
                </div>
              </div>
            </div>

            {/* FOOD BOXES */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#403c21]/20 shadow-xs space-y-4 text-[#403c21]">
              {/* Header & Calculation Mode Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-full bg-[#f7f5f0] text-[#403c21] border border-[#403c21]/20">
                    <UtensilsCrossed className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-base font-extrabold text-[#403c21]">Food Takeaway Sales</span>
                    <p className="text-[11px] text-neutral-500 font-medium mt-0.5">Select calculation method below</p>
                  </div>
                </div>

                <div className="flex items-center bg-[#f7f5f0] p-1 rounded-full border border-[#403c21]/20 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setUseMenuSalesCalc(true)}
                    className={`px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer ${useMenuSalesCalc ? 'bg-[#403c21] text-[#f7f5f0] shadow-xs' : 'text-neutral-600 hover:text-[#403c21]'}`}
                  >
                    ✨ Itemized Menu
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseMenuSalesCalc(false)}
                    className={`px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer ${!useMenuSalesCalc ? 'bg-[#403c21] text-[#f7f5f0] shadow-xs' : 'text-neutral-600 hover:text-[#403c21]'}`}
                  >
                    📦 Flat Rate
                  </button>
                </div>
              </div>

              {/* LAYER 1: Physical Box Count */}
              <div className="bg-[#f7f5f0] rounded-2xl p-4 border border-[#403c21]/20">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-5 h-5 rounded-full bg-[#403c21] text-[#f7f5f0] text-[10px] font-extrabold flex items-center justify-center">1</span>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#403c21]">Physical Box Count</span>
                  <span className="ml-auto text-xs text-neutral-500 font-medium">Opening + Added − Leftover = Sold</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelClasses}>Opening</label>
                    <input
                      type="number" min="0" value={foodOpening}
                      onFocus={handleInputFocus}
                      onChange={(e) => setFoodOpening(cleanNumberInput(e))}
                      className={`${inputClasses} text-center`}
                    />
                    <span className={subLabelClasses}>
                      {lastClosedShift ? `Last: ${lastClosedShift.foodTakeaways.remainingCount}` : 'Opening'}
                    </span>
                  </div>
                  <div>
                    <label className={labelClasses}>+ Added</label>
                    <input
                      type="number" min="0" value={foodAdded}
                      onFocus={handleInputFocus}
                      onChange={(e) => setFoodAdded(cleanNumberInput(e))}
                      className={`${inputClasses} text-center`}
                    />
                    <span className={subLabelClasses}>Restocked</span>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#403c21] uppercase tracking-wider mb-1.5">Leftover</label>
                    <input
                      type="number" min="0" value={foodLeftover}
                      onFocus={handleInputFocus}
                      onChange={(e) => setFoodLeftover(cleanNumberInput(e))}
                      className={leftoverInputClasses}
                    />
                    <span className="text-xs text-[#403c21] block text-center mt-1.5 font-bold">Shift End</span>
                  </div>
                </div>
                {/* Box count summary */}
                <div className="mt-3 flex items-center justify-between bg-white rounded-full px-4 py-2 border border-[#403c21]/20 shadow-xs">
                  <span className="text-xs text-neutral-600 font-medium">Total Boxes Sold (by count)</span>
                  <span className="text-sm font-extrabold text-[#403c21]">{foodTakeawaysSold} boxes</span>
                </div>
              </div>

              {/* LAYER 2: Itemized Dish Sales */}
              <div className="bg-[#f7f5f0] rounded-2xl p-4 border border-[#403c21]/20">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-5 h-5 rounded-full bg-[#403c21] text-[#f7f5f0] text-[10px] font-extrabold flex items-center justify-center">2</span>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#403c21]">Itemize Which Dishes Were Sold</span>
                  <span className="ml-auto text-[10px] text-neutral-500 font-medium">Price auto-applied per item</span>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                  {(config.foodMenu || []).map((menuItem) => {
                    const qty = foodSales[menuItem.id] || 0;
                    return (
                      <div key={menuItem.id} className={`flex items-center justify-between px-3 py-2 rounded-xl border transition-all ${qty > 0 ? 'bg-white border-[#403c21]/40 shadow-xs' : 'bg-white border-transparent'}`}>
                        <div className="flex-1 min-w-0 flex items-center space-x-2 mr-2">
                          <span className="font-extrabold text-[#403c21] text-xs">{menuItem.name}</span>
                          <span className="text-[10px] text-[#403c21] font-bold whitespace-nowrap">{menuItem.price} Br / order</span>
                        </div>
                        {qty > 0 && (
                          <div className="text-[10px] text-[#403c21] font-extrabold mr-2 whitespace-nowrap">
                            = {(qty * menuItem.price).toLocaleString()} Br
                          </div>
                        )}
                        <div className="flex items-center space-x-1 flex-shrink-0">
                          <button type="button"
                            onClick={() => setFoodSales(prev => ({ ...prev, [menuItem.id]: Math.max(0, (prev[menuItem.id] || 0) - 1) }))}
                            className="w-6 h-6 rounded-full bg-white border border-[#403c21] text-[#403c21] font-extrabold flex items-center justify-center hover:bg-slate-100 cursor-pointer text-xs shadow-xs"
                          >−</button>
                          <input
                            type="number" min="0"
                            value={qty || ''}
                            placeholder="0"
                            onFocus={handleInputFocus}
                            onChange={(e) => {
                              const val = cleanNumberInput(e);
                              setFoodSales(prev => ({ ...prev, [menuItem.id]: val }));
                            }}
                            className="w-8 h-6 text-center text-xs font-extrabold text-[#403c21] bg-white border border-[#403c21]/30 rounded-md p-0 focus:outline-none focus:border-[#403c21]"
                          />
                          <button type="button"
                            onClick={() => setFoodSales(prev => ({ ...prev, [menuItem.id]: (prev[menuItem.id] || 0) + 1 }))}
                            className="w-6 h-6 rounded-full bg-[#403c21] hover:bg-[#33301a] text-[#f7f5f0] font-extrabold flex items-center justify-center cursor-pointer text-xs shadow-xs"
                          >+</button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Itemization status */}
                {(() => {
                  const unaccounted = Math.max(0, foodTakeawaysSold - totalMenuFoodSold);
                  const overEntered = totalMenuFoodSold > foodTakeawaysSold && foodTakeawaysSold > 0;
                  return (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between text-xs bg-white rounded-full px-4 py-2 border border-[#403c21]/20 shadow-xs">
                        <span className="text-neutral-600 font-medium">Itemized dishes</span>
                        <span className="font-extrabold text-[#403c21]">{totalMenuFoodSold} / {foodTakeawaysSold} boxes</span>
                      </div>
                      {unaccounted > 0 && (
                        <div className="bg-white border border-[#403c21]/20 rounded-2xl p-3 text-xs space-y-2 shadow-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-amber-500 font-bold text-base">⚠</span>
                            <span className="font-extrabold text-[#403c21]">{unaccounted} box{unaccounted > 1 ? 'es' : ''} un-itemized</span>
                            <span className="text-neutral-500 ml-auto font-medium">Physical: {foodTakeawaysSold} | Itemized: {totalMenuFoodSold}</span>
                          </div>
                          
                          <label className="flex items-center gap-2 text-[#403c21] font-bold cursor-pointer pt-1 border-t border-[#403c21]/15">
                            <input
                              type="checkbox"
                              checked={includeUnaccountedInRevenue}
                              onChange={(e) => setIncludeUnaccountedInRevenue(e.target.checked)}
                              className="rounded border-[#403c21] text-[#403c21] focus:ring-[#403c21] w-4 h-4 cursor-pointer"
                            />
                            <span>Include {unaccounted} un-itemized box{unaccounted > 1 ? 'es' : ''} using estimated fallback rate</span>
                          </label>

                          {includeUnaccountedInRevenue && (
                            <div className="flex items-center gap-2 pl-6 pt-1 text-neutral-600 font-medium">
                              <span>Fallback rate:</span>
                              <input
                                type="number"
                                value={foodPrice}
                                onChange={(e) => setFoodPrice(cleanNumberInput(e))}
                                className="w-16 text-center text-xs font-extrabold text-[#403c21] bg-white border border-[#403c21]/30 rounded-full focus:outline-none focus:border-[#403c21] py-0.5"
                              />
                              <span>Br/box → +{(unaccounted * foodPrice).toLocaleString()} Br added</span>
                            </div>
                          )}
                        </div>
                      )}
                      {overEntered && (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2.5 text-xs text-amber-800 font-bold">
                          ⚠ Itemized ({totalMenuFoodSold}) exceeds physical boxes sold ({foodTakeawaysSold}). Please recheck counts.
                        </div>
                      )}
                      {totalMenuFoodSold > 0 && unaccounted === 0 && !overEntered && (
                        <div className="bg-[#f7f5f0] border border-[#403c21]/20 rounded-2xl px-4 py-2.5 text-xs text-[#403c21] font-extrabold flex items-center gap-2">
                          <span>✓</span> All boxes fully itemized — revenue is 100% accurate!
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Revenue Summary */}
              <div className="pt-3 border-t border-[#403c21]/15 flex items-center justify-between text-sm">
                <div>
                  <span className="text-neutral-500 font-medium">Sold: </span>
                  <span className="text-[#403c21] font-extrabold">
                    {foodTakeawaysSold} boxes
                    {totalMenuFoodSold > 0 && ` (${totalMenuFoodSold} itemized)`}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 font-medium">Revenue: </span>
                  <span className="text-[#403c21] font-extrabold">
                    {formatCurrency(foodRevenue, currencySymbol)}
                  </span>
                </div>
              </div>
            </div>


          </div>

          {/* GROSS INCOME TOTAL */}
          <div className="bg-white rounded-3xl p-5 border border-[#403c21]/20 shadow-xs flex items-center justify-between text-[#403c21]">
            <div className="flex items-center space-x-3">
              <Zap className="w-6 h-6 text-[#403c21]" />
              <span className="text-xs font-extrabold uppercase tracking-widest text-neutral-500">
                Calculated Gross Shift Income
              </span>
            </div>
            <span className="text-2xl font-extrabold text-[#403c21]">
              {formatCurrency(grossIncome, currencySymbol)}
            </span>
          </div>
        </div>

        {/* STEP 2: CASH ADJUSTMENTS */}
        <div className="space-y-5 pt-2">
          <div className="flex items-center space-x-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#403c21] text-[#f7f5f0] font-extrabold text-sm shadow-xs">
              2
            </span>
            <h3 className="text-lg font-extrabold text-[#403c21]">
              Cash Deductions & Additions
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* 1. DIGITAL TRANSFERS (CALCULATOR) */}
            <div 
              onClick={() => setActiveCalc('transfer')}
              className="bg-white rounded-3xl p-5 border border-[#403c21]/20 space-y-3 hover:border-[#403c21]/50 transition-all shadow-xs cursor-pointer group text-[#403c21]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingDown className="w-5 h-5 text-[#403c21]" />
                  <span className="text-sm font-extrabold text-[#403c21]">1. Digital Transfers</span>
                </div>
                <div className="p-2 bg-[#f7f5f0] text-[#403c21] rounded-full border border-[#403c21]/20 group-hover:bg-[#403c21] group-hover:text-[#403c21] transition-colors shadow-xs">
                  <Calculator size={18} />
                </div>
              </div>
              <p className="text-[11px] text-neutral-500 font-medium">Telebirr / CBE — Tap to calculate transfers.</p>
              
              <div className="pt-2">
                <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Total Amount</div>
                <div className="text-2xl font-extrabold text-[#403c21] font-mono">
                  {formatCurrency(digitalTransfers, currencySymbol)}
                </div>
              </div>
            </div>

            {/* 2. DAILY EXPENSES (CALCULATOR) */}
            <div 
              onClick={() => setActiveCalc('expense')}
              className="bg-white rounded-3xl p-5 border border-[#403c21]/20 space-y-3 hover:border-[#403c21]/50 transition-all shadow-xs cursor-pointer group text-[#403c21]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Receipt className="w-5 h-5 text-[#403c21]" />
                  <span className="text-sm font-extrabold text-[#403c21]">2. Daily Cooking Expenses</span>
                </div>
                <div className="p-2 bg-[#f7f5f0] text-[#403c21] rounded-full border border-[#403c21]/20 group-hover:bg-[#403c21] group-hover:text-[#403c21] transition-colors shadow-xs">
                  <Calculator size={18} />
                </div>
              </div>
              <p className="text-[11px] text-neutral-500 font-medium">Tap to calculate total spent on ingredients.</p>

              <div className="pt-2">
                <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Total Amount</div>
                <div className="text-2xl font-extrabold text-[#403c21] font-mono">
                  {formatCurrency(dailyExpensesTotal, currencySymbol)}
                </div>
              </div>
            </div>

            {/* 3. NEW PENDING */}
            <div className="bg-white rounded-3xl p-5 border border-[#403c21]/20 space-y-3 hover:border-[#403c21]/50 transition-all shadow-xs text-[#403c21]">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-[#403c21]" />
                  <span className="text-sm font-extrabold text-[#403c21]">3. New Unpaid Pending Credit</span>
                </div>
                <span className="text-[10px] font-extrabold text-[#403c21] bg-[#f7f5f0] px-3 py-1 rounded-full border border-[#403c21]/20 uppercase">
                  - Deducted
                </span>
              </div>
              <p className="text-xs text-neutral-500 font-medium">Cups & boxes given on credit to unpaid customers.</p>
              
              <div className="mb-3">
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Customer Name</label>
                <input
                  type="text"
                  value={pendingCustomerName}
                  onChange={(e) => setPendingCustomerName(e.target.value)}
                  className={inputClasses}
                  placeholder="e.g. Abebe"
                />
              </div>

              <div className="bg-[#f7f5f0] rounded-2xl p-3 border border-[#403c21]/20">
                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                  {/* Juice Row */}
                  <div className={`flex items-center justify-between px-3 py-2 rounded-xl border transition-all ${pendingJuiceCups > 0 ? 'bg-white border-[#403c21]/40 shadow-xs' : 'bg-white border-transparent'}`}>
                    <div className="flex-1 min-w-0 flex items-center space-x-2 mr-2">
                      <span className="font-extrabold text-[#403c21] text-xs">Juice & Smoothie Cups</span>
                      <span className="text-[10px] text-[#403c21] font-bold whitespace-nowrap">{juicePrice} Br / cup</span>
                    </div>
                    {pendingJuiceCups > 0 && (
                      <div className="text-[10px] text-[#403c21] font-extrabold mr-2 whitespace-nowrap">
                        = {(pendingJuiceCups * juicePrice).toLocaleString()} Br
                      </div>
                    )}
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <button type="button"
                        onClick={() => setPendingJuiceCups(Math.max(0, pendingJuiceCups - 1))}
                        className="w-6 h-6 rounded-full bg-white border border-[#403c21] text-[#403c21] font-extrabold flex items-center justify-center hover:bg-slate-100 cursor-pointer text-xs shadow-xs"
                      >−</button>
                      <input
                        type="number" min="0"
                        value={pendingJuiceCups || ''}
                        placeholder="0"
                        onFocus={handleInputFocus}
                        onChange={(e) => setPendingJuiceCups(cleanNumberInput(e))}
                        className="w-8 h-6 text-center text-xs font-extrabold text-[#403c21] bg-white border border-[#403c21]/30 rounded-md p-0 focus:outline-none focus:border-[#403c21]"
                      />
                      <button type="button"
                        onClick={() => setPendingJuiceCups(pendingJuiceCups + 1)}
                        className="w-6 h-6 rounded-full bg-[#403c21] hover:bg-[#33301a] text-[#f7f5f0] font-extrabold flex items-center justify-center cursor-pointer text-xs shadow-xs"
                      >+</button>
                    </div>
                  </div>

                  {/* Food Rows */}
                  {(config.foodMenu || []).map((menuItem) => {
                    const qty = pendingFoodSales[menuItem.id] || 0;
                    return (
                      <div key={menuItem.id} className={`flex items-center justify-between px-3 py-2 rounded-xl border transition-all ${qty > 0 ? 'bg-white border-[#403c21]/40 shadow-xs' : 'bg-white border-transparent'}`}>
                        <div className="flex-1 min-w-0 flex items-center space-x-2 mr-2">
                          <span className="font-extrabold text-[#403c21] text-xs">{menuItem.name}</span>
                          <span className="text-[10px] text-[#403c21] font-bold whitespace-nowrap">{menuItem.price} Br / order</span>
                        </div>
                        {qty > 0 && (
                          <div className="text-[10px] text-[#403c21] font-extrabold mr-2 whitespace-nowrap">
                            = {(qty * menuItem.price).toLocaleString()} Br
                          </div>
                        )}
                        <div className="flex items-center space-x-1 flex-shrink-0">
                          <button type="button"
                            onClick={() => setPendingFoodSales(prev => ({ ...prev, [menuItem.id]: Math.max(0, (prev[menuItem.id] || 0) - 1) }))}
                            className="w-6 h-6 rounded-full bg-white border border-[#403c21] text-[#403c21] font-extrabold flex items-center justify-center hover:bg-slate-100 cursor-pointer text-xs shadow-xs"
                          >−</button>
                          <input
                            type="number" min="0"
                            value={qty || ''}
                            placeholder="0"
                            onFocus={handleInputFocus}
                            onChange={(e) => {
                              const val = cleanNumberInput(e);
                              setPendingFoodSales(prev => ({ ...prev, [menuItem.id]: val }));
                            }}
                            className="w-8 h-6 text-center text-xs font-extrabold text-[#403c21] bg-white border border-[#403c21]/30 rounded-md p-0 focus:outline-none focus:border-[#403c21]"
                          />
                          <button type="button"
                            onClick={() => setPendingFoodSales(prev => ({ ...prev, [menuItem.id]: (prev[menuItem.id] || 0) + 1 }))}
                            className="w-6 h-6 rounded-full bg-[#403c21] hover:bg-[#33301a] text-[#f7f5f0] font-extrabold flex items-center justify-center cursor-pointer text-xs shadow-xs"
                          >+</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="pt-2 flex items-center justify-between text-xs font-semibold text-neutral-600 font-medium">
                <span>Deduction Total:</span>
                <span className="text-[#403c21] text-sm font-extrabold">{formatCurrency(newPendingAmount, currencySymbol)}</span>
              </div>
            </div>

            {/* 4. RECOVERED PENDING */}
            <div className="bg-white rounded-3xl p-5 border border-[#403c21]/20 space-y-3 hover:border-[#403c21]/50 transition-all shadow-xs text-[#403c21]">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-[#403c21]" />
                  <span className="text-sm font-extrabold text-[#403c21]">4. Recovered Pending Debts</span>
                </div>
                <span className="text-[10px] font-extrabold text-[#403c21] bg-[#f7f5f0] px-3 py-1 rounded-full border border-[#403c21]/20 uppercase">
                  + Added
                </span>
              </div>
              <p className="text-xs text-neutral-500 font-medium">Past pending debts paid off in cash during this shift.</p>

              {/* Unpaid Debts Selection Checklist */}
              {unpaidDebts.length > 0 && (
                <div className="space-y-2 bg-[#f7f5f0] p-3 rounded-2xl border border-[#403c21]/20">
                  <p className="text-xs font-extrabold text-[#403c21] flex items-center justify-between">
                    <span>Unpaid Customer Debts (Full or Partial Settlement):</span>
                    <span className="text-[10px] text-[#403c21] font-extrabold">{unpaidDebts.length} Unpaid Total</span>
                  </p>
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                    {unpaidDebts.map((item) => {
                      const isFullSelected = selectedSettlePendingIds.includes(item.id);
                      const cupsPaid = partialPendingCups[item.id] || 0;
                      const boxesPaid = partialPendingBoxes[item.id] || 0;
                      const birrPaid = partialPendingBirr[item.id] || 0;
                      const partialTotal = (cupsPaid * juicePrice) + (boxesPaid * foodPrice) + birrPaid;
                      const hasPartial = !isFullSelected && partialTotal > 0;

                      return (
                        <div
                          key={item.id}
                          className={`p-3 rounded-xl border text-xs space-y-2 transition-all ${
                            isFullSelected
                              ? 'bg-[#403c21]/40 border-[#403c21] shadow-sm'
                              : hasPartial
                              ? 'bg-[#403c21]/30 border-[#403c21]/50 shadow-sm'
                              : 'bg-[#403c21]/10 border-[#403c21]/30 hover:border-[#403c21]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-white truncate">
                                {item.customerName || 'Customer'}
                              </p>
                              <p className="text-[10px] text-neutral-400 truncate">
                                {item.description} ({item.shiftType.toUpperCase()} • {item.date})
                              </p>
                            </div>
                            <span className="font-extrabold text-[#403c21] whitespace-nowrap">
                              {formatCurrency(item.amount, currencySymbol)}
                            </span>
                          </div>

                          {/* Options Row */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#403c21]/30">
                            <label className="flex items-center gap-1.5 font-semibold text-white cursor-pointer text-[11px]">
                              <input
                                type="checkbox"
                                checked={isFullSelected}
                                onChange={() => {
                                  setSelectedSettlePendingIds(prev =>
                                    isFullSelected ? prev.filter(id => id !== item.id) : [...prev, item.id]
                                  );
                                }}
                                className="w-4 h-4 text-[#403c21] rounded focus:ring-[#403c21] cursor-pointer"
                              />
                              <span>Full Settlement ({formatCurrency(item.amount, currencySymbol)})</span>
                            </label>

                            {!isFullSelected && (
                              <div className="flex items-center gap-2">
                                {item.juiceCupsCount > 0 && (
                                  <div className="flex items-center space-x-1 bg-[#403c21] px-2 py-0.5 rounded-full border border-[#403c21]/40">
                                    <span className="text-[10px] font-semibold text-neutral-300">Paid Cups:</span>
                                    <button type="button"
                                      onClick={() => setPartialPendingCups(prev => ({ ...prev, [item.id]: Math.max(0, (prev[item.id] || 0) - 1) }))}
                                      className="w-4 h-4 rounded-full bg-[#403c21] text-white font-bold flex items-center justify-center text-[10px]"
                                    >−</button>
                                    <input
                                      type="number" min="0" max={item.juiceCupsCount}
                                      value={cupsPaid || ''}
                                      placeholder="0"
                                      onFocus={handleInputFocus}
                                      onChange={(e) => {
                                        const val = Math.min(item.juiceCupsCount, cleanNumberInput(e));
                                        setPartialPendingCups(prev => ({ ...prev, [item.id]: val }));
                                      }}
                                      className="w-7 h-4 text-center text-[10px] font-bold text-white bg-[#403c21] border border-[#403c21] rounded p-0"
                                    />
                                    <button type="button"
                                      onClick={() => setPartialPendingCups(prev => ({ ...prev, [item.id]: Math.min(item.juiceCupsCount, (prev[item.id] || 0) + 1) }))}
                                      className="w-4 h-4 rounded-full bg-[#403c21] text-[#f7f5f0] font-bold flex items-center justify-center text-[10px]"
                                    >+</button>
                                  </div>
                                )}

                                {item.foodTakeawaysCount > 0 && (
                                  <div className="flex items-center space-x-1 bg-[#403c21] px-2 py-0.5 rounded-full border border-[#403c21]/40">
                                    <span className="text-[10px] font-semibold text-neutral-300">Paid Boxes:</span>
                                    <button type="button"
                                      onClick={() => setPartialPendingBoxes(prev => ({ ...prev, [item.id]: Math.max(0, (prev[item.id] || 0) - 1) }))}
                                      className="w-4 h-4 rounded-full bg-[#403c21] text-white font-bold flex items-center justify-center text-[10px]"
                                    >−</button>
                                    <input
                                      type="number" min="0" max={item.foodTakeawaysCount}
                                      value={boxesPaid || ''}
                                      placeholder="0"
                                      onFocus={handleInputFocus}
                                      onChange={(e) => {
                                        const val = Math.min(item.foodTakeawaysCount, cleanNumberInput(e));
                                        setPartialPendingBoxes(prev => ({ ...prev, [item.id]: val }));
                                      }}
                                      className="w-7 h-4 text-center text-[10px] font-bold text-white bg-[#403c21] border border-[#403c21] rounded p-0"
                                    />
                                    <button type="button"
                                      onClick={() => setPartialPendingBoxes(prev => ({ ...prev, [item.id]: Math.min(item.foodTakeawaysCount, (prev[item.id] || 0) + 1) }))}
                                      className="w-4 h-4 rounded-full bg-[#403c21] text-[#f7f5f0] font-bold flex items-center justify-center text-[10px]"
                                    >+</button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Live Partial Summary Tag */}
                          {hasPartial && (
                            <div className="bg-[#403c21]/40 px-3 py-1 rounded-full text-[10px] font-bold text-[#403c21] flex items-center justify-between border border-[#403c21]/40">
                              <span>Recovering {formatCurrency(partialTotal, currencySymbol)} today</span>
                              <span>
                                Remaining: {Math.max(0, item.juiceCupsCount - cupsPaid)} Cups / {formatCurrency(Math.max(0, item.amount - partialTotal), currencySymbol)}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {(selectedPendingTotalAmount > 0 || partialDeductionsTotalAmount > 0) && (
                    <p className="text-[11px] font-bold text-[#403c21] text-right pt-1">
                      Recovered Customer Debts Total: {formatCurrency(selectedPendingTotalAmount + partialDeductionsTotalAmount, currencySymbol)} (Adds to Shift Cash)
                    </p>
                  )}
                </div>
              )}
              
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Additional note or custom customer name..."
                  value={recoveredNote}
                  onChange={(e) => setRecoveredNote(e.target.value)}
                  className="w-full text-xs font-semibold text-white bg-[#403c21] border border-[#403c21]/50 rounded-full px-4 py-2.5 focus:outline-none focus:border-[#403c21] transition-all placeholder:text-neutral-500"
                />
                <div className="space-y-1.5 bg-[#403c21] p-3 rounded-2xl border border-[#403c21]/40">
                  <p className="text-[11px] font-medium text-neutral-300 px-1">Extra Unlisted Manual Debt Recoveries:</p>
                  <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                    <div className={`flex items-center justify-between px-3 py-2 rounded-xl border transition-all ${recoveredJuiceCups > 0 ? 'bg-[#403c21]/30 border-[#403c21]/50 shadow-sm' : 'bg-[#403c21]/10 border-transparent'}`}>
                      <div className="flex-1 min-w-0 flex items-center space-x-2 mr-2">
                        <span className="font-bold text-white text-xs">Juice & Smoothie Cups</span>
                        <span className="text-[10px] text-[#403c21] font-medium whitespace-nowrap">{juicePrice} Br / cup</span>
                      </div>
                      {recoveredJuiceCups > 0 && (
                        <div className="text-[10px] text-[#403c21] font-bold mr-2 whitespace-nowrap">
                          = {(recoveredJuiceCups * juicePrice).toLocaleString()} Br
                        </div>
                      )}
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        <button type="button"
                          onClick={() => setRecoveredJuiceCups(Math.max(0, recoveredJuiceCups - 1))}
                          className="w-6 h-6 rounded-full bg-[#403c21] border border-[#403c21] text-white font-bold flex items-center justify-center hover:bg-[#403c21]/40 cursor-pointer text-xs"
                        >−</button>
                        <input
                          type="number" min="0"
                          value={recoveredJuiceCups || ''}
                          placeholder="0"
                          onFocus={handleInputFocus}
                          onChange={(e) => setRecoveredJuiceCups(cleanNumberInput(e))}
                          className="w-8 h-6 text-center text-xs font-bold text-white bg-[#403c21] border border-[#403c21]/50 rounded-md p-0 focus:outline-none focus:border-[#403c21]"
                        />
                        <button type="button"
                          onClick={() => setRecoveredJuiceCups(recoveredJuiceCups + 1)}
                          className="w-6 h-6 rounded-full bg-[#403c21] text-[#f7f5f0] font-bold flex items-center justify-center hover:bg-[#403c21]/90 cursor-pointer text-xs"
                        >+</button>
                      </div>
                    </div>

                    {(config.foodMenu || []).map((menuItem) => {
                      const qty = recoveredFoodSales[menuItem.id] || 0;
                      return (
                        <div key={menuItem.id} className={`flex items-center justify-between px-3 py-2 rounded-xl border transition-all ${qty > 0 ? 'bg-[#403c21]/30 border-[#403c21]/50 shadow-sm' : 'bg-[#403c21]/10 border-transparent'}`}>
                          <div className="flex-1 min-w-0 flex items-center space-x-2 mr-2">
                            <span className="font-bold text-white text-xs">{menuItem.name}</span>
                            <span className="text-[10px] text-[#403c21] font-medium whitespace-nowrap">{menuItem.price} Br / order</span>
                          </div>
                          {qty > 0 && (
                            <div className="text-[10px] text-[#403c21] font-bold mr-2 whitespace-nowrap">
                              = {(qty * menuItem.price).toLocaleString()} Br
                            </div>
                          )}
                          <div className="flex items-center space-x-1 flex-shrink-0">
                            <button type="button"
                              onClick={() => setRecoveredFoodSales(prev => ({ ...prev, [menuItem.id]: Math.max(0, (prev[menuItem.id] || 0) - 1) }))}
                              className="w-6 h-6 rounded-full bg-[#403c21] border border-[#403c21] text-white font-bold flex items-center justify-center hover:bg-[#403c21]/40 cursor-pointer text-xs"
                            >−</button>
                            <input
                              type="number" min="0"
                              value={qty || ''}
                              placeholder="0"
                              onFocus={handleInputFocus}
                              onChange={(e) => {
                                const val = cleanNumberInput(e);
                                setRecoveredFoodSales(prev => ({ ...prev, [menuItem.id]: val }));
                              }}
                              className="w-8 h-6 text-center text-xs font-bold text-white bg-[#403c21] border border-[#403c21]/50 rounded-md p-0 focus:outline-none focus:border-[#403c21]"
                            />
                            <button type="button"
                              onClick={() => setRecoveredFoodSales(prev => ({ ...prev, [menuItem.id]: (prev[menuItem.id] || 0) + 1 }))}
                              className="w-6 h-6 rounded-full bg-[#403c21] text-[#f7f5f0] font-bold flex items-center justify-center hover:bg-[#403c21]/90 cursor-pointer text-xs"
                            >+</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="pt-2 flex items-center justify-between text-xs font-semibold text-neutral-300">
                <span>Added Cash Total:</span>
                <span className="text-[#403c21] text-sm font-bold">{formatCurrency(recoveredPendingAmount, currencySymbol)}</span>
              </div>
            </div>

            {/* 5. DELIVERY CREDIT */}
            <div className="bg-white rounded-3xl p-5 border border-[#403c21]/20 space-y-3 hover:border-[#403c21]/50 transition-all shadow-xs md:col-span-2 text-[#403c21]">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Truck className="w-5 h-5 text-[#403c21]" />
                  <span className="text-sm font-extrabold text-[#403c21]">5. Delivery Rider Credit Orders</span>
                </div>
                <span className="text-[10px] font-extrabold text-[#403c21] bg-[#f7f5f0] px-3 py-1 rounded-full border border-[#403c21]/20 uppercase">
                  - Deducted
                </span>
              </div>
              <p className="text-xs text-neutral-500 font-medium">Delivered via BeU / Deliver Addis / Feres riders on weekly account.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Cups</label>
                  <input
                    type="number"
                    min="0"
                    value={deliveryCups}
                    onFocus={handleInputFocus}
                    onChange={(e) => setDeliveryCups(cleanNumberInput(e))}
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Boxes</label>
                  <input
                    type="number"
                    min="0"
                    value={deliveryBoxes}
                    onFocus={handleInputFocus}
                    onChange={(e) => setDeliveryBoxes(cleanNumberInput(e))}
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Rider / Company</label>
                  <input
                    type="text"
                    value={deliveryRiderName}
                    onChange={(e) => setDeliveryRiderName(e.target.value)}
                    className={inputClasses}
                    placeholder="e.g. BeU Rider"
                  />
                </div>
              </div>
              <div className="pt-2 flex items-center justify-between text-xs font-semibold text-neutral-600 font-medium">
                <span>Deduction Total:</span>
                <span className="text-[#403c21] text-sm font-extrabold">{formatCurrency(deliveryCreditAmount, currencySymbol)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* NET CASH RESULT CARD (#403c21 Hero Card with #403c21 Accents) */}
        <div className="bg-[#403c21] rounded-3xl p-6 text-white shadow-2xl space-y-4 border border-[#403c21]/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-[#f7f5f0] bg-[#403c21] px-3.5 py-1 rounded-full mb-2 shadow-xs">
                <ShieldCheck className="w-4 h-4 text-[#f7f5f0]" /> Physical Cash Handover
              </span>
              <h3 className="text-2xl font-extrabold text-white tracking-tight">Net Cash Due to Owner</h3>
              <p className="text-xs text-white/80 mt-0.5 font-medium">Exact cash worker must hand over at end of shift</p>
            </div>
            <div className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#403c21]">
              {formatCurrency(netCashDueToOwner, currencySymbol)}
            </div>
          </div>

          <div className="text-xs font-bold text-white/80 pt-4 border-t border-[#403c21]/30 flex flex-wrap items-center gap-2">
            <span className="bg-[#403c21] px-3 py-1 rounded-full border border-[#403c21]/30 text-white">Gross: {formatCurrency(grossIncome, currencySymbol)}</span>
            <span>−</span>
            <span className="bg-[#403c21] px-3 py-1 rounded-full border border-[#403c21]/30 text-white">Digital: {formatCurrency(digitalTransfers, currencySymbol)}</span>
            <span>−</span>
            <span className="bg-[#403c21] px-3 py-1 rounded-full border border-[#403c21]/30 text-white">Exp: {formatCurrency(dailyExpensesTotal, currencySymbol)}</span>
            <span>−</span>
            <span className="bg-[#403c21] px-3 py-1 rounded-full border border-[#403c21]/30 text-white">Pend: {formatCurrency(newPendingAmount, currencySymbol)}</span>
            <span>+</span>
            <span className="bg-[#403c21] px-3 py-1 rounded-full border border-[#403c21]/30 text-white">Rec: {formatCurrency(recoveredPendingAmount, currencySymbol)}</span>
            <span>−</span>
            <span className="bg-[#403c21] px-3 py-1 rounded-full border border-[#403c21]/30 text-white">Del: {formatCurrency(deliveryCreditAmount, currencySymbol)}</span>
          </div>
        </div>

        {/* NOTES & SUBMIT */}
        <div className="space-y-4 pt-2">
          <div>
            <label className={labelClasses}>Shift Notes & Log Comments</label>
            <textarea
              value={shiftNotes}
              onChange={(e) => setShiftNotes(e.target.value)}
              className={`${inputClasses} rounded-2xl resize-none`}
              rows={3}
              placeholder="Record any stock handover observations or notes..."
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#403c21] hover:bg-[#33301a] text-[#f7f5f0] font-extrabold py-4 px-6 rounded-full shadow-lg text-base flex items-center justify-center space-x-2.5 transition-all cursor-pointer active:scale-95"
          >
            <CheckCircle2 className="w-5 h-5 text-[#f7f5f0]" />
            <span>Close Shift & Carry Leftovers to Next Worker</span>
          </button>
        </div>
      </form>
      </>
      )}

      {/* MODALS */}
      <CalculatorModal
        isOpen={activeCalc === 'transfer'}
        onClose={() => setActiveCalc(null)}
        onSave={(amount) => {
          setDigitalTransfers(amount);
          setActiveCalc(null);
        }}
        title="Digital Transfers"
        initialValue={digitalTransfers}
      />

      <CalculatorModal
        isOpen={activeCalc === 'expense'}
        onClose={() => setActiveCalc(null)}
        onSave={(amount) => {
          setDailyExpensesTotal(amount);
          setActiveCalc(null);
        }}
        title="Cooking Expenses"
        initialValue={dailyExpensesTotal}
      />
    </motion.div>
  );
};

export default ShiftReconciliationView;
