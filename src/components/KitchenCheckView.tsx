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
} from 'lucide-react';
import { KitchenOrder, ShiftRecord, KitchenTaker } from '../types';

interface KitchenCheckViewProps {
  kitchenOrders: KitchenOrder[];
  shifts: ShiftRecord[];
  currencySymbol: string;
}

const TAKER_LABELS: Record<KitchenTaker, { emoji: string; label: string }> = {
  day_shift:    { emoji: '☀️', label: 'Day Shift' },
  night_shift:  { emoji: '🌙', label: 'Night Shift' },
  beu_delivery: { emoji: '🚴', label: 'BeU Delivery' },
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
}) => {
  const availableDates = useMemo(() => getAvailableDates(kitchenOrders), [kitchenOrders]);
  const [dateIdx, setDateIdx] = useState(0);
  const [shiftFilter, setShiftFilter] = useState<'all' | 'day' | 'night'>('all');

  const selectedDate = availableDates[dateIdx] ?? new Date().toISOString().split('T')[0];

  // Chef's orders for selected date + shift
  const chefOrders = useMemo(() => {
    return kitchenOrders.filter((o) => {
      if (o.date !== selectedDate) return false;
      if (shiftFilter === 'all') return true;
      return o.shiftType === shiftFilter;
    });
  }, [kitchenOrders, selectedDate, shiftFilter]);

  // Aggregate chef orders by food item name
  const chefAggregated = useMemo(() => {
    const map: Record<string, { name: string; quantity: number }> = {};
    chefOrders.forEach((o) => {
      if (!map[o.foodItemName]) map[o.foodItemName] = { name: o.foodItemName, quantity: 0 };
      map[o.foodItemName].quantity += o.quantity;
    });
    return Object.values(map).sort((a, b) => b.quantity - a.quantity);
  }, [chefOrders]);

  const chefTotalItems = chefOrders.reduce((s, o) => s + o.quantity, 0);

  // Worker's shift records for same date + shift
  const workerShifts = useMemo(() => {
    return shifts.filter((s) => {
      if (s.date !== selectedDate) return false;
      if (shiftFilter === 'all') return true;
      return s.shiftType === shiftFilter;
    });
  }, [shifts, selectedDate, shiftFilter]);

  const workerTotalItems = workerShifts.reduce((s, sh) => s + sh.foodTakeawaysSold, 0);
  const workerTotalRevenue = workerShifts.reduce((s, sh) => s + sh.foodRevenue, 0);

  // Match status
  const itemsMatch = chefOrders.length > 0 && workerShifts.length > 0 && chefTotalItems === workerTotalItems;
  const itemsMismatch = chefOrders.length > 0 && workerShifts.length > 0 && chefTotalItems !== workerTotalItems;
  const diff = chefTotalItems - workerTotalItems;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
          <ChefHat className="w-5 h-5 text-violet-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Kitchen Cross-Check</h2>
          <p className="text-sm text-slate-500">Compare chef orders vs worker shift reports</p>
        </div>
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

      {/* Shift Filter */}
      <div className="flex gap-2">
        {(['all', 'day', 'night'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setShiftFilter(f)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${
              shiftFilter === f
                ? f === 'night'
                  ? 'bg-slate-800 text-white'
                  : 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {f === 'all' ? '📋' : f === 'day' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            <span>{f === 'all' ? 'All Shifts' : f === 'day' ? 'Day' : 'Night'}</span>
          </button>
        ))}
      </div>

      {/* Cross-Check Result Banner */}
      {chefOrders.length > 0 && workerShifts.length > 0 && (
        <div className={`rounded-2xl p-4 border-2 flex items-start gap-4 ${
          itemsMatch
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}>
          {itemsMatch ? (
            <CheckCircle2 className="w-8 h-8 text-green-500 flex-shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-8 h-8 text-red-500 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p className={`font-bold text-lg ${itemsMatch ? 'text-green-700' : 'text-red-700'}`}>
              {itemsMatch ? '✅ MATCH — Records agree' : '❌ MISMATCH — Discrepancy found!'}
            </p>
            {itemsMismatch && (
              <p className="text-red-600 text-sm mt-1 font-medium">
                Chef logged {chefTotalItems} items · Worker reported {workerTotalItems} items ·{' '}
                <span className="font-bold">{diff > 0 ? `+${diff} unaccounted` : `${Math.abs(diff)} missing from chef log`}</span>
              </p>
            )}
            {itemsMatch && (
              <p className="text-green-600 text-sm mt-1">
                Both chef and worker recorded {chefTotalItems} food items.
              </p>
            )}
          </div>
        </div>
      )}

      {/* No data states */}
      {chefOrders.length === 0 && workerShifts.length === 0 && (
        <div className="rounded-2xl bg-slate-50 border border-slate-100 p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No data for this date/shift</p>
          <p className="text-slate-400 text-sm mt-1">Neither chef orders nor worker shift found</p>
        </div>
      )}
      {chefOrders.length === 0 && workerShifts.length > 0 && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <p className="text-amber-700 text-sm font-medium">
            Worker submitted a shift but the chef recorded no orders for this date/shift.
          </p>
        </div>
      )}
      {chefOrders.length > 0 && workerShifts.length === 0 && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <p className="text-amber-700 text-sm font-medium">
            Chef recorded orders but no shift report has been submitted yet.
          </p>
        </div>
      )}

      {/* Two-column comparison */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Chef Side */}
        <div className="rounded-2xl bg-violet-50 border border-violet-100 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-violet-100/60 border-b border-violet-100">
            <ChefHat className="w-4 h-4 text-violet-600" />
            <span className="font-bold text-violet-800 text-sm">👨‍🍳 Chef Recorded</span>
          </div>
          <div className="p-4 space-y-3">
            {chefAggregated.length === 0 ? (
              <p className="text-violet-400 text-sm text-center py-4">No orders recorded</p>
            ) : (
              chefAggregated.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <span className="text-slate-700 text-sm font-medium truncate max-w-[65%]">{item.name}</span>
                  <span className="font-bold text-violet-700 bg-violet-100 px-2.5 py-0.5 rounded-full text-sm">
                    ×{item.quantity}
                  </span>
                </div>
              ))
            )}
            {chefAggregated.length > 0 && (
              <div className="border-t border-violet-200 pt-3 flex justify-between">
                <span className="text-violet-700 font-bold text-sm">Total Items</span>
                <span className="font-black text-violet-800 text-lg">{chefTotalItems}</span>
              </div>
            )}
          </div>
        </div>

        {/* Worker Side */}
        <div className="rounded-2xl bg-sky-50 border border-sky-100 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-sky-100/60 border-b border-sky-100">
            <HardHat className="w-4 h-4 text-sky-600" />
            <span className="font-bold text-sky-800 text-sm">👷 Worker Reported</span>
          </div>
          <div className="p-4 space-y-3">
            {workerShifts.length === 0 ? (
              <p className="text-sky-400 text-sm text-center py-4">No shift submitted</p>
            ) : (
              workerShifts.map((s) => (
                <div key={s.id} className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-sky-600 font-semibold uppercase">
                    {s.shiftType === 'day' ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
                    <span>{s.shiftType} shift · {s.workerName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Food Items Sold</span>
                    <span className="font-bold text-sky-700">{s.foodTakeawaysSold}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Food Revenue</span>
                    <span className="font-bold text-sky-700">{currencySymbol} {s.foodRevenue.toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
            {workerShifts.length > 0 && (
              <div className="border-t border-sky-200 pt-3 flex justify-between">
                <span className="text-sky-700 font-bold text-sm">Total Items</span>
                <span className="font-black text-sky-800 text-lg">{workerTotalItems}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Order Log */}
      {chefOrders.length > 0 && (
        <div className="rounded-2xl border border-slate-100 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-100">
            <Clock className="w-4 h-4 text-slate-500" />
            <span className="font-bold text-slate-700 text-sm">Chef Order Log — {chefOrders.length} entries</span>
          </div>
          <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
            {chefOrders.map((order) => {
              const taker = TAKER_LABELS[order.taker];
              return (
                <div key={order.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-xl w-8 text-center">{taker.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 font-medium text-sm truncate">{order.foodItemName}</p>
                    <p className="text-slate-400 text-xs">{taker.label} · {formatTime(order.orderTime)}</p>
                  </div>
                  <span className="font-bold text-slate-600 text-sm bg-slate-100 px-2.5 py-1 rounded-full">
                    ×{order.quantity}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default KitchenCheckView;
