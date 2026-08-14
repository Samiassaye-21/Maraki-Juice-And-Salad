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
    <div className="space-y-6 text-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Other Expenses</h2>
          <p className="text-sm text-neutral-300 mt-0.5">Track salaries, bills, and overhead costs</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#13EE86] hover:bg-[#13EE86]/90 text-[#07250D] rounded-full font-bold text-sm shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#07250D]" />
          Add Expense
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#238868]/20 border border-[#238868]/40 rounded-3xl p-5">
          <p className="text-xs font-medium text-neutral-300 uppercase tracking-wide">This Month</p>
          <p className="text-2xl font-extrabold text-[#13EE86] mt-1">{formatCurrency(totalThisMonth, currencySymbol)}</p>
          <p className="text-xs text-neutral-400 mt-0.5">Overhead spent</p>
        </div>
        <div className="bg-[#238868]/20 border border-[#238868]/40 rounded-3xl p-5">
          <p className="text-xs font-medium text-neutral-300 uppercase tracking-wide">All Time</p>
          <p className="text-2xl font-extrabold text-white mt-1">{formatCurrency(totalAllTime, currencySymbol)}</p>
          <p className="text-xs text-neutral-400 mt-0.5">{expenses.length} total records</p>
        </div>
      </div>

      {/* Add Expense Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#07250D]/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 300 }}
              className="bg-[#07250D] w-full max-w-2xl rounded-t-3xl sm:rounded-3xl border border-[#238868]/50 shadow-2xl flex flex-col max-h-[92vh] text-white"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-[#238868]/30 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#238868]/40 border border-[#238868]/60 rounded-full flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-[#13EE86]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">New Expense</h3>
                    <p className="text-xs text-neutral-300">Record an overhead or bill payment</p>
                  </div>
                </div>
                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-[#238868]/30 rounded-full transition-colors cursor-pointer">
                  <X className="w-5 h-5 text-neutral-400" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
                {/* Category Selection */}
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-2.5 uppercase tracking-wide">Category</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {categoryPresets.map((preset) => {
                      const isSelected = category === preset.id;
                      return (
                        <button
                          key={preset.id}
                          onClick={() => setCategory(preset.id)}
                          className={`flex items-center gap-2 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                            isSelected 
                              ? 'border-[#13EE86] bg-[#13EE86] text-[#07250D] font-bold' 
                              : 'border-[#238868]/40 bg-[#238868]/20 text-white hover:border-[#13EE86]/50'
                          }`}
                        >
                          <span className="text-xl">{preset.emoji}</span>
                          <span className={`text-sm ${isSelected ? 'font-bold text-[#07250D]' : 'font-medium text-white'}`}>
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
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5 uppercase tracking-wide">Description</label>
                    <input
                      type="text"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="e.g. August Electric Bill, Cashier Salary"
                      className="w-full px-4 py-2.5 border border-[#238868]/50 bg-[#07250D] text-white rounded-full text-sm focus:outline-none focus:border-[#13EE86] placeholder:text-neutral-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5 uppercase tracking-wide">Amount ({currencySymbol})</label>
                      <input
                        type="number"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-2.5 border border-[#238868]/50 bg-[#07250D] text-white rounded-full text-sm focus:outline-none focus:border-[#13EE86] placeholder:text-neutral-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5 uppercase tracking-wide">Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                          type="date"
                          value={date}
                          onChange={e => setDate(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 border border-[#238868]/50 bg-[#07250D] text-white rounded-full text-sm focus:outline-none focus:border-[#13EE86]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {!isFormValid && (description || amount || category) && (
                  <div className="flex items-center gap-2 text-[#13EE86] bg-[#238868]/30 rounded-2xl px-3 py-2.5 text-sm border border-[#238868]">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#13EE86]" />
                    Please fill out all fields completely.
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-[#238868]/30 px-6 py-4 flex gap-3 flex-shrink-0">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 bg-[#07250D] border border-[#238868] text-white font-bold text-xs rounded-full hover:bg-[#238868]/30 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!isFormValid}
                  className="flex-1 py-3 bg-[#13EE86] hover:bg-[#13EE86]/90 disabled:opacity-40 text-[#07250D] rounded-full font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4 text-[#07250D]" />
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
          <div className="text-center py-16 text-neutral-400 bg-[#238868]/20 border border-[#238868]/40 rounded-3xl">
            <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-300" />
            <p className="font-bold text-white">No expenses logged yet</p>
            <p className="text-sm mt-1 text-neutral-300">Tap "Add Expense" to record a bill or salary payment</p>
          </div>
        )}
        
        {sortedExpenses.map(expense => {
          const isExpanded = expandedExpense === expense.id;
          const preset = categoryPresets.find(p => p.id === expense.category);

          return (
            <motion.div
              key={expense.id}
              layout
              className="bg-[#238868]/20 border border-[#238868]/40 rounded-3xl overflow-hidden shadow-sm hover:border-[#13EE86]/50 transition-all"
            >
              <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-[#238868]/30 transition-colors"
                onClick={() => setExpandedExpense(isExpanded ? null : expense.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#238868]/40 border border-[#238868]/60 rounded-full flex items-center justify-center flex-shrink-0 text-lg">
                    {preset?.emoji || '📦'}
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">
                      {expense.description}
                    </p>
                    <p className="text-xs text-neutral-300 mt-0.5">
                      {formatEthiopianFullDate(expense.date)} — {preset?.label}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-extrabold text-[#13EE86]">{formatCurrency(expense.amount, currencySymbol)}</p>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-[#238868]/30 overflow-hidden bg-[#07250D]"
                  >
                    <div className="px-5 py-3 flex justify-between items-center">
                      <p className="text-xs text-neutral-300">
                        Recorded on {new Date(expense.createdAt).toLocaleDateString()}
                      </p>
                      <button
                        onClick={() => onDeleteExpense(expense.id)}
                        className="text-xs text-neutral-300 hover:text-white hover:bg-red-950/50 flex items-center gap-1 py-1.5 px-3 rounded-full border border-[#238868]/40 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-neutral-300" />
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
