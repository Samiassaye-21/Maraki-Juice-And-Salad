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
  onSettlePendingPayment: (id: string) => void;
  onDeletePendingPayment: (id: string) => void;
  currencySymbol: string;
  config?: RestaurantSystemConfig;
}

export const PendingPaymentsView: React.FC<PendingPaymentsViewProps> = ({
  pendingPayments,
  onAddPendingPayment,
  onUpdatePendingPayment,
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

  const inputClasses = "w-full px-4 py-3 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all";

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
      
      {/* HEADER CARD */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="flex items-center space-x-3.5">
          <div className="p-3.5 rounded-xl bg-blue-50 text-blue-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Customer Pending Payments
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Track customer unpaid credit ledgers by shift worker
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4 w-full sm:w-auto">
          <div className="flex flex-col items-end">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Outstanding Unpaid
            </span>
            <span className="text-2xl font-bold text-slate-900">
              {formatCurrency(totalOutstanding, currencySymbol)}
            </span>
          </div>
          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg shadow-sm transition-colors flex items-center space-x-2 shrink-0 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>Add Record</span>
          </button>
        </div>
      </div>

      {/* SHIFT SUMMARY CARDS (DAY VS NIGHT) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* DAY SHIFT CARD */}
        <div className="bg-gradient-to-br from-blue-50/80 to-blue-100/40 border border-blue-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-500 text-white rounded-xl shadow-sm">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-blue-900">Day Shift Pending</span>
                <span className="bg-blue-200/80 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">{dayShiftUnpaid.length} Unpaid</span>
              </div>
              <div className="text-xs font-semibold text-blue-700 mt-1 flex items-center space-x-2">
                <span>🥤 {dayShiftCups} Cups</span>
                <span>•</span>
                <span>📦 {dayShiftBoxes} Food Boxes</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-semibold text-blue-600 block">Pending Total</span>
            <span className="text-lg font-black text-blue-950">{formatCurrency(dayShiftTotalAmount, currencySymbol)}</span>
          </div>
        </div>

        {/* NIGHT SHIFT CARD */}
        <div className="bg-gradient-to-br from-slate-100 to-indigo-50/60 border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-slate-800 text-white rounded-xl shadow-sm">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900">Night Shift Pending</span>
                <span className="bg-slate-200 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-full">{nightShiftUnpaid.length} Unpaid</span>
              </div>
              <div className="text-xs font-semibold text-slate-700 mt-1 flex items-center space-x-2">
                <span>🥤 {nightShiftCups} Cups</span>
                <span>•</span>
                <span>📦 {nightShiftBoxes} Food Boxes</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-semibold text-slate-600 block">Pending Total</span>
            <span className="text-lg font-black text-slate-950">{formatCurrency(nightShiftTotalAmount, currencySymbol)}</span>
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
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm mb-6">
              <h3 className="text-base font-semibold text-slate-900 mb-5 flex items-center space-x-2">
                <Plus className="w-5 h-5 text-blue-500" />
                <span>Record New Customer Pending Credit</span>
              </h3>

              <form onSubmit={handleSubmitNewPending} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Shift Worker</label>
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
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Customer Name</label>
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
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Amount ({currencySymbol})</label>
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
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Description</label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g. 3 Mango Juices + 1 Lunch"
                      className={inputClasses}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Juice Cups Count</label>
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
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Select Food Dish</label>
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
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Takeaway Containers</label>
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
                    className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg shadow-sm transition-colors cursor-pointer"
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
      <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-xs">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search customer credit..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
          <div className="flex bg-slate-100 p-1 rounded-lg text-sm font-medium">
            <button
              onClick={() => setFilterStatus('unpaid')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${filterStatus === 'unpaid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Unpaid
            </button>
            <button
              onClick={() => setFilterStatus('paid')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${filterStatus === 'paid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Paid
            </button>
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${filterStatus === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              All
            </button>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-lg text-sm font-medium">
            <button
              onClick={() => setFilterShift('all')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${filterShift === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              All Shifts
            </button>
            <button
              onClick={() => setFilterShift('day')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${filterShift === 'day' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Day
            </button>
            <button
              onClick={() => setFilterShift('night')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${filterShift === 'night' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Night
            </button>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-lg text-sm font-medium">
            <button
              onClick={() => setViewMode('individual')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${viewMode === 'individual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Single Items
            </button>
            <button
              onClick={() => setViewMode('grouped')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${viewMode === 'grouped' ? 'bg-blue-600 text-white shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Group By Customer ({customerGroups.length})
            </button>
          </div>
        </div>
      </div>

      {/* PENDING ITEMS LIST */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="bg-slate-50 rounded-xl p-12 text-center border border-slate-200 flex flex-col items-center">
            <Clock className="w-12 h-12 text-slate-300 mb-3" />
            <h3 className="text-base font-medium text-slate-900">No pending credit records</h3>
            <p className="text-sm text-slate-500 mt-1">Try adjusting search query or status filter</p>
          </div>
        ) : viewMode === 'grouped' ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-4">
            {customerGroups.map((group) => (
              <div key={group.customerName} className="bg-white border border-blue-100 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-blue-100 text-blue-700 rounded-xl font-black text-lg">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        {group.customerName}
                        {group.unpaidCount > 0 ? (
                          <span className="bg-amber-100 text-amber-800 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                            {group.unpaidCount} Unpaid Order{group.unpaidCount > 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-800 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                            All Settled
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Total Orders: {group.items.length} ({group.unpaidCount} Unpaid, {group.paidCount} Paid)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end space-x-4">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Unpaid Balance</span>
                      <span className={`text-xl font-black ${group.unpaidAmount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {formatCurrency(group.unpaidAmount, currencySymbol)}
                      </span>
                    </div>

                    {group.unpaidCount > 0 && (
                      <button
                        onClick={() => {
                          const unpaidItems = group.items.filter(i => !i.isPaid);
                          unpaidItems.forEach(i => onSettlePendingPayment(i.id));
                        }}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer flex items-center space-x-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Settle All Debts</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Individual orders under this customer */}
                <div className="space-y-2 pt-1">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Order History for {group.customerName}:</p>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {group.items.map(item => (
                      <div key={item.id} className={`flex items-center justify-between p-3 rounded-xl border text-xs ${item.isPaid ? 'bg-emerald-50/40 border-emerald-200 text-slate-600' : 'bg-amber-50/50 border-amber-200 text-slate-900'}`}>
                        <div className="space-y-0.5">
                          <p className="font-bold">{item.description}</p>
                          <p className="text-[10px] text-slate-500">
                            {item.shiftType.toUpperCase()} Shift • {item.date} {item.isPaid && `• Paid on ${item.paidDate || 'today'}`}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="font-extrabold text-sm">{formatCurrency(item.amount, currencySymbol)}</span>
                          {!item.isPaid ? (
                            <button
                              onClick={() => onSettlePendingPayment(item.id)}
                              className="px-2.5 py-1 bg-emerald-600 text-white text-[11px] font-bold rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer"
                            >
                              Settle
                            </button>
                          ) : (
                            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">PAID</span>
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
                  className={`bg-white border border-slate-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all ${
                    item.isPaid ? 'border-l-4 border-l-emerald-400' : 'border-l-4 border-l-amber-400'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-xl shrink-0 ${
                        item.isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        <User className="w-6 h-6" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center flex-wrap gap-2">
                          <h4 className="text-base font-bold text-slate-900">
                            {item.customerName || 'Customer Credit'}
                          </h4>
                          
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold flex items-center space-x-1 ${
                            item.shiftType === 'day' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-900'
                          }`}>
                            {item.shiftType === 'day' ? <Sun className="w-3 h-3 mr-0.5 inline" /> : <Moon className="w-3 h-3 mr-0.5 inline" />}
                            <span>{item.shiftType.toUpperCase()} SHIFT</span>
                          </span>

                          {item.isPaid ? (
                            <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-xs font-bold">
                              PAID & SETTLED
                            </span>
                          ) : (
                            <span className="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full text-xs font-bold">
                              UNPAID CREDIT
                            </span>
                          )}
                        </div>

                        {/* HIGH LEVEL QUANTITIES SUMMARY ONLY (NO FOOD NAMES HERE) */}
                        <div className="flex items-center space-x-3 text-xs font-bold text-slate-700 pt-0.5">
                          {item.juiceCupsCount > 0 && (
                            <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-100 flex items-center space-x-1">
                              <CupSoda className="w-3.5 h-3.5" />
                              <span>{item.juiceCupsCount} Juice Cups</span>
                            </span>
                          )}
                          {item.foodTakeawaysCount > 0 && (
                            <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-100 flex items-center space-x-1">
                              <Utensils className="w-3.5 h-3.5" />
                              <span>{item.foodTakeawaysCount} Food Boxes</span>
                            </span>
                          )}
                          {item.juiceCupsCount === 0 && item.foodTakeawaysCount === 0 && (
                            <span className="text-slate-400 font-normal">Standard Credit Record</span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 pt-0.5">
                          <span>Date: {item.date}</span>
                          {item.isPaid && item.paidDate && (
                            <span className="text-emerald-600 font-medium">• Cash Collected on {item.paidDate}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 self-end sm:self-center">
                      <span className="text-xl font-extrabold text-slate-900">
                        {formatCurrency(item.amount, currencySymbol)}
                      </span>

                      <div className="flex items-center space-x-2">
                        {/* TOGGLE EXPAND DETAILS BUTTON */}
                        <button
                          onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
                          title="Click to view food details"
                        >
                          <span>{isExpanded ? 'Hide Details' : 'Food Details'}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>

                        {!item.isPaid ? (
                          <button
                            onClick={() => onSettlePendingPayment(item.id)}
                            className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-xs rounded-lg shadow-sm transition-colors flex items-center space-x-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Collect</span>
                          </button>
                        ) : (
                          <span className="text-xs font-medium text-emerald-600 flex items-center space-x-1 px-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Settled</span>
                          </span>
                        )}

                        <button
                          onClick={() => setEditingItem(JSON.parse(JSON.stringify(item)))}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onDeletePendingPayment(item.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
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
                        className="overflow-hidden mt-4 pt-3 border-t border-slate-100"
                      >
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 space-y-2">
                          <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center space-x-1">
                            <Utensils className="w-3.5 h-3.5 text-blue-600" />
                            <span>Itemized Dish & Drink Breakdown:</span>
                          </div>

                          {item.itemizedBreakdown && Object.keys(item.itemizedBreakdown).length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {Object.entries(item.itemizedBreakdown).map(([dishName, count]) => (
                                <div key={dishName} className="flex items-center justify-between text-xs bg-white px-3 py-1.5 rounded border border-slate-200/60 shadow-2xs">
                                  <span className="font-semibold text-slate-800">{dishName}</span>
                                  <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                                    x{count}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-slate-700 bg-white p-2.5 rounded border border-slate-200">
                              <span className="font-medium text-slate-500">Note:</span> {item.description}
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
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border border-slate-100 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-base font-semibold text-slate-900 flex items-center space-x-2">
                  <Pencil className="w-4 h-4 text-blue-500" />
                  <span>Edit Pending Credit Record</span>
                </h3>
                <button
                  onClick={() => setEditingItem(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
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
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Date</label>
                    <input
                      type="date"
                      required
                      value={editingItem.date}
                      onChange={(e) => setEditingItem({ ...editingItem, date: e.target.value })}
                      className={inputClasses}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Shift</label>
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
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Customer Name</label>
                  <input
                    type="text"
                    required
                    value={editingItem.customerName || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, customerName: e.target.value })}
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Description</label>
                  <input
                    type="text"
                    value={editingItem.description}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    className={inputClasses}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Juice Cups</label>
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
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Takeaways</label>
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
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Amount</label>
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

                <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-sm rounded-lg cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium text-sm rounded-lg shadow-sm cursor-pointer flex items-center space-x-1.5 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default PendingPaymentsView;
