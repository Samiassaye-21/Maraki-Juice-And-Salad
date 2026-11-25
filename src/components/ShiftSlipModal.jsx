import React, { useState } from 'react';
import { Printer, X, Copy, Check, Image as ImageIcon, Download, CheckCircle2, Share2 } from 'lucide-react';
import { toEthiopianDateString } from './BusinessManagement';

/**
 * Format settlement record as a clean WhatsApp/Telegram receipt text.
 */
export function formatSettlementSlipText(slip) {
  if (!slip) return '';
  const ethDate = toEthiopianDateString(`${slip.date}T12:00:00`);
  const boxes = slip.assignedBoxes || slip.targetFoodSold || 0;
  return [
    `🧾 MARAKI JUICE & SALAD`,
    `DAILY SHIFT SETTLEMENT SLIP`,
    `📅 ${ethDate} (${slip.date})`,
    `🕒 Shift: ${slip.shift === 'Day' ? '☀️ Day Shift' : '🌙 Night Shift'}`,
    `────────────────────────`,
    `🥤 Juice Sales (${slip.juiceSold || 0} cups): ${(slip.grossJuiceRevenue || 0).toLocaleString()} ETB`,
    `   - beU Delivery (${slip.beuDeliveryCups || 0}): -${(slip.beuDeliveryDeduction || 0).toLocaleString()} ETB`,
    `🍱 Food Sales (${boxes} boxes): ${(slip.totalFoodRevenue || 0).toLocaleString()} ETB`,
    `💰 Total Gross Sales: ${(slip.totalGrossSales || 0).toLocaleString()} ETB`,
    `────────────────────────`,
    `- Uncollected Pending: -${(slip.deductedPendingDebt || 0).toLocaleString()} ETB`,
    `+ Recovered Debts: +${(slip.recoveredCashAdded || 0).toLocaleString()} ETB`,
    `- Operating Expenses: -${(slip.totalDailyExpenses || 0).toLocaleString()} ETB`,
    `- Bank & Telebirr: -${(slip.totalBankTransfers || 0).toLocaleString()} ETB`,
    `────────────────────────`,
    `💵 Physical Cash in Drawer: ${(slip.physicalCashInDrawer || 0).toLocaleString()} ETB`,
    slip.chefAudit?.hasMismatch ? `🚨 NOTE: Chef Sent vs Income Sheet Mismatch Flagged` : `✅ Chef vs Income Sheet: Matched`
  ].join('\n');
}

/**
 * Render the settlement slip cleanly onto a crisp PNG image and trigger download.
 */
function downloadSettlementSlipPng(slip) {
  if (!slip) return;
  const width = 520;
  const height = 700;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // Outer subtle border
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2;
  ctx.strokeRect(16, 16, width - 32, height - 32);

  // Header
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('MARAKI JUICE & SALAD', width / 2, 58);

  ctx.fillStyle = '#475569';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('DAILY SHIFT SETTLEMENT SLIP', width / 2, 80);

  ctx.fillStyle = '#64748B';
  ctx.font = '12px sans-serif';
  const ethDate = toEthiopianDateString(`${slip.date}T12:00:00`);
  ctx.fillText(`${ethDate} (${slip.date})`, width / 2, 102);

  // Divider
  ctx.strokeStyle = '#E2E8F0';
  ctx.beginPath();
  ctx.moveTo(36, 120);
  ctx.lineTo(width - 36, 120);
  ctx.stroke();

  const boxes = slip.assignedBoxes || slip.targetFoodSold || 0;
  const rows = [
    { label: 'Shift:', val: slip.shift === 'Day' ? 'Day Shift' : 'Night Shift', color: '#0F172A', bold: true },
    { label: `Juice Sales (${slip.juiceSold || 0} cups):`, val: `${(slip.grossJuiceRevenue || 0).toLocaleString()} ETB`, color: '#0F172A' },
    { label: `  - beU Delivery (${slip.beuDeliveryCups || 0}):`, val: `-${(slip.beuDeliveryDeduction || 0).toLocaleString()} ETB`, color: '#64748B' },
    { label: `Food Sales (${boxes} boxes):`, val: `${(slip.totalFoodRevenue || 0).toLocaleString()} ETB`, color: '#0F172A' },
    { label: 'Total Gross Sales:', val: `${(slip.totalGrossSales || 0).toLocaleString()} ETB`, color: '#0F172A', bold: true, topLine: true },
    { label: '- Uncollected Pending:', val: `-${(slip.deductedPendingDebt || 0).toLocaleString()} ETB`, color: '#E11D48' },
    { label: '+ Recovered Debts:', val: `+${(slip.recoveredCashAdded || 0).toLocaleString()} ETB`, color: '#059669' },
    { label: '- Operating Expenses:', val: `-${(slip.totalDailyExpenses || 0).toLocaleString()} ETB`, color: '#E11D48' },
    { label: '- Bank & Telebirr:', val: `-${(slip.totalBankTransfers || 0).toLocaleString()} ETB`, color: '#047857' }
  ];

  let y = 152;
  rows.forEach(r => {
    if (r.topLine) {
      ctx.strokeStyle = '#E2E8F0';
      ctx.beginPath();
      ctx.moveTo(36, y - 16);
      ctx.lineTo(width - 36, y - 16);
      ctx.stroke();
    }
    ctx.fillStyle = r.color;
    ctx.font = r.bold ? 'bold 14px monospace' : '13px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(r.label, 38, y);
    ctx.textAlign = 'right';
    ctx.fillText(r.val, width - 38, y);
    y += 38;
  });

  // Dashed line before Drawer Cash
  ctx.save();
  ctx.setLineDash([6, 4]);
  ctx.strokeStyle = '#94A3B8';
  ctx.beginPath();
  ctx.moveTo(36, y + 4);
  ctx.lineTo(width - 36, y + 4);
  ctx.stroke();
  ctx.restore();

  y += 38;
  ctx.fillStyle = '#065F46';
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('Physical Cash in Drawer:', 38, y);
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`${(slip.physicalCashInDrawer || 0).toLocaleString()} ETB`, width - 38, y);

  // Signatures
  ctx.strokeStyle = '#CBD5E1';
  ctx.beginPath();
  ctx.moveTo(36, height - 105);
  ctx.lineTo(width - 36, height - 105);
  ctx.stroke();

  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = '#94A3B8';
  ctx.beginPath();
  ctx.moveTo(56, height - 60);
  ctx.lineTo(220, height - 60);
  ctx.moveTo(300, height - 60);
  ctx.lineTo(width - 56, height - 60);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = '#64748B';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Cashier', 138, height - 40);
  ctx.fillText('Manager', width - 138, height - 40);

  const link = document.createElement('a');
  link.download = `maraki_shift_slip_${slip.date}_${slip.shift}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export default function ShiftSlipModal({ slip, onClose, isPostSave = false }) {
  const [copied, setCopied] = useState(false);
  const [savedPng, setSavedPng] = useState(false);

  if (!slip) return null;

  const boxes = slip.assignedBoxes || slip.targetFoodSold || 0;

  const handleCopyText = () => {
    const text = formatSettlementSlipText(slip);
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleSavePng = () => {
    downloadSettlementSlipPng(slip);
    setSavedPng(true);
    setTimeout(() => setSavedPng(false), 2500);
  };

  const handleDownloadCsv = () => {
    const headers = 'Date,Shift,Juice Sold,beU Cups,Food Boxes,Gross Sales,Pending New,Recovered,Expenses,Bank Transfers,Physical Cash\n';
    const row = `${slip.date},${slip.shift},${slip.juiceSold || 0},${slip.beuDeliveryCups || 0},${boxes},${slip.totalGrossSales || 0},${slip.deductedPendingDebt || 0},${slip.recoveredCashAdded || 0},${slip.totalDailyExpenses || 0},${slip.totalBankTransfers || 0},${slip.physicalCashInDrawer || 0}\n`;
    const blob = new Blob([headers + row], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maraki_shift_slip_${slip.date}_${slip.shift}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const text = formatSettlementSlipText(slip);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Maraki Settlement - ${slip.date} (${slip.shift})`,
          text
        });
      } catch (e) {}
    } else {
      handleCopyText();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white text-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto font-mono text-xs">
        <div className="flex items-center justify-between border-b pb-2">
          <span className="font-bold text-slate-500 text-[11px]">Shift Settlement Slip (80mm)</span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 p-1 rounded-xl"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Receipt Content */}
        <div className="border border-slate-300 p-4 rounded-xl space-y-2 bg-slate-50 text-[11px] leading-relaxed">
          <div className="text-center space-y-0.5 border-b pb-2">
            <h3 className="font-black text-sm tracking-tight text-slate-900">MARAKI JUICE & SALAD</h3>
            <p className="text-[10px] text-slate-600 font-bold">DAILY SHIFT SETTLEMENT SLIP</p>
            <p className="text-[10px] text-slate-500">{toEthiopianDateString(`${slip.date}T12:00:00`)} ({slip.date})</p>
          </div>

          <div className="flex justify-between">
            <span>Shift:</span>
            <strong>{slip.shift === 'Day' ? '☀️ Day Shift' : '🌙 Night Shift'}</strong>
          </div>

          <div className="flex justify-between border-t pt-1">
            <span>🥤 Juice Sales ({slip.juiceSold || 0} cups):</span>
            <span>{(slip.grossJuiceRevenue || 0).toLocaleString()} ETB</span>
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 pl-2">
            <span>- beU Delivery ({slip.beuDeliveryCups || 0}):</span>
            <span>-{(slip.beuDeliveryDeduction || 0).toLocaleString()} ETB</span>
          </div>

          <div className="flex justify-between border-t pt-1">
            <span>🍱 Food Sales ({boxes} boxes):</span>
            <span>{(slip.totalFoodRevenue || 0).toLocaleString()} ETB</span>
          </div>

          <div className="flex justify-between border-t pt-1 font-black">
            <span>Total Gross Sales:</span>
            <span>{(slip.totalGrossSales || 0).toLocaleString()} ETB</span>
          </div>

          <div className="flex justify-between text-rose-600">
            <span>- Uncollected Debts (Pending):</span>
            <span>-{(slip.deductedPendingDebt || 0).toLocaleString()} ETB</span>
          </div>
          <div className="flex justify-between text-teal-700">
            <span>+ Recovered Debts:</span>
            <span>+{(slip.recoveredCashAdded || 0).toLocaleString()} ETB</span>
          </div>
          <div className="flex justify-between text-rose-600">
            <span>- Operating Expenses:</span>
            <span>-{(slip.totalDailyExpenses || 0).toLocaleString()} ETB</span>
          </div>
          <div className="flex justify-between text-purple-700">
            <span>- Bank & Telebirr Transfers:</span>
            <span>-{(slip.totalBankTransfers || 0).toLocaleString()} ETB</span>
          </div>

          <div className="border-t-2 border-dashed pt-2 flex justify-between font-black text-xs text-slate-900">
            <span>💵 Physical Cash in Drawer:</span>
            <span className="text-sm">{(slip.physicalCashInDrawer || 0).toLocaleString()} ETB</span>
          </div>

          {slip.chefAudit?.hasMismatch && (
            <div className="mt-2 p-2 rounded-lg bg-rose-100 text-rose-900 text-[10px] font-black text-center">
              🚨 Chef Sent vs Income Sheet Mismatch Flagged
            </div>
          )}

          {/* Signatures */}
          <div className="pt-5 grid grid-cols-2 gap-4 text-center text-[10px] text-slate-500 border-t border-slate-300">
            <div>
              <div className="border-b border-dashed border-slate-400 mb-1 h-6"></div>
              <span>Cashier (አስረካቢ)</span>
            </div>
            <div>
              <div className="border-b border-dashed border-slate-400 mb-1 h-6"></div>
              <span>Manager (ተረካቢ)</span>
            </div>
          </div>
        </div>

        {/* DIGITAL OPTIONS (WHEN NOT PRINTING) + PRINT */}
        <div className="space-y-2 font-sans">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleCopyText}
              className="py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5 text-emerald-700" />}
              <span>{copied ? 'Copied!' : 'Copy Text'}</span>
            </button>

            <button
              type="button"
              onClick={handleSavePng}
              className="py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              {savedPng ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />}
              <span>{savedPng ? 'Saved PNG!' : 'Save Image'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadCsv}
              className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Save CSV</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-600" />
              <span>Share / Send</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isPostSave ? 'Done & Next Shift →' : 'Done (Close)'}</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print (80mm)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
