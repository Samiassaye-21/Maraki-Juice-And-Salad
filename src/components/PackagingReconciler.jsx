import React, { useState } from 'react';
import { 
  Scale, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  PlusCircle, 
  DollarSign, 
  FileText, 
  ShieldCheck,
  TrendingDown,
  RefreshCw
} from 'lucide-react';

export default function PackagingReconciler({ 
  inventory, 
  cupsSold, 
  boxesSold, 
  wasteLog, 
  onLogWaste,
  onUpdateOpeningStock 
}) {
  // Physical count inputs by the user/manager
  const [actualCupsCount, setActualCupsCount] = useState('');
  const [actualBoxesCount, setActualBoxesCount] = useState('');

  // Waste logging modal / form state
  const [wasteType, setWasteType] = useState('cup'); // cup | box
  const [wasteQty, setWasteQty] = useState(1);
  const [wasteReason, setWasteReason] = useState('Blender Spill / Dropped');
  const [wasteStaff, setWasteStaff] = useState('Helen (Barista)');
  const [showWasteForm, setShowWasteForm] = useState(false);

  // Edit opening stock states
  const [editingOpening, setEditingOpening] = useState(false);
  const [tempCupsOpening, setTempCupsOpening] = useState(inventory.cups.openingStock);
  const [tempBoxesOpening, setTempBoxesOpening] = useState(inventory.boxes.openingStock);

  // Waste totals
  const totalCupsWasted = wasteLog
    .filter(w => w.type === 'cup')
    .reduce((sum, w) => sum + w.quantity, 0);

  const totalBoxesWasted = wasteLog
    .filter(w => w.type === 'box')
    .reduce((sum, w) => sum + w.quantity, 0);

  // Expected inventory based on formula:
  // Expected = Opening - Sold - Wasted
  const expectedCups = inventory.cups.openingStock - cupsSold - totalCupsWasted;
  const expectedBoxes = inventory.boxes.openingStock - boxesSold - totalBoxesWasted;

  // Discrepancy calculations (when actual count is provided)
  const actualCupsNum = actualCupsCount === '' ? null : Number(actualCupsCount);
  const actualBoxesNum = actualBoxesCount === '' ? null : Number(actualBoxesCount);

  const cupsDiscrepancy = actualCupsNum !== null ? actualCupsNum - expectedCups : 0;
  const boxesDiscrepancy = actualBoxesNum !== null ? actualBoxesNum - expectedBoxes : 0;

  // Unaccounted money impact (Avg selling price of juices ~170 ETB, Salads ~280 ETB)
  const missingCupsRevenue = cupsDiscrepancy < 0 ? Math.abs(cupsDiscrepancy) * inventory.cups.estimatedRevenuePerUnit : 0;
  const missingBoxesRevenue = boxesDiscrepancy < 0 ? Math.abs(boxesDiscrepancy) * inventory.boxes.estimatedRevenuePerUnit : 0;
  const totalUnaccountedMoney = missingCupsRevenue + missingBoxesRevenue;

  const handleSaveOpening = () => {
    onUpdateOpeningStock(Number(tempCupsOpening), Number(tempBoxesOpening));
    setEditingOpening(false);
  };

  const handleAddWaste = (e) => {
    e.preventDefault();
    if (wasteQty <= 0) return;
    onLogWaste({
      id: `WST-${Date.now()}`,
      type: wasteType,
      quantity: Number(wasteQty),
      reason: wasteReason,
      staff: wasteStaff,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    setWasteQty(1);
    setShowWasteForm(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Top Banner explaining the physical audit math */}
      <div className="bg-gradient-to-r from-slate-900 to-emerald-950 text-white rounded-2xl p-5 border border-emerald-900/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xl">
              ⚖️
            </span>
            <h2 className="text-xl font-bold tracking-tight">
              Physical Packaging vs. Money Reconciliation
            </h2>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            This screen checks whether the <strong>physical cups and salad boxes on the shelf</strong> match the 
            <strong> money collected in your cash drawer</strong>. If physical cups are missing without recorded sales or waste, 
            the system highlights the exact unrecorded money leakage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditingOpening(!editingOpening)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Set Opening Stock</span>
          </button>
          <button
            onClick={() => setShowWasteForm(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors flex items-center gap-1.5 shadow-md shadow-amber-500/20"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Log Spilled / Damaged Item</span>
          </button>
        </div>
      </div>

      {/* Opening Stock Editor Drawer */}
      {editingOpening && (
        <div className="bg-white rounded-2xl p-4 border border-slate-300 shadow-lg animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-slate-900">Configure Shift Opening Inventory</h4>
            <span className="text-xs text-slate-500">Counts physically counted at start of shift</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                🥤 Juice & Smoothie Cups Opening Count
              </label>
              <input
                type="number"
                value={tempCupsOpening}
                onChange={(e) => setTempCupsOpening(e.target.value)}
                className="mt-1 w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                🥡 Food & Salad Boxes Opening Count
              </label>
              <input
                type="number"
                value={tempBoxesOpening}
                onChange={(e) => setTempBoxesOpening(e.target.value)}
                className="mt-1 w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => setEditingOpening(false)}
              className="px-3 py-1.5 text-xs text-slate-600 font-semibold hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveOpening}
              className="px-4 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-sm"
            >
              Update Opening Inventory
            </button>
          </div>
        </div>
      )}

      {/* Waste / Spillage Modal Form */}
      {showWasteForm && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-slate-200 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <span>Log Spilled / Damaged Packaging</span>
              </h3>
              <button
                onClick={() => setShowWasteForm(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddWaste} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700">Container Type</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setWasteType('cup')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      wasteType === 'cup'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    🥤 Juice Cup
                  </button>
                  <button
                    type="button"
                    onClick={() => setWasteType('box')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      wasteType === 'box'
                        ? 'bg-amber-50 border-amber-500 text-amber-800'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    🥡 Salad Box
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Quantity Damaged / Spilled</label>
                <input
                  type="number"
                  min="1"
                  value={wasteQty}
                  onChange={(e) => setWasteQty(e.target.value)}
                  className="mt-1 w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Official Reason</label>
                <select
                  value={wasteReason}
                  onChange={(e) => setWasteReason(e.target.value)}
                  className="mt-1 w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Blender Spill / Dropped Drink">Blender Spill / Dropped Drink</option>
                  <option value="Cracked Cup during Unboxing">Cracked Cup during Unboxing</option>
                  <option value="Wrong customer order remade">Wrong customer order remade</option>
                  <option value="Food container ripped">Food container ripped</option>
                  <option value="Customer requested size change">Customer requested size change</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Staff Member</label>
                <input
                  type="text"
                  value={wasteStaff}
                  onChange={(e) => setWasteStaff(e.target.value)}
                  className="mt-1 w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowWasteForm(false)}
                  className="px-4 py-2 text-xs text-slate-600 font-semibold hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md"
                >
                  Save to Waste Audit Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Reconciliation Comparison Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CARD 1: CUPS AUDIT */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 text-2xl flex items-center justify-center">
                  🥤
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Juice & Smoothie Cups</h3>
                  <span className="text-xs text-slate-500">Every cup sold = 1 drink paid</span>
                </div>
              </div>
              <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                Avg: {inventory.cups.estimatedRevenuePerUnit} ETB/drink
              </span>
            </div>

            {/* Reconciliation Math Flow */}
            <div className="grid grid-cols-3 gap-2 py-3 bg-slate-50 rounded-xl px-3 text-center border border-slate-100">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Opening</span>
                <p className="text-base font-black text-slate-800">{inventory.cups.openingStock}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-600">Sold (POS)</span>
                <p className="text-base font-black text-emerald-600">-{cupsSold}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-600">Waste Log</span>
                <p className="text-base font-black text-amber-600">-{totalCupsWasted}</p>
              </div>
            </div>

            {/* Expected Result */}
            <div className="mt-4 flex items-center justify-between p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl">
              <span className="text-xs font-bold text-emerald-900">
                System Calculated Cups Remaining:
              </span>
              <span className="text-lg font-black text-emerald-800">
                {expectedCups} <span className="text-xs font-semibold">cups</span>
              </span>
            </div>
          </div>

          {/* Physical Count Verification */}
          <div className="p-5 bg-slate-50 border-t border-slate-100 space-y-4">
            <div>
              <label className="text-xs font-extrabold text-slate-800 flex items-center justify-between">
                <span>Enter Physical Count of Remaining Cups:</span>
                <span className="text-[11px] font-normal text-slate-500">Count shelf inventory</span>
              </label>
              <div className="relative mt-1">
                <input
                  type="number"
                  placeholder={`Enter counted cups (e.g. ${expectedCups})`}
                  value={actualCupsCount}
                  onChange={(e) => setActualCupsCount(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  onClick={() => setActualCupsCount(String(expectedCups))}
                  className="absolute right-2 top-2 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[10px] font-bold"
                >
                  Auto-fill Expected
                </button>
              </div>
            </div>

            {/* Audit Status Outcome */}
            {actualCupsNum !== null && (
              <div className={`p-3.5 rounded-xl border ${
                cupsDiscrepancy === 0 
                  ? 'bg-emerald-100/70 border-emerald-300 text-emerald-950'
                  : cupsDiscrepancy < 0
                  ? 'bg-rose-50 border-rose-300 text-rose-950'
                  : 'bg-blue-50 border-blue-300 text-blue-950'
              }`}>
                {cupsDiscrepancy === 0 ? (
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold">100% Balanced Audit!</p>
                      <p className="text-[11px] text-emerald-800">
                        Every single cup accounted for in sales or logged waste. Zero unrecorded money.
                      </p>
                    </div>
                  </div>
                ) : cupsDiscrepancy < 0 ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-rose-700">
                      <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                      <span className="text-xs font-extrabold">
                        ⚠️ SHORTAGE: {Math.abs(cupsDiscrepancy)} Cups Missing!
                      </span>
                    </div>
                    <p className="text-[11px] text-rose-900 leading-snug">
                      You counted <strong>{actualCupsNum}</strong> cups, but there should be <strong>{expectedCups}</strong>. 
                      Estimated missing sales: <strong className="underline">{missingCupsRevenue.toLocaleString()} ETB</strong>.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-blue-800 text-xs">
                    <HelpCircle className="w-4 h-4 flex-shrink-0" />
                    <span>Surplus of +{cupsDiscrepancy} cups found (possible unrecorded opening stock).</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* CARD 2: FOOD BOXES AUDIT */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 text-2xl flex items-center justify-center">
                  🥡
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Salad & Food Boxes</h3>
                  <span className="text-xs text-slate-500">Every box sold = 1 salad paid</span>
                </div>
              </div>
              <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                Avg: {inventory.boxes.estimatedRevenuePerUnit} ETB/salad
              </span>
            </div>

            {/* Reconciliation Math Flow */}
            <div className="grid grid-cols-3 gap-2 py-3 bg-slate-50 rounded-xl px-3 text-center border border-slate-100">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Opening</span>
                <p className="text-base font-black text-slate-800">{inventory.boxes.openingStock}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-600">Sold (POS)</span>
                <p className="text-base font-black text-emerald-600">-{boxesSold}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-600">Waste Log</span>
                <p className="text-base font-black text-amber-600">-{totalBoxesWasted}</p>
              </div>
            </div>

            {/* Expected Result */}
            <div className="mt-4 flex items-center justify-between p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl">
              <span className="text-xs font-bold text-amber-900">
                System Calculated Boxes Remaining:
              </span>
              <span className="text-lg font-black text-amber-800">
                {expectedBoxes} <span className="text-xs font-semibold">boxes</span>
              </span>
            </div>
          </div>

          {/* Physical Count Verification */}
          <div className="p-5 bg-slate-50 border-t border-slate-100 space-y-4">
            <div>
              <label className="text-xs font-extrabold text-slate-800 flex items-center justify-between">
                <span>Enter Physical Count of Remaining Boxes:</span>
                <span className="text-[11px] font-normal text-slate-500">Count shelf inventory</span>
              </label>
              <div className="relative mt-1">
                <input
                  type="number"
                  placeholder={`Enter counted boxes (e.g. ${expectedBoxes})`}
                  value={actualBoxesCount}
                  onChange={(e) => setActualBoxesCount(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  onClick={() => setActualBoxesCount(String(expectedBoxes))}
                  className="absolute right-2 top-2 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[10px] font-bold"
                >
                  Auto-fill Expected
                </button>
              </div>
            </div>

            {/* Audit Status Outcome */}
            {actualBoxesNum !== null && (
              <div className={`p-3.5 rounded-xl border ${
                boxesDiscrepancy === 0 
                  ? 'bg-emerald-100/70 border-emerald-300 text-emerald-950'
                  : boxesDiscrepancy < 0
                  ? 'bg-rose-50 border-rose-300 text-rose-950'
                  : 'bg-blue-50 border-blue-300 text-blue-950'
              }`}>
                {boxesDiscrepancy === 0 ? (
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold">100% Balanced Box Audit!</p>
                      <p className="text-[11px] text-emerald-800">
                        All salad boxes matched with recorded sales or documented spills.
                      </p>
                    </div>
                  </div>
                ) : boxesDiscrepancy < 0 ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-rose-700">
                      <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                      <span className="text-xs font-extrabold">
                        ⚠️ SHORTAGE: {Math.abs(boxesDiscrepancy)} Boxes Missing!
                      </span>
                    </div>
                    <p className="text-[11px] text-rose-900 leading-snug">
                      You counted <strong>{actualBoxesNum}</strong> boxes, but there should be <strong>{expectedBoxes}</strong>. 
                      Estimated missing sales: <strong className="underline">{missingBoxesRevenue.toLocaleString()} ETB</strong>.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-blue-800 text-xs">
                    <HelpCircle className="w-4 h-4 flex-shrink-0" />
                    <span>Surplus of +{boxesDiscrepancy} boxes found.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* OVERALL FINANCIAL AUDIT CARD */}
      {(actualCupsNum !== null || actualBoxesNum !== null) && (
        <div className={`rounded-2xl p-5 border shadow-sm ${
          totalUnaccountedMoney > 0 
            ? 'bg-rose-500 text-white border-rose-600' 
            : 'bg-emerald-600 text-white border-emerald-700'
        }`}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md text-2xl">
                {totalUnaccountedMoney > 0 ? '🚨' : '🛡️'}
              </div>
              <div>
                <h4 className="font-black text-lg">
                  {totalUnaccountedMoney > 0 
                    ? `Potential Money Leakage Detected: ${totalUnaccountedMoney.toLocaleString()} ETB` 
                    : 'Congratulations: All Packaging & Money Perfectly Reconciled!'}
                </h4>
                <p className="text-xs text-white/90">
                  {totalUnaccountedMoney > 0 
                    ? 'Physical inventory shortage detected without corresponding cash or digital payment.' 
                    : 'The count of cups & boxes in the kitchen matches 100% of the money collected in your system.'}
                </p>
              </div>
            </div>

            <div className="bg-white/10 px-4 py-2 rounded-xl text-center border border-white/20">
              <span className="text-[10px] uppercase font-bold tracking-wider text-white/80">Audit Integrity</span>
              <p className="text-xl font-black">
                {totalUnaccountedMoney > 0 ? 'REVIEW REQUIRED' : 'PASSED (100%)'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Waste Audit History Log */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-500" />
            <span>Documented Waste & Damage Log (Legitimate Spills)</span>
          </h4>
          <span className="text-xs text-slate-500">{wasteLog.length} incidents logged</span>
        </div>

        {wasteLog.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No waste or damaged packaging logged today.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-y border-slate-200">
                <tr>
                  <th className="py-2 px-3">Time</th>
                  <th className="py-2 px-3">Item</th>
                  <th className="py-2 px-3">Qty</th>
                  <th className="py-2 px-3">Reason</th>
                  <th className="py-2 px-3">Reported By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {wasteLog.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-slate-500">{w.timestamp}</td>
                    <td className="py-2 px-3 font-semibold text-slate-800">
                      {w.type === 'cup' ? '🥤 Juice Cup' : '🥡 Salad Box'}
                    </td>
                    <td className="py-2 px-3 font-bold text-rose-600">{w.quantity} pcs</td>
                    <td className="py-2 px-3 text-slate-700">{w.reason}</td>
                    <td className="py-2 px-3 text-slate-600">{w.staff}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
