import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smartphone, TrendingUp, Banknote, Wifi, Trash2, Eye, 
  Sun, Moon, Search, Calendar, RefreshCw, CheckCircle2, 
  Clock, Sparkles, Filter, ChevronDown, ChevronUp, Archive, Utensils
} from 'lucide-react';
import { TabletOrder, ShiftType } from '../types';
import { getOperationalDate, formatEthiopianTime } from '../utils/shiftUtils';

interface TabletOrdersViewProps {
  tabletOrders: TabletOrder[];
  onVoidOrder: (id: string) => void;
  onRefreshOrders?: () => void;
  currencySymbol: string;
}

export const TabletOrdersView: React.FC<TabletOrdersViewProps> = ({
  tabletOrders,
  onVoidOrder,
  onRefreshOrders,
  currencySymbol,
}) => {
  const [viewMode, setViewMode] = useState<'active' | 'closed' | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<'today' | 'all' | 'custom'>('today');
  const [selectedCustomDate, setSelectedCustomDate] = useState<string>(getOperationalDate());
  const [shiftFilter, setShiftFilter] = useState<'all' | ShiftType>('all');
  const [pmFilter, setPmFilter] = useState<'all' | 'cash' | 'transfer' | 'pending' | 'beu' | 'pay_later'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<TabletOrder | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const todayStr = getOperationalDate();
  const utcTodayStr = new Date().toISOString().split('T')[0];

  // All non-voided today's orders — used for stats regardless of view mode
  const todayAllOrders = tabletOrders.filter(o =>
    o.status !== 'voided' &&
    (o.date === todayStr || o.date === utcTodayStr)
  );

  // Auto-refresh when viewing the tab
  const handleRefresh = () => {
    setIsRefreshing(true);
    if (onRefreshOrders) onRefreshOrders();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  // Filter logic
  const filteredOrders = tabletOrders.filter(o => {
    // Void check
    if (o.status === 'voided') return false;

    // View mode: active (unclosed) vs closed (finalized shifts) vs all
    if (viewMode === 'active' && o.status === 'closed') return false;
    if (viewMode === 'closed' && o.status !== 'closed') return false;

    // Date filter
    if (dateFilter === 'today') {
      const matchesToday = o.date === todayStr || o.date === utcTodayStr;
      if (!matchesToday) return false;
    } else if (dateFilter === 'custom') {
      if (o.date !== selectedCustomDate) return false;
    }

    // Shift filter
    if (shiftFilter !== 'all' && o.shiftType !== shiftFilter) return false;

    // Payment method filter
    if (pmFilter !== 'all' && o.paymentMethod !== pmFilter) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const staffMatch = (o.staffName || '').toLowerCase().includes(q);
      const custMatch = (o.customerName || '').toLowerCase().includes(q);
      const itemMatch = (o.items || []).some(it => (it.name || '').toLowerCase().includes(q));
      if (!staffMatch && !custMatch && !itemMatch) return false;
    }

    return true;
  });

  // Financial Metrics — always based on today's ALL non-voided orders for accuracy
  const statsOrders = dateFilter === 'today' ? todayAllOrders : filteredOrders;
  const totalOrders = statsOrders.length;
  const totalRevenue = statsOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const cashTotal = statsOrders.filter(o => o.paymentMethod === 'cash').reduce((s, o) => s + (o.totalAmount || 0), 0);
  const transferTotal = statsOrders.filter(o => o.paymentMethod === 'transfer').reduce((s, o) => s + (o.totalAmount || 0), 0);
  const pendingTotal = statsOrders.filter(o => o.paymentMethod === 'pending').reduce((s, o) => s + (o.totalAmount || 0), 0);
  const beuTotal = statsOrders.filter(o => o.paymentMethod === 'beu').reduce((s, o) => s + (o.totalAmount || 0), 0);
  const payLaterTotal = statsOrders.filter(o => o.paymentMethod === 'pay_later').reduce((s, o) => s + (o.totalAmount || 0), 0);
  
  const totalTips = statsOrders.reduce((sum, o) => {
    if (o.notes) {
      const match = o.notes.match(/Tip:\s*(\d+(\.\d+)?)/i);
      if (match) return sum + parseFloat(match[1]);
    }
    return sum;
  }, 0);

  const totalJuiceSold = statsOrders.reduce((sum, o) => 
    sum + (o.items || []).filter(i => i.category === 'juice').reduce((s, i) => s + i.quantity, 0), 0
  );

  const totalFoodSold = statsOrders.reduce((sum, o) => 
    sum + (o.items || []).filter(i => i.category !== 'juice').reduce((s, i) => s + i.quantity, 0), 0
  );

  // Group closed shifts by date & shift type for the closed shifts view
  const closedShiftGroups = React.useMemo(() => {
    const closedOrders = tabletOrders.filter(o => o.status === 'closed');
    const groups: Record<string, { date: string; shiftType: string; staffName: string; orders: TabletOrder[]; totalRev: number; cash: number; transfer: number; tips: number }> = {};

    closedOrders.forEach(o => {
      const key = `${o.date}_${o.shiftType}`;
      if (!groups[key]) {
        groups[key] = {
          date: o.date,
          shiftType: o.shiftType,
          staffName: o.staffName,
          orders: [],
          totalRev: 0,
          cash: 0,
          transfer: 0,
          tips: 0,
        };
      }
      groups[key].orders.push(o);
      groups[key].totalRev += o.totalAmount || 0;
      if (o.paymentMethod === 'cash') groups[key].cash += o.totalAmount || 0;
      else groups[key].transfer += o.totalAmount || 0;
      if (o.notes) {
        const match = o.notes.match(/Tip:\s*(\d+(\.\d+)?)/i);
        if (match) groups[key].tips += parseFloat(match[1]);
      }
    });

    return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date));
  }, [tabletOrders]);

  return (
    <div className="space-y-6 select-none">
      
      {/* Header & View Switcher */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#0B1D2C]/15 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-[#0B1D2C] rounded-2xl flex items-center justify-center shadow-md text-white">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-[#0B1D2C]">የታብሌት ትዕዛዞች (Tablet Orders)</h2>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-0.5 rounded-full">
                Live POS
              </span>
            </div>
            <p className="text-xs text-[#0B1D2C]/60 font-semibold mt-0.5">
              በታብሌቱ በቀጥታ የተመዘገቡ የቀን እና የሌሊት የደንበኛ ትዕዛዞች
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <a
            href="/tablet"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-[#0B1D2C] font-black text-xs transition-all shadow-sm active:scale-95 border border-amber-400"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>📱 ታብሌት ክፈት (Open POS)</span>
          </a>

          <button
            onClick={handleRefresh}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#f7f5f0] hover:bg-[#0B1D2C] hover:text-white text-[#0B1D2C] font-black text-xs border border-[#0B1D2C]/20 transition-all cursor-pointer ${
              isRefreshing ? 'opacity-50' : ''
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>አድስ (Refresh)</span>
          </button>
        </div>
      </div>

      {/* View Tabs: All (default) | Active | Closed History */}
      <div className="flex bg-white rounded-2xl p-1.5 border border-[#0B1D2C]/15 shadow-xs gap-1">
        <button
          onClick={() => setViewMode('all')}
          className={`flex-1 py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            viewMode === 'all'
              ? 'bg-[#0B1D2C] text-white shadow-md'
              : 'text-[#0B1D2C]/60 hover:text-[#0B1D2C]'
          }`}
        >
          <span>📋 ሁሉም ({todayAllOrders.length})</span>
        </button>

        <button
          onClick={() => setViewMode('active')}
          className={`flex-1 py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            viewMode === 'active'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-[#0B1D2C]/60 hover:text-[#0B1D2C]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>🟢 አሁን ({todayAllOrders.filter(o => o.status === 'active').length})</span>
        </button>

        <button
          onClick={() => setViewMode('closed')}
          className={`flex-1 py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            viewMode === 'closed'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-[#0B1D2C]/60 hover:text-[#0B1D2C]'
          }`}
        >
          <Archive className="w-4 h-4" />
          <span>📚 የተዘጉ ({todayAllOrders.filter(o => o.status === 'closed').length})</span>
        </button>
      </div>

      {/* 4 Financial Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#0B1D2C]/15 shadow-xs">
          <div className="w-9 h-9 rounded-2xl bg-[#0B1D2C] flex items-center justify-center mb-2">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div className="text-2xl font-black text-[#0B1D2C]">{totalOrders}</div>
          <div className="text-xs text-[#0B1D2C]/50 font-bold uppercase tracking-wider mt-0.5">
            ጠቅላላ ትዕዛዞች
          </div>
          <div className="text-[11px] text-[#0B1D2C]/60 font-semibold mt-1">
            🥤 {totalJuiceSold} ጭማቂ • 🍽️ {totalFoodSold} ምግብ
          </div>
        </div>

        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#0B1D2C]/15 shadow-xs">
          <div className="w-9 h-9 rounded-2xl bg-emerald-600 flex items-center justify-center mb-2">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div className="text-2xl font-black text-emerald-700">
            {currencySymbol} {totalRevenue.toLocaleString()}
          </div>
          <div className="text-xs text-[#0B1D2C]/50 font-bold uppercase tracking-wider mt-0.5">
            ጠቅላላ ገቢ (Total Sales)
          </div>
          {totalTips > 0 && (
            <div className="text-[11px] text-emerald-700 font-bold mt-1">
              ✨ ጠቃሚ (Tips): {currencySymbol} {totalTips.toLocaleString()}
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#0B1D2C]/15 shadow-xs">
          <div className="w-9 h-9 rounded-2xl bg-blue-700 flex items-center justify-center mb-2">
            <Banknote className="w-5 h-5 text-white" />
          </div>
          <div className="text-2xl font-black text-[#0B1D2C]">
            {currencySymbol} {cashTotal.toLocaleString()}
          </div>
          <div className="text-xs text-[#0B1D2C]/50 font-bold uppercase tracking-wider mt-0.5">
            ጥሬ ገንዘብ (Cash In Hand)
          </div>
        </div>

        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#0B1D2C]/15 shadow-xs">
          <div className="w-9 h-9 rounded-2xl bg-indigo-700 flex items-center justify-center mb-2">
            <Wifi className="w-5 h-5 text-white" />
          </div>
          <div className="text-2xl font-black text-indigo-700">
            {currencySymbol} {transferTotal.toLocaleString()}
          </div>
          <div className="text-xs text-[#0B1D2C]/50 font-bold uppercase tracking-wider mt-0.5">
            ዝውውር (Digital Transfers)
          </div>
          {(pendingTotal > 0 || beuTotal > 0) && (
            <div className="text-[11px] text-[#0B1D2C]/60 font-semibold mt-1 flex gap-2">
              {pendingTotal > 0 && <span className="text-amber-700 font-bold">⏳ አዳሪ: {currencySymbol}{pendingTotal}</span>}
              {beuTotal > 0 && <span className="text-purple-700 font-bold">🛵 BeU: {currencySymbol}{beuTotal}</span>}
            </div>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap gap-2.5 items-center">
        {/* Search */}
        <div className="flex items-center gap-2 bg-white border border-[#0B1D2C]/20 rounded-2xl px-3.5 py-2.5 flex-1 min-w-[200px] shadow-xs">
          <Search className="w-4 h-4 text-[#0B1D2C]/40" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="በደንበኛ ስም፣ ምግብ ወይም ሸፍት ፈልግ..."
            className="bg-transparent text-sm text-[#0B1D2C] outline-none flex-1 placeholder:text-[#0B1D2C]/30 font-semibold"
          />
        </div>

        {/* Date Filter Buttons */}
        <div className="flex gap-1 bg-white border border-[#0B1D2C]/20 rounded-2xl p-1 shadow-xs">
          <button
            onClick={() => setDateFilter('today')}
            className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
              dateFilter === 'today'
                ? 'bg-[#0B1D2C] text-white'
                : 'text-[#0B1D2C]/60 hover:text-[#0B1D2C]'
            }`}
          >
            📅 ዛሬ ({todayStr})
          </button>

          <button
            onClick={() => setDateFilter('all')}
            className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
              dateFilter === 'all'
                ? 'bg-[#0B1D2C] text-white'
                : 'text-[#0B1D2C]/60 hover:text-[#0B1D2C]'
            }`}
          >
            ሁሉም ቀናት
          </button>
        </div>

        {/* Shift Filter */}
        <div className="flex gap-1 bg-white border border-[#0B1D2C]/20 rounded-2xl p-1 shadow-xs">
          {(['all', 'day', 'night'] as const).map(f => (
            <button
              key={f}
              onClick={() => setShiftFilter(f)}
              className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                shiftFilter === f
                  ? 'bg-[#0B1D2C] text-white'
                  : 'text-[#0B1D2C]/60 hover:text-[#0B1D2C]'
              }`}
            >
              {f === 'all' ? 'ሁሉም ሸፍት' : f === 'day' ? '☀️ ቀን' : '🌙 ሌሊት'}
            </button>
          ))}
        </div>

        {/* Payment Filter */}
        <div className="flex gap-1 bg-white border border-[#0B1D2C]/20 rounded-2xl p-1 shadow-xs flex-wrap">
          {(['all', 'cash', 'transfer', 'pay_later', 'pending', 'beu'] as const).map(f => (
            <button
              key={f}
              onClick={() => setPmFilter(f)}
              className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                pmFilter === f
                  ? 'bg-[#0B1D2C] text-white'
                  : 'text-[#0B1D2C]/60 hover:text-[#0B1D2C]'
              }`}
            >
              {f === 'all' 
                ? 'ሁሉም ክፍያ' 
                : f === 'cash' 
                ? '💵 ጥሬ' 
                : f === 'transfer' 
                ? '📲 ዝውውር' 
                : f === 'pay_later'
                ? '🕒 ቆይቶ (Open)'
                : f === 'pending' 
                ? '⏳ አዳሪ' 
                : '🛵 BeU'}
            </button>
          ))}
        </div>
      </div>

      {/* ─── VIEW 1: CLOSED SHIFTS ARCHIVE (When Closed Tab Selected) ─────────── */}
      {viewMode === 'closed' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-[#0B1D2C]">
              የተዘጉ ሸፍቶች ታሪክ ({closedShiftGroups.length} ሸፍቶች ተዘግተዋል)
            </h3>
          </div>

          {closedShiftGroups.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#0B1D2C]/10 p-12 text-center text-[#0B1D2C]/40 space-y-2">
              <Archive className="w-12 h-12 mx-auto stroke-1" />
              <p className="font-bold text-base">እስካሁን የተዘጋ ሸፍት የለም</p>
              <p className="text-xs">ሰራተኞች በታብሌቱ ላይ "ዝጋ (Done)" ብለው ፒን ሲያስገቡ የተዘጉ ሸፍቶች እዚህ ይቀመጣሉ</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {closedShiftGroups.map((grp, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-3xl p-5 border border-[#0B1D2C]/15 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-[#0B1D2C]/10 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-[#f7f5f0]">
                        {grp.shiftType === 'day' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-indigo-600" />}
                      </div>
                      <div>
                        <div className="font-black text-base text-[#0B1D2C]">
                          {grp.shiftType === 'day' ? '☀️ የቀን ሸፍት' : '🌙 የሌሊት ሸፍት'}
                        </div>
                        <div className="text-xs text-[#0B1D2C]/50 font-bold">
                          ቀን: {grp.date} • {grp.orders.length} ትዕዛዞች
                        </div>
                      </div>
                    </div>

                    <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1 rounded-full">
                      ✅ የተዘጋ ሸፍት (Closed)
                    </span>
                  </div>

                  {/* Shift Stats */}
                  <div className="grid grid-cols-3 gap-2 bg-[#f7f5f0] p-3 rounded-2xl text-center">
                    <div>
                      <div className="text-xs text-[#0B1D2C]/50 font-bold">ጠቅላላ ገቢ</div>
                      <div className="text-base font-black text-emerald-700">
                        {currencySymbol} {grp.totalRev.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-[#0B1D2C]/50 font-bold">ጥሬ ገንዘብ</div>
                      <div className="text-base font-black text-[#0B1D2C]">
                        {currencySymbol} {grp.cash.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-[#0B1D2C]/50 font-bold">ዝውውር</div>
                      <div className="text-base font-black text-indigo-700">
                        {currencySymbol} {grp.transfer.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Orders Breakdown */}
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {grp.orders.map((ord, oIdx) => (
                      <div key={oIdx} className="flex items-center justify-between text-xs py-1.5 border-b border-[#0B1D2C]/5">
                        <div className="flex items-center gap-2">
                          <span className="text-[#0B1D2C]/40 font-bold">#{oIdx + 1}</span>
                          <span className="font-bold text-[#0B1D2C]">{ord.customerName || 'የቀጥታ ደንበኛ'}</span>
                          <span className="text-[#0B1D2C]/50 font-semibold">
                            ({(ord.items || []).map(i => `${i.name} × ${i.quantity}`).join(', ')})
                          </span>
                        </div>
                        <span className="font-black text-[#0B1D2C]">
                          {currencySymbol} {ord.totalAmount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── VIEW 2: ORDERS LIST (Active or All Orders) ───────────────────────── */}
      {viewMode !== 'closed' && (
        <div className="space-y-2">
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#0B1D2C]/10 py-16 flex flex-col items-center justify-center text-[#0B1D2C]/40 gap-3 shadow-xs">
              <Smartphone className="w-14 h-14 stroke-1 text-[#0B1D2C]/30" />
              <p className="font-black text-lg text-[#0B1D2C]">ምንም የትዕዛዝ መዝገብ አልተገኘም</p>
              <p className="text-xs text-[#0B1D2C]/60 max-w-sm text-center">
                በታብሌቱ ላይ የተመዘገቡ ትዕዛዞች እዚህ በቅጽበት ይታያሉ
              </p>
              <button
                onClick={handleRefresh}
                className="mt-2 flex items-center gap-1.5 bg-[#0B1D2C] text-white px-4 py-2 rounded-xl text-xs font-black shadow-md cursor-pointer hover:bg-[#162E44]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>አድስ (Check Again)</span>
              </button>
            </div>
          ) : (
            <AnimatePresence>
              {filteredOrders.map((order, i) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: i * 0.02 }}
                  className={`bg-white rounded-2xl border shadow-xs overflow-hidden transition-all ${
                    order.status === 'closed' ? 'border-[#0B1D2C]/10 opacity-80' : 'border-[#0B1D2C]/20 hover:border-[#0B1D2C]/40'
                  }`}
                >
                  <div className="flex items-center gap-3.5 px-4 py-3.5">
                    {/* Shift icon */}
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      order.shiftType === 'day' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {order.shiftType === 'day' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </div>

                    {/* Order details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-[#0B1D2C]">{order.staffName}</span>
                        {order.customerName && (
                          <span className="text-xs font-bold text-[#0B1D2C]/60">→ {order.customerName}</span>
                        )}
                        {order.status === 'closed' && (
                          <span className="text-[10px] bg-stone-100 text-stone-600 font-bold px-2 py-0.5 rounded-md">
                            የተዘጋ
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-[#0B1D2C]/50 flex items-center gap-2 mt-0.5 font-medium flex-wrap">
                        <span className="font-bold">{formatEthiopianTime(order.orderTime)}</span>
                        <span>•</span>
                        <span>{order.items.length} ዓይነቶች</span>
                        <span>•</span>
                        <span className={`font-black ${
                          order.paymentMethod === 'cash' 
                            ? 'text-emerald-700' 
                            : order.paymentMethod === 'transfer'
                            ? 'text-indigo-700'
                            : order.paymentMethod === 'pay_later'
                            ? 'text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-300'
                            : order.paymentMethod === 'pending'
                            ? 'text-orange-700'
                            : 'text-purple-700'
                        }`}>
                          {order.paymentMethod === 'cash' 
                            ? '💵 ጥሬ ገንዘብ' 
                            : order.paymentMethod === 'transfer' 
                            ? '📲 ዝውውር' 
                            : order.paymentMethod === 'pay_later'
                            ? '🕒 ቆይቶ (Open Tab)'
                            : order.paymentMethod === 'pending'
                            ? '⏳ አዳሪ (Pending)'
                            : '🛵 BeU ደሊቨሪ'}
                        </span>
                        {order.notes && (
                          <span className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-md">
                            {order.notes}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Total Amount */}
                    <div className="text-right shrink-0">
                      <div className="font-black text-base sm:text-lg text-[#0B1D2C]">
                        {currencySymbol} {order.totalAmount.toLocaleString()}
                      </div>
                    </div>

                    {/* Expand View */}
                    <button
                      onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                      className="p-2 text-[#0B1D2C]/40 hover:text-[#0B1D2C] hover:bg-[#f7f5f0] rounded-xl transition-colors cursor-pointer"
                      title="ዝርዝር እይ"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Void / Delete */}
                    <button
                      onClick={() => {
                        if (confirm('ይህን ትዕዛዝ መሰረዝ ይፈልጋሉ? (Void Order?)')) {
                          onVoidOrder(order.id);
                        }
                      }}
                      className="p-2 text-[#0B1D2C]/30 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                      title="ትዕዛዝ ሰርዝ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Expanded Items */}
                  <AnimatePresence>
                    {selectedOrder?.id === order.id && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden border-t border-[#0B1D2C]/10 bg-[#f7f5f0]"
                      >
                        <div className="px-5 py-3.5 space-y-2">
                          <div className="text-xs font-black uppercase text-[#0B1D2C]/50 tracking-wider mb-1">
                            የትዕዛዝ እቃዎች ዝርዝር (Items Breakdown)
                          </div>
                          {order.items.map((item, j) => (
                            <div key={j} className="flex items-center justify-between text-sm bg-white p-2.5 rounded-xl border border-[#0B1D2C]/10">
                              <div className="flex items-center gap-2">
                                <span className="font-black text-[#0B1D2C]">{item.quantity}×</span>
                                <span className="text-[#0B1D2C] font-bold">{item.name}</span>
                              </div>
                              <span className="font-black text-[#0B1D2C]">
                                {currencySymbol} {item.totalPrice.toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      )}

    </div>
  );
};
