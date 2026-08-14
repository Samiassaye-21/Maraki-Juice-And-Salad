import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, X, Save, AlertCircle, Trash2, Calendar, 
  Wallet, Receipt, ChevronDown, ChevronUp
} from 'lucide-react';
import { formatCurrency, formatEthiopianFullDate } from '../utils/shiftUtils';

export type OverheadCategory = 'salary' | 'electric' | 'water' | 'rent' | 'internet' | 'maintenance' | 'other';

export interface OtherExpenseItem {
  id: string;
  category: OverheadCategory;
  description: string;
  amount: number;
  date: string;  // YYYY-MM-DD
  createdAt: number; // timestamp
}

interface OtherExpensesViewProps {
  expenses: OtherExpenseItem[];
  onAddExpense: (data: Omit<OtherExpenseItem, 'id' | 'createdAt'>) => void;
  onDeleteExpense: (id: string) => void;
  currencySymbol: string;
}

const categoryPresets: { id: OverheadCategory; label: string; emoji: string }[] = [
  { id: 'salary', label: 'Employee Salary', emoji: '👩💼' },
  { id: 'electric', label: 'Electric Bill', emoji: '⚡' },
  { id: 'water', label: 'Water Bill', emoji: '💧' },
  { id: 'rent', label: 'Rent', emoji: '🏠' },
  { id: 'internet', label: 'Internet/Phone', emoji: '📱' },
  { id: 'maintenance', label: 'Maintenance/Repair', emoji: '🔧' },
  { id: 'other', label: 'Other', emoji: '📦' },
];

export const OtherExpensesView: React.FC<OtherExpensesViewProps> = ({
  expenses,
  onAddExpense,
  onDeleteExpense,
  currencySymbol,
}) => {
  const today = new Date().toISOString().split('T')[0];
  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [category, setCategory] = useState<OverheadCategory | null>(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today);

  const [expandedExpense, setExpandedExpense] = useState<string | null>(null);

  // Grouping for summaries
  const totalAllTime = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  
  const totalThisMonth = (() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return expenses
      .filter(e => new Date(e.date) >= firstDay)
      .reduce((sum, e) => sum + e.amount, 0);
  })();

  const isFormValid = category !== null && description.trim().length > 0 && parseFloat(amount) > 0 && date;

  const handleSave = () => {
    if (!isFormValid || !category) return;
    
    onAddExpense({
      category,
      description: description.trim(),
      amount: parseFloat(amount),
      date,
    });

    // Reset form
    setShowForm(false);
    setCategory(null);
    setDescription('');
    setAmount('');
    setDate(today);
  };

  const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6 text-[#403c21] font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-[#403c21]">Other Expenses</h2>
          <p className="text-sm font-medium text-neutral-600 mt-0.5">Track salaries, bills, and overhead costs</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#403c21] hover:bg-[#33301a] text-white font-extrabold rounded-full font-extrabold text-sm shadow-md transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4 text-white font-extrabold" />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Summary Cards (#403c21 Hero Style with #403c21 Accent) */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#403c21] border border-[#403c21]/40 rounded-3xl p-5 shadow-2xl text-white">
          <p className="text-xs font-extrabold text-[#403c21] uppercase tracking-wide">This Month</p>
          <p className="text-2xl font-extrabold text-[#403c21] mt-1">{formatCurrency(totalThisMonth, currencySymbol)}</p>
          <p className="text-xs text-white font-bold font-medium mt-0.5">Overhead spent</p>
        </div>
        <div className="bg-white border border-[#403c21]/20 rounded-3xl p-5 shadow-xs text-[#403c21]">
          <p className="text-xs font-bold text-[#403c21]/70 uppercase tracking-wide">All Time</p>
          <p className="text-2xl font-extrabold text-[#403c21] mt-1">{formatCurrency(totalAllTime, currencySymbol)}</p>
          <p className="text-xs font-bold text-[#403c21] font-medium mt-0.5">{expenses.length} total records</p>
        </div>
      </div>

      {/* Add Expense Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 300 }}
              className="bg-white w-full max-w-2xl rounded-t-3xl sm:rounded-3xl border border-[#403c21]/20 shadow-2xl flex flex-col max-h-[92vh] text-[#403c21]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-[#403c21]/15 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#f7f5f0] border border-[#403c21]/20 rounded-full flex items-center justify-center text-[#403c21]">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-[#403c21]">New Expense</h3>
                    <p className="text-xs text-neutral-500 font-medium">Record an overhead or bill payment</p>
                  </div>
                </div>
                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer text-[#403c21]/70 hover:text-[#403c21]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
                {/* Category Selection */}
                <div>
                  <label className="block text-xs font-bold text-neutral-500 mb-2.5 uppercase tracking-wide">Category</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {categoryPresets.map((preset) => {
                      const isSelected = category === preset.id;
                      return (
                        <button
                          key={preset.id}
                          onClick={() => setCategory(preset.id)}
                          className={`flex items-center gap-2 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                            isSelected 
                              ? 'border-[#403c21] bg-[#403c21] text-white font-extrabold font-extrabold shadow-xs' 
                              : 'border-[#403c21]/20 bg-[#f7f5f0] text-[#403c21] hover:bg-slate-100'
                          }`}
                        >
                          <span className="text-xl">{preset.emoji}</span>
                          <span className={`text-sm ${isSelected ? 'font-extrabold text-[#403c21]' : 'font-bold text-[#403c21]'}`}>
                            {preset.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Details Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 mb-1.5 uppercase tracking-wide">Description</label>
                    <input
                      type="text"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="e.g. August Electric Bill, Cashier Salary"
                      className="w-full px-4 py-2.5 border border-[#403c21]/30 bg-white text-[#403c21] font-bold rounded-full text-sm focus:outline-none focus:border-[#403c21] focus:ring-4 focus:ring-[#403c21]/20 placeholder:text-[#403c21]/70 shadow-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 mb-1.5 uppercase tracking-wide">Amount ({currencySymbol})</label>
                      <input
                        type="number"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-2.5 border border-[#403c21]/30 bg-white text-[#403c21] font-bold rounded-full text-sm focus:outline-none focus:border-[#403c21] focus:ring-4 focus:ring-[#403c21]/20 placeholder:text-[#403c21]/70 shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 mb-1.5 uppercase tracking-wide">Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#403c21]/70" />
                        <input
                          type="date"
                          value={date}
                          onChange={e => setDate(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 border border-[#403c21]/30 bg-white text-[#403c21] font-bold rounded-full text-sm focus:outline-none focus:border-[#403c21] focus:ring-4 focus:ring-[#403c21]/20 shadow-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {!isFormValid && (description || amount || category) && (
                  <div className="flex items-center gap-2 text-amber-800 bg-amber-50 rounded-2xl px-3 py-2.5 text-sm border border-amber-200 font-bold">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
                    Please fill out all fields completely.
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-[#403c21]/15 px-6 py-4 flex gap-3 flex-shrink-0">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 bg-white border-2 border-[#403c21] text-[#403c21] font-extrabold text-xs rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!isFormValid}
                  className="flex-1 py-3 bg-[#403c21] hover:bg-[#33301a] disabled:opacity-40 text-[#403c21] rounded-full font-extrabold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer active:scale-95 shadow-md"
                >
                  <Save className="w-4 h-4 text-[#403c21]" />
                  Save Expense
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expense List */}
      <div className="space-y-3">
        {sortedExpenses.length === 0 && (
          <div className="text-center py-16 text-neutral-600 bg-white border border-[#403c21]/20 rounded-3xl shadow-xs">
            <Receipt className="w-12 h-12 mx-auto mb-3 text-[#403c21] opacity-40" />
            <p className="font-extrabold text-[#403c21]">No expenses logged yet</p>
            <p className="text-sm mt-1 text-neutral-500 font-medium">Tap "Add Expense" to record a bill or salary payment</p>
          </div>
        )}
        
        {sortedExpenses.map(expense => {
          const isExpanded = expandedExpense === expense.id;
          const preset = categoryPresets.find(p => p.id === expense.category);

          return (
            <motion.div
              key={expense.id}
              layout
              className="bg-white border border-[#403c21]/20 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all text-[#403c21]"
            >
              <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-[#f7f5f0] transition-colors"
                onClick={() => setExpandedExpense(isExpanded ? null : expense.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#f7f5f0] border border-[#403c21]/20 rounded-full flex items-center justify-center flex-shrink-0 text-lg">
                    {preset?.emoji || '📦'}
                  </div>
                  <div>
                    <p className="font-extrabold text-[#403c21] text-sm">
                      {expense.description}
                    </p>
                    <p className="text-xs text-neutral-600 font-medium mt-0.5">
                      {formatEthiopianFullDate(expense.date)} — {preset?.label}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-extrabold text-[#403c21]">{formatCurrency(expense.amount, currencySymbol)}</p>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-neutral-500" /> : <ChevronDown className="w-4 h-4 text-neutral-500" />}
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-[#403c21]/15 overflow-hidden bg-[#f7f5f0]"
                  >
                    <div className="px-5 py-3 flex justify-between items-center">
                      <p className="text-xs text-neutral-600 font-medium">
                        Recorded on {new Date(expense.createdAt).toLocaleDateString()}
                      </p>
                      <button
                        onClick={() => onDeleteExpense(expense.id)}
                        className="text-xs text-neutral-600 hover:text-rose-600 hover:bg-rose-50 flex items-center gap-1 py-1.5 px-3 rounded-full border border-[#403c21]/20 transition-colors cursor-pointer font-bold"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete expense
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default OtherExpensesView;
