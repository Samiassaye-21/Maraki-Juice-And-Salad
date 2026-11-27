import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Coffee,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RefreshCw,
  ShieldAlert,
  TrendingDown,
  ShoppingBag,
  Settings2,
  ClipboardCheck
} from 'lucide-react';
import { computePackagingAudit, getOrderIsoDate, toLocalIsoDate } from '../utils/reconciliationHelpers';
import { toEthiopianDateString } from './BusinessManagement';
import { dbService } from '../lib/supabaseClient';

export default function BoxInventoryAudit({ orders = [], settlements = [], onStockChanged }) {
  const [activeItem, setActiveItem] = useState('box'); // 'box' | 'cup'
  const [refreshTick, setRefreshTick] = useState(0);

  // Persistent Purchases Ledger
  const [purchases, setPurchases] = useState(() => {
    const audit = computePackagingAudit({ orders, settlements });
    return audit.purchases;
  });

  // Persistent Manual Issues to Kitchen / Bar
  const [manualIssues, setManualIssues] = useState(() => {
    const audit = computePackagingAudit({ orders, settlements });
    return audit.manualIssues;
  });

  // Low-Stock Thresholds
  const [thresholds, setThresholds] = useState(() => {
    try {
      const saved = localStorage.getItem('maraki_stock_thresholds_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { boxLow: 50, cupLow: 100 };
  });

  // Waste counters
  const [wasteBoxes, setWasteBoxes] = useState(() => Number(localStorage.getItem('maraki_waste_boxes')) || 0);
  const [wasteCups, setWasteCups] = useState(() => Number(localStorage.getItem('maraki_waste_cups')) || 0);

  useEffect(() => {
    localStorage.setItem('maraki_box_purchases_v1', JSON.stringify(purchases));
    dbService.saveAppState('maraki_box_purchases_v1', purchases);
    // Sync legacy total bought into maraki_box_starting_stock so older views stay aligned
    const totalBoxes = purchases.filter(p => p.itemType === 'box').reduce((s, p) => s + Number(p.qty || 0), 0);
    localStorage.setItem('maraki_box_starting_stock', String(totalBoxes));
    dbService.saveAppState('maraki_box_starting_stock', totalBoxes);
    if (onStockChanged) onStockChanged();
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem('maraki_box_manual_issues_v1', JSON.stringify(manualIssues));
    dbService.saveAppState('maraki_box_manual_issues_v1', manualIssues);
    if (onStockChanged) onStockChanged();
  }, [manualIssues]);

  useEffect(() => {
    localStorage.setItem('maraki_stock_thresholds_v1', JSON.stringify(thresholds));
    dbService.saveAppState('maraki_stock_thresholds_v1', thresholds);
  }, [thresholds]);

  useEffect(() => {
    localStorage.setItem('maraki_waste_boxes', String(wasteBoxes));
    dbService.saveAppState('maraki_waste_boxes', wasteBoxes);
  }, [wasteBoxes]);

  useEffect(() => {
    localStorage.setItem('maraki_waste_cups', String(wasteCups));
    dbService.saveAppState('maraki_waste_cups', wasteCups);
  }, [wasteCups]);

  useEffect(() => {
    const handleRemoteSync = () => {
      const audit = computePackagingAudit({ orders, settlements });
      setPurchases(audit.purchases);
      setManualIssues(audit.manualIssues);
      try {
        const savedThresh = localStorage.getItem('maraki_stock_thresholds_v1');
        if (savedThresh) setThresholds(JSON.parse(savedThresh));
      } catch (e) {}
      setWasteBoxes(Number(localStorage.getItem('maraki_waste_boxes')) || 0);
      setWasteCups(Number(localStorage.getItem('maraki_waste_cups')) || 0);
    };
    window.addEventListener('maraki-supabase-synced', handleRemoteSync);
    return () => window.removeEventListener('maraki-supabase-synced', handleRemoteSync);
  }, [orders, settlements]);

  // Forms
  const [buyQty, setBuyQty] = useState('');
  const [buyCost, setBuyCost] = useState('');
  const [buyNote, setBuyNote] = useState('');
  const [buyDate, setBuyDate] = useState(() => toLocalIsoDate(new Date()));

  const [issueQty, setIssueQty] = useState('');
  const [issueShift, setIssueShift] = useState('Day');
  const [issueNote, setIssueNote] = useState('');
  const [issueDate, setIssueDate] = useState(() => toLocalIsoDate(new Date()));

  const [staffClaimCheck, setStaffClaimCheck] = useState(false);
  const [reportedRemaining, setReportedRemaining] = useState('0');
  const [showThresholdEdit, setShowThresholdEdit] = useState(false);

  // Recompute live audit metrics directly from live state (no localStorage lag!)
  const audit = useMemo(() => {
    return computePackagingAudit({
      orders,
      settlements,
      purchasesOverride: purchases,
      manualIssuesOverride: manualIssues
    });
  }, [orders, settlements, purchases, manualIssues, thresholds, wasteBoxes, wasteCups, refreshTick]);

  const currentStats = activeItem === 'box' ? audit.boxes : audit.cups;
  const itemLabel = activeItem === 'box' ? 'Food Boxes' : 'Juice Cups';
  const itemUnit = activeItem === 'box' ? 'boxes' : 'cups';
  const avgValuePerUnit = activeItem === 'box' ? 250 : 170;

  // Recent Daily Usage Breakdown (last 7 days from Chef Orders or Settlements)
  const dailyUsageRows = useMemo(() => {
    const map = {};
    if (activeItem === 'box') {
      orders.forEach(o => {
        const isHome = o.orderType === 'Home' || o.channel === 'In-Store Home';
        if (isHome) return;
        const d = getOrderIsoDate(o);
        if (!d) return;
        if (!map[d]) map[d] = { date: d, ordersCount: 0, usedQty: 0 };
        map[d].ordersCount += 1;
        map[d].usedQty += Number(o.boxesCount || 0);
      });
    } else {
      settlements.forEach(s => {
        const d = s.date;
        if (!d) return;
        if (!map[d]) map[d] = { date: d, ordersCount: 0, usedQty: 0 };
        map[d].ordersCount += 1;
        map[d].usedQty += Number(s.juiceSold || 0);
      });
    }
    return Object.values(map).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);
  }, [activeItem, orders, settlements]);

  const persistPurchasesNow = (nextList) => {
    setPurchases(nextList);
    localStorage.setItem('maraki_box_purchases_v1', JSON.stringify(nextList));
    const totalBoxes = nextList.filter(p => p.itemType === 'box').reduce((s, p) => s + Number(p.qty || 0), 0);
    localStorage.setItem('maraki_box_starting_stock', String(totalBoxes));
    if (onStockChanged) onStockChanged();
  };

  const persistIssuesNow = (nextList) => {
    setManualIssues(nextList);
    localStorage.setItem('maraki_box_manual_issues_v1', JSON.stringify(nextList));
    if (onStockChanged) onStockChanged();
  };

  const handleAddPurchase = (e) => {
    e.preventDefault();
    const qty = Number(buyQty);
    if (!qty || qty <= 0) return;
    const totalCost = Number(buyCost) || 0;
    const entry = {
      id: `pur-${Date.now()}`,
      itemType: activeItem,
      qty,
      unitCost: totalCost > 0 ? Math.round((totalCost / qty) * 100) / 100 : 0,
      totalCost,
      supplier: buyNote.trim() || 'Direct Purchase',
      note: buyNote.trim(),
      date: buyDate,
      createdAt: new Date().toISOString()
    };
    persistPurchasesNow([entry, ...purchases]);
    setBuyQty('');
    setBuyCost('');
    setBuyNote('');
    setRefreshTick(t => t + 1);
  };

  const handleAddIssue = (e) => {
    e.preventDefault();
    const qty = Number(issueQty);
    if (!qty || qty <= 0) return;
    const entry = {
      id: `iss-${Date.now()}`,
      itemType: activeItem,
      qty,
      shift: issueShift,
      issuedTo: activeItem === 'box' ? 'Kitchen / Waiters' : 'Juice Bar',
      note: issueNote.trim(),
      date: issueDate,
      createdAt: new Date().toISOString()
    };
    persistIssuesNow([entry, ...manualIssues]);
    setIssueQty('');
    setIssueNote('');
    setRefreshTick(t => t + 1);
  };

  const handleDeletePurchase = (id) => {
    if (!window.confirm('Delete this purchase record?')) return;
    persistPurchasesNow(purchases.filter(p => p.id !== id));
  };

  const handleDeleteIssue = (id) => {
    if (!window.confirm('Delete this kitchen issue record?')) return;
    persistIssuesNow(manualIssues.filter(i => i.id !== id));
  };

  const filteredPurchases = purchases.filter(p => p.itemType === activeItem);
  const filteredIssues = manualIssues.filter(i => i.itemType === activeItem);

  const statusMeta = {
    finished: {
      badge: '🔴 FINISHED / OUT OF STOCK',
      cardBg: 'bg-rose-50 border-rose-400 text-rose-950',
      pill: 'bg-rose-600 text-white animate-pulse',
      msg: `Remaining ${itemLabel.toLowerCase()} hit 0 (or below). Time to buy new stock immediately.`
    },
    low: {
      badge: '🟡 LOW STOCK WARNING',
      cardBg: 'bg-amber-50 border-amber-400 text-amber-950',
      pill: 'bg-amber-500 text-slate-950',
      msg: `Stock is below your ${currentStats.lowThreshold}-${itemUnit} warning level. Plan restock soon.`
    },
    healthy: {
      badge: '🟢 HEALTHY STOCK',
      cardBg: 'bg-emerald-50 border-emerald-300 text-emerald-950',
      pill: 'bg-emerald-600 text-white',
      msg: `Packaging inventory is healthy and sufficient for upcoming shifts.`
    },
    unset: {
      badge: '⚪ NO PURCHASES LOGGED',
      cardBg: 'bg-slate-50 border-slate-300 text-slate-800',
      pill: 'bg-slate-600 text-white',
      msg: `Enter the number of ${itemUnit} you bought below to start live tracking.`
    }
  }[currentStats.status];

  const stockPercent = currentStats.bought > 0
    ? Math.max(0, Math.min(100, Math.round((currentStats.totalRemaining / currentStats.bought) * 100)))
    : 0;

  return (
    <div className="space-y-6 text-slate-800">
      {/* HEADER + ITEM TOGGLE (BOXES vs CUPS) */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl font-black">
            {activeItem === 'box' ? '📦' : '🥤'}
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              Box & Cup Stock Audit & Cross-Check
            </h1>
            <p className="text-xs text-slate-500 font-bold mt-0.5">
              Track stock Bought → Given to Kitchen → Sold in Daily Orders, with Low/Finished Alerts
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveItem('box')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                activeItem === 'box' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Food Boxes ({audit.boxes.totalRemaining})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveItem('cup')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                activeItem === 'cup' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>Juice Cups ({audit.cups.totalRemaining})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowThresholdEdit(prev => !prev)}
            className="px-3 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black flex items-center gap-1.5 border border-slate-200"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Alert Settings</span>
          </button>
        </div>
      </div>

      {/* LOW STOCK THRESHOLD & WASTE EDITOR */}
      {showThresholdEdit && (
        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="text-[11px] font-black text-slate-700 block mb-1">Box Low-Stock Alert Below</label>
            <input
              type="number"
              min="1"
              value={thresholds.boxLow}
              onChange={(e) => setThresholds(prev => ({ ...prev, boxLow: Math.max(1, Number(e.target.value) || 0) }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-black"
            />
          </div>
          <div>
            <label className="text-[11px] font-black text-slate-700 block mb-1">Cup Low-Stock Alert Below</label>
            <input
              type="number"
              min="1"
              value={thresholds.cupLow}
              onChange={(e) => setThresholds(prev => ({ ...prev, cupLow: Math.max(1, Number(e.target.value) || 0) }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-black"
            />
          </div>
          <div>
            <label className="text-[11px] font-black text-slate-700 block mb-1">Damaged/Wasted Boxes</label>
            <input
              type="number"
              min="0"
              value={wasteBoxes}
              onChange={(e) => setWasteBoxes(Math.max(0, Number(e.target.value) || 0))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-black"
            />
          </div>
          <div>
            <label className="text-[11px] font-black text-slate-700 block mb-1">Damaged/Wasted Cups</label>
            <input
              type="number"
              min="0"
              value={wasteCups}
              onChange={(e) => setWasteCups(Math.max(0, Number(e.target.value) || 0))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-black"
            />
          </div>
        </div>
      )}

      {/* LIVE STATUS BANNER */}
      <div className={`p-5 rounded-3xl border-2 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${statusMeta.cardBg}`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-3 py-1 rounded-full text-[11px] font-black tracking-wide ${statusMeta.pill}`}>
              {statusMeta.badge}
            </span>
            <span className="text-xs font-black opacity-80">
              {currentStats.totalRemaining} {itemUnit} remaining overall ({stockPercent}% of total bought)
            </span>
          </div>
          <p className="text-xs font-bold opacity-85">{statusMeta.msg}</p>
        </div>

        <button
          type="button"
          onClick={() => setStaffClaimCheck(prev => !prev)}
          className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black flex items-center gap-2 shadow-md transition-all active:scale-95 whitespace-nowrap"
        >
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span>{staffClaimCheck ? 'Hide Cross-Check' : `Staff Says "${itemLabel} Finished"? Cross-Check`}</span>
        </button>
      </div>

      {/* 4 EXECUTIVE PIPELINE KPI CARDS: BOUGHT -> GIVEN -> SOLD -> REMAINING */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">1. Total Bought (Owner)</span>
          <p className="text-2xl font-black text-slate-900 mt-1 tabular-nums">{currentStats.bought.toLocaleString()}</p>
          <span className="text-[11px] text-emerald-700 font-bold block mt-1">
            Spend: {currentStats.spend.toLocaleString()} ETB
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">2. Given to Kitchen/Bar</span>
          <p className="text-2xl font-black text-slate-900 mt-1 tabular-nums">{currentStats.given.toLocaleString()}</p>
          <span className="text-[11px] text-slate-500 font-bold block mt-1">
            In Owner Storage: <strong className="text-emerald-700">{currentStats.storageRemaining}</strong>
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            3. Sold in {activeItem === 'box' ? 'Chef Orders' : 'Settlements'}
          </span>
          <p className="text-2xl font-black text-emerald-700 mt-1 tabular-nums">{currentStats.sold.toLocaleString()}</p>
          <span className="text-[11px] text-slate-500 font-bold block mt-1">
            + Waste/Damaged: {currentStats.waste}
          </span>
        </div>

        <div className={`p-4 rounded-2xl border shadow-xs ${
          currentStats.status === 'finished'
            ? 'bg-rose-50 border-rose-300'
            : currentStats.status === 'low'
              ? 'bg-amber-50 border-amber-300'
              : 'bg-emerald-50 border-emerald-300'
        }`}>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">4. Total Overall Remaining</span>
          <p className={`text-2xl font-black mt-1 tabular-nums ${
            currentStats.totalRemaining <= 0 ? 'text-rose-700' : 'text-emerald-900'
          }`}>
            {currentStats.totalRemaining.toLocaleString()} <span className="text-xs font-bold">{itemUnit}</span>
          </p>
          <div className="w-full bg-white/80 rounded-full h-2 mt-2 overflow-hidden border border-black/5">
            <div
              className={`h-full rounded-full transition-all ${
                currentStats.status === 'finished' ? 'bg-rose-600' : currentStats.status === 'low' ? 'bg-amber-500' : 'bg-emerald-600'
              }`}
              style={{ width: `${stockPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* STAFF SAYS FINISHED — CALM EXPECTED COUNT + OPTIONAL CROSS-CHECK */}
      {(staffClaimCheck || currentStats.given > 0) && (
        <div className={`rounded-3xl p-5 border-2 shadow-sm space-y-3 ${
          staffClaimCheck
            ? 'bg-white border-amber-400'
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-emerald-700" />
              <span>Kitchen / Bar Stock Count: Given vs Sold</span>
            </h3>
            <span className="text-[11px] font-bold text-slate-500">
              Given to Staff ({currentStats.given}) − Sold ({currentStats.sold}) − Waste ({currentStats.waste})
            </span>
          </div>

          {(() => {
            const expectedAtStation = activeItem === 'box' ? currentStats.expectedInKitchen : currentStats.expectedInBar;
            if (currentStats.given === 0) {
              return (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600">
                  Tip: Whenever you hand a pack of {itemUnit} to the chef or waiter (e.g. 50 or 100), log it in <strong>"Give to Kitchen/Bar"</strong> below. Then if they say "{itemUnit} are finished", click the Cross-Check button above to verify!
                </div>
              );
            }

            if (!staffClaimCheck) {
              return (
                <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs sm:text-sm font-black">
                      {expectedAtStation > 0
                        ? `📦 ${expectedAtStation} ${itemUnit} should still be unused at the kitchen/bar`
                        : `✅ All ${currentStats.given} ${itemUnit} given to kitchen/bar have been used in recorded orders`}
                    </p>
                    <p className="text-[11px] font-bold text-emerald-800 mt-0.5">
                      Out of {currentStats.given} {itemUnit} given, {currentStats.sold} were used in orders (+ {currentStats.waste} damaged/waste).
                      If staff tell you "{itemUnit} finished", click the Cross-Check button above.
                    </p>
                  </div>
                  <span className="px-3 py-1.5 rounded-xl bg-white border border-emerald-300 text-emerald-900 text-xs font-black whitespace-nowrap">
                    In Kitchen: {Math.max(0, expectedAtStation)} {itemUnit}
                  </span>
                </div>
              );
            }

            // Interactive Cross-Check Mode when staff claim stock is finished or count is entered
            const actualCount = Math.max(0, Number(reportedRemaining) || 0);
            const missingGap = expectedAtStation - actualCount;
            const unitCost = currentStats.avgUnitCost || 0;
            const emptyBoxCostLost = missingGap > 0 && unitCost > 0 ? Math.round(missingGap * unitCost) : 0;
            const potentialMealRevenue = missingGap > 0 ? missingGap * avgValuePerUnit : 0;

            return (
              <div className="space-y-3">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <label className="text-xs font-black text-slate-800 block">
                      How many {itemUnit} does the Chef / Waiter say are left right now?
                    </label>
                    <span className="text-[10px] font-bold text-slate-500">
                      Leave as 0 if they say "{itemUnit} are completely finished"
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={reportedRemaining}
                      onChange={(e) => setReportedRemaining(e.target.value)}
                      className="w-24 bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-black text-center outline-none focus:border-emerald-500"
                    />
                    <span className="text-xs font-bold text-slate-600">{itemUnit} left</span>
                  </div>
                </div>

                {missingGap > 0 ? (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-950 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs sm:text-sm font-black">
                        🚨 SHORTAGE DETECTED: {missingGap} {itemUnit} unaccounted for!
                      </p>
                      <span className="px-3 py-1 rounded-xl bg-rose-600 text-white text-xs font-black">
                        Missing: {missingGap} {itemUnit}
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-rose-800">
                      System expects <strong>{expectedAtStation} {itemUnit}</strong> still in kitchen ({currentStats.given} given − {currentStats.sold} sold − {currentStats.waste} waste),
                      but staff report only <strong>{actualCount} left</strong>.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                      {emptyBoxCostLost > 0 && (
                        <div className="bg-white/90 p-2.5 rounded-xl border border-rose-200">
                          <span className="text-[10px] font-bold text-slate-500 block">Empty {itemLabel} Purchase Cost:</span>
                          <strong className="text-rose-800 font-black">{emptyBoxCostLost.toLocaleString()} ETB</strong>
                          <span className="text-[10px] text-slate-400 block">({missingGap} × {unitCost} ETB/unit)</span>
                        </div>
                      )}
                      <div className="bg-white/90 p-2.5 rounded-xl border border-rose-200">
                        <span className="text-[10px] font-bold text-slate-500 block">If Sold as Unrecorded Orders (~{avgValuePerUnit} ETB each):</span>
                        <strong className="text-rose-800 font-black">{potentialMealRevenue.toLocaleString()} ETB</strong>
                        <span className="text-[10px] text-slate-400 block">Estimated meal sales missing from POS</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs sm:text-sm font-black">
                      ✅ VERIFIED: No shortage! Kitchen count matches system records ({expectedAtStation} expected vs {actualCount} reported).
                    </p>
                    <span className="px-3 py-1 rounded-xl bg-emerald-600 text-white text-xs font-black">Matched ✔</span>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* DUAL ACTION PANELS: 1) BUY NEW STOCK   2) GIVE TO KITCHEN/BAR */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* PANEL 1: BUY NEW STOCK */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                <span>+ Buy {itemLabel} (Add to Owner Stock)</span>
              </h3>
              <p className="text-[11px] text-slate-400 font-bold">Record every batch you purchase</p>
            </div>
          </div>

          <form onSubmit={handleAddPurchase} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70">
            <div className="sm:col-span-3">
              <label className="text-[10px] font-black text-slate-600 block mb-1">Qty Bought *</label>
              <input
                type="number"
                required
                min="1"
                value={buyQty}
                onChange={(e) => setBuyQty(e.target.value)}
                placeholder="e.g. 200"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-black outline-none focus:border-emerald-500"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="text-[10px] font-black text-slate-600 block mb-1">Total Cost (ETB)</label>
              <input
                type="number"
                min="0"
                value={buyCost}
                onChange={(e) => setBuyCost(e.target.value)}
                placeholder="Optional"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-black outline-none focus:border-emerald-500"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="text-[10px] font-black text-slate-600 block mb-1">Date</label>
              <input
                type="date"
                value={buyDate}
                onChange={(e) => setBuyDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs font-bold outline-none focus:border-emerald-500"
              />
            </div>
            <div className="sm:col-span-3">
              <button
                type="submit"
                className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1 shadow-sm active:scale-95 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Stock</span>
              </button>
            </div>
            <div className="sm:col-span-12">
              <input
                type="text"
                value={buyNote}
                onChange={(e) => setBuyNote(e.target.value)}
                placeholder="Supplier or note (optional, e.g. Merkato packaging shop)"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:border-emerald-500"
              />
            </div>
          </form>

          {/* Purchases History */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {filteredPurchases.length === 0 ? (
              <p className="text-xs text-slate-400 font-bold text-center py-4">No {itemUnit} purchase batches yet.</p>
            ) : (
              filteredPurchases.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
                  <div>
                    <p className="font-black text-slate-900">+{p.qty} {itemUnit} {p.totalCost > 0 && <span className="text-emerald-700">({p.totalCost.toLocaleString()} ETB)</span>}</p>
                    <p className="text-[10px] text-slate-500 font-bold">
                      {p.date} ({toEthiopianDateString(`${p.date}T12:00:00`)}) • {p.supplier || p.note}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeletePurchase(p.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* PANEL 2: GIVE TO KITCHEN / BAR */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-emerald-600" />
                <span>Give {itemLabel} to {activeItem === 'box' ? 'Kitchen / Waiters' : 'Juice Bar'}</span>
              </h3>
              <p className="text-[11px] text-slate-400 font-bold">Track packs handed out from your storage</p>
            </div>
          </div>

          <form onSubmit={handleAddIssue} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70">
            <div className="sm:col-span-3">
              <label className="text-[10px] font-black text-slate-600 block mb-1">Qty Given *</label>
              <input
                type="number"
                required
                min="1"
                value={issueQty}
                onChange={(e) => setIssueQty(e.target.value)}
                placeholder="e.g. 50"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-black outline-none focus:border-emerald-500"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="text-[10px] font-black text-slate-600 block mb-1">Shift</label>
              <select
                value={issueShift}
                onChange={(e) => setIssueShift(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs font-bold outline-none focus:border-emerald-500"
              >
                <option value="Day">☀️ Day</option>
                <option value="Night">🌙 Night</option>
              </select>
            </div>
            <div className="sm:col-span-3">
              <label className="text-[10px] font-black text-slate-600 block mb-1">Date</label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs font-bold outline-none focus:border-emerald-500"
              />
            </div>
            <div className="sm:col-span-3">
              <button
                type="submit"
                className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1 shadow-sm active:scale-95 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Issue</span>
              </button>
            </div>
            <div className="sm:col-span-12">
              <input
                type="text"
                value={issueNote}
                onChange={(e) => setIssueNote(e.target.value)}
                placeholder="Given to who? (e.g. Chef Almaz / Day shift pack)"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:border-emerald-500"
              />
            </div>
          </form>

          {/* Issues History */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {filteredIssues.length === 0 ? (
              <p className="text-xs text-slate-400 font-bold text-center py-4">No kitchen/bar stock issues recorded yet.</p>
            ) : (
              filteredIssues.map(iss => (
                <div key={iss.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
                  <div>
                    <p className="font-black text-slate-900">
                      Issued {iss.qty} {itemUnit} <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 ml-1">{iss.shift}</span>
                    </p>
                    <p className="text-[10px] text-slate-500 font-bold">
                      {iss.date} • {iss.note || iss.issuedTo}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteIssue(iss.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* DAILY USAGE LOG FROM SYSTEM ORDERS / SETTLEMENTS */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900">
            Recent Daily {itemLabel} Used (System Auto-Count)
          </h3>
          <span className="text-[11px] font-bold text-slate-400">Last 7 active days</span>
        </div>
        {dailyUsageRows.length === 0 ? (
          <p className="text-xs text-slate-400 font-bold py-4 text-center">No daily usage recorded yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
            {dailyUsageRows.map(row => (
              <div key={row.date} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] font-black text-slate-500 block">{row.date}</span>
                <span className="text-lg font-black text-emerald-800 block mt-1">{row.usedQty}</span>
                <span className="text-[10px] font-bold text-slate-400">{itemUnit} ({row.ordersCount} {activeItem === 'box' ? 'orders' : 'shifts'})</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
