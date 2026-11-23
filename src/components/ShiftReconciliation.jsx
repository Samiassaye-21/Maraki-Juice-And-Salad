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
  X, 
  ChevronLeft, 
  ChevronRight, 
  Coffee, 
  ShoppingBag, 
  ArrowRight, 
  RefreshCw,
  Search,
  Check,
  Clock,
  Sparkles,
  TrendingUp,
  FileText
} from 'lucide-react';
import { toEthiopianDateString, toEthiopianShortDate } from './BusinessManagement';

export default function ShiftReconciliation({
  orders = [],
  waiters = [],
  foodMenu = [],
  onBackToPortal,
  onSwitchToChef,
  onSwitchToOwner
}) {
  // 1. Shift View Mode: 'all' | 'Day' | 'Night'
  const [selectedShiftFilter, setSelectedShiftFilter] = useState('all');

  // 2. Date Selection (Ethiopian / Gregorian synchronized)
  // Default: Today
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // 3. Search Filter
  const [searchQuery, setSearchQuery] = useState('');

  // 4. Stored Shift Handover Reconciliations in LocalStorage
  const [handoverRecords, setHandoverRecords] = useState(() => {
    const saved = localStorage.getItem('maraki_shift_reconciliations');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('maraki_shift_reconciliations', JSON.stringify(handoverRecords));
  }, [handoverRecords]);

  // 5. Active Modal State
  const [activeHandoverModal, setActiveHandoverModal] = useState(null); // null or { waiterName, shift }
  const [modalInputs, setModalInputs] = useState({
    cashReceived: '',
    telebirrReceived: '',
    bankReceived: '',
    receivedBy: 'አለማየሁ (Manager)',
    note: ''
  });

  // 6. Active Print Ticket Modal
  const [printSlipModal, setPrintSlipModal] = useState(null);

  // Helper: Determine if item is Juice or Food
  const isJuiceItem = (item) => {
    if (!item) return false;
    if (item.itemType === 'juice' || item.containerType === 'cup') return true;
    if (item.category === 'Juices' || item.category === 'Smoothies') return true;
    const name = (item.name || item.itemName || '').toLowerCase();
    return name.includes('ጁስ') || name.includes('juice') || name.includes('ስፕሪስ') || name.includes('spris') || name.includes('ፓንች');
  };

  // Date Navigation
  const handleShiftDate = (daysDelta) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + daysDelta);
    const yr = current.getFullYear();
    const mo = String(current.getMonth() + 1).padStart(2, '0');
    const da = String(current.getDate()).padStart(2, '0');
    setSelectedDate(`${yr}-${mo}-${da}`);
  };

  // Filter Orders for Selected Date
  const dateOrders = useMemo(() => {
    return orders.filter(order => {
      if (!order.date && !order.timestamp && !order.time) return true;
      const orderDateStr = order.date || (order.timestamp ? new Date(order.timestamp).toISOString().split('T')[0] : '');
      if (orderDateStr) return orderDateStr === selectedDate;
      return true;
    });
  }, [orders, selectedDate]);

  // Filter Orders by Shift
  const shiftOrders = useMemo(() => {
    return dateOrders.filter(order => {
      if (selectedShiftFilter === 'all') return true;
      if (selectedShiftFilter === 'Day') return order.shift === 'Day Shift' || order.shift === 'Day' || !order.shift;
      if (selectedShiftFilter === 'Night') return order.shift === 'Night Shift' || order.shift === 'Night';
      return true;
    });
  }, [dateOrders, selectedShiftFilter]);

  // Compute Volume Statistics: Juices vs Foods sold
  const volumeStats = useMemo(() => {
    let juicesCount = 0;
    let foodsCount = 0;
    let juiceRevenue = 0;
    let foodRevenue = 0;
    let cashSales = 0;
    let telebirrSales = 0;
    let totalSales = 0;

    shiftOrders.forEach(order => {
      const orderTotal = Number(order.totalAmount || order.total) || 0;
      totalSales += orderTotal;

      if (order.paymentMethod === 'Telebirr' || order.paymentMethod === 'CBE Birr') {
        telebirrSales += orderTotal;
      } else {
        cashSales += orderTotal;
      }

      const items = order.items || [];
      items.forEach(item => {
        const qty = Number(item.quantity) || 1;
        const itemPrice = (Number(item.price) || 0) * qty;

        if (isJuiceItem(item)) {
          juicesCount += qty;
          juiceRevenue += itemPrice;
        } else {
          foodsCount += qty;
          foodRevenue += itemPrice;
        }
      });
    });

    return {
      totalSales,
      cashSales,
      telebirrSales,
      juicesCount,
      foodsCount,
      juiceRevenue,
      foodRevenue,
      ordersCount: shiftOrders.length
    };
  }, [shiftOrders]);

  // Day Shift vs Night Shift Analytics
  const dayShiftStats = useMemo(() => {
    const dayOrders = dateOrders.filter(o => o.shift === 'Day Shift' || o.shift === 'Day' || !o.shift);
    let juices = 0;
    let foods = 0;
    let revenue = 0;
    const waitersSet = new Set();

    dayOrders.forEach(o => {
      revenue += Number(o.totalAmount || o.total) || 0;
      if (o.waiterName) waitersSet.add(o.waiterName);
      (o.items || []).forEach(it => {
        const q = Number(it.quantity) || 1;
        if (isJuiceItem(it)) juices += q;
        else foods += q;
      });
    });

    return { orders: dayOrders.length, revenue, juices, foods, waitersCount: waitersSet.size };
  }, [dateOrders]);

  const nightShiftStats = useMemo(() => {
    const nightOrders = dateOrders.filter(o => o.shift === 'Night Shift' || o.shift === 'Night');
    let juices = 0;
    let foods = 0;
    let revenue = 0;
    const waitersSet = new Set();

    nightOrders.forEach(o => {
      revenue += Number(o.totalAmount || o.total) || 0;
      if (o.waiterName) waitersSet.add(o.waiterName);
      (o.items || []).forEach(it => {
        const q = Number(it.quantity) || 1;
        if (isJuiceItem(it)) juices += q;
        else foods += q;
      });
    });

    return { orders: nightOrders.length, revenue, juices, foods, waitersCount: waitersSet.size };
  }, [dateOrders]);

  // Waiter-by-Waiter Aggregations
  const waiterLedger = useMemo(() => {
    // Unique list of waiters who have orders or are in the waiters roster
    const waiterMap = new Map();

    // Initialize from roster
    waiters.forEach(w => {
      const name = w.fullName || w.amharic || w.name;
      waiterMap.set(name, {
        waiterName: name,
        emoji: w.emoji || '👨‍🍳',
        dayOrders: [],
        nightOrders: []
      });
    });

    // Populate with actual orders for selectedDate
    dateOrders.forEach(o => {
      const wName = o.waiterName || 'ያልተገለጸ (General)';
      if (!waiterMap.has(wName)) {
        waiterMap.set(wName, {
          waiterName: wName,
          emoji: '👨‍🍳',
          dayOrders: [],
          nightOrders: []
        });
      }
      const entry = waiterMap.get(wName);
      if (o.shift === 'Night Shift' || o.shift === 'Night') {
        entry.nightOrders.push(o);
      } else {
        entry.dayOrders.push(o);
      }
    });

    // Generate row entries for each waiter and shift
    const rows = [];
    waiterMap.forEach((data, name) => {
      // Day Shift Row
      if (selectedShiftFilter === 'all' || selectedShiftFilter === 'Day') {
        const dOrders = data.dayOrders;
        if (dOrders.length > 0 || selectedShiftFilter === 'Day') {
          rows.push(buildWaiterShiftRow(data.waiterName, data.emoji, 'Day Shift', dOrders));
        }
      }

      // Night Shift Row
      if (selectedShiftFilter === 'all' || selectedShiftFilter === 'Night') {
        const nOrders = data.nightOrders;
        if (nOrders.length > 0 || selectedShiftFilter === 'Night') {
          rows.push(buildWaiterShiftRow(data.waiterName, data.emoji, 'Night Shift', nOrders));
        }
      }
    });

    return rows.filter(r => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return r.waiterName.toLowerCase().includes(q) || r.shift.toLowerCase().includes(q);
    });
  }, [waiters, dateOrders, selectedShiftFilter, searchQuery, handoverRecords, selectedDate]);

  function buildWaiterShiftRow(waiterName, emoji, shift, shiftOrdersList) {
    let expectedSales = 0;
    let expectedCash = 0;
    let expectedTelebirr = 0;
    let juicesSold = 0;
    let foodsSold = 0;

    shiftOrdersList.forEach(order => {
      const amt = Number(order.totalAmount || order.total) || 0;
      expectedSales += amt;
      if (order.paymentMethod === 'Telebirr' || order.paymentMethod === 'CBE Birr') {
        expectedTelebirr += amt;
      } else {
        expectedCash += amt;
      }

      (order.items || []).forEach(it => {
        const q = Number(it.quantity) || 1;
        if (isJuiceItem(it)) juicesSold += q;
        else foodsSold += q;
      });
    });

    // Check if handover was already recorded for this waiter on this date & shift
    const recordId = `${selectedDate}_${shift}_${waiterName}`;
    const handover = handoverRecords.find(r => r.id === recordId);

    const receivedCash = handover ? Number(handover.cashReceived || 0) : 0;
    const receivedTelebirr = handover ? Number(handover.telebirrReceived || 0) : 0;
    const receivedBank = handover ? Number(handover.bankReceived || 0) : 0;
    const totalReceived = receivedCash + receivedTelebirr + receivedBank;

    const isReconciled = Boolean(handover);
    const variance = isReconciled ? totalReceived - expectedSales : 0;

    return {
      recordId,
      waiterName,
      emoji,
      shift,
      ordersCount: shiftOrdersList.length,
      juicesSold,
      foodsSold,
      expectedSales,
      expectedCash,
      expectedTelebirr,
      receivedCash,
      receivedTelebirr,
      receivedBank,
      totalReceived,
      variance,
      isReconciled,
      reconciledAt: handover?.timestamp,
      receivedBy: handover?.receivedBy,
      note: handover?.note
    };
  }

  // Open Handover Modal for a specific row
  const handleOpenHandoverModal = (row) => {
    setActiveHandoverModal(row);
    setModalInputs({
      cashReceived: row.isReconciled ? row.receivedCash.toString() : row.expectedCash.toString(),
      telebirrReceived: row.isReconciled ? row.receivedTelebirr.toString() : row.expectedTelebirr.toString(),
      bankReceived: row.isReconciled ? row.receivedBank.toString() : '0',
      receivedBy: row.receivedBy || 'አለማየሁ (Manager)',
      note: row.note || ''
    });
  };

  // Save Handover Submission
  const handleSaveHandover = (e) => {
    e.preventDefault();
    if (!activeHandoverModal) return;

    const cash = Number(modalInputs.cashReceived) || 0;
    const telebirr = Number(modalInputs.telebirrReceived) || 0;
    const bank = Number(modalInputs.bankReceived) || 0;

    const newRecord = {
      id: activeHandoverModal.recordId,
      date: selectedDate,
      shift: activeHandoverModal.shift,
      waiterName: activeHandoverModal.waiterName,
      expectedSales: activeHandoverModal.expectedSales,
      expectedCash: activeHandoverModal.expectedCash,
      expectedTelebirr: activeHandoverModal.expectedTelebirr,
      cashReceived: cash,
      telebirrReceived: telebirr,
      bankReceived: bank,
      totalReceived: cash + telebirr + bank,
      variance: (cash + telebirr + bank) - activeHandoverModal.expectedSales,
      receivedBy: modalInputs.receivedBy || 'አለማየሁ (Manager)',
      note: modalInputs.note || '',
      timestamp: new Date().toISOString()
    };

    setHandoverRecords(prev => {
      const filtered = prev.filter(r => r.id !== activeHandoverModal.recordId);
      return [newRecord, ...filtered];
    });

    setActiveHandoverModal(null);
  };

  // Total Handover Received & Net Variance for the Day/Shift
  const totalReceivedForView = useMemo(() => {
    return waiterLedger.reduce((sum, r) => sum + (r.isReconciled ? r.totalReceived : 0), 0);
  }, [waiterLedger]);

  const totalVarianceForView = useMemo(() => {
    return waiterLedger.reduce((sum, r) => sum + (r.isReconciled ? r.variance : 0), 0);
  }, [waiterLedger]);

  // Export Shift Reconciliation to CSV
  const handleExportCSV = () => {
    const headers = "ቀን,ፈረቃ,አስተናጋጅ,የትዕዛዝ ብዛት,የተሸጠ ጁስ,የተሸጠ ምግብ,የሚጠበቅ ሽያጭ (ETB),የተረከቡት ጥሬ ገንዘብ (ETB),የተረከቡት ቴሌብር (ETB),ጠቅላላ የተረከቡት (ETB),ልዩነት (ETB),ሁኔታ,ተረካቢ\n";
    const rows = waiterLedger.map(r => 
      `"${selectedDate}","${r.shift}","${r.waiterName}",${r.ordersCount},${r.juicesSold},${r.foodsSold},${r.expectedSales},${r.receivedCash},${r.receivedTelebirr},${r.totalReceived},${r.variance},"${r.isReconciled ? 'Reconciled' : 'Pending'}","${r.receivedBy || ''}"`
    ).join("\n");

    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + headers + rows);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `maraki_shift_reconciliation_${selectedDate}_${selectedShiftFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-white">
      
      {/* ============================================================== */}
      {/* 1. TOP HEADER & NAVIGATION BAR                                 */}
      {/* ============================================================== */}
      <header className="bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 sticky top-0 z-30 px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-lg shadow-black/20">
        
        {/* Brand & Station Identity */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg shadow-amber-500/20">
            📋
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-white tracking-tight">
                MARAKI <span className="text-amber-400">SHIFT RECONCILIATION</span>
              </h1>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20">
                የፈረቃ መዝገብ
              </span>
            </div>
            <p className="text-[11px] font-bold text-slate-400">
              የአስተናጋጆች የገንዘብ ርክክብ፣ የቀንና የማታ ፈረቃ የተሸጡ ጁሶችና ምግቦች መቆጣጠሪያ
            </p>
          </div>
        </div>

        {/* Top Controls: System Switches & Portal Back */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={onSwitchToChef}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all border border-slate-700"
            title="ወደ ሼፍ ኩሽና ሲስተም ቀይር"
          >
            <span>👩‍🍳 Chef POS</span>
          </button>

          <button
            type="button"
            onClick={onSwitchToOwner}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all border border-slate-700"
            title="ወደ ባለቤት ማዕከል ቀይር"
          >
            <span>👑 Owner Center</span>
          </button>

          <button
            type="button"
            onClick={onBackToPortal}
            className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-black text-xs flex items-center gap-1.5 transition-all border border-amber-500/30 active:scale-95"
            title="ወደ ዋናው ፖርታል ተመለስ"
          >
            <span>← ዋና ፖርታል (Portal)</span>
          </button>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. SUB-HEADER: DATE NAVIGATOR & SHIFT SELECTOR                 */}
      {/* ============================================================== */}
      <section className="bg-slate-950/40 border-b border-slate-800/60 px-4 sm:px-6 py-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Date Selector with Ethiopian Date Display */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-800/80 rounded-2xl p-1 border border-slate-700/80 shadow-inner">
            <button
              type="button"
              onClick={() => handleShiftDate(-1)}
              className="p-1.5 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all"
              title="ያለፈው ቀን"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="px-3 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-black text-white">
                {toEthiopianDateString(selectedDate)}
              </span>
              <span className="text-[10px] text-slate-400 font-bold">
                ({selectedDate})
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleShiftDate(1)}
              className="p-1.5 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all"
              title="ቀጣይ ቀን"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all border border-slate-700"
          >
            ዛሬ (Today)
          </button>
        </div>

        {/* Shift Filter Tabs: All / Day / Night */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-black uppercase text-slate-400 mr-1">ፈረቃ:</span>
          {[
            { id: 'all', label: '🌟 ሙሉ ቀን (Full Day)', icon: Sparkles },
            { id: 'Day', label: '☀️ የቀን ፈረቃ (Day Shift)', icon: Sun },
            { id: 'Night', label: '🌙 የማታ ፈረቃ (Night Shift)', icon: Moon }
          ].map(shift => {
            const Icon = shift.icon;
            const active = selectedShiftFilter === shift.id;
            return (
              <button
                key={shift.id}
                type="button"
                onClick={() => setSelectedShiftFilter(shift.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                  active 
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 scale-[1.02]' 
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-slate-950' : 'text-amber-400'}`} />
                <span>{shift.label}</span>
              </button>
            );
          })}

          <div className="h-5 w-[1px] bg-slate-700 mx-1 hidden sm:block" />

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-black flex items-center gap-1 transition-all active:scale-95"
            title="የፈረቃውን መረጃ በኤክሴል አውርድ"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>CSV አውርድ</span>
          </button>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. MAIN CONTENT WORKSPACE                                      */}
      {/* ============================================================== */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
        
        {/* 4 HERO KPI CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Total Shift Sales */}
          <div className="bg-slate-950 rounded-3xl p-5 border border-slate-800 shadow-md shadow-black/20 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">ጠቅላላ የፈረቃ ሽያጭ (SALES)</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
              {volumeStats.totalSales.toLocaleString()} <span className="text-xs font-bold text-slate-400">ETB</span>
            </p>
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold pt-1 border-t border-slate-800/80">
              <span>💵 ጥሬ: {volumeStats.cashSales.toLocaleString()}</span>
              <span>📱 ቴሌብር: {volumeStats.telebirrSales.toLocaleString()}</span>
            </div>
          </div>

          {/* Card 2: Juices Sold */}
          <div className="bg-slate-950 rounded-3xl p-5 border border-slate-800 shadow-md shadow-black/20 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-black uppercase tracking-wider text-cyan-300">የተሸጡ ጁሶች (JUICES SOLD)</span>
              <span className="text-lg">🥤</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-cyan-300 tracking-tight">
              {volumeStats.juicesCount} <span className="text-xs font-bold text-slate-400">ኩባያ ጁስ</span>
            </p>
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold pt-1 border-t border-slate-800/80">
              <span>ገቢ: {volumeStats.juiceRevenue.toLocaleString()} ETB</span>
              <span className="text-cyan-400">
                {volumeStats.totalSales > 0 ? Math.round((volumeStats.juiceRevenue / volumeStats.totalSales) * 100) : 0}% የሽያጭ ድርሻ
              </span>
            </div>
          </div>

          {/* Card 3: Foods Sold */}
          <div className="bg-slate-950 rounded-3xl p-5 border border-slate-800 shadow-md shadow-black/20 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-300">የተሸጡ ምግቦች (FOODS SOLD)</span>
              <span className="text-lg">🥗</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-amber-300 tracking-tight">
              {volumeStats.foodsCount} <span className="text-xs font-bold text-slate-400">ሳህን ምግብ</span>
            </p>
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold pt-1 border-t border-slate-800/80">
              <span>ገቢ: {volumeStats.foodRevenue.toLocaleString()} ETB</span>
              <span className="text-amber-400">
                {volumeStats.totalSales > 0 ? Math.round((volumeStats.foodRevenue / volumeStats.totalSales) * 100) : 0}% የሽያጭ ድርሻ
              </span>
            </div>
          </div>

          {/* Card 4: Handed-over Received & Net Variance */}
          <div className="bg-slate-950 rounded-3xl p-5 border border-slate-800 shadow-md shadow-black/20 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-black uppercase tracking-wider text-purple-300">የተረከቡት ገንዘብ (RECEIVED)</span>
              <ClipboardCheck className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-purple-300 tracking-tight">
              {totalReceivedForView.toLocaleString()} <span className="text-xs font-bold text-slate-400">ETB</span>
            </p>
            <div className="flex items-center justify-between text-[11px] font-black pt-1 border-t border-slate-800/80">
              <span className="text-slate-400">ልዩነት:</span>
              <span className={totalVarianceForView === 0 ? 'text-emerald-400' : totalVarianceForView < 0 ? 'text-rose-400' : 'text-cyan-400'}>
                {totalVarianceForView === 0 ? '✓ ተመጣጥኗል (Balanced)' : `${totalVarianceForView > 0 ? '+' : ''}${totalVarianceForView.toLocaleString()} ETB`}
              </span>
            </div>
          </div>

        </div>

        {/* DAY SHIFT vs NIGHT SHIFT COMPARISON WIDGET */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Day Shift Box */}
          <div className={`p-5 rounded-3xl border transition-all ${
            selectedShiftFilter === 'Day' 
              ? 'bg-amber-950/30 border-amber-500/50 ring-2 ring-amber-500/20' 
              : 'bg-slate-950 border-slate-800'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold text-sm">
                  ☀️
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">የቀን ፈረቃ (Day Shift)</h3>
                  <p className="text-[10px] text-slate-400 font-bold">08:00 AM - 04:00 PM (ከሰዓት በፊትና ምሳ)</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-500/10 text-amber-300 border border-amber-500/20">
                {dayShiftStats.revenue.toLocaleString()} ETB
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-3 text-center">
              <div className="bg-slate-900/80 rounded-2xl p-2.5 border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 block">ትዕዛዞች</span>
                <span className="text-base font-black text-white">{dayShiftStats.orders}</span>
              </div>
              <div className="bg-slate-900/80 rounded-2xl p-2.5 border border-slate-800">
                <span className="text-[10px] font-bold text-cyan-400 block">🥤 የተሸጡ ጁሶች</span>
                <span className="text-base font-black text-cyan-300">{dayShiftStats.juices}</span>
              </div>
              <div className="bg-slate-900/80 rounded-2xl p-2.5 border border-slate-800">
                <span className="text-[10px] font-bold text-amber-400 block">🥗 የተሸጡ ምግቦች</span>
                <span className="text-base font-black text-amber-300">{dayShiftStats.foods}</span>
              </div>
            </div>
          </div>

          {/* Night Shift Box */}
          <div className={`p-5 rounded-3xl border transition-all ${
            selectedShiftFilter === 'Night' 
              ? 'bg-indigo-950/30 border-indigo-500/50 ring-2 ring-indigo-500/20' 
              : 'bg-slate-950 border-slate-800'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold text-sm">
                  🌙
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">የማታ ፈረቃ (Night Shift)</h3>
                  <p className="text-[10px] text-slate-400 font-bold">04:00 PM - 10:00 PM (ከምሽት በኋላና እራት)</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                {nightShiftStats.revenue.toLocaleString()} ETB
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-3 text-center">
              <div className="bg-slate-900/80 rounded-2xl p-2.5 border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 block">ትዕዛዞች</span>
                <span className="text-base font-black text-white">{nightShiftStats.orders}</span>
              </div>
              <div className="bg-slate-900/80 rounded-2xl p-2.5 border border-slate-800">
                <span className="text-[10px] font-bold text-cyan-400 block">🥤 የተሸጡ ጁሶች</span>
                <span className="text-base font-black text-cyan-300">{nightShiftStats.juices}</span>
              </div>
              <div className="bg-slate-900/80 rounded-2xl p-2.5 border border-slate-800">
                <span className="text-[10px] font-bold text-amber-400 block">🥗 የተሸጡ ምግቦች</span>
                <span className="text-base font-black text-amber-300">{nightShiftStats.foods}</span>
              </div>
            </div>
          </div>

        </div>

        {/* WAITER-BY-WAITER SHIFT RECONCILIATION TABLE */}
        <div className="bg-slate-950 rounded-3xl border border-slate-800 shadow-xl shadow-black/20 overflow-hidden space-y-4 p-5">
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
            <div>
              <h3 className="font-black text-base text-white flex items-center gap-2">
                <span>የአስተናጋጆች የገንዘብ ርክክብ ዝርዝር (Waiters Handover Ledger)</span>
              </h3>
              <p className="text-xs text-slate-400 font-bold mt-0.5">
                እያንዳንዱ አስተናጋጅ በፈረቃው የሸጠው ጁስና ምግብ፣ የሚጠበቅ ገቢና በእጅ ያስረከበው ጥሬ ገንዘብ
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="አስተናጋጅ ፈልግ / Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-3 py-2 text-xs font-bold text-slate-200 placeholder-slate-500 outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 font-black border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">አስተናጋጅ (Waiter)</th>
                  <th className="py-3 px-4">ፈረቃ (Shift)</th>
                  <th className="py-3 px-4 text-center">የተሸጠ ጁስ (Juices)</th>
                  <th className="py-3 px-4 text-center">የተሸጠ ምግብ (Foods)</th>
                  <th className="py-3 px-4">የሚጠበቅ ሽያጭ (Expected)</th>
                  <th className="py-3 px-4">የተረከቡት ገንዘብ (Handed Over)</th>
                  <th className="py-3 px-4">ልዩነት (Variance)</th>
                  <th className="py-3 px-4">ሁኔታ (Status)</th>
                  <th className="py-3 px-4 text-right">እርምጃ (Action)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-bold text-slate-300">
                {waiterLedger.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <div className="w-12 h-12 rounded-2xl bg-slate-900 text-slate-500 flex items-center justify-center mx-auto mb-2 border border-slate-800">
                        <CheckCircle2 className="w-6 h-6 text-amber-400" />
                      </div>
                      <p className="font-black text-sm text-slate-200">ለዚህ ቀን ወይም ፈረቃ የተመዘገበ ሽያጭ የለም</p>
                      <p className="text-xs text-slate-500 mt-0.5">በኩሽና ፖስ ውስጥ ትዕዛዞች ሲመዘገቡ እዚህ በራስ-ሰር ይደረደራሉ።</p>
                    </td>
                  </tr>
                ) : (
                  waiterLedger.map((row) => {
                    const isShortage = row.variance < 0;
                    const isSurplus = row.variance > 0;
                    return (
                      <tr key={row.recordId} className="hover:bg-slate-900/50 transition-colors">
                        
                        {/* Waiter Name */}
                        <td className="py-3.5 px-4 font-black text-white whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{row.emoji}</span>
                            <span>{row.waiterName}</span>
                          </div>
                        </td>

                        {/* Shift Badge */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            row.shift.includes('Day') 
                              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' 
                              : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                          }`}>
                            {row.shift.includes('Day') ? '☀️ የቀን ፈረቃ' : '🌙 የማታ ፈረቃ'}
                          </span>
                        </td>

                        {/* Juices Sold */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2.5 py-1 rounded-xl bg-cyan-950/60 text-cyan-300 border border-cyan-800/40 text-xs font-black inline-flex items-center gap-1">
                            <span>🥤</span>
                            <span>{row.juicesSold}</span>
                          </span>
                        </td>

                        {/* Foods Sold */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2.5 py-1 rounded-xl bg-amber-950/60 text-amber-300 border border-amber-800/40 text-xs font-black inline-flex items-center gap-1">
                            <span>🥗</span>
                            <span>{row.foodsSold}</span>
                          </span>
                        </td>

                        {/* Expected Sales */}
                        <td className="py-3.5 px-4 font-black text-white whitespace-nowrap">
                          <div>
                            <span>{row.expectedSales.toLocaleString()} ETB</span>
                            <span className="text-[10px] text-slate-500 block font-normal">
                              ({row.ordersCount} ትዕዛዞች)
                            </span>
                          </div>
                        </td>

                        {/* Handed Over Cash */}
                        <td className="py-3.5 px-4 font-black text-slate-200 whitespace-nowrap">
                          {row.isReconciled ? (
                            <div>
                              <span className="text-emerald-400">{row.totalReceived.toLocaleString()} ETB</span>
                              <span className="text-[9px] text-slate-500 block font-normal">
                                ጥሬ: {row.receivedCash} · ቴሌ: {row.receivedTelebirr}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500 font-bold">እስካሁን አልተረከበም</span>
                          )}
                        </td>

                        {/* Variance */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {row.isReconciled ? (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
                              isShortage 
                                ? 'bg-rose-950/60 text-rose-400 border border-rose-800/60' 
                                : isSurplus 
                                ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/60'
                                : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                            }`}>
                              {row.variance === 0 ? '✓ ተመጣጥኗል' : `${row.variance > 0 ? '+' : ''}${row.variance.toLocaleString()} ETB`}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-600 font-bold">—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            row.isReconciled 
                              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' 
                              : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                          }`}>
                            {row.isReconciled ? '✅ ርክክብ ተጠናቋል' : '⏳ ርክክብ ይጠብቃል'}
                          </span>
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenHandoverModal(row)}
                              className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all active:scale-95 flex items-center gap-1 ${
                                row.isReconciled 
                                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700' 
                                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                              }`}
                            >
                              <ClipboardCheck className="w-3.5 h-3.5" />
                              <span>{row.isReconciled ? 'አስተካክል (Edit)' : 'ርክክብ መዝግብ (Reconcile)'}</span>
                            </button>

                            {row.isReconciled && (
                              <button
                                type="button"
                                onClick={() => setPrintSlipModal(row)}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all border border-slate-700"
                                title="የፈረቃ ደረሰኝ አትም"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>

      </main>

      {/* ============================================================== */}
      {/* 4. MODAL: SHIFT HANDOVER & CASH RECONCILIATION SHEET           */}
      {/* ============================================================== */}
      {activeHandoverModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-950 rounded-3xl p-6 max-w-lg w-full border border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center text-lg">
                  📋
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">የፈረቃ ገንዘብ ርክክብ ማረጋገጫ (Shift Handover)</h3>
                  <p className="text-[11px] text-slate-400 font-bold">
                    {activeHandoverModal.waiterName} • {activeHandoverModal.shift === 'Day Shift' ? '☀️ የቀን ፈረቃ' : '🌙 የማታ ፈረቃ'}
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setActiveHandoverModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Expected Summary Banner */}
            <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                በሲስተም የተመዘገበ ሽያጭ (Expected From POS):
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-white">{activeHandoverModal.expectedSales.toLocaleString()} ETB</span>
                <span className="text-xs font-bold text-slate-400">({activeHandoverModal.ordersCount} ትዕዛዞች)</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs text-slate-300 font-bold">
                <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-cyan-400 block font-normal">🥤 የተሸጠ ጁስ</span>
                  <span className="font-black text-cyan-300">{activeHandoverModal.juicesSold} ጁሶች</span>
                </div>
                <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-amber-400 block font-normal">🥗 የተሸጠ ምግብ</span>
                  <span className="font-black text-amber-300">{activeHandoverModal.foodsSold} ምግቦች</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveHandover} className="space-y-3.5 text-xs">
              
              {/* Cash Received Input */}
              <div>
                <label className="font-black text-slate-300 block mb-1">
                  💵 በእጅ የተረከቡት ጥሬ ገንዘብ (Cash Handed Over ETB):
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={modalInputs.cashReceived}
                  onChange={(e) => setModalInputs(p => ({ ...p, cashReceived: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-sm font-black text-emerald-400 outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="0.00"
                />
              </div>

              {/* Telebirr Received Input */}
              <div>
                <label className="font-black text-slate-300 block mb-1">
                  📱 የተረጋገጠ የቴሌብር ክፍያ (Telebirr Verified ETB):
                </label>
                <input
                  type="number"
                  step="any"
                  value={modalInputs.telebirrReceived}
                  onChange={(e) => setModalInputs(p => ({ ...p, telebirrReceived: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-3.5 py-2 text-xs font-bold text-slate-200 outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="0.00"
                />
              </div>

              {/* Bank Received Input */}
              <div>
                <label className="font-black text-slate-300 block mb-1">
                  🏦 የተረጋገጠ የባንክ / CBE Birr (Bank Transfer ETB):
                </label>
                <input
                  type="number"
                  step="any"
                  value={modalInputs.bankReceived}
                  onChange={(e) => setModalInputs(p => ({ ...p, bankReceived: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-3.5 py-2 text-xs font-bold text-slate-200 outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="0.00"
                />
              </div>

              {/* Dynamic Variance Calculation Card */}
              {(() => {
                const enteredTotal = (Number(modalInputs.cashReceived) || 0) + (Number(modalInputs.telebirrReceived) || 0) + (Number(modalInputs.bankReceived) || 0);
                const variance = enteredTotal - activeHandoverModal.expectedSales;
                const isShortage = variance < 0;
                const isSurplus = variance > 0;
                return (
                  <div className={`p-3 rounded-2xl border flex items-center justify-between font-black ${
                    variance === 0 
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
                      : isShortage 
                      ? 'bg-rose-950/40 border-rose-500/40 text-rose-300' 
                      : 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300'
                  }`}>
                    <div>
                      <span className="text-[10px] font-bold block text-slate-400">የተረከቡት ጠቅላላ: {enteredTotal.toLocaleString()} ETB</span>
                      <span className="text-xs">
                        {variance === 0 ? '✓ ሙሉ በሙሉ ተመጣጥኗል (Exact Balance)' : isShortage ? '⚠️ ጉድለት ተገኝቷል (Shortage)' : '🟢 ትርፍ ተገኝቷል (Surplus)'}
                      </span>
                    </div>
                    <span className="text-base">
                      {variance === 0 ? '0 ETB' : `${variance > 0 ? '+' : ''}${variance.toLocaleString()} ETB`}
                    </span>
                  </div>
                );
              })()}

              {/* Notes Input */}
              <div>
                <label className="font-black text-slate-400 block mb-1">
                  የፈረቃው ማስታወሻ / አስተያየት (Notes / Observations):
                </label>
                <input
                  type="text"
                  value={modalInputs.note}
                  onChange={(e) => setModalInputs(p => ({ ...p, note: e.target.value }))}
                  placeholder="ለምሳሌ፡ 50 ብር ቅናሽ ተደርጎለት ነበር..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-3.5 py-2 text-xs font-bold text-slate-200 outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Received By */}
              <div>
                <label className="font-black text-slate-400 block mb-1">
                  ተረካቢ አስተዳዳሪ (Received By):
                </label>
                <input
                  type="text"
                  value={modalInputs.receivedBy}
                  onChange={(e) => setModalInputs(p => ({ ...p, receivedBy: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-3.5 py-2 text-xs font-bold text-slate-200 outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveHandoverModal(null)}
                  className="w-1/3 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-2xl transition-all"
                >
                  ሰርዝ (Cancel)
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-2xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                >
                  ✓ ርክክቡን አረጋግጥና መዝግብ
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. MODAL: THERMAL TICKET PRINT PREVIEW                         */}
      {/* ============================================================== */}
      {printSlipModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white text-slate-950 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="font-black text-xs text-slate-800">የፈረቃ ርክክብ ደረሰኝ (Shift Ticket)</h4>
              <button 
                type="button" 
                onClick={() => setPrintSlipModal(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Simulated Thermal Ticket */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-300 font-mono text-[11px] space-y-2 text-slate-900">
              <div className="text-center pb-2 border-b border-slate-300">
                <h2 className="font-black text-sm">MARAKI JUICE & SALAD</h2>
                <p className="text-[10px] text-slate-500">SHIFT RECONCILIATION SLIP</p>
                <p className="text-[9px] text-slate-400 mt-1">{toEthiopianDateString(selectedDate)}</p>
              </div>

              <div className="space-y-0.5">
                <div className="flex justify-between">
                  <span>ፈረቃ (Shift):</span>
                  <span className="font-bold">{printSlipModal.shift}</span>
                </div>
                <div className="flex justify-between">
                  <span>አስተናጋጅ (Waiter):</span>
                  <span className="font-bold">{printSlipModal.waiterName}</span>
                </div>
                <div className="flex justify-between">
                  <span>ትዕዛዞች (Orders):</span>
                  <span className="font-bold">{printSlipModal.ordersCount}</span>
                </div>
              </div>

              <div className="pt-1.5 border-t border-slate-300 space-y-0.5">
                <div className="flex justify-between">
                  <span>🥤 የተሸጡ ጁሶች:</span>
                  <span className="font-bold">{printSlipModal.juicesSold}</span>
                </div>
                <div className="flex justify-between">
                  <span>🥗 የተሸጡ ምግቦች:</span>
                  <span className="font-bold">{printSlipModal.foodsSold}</span>
                </div>
              </div>

              <div className="pt-1.5 border-t border-slate-300 space-y-0.5 font-bold">
                <div className="flex justify-between">
                  <span>የሚጠበቅ ሽያጭ:</span>
                  <span>{printSlipModal.expectedSales.toLocaleString()} ETB</span>
                </div>
                <div className="flex justify-between text-emerald-800">
                  <span>የተረከቡት ጥሬ ገንዘብ:</span>
                  <span>{printSlipModal.receivedCash.toLocaleString()} ETB</span>
                </div>
                <div className="flex justify-between text-emerald-800">
                  <span>የተረከቡት ቴሌብር:</span>
                  <span>{printSlipModal.receivedTelebirr.toLocaleString()} ETB</span>
                </div>
                <div className="flex justify-between text-slate-900 pt-1 border-t border-slate-200">
                  <span>ጠቅላላ የተረከቡት:</span>
                  <span>{printSlipModal.totalReceived.toLocaleString()} ETB</span>
                </div>
                <div className="flex justify-between text-rose-800">
                  <span>ልዩነት (Variance):</span>
                  <span>{printSlipModal.variance === 0 ? '0.00 (ተመጣጥኗል)' : `${printSlipModal.variance} ETB`}</span>
                </div>
              </div>

              {printSlipModal.note && (
                <div className="pt-1 border-t border-slate-200 text-[9px] text-slate-500 italic">
                  ማስታወሻ፡ {printSlipModal.note}
                </div>
              )}

              <div className="pt-3 border-t border-dashed border-slate-300 flex justify-between text-[9px] text-slate-400">
                <div className="text-center">
                  <span>አስረካቢ ፊርማ</span>
                  <div className="mt-4 border-t border-slate-400 w-16" />
                </div>
                <div className="text-center">
                  <span>ተረካቢ ፊርማ</span>
                  <div className="mt-4 border-t border-slate-400 w-16" />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="w-full py-2.5 bg-slate-950 text-white font-black text-xs rounded-2xl flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>ደረሰኙን አትም (Print Receipt)</span>
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
