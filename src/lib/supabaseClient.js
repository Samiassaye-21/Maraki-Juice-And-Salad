import { createClient } from '@supabase/supabase-js';
import { getOrderBeuMetrics } from '../utils/beuHelpers';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  !supabaseUrl.includes('placeholder')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    })
  : null;

const appStateTimers = new Map();
let isApplyingRemoteSync = false;

export const setApplyingRemoteSync = (val) => {
  isApplyingRemoteSync = Boolean(val);
};

/**
 * Data Service with LocalStorage Fallback
 * Works 100% offline or when Supabase keys are not yet provided.
 */
export const dbService = {
  // --- APP STATE (JSONB Key-Value Sync for Settings, Plans, Inventory, Settlements, Reminders) ---
  async fetchAllAppState() {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('app_state')
          .select('key, value');
        if (error) {
          console.warn('Supabase app_state fetch warning:', error);
          return null;
        }
        const map = {};
        (data || []).forEach(row => {
          map[row.key] = row.value;
        });
        return map;
      } catch (err) {
        console.warn('Supabase offline fallback for fetchAllAppState:', err);
      }
    }
    return null;
  },

  saveAppState(key, value) {
    if (!isSupabaseConfigured || !supabase || !key || isApplyingRemoteSync) return;
    if (appStateTimers.has(key)) {
      clearTimeout(appStateTimers.get(key));
    }
    const timer = setTimeout(async () => {
      appStateTimers.delete(key);
      try {
        const { error } = await supabase
          .from('app_state')
          .upsert(
            [{ key, value, updated_at: new Date().toISOString() }],
            { onConflict: 'key' }
          );
        if (error) console.warn(`Supabase app_state save warning (${key}):`, error);
      } catch (err) {
        console.warn(`Supabase offline fallback for app_state (${key}):`, err);
      }
    }, 350);
    appStateTimers.set(key, timer);
  },

  async deleteAppState(key) {
    if (!isSupabaseConfigured || !supabase || !key) return null;
    try {
      const { error } = await supabase.from('app_state').delete().eq('key', key);
      if (error) console.warn(`Supabase app_state delete warning (${key}):`, error);
    } catch (err) {
      console.warn(`Supabase offline fallback for deleteAppState (${key}):`, err);
    }
    return null;
  },

  async clearAllCloudData({ includeSettings = false } = {}) {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      await Promise.all([
        supabase.from('orders').delete().neq('id', ''),
        supabase.from('adari_ledger').delete().neq('id', ''),
        supabase.from('expenses').delete().neq('id', ''),
        supabase.from('packaging_audits').delete().neq('id', '')
      ]);
      const dataKeys = [
        'maraki_shift_settlements',
        'maraki_box_purchases_v1',
        'maraki_box_manual_issues_v1',
        'maraki_box_starting_stock',
        'maraki_waste_boxes',
        'maraki_waste_cups',
        'maraki_shift_manual_transfers',
        'maraki_waiter_pending_debts',
        'maraki_actual_expenses',
        'maraki_day_closes',
        'maraki_plan_recurring',
        'maraki_plan_purchases',
        'maraki_plan_salaries',
        'maraki_plan_tasks',
        'maraki_plan_goals',
        'maraki_plan_notes',
        'maraki_opening_cash_balance',
        'maraki_expected_income',
        'maraki_price_change_log_v1',
        'maraki_schedule_reminders'
      ];
      if (includeSettings) {
        dataKeys.push(
          'maraki_standard_juice_price',
          'maraki_shift_default_waiters_v1',
          'maraki_waiters_list_v3',
          'maraki_stock_thresholds_v1',
          'maraki_menu_edit_pin_lock'
        );
      }
      await supabase.from('app_state').delete().in('key', dataKeys);
    } catch (err) {
      console.warn('Supabase clearAllCloudData warning:', err);
    }
    return null;
  },

  // --- MENU ITEMS ---
  async fetchMenuItems() {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('menu_items')
          .select('*')
          .order('created_at', { ascending: true });
        if (error) {
          console.warn('Supabase menu_items fetch warning:', error);
          return null;
        }
        return (data || []).map(row => ({
          id: row.id,
          name: row.name,
          englishName: row.english_name || row.name,
          category: row.category || 'Other',
          itemType: row.menu_type === 'Juice' || row.container_type === 'cup' ? 'juice' : 'food',
          price: Number(row.price) || 0,
          homePrice: row.home_price !== null && row.home_price !== undefined ? Number(row.home_price) : null,
          originalPrice: row.original_price !== null && row.original_price !== undefined ? Number(row.original_price) : null,
          containerType: row.container_type || 'box',
          isAvailable: row.is_available !== false,
          emoji: row.emoji || (row.container_type === 'cup' ? '🥤' : '🥗'),
          imageUrl: row.image_url || undefined,
          description: row.description || ''
        }));
      } catch (err) {
        console.warn('Supabase offline fallback for fetchMenuItems:', err);
      }
    }
    return null;
  },

  async syncMenuItems(nextMenu, prevMenu = []) {
    if (isSupabaseConfigured && supabase) {
      try {
        const rows = (nextMenu || []).map(item => ({
          id: item.id,
          name: item.name,
          english_name: item.englishName || item.name,
          category: item.category || 'Other',
          menu_type: item.itemType === 'juice' || item.containerType === 'cup' ? 'Juice' : 'Food',
          price: Number(item.price) || 0,
          home_price: item.homePrice !== null && item.homePrice !== undefined && item.homePrice !== '' ? Number(item.homePrice) : null,
          original_price: item.originalPrice !== null && item.originalPrice !== undefined && item.originalPrice !== '' ? Number(item.originalPrice) : null,
          container_type: item.containerType === 'cup' || item.itemType === 'juice' ? 'cup' : 'box',
          is_available: item.isAvailable !== false,
          emoji: item.emoji || '🥗',
          image_url: item.imageUrl || null,
          description: item.description || ''
        }));

        if (rows.length > 0) {
          const { error: upsertError } = await supabase
            .from('menu_items')
            .upsert(rows, { onConflict: 'id' });
          if (upsertError) console.warn('Supabase menu_items upsert warning:', upsertError);
        }

        const nextIds = new Set((nextMenu || []).map(i => i.id));
        const deletedIds = (prevMenu || []).map(i => i.id).filter(id => !nextIds.has(id));
        if (deletedIds.length > 0) {
          const { error: deleteError } = await supabase
            .from('menu_items')
            .delete()
            .in('id', deletedIds);
          if (deleteError) console.warn('Supabase menu_items delete warning:', deleteError);
        }
        return true;
      } catch (err) {
        console.warn('Supabase offline fallback for syncMenuItems:', err);
      }
    }
    return null;
  },

  // --- ORDERS ---
  async fetchOrders() {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) {
          console.warn('Supabase orders fetch warning:', error);
          return null;
        }
        return (data || []).map(row => {
          const items = Array.isArray(row.items) ? row.items : [];
          const baseOrder = {
            id: row.id,
            shift: row.shift,
            staffName: row.staff_name,
            waiterName: row.waiter_name,
            ethiopianDate: row.ethiopian_date,
            channel: row.channel,
            orderType: row.order_type || 'Takeaway',
            beuOrderId: row.beu_order_id,
            paymentMethod: row.payment_method,
            totalAmount: Number(row.total_amount) || 0,
            cupsUsed: Number(row.cups_used) || 0,
            boxesUsed: Number(row.boxes_used) || 0,
            boxesCount: Number(row.boxes_used) || items.reduce((s, i) => s + Number(i.qty || 0), 0),
            isBeuOrder: row.channel === 'BEU Delivery',
            items,
            status: row.status || '🍳 በኩሽና ተዘጋጅቷል (Cooked by Chef)',
            timestamp: row.created_at
              ? new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '',
            createdAt: row.created_at
          };
          const beu = getOrderBeuMetrics(baseOrder);
          return {
            ...baseOrder,
            beuDeductionPct: beu.isBeu && beu.deductionAmount > 0 ? 15 : 0,
            normalSubtotal: beu.normalSubtotal,
            beuDeductionAmount: beu.deductionAmount
          };
        });
      } catch (err) {
        console.warn('Supabase offline fallback for fetchOrders:', err);
      }
    }
    return null;
  },

  async saveOrder(order) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .upsert([{
            id: order.id,
            shift: order.shift,
            staff_name: order.staffName,
            waiter_name: order.waiterName || null,
            ethiopian_date: order.ethiopianDate || null,
            channel: order.channel === 'BEU Delivery' ? 'BEU Delivery' : 'In-Store',
            order_type: order.orderType || 'Takeaway',
            beu_order_id: order.beuOrderId || null,
            payment_method: order.paymentMethod,
            total_amount: order.totalAmount,
            cups_used: order.cupsUsed || 0,
            boxes_used: order.boxesUsed || 0,
            items: order.items,
            status: order.status || null,
            created_at: order.createdAt || new Date().toISOString()
          }], { onConflict: 'id' })
          .select();
        if (error) console.warn('Supabase order insert warning:', error);
        return data;
      } catch (err) {
        console.warn('Supabase offline fallback for order:', err);
      }
    }
    return null;
  },

  async updateOrder(id, patch) {
    if (isSupabaseConfigured && supabase && id) {
      try {
        const dbPatch = {};
        if (patch.status !== undefined) dbPatch.status = patch.status;
        if (patch.ethiopianDate !== undefined) dbPatch.ethiopian_date = patch.ethiopianDate;
        if (patch.waiterName !== undefined) dbPatch.waiter_name = patch.waiterName;
        if (patch.paymentMethod !== undefined) dbPatch.payment_method = patch.paymentMethod;
        if (patch.totalAmount !== undefined) dbPatch.total_amount = patch.totalAmount;
        const { error } = await supabase.from('orders').update(dbPatch).eq('id', id);
        if (error) console.warn('Supabase order update warning:', error);
      } catch (err) {
        console.warn('Supabase offline fallback for updateOrder:', err);
      }
    }
    return null;
  },

  async deleteOrder(id) {
    if (isSupabaseConfigured && supabase && id) {
      try {
        const { error } = await supabase.from('orders').delete().eq('id', id);
        if (error) console.warn('Supabase order delete warning:', error);
      } catch (err) {
        console.warn('Supabase offline fallback for deleteOrder:', err);
      }
    }
    return null;
  },

  async deleteOrdersByDate(ethiopianDate) {
    if (isSupabaseConfigured && supabase && ethiopianDate) {
      try {
        const { error } = await supabase.from('orders').delete().eq('ethiopian_date', ethiopianDate);
        if (error) console.warn('Supabase deleteOrdersByDate warning:', error);
      } catch (err) {
        console.warn('Supabase offline fallback for deleteOrdersByDate:', err);
      }
    }
    return null;
  },

  async clearAllOrders() {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('orders').delete().neq('id', '');
        if (error) console.warn('Supabase clearAllOrders warning:', error);
      } catch (err) {
        console.warn('Supabase offline fallback for clearAllOrders:', err);
      }
    }
    return null;
  },

  // --- ADARI / WAITER PENDING DEBTS ---
  async fetchAdari() {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('adari_ledger')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) {
          console.warn('Supabase adari fetch warning:', error);
          return null;
        }
        return data || [];
      } catch (err) {
        console.warn('Supabase offline fallback for fetchAdari:', err);
      }
    }
    return null;
  },

  async saveAdari(record) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('adari_ledger')
          .upsert([{
            id: record.id,
            customer_name: record.customerName || record.waiterName || 'Waiter',
            phone: record.customerPhone || record.ethiopianDate || null,
            amount: Number(record.amount || record.expectedCash) || 0,
            status: record.status === 'paid' || record.status === 'settled' ? 'paid' : 'unpaid',
            order_id: record.orderId || null,
            items: record.items || record,
            created_at: record.createdAt || new Date().toISOString()
          }], { onConflict: 'id' })
          .select();
        if (error) console.warn('Supabase adari insert warning:', error);
        return data;
      } catch (err) {
        console.warn('Supabase offline fallback for adari:', err);
      }
    }
    return null;
  },

  async settleAdari(id, settleDetails) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('adari_ledger')
          .update({
            status: 'paid',
            settled_at: new Date().toISOString(),
            settled_method: settleDetails.method,
            settled_by: settleDetails.staff
          })
          .eq('id', id);
        if (error) console.warn('Supabase settle adari error:', error);
        return data;
      } catch (err) {
        console.warn('Supabase offline fallback for settle adari:', err);
      }
    }
    return null;
  },

  async syncAdariList(nextList = [], prevList = []) {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const rows = nextList.map(record => ({
        id: record.id,
        customer_name: record.waiterName || record.customerName || 'Waiter',
        phone: record.ethiopianDate || record.customerPhone || null,
        amount: Number(record.expectedCash ?? record.amount) || 0,
        status: record.status === 'paid' || record.status === 'settled' ? 'paid' : 'unpaid',
        order_id: record.orderId || null,
        items: record,
        settled_at: record.settledAt || null,
        settled_method: ['Cash', 'Telebirr', 'CBE Birr'].includes(record.settledMethod) ? record.settledMethod : null,
        settled_by: record.settledBy || null,
        created_at: record.createdAt || new Date().toISOString()
      }));
      if (rows.length > 0) {
        const { error } = await supabase.from('adari_ledger').upsert(rows, { onConflict: 'id' });
        if (error) console.warn('Supabase syncAdariList upsert warning:', error);
      }
      const nextIds = new Set(nextList.map(r => r.id));
      const deletedIds = prevList.map(r => r.id).filter(id => !nextIds.has(id));
      if (deletedIds.length > 0) {
        const { error } = await supabase.from('adari_ledger').delete().in('id', deletedIds);
        if (error) console.warn('Supabase syncAdariList delete warning:', error);
      }
    } catch (err) {
      console.warn('Supabase offline fallback for syncAdariList:', err);
    }
    return null;
  },

  // --- EXPENSES ---
  async fetchExpenses() {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('expenses')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) {
          console.warn('Supabase expenses fetch warning:', error);
          return null;
        }
        return (data || []).map(row => ({
          id: row.id,
          shift: row.shift,
          staffName: row.staff_name,
          type: row.expense_type,
          title: row.title,
          amount: Number(row.amount) || 0,
          category: row.category || 'General',
          createdAt: row.created_at
        }));
      } catch (err) {
        console.warn('Supabase offline fallback for fetchExpenses:', err);
      }
    }
    return null;
  },

  async saveExpense(expense) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('expenses')
          .upsert([{
            id: expense.id,
            shift: expense.shift || null,
            staff_name: expense.staffName || null,
            expense_type: expense.type === 'bulk_raw_material' ? 'bulk_raw_material' : 'urgent_shop',
            title: expense.title,
            amount: Number(expense.amount) || 0,
            category: expense.category || 'General',
            created_at: expense.createdAt || new Date().toISOString()
          }], { onConflict: 'id' })
          .select();
        if (error) console.warn('Supabase expense insert warning:', error);
        return data;
      } catch (err) {
        console.warn('Supabase offline fallback for expense:', err);
      }
    }
    return null;
  },

  async syncExpenses(nextExpenses = [], prevExpenses = []) {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const rows = nextExpenses.map(exp => ({
        id: exp.id,
        shift: exp.shift || null,
        staff_name: exp.staffName || null,
        expense_type: exp.type === 'bulk_raw_material' ? 'bulk_raw_material' : 'urgent_shop',
        title: exp.title || exp.description || 'Expense',
        amount: Number(exp.amount) || 0,
        category: exp.category || 'General',
        created_at: exp.createdAt || new Date().toISOString()
      }));
      if (rows.length > 0) {
        const { error } = await supabase.from('expenses').upsert(rows, { onConflict: 'id' });
        if (error) console.warn('Supabase syncExpenses upsert warning:', error);
      }
      const nextIds = new Set(nextExpenses.map(e => e.id));
      const deletedIds = prevExpenses.map(e => e.id).filter(id => !nextIds.has(id));
      if (deletedIds.length > 0) {
        const { error } = await supabase.from('expenses').delete().in('id', deletedIds);
        if (error) console.warn('Supabase syncExpenses delete warning:', error);
      }
    } catch (err) {
      console.warn('Supabase offline fallback for syncExpenses:', err);
    }
    return null;
  },

  // --- PACKAGING AUDITS (SHIFT RECONCILIATION) ---
  async fetchPackagingAudits() {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('packaging_audits')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) {
          console.warn('Supabase packaging_audits fetch warning:', error);
          return null;
        }
        return data || [];
      } catch (err) {
        console.warn('Supabase offline fallback for fetchPackagingAudits:', err);
      }
    }
    return null;
  },

  async upsertPackagingAudit(settlement) {
    if (!isSupabaseConfigured || !supabase || !settlement) return null;
    try {
      const row = {
        id: settlement.id,
        shift: settlement.shift || 'Day',
        opening_cups: Number(settlement.openingCups) || 0,
        opening_boxes: Number(settlement.openingBoxes) || 0,
        cups_sold: Number(settlement.cupsSold) || 0,
        boxes_sold: Number(settlement.boxesSold) || 0,
        waste_cups: Number(settlement.wasteCups) || 0,
        waste_boxes: Number(settlement.wasteBoxes) || 0,
        closing_cups_physical: settlement.cupsLeft !== undefined ? Number(settlement.cupsLeft) : null,
        closing_boxes_physical: settlement.boxesLeft !== undefined ? Number(settlement.boxesLeft) : null,
        audited_by: settlement.waiterName || settlement.staffName || 'Cashier',
        created_at: settlement.timestamp || new Date().toISOString()
      };
      const { error } = await supabase
        .from('packaging_audits')
        .upsert([row], { onConflict: 'id' });
      if (error) console.warn('Supabase packaging_audits upsert warning:', error);
    } catch (err) {
      console.warn('Supabase offline fallback for upsertPackagingAudit:', err);
    }
    return null;
  }
};
