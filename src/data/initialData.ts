import { 
  RestaurantSystemConfig, 
  ShiftRecord, 
  PendingPaymentItem, 
  DeliveryAccountRecord,
  FoodMenuItem,
  MaterialCatalogItem
} from '../types';

export const DEFAULT_FOOD_MENU: FoodMenuItem[] = [
  { id: 'fm-1', name: 'ማራኪ ኮመቦ ሳላድ', price: 430, category: 'special', available: true },
  { id: 'fm-2', name: 'ሳላድ', price: 320, category: 'special', available: true },
  { id: 'fm-3', name: 'ፓስታ በሳላድ', price: 320, category: 'fast_food', available: true },
  { id: 'fm-4', name: 'ሩዝ በሳላድ', price: 320, category: 'fast_food', available: true },
  { id: 'fm-5', name: 'ፓስታ በአትክልት', price: 320, category: 'fast_food', available: true },
  { id: 'fm-6', name: 'ሩዝ በአትክልት', price: 320, category: 'fast_food', available: true },
  { id: 'fm-7', name: 'ፓስታ በአንቁላል', price: 320, category: 'fast_food', available: true },
  { id: 'fm-8', name: 'ሩዝ በእንቁላል', price: 320, category: 'fast_food', available: true },
  { id: 'fm-9', name: 'እንቁላል ፍርፍር', price: 230, category: 'breakfast', available: true },
  { id: 'fm-10', name: 'እንቁላል ስልስ', price: 230, category: 'breakfast', available: true },
  { id: 'fm-11', name: 'እንቁላል ሳንድዊች', price: 120, category: 'breakfast', available: true },
  { id: 'fm-12', name: 'አትክልት ሳንድዊች', price: 100, category: 'breakfast', available: true },
  { id: 'fm-13', name: 'ፍሩት ፓንች', price: 320, category: 'special', available: true },
  { id: 'fm-14', name: 'ፍርፍር', price: 200, category: 'traditional', available: true },
  { id: 'fm-15', name: 'ፓስታ በስጎ', price: 200, category: 'fast_food', available: true },
  { id: 'fm-16', name: 'ቴስቲሶያ', price: 200, category: 'traditional', available: true },
];

export const DEFAULT_RESTAURANT_CONFIG: RestaurantSystemConfig = {
  defaultJuiceUnitPrice: 170,    // 170 ETB per juice cup (editable anytime)
  defaultFoodUnitPrice: 220,    // 220 ETB per food takeaway
  foodMenu: DEFAULT_FOOD_MENU,
  currencySymbol: 'Br ETB',
  dayShiftWorkerName: 'Makeda (Day Shift)',
  nightShiftWorkerName: 'Tewodros (Night Shift)',
  restaurantName: 'Maraki Juice and Salad',
};

const today = new Date().toISOString().split('T')[0];
const yesterdayDate = new Date(Date.now() - 86400000).toISOString().split('T')[0];

export const INITIAL_SHIFTS: ShiftRecord[] = [
  {
    id: 'shift-102',
    date: today,
    shiftType: 'night',
    workerName: 'Tewodros (Night Shift)',
    juiceCups: {
      openingCount: 95,
      addedCount: 50,
      remainingCount: 108,
      unitPrice: 170,
    },
    foodTakeaways: {
      openingCount: 60,
      addedCount: 30,
      remainingCount: 62,
      unitPrice: 220,
    },
    juiceCupsSold: 37,         // (95+50) - 108 = 37 cups * 170 ETB = 6,290 ETB
    juiceRevenue: 6290,
    foodTakeawaysSold: 28,     // (60+30) - 62 = 28 takeaways * 220 ETB = 6,160 ETB
    foodRevenue: 6160,
    grossIncome: 12450,        // 6,290 + 6,160 = 12,450 ETB
    digitalTransfers: 1800,    // Sent directly to Telebirr / CBE Birr
    dailyExpenses: 950,        // Bought night onions, meat, fresh fruits
    expenseItems: [
      { id: 'exp-1', title: 'Night Market Vegetables & Meat', category: 'cooking_ingredients', amount: 650 },
      { id: 'exp-2', title: 'Avocado & Banana Restock', category: 'fruits_juice', amount: 300 },
    ],
    newPendingPaymentsAmount: 680,  // 4 unpaid juices (680 ETB)
    recoveredPendingAmount: 340,    // Collected 2 past pending juices in cash
    deliveryCreditAmount: 880,      // 4 takeaway boxes for BeU Delivery (220 * 4)
    netCashDueToOwner: 8480,        // 12,450 + 340 - 1,800 - 950 - 680 - 880 = 8,480 ETB
    notes: 'Night shift smooth handover. Stock counted at 02:00 AM.',
    isClosed: true,
    timestamp: Date.now() - 12000000,
  },
  {
    id: 'shift-101',
    date: today,
    shiftType: 'day',
    workerName: 'Makeda (Day Shift)',
    juiceCups: {
      openingCount: 140,
      addedCount: 0,
      remainingCount: 95,
      unitPrice: 170,
    },
    foodTakeaways: {
      openingCount: 100,
      addedCount: 0,
      remainingCount: 60,
      unitPrice: 220,
    },
    juiceCupsSold: 45,        // (140) - 95 = 45 cups * 170 = 7,650 ETB
    juiceRevenue: 7650,
    foodTakeawaysSold: 40,    // (100) - 60 = 40 takeaways * 220 = 8,800 ETB
    foodRevenue: 8800,
    grossIncome: 16450,       // 7,650 + 8,800 = 16,450 ETB
    digitalTransfers: 2400,   // Paid to owner Telebirr
    dailyExpenses: 1200,      // Cooking gas & morning salad supplies
    expenseItems: [
      { id: 'exp-3', title: 'Morning Cooking Oil & Gas refill', category: 'utilities_gas', amount: 800 },
      { id: 'exp-4', title: 'Fresh Tomatoes & Milk', category: 'cooking_ingredients', amount: 400 },
    ],
    newPendingPaymentsAmount: 710, // 1 Special Beyaynetu + 3 juices
    recoveredPendingAmount: 0,
    deliveryCreditAmount: 1100,    // 5 meals for Deliver Addis
    netCashDueToOwner: 11040,      // 16,450 - 2,400 - 1,200 - 710 - 1,100 = 11,040 ETB
    notes: 'Busy morning shift.',
    isClosed: true,
    timestamp: Date.now() - 40000000,
  }
];

export const INITIAL_PENDING_PAYMENTS: PendingPaymentItem[] = [
  {
    id: 'pend-1',
    shiftType: 'day',
    customerName: 'Abebe (Regular Customer)',
    description: '3 Juices & 1 Special Beyaynetu',
    juiceCupsCount: 3,
    foodTakeawaysCount: 1,
    amount: 710, // (3 * 170) + (1 * 200) = 710 ETB
    date: today,
    isPaid: false,
  },
  {
    id: 'pend-2',
    shiftType: 'night',
    customerName: 'Kebenesh',
    description: '4 Mango Juices',
    juiceCupsCount: 4,
    foodTakeawaysCount: 0,
    amount: 680, // 4 * 170 = 680 ETB
    date: today,
    isPaid: false,
  },
  {
    id: 'pend-3',
    shiftType: 'day',
    customerName: 'Tigist',
    description: '2 Takeaway Food Boxes',
    juiceCupsCount: 0,
    foodTakeawaysCount: 2,
    amount: 440, // 2 * 220 = 440 ETB
    date: yesterdayDate,
    isPaid: true,
    paidDate: today,
  },
];

export const INITIAL_DELIVERY_RECORDS: DeliveryAccountRecord[] = [
  {
    id: 'del-1',
    deliveryRiderName: 'BeU Delivery',
    description: '4 Takeaway Food Meals (Night Shift)',
    juiceCupsCount: 0,
    foodTakeawaysCount: 4,
    amount: 880,
    date: today,
    shiftType: 'night',
    isSettledWeekly: false,
  },
  {
    id: 'del-2',
    deliveryRiderName: 'Deliver Addis (Rider Kebede)',
    description: '5 Meals + 2 Smoothies (Day Shift)',
    juiceCupsCount: 2,
    foodTakeawaysCount: 5,
    amount: 1260,
    date: today,
    shiftType: 'day',
    isSettledWeekly: false,
  },
  {
    id: 'del-3',
    deliveryRiderName: 'Feres Delivery',
    description: 'Weekly Settlement Paid',
    juiceCupsCount: 10,
    foodTakeawaysCount: 12,
    amount: 3440,
    date: yesterdayDate,
    shiftType: 'day',
    isSettledWeekly: true,
    settledDate: today,
  },
];

// ─── Materials Catalog for Inventory Purchases ───────────────────────────────
export const DEFAULT_MATERIALS_CATALOG: MaterialCatalogItem[] = [
  // Fruits (for juices)
  { id: 'mat-1',  name: 'Mango',         unit: 'kg',     category: 'fruits',    emoji: '🥭' },
  { id: 'mat-2',  name: 'Papaya',        unit: 'kg',     category: 'fruits',    emoji: '🍈' },
  { id: 'mat-3',  name: 'Avocado',       unit: 'kg',     category: 'fruits',    emoji: '🥑' },
  { id: 'mat-4',  name: 'Banana',        unit: 'kg',     category: 'fruits',    emoji: '🍌' },
  { id: 'mat-5',  name: 'Orange',        unit: 'kg',     category: 'fruits',    emoji: '🍊' },
  { id: 'mat-6',  name: 'Pineapple',     unit: 'kg',     category: 'fruits',    emoji: '🍍' },
  { id: 'mat-7',  name: 'Guava',         unit: 'kg',     category: 'fruits',    emoji: '🍏' },
  // Dairy & Base
  { id: 'mat-8',  name: 'Milk',          unit: 'liter',  category: 'dairy',     emoji: '🥛' },
  { id: 'mat-9',  name: 'Sugar',         unit: 'kg',     category: 'dairy',     emoji: '🍬' },
  { id: 'mat-10', name: 'Ice',           unit: 'kg',     category: 'dairy',     emoji: '🧊' },
  // Kitchen Supplies
  { id: 'mat-11', name: 'Cooking Oil',   unit: 'liter',  category: 'kitchen',   emoji: '🫙' },
  { id: 'mat-12', name: 'Tomatoes',      unit: 'kg',     category: 'kitchen',   emoji: '🍅' },
  { id: 'mat-13', name: 'Onions',        unit: 'kg',     category: 'kitchen',   emoji: '🧅' },
  { id: 'mat-14', name: 'Spices / Herbs',unit: 'pack',   category: 'kitchen',   emoji: '🌿' },
  // Packaging
  { id: 'mat-15', name: 'Juice Cups',    unit: 'piece',  category: 'packaging', emoji: '🥤' },
  { id: 'mat-16', name: 'Takeaway Boxes',unit: 'piece',  category: 'packaging', emoji: '📦' },
  { id: 'mat-17', name: 'Straws',        unit: 'pack',   category: 'packaging', emoji: '🥢' },
  { id: 'mat-18', name: 'Napkins',       unit: 'pack',   category: 'packaging', emoji: '🧻' },
  { id: 'mat-19', name: 'Lids / Covers', unit: 'pack',   category: 'packaging', emoji: '🔵' },
  // Equipment & Utilities
  { id: 'mat-20', name: 'Cooking Gas',   unit: 'cylinder', category: 'equipment', emoji: '🔥' },
  { id: 'mat-21', name: 'Equipment / Repair', unit: 'piece', category: 'equipment', emoji: '⚙️' },
];

