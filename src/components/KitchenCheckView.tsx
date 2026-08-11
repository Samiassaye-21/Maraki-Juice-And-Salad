import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChefHat,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Trash2,
  Layers,
  Search,
  Calendar,
  AlertCircle,
  Sparkles,
  ShoppingBag,
  Receipt,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { KitchenOrder, ShiftRecord, KitchenTaker } from '../types';
import { getOperationalDate, formatEthiopianTime } from '../utils/shiftUtils';

interface KitchenCheckViewProps {
  kitchenOrders: KitchenOrder[];
  shifts: ShiftRecord[];
  currencySymbol: string;
  onClearKitchenOrders?: (date?: string) => Promise<void>;
}

const TAKER_CONFIG: Record<
  KitchenTaker,
  { 
    emoji: string; 
    label: string; 
    shortLabel: string;
    subLabel: string;
    bg: string; 
    text: string; 
    border: string; 
    badgeBg: string;
    accentGradient: string;
  }
> = {
  day_shift: {
    emoji: '☀️',
    label: 'Day Shift (ቀን ሸፍት)',
    shortLabel: 'Day Shift',
    subLabel: '2:00 morning – 2:00 evening ET',
    bg: 'bg-amber-50/70 dark:bg-amber-950/20',
    text: 'text-amber-900 dark:text-amber-300',
    border: 'border-amber-200/80 dark:border-amber-800/40',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-300/80 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-700/60',
    accentGradient: 'from-amber-500 to-orange-500',
  },
  night_shift: {
    emoji: '🌙',
    label: 'Night Shift (ሌሊት ሸፍት)',
    shortLabel: 'Night Shift',
    subLabel: '2:00 evening – morning 2:00 ET',
    bg: 'bg-indigo-50/70 dark:bg-indigo-950/20',
    text: 'text-indigo-900 dark:text-indigo-300',
    border: 'border-indigo-200/80 dark:border-indigo-800/40',
    badgeBg: 'bg-indigo-100 text-indigo-900 border-indigo-300/80 dark:bg-indigo-900/40 dark:text-indigo-200 dark:border-indigo-700/60',
    accentGradient: 'from-indigo-600 to-purple-600',
  },
  beu_delivery: {
    emoji: '🚴',
    label: 'BeU Delivery',
    shortLabel: 'BeU Delivery',
    subLabel: 'Online / Rider Orders',
    bg: 'bg-emerald-50/70 dark:bg-emerald-950/20',
    text: 'text-emerald-900 dark:text-emerald-300',
    border: 'border-emerald-200/80 dark:border-emerald-800/40',
    badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300/80 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-700/60',
    accentGradient: 'from-emerald-500 to-teal-600',
  },
};

function formatTime(isoStr: string) {
  const d = new Date(isoStr);
  return d.toLocaleTimeString('en-ET', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

// Get list of unique dates that have kitchen orders
function getAvailableDates(orders: KitchenOrder[]): string[] {
  const set = new Set(orders.map((o) => o.date));
  const arr = Array.from(set).sort((a, b) => b.localeCompare(a)); // newest first
  const today = getOperationalDate();
  if (!set.has(today)) arr.unshift(today);
  return arr;
}

export const KitchenCheckView: React.FC<KitchenCheckViewProps> = ({
  kitchenOrders,
  shifts,
  currencySymbol,
  onClearKitchenOrders,
}) => {
  const availableDates = useMemo(() => getAvailableDates(kitchenOrders), [kitchenOrders]);
  const [dateIdx, setDateIdx] = useState(0);
  const [takerFilter, setTakerFilter] = useState<'all' | KitchenTaker>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isClearing, setIsClearing] = useState(false);

  const selectedDate = availableDates[dateIdx] ?? getOperationalDate();

  const handleClear = async (dateOnly: boolean) => {
    const msg = dateOnly
      ? `Are you sure you want to clear kitchen orders for ${selectedDate}?`
      : 'Are you sure you want to clear ALL kitchen orders from the database?';
    if (!window.confirm(msg)) return;
    setIsClearing(true);
    try {
      if (onClearKitchenOrders) {
        await onClearKitchenOrders(dateOnly ? selectedDate : undefined);
      }
    } finally {
      setIsClearing(false);
    }
  };

  // All Chef orders for selected date
  const dateOrders = useMemo(() => {
    return kitchenOrders.filter((o) => o.date === selectedDate);
  }, [kitchenOrders, selectedDate]);

  // Filtered Chef orders (for log and active view with search)
  const filteredChefOrders = useMemo(() => {
    let list = dateOrders;
    if (takerFilter !== 'all') {
      list = list.filter((o) => o.taker === takerFilter);
    }
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      list = list.filter((o) => o.foodItemName.toLowerCase().includes(q));
    }
    return list;
  }, [dateOrders, takerFilter, searchTerm]);

  // Aggregate chef orders classified by Taker
  const classifiedByTaker = useMemo(() => {
    const takers: KitchenTaker[] = ['day_shift', 'night_shift', 'beu_delivery'];
    const result: Record<KitchenTaker, { items: { name: string; quantity: number }[]; totalCount: number }> = {
      day_shift: { items: [], totalCount: 0 },
      night_shift: { items: [], totalCount: 0 },
      beu_delivery: { items: [], totalCount: 0 },
    };

    takers.forEach((tk) => {
      const tkOrders = dateOrders.filter((o) => o.taker === tk);
      const map: Record<string, number> = {};
      let sum = 0;
      tkOrders.forEach((o) => {
        map[o.foodItemName] = (map[o.foodItemName] || 0) + o.quantity;
        sum += o.quantity;
      });
      const itemList = Object.entries(map)
        .map(([name, quantity]) => ({ name, quantity }))
        .sort((a, b) => b.quantity - a.quantity);

      result[tk] = { items: itemList, totalCount: sum };
    });

    return result;
  }, [dateOrders]);

  const grandChefTotalItems = dateOrders.reduce((s, o) => s + o.quantity, 0);

  // Worker's shift records for same date
  const workerShifts = useMemo(() => {
    return shifts.filter((s) => s.date === selectedDate);
  }, [shifts, selectedDate]);

  const workerTotalItems = workerShifts.reduce((s, sh) => s + sh.foodTakeawaysSold, 0);

  // Match status
  const hasData = dateOrders.length > 0 && workerShifts.length > 0;
  const itemsMatch = hasData && grandChefTotalItems === workerTotalItems;
  const itemsMismatch = hasData && grandChefTotalItems !== workerTotalItems;
  const diff = grandChefTotalItems - workerTotalItems;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6 max-w-7xl mx-auto"
    >
      {/* ─── Top Header & Controls ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-3xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-md shadow-emerald-500/20 text-white">
            <ChefHat className="w-6.5 h-6.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Kitchen Check & Reconciliation
              </h2>
              <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs px-2.5 py-0.5 rounded-full font-bold border border-amber-300/60 dark:border-amber-800/60">
                Audit Dashboard
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Classified orders breakdown by Taker & Ethiopian Shift Clock
            </p>
          </div>
        </div>

        {/* Action Controls & Date Navigator */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Selector Pill */}
          <div className="flex items-center gap-1.5 bg-slate-100/90 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <button
              onClick={() => setDateIdx((i) => Math.min(i + 1, availableDates.length - 1))}
              disabled={dateIdx >= availableDates.length - 1}
              className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer disabled:opacity-30"
              title="Previous Date"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 text-center min-w-[140px]">
              <div className="flex items-center justify-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <p className="font-bold text-slate-900 dark:text-white text-xs">
                  {formatDate(selectedDate)}
                </p>
              </div>
              {selectedDate === getOperationalDate() && (
                <span className="inline-block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Active Shift Date
                </span>
              )}
            </div>
            <button
              onClick={() => setDateIdx((i) => Math.max(i - 1, 0))}
              disabled={dateIdx <= 0}
              className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer disabled:opacity-30"
              title="Next Date"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Clear Data Button */}
          {onClearKitchenOrders && (
            <button
              onClick={() => handleClear(false)}
              disabled={isClearing || kitchenOrders.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200/80 dark:border-red-900/50 transition-all cursor-pointer disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Orders</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── Metric Stat Cards (BitePoint Style) ──────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stat Card 1: Total Kitchen Orders (Deep Teal Primary) */}
        <div className="bg-gradient-to-br from-teal-800 via-emerald-800 to-slate-900 text-white p-5 rounded-3xl shadow-lg relative overflow-hidden border border-teal-700/50 flex flex-col justify-between min-h-[130px]">
          <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none">
            <ChefHat className="w-32 h-32 text-white" />
          </div>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-200">
                Chef Logged Items
              </p>
              <h3 className="text-3xl font-black text-white mt-1">
                {grandChefTotalItems} <span className="text-sm font-normal text-teal-200">items</span>
              </h3>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/15 text-teal-200">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-teal-200/80 mt-2 font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-300" />
            Recorded by kitchen staff for {selectedDate}
          </p>
        </div>

        {/* Stat Card 2: Worker Shift Reported Sales */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-3xl shadow-sm flex flex-col justify-between min-h-[130px]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Worker Shift Sales
              </p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                {workerTotalItems} <span className="text-sm font-normal text-slate-400">items</span>
              </h3>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Reported in closed worker shift reconciliations
          </p>
        </div>

        {/* Stat Card 3: Reconciliation Status */}
        <div className={`p-5 rounded-3xl shadow-sm border flex flex-col justify-between min-h-[130px] transition-all ${
          !hasData 
            ? 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
            : itemsMatch 
            ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300/80 dark:border-emerald-800/60' 
            : 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-300/80 dark:border-rose-800/60'
        }`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Audit Status
              </p>
              <h3 className={`text-xl font-extrabold mt-1 flex items-center gap-1.5 ${
                !hasData
                  ? 'text-slate-700 dark:text-slate-300'
                  : itemsMatch
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-rose-700 dark:text-rose-400'
              }`}>
                {!hasData ? (
                  'Pending Shift'
                ) : itemsMatch ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span>Balanced</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                    <span>Discrepancy</span>
                  </>
                )}
              </h3>
            </div>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              !hasData
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                : itemsMatch
                ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300'
            }`}>
              {!hasData ? (
                <AlertCircle className="w-5 h-5" />
              ) : itemsMatch ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
            </div>
          </div>

          <p className="text-xs mt-2 font-medium">
            {!hasData ? (
              <span className="text-slate-400">Waiting for shift reports...</span>
            ) : itemsMatch ? (
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                ✅ Chef & Worker records agree exactly ({grandChefTotalItems} items)
              </span>
            ) : (
              <span className="text-rose-700 dark:text-rose-400 font-semibold">
                ❌ {diff > 0 ? `+${diff} extra in chef log` : `${Math.abs(diff)} missing from chef log`}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* ─── Breakdown Cards per Taker (3 Columns) ──────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Shift Taker Summary</span>
          </h3>
          <span className="text-xs text-slate-400">
            Categorized food quantities
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['day_shift', 'night_shift', 'beu_delivery'] as KitchenTaker[]).map((tk) => {
            const cfg = TAKER_CONFIG[tk];
            const data = classifiedByTaker[tk];
            if (takerFilter !== 'all' && takerFilter !== tk) return null;

            return (
              <motion.div
                key={tk}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.15 }}
                className={`rounded-3xl ${cfg.bg} border ${cfg.border} overflow-hidden flex flex-col shadow-sm`}
              >
                {/* Header */}
                <div className={`flex items-center justify-between px-5 py-3.5 border-b ${cfg.border} bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm`}>
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{cfg.emoji}</span>
                    <div>
                      <h4 className={`font-black text-sm leading-tight ${cfg.text}`}>{cfg.shortLabel}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{cfg.subLabel}</p>
                    </div>
                  </div>
                  <span className={`font-black text-xs px-3 py-1 rounded-full border shadow-xs ${cfg.badgeBg}`}>
                    {data.totalCount} items
                  </span>
                </div>

                {/* Items List */}
                <div className="p-4 flex-1 space-y-2">
                  {data.items.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 dark:text-slate-500 text-xs italic">
                      No orders logged for {cfg.shortLabel}
                    </div>
                  ) : (
                    data.items.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between text-xs bg-white/80 dark:bg-slate-900/80 px-3 py-2 rounded-2xl border border-slate-200/60 dark:border-slate-800"
                      >
                        <span className="text-slate-800 dark:text-slate-200 font-bold truncate max-w-[70%]">
                          {item.name}
                        </span>
                        <span className="font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 rounded-lg text-xs">
                          ×{item.quantity}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ─── Detailed Time-Stamped Order Stream ────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
        {/* Stream Header & Controls */}
        <div className="p-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-200/70 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                Detailed Order Stream
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {filteredChefOrders.length} orders match current filter
              </p>
            </div>
          </div>

          {/* Filter Pills & Search */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search food item..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 w-36 sm:w-44"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-200/60 dark:bg-slate-900/60 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-800">
              <button
                onClick={() => setTakerFilter('all')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  takerFilter === 'all'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                All ({grandChefTotalItems})
              </button>
              {(['day_shift', 'night_shift', 'beu_delivery'] as KitchenTaker[]).map((tk) => {
                const cfg = TAKER_CONFIG[tk];
                const count = classifiedByTaker[tk].totalCount;
                const isActive = takerFilter === tk;
                return (
                  <button
                    key={tk}
                    onClick={() => setTakerFilter(tk)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      isActive
                        ? `${cfg.badgeBg} shadow-xs`
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <span>{cfg.emoji}</span>
                    <span className="hidden sm:inline">{cfg.shortLabel}</span>
                    <span className="opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Order Stream List */}
        {filteredChefOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500 text-sm">
            <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="font-semibold">No orders found</p>
            <p className="text-xs mt-1">Try selecting another date or clearing the search filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-96 overflow-y-auto">
            {filteredChefOrders.map((order) => {
              const cfg = TAKER_CONFIG[order.taker];
              return (
                <div
                  key={order.id}
                  className="flex items-center justify-between px-5 py-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${cfg.badgeBg} flex items-center gap-1 shrink-0`}>
                      <span>{cfg.emoji}</span>
                      <span>{cfg.shortLabel}</span>
                    </span>
                    <span className="text-slate-900 dark:text-white font-bold text-sm truncate">
                      {order.foodItemName}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-black text-slate-900 dark:text-white text-xs bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                      ×{order.quantity}
                    </span>
                    <span className="text-slate-600 dark:text-slate-400 text-xs font-medium bg-slate-100/70 dark:bg-slate-800/70 px-2.5 py-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{formatEthiopianTime(order.orderTime)}</span>
                      <span className="text-slate-400 text-[10px] font-mono">({formatTime(order.orderTime)})</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default KitchenCheckView;
