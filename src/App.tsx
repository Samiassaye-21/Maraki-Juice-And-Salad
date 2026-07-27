import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header, MainTab } from './components/Header';
import { ShiftReconciliationView } from './components/ShiftReconciliationView';
import { PendingPaymentsView } from './components/PendingPaymentsView';
import { DeliveryLedgerView } from './components/DeliveryLedgerView';
import { ShiftHistoryView } from './components/ShiftHistoryView';
import { BudgetSettings } from './components/BudgetSettings';
import Login from './components/Login';
import { SupabaseMigration } from './components/SupabaseMigration';
import { supabase } from './lib/supabaseClient';
import { 
  DEFAULT_RESTAURANT_CONFIG, 
  INITIAL_SHIFTS, 
  INITIAL_PENDING_PAYMENTS, 
  INITIAL_DELIVERY_RECORDS,
  DEFAULT_FOOD_MENU
} from './data/initialData';
import { 
  ShiftRecord, 
  ShiftType, 
  PendingPaymentItem, 
  DeliveryAccountRecord, 
  RestaurantSystemConfig 
} from './types';
import { calculateSystemSummary } from './utils/shiftUtils';

const STORAGE_KEY_THEME = 'maraki_theme_mode_v1';

export function App() {
  const [activeTab, setActiveTab] = useState<MainTab>('calculator');
  const [activeShift, setActiveShift] = useState<ShiftType>('day');
  const [selectedMonth, setSelectedMonth] = useState('July 2026');
  const [selectedCurrency, setSelectedCurrency] = useState('Br ETB');
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [isDbLoading, setIsDbLoading] = useState(true);

  // Theme Mode State ('light' | 'dark')
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEME);
      if (saved === 'dark' || saved === 'light') return saved;
      return 'light';
    } catch {
      return 'light';
    }
  });

  const [authToken, setAuthToken] = useState<string | null>(null);
  
  // Data States
  const [config, setConfigState] = useState<RestaurantSystemConfig>(DEFAULT_RESTAURANT_CONFIG);
  const [shifts, setShiftsState] = useState<ShiftRecord[]>([]);
  const [pendingPayments, setPendingPaymentsState] = useState<PendingPaymentItem[]>([]);
  const [deliveryRecords, setDeliveryRecordsState] = useState<DeliveryAccountRecord[]>([]);

  // Load token from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('maraki_auth_token');
    if (token) setAuthToken(token);
  }, []);

  const handleLoginSuccess = (token: string) => {
    localStorage.setItem('maraki_auth_token', token);
    setAuthToken(token);
  };

  const handleLogout = () => {
    localStorage.removeItem('maraki_auth_token');
    setAuthToken(null);
  };

  // Sync dark class on document element & persist preference
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_THEME, themeMode);
    } catch {
      // ignore
    }
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [themeMode]);

  const handleToggleTheme = () => {
    setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Fetch data from Supabase
  const fetchData = async () => {
    setIsDbLoading(true);
    try {
      // Fetch Config
      const { data: configData, error: configErr } = await supabase.from('config').select('*').single();
      if (configData) {
        setConfigState({
          defaultJuiceUnitPrice: configData.default_juice_unit_price,
          defaultFoodUnitPrice: configData.default_food_unit_price,
          foodMenu: configData.food_menu || DEFAULT_FOOD_MENU,
          currencySymbol: configData.currency_symbol,
          dayShiftWorkerName: configData.day_shift_worker_name,
          nightShiftWorkerName: configData.night_shift_worker_name,
          restaurantName: configData.restaurant_name
        });
      } else if (configErr && configErr.code !== 'PGRST116') {
        // Only log if it's not a "row not found" error (which happens on first run)
        console.error('Config fetch error:', configErr);
      }

      // Fetch Shifts
      const { data: shiftsData, error: shiftsErr } = await supabase.from('shifts').select('*').order('timestamp', { ascending: false });
      if (shiftsData) {
        setShiftsState(shiftsData.map(s => ({
          id: s.id,
          date: s.date,
          shiftType: s.shift_type,
          workerName: s.worker_name,
          juiceCups: s.juice_cups,
          foodTakeaways: s.food_takeaways,
          juiceCupsSold: s.juice_cups_sold,
          juiceRevenue: s.juice_revenue,
          foodTakeawaysSold: s.food_takeaways_sold,
          foodRevenue: s.food_revenue,
          grossIncome: s.gross_income,
          digitalTransfers: s.digital_transfers,
          dailyExpenses: s.daily_expenses,
          expenseItems: s.expense_items,
          newPendingPaymentsAmount: s.new_pending_payments_amount,
          recoveredPendingAmount: s.recovered_pending_amount,
          deliveryCreditAmount: s.delivery_credit_amount,
          netCashDueToOwner: s.net_cash_due_to_owner,
          notes: s.notes,
          isClosed: s.is_closed,
          timestamp: Number(s.timestamp)
        })));
      }

      // Fetch Pending
      const { data: pendingData } = await supabase.from('pending_payments').select('*').order('date', { ascending: false });
      if (pendingData) {
        setPendingPaymentsState(pendingData.map(p => ({
          id: p.id,
          shiftType: p.shift_type,
          customerName: p.customer_name,
          description: p.description,
          juiceCupsCount: p.juice_cups_count,
          foodTakeawaysCount: p.food_takeaways_count,
          itemizedBreakdown: p.itemized_breakdown,
          amount: p.amount,
          date: p.date,
          isPaid: p.is_paid,
          paidDate: p.paid_date
        })));
      }

      // Fetch Delivery
      const { data: delData } = await supabase.from('delivery_records').select('*').order('date', { ascending: false });
      if (delData) {
        setDeliveryRecordsState(delData.map(d => ({
          id: d.id,
          deliveryRiderName: d.delivery_rider_name,
          description: d.description,
          juiceCupsCount: d.juice_cups_count,
          foodTakeawaysCount: d.food_takeaways_count,
          amount: d.amount,
          date: d.date,
          shiftType: d.shift_type,
          isSettledWeekly: d.is_settled_weekly,
          settledDate: d.settled_date
        })));
      }

    } catch (err) {
      console.error('Error fetching from Supabase:', err);
    } finally {
      setIsDbLoading(false);
    }
  };

  useEffect(() => {
    if (authToken) {
      fetchData();
    }
  }, [authToken]);

  // Extract currency symbol string
  const currencySymbol = selectedCurrency.split(' ')[0] || 'Br';

  if (!authToken) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const summary = calculateSystemSummary(shifts, pendingPayments, deliveryRecords, config);

  // Supabase Handlers (Optimistic UI updates)
  const setConfig = async (newConfig: RestaurantSystemConfig) => {
    setConfigState(newConfig); // Optimistic
    await supabase.from('config').upsert({
      id: 1,
      default_juice_unit_price: newConfig.defaultJuiceUnitPrice,
      default_food_unit_price: newConfig.defaultFoodUnitPrice,
      food_menu: newConfig.foodMenu,
      currency_symbol: newConfig.currencySymbol,
      day_shift_worker_name: newConfig.dayShiftWorkerName,
      night_shift_worker_name: newConfig.nightShiftWorkerName,
      restaurant_name: newConfig.restaurantName
    });
  };

  const handleSaveShift = async (newShift: ShiftRecord) => {
    setShiftsState((prev) => [newShift, ...prev]);
    await supabase.from('shifts').insert({
      id: newShift.id,
      date: newShift.date,
      shift_type: newShift.shiftType,
      worker_name: newShift.workerName,
      juice_cups: newShift.juiceCups,
      food_takeaways: newShift.foodTakeaways,
      juice_cups_sold: newShift.juiceCupsSold,
      juice_revenue: newShift.juiceRevenue,
      food_takeaways_sold: newShift.foodTakeawaysSold,
      food_revenue: newShift.foodRevenue,
      gross_income: newShift.grossIncome,
      digital_transfers: newShift.digitalTransfers,
      daily_expenses: newShift.dailyExpenses,
      expense_items: newShift.expenseItems,
      new_pending_payments_amount: newShift.newPendingPaymentsAmount,
      recovered_pending_amount: newShift.recoveredPendingAmount,
      delivery_credit_amount: newShift.deliveryCreditAmount,
      net_cash_due_to_owner: newShift.netCashDueToOwner,
      notes: newShift.notes,
      is_closed: newShift.isClosed,
      timestamp: newShift.timestamp
    });
  };

  const handleUpdateShift = async (updatedShift: ShiftRecord) => {
    setShiftsState((prev) => prev.map((s) => (s.id === updatedShift.id ? updatedShift : s)));
    await supabase.from('shifts').update({
      date: updatedShift.date,
      shift_type: updatedShift.shiftType,
      worker_name: updatedShift.workerName,
      juice_cups: updatedShift.juiceCups,
      food_takeaways: updatedShift.foodTakeaways,
      juice_cups_sold: updatedShift.juiceCupsSold,
      juice_revenue: updatedShift.juiceRevenue,
      food_takeaways_sold: updatedShift.foodTakeawaysSold,
      food_revenue: updatedShift.foodRevenue,
      gross_income: updatedShift.grossIncome,
      digital_transfers: updatedShift.digitalTransfers,
      daily_expenses: updatedShift.dailyExpenses,
      expense_items: updatedShift.expenseItems,
      new_pending_payments_amount: updatedShift.newPendingPaymentsAmount,
      recovered_pending_amount: updatedShift.recoveredPendingAmount,
      delivery_credit_amount: updatedShift.deliveryCreditAmount,
      net_cash_due_to_owner: updatedShift.netCashDueToOwner,
      notes: updatedShift.notes,
      is_closed: updatedShift.isClosed,
      timestamp: updatedShift.timestamp
    }).eq('id', updatedShift.id);
  };

  const handleDeleteShift = async (id: string) => {
    setShiftsState((prev) => prev.filter((s) => s.id !== id));
    await supabase.from('shifts').delete().eq('id', id);
  };

  const handleAddPendingPayment = async (newPending: Omit<PendingPaymentItem, 'id' | 'isPaid'>) => {
    const item: PendingPaymentItem = {
      ...newPending,
      id: 'pend-' + Date.now(),
      isPaid: false,
    };
    setPendingPaymentsState((prev) => [item, ...prev]);
    await supabase.from('pending_payments').insert({
      id: item.id,
      shift_type: item.shiftType,
      customer_name: item.customerName,
      description: item.description,
      juice_cups_count: item.juiceCupsCount,
      food_takeaways_count: item.foodTakeawaysCount,
      itemized_breakdown: item.itemizedBreakdown,
      amount: item.amount,
      date: item.date,
      is_paid: item.isPaid
    });
  };

  const handleUpdatePendingPayment = async (updated: PendingPaymentItem) => {
    setPendingPaymentsState((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    await supabase.from('pending_payments').update({
      shift_type: updated.shiftType,
      customer_name: updated.customerName,
      description: updated.description,
      juice_cups_count: updated.juiceCupsCount,
      food_takeaways_count: updated.foodTakeawaysCount,
      itemized_breakdown: updated.itemizedBreakdown,
      amount: updated.amount,
      date: updated.date,
      is_paid: updated.isPaid,
      paid_date: updated.paidDate
    }).eq('id', updated.id);
  };

  const handleSettlePendingPayment = async (id: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    setPendingPaymentsState((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isPaid: true, paidDate: todayStr } : p))
    );
    await supabase.from('pending_payments').update({
      is_paid: true,
      paid_date: todayStr
    }).eq('id', id);
  };

  const handleDeletePendingPayment = async (id: string) => {
    setPendingPaymentsState((prev) => prev.filter((p) => p.id !== id));
    await supabase.from('pending_payments').delete().eq('id', id);
  };

  const handleAddDeliveryRecord = async (newDel: Omit<DeliveryAccountRecord, 'id' | 'isSettledWeekly'>) => {
    const item: DeliveryAccountRecord = {
      ...newDel,
      id: 'del-' + Date.now(),
      isSettledWeekly: false,
    };
    setDeliveryRecordsState((prev) => [item, ...prev]);
    await supabase.from('delivery_records').insert({
      id: item.id,
      delivery_rider_name: item.deliveryRiderName,
      description: item.description,
      juice_cups_count: item.juiceCupsCount,
      food_takeaways_count: item.foodTakeawaysCount,
      amount: item.amount,
      date: item.date,
      shift_type: item.shiftType,
      is_settled_weekly: item.isSettledWeekly
    });
  };

  const handleUpdateDeliveryRecord = async (updated: DeliveryAccountRecord) => {
    setDeliveryRecordsState((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    await supabase.from('delivery_records').update({
      delivery_rider_name: updated.deliveryRiderName,
      description: updated.description,
      juice_cups_count: updated.juiceCupsCount,
      food_takeaways_count: updated.foodTakeawaysCount,
      amount: updated.amount,
      date: updated.date,
      shift_type: updated.shiftType,
      is_settled_weekly: updated.isSettledWeekly,
      settled_date: updated.settledDate
    }).eq('id', updated.id);
  };

  const handleSettleDeliveryRecord = async (id: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    setDeliveryRecordsState((prev) =>
      prev.map((d) => (d.id === id ? { ...d, isSettledWeekly: true, settledDate: todayStr } : d))
    );
    await supabase.from('delivery_records').update({
      is_settled_weekly: true,
      settled_date: todayStr
    }).eq('id', id);
  };

  const handleDeleteDeliveryRecord = async (id: string) => {
    setDeliveryRecordsState((prev) => prev.filter((d) => d.id !== id));
    await supabase.from('delivery_records').delete().eq('id', id);
  };

  // Month navigation
  const monthsList = [
    'January 2026', 'February 2026', 'March 2026', 'April 2026', 
    'May 2026', 'June 2026', 'July 2026', 'August 2026', 
    'September 2026', 'October 2026', 'November 2026', 'December 2026'
  ];

  const handlePrevMonth = () => {
    const idx = monthsList.indexOf(selectedMonth);
    if (idx > 0) setSelectedMonth(monthsList[idx - 1]);
    else setSelectedMonth(monthsList[monthsList.length - 1]);
  };

  const handleNextMonth = () => {
    const idx = monthsList.indexOf(selectedMonth);
    if (idx < monthsList.length - 1) setSelectedMonth(monthsList[idx + 1]);
    else setSelectedMonth(monthsList[0]);
  };

  const lastClosedShift = shifts.length > 0 ? shifts[0] : undefined;

  return (
    <div className="min-h-screen bg-[#FFFBF5] dark:bg-slate-950 text-stone-800 dark:text-slate-100 font-sans flex flex-col antialiased transition-colors duration-300">
      
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeShift={activeShift}
        setActiveShift={setActiveShift}
        selectedMonth={selectedMonth}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        selectedCurrency={selectedCurrency}
        onChangeCurrency={setSelectedCurrency}
        selectedLanguage={selectedLanguage}
        onChangeLanguage={setSelectedLanguage}
        summary={summary}
        config={config}
        themeMode={themeMode}
        onToggleTheme={handleToggleTheme}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 relative">
        <SupabaseMigration onMigrationComplete={fetchData} />

        {isDbLoading ? (
          <div className="flex flex-col items-center justify-center h-64 text-stone-400">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-800 dark:border-white mb-4"></div>
            <p>Loading data from database...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'calculator' && (
              <motion.div
                key="calculator"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <ShiftReconciliationView
                  activeShift={activeShift}
                  setActiveShift={setActiveShift}
                  config={config}
                  lastClosedShift={lastClosedShift}
                  pendingPayments={pendingPayments}
                  onSaveShift={handleSaveShift}
                  onAddPendingPayment={handleAddPendingPayment}
                  onAddDeliveryRecord={handleAddDeliveryRecord}
                  onSettlePendingPayment={handleSettlePendingPayment}
                  currencySymbol={currencySymbol}
                />
              </motion.div>
            )}

            {activeTab === 'pending' && (
              <motion.div
                key="pending"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <PendingPaymentsView
                  pendingPayments={pendingPayments}
                  onAddPendingPayment={handleAddPendingPayment}
                  onUpdatePendingPayment={handleUpdatePendingPayment}
                  onSettlePendingPayment={handleSettlePendingPayment}
                  onDeletePendingPayment={handleDeletePendingPayment}
                  currencySymbol={currencySymbol}
                  config={config}
                />
              </motion.div>
            )}

            {activeTab === 'delivery' && (
              <motion.div
                key="delivery"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <DeliveryLedgerView
                  deliveryRecords={deliveryRecords}
                  onAddDeliveryRecord={handleAddDeliveryRecord}
                  onUpdateDeliveryRecord={handleUpdateDeliveryRecord}
                  onSettleDeliveryRecord={handleSettleDeliveryRecord}
                  onDeleteDeliveryRecord={handleDeleteDeliveryRecord}
                  currencySymbol={currencySymbol}
                  config={config}
                />
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <ShiftHistoryView
                  shifts={shifts}
                  onUpdateShift={handleUpdateShift}
                  onDeleteShift={handleDeleteShift}
                  currencySymbol={currencySymbol}
                />
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <BudgetSettings
                  config={config}
                  onSaveConfig={setConfig}
                  summary={summary}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      <footer className="border-t border-stone-200/60 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm py-5 text-center mt-auto transition-colors">
        <p className="text-xs font-medium text-stone-400 dark:text-slate-500">
          Maraki Juice and Salad • Stock Inventory & Shift Reconciliation
        </p>
      </footer>
    </div>
  );
}

export default App;
