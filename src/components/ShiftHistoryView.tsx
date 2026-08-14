import React, { useState } from 'react';
import { 
  Receipt, 
  Sun, 
  Moon, 
  Trash2, 
  CupSoda, 
  UtensilsCrossed,
  Pencil,
  X,
  Save,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ShiftRecord, ShiftType } from '../types';
import { formatCurrency, calculateShiftTotals, cleanNumberInput, handleInputFocus, formatEthiopianFullDate } from '../utils/shiftUtils';

interface ShiftHistoryViewProps {
  shifts: ShiftRecord[];
  onUpdateShift: (updatedShift: ShiftRecord) => void;
  onDeleteShift: (id: string) => void;
  currencySymbol: string;
}

export const ShiftHistoryView: React.FC<ShiftHistoryViewProps> = ({
  shifts,
  onUpdateShift,
  onDeleteShift,
  currencySymbol,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [shiftTypeFilter, setShiftTypeFilter] = useState<'all' | 'day' | 'night'>('all');
  const [editingShift, setEditingShift] = useState<ShiftRecord | null>(null);

  const filteredShifts = shifts.filter((s) => {
    if (shiftTypeFilter !== 'all' && s.shiftType !== shiftTypeFilter) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchWorker = s.workerName.toLowerCase().includes(term);
      const matchNotes = s.notes?.toLowerCase().includes(term);
      const matchDate = s.date.includes(term);
      if (!matchWorker && !matchNotes && !matchDate) return false;
    }
    return true;
  });

  const handleOpenEdit = (shift: ShiftRecord) => {
    setEditingShift(JSON.parse(JSON.stringify(shift)));
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShift) return;

    const juiceOpening = editingShift.juiceCups.openingCount || 0;
    const juiceAdded = editingShift.juiceCups.addedCount || 0;
    const juiceLeftover = editingShift.juiceCups.remainingCount || 0;
    const juicePrice = editingShift.juiceCups.unitPrice || 0;

    const foodOpening = editingShift.foodTakeaways.openingCount || 0;
    const foodAdded = editingShift.foodTakeaways.addedCount || 0;
    const foodLeftover = editingShift.foodTakeaways.remainingCount || 0;
    const foodPrice = editingShift.foodTakeaways.unitPrice || 0;

    const {
      juiceCupsSold,
      juiceRevenue,
      foodTakeawaysSold,
      foodRevenue,
      grossIncome,
      netCashDueToOwner,
    } = calculateShiftTotals(
      juiceOpening,
      juiceAdded,
      juiceLeftover,
      juicePrice,
      foodOpening,
      foodAdded,
      foodLeftover,
      foodPrice,
      editingShift.digitalTransfers || 0,
      editingShift.dailyExpenses || 0,
      editingShift.newPendingPaymentsAmount || 0,
      editingShift.recoveredPendingAmount || 0,
      editingShift.deliveryCreditAmount || 0
    );

    const updated: ShiftRecord = {
      ...editingShift,
      juiceCupsSold,
      juiceRevenue,
      foodTakeawaysSold,
      foodRevenue,
      grossIncome,
      netCashDueToOwner,
    };

    onUpdateShift(updated);
    setEditingShift(null);
  };

  const inputClasses = "w-full px-4 py-2.5 rounded-full border border-[#403c21]/30 bg-white text-[#403c21] text-sm font-bold focus:outline-none focus:border-[#403c21] focus:ring-4 focus:ring-[#403c21]/20 transition-all placeholder:text-[#403c21]/70 shadow-xs";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 16 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.4 }}
      className="space-y-6 font-sans text-[#403c21]"
    >
      
      {/* HEADER CARD */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#403c21]/20 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3.5 rounded-full bg-[#f7f5f0] text-[#403c21] border border-[#403c21]/20">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[#403c21]">
              Shift History & Reconciliation Audit
            </h2>
            <p className="text-sm font-medium text-neutral-600 mt-0.5">
              Complete historical record of shift handovers, stock counts & net cash
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1 bg-[#f7f5f0] p-1 rounded-full border border-[#403c21]/20 text-xs font-bold w-full sm:w-auto">
          <button
            onClick={() => setShiftTypeFilter('all')}
            className={`px-4 py-2 rounded-full transition-all cursor-pointer flex-1 sm:flex-none ${shiftTypeFilter === 'all' ? 'bg-[#403c21] text-white shadow-md' : 'text-neutral-600 hover:text-[#403c21]'}`}
          >
            All Shifts
          </button>
          <button
            onClick={() => setShiftTypeFilter('day')}
            className={`px-4 py-2 rounded-full transition-all cursor-pointer flex-1 sm:flex-none ${shiftTypeFilter === 'day' ? 'bg-[#403c21] text-white shadow-md' : 'text-neutral-600 hover:text-[#403c21]'}`}
          >
            Day Shift
          </button>
          <button
            onClick={() => setShiftTypeFilter('night')}
            className={`px-4 py-2 rounded-full transition-all cursor-pointer flex-1 sm:flex-none ${shiftTypeFilter === 'night' ? 'bg-[#403c21] text-white shadow-md' : 'text-neutral-600 hover:text-[#403c21]'}`}
          >
            Night Shift
          </button>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="relative w-full">
        <input 
          type="text"
          placeholder="Search by worker name, date, or notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white border border-[#403c21]/30 rounded-full text-sm text-[#403c21] font-bold focus:outline-none focus:border-[#403c21] focus:ring-4 focus:ring-[#403c21]/20 placeholder:text-[#403c21]/70 shadow-xs"
        />
        <Search className="w-5 h-5 text-[#403c21]/70 absolute left-4 top-3.5" />
      </div>

      {/* SHIFTS LIST */}
      <div className="space-y-4">
        {filteredShifts.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#403c21]/20 flex flex-col items-center shadow-xs">
            <Receipt className="w-12 h-12 text-[#403c21] mb-3 opacity-40" />
            <h3 className="text-base font-extrabold text-[#403c21]">No closed shift history yet</h3>
            <p className="text-sm font-medium text-neutral-600 mt-1">Closed shifts will be archived here for audit</p>
          </div>
        ) : (
          filteredShifts.map((shift, index) => (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              key={shift.id}
              className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs hover:shadow-md transition-all border border-[#403c21]/20 text-[#403c21]"
            >
              {/* Top Row: Date, Shift Type & Net Cash */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#403c21]/30 pb-4">
                <div className="flex items-center space-x-3.5">
                  <div className="p-3 rounded-full bg-[#403c21]/40 text-[#403c21] border border-[#403c21]/60">
                    {shift.shiftType === 'day' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                      <h3 className="text-base font-bold text-white capitalize">
                        {shift.shiftType} Shift • {shift.date}
                      </h3>
                      {formatEthiopianFullDate(shift.date) && (
                        <span className="bg-[#403c21] text-white font-extrabold border border-[#403c21]/40 text-xs font-bold px-3 py-0.5 rounded-full flex items-center gap-1">
                          <span>🇪🇹</span> {formatEthiopianFullDate(shift.date)}
                        </span>
                      )}
                      <span className="bg-[#403c21] text-white border border-[#403c21]/40 text-xs font-medium px-3 py-0.5 rounded-full">
                        {shift.workerName}
                      </span>
                    </div>
                    <p className="text-neutral-300 text-xs uppercase tracking-wide mt-1">
                      Leftovers: {shift.juiceCups.remainingCount} Juice & {shift.foodTakeaways.remainingCount} Food
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 self-end sm:self-center">
                  <div className="text-right">
                    <span className="text-[#403c21]/70 text-xs uppercase tracking-wide block mb-0.5">
                      Net Physical Cash
                    </span>
                    <span className="text-2xl font-extrabold text-white font-extrabold">
                      {formatCurrency(shift.netCashDueToOwner, currencySymbol)}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleOpenEdit(shift)}
                      className="px-4 py-2 bg-[#403c21] text-white hover:bg-[#403c21]/30 rounded-full transition-colors cursor-pointer flex items-center space-x-1.5 text-xs font-bold border border-[#403c21]"
                      title="Edit Shift"
                    >
                      <Pencil className="w-4 h-4 text-[#403c21]" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>

                    <button
                      onClick={() => onDeleteShift(shift.id)}
                      className="p-2 text-neutral-300 hover:text-white hover:bg-red-950/50 rounded-full transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
                <div className="bg-[#403c21] p-3.5 rounded-2xl border border-[#403c21]/40">
                  <span className="text-[#403c21]/70 text-[10px] uppercase font-medium tracking-wide block">Gross Sales</span>
                  <span className="text-sm font-extrabold text-[#403c21] block mt-1">
                    {formatCurrency(shift.grossIncome, currencySymbol)}
                  </span>
                  <span className="text-xs text-neutral-300 block mt-0.5">
                    ({shift.juiceCupsSold} cups + {shift.foodTakeawaysSold} boxes)
                  </span>
                </div>

                <div className="bg-[#403c21] p-3.5 rounded-2xl border border-[#403c21]/40">
                  <span className="text-[#403c21]/70 text-[10px] uppercase font-medium tracking-wide block">Digital Transfers</span>
                  <span className="text-sm font-extrabold text-white block mt-1">
                    -{formatCurrency(shift.digitalTransfers, currencySymbol)}
                  </span>
                  <span className="text-xs text-neutral-300 block mt-0.5">
                    Telebirr / Bank
                  </span>
                </div>

                <div className="bg-[#403c21] p-3.5 rounded-2xl border border-[#403c21]/40">
                  <span className="text-[#403c21]/70 text-[10px] uppercase font-medium tracking-wide block">Cooking Expenses</span>
                  <span className="text-sm font-extrabold text-white block mt-1">
                    -{formatCurrency(shift.dailyExpenses, currencySymbol)}
                  </span>
                  <span className="text-xs text-neutral-300 block mt-0.5">
                    Market Purchases
                  </span>
                </div>

                <div className="bg-[#403c21] p-3.5 rounded-2xl border border-[#403c21]/40">
                  <span className="text-[#403c21]/70 text-[10px] uppercase font-medium tracking-wide block">Pending / Delivery</span>
                  <span className="text-sm font-extrabold text-white block mt-1">
                    -{formatCurrency(shift.newPendingPaymentsAmount + shift.deliveryCreditAmount, currencySymbol)}
                  </span>
                  <span className="text-xs text-neutral-300 block mt-0.5">
                    Unpaid Credit
                  </span>
                </div>
              </div>

              {shift.notes && (
                <div className="bg-[#403c21] p-3.5 rounded-2xl border border-[#403c21]/40 mt-4">
                  <p className="text-sm text-neutral-300">
                    {shift.notes}
                  </p>
                </div>
              )}

            </motion.div>
          ))
        )}
      </div>

      {/* EDIT SHIFT MODAL */}
      <AnimatePresence>
        {editingShift && (
          <div className="fixed inset-0 bg-[#403c21]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#403c21] rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl my-8 border border-[#403c21]/50 text-white"
            >
              <div className="flex items-center justify-between border-b border-[#403c21]/30 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-[#403c21]/40 text-[#403c21] border border-[#403c21]/60 rounded-full">
                    <Pencil className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-[#403c21]">
                      Edit Shift Record
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setEditingShift(null)}
                  className="p-2 text-[#403c21]/70 hover:text-white hover:bg-[#403c21]/30 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-neutral-300 text-xs uppercase font-medium tracking-wide mb-1.5">Shift Date</label>
                    <input
                      type="date"
                      required
                      value={editingShift.date}
                      onChange={(e) => setEditingShift({ ...editingShift, date: e.target.value })}
                      className={inputClasses}
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-300 text-xs uppercase font-medium tracking-wide mb-1.5">Shift Type</label>
                    <select
                      value={editingShift.shiftType}
                      onChange={(e) => setEditingShift({ ...editingShift, shiftType: e.target.value as ShiftType })}
                      className={inputClasses}
                    >
                      <option value="day">Day Shift</option>
                      <option value="night">Night Shift</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-neutral-300 text-xs uppercase font-medium tracking-wide mb-1.5">Worker Name</label>
                    <input
                      type="text"
                      required
                      value={editingShift.workerName}
                      onChange={(e) => setEditingShift({ ...editingShift, workerName: e.target.value })}
                      className={inputClasses}
                    />
                  </div>
                </div>

                <div className="bg-[#403c21]/20 p-5 rounded-3xl border border-[#403c21]/40 space-y-4">
                  <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                    <CupSoda className="w-4 h-4 text-[#403c21]" />
                    <span>Juice Cups & Food Takeaways Inventory</span>
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-neutral-300 text-xs uppercase tracking-wide block mb-1">Juice Opening</span>
                      <input
                        type="number"
                        min="0"
                        value={editingShift.juiceCups.openingCount}
                        onFocus={handleInputFocus}
                        onChange={(e) => setEditingShift({
                          ...editingShift,
                          juiceCups: { ...editingShift.juiceCups, openingCount: cleanNumberInput(e) }
                        })}
                        className={inputClasses}
                      />
                    </div>
                    <div>
                      <span className="text-neutral-300 text-xs uppercase tracking-wide block mb-1">Juice Restocked</span>
                      <input
                        type="number"
                        min="0"
                        value={editingShift.juiceCups.addedCount}
                        onFocus={handleInputFocus}
                        onChange={(e) => setEditingShift({
                          ...editingShift,
                          juiceCups: { ...editingShift.juiceCups, addedCount: cleanNumberInput(e) }
                        })}
                        className={inputClasses}
                      />
                    </div>
                    <div>
                      <span className="text-neutral-300 font-bold text-xs uppercase tracking-wide block mb-1">Juice Leftover</span>
                      <input
                        type="number"
                        min="0"
                        value={editingShift.juiceCups.remainingCount}
                        onFocus={handleInputFocus}
                        onChange={(e) => setEditingShift({
                          ...editingShift,
                          juiceCups: { ...editingShift.juiceCups, remainingCount: cleanNumberInput(e) }
                        })}
                        className={inputClasses}
                      />
                    </div>
                    <div>
                      <span className="text-neutral-300 text-xs uppercase tracking-wide block mb-1">Price ({currencySymbol})</span>
                      <input
                        type="number"
                        min="0"
                        value={editingShift.juiceCups.unitPrice}
                        onFocus={handleInputFocus}
                        onChange={(e) => setEditingShift({
                          ...editingShift,
                          juiceCups: { ...editingShift.juiceCups, unitPrice: cleanNumberInput(e) }
                        })}
                        className={inputClasses}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm pt-4 border-t border-[#403c21]/30">
                    <div>
                      <span className="text-neutral-300 text-xs uppercase tracking-wide block mb-1">Food Opening</span>
                      <input
                        type="number"
                        min="0"
                        value={editingShift.foodTakeaways.openingCount}
                        onFocus={handleInputFocus}
                        onChange={(e) => setEditingShift({
                          ...editingShift,
                          foodTakeaways: { ...editingShift.foodTakeaways, openingCount: cleanNumberInput(e) }
                        })}
                        className={inputClasses}
                      />
                    </div>
                    <div>
                      <span className="text-neutral-300 text-xs uppercase tracking-wide block mb-1">Food Restocked</span>
                      <input
                        type="number"
                        min="0"
                        value={editingShift.foodTakeaways.addedCount}
                        onFocus={handleInputFocus}
                        onChange={(e) => setEditingShift({
                          ...editingShift,
                          foodTakeaways: { ...editingShift.foodTakeaways, addedCount: cleanNumberInput(e) }
                        })}
                        className={inputClasses}
                      />
                    </div>
                    <div>
                      <span className="text-neutral-300 font-bold text-xs uppercase tracking-wide block mb-1">Food Leftover</span>
                      <input
                        type="number"
                        min="0"
                        value={editingShift.foodTakeaways.remainingCount}
                        onFocus={handleInputFocus}
                        onChange={(e) => setEditingShift({
                          ...editingShift,
                          foodTakeaways: { ...editingShift.foodTakeaways, remainingCount: cleanNumberInput(e) }
                        })}
                        className={inputClasses}
                      />
                    </div>
                    <div>
                      <span className="text-neutral-300 text-xs uppercase tracking-wide block mb-1">Price ({currencySymbol})</span>
                      <input
                        type="number"
                        min="0"
                        value={editingShift.foodTakeaways.unitPrice}
                        onFocus={handleInputFocus}
                        onChange={(e) => setEditingShift({
                          ...editingShift,
                          foodTakeaways: { ...editingShift.foodTakeaways, unitPrice: cleanNumberInput(e) }
                        })}
                        className={inputClasses}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-neutral-300 text-xs uppercase tracking-wide mb-1.5">Digital Transfers</label>
                    <input
                      type="number"
                      min="0"
                      value={editingShift.digitalTransfers}
                      onFocus={handleInputFocus}
                      onChange={(e) => setEditingShift({ ...editingShift, digitalTransfers: cleanNumberInput(e) })}
                      className={inputClasses}
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-300 text-xs uppercase tracking-wide mb-1.5">Expenses Total</label>
                    <input
                      type="number"
                      min="0"
                      value={editingShift.dailyExpenses}
                      onFocus={handleInputFocus}
                      onChange={(e) => setEditingShift({ ...editingShift, dailyExpenses: cleanNumberInput(e) })}
                      className={inputClasses}
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-300 text-xs uppercase tracking-wide mb-1.5">Pending Amount</label>
                    <input
                      type="number"
                      min="0"
                      value={editingShift.newPendingPaymentsAmount}
                      onFocus={handleInputFocus}
                      onChange={(e) => setEditingShift({ ...editingShift, newPendingPaymentsAmount: cleanNumberInput(e) })}
                      className={inputClasses}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-5 border-t border-[#403c21]/30">
                  <button
                    type="button"
                    onClick={() => setEditingShift(null)}
                    className="px-5 py-2.5 bg-[#403c21] border border-[#403c21] text-[#403c21] font-bold text-xs rounded-full cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#403c21] hover:bg-[#403c21]/90 text-[#403c21] font-bold text-xs rounded-full shadow-md cursor-pointer transition-colors flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4 text-[#403c21]" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default ShiftHistoryView;
