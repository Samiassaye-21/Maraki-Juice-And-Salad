import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, TrendingUp, Banknote, Wifi, Trash2, Eye, Filter, Sun, Moon, Search } from 'lucide-react';
import { TabletOrder, ShiftType } from '../types';

interface TabletOrdersViewProps {
  tabletOrders: TabletOrder[];
  onVoidOrder: (id: string) => void;
  currencySymbol: string;
}

export const TabletOrdersView: React.FC<TabletOrdersViewProps> = ({
  tabletOrders, onVoidOrder, currencySymbol,
}) => {
  const [shiftFilter, setShiftFilter] = useState<'all' | ShiftType>('all');
  const [pmFilter, setPmFilter] = useState<'all' | 'cash' | 'transfer'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<TabletOrder | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const filtered = tabletOrders
    .filter(o => o.status !== 'voided')
    .filter(o => o.date === today)
    .filter(o => shiftFilter === 'all' || o.shiftType === shiftFilter)
    .filter(o => pmFilter === 'all' || o.paymentMethod === pmFilter)
    .filter(o => !searchQuery || o.staffName.toLowerCase().includes(searchQuery.toLowerCase())
      || (o.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()));

  const totalOrders = filtered.length;
  const totalRevenue = filtered.reduce((s, o) => s + o.totalAmount, 0);
  const cashTotal = filtered.filter(o => o.paymentMethod === 'cash').reduce((s, o) => s + o.totalAmount, 0);
  const transferTotal = filtered.filter(o => o.paymentMethod === 'transfer').reduce((s, o) => s + o.totalAmount, 0);

  const formatTime = (iso: string) => {
    try { return new Date(iso).toLocaleTimeString('en-ET', { hour: '2-digit', minute: '2-digit' }); } catch { return iso; }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#0B1D2C] rounded-2xl flex items-center justify-center shadow-md">
          <Smartphone className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-black text-[#0B1D2C]">Tablet Orders</h2>
          <p className="text-xs text-[#0B1D2C]/50">Today's orders from the in-store tablet</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Orders', value: totalOrders.toString(), icon: Smartphone, color: 'bg-[#0B1D2C]' },
          { label: 'Total Revenue', value: `${currencySymbol} ${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'bg-emerald-600' },
          { label: 'Cash', value: `${currencySymbol} ${cashTotal.toLocaleString()}`, icon: Banknote, color: 'bg-blue-700' },
          { label: 'Transfer', value: `${currencySymbol} ${transferTotal.toLocaleString()}`, icon: Wifi, color: 'bg-violet-700' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl p-4 border border-[#0B1D2C]/10 shadow-sm">
            <div className={`${stat.color} w-8 h-8 rounded-xl flex items-center justify-center mb-2`}>
              <stat.icon className="w-4 h-4 text-white" />
            </div>
            <div className="text-lg font-black text-[#0B1D2C]">{stat.value}</div>
            <div className="text-xs text-[#0B1D2C]/40 font-semibold">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-1 bg-white border border-[#0B1D2C]/15 rounded-xl px-3 py-2 flex-1 min-w-[180px]">
          <Search className="w-3.5 h-3.5 text-[#0B1D2C]/30" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search staff or customer..."
            className="bg-transparent text-sm text-[#0B1D2C] outline-none flex-1 placeholder:text-[#0B1D2C]/25" />
        </div>
        <div className="flex gap-1.5 bg-white border border-[#0B1D2C]/15 rounded-xl p-1">
          {(['all', 'day', 'night'] as const).map(f => (
            <button key={f} onClick={() => setShiftFilter(f)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${shiftFilter === f ? 'bg-[#0B1D2C] text-white' : 'text-[#0B1D2C]/50 hover:text-[#0B1D2C]'}`}>
              {f === 'all' ? 'All' : f === 'day' ? '☀️ Day' : '🌙 Night'}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 bg-white border border-[#0B1D2C]/15 rounded-xl p-1">
          {(['all', 'cash', 'transfer'] as const).map(f => (
            <button key={f} onClick={() => setPmFilter(f)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${pmFilter === f ? 'bg-[#0B1D2C] text-white' : 'text-[#0B1D2C]/50 hover:text-[#0B1D2C]'}`}>
              {f === 'all' ? 'All' : f === 'cash' ? '💵 Cash' : '📲 Transfer'}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-[#0B1D2C]/30 gap-3">
          <Smartphone className="w-12 h-12" strokeWidth={1} />
          <p className="font-bold">No tablet orders today</p>
          <p className="text-xs">Orders submitted from the tablet will appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.map((order, i) => (
              <motion.div key={order.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }} transition={{ delay: i * 0.03 }}
                className="bg-white rounded-2xl border border-[#0B1D2C]/10 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 bg-[#f7f5f0] rounded-xl flex items-center justify-center shrink-0">
                    {order.shiftType === 'day' ? <Sun className="w-4 h-4 text-amber-600" /> : <Moon className="w-4 h-4 text-indigo-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#0B1D2C]">{order.staffName}</span>
                      {order.customerName && (
                        <span className="text-xs text-[#0B1D2C]/40">→ {order.customerName}</span>
                      )}
                    </div>
                    <div className="text-xs text-[#0B1D2C]/40 flex items-center gap-2 mt-0.5">
                      <span>{formatTime(order.orderTime)}</span>
                      <span>•</span>
                      <span>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                      <span>•</span>
                      <span className={`font-semibold ${order.paymentMethod === 'cash' ? 'text-emerald-600' : 'text-blue-600'}`}>
                        {order.paymentMethod === 'cash' ? '💵 Cash' : '📲 Transfer'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-black text-[#0B1D2C]">{currencySymbol} {order.totalAmount.toLocaleString()}</div>
                  </div>
                  <button onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                    className="p-2 text-[#0B1D2C]/30 hover:text-[#0B1D2C] hover:bg-[#f7f5f0] rounded-lg transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={() => {
                    if (confirm('Void this order? This cannot be undone.')) onVoidOrder(order.id);
                  }} className="p-2 text-[#0B1D2C]/30 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Expanded Items */}
                <AnimatePresence>
                  {selectedOrder?.id === order.id && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                      className="overflow-hidden border-t border-[#0B1D2C]/10">
                      <div className="px-4 py-3 bg-[#f7f5f0] space-y-1.5">
                        {order.items.map((item, j) => (
                          <div key={j} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-[#0B1D2C]/40">{item.quantity}×</span>
                              <span className="text-[#0B1D2C] font-medium">{item.name}</span>
                            </div>
                            <span className="font-bold text-[#0B1D2C]">{currencySymbol} {item.totalPrice.toLocaleString()}</span>
                          </div>
                        ))}
                        {order.notes && (
                          <p className="text-xs text-[#0B1D2C]/50 italic pt-1 border-t border-[#0B1D2C]/10">
                            Note: {order.notes}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
