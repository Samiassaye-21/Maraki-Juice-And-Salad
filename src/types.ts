export type ShiftType = 'day' | 'night';

export type PaymentMethod = 'cash' | 'digital_transfer' | 'pending_credit' | 'delivery_credit';

export interface InventoryItemState {
  openingCount: number;  // Carried over from previous shift's leftover
  addedCount: number;    // Additional cups/takeaways added during shift
  remainingCount: number;// Counted at end of shift
  unitPrice: number;     // Price per cup or container in ETB
}

export interface DailyExpenseItem {
  id: string;
  title: string;       // e.g. "Vegetables & Spices", "Fruits & Milk"
  category: 'cooking_ingredients' | 'fruits_juice' | 'utilities_gas' | 'other_expense';
  amount: number;      // Paid by worker out of shift cash
  notes?: string;
  time?: string;
}

export interface PendingPaymentItem {
  id: string;
  shiftType: ShiftType;
  customerName?: string;
  description: string;  // e.g. "3 Juices & 1 Meal"
  juiceCupsCount: number;
  foodTakeawaysCount: number;
  itemizedBreakdown?: { [itemName: string]: number }; // Detail type of food & quantities
  amount: number;       // Monetary value in ETB
  date: string;
  isPaid: boolean;
  paidDate?: string;
}

export interface DeliveryAccountRecord {
  id: string;
  deliveryRiderName: string; // e.g., "BeU Delivery", "Deliver Addis", "Rider Abebe"
  description: string;       // e.g., "5 Takeaway Meals + 3 Mango Juices"
  juiceCupsCount: number;
  foodTakeawaysCount: number;
  amount: number;
  date: string;
  shiftType: ShiftType;
  isSettledWeekly: boolean;
  settledDate?: string;
}

export interface ShiftRecord {
  id: string;
  date: string;                 // YYYY-MM-DD
  shiftType: ShiftType;         // 'day' or 'night'
  workerName: string;           // e.g., "Makeda (Day Worker)" or "Tewodros (Night Worker)"
  
  // Inventory Counts
  juiceCups: InventoryItemState;      // Cup inventory
  foodTakeaways: InventoryItemState;  // Takeaway container inventory
  
  // Calculated Revenues
  juiceCupsSold: number;
  juiceRevenue: number;
  foodTakeawaysSold: number;
  foodRevenue: number;
  grossIncome: number;                // Total Gross Revenue (Juice + Food)

  // Financial Additions & Deductions
  digitalTransfers: number;           // Paid directly to owner (Telebirr, CBE Birr)
  dailyExpenses: number;              // Cooking ingredients & daily market expenses
  expenseItems: DailyExpenseItem[];   // Itemized list of expenses
  
  newPendingPaymentsAmount: number;   // Customers who ate/drank on credit this shift
  recoveredPendingAmount: number;     // Past pending debts paid off in cash during this shift
  
  deliveryCreditAmount: number;       // Orders taken by delivery riders to be paid weekly
  
  // Final Net Cash Due to Owner (Birr worker physically hands over)
  netCashDueToOwner: number;
  
  // Status & Notes
  notes?: string;
  isClosed: boolean;
  timestamp: number;
}

export interface FoodMenuItem {
  id: string;
  name: string;          // e.g., "Special Beyaynetu", "Beef Tibs", "Shiro Tegabeno"
  price: number;         // Price in ETB (e.g., 200 ETB, 280 ETB)
  category?: 'traditional' | 'fast_food' | 'breakfast' | 'special';
  available?: boolean;
}

export interface RestaurantSystemConfig {
  defaultJuiceUnitPrice: number;     // Juice price per cup in ETB (e.g., 170 ETB, editable)
  defaultFoodUnitPrice: number;      // Default food price per takeaway container in ETB
  foodMenu: FoodMenuItem[];          // Customizable food menu with individual item prices
  currencySymbol: string;            // 'Br ETB' or 'Br'
  dayShiftWorkerName: string;
  nightShiftWorkerName: string;
  restaurantName: string;
}

export interface SystemSummaryStats {
  totalGrossIncome: number;
  totalNetCashCollected: number;
  totalDigitalTransfers: number;
  totalExpensesPaid: number;
  totalPendingOutstanding: number;
  totalDeliveryUnsettled: number;
  dayShiftIncomeTotal: number;
  nightShiftIncomeTotal: number;
  currentJuiceStockLeft: number;
  currentTakeawayStockLeft: number;
}
