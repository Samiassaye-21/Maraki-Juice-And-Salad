import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Printer, 
  Package, 
  Coffee, 
  Truck, 
  Receipt, 
  DollarSign, 
  TrendingUp, 
  Filter, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  Clock, 
  Sun, 
  Moon, 
  ArrowUpRight, 
  X, 
  Sparkles,
  FileText
} from 'lucide-react';
import { toEthiopianDateString } from './BusinessManagement';
import { DEFAULT_JUICE_PRICE } from './ShiftReconciliation';

export default function OwnerIncomeAnalysisReport({
  settlements = [],
  orders = [],
  onOpenShiftReconciliation,
  onUpdateSettlements
}) {
  // Time period filter: 'daily' | 'weekly' | 'monthly' | 'custom'
  const [timeRange, setTimeRange] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [shiftFilter, setShiftFilter] = useState('all'); // 'all' | 'Day' | 'Night'

  // Active print slip modal & detailed inspect modal
  const [activePrintSlip, setActivePrintSlip] = useState(null);
  const [inspectSettlement, setInspectSettlement] = useState(null);

  // Date navigation for daily view
  const handleShiftDate = (days) => {
    const cur = new Date(selectedDate);
    cur.setDate(cur.getDate() + days);
    setSelectedDate(cur.toISOString().split('T')[0]);
  };

  // Safe settlements resolution (props or fallback to localStorage)
  const resolvedSettlements = useMemo(() => {
    if (settlements && settlements.length > 0) return settlements;
    try {
      const saved = localStorage.getItem('maraki_shift_settlements');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }, [settlements]);

  // Safe orders resolution (props or fallback to localStorage)
  const resolvedOrders = useMemo(() => {
    if (orders && orders.length > 0) return orders;
    try {
      const saved = localStorage.getItem('maraki_chef_sent_orders');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }, [orders]);

  // Filtered settlements according to time range & shift
  const filteredSettlements = useMemo(() => {
    return resolvedSettlements.filter(s => {
      // Shift filter
      if (shiftFilter !== 'all' && s.shift !== shiftFilter) return false;

      const recordDate = s.date || (s.savedAt ? s.savedAt.split('T')[0] : '');
      if (!recordDate) return false;

      if (timeRange === 'daily') {
        return recordDate === selectedDate;
      }
      if (timeRange === 'weekly') {
        const target = new Date(selectedDate);
        const start = new Date(target);
        start.setDate(start.getDate() - 6);
        const startStr = start.toISOString().split('T')[0];
        return recordDate >= startStr && recordDate <= selectedDate;
      }
      if (timeRange === 'monthly') {
        const target = new Date(selectedDate);
        const monthPrefix = target.toISOString().slice(0, 7); // YYYY-MM
        return recordDate.startsWith(monthPrefix);
      }
      if (timeRange === 'custom') {
        if (!customStartDate || !customEndDate) return true;
        return recordDate >= customStartDate && recordDate <= customEndDate;
      }
      return true;
    });
  }, [resolvedSettlements, timeRange, selectedDate, customStartDate, customEndDate, shiftFilter]);

  // Filtered kitchen orders according to time range & shift
  const filteredOrders = useMemo(() => {
    return resolvedOrders.filter(o => {
      // Shift filter
      if (shiftFilter !== 'all' && o.shiftType !== shiftFilter) return false;

      // Extract date from order
      const oDate = o.gregorianDate || (o.timestamp ? o.timestamp.split('T')[0] : '');
      if (!oDate) return false;

      if (timeRange === 'daily') {
        return oDate === selectedDate;
      }
      if (timeRange === 'weekly') {
        const target = new Date(selectedDate);
        const start = new Date(target);
        start.setDate(start.getDate() - 6);
        const startStr = start.toISOString().split('T')[0];
        return oDate >= startStr && oDate <= selectedDate;
      }
      if (timeRange === 'monthly') {
        const target = new Date(selectedDate);
        const monthPrefix = target.toISOString().slice(0, 7);
        return oDate.startsWith(monthPrefix);
      }
      if (timeRange === 'custom') {
        if (!customStartDate || !customEndDate) return true;
        return oDate >= customStartDate && oDate <= customEndDate;
      }
      return true;
    });
  }, [resolvedOrders, timeRange, selectedDate, customStartDate, customEndDate, shiftFilter]);

  // Aggregated Key Metrics (Boxes, Orders, Cups, beU, and Financial Totals)
  const metrics = useMemo(() => {
    // 1. Boxes (from settlements or kitchen orders fallback)
    const boxesFromSettlements = filteredSettlements.reduce((sum, s) => sum + (Number(s.assignedBoxes || s.targetFoodSold) || 0), 0);
    const boxesFromOrders = filteredOrders.reduce((sum, o) => sum + (Number(o.boxesCount) || 1), 0);
    const totalBoxes = boxesFromSettlements > 0 ? boxesFromSettlements : boxesFromOrders;

    // 2. Orders count
    const totalOrdersCount = filteredOrders.length;
    const dayOrdersCount = filteredOrders.filter(o => o.shiftType === 'Day').length;
    const nightOrdersCount = filteredOrders.filter(o => o.shiftType === 'Night').length;

    // 3. Cups (Juice Cups sold)
    const totalJuiceCups = filteredSettlements.reduce((sum, s) => sum + (Number(s.juiceSold) || 0), 0);
    const inHouseJuiceCups = filteredSettlements.reduce((sum, s) => sum + (Number(s.inHouseJuiceCups) || (Number(s.juiceSold || 0) - Number(s.beuDeliveryCups || 0))), 0);
    const grossJuiceRevenue = filteredSettlements.reduce((sum, s) => sum + (Number(s.grossJuiceRevenue) || 0), 0);

    // 4. beU Delivery
    const totalBeuCups = filteredSettlements.reduce((sum, s) => sum + (Number(s.beuDeliveryCups) || 0), 0);
    const totalBeuDeduction = filteredSettlements.reduce((sum, s) => sum + (Number(s.beuDeliveryDeduction) || 0), 0);
    const beuSharePercent = totalJuiceCups > 0 ? Math.round((totalBeuCups / totalJuiceCups) * 100) : 0;

    // 5. Financial Summary
    const totalFoodRevenue = filteredSettlements.reduce((sum, s) => sum + (Number(s.totalFoodRevenue) || 0), 0);
    const totalGrossSales = filteredSettlements.reduce((sum, s) => sum + (Number(s.totalGrossSales) || 0), 0);
    const totalPhysicalCash = filteredSettlements.reduce((sum, s) => sum + (Number(s.physicalCashInDrawer) || 0), 0);
    const totalBankTransfers = filteredSettlements.reduce((sum, s) => sum + (Number(s.totalBankTransfers) || 0), 0);
    const totalExpenses = filteredSettlements.reduce((sum, s) => sum + (Number(s.totalDailyExpenses) || 0), 0);
    const totalPendingDeducted = filteredSettlements.reduce((sum, s) => sum + (Number(s.deductedPendingDebt) || 0), 0);
    const totalRecoveredAdded = filteredSettlements.reduce((sum, s) => sum + (Number(s.recoveredCashAdded) || 0), 0);

    // 6. Dish Breakdown aggregation across settlements
    const dishMap = {};
    filteredSettlements.forEach(s => {
      if (s.foodAssignments) {
        Object.entries(s.foodAssignments).forEach(([dishId, qty]) => {
          if (qty > 0) {
            dishMap[dishId] = (dishMap[dishId] || 0) + Number(qty);
          }
        });
      }
    });

    return {
      totalBoxes,
      boxesFromSettlements,
      boxesFromOrders,
      totalOrdersCount,
      dayOrdersCount,
      nightOrdersCount,
      totalJuiceCups,
      inHouseJuiceCups,
      grossJuiceRevenue,
      totalBeuCups,
      totalBeuDeduction,
      beuSharePercent,
      totalFoodRevenue,
      totalGrossSales,
      totalPhysicalCash,
      totalBankTransfers,
      totalExpenses,
      totalPendingDeducted,
      totalRecoveredAdded,
      dishMap,
      settlementsCount: filteredSettlements.length
    };
  }, [filteredSettlements, filteredOrders]);

  // Action: Delete a settlement ticket
  const handleDeleteSettlement = (id) => {
    if (window.confirm('Are you sure you want to delete this shift settlement record?')) {
      const updated = settlements.filter(s => s.id !== id);
      if (onUpdateSettlements) {
        onUpdateSettlements(updated);
      } else {
        localStorage.setItem('maraki_shift_settlements', JSON.stringify(updated));
      }
    }
  };

  // Action: Export report to CSV
  const handleExportCSV = () => {
    const headers = [
      'Record ID',
      'Date (Gregorian)',
      'Date (Ethiopian)',
      'Shift',
      'Total Boxes',
      'Total Juice Cups',
      'In-House Cups',
      'beU Delivery Cups',
      'Gross Juice Sales (ETB)',
      'Food Sales (ETB)',
      'Total Gross Sales (ETB)',
      'beU Deduction (ETB)',
      'Expenses (ETB)',
      'Bank Transfers (ETB)',
      'Pending Debt (ETB)',
      'Recovered Debt (ETB)',
      'Physical Cash in Drawer (ETB)'
    ];

    const rows = filteredSettlements.map(s => [
      s.id,
      s.date,
      `"${toEthiopianDateString(s.date)}"`,
      s.shift,
      s.assignedBoxes || s.targetFoodSold || 0,
      s.juiceSold || 0,
      s.inHouseJuiceCups || 0,
      s.beuDeliveryCups || 0,
      s.grossJuiceRevenue || 0,
      s.totalFoodRevenue || 0,
      s.totalGrossSales || 0,
      s.beuDeliveryDeduction || 0,
      s.totalDailyExpenses || 0,
      s.totalBankTransfers || 0,
      s.deductedPendingDebt || 0,
      s.recoveredCashAdded || 0,
      s.physicalCashInDrawer || 0
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `maraki_income_report_${timeRange}_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Date display label
  const rangeTitle = useMemo(() => {
    if (timeRange === 'daily') {
      return `${selectedDate} (${toEthiopianDateString(selectedDate)})`;
    }
    if (timeRange === 'weekly') {
      const target = new Date(selectedDate);
      const start = new Date(target);
      start.setDate(start.getDate() - 6);
      return `${start.toISOString().split('T')[0]} to ${selectedDate} (Last 7 Days)`;
    }
    if (timeRange === 'monthly') {
      const target = new Date(selectedDate);
      return `${target.toLocaleString('en-US', { month: 'long', year: 'numeric' })} (Monthly)`;
    }
    return `${customStartDate} to ${customEndDate} (Custom Date Range)`;
  }, [timeRange, selectedDate, customStartDate, customEndDate]);

  return (
    <div className="space-y-6 text-slate-800 antialiased font-sans">
      
      {/* ============================================================== */}
      {/* 1. TOP HEADER & FILTER TOOLBAR                                  */}
      {/* ============================================================== */}
      <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-md shadow-emerald-900/5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl shadow-inner font-black">
              📈
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  Income Sheet Analysis & Shift Reports
                </h1>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Owner Audit
                </span>
              </div>
              <p className="text-xs text-slate-500 font-bold mt-0.5">
                Comprehensive tracking of Boxes, Kitchen Orders, Juice Cups, beU Deliveries & Cash Reconciliation
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {onOpenShiftReconciliation && (
            <button
              type="button"
              onClick={onOpenShiftReconciliation}
              className="px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>+ Open Shift Reconciliation</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs flex items-center gap-1.5 transition-all shadow-xs active:scale-95 border border-slate-200"
            title="Download CSV Spreadsheet"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs flex items-center gap-1.5 transition-all shadow-xs active:scale-95 border border-slate-200"
            title="Print Analysis Report"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-700" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. TIMEFRAME SELECTOR (DAILY, WEEKLY, MONTHLY, CUSTOM DATES)   */}
      {/* ============================================================== */}
      <div className="bg-white p-4 rounded-3xl border border-emerald-100 shadow-md shadow-emerald-900/5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Time Range Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setTimeRange('daily')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                timeRange === 'daily'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Daily (ቀን)</span>
            </button>

            <button
              type="button"
              onClick={() => setTimeRange('weekly')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                timeRange === 'weekly'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Weekly (ሳምንት)</span>
            </button>

            <button
              type="button"
              onClick={() => setTimeRange('monthly')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                timeRange === 'monthly'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Monthly (ወር)</span>
            </button>

            <button
              type="button"
              onClick={() => setTimeRange('custom')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                timeRange === 'custom'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Custom Date Range</span>
            </button>
          </div>

          {/* Shift Filter: All | Day | Night */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs">
            <span className="text-[11px] font-bold text-slate-500 px-2">Shift:</span>
            <button
              type="button"
              onClick={() => setShiftFilter('all')}
              className={`px-2.5 py-1 rounded-xl font-black transition-all ${
                shiftFilter === 'all'
                  ? 'bg-white text-emerald-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Shifts
            </button>
            <button
              type="button"
              onClick={() => setShiftFilter('Day')}
              className={`px-2.5 py-1 rounded-xl font-black transition-all flex items-center gap-1 ${
                shiftFilter === 'Day'
                  ? 'bg-white text-emerald-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sun className="w-3 h-3 text-amber-500" />
              <span>Day (ቀን)</span>
            </button>
            <button
              type="button"
              onClick={() => setShiftFilter('Night')}
              className={`px-2.5 py-1 rounded-xl font-black transition-all flex items-center gap-1 ${
                shiftFilter === 'Night'
                  ? 'bg-white text-emerald-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Moon className="w-3 h-3 text-indigo-500" />
              <span>Night (ማታ)</span>
            </button>
          </div>

        </div>

        {/* Sub-bar: Specific Date Pickers */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          {timeRange === 'custom' ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-500 font-bold">From:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 font-bold text-slate-800 outline-none focus:border-emerald-500"
              />
              <span className="text-slate-500 font-bold">To:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 font-bold text-slate-800 outline-none focus:border-emerald-500"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleShiftDate(-1)}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 font-bold text-slate-800 outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => handleShiftDate(1)}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 text-emerald-800 rounded-xl font-black text-[11px] border border-slate-200"
              >
                Today (ዛሬ)
              </button>
            </div>
          )}

          <div className="text-xs text-slate-500 font-bold">
            <span>Selected Period: </span>
            <strong className="text-emerald-800">{rangeTitle}</strong>
            <span className="ml-2 text-slate-400">({metrics.settlementsCount} shift settlements found)</span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. HERO KPI METRIC TILES: BOX, ORDER, CUP, beU (THE BIG 4)      */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: TOTAL BOXES */}
        <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-md shadow-emerald-900/5 space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span className="flex items-center gap-1.5">
              <Package className="w-4 h-4 text-emerald-600" />
              <span>Total Food Boxes (ቦክስ)</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
              Food Output
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {metrics.totalBoxes.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-slate-500">boxes</span>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
            <span>Food Revenue:</span>
            <strong className="text-emerald-800 font-black">{metrics.totalFoodRevenue.toLocaleString()} ETB</strong>
          </div>
        </div>

        {/* KPI 2: TOTAL ORDERS */}
        <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-md shadow-emerald-900/5 space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span className="flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-emerald-600" />
              <span>Total Orders (ትዕዛዞች)</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
              Kitchen Tickets
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {metrics.totalOrdersCount.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-slate-500">tickets</span>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
            <span>Day / Night Split:</span>
            <strong className="text-slate-700 font-black">☀️ {metrics.dayOrdersCount} • 🌙 {metrics.nightOrdersCount}</strong>
          </div>
        </div>

        {/* KPI 3: TOTAL JUICE CUPS */}
        <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-md shadow-emerald-900/5 space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span className="flex items-center gap-1.5">
              <Coffee className="w-4 h-4 text-emerald-600" />
              <span>Juice Cups Sold (ኩባያ)</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
              {DEFAULT_JUICE_PRICE} ETB / cup
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {metrics.totalJuiceCups.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-slate-500">cups</span>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
            <span>In-House vs beU:</span>
            <strong className="text-slate-700 font-black">{metrics.inHouseJuiceCups} in-house • {metrics.totalBeuCups} beU</strong>
          </div>
        </div>

        {/* KPI 4: beU DELIVERY */}
        <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-md shadow-emerald-900/5 space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span className="flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-emerald-600" />
              <span>beU Delivery (ቢዩ)</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
              {metrics.beuSharePercent}% of Juice
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {metrics.totalBeuCups.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-slate-500">cups</span>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
            <span>beU Deduction:</span>
            <strong className="text-rose-700 font-black">-{metrics.totalBeuDeduction.toLocaleString()} ETB</strong>
          </div>
        </div>

      </div>

      {/* ============================================================== */}
      {/* 4. FINANCIAL SUMMARY CARDS (RECONCILED SALES & DRAWER CASH)     */}
      {/* ============================================================== */}
      <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-emerald-700/50 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-2xl bg-white/20 text-white flex items-center justify-center text-xl shadow-inner font-black">
              💵
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                Financial Audit & Reconciled Drawer Cash Summary
              </h2>
              <p className="text-xs text-emerald-200 font-medium">
                Actual reconciled physical cash handoffs across shifts for {rangeTitle}
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-white/10 rounded-full border border-white/20 text-xs font-black text-emerald-200">
            {metrics.settlementsCount} Shifts Reconciled
          </span>
        </div>

        {/* 6 Financial Mini Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          
          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <span className="text-[10px] text-emerald-200 block font-bold">Total Gross Sales</span>
            <span className="text-base font-black text-white block mt-1">
              {metrics.totalGrossSales.toLocaleString()} <span className="text-[10px]">ETB</span>
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <span className="text-[10px] text-rose-300 block font-bold">beU Deduction</span>
            <span className="text-base font-black text-rose-200 block mt-1">
              -{metrics.totalBeuDeduction.toLocaleString()} <span className="text-[10px]">ETB</span>
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <span className="text-[10px] text-rose-300 block font-bold">Daily Expenses</span>
            <span className="text-base font-black text-rose-200 block mt-1">
              -{metrics.totalExpenses.toLocaleString()} <span className="text-[10px]">ETB</span>
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <span className="text-[10px] text-emerald-200 block font-bold">Bank Transfers</span>
            <span className="text-base font-black text-emerald-200 block mt-1">
              -{metrics.totalBankTransfers.toLocaleString()} <span className="text-[10px]">ETB</span>
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <span className="text-[10px] text-emerald-200 block font-bold">Recovered Debts</span>
            <span className="text-base font-black text-emerald-300 block mt-1">
              +{metrics.totalRecoveredAdded.toLocaleString()} <span className="text-[10px]">ETB</span>
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <span className="text-[10px] text-rose-300 block font-bold">New Pending Debts</span>
            <span className="text-base font-black text-rose-200 block mt-1">
              -{metrics.totalPendingDeducted.toLocaleString()} <span className="text-[10px]">ETB</span>
            </span>
          </div>

        </div>

        {/* Big Reconciled Drawer Cash Result */}
        <div className="bg-white/15 backdrop-blur-md rounded-2xl p-5 border border-emerald-400/30 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-200 block">
              Total Physical Cash Collected in Drawer (ጥሬ ገንዘብ ድምር):
            </span>
            <p className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-1">
              {metrics.totalPhysicalCash.toLocaleString()} <span className="text-lg text-emerald-300 font-bold">ETB</span>
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-black px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Drawer Balanced & Verified</span>
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 5. SHIFT SETTLEMENTS LEDGER (INCOME SHEETS MANAGED BY OWNER)    */}
      {/* ============================================================== */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-100 shadow-md shadow-emerald-900/5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-lg">
              📋
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900">
                Shift Reconciliation Settlements Log
              </h2>
              <p className="text-[11px] text-slate-500 font-bold">
                Daily shift records saved by cashiers — inspect breakdowns, reprint receipts, or audit drawer handoffs
              </p>
            </div>
          </div>
          <span className="text-xs font-black text-emerald-900 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
            {filteredSettlements.length} Shift Records in Period
          </span>
        </div>

        {/* Table of Settlements */}
        {filteredSettlements.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
            <p className="text-sm font-bold text-slate-700">No shift settlement records found for this period.</p>
            <p className="text-xs text-slate-400">
              Cashiers save settlements from the Daily Income Sheet module at the end of each Day or Night shift.
            </p>
            {onOpenShiftReconciliation && (
              <button
                type="button"
                onClick={onOpenShiftReconciliation}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black inline-flex items-center gap-1.5 shadow-sm mt-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Go to Daily Income Sheet</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-black text-[11px] uppercase tracking-wider bg-slate-50/80">
                  <th className="py-3 px-3">Date & Shift</th>
                  <th className="py-3 px-3">Food Boxes</th>
                  <th className="py-3 px-3">Juice Cups</th>
                  <th className="py-3 px-3">beU Delivery</th>
                  <th className="py-3 px-3">Gross Sales</th>
                  <th className="py-3 px-3">Expenses</th>
                  <th className="py-3 px-3">Bank Transfers</th>
                  <th className="py-3 px-3 text-right">Physical Cash</th>
                  <th className="py-3 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSettlements.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Date & Shift */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900">{s.date}</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          s.shift === 'Day'
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                        }`}>
                          {s.shift === 'Day' ? '☀️ Day' : '🌙 Night'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                        {toEthiopianDateString(s.date)}
                      </span>
                    </td>

                    {/* Food Boxes */}
                    <td className="py-3 px-3 font-bold text-slate-800">
                      <span>{s.assignedBoxes || s.targetFoodSold || 0} boxes</span>
                      <span className="text-[10px] text-slate-400 block font-normal">
                        ({(s.totalFoodRevenue || 0).toLocaleString()} ETB)
                      </span>
                    </td>

                    {/* Juice Cups */}
                    <td className="py-3 px-3 font-bold text-slate-800">
                      <span>{s.juiceSold || 0} cups</span>
                      <span className="text-[10px] text-slate-400 block font-normal">
                        ({(s.grossJuiceRevenue || 0).toLocaleString()} ETB)
                      </span>
                    </td>

                    {/* beU Delivery */}
                    <td className="py-3 px-3 font-bold text-slate-800">
                      <span>{s.beuDeliveryCups || 0} cups</span>
                      <span className="text-[10px] text-rose-600 block font-normal">
                        -{((s.beuDeliveryDeduction || 0)).toLocaleString()} ETB
                      </span>
                    </td>

                    {/* Gross Sales */}
                    <td className="py-3 px-3 font-black text-slate-900">
                      {(s.totalGrossSales || 0).toLocaleString()} ETB
                    </td>

                    {/* Expenses */}
                    <td className="py-3 px-3 font-bold text-rose-700">
                      -{(s.totalDailyExpenses || 0).toLocaleString()} ETB
                    </td>

                    {/* Bank Transfers */}
                    <td className="py-3 px-3 font-bold text-emerald-800">
                      -{(s.totalBankTransfers || 0).toLocaleString()} ETB
                    </td>

                    {/* Physical Cash */}
                    <td className="py-3 px-3 text-right">
                      <span className="font-black text-sm text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                        {(s.physicalCashInDrawer || 0).toLocaleString()} ETB
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setActivePrintSlip(s)}
                          className="p-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 rounded-xl transition-colors border border-slate-200"
                          title="Print Thermal Receipt Slip"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setInspectSettlement(s)}
                          className="p-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 rounded-xl transition-colors border border-slate-200"
                          title="Inspect Detailed Formula Breakdown"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSettlement(s.id)}
                          className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-colors border border-slate-200"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 6. DISH BREAKDOWN & BOX CONSUMPTION TABLE                       */}
      {/* ============================================================== */}
      {Object.keys(metrics.dishMap).length > 0 && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-100 shadow-md shadow-emerald-900/5 space-y-3">
          <div className="flex items-center justify-between border-b border-emerald-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-base">🍱</span>
              <h3 className="text-sm font-black text-slate-900">
                Itemized Food Dishes Box Consumption
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-500">
              Aggregated across {metrics.settlementsCount} shift settlements
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-1">
            {Object.entries(metrics.dishMap).map(([dishId, count]) => (
              <div key={dishId} className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-xs font-black text-slate-800 capitalize truncate block">
                  {dishId.replace(/-/g, ' ')}
                </span>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-slate-500 font-bold">Boxes:</span>
                  <span className="text-emerald-800 font-black">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: REPRINT THERMAL RECEIPT SLIP (80mm)                   */}
      {/* ============================================================== */}
      {activePrintSlip && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white text-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto font-mono text-xs">
            
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-slate-500 text-[11px]">Shift Settlement Receipt</span>
              <button 
                type="button"
                onClick={() => setActivePrintSlip(null)}
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
                <p className="text-[10px] text-slate-500">{activePrintSlip.date} • {toEthiopianDateString(activePrintSlip.date)}</p>
              </div>

              <div className="flex justify-between">
                <span>Shift:</span>
                <strong>{activePrintSlip.shift === 'Day' ? 'Day (☀️ የቀን)' : 'Night (🌙 የማታ)'}</strong>
              </div>

              <div className="flex justify-between border-t pt-1">
                <span>🥤 Juice Sales ({activePrintSlip.juiceSold} cups):</span>
                <span>{(activePrintSlip.grossJuiceRevenue || 0).toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 pl-2">
                <span>- beU Delivery ({activePrintSlip.beuDeliveryCups} cups):</span>
                <span>-{(activePrintSlip.beuDeliveryDeduction || 0).toLocaleString()} ETB</span>
              </div>

              <div className="flex justify-between border-t pt-1">
                <span>🍱 Food Sales ({activePrintSlip.assignedBoxes || activePrintSlip.targetFoodSold} boxes):</span>
                <span>{(activePrintSlip.totalFoodRevenue || 0).toLocaleString()} ETB</span>
              </div>

              <div className="flex justify-between border-t pt-1 font-black">
                <span>Total Gross Sales:</span>
                <span>{(activePrintSlip.totalGrossSales || 0).toLocaleString()} ETB</span>
              </div>

              <div className="flex justify-between text-rose-600">
                <span>- New Pending Debt:</span>
                <span>-{(activePrintSlip.deductedPendingDebt || 0).toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>+ Recovered Debt:</span>
                <span>+{(activePrintSlip.recoveredCashAdded || 0).toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>- Daily Expenses:</span>
                <span>-{(activePrintSlip.totalDailyExpenses || 0).toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between text-emerald-800">
                <span>- Bank Transfers:</span>
                <span>-{(activePrintSlip.totalBankTransfers || 0).toLocaleString()} ETB</span>
              </div>

              <div className="border-t-2 border-dashed pt-2 flex justify-between font-black text-xs text-slate-900">
                <span>💵 Physical Drawer Cash:</span>
                <span className="text-sm text-emerald-800">{(activePrintSlip.physicalCashInDrawer || 0).toLocaleString()} ETB</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="w-full py-2.5 bg-emerald-600 text-white rounded-xl font-black text-xs flex items-center justify-center gap-1.5 hover:bg-emerald-700 transition-all shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print Thermal Slip</span>
            </button>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: DETAILED SETTLEMENT INSPECTION MODAL                   */}
      {/* ============================================================== */}
      {inspectSettlement && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto text-slate-800 border border-emerald-100">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-lg">
                  🔍
                </span>
                <div>
                  <h3 className="font-black text-sm text-slate-900">Settlement Formula & Details Audit</h3>
                  <p className="text-[11px] text-slate-500 font-bold">
                    {inspectSettlement.date} • {inspectSettlement.shift} Shift
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectSettlement(null)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Formula Breakdown Cards */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-600">Gross Juice Sales ({inspectSettlement.juiceSold} cups):</span>
                <span className="font-black text-slate-900">+{(inspectSettlement.grossJuiceRevenue || 0).toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-600">Gross Food Sales ({inspectSettlement.assignedBoxes} boxes):</span>
                <span className="font-black text-slate-900">+{(inspectSettlement.totalFoodRevenue || 0).toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-rose-700">
                <span className="font-bold">beU Delivery Deduction ({inspectSettlement.beuDeliveryCups} cups):</span>
                <span className="font-black">-{(inspectSettlement.beuDeliveryDeduction || 0).toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-rose-700">
                <span className="font-bold">Daily Operating Expenses ({inspectSettlement.dailyExpenses?.length || 0} items):</span>
                <span className="font-black">-{(inspectSettlement.totalDailyExpenses || 0).toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-emerald-800">
                <span className="font-bold">Bank & Telebirr Transfers ({inspectSettlement.bankTransfers?.length || 0} transfers):</span>
                <span className="font-black">-{(inspectSettlement.totalBankTransfers || 0).toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-emerald-700">
                <span className="font-bold">Recovered Waiter Debts:</span>
                <span className="font-black">+{(inspectSettlement.recoveredCashAdded || 0).toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-rose-700">
                <span className="font-bold">New Uncollected Waiter Debt:</span>
                <span className="font-black">-{(inspectSettlement.deductedPendingDebt || 0).toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-emerald-50 border-2 border-emerald-500 text-emerald-950 font-black text-sm">
                <span>Final Drawer Cash Handoff:</span>
                <span>{(inspectSettlement.physicalCashInDrawer || 0).toLocaleString()} ETB</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectSettlement(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
