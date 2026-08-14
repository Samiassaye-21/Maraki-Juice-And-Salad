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
    bg: 'bg-white',
    text: 'text-[#403c21]',
    border: 'border-[#403c21]/20',
    badgeBg: 'bg-[#403c21] text-[#403c21] font-extrabold border-[#403c21]',
    accentGradient: 'from-[#f7f5f0] to-white',
  },
  night_shift: {
    emoji: '🌙',
    label: 'Night Shift (ሌሊት ሸፍት)',
    shortLabel: 'Night Shift',
    subLabel: '2:00 evening – morning 2:00 ET',
    bg: 'bg-white',
    text: 'text-[#403c21]',
    border: 'border-[#403c21]/20',
    badgeBg: 'bg-[#403c21] text-[#403c21] font-extrabold border-[#403c21]',
    accentGradient: 'from-[#f7f5f0] to-white',
  },
  beu_delivery: {
    emoji: '🚴',
    label: 'BeU Delivery',
    shortLabel: 'BeU Delivery',
    subLabel: 'Online / Rider Orders',
    bg: 'bg-white',
    text: 'text-[#403c21]',
    border: 'border-[#403c21]/20',
    badgeBg: 'bg-[#403c21] text-[#403c21] font-extrabold border-[#403c21]',
    accentGradient: 'from-[#f7f5f0] to-white',
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
      className="space-y-6 max-w-7xl mx-auto text-[#403c21] font-sans"
    >
      {/* ─── Top Header & Controls ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-[#403c21]/20 p-5 rounded-3xl shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#f7f5f0] text-[#403c21] border border-[#403c21]/20 flex items-center justify-center">
            <ChefHat className="w-6.5 h-6.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-[#403c21] tracking-tight">
                Kitchen Check & Reconciliation
              </h2>
              <span className="bg-[#403c21] text-[#403c21] text-xs px-3 py-0.5 rounded-full font-extrabold">
                Audit Dashboard
              </span>
            </div>
            <p className="text-xs text-neutral-600 font-medium mt-0.5">
              Classified orders breakdown by Taker & Ethiopian Shift Clock
            </p>
          </div>
        </div>

        {/* Action Controls & Date Navigator */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Selector Pill */}
          <div className="flex items-center gap-1.5 bg-[#f7f5f0] p-1.5 rounded-full border border-[#403c21]/20">
            <button
              onClick={() => setDateIdx((i) => Math.min(i + 1, availableDates.length - 1))}
              disabled={dateIdx >= availableDates.length - 1}
              className="p-1.5 rounded-full hover:bg-slate-200 text-[#403c21] transition-all cursor-pointer disabled:opacity-30"
              title="Previous Date"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 text-center min-w-[140px]">
              <div className="flex items-center justify-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#403c21]" />
                <p className="font-extrabold text-[#403c21] text-xs">
                  {formatDate(selectedDate)}
                </p>
              </div>
              {selectedDate === getOperationalDate() && (
                <span className="inline-block text-[10px] font-extrabold text-[#403c21] uppercase tracking-wider">
                  Active Shift Date
                </span>
              )}
            </div>
            <button
              onClick={() => setDateIdx((i) => Math.max(i - 1, 0))}
              disabled={dateIdx <= 0}
              className="p-1.5 rounded-full hover:bg-slate-200 text-[#403c21] transition-all cursor-pointer disabled:opacity-30"
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
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-extrabold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Orders</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── Metric Stat Cards ──────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stat Card 1 (#403c21 Hero Style with #403c21 Accent) */}
        <div className="bg-[#403c21] border border-[#403c21]/40 text-white p-5 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[130px]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-[#403c21]">
                Chef Logged Items
              </p>
              <h3 className="text-3xl font-extrabold text-[#403c21] mt-1">
                {grandChefTotalItems} <span className="text-sm font-normal text-white/80">items</span>
              </h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#403c21] border border-[#403c21]/40 flex items-center justify-center text-[#403c21]">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-white/80 mt-2 font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#403c21]" />
            Recorded by kitchen staff for {selectedDate}
          </p>
        </div>

        {/* Stat Card 2 */}
        <div className="bg-white border border-[#403c21]/20 text-[#403c21] p-5 rounded-3xl shadow-xs flex flex-col justify-between min-h-[130px]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Worker Shift Sales
              </p>
              <h3 className="text-3xl font-extrabold text-[#403c21] mt-1">
                {workerTotalItems} <span className="text-sm font-normal text-neutral-500">items</span>
              </h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#f7f5f0] border border-[#403c21]/20 flex items-center justify-center text-[#403c21]">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-neutral-600 mt-2 font-medium">
            Reported in closed worker shift reconciliations
          </p>
        </div>

        {/* Stat Card 3 */}
        <div className="bg-white border border-[#403c21]/20 text-[#403c21] p-5 rounded-3xl shadow-xs flex flex-col justify-between min-h-[130px]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Audit Status
              </p>
              <h3 className="text-xl font-extrabold mt-1 flex items-center gap-1.5 text-[#403c21]">
                {!hasData ? (
                  'Pending Shift'
                ) : itemsMatch ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-[#403c21]" />
                    <span className="text-[#403c21]">Balanced</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-rose-600" />
                    <span className="text-rose-600">Discrepancy</span>
                  </>
                )}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#f7f5f0] border border-[#403c21]/20 flex items-center justify-center text-[#403c21]">
              <AlertCircle className="w-5 h-5 text-[#403c21]" />
            </div>
          </div>

          <p className="text-xs mt-2 font-medium">
            {!hasData ? (
              <span className="text-neutral-500">Waiting for shift reports...</span>
            ) : itemsMatch ? (
              <span className="text-[#403c21] font-bold">
                ✅ Chef & Worker records agree exactly ({grandChefTotalItems} items)
              </span>
            ) : (
              <span className="text-rose-600 font-bold">
                ❌ {diff > 0 ? `+${diff} extra in chef log` : `${Math.abs(diff)} missing from chef log`}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* ─── Breakdown Cards per Taker ──────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#403c21] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#403c21]" />
            <span>Shift Taker Summary</span>
          </h3>
          <span className="text-xs text-neutral-500 font-medium">
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
                className={`rounded-3xl bg-white border border-[#403c21]/20 overflow-hidden flex flex-col shadow-xs text-[#403c21]`}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#403c21]/15 bg-[#f7f5f0]">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{cfg.emoji}</span>
                    <div>
                      <h4 className="font-extrabold text-sm leading-tight text-[#403c21]">{cfg.shortLabel}</h4>
                      <p className="text-[10px] text-neutral-500 font-medium">{cfg.subLabel}</p>
                    </div>
                  </div>
                  <span className="font-extrabold text-xs px-3 py-1 rounded-full bg-[#403c21] text-[#403c21] shadow-xs">
                    {data.totalCount} items
                  </span>
                </div>

                {/* Items List */}
                <div className="p-4 flex-1 space-y-2">
                  {data.items.length === 0 ? (
                    <div className="py-6 text-center text-neutral-400 text-xs italic">
                      No orders logged for {cfg.shortLabel}
                    </div>
                  ) : (
                    data.items.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between text-xs bg-[#f7f5f0] px-3.5 py-2 rounded-2xl border border-[#403c21]/15 text-[#403c21]"
                      >
                        <span className="text-[#403c21] font-bold truncate max-w-[70%]">
                          {item.name}
                        </span>
                        <span className="font-extrabold text-[#403c21] bg-[#403c21] px-2.5 py-0.5 rounded-full text-xs shadow-xs">
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
      <div className="rounded-3xl border border-[#403c21]/20 overflow-hidden bg-white shadow-xs text-[#403c21]">
        {/* Stream Header & Controls */}
        <div className="p-4 bg-[#f7f5f0] border-b border-[#403c21]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white text-[#403c21] border border-[#403c21]/20 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#403c21] text-sm">
                Detailed Order Stream
              </h3>
              <p className="text-[11px] text-neutral-500 font-medium">
                {filteredChefOrders.length} orders match current filter
              </p>
            </div>
          </div>

          {/* Filter Pills & Search */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search food item..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-full bg-white border border-[#403c21]/30 text-[#403c21] font-bold focus:outline-none focus:border-[#403c21] w-36 sm:w-44 placeholder:text-neutral-400 shadow-xs"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-full border border-[#403c21]/20 shadow-xs">
              <button
                onClick={() => setTakerFilter('all')}
                className={`px-3 py-1 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                  takerFilter === 'all'
                    ? 'bg-[#403c21] text-[#403c21] shadow-xs'
                    : 'text-neutral-600 hover:text-[#403c21]'
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
                    className={`px-3 py-1 rounded-full text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                      isActive
                        ? 'bg-[#403c21] text-[#403c21] shadow-xs'
                        : 'text-neutral-600 hover:text-[#403c21]'
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
          <div className="p-12 text-center text-neutral-500 text-sm">
            <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-30 text-[#403c21]" />
            <p className="font-extrabold text-[#403c21]">No orders found</p>
            <p className="text-xs mt-1 text-neutral-500 font-medium">Try selecting another date or clearing the search filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#403c21]/15 max-h-96 overflow-y-auto">
            {filteredChefOrders.map((order) => {
              const cfg = TAKER_CONFIG[order.taker];
              return (
                <div
                  key={order.id}
                  className="flex items-center justify-between px-5 py-3 hover:bg-[#f7f5f0] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#403c21] text-[#403c21] flex items-center gap-1 shrink-0 shadow-xs">
                      <span>{cfg.emoji}</span>
                      <span>{cfg.shortLabel}</span>
                    </span>
                    <span className="text-[#403c21] font-extrabold text-sm truncate">
                      {order.foodItemName}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-extrabold text-[#403c21] text-xs bg-[#403c21] px-3 py-1 rounded-full shadow-xs">
                      ×{order.quantity}
                    </span>
                    <span className="text-neutral-600 text-xs font-medium bg-[#f7f5f0] px-3 py-1 rounded-full border border-[#403c21]/20 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#403c21]" />
                      <span>{formatEthiopianTime(order.orderTime)}</span>
                      <span className="text-neutral-500 text-[10px] font-mono">({formatTime(order.orderTime)})</span>
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
