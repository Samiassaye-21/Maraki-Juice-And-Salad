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
  ChevronLeft,
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
  ArrowRight,
  Trash2,
  Filter,
  Undo,
  RefreshCw,
  Settings,
  Eye,
  CheckCircle2,
  AlertCircle,
  Info,
  Lock,
  Search,
  RotateCcw,
  Copy
} from 'lucide-react';
import ScheduleCalendarRemindMe from './ScheduleCalendarRemindMe';
import WaiterPendingLedgerModal from './WaiterPendingLedgerModal';
import OwnerIncomeAnalysisReport from './OwnerIncomeAnalysisReport';

// ==============================================================
// ETHIOPIAN CALENDAR CONVERSION HELPER
// ==============================================================
export function toEthiopianDateString(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  const jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  const r = (jdn - 1723856) % 1461;
  const n = (r % 365) + 365 * Math.floor(r / 1460);
  const ethYear = 4 * Math.floor((jdn - 1723856) / 1461) + Math.floor(r / 365) - Math.floor(r / 1460);
  const ethMonthIndex = Math.floor(n / 30);
  const ethDay = (n % 30) + 1;
  const ETH_MONTH_NAMES = [
    'መስከረም', 'ጥቅምት', 'ኅዳር', 'ታኅሣሥ', 'ጥር', 'የካቲት',
    'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜ'
  ];
  const mName = ETH_MONTH_NAMES[ethMonthIndex] || 'ኅዳር';
  return `${mName} ${ethDay}, ${ethYear} ዓ.ም`;
}

export function toEthiopianShortDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  const jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  const r = (jdn - 1723856) % 1461;
  const n = (r % 365) + 365 * Math.floor(r / 1460);
  const ethMonthIndex = Math.floor(n / 30);
  const ethDay = (n % 30) + 1;
  const ETH_MONTH_NAMES = [
    'መስከረም', 'ጥቅምት', 'ኅዳር', 'ታኅሣሥ', 'ጥር', 'የካቲት',
    'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜ'
  ];
  return `${ETH_MONTH_NAMES[ethMonthIndex] || 'ኅዳር'} ${ethDay}`;
}

// ==============================================================
// OPTIONAL REFERENCE TEMPLATES (ONLY LOADED IF USER RESTORES SAMPLES)
// ==============================================================

const SAMPLE_RECURRING_EXPENSES = [
  { id: 'rec-1', name: 'የቤት ኪራይ (Shop Rent)', category: 'Rent', amount: 15000, frequency: 'Monthly', dueDay: 1, nextDueDate: '2026-12-01', reminderDays: 10, active: true, calendar: 'Ethiopian' },
  { id: 'rec-2', name: 'የመብራት ክፍያ (Electricity)', category: 'Utilities', amount: 2500, frequency: 'Monthly', dueDay: 20, nextDueDate: '2026-11-20', reminderDays: 3, active: true, calendar: 'Ethiopian' },
  { id: 'rec-3', name: 'የውሃ ክፍያ (Water Supply)', category: 'Utilities', amount: 1200, frequency: 'Monthly', dueDay: 28, nextDueDate: '2026-11-28', reminderDays: 5, active: true, calendar: 'Ethiopian' },
  { id: 'rec-4', name: 'ዋይፋይ / ኢንተርኔት (WiFi Internet)', category: 'Bills', amount: 1800, frequency: 'Monthly', dueDay: 5, nextDueDate: '2026-12-05', reminderDays: 3, active: true, calendar: 'Ethiopian' },
  { id: 'rec-5', name: 'የንግድ ፈቃድና ግብር (Trade License & Tax)', category: 'License', amount: 6000, frequency: 'Yearly', dueDay: 15, nextDueDate: '2027-01-15', reminderDays: 14, active: true, calendar: 'Ethiopian' }
];

const SAMPLE_PURCHASE_PLANS = [
  { id: 'pur-1', itemName: 'ብርቱካን (Orange)', quantity: 50, unit: 'kg', estimatedUnitPrice: 120, estimatedTotal: 6000, supplier: 'አትክልት ተራ መርካቶ', plannedDate: '2026-12-01', status: 'Planned' },
  { id: 'pur-2', itemName: 'ማንጎ (Mango)', quantity: 30, unit: 'kg', estimatedUnitPrice: 140, estimatedTotal: 4200, supplier: 'ሀዋሳ ፍሬሽ', plannedDate: '2026-12-02', status: 'Planned' },
  { id: 'pur-3', itemName: 'አቮካዶ (Avocado)', quantity: 25, unit: 'kg', estimatedUnitPrice: 110, estimatedTotal: 2750, supplier: 'ቡታጅራ ፍራፍሬ', plannedDate: '2026-12-03', status: 'Planned' },
  { id: 'pur-4', itemName: 'የጁስ ኩባያ (Juice Cups)', quantity: 500, unit: 'pcs', estimatedUnitPrice: 8, estimatedTotal: 4000, supplier: 'ፕላስቲክ የጅምላ አከፋፋይ', plannedDate: '2026-12-05', status: 'Planned' },
  { id: 'pur-5', itemName: 'ሙዝ (Banana)', quantity: 40, unit: 'kg', estimatedUnitPrice: 95, estimatedTotal: 3800, supplier: 'አርባምንጭ ሙዝ', plannedDate: '2026-12-07', status: 'Planned' }
];

const SAMPLE_SALARY_PLANS = [
  { id: 'sal-1', employeeName: 'አልማዝ በቀለ (Chef Almaz)', role: 'Head Chef', baseSalary: 5000, bonus: 500, deduction: 0, netSalary: 5500, paidAmount: 0, payDate: '2026-12-01', status: 'Pending' },
  { id: 'sal-2', employeeName: 'ሀብታሙ (Habtamu)', role: 'Waiter & Barista', baseSalary: 3500, bonus: 0, deduction: 0, netSalary: 3500, paidAmount: 0, payDate: '2026-12-01', status: 'Pending' },
  { id: 'sal-3', employeeName: 'ትዕግስት (Tigist)', role: 'Cashier & Waitress', baseSalary: 3800, bonus: 0, deduction: 0, netSalary: 3800, paidAmount: 0, payDate: '2026-12-01', status: 'Pending' },
  { id: 'sal-4', employeeName: 'ቻላ (Chala)', role: 'Prep Assistant', baseSalary: 2500, bonus: 0, deduction: 200, netSalary: 2300, paidAmount: 0, payDate: '2026-12-01', status: 'Pending' }
];

const SAMPLE_TASKS = [
  { id: 'tsk-1', title: 'የብርቱካንና ማንጎ ዋጋ ከመርካቶ አወዳድር (Compare suppliers)', priority: 'High', dueDate: '2026-12-02', estimatedCost: 0, status: 'To do' },
  { id: 'tsk-2', title: 'የመስታወት ማቀዝቀዣ ዋጋ ፒያሳ ጠይቅ (Check refrigerator prices)', priority: 'High', dueDate: '2026-12-08', estimatedCost: 45000, status: 'To do' },
  { id: 'tsk-3', title: 'የታህሳስ ወር በጀትና የሽያጭ ግብ ገምግም (Review December budget)', priority: 'Medium', dueDate: '2026-11-30', estimatedCost: 0, status: 'To do' },
  { id: 'tsk-4', title: 'የጁስ ማሽኖች ሰርቪስ ማድረግ (Service blenders)', priority: 'Normal', dueDate: '2026-12-10', estimatedCost: 1500, status: 'To do' }
];

const SAMPLE_GOALS = [
  { id: 'gol-1', title: 'አዲስ ከፍተኛ ፍጥነት ጁስ ማሽን (Commercial Blenders)', targetAmount: 25000, currentAmount: 18500, deadline: '2026-12-15', status: 'Active' },
  { id: 'gol-2', title: 'የመስታወት ማቀዝቀዣ ፍሪጅ (Display Refrigerator)', targetAmount: 75000, currentAmount: 30000, deadline: '2026-12-31', status: 'Active' },
  { id: 'gol-3', title: 'የመቀመጫ ቦታ ማስፋፊያ (Outdoor Seating Expansion)', targetAmount: 40000, currentAmount: 8000, deadline: '2027-01-30', status: 'Active' }
];

const SAMPLE_NOTES = [
  { id: 'not-1', title: 'አትክልት ተራ የብርቱካን ደላላ (Merkato Orange Broker)', content: 'አቶ አበበ ስልክ 0911-234567፤ በሳምንት 50 ኪ.ግ በ120 ብር ያቀርባል።', tag: 'Supplier', createdAt: '2026-11-20' },
  { id: 'not-2', title: 'የክረምት የፍራፍሬ ዋጋ ትንበያ (Seasonal price forecast)', content: 'የማንጎ ዋጋ በታህሳስ ስለሚጨምር አስቀድሞ በብዛት መያዝ ይመረጣል።', tag: 'Idea', createdAt: '2026-11-21' }
];

// 100% CLEAN BASELINE (NO DUMMY DATA)
const INITIAL_RECURRING_EXPENSES = [];
const INITIAL_PURCHASE_PLANS = [];
const INITIAL_SALARY_PLANS = [];
const INITIAL_TASKS = [];
const INITIAL_GOALS = [];
const INITIAL_NOTES = [];
const INITIAL_ACTUAL_EXPENSES = [];
const INITIAL_DAY_CLOSES = [];

export default function BusinessManagement({ 
  orders = [], 
  totalRealSales = 0,
  onSwitchToOrdersLog,
  onClearOrders,
  visibleTabs = null,
  defaultTab = 'home'
}) {
  // Navigation: supports full tabs or scoped visibleTabs from Executive Owner Sidebar
  const [activeTab, setActiveTab] = useState(() => {
    if (Array.isArray(visibleTabs) && visibleTabs.length > 0) return visibleTabs[0];
    return defaultTab;
  });

  useEffect(() => {
    if (Array.isArray(visibleTabs) && visibleTabs.length > 0 && !visibleTabs.includes(activeTab)) {
      setActiveTab(visibleTabs[0]);
    }
  }, [visibleTabs, activeTab]);

  // One-time client wipe of all legacy sample/seed data
  const CLEAN_KEY = 'maraki_all_sample_data_cleared_v5';
  const isMigrated = typeof window !== 'undefined' && localStorage.getItem(CLEAN_KEY) === 'true';

  // Business Balances & Settings (Clean default)
  const [openingBalance, setOpeningBalance] = useState(() => {
    if (!isMigrated) return 0;
    const saved = localStorage.getItem('maraki_opening_cash_balance');
    return saved ? Number(saved) : 0;
  });
  const [expectedMonthlyIncome, setExpectedMonthlyIncome] = useState(() => {
    if (!isMigrated) return 0;
    const saved = localStorage.getItem('maraki_expected_income');
    return saved ? Number(saved) : 0;
  });

  // Data Collections (100% empty by default)
  const [recurringExpenses, setRecurringExpenses] = useState(() => {
    if (!isMigrated) return [];
    const saved = localStorage.getItem('maraki_plan_recurring');
    return saved ? JSON.parse(saved) : [];
  });

  const [purchasePlans, setPurchasePlans] = useState(() => {
    if (!isMigrated) return [];
    const saved = localStorage.getItem('maraki_plan_purchases');
    return saved ? JSON.parse(saved) : [];
  });

  const [salaryPlans, setSalaryPlans] = useState(() => {
    if (!isMigrated) return [];
    const saved = localStorage.getItem('maraki_plan_salaries');
    return saved ? JSON.parse(saved) : [];
  });

  const [tasks, setTasks] = useState(() => {
    if (!isMigrated) return [];
    const saved = localStorage.getItem('maraki_plan_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  const [goals, setGoals] = useState(() => {
    if (!isMigrated) return [];
    const saved = localStorage.getItem('maraki_plan_goals');
    return saved ? JSON.parse(saved) : [];
  });

  const [notes, setNotes] = useState(() => {
    if (!isMigrated) return [];
    const saved = localStorage.getItem('maraki_plan_notes');
    return saved ? JSON.parse(saved) : [];
  });

  const [actualExpenses, setActualExpenses] = useState(() => {
    if (!isMigrated) return [];
    const saved = localStorage.getItem('maraki_actual_expenses');
    return saved ? JSON.parse(saved) : [];
  });

  const [dayCloses, setDayCloses] = useState(() => {
    if (!isMigrated) return [];
    const saved = localStorage.getItem('maraki_day_closes');
    return saved ? JSON.parse(saved) : [];
  });

  // Waiter Pending Debts Ledger State
  const [waiterPendingDebts, setWaiterPendingDebts] = useState(() => {
    const saved = localStorage.getItem('maraki_waiter_pending_debts');
    return saved ? JSON.parse(saved) : [];
  });
  const [showWaiterDebtsModal, setShowWaiterDebtsModal] = useState(false);

  useEffect(() => {
    localStorage.setItem('maraki_waiter_pending_debts', JSON.stringify(waiterPendingDebts));
  }, [waiterPendingDebts]);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'maraki_waiter_pending_debts' && e.newValue) {
        try {
          setWaiterPendingDebts(JSON.parse(e.newValue));
        } catch (err) {
          console.error(err);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const activeWaiterDebtsCount = useMemo(() => {
    return waiterPendingDebts.filter(d => d.status === 'pending').length;
  }, [waiterPendingDebts]);

  // Execute migration on mount
  useEffect(() => {
    if (localStorage.getItem(CLEAN_KEY) !== 'true') {
      localStorage.removeItem('maraki_plan_recurring');
      localStorage.removeItem('maraki_plan_purchases');
      localStorage.removeItem('maraki_plan_salaries');
      localStorage.removeItem('maraki_plan_tasks');
      localStorage.removeItem('maraki_plan_goals');
      localStorage.removeItem('maraki_plan_notes');
      localStorage.removeItem('maraki_actual_expenses');
      localStorage.removeItem('maraki_day_closes');
      localStorage.removeItem('maraki_chef_sent_orders');
      localStorage.removeItem('maraki_opening_cash_balance');
      localStorage.removeItem('maraki_expected_income');
      localStorage.setItem(CLEAN_KEY, 'true');
      setRecurringExpenses([]);
      setPurchasePlans([]);
      setSalaryPlans([]);
      setTasks([]);
      setGoals([]);
      setNotes([]);
      setActualExpenses([]);
      setDayCloses([]);
      setOpeningBalance(0);
      setExpectedMonthlyIncome(0);
      if (onClearOrders) onClearOrders();
    }
  }, []);

  // LocalStorage Sync Effects
  useEffect(() => { localStorage.setItem('maraki_plan_recurring', JSON.stringify(recurringExpenses)); }, [recurringExpenses]);
  useEffect(() => { localStorage.setItem('maraki_plan_purchases', JSON.stringify(purchasePlans)); }, [purchasePlans]);
  useEffect(() => { localStorage.setItem('maraki_plan_salaries', JSON.stringify(salaryPlans)); }, [salaryPlans]);
  useEffect(() => { localStorage.setItem('maraki_plan_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('maraki_plan_goals', JSON.stringify(goals)); }, [goals]);
  useEffect(() => { localStorage.setItem('maraki_plan_notes', JSON.stringify(notes)); }, [notes]);
  useEffect(() => { localStorage.setItem('maraki_actual_expenses', JSON.stringify(actualExpenses)); }, [actualExpenses]);
  useEffect(() => { localStorage.setItem('maraki_opening_cash_balance', openingBalance.toString()); }, [openingBalance]);
  useEffect(() => { localStorage.setItem('maraki_expected_income', expectedMonthlyIncome.toString()); }, [expectedMonthlyIncome]);
  useEffect(() => { localStorage.setItem('maraki_day_closes', JSON.stringify(dayCloses)); }, [dayCloses]);

  // UI Interactive States
  const [showQuickAddMenu, setShowQuickAddMenu] = useState(false);
  const [activeQuickAddModal, setActiveQuickAddModal] = useState(null);
  const [formInputs, setFormInputs] = useState({});
  const [activeDrillDown, setActiveDrillDown] = useState(null); // 'balance' | 'planned' | 'expected' | 'projected'
  const [activePaymentSheet, setActivePaymentSheet] = useState(null);
  const [undoToast, setUndoToast] = useState(null);
  const [isActionLocked, setIsActionLocked] = useState(false);
  const [showCloseDayModal, setShowCloseDayModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [toPayFilter, setToPayFilter] = useState('all'); // 'all' | 'bills' | 'fruit' | 'salary'
  const [toPayView, setToPayView] = useState('list'); // 'list' | 'calendar'
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('all');
  const [expenseSearch, setExpenseSearch] = useState('');
  const [plansSubTab, setPlansSubTab] = useState('goals'); // 'goals' | 'tasks' | 'notes'
  const [reportsSubTab, setReportsSubTab] = useState('calendar'); // 'calendar' | 'budget' | 'audit' | 'closes'
  const [calendarViewMode, setCalendarViewMode] = useState('month'); // 'month' | 'week' | 'day'
  const [selectedCalendarDate, setSelectedCalendarDate] = useState('2026-11-23'); // Default: ኅዳር 14, 2019
  const [calendarFilter, setCalendarFilter] = useState('all'); // 'all' | 'sales' | 'expenses' | 'bills'
  const [calendarSearch, setCalendarSearch] = useState('');
  const [calendarDayTab, setCalendarDayTab] = useState('all'); // 'all' | 'orders' | 'expenses' | 'bills'

  // ==============================================================
  // CALENDAR REPORT & SCHEDULE COMPUTED ENGINE
  // ==============================================================
  const calendarGridDays = useMemo(() => {
    const days = [];
    // Previous month (ጥቅምት) padding: Sunday & Monday
    days.push({ dayNum: 29, isCurrentMonth: false, isoDate: '2026-11-08', gregDateStr: 'Nov 8' });
    days.push({ dayNum: 30, isCurrentMonth: false, isoDate: '2026-11-09', gregDateStr: 'Nov 9' });

    // Days 1 to 30 of ኅዳር 2019 ዓ.ም (ኅዳር 1 = 2026-11-10)
    for (let d = 1; d <= 30; d++) {
      const gDate = new Date(2026, 10, 10 + (d - 1));
      const year = gDate.getFullYear();
      const month = String(gDate.getMonth() + 1).padStart(2, '0');
      const day = String(gDate.getDate()).padStart(2, '0');
      const isoStr = `${year}-${month}-${day}`;
      const ethStr = `ኅዳር ${d}, 2019 ዓ.ም`;
      const mNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const gregDateStr = `${mNames[gDate.getMonth()]} ${gDate.getDate()}`;

      const dayOrders = orders.filter(o => o.ethiopianDate === ethStr || (o.createdAt && o.createdAt.startsWith(isoStr)));
      const daySales = dayOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

      const dayExps = actualExpenses.filter(e => e.date === isoStr);
      const dayExpenses = dayExps.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

      const bills = recurringExpenses.filter(r => r.nextDueDate === isoStr);
      const purchases = purchasePlans.filter(p => p.plannedDate === isoStr);
      const salaries = salaryPlans.filter(s => s.payDate === isoStr);

      days.push({
        dayNum: d,
        isCurrentMonth: true,
        isoDate: isoStr,
        ethStr,
        gregDateStr,
        dayOrders,
        daySales,
        dayExps,
        dayExpenses,
        bills,
        purchases,
        salaries
      });
    }

    // Next month (ታኅሣሥ) padding: Thursday, Friday, Saturday
    days.push({ dayNum: 1, isCurrentMonth: false, isoDate: '2026-12-10', gregDateStr: 'Dec 10' });
    days.push({ dayNum: 2, isCurrentMonth: false, isoDate: '2026-12-11', gregDateStr: 'Dec 11' });
    days.push({ dayNum: 3, isCurrentMonth: false, isoDate: '2026-12-12', gregDateStr: 'Dec 12' });

    return days;
  }, [orders, actualExpenses, recurringExpenses, purchasePlans, salaryPlans]);

  const selectedDayData = useMemo(() => {
    const dayCell = calendarGridDays.find(c => c.isoDate === selectedCalendarDate && c.isCurrentMonth);
    if (!dayCell) {
      return {
        sales: 0,
        expensesTotal: 0,
        netProfit: 0,
        orders: [],
        expenses: [],
        bills: [],
        purchases: [],
        salaries: [],
        itemsCount: 0
      };
    }
    const sales = dayCell.daySales;
    const expensesTotal = dayCell.dayExpenses;
    const netProfit = sales - expensesTotal;
    const itemsCount = dayCell.dayOrders.length + dayCell.dayExps.length + dayCell.bills.length + dayCell.purchases.length + dayCell.salaries.length;

    return {
      sales,
      expensesTotal,
      netProfit,
      orders: dayCell.dayOrders,
      expenses: dayCell.dayExps,
      bills: dayCell.bills,
      purchases: dayCell.purchases,
      salaries: dayCell.salaries,
      itemsCount
    };
  }, [calendarGridDays, selectedCalendarDate]);

  // Inline Quick Expense Entry Form State
  const [inlineExpenseTitle, setInlineExpenseTitle] = useState('');
  const [inlineExpenseAmount, setInlineExpenseAmount] = useState('');
  const [inlineExpenseCategory, setInlineExpenseCategory] = useState('Ingredients');
  const [inlineExpenseMethod, setInlineExpenseMethod] = useState('Cash');

  // ==============================================================
  // VERSION 2.0 RECALCULATED EXACT FINANCIAL FORMULAS
  // ==============================================================

  // 1. Total Actual Expenses to date
  const totalActualExpenses = useMemo(() => {
    return actualExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [actualExpenses]);

  // 2. Current Balance (ጥሬ ገንዘብ) = Opening Cash + POS Sales - Actual Expenses
  const currentBalance = useMemo(() => {
    return openingBalance + totalRealSales - totalActualExpenses;
  }, [openingBalance, totalRealSales, totalActualExpenses]);

  // 3. Planned Expenses = Unpaid Bills (due in current month/overdue) + Unpaid Fruit + Unpaid Salaries
  // Only counts unpaid items!
  const unpaidRecurringTotal = useMemo(() => {
    return recurringExpenses
      .filter(r => r.active && r.frequency === 'Monthly')
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  }, [recurringExpenses]);

  const unpaidFruitTotal = useMemo(() => {
    return purchasePlans
      .filter(p => p.status !== 'Received')
      .reduce((sum, p) => sum + (Number(p.estimatedTotal) || 0), 0);
  }, [purchasePlans]);

  const unpaidSalariesTotal = useMemo(() => {
    return salaryPlans
      .filter(s => s.status !== 'Paid')
      .reduce((sum, s) => {
        const net = (s.netSalary !== undefined) ? s.netSalary : (s.baseSalary + (s.bonus || 0) - (s.deduction || 0));
        const rem = net - (Number(s.paidAmount) || 0);
        return sum + Math.max(0, rem);
      }, 0);
  }, [salaryPlans]);

  const totalPlannedExpenses = useMemo(() => {
    return unpaidRecurringTotal + unpaidFruitTotal + unpaidSalariesTotal;
  }, [unpaidRecurringTotal, unpaidFruitTotal, unpaidSalariesTotal]);

  // 4. Expected Income (Forecast): part of target still to be sold
  // Expected Income = max(0, Monthly Target - Sales so far this month)
  const remainingExpectedIncome = useMemo(() => {
    return Math.max(0, expectedMonthlyIncome - totalRealSales);
  }, [expectedMonthlyIncome, totalRealSales]);

  // 5. Projected Remaining (የተገመተ ትርፍ): Current Balance + Expected Income - Planned Expenses
  const projectedRemaining = useMemo(() => {
    return currentBalance + remainingExpectedIncome - totalPlannedExpenses;
  }, [currentBalance, remainingExpectedIncome, totalPlannedExpenses]);

  // 6. Cash Check (የገንዘብ ፍተሻ) Calculation
  const cashCheckObligations = useMemo(() => {
    // Calculate REAL obligations from user's active recurring bills, pending salaries, and planned purchases
    const activeBills = recurringExpenses.filter(r => r.active);
    const pendingSalaries = salaryPlans.filter(s => s.status === 'Pending');
    const plannedPurchases = purchasePlans.filter(p => p.status === 'Planned');

    const billsTotal = activeBills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
    const salariesTotal = pendingSalaries.reduce((sum, s) => sum + (Number(s.netSalary ?? s.baseSalary) || 0), 0);
    const purchasesTotal = plannedPurchases.reduce((sum, p) => sum + (Number(p.estimatedTotal) || 0), 0);
    
    const need = billsTotal + salariesTotal + purchasesTotal;
    const gap = need - currentBalance;
    const daysLeft = 9;
    const salesPerDayNeeded = gap > 0 ? Math.ceil((gap / daysLeft) / 10) * 10 : 0;

    // Build brief breakdown list
    const breakdown = [];
    if (billsTotal > 0) breakdown.push(`ክፍያዎች፡ ${billsTotal.toLocaleString()} ETB`);
    if (salariesTotal > 0) breakdown.push(`ደመወዝ፡ ${salariesTotal.toLocaleString()} ETB`);
    if (purchasesTotal > 0) breakdown.push(`ግዢዎች፡ ${purchasesTotal.toLocaleString()} ETB`);

    return {
      need,
      gap,
      daysLeft,
      salesPerDayNeeded,
      breakdownText: breakdown.length > 0 ? `(${breakdown.join(' · ')})` : '',
      isCovered: need === 0 || gap <= 0,
      safeToSpend: Math.max(0, currentBalance - need),
      hasObligations: need > 0
    };
  }, [recurringExpenses, salaryPlans, purchasePlans, currentBalance]);

  // 7. Dynamic Action Required Items (Overdue or Due Soon)
  const actionRequiredItems = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const items = [];

    recurringExpenses.forEach(bill => {
      if (!bill.active) return;
      const isOverdue = bill.nextDueDate && bill.nextDueDate < today;
      const isDueSoon = bill.nextDueDate && bill.nextDueDate >= today;
      if (isOverdue || isDueSoon) {
        items.push({
          type: 'bill',
          item: bill,
          isOverdue,
          title: bill.name,
          amount: bill.amount,
          dueDate: bill.nextDueDate,
          paymentMethod: 'Cash'
        });
      }
    });

    salaryPlans.forEach(sal => {
      if (sal.status === 'Pending') {
        items.push({
          type: 'salary',
          item: sal,
          isOverdue: sal.payDate && sal.payDate < today,
          title: `ደመወዝ፡ ${sal.employeeName}`,
          amount: sal.netSalary || sal.baseSalary,
          dueDate: sal.payDate,
          paymentMethod: 'Cash'
        });
      }
    });

    purchasePlans.forEach(pur => {
      if (pur.status === 'Planned') {
        items.push({
          type: 'fruit',
          item: pur,
          isOverdue: pur.plannedDate && pur.plannedDate < today,
          title: `ግዢ፡ ${pur.itemName}`,
          amount: pur.estimatedTotal,
          dueDate: pur.plannedDate,
          paymentMethod: 'Cash'
        });
      }
    });

    return items;
  }, [recurringExpenses, salaryPlans, purchasePlans]);

  // ==============================================================
  // FAST ACTION HANDLERS WITH 10S UNDO AND DOUBLE-TAP LOCK
  // ==============================================================

  // Trigger Toast with 10s Undo
  const triggerUndoableAction = (message, undoCallback) => {
    if (undoToast?.timeoutId) clearTimeout(undoToast.timeoutId);
    const timeoutId = setTimeout(() => {
      setUndoToast(null);
    }, 10000);
    setUndoToast({
      message,
      action: () => {
        clearTimeout(timeoutId);
        undoCallback();
        setUndoToast(null);
      },
      timeoutId
    });
  };

  // 1-Tap Quick Expense Preset
  const handleQuickPreset = (title, category, amount, paymentMethod = 'Cash') => {
    if (isActionLocked) return;
    setIsActionLocked(true);
    const newId = 'exp-' + Date.now();
    const newExp = {
      id: newId,
      title,
      category,
      amount,
      date: new Date().toISOString().split('T')[0],
      paymentMethod,
      linkedPlan: 'One-Tap Preset'
    };
    setActualExpenses(prev => [newExp, ...prev]);
    setIsActionLocked(false);
    triggerUndoableAction(`${title} (+ ${amount} ETB) ተመዝግቧል!`, () => {
      setActualExpenses(prev => prev.filter(e => e.id !== newId));
    });
  };

  const handleInitiatePayment = (type, item, amount) => {
    setActivePaymentSheet({
      type,
      item,
      amount: amount || (item && (item.amount || item.estimatedTotal)) || 0,
      paymentMethod: 'Cash',
      date: new Date().toISOString().split('T')[0]
    });
  };

  // Pay/Receive Confirmation from Sheet
  const handleConfirmPaymentSheet = () => {
    if (isActionLocked || !activePaymentSheet) return;
    setIsActionLocked(true);
    const { type, item, amount, date, paymentMethod, qty, unitPrice } = activePaymentSheet;
    const expenseId = 'exp-' + Date.now();

    if (type === 'bill') {
      const expTitle = `የ${item.name} ክፍያ (${toEthiopianShortDate(date)})`;
      const newExp = {
        id: expenseId,
        title: expTitle,
        category: item.category,
        amount: Number(amount),
        date: date || new Date().toISOString().split('T')[0],
        paymentMethod: paymentMethod || 'Cash',
        linkedPlan: item.name
      };
      const prevDueDate = item.nextDueDate;
      setActualExpenses(prev => [newExp, ...prev]);
      setRecurringExpenses(prev => prev.map(r => {
        if (r.id === item.id) {
          const nextMonth = new Date(r.nextDueDate);
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          return { ...r, nextDueDate: nextMonth.toISOString().split('T')[0] };
        }
        return r;
      }));
      triggerUndoableAction(`${item.name} (${amount} ETB) ተከፍሏል!`, () => {
        setActualExpenses(prev => prev.filter(e => e.id !== expenseId));
        setRecurringExpenses(prev => prev.map(r => r.id === item.id ? { ...r, nextDueDate: prevDueDate } : r));
      });

    } else if (type === 'fruit') {
      const actualTotal = (Number(qty) || item.quantity) * (Number(unitPrice) || item.estimatedUnitPrice);
      const newExp = {
        id: expenseId,
        title: `የ${item.itemName} ግዢ ከ${item.supplier}`,
        category: 'Ingredients',
        amount: actualTotal,
        date: date || new Date().toISOString().split('T')[0],
        paymentMethod: paymentMethod || 'Cash',
        linkedPlan: item.itemName
      };
      setActualExpenses(prev => [newExp, ...prev]);
      setPurchasePlans(prev => prev.map(p => {
        if (p.id === item.id) {
          return { ...p, status: 'Received', receivedQty: qty, actualUnitPrice: unitPrice, actualTotal };
        }
        return p;
      }));
      triggerUndoableAction(`${item.itemName} ደርሷል (${actualTotal} ETB ተመዝግቧል)!`, () => {
        setActualExpenses(prev => prev.filter(e => e.id !== expenseId));
        setPurchasePlans(prev => prev.map(p => p.id === item.id ? { ...p, status: 'Planned' } : p));
      });

    } else if (type === 'salary') {
      const newExp = {
        id: expenseId,
        title: `የደመወዝ ክፍያ - ${item.employeeName}`,
        category: 'Salary',
        amount: Number(amount),
        date: date || new Date().toISOString().split('T')[0],
        paymentMethod: paymentMethod || 'Cash',
        linkedPlan: `Salary: ${item.employeeName}`
      };
      setActualExpenses(prev => [newExp, ...prev]);
      setSalaryPlans(prev => prev.map(s => {
        if (s.id === item.id) {
          const newPaid = (s.paidAmount || 0) + Number(amount);
          const net = (s.netSalary !== undefined) ? s.netSalary : (s.baseSalary + (s.bonus || 0) - (s.deduction || 0));
          return { ...s, paidAmount: newPaid, status: newPaid >= net ? 'Paid' : 'Partially Paid' };
        }
        return s;
      }));
      triggerUndoableAction(`ለ${item.employeeName} ደመወዝ ተከፍሏል (${amount} ETB)!`, () => {
        setActualExpenses(prev => prev.filter(e => e.id !== expenseId));
        setSalaryPlans(prev => prev.map(s => s.id === item.id ? { ...s, paidAmount: 0, status: 'Pending' } : s));
      });
    }

    setActivePaymentSheet(null);
    setIsActionLocked(false);
  };

  // Repeat Last Fruit Order (ያለፈውን ግዢ ድገም)
  const handleRepeatLastFruitOrder = () => {
    const lastOrder = purchasePlans[0];
    if (!lastOrder) return;
    const newPur = {
      id: 'pur-' + Date.now(),
      itemName: lastOrder.itemName,
      quantity: lastOrder.quantity,
      unit: lastOrder.unit,
      estimatedUnitPrice: lastOrder.estimatedUnitPrice,
      estimatedTotal: lastOrder.estimatedTotal,
      supplier: lastOrder.supplier,
      plannedDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      status: 'Planned'
    };
    setPurchasePlans(prev => [newPur, ...prev]);
    triggerUndoableAction(`ያለፈው የ${lastOrder.itemName} ግዢ ተደግሟል!`, () => {
      setPurchasePlans(prev => prev.filter(p => p.id !== newPur.id));
    });
  };

  // Close the Day (ቀኑን ዝጋ) Handler
  const handleSaveCloseDay = (countedCash, note = '') => {
    const todayExpensesCash = actualExpenses
      .filter(e => e.date === new Date().toISOString().split('T')[0] && (e.paymentMethod === 'Cash' || !e.paymentMethod))
      .reduce((s, e) => s + e.amount, 0);
    const expectedCash = openingBalance + totalRealSales - todayExpensesCash;
    const diff = Number(countedCash) - expectedCash;
    const newClose = {
      id: 'dc-' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      expectedCash,
      countedCash: Number(countedCash),
      difference: diff,
      note: note || (diff === 0 ? 'ቀኑ ሙሉ በሙሉ ተመጣጥኗል' : `ልዩነት: ${diff} ETB`)
    };
    setDayCloses(prev => [newClose, ...prev]);
    setShowCloseDayModal(false);
    triggerUndoableAction(`የዕለቱ የካዝና ሂሳብ ተዘግቷል (${diff === 0 ? 'ተመጣጥኗል' : diff + ' ETB'} )!`, () => {
      setDayCloses(prev => prev.filter(c => c.id !== newClose.id));
    });
  };

  // Allocate funds to business goal
  const handleAllocateGoalFunds = (goalId, amount) => {
    setGoals(prev => prev.map(g => {
      if (g.id === goalId) {
        const nextAmt = (g.currentAmount || 0) + Number(amount);
        return { ...g, currentAmount: nextAmt, status: nextAmt >= g.targetAmount ? 'Reached' : 'Active' };
      }
      return g;
    }));
    triggerUndoableAction(`${amount} ETB ለግብ ተመድቧል!`, () => {
      setGoals(prev => prev.map(g => g.id === goalId ? { ...g, currentAmount: (g.currentAmount || 0) - Number(amount) } : g));
    });
  };

  // Convert Note to Task
  const handleConvertNoteToTask = (note) => {
    const newTask = {
      id: 'tsk-' + Date.now(),
      title: note.title,
      priority: 'High',
      dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      estimatedCost: 0,
      status: 'To do'
    };
    setTasks(prev => [newTask, ...prev]);
    triggerUndoableAction(`ከማስታወሻ አዲስ ተግባር ተፈጥሯል!`, () => {
      setTasks(prev => prev.filter(t => t.id !== newTask.id));
    });
  };

  // Inline Quick Expense Submission (Zero modal latency)
  const handleInlineExpenseSubmit = (e) => {
    e.preventDefault();
    const amt = Number(inlineExpenseAmount);
    if (!inlineExpenseTitle.trim() || isNaN(amt) || amt <= 0) return;
    const newId = 'exp-' + Date.now();
    const newExp = {
      id: newId,
      title: inlineExpenseTitle.trim(),
      category: inlineExpenseCategory,
      amount: amt,
      date: new Date().toISOString().split('T')[0],
      paymentMethod: inlineExpenseMethod,
      linkedPlan: 'Quick Entry'
    };
    setActualExpenses(prev => [newExp, ...prev]);
    setInlineExpenseTitle('');
    setInlineExpenseAmount('');
    triggerUndoableAction(`${newExp.title} (${amt.toLocaleString()} ETB) ተመዝግቧል!`, () => {
      setActualExpenses(prev => prev.filter(e => e.id !== newId));
    });
  };

  // Quick Add Submissions
  const handleQuickAddSubmit = (e) => {
    e.preventDefault();
    if (activeQuickAddModal === 'expense') {
      const amt = Number(formInputs.amount) || 0;
      const title = formInputs.title || 'Other Expense';
      const expId = 'exp-' + Date.now();
      const exp = {
        id: expId,
        title,
        category: formInputs.category || 'General',
        amount: amt,
        date: formInputs.date || new Date().toISOString().split('T')[0],
        paymentMethod: formInputs.paymentMethod || 'Cash',
        linkedPlan: 'Custom'
      };
      setActualExpenses(prev => [exp, ...prev]);
      triggerUndoableAction(`${title} (${amt.toLocaleString()} ETB) ተመዝግቧል!`, () => {
        setActualExpenses(prev => prev.filter(e => e.id !== expId));
      });
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
        supplier: formInputs.supplier || 'አትክልት ተራ መርካቶ',
        plannedDate: formInputs.plannedDate || new Date().toISOString().split('T')[0],
        status: 'Planned'
      };
      setPurchasePlans(prev => [pur, ...prev]);
    } else if (activeQuickAddModal === 'salary') {
      const base = Number(formInputs.baseSalary) || 4000;
      const bonus = Number(formInputs.bonus) || 0;
      const deduction = Number(formInputs.deduction) || 0;
      const sal = {
        id: 'sal-' + Date.now(),
        employeeName: formInputs.employeeName || 'Staff Member',
        role: formInputs.role || 'Employee',
        baseSalary: base,
        bonus,
        deduction,
        netSalary: base + bonus - deduction,
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
        status: 'To do'
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
        tag: formInputs.tag || 'Idea',
        createdAt: new Date().toISOString().split('T')[0]
      };
      setNotes(prev => [not, ...prev]);
    }
    setActiveQuickAddModal(null);
    setFormInputs({});
  };

  // Export full bundle to CSV
  const handleDownloadAllData = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Type,Title,Category,Amount,Date,Status\n" +
      actualExpenses.map(e => `Expense,"${e.title}",${e.category},${e.amount},${e.date},Paid`).join("\n") + "\n" +
      recurringExpenses.map(r => `Recurring,"${r.name}",${r.category},${r.amount},${r.nextDueDate},Active`).join("\n") + "\n" +
      purchasePlans.map(p => `Purchase,"${p.itemName}",${p.unit},${p.estimatedTotal},${p.plannedDate},${p.status}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `maraki_business_backup_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Data Clearing & Reset Handlers
  const handleClearAllExpenses = () => {
    if (actualExpenses.length === 0) return;
    if (!window.confirm('ሁሉንም የተመዘገቡ ወጪዎች ማጽዳት ይፈልጋሉ? (Are you sure you want to clear all recorded expenses?)')) {
      return;
    }
    const backup = [...actualExpenses];
    setActualExpenses([]);
    localStorage.setItem('maraki_actual_expenses', JSON.stringify([]));
    triggerUndoableAction('ሁሉም የተመዘገቡ ወጪዎች ተሰርዘዋል (All recorded expenses cleared)', () => {
      setActualExpenses(backup);
      localStorage.setItem('maraki_actual_expenses', JSON.stringify(backup));
    });
  };

  const handleClearAllOrders = () => {
    if (!window.confirm('የትዕዛዞች ታሪክን ሙሉ ለሙሉ ማጽዳት ይፈልጋሉ? (Clear all orders log?)')) {
      return;
    }
    if (onClearOrders) {
      onClearOrders();
    }
    triggerUndoableAction('የትዕዛዞች ታሪክ ተሰርዟል (All order history cleared)');
  };

  const handleClearAllPlans = () => {
    if (!window.confirm('ሁሉንም የታቀዱ ክፍያዎች፣ ግዢዎችና ደመወዞች ማጽዳት ይፈልጋሉ? (Clear all plans?)')) {
      return;
    }
    setRecurringExpenses([]);
    setPurchasePlans([]);
    setSalaryPlans([]);
    setTasks([]);
    setGoals([]);
    setNotes([]);
    localStorage.setItem('maraki_plan_recurring', '[]');
    localStorage.setItem('maraki_plan_purchases', '[]');
    localStorage.setItem('maraki_plan_salaries', '[]');
    localStorage.setItem('maraki_plan_tasks', '[]');
    localStorage.setItem('maraki_plan_goals', '[]');
    localStorage.setItem('maraki_plan_notes', '[]');
    triggerUndoableAction('ሁሉም የታቀዱ ክፍያዎችና እቅዶች ተሰርዘዋል (All plans cleared)');
  };

  const handleFullSystemReset = () => {
    if (!window.confirm('⚠️ ማስጠንቀቂያ፡ መላው የሲስተም መረጃ (ወጪዎች፣ እቅዶች፣ ግቦች፣ ተግባራት) ሙሉ ለሙሉ ባዶ ይሆናል። እርግጠኛ ነዎት? (WARNING: Full wipe of all system data. Continue?)')) {
      return;
    }
    setActualExpenses([]);
    setRecurringExpenses([]);
    setPurchasePlans([]);
    setSalaryPlans([]);
    setTasks([]);
    setGoals([]);
    setNotes([]);
    setDayCloses([]);
    if (onClearOrders) onClearOrders();
    localStorage.setItem('maraki_actual_expenses', '[]');
    localStorage.setItem('maraki_plan_recurring', '[]');
    localStorage.setItem('maraki_plan_purchases', '[]');
    localStorage.setItem('maraki_plan_salaries', '[]');
    localStorage.setItem('maraki_plan_tasks', '[]');
    localStorage.setItem('maraki_plan_goals', '[]');
    localStorage.setItem('maraki_plan_notes', '[]');
    localStorage.setItem('maraki_day_closes', '[]');
    triggerUndoableAction('መላው ሲስተም ባዶ ተደርጓል (Full system reset to clean slate)');
  };

  const handleRestoreDefaults = () => {
    if (!window.confirm('ወደ ማራኪ መደበኛ እቅዶች (የቤት ኪራይ፣ ደመወዝ፣ ፍራፍሬ) መመለስ ይፈልጋሉ?')) {
      return;
    }
    setRecurringExpenses(SAMPLE_RECURRING_EXPENSES);
    setPurchasePlans(SAMPLE_PURCHASE_PLANS);
    setSalaryPlans(SAMPLE_SALARY_PLANS);
    setTasks(SAMPLE_TASKS);
    setGoals(SAMPLE_GOALS);
    setNotes(SAMPLE_NOTES);
    localStorage.setItem('maraki_plan_recurring', JSON.stringify(SAMPLE_RECURRING_EXPENSES));
    localStorage.setItem('maraki_plan_purchases', JSON.stringify(SAMPLE_PURCHASE_PLANS));
    localStorage.setItem('maraki_plan_salaries', JSON.stringify(SAMPLE_SALARY_PLANS));
    localStorage.setItem('maraki_plan_tasks', JSON.stringify(SAMPLE_TASKS));
    localStorage.setItem('maraki_plan_goals', JSON.stringify(SAMPLE_GOALS));
    localStorage.setItem('maraki_plan_notes', JSON.stringify(SAMPLE_NOTES));
    triggerUndoableAction('ወደ ማራኪ መደበኛ እቅዶች ተመልሷል (Restored Maraki business plans)');
  };

  // ==============================================================
  // RENDER: VERSION 2.0 FIVE TABS ARCHITECTURE
  // ==============================================================
  return (
    <div className="space-y-6">

      {/* TOP HEADER: 5 CLEAN TABS + QUICK ADD (+) + SETTINGS (⚙️) */}
      <div className="bg-white p-2.5 sm:p-3 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sticky top-4 z-30 backdrop-blur-md">
        
        {/* Dynamic Scoped Tabs Bar */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {[
            { id: 'home', label: '🏠 Overview', badge: null },
            { id: 'income_analysis', label: '📈 Shift & Income Analysis', badge: null },
            { id: 'expenses', label: '💸 Expenses', badge: actualExpenses.length },
            { id: 'topay', label: '💳 Payables & Dues', badge: recurringExpenses.filter(r => r.id === 'rec-2').length + purchasePlans.filter(p => p.status === 'Planned').length },
            { id: 'reports', label: '📊 Budget & Day Closes', badge: null },
            { id: 'plans', label: '🎯 Goals, Tasks & Plans', badge: tasks.filter(t => t.status !== 'Done').length },
            { id: 'schedule', label: '📅 Schedule & Reminders', badge: null }
          ]
            .filter(tab => !Array.isArray(visibleTabs) || visibleTabs.includes(tab.id))
            .map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap active:scale-95 ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/25 scale-[1.02]'
                  : 'text-slate-600 hover:text-emerald-800 hover:bg-emerald-50'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge !== null && tab.badge > 0 && (
                <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                  activeTab === tab.id ? 'bg-emerald-200 text-emerald-950' : 'bg-slate-200 text-slate-700'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Quick Add (+) & Settings Header Controls */}
        <div className="flex items-center justify-end gap-2">
          {/* Quick Add Menu Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowQuickAddMenu(prev => !prev)}
              className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-700/20 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Add Plan / Expense</span>
            </button>

            {/* Quick Add Dropdown Menu */}
            {showQuickAddMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-3xl shadow-2xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 space-y-1">
                {[
                  { id: 'expense', label: '💸 Record Expense', desc: 'Cash or Telebirr operating cost' },
                  { id: 'purchase', label: '🍏 Fruit Purchase Plan', desc: 'Orange, mango, avocado, cups' },
                  { id: 'salary', label: '👥 Salary Obligation', desc: 'Monthly staff compensation' },
                  { id: 'task', label: '✅ New Action Task', desc: 'To-do priority list' },
                  { id: 'goal', label: '🎯 Business Goal', desc: 'Equipment or blender expansion' },
                  { id: 'note', label: '📝 Quick Note', desc: 'Supplier contacts or idea' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setActiveQuickAddModal(opt.id);
                      setShowQuickAddMenu(false);
                      setFormInputs({});
                    }}
                    className="w-full text-left p-2.5 rounded-2xl hover:bg-emerald-50 transition-all group"
                  >
                    <span className="font-black text-xs text-slate-900 group-hover:text-emerald-700 block">
                      {opt.label}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                      {opt.desc}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Settings Button */}
          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all active:scale-95"
            title="ቅንብሮች (Settings)"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* 10-SECOND UNDO TOAST NOTIFICATION */}
      {undoToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-3xl shadow-2xl border border-slate-700 flex items-center gap-4 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-black">{undoToast.message}</span>
          </div>
          <button
            type="button"
            onClick={undoToast.action}
            className="px-3 py-1 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1 transition-all active:scale-95"
          >
            <Undo className="w-3.5 h-3.5" />
            <span>Undo</span>
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. TAB: 🏠 HOME (OVERVIEW)                                     */}
      {/* ============================================================== */}
      {activeTab === 'home' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* 4 HERO KPI CARDS WITH TAP-TO-DRILL-DOWN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Current Balance */}
            <div 
              onClick={() => setActiveDrillDown('balance')}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer select-none"
            >
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">CURRENT CASH BALANCE</span>
                <Wallet className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-900 tracking-tight">{currentBalance.toLocaleString()}</span>
                <span className="text-xs font-bold text-slate-500">ETB</span>
              </div>
              <p className="text-[11px] font-bold text-emerald-600 mt-2 flex items-center gap-1">
                <span>+{totalRealSales.toLocaleString()} ETB today's sales</span>
                <span className="text-slate-400 font-normal">| Details →</span>
              </p>
            </div>

            {/* Card 2: Planned Expenses */}
            <div 
              onClick={() => setActiveDrillDown('planned')}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-rose-300 hover:shadow-md transition-all cursor-pointer select-none"
            >
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">PLANNED EXPENSES</span>
                <ArrowDownRight className="w-4 h-4 text-rose-500" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-rose-600 tracking-tight">{totalPlannedExpenses.toLocaleString()}</span>
                <span className="text-xs font-bold text-slate-500">ETB</span>
              </div>
              <p className="text-[11px] font-bold text-slate-400 mt-2">
                Rent: {unpaidRecurringTotal.toLocaleString()} · Fruit: {unpaidFruitTotal.toLocaleString()} · Payroll: {unpaidSalariesTotal.toLocaleString()}
              </p>
            </div>

            {/* Card 3: Expected Income */}
            <div 
              onClick={() => setActiveDrillDown('expected')}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-teal-300 hover:shadow-md transition-all cursor-pointer select-none"
            >
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">EXPECTED REVENUE</span>
                  <span className="text-[9px] font-black text-teal-700 bg-teal-100 px-1.5 py-0.5 rounded-md">forecast</span>
                </div>
                <TrendingUp className="w-4 h-4 text-teal-600" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-900 tracking-tight">{remainingExpectedIncome.toLocaleString()}</span>
                <span className="text-xs font-bold text-slate-500">ETB</span>
              </div>
              <p className="text-[11px] font-bold text-slate-400 mt-2">
                Monthly Target: {expectedMonthlyIncome.toLocaleString()} ETB
              </p>
            </div>

            {/* Card 4: Projected Remaining */}
            <div 
              onClick={() => setActiveDrillDown('projected')}
              className="bg-gradient-to-br from-emerald-800 via-teal-800 to-emerald-950 text-white rounded-3xl p-5 shadow-xl shadow-emerald-950/20 relative overflow-hidden group hover:border-emerald-400 transition-all cursor-pointer select-none border border-emerald-700/50"
            >
              <div className="flex items-center justify-between text-slate-300 mb-2">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-200">PROJECTED NET REMAINING</span>
                  <span className="text-[9px] font-black text-emerald-300 bg-emerald-400/20 px-1.5 py-0.5 rounded-md">forecast</span>
                </div>
                <Sparkles className="w-4 h-4 text-emerald-300" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-emerald-300 tracking-tight">{projectedRemaining.toLocaleString()}</span>
                <span className="text-xs font-bold text-emerald-100">ETB</span>
              </div>
              <p className="text-[11px] font-bold text-emerald-200/80 mt-2">
                Cash + Expected Revenue - Planned Expenses
              </p>
            </div>

          </div>

          {/* 3.2 CASH CHECK BANNER */}
          <div className={`p-4 sm:p-5 rounded-3xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
            cashCheckObligations.isCovered 
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' 
              : 'bg-amber-50 border-amber-300/80 text-amber-950'
          }`}>
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">💡</span>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-sm">
                    Cash Balance Health Check
                  </h4>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    cashCheckObligations.hasObligations 
                      ? (cashCheckObligations.isCovered ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900')
                      : 'bg-emerald-200 text-emerald-900'
                  }`}>
                    {cashCheckObligations.hasObligations 
                      ? (cashCheckObligations.isCovered ? '✅ Covered' : '⚠️ Short')
                      : '✓ Clean'}
                  </span>
                </div>
                {cashCheckObligations.hasObligations ? (
                  <>
                    <p className="text-xs font-bold mt-1 text-slate-700">
                      Need to Pay: <span className="font-black text-slate-900">{cashCheckObligations.need.toLocaleString()} ETB</span> {cashCheckObligations.breakdownText} · Cash Available: <span className="font-black text-slate-900">{currentBalance.toLocaleString()} ETB</span>
                    </p>
                    <p className="text-xs font-black mt-1 text-slate-900">
                      {cashCheckObligations.isCovered ? (
                        <span className="text-emerald-700">✓ Fully Covered — Discretionary Spending Buffer: {cashCheckObligations.safeToSpend.toLocaleString()} ETB</span>
                      ) : (
                        <span className="text-amber-900">⚠️ Cash Gap: {cashCheckObligations.gap.toLocaleString()} ETB — Daily sales target needed: ~{cashCheckObligations.salesPerDayNeeded.toLocaleString()} ETB</span>
                      )}
                    </p>
                  </>
                ) : (
                  <p className="text-xs font-bold mt-1 text-emerald-800">
                    No pending debts or due obligations · Available Cash: <span className="font-black">{currentBalance.toLocaleString()} ETB</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-end md:self-center">
              <button
                type="button"
                onClick={() => {
                  setFormInputs({ date: new Date().toISOString().split('T')[0], paymentMethod: 'Cash', category: 'Ingredients' });
                  setActiveQuickAddModal('expense');
                }}
                className="px-3.5 py-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black text-xs rounded-2xl flex items-center gap-1.5 shadow-md shadow-rose-700/20 active:scale-95 transition-all whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>+ Log Expense</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('topay')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl whitespace-nowrap active:scale-95 transition-all shadow-md shadow-emerald-700/20"
              >
                View Payables →
              </button>
            </div>
          </div>

          {/* 3.3 ACTION REQUIRED */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className={`w-4 h-4 ${actionRequiredItems.length > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
                <h3 className="text-sm font-black text-slate-900">Action Required (Due Soon / Overdue)</h3>
              </div>
              <button 
                type="button"
                onClick={() => setActiveTab('topay')}
                className="text-xs font-black text-emerald-700 hover:underline"
              >
                View All ({actionRequiredItems.length}) →
              </button>
            </div>

            {actionRequiredItems.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-1.5" />
                <p className="font-black text-xs text-slate-800">No Action Required</p>
                <p className="text-[11px] text-slate-400 mt-0.5">All bills and upcoming plans are up to date.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {actionRequiredItems.slice(0, 4).map((alert, idx) => (
                  <div 
                    key={idx} 
                    className={`p-4 rounded-2xl border flex items-center justify-between ${
                      alert.isOverdue ? 'bg-rose-50 border-rose-200/80' : 'bg-amber-50 border-amber-200/80'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-white text-[10px] font-black uppercase ${
                          alert.isOverdue ? 'bg-rose-600' : 'bg-amber-500'
                        }`}>
                          {alert.isOverdue ? 'Overdue' : 'Due Soon'}
                        </span>
                        <span className="font-black text-sm text-slate-900">{alert.title}</span>
                      </div>
                      <p className={`text-xs font-bold ${alert.isOverdue ? 'text-rose-700' : 'text-amber-800'}`}>
                        Due: {toEthiopianShortDate(alert.dueDate)} • {alert.amount.toLocaleString()} ETB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActivePaymentSheet({
                        type: alert.type,
                        item: alert.item,
                        amount: alert.amount,
                        date: new Date().toISOString().split('T')[0],
                        paymentMethod: alert.paymentMethod || 'Cash'
                      })}
                      className={`px-3.5 py-1.5 rounded-xl font-black text-xs shadow-sm transition-all active:scale-95 ${
                        alert.isOverdue ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                      }`}
                    >
                      {alert.isOverdue ? 'Pay Now' : 'Pay'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* TWO COLUMNS: MY TASKS & CLOSE THE DAY BANNER */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            
            {/* Column 1: My Tasks (Today / Overdue) */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-black text-slate-900">Action Tasks (My Tasks)</h3>
                </div>
                <button 
                  type="button"
                  onClick={() => { setActiveTab('plans'); setPlansSubTab('tasks'); }}
                  className="text-xs font-black text-emerald-700 hover:underline"
                >
                  View All ({tasks.length}) →
                </button>
              </div>

              {tasks.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                  <CheckSquare className="w-7 h-7 text-slate-300 mx-auto mb-1.5" />
                  <p className="font-black text-xs text-slate-700">No Tasks Recorded</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Use "+ Add Plan / Expense" to create a task.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tasks.slice(0, 3).map(task => (
                    <div key={task.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: t.status === 'Done' ? 'To do' : 'Done' } : t))}
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                            task.status === 'Done' ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                          }`}
                        >
                          {task.status === 'Done' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                        <div>
                          <span className={`text-xs font-black block ${task.status === 'Done' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                            {task.title}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">
                            Due: {toEthiopianShortDate(task.dueDate)} · {task.priority}
                          </span>
                        </div>
                      </div>
                      {task.estimatedCost > 0 && (
                        <span className="text-xs font-bold text-slate-600">{task.estimatedCost.toLocaleString()} ETB</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Column 2: Close the Day Call-out (ቀኑን ዝጋ) */}
            <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-5 shadow-lg shadow-emerald-950/20 border border-emerald-700/50 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🌅</span>
                    <h3 className="text-sm font-black text-emerald-300 uppercase tracking-wider">
                      Shift & Drawer Reconciliation (Close the Day)
                    </h3>
                  </div>
                  <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full font-bold text-emerald-200 border border-emerald-500/30">
                    Quick 10s Check
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-bold mt-2">
                  Count physical drawer cash and reconcile against system shift sales. Any discrepancy is automatically logged.
                </p>
              </div>

              <div className="bg-white/10 p-3 rounded-2xl flex items-center justify-between text-xs border border-white/10">
                <div>
                  <span className="text-emerald-200/80 block text-[10px] font-bold">Expected Drawer Cash</span>
                  <span className="text-lg font-black text-emerald-300">{currentBalance.toLocaleString()} ETB</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCloseDayModal(true)}
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md active:scale-95"
                >
                  Close Day →
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* TAB: 📈 SHIFT & INCOME ANALYSIS                                 */}
      {/* ============================================================== */}
      {activeTab === 'income_analysis' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <OwnerIncomeAnalysisReport orders={orders} />
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB: 📅 SCHEDULE (ቀን መቁጠሪያና ቀጠሮ - REMINDME UI)           */}
      {/* ============================================================== */}
      {activeTab === 'schedule' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <ScheduleCalendarRemindMe
            recurringExpenses={recurringExpenses}
            purchasePlans={purchasePlans}
            salaryPlans={salaryPlans}
            actualExpenses={actualExpenses}
            dayCloses={dayCloses}
            sentOrders={orders}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onInitiatePayment={handleInitiatePayment}
            onOpenSettings={() => setShowSettingsModal(true)}
            onOpenKitchen={() => {
              window.location.href = window.location.origin + '/?system=chef';
            }}
          />
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. TAB: 💳 TO PAY (ክፍያዎች)                                     */}
      {/* ============================================================== */}
      {activeTab === 'topay' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Header & Filter Row */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm">
                  💳
                </span>
                <h3 className="text-base font-black text-slate-900">
                  Payables & Scheduled Procurement
                </h3>
              </div>
              <p className="text-xs text-slate-400 font-bold mt-1">
                Shop rent, utilities, fruit inventory purchases, and staff salaries in one place
              </p>
            </div>

            {/* Filter Chips & List/Calendar Switch */}
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { id: 'all', label: 'All Payables' },
                { id: 'bills', label: '🏢 Recurring Bills' },
                { id: 'fruit', label: '🍏 Fruit Procurement' },
                { id: 'salary', label: '👥 Payroll' }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setToPayFilter(f.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-black transition-all ${
                    toPayFilter === f.id
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}

              <div className="h-5 w-[1px] bg-slate-200 mx-1 hidden sm:block" />

              <button
                type="button"
                onClick={() => setToPayView(v => v === 'list' ? 'calendar' : 'list')}
                className="px-3 py-1 rounded-xl text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-all flex items-center gap-1"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{toPayView === 'list' ? '📅 Calendar View' : '📋 List View'}</span>
              </button>

              <button
                type="button"
                onClick={handleRepeatLastFruitOrder}
                className="px-3 py-1 rounded-xl text-xs font-black bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100 transition-all flex items-center gap-1"
                title="Repeat the previous fruit procurement plan"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Repeat Last Order</span>
              </button>

              <button
                type="button"
                onClick={() => setShowWaiterDebtsModal(true)}
                className="px-3 py-1 rounded-xl text-xs font-black bg-emerald-50 text-emerald-900 border border-emerald-300 hover:bg-emerald-100 transition-all flex items-center gap-1.5 shadow-2xs"
                title="Waiter Uncollected Pending Debts Ledger"
              >
                <Clock className="w-3.5 h-3.5 text-emerald-700" />
                <span>⏳ Waiter Debts ({activeWaiterDebtsCount})</span>
              </button>
            </div>
          </div>

          {/* LIST VIEW */}
          {toPayView === 'list' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden p-5 space-y-4">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-black border-b border-slate-200/60">
                  <tr>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Item / Obligation</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                  {recurringExpenses.length === 0 && purchasePlans.length === 0 && salaryPlans.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <h4 className="font-black text-sm text-slate-800">
                          No Scheduled Payables
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto font-medium">
                          All business obligations are clear. To plan rent, utilities, fruit, or payroll, use "+ Add Plan / Expense" above.
                        </p>
                      </td>
                    </tr>
                  )}
                  
                  {/* Recurring Bills */}
                  {(toPayFilter === 'all' || toPayFilter === 'bills') && recurringExpenses.map(item => {
                    const isOverdue = item.id === 'rec-2';
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-black text-slate-900 whitespace-nowrap">
                          {toEthiopianShortDate(item.nextDueDate)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-black text-slate-900 block">{item.name}</span>
                          <span className="text-[10px] text-slate-400">Repeats: {item.frequency}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-700">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-black text-slate-900">
                          {item.amount.toLocaleString()} ETB
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            isOverdue ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {isOverdue ? '🔴 Overdue' : '🟡 Due Soon'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setActivePaymentSheet({
                              type: 'bill',
                              item,
                              amount: item.amount,
                              date: new Date().toISOString().split('T')[0],
                              paymentMethod: 'Cash'
                            })}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs transition-all shadow-sm active:scale-95"
                          >
                            ክፈል (Pay)
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Fruit Purchases */}
                  {(toPayFilter === 'all' || toPayFilter === 'fruit') && purchasePlans.map(item => {
                    const isRec = item.status === 'Received';
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-black text-slate-900 whitespace-nowrap">
                          {toEthiopianShortDate(item.plannedDate)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-black text-slate-900 block">{item.itemName} ({item.quantity} {item.unit})</span>
                          <span className="text-[10px] text-slate-400">አቅራቢ: {item.supplier}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-100 text-teal-800">
                            Fruit
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-black text-slate-900">
                          {item.estimatedTotal.toLocaleString()} ETB
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            isRec ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {isRec ? '🟢 Received' : 'Planned'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {isRec ? (
                            <span className="text-xs text-slate-400 font-bold">ደርሷል ✓</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setActivePaymentSheet({
                                type: 'fruit',
                                item,
                                amount: item.estimatedTotal,
                                qty: item.quantity,
                                unitPrice: item.estimatedUnitPrice,
                                date: new Date().toISOString().split('T')[0],
                                paymentMethod: 'Cash'
                              })}
                              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-xl text-xs transition-all shadow-sm active:scale-95"
                            >
                              እንደደረሰ መዝግብ
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Staff Salaries */}
                  {(toPayFilter === 'all' || toPayFilter === 'salary') && salaryPlans.map(item => {
                    const net = (item.netSalary !== undefined) ? item.netSalary : (item.baseSalary + (item.bonus || 0) - (item.deduction || 0));
                    const isPaid = item.status === 'Paid';
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-black text-slate-900 whitespace-nowrap">
                          {toEthiopianShortDate(item.payDate)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-black text-slate-900 block">{item.employeeName}</span>
                          <span className="text-[10px] text-slate-400">{item.role}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800">
                            Salary
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-black text-slate-900">
                          {net.toLocaleString()} ETB
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {isPaid ? '🟢 Paid' : 'Pending'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {isPaid ? (
                            <span className="text-xs text-slate-400 font-bold">ተከፍሏል ✓</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setActivePaymentSheet({
                                type: 'salary',
                                item,
                                amount: net,
                                date: new Date().toISOString().split('T')[0],
                                paymentMethod: 'Cash'
                              })}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs transition-all shadow-sm active:scale-95"
                            >
                              ደመወዝ ክፈል
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                </tbody>
              </table>
            </div>
          )}

          {/* CALENDAR VIEW (FULL REMINDME SCHEDULE UI) */}
          {toPayView === 'calendar' && (
            <div className="space-y-4">
              <ScheduleCalendarRemindMe
                recurringExpenses={recurringExpenses}
                purchasePlans={purchasePlans}
                salaryPlans={salaryPlans}
                actualExpenses={actualExpenses}
                dayCloses={dayCloses}
                sentOrders={orders}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onInitiatePayment={handleInitiatePayment}
                onOpenSettings={() => setShowSettingsModal(true)}
                onOpenKitchen={() => {
                  window.location.href = window.location.origin + '/?system=chef';
                }}
              />
            </div>
          )}

        </div>
      )}

      {/* ============================================================== */}
      {/* 3. TAB: 💸 EXPENSES                                            */}
      {/* ============================================================== */}
      {activeTab === 'expenses' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Header Action Bar */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-black text-sm">
                  💸
                </span>
                <h3 className="text-base font-black text-slate-900">
                  Business Expenses Ledger
                </h3>
              </div>
              <p className="text-xs text-slate-400 font-bold mt-1">
                Ice, lemons, cleaning supplies, transportation, and daily operating costs paid in cash or digitally
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setFormInputs({ date: new Date().toISOString().split('T')[0], paymentMethod: 'Cash', category: 'Ingredients' });
                setActiveQuickAddModal('expense');
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black text-xs rounded-2xl flex items-center gap-2 transition-all shadow-md shadow-rose-700/20 active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Record Expense</span>
            </button>
          </div>

          {/* 4 EXPENSE SUMMARY CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-1">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Total Expenses</span>
              <p className="text-2xl font-black text-rose-600">{totalActualExpenses.toLocaleString()} <span className="text-xs font-bold text-slate-500">ETB</span></p>
              <p className="text-[11px] text-slate-400 font-bold">{actualExpenses.length} recorded entries</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-1">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Today's Expenses</span>
              <p className="text-2xl font-black text-slate-900">
                {actualExpenses
                  .filter(e => e.date === new Date().toISOString().split('T')[0])
                  .reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
                  .toLocaleString()} <span className="text-xs font-bold text-slate-500">ETB</span>
              </p>
              <p className="text-[11px] text-slate-400 font-bold">Today only</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-1">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Cash Paid</span>
              <p className="text-2xl font-black text-slate-900">
                {actualExpenses
                  .filter(e => e.paymentMethod === 'Cash' || !e.paymentMethod)
                  .reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
                  .toLocaleString()} <span className="text-xs font-bold text-slate-500">ETB</span>
              </p>
              <p className="text-[11px] text-slate-400 font-bold">From Cash Drawer</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-1">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Digital Paid</span>
              <p className="text-2xl font-black text-emerald-700">
                {actualExpenses
                  .filter(e => e.paymentMethod === 'Telebirr' || e.paymentMethod === 'Bank / Telebirr' || e.paymentMethod === 'CBE Birr')
                  .reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
                  .toLocaleString()} <span className="text-xs font-bold text-slate-500">ETB</span>
              </p>
              <p className="text-[11px] text-slate-400 font-bold">Telebirr / Bank Transfer</p>
            </div>
          </div>

          {/* INLINE QUICK EXPENSE ENTRY (ZERO MODAL LATENCY) */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-3.5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-black text-sm">
                  💸
                </div>
                <div>
                  <h4 className="font-black text-sm text-slate-900">
                    Quick Expense Entry
                  </h4>
                  <p className="text-[11px] text-slate-400 font-bold">
                    Log directly into ledger with 10-second undo
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFormInputs({ date: new Date().toISOString().split('T')[0], paymentMethod: 'Cash', category: 'Ingredients' });
                  setActiveQuickAddModal('expense');
                }}
                className="text-xs font-black text-emerald-700 hover:text-emerald-800 flex items-center gap-1 active:scale-95 transition-all"
              >
                <span>Detailed Form</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleInlineExpenseSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                {/* Title Input */}
                <div className="sm:col-span-5">
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ለምሳሌ፡ አቮካዶ፣ ወተት፣ ሰራተኛ ምሳ፣ በረዶ..."
                    value={inlineExpenseTitle}
                    onChange={(e) => setInlineExpenseTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none transition-all"
                  />
                </div>

                {/* Amount Input */}
                <div className="sm:col-span-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                    መጠን (Amount ETB)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      placeholder="0.00"
                      value={inlineExpenseAmount}
                      onChange={(e) => setInlineExpenseAmount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-2xl pl-3.5 pr-12 py-2.5 text-xs font-black text-slate-900 outline-none transition-all"
                    />
                    <span className="absolute right-3.5 top-2.5 text-[11px] font-black text-slate-400">
                      ETB
                    </span>
                  </div>
                </div>

                {/* Category Select */}
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                    ዘርፍ (Category)
                  </label>
                  <select
                    value={inlineExpenseCategory}
                    onChange={(e) => setInlineExpenseCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-2xl px-3 py-2.5 text-xs font-bold text-slate-800 outline-none transition-all"
                  >
                    <option value="Ingredients">🥑 ፍራፍሬ/ግብአት</option>
                    <option value="Transport">🚕 ትራንስፖርት</option>
                    <option value="Maintenance">🧹 ጽዳት/ጥገና</option>
                    <option value="Supplies">📦 ማሸጊያ</option>
                    <option value="Utilities">⚡ መብራት/ውሃ</option>
                    <option value="Rent">🏢 ኪራይ</option>
                    <option value="Salary">👥 ደመወዝ</option>
                    <option value="General">✨ ጠቅላላ</option>
                  </select>
                </div>

                {/* Submit Button */}
                <div className="sm:col-span-2 flex flex-col justify-end">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black text-xs rounded-2xl flex items-center justify-center gap-1.5 shadow-md shadow-rose-700/20 active:scale-95 transition-all"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>ወጪ መዝግብ</span>
                  </button>
                </div>
              </div>

              {/* Quick Preset Pills & Payment Method Selector */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-black text-slate-400 uppercase mr-1">ፈጣን መጠን:</span>
                  {[50, 100, 200, 300, 500, 1000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setInlineExpenseAmount(amt.toString())}
                      className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-black transition-all active:scale-95"
                    >
                      +{amt} ETB
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl self-stretch sm:self-auto justify-center">
                  {[
                    { id: 'Cash', label: '💵 ጥሬ ገንዘብ' },
                    { id: 'Telebirr', label: '📱 ቴሌብር' },
                    { id: 'CBE Birr', label: '🏦 ሲቢኢ' }
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setInlineExpenseMethod(m.id)}
                      className={`px-3 py-1 rounded-xl text-[11px] font-black transition-all ${
                        inlineExpenseMethod === m.id ? 'bg-white text-slate-900 shadow-2xs font-black' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          </div>

          {/* ONE-TAP QUICK EXPENSE PRESETS WITH 10S UNDO */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 rounded-3xl shadow-lg shadow-slate-950/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-300">
                  ፈጣን የዕለት ወጪ መመዝገቢያ (One-Tap Quick Presets)
                </h4>
              </div>
              <span className="text-[10px] text-slate-400 font-bold">አንዴ በመንካት ወዲያውኑ ይመዘገባል (10 ሰከንድ ቀልብስ አለው)</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
              {[
                { title: 'የበረዶ ግዢ (Ice)', category: 'Ingredients', amount: 350, emoji: '🧊' },
                { title: 'ሎሚና ዝንጅብል (Lemons)', category: 'Ingredients', amount: 250, emoji: '🍋' },
                { title: 'ታክሲና ትራንስፖርት (Transport)', category: 'Transport', amount: 150, emoji: '🚕' },
                { title: 'ሳሙናና ማጽጃ (Cleaning)', category: 'Maintenance', amount: 480, emoji: '🧹' },
                { title: 'ተጨማሪ ማሸጊያ (Emergency Boxes)', category: 'Supplies', amount: 500, emoji: '📦' },
                { title: 'የስኳር ግዢ (Sugar 10kg)', category: 'Ingredients', amount: 1100, emoji: '🧂' }
              ].map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickPreset(preset.title, preset.category, preset.amount, 'Cash')}
                  className="bg-white/10 hover:bg-white/20 active:scale-95 border border-white/10 rounded-2xl p-3 text-left transition-all group flex flex-col justify-between gap-2"
                >
                  <span className="text-2xl">{preset.emoji}</span>
                  <div>
                    <span className="font-black text-xs text-white block truncate leading-tight group-hover:text-amber-300">
                      {preset.title.split(' ')[0]}
                    </span>
                    <span className="text-xs font-black text-emerald-400 block mt-0.5">
                      +{preset.amount} ETB
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* FILTER TOOLBAR & EXPENSES TABLE */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden space-y-4 p-5">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 flex-wrap flex-1">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider mr-1">ዘርፍ:</span>
                {[
                  { id: 'all', label: 'ሁሉም (All)' },
                  { id: 'Ingredients', label: 'ፍራፍሬና ግብአት' },
                  { id: 'Rent', label: 'ኪራይ' },
                  { id: 'Utilities', label: 'መብራት/ውሃ' },
                  { id: 'Salary', label: 'ደመወዝ' },
                  { id: 'Transport', label: 'ትራንስፖርት' },
                  { id: 'Maintenance', label: 'ጽዳት/ጥገና' },
                  { id: 'Supplies', label: 'ማሸጊያ' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setExpenseCategoryFilter(cat.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-black transition-all ${
                      expenseCategoryFilter === cat.id 
                        ? 'bg-slate-900 text-white shadow-2xs' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-56">
                  <input
                    type="text"
                    placeholder="ፈልግ / Search expense..."
                    value={expenseSearch}
                    onChange={(e) => setExpenseSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5 text-xs font-bold text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {actualExpenses.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllExpenses}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 border border-rose-200 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all whitespace-nowrap shadow-2xs"
                    title="ሁሉንም የተመዘገቡ ወጪዎች አጽዳ"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>ወጪዎችን አጽዳ ({actualExpenses.length})</span>
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-black border-b border-slate-200/60">
                  <tr>
                    <th className="py-3 px-4">ቀን (Date)</th>
                    <th className="py-3 px-4">የወጪው ስም (Description)</th>
                    <th className="py-3 px-4">ዘርፍ (Category)</th>
                    <th className="py-3 px-4">የክፍያ ዘዴ (Method)</th>
                    <th className="py-3 px-4">የተከፈለ መጠን (Amount)</th>
                    <th className="py-3 px-4 text-right">እርምጃ (Action)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                  {actualExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <h4 className="font-black text-sm text-slate-800">
                          እስካሁን የተመዘገበ ወጪ የለም (No Expenses Recorded)
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto font-medium">
                          የቢዝነሱ የሂሳብ መዝገብ ንፁህ ነው። አዲስ ወጪዎችን ለመመዝገብ ከላይ ያለውን ፈጣን መመዝገቢያ ወይም "+ አዲስ ወጪ መዝግብ" ይጠቀሙ።
                        </p>
                      </td>
                    </tr>
                  ) : actualExpenses
                    .filter(exp => {
                      if (expenseCategoryFilter !== 'all' && exp.category !== expenseCategoryFilter) return false;
                      if (expenseSearch.trim()) {
                        const q = expenseSearch.toLowerCase().trim();
                        return (exp.title || '').toLowerCase().includes(q) || (exp.category || '').toLowerCase().includes(q) || (exp.date || '').includes(q);
                      }
                      return true;
                    }).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-xs font-bold">
                        ለዚህ ፈልጎ የተገኘ ወጪ የለም
                      </td>
                    </tr>
                  ) : (
                    actualExpenses
                      .filter(exp => {
                        if (expenseCategoryFilter !== 'all' && exp.category !== expenseCategoryFilter) return false;
                        if (expenseSearch.trim()) {
                          const q = expenseSearch.toLowerCase().trim();
                          return (exp.title || '').toLowerCase().includes(q) || (exp.category || '').toLowerCase().includes(q) || (exp.date || '').includes(q);
                        }
                        return true;
                      })
                      .map(exp => (
                        <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">{toEthiopianShortDate(exp.date)}</td>
                          <td className="py-3.5 px-4">
                            <span className="font-black text-slate-900 block">{exp.title}</span>
                            {exp.linkedPlan && (
                              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-block mt-0.5">
                                {exp.linkedPlan}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-200">
                              {exp.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            <span className="inline-flex items-center gap-1">
                              {exp.paymentMethod === 'Telebirr' && '📱'}
                              {exp.paymentMethod === 'Cash' && '💵'}
                              {exp.paymentMethod === 'CBE Birr' && '🏦'}
                              <span>{exp.paymentMethod || 'Cash'}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-black text-rose-600">
                            -{exp.amount.toLocaleString()} ETB
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                const deleted = exp;
                                setActualExpenses(prev => prev.filter(e => e.id !== exp.id));
                                triggerUndoableAction(`${deleted.title} ተሰርዟል!`, () => {
                                  setActualExpenses(prev => [deleted, ...prev]);
                                });
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                              title="ወጪውን ሰርዝ"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* 4. TAB: 🎯 PLANS (እቅዶች)                                       */}
      {/* ============================================================== */}
      {activeTab === 'plans' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Sub-Tabs Selector */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            {[
              { id: 'goals', label: '🎯 Business Goals', count: goals.length },
              { id: 'tasks', label: '📋 Tasks & Operations', count: tasks.filter(t => t.status !== 'Done').length },
              { id: 'notes', label: '📝 Ideas & Notes', count: notes.length }
            ].map(sub => (
              <button
                key={sub.id}
                type="button"
                onClick={() => setPlansSubTab(sub.id)}
                className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 ${
                  plansSubTab === sub.id 
                    ? 'bg-emerald-600 text-white shadow-sm' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{sub.label}</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-white/20 rounded-full font-bold">{sub.count}</span>
              </button>
            ))}
          </div>

          {/* SUB-SECTION 1: GOALS */}
          {plansSubTab === 'goals' && (
            <div className="space-y-4">
              {goals.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 border border-slate-200/80 text-center">
                  <Target className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <h4 className="font-black text-sm text-slate-800">ምንም የንግድ ግብ አልተመዘገበም (No Goals Yet)</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    የመሳሪያ ግዢ ወይም የማስፋፊያ ግብ ለማስቀመጥ ከላይ "+ አዲስ እቅድ/ወጪ" ይጠቀሙ።
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {goals.map(goal => {
                    const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
                    const stillNeeded = Math.max(0, goal.targetAmount - goal.currentAmount);
                    return (
                      <div key={goal.id} className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between">
                        <div className="space-y-2">
                          <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                            {goal.status}
                          </span>
                          <h4 className="font-black text-sm text-slate-900">{goal.title}</h4>
                          <div className="flex items-baseline justify-between text-xs pt-1">
                            <span className="font-bold text-slate-500">ዒላማ: {goal.targetAmount.toLocaleString()} ETB</span>
                            <span className="font-black text-emerald-600">{pct}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                          </div>
                          <p className="text-[11px] font-bold text-slate-400">
                            ቀሪ: {stillNeeded.toLocaleString()} ETB · ቀነ-ገደብ: {toEthiopianShortDate(goal.deadline)}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const amt = prompt('ምን ያህል ገንዘብ መመደብ ይፈልጋሉ? (Amount in ETB):', '1000');
                            if (amt && Number(amt) > 0) handleAllocateGoalFunds(goal.id, Number(amt));
                          }}
                          className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ ገንዘብ መድብ (Allocate Funds)</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SUB-SECTION 2: TASKS */}
          {plansSubTab === 'tasks' && (
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="font-black text-sm text-slate-900">የስራ እቅዶችና ተግባራት (Operational Tasks)</h4>
                <button
                  type="button"
                  onClick={() => { setActiveQuickAddModal('task'); setFormInputs({}); }}
                  className="px-3 py-1 bg-slate-900 text-white font-black text-xs rounded-xl"
                >
                  + አዲስ ተግባር
                </button>
              </div>

              <div className="space-y-2">
                {tasks.length === 0 ? (
                  <div className="py-8 text-center text-slate-400">
                    <CheckSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-black text-xs text-slate-700">ምንም የስራ ተግባር አልተመዘገበም (No Tasks Yet)</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">አዲስ ተግባር ለማከል "+ አዲስ ተግባር" ይጫኑ።</p>
                  </div>
                ) : (
                  tasks.map(task => (
                    <div key={task.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: t.status === 'Done' ? 'To do' : 'Done' } : t))}
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                            task.status === 'Done' ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                          }`}
                        >
                          {task.status === 'Done' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                        <div>
                          <span className={`text-xs font-black block ${task.status === 'Done' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                            {task.title}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">
                            ቀን: {toEthiopianShortDate(task.dueDate)} · ቅድሚያ: {task.priority}
                          </span>
                        </div>
                      </div>
                      {task.estimatedCost > 0 && (
                        <span className="text-xs font-black text-slate-700">{task.estimatedCost.toLocaleString()} ETB</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* SUB-SECTION 3: NOTES */}
          {plansSubTab === 'notes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-sm text-slate-900">የአቅራቢዎችና የንግድ ሃሳቦች ማስታወሻ (Ideas & Notes)</h4>
                <button
                  type="button"
                  onClick={() => { setActiveQuickAddModal('note'); setFormInputs({}); }}
                  className="px-3.5 py-1.5 bg-slate-900 text-white font-black text-xs rounded-xl"
                >
                  + ማስታወሻ ጻፍ
                </button>
              </div>

              {notes.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 border border-slate-200/80 text-center">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-black text-xs text-slate-700">ምንም ማስታወሻ የለም (No Notes Yet)</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">የአቅራቢዎች አድራሻ ወይም አዳዲስ ሀሳቦችን ለማስቀመጥ "+ ማስታወሻ ጻፍ" ይጫኑ።</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {notes.map(note => (
                    <div key={note.id} className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-3 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-700">
                            {note.tag}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">{toEthiopianShortDate(note.createdAt)}</span>
                        </div>
                        <h4 className="font-black text-sm text-slate-900">{note.title}</h4>
                        <p className="text-xs text-slate-600 font-bold mt-1 whitespace-pre-wrap">{note.content}</p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleConvertNoteToTask(note)}
                          className="text-xs font-black text-emerald-700 hover:underline flex items-center gap-1"
                        >
                          <CheckSquare className="w-3.5 h-3.5" />
                          <span>ወደ ተግባር ቀይር (Make Task)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setNotes(prev => prev.filter(n => n.id !== note.id))}
                          className="text-xs text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* ============================================================== */}
      {/* 5. TAB: 📊 REPORTS (ሪፖርቶች)                                   */}
      {/* ============================================================== */}
      {activeTab === 'reports' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Sub-Tabs: Calendar Reports & Schedule / Budget vs Actual / Orders Audit / Day Closes */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { id: 'calendar', label: '📅 Calendar Schedule & Reminders' },
                { id: 'budget', label: '📊 Budget vs Actual' },
                { id: 'audit', label: `🧾 Orders Audit (${orders.length})` },
                { id: 'closes', label: '🌅 Daily Drawer Closes' }
              ].map(sub => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setReportsSubTab(sub.id)}
                  className={`px-4 py-2 rounded-2xl text-xs font-black transition-all ${
                    reportsSubTab === sub.id 
                      ? 'bg-emerald-600 text-white shadow-sm' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleDownloadAllData}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ኤክሴል አውርድ (Export All CSV)</span>
            </button>
          </div>

          {/* ============================================================== */}
          {/* REPORT SUB 0: CALENDAR REPORT & SCHEDULE (EXACT REMINDME UI)   */}
          {/* ============================================================== */}
          {reportsSubTab === 'calendar' && (
            <div className="space-y-4">
              <ScheduleCalendarRemindMe
                recurringExpenses={recurringExpenses}
                purchasePlans={purchasePlans}
                salaryPlans={salaryPlans}
                actualExpenses={actualExpenses}
                dayCloses={dayCloses}
                sentOrders={orders}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onInitiatePayment={handleInitiatePayment}
                onOpenSettings={() => setShowSettingsModal(true)}
                onOpenKitchen={() => {
                  window.location.href = window.location.origin + '/?system=chef';
                }}
              />
            </div>
          )}

          {/* REPORT SUB 1: BUDGET VS ACTUAL */}
          {reportsSubTab === 'budget' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 space-y-4">
              <div>
                <h3 className="font-black text-base text-slate-900">የኅዳር ወር የበጀትና ትክክለኛ ወጪ ንፅፅር (Budget vs Actual)</h3>
                <p className="text-xs text-slate-400 font-bold mt-0.5">የታቀዱ ወጪዎች ከእውነተኛ ወጪዎች ጋር ሲነፃፀሩ</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-black border-b border-slate-200/60">
                    <tr>
                      <th className="py-3 px-4">የወጪ ዘርፍ (Category)</th>
                      <th className="py-3 px-4">የታቀደ በጀት (Planned)</th>
                      <th className="py-3 px-4">ትክክለኛ ወጪ (Actual)</th>
                      <th className="py-3 px-4">ልዩነት (Variance)</th>
                      <th className="py-3 px-4 text-right">ሁኔታ (Status)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                    <tr>
                      <td className="py-3.5 px-4 font-black text-slate-900">🏢 የቤት ኪራይና መደበኛ ሂሳቦች (Recurring Bills)</td>
                      <td className="py-3.5 px-4">{unpaidRecurringTotal.toLocaleString()} ETB</td>
                      <td className="py-3.5 px-4 text-emerald-700">0 ETB</td>
                      <td className="py-3.5 px-4 text-rose-600">-{unpaidRecurringTotal.toLocaleString()} ETB</td>
                      <td className="py-3.5 px-4 text-right"><span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px]">Due Soon</span></td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-black text-slate-900">🍏 የፍራፍሬና ማሸጊያ ግዢዎች (Fruit Purchases)</td>
                      <td className="py-3.5 px-4">{unpaidFruitTotal.toLocaleString()} ETB</td>
                      <td className="py-3.5 px-4 text-emerald-700">{actualExpenses.filter(e => e.category === 'Ingredients').reduce((s, e) => s + e.amount, 0).toLocaleString()} ETB</td>
                      <td className="py-3.5 px-4 text-slate-700">-{unpaidFruitTotal.toLocaleString()} ETB</td>
                      <td className="py-3.5 px-4 text-right"><span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px]">Active</span></td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-black text-slate-900">👥 የሰራተኞች ደመወዝ (Staff Salaries)</td>
                      <td className="py-3.5 px-4">{unpaidSalariesTotal.toLocaleString()} ETB</td>
                      <td className="py-3.5 px-4 text-emerald-700">0 ETB</td>
                      <td className="py-3.5 px-4 text-rose-600">-{unpaidSalariesTotal.toLocaleString()} ETB</td>
                      <td className="py-3.5 px-4 text-right"><span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px]">Due ኅዳር 22</span></td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-black text-slate-900">⚡ ዕለታዊ ያልታቀዱ ወጪዎች (Unplanned / Running)</td>
                      <td className="py-3.5 px-4">—</td>
                      <td className="py-3.5 px-4 text-rose-600">{actualExpenses.filter(e => !e.linkedPlan || e.linkedPlan === 'One-Tap Preset').reduce((s, e) => s + e.amount, 0).toLocaleString()} ETB</td>
                      <td className="py-3.5 px-4 text-slate-500">—</td>
                      <td className="py-3.5 px-4 text-right"><span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px]">Tracked</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* REPORT SUB 2: ORDERS AUDIT LOG */}
          {reportsSubTab === 'audit' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-base text-slate-900">የትዕዛዞች ኦዲት መዝገብ (Orders Audit Log)</h3>
                  <p className="text-xs text-slate-400 font-bold mt-0.5">በኩሽና ፖስ ሲስተም የተመዘገቡ ሙሉ ትዕዛዞች</p>
                </div>
                {onSwitchToOrdersLog && (
                  <button
                    type="button"
                    onClick={onSwitchToOrdersLog}
                    className="px-3.5 py-1.5 bg-slate-900 text-white font-black text-xs rounded-xl"
                  >
                    ሙሉ ኦዲት ማሳያ →
                  </button>
                )}
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-10 text-slate-400 font-bold text-xs">
                  እስካሁን የተመዘገበ ትዕዛዝ የለም (No orders logged yet)
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-black border-b border-slate-200/60">
                      <tr>
                        <th className="py-3 px-4">ቀን (Date)</th>
                        <th className="py-3 px-4">የምግብ ዝርዝር (Food)</th>
                        <th className="py-3 px-4">ፈረቃ (Shift)</th>
                        <th className="py-3 px-4">አስተናጋጅ (Waiter)</th>
                        <th className="py-3 px-4">ዋጋ (Amount)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                      {orders.slice(0, 10).map((ord, idx) => (
                        <tr key={ord.id || idx}>
                          <td className="py-3 px-4">{ord.ethiopianDate || toEthiopianShortDate(ord.createdAt)}</td>
                          <td className="py-3 px-4 font-black text-slate-900">{ord.foodSummary || (ord.items && ord.items.map(i => `${i.qty}x ${i.name}`).join(', '))}</td>
                          <td className="py-3 px-4">{ord.shiftType || 'Day Shift'}</td>
                          <td className="py-3 px-4">{ord.waiterName || 'Staff'}</td>
                          <td className="py-3 px-4 font-black text-emerald-700">{(ord.totalAmount || 0).toLocaleString()} ETB</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* REPORT SUB 3: DAY CLOSES HISTORY */}
          {reportsSubTab === 'closes' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-base text-slate-900">የቀን መዝጊያዎች ታሪክ (Day Closes History)</h3>
                  <p className="text-xs text-slate-400 font-bold mt-0.5">ዕለታዊ የካዝና ጥሬ ገንዘብ ፍተሻና የልዩነት መዝገብ</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCloseDayModal(true)}
                  className="px-3.5 py-1.5 bg-slate-900 text-white font-black text-xs rounded-xl"
                >
                  + የዛሬውን ቀን ዝጋ
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-black border-b border-slate-200/60">
                    <tr>
                      <th className="py-3 px-4">ቀን (Date)</th>
                      <th className="py-3 px-4">የተገመተ ገንዘብ (Expected)</th>
                      <th className="py-3 px-4">የተቆጠረ ገንዘብ (Counted)</th>
                      <th className="py-3 px-4">ልዩነት (Difference)</th>
                      <th className="py-3 px-4">ማስታወሻ (Note)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                    {dayCloses.map(dc => (
                      <tr key={dc.id}>
                        <td className="py-3 px-4 font-black">{toEthiopianShortDate(dc.date)}</td>
                        <td className="py-3 px-4">{dc.expectedCash.toLocaleString()} ETB</td>
                        <td className="py-3 px-4 font-black text-slate-900">{dc.countedCash.toLocaleString()} ETB</td>
                        <td className="py-3 px-4">
                          <span className={`font-black px-2 py-0.5 rounded-full text-[10px] ${
                            dc.difference === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'
                          }`}>
                            {dc.difference === 0 ? '0 ETB (Matched)' : `${dc.difference} ETB`}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">{dc.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ============================================================== */}
      {/* PRE-FILLED CONFIRMATION PAYMENT SHEET (TAP, CHECK, CONFIRM)   */}
      {/* ============================================================== */}
      {activePaymentSheet && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">💳</span>
                <h3 className="font-black text-sm text-slate-900">
                  {activePaymentSheet.type === 'bill' && 'የቢል ክፍያ ማረጋገጫ (Confirm Bill Payment)'}
                  {activePaymentSheet.type === 'fruit' && 'የፍራፍሬ ግዢ መቀበያ ማረጋገጫ (Confirm Fruit Delivery)'}
                  {activePaymentSheet.type === 'salary' && 'የደመወዝ ክፍያ ማረጋገጫ (Confirm Salary Payout)'}
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setActivePaymentSheet(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-black text-slate-700 block mb-1">የክፍያው ስም (Item):</label>
                <input
                  type="text"
                  disabled
                  value={activePaymentSheet.item.name || activePaymentSheet.item.itemName || activePaymentSheet.item.employeeName}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                />
              </div>

              {/* If Fruit: Actual Qty & Unit Price */}
              {activePaymentSheet.type === 'fruit' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-black text-slate-700 block mb-1">የደረሰ ብዛት (Qty Received):</label>
                    <input
                      type="number"
                      value={activePaymentSheet.qty || ''}
                      onChange={(e) => setActivePaymentSheet({ ...activePaymentSheet, qty: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="font-black text-slate-700 block mb-1">ዋጋ በኪሎ/ቁራጭ (Unit Price):</label>
                    <input
                      type="number"
                      value={activePaymentSheet.unitPrice || ''}
                      onChange={(e) => setActivePaymentSheet({ ...activePaymentSheet, unitPrice: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-black text-slate-700 block mb-1">የሚከፈል መጠን (Amount ETB):</label>
                  <input
                    type="number"
                    value={activePaymentSheet.amount || ''}
                    onChange={(e) => setActivePaymentSheet({ ...activePaymentSheet, amount: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-black text-slate-700 block mb-1">የክፍያ ዘዴ (Method):</label>
                  <select
                    value={activePaymentSheet.paymentMethod || 'Cash'}
                    onChange={(e) => setActivePaymentSheet({ ...activePaymentSheet, paymentMethod: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Cash">💵 ጥሬ ገንዘብ (Cash)</option>
                    <option value="Telebirr">📱 ቴሌብር (Telebirr)</option>
                    <option value="CBE Birr">🏦 ሲቢኢ ብር (CBE Birr)</option>
                    <option value="Bank / Telebirr">💳 የባንክ ዝውውር (Bank)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-black text-slate-700 block mb-1">ቀን (Payment Date):</label>
                <input
                  type="date"
                  value={activePaymentSheet.date || new Date().toISOString().split('T')[0]}
                  onChange={(e) => setActivePaymentSheet({ ...activePaymentSheet, date: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setActivePaymentSheet(null)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 font-black text-slate-600 text-xs transition-all"
                >
                  ሰርዝ (Cancel)
                </button>
                <button
                  type="button"
                  disabled={isActionLocked}
                  onClick={handleConfirmPaymentSheet}
                  className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95"
                >
                  አረጋግጥ (Confirm)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* CLOSE THE DAY MODAL (ቀኑን ዝጋ)                                  */}
      {/* ============================================================== */}
      {showCloseDayModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🌅</span>
                <h3 className="font-black text-sm text-slate-900">የዕለቱ የካዝና ሂሳብ መዝጊያ (Close the Day)</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowCloseDayModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">የዛሬ ሽያጭ:</span>
                  <span className="font-black text-slate-900">+{totalRealSales.toLocaleString()} ETB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">የዛሬ የወጡ ወጪዎች (Cash):</span>
                  <span className="font-black text-rose-600">
                    -{actualExpenses.filter(e => e.date === new Date().toISOString().split('T')[0] && (e.paymentMethod === 'Cash' || !e.paymentMethod)).reduce((s, e) => s + e.amount, 0).toLocaleString()} ETB
                  </span>
                </div>
                <div className="border-t border-slate-200 pt-1.5 flex justify-between">
                  <span className="text-slate-900 font-black">የሚጠበቅ የካዝና ጥሬ ገንዘብ:</span>
                  <span className="font-black text-emerald-700 text-sm">{currentBalance.toLocaleString()} ETB</span>
                </div>
              </div>

              <div>
                <label className="font-black text-slate-700 block mb-1">የተቆጠረ ትክክለኛ ጥሬ ገንዘብ (Counted Cash):</label>
                <input
                  type="number"
                  placeholder={currentBalance.toString()}
                  onChange={(e) => setFormInputs({ ...formInputs, countedCash: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-black text-slate-700 block mb-1">ማስታወሻ / አስተያየት (Note):</label>
                <input
                  type="text"
                  placeholder="ለምሳሌ፡ ጥሬ ገንዘቡ ሙሉ በሙሉ ተመጣጥኗል"
                  onChange={(e) => setFormInputs({ ...formInputs, closeNote: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setShowCloseDayModal(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 font-black text-slate-600 text-xs transition-all"
                >
                  ሰርዝ (Cancel)
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveCloseDay(formInputs.countedCash || currentBalance, formInputs.closeNote)}
                  className="w-1/2 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95"
                >
                  መዝግብና ዝጋ (Save & Close)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SETTINGS MODAL (ቅንብሮች)                                       */}
      {/* ============================================================== */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-slate-900" />
                <h3 className="font-black text-sm text-slate-900">የሲስተም ቅንብሮች (Settings)</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-black text-slate-700 block mb-1">የመነሻ የካዝና ጥሬ ገንዘብ (Opening Cash ETB):</label>
                <input
                  type="number"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(Number(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-black text-slate-700 block mb-1">የወሩ የታቀደ የሽያጭ ግብ (Monthly Revenue Target ETB):</label>
                <input
                  type="number"
                  value={expectedMonthlyIncome}
                  onChange={(e) => setExpectedMonthlyIncome(Number(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2.5">
                <h4 className="font-black text-xs text-slate-900 flex items-center justify-between">
                  <span>የዳታ አያያዝና ማጽጃ (Data & Clear Controls):</span>
                  <span className="text-[10px] text-slate-400 font-bold">እርምጃዎች</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleClearAllExpenses}
                    className="py-2 px-3 bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-800 border border-rose-200 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>ወጪዎችን አጽዳ ({actualExpenses.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearAllOrders}
                    className="py-2 px-3 bg-amber-50 hover:bg-amber-100 active:scale-95 text-amber-800 border border-amber-200 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-amber-600" />
                    <span>ትዕዛዞችን አጽዳ ({orders.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearAllPlans}
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 border border-slate-200 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-slate-600" />
                    <span>እቅዶችን አጽዳ (Clear Plans)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRestoreDefaults}
                    className="py-2 px-3 bg-blue-50 hover:bg-blue-100 active:scale-95 text-blue-800 border border-blue-200 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                    <span>መደበኛ እቅዶች መልስ</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleFullSystemReset}
                  className="w-full py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-red-700/20"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>⚠️ መላውን ዳታ ሙሉ በሙሉ አጽዳ (Full System Wipe)</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadAllData}
                  className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ሁሉንም መረጃ በኤክሴል አውርድ (Download Everything CSV)</span>
                </button>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="w-full py-2.5 bg-slate-900 text-white font-black text-xs rounded-xl"
                >
                  ቅንብሮችን ዝጋ (Done)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* DRILL-DOWN MODAL FOR 4 HERO KPI CARDS                          */}
      {/* ============================================================== */}
      {activeDrillDown && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-sm text-slate-900">
                {activeDrillDown === 'balance' && 'የአሁን ጥሬ ገንዘብ ስሌት ዝርዝር (Current Balance Breakdown)'}
                {activeDrillDown === 'planned' && 'የታቀዱ ወጪዎች ሙሉ ዝርዝር (Planned Expenses Breakdown)'}
                {activeDrillDown === 'expected' && 'የሚጠበቅ ገቢ ትንበያ (Expected Income Breakdown)'}
                {activeDrillDown === 'projected' && 'የተገመተ ትርፍ ሙሉ ቀመር (Projected Remaining Formula)'}
              </h3>
              <button 
                type="button" 
                onClick={() => setActiveDrillDown(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {activeDrillDown === 'balance' && (
                <div className="space-y-2">
                  <div className="flex justify-between py-1.5 border-b border-slate-100 font-bold">
                    <span>የመነሻ ጥሬ ገንዘብ (Opening Cash):</span>
                    <span className="font-black text-slate-900">+{openingBalance.toLocaleString()} ETB</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100 font-bold">
                    <span>ጠቅላላ የኩሽና ሽያጭ (Total Real POS Sales):</span>
                    <span className="font-black text-emerald-700">+{totalRealSales.toLocaleString()} ETB</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100 font-bold">
                    <span>ጠቅላላ የወጡ እውነተኛ ወጪዎች (Actual Expenses):</span>
                    <span className="font-black text-rose-600">-{totalActualExpenses.toLocaleString()} ETB</span>
                  </div>
                  <div className="flex justify-between py-2 bg-slate-50 px-3 rounded-xl font-black text-sm">
                    <span>የአሁን ጥሬ ገንዘብ ሚዛን (Current Balance):</span>
                    <span className="text-emerald-700">{currentBalance.toLocaleString()} ETB</span>
                  </div>
                </div>
              )}

              {activeDrillDown === 'planned' && (
                <div className="space-y-2">
                  <div className="flex justify-between py-1.5 border-b border-slate-100 font-bold">
                    <span>ያልተከፈሉ ወርሃዊ ቢሎች (Unpaid Bills):</span>
                    <span className="font-black text-slate-900">{unpaidRecurringTotal.toLocaleString()} ETB</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100 font-bold">
                    <span>ያልተረከቡ የፍራፍሬ ግዢዎች (Pending Fruit):</span>
                    <span className="font-black text-slate-900">{unpaidFruitTotal.toLocaleString()} ETB</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100 font-bold">
                    <span>ያልተከፈሉ የሰራተኞች ደመወዝ (Pending Salaries):</span>
                    <span className="font-black text-slate-900">{unpaidSalariesTotal.toLocaleString()} ETB</span>
                  </div>
                  <div className="flex justify-between py-2 bg-rose-50 px-3 rounded-xl font-black text-sm">
                    <span>ጠቅላላ የታቀዱ ወጪዎች ድምር:</span>
                    <span className="text-rose-600">{totalPlannedExpenses.toLocaleString()} ETB</span>
                  </div>
                </div>
              )}

              {activeDrillDown === 'expected' && (
                <div className="space-y-2">
                  <div className="flex justify-between py-1.5 border-b border-slate-100 font-bold">
                    <span>የወሩ ጠቅላላ የሽያጭ ዒላማ (Monthly Revenue Target):</span>
                    <span className="font-black text-slate-900">{expectedMonthlyIncome.toLocaleString()} ETB</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100 font-bold">
                    <span>እስካሁን የተከናወነ ሽያጭ (Sales so far):</span>
                    <span className="font-black text-emerald-700">-{totalRealSales.toLocaleString()} ETB</span>
                  </div>
                  <div className="flex justify-between py-2 bg-teal-50 px-3 rounded-xl font-black text-sm">
                    <span>ቀሪ የሚጠበቅ ሽያጭ (Remaining Target to be Sold):</span>
                    <span className="text-teal-800">{remainingExpectedIncome.toLocaleString()} ETB</span>
                  </div>
                </div>
              )}

              {activeDrillDown === 'projected' && (
                <div className="space-y-2">
                  <div className="flex justify-between py-1.5 border-b border-slate-100 font-bold">
                    <span>የአሁን ጥሬ ገንዘብ (Current Balance):</span>
                    <span className="font-black text-slate-900">{currentBalance.toLocaleString()} ETB</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100 font-bold">
                    <span>የሚጠበቅ ገቢ (Expected Income Forecast):</span>
                    <span className="font-black text-teal-700">+{remainingExpectedIncome.toLocaleString()} ETB</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100 font-bold">
                    <span>የታቀዱ ወጪዎች (Planned Expenses):</span>
                    <span className="font-black text-rose-600">-{totalPlannedExpenses.toLocaleString()} ETB</span>
                  </div>
                  <div className="flex justify-between py-2 bg-slate-950 text-white px-3 rounded-xl font-black text-sm">
                    <span className="text-amber-300">የተገመተ የወሩ መጨረሻ ትርፍ:</span>
                    <span className="text-emerald-400">{projectedRemaining.toLocaleString()} ETB</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. DEDICATED RESPONSIVE RECORD EXPENSE MODAL / BOTTOM SHEET    */}
      {/* ============================================================== */}
      {activeQuickAddModal === 'expense' && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-black text-base shadow-sm">
                  💸
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-slate-900">
                    አዲስ ወጪ መዝግብ (Record Business Expense)
                  </h3>
                  <p className="text-[11px] text-slate-400 font-bold">
                    የዕለት ወጪዎችን በካዝና ወይም በቴሌብር ወዲያውኑ ይመዝግቡ
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setActiveQuickAddModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form with Sticky Bottom Action Bar for 100% Mobile & Desktop Fit */}
            <form onSubmit={handleQuickAddSubmit} className="flex flex-col flex-1 overflow-hidden">
              
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs">
                
                {/* Description Input & Suggestion Chips */}
                <div className="space-y-1.5">
                  <label className="font-black text-slate-700 block text-xs">
                    የወጪው ስም ወይም ዝርዝር (Description):
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ለምሳሌ፡ የበረዶ ግዢ፣ አቮካዶ፣ ወተት፣ ሰራተኛ ምሳ..."
                    value={formInputs.title || ''}
                    onChange={(e) => setFormInputs({ ...formInputs, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none transition-all"
                  />
                  
                  {/* Suggestions */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase">ፈጣን ምርጫ:</span>
                    {[
                      { title: 'የበረዶ ግዢ', cat: 'Ingredients', emoji: '🧊' },
                      { title: 'የሎሚ ግዢ', cat: 'Ingredients', emoji: '🍋' },
                      { title: 'የወተት ግዢ', cat: 'Ingredients', emoji: '🥛' },
                      { title: 'የአቮካዶ ግዢ', cat: 'Ingredients', emoji: '🥑' },
                      { title: 'ታክሲና ትራንስፖርት', cat: 'Transport', emoji: '🚕' },
                      { title: 'ሳሙናና ጽዳት', cat: 'Maintenance', emoji: '🧹' },
                      { title: 'ኩባያና ማሸጊያ', cat: 'Supplies', emoji: '📦' },
                      { title: 'የሰራተኛ ምሳ', cat: 'Salary', emoji: '🍲' }
                    ].map((sug, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormInputs({ ...formInputs, title: sug.title, category: sug.cat })}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200/60 transition-all active:scale-95 flex items-center gap-1"
                      >
                        <span>{sug.emoji}</span>
                        <span>{sug.title}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount Input with Quick Increment Pills */}
                <div className="space-y-1.5">
                  <label className="font-black text-slate-700 block text-xs">
                    የወጣው የገንዘብ መጠን (Amount in ETB):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      placeholder="0.00"
                      value={formInputs.amount || ''}
                      onChange={(e) => setFormInputs({ ...formInputs, amount: e.target.value })}
                      className="w-full bg-slate-50 border-2 border-slate-200 focus:border-rose-500 focus:bg-white rounded-2xl pl-4 pr-14 py-2 text-base sm:text-lg font-black text-slate-900 outline-none transition-all"
                    />
                    <span className="absolute right-4 top-2.5 text-xs font-black text-slate-400">
                      ETB
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    <span className="text-[10px] font-black text-slate-400 uppercase">መጠን ጨምር:</span>
                    {[50, 100, 200, 500, 1000].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          const cur = Number(formInputs.amount) || 0;
                          setFormInputs({ ...formInputs, amount: (cur + amt).toString() });
                        }}
                        className="px-2.5 py-0.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-black border border-rose-200/80 transition-all active:scale-95"
                      >
                        +{amt} ETB
                      </button>
                    ))}
                  </div>
                </div>

                {/* Visual Category Selection Grid (8 chips, no clipped select!) */}
                <div className="space-y-1.5">
                  <label className="font-black text-slate-700 block text-xs">
                    የወጪ ዘርፍ (Category):
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {[
                      { id: 'Ingredients', label: 'ፍራፍሬ/ግብአት', emoji: '🥑' },
                      { id: 'Transport', label: 'ትራንስፖርት', emoji: '🚕' },
                      { id: 'Maintenance', label: 'ጽዳትና ጥገና', emoji: '🧹' },
                      { id: 'Supplies', label: 'ማሸጊያ', emoji: '📦' },
                      { id: 'Utilities', label: 'መብራት/ውሃ', emoji: '⚡' },
                      { id: 'Rent', label: 'የቤት ኪራይ', emoji: '🏢' },
                      { id: 'Salary', label: 'ደመወዝ/አበል', emoji: '👥' },
                      { id: 'General', label: 'ጠቅላላ ወጪ', emoji: '✨' }
                    ].map(cat => {
                      const isSel = (formInputs.category || 'Ingredients') === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setFormInputs({ ...formInputs, category: cat.id })}
                          className={`p-1.5 sm:p-2 rounded-xl text-left border transition-all flex items-center gap-1.5 ${
                            isSel
                              ? 'bg-slate-900 border-slate-900 text-white shadow-2xs font-black'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-bold'
                          }`}
                        >
                          <span className="text-sm">{cat.emoji}</span>
                          <span className="text-[10px] sm:text-[11px] truncate">{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Payment Method Cards */}
                <div className="space-y-1.5">
                  <label className="font-black text-slate-700 block text-xs">
                    የክፍያ ዘዴ (Payment Method):
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {[
                      { id: 'Cash', label: 'ጥሬ ገንዘብ', emoji: '💵' },
                      { id: 'Telebirr', label: 'ቴሌብር', emoji: '📱' },
                      { id: 'CBE Birr', label: 'ሲቢኢ ብር', emoji: '🏦' },
                      { id: 'Bank / Telebirr', label: 'ባንክ ዝውውር', emoji: '💳' }
                    ].map(pm => {
                      const isSel = (formInputs.paymentMethod || 'Cash') === pm.id;
                      return (
                        <button
                          key={pm.id}
                          type="button"
                          onClick={() => setFormInputs({ ...formInputs, paymentMethod: pm.id })}
                          className={`p-1.5 sm:p-2 rounded-xl text-center border transition-all flex items-center justify-center gap-1.5 ${
                            isSel
                              ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs font-black'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-bold'
                          }`}
                        >
                          <span>{pm.emoji}</span>
                          <span className="text-[10px] sm:text-[11px] truncate">{pm.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Date with Ethiopian Calendar helper */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                  <div>
                    <label className="font-black text-slate-700 block text-[11px] mb-1">ቀን (Date):</label>
                    <input
                      type="date"
                      value={formInputs.date || new Date().toISOString().split('T')[0]}
                      onChange={(e) => setFormInputs({ ...formInputs, date: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="w-full p-2 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-[10px] font-black flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span className="truncate">የኢትዮጵያ ቀን፡ {toEthiopianDateString(formInputs.date || new Date().toISOString().split('T')[0])}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Sticky Action Footer */}
              <div className="p-3 sm:p-4 bg-slate-50/90 border-t border-slate-200/80 flex items-center justify-between gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveQuickAddModal(null)}
                  className="w-1/3 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 font-black text-slate-600 text-xs transition-all active:scale-95"
                >
                  ሰርዝ (Cancel)
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black text-xs sm:text-sm rounded-xl shadow-md shadow-rose-700/20 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>ወጪ መዝግብ (Save Expense)</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. OTHER QUICK ADD MODALS (PURCHASE, SALARY, TASK, GOAL...)    */}
      {/* ============================================================== */}
      {activeQuickAddModal && activeQuickAddModal !== 'expense' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-sm text-slate-900 capitalize">
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
              {activeQuickAddModal === 'purchase' && (
                <>
                  <div>
                    <label className="font-black text-slate-700 block mb-1">የዕቃው ስም (Fruit/Item Name):</label>
                    <input
                      type="text"
                      required
                      placeholder="ለምሳሌ፡ ብርቱካን (Orange)"
                      value={formInputs.itemName || ''}
                      onChange={(e) => setFormInputs({ ...formInputs, itemName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-black text-slate-700 block mb-1">ብዛት (Quantity):</label>
                      <input
                        type="number"
                        required
                        placeholder="50"
                        value={formInputs.quantity || ''}
                        onChange={(e) => setFormInputs({ ...formInputs, quantity: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="font-black text-slate-700 block mb-1">ዋጋ በኪሎ (Unit Price ETB):</label>
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
                        value={formInputs.dueDate || new Date().toISOString().split('T')[0]}
                        onChange={(e) => setFormInputs({ ...formInputs, dueDate: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="font-black text-slate-700 block mb-1">ቅድሚያ (Priority):</label>
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

              <div className="pt-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setActiveQuickAddModal(null)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 font-black text-slate-600 text-xs transition-all"
                >
                  ሰርዝ (Cancel)
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95"
                >
                  አስቀምጥ (Save)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Waiter Pending Debts Ledger Modal */}
      <WaiterPendingLedgerModal
        isOpen={showWaiterDebtsModal}
        onClose={() => setShowWaiterDebtsModal(false)}
        pendingDebts={waiterPendingDebts}
        onUpdateDebts={setWaiterPendingDebts}
      />

    </div>
  );
}
