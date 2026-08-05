import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  ChefHat,
  HardHat,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Clock,
  Bike,
  AlertTriangle,
  Layers,
  Trash2,
} from 'lucide-react';
import { KitchenOrder, ShiftRecord, KitchenTaker } from '../types';

interface KitchenCheckViewProps {
  kitchenOrders: KitchenOrder[];
  shifts: ShiftRecord[];
  currencySymbol: string;
  onClearKitchenOrders?: (date?: string) => Promise<void>;
}

const TAKER_CONFIG: Record<
  KitchenTaker,
  { emoji: string; label: string; bg: string; text: string; border: string; badgeBg: string }
> = {
  day_shift: {
    emoji: '☀️',
    label: 'Day Shift',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  night_shift: {
    emoji: '🌙',
    label: 'Night Shift',
    bg: 'bg-indigo-50',
    text: 'text-indigo-800',
    border: 'border-indigo-200',
    badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  },
  beu_delivery: {
    emoji: '🚴',
    label: 'BeU Delivery',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
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
  const today = new Date().toISOString().split('T')[0];
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
  const [isClearing, setIsClearing] = useState(false);

  const selectedDate = availableDates[dateIdx] ?? new Date().toISOString().split('T')[0];

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

  // Filtered Chef orders (for log and active view)
  const filteredChefOrders = useMemo(() => {
    if (takerFilter === 'all') return dateOrders;
    return dateOrders.filter((o) => o.taker === takerFilter);
  }, [dateOrders, takerFilter]);

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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Kitchen Orders Breakdown</h2>
            <p className="text-sm text-slate-500">Classified view by Taker (Day Shift, Night Shift, BeU Delivery)</p>
          </div>
        </div>

        {onClearKitchenOrders && (
          <button
            onClick={() => handleClear(false)}
            disabled={isClearing || kitchenOrders.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Kitchen Data</span>
          </button>
        )}
      </div>

      {/* Date Navigator */}
      <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
        <button
          onClick={() => setDateIdx((i) => Math.min(i + 1, availableDates.length - 1))}
          disabled={dateIdx >= availableDates.length - 1}
          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 text-center">
          <p className="font-semibold text-slate-800 text-sm">{formatDate(selectedDate)}</p>
          {selectedDate === new Date().toISOString().split('T')[0] && (
            <p className="text-xs text-blue-500 font-medium">Today</p>
          )}
        </div>
        <button
          onClick={() => setDateIdx((i) => Math.max(i - 1, 0))}
          disabled={dateIdx <= 0}
          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer disabled:opacity-30"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Taker Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setTakerFilter('all')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${
            takerFilter === 'all'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>All Orders ({grandChefTotalItems})</span>
        </button>

        {(['day_shift', 'night_shift', 'beu_delivery'] as KitchenTaker[]).map((tk) => {
          const cfg = TAKER_CONFIG[tk];
          const count = classifiedByTaker[tk].totalCount;
          const isActive = takerFilter === tk;
          return (
            <button
              key={tk}
              onClick={() => setTakerFilter(tk)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer border ${
                isActive
                  ? `${cfg.badgeBg} shadow-sm`
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{cfg.emoji}</span>
              <span>{cfg.label}</span>
              <span className="ml-1 bg-white/60 px-2 py-0.5 rounded-full text-xs font-bold">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Cross-Check Result Banner */}
      {hasData && (
        <div className={`rounded-2xl p-4 border-2 flex items-start gap-4 ${
          itemsMatch ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          {itemsMatch ? (
            <CheckCircle2 className="w-8 h-8 text-green-500 flex-shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-8 h-8 text-red-500 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p className={`font-bold text-lg ${itemsMatch ? 'text-green-700' : 'text-red-700'}`}>
              {itemsMatch ? '✅ MATCH — Shift Reconciliation agrees with Chef Logs' : '❌ MISMATCH — Discrepancy Found!'}
            </p>
            {itemsMismatch && (
              <p className="text-red-600 text-sm mt-1 font-medium">
                Chef recorded total {grandChefTotalItems} items (Day: {classifiedByTaker.day_shift.totalCount}, Night: {classifiedByTaker.night_shift.totalCount}, BeU: {classifiedByTaker.beu_delivery.totalCount}) · Worker reported {workerTotalItems} items in shifts.{' '}
                <span className="font-bold">{diff > 0 ? `+${diff} extra in kitchen log` : `${Math.abs(diff)} missing from kitchen log`}</span>
              </p>
            )}
            {itemsMatch && (
              <p className="text-green-600 text-sm mt-1">
                Both chef and worker recorded {grandChefTotalItems} total food items.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Classified Cards per Taker */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['day_shift', 'night_shift', 'beu_delivery'] as KitchenTaker[]).map((tk) => {
          const cfg = TAKER_CONFIG[tk];
          const data = classifiedByTaker[tk];
          if (takerFilter !== 'all' && takerFilter !== tk) return null;

          return (
            <div
              key={tk}
              className={`rounded-2xl ${cfg.bg} border ${cfg.border} overflow-hidden flex flex-col shadow-sm`}
            >
              {/* Card Header */}
              <div className={`flex items-center justify-between px-4 py-3 border-b ${cfg.border} bg-white/50`}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{cfg.emoji}</span>
                  <span className={`font-bold text-sm ${cfg.text}`}>{cfg.label}</span>
                </div>
                <span className={`font-black text-base px-2.5 py-0.5 rounded-full ${cfg.badgeBg}`}>
                  {data.totalCount} items
                </span>
              </div>

              {/* Items List */}
              <div className="p-4 flex-1 space-y-2">
                {data.items.length === 0 ? (
                  <p className="text-slate-400 text-xs text-center py-4 italic">No orders logged for {cfg.label}</p>
                ) : (
                  data.items.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <span className="text-slate-800 font-medium truncate max-w-[70%]">{item.name}</span>
                      <span className="font-bold text-slate-700 bg-white/80 border border-slate-200 px-2 py-0.5 rounded-md text-xs">
                        ×{item.quantity}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Time-stamped Order Log */}
      <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <span className="font-bold text-slate-800 text-sm">
              Detailed Kitchen Order Stream ({filteredChefOrders.length} orders)
            </span>
          </div>
          {takerFilter !== 'all' && (
            <span className="text-xs text-slate-500 font-medium">Filtered by: {TAKER_CONFIG[takerFilter].label}</span>
          )}
        </div>

        {filteredChefOrders.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No orders logged for this selection.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {filteredChefOrders.map((order) => {
              const cfg = TAKER_CONFIG[order.taker];
              return (
                <div key={order.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${cfg.badgeBg} flex items-center gap-1 shrink-0`}>
                      <span>{cfg.emoji}</span>
                      <span>{cfg.label}</span>
                    </span>
                    <span className="text-slate-900 font-semibold text-sm truncate">{order.foodItemName}</span>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <span className="font-extrabold text-slate-800 text-sm bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                      ×{order.quantity}
                    </span>
                    <span className="text-slate-400 text-xs font-mono">{formatTime(order.orderTime)}</span>
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
