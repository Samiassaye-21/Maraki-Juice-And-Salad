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

  const inputClasses = "w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all shadow-sm";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 16 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      
      {/* HEADER CARD */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 shadow-sm">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Shift History & Reconciliation Audit
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Complete historical record of shift handovers, stock counts & net cash
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1 bg-slate-50 p-1 rounded-lg border border-slate-200 text-sm font-medium w-full sm:w-auto shadow-sm">
          <button
            onClick={() => setShiftTypeFilter('all')}
            className={`px-4 py-2 rounded-md transition-all cursor-pointer flex-1 sm:flex-none ${shiftTypeFilter === 'all' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
          >
            All Shifts
          </button>
          <button
            onClick={() => setShiftTypeFilter('day')}
            className={`px-4 py-2 rounded-md transition-all cursor-pointer flex-1 sm:flex-none ${shiftTypeFilter === 'day' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Day Shift
          </button>
          <button
            onClick={() => setShiftTypeFilter('night')}
            className={`px-4 py-2 rounded-md transition-all cursor-pointer flex-1 sm:flex-none ${shiftTypeFilter === 'night' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
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
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 shadow-sm placeholder:text-slate-400"
        />
        <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3" />
      </div>

      {/* SHIFTS LIST */}
      <div className="space-y-4">
        {filteredShifts.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200 flex flex-col items-center shadow-sm">
            <Receipt className="w-12 h-12 text-slate-300 mb-3" />
            <h3 className="text-base font-semibold text-slate-900">No closed shift history yet</h3>
            <p className="text-sm text-slate-500 mt-1">Closed shifts will be archived here for audit</p>
          </div>
        ) : (
          filteredShifts.map((shift, index) => (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              key={shift.id}
              className="bg-white rounded-xl p-5 sm:p-6 shadow-sm transition-all hover:shadow-md border border-slate-200 border-l-4 border-l-blue-400"
            >
              {/* Top Row: Date, Shift Type & Net Cash */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-3.5">
                  <div className={`p-3 rounded-lg ${
                    shift.shiftType === 'day' ? 'bg-blue-50 text-blue-500' : 'bg-indigo-50 text-indigo-500'
                  }`}>
                    {shift.shiftType === 'day' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2.5">
                      <h3 className="text-base font-semibold text-slate-900 capitalize">
                        {shift.shiftType} Shift • {shift.date}
                      </h3>
                      {formatEthiopianFullDate(shift.date) && (
                        <span className="bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                          <span>🇪🇹</span> {formatEthiopianFullDate(shift.date)}
                        </span>
                      )}
                      <span className="bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {shift.workerName}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs uppercase tracking-wide mt-1">
                      Leftovers: {shift.juiceCups.remainingCount} Juice & {shift.foodTakeaways.remainingCount} Food
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 self-end sm:self-center">
                  <div className="text-right">
                    <span className="text-slate-400 text-xs uppercase tracking-wide block mb-0.5">
                      Net Physical Cash
                    </span>
                    <span className="text-2xl font-bold text-slate-900">
                      {formatCurrency(shift.netCashDueToOwner, currencySymbol)}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleOpenEdit(shift)}
                      className="p-2 bg-white text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition-colors cursor-pointer flex items-center space-x-1.5 text-sm font-medium border border-slate-200 shadow-sm"
                      title="Edit Shift"
                    >
                      <Pencil className="w-4 h-4" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>

                    <button
                      onClick={() => onDeleteShift(shift.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-red-100"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-slate-400 text-xs uppercase tracking-wide block">Gross Sales</span>
                  <span className="text-sm font-semibold text-slate-900 block mt-1">
                    {formatCurrency(shift.grossIncome, currencySymbol)}
                  </span>
                  <span className="text-xs text-slate-500 block mt-0.5">
                    ({shift.juiceCupsSold} cups + {shift.foodTakeawaysSold} boxes)
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-slate-400 text-xs uppercase tracking-wide block">Digital Transfers</span>
                  <span className="text-sm font-semibold text-slate-900 block mt-1">
                    -{formatCurrency(shift.digitalTransfers, currencySymbol)}
                  </span>
                  <span className="text-xs text-slate-500 block mt-0.5">
                    Telebirr / Bank
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-slate-400 text-xs uppercase tracking-wide block">Cooking Expenses</span>
                  <span className="text-sm font-semibold text-slate-900 block mt-1">
                    -{formatCurrency(shift.dailyExpenses, currencySymbol)}
                  </span>
                  <span className="text-xs text-slate-500 block mt-0.5">
                    Market Purchases
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-slate-400 text-xs uppercase tracking-wide block">Pending / Delivery</span>
                  <span className="text-sm font-semibold text-slate-900 block mt-1">
                    -{formatCurrency(shift.newPendingPaymentsAmount + shift.deliveryCreditAmount, currencySymbol)}
                  </span>
                  <span className="text-xs text-slate-500 block mt-0.5">
                    Unpaid Credit
                  </span>
                </div>
              </div>

              {shift.notes && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mt-4">
                  <p className="text-sm text-slate-600">
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
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-xl max-w-2xl w-full p-6 space-y-5 shadow-xl my-8 border border-slate-200"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                    <Pencil className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      Edit Shift Record
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setEditingShift(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-500 text-xs uppercase tracking-wide mb-1.5">Shift Date</label>
                    <input
                      type="date"
                      required
                      value={editingShift.date}
                      onChange={(e) => setEditingShift({ ...editingShift, date: e.target.value })}
                      className={inputClasses}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 text-xs uppercase tracking-wide mb-1.5">Shift Type</label>
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
                    <label className="block text-slate-500 text-xs uppercase tracking-wide mb-1.5">Worker Name</label>
                    <input
                      type="text"
                      required
                      value={editingShift.workerName}
                      onChange={(e) => setEditingShift({ ...editingShift, workerName: e.target.value })}
                      className={inputClasses}
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-4">
                  <h4 className="text-sm font-semibold text-slate-900 flex items-center space-x-2">
                    <CupSoda className="w-4 h-4 text-slate-500" />
                    <span>Juice Cups & Food Takeaways Inventory</span>
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-slate-500 text-xs uppercase tracking-wide block mb-1">Juice Opening</span>
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
                      <span className="text-slate-500 text-xs uppercase tracking-wide block mb-1">Juice Restocked</span>
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
                      <span className="text-slate-700 font-medium text-xs uppercase tracking-wide block mb-1">Juice Leftover</span>
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
                      <span className="text-slate-500 text-xs uppercase tracking-wide block mb-1">Price ({currencySymbol})</span>
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

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm pt-4 border-t border-slate-200">
                    <div>
                      <span className="text-slate-500 text-xs uppercase tracking-wide block mb-1">Food Opening</span>
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
                      <span className="text-slate-500 text-xs uppercase tracking-wide block mb-1">Food Restocked</span>
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
                      <span className="text-slate-700 font-medium text-xs uppercase tracking-wide block mb-1">Food Leftover</span>
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
                      <span className="text-slate-500 text-xs uppercase tracking-wide block mb-1">Price ({currencySymbol})</span>
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
                    <label className="block text-slate-500 text-xs uppercase tracking-wide mb-1.5">Digital Transfers</label>
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
                    <label className="block text-slate-500 text-xs uppercase tracking-wide mb-1.5">Expenses Total</label>
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
                    <label className="block text-slate-500 text-xs uppercase tracking-wide mb-1.5">Pending Amount</label>
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

                <div className="flex items-center justify-end space-x-3 pt-5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingShift(null)}
                    className="px-5 py-2 bg-white hover:bg-slate-50 text-slate-600 font-medium text-sm rounded-lg cursor-pointer transition-colors border border-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-sm cursor-pointer transition-colors flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
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
