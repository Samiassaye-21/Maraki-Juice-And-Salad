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
  TrendingUp,
  Filter,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  Sun,
  Moon,
  X,
  FileText,
  Plus,
  AlertTriangle,
  BellRing,
  Copy,
  Check,
  Wallet,
  CreditCard,
  Users,
  CalendarDays
} from 'lucide-react';
import { toEthiopianDateString, toEthiopianShortDate } from './BusinessManagement';
import { DEFAULT_JUICE_PRICE, DEFAULT_RECONCILIATION_DISHES } from './ShiftReconciliation';
import {
  getOrderIsoDate,
  getOrderShift,
  isDateInRange,
  toLocalIsoDate,
  aggregateChefOrders,
  compareChefVsIncomeSheet,
  computePackagingAudit
} from '../utils/reconciliationHelpers';

const DISH_LOOKUP = DEFAULT_RECONCILIATION_DISHES.reduce((acc, d) => {
  acc[d.id] = d;
  return acc;
}, {});

export default function OwnerIncomeAnalysisReport({
  settlements = [],
  orders = [],
  waiters = [],
  foodMenu = [],
  standardJuicePrice,
  onOpenShiftReconciliation,
  onUpdateSettlements,
  ordersAuditContent = null,
  initialSubView = 'overview'
}) {
  const effectiveJuicePrice = useMemo(() => {
    if (standardJuicePrice && Number(standardJuicePrice) > 0) return Number(standardJuicePrice);
    const saved = Number(localStorage.getItem('maraki_standard_juice_price'));
    return saved > 0 ? saved : DEFAULT_JUICE_PRICE;
  }, [standardJuicePrice]);

  const effectiveDishesList = useMemo(() => {
    const map = new Map();
    DEFAULT_RECONCILIATION_DISHES.forEach(d => map.set(d.id, d));
    let resolvedMenu = Array.isArray(foodMenu) && foodMenu.length > 0 ? foodMenu : [];
    if (resolvedMenu.length === 0) {
      try {
        const saved = localStorage.getItem('maraki_chef_food_menu_v2');
        if (saved) resolvedMenu = JSON.parse(saved);
      } catch (e) {}
    }
    resolvedMenu.forEach(item => {
      map.set(item.id, {
        id: item.id,
        name: item.name,
        englishName: item.englishName || item.name,
        category: item.category || 'Other',
        price: Number(item.price || 0)
      });
    });
    return Array.from(map.values());
  }, [foodMenu]);

  const dynamicDishLookup = useMemo(() => {
    return effectiveDishesList.reduce((acc, d) => {
      acc[d.id] = d;
      return acc;
    }, {});
  }, [effectiveDishesList]);
  // Time period filter: 'daily' | 'weekly' | 'monthly' | 'custom'
  const [timeRange, setTimeRange] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(() => toLocalIsoDate(new Date()));
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return toLocalIsoDate(d);
  });
  const [customEndDate, setCustomEndDate] = useState(() => toLocalIsoDate(new Date()));
  const [shiftFilter, setShiftFilter] = useState('all'); // 'all' | 'Day' | 'Night'

  // Separated deep-dive view tabs
  const [subView, setSubView] = useState(initialSubView); // 'overview' | 'cups_beu' | 'food' | 'expenses' | 'pending' | 'settlements' | 'orders'
  const [showCalendarGrid, setShowCalendarGrid] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => selectedDate.slice(0, 7));

  // beU Commission % setting (for Net Payout check)
  const [beuCommissionPct, setBeuCommissionPct] = useState(() => {
    const saved = localStorage.getItem('maraki_beu_commission_pct');
    return saved !== null ? Number(saved) : 0;
  });

  const [copiedBrief, setCopiedBrief] = useState(false);
  const [activePrintSlip, setActivePrintSlip] = useState(null);
  const [inspectSettlement, setInspectSettlement] = useState(null);

  const handleShiftDate = (days) => {
    const cur = new Date(`${selectedDate}T12:00:00`);
    cur.setDate(cur.getDate() + days);
    const next = toLocalIsoDate(cur);
    setSelectedDate(next);
    setCalendarMonth(next.slice(0, 7));
  };

  // Safe localStorage fallbacks
  const resolvedSettlements = useMemo(() => {
    if (settlements && settlements.length > 0) return settlements;
    try {
      const saved = localStorage.getItem('maraki_shift_settlements');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }, [settlements]);

  const resolvedOrders = useMemo(() => {
    if (orders && orders.length > 0) return orders;
    try {
      const saved = localStorage.getItem('maraki_chef_sent_orders');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }, [orders]);

  const actualOwnerExpenses = useMemo(() => {
    try {
      const saved = localStorage.getItem('maraki_actual_expenses');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }, []);

  const allPendingDebts = useMemo(() => {
    try {
      const saved = localStorage.getItem('maraki_waiter_pending_debts');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }, []);

  const filterCfg = { timeRange, selectedDate, customStartDate, customEndDate };

  // Filtered Settlements
  const filteredSettlements = useMemo(() => {
    return resolvedSettlements.filter(s => {
      if (shiftFilter !== 'all' && s.shift !== shiftFilter) return false;
      const recordDate = s.date || (s.savedAt ? toLocalIsoDate(s.savedAt) : '');
      return isDateInRange(recordDate, filterCfg);
    });
  }, [resolvedSettlements, timeRange, selectedDate, customStartDate, customEndDate, shiftFilter]);

  // Filtered Chef Sent Orders (FIXED: matches actual order.shift + createdAt/ethiopianDate!)
  const filteredOrders = useMemo(() => {
    return resolvedOrders.filter(o => {
      if (shiftFilter !== 'all' && getOrderShift(o) !== shiftFilter) return false;
      const oDate = getOrderIsoDate(o);
      return isDateInRange(oDate, filterCfg);
    });
  }, [resolvedOrders, timeRange, selectedDate, customStartDate, customEndDate, shiftFilter]);

  // Filtered Owner Business Expenses (from BusinessManagement)
  const filteredOwnerExpenses = useMemo(() => {
    return actualOwnerExpenses.filter(e => isDateInRange(e.date, filterCfg));
  }, [actualOwnerExpenses, timeRange, selectedDate, customStartDate, customEndDate]);

  // Filtered Shift Daily Expenses (extracted from filteredSettlements)
  const filteredShiftExpenses = useMemo(() => {
    const rows = [];
    filteredSettlements.forEach(s => {
      (s.dailyExpenses || []).forEach((exp, idx) => {
        rows.push({
          id: exp.id || `${s.id}-exp-${idx}`,
          date: s.date,
          shift: s.shift,
          name: exp.name,
          category: exp.category || 'Shift Daily Expense',
          amount: Number(exp.amount || 0),
          source: 'Shift Drawer'
        });
      });
    });
    return rows;
  }, [filteredSettlements]);

  // Combined Separated Expenses (Shift Drawer + Owner Business)
  const combinedExpenses = useMemo(() => {
    const ownerRows = filteredOwnerExpenses.map(e => ({
      id: e.id,
      date: e.date,
      shift: 'Owner',
      name: e.title || e.name || 'Business Expense',
      category: e.category || 'Operations',
      amount: Number(e.amount || 0),
      source: 'Owner Cash'
    }));
    return [...filteredShiftExpenses, ...ownerRows].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [filteredShiftExpenses, filteredOwnerExpenses]);

  // Filtered Pending Debts (created in selected calendar period)
  const filteredPendingDebts = useMemo(() => {
    return allPendingDebts.filter(d => {
      if (shiftFilter !== 'all' && d.shift && d.shift !== shiftFilter) return false;
      const dDate = d.date || toLocalIsoDate(d.createdAt);
      return isDateInRange(dDate, filterCfg);
    });
  }, [allPendingDebts, timeRange, selectedDate, customStartDate, customEndDate, shiftFilter]);

  // Live Chef-vs-IncomeSheet Audit for every filtered settlement (plus live check if settlement exists or unsaved orders exist)
  const shiftAudits = useMemo(() => {
    const list = [];
    filteredSettlements.forEach(s => {
      const chefSum = aggregateChefOrders(resolvedOrders, s.date, s.shift, effectiveDishesList);
      const cmp = compareChefVsIncomeSheet(chefSum, s.foodAssignments || {}, effectiveDishesList);
      list.push({
        settlement: s,
        chefSummary: chefSum,
        comparison: s.chefAudit && s.chefAudit.hasChefOrders ? s.chefAudit : cmp
      });
    });
    return list;
  }, [filteredSettlements, resolvedOrders, effectiveDishesList]);

  const mismatchAlerts = useMemo(() => {
    return shiftAudits.filter(a => a.comparison?.hasMismatch);
  }, [shiftAudits]);

  // Packaging Spend in Period (from Box/Cup Purchases Ledger)
  const periodPackagingSpend = useMemo(() => {
    const audit = computePackagingAudit({ orders: resolvedOrders, settlements: resolvedSettlements });
    return (audit.purchases || [])
      .filter(p => isDateInRange(p.date, filterCfg))
      .reduce((s, p) => s + Number(p.totalCost || 0), 0);
  }, [resolvedOrders, resolvedSettlements, timeRange, selectedDate, customStartDate, customEndDate]);

  // Core Aggregated Metrics
  const metrics = useMemo(() => {
    const boxesFromSettlements = filteredSettlements.reduce(
      (sum, s) => sum + (Number(s.assignedBoxes || s.targetFoodSold) || 0),
      0
    );
    const chefFoodSummary = aggregateChefOrders(filteredOrders, null, 'all', effectiveDishesList);
    const totalBoxes = boxesFromSettlements > 0 ? boxesFromSettlements : chefFoodSummary.takeawayBoxes;

    const totalOrdersCount = filteredOrders.length;
    const dayOrdersCount = filteredOrders.filter(o => getOrderShift(o) === 'Day').length;
    const nightOrdersCount = filteredOrders.filter(o => getOrderShift(o) === 'Night').length;

    const totalCupsGiven = filteredSettlements.reduce((sum, s) => sum + (Number(s.cupsGiven) || 0), 0);
    const totalCupsLeft = filteredSettlements.reduce((sum, s) => sum + (Number(s.cupsLeft) || 0), 0);
    const totalJuiceCups = filteredSettlements.reduce((sum, s) => sum + (Number(s.juiceSold) || 0), 0);
    const totalBeuCups = filteredSettlements.reduce((sum, s) => sum + (Number(s.beuDeliveryCups) || 0), 0);
    const inHouseJuiceCups = Math.max(0, totalJuiceCups - totalBeuCups);
    const grossJuiceRevenue = filteredSettlements.reduce((sum, s) => sum + (Number(s.grossJuiceRevenue) || 0), 0);
    const totalBeuDeduction = filteredSettlements.reduce((sum, s) => sum + (Number(s.beuDeliveryDeduction) || 0), 0);
    const beuSharePercent = totalJuiceCups > 0 ? Math.round((totalBeuCups / totalJuiceCups) * 100) : 0;

    const totalFoodRevenue = filteredSettlements.reduce((sum, s) => sum + (Number(s.totalFoodRevenue) || 0), 0);
    const totalGrossSales = filteredSettlements.reduce((sum, s) => sum + (Number(s.totalGrossSales) || 0), 0);
    const totalPhysicalCash = filteredSettlements.reduce((sum, s) => sum + (Number(s.physicalCashInDrawer) || 0), 0);
    const totalBankTransfers = filteredSettlements.reduce((sum, s) => sum + (Number(s.totalBankTransfers) || 0), 0);
    const totalShiftExpenses = filteredSettlements.reduce((sum, s) => sum + (Number(s.totalDailyExpenses) || 0), 0);
    const totalOwnerExp = filteredOwnerExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const totalAllExpenses = totalShiftExpenses + totalOwnerExp;
    const totalPendingDeducted = filteredSettlements.reduce((sum, s) => sum + (Number(s.deductedPendingDebt) || 0), 0);
    const totalRecoveredAdded = filteredSettlements.reduce((sum, s) => sum + (Number(s.recoveredCashAdded) || 0), 0);

    // Dish breakdown across settlements
    const dishMap = {};
    filteredSettlements.forEach(s => {
      if (s.foodAssignments) {
        Object.entries(s.foodAssignments).forEach(([dishId, qty]) => {
          if (qty > 0) {
            if (!dishMap[dishId]) {
              const ref = dynamicDishLookup[dishId] || DISH_LOOKUP[dishId];
              dishMap[dishId] = {
                id: dishId,
                name: ref?.name || dishId,
                englishName: ref?.englishName || '',
                price: ref?.price || 0,
                incomeQty: 0,
                chefQty: chefFoodSummary.dishCounts[dishId]?.qty || 0
              };
            }
            dishMap[dishId].incomeQty += Number(qty);
          }
        });
      }
    });
    // Include any Chef dish that wasn't in foodAssignments
    Object.entries(chefFoodSummary.dishCounts).forEach(([dishId, info]) => {
      if (!dishMap[dishId]) {
        dishMap[dishId] = {
          id: dishId,
          name: info.name,
          englishName: info.englishName,
          price: info.price,
          incomeQty: 0,
          chefQty: info.qty
        };
      } else {
        dishMap[dishId].chefQty = info.qty;
      }
    });

    // Bank Transfers grouped by channel
    const transferChannelMap = {};
    filteredSettlements.forEach(s => {
      (s.bankTransfers || []).forEach(t => {
        const ch = t.channel || 'Bank Transfer';
        transferChannelMap[ch] = (transferChannelMap[ch] || 0) + Number(t.amount || 0);
      });
    });

    // Net profit estimate
    const beuFee = Math.round(totalBeuDeduction * (Number(beuCommissionPct || 0) / 100));
    const expectedBeuNetPayout = Math.max(0, totalBeuDeduction - beuFee);
    const estimatedNetProfit = totalGrossSales - totalAllExpenses - periodPackagingSpend - beuFee;

    return {
      totalBoxes,
      boxesFromSettlements,
      boxesFromOrders: chefFoodSummary.takeawayBoxes,
      chefHomeDishes: chefFoodSummary.homeDishes,
      chefTotalFood: chefFoodSummary.totalFoodItems,
      chefOrdersRevenue: chefFoodSummary.totalRevenue,
      totalOrdersCount,
      dayOrdersCount,
      nightOrdersCount,
      totalCupsGiven,
      totalCupsLeft,
      totalJuiceCups,
      inHouseJuiceCups,
      grossJuiceRevenue,
      totalBeuCups,
      totalBeuDeduction,
      beuSharePercent,
      beuFee,
      expectedBeuNetPayout,
      totalFoodRevenue,
      totalGrossSales,
      totalPhysicalCash,
      totalBankTransfers,
      totalShiftExpenses,
      totalOwnerExp,
      totalAllExpenses,
      totalPendingDeducted,
      totalRecoveredAdded,
      estimatedNetProfit,
      dishMap,
      transferChannelMap,
      settlementsCount: filteredSettlements.length
    };
  }, [filteredSettlements, filteredOrders, filteredOwnerExpenses, periodPackagingSpend, beuCommissionPct, effectiveDishesList, dynamicDishLookup]);

  // Daily breakdown series for charts & separated daily tables
  const dailySeries = useMemo(() => {
    const map = {};
    const ensureDay = (d) => {
      if (!d) return null;
      if (!map[d]) {
        map[d] = {
          date: d,
          cups: 0,
          beuCups: 0,
          inHouseCups: 0,
          beuDeduction: 0,
          boxes: 0,
          ordersCount: 0,
          grossSales: 0,
          expenses: 0,
          bankTransfers: 0,
          physicalCash: 0,
          pendingNew: 0,
          recovered: 0
        };
      }
      return map[d];
    };

    filteredSettlements.forEach(s => {
      const row = ensureDay(s.date);
      if (!row) return;
      row.cups += Number(s.juiceSold || 0);
      row.beuCups += Number(s.beuDeliveryCups || 0);
      row.inHouseCups += Math.max(0, Number(s.juiceSold || 0) - Number(s.beuDeliveryCups || 0));
      row.beuDeduction += Number(s.beuDeliveryDeduction || 0);
      row.boxes += Number(s.assignedBoxes || s.targetFoodSold || 0);
      row.grossSales += Number(s.totalGrossSales || 0);
      row.expenses += Number(s.totalDailyExpenses || 0);
      row.bankTransfers += Number(s.totalBankTransfers || 0);
      row.physicalCash += Number(s.physicalCashInDrawer || 0);
      row.pendingNew += Number(s.deductedPendingDebt || 0);
      row.recovered += Number(s.recoveredCashAdded || 0);
    });

    filteredOrders.forEach(o => {
      const d = getOrderIsoDate(o);
      const row = ensureDay(d);
      if (!row) return;
      row.ordersCount += 1;
    });

    filteredOwnerExpenses.forEach(e => {
      const row = ensureDay(e.date);
      if (!row) return;
      row.expenses += Number(e.amount || 0);
    });

    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredSettlements, filteredOrders, filteredOwnerExpenses]);

  // Waiter Accountability Scorecard (from filteredOrders + allPendingDebts)
  const waiterScorecard = useMemo(() => {
    const map = {};
    const ensure = (name) => {
      const key = name || 'Unassigned';
      if (!map[key]) {
        map[key] = {
          name: key,
          orders: 0,
          boxes: 0,
          salesETB: 0,
          periodPendingETB: 0,
          allUnpaidETB: 0,
          recoveredETB: 0
        };
      }
      return map[key];
    };

    filteredOrders.forEach(o => {
      const row = ensure(o.waiterName);
      row.orders += 1;
      row.boxes += Number(o.boxesCount || 0);
      row.salesETB += Number(o.totalAmount || 0);
    });

    filteredPendingDebts.forEach(d => {
      const row = ensure(d.waiterName);
      row.periodPendingETB += Number(d.totalAmount || 0);
      if (d.status === 'completed') {
        row.recoveredETB += Number(d.totalAmount || 0);
      }
    });

    allPendingDebts.forEach(d => {
      if (d.status === 'pending' && Number(d.remainingAmount || 0) > 0) {
        const row = ensure(d.waiterName);
        row.allUnpaidETB += Number(d.remainingAmount || 0);
      }
    });

    return Object.values(map).sort((a, b) => b.salesETB - a.salesETB || b.allUnpaidETB - a.allUnpaidETB);
  }, [filteredOrders, filteredPendingDebts, allPendingDebts]);

  // Visual Calendar Month Grid Data (marks days with settlements, orders, expenses, mismatches)
  const calendarDays = useMemo(() => {
    const [yrStr, moStr] = calendarMonth.split('-');
    const year = Number(yrStr);
    const month = Number(moStr); // 1..12
    const firstDay = new Date(year, month - 1, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(year, month, 0).getDate();

    const activityByDate = {};
    resolvedSettlements.forEach(s => {
      if (!s.date) return;
      if (!activityByDate[s.date]) activityByDate[s.date] = { settlements: 0, orders: 0, mismatch: false, sales: 0 };
      activityByDate[s.date].settlements += 1;
      activityByDate[s.date].sales += Number(s.totalGrossSales || 0);
      if (s.chefAudit?.hasMismatch) activityByDate[s.date].mismatch = true;
    });
    resolvedOrders.forEach(o => {
      const d = getOrderIsoDate(o);
      if (!d) return;
      if (!activityByDate[d]) activityByDate[d] = { settlements: 0, orders: 0, mismatch: false, sales: 0 };
      activityByDate[d].orders += 1;
    });

    const cells = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({
        day,
        iso,
        ethShort: toEthiopianShortDate(`${iso}T12:00:00`),
        activity: activityByDate[iso] || null
      });
    }
    return cells;
  }, [calendarMonth, resolvedSettlements, resolvedOrders]);

  const handleDeleteSettlement = (id) => {
    if (window.confirm('Delete this shift settlement record?')) {
      const updated = resolvedSettlements.filter(s => s.id !== id);
      if (onUpdateSettlements) {
        onUpdateSettlements(updated);
      } else {
        localStorage.setItem('maraki_shift_settlements', JSON.stringify(updated));
      }
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Record ID', 'Date', 'Ethiopian Date', 'Shift', 'Total Boxes', 'Total Juice Cups',
      'In-House Cups', 'beU Delivery Cups', 'Gross Juice (ETB)', 'Food Sales (ETB)',
      'Total Gross Sales (ETB)', 'beU Deduction (ETB)', 'Expenses (ETB)',
      'Bank Transfers (ETB)', 'Pending Debt (ETB)', 'Recovered Debt (ETB)',
      'Physical Cash (ETB)', 'Chef Mismatch'
    ];
    const rows = filteredSettlements.map(s => [
      s.id, s.date, `"${toEthiopianDateString(`${s.date}T12:00:00`)}"`, s.shift,
      s.assignedBoxes || s.targetFoodSold || 0, s.juiceSold || 0, s.inStoreJuiceCups || 0,
      s.beuDeliveryCups || 0, s.grossJuiceRevenue || 0, s.totalFoodRevenue || 0,
      s.totalGrossSales || 0, s.beuDeliveryDeduction || 0, s.totalDailyExpenses || 0,
      s.totalBankTransfers || 0, s.deductedPendingDebt || 0, s.recoveredCashAdded || 0,
      s.physicalCashInDrawer || 0, s.chefAudit?.hasMismatch ? 'MISMATCH' : 'OK'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `maraki_income_report_${timeRange}_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const rangeTitle = useMemo(() => {
    if (timeRange === 'daily') return `${selectedDate} (${toEthiopianDateString(`${selectedDate}T12:00:00`)})`;
    if (timeRange === 'weekly') {
      const target = new Date(`${selectedDate}T12:00:00`);
      const start = new Date(target);
      start.setDate(start.getDate() - 6);
      return `${toLocalIsoDate(start)} → ${selectedDate} (7 Days)`;
    }
    if (timeRange === 'monthly') {
      const target = new Date(`${selectedDate}T12:00:00`);
      return `${target.toLocaleString('en-US', { month: 'long', year: 'numeric' })} (Monthly)`;
    }
    return `${customStartDate} → ${customEndDate}`;
  }, [timeRange, selectedDate, customStartDate, customEndDate]);

  // 1-Click Copy Daily Owner Brief
  const handleCopyBrief = () => {
    const brief = [
      `📊 MARAKI JUICE & SALAD — OWNER BRIEF`,
      `📅 Period: ${rangeTitle} (${shiftFilter === 'all' ? 'All Shifts' : shiftFilter})`,
      `🍱 Food Boxes: ${metrics.totalBoxes} (${metrics.totalFoodRevenue.toLocaleString()} ETB)`,
      `🧾 Kitchen Orders: ${metrics.totalOrdersCount} (☀️ ${metrics.dayOrdersCount} / 🌙 ${metrics.nightOrdersCount})`,
      `🥤 Juice Cups: ${metrics.totalJuiceCups} (${metrics.inHouseJuiceCups} in-house + ${metrics.totalBeuCups} beU)`,
      `🛵 beU Deduction: -${metrics.totalBeuDeduction.toLocaleString()} ETB`,
      `💰 Gross Sales: ${metrics.totalGrossSales.toLocaleString()} ETB`,
      `💸 Expenses (Shift + Owner): -${metrics.totalAllExpenses.toLocaleString()} ETB`,
      `🏦 Bank Transfers: -${metrics.totalBankTransfers.toLocaleString()} ETB`,
      `⏳ Pending New / Recovered: -${metrics.totalPendingDeducted.toLocaleString()} / +${metrics.totalRecoveredAdded.toLocaleString()} ETB`,
      `💵 Physical Cash in Drawer: ${metrics.totalPhysicalCash.toLocaleString()} ETB`,
      mismatchAlerts.length > 0 ? `🚨 ALARMS: ${mismatchAlerts.length} Chef-vs-Sheet Mismatch(es)!` : `✅ Chef vs Sheet Audit: Clean`
    ].join('\n');

    navigator.clipboard?.writeText(brief).then(() => {
      setCopiedBrief(true);
      setTimeout(() => setCopiedBrief(false), 2500);
    });
  };

  const maxDailySales = Math.max(1, ...dailySeries.map(d => d.grossSales));

  return (
    <div className="space-y-5 text-slate-800 antialiased font-sans">
      {/* 1. HEADER BAR */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl font-black">
            📈
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Deep Income Analysis & Separated Reports
              </h1>
              {mismatchAlerts.length > 0 && (
                <span className="text-[10px] font-black uppercase bg-rose-600 text-white px-2.5 py-0.5 rounded-full animate-pulse">
                  🚨 {mismatchAlerts.length} Mismatch Alarm
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-bold mt-0.5">
              Calendar-filtered Cups, beU, Food, Separated Expenses, Pending Debts, Transfers & Chef Audit
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyBrief}
            className="px-3.5 py-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-black text-xs flex items-center gap-1.5 border border-emerald-200 active:scale-95"
          >
            {copiedBrief ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5 text-emerald-700" />}
            <span>{copiedBrief ? 'Copied Brief!' : 'Copy Brief'}</span>
          </button>

          {onOpenShiftReconciliation && (
            <button
              type="button"
              onClick={onOpenShiftReconciliation}
              className="px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Daily Sheet</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs flex items-center gap-1.5 border border-slate-200 active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>CSV</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs flex items-center gap-1.5 border border-slate-200 active:scale-95"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-700" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* 2. CALENDAR & TIMEFRAME TOOLBAR */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Time Range Buttons */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
            {[
              { id: 'daily', label: 'Daily', icon: Calendar },
              { id: 'weekly', label: 'Weekly (7d)', icon: BarChart3 },
              { id: 'monthly', label: 'Monthly', icon: TrendingUp },
              { id: 'custom', label: 'Custom Range', icon: Filter }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTimeRange(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                    timeRange === tab.id ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Toggle Interactive Visual Calendar */}
            <button
              type="button"
              onClick={() => setShowCalendarGrid(prev => !prev)}
              className={`px-3 py-1.5 rounded-2xl text-xs font-black flex items-center gap-1.5 border transition-all ${
                showCalendarGrid
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>{showCalendarGrid ? 'Hide Calendar Grid' : 'Visual Calendar'}</span>
            </button>

            {/* Shift Filter */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs">
              {[
                { id: 'all', label: 'All Shifts' },
                { id: 'Day', label: '☀️ Day' },
                { id: 'Night', label: '🌙 Night' }
              ].map(sf => (
                <button
                  key={sf.id}
                  type="button"
                  onClick={() => setShiftFilter(sf.id)}
                  className={`px-2.5 py-1 rounded-xl font-black transition-all ${
                    shiftFilter === sf.id ? 'bg-white text-emerald-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {sf.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Date Picker Sub-Bar */}
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
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  if (e.target.value) setCalendarMonth(e.target.value.slice(0, 7));
                }}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 font-bold text-slate-800 outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => handleShiftDate(1)}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const today = toLocalIsoDate(new Date());
                  setSelectedDate(today);
                  setCalendarMonth(today.slice(0, 7));
                }}
                className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 text-emerald-800 rounded-xl font-black text-[11px] border border-slate-200"
              >
                Today
              </button>
            </div>
          )}

          <div className="text-xs text-slate-500 font-bold">
            <span>Active Period: </span>
            <strong className="text-emerald-800">{rangeTitle}</strong>
            <span className="ml-2 text-slate-400">({metrics.settlementsCount} shifts • {metrics.totalOrdersCount} orders)</span>
          </div>
        </div>

        {/* EXPANDABLE INTERACTIVE VISUAL CALENDAR */}
        {showCalendarGrid && (
          <div className="mt-3 pt-3 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const [y, m] = calendarMonth.split('-').map(Number);
                  const d = new Date(y, m - 2, 1);
                  setCalendarMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
                }}
                className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-black"
              >
                ← Prev Month
              </button>
              <div className="text-center">
                <h4 className="text-sm font-black text-slate-900">
                  {new Date(`${calendarMonth}-15T12:00:00`).toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                </h4>
                <div className="flex items-center justify-center gap-3 text-[10px] font-bold text-slate-500 mt-0.5">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Reconciled</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-500 inline-block" /> Orders</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-600 inline-block" /> Mismatch Alarm</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const [y, m] = calendarMonth.split('-').map(Number);
                  const d = new Date(y, m, 1);
                  setCalendarMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
                }}
                className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-black"
              >
                Next Month →
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-black text-slate-400 uppercase">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((cell, idx) => {
                if (!cell) return <div key={`empty-${idx}`} className="h-14 rounded-xl bg-slate-50/40" />;
                const isSelected = cell.iso === selectedDate;
                return (
                  <button
                    key={cell.iso}
                    type="button"
                    onClick={() => {
                      setSelectedDate(cell.iso);
                      if (timeRange === 'custom') setTimeRange('daily');
                    }}
                    className={`h-14 rounded-xl p-1.5 border text-left flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-md'
                        : cell.activity?.mismatch
                          ? 'bg-rose-50 border-rose-300 hover:border-rose-500'
                          : cell.activity
                            ? 'bg-emerald-50/60 border-emerald-200 hover:border-emerald-400'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-black">{cell.day}</span>
                      <div className="flex items-center gap-0.5">
                        {cell.activity?.settlements > 0 && <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`} />}
                        {cell.activity?.orders > 0 && <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-200' : 'bg-sky-500'}`} />}
                        {cell.activity?.mismatch && <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />}
                      </div>
                    </div>
                    <span className={`text-[9px] font-bold truncate block ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                      {cell.ethShort}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. SEPARATED DEEP-DIVE SUB-NAVIGATION */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-1.5 overflow-x-auto">
        {[
          { id: 'overview', label: '📈 Overview & Cash Flow', badge: mismatchAlerts.length > 0 ? `${mismatchAlerts.length} 🚨` : null, alert: mismatchAlerts.length > 0 },
          { id: 'cups_beu', label: '🥤 Cups & beU', badge: metrics.totalJuiceCups },
          { id: 'food', label: '🍱 Food & Chef Audit', badge: metrics.totalBoxes },
          { id: 'expenses', label: '💸 Expenses (Separated)', badge: combinedExpenses.length },
          { id: 'pending', label: '⏳ Pending & Waiters', badge: filteredPendingDebts.length },
          { id: 'settlements', label: '🏦 Transfers & Day Closes', badge: filteredSettlements.length },
          ...(ordersAuditContent ? [{ id: 'orders', label: '🧾 Orders Log', badge: resolvedOrders.length }] : [])
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSubView(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 ${
              subView === tab.id
                ? 'bg-slate-900 text-white shadow-sm'
                : tab.alert
                  ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span>{tab.label}</span>
            {tab.badge !== null && tab.badge !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                subView === tab.id
                  ? 'bg-emerald-500 text-white'
                  : tab.alert
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-200 text-slate-700'
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ============================================================== */}
      {/* VIEW 1: OVERVIEW & CASH FLOW                                   */}
      {/* ============================================================== */}
      {subView === 'overview' && (
        <div className="space-y-5">
          {/* Mismatch Alarm Banner if any shift in period had a Chef vs Sheet mismatch */}
          {mismatchAlerts.length > 0 && (
            <div className="bg-rose-50 border-2 border-rose-500 rounded-3xl p-4 space-y-2 shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-rose-900">
                  <BellRing className="w-5 h-5 text-rose-600 animate-pulse" />
                  <h3 className="text-sm font-black">
                    🚨 RED ALARM: {mismatchAlerts.length} Shift(s) Have Waiter/Income Sheet ≠ Chef Sent Orders!
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSubView('food')}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black"
                >
                  Inspect Mismatches →
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {mismatchAlerts.map(({ settlement, comparison }) => (
                  <div key={settlement.id} className="bg-white border border-rose-200 px-3 py-2 rounded-xl text-xs font-bold text-rose-900">
                    <strong>{settlement.date} ({settlement.shift})</strong>: Chef sent {comparison.chefTotalFood} vs Sheet {comparison.incomeSheetTotal} ({comparison.dishDiffs?.length || 0} dish diffs)
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BIG 4 KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div onClick={() => setSubView('food')} className="cursor-pointer bg-white p-5 rounded-3xl border border-slate-200 hover:border-emerald-400 shadow-xs space-y-2 transition-all">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span className="flex items-center gap-1.5"><Package className="w-4 h-4 text-emerald-600" /> Food Boxes</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-black">Click for deep view</span>
              </div>
              <p className="text-3xl font-black text-slate-900 tabular-nums">{metrics.totalBoxes.toLocaleString()}</p>
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
                <span>Food Sales:</span>
                <strong className="text-emerald-800 font-black">{metrics.totalFoodRevenue.toLocaleString()} ETB</strong>
              </div>
            </div>

            <div onClick={() => ordersAuditContent && setSubView('orders')} className="cursor-pointer bg-white p-5 rounded-3xl border border-slate-200 hover:border-emerald-400 shadow-xs space-y-2 transition-all">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span className="flex items-center gap-1.5"><Receipt className="w-4 h-4 text-emerald-600" /> Kitchen Orders</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-black">Chef POS</span>
              </div>
              <p className="text-3xl font-black text-slate-900 tabular-nums">{metrics.totalOrdersCount.toLocaleString()}</p>
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
                <span>Day / Night:</span>
                <strong className="text-slate-700 font-black">☀️ {metrics.dayOrdersCount} • 🌙 {metrics.nightOrdersCount}</strong>
              </div>
            </div>

            <div onClick={() => setSubView('cups_beu')} className="cursor-pointer bg-white p-5 rounded-3xl border border-slate-200 hover:border-emerald-400 shadow-xs space-y-2 transition-all">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span className="flex items-center gap-1.5"><Coffee className="w-4 h-4 text-emerald-600" /> Juice Cups Sold</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-black">{effectiveJuicePrice} ETB/cup</span>
              </div>
              <p className="text-3xl font-black text-slate-900 tabular-nums">{metrics.totalJuiceCups.toLocaleString()}</p>
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
                <span>In-House / beU:</span>
                <strong className="text-slate-700 font-black">{metrics.inHouseJuiceCups} • {metrics.totalBeuCups} beU</strong>
              </div>
            </div>

            <div onClick={() => setSubView('cups_beu')} className="cursor-pointer bg-white p-5 rounded-3xl border border-slate-200 hover:border-emerald-400 shadow-xs space-y-2 transition-all">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span className="flex items-center gap-1.5"><Truck className="w-4 h-4 text-emerald-600" /> beU Delivery</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-black">{metrics.beuSharePercent}% share</span>
              </div>
              <p className="text-3xl font-black text-slate-900 tabular-nums">{metrics.totalBeuCups.toLocaleString()} <span className="text-xs text-slate-400">cups</span></p>
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
                <span>beU Deduction:</span>
                <strong className="text-rose-700 font-black">-{metrics.totalBeuDeduction.toLocaleString()} ETB</strong>
              </div>
            </div>
          </div>

          {/* DAILY REVENUE TREND BAR CHART (when multiple days in range) */}
          {dailySeries.length > 0 && (
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900">Daily Sales vs Expenses Trend ({dailySeries.length} active days)</h3>
                <div className="flex items-center gap-3 text-[11px] font-bold">
                  <span className="flex items-center gap-1 text-emerald-700"><span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" /> Gross Sales</span>
                  <span className="flex items-center gap-1 text-rose-600"><span className="w-2.5 h-2.5 rounded bg-rose-400 inline-block" /> Expenses</span>
                </div>
              </div>
              <div className="flex items-end gap-2 h-36 overflow-x-auto pb-1">
                {dailySeries.map(d => {
                  const salesPct = Math.max(4, Math.round((d.grossSales / maxDailySales) * 100));
                  const expPct = Math.min(100, Math.round((d.expenses / maxDailySales) * 100));
                  return (
                    <button
                      key={d.date}
                      type="button"
                      onClick={() => { setSelectedDate(d.date); setTimeRange('daily'); }}
                      className="flex-1 min-w-[52px] flex flex-col items-center gap-1 group"
                      title={`${d.date}: Sales ${d.grossSales.toLocaleString()} ETB | Expenses ${d.expenses.toLocaleString()} ETB`}
                    >
                      <span className="text-[9px] font-black text-slate-500 group-hover:text-emerald-700">
                        {d.grossSales > 0 ? `${Math.round(d.grossSales / 1000)}k` : '0'}
                      </span>
                      <div className="w-full h-24 bg-slate-50 rounded-xl flex items-end justify-center gap-1 px-1.5 border border-slate-100 group-hover:border-emerald-300">
                        <div className="w-3 bg-emerald-500 rounded-t-md transition-all" style={{ height: `${salesPct}%` }} />
                        {d.expenses > 0 && <div className="w-2 bg-rose-400 rounded-t-md transition-all" style={{ height: `${Math.max(4, expPct)}%` }} />}
                      </div>
                      <span className="text-[9px] font-bold text-slate-500 truncate w-full text-center">{d.date.slice(5)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* FINANCIAL AUDIT & TRUE NET PROFIT CARD */}
          <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-emerald-800/40 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-4">
              <div>
                <h2 className="text-base sm:text-lg font-black tracking-tight">Financial Cash Flow & Estimated Net Profit</h2>
                <p className="text-xs text-emerald-200/80 font-bold">{rangeTitle} • {metrics.settlementsCount} reconciled shifts</p>
              </div>
              <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-xs font-black text-emerald-200">
                Drawer Cash + Net Profit
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10">
                <span className="text-[10px] text-emerald-200 block font-bold">Gross Sales</span>
                <span className="text-base font-black tabular-nums mt-1 block">{metrics.totalGrossSales.toLocaleString()} ETB</span>
              </div>
              <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10">
                <span className="text-[10px] text-rose-300 block font-bold">beU Deduction</span>
                <span className="text-base font-black text-rose-200 tabular-nums mt-1 block">-{metrics.totalBeuDeduction.toLocaleString()} ETB</span>
              </div>
              <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10">
                <span className="text-[10px] text-rose-300 block font-bold">All Expenses (Shift+Owner)</span>
                <span className="text-base font-black text-rose-200 tabular-nums mt-1 block">-{metrics.totalAllExpenses.toLocaleString()} ETB</span>
              </div>
              <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10">
                <span className="text-[10px] text-emerald-200 block font-bold">Bank Transfers</span>
                <span className="text-base font-black text-emerald-200 tabular-nums mt-1 block">-{metrics.totalBankTransfers.toLocaleString()} ETB</span>
              </div>
              <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10">
                <span className="text-[10px] text-emerald-200 block font-bold">Recovered Debts</span>
                <span className="text-base font-black text-emerald-300 tabular-nums mt-1 block">+{metrics.totalRecoveredAdded.toLocaleString()} ETB</span>
              </div>
              <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10">
                <span className="text-[10px] text-rose-300 block font-bold">New Pending Debt</span>
                <span className="text-base font-black text-rose-200 tabular-nums mt-1 block">-{metrics.totalPendingDeducted.toLocaleString()} ETB</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/15 rounded-2xl p-4 border border-emerald-400/30">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-200 block">
                  Physical Cash Collected in Drawer
                </span>
                <p className="text-3xl font-black text-white tabular-nums mt-1">
                  {metrics.totalPhysicalCash.toLocaleString()} <span className="text-sm text-emerald-300">ETB</span>
                </p>
              </div>
              <div className="bg-white/10 rounded-2xl p-4 border border-white/15">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 block">
                  Estimated Net Profit (Sales − Expenses − Restock Cost − beU Fee)
                </span>
                <p className={`text-3xl font-black tabular-nums mt-1 ${metrics.estimatedNetProfit >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {metrics.estimatedNetProfit.toLocaleString()} <span className="text-sm">ETB</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 2: SEPARATED CUPS & beU DEEP ANALYSIS                     */}
      {/* ============================================================== */}
      {subView === 'cups_beu' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-black uppercase text-slate-400">Cups Given</span>
              <p className="text-2xl font-black text-slate-900 mt-1 tabular-nums">{metrics.totalCupsGiven.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-black uppercase text-slate-400">Cups Left</span>
              <p className="text-2xl font-black text-slate-600 mt-1 tabular-nums">{metrics.totalCupsLeft.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs">
              <span className="text-[10px] font-black uppercase text-emerald-700">Total Cups Sold</span>
              <p className="text-2xl font-black text-emerald-800 mt-1 tabular-nums">{metrics.totalJuiceCups.toLocaleString()}</p>
              <span className="text-[10px] font-bold text-slate-500">{metrics.grossJuiceRevenue.toLocaleString()} ETB</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-black uppercase text-slate-400">In-House Cups</span>
              <p className="text-2xl font-black text-slate-900 mt-1 tabular-nums">{metrics.inHouseJuiceCups.toLocaleString()}</p>
              <span className="text-[10px] font-bold text-slate-500">Cash/Transfer</span>
            </div>
            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-300 shadow-xs">
              <span className="text-[10px] font-black uppercase text-emerald-800">beU Cups ({metrics.beuSharePercent}%)</span>
              <p className="text-2xl font-black text-emerald-900 mt-1 tabular-nums">{metrics.totalBeuCups.toLocaleString()}</p>
              <span className="text-[10px] font-bold text-rose-700">-{metrics.totalBeuDeduction.toLocaleString()} ETB</span>
            </div>
          </div>

          {/* beU Commission & Bank Payout Verifier */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-600" />
                <span>beU Delivery Bank Payout Verifier</span>
              </h3>
              <p className="text-xs text-slate-500 font-bold mt-0.5">
                Gross beU Order Value: <strong>{metrics.totalBeuDeduction.toLocaleString()} ETB</strong> •
                beU Fee ({beuCommissionPct}%): <strong className="text-rose-600">-{metrics.beuFee.toLocaleString()} ETB</strong> •
                Expected Net Bank Payout: <strong className="text-emerald-700">{metrics.expectedBeuNetPayout.toLocaleString()} ETB</strong>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-black text-slate-600">beU Fee %:</label>
              <input
                type="number"
                min="0"
                max="50"
                value={beuCommissionPct}
                onChange={(e) => {
                  const v = Math.max(0, Math.min(50, Number(e.target.value) || 0));
                  setBeuCommissionPct(v);
                  localStorage.setItem('maraki_beu_commission_pct', String(v));
                }}
                className="w-20 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-black text-center"
              />
            </div>
          </div>

          {/* Day-by-Day Cups & beU Table */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-black text-slate-900">Day-by-Day Cups & beU Breakdown ({rangeTitle})</h3>
            {dailySeries.length === 0 ? (
              <p className="text-xs text-slate-400 font-bold py-6 text-center">No shift data in this calendar period.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-black border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3 text-right">Total Cups</th>
                      <th className="py-2.5 px-3 text-right">In-House Cups</th>
                      <th className="py-2.5 px-3 text-right">beU Cups</th>
                      <th className="py-2.5 px-3 text-right">beU Value (ETB)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dailySeries.map(row => (
                      <tr key={row.date} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-black text-slate-900">
                          {row.date} <span className="text-[10px] text-slate-400 font-bold">({toEthiopianDateString(`${row.date}T12:00:00`)})</span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-black">{row.cups}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-700">{row.inHouseCups}</td>
                        <td className="py-2.5 px-3 text-right font-black text-emerald-700">{row.beuCups}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-rose-700">{row.beuDeduction.toLocaleString()} ETB</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 3: FOOD, DISHES & CHEF-VS-SHEET AUDIT                     */}
      {/* ============================================================== */}
      {subView === 'food' && (
        <div className="space-y-5">
          {/* Chef Sent vs Income Sheet Comparison Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-black uppercase text-slate-400">Chef POS Sent (Takeaway + Home)</span>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {metrics.chefTotalFood} <span className="text-xs text-slate-500">dishes</span>
              </p>
              <span className="text-[11px] text-slate-500 font-bold">
                {metrics.boxesFromOrders} Takeaway Boxes • {metrics.chefHomeDishes} Home Dine-in
              </span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-black uppercase text-slate-400">Income Sheet Food Entered</span>
              <p className="text-2xl font-black text-emerald-800 mt-1">
                {metrics.boxesFromSettlements} <span className="text-xs text-slate-500">items</span>
              </p>
              <span className="text-[11px] text-emerald-700 font-bold">
                {metrics.totalFoodRevenue.toLocaleString()} ETB recorded
              </span>
            </div>
            <div className={`p-4 rounded-2xl border shadow-xs ${mismatchAlerts.length > 0 ? 'bg-rose-50 border-rose-400' : 'bg-emerald-50 border-emerald-300'}`}>
              <span className="text-[10px] font-black uppercase text-slate-500">Chef ≡ Waiter Audit Status</span>
              <p className={`text-lg font-black mt-1 ${mismatchAlerts.length > 0 ? 'text-rose-700' : 'text-emerald-800'}`}>
                {mismatchAlerts.length > 0 ? `🚨 ${mismatchAlerts.length} MISMATCH ALARM(S)` : '✅ Matched / No Alarms'}
              </p>
              <span className="text-[11px] font-bold text-slate-600">Across {filteredSettlements.length} saved shifts</span>
            </div>
          </div>

          {/* Detailed Shift Mismatch Table */}
          {mismatchAlerts.length > 0 && (
            <div className="bg-rose-50 rounded-3xl border-2 border-rose-400 p-5 space-y-3">
              <h3 className="text-sm font-black text-rose-900 flex items-center gap-2">
                <BellRing className="w-4 h-4 text-rose-600" />
                <span>Detailed Chef Sent vs Income Sheet Mismatches</span>
              </h3>
              {mismatchAlerts.map(({ settlement, comparison }) => (
                <div key={settlement.id} className="bg-white rounded-2xl p-4 border border-rose-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-black text-rose-900">
                    <span>{settlement.date} ({toEthiopianDateString(`${settlement.date}T12:00:00`)}) • {settlement.shift} Shift</span>
                    <span>Chef: {comparison.chefTotalFood} vs Income Sheet: {comparison.incomeSheetTotal}</span>
                  </div>
                  {comparison.dishDiffs?.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {comparison.dishDiffs.map(d => (
                        <div key={d.id} className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-200 text-xs">
                          <span className="font-black text-slate-900 block">{d.name}</span>
                          <span className="text-[11px] font-bold text-rose-800">
                            Chef: {d.chefQty} | Sheet: {d.incomeQty} ({d.diff > 0 ? `+${d.diff}` : d.diff})
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Dish-by-Dish Comparison Table */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-black text-slate-900">Dish-by-Dish Breakdown (Chef POS vs Income Sheet)</h3>
            {Object.keys(metrics.dishMap).length === 0 ? (
              <p className="text-xs text-slate-400 font-bold py-6 text-center">No food dish sales recorded in this period.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-black border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Dish</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Chef Sent</th>
                      <th className="py-2.5 px-3 text-right">Income Sheet</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.values(metrics.dishMap).map(d => {
                      const diff = d.incomeQty - d.chefQty;
                      return (
                        <tr key={d.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-black text-slate-900">
                            {d.name} {d.englishName && <span className="text-[10px] text-slate-400 font-bold">({d.englishName})</span>}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold">{d.price} ETB</td>
                          <td className="py-2.5 px-3 text-right font-black text-slate-800">{d.chefQty}</td>
                          <td className="py-2.5 px-3 text-right font-black text-emerald-800">{d.incomeQty}</td>
                          <td className="py-2.5 px-3 text-right">
                            {d.chefQty === 0 ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">Manual Entry</span>
                            ) : diff === 0 ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black">✔ Match</span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-black">🚨 {diff > 0 ? `+${diff}` : diff}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 4: SEPARATED DAILY & OWNER EXPENSES                       */}
      {/* ============================================================== */}
      {subView === 'expenses' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-black uppercase text-slate-400">Shift Drawer Expenses</span>
              <p className="text-2xl font-black text-rose-700 mt-1 tabular-nums">{metrics.totalShiftExpenses.toLocaleString()} ETB</p>
              <span className="text-[11px] font-bold text-slate-500">{filteredShiftExpenses.length} items from Daily Sheet</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-black uppercase text-slate-400">Owner Business Expenses</span>
              <p className="text-2xl font-black text-rose-700 mt-1 tabular-nums">{metrics.totalOwnerExp.toLocaleString()} ETB</p>
              <span className="text-[11px] font-bold text-slate-500">{filteredOwnerExpenses.length} items from Finance</span>
            </div>
            <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 shadow-xs">
              <span className="text-[10px] font-black uppercase text-rose-700">Total Period Expenses</span>
              <p className="text-2xl font-black text-rose-900 mt-1 tabular-nums">{metrics.totalAllExpenses.toLocaleString()} ETB</p>
              <span className="text-[11px] font-bold text-rose-700">{rangeTitle}</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-black text-slate-900">Itemized Expenses ({combinedExpenses.length} records)</h3>
            {combinedExpenses.length === 0 ? (
              <p className="text-xs text-slate-400 font-bold py-6 text-center">No expenses recorded in this calendar period.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-black border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Item / Description</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Source</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {combinedExpenses.map(e => (
                      <tr key={e.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-slate-700 whitespace-nowrap">{e.date}</td>
                        <td className="py-2.5 px-3 font-black text-slate-900">{e.name}</td>
                        <td className="py-2.5 px-3 text-slate-600 font-bold">{e.category}</td>
                        <td className="py-2.5 px-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                            e.source === 'Shift Drawer' ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {e.source} ({e.shift})
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-rose-700 tabular-nums">-{e.amount.toLocaleString()} ETB</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 5: SEPARATED PENDING DEBTS & WAITER SCORECARD             */}
      {/* ============================================================== */}
      {subView === 'pending' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-black uppercase text-slate-400">New Pending in Period</span>
              <p className="text-2xl font-black text-rose-700 mt-1 tabular-nums">{metrics.totalPendingDeducted.toLocaleString()} ETB</p>
              <span className="text-[11px] font-bold text-slate-500">{filteredPendingDebts.length} debt entries</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-black uppercase text-slate-400">Recovered Cash in Period</span>
              <p className="text-2xl font-black text-emerald-700 mt-1 tabular-nums">+{metrics.totalRecoveredAdded.toLocaleString()} ETB</p>
              <span className="text-[11px] font-bold text-slate-500">Added back to cash drawer</span>
            </div>
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-300 shadow-xs">
              <span className="text-[10px] font-black uppercase text-amber-800">Total All-Time Still Unpaid</span>
              <p className="text-2xl font-black text-amber-950 mt-1 tabular-nums">
                {allPendingDebts.filter(d => d.status === 'pending').reduce((s, d) => s + Number(d.remainingAmount || 0), 0).toLocaleString()} ETB
              </p>
              <span className="text-[11px] font-bold text-amber-800">Across all waiters</span>
            </div>
          </div>

          {/* Waiter Accountability Scorecard */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>Waiter Performance & Pending Debt Scorecard</span>
            </h3>
            {waiterScorecard.length === 0 ? (
              <p className="text-xs text-slate-400 font-bold py-4 text-center">No waiter activity in this period.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-black border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Waiter</th>
                      <th className="py-2.5 px-3 text-right">Orders</th>
                      <th className="py-2.5 px-3 text-right">Boxes</th>
                      <th className="py-2.5 px-3 text-right">Sales (Period)</th>
                      <th className="py-2.5 px-3 text-right">All Unpaid Debt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {waiterScorecard.map(w => (
                      <tr key={w.name} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-black text-slate-900">{w.name}</td>
                        <td className="py-2.5 px-3 text-right font-bold">{w.orders}</td>
                        <td className="py-2.5 px-3 text-right font-bold">{w.boxes}</td>
                        <td className="py-2.5 px-3 text-right font-black text-emerald-800">{w.salesETB.toLocaleString()} ETB</td>
                        <td className="py-2.5 px-3 text-right">
                          {w.allUnpaidETB > 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-black">{w.allUnpaidETB.toLocaleString()} ETB</span>
                          ) : (
                            <span className="text-emerald-700 font-bold">0 ETB ✔</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Period Pending Debts Table */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-black text-slate-900">Pending Debts Logged in {rangeTitle}</h3>
            {filteredPendingDebts.length === 0 ? (
              <p className="text-xs text-slate-400 font-bold py-4 text-center">No pending debts created in this calendar period.</p>
            ) : (
              <div className="space-y-2">
                {filteredPendingDebts.map(d => (
                  <div key={d.id} className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                    <div>
                      <span className="font-black text-slate-900">{d.waiterName}</span>
                      <span className="text-slate-500 font-bold ml-2">• {d.dishName} ({d.remainingUnits}/{d.totalUnits} units)</span>
                      <span className="text-[10px] text-slate-400 block">{d.date} • {d.shift} Shift</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900">{Number(d.remainingAmount || 0).toLocaleString()} ETB left</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                        d.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                      }`}>
                        {d.status === 'completed' ? 'Paid ✔' : 'Pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 6: TRANSFERS & DAY CLOSES / SETTLEMENTS LOG               */}
      {/* ============================================================== */}
      {subView === 'settlements' && (
        <div className="space-y-5">
          {/* Bank & Telebirr Channel Totals */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Bank & Telebirr Transfers by Channel ({rangeTitle})</span>
              </h3>
              <span className="text-sm font-black text-emerald-800">{metrics.totalBankTransfers.toLocaleString()} ETB</span>
            </div>
            {Object.keys(metrics.transferChannelMap).length === 0 ? (
              <p className="text-xs text-slate-400 font-bold py-3">No digital transfers in this period.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(metrics.transferChannelMap).map(([channel, amt]) => (
                  <div key={channel} className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                    <span className="text-[11px] font-bold text-slate-600 block truncate">{channel}</span>
                    <span className="text-lg font-black text-emerald-900 tabular-nums">{amt.toLocaleString()} ETB</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Settlements Table */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900">Shift Reconciliation Settlements Log</h2>
                <p className="text-[11px] text-slate-500 font-bold">Saved Day & Night closes — inspect, print receipt, or check mismatch alarms</p>
              </div>
              <span className="text-xs font-black text-emerald-900 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
                {filteredSettlements.length} Shift Records
              </span>
            </div>

            {filteredSettlements.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                <p className="text-sm font-bold text-slate-700">No shift settlements found for {rangeTitle}.</p>
                {onOpenShiftReconciliation && (
                  <button
                    type="button"
                    onClick={onOpenShiftReconciliation}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Open Daily Income Sheet</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-black text-[11px] uppercase bg-slate-50/80">
                      <th className="py-3 px-3">Date & Shift</th>
                      <th className="py-3 px-3">Boxes</th>
                      <th className="py-3 px-3">Cups / beU</th>
                      <th className="py-3 px-3">Gross Sales</th>
                      <th className="py-3 px-3">Expenses</th>
                      <th className="py-3 px-3">Transfers</th>
                      <th className="py-3 px-3">Chef Audit</th>
                      <th className="py-3 px-3 text-right">Drawer Cash</th>
                      <th className="py-3 px-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSettlements.map((s) => (
                      <tr key={s.id} className={`hover:bg-slate-50/80 ${s.chefAudit?.hasMismatch ? 'bg-rose-50/40' : ''}`}>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900">{s.date}</span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              s.shift === 'Day' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                            }`}>
                              {s.shift === 'Day' ? '☀️ Day' : '🌙 Night'}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block">{toEthiopianDateString(`${s.date}T12:00:00`)}</span>
                        </td>
                        <td className="py-3 px-3 font-bold">{s.assignedBoxes || s.targetFoodSold || 0}</td>
                        <td className="py-3 px-3 font-bold">{s.juiceSold || 0} <span className="text-slate-400">({s.beuDeliveryCups || 0} beU)</span></td>
                        <td className="py-3 px-3 font-black">{(s.totalGrossSales || 0).toLocaleString()} ETB</td>
                        <td className="py-3 px-3 font-bold text-rose-700">-{(s.totalDailyExpenses || 0).toLocaleString()}</td>
                        <td className="py-3 px-3 font-bold text-emerald-800">-{(s.totalBankTransfers || 0).toLocaleString()}</td>
                        <td className="py-3 px-3">
                          {s.chefAudit?.hasMismatch ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-600 text-white font-black">🚨 Mismatch</span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black">✔ Clean</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-black text-emerald-900">
                          {(s.physicalCashInDrawer || 0).toLocaleString()} ETB
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button type="button" onClick={() => setActivePrintSlip(s)} className="p-1.5 bg-slate-100 hover:bg-emerald-50 rounded-lg border border-slate-200"><Printer className="w-3.5 h-3.5" /></button>
                            <button type="button" onClick={() => setInspectSettlement(s)} className="p-1.5 bg-slate-100 hover:bg-emerald-50 rounded-lg border border-slate-200"><Eye className="w-3.5 h-3.5" /></button>
                            <button type="button" onClick={() => handleDeleteSettlement(s.id)} className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg border border-slate-200"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 7: ORDERS AUDIT LOG (FROM APP.JSX)                        */}
      {/* ============================================================== */}
      {subView === 'orders' && ordersAuditContent && (
        <div>{ordersAuditContent}</div>
      )}

      {/* PRINT & INSPECT MODALS (PRESERVED) */}
      {activePrintSlip && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto font-mono text-xs">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-slate-500 text-[11px]">Shift Settlement Receipt</span>
              <button type="button" onClick={() => setActivePrintSlip(null)} className="text-slate-400 hover:text-slate-900 p-1 rounded-xl"><X className="w-4 h-4" /></button>
            </div>
            <div className="border border-slate-300 p-4 rounded-xl space-y-2 bg-slate-50 text-[11px]">
              <div className="text-center space-y-0.5 border-b pb-2">
                <h3 className="font-black text-sm">MARAKI JUICE & SALAD</h3>
                <p className="text-[10px] text-slate-600">DAILY SHIFT SETTLEMENT SLIP</p>
                <p className="text-[10px] text-slate-500">{activePrintSlip.date} • {toEthiopianDateString(`${activePrintSlip.date}T12:00:00`)}</p>
              </div>
              <div className="flex justify-between"><span>Shift:</span><strong>{activePrintSlip.shift}</strong></div>
              <div className="flex justify-between border-t pt-1"><span>🥤 Juice ({activePrintSlip.juiceSold} cups):</span><span>{(activePrintSlip.grossJuiceRevenue || 0).toLocaleString()} ETB</span></div>
              <div className="flex justify-between text-[10px] text-slate-500 pl-2"><span>- beU ({activePrintSlip.beuDeliveryCups} cups):</span><span>-{(activePrintSlip.beuDeliveryDeduction || 0).toLocaleString()} ETB</span></div>
              <div className="flex justify-between border-t pt-1"><span>🍱 Food ({activePrintSlip.assignedBoxes || activePrintSlip.targetFoodSold} boxes):</span><span>{(activePrintSlip.totalFoodRevenue || 0).toLocaleString()} ETB</span></div>
              <div className="flex justify-between border-t pt-1 font-black"><span>Gross Sales:</span><span>{(activePrintSlip.totalGrossSales || 0).toLocaleString()} ETB</span></div>
              <div className="flex justify-between text-rose-600"><span>- New Pending:</span><span>-{(activePrintSlip.deductedPendingDebt || 0).toLocaleString()} ETB</span></div>
              <div className="flex justify-between text-emerald-700"><span>+ Recovered:</span><span>+{(activePrintSlip.recoveredCashAdded || 0).toLocaleString()} ETB</span></div>
              <div className="flex justify-between text-rose-600"><span>- Expenses:</span><span>-{(activePrintSlip.totalDailyExpenses || 0).toLocaleString()} ETB</span></div>
              <div className="flex justify-between text-emerald-800"><span>- Transfers:</span><span>-{(activePrintSlip.totalBankTransfers || 0).toLocaleString()} ETB</span></div>
              <div className="border-t-2 border-dashed pt-2 flex justify-between font-black text-xs">
                <span>💵 Drawer Cash:</span>
                <span className="text-sm text-emerald-800">{(activePrintSlip.physicalCashInDrawer || 0).toLocaleString()} ETB</span>
              </div>
            </div>
            <button type="button" onClick={() => window.print()} className="w-full py-2.5 bg-emerald-600 text-white rounded-xl font-black text-xs flex items-center justify-center gap-1.5">
              <Printer className="w-4 h-4" /><span>Print Slip</span>
            </button>
          </div>
        </div>
      )}

      {inspectSettlement && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto text-slate-800 border border-emerald-100">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-black text-sm text-slate-900">Settlement Details Audit</h3>
                <p className="text-[11px] text-slate-500 font-bold">{inspectSettlement.date} • {inspectSettlement.shift} Shift</p>
              </div>
              <button type="button" onClick={() => setInspectSettlement(null)} className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 border"><span>Gross Juice ({inspectSettlement.juiceSold} cups)</span><span className="font-black">+{(inspectSettlement.grossJuiceRevenue || 0).toLocaleString()} ETB</span></div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 border"><span>Gross Food ({inspectSettlement.assignedBoxes} boxes)</span><span className="font-black">+{(inspectSettlement.totalFoodRevenue || 0).toLocaleString()} ETB</span></div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 border text-rose-700"><span>beU Deduction ({inspectSettlement.beuDeliveryCups} cups)</span><span className="font-black">-{(inspectSettlement.beuDeliveryDeduction || 0).toLocaleString()} ETB</span></div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 border text-rose-700"><span>Daily Expenses ({inspectSettlement.dailyExpenses?.length || 0})</span><span className="font-black">-{(inspectSettlement.totalDailyExpenses || 0).toLocaleString()} ETB</span></div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 border text-emerald-800"><span>Bank Transfers ({inspectSettlement.bankTransfers?.length || 0})</span><span className="font-black">-{(inspectSettlement.totalBankTransfers || 0).toLocaleString()} ETB</span></div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 border text-emerald-700"><span>Recovered Debts</span><span className="font-black">+{(inspectSettlement.recoveredCashAdded || 0).toLocaleString()} ETB</span></div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 border text-rose-700"><span>New Pending Debt</span><span className="font-black">-{(inspectSettlement.deductedPendingDebt || 0).toLocaleString()} ETB</span></div>
              <div className="flex justify-between p-3 rounded-xl bg-emerald-50 border-2 border-emerald-500 text-emerald-950 font-black text-sm">
                <span>Physical Cash in Drawer</span><span>{(inspectSettlement.physicalCashInDrawer || 0).toLocaleString()} ETB</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
