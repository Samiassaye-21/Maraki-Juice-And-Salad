import React, { useState, useMemo } from 'react';
import { 
  X, 
  Check, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Filter, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Printer, 
  Download, 
  User, 
  ArrowRight, 
  Sparkles, 
  AlertTriangle, 
  FileText, 
  ChevronDown,
  RotateCcw,
  Receipt
} from 'lucide-react';
import { toEthiopianDateString } from './BusinessManagement';
import { DEFAULT_JUICE_PRICE, DEFAULT_RECONCILIATION_DISHES } from './ShiftReconciliation';

export const DEFAULT_WAITERS_LIST = [
  'አቤል (Waiter Abel)',
  'አስቴር (Aster)',
  'ዳዊት (Dawit)',
  'ሀብታሙ (Habtamu)',
  'ወንዴ (Wende)',
  'ፋሲል (Fassil)',
  'በለጠ (Belete)',
  'የቢዩ አሽከርካሪ (BEU Driver)'
];

export default function WaiterPendingLedgerModal({
  isOpen,
  onClose,
  pendingDebts = [],
  onUpdateDebts,
  waitersList = DEFAULT_WAITERS_LIST,
  foodMenu = DEFAULT_RECONCILIATION_DISHES,
  standardJuicePrice,
  onSelectForRecovery
}) {
  const effectiveJuicePrice = useMemo(() => {
    if (standardJuicePrice && Number(standardJuicePrice) > 0) return Number(standardJuicePrice);
    const saved = Number(localStorage.getItem('maraki_standard_juice_price'));
    return saved > 0 ? saved : DEFAULT_JUICE_PRICE;
  }, [standardJuicePrice]);
  const [waiterFilter, setWaiterFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('pending'); // 'all' | 'pending' | 'completed'
  const [itemTypeFilter, setItemTypeFilter] = useState('all'); // 'all' | 'food' | 'juice'
  const [searchQuery, setSearchQuery] = useState('');
  
  // New Manual Debt Modal State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWaiter, setNewWaiter] = useState(DEFAULT_WAITERS_LIST[0]);
  const [newItemType, setNewItemType] = useState('food'); // 'food' | 'juice'
  const [newDishId, setNewDishId] = useState(DEFAULT_RECONCILIATION_DISHES[0].id);
  const [newUnits, setNewUnits] = useState(1);
  const [newCustomPrice, setNewCustomPrice] = useState(DEFAULT_RECONCILIATION_DISHES[0].price);
  const [newShift, setNewShift] = useState('Day');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newNotes, setNewNotes] = useState('');

  // Selected dish helper
  const selectedDish = useMemo(() => {
    return foodMenu.find(d => d.id === newDishId) || foodMenu[0];
  }, [newDishId, foodMenu]);

  // Handle dish change to update price
  const handleDishChange = (dishId) => {
    setNewDishId(dishId);
    const dish = foodMenu.find(d => d.id === dishId);
    if (dish) {
      setNewCustomPrice(dish.price);
    }
  };

  // Metrics Calculations
  const metrics = useMemo(() => {
    const active = pendingDebts.filter(d => d.status === 'pending');
    const completed = pendingDebts.filter(d => d.status === 'completed');
    
    const totalPendingAmount = active.reduce((sum, d) => sum + (Number(d.remainingAmount) || 0), 0);
    const totalRecoveredAmount = completed.reduce((sum, d) => sum + (Number(d.totalAmount) || 0), 0);
    
    const activeFoodUnits = active
      .filter(d => d.itemType === 'food')
      .reduce((sum, d) => sum + (Number(d.remainingUnits) || 0), 0);
      
    const activeJuiceUnits = active
      .filter(d => d.itemType === 'juice')
      .reduce((sum, d) => sum + (Number(d.remainingUnits) || 0), 0);

    const uniqueWaitersWithDebt = new Set(active.map(d => d.waiterName)).size;

    return {
      activeCount: active.length,
      completedCount: completed.length,
      totalPendingAmount,
      totalRecoveredAmount,
      activeFoodUnits,
      activeJuiceUnits,
      uniqueWaitersWithDebt
    };
  }, [pendingDebts]);

  // Filtered debts list
  const filteredDebts = useMemo(() => {
    return pendingDebts.filter(debt => {
      // Status filter
      if (statusFilter !== 'all' && debt.status !== statusFilter) return false;
      
      // Waiter filter
      if (waiterFilter !== 'all' && debt.waiterName !== waiterFilter) return false;
      
      // Item type filter
      if (itemTypeFilter !== 'all' && debt.itemType !== itemTypeFilter) return false;
      
      // Search query (waiter name, dish name, shift, date)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (debt.waiterName || '').toLowerCase().includes(q);
        const matchesDish = (debt.dishName || '').toLowerCase().includes(q);
        const matchesDate = (debt.date || '').toLowerCase().includes(q);
        if (!matchesName && !matchesDish && !matchesDate) return false;
      }
      
      return true;
    });
  }, [pendingDebts, waiterFilter, statusFilter, itemTypeFilter, searchQuery]);

  // Unique list of waiters who have debts
  const availableWaiters = useMemo(() => {
    const set = new Set();
    pendingDebts.forEach(d => {
      if (d.waiterName) set.add(d.waiterName);
    });
    waitersList.forEach(w => {
      const name = typeof w === 'string' ? w : (w.fullName || w.amharic);
      if (name) set.add(name);
    });
    return Array.from(set);
  }, [pendingDebts, waitersList]);

  // ACTION: Add New Manual Debt
  const handleCreateManualDebt = (e) => {
    e.preventDefault();
    const units = Math.max(1, Number(newUnits) || 1);
    const unitPrice = newItemType === 'juice' ? effectiveJuicePrice : (Number(newCustomPrice) || 200);
    const total = units * unitPrice;

    const newTicket = {
      id: `deb-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      waiterName: newWaiter,
      itemType: newItemType,
      dishId: newItemType === 'food' ? newDishId : 'juice-cup',
      dishName: newItemType === 'juice' ? 'Juice Cups (የጁስ ኩባያዎች)' : (selectedDish?.name || 'Food'),
      unitPrice: unitPrice,
      totalUnits: units,
      remainingUnits: units,
      totalAmount: total,
      remainingAmount: total,
      shift: newShift,
      date: newDate,
      createdAt: new Date().toISOString(),
      status: 'pending',
      notes: newNotes.trim()
    };

    const updated = [newTicket, ...pendingDebts];
    onUpdateDebts(updated);
    setShowAddForm(false);
    setNewNotes('');
    setNewUnits(1);
  };

  // ACTION: Mark Fully Settled (Paid)
  const handleSettleFull = (debtId) => {
    const updated = pendingDebts.map(d => {
      if (d.id === debtId) {
        return {
          ...d,
          remainingUnits: 0,
          remainingAmount: 0,
          status: 'completed',
          settledAt: new Date().toISOString()
        };
      }
      return d;
    });
    onUpdateDebts(updated);
  };

  // ACTION: Settle 1 or more units
  const handlePartialSettle = (debtId, count = 1) => {
    const updated = pendingDebts.map(d => {
      if (d.id === debtId) {
        const nextUnits = Math.max(0, d.remainingUnits - count);
        const nextAmount = nextUnits * d.unitPrice;
        return {
          ...d,
          remainingUnits: nextUnits,
          remainingAmount: nextAmount,
          status: nextUnits === 0 ? 'completed' : 'pending',
          settledAt: nextUnits === 0 ? new Date().toISOString() : d.settledAt
        };
      }
      return d;
    });
    onUpdateDebts(updated);
  };

  // ACTION: Reopen a settled debt
  const handleReopenDebt = (debtId) => {
    const updated = pendingDebts.map(d => {
      if (d.id === debtId) {
        return {
          ...d,
          remainingUnits: d.totalUnits,
          remainingAmount: d.totalAmount,
          status: 'pending',
          settledAt: null
        };
      }
      return d;
    });
    onUpdateDebts(updated);
  };

  // ACTION: Void / Delete Debt
  const handleDeleteDebt = (debtId) => {
    if (window.confirm('ይህ የአስተናጋጅ ዕዳ መዝገብ እንዲሰረዝ እርግጠኛ ነዎት? (Delete this debt record?)')) {
      const updated = pendingDebts.filter(d => d.id !== debtId);
      onUpdateDebts(updated);
    }
  };

  // ACTION: Print / Export Debts Summary
  const handlePrintLedger = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
      <div className="bg-white border border-emerald-100 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl shadow-emerald-950/20 text-slate-800 overflow-hidden font-sans">
        
        {/* ============================================================== */}
        {/* MODAL HEADER                                                  */}
        {/* ============================================================== */}
        <div className="p-4 sm:p-6 border-b border-emerald-100 flex items-center justify-between gap-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 text-white border border-white/30 flex items-center justify-center text-2xl shadow-inner">
              📋
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white drop-shadow-xs">
                  የአስተናጋጆች ዕዳ መዝገብና ክትትል (Waiter Pending Debts Ledger)
                </h2>
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-white text-emerald-900 shadow-xs">
                  {metrics.activeCount} ሳይከፈል የቀረ
                </span>
              </div>
              <p className="text-xs text-emerald-100 font-bold mt-0.5">
                ከቀደምት ፈረቃዎች በአስተናጋጆች የተወሰዱ ያልተከፈሉ ምግቦችና ጁሶች ሙሉ መቆጣጠሪያ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintLedger}
              className="p-2.5 bg-white/20 hover:bg-white/30 text-white border border-white/25 rounded-xl transition-all shadow-xs active:scale-95"
              title="አትም (Print Summary)"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 bg-black/20 hover:bg-black/30 text-emerald-100 hover:text-white border border-white/15 rounded-xl transition-all active:scale-95"
              title="ዝጋ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* TOP METRICS SUMMARY CARDS                                      */}
        {/* ============================================================== */}
        <div className="p-4 sm:p-6 bg-slate-50 border-b border-emerald-100/70 grid grid-cols-2 sm:grid-cols-4 gap-3">
          
          {/* Card 1: Total Active Pending ETB */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
              <span>ያልተሰበሰበ ጠቅላላ ዕዳ</span>
              <span className="text-amber-500">⏳</span>
            </div>
            <div className="text-lg sm:text-xl font-black text-slate-900">
              {metrics.totalPendingAmount.toLocaleString()} <span className="text-xs font-bold text-slate-500">ETB</span>
            </div>
            <span className="text-[10px] text-slate-400 font-bold block mt-1">
              {metrics.uniqueWaitersWithDebt} ባለዕዳ አስተናጋጆች
            </span>
          </div>

          {/* Card 2: Food Boxes Pending */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
              <span>ያልተከፈሉ ምግቦች</span>
              <span className="text-emerald-600">🍱</span>
            </div>
            <div className="text-lg sm:text-xl font-black text-emerald-900">
              {metrics.activeFoodUnits} <span className="text-xs font-bold text-slate-500">ቦክስ ምግብ</span>
            </div>
            <span className="text-[10px] text-slate-400 font-bold block mt-1">
              በአስተናጋጆች እጅ የቀረ
            </span>
          </div>

          {/* Card 3: Juice Cups Pending */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
              <span>ያልተከፈሉ ጁሶች</span>
              <span className="text-emerald-600">🥤</span>
            </div>
            <div className="text-lg sm:text-xl font-black text-emerald-900">
              {metrics.activeJuiceUnits} <span className="text-xs font-bold text-slate-500">ኩባያ ጁስ</span>
            </div>
            <span className="text-[10px] text-slate-400 font-bold block mt-1">
              {(metrics.activeJuiceUnits * effectiveJuicePrice).toLocaleString()} ETB
            </span>
          </div>

          {/* Card 4: Settled / Completed */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
              <span>የተመለሰ / የተከፈለ</span>
              <span className="text-emerald-600">✔</span>
            </div>
            <div className="text-lg sm:text-xl font-black text-emerald-800">
              {metrics.totalRecoveredAmount.toLocaleString()} <span className="text-xs font-bold text-slate-500">ETB</span>
            </div>
            <span className="text-[10px] text-slate-400 font-bold block mt-1">
              {metrics.completedCount} የተዘጉ ቲኬቶች
            </span>
          </div>

        </div>

        {/* ============================================================== */}
        {/* FILTER CONTROLS & ADD BUTTON                                   */}
        {/* ============================================================== */}
        <div className="p-4 bg-white border-b border-slate-200 space-y-3">
          
          <div className="flex flex-wrap items-center justify-between gap-3">
            
            {/* Status Tabs: [ ⏳ ሳይከፈል የቀረ ] [ ✔ የተከፈለ ] [ ሁሉም ] */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                  statusFilter === 'pending'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>ያልተከፈለ ({metrics.activeCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('completed')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                  statusFilter === 'completed'
                    ? 'bg-emerald-100 text-emerald-900 shadow-2xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>የተከፈለ ({metrics.completedCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  statusFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ሁሉም ({pendingDebts.length})
              </button>
            </div>

            {/* Right: + Add Manual Debt Button */}
            <button
              type="button"
              onClick={() => setShowAddForm(prev => !prev)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddForm ? 'ቅጹን ዝጋ (Close Form)' : '+ አዲስ ዕዳ መዝግብ (Add Debt)'}</span>
            </button>

          </div>

          {/* Sub Filters Row: Waiter Selector & Search */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Filter by Waiter */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={waiterFilter}
                onChange={(e) => setWaiterFilter(e.target.value)}
                className="bg-transparent text-slate-800 font-bold outline-none cursor-pointer"
              >
                <option value="all">ሁሉም አስተናጋጆች (All Waiters)</option>
                {availableWaiters.map(w => (
                  <option key={w} value={w} className="bg-white text-slate-900">
                    {w}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Item Type */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={itemTypeFilter}
                onChange={(e) => setItemTypeFilter(e.target.value)}
                className="bg-transparent text-slate-800 font-bold outline-none cursor-pointer"
              >
                <option value="all">ሁሉም አይነቶች (All Items)</option>
                <option value="food" className="bg-white text-slate-900">🍱 ምግብ ብቻ (Food Only)</option>
                <option value="juice" className="bg-white text-slate-900">🥤 ጁስ ብቻ (Juice Only)</option>
              </select>
            </div>

            {/* Search Box */}
            <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="በአስተናጋጅ ስም ወይም ምግብ ፈልግ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 placeholder-slate-400 outline-none w-full"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-800">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

          </div>

        </div>

        {/* ============================================================== */}
        {/* ADD MANUAL DEBT ACCORDION FORM                                 */}
        {/* ============================================================== */}
        {showAddForm && (
          <form onSubmit={handleCreateManualDebt} className="p-4 sm:p-5 bg-emerald-50/50 border-b border-emerald-200 animate-in slide-in-from-top-2 space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
              <span className="text-xs font-black text-emerald-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                <span>አዲስ የአስተናጋጅ ዕዳ መመዝገቢያ ቅጽ (Direct Manual Debt Entry)</span>
              </span>
              <span className="text-[11px] text-slate-500 font-bold">
                እዳው በቀጥታ ወደ መዝገቡ ገብቶ በፈረቃ ሂሳብ መመለስ ይችላል
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              
              {/* Waiter Name */}
              <div>
                <label className="text-slate-700 font-black block mb-1">ባለዕዳ አስተናጋጅ (Waiter):</label>
                <select
                  value={newWaiter}
                  onChange={(e) => setNewWaiter(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold outline-none focus:border-emerald-500"
                >
                  {availableWaiters.map(w => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>

              {/* Item Type: Food or Juice */}
              <div>
                <label className="text-slate-700 font-black block mb-1">የዕቃው አይነት (Item Type):</label>
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setNewItemType('food')}
                    className={`flex-1 py-1.5 rounded-lg font-black text-[11px] transition-colors ${
                      newItemType === 'food' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🍱 ምግብ (Food)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewItemType('juice')}
                    className={`flex-1 py-1.5 rounded-lg font-black text-[11px] transition-colors ${
                      newItemType === 'juice' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🥤 ጁስ (Juice)
                  </button>
                </div>
              </div>

              {/* Dish or Juice Selection */}
              <div>
                <label className="text-slate-700 font-black block mb-1">
                  {newItemType === 'food' ? 'የምግብ አይነት (Dish):' : 'ጁስ ኩባያ (Juice Cup):'}
                </label>
                {newItemType === 'food' ? (
                  <select
                    value={newDishId}
                    onChange={(e) => handleDishChange(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold outline-none focus:border-emerald-500"
                  >
                    {foodMenu.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.englishName || ''}) - {d.price} ETB
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    disabled
                    value={`መደበኛ ጁስ (${effectiveJuicePrice} ETB / cup)`}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-600 font-bold outline-none"
                  />
                )}
              </div>

              {/* Units & Total */}
              <div>
                <label className="text-slate-700 font-black block mb-1">ብዛት (Quantity Units):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={newUnits}
                    onChange={(e) => setNewUnits(e.target.value)}
                    className="w-20 bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-black text-sm outline-none focus:border-emerald-500 text-center"
                  />
                  <div className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-right">
                    <span className="text-[10px] text-slate-500 block font-bold">ጠቅላላ ሂሳብ፡</span>
                    <span className="text-xs font-black text-emerald-800">
                      {((Number(newUnits) || 1) * (newItemType === 'juice' ? effectiveJuicePrice : newCustomPrice)).toLocaleString()} ETB
                    </span>
                  </div>
                </div>
              </div>

            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <input
                type="text"
                placeholder="ተጨማሪ ማስታወሻ ወይም ምክንያት (Optional notes)..."
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="flex-1 min-w-[250px] bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-500"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black"
                >
                  ተመለስ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5 active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>ዕዳውን መዝግብ (Save Ticket)</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ============================================================== */}
        {/* MAIN DEBTS LIST BODY                                           */}
        {/* ============================================================== */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-[#FDFBF7]">
          {filteredDebts.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 space-y-3 shadow-xs">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center text-3xl">
                ✓
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">
                  ምንም ያልተገኘ የአስተናጋጅ ዕዳ መዝገብ የለም (No Debt Records Found)
                </h4>
                <p className="text-xs text-slate-500 font-bold mt-1">
                  የተመረጠውን ማጣሪያ ይቀይሩ ወይም አዲስ ዕዳ ለመመዝገብ ከላይ ያለውን ቁልፍ ይጫኑ።
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all');
                  setWaiterFilter('all');
                  setItemTypeFilter('all');
                  setSearchQuery('');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-emerald-50 text-emerald-800 border border-slate-200 rounded-xl text-xs font-black"
              >
                ማጣሪያዎችን አጥፋ (Reset Filters)
              </button>
            </div>
          ) : (
            filteredDebts.map(debt => {
              const isPending = debt.status === 'pending';
              const isFood = debt.itemType === 'food';

              return (
                <div
                  key={debt.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    isPending
                      ? 'bg-white border-emerald-200/80 hover:border-emerald-400 shadow-xs'
                      : 'bg-slate-50/80 border-slate-200 opacity-75'
                  }`}
                >
                  
                  {/* Left: Waiter & Item Details */}
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black shrink-0 ${
                      isFood ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {isFood ? '🍱' : '🥤'}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black text-sm text-slate-900">
                          {debt.waiterName}
                        </span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          isPending 
                            ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        }`}>
                          {isPending ? '⏳ ሳይከፈል የቀረ (Pending)' : '✔ ተከፍሏል (Completed)'}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {debt.shift || 'Day'} ፈረቃ
                        </span>
                      </div>

                      <p className="text-xs text-slate-800 font-bold">
                        {debt.dishName}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                        <span>ቀን፡ {toEthiopianDateString(debt.date)} ({debt.date})</span>
                        <span>•</span>
                        <span>ዋጋ፡ {debt.unitPrice} ETB / unit</span>
                        {debt.notes && (
                          <>
                            <span>•</span>
                            <span className="text-amber-700 italic">"{debt.notes}"</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Quantities, Amounts & Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                    
                    {/* Units & Remaining Amount */}
                    <div className="text-right">
                      <div className="text-xs font-black text-slate-900">
                        {debt.remainingUnits} / {debt.totalUnits} {isFood ? 'ቦክስ' : 'ኩባያ'}
                      </div>
                      <div className="text-sm font-black text-emerald-900">
                        {debt.remainingAmount.toLocaleString()} <span className="text-[10px] text-slate-500">ETB</span>
                      </div>
                      {debt.remainingAmount < debt.totalAmount && isPending && (
                        <span className="text-[10px] text-slate-400 line-through block">
                          ጠቅላላ፡ {debt.totalAmount.toLocaleString()} ETB
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5">
                      {isPending ? (
                        <>
                          {/* Settle in Full */}
                          <button
                            type="button"
                            onClick={() => handleSettleFull(debt.id)}
                            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1 shadow-sm transition-all active:scale-95"
                            title="ሙሉውን ተከፍሏል ብለህ መዝግብ"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>ተከፍሏል</span>
                          </button>

                          {/* Partial Settle 1 unit if multi-unit */}
                          {debt.remainingUnits > 1 && (
                            <button
                              type="button"
                              onClick={() => handlePartialSettle(debt.id, 1)}
                              className="px-2.5 py-2 bg-slate-100 hover:bg-emerald-50 text-emerald-900 border border-slate-200 rounded-xl text-xs font-black transition-all"
                              title="የ1 እቃ ክፍያ ብቻ ተቀበል"
                            >
                              -1 {isFood ? 'ቦክስ' : 'ኩባያ'}
                            </button>
                          )}
                        </>
                      ) : (
                        /* Re-open settled debt */
                        <button
                          type="button"
                          onClick={() => handleReopenDebt(debt.id)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 border border-slate-200"
                          title="እንደገና ክፈት"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>እንደገና ክፈት</span>
                        </button>
                      )}

                      {/* Void / Delete Ticket */}
                      <button
                        type="button"
                        onClick={() => handleDeleteDebt(debt.id)}
                        className="p-2 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl border border-slate-200 hover:border-rose-200 transition-all"
                        title="ሰርዝ (Delete)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* ============================================================== */}
        {/* MODAL FOOTER                                                  */}
        {/* ============================================================== */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600 font-bold">
            <span className="text-emerald-700">💡 ማሳሰቢያ፡</span>
            <span>በፈረቃ መዝጊያ ወቅት (Shift Reconciliation) በክፍል 4 የተመረጡት ዕዳዎች በቀጥታ ወደ ካዝና ጥሬ ገንዘብ (Cash Drawer) ይደመራሉ።</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-black text-xs transition-all shadow-xs"
          >
            ዝጋ (Close Ledger)
          </button>
        </div>

      </div>
    </div>
  );
}
