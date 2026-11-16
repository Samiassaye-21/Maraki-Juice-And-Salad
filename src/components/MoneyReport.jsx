import React, { useState } from 'react';
import { 
  Receipt, 
  DollarSign, 
  CreditCard, 
  Smartphone, 
  Wallet, 
  Printer, 
  CheckCircle, 
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle
} from 'lucide-react';

export default function MoneyReport({ orders, cupsSold, boxesSold }) {
  // Cash drawer audit states
  const [openingFloat, setOpeningFloat] = useState(500); // 500 ETB initial change
  const [actualDrawerCash, setActualDrawerCash] = useState('');
  const [pettyCashExpense, setPettyCashExpense] = useState(0); // e.g. bought emergency ice/lemons

  // Compute breakdown from paid orders
  const paidOrders = orders.filter(o => o.paymentStatus === 'Paid');

  const cashSales = paidOrders
    .filter(o => o.paymentMethod === 'Cash')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const telebirrSales = paidOrders
    .filter(o => o.paymentMethod === 'Telebirr')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const cbeBirrSales = paidOrders
    .filter(o => o.paymentMethod === 'CBE Birr')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const cardSales = paidOrders
    .filter(o => o.paymentMethod === 'Card')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const totalSalesRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  // Expected cash in drawer = Opening Float + Cash Sales - Petty Cash Expense
  const expectedDrawerCash = openingFloat + cashSales - pettyCashExpense;

  const actualCashNum = actualDrawerCash === '' ? null : Number(actualDrawerCash);
  const cashDiscrepancy = actualCashNum !== null ? actualCashNum - expectedDrawerCash : 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header with Print action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-emerald-600" />
            <span>Daily Sales & Cash Drawer Reconciliation</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Shift Z-Report and multi-channel payment reconciliation (Cash, Telebirr, CBE Birr)
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-colors"
        >
          <Printer className="w-4 h-4 text-emerald-400" />
          <span>Print Shift Audit Receipt</span>
        </button>
      </div>

      {/* 4 Summary Revenue Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Sales</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
              Br
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-emerald-400">
              {totalSalesRevenue.toLocaleString()} <span className="text-xs font-semibold text-slate-400">ETB</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              {paidOrders.length} Paid Orders ({cupsSold} Drinks, {boxesSold} Salads)
            </p>
          </div>
        </div>

        {/* Cash in Hand */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cash Collected</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-900">
              {cashSales.toLocaleString()} <span className="text-xs font-semibold text-slate-400">ETB</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              {paidOrders.filter(o => o.paymentMethod === 'Cash').length} Cash Transactions
            </p>
          </div>
        </div>

        {/* Telebirr Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Telebirr Mobile</span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-900">
              {telebirrSales.toLocaleString()} <span className="text-xs font-semibold text-slate-400">ETB</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              {paidOrders.filter(o => o.paymentMethod === 'Telebirr').length} Direct Telebirr payments
            </p>
          </div>
        </div>

        {/* CBE Birr & Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">CBE Birr & Card</span>
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-900">
              {(cbeBirrSales + cardSales).toLocaleString()} <span className="text-xs font-semibold text-slate-400">ETB</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              {cbeBirrSales} ETB (CBE) + {cardSales} ETB (POS Card)
            </p>
          </div>
        </div>
      </div>

      {/* Cash Drawer Reconciliation Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-emerald-600" />
          <span>Physical Cash Drawer Count (End-of-Shift Reconciliation)</span>
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left: Expected Cash Calculation */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
              <span className="text-slate-600 font-semibold">Opening Float (Starting Change):</span>
              <span className="font-bold text-slate-900">{openingFloat} ETB</span>
            </div>

            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
              <span className="text-emerald-700 font-semibold">+ Cash Received from Sales:</span>
              <span className="font-bold text-emerald-700">+{cashSales} ETB</span>
            </div>

            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
              <span className="text-rose-600 font-semibold">- Petty Cash / Expenses (Ice/Fruits):</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={pettyCashExpense}
                  onChange={(e) => setPettyCashExpense(Number(e.target.value))}
                  className="w-20 bg-white border border-slate-300 rounded px-2 py-0.5 text-right font-bold text-xs"
                />
                <span className="text-xs text-slate-500">ETB</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-sm font-extrabold text-slate-900">Expected Physical Cash in Drawer:</span>
              <span className="text-lg font-black text-slate-950">{expectedDrawerCash.toLocaleString()} ETB</span>
            </div>
          </div>

          {/* Right: Actual Cash Count Input */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="text-xs font-bold text-slate-800">
                Count & Enter Actual Cash Notes in Cash Drawer:
              </label>
              <div className="relative mt-1">
                <input
                  type="number"
                  placeholder={`Count and enter total cash (e.g. ${expectedDrawerCash})`}
                  value={actualDrawerCash}
                  onChange={(e) => setActualDrawerCash(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  onClick={() => setActualDrawerCash(String(expectedDrawerCash))}
                  className="absolute right-2 top-2 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[10px] font-bold"
                >
                  Auto-fill Expected
                </button>
              </div>
            </div>

            {/* Outcome */}
            {actualCashNum !== null && (
              <div className={`p-3.5 rounded-xl border ${
                cashDiscrepancy === 0 
                  ? 'bg-emerald-100/70 border-emerald-300 text-emerald-950'
                  : cashDiscrepancy < 0
                  ? 'bg-rose-50 border-rose-300 text-rose-950'
                  : 'bg-blue-50 border-blue-300 text-blue-950'
              }`}>
                {cashDiscrepancy === 0 ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold">Cash Drawer 100% Balanced!</p>
                      <p className="text-[11px] text-emerald-800">No cash shortage or surplus detected.</p>
                    </div>
                  </div>
                ) : cashDiscrepancy < 0 ? (
                  <div className="flex items-center gap-2 text-rose-700">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-extrabold">
                        CASH SHORTAGE: {Math.abs(cashDiscrepancy).toLocaleString()} ETB MISSING!
                      </p>
                      <p className="text-[11px] text-rose-900">
                        Cash counted is less than the recorded sales. Review cashier shifts immediately.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-blue-900">
                    Cash surplus of +{cashDiscrepancy.toLocaleString()} ETB found in drawer.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
