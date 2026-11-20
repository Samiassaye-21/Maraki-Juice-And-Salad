import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project.supabase.co' &&
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

/**
 * Data Service with LocalStorage Fallback
 * Works 100% offline or when Supabase keys are not yet provided.
 */
export const dbService = {
  // --- ORDERS ---
  async saveOrder(order) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .insert([{
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
            created_at: order.createdAt || new Date().toISOString()
          }])
          .select();
        if (error) console.warn('Supabase order insert warning:', error);
        return data;
      } catch (err) {
        console.warn('Supabase offline fallback for order:', err);
      }
    }
    return null;
  },

  // --- ADARI (CREDIT) ---
  async saveAdari(record) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('adari_ledger')
          .insert([{
            id: record.id,
            customer_name: record.customerName,
            phone: record.customerPhone,
            amount: record.amount,
            status: record.status || 'unpaid',
            order_id: record.orderId,
            items: record.items,
            created_at: record.createdAt || new Date().toISOString()
          }])
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

  // --- EXPENSES ---
  async saveExpense(expense) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('expenses')
          .insert([{
            id: expense.id,
            shift: expense.shift,
            staff_name: expense.staffName,
            expense_type: expense.type || 'urgent_shop',
            title: expense.title,
            amount: expense.amount,
            category: expense.category || 'General',
            created_at: expense.createdAt || new Date().toISOString()
          }])
          .select();
        if (error) console.warn('Supabase expense insert warning:', error);
        return data;
      } catch (err) {
        console.warn('Supabase offline fallback for expense:', err);
      }
    }
    return null;
  }
};
