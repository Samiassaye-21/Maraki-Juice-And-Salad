import React, { useState } from 'react';
import { 
  Clock, 
  Plus, 
  CheckCircle2, 
  Search, 
  User, 
  Trash2,
  Pencil,
  X,
  Save,
  Sun,
  Moon,
  ChevronDown,
  ChevronUp,
  Utensils,
  CupSoda,
  AlertTriangle,
  Sparkles,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PendingPaymentItem, ShiftType, RestaurantSystemConfig } from '../types';
import { formatCurrency, cleanNumberInput, cleanStringNumberInput, handleInputFocus } from '../utils/shiftUtils';

interface PendingPaymentsViewProps {
  pendingPayments: PendingPaymentItem[];
  onAddPendingPayment: (pending: Omit<PendingPaymentItem, 'id' | 'isPaid'>) => void;
  onUpdatePendingPayment?: (updated: PendingPaymentItem) => void;
  onPartialSettlePendingPayment?: (id: string, amountPaid: number, cupsPaid?: number, boxesPaid?: number) => void;
  onSettlePendingPayment: (id: string) => void;
  onDeletePendingPayment: (id: string) => void;
  onClearAllPendingPayments?: () => void;
  currencySymbol: string;
  config?: RestaurantSystemConfig;
}

export const PendingPaymentsView: React.FC<PendingPaymentsViewProps> = ({
  pendingPayments,
  onAddPendingPayment,
  onUpdatePendingPayment,
  onPartialSettlePendingPayment,
  onSettlePendingPayment,
  onDeletePendingPayment,
  onClearAllPendingPayments,
  currencySymbol,
  config,
}) => {
  const defaultJuicePrice = config?.defaultJuiceUnitPrice || 170;
  const defaultFoodPrice = config?.defaultFoodUnitPrice || 220;

  const [activeShiftTab, setActiveShiftTab] = useState<'both' | 'day' | 'night'>('both');
  const [filterStatus, setFilterStatus] = useState<'unpaid' | 'paid' | 'all'>('unpaid');
  const [searchTerm, setSearchTerm] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // New Pending Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [description, setDescription] = useState('');
  const [juiceCupsCount, setJuiceCupsCount] = useState(1);
  const [foodTakeawaysCount, setFoodTakeawaysCount] = useState(0);
  const [selectedFoodItemId, setSelectedFoodItemId] = useState<string>('');
  const [amount, setAmount] = useState((1 * defaultJuicePrice).toString());
  const [shiftType, setShiftType] = useState<ShiftType>('day');

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<PendingPaymentItem | null>(null);

  // Partial Payment Modal State
  const [partialItem, setPartialItem] = useState<PendingPaymentItem | null>(null);
  const [partialCupsPaid, setPartialCupsPaid] = useState<number>(0);
  const [partialBoxesPaid, setPartialBoxesPaid] = useState<number>(0);
  const [partialAmountPaid, setPartialAmountPaid] = useState<string>('');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const handleJuiceCupsChange = (cups: number) => {
    const validCups = Math.max(0, cups);
    setJuiceCupsCount(validCups);
    const selectedItem = config?.foodMenu?.find(m => m.id === selectedFoodItemId);
    const currentFoodPrice = selectedItem ? selectedItem.price : defaultFoodPrice;
    const calculated = (validCups * defaultJuicePrice) + (foodTakeawaysCount * currentFoodPrice);
    setAmount(calculated > 0 ? calculated.toString() : '');
  };

  const handleFoodBoxesChange = (boxes: number) => {
    const validBoxes = Math.max(0, boxes);
    setFoodTakeawaysCount(validBoxes);
    const selectedItem = config?.foodMenu?.find(m => m.id === selectedFoodItemId);
    const currentFoodPrice = selectedItem ? selectedItem.price : defaultFoodPrice;
    const calculated = (juiceCupsCount * defaultJuicePrice) + (validBoxes * currentFoodPrice);
    setAmount(calculated > 0 ? calculated.toString() : '');
  };

  const handleSelectFoodItem = (itemId: string) => {
    setSelectedFoodItemId(itemId);
    const item = config?.foodMenu?.find((m) => m.id === itemId);
    const foodCost = item ? item.price : defaultFoodPrice;
    const count = foodTakeawaysCount > 0 ? foodTakeawaysCount : (itemId ? 1 : 0);
    if (itemId && foodTakeawaysCount === 0) setFoodTakeawaysCount(1);
    
    const calc = (juiceCupsCount * defaultJuicePrice) + (count * foodCost);
    setAmount(calc > 0 ? calc.toString() : '');
    
    const descParts = [];
    if (juiceCupsCount > 0) descParts.push(`${juiceCupsCount} Juice${juiceCupsCount > 1 ? 's' : ''}`);
    if (item) descParts.push(`${count > 1 ? count + 'x ' : ''}${item.name}`);
    if (descParts.length > 0) setDescription(descParts.join(' + '));
  };

  // Day & Night Shift metrics
  const dayItems = pendingPayments.filter(p => p.shiftType === 'day');
  const dayUnpaid = dayItems.filter(p => !p.isPaid);
  const dayUnpaidTotal = dayUnpaid.reduce((sum, p) => sum + p.amount, 0);
  const dayCups = dayUnpaid.reduce((sum, p) => sum + (p.juiceCupsCount || 0), 0);
  const dayBoxes = dayUnpaid.reduce((sum, p) => sum + (p.foodTakeawaysCount || 0), 0);

  const nightItems = pendingPayments.filter(p => p.shiftType === 'night');
  const nightUnpaid = nightItems.filter(p => !p.isPaid);
  const nightUnpaidTotal = nightUnpaid.reduce((sum, p) => sum + p.amount, 0);
  const nightCups = nightUnpaid.reduce((sum, p) => sum + (p.juiceCupsCount || 0), 0);
  const nightBoxes = nightUnpaid.reduce((sum, p) => sum + (p.foodTakeawaysCount || 0), 0);

  const totalOutstanding = dayUnpaidTotal + nightUnpaidTotal;

  // Filter function for items
  const filterShiftItems = (items: PendingPaymentItem[]) => {
    return items.filter((item) => {
      if (filterStatus === 'unpaid' && item.isPaid) return false;
      if (filterStatus === 'paid' && !item.isPaid) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = item.customerName?.toLowerCase().includes(term);
        const matchDesc = item.description.toLowerCase().includes(term);
        if (!matchName && !matchDesc) return false;
      }
      return true;
    });
  };

  const filteredDayItems = filterShiftItems(dayItems);
  const filteredNightItems = filterShiftItems(nightItems);

  const handleSubmitNewPending = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) return;

    onAddPendingPayment({
      shiftType,
      customerName: customerName.trim() || 'Regular Customer Credit',
      description: description.trim() || 'Unpaid Drinks/Food',
      juiceCupsCount,
      foodTakeawaysCount,
      amount: numericAmount,
      date: new Date().toISOString().split('T')[0],
    });

    setCustomerName('');
    setDescription('');
    setJuiceCupsCount(1);
    setFoodTakeawaysCount(0);
    setAmount((1 * defaultJuicePrice).toString());
    setIsFormOpen(false);
  };

  const inputClasses = "w-full px-4 py-2.5 rounded-full border border-[#0B1D2C]/30 bg-white text-[#0B1D2C] text-sm font-bold focus:outline-none focus:border-[#0B1D2C] focus:ring-4 focus:ring-[#0B1D2C]/20 transition-all placeholder:text-[#0B1D2C]/40 shadow-xs";

  // Render individual item card
  const renderItemCard = (item: PendingPaymentItem) => {
    const isExpanded = expandedItemId === item.id;
    return (
      <motion.div 
        key={item.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-2 border-[#0B1D2C]/20 rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all text-[#0B1D2C]"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="p-3.5 rounded-full bg-[#f7f5f0] text-[#0B1D2C] border border-[#0B1D2C]/30 shrink-0 shadow-xs">
              <User className="w-6 h-6 text-[#0B1D2C]" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center flex-wrap gap-2">
                <h4 className="text-lg font-black text-[#0B1D2C]">
                  {item.customerName || 'Customer Credit'}
                </h4>
                
                <span className={`px-3 py-0.5 rounded-full text-xs font-extrabold flex items-center space-x-1 border ${
                  item.shiftType === 'day' 
                    ? 'bg-amber-50 text-amber-900 border-amber-300' 
                    : 'bg-indigo-50 text-indigo-900 border-indigo-300'
                }`}>
                  {item.shiftType === 'day' ? <Sun className="w-3.5 h-3.5 mr-0.5 text-amber-700" /> : <Moon className="w-3.5 h-3.5 mr-0.5 text-indigo-700" />}
                  <span>{item.shiftType === 'day' ? '☀️ DAY SHIFT' : '🌙 NIGHT SHIFT'}</span>
                </span>

                {item.isPaid ? (
                  <span className="bg-[#0B1D2C] text-white px-3 py-0.5 rounded-full text-xs font-black shadow-xs">
                    ✓ PAID & SETTLED
                  </span>
                ) : (
                  <span className="bg-rose-50 text-rose-700 border border-rose-200 px-3 py-0.5 rounded-full text-xs font-black shadow-xs">
                    UNPAID
                  </span>
                )}
              </div>

              {/* Quantities Badges */}
              <div className="flex items-center space-x-2 text-xs font-extrabold pt-0.5 flex-wrap gap-y-1">
                {item.juiceCupsCount > 0 && (
                  <span className="bg-[#f7f5f0] text-[#0B1D2C] font-extrabold px-3 py-1 rounded-full border border-[#0B1D2C]/30 flex items-center space-x-1 shadow-xs">
                    <CupSoda className="w-3.5 h-3.5 text-[#0B1D2C]" />
                    <span>{item.juiceCupsCount} Juice Cups</span>
                  </span>
                )}
                {item.foodTakeawaysCount > 0 && (
                  <span className="bg-[#f7f5f0] text-[#0B1D2C] font-extrabold px-3 py-1 rounded-full border border-[#0B1D2C]/30 flex items-center space-x-1 shadow-xs">
                    <Utensils className="w-3.5 h-3.5 text-[#0B1D2C]" />
                    <span>{item.foodTakeawaysCount} Food Boxes</span>
                  </span>
                )}
                {item.juiceCupsCount === 0 && item.foodTakeawaysCount === 0 && (
                  <span className="text-[#0B1D2C]/80 font-bold">{item.description}</span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-[#0B1D2C]/80 pt-0.5">
                <span>📅 Date: {item.date}</span>
                {item.isPaid && item.paidDate && (
                  <span className="text-emerald-800 font-extrabold">• Cash Settled on {item.paidDate}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 self-end sm:self-center">
            <div className="bg-[#0B1D2C] text-white px-4 py-2.5 rounded-2xl shadow-sm text-right min-w-[130px]">
              <span className="text-white/80 text-[10px] font-extrabold uppercase tracking-wider block mb-0.5">
                Credit Amount
              </span>
              <span className="text-xl sm:text-2xl font-black text-white block">
                {formatCurrency(item.amount, currencySymbol)}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {/* Expand Details */}
              <button
                onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                className="px-3 py-2 bg-[#f7f5f0] border border-[#0B1D2C]/30 text-[#0B1D2C] hover:bg-[#0B1D2C] hover:text-white font-extrabold text-xs rounded-full transition-all flex items-center space-x-1 cursor-pointer shadow-xs"
                title="Click to view item details"
              >
                <span>{isExpanded ? 'Hide' : 'Details'}</span>
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {!item.isPaid ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setPartialItem(item);
                      setPartialCupsPaid(0);
                      setPartialBoxesPaid(0);
                      setPartialAmountPaid('');
                    }}
                    className="px-3.5 py-2 bg-[#f7f5f0] border border-[#0B1D2C]/30 text-[#0B1D2C] hover:bg-[#0B1D2C] hover:text-white font-extrabold text-xs rounded-full transition-all flex items-center space-x-1 cursor-pointer shadow-xs"
                    title="Pay Partial / Deduct Cups"
                  >
                    <span>Deduct</span>
                  </button>
                  <button
                    onClick={() => onSettlePendingPayment(item.id)}
                    className="px-4 py-2 bg-[#0B1D2C] hover:bg-[#081521] text-white font-black text-xs rounded-full shadow-md transition-all flex items-center space-x-1 cursor-pointer active:scale-95"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    <span>Full Pay</span>
                  </button>
                </div>
              ) : (
                <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-300 px-3 py-1 rounded-full flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Settled</span>
                </span>
              )}

              <button
                onClick={() => setEditingItem(JSON.parse(JSON.stringify(item)))}
                className="p-2 text-[#0B1D2C] hover:bg-[#f7f5f0] border border-[#0B1D2C]/20 rounded-full transition-all cursor-pointer shadow-xs"
                title="Edit"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onDeletePendingPayment(item.id)}
                className="p-2 text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-full transition-all cursor-pointer shadow-xs"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Itemized Dish Details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mt-4 pt-3 border-t border-[#0B1D2C]/20"
            >
              <div className="bg-[#f7f5f0] p-4 rounded-2xl border border-[#0B1D2C]/20 space-y-2">
                <div className="text-xs font-black text-[#0B1D2C] uppercase tracking-wider flex items-center space-x-1">
                  <Utensils className="w-4 h-4 text-[#0B1D2C]" />
                  <span>Itemized Dish & Drink Breakdown:</span>
                </div>

                {item.itemizedBreakdown && Object.keys(item.itemizedBreakdown).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {Object.entries(item.itemizedBreakdown).map(([dishName, count]) => (
                      <div key={dishName} className="flex items-center justify-between text-xs font-extrabold bg-white px-3.5 py-2 rounded-xl border border-[#0B1D2C]/20 shadow-xs">
                        <span className="text-[#0B1D2C]">{dishName}</span>
                        <span className="font-black text-white bg-[#0B1D2C] px-2.5 py-0.5 rounded-full text-xs">
                          x{count}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs font-bold text-[#0B1D2C] bg-white p-3 rounded-xl border border-[#0B1D2C]/20">
                    <span className="font-black text-[#0B1D2C]">Description:</span> {item.description}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6 font-sans text-[#0B1D2C]">
      
      {/* ─── HERO HEADER CARD (#0B1D2C Styling) ──────────────────────────────── */}
      <div className="bg-[#0B1D2C] border border-[#0B1D2C]/40 rounded-3xl shadow-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 text-white">
        <div className="flex items-center space-x-3.5">
          <div className="p-3.5 rounded-full bg-[#162E44] text-white font-bold border border-white/30">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Customer Pending Payments
            </h2>
            <p className="text-sm font-bold text-white/90 mt-0.5">
              Grouped by Shift (☀️ Day & 🌙 Night)
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end flex-wrap gap-2">
          <div className="flex flex-col items-start sm:items-end">
            <span className="text-[10px] font-black uppercase tracking-wider text-white/80">
              Total Outstanding
            </span>
            <span className="text-2xl sm:text-3xl font-black text-white">
              {formatCurrency(totalOutstanding, currencySymbol)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {pendingPayments.length > 0 && onClearAllPendingPayments && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-full shadow-md transition-all flex items-center space-x-1.5 cursor-pointer text-xs active:scale-95"
                title="Clear all pending records"
              >
                <Trash2 className="w-4 h-4 text-white" />
                <span>Clear All</span>
              </button>
            )}

            <button
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="px-5 py-2.5 bg-white text-[#0B1D2C] hover:bg-[#f7f5f0] font-black rounded-full shadow-md transition-all flex items-center space-x-2 shrink-0 cursor-pointer text-sm active:scale-95"
            >
              <Plus className="w-5 h-5 text-[#0B1D2C]" />
              <span>Add Record</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── TWO SHIFT SUMMARY OVERVIEW CARDS (DAY VS NIGHT) ────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* DAY SHIFT OVERVIEW CARD */}
        <div 
          onClick={() => setActiveShiftTab('day')}
          className={`bg-white border-2 rounded-3xl p-5 shadow-sm flex items-center justify-between transition-all cursor-pointer hover:border-[#0B1D2C] ${
            activeShiftTab === 'day' ? 'border-[#0B1D2C] ring-4 ring-[#0B1D2C]/10' : 'border-[#0B1D2C]/20'
          }`}
        >
          <div className="flex items-center space-x-3.5">
            <div className="p-3.5 bg-amber-50 text-amber-800 rounded-full border border-amber-200">
              <Sun className="w-6 h-6 text-amber-700" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-black uppercase tracking-wider text-[#0B1D2C]">☀️ Day Shift Pending</span>
                <span className="bg-[#0B1D2C] text-white font-black text-xs px-2.5 py-0.5 rounded-full">{dayUnpaid.length} Unpaid</span>
              </div>
              <div className="text-xs font-bold text-[#0B1D2C]/80 mt-1 flex items-center space-x-2">
                <span>🥤 {dayCups} Cups</span>
                <span>•</span>
                <span>📦 {dayBoxes} Food Boxes</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-black text-[#0B1D2C]/70 block">Unpaid Total</span>
            <span className="text-xl font-black text-[#0B1D2C]">{formatCurrency(dayUnpaidTotal, currencySymbol)}</span>
          </div>
        </div>

        {/* NIGHT SHIFT OVERVIEW CARD */}
        <div 
          onClick={() => setActiveShiftTab('night')}
          className={`bg-white border-2 rounded-3xl p-5 shadow-sm flex items-center justify-between transition-all cursor-pointer hover:border-[#0B1D2C] ${
            activeShiftTab === 'night' ? 'border-[#0B1D2C] ring-4 ring-[#0B1D2C]/10' : 'border-[#0B1D2C]/20'
          }`}
        >
          <div className="flex items-center space-x-3.5">
            <div className="p-3.5 bg-indigo-50 text-indigo-800 rounded-full border border-indigo-200">
              <Moon className="w-6 h-6 text-indigo-700" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-black uppercase tracking-wider text-[#0B1D2C]">🌙 Night Shift Pending</span>
                <span className="bg-[#0B1D2C] text-white font-black text-xs px-2.5 py-0.5 rounded-full">{nightUnpaid.length} Unpaid</span>
              </div>
              <div className="text-xs font-bold text-[#0B1D2C]/80 mt-1 flex items-center space-x-2">
                <span>🥤 {nightCups} Cups</span>
                <span>•</span>
                <span>📦 {nightBoxes} Food Boxes</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-black text-[#0B1D2C]/70 block">Unpaid Total</span>
            <span className="text-xl font-black text-[#0B1D2C]">{formatCurrency(nightUnpaidTotal, currencySymbol)}</span>
          </div>
        </div>
      </div>

      {/* ─── ADD NEW PENDING PAYMENT ACCORDION FORM ─────────────────────────── */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmitNewPending}
            className="overflow-hidden bg-white border-2 border-[#0B1D2C] rounded-3xl p-6 shadow-xl space-y-4 text-[#0B1D2C]"
          >
            <div className="flex items-center justify-between border-b border-[#0B1D2C]/20 pb-3">
              <div className="flex items-center space-x-2">
                <Plus className="w-5 h-5 text-[#0B1D2C]" />
                <h3 className="text-lg font-black text-[#0B1D2C]">Record New Customer Credit</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 text-[#0B1D2C]/70 hover:text-[#0B1D2C] hover:bg-[#f7f5f0] rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-[#0B1D2C] uppercase tracking-wide mb-1">
                  Select Shift Group
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setShiftType('day')}
                    className={`py-2.5 px-3 rounded-full text-xs font-black flex items-center justify-center gap-1.5 border-2 transition-all cursor-pointer ${
                      shiftType === 'day' 
                        ? 'bg-[#0B1D2C] text-white border-[#0B1D2C] shadow-sm' 
                        : 'bg-[#f7f5f0] text-[#0B1D2C] border-[#0B1D2C]/20'
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                    <span>☀️ Day Shift</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShiftType('night')}
                    className={`py-2.5 px-3 rounded-full text-xs font-black flex items-center justify-center gap-1.5 border-2 transition-all cursor-pointer ${
                      shiftType === 'night' 
                        ? 'bg-[#0B1D2C] text-white border-[#0B1D2C] shadow-sm' 
                        : 'bg-[#f7f5f0] text-[#0B1D2C] border-[#0B1D2C]/20'
                    }`}
                  >
                    <Moon className="w-4 h-4" />
                    <span>🌙 Night Shift</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#0B1D2C] uppercase tracking-wide mb-1">
                  Customer Name / Identifier
                </label>
                <input
                  type="text"
                  placeholder="e.g. Abebe, Regular Customer, Office Staff"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className={inputClasses}
                  required
                />
              </div>
            </div>

            {/* Quick Dish Selection */}
            {config?.foodMenu && config.foodMenu.length > 0 && (
              <div>
                <label className="block text-xs font-extrabold text-[#0B1D2C] uppercase tracking-wide mb-1.5">
                  Select Food Dish (Optional):
                </label>
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {config.foodMenu.filter(f => f.available !== false).map((menuItem) => (
                    <button
                      key={menuItem.id}
                      type="button"
                      onClick={() => handleSelectFoodItem(menuItem.id)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap border transition-all cursor-pointer shrink-0 ${
                        selectedFoodItemId === menuItem.id
                          ? 'bg-[#0B1D2C] text-white border-[#0B1D2C] shadow-xs'
                          : 'bg-[#f7f5f0] text-[#0B1D2C] border-[#0B1D2C]/20 hover:bg-[#0B1D2C]/10'
                      }`}
                    >
                      <span>{menuItem.name} ({menuItem.price} Br)</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-[#0B1D2C] uppercase tracking-wide mb-1">
                  Juice Cups Count
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleJuiceCupsChange(juiceCupsCount - 1)}
                    className="w-10 h-10 rounded-full bg-[#f7f5f0] border-2 border-[#0B1D2C]/30 text-[#0B1D2C] font-black hover:bg-[#0B1D2C] hover:text-white cursor-pointer transition-colors"
                  >−</button>
                  <input
                    type="number"
                    min="0"
                    value={juiceCupsCount}
                    onFocus={handleInputFocus}
                    onChange={(e) => handleJuiceCupsChange(cleanNumberInput(e))}
                    className="w-full text-center font-black text-base py-2 bg-white border border-[#0B1D2C]/30 rounded-full text-[#0B1D2C]"
                  />
                  <button
                    type="button"
                    onClick={() => handleJuiceCupsChange(juiceCupsCount + 1)}
                    className="w-10 h-10 rounded-full bg-[#f7f5f0] border-2 border-[#0B1D2C]/30 text-[#0B1D2C] font-black hover:bg-[#0B1D2C] hover:text-white cursor-pointer transition-colors"
                  >+</button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#0B1D2C] uppercase tracking-wide mb-1">
                  Food Takeaways Count
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleFoodBoxesChange(foodTakeawaysCount - 1)}
                    className="w-10 h-10 rounded-full bg-[#f7f5f0] border-2 border-[#0B1D2C]/30 text-[#0B1D2C] font-black hover:bg-[#0B1D2C] hover:text-white cursor-pointer transition-colors"
                  >−</button>
                  <input
                    type="number"
                    min="0"
                    value={foodTakeawaysCount}
                    onFocus={handleInputFocus}
                    onChange={(e) => handleFoodBoxesChange(cleanNumberInput(e))}
                    className="w-full text-center font-black text-base py-2 bg-white border border-[#0B1D2C]/30 rounded-full text-[#0B1D2C]"
                  />
                  <button
                    type="button"
                    onClick={() => handleFoodBoxesChange(foodTakeawaysCount + 1)}
                    className="w-10 h-10 rounded-full bg-[#f7f5f0] border-2 border-[#0B1D2C]/30 text-[#0B1D2C] font-black hover:bg-[#0B1D2C] hover:text-white cursor-pointer transition-colors"
                  >+</button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#0B1D2C] uppercase tracking-wide mb-1">
                  Total Debt Amount (ETB)
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onFocus={handleInputFocus}
                  onChange={(e) => setAmount(cleanStringNumberInput(e))}
                  className={inputClasses}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#0B1D2C] uppercase tracking-wide mb-1">
                Description / Notes
              </label>
              <input
                type="text"
                placeholder="e.g. 2 Avocado Juices + 1 Pasta"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={inputClasses}
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#0B1D2C]/20">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-5 py-2.5 bg-white border-2 border-[#0B1D2C] text-[#0B1D2C] font-extrabold text-xs rounded-full hover:bg-slate-100 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#0B1D2C] hover:bg-[#081521] text-white font-black text-xs rounded-full shadow-md cursor-pointer flex items-center space-x-1.5 transition-all active:scale-95"
              >
                <Save className="w-4 h-4 text-white" />
                <span>Save Pending Credit</span>
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* ─── CONTROLS BAR: SEARCH & SHIFT GROUP SELECTOR ───────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-3xl border border-[#0B1D2C]/20 shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search customer name or item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#f7f5f0] border border-[#0B1D2C]/20 rounded-full text-xs font-extrabold focus:outline-none focus:border-[#0B1D2C] text-[#0B1D2C] placeholder:text-[#0B1D2C]/50"
          />
          <Search className="w-4 h-4 text-[#0B1D2C]/70 absolute left-3.5 top-2.5" />
        </div>

        {/* Group Selector: Both / Day / Night */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <div className="flex bg-[#f7f5f0] p-1 rounded-full border border-[#0B1D2C]/20 text-xs font-bold">
            <button
              onClick={() => setActiveShiftTab('both')}
              className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer font-black flex items-center gap-1 ${
                activeShiftTab === 'both' ? 'bg-[#0B1D2C] text-white shadow-xs' : 'text-neutral-600 hover:text-[#0B1D2C]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Both Shifts</span>
            </button>
            <button
              onClick={() => setActiveShiftTab('day')}
              className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer font-black flex items-center gap-1 ${
                activeShiftTab === 'day' ? 'bg-[#0B1D2C] text-white shadow-xs' : 'text-neutral-600 hover:text-[#0B1D2C]'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>☀️ Day Shift ({dayUnpaid.length})</span>
            </button>
            <button
              onClick={() => setActiveShiftTab('night')}
              className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer font-black flex items-center gap-1 ${
                activeShiftTab === 'night' ? 'bg-[#0B1D2C] text-white shadow-xs' : 'text-neutral-600 hover:text-[#0B1D2C]'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>🌙 Night Shift ({nightUnpaid.length})</span>
            </button>
          </div>

          {/* Status Filter: Unpaid / Paid / All */}
          <div className="flex bg-[#f7f5f0] p-1 rounded-full border border-[#0B1D2C]/20 text-xs font-bold">
            <button
              onClick={() => setFilterStatus('unpaid')}
              className={`px-3 py-1.5 rounded-full transition-colors cursor-pointer font-black ${
                filterStatus === 'unpaid' ? 'bg-[#0B1D2C] text-white shadow-xs' : 'text-neutral-600 hover:text-[#0B1D2C]'
              }`}
            >
              Unpaid
            </button>
            <button
              onClick={() => setFilterStatus('paid')}
              className={`px-3 py-1.5 rounded-full transition-colors cursor-pointer font-black ${
                filterStatus === 'paid' ? 'bg-[#0B1D2C] text-white shadow-xs' : 'text-neutral-600 hover:text-[#0B1D2C]'
              }`}
            >
              Paid
            </button>
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-full transition-colors cursor-pointer font-black ${
                filterStatus === 'all' ? 'bg-[#0B1D2C] text-white shadow-xs' : 'text-neutral-600 hover:text-[#0B1D2C]'
              }`}
            >
              All
            </button>
          </div>
        </div>
      </div>

      {/* ─── TWO SHIFT GROUPS (DAY & NIGHT) ────────────────────────────────── */}
      <div className="space-y-8">
        
        {/* 1. DAY SHIFT GROUP */}
        {(activeShiftTab === 'both' || activeShiftTab === 'day') && (
          <div className="space-y-4">
            {/* Shift Group Header */}
            <div className="flex items-center justify-between bg-amber-50/80 border-2 border-amber-200/80 px-5 py-3.5 rounded-2xl">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-100 text-amber-900 rounded-full">
                  <Sun className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-black text-base text-amber-950 flex items-center gap-2">
                    <span>☀️ Day Shift Pending</span>
                    <span className="text-xs bg-amber-200/80 text-amber-900 px-2.5 py-0.5 rounded-full font-black">
                      {filteredDayItems.length} Record{filteredDayItems.length !== 1 ? 's' : ''}
                    </span>
                  </h3>
                  <p className="text-xs font-bold text-amber-800/80">
                    Day worker pending customer balances
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800/80 block">
                  Day Total Unpaid
                </span>
                <span className="text-lg sm:text-xl font-black text-amber-950">
                  {formatCurrency(dayUnpaidTotal, currencySymbol)}
                </span>
              </div>
            </div>

            {/* Day Items List */}
            {filteredDayItems.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-[#0B1D2C]/20 shadow-xs">
                <Sun className="w-10 h-10 text-amber-600/40 mx-auto mb-2" />
                <h4 className="text-sm font-black text-[#0B1D2C]">No Day Shift pending payments</h4>
                <p className="text-xs font-medium text-neutral-500 mt-0.5">All Day Shift customer orders are settled!</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredDayItems.map(renderItemCard)}
              </div>
            )}
          </div>
        )}

        {/* 2. NIGHT SHIFT GROUP */}
        {(activeShiftTab === 'both' || activeShiftTab === 'night') && (
          <div className="space-y-4">
            {/* Shift Group Header */}
            <div className="flex items-center justify-between bg-indigo-50/80 border-2 border-indigo-200/80 px-5 py-3.5 rounded-2xl">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-100 text-indigo-900 rounded-full">
                  <Moon className="w-5 h-5 text-indigo-700" />
                </div>
                <div>
                  <h3 className="font-black text-base text-indigo-950 flex items-center gap-2">
                    <span>🌙 Night Shift Pending</span>
                    <span className="text-xs bg-indigo-200/80 text-indigo-900 px-2.5 py-0.5 rounded-full font-black">
                      {filteredNightItems.length} Record{filteredNightItems.length !== 1 ? 's' : ''}
                    </span>
                  </h3>
                  <p className="text-xs font-bold text-indigo-800/80">
                    Night worker pending customer balances
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-800/80 block">
                  Night Total Unpaid
                </span>
                <span className="text-lg sm:text-xl font-black text-indigo-950">
                  {formatCurrency(nightUnpaidTotal, currencySymbol)}
                </span>
              </div>
            </div>

            {/* Night Items List */}
            {filteredNightItems.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-[#0B1D2C]/20 shadow-xs">
                <Moon className="w-10 h-10 text-indigo-600/40 mx-auto mb-2" />
                <h4 className="text-sm font-black text-[#0B1D2C]">No Night Shift pending payments</h4>
                <p className="text-xs font-medium text-neutral-500 mt-0.5">All Night Shift customer orders are settled!</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredNightItems.map(renderItemCard)}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ─── CLEAR ALL CONFIRMATION MODAL ──────────────────────────────────── */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0B1D2C]/80 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border-2 border-rose-300 space-y-4 text-[#0B1D2C]"
            >
              <div className="flex items-center space-x-3 text-rose-700">
                <div className="p-3 bg-rose-100 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-rose-700" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#0B1D2C]">Clear All Pending Payments?</h3>
                  <p className="text-xs font-bold text-neutral-500">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-xs font-bold text-[#0B1D2C]/80 leading-relaxed bg-[#f7f5f0] p-4 rounded-2xl border border-[#0B1D2C]/20">
                All customer pending payment records ({pendingPayments.length} items) across both Day & Night shifts will be permanently removed from the ledger.
              </p>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="px-5 py-2.5 bg-[#f7f5f0] text-[#0B1D2C] font-extrabold text-xs rounded-full hover:bg-stone-200 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onClearAllPendingPayments) {
                      onClearAllPendingPayments();
                    }
                    setShowClearConfirm(false);
                  }}
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-full shadow-md cursor-pointer transition-all active:scale-95 flex items-center space-x-1.5"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                  <span>Yes, Clear Everything</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── EDIT MODAL ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {editingItem && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0B1D2C]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border-2 border-[#0B1D2C] space-y-4 text-[#0B1D2C]"
            >
              <div className="flex items-center justify-between border-b border-[#0B1D2C]/20 pb-4">
                <h3 className="text-lg font-black text-[#0B1D2C] flex items-center space-x-2">
                  <Pencil className="w-5 h-5 text-[#0B1D2C]" />
                  <span>Edit Pending Credit Record</span>
                </h3>
                <button
                  onClick={() => setEditingItem(null)}
                  className="p-2 text-[#0B1D2C]/70 hover:text-[#0B1D2C] hover:bg-[#f7f5f0] rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (onUpdatePendingPayment && editingItem) {
                    onUpdatePendingPayment(editingItem);
                  }
                  setEditingItem(null);
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-[#0B1D2C] uppercase tracking-wide mb-1">Date</label>
                    <input
                      type="date"
                      required
                      value={editingItem.date}
                      onChange={(e) => setEditingItem({ ...editingItem, date: e.target.value })}
                      className={inputClasses}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-[#0B1D2C] uppercase tracking-wide mb-1">Shift Group</label>
                    <select
                      value={editingItem.shiftType}
                      onChange={(e) => setEditingItem({ ...editingItem, shiftType: e.target.value as ShiftType })}
                      className={inputClasses}
                    >
                      <option value="day">☀️ Day Shift</option>
                      <option value="night">🌙 Night Shift</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#0B1D2C] uppercase tracking-wide mb-1">Customer Name</label>
                  <input
                    type="text"
                    required
                    value={editingItem.customerName || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, customerName: e.target.value })}
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#0B1D2C] uppercase tracking-wide mb-1">Description</label>
                  <input
                    type="text"
                    value={editingItem.description}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    className={inputClasses}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-[#0B1D2C] uppercase tracking-wide mb-1">Juice Cups</label>
                    <input
                      type="number"
                      min="0"
                      value={editingItem.juiceCupsCount}
                      onFocus={handleInputFocus}
                      onChange={(e) => {
                        const cups = cleanNumberInput(e);
                        const calculated = (cups * defaultJuicePrice) + (editingItem.foodTakeawaysCount * defaultFoodPrice);
                        setEditingItem({
                          ...editingItem,
                          juiceCupsCount: cups,
                          amount: calculated > 0 ? calculated : editingItem.amount,
                        });
                      }}
                      className={inputClasses}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-[#0B1D2C] uppercase tracking-wide mb-1">Takeaways</label>
                    <input
                      type="number"
                      min="0"
                      value={editingItem.foodTakeawaysCount}
                      onFocus={handleInputFocus}
                      onChange={(e) => {
                        const boxes = cleanNumberInput(e);
                        const calculated = (editingItem.juiceCupsCount * defaultJuicePrice) + (boxes * defaultFoodPrice);
                        setEditingItem({
                          ...editingItem,
                          foodTakeawaysCount: boxes,
                          amount: calculated > 0 ? calculated : editingItem.amount,
                        });
                      }}
                      className={inputClasses}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-[#0B1D2C] uppercase tracking-wide mb-1">Amount</label>
                    <input
                      type="number"
                      min="0"
                      value={editingItem.amount}
                      onFocus={handleInputFocus}
                      onChange={(e) => setEditingItem({ ...editingItem, amount: cleanNumberInput(e) })}
                      className={inputClasses}
                    />
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end space-x-3 border-t border-[#0B1D2C]/20">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-5 py-2.5 bg-[#f7f5f0] text-[#0B1D2C] font-extrabold text-xs rounded-full hover:bg-stone-200 transition-colors border border-[#0B1D2C]/20 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#0B1D2C] hover:bg-[#081521] text-white font-extrabold text-xs rounded-full shadow-md cursor-pointer flex items-center space-x-1.5 transition-all active:scale-95"
                  >
                    <Save className="w-4 h-4 text-white" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── PARTIAL PAYMENT DEDUCTION MODAL ──────────────────────────────── */}
      <AnimatePresence>
        {partialItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0B1D2C]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border-2 border-[#0B1D2C] space-y-5 text-[#0B1D2C]"
            >
              <div className="flex items-center justify-between border-b border-[#0B1D2C]/20 pb-3">
                <div>
                  <h3 className="text-lg font-black text-[#0B1D2C]">Deduct Paid Debt</h3>
                  <p className="text-xs font-bold text-[#0B1D2C]/80">{partialItem.customerName || 'Customer'}</p>
                </div>
                <button
                  onClick={() => setPartialItem(null)}
                  className="p-1.5 text-[#0B1D2C]/70 hover:text-[#0B1D2C] hover:bg-[#f7f5f0] rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Current Debt Card */}
              <div className="bg-[#f7f5f0] p-4 rounded-2xl border border-[#0B1D2C]/20 text-xs space-y-1">
                <div className="flex justify-between font-extrabold text-[#0B1D2C]">
                  <span>Current Balance:</span>
                  <span className="font-black text-sm text-[#0B1D2C]">{formatCurrency(partialItem.amount, currencySymbol)}</span>
                </div>
                <div className="text-[#0B1D2C]/80 font-bold">
                  {partialItem.juiceCupsCount > 0 && <span>🥤 {partialItem.juiceCupsCount} Juice Cups </span>}
                  {partialItem.foodTakeawaysCount > 0 && <span>📦 {partialItem.foodTakeawaysCount} Food Boxes</span>}
                </div>
              </div>

              {/* Input Controls */}
              <div className="space-y-3">
                {partialItem.juiceCupsCount > 0 && (
                  <div className="flex items-center justify-between bg-[#f7f5f0] p-3 rounded-2xl border border-[#0B1D2C]/20">
                    <span className="text-xs font-extrabold text-[#0B1D2C]">Juice Cups Paid Today:</span>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setPartialCupsPaid(Math.max(0, partialCupsPaid - 1))}
                        className="w-7 h-7 rounded-full bg-[#0B1D2C] text-white font-extrabold flex items-center justify-center hover:bg-[#081521] cursor-pointer"
                      >−</button>
                      <input
                        type="number"
                        min="0"
                        max={partialItem.juiceCupsCount}
                        value={partialCupsPaid || ''}
                        placeholder="0"
                        onFocus={handleInputFocus}
                        onChange={(e) => setPartialCupsPaid(Math.min(partialItem.juiceCupsCount, cleanNumberInput(e)))}
                        className="w-12 h-7 text-center font-black text-sm bg-white text-[#0B1D2C] border border-[#0B1D2C]/30 rounded-md focus:outline-none focus:border-[#0B1D2C]"
                      />
                      <button
                        type="button"
                        onClick={() => setPartialCupsPaid(Math.min(partialItem.juiceCupsCount, partialCupsPaid + 1))}
                        className="w-7 h-7 rounded-full bg-[#0B1D2C] text-white font-extrabold flex items-center justify-center hover:bg-[#081521] cursor-pointer"
                      >+</button>
                    </div>
                  </div>
                )}

                {partialItem.foodTakeawaysCount > 0 && (
                  <div className="flex items-center justify-between bg-[#f7f5f0] p-3 rounded-2xl border border-[#0B1D2C]/20">
                    <span className="text-xs font-extrabold text-[#0B1D2C]">Food Boxes Paid Today:</span>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setPartialBoxesPaid(Math.max(0, partialBoxesPaid - 1))}
                        className="w-7 h-7 rounded-full bg-[#0B1D2C] text-white font-extrabold flex items-center justify-center hover:bg-[#081521] cursor-pointer"
                      >−</button>
                      <input
                        type="number"
                        min="0"
                        max={partialItem.foodTakeawaysCount}
                        value={partialBoxesPaid || ''}
                        placeholder="0"
                        onFocus={handleInputFocus}
                        onChange={(e) => setPartialBoxesPaid(Math.min(partialItem.foodTakeawaysCount, cleanNumberInput(e)))}
                        className="w-12 h-7 text-center font-black text-sm bg-white text-[#0B1D2C] border border-[#0B1D2C]/30 rounded-md focus:outline-none focus:border-[#0B1D2C]"
                      />
                      <button
                        type="button"
                        onClick={() => setPartialBoxesPaid(Math.min(partialItem.foodTakeawaysCount, partialBoxesPaid + 1))}
                        className="w-7 h-7 rounded-full bg-[#0B1D2C] text-white font-extrabold flex items-center justify-center hover:bg-[#081521] cursor-pointer"
                      >+</button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-extrabold text-[#0B1D2C] mb-1">Custom Amount Paid (Br) — optional:</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Enter custom ETB amount..."
                    value={partialAmountPaid}
                    onFocus={handleInputFocus}
                    onChange={(e) => setPartialAmountPaid(cleanStringNumberInput(e))}
                    className={inputClasses}
                  />
                </div>
              </div>

              {/* Dynamic Calculation Preview */}
              {(() => {
                const customVal = parseFloat(partialAmountPaid) || 0;
                const calcVal = (partialCupsPaid * defaultJuicePrice) + (partialBoxesPaid * defaultFoodPrice);
                const totalPaidToday = customVal > 0 ? customVal : calcVal;
                const remainingCups = Math.max(0, partialItem.juiceCupsCount - partialCupsPaid);
                const remainingBoxes = Math.max(0, partialItem.foodTakeawaysCount - partialBoxesPaid);
                const remainingAmount = Math.max(0, partialItem.amount - totalPaidToday);

                return (
                  <div className="bg-[#f7f5f0] border border-[#0B1D2C]/20 p-3.5 rounded-2xl space-y-1 text-xs text-[#0B1D2C] font-bold">
                    <div className="flex justify-between">
                      <span className="text-[#0B1D2C]/80">Deducting Today:</span>
                      <span className="font-black text-[#0B1D2C]">{formatCurrency(totalPaidToday, currencySymbol)}</span>
                    </div>
                    <div className="flex justify-between text-[#0B1D2C]/80 font-bold">
                      <span>New Remaining Balance:</span>
                      <span className="font-extrabold text-[#0B1D2C]">
                        {remainingCups} Cups / {remainingBoxes} Boxes ({formatCurrency(remainingAmount, currencySymbol)})
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div className="pt-2 flex items-center justify-end space-x-3 border-t border-[#0B1D2C]/20">
                <button
                  type="button"
                  onClick={() => setPartialItem(null)}
                  className="px-5 py-2.5 bg-[#f7f5f0] border border-[#0B1D2C]/20 text-[#0B1D2C] font-extrabold text-xs rounded-full hover:bg-stone-200 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!partialItem) return;
                    const customVal = parseFloat(partialAmountPaid) || 0;
                    const calcVal = (partialCupsPaid * defaultJuicePrice) + (partialBoxesPaid * defaultFoodPrice);
                    const totalPaidToday = customVal > 0 ? customVal : calcVal;

                    if (totalPaidToday <= 0) {
                      alert('Please enter the number of paid cups/boxes or amount.');
                      return;
                    }

                    if (onPartialSettlePendingPayment) {
                      onPartialSettlePendingPayment(partialItem.id, totalPaidToday, partialCupsPaid, partialBoxesPaid);
                    } else if (onSettlePendingPayment && totalPaidToday >= partialItem.amount) {
                      onSettlePendingPayment(partialItem.id);
                    }

                    setPartialItem(null);
                  }}
                  className="px-6 py-2.5 bg-[#0B1D2C] hover:bg-[#081521] text-white font-extrabold text-xs rounded-full shadow-md cursor-pointer flex items-center space-x-1.5 transition-all active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Apply Deduction</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default PendingPaymentsView;
