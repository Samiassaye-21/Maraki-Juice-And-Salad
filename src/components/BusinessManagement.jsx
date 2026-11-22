import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building, 
  Calendar, 
  DollarSign, 
  CheckSquare, 
  Target, 
  FileText, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Plus, 
  Check, 
  X, 
  ChevronRight, 
  Download, 
  Printer, 
  ShoppingBag, 
  Users, 
  Package, 
  Wallet, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles,
  Zap,
  Tag,
  ArrowRight
} from 'lucide-react';

// ==============================================================
// INITIAL SEED DATA (REALISTIC MARAKI JUICE BUSINESS DATA)
// ==============================================================

const INITIAL_RECURRING_EXPENSES = [
  { id: 'rec-1', name: 'የቤት ኪራይ (Shop Rent)', category: 'Rent', amount: 15000, frequency: 'Monthly', dueDay: 1, nextDueDate: '2026-12-01', reminderDays: 5, active: true },
  { id: 'rec-2', name: 'የመብራት ክፍያ (Electricity)', category: 'Utilities', amount: 2500, frequency: 'Monthly', dueDay: 20, nextDueDate: '2026-11-20', reminderDays: 3, active: true }, // Overdue
  { id: 'rec-3', name: 'የውሃ ክፍያ (Water Supply)', category: 'Utilities', amount: 1200, frequency: 'Monthly', dueDay: 28, nextDueDate: '2026-11-28', reminderDays: 2, active: true }, // Due soon
  { id: 'rec-4', name: 'ዋይፋይ / ኢንተርኔት (WiFi Internet)', category: 'Bills', amount: 1800, frequency: 'Monthly', dueDay: 5, nextDueDate: '2026-12-05', reminderDays: 3, active: true },
  { id: 'rec-5', name: 'የንግድ ፈቃድና ግብር (Trade License & Tax)', category: 'License', amount: 6000, frequency: 'Yearly', dueDay: 15, nextDueDate: '2027-01-15', reminderDays: 14, active: true }
];

const INITIAL_PURCHASE_PLANS = [
  { id: 'pur-1', itemName: 'ብርቱካን (Orange)', quantity: 50, unit: 'kg', estimatedUnitPrice: 120, estimatedTotal: 6000, supplier: 'አትክልት ተራ መርካቶ (Merkato)', plannedDate: '2026-12-01', status: 'Planned' },
  { id: 'pur-2', itemName: 'ማንጎ (Mango)', quantity: 30, unit: 'kg', estimatedUnitPrice: 140, estimatedTotal: 4200, supplier: 'ሀዋሳ ፍሬሽ (Hawassa Fresh)', plannedDate: '2026-12-02', status: 'Planned' },
  { id: 'pur-3', itemName: 'አቮካዶ (Avocado)', quantity: 25, unit: 'kg', estimatedUnitPrice: 110, estimatedTotal: 2750, supplier: 'ቡታጅራ ፍራፍሬ (Butajira Fruits)', plannedDate: '2026-12-03', status: 'Planned' },
  { id: 'pur-4', itemName: 'የጁስ ኩባያ (Juice Cups)', quantity: 500, unit: 'pcs', estimatedUnitPrice: 8, estimatedTotal: 4000, supplier: 'ፕላስቲክ የጅምላ አከፋፋይ', plannedDate: '2026-12-05', status: 'Planned' },
  { id: 'pur-5', itemName: 'የምግብ ቦክስ (Food Takeaway Boxes)', quantity: 300, unit: 'pcs', estimatedUnitPrice: 12, estimatedTotal: 3600, supplier: 'ማሸጊያ ፋብሪካ (Packaging Co.)', plannedDate: '2026-12-06', status: 'Planned' }
];

const INITIAL_SALARY_PLANS = [
  { id: 'sal-1', employeeName: 'ሼፍ አልማዝ (Chef Almaz)', role: 'Head Chef', baseSalary: 8000, bonus: 500, deduction: 0, paidAmount: 4000, payDate: '2026-12-01', status: 'Partially Paid' },
  { id: 'sal-2', employeeName: 'ሀብታሙ (Habtamu)', role: 'Waiter', baseSalary: 4500, bonus: 300, deduction: 200, paidAmount: 0, payDate: '2026-12-01', status: 'Pending' },
  { id: 'sal-3', employeeName: 'ትዕግስት (Tigist)', role: 'Assistant Chef', baseSalary: 5500, bonus: 0, deduction: 500, paidAmount: 0, payDate: '2026-12-01', status: 'Pending' },
  { id: 'sal-4', employeeName: 'ቃልኪዳን (Kalkidan)', role: 'Waitress', baseSalary: 4500, bonus: 200, deduction: 0, paidAmount: 4700, payDate: '2026-12-01', status: 'Paid' }
];

const INITIAL_TASKS = [
  { id: 'tsk-1', title: 'የብርቱካንና ማንጎ ዋጋ ከመርካቶ አወዳድር (Compare suppliers)', priority: 'High', dueDate: '2026-12-02', estimatedCost: 0, status: 'In Progress' },
  { id: 'tsk-2', title: 'የመስታወት ማቀዝቀዣ ዋጋ ፒያሳ ጠይቅ (Check refrigerator prices)', priority: 'High', dueDate: '2026-12-08', estimatedCost: 45000, status: 'Todo' },
  { id: 'tsk-3', title: 'የታህሳስ ወር በጀትና የሽያጭ ግብ ገምግም (Review December budget)', priority: 'Medium', dueDate: '2026-11-30', estimatedCost: 0, status: 'Todo' },
  { id: 'tsk-4', title: 'የጁስ ማሽኖች ሰርቪስ ማድረግ (Service blenders)', priority: 'Normal', dueDate: '2026-12-10', estimatedCost: 1500, status: 'Todo' }
];

const INITIAL_GOALS = [
  { id: 'gol-1', title: 'አዲስ የፍራፍሬ ማሳያ ፍሪጅ መግዛት (Display Refrigerator)', targetAmount: 75000, currentAmount: 30000, deadline: '2026-12-31', status: 'Active' },
  { id: 'gol-2', title: '2 ተጨማሪ ባለከፍተኛ ፍጥነት ጁስ ማሽን (High-Speed Blenders)', targetAmount: 25000, currentAmount: 18000, deadline: '2026-12-15', status: 'Active' },
  { id: 'gol-3', title: 'የክረምት ወራት የተጠባባቂ ቁጠባ (Rainy Season Reserve)', targetAmount: 50000, currentAmount: 22000, deadline: '2027-01-30', status: 'Active' }
];

const INITIAL_NOTES = [
  { id: 'not-1', title: 'የመርካቶ አትክልት ተራ ገበያ ቀን', content: 'ረቡዕ ረፋድ ላይ የሚገቡ ብርቱካኖች ከሌላው ቀን በ15% ቅናሽ አላቸው። በጅምላ መግዛት ይመረጣል።', createdAt: '2026-11-20' },
  { id: 'not-2', title: 'የጾም ወቅት ፍላጎት', content: 'ረቡዕና አርብ የፍራፍሬና የሰላጣ ሽያጭ በእጥፍ ይጨምራል፤ አቮካዶና ሩዝ በሰላጣ ክምችት በ20% ይጨመር።', createdAt: '2026-11-21' }
];

const INITIAL_ACTUAL_EXPENSES = [
  { id: 'exp-1', title: 'የዕለት በረዶ ግዢ (Ice purchase)', category: 'Ingredients', amount: 350, date: '2026-11-22', paymentMethod: 'Cash' },
  { id: 'exp-2', title: 'የማጽጃ ሳሙናና ፎጣ (Cleaning supplies)', category: 'Maintenance', amount: 480, date: '2026-11-22', paymentMethod: 'Telebirr' }
];

export default function BusinessManagement({ 
  orders = [], 
  totalRealSales = 0,
  onSwitchToOrdersLog
}) {
  // Navigation tab within Business Management
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'finance' | 'recurring' | 'purchases' | 'salaries' | 'tasks' | 'goals' | 'notes' | 'calendar' | 'reports'

  // Persistent States
  const [recurringExpenses, setRecurringExpenses] = useState(() => {
    const saved = localStorage.getItem('maraki_plan_recurring');
    return saved ? JSON.parse(saved) : INITIAL_RECURRING_EXPENSES;
  });

  const [purchasePlans, setPurchasePlans] = useState(() => {
    const saved = localStorage.getItem('maraki_plan_purchases');
    return saved ? JSON.parse(saved) : INITIAL_PURCHASE_PLANS;
  });

  const [salaryPlans, setSalaryPlans] = useState(() => {
    const saved = localStorage.getItem('maraki_plan_salaries');
    return saved ? JSON.parse(saved) : INITIAL_SALARY_PLANS;
  });

  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('maraki_plan_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [goals, setGoals] = useState(() => {
    const saved = localStorage.getItem('maraki_plan_goals');
    return saved ? JSON.parse(saved) : INITIAL_GOALS;
  });

  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem('maraki_plan_notes');
    return saved ? JSON.parse(saved) : INITIAL_NOTES;
  });

  const [actualExpenses, setActualExpenses] = useState(() => {
    const saved = localStorage.getItem('maraki_actual_expenses');
    return saved ? JSON.parse(saved) : INITIAL_ACTUAL_EXPENSES;
  });

  // Financial Planning Baseline
  const [openingBalance, setOpeningBalance] = useState(() => {
    const saved = localStorage.getItem('maraki_opening_cash_balance');
    return saved ? Number(saved) : 25000;
  });
  const [expectedMonthlyIncome, setExpectedMonthlyIncome] = useState(() => {
    const saved = localStorage.getItem('maraki_expected_income');
    return saved ? Number(saved) : 85000;
  });

  // Sync with LocalStorage
  useEffect(() => { localStorage.setItem('maraki_plan_recurring', JSON.stringify(recurringExpenses)); }, [recurringExpenses]);
  useEffect(() => { localStorage.setItem('maraki_plan_purchases', JSON.stringify(purchasePlans)); }, [purchasePlans]);
  useEffect(() => { localStorage.setItem('maraki_plan_salaries', JSON.stringify(salaryPlans)); }, [salaryPlans]);
  useEffect(() => { localStorage.setItem('maraki_plan_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('maraki_plan_goals', JSON.stringify(goals)); }, [goals]);
  useEffect(() => { localStorage.setItem('maraki_plan_notes', JSON.stringify(notes)); }, [notes]);
  useEffect(() => { localStorage.setItem('maraki_actual_expenses', JSON.stringify(actualExpenses)); }, [actualExpenses]);
  useEffect(() => { localStorage.setItem('maraki_opening_cash_balance', openingBalance.toString()); }, [openingBalance]);
  useEffect(() => { localStorage.setItem('maraki_expected_income', expectedMonthlyIncome.toString()); }, [expectedMonthlyIncome]);

  // Modals
  const [showQuickAddMenu, setShowQuickAddMenu] = useState(false);
  const [activeQuickAddModal, setActiveQuickAddModal] = useState(null); // 'expense' | 'purchase' | 'salary' | 'task' | 'goal' | 'note'

  // Form input states
  const [formInputs, setFormInputs] = useState({});

  // ==============================================================
  // FINANCIAL CALCULATIONS (SECTION 11: EXACT FORMULAS)
  // ==============================================================

  // Total Actual Expenses Paid so far
  const totalActualExpenses = useMemo(() => {
    return actualExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [actualExpenses]);

  // Current Balance = Opening Balance + Real Sales from POS - Actual Expenses Paid
  const currentBalance = useMemo(() => {
    return openingBalance + totalRealSales - totalActualExpenses;
  }, [openingBalance, totalRealSales, totalActualExpenses]);

  // Total Planned Expenses = Unpaid Recurring Bills + Planned Purchases + Unpaid Salaries
  const plannedRecurringTotal = useMemo(() => {
    return recurringExpenses.filter(r => r.active).reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  }, [recurringExpenses]);

  const plannedPurchasesTotal = useMemo(() => {
    return purchasePlans.filter(p => p.status === 'Planned').reduce((sum, p) => sum + (Number(p.estimatedTotal) || 0), 0);
  }, [purchasePlans]);

  const plannedSalariesTotal = useMemo(() => {
    return salaryPlans.reduce((sum, s) => {
      const remaining = (s.baseSalary + (s.bonus || 0) - (s.deduction || 0)) - (s.paidAmount || 0);
      return sum + Math.max(0, remaining);
    }, 0);
  }, [salaryPlans]);

  const totalPlannedExpenses = plannedRecurringTotal + plannedPurchasesTotal + plannedSalariesTotal;

  // Projected Remaining = Current Balance + Expected Income - Total Planned Expenses
  const projectedRemaining = currentBalance + expectedMonthlyIncome - totalPlannedExpenses;

  // ==============================================================
  // ACTIONS & HANDLERS
  // ==============================================================

  // Pay Recurring Bill -> Creates actual expense record and updates next due date
  const handlePayRecurringBill = (billId) => {
    const bill = recurringExpenses.find(r => r.id === billId);
    if (!bill) return;

    // 1. Add actual expense record
    const newExpense = {
      id: 'exp-' + Date.now(),
      title: `${bill.name} (Paid)`,
      category: bill.category,
      amount: bill.amount,
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'Bank / Telebirr'
    };
    setActualExpenses(prev => [newExpense, ...prev]);

    // 2. Advance due date by 1 month
    setRecurringExpenses(prev => prev.map(r => {
      if (r.id === billId) {
        const next = new Date(r.nextDueDate);
        next.setMonth(next.getMonth() + 1);
        return { ...r, nextDueDate: next.toISOString().split('T')[0] };
      }
      return r;
    }));
  };

  // Receive Purchase Plan -> Converts plan to received and adds actual expense
  const handleReceivePurchase = (planId) => {
    const plan = purchasePlans.find(p => p.id === planId);
    if (!plan) return;

    // 1. Add actual expense record
    const newExpense = {
      id: 'exp-' + Date.now(),
      title: `${plan.itemName} - ${plan.quantity} ${plan.unit} (Received from ${plan.supplier})`,
      category: 'Fruit & Stock',
      amount: plan.estimatedTotal,
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'Cash'
    };
    setActualExpenses(prev => [newExpense, ...prev]);

    // 2. Mark plan as Received
    setPurchasePlans(prev => prev.map(p => p.id === planId ? { ...p, status: 'Received' } : p));
  };

  // Record Salary Payment (Partial or Full)
  const handlePaySalary = (salaryId, payAmount) => {
    const sal = salaryPlans.find(s => s.id === salaryId);
    if (!sal) return;
    const amount = Number(payAmount) || 0;
    if (amount <= 0) return;

    // 1. Add actual expense record
    const newExpense = {
      id: 'exp-' + Date.now(),
      title: `ደመወዝ ክፍያ (Salary): ${sal.employeeName}`,
      category: 'Salary',
      amount: amount,
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'Bank / Telebirr'
    };
    setActualExpenses(prev => [newExpense, ...prev]);

    // 2. Update salary record
    setSalaryPlans(prev => prev.map(s => {
      if (s.id === salaryId) {
        const newPaid = (s.paidAmount || 0) + amount;
        const totalDue = s.baseSalary + (s.bonus || 0) - (s.deduction || 0);
        return {
          ...s,
          paidAmount: newPaid,
          status: newPaid >= totalDue ? 'Paid' : 'Partially Paid'
        };
      }
      return s;
    }));
  };

  // Toggle Task Completion
  const handleToggleTask = (taskId) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return { ...t, status: t.status === 'Completed' ? 'Todo' : 'Completed' };
      }
      return t;
    }));
  };

  // Add Contribution to Goal
  const handleContributeToGoal = (goalId, amount) => {
    const amt = Number(amount) || 0;
    if (amt <= 0) return;

    setGoals(prev => prev.map(g => {
      if (g.id === goalId) {
        const nextAmt = g.currentAmount + amt;
        return {
          ...g,
          currentAmount: nextAmt,
          status: nextAmt >= g.targetAmount ? 'Reached' : 'Active'
        };
      }
      return g;
    }));
  };

  // Quick Add Submissions
  const handleQuickAddSubmit = (e) => {
    e.preventDefault();
    if (activeQuickAddModal === 'expense') {
      const exp = {
        id: 'exp-' + Date.now(),
        title: formInputs.title || 'Other Expense',
        category: formInputs.category || 'General',
        amount: Number(formInputs.amount) || 0,
        date: formInputs.date || new Date().toISOString().split('T')[0],
        paymentMethod: formInputs.paymentMethod || 'Cash'
      };
      setActualExpenses(prev => [exp, ...prev]);
    } else if (activeQuickAddModal === 'purchase') {
      const qty = Number(formInputs.quantity) || 1;
      const unitPrice = Number(formInputs.unitPrice) || 0;
      const pur = {
        id: 'pur-' + Date.now(),
        itemName: formInputs.itemName || 'Fruit Stock',
        quantity: qty,
        unit: formInputs.unit || 'kg',
        estimatedUnitPrice: unitPrice,
        estimatedTotal: qty * unitPrice,
        supplier: formInputs.supplier || 'Merkato Supplier',
        plannedDate: formInputs.plannedDate || new Date().toISOString().split('T')[0],
        status: 'Planned'
      };
      setPurchasePlans(prev => [pur, ...prev]);
    } else if (activeQuickAddModal === 'salary') {
      const sal = {
        id: 'sal-' + Date.now(),
        employeeName: formInputs.employeeName || 'Staff Member',
        role: formInputs.role || 'Employee',
        baseSalary: Number(formInputs.baseSalary) || 4000,
        bonus: Number(formInputs.bonus) || 0,
        deduction: Number(formInputs.deduction) || 0,
        paidAmount: 0,
        payDate: formInputs.payDate || '2026-12-01',
        status: 'Pending'
      };
      setSalaryPlans(prev => [...prev, sal]);
    } else if (activeQuickAddModal === 'task') {
      const tsk = {
        id: 'tsk-' + Date.now(),
        title: formInputs.title || 'New Task',
        priority: formInputs.priority || 'Medium',
        dueDate: formInputs.dueDate || new Date().toISOString().split('T')[0],
        estimatedCost: Number(formInputs.estimatedCost) || 0,
        status: 'Todo'
      };
      setTasks(prev => [tsk, ...prev]);
    } else if (activeQuickAddModal === 'goal') {
      const gol = {
        id: 'gol-' + Date.now(),
        title: formInputs.title || 'New Business Goal',
        targetAmount: Number(formInputs.targetAmount) || 10000,
        currentAmount: Number(formInputs.currentAmount) || 0,
        deadline: formInputs.deadline || '2026-12-31',
        status: 'Active'
      };
      setGoals(prev => [...prev, gol]);
    } else if (activeQuickAddModal === 'note') {
      const not = {
        id: 'not-' + Date.now(),
        title: formInputs.title || 'Quick Note',
        content: formInputs.content || '',
        createdAt: new Date().toISOString().split('T')[0]
      };
      setNotes(prev => [not, ...prev]);
    }

    setFormInputs({});
    setActiveQuickAddModal(null);
  };

  // Convert Note to Task
  const handleConvertNoteToTask = (note) => {
    const newTask = {
      id: 'tsk-' + Date.now(),
      title: note.title,
      priority: 'Medium',
      dueDate: new Date().toISOString().split('T')[0],
      estimatedCost: 0,
      status: 'Todo'
    };
    setTasks(prev => [newTask, ...prev]);
    setActiveTab('tasks');
  };

  return (
    <div className="space-y-6">
      
      {/* ============================================================== */}
      {/* 1. MODULE SUB-NAVIGATION BAR (CLEAN SLATE BUSINESS THEME)       */}
      {/* ============================================================== */}
      <div className="bg-white p-2 sm:p-2.5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 min-w-max">
          {[
            { id: 'overview', label: '📊 Dashboard Overview', icon: Sparkles },
            { id: 'finance', label: '💰 Financial Plan', icon: DollarSign },
            { id: 'recurring', label: '🏢 Rent & Bills', icon: Building, badge: recurringExpenses.length },
            { id: 'purchases', label: '🍏 Fruit Purchases', icon: Package, badge: purchasePlans.filter(p => p.status === 'Planned').length },
            { id: 'salaries', label: '👥 Salary Planning', icon: Users },
            { id: 'tasks', label: '✅ Tasks & Plans', icon: CheckSquare, badge: tasks.filter(t => t.status !== 'Completed').length },
            { id: 'goals', label: '🎯 Business Goals', icon: Target },
            { id: 'notes', label: '📝 Ideas & Notes', icon: FileText },
            { id: 'calendar', label: '📅 Unified Calendar', icon: Calendar },
            { id: 'reports', label: '📈 Reports (Budget vs Actual)', icon: TrendingUp }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap active:scale-95 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Add Trigger Button */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => setShowQuickAddMenu(true)}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-2xl shadow-md shadow-emerald-700/20 flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Quick Add</span>
          </button>
        </div>

      </div>

      {/* ============================================================== */}
      {/* 2. TAB: DASHBOARD OVERVIEW (SECTION 5 WIREFRAME)                */}
      {/* ============================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* 4 HERO FINANCIAL KPI CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Current Balance */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
                <span className="uppercase tracking-wider">የአሁን ጥሬ ገንዘብ (Current Balance)</span>
                <Wallet className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {currentBalance.toLocaleString()}
                </span>
                <span className="text-xs font-black text-emerald-700">ETB</span>
              </div>
              <p className="text-[11px] text-slate-400 font-bold mt-1.5 flex items-center gap-1">
                <span className="text-emerald-600 font-black">+{totalRealSales.toLocaleString()} ETB</span> ከዛሬ ሽያጭ
              </p>
            </div>

            {/* Card 2: Planned Expenses */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
                <span className="uppercase tracking-wider">የታቀዱ ወጪዎች (Planned Expenses)</span>
                <ArrowDownRight className="w-4 h-4 text-rose-600" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-black text-rose-600 tracking-tight">
                  {totalPlannedExpenses.toLocaleString()}
                </span>
                <span className="text-xs font-black text-rose-700">ETB</span>
              </div>
              <p className="text-[11px] text-slate-400 font-bold mt-1.5 truncate">
                ኪራይ፣ ፍራፍሬና ደመወዝ ዕዳ
              </p>
            </div>

            {/* Card 3: Expected Income */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
                <span className="uppercase tracking-wider">የሚጠበቅ ገቢ (Expected Income)</span>
                <TrendingUp className="w-4 h-4 text-teal-600" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {expectedMonthlyIncome.toLocaleString()}
                </span>
                <span className="text-xs font-black text-teal-700">ETB</span>
              </div>
              <p className="text-[11px] text-slate-400 font-bold mt-1.5">
                የወሩ የታቀደ ሽያጭ ግብ (Forecast)
              </p>
            </div>

            {/* Card 4: Projected Remaining */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-5 shadow-lg shadow-slate-950/10 relative overflow-hidden group">
              <div className="flex items-center justify-between text-slate-300 text-xs font-bold mb-2">
                <span className="uppercase tracking-wider">የተገመተ ትርፍ (Projected Remaining)</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
                  {projectedRemaining.toLocaleString()}
                </span>
                <span className="text-xs font-black text-emerald-300">ETB</span>
              </div>
              <p className="text-[11px] text-slate-400 font-bold mt-1.5">
                ጥሬ ገንዘብ + የሚጠበቅ ገቢ − ወጪዎች
              </p>
            </div>

          </div>

          {/* ACTION REQUIRED ALERTS (SECTION 5 WIREFRAME) */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-black text-slate-900">
                  አስቸኳይ እርምጃ የሚሹ (Action Required)
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-400">ግዴታዎች ከመድረሳቸው በፊት ክፈሉ</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Overdue Item */}
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/80 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase">
                      Overdue (ቀኑ ያለፈበት)
                    </span>
                    <span className="font-black text-sm text-slate-900">የመብራት ክፍያ (Electricity)</span>
                  </div>
                  <p className="text-xs text-rose-700 font-bold">ኖቬምበር 20 ማለቅ ነበረበት • 2,500 ETB</p>
                </div>
                <button
                  type="button"
                  onClick={() => handlePayRecurringBill('rec-2')}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-sm transition-all active:scale-95"
                >
                  አሁን ክፈል
                </button>
              </div>

              {/* Due Soon Item */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black uppercase">
                      Due Soon (ቀኑ የቀረበ)
                    </span>
                    <span className="font-black text-sm text-slate-900">የቤት ኪራይ (Shop Rent)</span>
                  </div>
                  <p className="text-xs text-amber-800 font-bold">ዲሴምበር 1 ይደርሳል • 15,000 ETB</p>
                </div>
                <button
                  type="button"
                  onClick={() => handlePayRecurringBill('rec-1')}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-sm transition-all active:scale-95"
                >
                  ክፈል
                </button>
              </div>

            </div>
          </div>

          {/* TWO COLUMNS: UPCOMING OBLIGATIONS & PURCHASE PLANNING */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            
            {/* Column 1: Upcoming Obligations Timeline */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-600" />
                  <h3 className="text-sm font-black text-slate-900">
                    ቀጣይ ቀናት ክፍያዎች (Upcoming Obligations)
                  </h3>
                </div>
                <button 
                  type="button" 
                  onClick={() => setActiveTab('recurring')}
                  className="text-xs font-black text-emerald-600 hover:underline"
                >
                  ሁሉንም እይ →
                </button>
              </div>

              <div className="space-y-2.5">
                {[
                  { date: 'Dec 1', label: 'የቤት ኪራይ (Rent)', amount: '15,000 ETB', type: 'Rent', color: 'border-l-4 border-amber-500' },
                  { date: 'Dec 1', label: 'የሰራተኞች ደመወዝ (Salaries)', amount: '14,100 ETB', type: 'Payroll', color: 'border-l-4 border-teal-500' },
                  { date: 'Dec 1', label: 'የብርቱካን ግዢ (Orange 50kg)', amount: '6,000 ETB', type: 'Fruit', color: 'border-l-4 border-emerald-500' },
                  { date: 'Dec 2', label: 'የማንጎ ግዢ (Mango 30kg)', amount: '4,200 ETB', type: 'Fruit', color: 'border-l-4 border-emerald-500' }
                ].map((item, idx) => (
                  <div key={idx} className={`p-3 rounded-2xl bg-slate-50 flex items-center justify-between ${item.color}`}>
                    <div className="flex items-center gap-3">
                      <span className="w-12 text-center text-xs font-black text-slate-900 bg-white py-1 px-1.5 rounded-lg border border-slate-200">
                        {item.date}
                      </span>
                      <div>
                        <span className="text-xs font-black text-slate-900 block">{item.label}</span>
                        <span className="text-[10px] text-slate-400 font-bold">{item.type}</span>
                      </div>
                    </div>
                    <span className="text-xs font-black text-slate-900">{item.amount}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: Purchase Planning Summary */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-black text-slate-900">
                    የፍራፍሬና እቃዎች ግዢ እቅድ (Purchase Planning)
                  </h3>
                </div>
                <button 
                  type="button" 
                  onClick={() => setActiveTab('purchases')}
                  className="text-xs font-black text-emerald-600 hover:underline"
                >
                  ዕቅድ አክል →
                </button>
              </div>

              <div className="space-y-2.5">
                {purchasePlans.slice(0, 4).map(item => (
                  <div key={item.id} className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🍏</span>
                      <div>
                        <span className="text-xs font-black text-slate-900 block">{item.itemName}</span>
                        <span className="text-[10px] text-slate-500 font-bold">
                          {item.quantity} {item.unit} • @{item.estimatedUnitPrice} ETB • {item.supplier}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-emerald-800 block">
                        {item.estimatedTotal.toLocaleString()} ETB
                      </span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        item.status === 'Received' ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* MY TASKS CHECKLIST (SECTION 5 WIREFRAME) */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-black text-slate-900">
                  የስራ ተግባራትና እቅዶች (My Tasks & Plans)
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => { setActiveQuickAddModal('task'); setShowQuickAddMenu(false); }}
                className="text-xs font-black text-emerald-600 hover:underline"
              >
                + አዲስ ተግባር
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tasks.map(task => {
                const isDone = task.status === 'Completed';
                return (
                  <div 
                    key={task.id} 
                    onClick={() => handleToggleTask(task.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                      isDone 
                        ? 'bg-slate-50 border-slate-200 opacity-60' 
                        : 'bg-white border-slate-200 hover:border-emerald-300 shadow-2xs'
                    }`}
                  >
                    <input 
                      type="checkbox" 
                      checked={isDone} 
                      onChange={() => {}} 
                      className="mt-1 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div className="flex-1 space-y-1">
                      <span className={`text-xs font-black block ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {task.title}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                        <span className={`px-2 py-0.5 rounded-full ${
                          task.priority === 'High' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {task.priority} Priority
                        </span>
                        <span>Due: {task.dueDate}</span>
                        {task.estimatedCost > 0 && (
                          <span className="text-slate-700 font-black">{task.estimatedCost.toLocaleString()} ETB</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* REAL POS SALES SYNC BANNER */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-3xl p-5 shadow-lg shadow-emerald-800/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <span className="bg-white/20 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full inline-block mb-1">
                ⚡ Real-Time Connected Brain
              </span>
              <h4 className="text-base font-black">
                የሼፍ ሲስተም ትዕዛዞች በቀጥታ ወደዚህ ማኔጅመንት ገቢ ተገናኝተዋል
              </h4>
              <p className="text-xs text-emerald-100 font-bold">
                ዛሬ የተመዘገቡ {orders.length} ትዕዛዞች ({totalRealSales.toLocaleString()} ETB) በቅጽበት ወደ ጥሬ ገንዘብ ሂሳብ ገብተዋል።
              </p>
            </div>

            <button
              type="button"
              onClick={onSwitchToOrdersLog}
              className="px-5 py-2.5 bg-white text-emerald-950 font-black text-xs rounded-2xl hover:bg-emerald-50 transition-all shadow-md active:scale-95 flex items-center gap-2 whitespace-nowrap"
            >
              <span>ትዕዛዞቹን በዝርዝር እይ (View Orders Log)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* 3. TAB: FINANCIAL PLAN & BUDGET (SECTION 3)                    */}
      {/* ============================================================== */}
      {activeTab === 'finance' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900">
                የወርና የሳምንት የበጀት ዕቅድ (Financial Planning & Cash Forecast)
              </h3>
              <p className="text-xs text-slate-400 font-bold mt-1">
                የወሩ የሚጠበቅ ገቢ፣ የታቀዱ ወጪዎች እና የወደፊት የጥሬ ገንዘብ ፍሰት ትንበያ
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">የመነሻ ጥሬ ገንዘብ</span>
                <input
                  type="number"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(Number(e.target.value) || 0)}
                  className="w-28 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-black text-slate-900 text-right outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">የሚጠበቅ ወርሃዊ ገቢ</span>
                <input
                  type="number"
                  value={expectedMonthlyIncome}
                  onChange={(e) => setExpectedMonthlyIncome(Number(e.target.value) || 0)}
                  className="w-28 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-black text-slate-900 text-right outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Budget Breakdown Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                የታቀዱ ወጪዎች ክፍፍል (Planned Expenses Breakdown)
              </h4>
              <span className="text-xs font-black text-rose-600">
                ጠቅላላ፡ {totalPlannedExpenses.toLocaleString()} ETB
              </span>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-black border-b border-slate-200/60">
                <tr>
                  <th className="py-3 px-4">የወጪው ዘርፍ (Category)</th>
                  <th className="py-3 px-4">የታቀደ መጠን (Planned)</th>
                  <th className="py-3 px-4">የተከፈለ እውነተኛ ወጪ (Actual Paid)</th>
                  <th className="py-3 px-4">ቀሪ ዕዳ (Remaining)</th>
                  <th className="py-3 px-4 text-right">ሁኔታ (Status)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                <tr>
                  <td className="py-3.5 px-4 font-black text-slate-900">🏢 የቤት ኪራይና መደበኛ ቢሎች (Rent & Utilities)</td>
                  <td className="py-3.5 px-4">{plannedRecurringTotal.toLocaleString()} ETB</td>
                  <td className="py-3.5 px-4 text-emerald-700">
                    {actualExpenses.filter(e => e.category === 'Rent' || e.category === 'Utilities' || e.category === 'Bills').reduce((s, e) => s + e.amount, 0).toLocaleString()} ETB
                  </td>
                  <td className="py-3.5 px-4 text-rose-600">{plannedRecurringTotal.toLocaleString()} ETB</td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black">
                      Upcoming
                    </span>
                  </td>
                </tr>

                <tr>
                  <td className="py-3.5 px-4 font-black text-slate-900">🍏 የፍራፍሬና ማሸጊያ ግዢዎች (Fruit & Packaging Purchases)</td>
                  <td className="py-3.5 px-4">{plannedPurchasesTotal.toLocaleString()} ETB</td>
                  <td className="py-3.5 px-4 text-emerald-700">
                    {actualExpenses.filter(e => e.category === 'Fruit & Stock').reduce((s, e) => s + e.amount, 0).toLocaleString()} ETB
                  </td>
                  <td className="py-3.5 px-4 text-rose-600">{plannedPurchasesTotal.toLocaleString()} ETB</td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="px-2.5 py-1 rounded-full bg-teal-100 text-teal-800 text-[10px] font-black">
                      5 Purchases Planned
                    </span>
                  </td>
                </tr>

                <tr>
                  <td className="py-3.5 px-4 font-black text-slate-900">👥 የሰራተኞች ደመወዝ (Staff Salaries)</td>
                  <td className="py-3.5 px-4">{plannedSalariesTotal.toLocaleString()} ETB</td>
                  <td className="py-3.5 px-4 text-emerald-700">
                    {salaryPlans.reduce((s, sal) => s + (sal.paidAmount || 0), 0).toLocaleString()} ETB
                  </td>
                  <td className="py-3.5 px-4 text-rose-600">{plannedSalariesTotal.toLocaleString()} ETB</td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-black">
                      Due Dec 1
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* 4. TAB: RENT & RECURRING BILLS                                  */}
      {/* ============================================================== */}
      {activeTab === 'recurring' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">
                የቤት ኪራይና መደበኛ ሂሳቦች (Recurring Rent & Utility Obligations)
              </h3>
              <p className="text-xs text-slate-400 font-bold mt-1">
                ወርሃዊ የኪራይ፣ መብራት፣ ውሃ እና ሌሎች ግዴታዎች ክፍያ መመዝገቢያ
              </p>
            </div>

            <button
              type="button"
              onClick={() => { setActiveQuickAddModal('expense'); setShowQuickAddMenu(false); }}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-2xl flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ አዲስ ቢል መዝግብ</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recurringExpenses.map(item => {
              const isOverdue = item.id === 'rec-2';
              return (
                <div key={item.id} className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-slate-400">{item.category}</span>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                        isOverdue ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {isOverdue ? 'Overdue' : 'Active'}
                      </span>
                    </div>

                    <h4 className="text-base font-black text-slate-900">{item.name}</h4>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-slate-900">{item.amount.toLocaleString()}</span>
                      <span className="text-xs font-black text-emerald-700">ETB / {item.frequency}</span>
                    </div>

                    <div className="text-xs text-slate-500 font-bold space-y-1 pt-2 border-t border-slate-100">
                      <p>📅 የሚከፈልበት ቀን: <span className="font-black text-slate-900">{item.nextDueDate}</span></p>
                      <p>🔔 ማስታወሻ: ከ {item.reminderDays} ቀናት በፊት</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePayRecurringBill(item.id)}
                    className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-black text-xs rounded-2xl transition-all border border-emerald-200 flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>ክፍያውን መዝግብ (Record Payment)</span>
                  </button>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* 5. TAB: PURCHASE PLANNING (FRUIT & SUPPLIES)                   */}
      {/* ============================================================== */}
      {activeTab === 'purchases' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">
                የፍራፍሬና ጥሬ ዕቃዎች ግዢ ዕቅድ (Fruit & Supply Purchase Plans)
              </h3>
              <p className="text-xs text-slate-400 font-bold mt-1">
                የሚገዙ ፍራፍሬዎች መጠን፣ የኪሎ ዋጋና አቅራቢዎች መዝገብ
              </p>
            </div>

            <button
              type="button"
              onClick={() => { setActiveQuickAddModal('purchase'); setShowQuickAddMenu(false); }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ አዲስ የግዢ ዕቅድ</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-black border-b border-slate-200/60">
                <tr>
                  <th className="py-3 px-4">ዕቃ (Item)</th>
                  <th className="py-3 px-4">መጠን (Quantity)</th>
                  <th className="py-3 px-4">የአንዱ ዋጋ (Unit Price)</th>
                  <th className="py-3 px-4">ግምታዊ ድምር (Estimated)</th>
                  <th className="py-3 px-4">አቅራቢ (Supplier)</th>
                  <th className="py-3 px-4">የታቀደበት ቀን (Date)</th>
                  <th className="py-3 px-4">ሁኔታ (Status)</th>
                  <th className="py-3 px-4 text-right">እርምጃ (Action)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                {purchasePlans.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-black text-slate-900 flex items-center gap-2">
                      <span className="text-base">🍏</span>
                      <span>{item.itemName}</span>
                    </td>
                    <td className="py-3.5 px-4 font-black text-slate-900">{item.quantity} {item.unit}</td>
                    <td className="py-3.5 px-4">{item.estimatedUnitPrice} ETB</td>
                    <td className="py-3.5 px-4 font-black text-emerald-800">{item.estimatedTotal.toLocaleString()} ETB</td>
                    <td className="py-3.5 px-4 text-slate-500">{item.supplier}</td>
                    <td className="py-3.5 px-4">{item.plannedDate}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                        item.status === 'Received' ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {item.status === 'Planned' && (
                        <button
                          type="button"
                          onClick={() => handleReceivePurchase(item.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-2xs transition-all active:scale-95"
                        >
                          ተረከብ (Receive)
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* 6. TAB: SALARY PLANNING (SECTION 3)                            */}
      {/* ============================================================== */}
      {activeTab === 'salaries' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">
                የሰራተኞች ደመወዝ ዕቅድ (Staff Salary Planning & Obligations)
              </h3>
              <p className="text-xs text-slate-400 font-bold mt-1">
                የወሩ ደመወዝ፣ ተጨማሪ አበል፣ ቅናሽ እና ቀሪ ክፍያዎች
              </p>
            </div>

            <button
              type="button"
              onClick={() => { setActiveQuickAddModal('salary'); setShowQuickAddMenu(false); }}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-2xl flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ አዲስ ሰራተኛ መዝግብ</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {salaryPlans.map(sal => {
              const totalDue = sal.baseSalary + (sal.bonus || 0) - (sal.deduction || 0);
              const remaining = Math.max(0, totalDue - (sal.paidAmount || 0));
              const isFullyPaid = remaining === 0;

              return (
                <div key={sal.id} className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-400 uppercase">{sal.role}</span>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                        isFullyPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {sal.status}
                      </span>
                    </div>

                    <h4 className="text-base font-black text-slate-900">{sal.employeeName}</h4>

                    <div className="space-y-1.5 text-xs text-slate-600 font-bold pt-2 border-t border-slate-100">
                      <div className="flex justify-between">
                        <span>መሰረታዊ ደመወዝ (Base):</span>
                        <span className="font-black text-slate-900">{sal.baseSalary.toLocaleString()} ETB</span>
                      </div>
                      {sal.bonus > 0 && (
                        <div className="flex justify-between text-emerald-700">
                          <span>ጉርሻ / አበል (Bonus):</span>
                          <span>+{sal.bonus.toLocaleString()} ETB</span>
                        </div>
                      )}
                      {sal.deduction > 0 && (
                        <div className="flex justify-between text-rose-600">
                          <span>ቅናሽ / አድቫንስ (Deduction):</span>
                          <span>-{sal.deduction.toLocaleString()} ETB</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-1 border-t border-slate-100 text-slate-900 font-black">
                        <span>ጠቅላላ የሚገባው:</span>
                        <span>{totalDue.toLocaleString()} ETB</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>የተከፈለ መጠን:</span>
                        <span className="text-emerald-700 font-black">{sal.paidAmount.toLocaleString()} ETB</span>
                      </div>
                      <div className="flex justify-between text-rose-600 font-black">
                        <span>ቀሪ የሚከፈል:</span>
                        <span>{remaining.toLocaleString()} ETB</span>
                      </div>
                    </div>
                  </div>

                  {!isFullyPaid && (
                    <button
                      type="button"
                      onClick={() => handlePaySalary(sal.id, remaining)}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl shadow-sm transition-all active:scale-95"
                    >
                      ቀሪውን ክፈል ({remaining.toLocaleString()} ETB)
                    </button>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* 7. TAB: TASKS & PLANS (SECTION 3)                              */}
      {/* ============================================================== */}
      {activeTab === 'tasks' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">
                ተግባራትና የንግድ እቅዶች (Actionable Tasks & Deadlines)
              </h3>
              <p className="text-xs text-slate-400 font-bold mt-1">
                የቅድሚያ ቅደም ተከተል፣ ቀነ-ገደብና የዋጋ ግምት የተመደበላቸው ስራዎች
              </p>
            </div>

            <button
              type="button"
              onClick={() => { setActiveQuickAddModal('task'); setShowQuickAddMenu(false); }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ አዲስ ተግባር</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasks.map(task => {
              const isDone = task.status === 'Completed';
              return (
                <div 
                  key={task.id} 
                  className={`p-5 rounded-3xl border transition-all flex items-start gap-4 ${
                    isDone 
                      ? 'bg-slate-50 border-slate-200 opacity-60' 
                      : 'bg-white border-slate-200 hover:border-emerald-300 shadow-sm'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleTask(task.id)}
                    className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                      isDone 
                        ? 'bg-emerald-600 text-white' 
                        : 'border-2 border-slate-300 hover:border-emerald-500'
                    }`}
                  >
                    {isDone && <Check className="w-4 h-4 stroke-[3]" />}
                  </button>

                  <div className="flex-1 space-y-1.5">
                    <h4 className={`text-sm font-black ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                      {task.title}
                    </h4>

                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-400 pt-1">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                        task.priority === 'High' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {task.priority} Priority
                      </span>
                      <span>📅 {task.dueDate}</span>
                      {task.estimatedCost > 0 && (
                        <span className="font-black text-slate-900">{task.estimatedCost.toLocaleString()} ETB</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* 8. TAB: GOALS & INVESTMENTS (SECTION 3)                         */}
      {/* ============================================================== */}
      {activeTab === 'goals' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">
                የረጅም ጊዜ የንግድ ግቦች (Long-Term Business & Asset Goals)
              </h3>
              <p className="text-xs text-slate-400 font-bold mt-1">
                የፍሪጅ ግዢ፣ የጁስ ማሽን ማስፋፊያና የቁጠባ ግቦች መከታተያ
              </p>
            </div>

            <button
              type="button"
              onClick={() => { setActiveQuickAddModal('goal'); setShowQuickAddMenu(false); }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ አዲስ ግብ</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {goals.map(goal => {
              const progressPct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));

              return (
                <div key={goal.id} className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <Target className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      {progressPct}% Funded
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-slate-900">{goal.title}</h4>
                    <p className="text-xs text-slate-400 font-bold mt-0.5">ቀነ-ገደብ: {goal.deadline}</p>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-black">
                      <span className="text-slate-900">{goal.currentAmount.toLocaleString()} ETB</span>
                      <span className="text-slate-400">{goal.targetAmount.toLocaleString()} ETB</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Quick Add Contribution Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const amount = prompt('ስንት ብር ወደዚህ ግብ መመደብ ይፈልጋሉ? (Amount in ETB):', '2000');
                      if (amount) handleContributeToGoal(goal.id, amount);
                    }}
                    className="w-full py-2.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-900 text-slate-700 font-black text-xs rounded-2xl transition-all border border-slate-200 active:scale-95"
                  >
                    + ገንዘብ መድብ (Add Contribution)
                  </button>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* 9. TAB: NOTES & SUPPLIER IDEAS (SECTION 3)                     */}
      {/* ============================================================== */}
      {activeTab === 'notes' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">
                የንግድ ማስታወሻዎችና ሃሳቦች (Business Notes & Observations)
              </h3>
              <p className="text-xs text-slate-400 font-bold mt-1">
                የአቅራቢዎች መረጃ፣ የገበያ ሁኔታና ወደ ስራ ተግባር የሚለወጡ ሃሳቦች
              </p>
            </div>

            <button
              type="button"
              onClick={() => { setActiveQuickAddModal('note'); setShowQuickAddMenu(false); }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ አዲስ ማስታወሻ</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notes.map(note => (
              <div key={note.id} className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
                    <span>📅 {note.createdAt}</span>
                    <FileText className="w-4 h-4 text-amber-500" />
                  </div>
                  <h4 className="text-sm font-black text-slate-900">{note.title}</h4>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                    {note.content}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleConvertNoteToTask(note)}
                  className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-black text-xs rounded-2xl transition-all border border-emerald-200 flex items-center justify-center gap-2 active:scale-95"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>ወደ ስራ ተግባር ቀይር (Convert to Task)</span>
                </button>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* 10. TAB: UNIFIED CALENDAR TIMELINE (SECTION 3)                  */}
      {/* ============================================================== */}
      {activeTab === 'calendar' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
            <h3 className="text-base font-black text-slate-900">
              የንግዱ የተቀናጀ የጊዜ ሰሌዳ (Unified Business Timeline & Calendar)
            </h3>
            <p className="text-xs text-slate-400 font-bold mt-1">
              የኪራይ፣ የፍራፍሬ ግዢ፣ የደመወዝ ክፍያና የዕቅዶች የጊዜ ቅደም ተከተል
            </p>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
            {[
              { date: 'Nov 20, 2026', title: 'የመብራት ክፍያ (Electricity Bill)', amount: '2,500 ETB', type: 'Overdue Bill', tagColor: 'bg-rose-100 text-rose-800' },
              { date: 'Nov 28, 2026', title: 'የውሃ ክፍያ (Water Supply Bill)', amount: '1,200 ETB', type: 'Due Soon', tagColor: 'bg-amber-100 text-amber-800' },
              { date: 'Dec 01, 2026', title: 'የቤት ኪራይ (Shop Rent Payment)', amount: '15,000 ETB', type: 'Rent Obligation', tagColor: 'bg-slate-100 text-slate-900' },
              { date: 'Dec 01, 2026', title: 'የሰራተኞች ወርሃዊ ደመወዝ (Staff Salaries)', amount: '14,100 ETB', type: 'Payroll', tagColor: 'bg-teal-100 text-teal-800' },
              { date: 'Dec 01, 2026', title: 'የብርቱካን ግዢ ከመርካቶ (Orange 50kg)', amount: '6,000 ETB', type: 'Fruit Purchase', tagColor: 'bg-emerald-100 text-emerald-800' },
              { date: 'Dec 02, 2026', title: 'የማንጎ ግዢ (Mango 30kg)', amount: '4,200 ETB', type: 'Fruit Purchase', tagColor: 'bg-emerald-100 text-emerald-800' },
              { date: 'Dec 05, 2026', title: 'የጁስ ኩባያ ግዢ (500 pcs Juice Cups)', amount: '4,000 ETB', type: 'Supplies', tagColor: 'bg-slate-100 text-slate-800' },
              { date: 'Dec 15, 2026', title: 'የማሽን ግብ ቀነ-ገደብ (High-Speed Blenders Deadline)', amount: '25,000 ETB', type: 'Asset Goal', tagColor: 'bg-indigo-100 text-indigo-800' },
              { date: 'Dec 31, 2026', title: 'የፍሪጅ ግብ ቀነ-ገደብ (Display Refrigerator Deadline)', amount: '75,000 ETB', type: 'Asset Goal', tagColor: 'bg-indigo-100 text-indigo-800' }
            ].map((event, idx) => (
              <div key={idx} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/80 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex flex-col items-center justify-center font-black text-slate-900 text-xs shadow-2xs">
                    <span>{event.date.split(' ')[0]}</span>
                    <span className="text-[10px] text-emerald-700">{event.date.split(' ')[1].replace(',', '')}</span>
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 block">{event.title}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full inline-block mt-0.5 ${event.tagColor}`}>
                      {event.type}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black text-slate-900 block">{event.amount}</span>
                  <span className="text-[10px] text-slate-400 font-bold">{event.date}</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* 11. TAB: REPORTS (BUDGET vs ACTUAL, CASH FLOW)                  */}
      {/* ============================================================== */}
      {activeTab === 'reports' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">
                የበጀትና የትክክለኛ ወጪዎች ንጽጽር (Budget vs Actual Reports)
              </h3>
              <p className="text-xs text-slate-400 font-bold mt-1">
                የታቀዱ ወጪዎች ከእውነተኛ የተከፈሉ ሂሳቦች ጋር ያለው ልዩነት
              </p>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs rounded-2xl flex items-center gap-1.5 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>ሪፖርቱን አትም (Print)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase">ጠቅላላ የታቀደ ወጪ</span>
              <p className="text-2xl font-black text-slate-900">{totalPlannedExpenses.toLocaleString()} ETB</p>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase">እስካሁን የተከፈለ እውነተኛ ወጪ</span>
              <p className="text-2xl font-black text-emerald-700">{totalActualExpenses.toLocaleString()} ETB</p>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase">የተጣራ የጥሬ ገንዘብ ትርፍ (Net Cash)</span>
              <p className="text-2xl font-black text-teal-800">{(totalRealSales - totalActualExpenses).toLocaleString()} ETB</p>
            </div>
          </div>

          {/* Actual Expenses Ledger Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                የተከፈሉ እውነተኛ ወጪዎች መዝገብ (Actual Paid Expenses)
              </h4>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-black border-b border-slate-200/60">
                <tr>
                  <th className="py-3 px-4">ቀን (Date)</th>
                  <th className="py-3 px-4">የወጪው ስም (Description)</th>
                  <th className="py-3 px-4">ዘርፍ (Category)</th>
                  <th className="py-3 px-4">የክፍያ ዘዴ (Method)</th>
                  <th className="py-3 px-4 text-right">የተከፈለ መጠን (Amount)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                {actualExpenses.map(exp => (
                  <tr key={exp.id}>
                    <td className="py-3 px-4 text-slate-500">{exp.date}</td>
                    <td className="py-3 px-4 font-black text-slate-900">{exp.title}</td>
                    <td className="py-3 px-4">{exp.category}</td>
                    <td className="py-3 px-4 text-slate-500">{exp.paymentMethod}</td>
                    <td className="py-3 px-4 font-black text-rose-600 text-right">-{exp.amount.toLocaleString()} ETB</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* 12. QUICK ADD MODAL (ONE ACTION OPENS A CHOICE)                */}
      {/* ============================================================== */}
      {showQuickAddMenu && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <span>ምን መጨመር ይፈልጋሉ? (Quick Add)</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowQuickAddMenu(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              {[
                { id: 'expense', label: '💸 እውነተኛ ወጪ (Expense)', desc: 'የተከፈለ ጥሬ ገንዘብ' },
                { id: 'purchase', label: '🍏 የፍራፍሬ ግዢ ዕቅድ (Purchase)', desc: 'ኪሎና ግምታዊ ዋጋ' },
                { id: 'salary', label: '👥 የሰራተኛ ደመወዝ (Salary)', desc: 'ወርሃዊ ክፍያና አበል' },
                { id: 'task', label: '✅ የስራ ተግባር (Task)', desc: 'ቀነ-ገደብና የቅድሚያ ደረጃ' },
                { id: 'goal', label: '🎯 የረጅም ጊዜ ግብ (Goal)', desc: 'የፍሪጅና ማሽን ቁጠባ' },
                { id: 'note', label: '📝 የንግድ ሃሳብ (Note)', desc: 'የገበያና አቅራቢ ማስታወሻ' }
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setActiveQuickAddModal(opt.id);
                    setShowQuickAddMenu(false);
                    setFormInputs({});
                  }}
                  className="p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition-all group active:scale-95"
                >
                  <span className="font-black text-xs text-slate-900 group-hover:text-emerald-900 block">
                    {opt.label}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                    {opt.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DEDICATED INPUT MODAL FOR SELECTED CHOICE */}
      {activeQuickAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-sm text-slate-900 capitalize">
                {activeQuickAddModal === 'expense' && '💸 አዲስ ወጪ መዝግብ (Record Actual Expense)'}
                {activeQuickAddModal === 'purchase' && '🍏 አዲስ የፍራፍሬ ግዢ ዕቅድ (Add Purchase Plan)'}
                {activeQuickAddModal === 'salary' && '👥 አዲስ የደመወዝ ግዴታ (Add Salary Plan)'}
                {activeQuickAddModal === 'task' && '✅ አዲስ ተግባር መዝግብ (Add New Task)'}
                {activeQuickAddModal === 'goal' && '🎯 አዲስ የንግድ ግብ (Add Business Goal)'}
                {activeQuickAddModal === 'note' && '📝 አዲስ ማስታወሻ ጻፍ (Add Business Note)'}
              </h3>
              <button
                type="button"
                onClick={() => setActiveQuickAddModal(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickAddSubmit} className="space-y-3 text-xs">
              
              {/* Form for Expense */}
              {activeQuickAddModal === 'expense' && (
                <>
                  <div>
                    <label className="font-black text-slate-700 block mb-1">የወጪው ስም (Description):</label>
                    <input
                      type="text"
                      required
                      placeholder="ለምሳሌ፡ የበረዶ ግዢ..."
                      value={formInputs.title || ''}
                      onChange={(e) => setFormInputs({ ...formInputs, title: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-black text-slate-700 block mb-1">መጠን (Amount ETB):</label>
                      <input
                        type="number"
                        required
                        placeholder="500"
                        value={formInputs.amount || ''}
                        onChange={(e) => setFormInputs({ ...formInputs, amount: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="font-black text-slate-700 block mb-1">ዘርፍ (Category):</label>
                      <select
                        value={formInputs.category || 'General'}
                        onChange={(e) => setFormInputs({ ...formInputs, category: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="Ingredients">Ingredients (ግብአት)</option>
                        <option value="Utilities">Utilities (መብራት/ውሃ)</option>
                        <option value="Maintenance">Maintenance (ጥገና)</option>
                        <option value="General">General (ጠቅላላ)</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Form for Purchase Plan */}
              {activeQuickAddModal === 'purchase' && (
                <>
                  <div>
                    <label className="font-black text-slate-700 block mb-1">የዕቃው ስም (Fruit/Item Name):</label>
                    <input
                      type="text"
                      required
                      placeholder="ለምሳሌ፡ አቮካዶ (Avocado)"
                      value={formInputs.itemName || ''}
                      onChange={(e) => setFormInputs({ ...formInputs, itemName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-black text-slate-700 block mb-1">መጠን (Qty in kg/pcs):</label>
                      <input
                        type="number"
                        required
                        placeholder="40"
                        value={formInputs.quantity || ''}
                        onChange={(e) => setFormInputs({ ...formInputs, quantity: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="font-black text-slate-700 block mb-1">የአንዱ ዋጋ (Unit Price):</label>
                      <input
                        type="number"
                        required
                        placeholder="120"
                        value={formInputs.unitPrice || ''}
                        onChange={(e) => setFormInputs({ ...formInputs, unitPrice: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-black text-slate-700 block mb-1">አቅራቢ (Supplier):</label>
                    <input
                      type="text"
                      placeholder="አትክልት ተራ መርካቶ..."
                      value={formInputs.supplier || ''}
                      onChange={(e) => setFormInputs({ ...formInputs, supplier: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </>
              )}

              {/* Form for Task */}
              {activeQuickAddModal === 'task' && (
                <>
                  <div>
                    <label className="font-black text-slate-700 block mb-1">የተግባሩ ርዕስ (Task Title):</label>
                    <input
                      type="text"
                      required
                      placeholder="ለምሳሌ፡ የፍራፍሬ ዋጋ አወዳድር..."
                      value={formInputs.title || ''}
                      onChange={(e) => setFormInputs({ ...formInputs, title: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-black text-slate-700 block mb-1">ቀነ-ገደብ (Due Date):</label>
                      <input
                        type="date"
                        value={formInputs.dueDate || ''}
                        onChange={(e) => setFormInputs({ ...formInputs, dueDate: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="font-black text-slate-700 block mb-1">የቅድሚያ ደረጃ (Priority):</label>
                      <select
                        value={formInputs.priority || 'Medium'}
                        onChange={(e) => setFormInputs({ ...formInputs, priority: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="High">High (ከፍተኛ)</option>
                        <option value="Medium">Medium (መካከለኛ)</option>
                        <option value="Normal">Normal (መደበኛ)</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Form for Goal */}
              {activeQuickAddModal === 'goal' && (
                <>
                  <div>
                    <label className="font-black text-slate-700 block mb-1">የግቡ ስም (Goal Title):</label>
                    <input
                      type="text"
                      required
                      placeholder="ለምሳሌ፡ አዲስ የጁስ ማሽን መግዛት..."
                      value={formInputs.title || ''}
                      onChange={(e) => setFormInputs({ ...formInputs, title: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-black text-slate-700 block mb-1">የግብ መጠን (Target ETB):</label>
                      <input
                        type="number"
                        required
                        placeholder="25000"
                        value={formInputs.targetAmount || ''}
                        onChange={(e) => setFormInputs({ ...formInputs, targetAmount: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="font-black text-slate-700 block mb-1">የአሁን ቁጠባ (Current ETB):</label>
                      <input
                        type="number"
                        placeholder="5000"
                        value={formInputs.currentAmount || ''}
                        onChange={(e) => setFormInputs({ ...formInputs, currentAmount: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Form for Note */}
              {activeQuickAddModal === 'note' && (
                <>
                  <div>
                    <label className="font-black text-slate-700 block mb-1">ርዕስ (Title):</label>
                    <input
                      type="text"
                      required
                      placeholder="የአቅራቢ መረጃ ወይም ሃሳብ..."
                      value={formInputs.title || ''}
                      onChange={(e) => setFormInputs({ ...formInputs, title: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="font-black text-slate-700 block mb-1">ዝርዝር ይዘት (Content):</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="ሃሳብዎን እዚህ በነጻነት ይጻፉ..."
                      value={formInputs.content || ''}
                      onChange={(e) => setFormInputs({ ...formInputs, content: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveQuickAddModal(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black"
                >
                  ሰርዝ (Cancel)
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black shadow-md shadow-emerald-700/20"
                >
                  አስቀምጥ (Save)
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
