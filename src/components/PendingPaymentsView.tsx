import React, { useState, useMemo } from 'react';
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
  CupSoda
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
  currencySymbol,
  config,
}) => {
  const defaultJuicePrice = config?.defaultJuiceUnitPrice || 170;
  const defaultFoodPrice = config?.defaultFoodUnitPrice || 220;

  const [filterShift, setFilterShift] = useState<'all' | 'day' | 'night'>('all');
  const [filterStatus, setFilterStatus] = useState<'unpaid' | 'paid' | 'all'>('unpaid');
  const [viewMode, setViewMode] = useState<'individual' | 'grouped'>('individual');
  const [searchTerm, setSearchTerm] = useState('');

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

  // Day & Night shift calculations
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const dayShiftUnpaid = pendingPayments.filter((p) => !p.isPaid && p.shiftType === 'day');
  const dayShiftTotalAmount = dayShiftUnpaid.reduce((sum, p) => sum + p.amount, 0);
  const dayShiftCups = dayShiftUnpaid.reduce((sum, p) => sum + (p.juiceCupsCount || 0), 0);
  const dayShiftBoxes = dayShiftUnpaid.reduce((sum, p) => sum + (p.foodTakeawaysCount || 0), 0);

  const nightShiftUnpaid = pendingPayments.filter((p) => !p.isPaid && p.shiftType === 'night');
  const nightShiftTotalAmount = nightShiftUnpaid.reduce((sum, p) => sum + p.amount, 0);
  const nightShiftCups = nightShiftUnpaid.reduce((sum, p) => sum + (p.juiceCupsCount || 0), 0);
  const nightShiftBoxes = nightShiftUnpaid.reduce((sum, p) => sum + (p.foodTakeawaysCount || 0), 0);

  const filteredItems = pendingPayments.filter((item) => {
    if (filterShift !== 'all' && item.shiftType !== filterShift) return false;
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

  const totalOutstanding = pendingPayments
    .filter((p) => !p.isPaid)
    .reduce((sum, p) => sum + p.amount, 0);

  const customerGroups = useMemo(() => {
    const groups: { [name: string]: { customerName: string; items: PendingPaymentItem[]; totalAmount: number; unpaidCount: number; paidCount: number; unpaidAmount: number } } = {};
    
    filteredItems.forEach(item => {
      const nameKey = (item.customerName || 'Unnamed Customer').trim().toLowerCase();
      if (!groups[nameKey]) {
        groups[nameKey] = {
          customerName: item.customerName || 'Unnamed Customer',
          items: [],
          totalAmount: 0,
          unpaidCount: 0,
          paidCount: 0,
          unpaidAmount: 0,
        };
      }
      groups[nameKey].items.push(item);
      groups[nameKey].totalAmount += item.amount;
      if (item.isPaid) {
        groups[nameKey].paidCount += 1;
      } else {
        groups[nameKey].unpaidCount += 1;
        groups[nameKey].unpaidAmount += item.amount;
      }
    });

    return Object.values(groups).sort((a, b) => b.unpaidAmount - a.unpaidAmount || b.totalAmount - a.totalAmount);
  }, [filteredItems]);

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
    setJuiceCupsCount(0);
    setFoodTakeawaysCount(0);
    setAmount('');
    setIsFormOpen(false);
  };

  const inputClasses = "w-full px-4 py-2.5 rounded-full border border-[#403c21]/30 bg-white text-[#403c21] text-sm font-bold focus:outline-none focus:border-[#403c21] focus:ring-4 focus:ring-[#c9b197]/40 transition-all placeholder:text-[#403c21]/50 shadow-xs";

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6 font-sans text-[#403c21]">
      
      {/* HEADER CARD (#403c21 Hero Styling with #c9b197 Accent) */}
      <div className="bg-[#403c21] border border-[#c9b197]/40 rounded-3xl shadow-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 text-white">
        <div className="flex items-center space-x-3.5">
          <div className="p-3.5 rounded-full bg-[#524d2c] text-[#c9b197] border border-[#c9b197]/40">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">
              Customer Pending Payments
            </h2>
            <p className="text-sm font-medium text-white/80 mt-0.5">
              Track customer unpaid credit ledgers by shift worker
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4 w-full sm:w-auto">
          <div className="flex flex-col items-end">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#c9b197]">
              Outstanding Unpaid
            </span>
            <span className="text-2xl font-extrabold text-[#c9b197]">
              {formatCurrency(totalOutstanding, currencySymbol)}
            </span>
          </div>
          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="px-5 py-2.5 bg-[#c9b197] hover:bg-[#bda387] text-[#403c21] font-extrabold rounded-full shadow-md transition-all flex items-center space-x-2 shrink-0 cursor-pointer text-sm active:scale-95"
          >
            <Plus className="w-5 h-5 text-[#403c21]" />
            <span>Add Record</span>
          </button>
        </div>
      </div>

      {/* SHIFT SUMMARY CARDS (DAY VS NIGHT) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* DAY SHIFT CARD */}
        <div className="bg-white border border-[#c9b197]/20 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-[#f7f5f0] text-[#403c21] rounded-full border border-[#c9b197]/20">
              <Sun className="w-5 h-5 text-[#c9b197]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#403c21]">Day Shift Pending</span>
                <span className="bg-[#c9b197] text-[#403c21] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">{dayShiftUnpaid.length} Unpaid</span>
              </div>
              <div className="text-xs font-bold text-neutral-600 mt-1 flex items-center space-x-2">
                <span>🥤 {dayShiftCups} Cups</span>
                <span>•</span>
                <span>📦 {dayShiftBoxes} Food Boxes</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-neutral-500 block">Pending Total</span>
            <span className="text-lg font-extrabold text-[#c9b197]">{formatCurrency(dayShiftTotalAmount, currencySymbol)}</span>
          </div>
        </div>

        {/* NIGHT SHIFT CARD */}
        <div className="bg-white border border-[#c9b197]/20 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-[#403c21] text-white rounded-full">
              <Moon className="w-5 h-5 text-[#c9b197]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#403c21]">Night Shift Pending</span>
                <span className="bg-[#c9b197] text-[#403c21] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">{nightShiftUnpaid.length} Unpaid</span>
              </div>
              <div className="text-xs font-bold text-neutral-600 mt-1 flex items-center space-x-2">
                <span>🥤 {nightShiftCups} Cups</span>
                <span>•</span>
                <span>📦 {nightShiftBoxes} Food Boxes</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-neutral-500 block">Pending Total</span>
            <span className="text-lg font-extrabold text-[#c9b197]">{formatCurrency(nightShiftTotalAmount, currencySymbol)}</span>
          </div>
        </div>
      </div>

      {/* NEW PENDING PAYMENT FORM */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            className="overflow-hidden"
          >
            <div className="bg-white border border-[#c9b197]/20 rounded-3xl p-5 sm:p-6 shadow-xs mb-6 text-[#403c21]">
              <h3 className="text-base font-extrabold text-[#403c21] mb-5 flex items-center space-x-2">
                <Plus className="w-5 h-5 text-[#c9b197]" />
                <span>Record New Customer Pending Credit</span>
              </h3>

              <form onSubmit={handleSubmitNewPending} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Shift Worker</label>
                    <select
                      value={shiftType}
                      onChange={(e) => setShiftType(e.target.value as ShiftType)}
                      className={inputClasses}
                    >
                      <option value="day">Day Shift</option>
                      <option value="night">Night Shift</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Customer Name</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Abebe (Regular)"
                      className={inputClasses}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Amount ({currencySymbol})</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={amount}
                      onFocus={handleInputFocus}
                      onChange={(e) => setAmount(cleanStringNumberInput(e))}
                      placeholder="0.00"
                      className={inputClasses}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Description</label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g. 3 Mango Juices + 1 Lunch"
                      className={inputClasses}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Juice Cups Count</label>
                    <input
                      type="number"
                      min="0"
                      value={juiceCupsCount}
                      onFocus={handleInputFocus}
                      onChange={(e) => handleJuiceCupsChange(cleanNumberInput(e))}
                      className={inputClasses}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Select Food Dish</label>
                    <select
                      value={selectedFoodItemId}
                      onChange={(e) => handleSelectFoodItem(e.target.value)}
                      className={inputClasses}
                    >
                      <option value="">-- Standard Takeaway Container --</option>
                      {(config?.foodMenu || []).map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.price} ETB)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Takeaway Containers</label>
                    <input
                      type="number"
                      min="0"
                      value={foodTakeawaysCount}
                      onFocus={handleInputFocus}
                      onChange={(e) => handleFoodBoxesChange(cleanNumberInput(e))}
                      className={inputClasses}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-5 py-2.5 bg-white border-2 border-[#403c21] text-[#403c21] hover:bg-slate-100 font-extrabold text-xs rounded-full transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#c9b197] hover:bg-[#bda387] text-[#403c21] font-extrabold text-xs rounded-full shadow-md transition-colors cursor-pointer active:scale-95"
                  >
                    Save Pending Credit Item
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FILTER BAR */}
      <div className="bg-white border border-[#c9b197]/20 rounded-3xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-[#403c21]">
        <div className="relative w-full sm:max-w-xs">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search customer credit..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-[#c9b197]/30 rounded-full text-sm text-[#403c21] font-bold focus:outline-none focus:border-[#c9b197] focus:ring-4 focus:ring-[#c9b197]/20 placeholder:text-neutral-400 shadow-xs"
          />
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
          <div className="flex bg-[#f7f5f0] p-1 rounded-full border border-[#c9b197]/20 text-xs font-medium">
            <button
              onClick={() => setFilterStatus('unpaid')}
              className={`px-3 py-1.5 rounded-full transition-colors cursor-pointer font-extrabold ${filterStatus === 'unpaid' ? 'bg-[#c9b197] text-[#403c21] shadow-xs' : 'text-neutral-600 hover:text-[#403c21]'}`}
            >
              Unpaid
            </button>
            <button
              onClick={() => setFilterStatus('paid')}
              className={`px-3 py-1.5 rounded-full transition-colors cursor-pointer font-extrabold ${filterStatus === 'paid' ? 'bg-[#c9b197] text-[#403c21] shadow-xs' : 'text-neutral-600 hover:text-[#403c21]'}`}
            >
              Paid
            </button>
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-full transition-colors cursor-pointer font-extrabold ${filterStatus === 'all' ? 'bg-[#c9b197] text-[#403c21] shadow-xs' : 'text-neutral-600 hover:text-[#403c21]'}`}
            >
              All
            </button>
          </div>

          <div className="flex bg-[#f7f5f0] p-1 rounded-full border border-[#c9b197]/20 text-xs font-medium">
            <button
              onClick={() => setFilterShift('all')}
              className={`px-3 py-1.5 rounded-full transition-colors cursor-pointer font-extrabold ${filterShift === 'all' ? 'bg-[#403c21] text-white shadow-xs' : 'text-neutral-600 hover:text-[#403c21]'}`}
            >
              All Shifts
            </button>
            <button
              onClick={() => setFilterShift('day')}
              className={`px-3 py-1.5 rounded-full transition-colors cursor-pointer font-extrabold ${filterShift === 'day' ? 'bg-[#403c21] text-white shadow-xs' : 'text-neutral-600 hover:text-[#403c21]'}`}
            >
              Day
            </button>
            <button
              onClick={() => setFilterShift('night')}
              className={`px-3 py-1.5 rounded-full transition-colors cursor-pointer font-extrabold ${filterShift === 'night' ? 'bg-[#403c21] text-white shadow-xs' : 'text-neutral-600 hover:text-[#403c21]'}`}
            >
              Night
            </button>
          </div>

          <div className="flex bg-[#f7f5f0] p-1 rounded-full border border-[#c9b197]/20 text-xs font-medium">
            <button
              onClick={() => setViewMode('individual')}
              className={`px-3 py-1.5 rounded-full transition-colors cursor-pointer font-extrabold ${viewMode === 'individual' ? 'bg-[#c9b197] text-[#403c21] shadow-xs' : 'text-neutral-600 hover:text-[#403c21]'}`}
            >
              Single Items
            </button>
            <button
              onClick={() => setViewMode('grouped')}
              className={`px-3 py-1.5 rounded-full transition-colors cursor-pointer font-extrabold ${viewMode === 'grouped' ? 'bg-[#c9b197] text-[#403c21] shadow-xs' : 'text-neutral-600 hover:text-[#403c21]'}`}
            >
              Group By Customer ({customerGroups.length})
            </button>
          </div>
        </div>
      </div>

      {/* PENDING ITEMS LIST */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="bg-[#c9b197]/20 rounded-3xl p-12 text-center border border-[#c9b197]/40 flex flex-col items-center">
            <Clock className="w-12 h-12 text-neutral-400 mb-3" />
            <h3 className="text-base font-bold text-white">No pending credit records</h3>
            <p className="text-sm text-neutral-300 mt-1">Try adjusting search query or status filter</p>
          </div>
        ) : viewMode === 'grouped' ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-4">
            {customerGroups.map((group) => (
              <div key={group.customerName} className="bg-[#c9b197]/20 border border-[#c9b197]/40 rounded-3xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#c9b197]/30 pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-[#c9b197]/40 text-[#c9b197] rounded-full border border-[#c9b197]/60 font-bold text-lg">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        {group.customerName}
                        {group.unpaidCount > 0 ? (
                          <span className="bg-[#c9b197] text-[#403c21] text-xs font-bold px-3 py-0.5 rounded-full">
                            {group.unpaidCount} Unpaid Order{group.unpaidCount > 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="bg-[#c9b197]/40 text-[#c9b197] border border-[#c9b197] text-xs font-bold px-3 py-0.5 rounded-full">
                            All Settled
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-neutral-300 mt-0.5">
                        Total Orders: {group.items.length} ({group.unpaidCount} Unpaid, {group.paidCount} Paid)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end space-x-4">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-medium text-neutral-400 block">Total Unpaid Balance</span>
                      <span className={`text-xl font-extrabold ${group.unpaidAmount > 0 ? 'text-[#c9b197]' : 'text-white'}`}>
                        {formatCurrency(group.unpaidAmount, currencySymbol)}
                      </span>
                    </div>

                    {group.unpaidCount > 0 && (
                      <button
                        onClick={() => {
                          const unpaidItems = group.items.filter(i => !i.isPaid);
                          unpaidItems.forEach(i => onSettlePendingPayment(i.id));
                        }}
                        className="px-5 py-2 bg-[#c9b197] hover:bg-[#c9b197]/90 text-[#403c21] text-xs font-bold rounded-full shadow-md transition-colors cursor-pointer flex items-center space-x-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[#403c21]" />
                        <span>Settle All Debts</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Individual orders under this customer */}
                <div className="space-y-2 pt-1">
                  <p className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider">Order History for {group.customerName}:</p>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {group.items.map(item => (
                      <div key={item.id} className={`flex items-center justify-between p-3 rounded-2xl border text-xs ${item.isPaid ? 'bg-[#403c21] border-[#c9b197]/30 text-neutral-300' : 'bg-[#403c21] border-[#c9b197]/40 text-white'}`}>
                        <div className="space-y-0.5">
                          <p className="font-bold">{item.description}</p>
                          <p className="text-[10px] text-neutral-400">
                            {item.shiftType.toUpperCase()} Shift • {item.date} {item.isPaid && `• Paid on ${item.paidDate || 'today'}`}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="font-bold text-sm text-[#c9b197]">{formatCurrency(item.amount, currencySymbol)}</span>
                          {!item.isPaid ? (
                            <button
                              onClick={() => onSettlePendingPayment(item.id)}
                              className="px-3 py-1 bg-[#c9b197] text-[#403c21] text-[11px] font-bold rounded-full hover:bg-[#c9b197]/90 transition-colors cursor-pointer"
                            >
                              Settle
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold text-[#c9b197] bg-[#c9b197]/40 px-2.5 py-0.5 rounded-full border border-[#c9b197]">PAID</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-3">
            {filteredItems.map((item, index) => {
              const isExpanded = expandedItemId === item.id;
              return (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className={`bg-[#c9b197]/20 border border-[#c9b197]/40 rounded-3xl p-5 shadow-sm hover:border-[#c9b197]/50 transition-all`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 rounded-full bg-[#c9b197]/40 text-[#c9b197] border border-[#c9b197]/60 shrink-0">
                        <User className="w-6 h-6" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center flex-wrap gap-2">
                          <h4 className="text-base font-bold text-white">
                            {item.customerName || 'Customer Credit'}
                          </h4>
                          
                          <span className="px-3 py-0.5 rounded-full text-xs font-bold flex items-center space-x-1 bg-[#403c21] text-[#c9b197] border border-[#c9b197]/40">
                            {item.shiftType === 'day' ? <Sun className="w-3 h-3 mr-0.5 inline text-[#c9b197]" /> : <Moon className="w-3 h-3 mr-0.5 inline text-[#c9b197]" />}
                            <span>{item.shiftType.toUpperCase()} SHIFT</span>
                          </span>

                          {item.isPaid ? (
                            <span className="bg-[#c9b197]/40 text-[#c9b197] border border-[#c9b197] px-3 py-0.5 rounded-full text-xs font-bold">
                              PAID & SETTLED
                            </span>
                          ) : (
                            <span className="bg-[#c9b197] text-[#403c21] px-3 py-0.5 rounded-full text-xs font-bold">
                              UNPAID CREDIT
                            </span>
                          )}
                        </div>

                        {/* HIGH LEVEL QUANTITIES SUMMARY ONLY (NO FOOD NAMES HERE) */}
                        <div className="flex items-center space-x-3 text-xs font-bold text-neutral-300 pt-0.5">
                          {item.juiceCupsCount > 0 && (
                            <span className="bg-[#403c21] text-[#c9b197] px-3 py-1 rounded-full border border-[#c9b197]/40 flex items-center space-x-1">
                              <CupSoda className="w-3.5 h-3.5" />
                              <span>{item.juiceCupsCount} Juice Cups</span>
                            </span>
                          )}
                          {item.foodTakeawaysCount > 0 && (
                            <span className="bg-[#403c21] text-[#c9b197] px-3 py-1 rounded-full border border-[#c9b197]/40 flex items-center space-x-1">
                              <Utensils className="w-3.5 h-3.5" />
                              <span>{item.foodTakeawaysCount} Food Boxes</span>
                            </span>
                          )}
                          {item.juiceCupsCount === 0 && item.foodTakeawaysCount === 0 && (
                            <span className="text-neutral-400 font-normal">Standard Credit Record</span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-400 pt-0.5">
                          <span>Date: {item.date}</span>
                          {item.isPaid && item.paidDate && (
                            <span className="text-[#c9b197] font-medium">• Cash Collected on {item.paidDate}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 self-end sm:self-center">
                      <span className="text-xl font-extrabold text-[#c9b197]">
                        {formatCurrency(item.amount, currencySymbol)}
                      </span>

                      <div className="flex items-center space-x-2">
                        {/* TOGGLE EXPAND DETAILS BUTTON */}
                        <button
                          onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                          className="px-3 py-1.5 bg-[#403c21] border border-[#c9b197] text-white hover:bg-[#c9b197]/30 font-bold text-xs rounded-full transition-colors flex items-center space-x-1 cursor-pointer"
                          title="Click to view food details"
                        >
                          <span>{isExpanded ? 'Hide Details' : 'Food Details'}</span>
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
                              className="px-3 py-1.5 bg-[#403c21] border border-[#c9b197] text-white hover:bg-[#c9b197]/30 font-bold text-xs rounded-full transition-colors flex items-center space-x-1 cursor-pointer"
                              title="Pay Partial / Deduct Cups"
                            >
                              <span>Deduct Paid</span>
                            </button>
                            <button
                              onClick={() => onSettlePendingPayment(item.id)}
                              className="px-4 py-1.5 bg-[#c9b197] hover:bg-[#c9b197]/90 text-[#403c21] font-bold text-xs rounded-full shadow-md transition-colors flex items-center space-x-1 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#403c21]" />
                              <span>Full Pay</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-[#c9b197] flex items-center space-x-1 px-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Settled</span>
                          </span>
                        )}

                        <button
                          onClick={() => setEditingItem(JSON.parse(JSON.stringify(item)))}
                          className="p-2 text-neutral-300 hover:text-white hover:bg-[#c9b197]/30 rounded-full transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onDeletePendingPayment(item.id)}
                          className="p-2 text-neutral-300 hover:text-white hover:bg-red-950/50 rounded-full transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* EXPANDABLE DETAILED FOOD LIST (SHOWN ONLY ON CLICK) */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mt-4 pt-3 border-t border-[#c9b197]/30"
                      >
                        <div className="bg-[#403c21] p-3 rounded-2xl border border-[#c9b197]/40 space-y-2">
                          <div className="text-[11px] font-bold text-[#c9b197] uppercase tracking-wider flex items-center space-x-1">
                            <Utensils className="w-3.5 h-3.5 text-[#c9b197]" />
                            <span>Itemized Dish & Drink Breakdown:</span>
                          </div>

                          {item.itemizedBreakdown && Object.keys(item.itemizedBreakdown).length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {Object.entries(item.itemizedBreakdown).map(([dishName, count]) => (
                                <div key={dishName} className="flex items-center justify-between text-xs bg-[#c9b197]/20 px-3 py-1.5 rounded-full border border-[#c9b197]/40">
                                  <span className="font-bold text-white">{dishName}</span>
                                  <span className="font-bold text-[#c9b197] bg-[#403c21] px-2 py-0.5 rounded-full text-[11px]">
                                    x{count}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-neutral-300 bg-[#c9b197]/20 p-2.5 rounded-2xl border border-[#c9b197]/40">
                              <span className="font-medium text-neutral-400">Note:</span> {item.description}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* EDIT MODAL */}
      <AnimatePresence>
        {editingItem && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#403c21]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#403c21] rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-[#c9b197]/50 space-y-4 text-white"
            >
              <div className="flex items-center justify-between border-b border-[#c9b197]/30 pb-4">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Pencil className="w-4 h-4 text-[#c9b197]" />
                  <span>Edit Pending Credit Record</span>
                </h3>
                <button
                  onClick={() => setEditingItem(null)}
                  className="p-2 text-neutral-400 hover:text-white hover:bg-[#c9b197]/30 rounded-full transition-colors cursor-pointer"
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
                    <label className="block text-xs font-medium text-neutral-300 mb-1">Date</label>
                    <input
                      type="date"
                      required
                      value={editingItem.date}
                      onChange={(e) => setEditingItem({ ...editingItem, date: e.target.value })}
                      className={inputClasses}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">Shift</label>
                    <select
                      value={editingItem.shiftType}
                      onChange={(e) => setEditingItem({ ...editingItem, shiftType: e.target.value as ShiftType })}
                      className={inputClasses}
                    >
                      <option value="day">Day Shift</option>
                      <option value="night">Night Shift</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Customer Name</label>
                  <input
                    type="text"
                    required
                    value={editingItem.customerName || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, customerName: e.target.value })}
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Description</label>
                  <input
                    type="text"
                    value={editingItem.description}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    className={inputClasses}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">Juice Cups</label>
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
                    <label className="block text-xs font-medium text-neutral-300 mb-1">Takeaways</label>
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
                    <label className="block text-xs font-medium text-neutral-300 mb-1">Amount</label>
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

                <div className="pt-4 flex items-center justify-end space-x-3 border-t border-[#c9b197]/30">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-5 py-2.5 bg-[#403c21] border border-[#c9b197] text-white hover:bg-[#c9b197]/30 font-bold text-xs rounded-full cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#c9b197] hover:bg-[#c9b197]/90 text-[#403c21] font-bold text-xs rounded-full shadow-md cursor-pointer flex items-center space-x-1.5 transition-colors"
                  >
                    <Save className="w-4 h-4 text-[#403c21]" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PARTIAL PAYMENT DEDUCTION MODAL */}
      <AnimatePresence>
        {partialItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#403c21]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#403c21] rounded-3xl shadow-2xl max-w-md w-full p-6 border border-[#c9b197]/50 space-y-5 text-white"
            >
              <div className="flex items-center justify-between border-b border-[#c9b197]/30 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white">Deduct Paid Debt</h3>
                  <p className="text-xs text-neutral-300">{partialItem.customerName || 'Customer'}</p>
                </div>
                <button
                  onClick={() => setPartialItem(null)}
                  className="p-1.5 text-neutral-400 hover:text-white hover:bg-[#c9b197]/30 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Current Debt Card */}
              <div className="bg-[#c9b197]/20 p-3.5 rounded-2xl border border-[#c9b197]/40 text-xs space-y-1">
                <div className="flex justify-between text-neutral-300 font-semibold">
                  <span>Current Balance:</span>
                  <span className="font-extrabold text-[#c9b197]">{formatCurrency(partialItem.amount, currencySymbol)}</span>
                </div>
                <div className="text-neutral-400 font-medium">
                  {partialItem.juiceCupsCount > 0 && <span>🥤 {partialItem.juiceCupsCount} Juice Cups </span>}
                  {partialItem.foodTakeawaysCount > 0 && <span>📦 {partialItem.foodTakeawaysCount} Food Boxes</span>}
                </div>
              </div>

              {/* Input Controls */}
              <div className="space-y-3">
                {partialItem.juiceCupsCount > 0 && (
                  <div className="flex items-center justify-between bg-[#c9b197]/20 p-3 rounded-2xl border border-[#c9b197]/40">
                    <span className="text-xs font-bold text-white">Juice Cups Paid Today:</span>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setPartialCupsPaid(Math.max(0, partialCupsPaid - 1))}
                        className="w-7 h-7 rounded-full bg-[#403c21] border border-[#c9b197] text-white font-bold flex items-center justify-center hover:bg-[#c9b197]/40 cursor-pointer"
                      >−</button>
                      <input
                        type="number"
                        min="0"
                        max={partialItem.juiceCupsCount}
                        value={partialCupsPaid || ''}
                        placeholder="0"
                        onFocus={handleInputFocus}
                        onChange={(e) => setPartialCupsPaid(Math.min(partialItem.juiceCupsCount, cleanNumberInput(e)))}
                        className="w-12 h-7 text-center font-bold text-sm bg-[#403c21] text-white border border-[#c9b197] rounded-md focus:outline-none focus:border-[#c9b197]"
                      />
                      <button
                        type="button"
                        onClick={() => setPartialCupsPaid(Math.min(partialItem.juiceCupsCount, partialCupsPaid + 1))}
                        className="w-7 h-7 rounded-full bg-[#c9b197] text-[#403c21] font-bold flex items-center justify-center hover:bg-[#c9b197]/90 cursor-pointer"
                      >+</button>
                    </div>
                  </div>
                )}

                {partialItem.foodTakeawaysCount > 0 && (
                  <div className="flex items-center justify-between bg-[#c9b197]/20 p-3 rounded-2xl border border-[#c9b197]/40">
                    <span className="text-xs font-bold text-white">Food Boxes Paid Today:</span>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setPartialBoxesPaid(Math.max(0, partialBoxesPaid - 1))}
                        className="w-7 h-7 rounded-full bg-[#403c21] border border-[#c9b197] text-white font-bold flex items-center justify-center hover:bg-[#c9b197]/40 cursor-pointer"
                      >−</button>
                      <input
                        type="number"
                        min="0"
                        max={partialItem.foodTakeawaysCount}
                        value={partialBoxesPaid || ''}
                        placeholder="0"
                        onFocus={handleInputFocus}
                        onChange={(e) => setPartialBoxesPaid(Math.min(partialItem.foodTakeawaysCount, cleanNumberInput(e)))}
                        className="w-12 h-7 text-center font-bold text-sm bg-[#403c21] text-white border border-[#c9b197] rounded-md focus:outline-none focus:border-[#c9b197]"
                      />
                      <button
                        type="button"
                        onClick={() => setPartialBoxesPaid(Math.min(partialItem.foodTakeawaysCount, partialBoxesPaid + 1))}
                        className="w-7 h-7 rounded-full bg-[#c9b197] text-[#403c21] font-bold flex items-center justify-center hover:bg-[#c9b197]/90 cursor-pointer"
                      >+</button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Custom Amount Paid (Br) — optional:</label>
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
                  <div className="bg-[#c9b197]/30 border border-[#c9b197]/50 p-3.5 rounded-2xl space-y-1 text-xs text-white font-semibold">
                    <div className="flex justify-between">
                      <span className="text-neutral-300">Deducting Today:</span>
                      <span className="font-extrabold text-[#c9b197]">{formatCurrency(totalPaidToday, currencySymbol)}</span>
                    </div>
                    <div className="flex justify-between text-neutral-300 font-normal">
                      <span>New Remaining Balance:</span>
                      <span className="font-bold text-[#c9b197]">
                        {remainingCups} Cups / {remainingBoxes} Boxes ({formatCurrency(remainingAmount, currencySymbol)})
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div className="pt-2 flex items-center justify-end space-x-3 border-t border-[#c9b197]/30">
                <button
                  type="button"
                  onClick={() => setPartialItem(null)}
                  className="px-5 py-2.5 bg-[#403c21] border border-[#c9b197] text-white hover:bg-[#c9b197]/30 font-bold text-xs rounded-full cursor-pointer transition-colors"
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
                  className="px-6 py-2.5 bg-[#c9b197] hover:bg-[#c9b197]/90 text-[#403c21] font-bold text-xs rounded-full shadow-md cursor-pointer flex items-center space-x-1.5 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#403c21]" />
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
