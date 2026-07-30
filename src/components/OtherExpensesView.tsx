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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Other Expenses</h2>
          <p className="text-sm text-slate-500 mt-0.5">Track salaries, bills, and overhead costs</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Expense
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-100 rounded-2xl p-4">
          <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">This Month</p>
          <p className="text-2xl font-bold text-red-700 mt-1">{formatCurrency(totalThisMonth, currencySymbol)}</p>
          <p className="text-xs text-red-500 mt-0.5">Overhead spent</p>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">All Time</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(totalAllTime, currencySymbol)}</p>
          <p className="text-xs text-slate-400 mt-0.5">{expenses.length} total records</p>
        </div>
      </div>

      {/* Add Expense Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 300 }}
              className="bg-white w-full max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">New Expense</h3>
                    <p className="text-xs text-slate-400">Record an overhead or bill payment</p>
                  </div>
                </div>
                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
                {/* Category Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2.5 uppercase tracking-wide">Category</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {categoryPresets.map((preset) => {
                      const isSelected = category === preset.id;
                      return (
                        <button
                          key={preset.id}
                          onClick={() => setCategory(preset.id)}
                          className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                              : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
                          }`}
                        >
                          <span className="text-xl">{preset.emoji}</span>
                          <span className={`text-sm font-medium ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>
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
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Description</label>
                    <input
                      type="text"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="e.g. August Electric Bill, Cashier Salary"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Amount ({currencySymbol})</label>
                      <input
                        type="number"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="date"
                          value={date}
                          onChange={e => setDate(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {!isFormValid && (description || amount || category) && (
                  <div className="flex items-center gap-2 text-amber-600 bg-amber-50 rounded-xl px-3 py-2.5 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    Please fill out all fields completely.
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-slate-100 px-6 py-4 flex gap-3 flex-shrink-0">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!isFormValid}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <Save className="w-4 h-4" />
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
          <div className="text-center py-16 text-slate-400">
            <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No expenses logged yet</p>
            <p className="text-sm mt-1">Tap "Add Expense" to record a bill or salary payment</p>
          </div>
        )}
        
        {sortedExpenses.map(expense => {
          const isExpanded = expandedExpense === expense.id;
          const preset = categoryPresets.find(p => p.id === expense.category);

          return (
            <motion.div
              key={expense.id}
              layout
              className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden"
            >
              <div
                className="flex items-center justify-between px-4 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedExpense(isExpanded ? null : expense.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center flex-shrink-0 text-lg">
                    {preset?.emoji || '📦'}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">
                      {expense.description}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatEthiopianFullDate(expense.date)} — {preset?.label}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-bold text-red-600">{formatCurrency(expense.amount, currencySymbol)}</p>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-slate-100 overflow-hidden bg-slate-50/50"
                  >
                    <div className="px-4 py-3 flex justify-between items-center">
                      <p className="text-xs text-slate-500">
                        Recorded on {new Date(expense.createdAt).toLocaleDateString()}
                      </p>
                      <button
                        onClick={() => onDeleteExpense(expense.id)}
                        className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
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
