import React, { useState, useEffect, useMemo } from 'react';
import {
  BellRing,
  Package,
  Coffee,
  ClipboardCheck,
  BarChart3,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Clock,
  Receipt,
  Truck,
  Sparkles,
  CheckSquare
} from 'lucide-react';
import { toEthiopianDateString } from './BusinessManagement';
import { DEFAULT_RECONCILIATION_DISHES } from './ShiftReconciliation';
import {
  toLocalIsoDate,
  aggregateChefOrders,
  compareChefVsIncomeSheet,
  computePackagingAudit,
  getOrderIsoDate
} from '../utils/reconciliationHelpers';
import { getOrderBeuMetrics, formatEtb, roundPricePrecision } from '../utils/beuHelpers';

export default function OwnerDashboard({
  orders = [],
  settlements = [],
  onNavigateSection
}) {
  const todayIso = toLocalIsoDate(new Date());
  const [syncTick, setSyncTick] = useState(0);

  useEffect(() => {
    const onSynced = () => setSyncTick(t => t + 1);
    window.addEventListener('maraki-supabase-synced', onSynced);
    return () => window.removeEventListener('maraki-supabase-synced', onSynced);
  }, []);

  // Resolve localStorage collections safely
  const pendingDebts = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('maraki_waiter_pending_debts') || '[]');
    } catch (e) {
      return [];
    }
  }, [syncTick]);

  const ownerExpenses = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('maraki_actual_expenses') || '[]');
    } catch (e) {
      return [];
    }
  }, [syncTick]);

  const recurringPayables = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('maraki_plan_recurring') || '[]');
    } catch (e) {
      return [];
    }
  }, [syncTick]);

  const tasks = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('maraki_plan_tasks') || '[]');
    } catch (e) {
      return [];
    }
  }, [syncTick]);

  // Today's Settlements & Chef Orders
  const todaySettlements = useMemo(
    () => settlements.filter(s => s.date === todayIso),
    [settlements, todayIso]
  );

  const todayOrders = useMemo(
    () => orders.filter(o => getOrderIsoDate(o) === todayIso),
    [orders, todayIso]
  );

  // Live Check: Chef Sent vs Income Sheet Mismatches (Today + Recent Saved)
  const activeMismatchAlarms = useMemo(() => {
    const alarms = [];
    // Check saved settlements with mismatch flags
    settlements.slice(0, 20).forEach(s => {
      const chefSum = aggregateChefOrders(orders, s.date, s.shift, DEFAULT_RECONCILIATION_DISHES);
      const cmp = compareChefVsIncomeSheet(chefSum, s.foodAssignments || {}, DEFAULT_RECONCILIATION_DISHES);
      if (s.chefAudit?.hasMismatch || cmp.hasMismatch) {
        alarms.push({
          id: s.id,
          date: s.date,
          shift: s.shift,
          chefTotal: cmp.hasChefOrders ? cmp.chefTotalFood : (s.chefAudit?.chefTotalFood || 0),
          sheetTotal: cmp.hasChefOrders ? cmp.incomeSheetTotal : (s.chefAudit?.incomeSheetTotal || 0),
          diffCount: (cmp.dishDiffs?.length || s.chefAudit?.dishDiffs?.length || 0)
        });
      }
    });
    // Also check if Chef sent orders today for Day or Night that haven't been settled yet
    ['Day', 'Night'].forEach(sh => {
      const hasSaved = todaySettlements.some(s => s.shift === sh);
      if (!hasSaved) {
        const chefSum = aggregateChefOrders(orders, todayIso, sh, DEFAULT_RECONCILIATION_DISHES);
        if (chefSum.totalOrders > 0) {
          alarms.push({
            id: `pending-sheet-${todayIso}-${sh}`,
            date: todayIso,
            shift: sh,
            unsavedOnly: true,
            chefTotal: chefSum.totalFoodItems,
            sheetTotal: 0,
            diffCount: Object.keys(chefSum.dishCounts).length
          });
        }
      }
    });
    return alarms;
  }, [settlements, todaySettlements, orders, todayIso]);

  // Packaging Stock Audit (Boxes + Cups)
  const stockAudit = useMemo(
    () => computePackagingAudit({ orders, settlements }),
    [orders, settlements]
  );

  // Today's KPI numbers
  const todayDrawerCash = todaySettlements.reduce((s, x) => s + Number(x.physicalCashInDrawer || 0), 0);
  const todayGrossSales = todaySettlements.reduce((s, x) => s + Number(x.totalGrossSales || 0), 0);
  const todayChefSales = roundPricePrecision(todayOrders.reduce((s, o) => s + Number(o.totalAmount || 0), 0));
  const todayBeuFoodOrders = todayOrders.filter(o => o.channel === 'BEU Delivery' || o.isBeuOrder);
  const todayBeuFoodNet = roundPricePrecision(todayBeuFoodOrders.reduce((s, o) => s + getOrderBeuMetrics(o).netTotal, 0));
  const todayBeuFoodDeduction = roundPricePrecision(todayBeuFoodOrders.reduce((s, o) => s + getOrderBeuMetrics(o).deductionAmount, 0));
  const todayCupsSold = todaySettlements.reduce((s, x) => s + Number(x.juiceSold || 0), 0);
  const todayBeuCups = todaySettlements.reduce((s, x) => s + Number(x.beuDeliveryCups || 0), 0);
  const todayBoxesChef = todayOrders.reduce((s, o) => s + (o.orderType === 'Home' ? 0 : Number(o.boxesCount || 0)), 0);
  const todayShiftExp = todaySettlements.reduce((s, x) => s + Number(x.totalDailyExpenses || 0), 0);
  const todayOwnerExp = ownerExpenses.filter(e => e.date === todayIso).reduce((s, e) => s + Number(e.amount || 0), 0);
  const totalUnpaidDebts = pendingDebts.filter(d => d.status === 'pending').reduce((s, d) => s + Number(d.remainingAmount || 0), 0);
  const openTasks = tasks.filter(t => t.status !== 'Done');

  return (
    <div className="space-y-6 text-slate-800">
      {/* HERO WELCOME BAR */}
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            Maraki Juice & Salad • Executive Command
          </span>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-1">
            Owner Overview — {toEthiopianDateString(`${todayIso}T12:00:00`)}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-1">
            Today ({todayIso}) • {todayOrders.length} Chef Orders • {todaySettlements.length} Shift Sheets Closed
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigateSection('sheet')}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>Open Daily Sheet</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateSection('analysis')}
            className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-800 dark:text-white font-black text-xs flex items-center gap-1.5 border border-slate-200 dark:border-white/15 active:scale-95 transition-all"
          >
            <BarChart3 className="w-4 h-4 text-emerald-300" />
            <span>Deep Reports</span>
          </button>
        </div>
      </div>

      {/* LIVE ALARM CENTER (CHEF MISMATCHES + LOW/FINISHED STOCK) */}
      {(activeMismatchAlarms.some(a => !a.unsavedOnly) || stockAudit.boxes.status === 'finished' || stockAudit.boxes.status === 'low' || stockAudit.cups.status === 'finished' || stockAudit.cups.status === 'low') && (
        <div className="space-y-3">
          {activeMismatchAlarms.filter(a => !a.unsavedOnly).map(alarm => (
            <div
              key={alarm.id}
              onClick={() => onNavigateSection('analysis')}
              className="cursor-pointer bg-rose-50 hover:bg-rose-100/70 border-2 border-rose-500 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center animate-pulse">
                  <BellRing className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-rose-950">
                    🚨 RED ALARM: Waiter Income Sheet ≠ Chef Sent Orders ({alarm.date} • {alarm.shift} Shift)
                  </h3>
                  <p className="text-[11px] font-bold text-rose-800">
                    Chef Sent: {alarm.chefTotal} food items • Income Sheet: {alarm.sheetTotal} items ({alarm.diffCount} dish mismatch)
                  </p>
                </div>
              </div>
              <span className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-black">
                Inspect Mismatch →
              </span>
            </div>
          ))}

          {(stockAudit.boxes.status === 'finished' || stockAudit.boxes.status === 'low') && (
            <div
              onClick={() => onNavigateSection('stock')}
              className={`cursor-pointer border-2 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm transition-all ${
                stockAudit.boxes.status === 'finished'
                  ? 'bg-rose-50 border-rose-500 text-rose-950'
                  : 'bg-amber-50 border-amber-400 text-amber-950'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{stockAudit.boxes.status === 'finished' ? '🔴' : '🟡'}</span>
                <div>
                  <h3 className="text-xs sm:text-sm font-black">
                    {stockAudit.boxes.status === 'finished'
                      ? 'FOOD BOXES FINISHED (OUT OF STOCK!)'
                      : `LOW FOOD BOX STOCK: Only ${stockAudit.boxes.totalRemaining} boxes left`}
                  </h3>
                  <p className="text-[11px] font-bold opacity-80">
                    Bought: {stockAudit.boxes.bought} • Sold in Chef Orders: {stockAudit.boxes.sold} • Storage Left: {stockAudit.boxes.storageRemaining}
                  </p>
                </div>
              </div>
              <span className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-black">
                Open Box Audit →
              </span>
            </div>
          )}

          {(stockAudit.cups.status === 'finished' || stockAudit.cups.status === 'low') && (
            <div
              onClick={() => onNavigateSection('stock')}
              className={`cursor-pointer border-2 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm transition-all ${
                stockAudit.cups.status === 'finished'
                  ? 'bg-rose-50 border-rose-500 text-rose-950'
                  : 'bg-amber-50 border-amber-400 text-amber-950'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{stockAudit.cups.status === 'finished' ? '🔴' : '🟡'}</span>
                <div>
                  <h3 className="text-xs sm:text-sm font-black">
                    {stockAudit.cups.status === 'finished'
                      ? 'JUICE CUPS FINISHED (OUT OF STOCK!)'
                      : `LOW JUICE CUP STOCK: Only ${stockAudit.cups.totalRemaining} cups left`}
                  </h3>
                  <p className="text-[11px] font-bold opacity-80">
                    Bought: {stockAudit.cups.bought} • Sold: {stockAudit.cups.sold}
                  </p>
                </div>
              </div>
              <span className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-black">
                Open Cup Audit →
              </span>
            </div>
          )}
        </div>
      )}

      {/* TODAY'S KPI SNAPSHOT GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Drawer Cash (Today)</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-800 tabular-nums">{todayDrawerCash.toLocaleString()} ETB</p>
          <p className="text-[11px] text-slate-400 font-bold">
            Reconciled Sales: {todayGrossSales.toLocaleString()} ETB
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Chef Food Orders (Today)</span>
            <Receipt className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 tabular-nums">{todayOrders.length} <span className="text-xs font-bold text-slate-400">orders</span></p>
          <p className="text-[11px] text-slate-400 font-bold">
            {todayBoxesChef} Boxes • {formatEtb(todayChefSales)} ETB
            {todayBeuFoodOrders.length > 0 && ` • 🛵 ${todayBeuFoodOrders.length} BEU (-${formatEtb(todayBeuFoodDeduction)} ETB)`}
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Juice Cups & beU (Today)</span>
            <Coffee className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 tabular-nums">{todayCupsSold} <span className="text-xs font-bold text-slate-400">cups</span></p>
          <p className="text-[11px] text-slate-400 font-bold">
            beU Delivery: {todayBeuCups} cups • In-house: {Math.max(0, todayCupsSold - todayBeuCups)}
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Unpaid Waiter Debts</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className={`text-2xl font-black tabular-nums ${totalUnpaidDebts > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
            {totalUnpaidDebts.toLocaleString()} ETB
          </p>
          <p className="text-[11px] text-slate-400 font-bold">
            Today Expenses: {(todayShiftExp + todayOwnerExp).toLocaleString()} ETB
          </p>
        </div>
      </div>

      {/* BOX & CUP STOCK HEALTH + QUICK ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Packaging Stock Summary */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-600" />
              <span>Packaging Stock Status</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigateSection('stock')}
              className="text-xs font-black text-emerald-700 hover:underline"
            >
              Manage →
            </button>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-slate-800 block">📦 Food Boxes</span>
                <span className="text-[10px] font-bold text-slate-400">
                  Bought {stockAudit.boxes.bought} • Sold {stockAudit.boxes.sold}
                </span>
              </div>
              <span className={`text-sm font-black px-2.5 py-1 rounded-xl ${
                stockAudit.boxes.status === 'finished'
                  ? 'bg-rose-100 text-rose-700'
                  : stockAudit.boxes.status === 'low'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
              }`}>
                {stockAudit.boxes.totalRemaining} left
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-slate-800 block">🥤 Juice Cups</span>
                <span className="text-[10px] font-bold text-slate-400">
                  Bought {stockAudit.cups.bought} • Sold {stockAudit.cups.sold}
                </span>
              </div>
              <span className={`text-sm font-black px-2.5 py-1 rounded-xl ${
                stockAudit.cups.status === 'finished'
                  ? 'bg-rose-100 text-rose-700'
                  : stockAudit.cups.status === 'low'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
              }`}>
                {stockAudit.cups.totalRemaining} left
              </span>
            </div>
          </div>
        </div>

        {/* Next Goal / Task & Payables */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-600" />
              <span>Pending Tasks & Payables</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigateSection('plans')}
              className="text-xs font-black text-emerald-700 hover:underline"
            >
              Plans →
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            {openTasks.length === 0 ? (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 font-bold">
                No pending tasks — add goals or tasks in Plans & Goals.
              </div>
            ) : (
              openTasks.slice(0, 2).map(t => (
                <div key={t.id} className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between">
                  <span className="font-black text-slate-800 truncate">{t.title}</span>
                  <span className="text-[10px] font-black text-emerald-800 px-2 py-0.5 bg-white rounded-lg border border-emerald-200">
                    {t.priority || 'Task'}
                  </span>
                </div>
              ))
            )}

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="font-bold text-slate-600">Recurring Bills Tracked:</span>
              <button
                type="button"
                onClick={() => onNavigateSection('finance')}
                className="font-black text-emerald-700 hover:underline"
              >
                {recurringPayables.length} items →
              </button>
            </div>
          </div>
        </div>

        {/* 4 Quick Actions */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Quick Owner Actions</span>
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => onNavigateSection('sheet')}
              className="p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-left transition-all"
            >
              <span className="text-lg block">📋</span>
              <span className="text-xs font-black text-emerald-950 block mt-1">Daily Sheet</span>
              <span className="text-[10px] font-bold text-emerald-700">Close Shift</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateSection('analysis')}
              className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all"
            >
              <span className="text-lg block">📈</span>
              <span className="text-xs font-black text-slate-900 block mt-1">Income Reports</span>
              <span className="text-[10px] font-bold text-slate-500">Calendar Audit</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateSection('stock')}
              className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all"
            >
              <span className="text-lg block">📦</span>
              <span className="text-xs font-black text-slate-900 block mt-1">Buy / Check Boxes</span>
              <span className="text-[10px] font-bold text-slate-500">Stock Cross-Check</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateSection('finance')}
              className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all"
            >
              <span className="text-lg block">💸</span>
              <span className="text-xs font-black text-slate-900 block mt-1">Log Expense</span>
              <span className="text-[10px] font-bold text-slate-500">Bills & Budget</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateSection('menu')}
              className="col-span-2 p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-left transition-all flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-black block">🏷️ Edit Menu & Juice Prices</span>
                <span className="text-[10px] font-bold text-emerald-300">Owner-only pricing & Chef POS visibility</span>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
