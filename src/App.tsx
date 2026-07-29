import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header, MainTab } from './components/Header';
import { ShiftReconciliationView } from './components/ShiftReconciliationView';
import { PendingPaymentsView } from './components/PendingPaymentsView';
import { DeliveryLedgerView } from './components/DeliveryLedgerView';
import { ShiftHistoryView } from './components/ShiftHistoryView';
import { BudgetSettings } from './components/BudgetSettings';
import { MarketPurchasesView } from './components/MarketPurchasesView';
import { AccountView } from './components/AccountView';
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
  RestaurantSystemConfig,
  PurchaseTrip,
  LedgerEntry,
} from './types';
import { calculateSystemSummary } from './utils/shiftUtils';

const STORAGE_KEY_THEME = 'maraki_theme_mode_v1';

// Helper to build ledger entries from a closed shift
function buildShiftLedgerEntries(shift: ShiftRecord): LedgerEntry[] {
  const entries: LedgerEntry[] = [];

  // 1. Shift Income (Gross Sales - New Credit - Delivery Credit)
  const shiftIncome = shift.grossIncome - shift.newPendingPaymentsAmount - shift.deliveryCreditAmount;
  if (shiftIncome > 0) {
    entries.push({
      id: `led-inc-${shift.id}`,
      date: shift.date,
      type: 'shift_income',
      description: `Shift Sales (Cash & Digital) — ${shift.workerName} (${shift.shiftType})`,
      amount: shiftIncome,
      sign: 1,
      referenceId: shift.id,
      createdAt: shift.timestamp,
    });
  }

  // 2. Daily Expenses
  if (shift.dailyExpenses > 0) {
    entries.push({
      id: `led-exp-${shift.id}`,
      date: shift.date,
      type: 'shift_daily_expense',
      description: `Daily Shift Expenses — ${shift.shiftType} shift`,
      amount: shift.dailyExpenses,
      sign: -1,
      referenceId: shift.id,
      createdAt: shift.timestamp + 1,
    });
  }

  return entries;
}

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
  const [purchaseTrips, setPurchaseTripsState] = useState<PurchaseTrip[]>([]);
  const [ledgerEntries, setLedgerEntriesState] = useState<LedgerEntry[]>([]);

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
    try { localStorage.setItem(STORAGE_KEY_THEME, themeMode); } catch { }
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [themeMode]);

  const handleToggleTheme = () => {
    setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // ─── Fetch all data from Supabase ──────────────────────────────────────────
  const fetchData = async () => {
    setIsDbLoading(true);
    try {
      // Config
      const { data: configData } = await supabase.from('config').select('*').single();
      if (configData) {
        setConfigState({
          defaultJuiceUnitPrice: configData.default_juice_unit_price,
          defaultFoodUnitPrice: configData.default_food_unit_price,
          foodMenu: configData.food_menu || DEFAULT_FOOD_MENU,
          currencySymbol: configData.currency_symbol,
          dayShiftWorkerName: configData.day_shift_worker_name,
          nightShiftWorkerName: configData.night_shift_worker_name,
          restaurantName: configData.restaurant_name,
        });
      }

      // Shifts
      const { data: shiftsData } = await supabase.from('shifts').select('*').order('timestamp', { ascending: false });
      if (shiftsData) {
        setShiftsState(shiftsData.map(s => ({
          id: s.id, date: s.date, shiftType: s.shift_type, workerName: s.worker_name,
          juiceCups: s.juice_cups, foodTakeaways: s.food_takeaways,
          juiceCupsSold: s.juice_cups_sold, juiceRevenue: s.juice_revenue,
          foodTakeawaysSold: s.food_takeaways_sold, foodRevenue: s.food_revenue,
          grossIncome: s.gross_income, digitalTransfers: s.digital_transfers,
          dailyExpenses: s.daily_expenses, expenseItems: s.expense_items,
          newPendingPaymentsAmount: s.new_pending_payments_amount,
          recoveredPendingAmount: s.recovered_pending_amount,
          deliveryCreditAmount: s.delivery_credit_amount,
          netCashDueToOwner: s.net_cash_due_to_owner,
          notes: s.notes, isClosed: s.is_closed, timestamp: Number(s.timestamp),
        })));
      }

      // Pending
      const { data: pendingData } = await supabase.from('pending_payments').select('*').order('date', { ascending: false });
      if (pendingData) {
        setPendingPaymentsState(pendingData.map(p => ({
          id: p.id, shiftType: p.shift_type, customerName: p.customer_name,
          description: p.description, juiceCupsCount: p.juice_cups_count,
          foodTakeawaysCount: p.food_takeaways_count, itemizedBreakdown: p.itemized_breakdown,
          amount: p.amount, date: p.date, isPaid: p.is_paid, paidDate: p.paid_date,
        })));
      }

      // Delivery
      const { data: delData } = await supabase.from('delivery_records').select('*').order('date', { ascending: false });
      if (delData) {
        setDeliveryRecordsState(delData.map(d => ({
          id: d.id, deliveryRiderName: d.delivery_rider_name, description: d.description,
          juiceCupsCount: d.juice_cups_count, foodTakeawaysCount: d.food_takeaways_count,
          amount: d.amount, date: d.date, shiftType: d.shift_type,
          isSettledWeekly: d.is_settled_weekly, settledDate: d.settled_date,
        })));
      }

      // Purchase Trips
      const { data: tripsData } = await supabase.from('purchase_trips').select('*, purchase_trip_items(*)').order('date', { ascending: false });
      if (tripsData) {
        setPurchaseTripsState(tripsData.map(t => ({
          id: t.id, date: t.date, notes: t.notes, grandTotal: t.grand_total,
          createdAt: Number(t.created_at_ts),
          items: (t.purchase_trip_items || []).map((it: any) => ({
            id: it.id, tripId: it.trip_id, materialId: it.material_id,
            itemName: it.item_name, category: it.category, unit: it.unit,
            quantity: it.quantity, pricePerUnit: it.price_per_unit, totalPrice: it.total_price,
          })),
        })));
      }

      // Ledger Entries
      const { data: ledgerData } = await supabase.from('ledger_entries').select('*').order('created_at_ts', { ascending: false });
      if (ledgerData) {
        setLedgerEntriesState(ledgerData.map(e => ({
          id: e.id, date: e.date, type: e.type, description: e.description,
          amount: e.amount, sign: e.sign, referenceId: e.reference_id,
          createdAt: Number(e.created_at_ts),
        })));
      }

    } catch (err) {
      console.error('Error fetching from Supabase:', err);
    } finally {
      setIsDbLoading(false);
    }
  };

  useEffect(() => {
    if (authToken) fetchData();
  }, [authToken]);

  const currencySymbol = selectedCurrency.split(' ')[0] || 'Br';

  if (!authToken) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const summary = calculateSystemSummary(shifts, pendingPayments, deliveryRecords, config);

  // ─── Config Handler ────────────────────────────────────────────────────────
  const setConfig = async (newConfig: RestaurantSystemConfig) => {
    setConfigState(newConfig);
    await supabase.from('config').upsert({
      id: 1,
      default_juice_unit_price: newConfig.defaultJuiceUnitPrice,
      default_food_unit_price: newConfig.defaultFoodUnitPrice,
      food_menu: newConfig.foodMenu,
      currency_symbol: newConfig.currencySymbol,
      day_shift_worker_name: newConfig.dayShiftWorkerName,
      night_shift_worker_name: newConfig.nightShiftWorkerName,
      restaurant_name: newConfig.restaurantName,
    });
  };

  // ─── Shift Handlers ────────────────────────────────────────────────────────
  const handleSaveShift = async (newShift: ShiftRecord) => {
    setShiftsState((prev) => [newShift, ...prev]);
    const { error: shiftErr } = await supabase.from('shifts').insert({
      id: newShift.id, date: newShift.date, shift_type: newShift.shiftType,
      worker_name: newShift.workerName, juice_cups: newShift.juiceCups,
      food_takeaways: newShift.foodTakeaways, juice_cups_sold: newShift.juiceCupsSold,
      juice_revenue: newShift.juiceRevenue, food_takeaways_sold: newShift.foodTakeawaysSold,
      food_revenue: newShift.foodRevenue, gross_income: newShift.grossIncome,
      digital_transfers: newShift.digitalTransfers, daily_expenses: newShift.dailyExpenses,
      expense_items: newShift.expenseItems,
      new_pending_payments_amount: newShift.newPendingPaymentsAmount,
      recovered_pending_amount: newShift.recoveredPendingAmount,
      delivery_credit_amount: newShift.deliveryCreditAmount,
      net_cash_due_to_owner: newShift.netCashDueToOwner,
      notes: newShift.notes, is_closed: newShift.isClosed, timestamp: newShift.timestamp,
    });

    if (shiftErr) {
      console.error('Failed to save shift to Supabase:', shiftErr);
      alert('Error saving shift to Supabase: ' + shiftErr.message);
    }

    // Write ledger entries for this shift
    if (newShift.isClosed) {
      const entries = buildShiftLedgerEntries(newShift);
      for (const entry of entries) {
        setLedgerEntriesState(prev => [entry, ...prev]);
        const { error: ledErr } = await supabase.from('ledger_entries').insert({
          id: entry.id, date: entry.date, type: entry.type,
          description: entry.description, amount: entry.amount,
          sign: entry.sign, reference_id: entry.referenceId, created_at_ts: entry.createdAt,
        });
        if (ledErr) console.error('Failed to save ledger entry:', ledErr);
      }
    }
  };

  const handleUpdateShift = async (updatedShift: ShiftRecord) => {
    setShiftsState((prev) => prev.map((s) => (s.id === updatedShift.id ? updatedShift : s)));
    const { error } = await supabase.from('shifts').update({
      date: updatedShift.date, shift_type: updatedShift.shiftType,
      worker_name: updatedShift.workerName, juice_cups: updatedShift.juiceCups,
      food_takeaways: updatedShift.foodTakeaways, juice_cups_sold: updatedShift.juiceCupsSold,
      juice_revenue: updatedShift.juiceRevenue, food_takeaways_sold: updatedShift.foodTakeawaysSold,
      food_revenue: updatedShift.foodRevenue, gross_income: updatedShift.grossIncome,
      digital_transfers: updatedShift.digitalTransfers, daily_expenses: updatedShift.dailyExpenses,
      expense_items: updatedShift.expenseItems,
      new_pending_payments_amount: updatedShift.newPendingPaymentsAmount,
      recovered_pending_amount: updatedShift.recoveredPendingAmount,
      delivery_credit_amount: updatedShift.deliveryCreditAmount,
      net_cash_due_to_owner: updatedShift.netCashDueToOwner,
      notes: updatedShift.notes, is_closed: updatedShift.isClosed, timestamp: updatedShift.timestamp,
    }).eq('id', updatedShift.id);
    
    if (error) {
      console.error('Failed to update shift:', error);
      alert('Error updating shift: ' + error.message);
    }
  };

  const handleDeleteShift = async (id: string) => {
    setShiftsState((prev) => prev.filter((s) => s.id !== id));
    const { error: delErr } = await supabase.from('shifts').delete().eq('id', id);
    if (delErr) {
      console.error('Failed to delete shift:', delErr);
      alert('Error deleting shift: ' + delErr.message);
    }
    // Remove associated ledger entries
    setLedgerEntriesState(prev => prev.filter(e => e.referenceId !== id));
    await supabase.from('ledger_entries').delete().eq('reference_id', id);
  };

  // ─── Pending Payment Handlers ──────────────────────────────────────────────
  const handleAddPendingPayment = async (newPending: Omit<PendingPaymentItem, 'id' | 'isPaid'>) => {
    const item: PendingPaymentItem = { ...newPending, id: 'pend-' + Date.now(), isPaid: false };
    setPendingPaymentsState((prev) => [item, ...prev]);
    const { error } = await supabase.from('pending_payments').insert({
      id: item.id, shift_type: item.shiftType, customer_name: item.customerName,
      description: item.description, juice_cups_count: item.juiceCupsCount,
      food_takeaways_count: item.foodTakeawaysCount, itemized_breakdown: item.itemizedBreakdown,
      amount: item.amount, date: item.date, is_paid: item.isPaid,
    });
    if (error) {
      console.error('Failed to add pending payment:', error);
      alert('Error saving pending payment: ' + error.message);
    }
  };

  const handleUpdatePendingPayment = async (updated: PendingPaymentItem) => {
    setPendingPaymentsState((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    const { error } = await supabase.from('pending_payments').update({
      shift_type: updated.shiftType, customer_name: updated.customerName,
      description: updated.description, juice_cups_count: updated.juiceCupsCount,
      food_takeaways_count: updated.foodTakeawaysCount, itemized_breakdown: updated.itemizedBreakdown,
      amount: updated.amount, date: updated.date, is_paid: updated.isPaid, paid_date: updated.paidDate,
    }).eq('id', updated.id);
    if (error) {
      console.error('Failed to update pending payment:', error);
      alert('Error updating pending payment: ' + error.message);
    }
  };

  const handleSettlePendingPayment = async (id: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const payment = pendingPayments.find(p => p.id === id);
    setPendingPaymentsState((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isPaid: true, paidDate: todayStr } : p))
    );
    const { error } = await supabase.from('pending_payments').update({ is_paid: true, paid_date: todayStr }).eq('id', id);
    if (error) {
      console.error('Failed to settle pending payment:', error);
      alert('Error settling pending payment: ' + error.message);
    }
    // Ledger: recovered = money back in
    if (payment) {
      const entry: LedgerEntry = {
        id: `led-pend-rec-${id}-${Date.now()}`, date: todayStr, type: 'pending_recovered',
        description: `Debt Recovered — ${payment.customerName || 'Customer'}: ${payment.description}`,
        amount: payment.amount, sign: 1, referenceId: id, createdAt: Date.now(),
      };
      setLedgerEntriesState(prev => [entry, ...prev]);
      const { error: ledErr } = await supabase.from('ledger_entries').insert({
        id: entry.id, date: entry.date, type: entry.type, description: entry.description,
        amount: entry.amount, sign: entry.sign, reference_id: entry.referenceId, created_at_ts: entry.createdAt,
      });
      if (ledErr) console.error('Failed to save ledger entry for recovered payment:', ledErr);
    }
  };

  const handleDeletePendingPayment = async (id: string) => {
    setPendingPaymentsState((prev) => prev.filter((p) => p.id !== id));
    const { error: delErr } = await supabase.from('pending_payments').delete().eq('id', id);
    if (delErr) {
      console.error('Failed to delete pending payment:', delErr);
      alert('Error deleting pending payment: ' + delErr.message);
    }
    setLedgerEntriesState(prev => prev.filter(e => e.referenceId !== id));
    await supabase.from('ledger_entries').delete().eq('reference_id', id);
  };

  // ─── Delivery Handlers ─────────────────────────────────────────────────────
  const handleAddDeliveryRecord = async (newDel: Omit<DeliveryAccountRecord, 'id' | 'isSettledWeekly'>) => {
    const item: DeliveryAccountRecord = { ...newDel, id: 'del-' + Date.now(), isSettledWeekly: false };
    setDeliveryRecordsState((prev) => [item, ...prev]);
    const { error } = await supabase.from('delivery_records').insert({
      id: item.id, delivery_rider_name: item.deliveryRiderName, description: item.description,
      juice_cups_count: item.juiceCupsCount, food_takeaways_count: item.foodTakeawaysCount,
      amount: item.amount, date: item.date, shift_type: item.shiftType, is_settled_weekly: item.isSettledWeekly,
    });
    if (error) {
      console.error('Failed to add delivery record:', error);
      alert('Error saving delivery record: ' + error.message);
    }
  };

  const handleUpdateDeliveryRecord = async (updated: DeliveryAccountRecord) => {
    setDeliveryRecordsState((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    const { error } = await supabase.from('delivery_records').update({
      delivery_rider_name: updated.deliveryRiderName, description: updated.description,
      juice_cups_count: updated.juiceCupsCount, food_takeaways_count: updated.foodTakeawaysCount,
      amount: updated.amount, date: updated.date, shift_type: updated.shiftType,
      is_settled_weekly: updated.isSettledWeekly, settled_date: updated.settledDate,
    }).eq('id', updated.id);
    if (error) {
      console.error('Failed to update delivery record:', error);
      alert('Error updating delivery record: ' + error.message);
    }
  };

  const handleSettleDeliveryRecord = async (id: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    setDeliveryRecordsState((prev) =>
      prev.map((d) => (d.id === id ? { ...d, isSettledWeekly: true, settledDate: todayStr } : d))
    );
    const { error } = await supabase.from('delivery_records').update({ is_settled_weekly: true, settled_date: todayStr }).eq('id', id);
    if (error) {
      console.error('Failed to settle delivery record:', error);
      alert('Error settling delivery record: ' + error.message);
    }

    const record = deliveryRecords.find(d => d.id === id);
    if (record) {
      const entry: LedgerEntry = {
        id: `led-del-rec-${id}-${Date.now()}`, date: todayStr, type: 'delivery_recovered',
        description: `Delivery Settled — ${record.deliveryRiderName}: ${record.description}`,
        amount: record.amount, sign: 1, referenceId: id, createdAt: Date.now(),
      };
      setLedgerEntriesState(prev => [entry, ...prev]);
      const { error: ledErr } = await supabase.from('ledger_entries').insert({
        id: entry.id, date: entry.date, type: entry.type, description: entry.description,
        amount: entry.amount, sign: entry.sign, reference_id: entry.referenceId, created_at_ts: entry.createdAt,
      });
      if (ledErr) console.error('Failed to save ledger entry for delivery:', ledErr);
    }
  };

  const handleDeleteDeliveryRecord = async (id: string) => {
    setDeliveryRecordsState((prev) => prev.filter((d) => d.id !== id));
    const { error: delErr } = await supabase.from('delivery_records').delete().eq('id', id);
    if (delErr) {
      console.error('Failed to delete delivery record:', delErr);
      alert('Error deleting delivery record: ' + delErr.message);
    }
    setLedgerEntriesState(prev => prev.filter(e => e.referenceId !== id));
    await supabase.from('ledger_entries').delete().eq('reference_id', id);
  };

  // ─── Purchase Trip Handlers ────────────────────────────────────────────────
  const handleAddTrip = async (tripData: Omit<PurchaseTrip, 'id' | 'createdAt'>) => {
    const tripId = 'trip-' + Date.now();
    const nowTs = Date.now();
    const trip: PurchaseTrip = { ...tripData, id: tripId, createdAt: nowTs };
    setPurchaseTripsState(prev => [trip, ...prev]);

    // Insert trip
    const { error: tripErr } = await supabase.from('purchase_trips').insert({
      id: trip.id, date: trip.date, notes: trip.notes,
      grand_total: trip.grandTotal, created_at_ts: nowTs,
    });

    if (tripErr) {
      console.error('Failed to save trip to Supabase:', tripErr);
      alert('Error saving purchase trip: ' + tripErr.message);
    }

    // Insert items
    for (const item of trip.items) {
      const { error: itemErr } = await supabase.from('purchase_trip_items').insert({
        id: item.id, trip_id: tripId, material_id: item.materialId || null,
        item_name: item.itemName, category: item.category, unit: item.unit,
        quantity: item.quantity, price_per_unit: item.pricePerUnit, total_price: item.totalPrice,
      });
      if (itemErr) console.error('Failed to save trip item:', itemErr);
    }

    // Ledger: purchase = money out
    const entry: LedgerEntry = {
      id: `led-trip-${tripId}`, date: trip.date, type: 'purchase_trip',
      description: `Inventory Purchase — ${trip.items.map(i => i.itemName).join(', ')}`,
      amount: trip.grandTotal, sign: -1, referenceId: tripId, createdAt: nowTs,
    };
    setLedgerEntriesState(prev => [entry, ...prev]);
    const { error: ledErr } = await supabase.from('ledger_entries').insert({
      id: entry.id, date: entry.date, type: entry.type, description: entry.description,
      amount: entry.amount, sign: entry.sign, reference_id: entry.referenceId, created_at_ts: entry.createdAt,
    });
    if (ledErr) console.error('Failed to save ledger entry for trip:', ledErr);
  };

  const handleDeleteTrip = async (id: string) => {
    setPurchaseTripsState(prev => prev.filter(t => t.id !== id));
    await supabase.from('purchase_trip_items').delete().eq('trip_id', id);
    const { error: delErr } = await supabase.from('purchase_trips').delete().eq('id', id);
    if (delErr) {
      console.error('Failed to delete purchase trip:', delErr);
      alert('Error deleting purchase trip: ' + delErr.message);
    }
    setLedgerEntriesState(prev => prev.filter(e => e.referenceId !== id));
    await supabase.from('ledger_entries').delete().eq('reference_id', id);
  };

  // ─── Month navigation ──────────────────────────────────────────────────────
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
              <motion.div key="calculator" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
                <ShiftReconciliationView
                  activeShift={activeShift} setActiveShift={setActiveShift}
                  config={config} lastClosedShift={lastClosedShift}
                  pendingPayments={pendingPayments} onSaveShift={handleSaveShift}
                  onAddPendingPayment={handleAddPendingPayment}
                  onAddDeliveryRecord={handleAddDeliveryRecord}
                  onSettlePendingPayment={handleSettlePendingPayment}
                  currencySymbol={currencySymbol}
                />
              </motion.div>
            )}

            {activeTab === 'pending' && (
              <motion.div key="pending" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
                <PendingPaymentsView
                  pendingPayments={pendingPayments}
                  onAddPendingPayment={handleAddPendingPayment}
                  onUpdatePendingPayment={handleUpdatePendingPayment}
                  onSettlePendingPayment={handleSettlePendingPayment}
                  onDeletePendingPayment={handleDeletePendingPayment}
                  currencySymbol={currencySymbol} config={config}
                />
              </motion.div>
            )}

            {activeTab === 'delivery' && (
              <motion.div key="delivery" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
                <DeliveryLedgerView
                  deliveryRecords={deliveryRecords}
                  onAddDeliveryRecord={handleAddDeliveryRecord}
                  onUpdateDeliveryRecord={handleUpdateDeliveryRecord}
                  onSettleDeliveryRecord={handleSettleDeliveryRecord}
                  onDeleteDeliveryRecord={handleDeleteDeliveryRecord}
                  currencySymbol={currencySymbol} config={config}
                />
              </motion.div>
            )}

            {activeTab === 'purchases' && (
              <motion.div key="purchases" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
                <MarketPurchasesView
                  purchaseTrips={purchaseTrips}
                  onAddTrip={handleAddTrip}
                  onDeleteTrip={handleDeleteTrip}
                  currencySymbol={currencySymbol}
                />
              </motion.div>
            )}

            {activeTab === 'account' && (
              <motion.div key="account" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
                <AccountView
                  ledgerEntries={ledgerEntries}
                  shifts={shifts}
                  pendingPayments={pendingPayments}
                  purchaseTrips={purchaseTrips}
                  currencySymbol={currencySymbol}
                />
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div key="history" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
                <ShiftHistoryView
                  shifts={shifts} onUpdateShift={handleUpdateShift}
                  onDeleteShift={handleDeleteShift} currencySymbol={currencySymbol}
                />
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
                <BudgetSettings config={config} onSaveConfig={setConfig} summary={summary} />
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
