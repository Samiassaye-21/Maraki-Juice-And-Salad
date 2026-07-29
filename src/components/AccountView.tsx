import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp, TrendingDown, Wallet, ArrowUpCircle, ArrowDownCircle,
  ChevronDown, Filter, RefreshCw
} from 'lucide-react';
import { LedgerEntry, ShiftRecord, PendingPaymentItem, PurchaseTrip } from '../types';
import { formatCurrency, formatEthiopianFullDate } from '../utils/shiftUtils';

interface AccountViewProps {
  ledgerEntries: LedgerEntry[];
  shifts: ShiftRecord[];
  pendingPayments: PendingPaymentItem[];
  purchaseTrips: PurchaseTrip[];
  currencySymbol: string;
}

type FilterType = 'all' | 'income' | 'expense';
type FilterPeriod = 'all' | 'week' | 'month';

const entryTypeConfig: Record<LedgerEntry['type'], { label: string; icon: string; color: string }> = {
  shift_income:           { label: 'Shift Sales',         icon: '💰', color: 'text-emerald-600' },
  shift_daily_expense:    { label: 'Daily Shift Expense', icon: '🧾', color: 'text-red-500'     },
  pending_recovered:      { label: 'Debt Recovered',      icon: '✅', color: 'text-emerald-600' },
  delivery_recovered:     { label: 'Delivery Settled',    icon: '🛵', color: 'text-blue-600'    },
  purchase_trip:          { label: 'Inventory Purchase',  icon: '🛒', color: 'text-red-500'     },
};

export const AccountView: React.FC<AccountViewProps> = ({
  ledgerEntries,
  currencySymbol,
}) => {
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('month');

  const now = new Date();
  const filteredByPeriod = useMemo(() => {
    if (filterPeriod === 'all') return ledgerEntries;
    const cutoff = new Date(now);
    if (filterPeriod === 'week') cutoff.setDate(now.getDate() - 7);
    if (filterPeriod === 'month') cutoff.setDate(now.getDate() - 30);
    return ledgerEntries.filter(e => new Date(e.date) >= cutoff);
  }, [ledgerEntries, filterPeriod]);

  const filteredEntries = useMemo(() => {
    let entries = [...filteredByPeriod].sort((a, b) => b.createdAt - a.createdAt);
    if (filterType === 'income')  entries = entries.filter(e => e.sign === 1);
    if (filterType === 'expense') entries = entries.filter(e => e.sign === -1);
    return entries;
  }, [filteredByPeriod, filterType]);

  // Totals (always from all time for the balance card)
  const allIncome   = ledgerEntries.filter(e => e.sign === 1).reduce((s, e) => s + e.amount, 0);
  const allExpenses = ledgerEntries.filter(e => e.sign === -1).reduce((s, e) => s + e.amount, 0);
  const balance     = allIncome - allExpenses;

  // Period totals
  const periodIncome   = filteredByPeriod.filter(e => e.sign === 1).reduce((s, e) => s + e.amount, 0);
  const periodExpenses = filteredByPeriod.filter(e => e.sign === -1).reduce((s, e) => s + e.amount, 0);
  const periodNet      = periodIncome - periodExpenses;

  // Running balance per entry (newest first already)
  const entriesWithRunning = useMemo(() => {
    let running = balance;
    return filteredEntries.map(e => {
      const before = running;
      // We can't truly compute running per entry without full ordered list.
      // We show the running as it would appear at that point going backwards.
      running = running - (e.sign * e.amount);
      return { ...e, runningAfter: before };
    });
  }, [filteredEntries, balance]);

  const periodLabel = filterPeriod === 'week' ? 'This Week' : filterPeriod === 'month' ? 'Last 30 Days' : 'All Time';

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Account Balance</h2>
        <p className="text-sm text-slate-500 mt-0.5">Running financial position — like a bank statement</p>
      </div>

      {/* Main Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl p-6 text-white shadow-lg ${balance >= 0 ? 'bg-gradient-to-br from-emerald-600 to-emerald-500' : 'bg-gradient-to-br from-red-600 to-red-500'}`}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-white/70 uppercase tracking-wide">Current Balance</p>
            <p className="text-4xl font-extrabold mt-1 tracking-tight">{formatCurrency(balance, currencySymbol)}</p>
            <p className="text-sm text-white/60 mt-1">All time net position</p>
          </div>
          <Wallet className="w-10 h-10 text-white/40" />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="bg-white/10 rounded-xl px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-white/70 text-xs font-semibold">
              <TrendingUp className="w-3.5 h-3.5" /> Total Income
            </div>
            <p className="text-lg font-bold mt-0.5">{formatCurrency(allIncome, currencySymbol)}</p>
          </div>
          <div className="bg-white/10 rounded-xl px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-white/70 text-xs font-semibold">
              <TrendingDown className="w-3.5 h-3.5" /> Total Expenses
            </div>
            <p className="text-lg font-bold mt-0.5">{formatCurrency(allExpenses, currencySymbol)}</p>
          </div>
        </div>
      </motion.div>

      {/* Period Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 text-center">
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">{periodLabel} Income</p>
          <p className="text-base font-bold text-emerald-700 mt-1">{formatCurrency(periodIncome, currencySymbol)}</p>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-2xl p-3 text-center">
          <p className="text-[10px] font-bold text-red-500 uppercase tracking-wide">{periodLabel} Expenses</p>
          <p className="text-base font-bold text-red-600 mt-1">{formatCurrency(periodExpenses, currencySymbol)}</p>
        </div>
        <div className={`border rounded-2xl p-3 text-center ${periodNet >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'}`}>
          <p className={`text-[10px] font-bold uppercase tracking-wide ${periodNet >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>Net Profit</p>
          <p className={`text-base font-bold mt-1 ${periodNet >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>{formatCurrency(periodNet, currencySymbol)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Period */}
        <div className="flex bg-slate-100 rounded-xl p-1 gap-0.5">
          {(['week', 'month', 'all'] as FilterPeriod[]).map(p => (
            <button
              key={p}
              onClick={() => setFilterPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterPeriod === p ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              {p === 'week' ? 'This Week' : p === 'month' ? 'Last 30 Days' : 'All Time'}
            </button>
          ))}
        </div>
        {/* Type */}
        <div className="flex bg-slate-100 rounded-xl p-1 gap-0.5 ml-auto">
          {([['all', 'All'], ['income', 'Income'], ['expense', 'Expenses']] as [FilterType, string][]).map(([v, l]) => (
            <button
              key={v}
              onClick={() => setFilterType(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterType === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
          Transaction History ({filteredEntries.length} entries)
        </p>

        {filteredEntries.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <RefreshCw className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No transactions in this period yet.</p>
            <p className="text-sm mt-1">Close a shift or add a purchase to see entries here.</p>
          </div>
        )}

        {entriesWithRunning.map((entry) => {
          const cfg = entryTypeConfig[entry.type];
          const isIncome = entry.sign === 1;
          return (
            <motion.div
              key={entry.id}
              layout
              className="bg-white border border-slate-100 rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-sm"
            >
              {/* Icon */}
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base ${isIncome ? 'bg-emerald-50' : 'bg-red-50'}`}>
                {cfg.icon}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{entry.description}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                    {cfg.label}
                  </span>
                  <span className="text-[10px] text-slate-400">{entry.date}</span>
                </div>
              </div>

              {/* Amount */}
              <div className="text-right flex-shrink-0">
                <p className={`text-base font-bold ${isIncome ? 'text-emerald-600' : 'text-red-500'}`}>
                  {isIncome ? '+' : '−'}{formatCurrency(entry.amount, currencySymbol)}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Bal: {formatCurrency(entry.runningAfter, currencySymbol)}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default AccountView;
