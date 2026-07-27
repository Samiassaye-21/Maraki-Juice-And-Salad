import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  RestaurantSystemConfig, 
  ShiftRecord, 
  PendingPaymentItem, 
  DeliveryAccountRecord 
} from '../types';

interface MigrationProps {
  onMigrationComplete: () => void;
}

export function SupabaseMigration({ onMigrationComplete }: MigrationProps) {
  const [isMigrating, setIsMigrating] = useState(false);
  const [status, setStatus] = useState<string>('');

  const handleMigrate = async () => {
    setIsMigrating(true);
    setStatus('Reading local storage...');

    try {
      const configStr = localStorage.getItem('maraki_config_v1');
      const shiftsStr = localStorage.getItem('maraki_shifts_v1');
      const pendingStr = localStorage.getItem('maraki_pending_v1');
      const deliveryStr = localStorage.getItem('maraki_delivery_v1');

      if (configStr) {
        setStatus('Migrating config...');
        const config: RestaurantSystemConfig = JSON.parse(configStr);
        await supabase.from('config').upsert({
          id: 1,
          default_juice_unit_price: config.defaultJuiceUnitPrice,
          default_food_unit_price: config.defaultFoodUnitPrice,
          food_menu: config.foodMenu,
          currency_symbol: config.currencySymbol,
          day_shift_worker_name: config.dayShiftWorkerName,
          night_shift_worker_name: config.nightShiftWorkerName,
          restaurant_name: config.restaurantName
        });
      }

      if (shiftsStr) {
        setStatus('Migrating shifts...');
        const shifts: ShiftRecord[] = JSON.parse(shiftsStr);
        for (const shift of shifts) {
          await supabase.from('shifts').upsert({
            id: shift.id,
            date: shift.date,
            shift_type: shift.shiftType,
            worker_name: shift.workerName,
            juice_cups: shift.juiceCups,
            food_takeaways: shift.foodTakeaways,
            juice_cups_sold: shift.juiceCupsSold,
            juice_revenue: shift.juiceRevenue,
            food_takeaways_sold: shift.foodTakeawaysSold,
            food_revenue: shift.foodRevenue,
            gross_income: shift.grossIncome,
            digital_transfers: shift.digitalTransfers,
            daily_expenses: shift.dailyExpenses,
            expense_items: shift.expenseItems,
            new_pending_payments_amount: shift.newPendingPaymentsAmount,
            recovered_pending_amount: shift.recoveredPendingAmount,
            delivery_credit_amount: shift.deliveryCreditAmount,
            net_cash_due_to_owner: shift.netCashDueToOwner,
            notes: shift.notes,
            is_closed: shift.isClosed,
            timestamp: shift.timestamp
          });
        }
      }

      if (pendingStr) {
        setStatus('Migrating pending payments...');
        const pending: PendingPaymentItem[] = JSON.parse(pendingStr);
        for (const p of pending) {
          await supabase.from('pending_payments').upsert({
            id: p.id,
            shift_type: p.shiftType,
            customer_name: p.customerName,
            description: p.description,
            juice_cups_count: p.juiceCupsCount,
            food_takeaways_count: p.foodTakeawaysCount,
            itemized_breakdown: p.itemizedBreakdown,
            amount: p.amount,
            date: p.date,
            is_paid: p.isPaid,
            paid_date: p.paidDate
          });
        }
      }

      if (deliveryStr) {
        setStatus('Migrating delivery records...');
        const delivery: DeliveryAccountRecord[] = JSON.parse(deliveryStr);
        for (const d of delivery) {
          await supabase.from('delivery_records').upsert({
            id: d.id,
            delivery_rider_name: d.deliveryRiderName,
            description: d.description,
            juice_cups_count: d.juiceCupsCount,
            food_takeaways_count: d.foodTakeawaysCount,
            amount: d.amount,
            date: d.date,
            shift_type: d.shiftType,
            is_settled_weekly: d.isSettledWeekly,
            settled_date: d.settledDate
          });
        }
      }

      setStatus('Migration complete! Removing local storage data...');
      
      // Clear local storage so we don't migrate again
      localStorage.removeItem('maraki_config_v1');
      localStorage.removeItem('maraki_shifts_v1');
      localStorage.removeItem('maraki_pending_v1');
      localStorage.removeItem('maraki_delivery_v1');

      setTimeout(() => {
        onMigrationComplete();
      }, 1500);

    } catch (error: any) {
      console.error('Migration error:', error);
      setStatus(`Error: ${error.message}`);
      setIsMigrating(false);
    }
  };

  const hasLocalData = !!localStorage.getItem('maraki_shifts_v1');

  if (!hasLocalData) return null;

  return (
    <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 p-4 rounded-xl mb-6 mx-4 sm:mx-6 flex items-center justify-between">
      <div>
        <h3 className="font-bold text-amber-900 dark:text-amber-200">Local Data Found</h3>
        <p className="text-sm text-amber-800 dark:text-amber-300 mt-1">{status || 'You have existing data stored in this browser. Migrate it to your new Supabase database so you don\'t lose it.'}</p>
      </div>
      <button 
        onClick={handleMigrate} 
        disabled={isMigrating}
        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-sm disabled:opacity-50"
      >
        {isMigrating ? 'Migrating...' : 'Migrate to Database'}
      </button>
    </div>
  );
}
