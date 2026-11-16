import React from 'react';
import { 
  ChefHat, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  ArrowRight, 
  Coffee, 
  Package, 
  UserCheck, 
  Sparkles,
  ShieldAlert
} from 'lucide-react';

export default function KitchenDisplay({ orders, onUpdateStatus, onMarkPaid }) {
  // Filter active tickets vs completed
  const activeOrders = orders.filter(o => o.status !== 'Delivered');
  const deliveredOrders = orders.filter(o => o.status === 'Delivered');

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-500/20 text-amber-600 border-amber-300';
      case 'Preparing':
        return 'bg-blue-500/20 text-blue-600 border-blue-300';
      case 'Ready':
        return 'bg-emerald-500/20 text-emerald-600 border-emerald-300';
      case 'Delivered':
        return 'bg-slate-200 text-slate-700 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getElapsedMinutes = (timestamp) => {
    const elapsedMs = Date.now() - new Date(timestamp).getTime();
    return Math.floor(elapsedMs / (1000 * 60));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Kitchen Cross-Check Control Policy Bar */}
      <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl border border-slate-700 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-xl">
            👨‍🍳
          </div>
          <div>
            <h2 className="font-bold text-base flex items-center gap-2">
              Kitchen & Bar Cross-Check Station
              <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                Live Kitchen Queue
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              Cross-checks orders between Waiter and Kitchen. Every blended drink must match a registered Ticket #.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-800/90 border border-slate-700 px-3.5 py-2 rounded-xl text-xs">
          <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span className="text-slate-300">
            <strong className="text-white">Zero Tolerance Policy:</strong> No ticket = No juice blended.
          </span>
        </div>
      </div>

      {/* Active Orders Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
            <span>In-Progress Tickets</span>
            <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {activeOrders.length} tickets
            </span>
          </h3>
        </div>

        {activeOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500 space-y-3">
            <Sparkles className="w-10 h-10 mx-auto text-emerald-500" />
            <h4 className="font-bold text-slate-800 text-base">Kitchen Queue is Clear!</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              All placed orders have been prepared and delivered to tables. New waiter orders will appear here instantly.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeOrders.map(order => {
              const elapsed = getElapsedMinutes(order.timestamp);
              const isUrgent = elapsed > 10;

              return (
                <div 
                  key={order.id} 
                  className={`bg-white rounded-2xl border transition-all shadow-sm hover:shadow-md flex flex-col justify-between overflow-hidden ${
                    order.status === 'Ready' 
                      ? 'border-emerald-400 ring-2 ring-emerald-500/20' 
                      : isUrgent 
                      ? 'border-rose-400 ring-2 ring-rose-500/20' 
                      : 'border-slate-200'
                  }`}
                >
                  {/* Ticket Header */}
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-slate-900">
                            Ticket #{order.ticketNumber}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-slate-600 mt-0.5">
                          {order.table} • <span className="text-slate-500">Waiter: {order.waiter}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`text-[11px] font-bold flex items-center gap-1 ${
                          isUrgent ? 'text-rose-600 animate-pulse' : 'text-slate-500'
                        }`}>
                          <Clock className="w-3 h-3" />
                          {elapsed === 0 ? 'Just now' : `${elapsed}m ago`}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">
                          {order.type}
                        </span>
                      </div>
                    </div>

                    {/* Packaging Badge on Ticket */}
                    <div className="mt-3 flex items-center gap-2 text-xs">
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-bold text-[11px]">
                        🥤 {order.cupsCount} Cups Required
                      </span>
                      <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-bold text-[11px]">
                        🥡 {order.boxesCount} Boxes Required
                      </span>
                    </div>
                  </div>

                  {/* Items to Prepare */}
                  <div className="p-4 flex-1 space-y-3">
                    <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                      Order Items:
                    </div>
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-md bg-white border border-slate-200 text-xs font-black flex items-center justify-center text-slate-800">
                                {item.quantity}×
                              </span>
                              <span className="text-xs font-bold text-slate-900">
                                {item.name}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500">
                              {item.containerType === 'cup' ? '🥤' : '🥡'}
                            </span>
                          </div>

                          {item.notes && (
                            <div className="mt-1.5 text-[11px] text-amber-800 bg-amber-50 px-2 py-1 rounded font-medium border border-amber-200/60">
                              Note: {item.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action / Handover Footer */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-2">
                    {/* Payment Verification Banner */}
                    <div className="flex items-center justify-between text-xs pb-1">
                      <span className="text-slate-500 font-medium">Payment:</span>
                      {order.paymentStatus === 'Paid' ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Paid ({order.paymentMethod} - {order.totalAmount} ETB)
                        </span>
                      ) : (
                        <button
                          onClick={() => onMarkPaid(order.id)}
                          className="text-amber-700 font-bold bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded border border-amber-300 transition-colors"
                        >
                          Collect {order.totalAmount} ETB
                        </button>
                      )}
                    </div>

                    {/* Step-by-Step Transition Buttons */}
                    <div className="pt-1">
                      {order.status === 'Pending' && (
                        <button
                          onClick={() => onUpdateStatus(order.id, 'Preparing')}
                          className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                        >
                          <ChefHat className="w-3.5 h-3.5" />
                          <span>Start Blending / Prepping</span>
                        </button>
                      )}

                      {order.status === 'Preparing' && (
                        <button
                          onClick={() => onUpdateStatus(order.id, 'Ready')}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Mark Ready (Call Waiter {order.waiter})</span>
                        </button>
                      )}

                      {order.status === 'Ready' && (
                        <button
                          onClick={() => onUpdateStatus(order.id, 'Delivered')}
                          className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                        >
                          <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Waiter Delivered to Customer</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed & Delivered Log for Cross-Auditing */}
      {deliveredOrders.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Delivered & Verified Orders ({deliveredOrders.length})</span>
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-y border-slate-200">
                <tr>
                  <th className="py-2 px-3">Ticket</th>
                  <th className="py-2 px-3">Table/Type</th>
                  <th className="py-2 px-3">Waiter</th>
                  <th className="py-2 px-3">Containers Deducted</th>
                  <th className="py-2 px-3">Amount</th>
                  <th className="py-2 px-3">Payment</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deliveredOrders.map(o => (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-900">#{o.ticketNumber}</td>
                    <td className="py-2.5 px-3">{o.table} ({o.type})</td>
                    <td className="py-2.5 px-3">{o.waiter}</td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-emerald-700">🥤 {o.cupsCount} Cups</span>
                      {' • '}
                      <span className="font-semibold text-amber-700">🥡 {o.boxesCount} Boxes</span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{o.totalAmount} ETB</td>
                    <td className="py-2.5 px-3 font-semibold text-emerald-600">
                      {o.paymentMethod || 'Cash'} (Paid)
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                        Delivered
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
