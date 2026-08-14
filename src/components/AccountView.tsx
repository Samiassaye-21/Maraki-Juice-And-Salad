import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp, TrendingDown, Wallet, ArrowUpCircle, ArrowDownCircle,
  ChevronDown, Filter, RefreshCw, Eye, EyeOff
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
  shift_income:           { label: 'Shift Sales',         icon: '💰', color: 'text-[#13EE86]' },
  shift_daily_expense:    { label: 'Daily Shift Expense', icon: '🧾', color: 'text-neutral-300' },
  pending_recovered:      { label: 'Debt Recovered',      icon: '✅', color: 'text-[#13EE86]' },
  delivery_recovered:     { label: 'Delivery Settled',    icon: '🛵', color: 'text-[#13EE86]' },
  purchase_trip:          { label: 'Inventory Purchase',  icon: '🛒', color: 'text-neutral-300' },
  other_expense:          { label: 'Business Expense',    icon: '🏢', color: 'text-neutral-300' },
};

import { safeLocalStorage } from '../utils/safeStorage';

export const AccountView: React.FC<AccountViewProps> = ({
  ledgerEntries,
  currencySymbol,
}) => {
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('month');
  const [showBalance, setShowBalance] = useState<boolean>(() => {
    const saved = safeLocalStorage.getItem('maraki_show_account_balance');
    return saved !== null ? saved === 'true' : true;
  });

  const toggleShowBalance = () => {
    setShowBalance(prev => {
      const next = !prev;
      safeLocalStorage.setItem('maraki_show_account_balance', String(next));
      return next;
    });
  };

  const renderAmount = (amount: number, prefix: string = '') => {
    if (!showBalance) return '••••••';
    return `${prefix}${formatCurrency(amount, currencySymbol)}`;
  };

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

  // Running balance per entry
  const entriesWithRunning = useMemo(() => {
    // When filters are active, running balance is misleading, so we hide it
    const showRunning = filterType === 'all' && filterPeriod === 'all';
    if (!showRunning) {
      return filteredEntries.map(e => ({ ...e, runningAfter: null as number | null }));
    }
    let running = balance;
    return filteredEntries.map(e => {
      const before = running;
      running = running - (e.sign * e.amount);
      return { ...e, runningAfter: before };
    });
  }, [filteredEntries, balance, filterType, filterPeriod]);

  const periodLabel = filterPeriod === 'week' ? 'This Week' : filterPeriod === 'month' ? 'Last 30 Days' : 'All Time';

  return (
    <div className="space-y-6 text-[#403c21] font-sans">
      {/* Title with Hide/Show Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-[#403c21]">Account Balance</h2>
          <p className="text-sm font-medium text-[#403c21]/70 mt-0.5">Running financial position — like a bank statement</p>
        </div>
        <button
          onClick={toggleShowBalance}
          className="flex items-center gap-2 px-4 py-2 bg-white text-[#403c21] border-2 border-[#403c21] hover:bg-[#f7f5f0] rounded-full text-xs font-extrabold transition-all cursor-pointer shadow-xs active:scale-95"
          title={showBalance ? "Hide Balance" : "Show Balance"}
        >
          {showBalance ? (
            <>
              <EyeOff className="w-4 h-4 text-[#403c21]/70" />
              <span>Hide Balance</span>
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 text-[#403c21]" />
              <span>Show Balance</span>
            </>
          )}
        </button>
      </div>

      {/* Main Balance Hero Card (#403c21 Hero Card with #c9b197 Accent) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl p-6 text-white border border-[#c9b197]/40 bg-[#403c21] shadow-2xl"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-extrabold text-[#c9b197] uppercase tracking-wider">Current Balance</p>
              <button 
                onClick={toggleShowBalance} 
                className="text-[#c9b197] hover:text-white transition-colors cursor-pointer"
                title={showBalance ? "Hide Balance" : "Show Balance"}
              >
                {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-[#c9b197]" />}
              </button>
            </div>
            <p className="text-4xl font-extrabold mt-1 tracking-tight text-[#c9b197]">{renderAmount(balance)}</p>
            <p className="text-sm text-white/80 mt-1 font-medium">All time net position</p>
          </div>
          <div className="p-3.5 bg-[#524d2c] border border-[#c9b197]/40 text-[#c9b197] rounded-full shadow-xs">
            <Wallet className="w-8 h-8" />
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="bg-[#524d2c] border border-[#c9b197]/30 rounded-2xl px-4 py-3">
            <div className="flex items-center gap-1.5 text-white/80 text-xs font-bold">
              <TrendingUp className="w-3.5 h-3.5 text-[#c9b197]" /> Total Income
            </div>
            <p className="text-lg font-extrabold text-[#c9b197] mt-0.5">{renderAmount(allIncome)}</p>
          </div>
          <div className="bg-[#524d2c] border border-[#c9b197]/30 rounded-2xl px-4 py-3">
            <div className="flex items-center gap-1.5 text-white/80 text-xs font-bold">
              <TrendingDown className="w-3.5 h-3.5 text-white" /> Total Expenses
            </div>
            <p className="text-lg font-extrabold text-white mt-0.5">{renderAmount(allExpenses)}</p>
          </div>
        </div>
      </motion.div>

      {/* Period Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-[#238868]/20 rounded-3xl p-4 text-center shadow-xs">
          <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide">{periodLabel} Income</p>
          <p className="text-base font-extrabold text-[#238868] mt-1">{renderAmount(periodIncome)}</p>
        </div>
        <div className="bg-white border border-[#238868]/20 rounded-3xl p-4 text-center shadow-xs">
          <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide">{periodLabel} Expenses</p>
          <p className="text-base font-extrabold text-[#07250D] mt-1">{renderAmount(periodExpenses)}</p>
        </div>
        <div className="bg-white border border-[#238868]/20 rounded-3xl p-4 text-center shadow-xs">
          <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide">Net Profit</p>
          <p className="text-base font-extrabold text-[#238868] mt-1">{renderAmount(periodNet)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap justify-between bg-white p-3 rounded-3xl border border-[#238868]/20 shadow-xs">
        {/* Period */}
        <div className="flex bg-[#F4F8F5] rounded-full p-1 border border-[#238868]/20">
          {(['week', 'month', 'all'] as FilterPeriod[]).map(p => (
            <button
              key={p}
              onClick={() => setFilterPeriod(p)}
              className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${filterPeriod === p ? 'bg-[#13EE86] text-[#07250D] shadow-xs' : 'text-neutral-600 hover:text-[#07250D]'}`}
            >
              {p === 'week' ? 'This Week' : p === 'month' ? 'Last 30 Days' : 'All Time'}
            </button>
          ))}
        </div>
        {/* Type */}
        <div className="flex bg-[#F4F8F5] rounded-full p-1 border border-[#238868]/20">
          {([['all', 'All'], ['income', 'Income'], ['expense', 'Expenses']] as [FilterType, string][]).map(([v, l]) => (
            <button
              key={v}
              onClick={() => setFilterType(v)}
              className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${filterType === v ? 'bg-[#13EE86] text-[#07250D] shadow-xs' : 'text-neutral-600 hover:text-[#07250D]'}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-neutral-600 uppercase tracking-wide">
          Transaction History ({filteredEntries.length} entries)
        </p>

        {filteredEntries.length === 0 && (
          <div className="text-center py-16 text-neutral-500 bg-white border border-[#238868]/20 rounded-3xl shadow-xs">
            <RefreshCw className="w-10 h-10 mx-auto mb-3 opacity-30 text-[#238868]" />
            <p className="font-extrabold text-[#07250D]">No transactions in this period yet.</p>
            <p className="text-sm mt-1 text-neutral-500 font-medium">Close a shift or add a purchase to see entries here.</p>
          </div>
        )}

        {entriesWithRunning.map((entry) => {
          const cfg = entryTypeConfig[entry.type as any] || { label: 'Legacy Entry', icon: '📌', color: 'text-neutral-400' };
          const isIncome = entry.sign === 1;
          return (
            <motion.div
              key={entry.id}
              layout
              className="bg-white border border-[#238868]/20 rounded-3xl px-5 py-3.5 flex items-center gap-3 shadow-xs hover:shadow-md transition-all text-[#07250D]"
            >
              {/* Icon */}
              <div className="w-10 h-10 rounded-full bg-[#F4F8F5] border border-[#238868]/20 flex items-center justify-center flex-shrink-0 text-base shadow-xs">
                {cfg.icon}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-extrabold text-[#07250D] truncate">{entry.description}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${isIncome ? 'bg-[#13EE86] text-[#07250D]' : 'bg-[#F4F8F5] text-neutral-600 border border-[#238868]/20'}`}>
                    {cfg.label}
                  </span>
                  <span className="text-[10px] text-neutral-500 font-medium">{entry.date}</span>
                </div>
              </div>

              {/* Amount */}
              <div className="text-right flex-shrink-0">
                <p className={`text-base font-extrabold ${isIncome ? 'text-[#238868]' : 'text-[#07250D]'}`}>
                  {renderAmount(entry.amount, isIncome ? '+' : '−')}
                </p>
                {entry.runningAfter !== null && (
                  <p className="text-[10px] text-neutral-500 mt-0.5 font-medium">
                    Bal: {renderAmount(entry.runningAfter)}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default AccountView;
