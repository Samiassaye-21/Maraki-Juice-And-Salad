import { dbService } from '../lib/supabaseClient';
import { getOrderIsoDate, toLocalIsoDate } from './reconciliationHelpers';

export const INGREDIENTS_STORAGE_KEY = 'maraki_ingredients_v1';
export const RECIPES_STORAGE_KEY = 'maraki_recipes_v1';
export const INGREDIENT_TXNS_STORAGE_KEY = 'maraki_ingredient_txns_v1';
export const INGREDIENT_ENGINE_INIT_KEY = 'maraki_ingredient_engine_initialized_v1';

export const PURCHASE_UNITS = ['kg', 'g', 'liter', 'ml', 'piece', 'bottle', 'packet', 'box', 'cup'];
export const RECIPE_UNITS = ['g', 'g (cooked)', 'kg', 'ml', 'liter', 'piece', 'cup', 'tbsp'];

export const TRANSACTION_TYPES = [
  { id: 'purchase', label: 'Purchase (+ Stock)', sign: 1, category: 'in' },
  { id: 'return_stock', label: 'Returned Stock (+ Stock)', sign: 1, category: 'in' },
  { id: 'adjustment_add', label: 'Manual Adjustment (+ Add)', sign: 1, category: 'adj' },
  { id: 'adjustment_sub', label: 'Manual Adjustment (− Deduct)', sign: -1, category: 'adj' },
  { id: 'waste', label: 'Waste (− Deduct)', sign: -1, category: 'waste' },
  { id: 'spoilage', label: 'Spoilage (− Deduct)', sign: -1, category: 'waste' },
  { id: 'damaged', label: 'Damaged Ingredient (− Deduct)', sign: -1, category: 'waste' },
  { id: 'incorrect_prep', label: 'Incorrect Preparation (− Deduct)', sign: -1, category: 'waste' }
];

/**
 * Default general ingredient catalog (data rows — NOT hardcoded into engine formulas).
 * Admin can edit units, conversions, levels, or add/delete any ingredient at runtime.
 */
export const DEFAULT_INGREDIENTS = [
  {
    id: 'ing-rice',
    name: 'ሩዝ (Rice)',
    englishName: 'Rice',
    emoji: '🍚',
    category: 'Dry Goods',
    purchaseUnit: 'kg',
    recipeUnit: 'g (cooked)',
    recipeUnitsPerPurchaseUnit: 3000, // Configurable: 1 kg raw ≈ 3 kg (3000 g) cooked rice
    initialStock: 0,
    minStockLevel: 5,
    reorderLevel: 3,
    targetStockLevel: 20,
    conversionNote: '1 kg raw rice ≈ 3 kg (3,000 g) cooked rice'
  },
  {
    id: 'ing-avocado',
    name: 'አቮካዶ (Avocado)',
    englishName: 'Avocado',
    emoji: '🥑',
    category: 'Fruits',
    purchaseUnit: 'kg',
    recipeUnit: 'g',
    recipeUnitsPerPurchaseUnit: 1000, // 1 kg = 1,000 g; @ 500 g/cup = 2 cups/kg
    initialStock: 0,
    minStockLevel: 5,
    reorderLevel: 2.5,
    targetStockLevel: 15,
    conversionNote: '1 kg avocado ≈ 2 cups (~500 g/cup)'
  },
  {
    id: 'ing-papaya',
    name: 'ፓፓያ (Papaya)',
    englishName: 'Papaya',
    emoji: '🍈',
    category: 'Fruits',
    purchaseUnit: 'kg',
    recipeUnit: 'g',
    recipeUnitsPerPurchaseUnit: 1000, // 1 kg = 1,000 g; @ 333.33 g/cup = 3 cups/kg
    initialStock: 0,
    minStockLevel: 4,
    reorderLevel: 2,
    targetStockLevel: 12,
    conversionNote: '1 kg papaya ≈ 3 cups (~333.3 g/cup)'
  },
  {
    id: 'ing-mango',
    name: 'ማንጎ (Mango)',
    englishName: 'Mango',
    emoji: '🥭',
    category: 'Fruits',
    purchaseUnit: 'kg',
    recipeUnit: 'g',
    recipeUnitsPerPurchaseUnit: 1000,
    initialStock: 0,
    minStockLevel: 4,
    reorderLevel: 2,
    targetStockLevel: 12,
    conversionNote: '1 kg = 1,000 g'
  },
  {
    id: 'ing-vegetables',
    name: 'አትክልት (Mixed Vegetables)',
    englishName: 'Mixed Vegetables',
    emoji: '🥬',
    category: 'Vegetables',
    purchaseUnit: 'kg',
    recipeUnit: 'g',
    recipeUnitsPerPurchaseUnit: 1000,
    initialStock: 0,
    minStockLevel: 4,
    reorderLevel: 2,
    targetStockLevel: 12,
    conversionNote: '1 kg = 1,000 g'
  },
  {
    id: 'ing-pasta',
    name: 'ፓስታ (Pasta)',
    englishName: 'Pasta',
    emoji: '🍝',
    category: 'Dry Goods',
    purchaseUnit: 'kg',
    recipeUnit: 'g (cooked)',
    recipeUnitsPerPurchaseUnit: 2500, // 1 kg dry pasta ≈ 2.5 kg cooked
    initialStock: 0,
    minStockLevel: 4,
    reorderLevel: 2,
    targetStockLevel: 15,
    conversionNote: '1 kg dry pasta ≈ 2.5 kg (2,500 g) cooked'
  },
  {
    id: 'ing-eggs',
    name: 'እንቁላል (Eggs)',
    englishName: 'Eggs',
    emoji: '🥚',
    category: 'Proteins',
    purchaseUnit: 'piece',
    recipeUnit: 'piece',
    recipeUnitsPerPurchaseUnit: 1,
    initialStock: 0,
    minStockLevel: 24,
    reorderLevel: 12,
    targetStockLevel: 90,
    conversionNote: '1 piece = 1 piece'
  },
  {
    id: 'ing-oil',
    name: 'ዘይት (Cooking Oil)',
    englishName: 'Cooking Oil',
    emoji: '🫗',
    category: 'Oils & Spices',
    purchaseUnit: 'liter',
    recipeUnit: 'ml',
    recipeUnitsPerPurchaseUnit: 1000,
    initialStock: 0,
    minStockLevel: 3,
    reorderLevel: 1.5,
    targetStockLevel: 10,
    conversionNote: '1 liter = 1,000 ml'
  }
];

/**
 * Default BOM recipes attached to real Maraki menu IDs (fully editable/deletable by admin).
 */
export const DEFAULT_RECIPES = [
  {
    productId: 'm8', // Rice with Egg (Chaofan style)
    productName: 'Rice with Egg / Chofan',
    yieldUnit: 'order',
    ingredients: [
      { ingredientId: 'ing-rice', qtyPerUnit: 300 },
      { ingredientId: 'ing-eggs', qtyPerUnit: 2 },
      { ingredientId: 'ing-oil', qtyPerUnit: 20 }
    ]
  },
  {
    productId: 'm4', // Rice with Salad
    productName: 'Rice with Salad',
    yieldUnit: 'order',
    ingredients: [
      { ingredientId: 'ing-rice', qtyPerUnit: 250 },
      { ingredientId: 'ing-vegetables', qtyPerUnit: 180 }
    ]
  },
  {
    productId: 'm6', // Rice with Vegetables
    productName: 'Rice with Vegetables',
    yieldUnit: 'order',
    ingredients: [
      { ingredientId: 'ing-rice', qtyPerUnit: 300 },
      { ingredientId: 'ing-vegetables', qtyPerUnit: 220 },
      { ingredientId: 'ing-oil', qtyPerUnit: 15 }
    ]
  },
  {
    productId: 'j3', // Avocado Juice
    productName: 'Avocado Juice',
    yieldUnit: 'cup',
    ingredients: [{ ingredientId: 'ing-avocado', qtyPerUnit: 500 }]
  },
  {
    productId: 'j5', // Papaya Juice
    productName: 'Papaya Juice',
    yieldUnit: 'cup',
    ingredients: [{ ingredientId: 'ing-papaya', qtyPerUnit: 333.33 }]
  },
  {
    productId: 'j2', // Sprice Juice (Mixed BOM: Avocado + Papaya)
    productName: 'Spris / Sprice Juice',
    yieldUnit: 'cup',
    ingredients: [
      { ingredientId: 'ing-avocado', qtyPerUnit: 250 },
      { ingredientId: 'ing-papaya', qtyPerUnit: 200 }
    ]
  },
  {
    productId: 'j4', // Mango Juice
    productName: 'Mango Juice',
    yieldUnit: 'cup',
    ingredients: [{ ingredientId: 'ing-mango', qtyPerUnit: 400 }]
  },
  {
    productId: 'j1', // Maraki Special Mixed Juice
    productName: 'Maraki Special Mixed Juice',
    yieldUnit: 'cup',
    ingredients: [
      { ingredientId: 'ing-avocado', qtyPerUnit: 200 },
      { ingredientId: 'ing-papaya', qtyPerUnit: 150 },
      { ingredientId: 'ing-mango', qtyPerUnit: 150 }
    ]
  },
  {
    productId: 'm1', // Maraki Combo Salad
    productName: 'Maraki Combo Salad',
    yieldUnit: 'plate',
    ingredients: [
      { ingredientId: 'ing-avocado', qtyPerUnit: 150 },
      { ingredientId: 'ing-vegetables', qtyPerUnit: 250 },
      { ingredientId: 'ing-eggs', qtyPerUnit: 1 }
    ]
  },
  {
    productId: 'm2', // Salad
    productName: 'Salad',
    yieldUnit: 'plate',
    ingredients: [{ ingredientId: 'ing-vegetables', qtyPerUnit: 250 }]
  },
  {
    productId: 'm3', // Pasta with Salad
    productName: 'Pasta with Salad',
    yieldUnit: 'order',
    ingredients: [
      { ingredientId: 'ing-pasta', qtyPerUnit: 250 },
      { ingredientId: 'ing-vegetables', qtyPerUnit: 180 }
    ]
  },
  {
    productId: 'm5', // Pasta with Vegetables
    productName: 'Pasta with Vegetables',
    yieldUnit: 'order',
    ingredients: [
      { ingredientId: 'ing-pasta', qtyPerUnit: 300 },
      { ingredientId: 'ing-vegetables', qtyPerUnit: 220 },
      { ingredientId: 'ing-oil', qtyPerUnit: 15 }
    ]
  },
  {
    productId: 'm7', // Pasta with Egg
    productName: 'Pasta with Egg',
    yieldUnit: 'order',
    ingredients: [
      { ingredientId: 'ing-pasta', qtyPerUnit: 300 },
      { ingredientId: 'ing-eggs', qtyPerUnit: 2 },
      { ingredientId: 'ing-oil', qtyPerUnit: 20 }
    ]
  },
  {
    productId: 'm9', // Egg Firfir
    productName: 'Egg Firfir',
    yieldUnit: 'order',
    ingredients: [
      { ingredientId: 'ing-eggs', qtyPerUnit: 2 },
      { ingredientId: 'ing-oil', qtyPerUnit: 25 }
    ]
  },
  {
    productId: 'm11', // Egg Sandwich
    productName: 'Egg Sandwich',
    yieldUnit: 'order',
    ingredients: [
      { ingredientId: 'ing-eggs', qtyPerUnit: 2 },
      { ingredientId: 'ing-vegetables', qtyPerUnit: 60 }
    ]
  },
  {
    productId: 'm12', // Vegetable Sandwich
    productName: 'Vegetable Sandwich',
    yieldUnit: 'order',
    ingredients: [
      { ingredientId: 'ing-avocado', qtyPerUnit: 100 },
      { ingredientId: 'ing-vegetables', qtyPerUnit: 120 }
    ]
  },
  {
    productId: 'm13', // Fruit Punch
    productName: 'Fruit Punch',
    yieldUnit: 'portion',
    ingredients: [
      { ingredientId: 'ing-avocado', qtyPerUnit: 100 },
      { ingredientId: 'ing-papaya', qtyPerUnit: 150 },
      { ingredientId: 'ing-mango', qtyPerUnit: 150 }
    ]
  }
];

export function roundQty(n, decimals = 3) {
  const num = Number(n) || 0;
  const f = 10 ** decimals;
  return Math.round((num + Number.EPSILON) * f) / f;
}

export function isOrderCancelledOrRefunded(order) {
  if (!order) return false;
  if (order.isCancelled || order.isRefunded) return true;
  const st = String(order.status || '').toLowerCase();
  return st.includes('cancel') || st.includes('refund') || st.includes('ተሰርዟል') || st.includes('ተመልሷል');
}

export function loadIngredients() {
  try {
    const raw = localStorage.getItem(INGREDIENTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
    // Seed defaults once on first activation
    if (!localStorage.getItem(INGREDIENT_ENGINE_INIT_KEY)) {
      localStorage.setItem(INGREDIENTS_STORAGE_KEY, JSON.stringify(DEFAULT_INGREDIENTS));
      localStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify(DEFAULT_RECIPES));
      localStorage.setItem(INGREDIENT_ENGINE_INIT_KEY, 'true');
      return [...DEFAULT_INGREDIENTS];
    }
  } catch (e) {}
  return [];
}

export function saveIngredients(list) {
  const clean = Array.isArray(list) ? list : [];
  try {
    localStorage.setItem(INGREDIENTS_STORAGE_KEY, JSON.stringify(clean));
    localStorage.setItem(INGREDIENT_ENGINE_INIT_KEY, 'true');
    dbService.saveAppState(INGREDIENTS_STORAGE_KEY, clean);
    window.dispatchEvent(new Event('maraki-ingredients-updated'));
  } catch (e) {}
  return clean;
}

export function loadRecipes() {
  try {
    const raw = localStorage.getItem(RECIPES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
    if (!localStorage.getItem(INGREDIENT_ENGINE_INIT_KEY)) {
      localStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify(DEFAULT_RECIPES));
      return [...DEFAULT_RECIPES];
    }
  } catch (e) {}
  return [];
}

export function saveRecipes(list) {
  const clean = Array.isArray(list) ? list : [];
  try {
    localStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify(clean));
    localStorage.setItem(INGREDIENT_ENGINE_INIT_KEY, 'true');
    dbService.saveAppState(RECIPES_STORAGE_KEY, clean);
    window.dispatchEvent(new Event('maraki-ingredients-updated'));
  } catch (e) {}
  return clean;
}

export function loadIngredientTxns() {
  try {
    const raw = localStorage.getItem(INGREDIENT_TXNS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

export function saveIngredientTxns(list) {
  const clean = Array.isArray(list) ? list : [];
  try {
    localStorage.setItem(INGREDIENT_TXNS_STORAGE_KEY, JSON.stringify(clean));
    dbService.saveAppState(INGREDIENT_TXNS_STORAGE_KEY, clean);
    window.dispatchEvent(new Event('maraki-ingredients-updated'));
  } catch (e) {}
  return clean;
}

/**
 * Resolve recipe for a sold cart/order item by exact productId or normalized name match.
 */
export function findRecipeForOrderItem(item, recipes = [], recipeMapById = null) {
  if (!item) return null;
  const byId = recipeMapById || new Map((recipes || []).map(r => [r.productId, r]));
  if (item.id && byId.has(item.id)) return byId.get(item.id);
  const itemNames = [item.englishName, item.name]
    .filter(Boolean)
    .map(s => s.toLowerCase().trim());
  if (itemNames.length === 0) return null;
  return (
    (recipes || []).find(r => {
      const rName = (r.productName || '').toLowerCase().trim();
      return rName && itemNames.some(n => n === rName || (rName.length >= 4 && n.includes(rName)));
    }) || null
  );
}

/**
 * Calculate total raw-ingredient consumption (in purchaseUnit) for an order's items against active recipes.
 * Returns { perIngredient: { [ingId]: { ingredient, consumedPurchaseQty, consumedRecipeQty } }, lines: [...] }.
 */
export function computeOrderIngredientConsumption(order, recipes = [], ingredients = []) {
  const perIngredient = {};
  const lines = [];
  if (!order) return { perIngredient, lines };

  const ingMap = new Map((ingredients || []).map(i => [i.id, i]));
  const recipeById = new Map((recipes || []).map(r => [r.productId, r]));

  (order.items || []).forEach(item => {
    const soldQty = Number(item.qty || 0);
    if (soldQty <= 0) return;
    const recipe = findRecipeForOrderItem(item, recipes, recipeById);
    if (!recipe || !Array.isArray(recipe.ingredients)) return;

    recipe.ingredients.forEach(line => {
      const ing = ingMap.get(line.ingredientId);
      if (!ing) return;
      const conversion = Math.max(0.0001, Number(ing.recipeUnitsPerPurchaseUnit || 1));
      const recipeQtyConsumed = roundQty(Number(line.qtyPerUnit || 0) * soldQty, 3);
      const purchaseQtyConsumed = roundQty(recipeQtyConsumed / conversion, 4);

      if (!perIngredient[ing.id]) {
        perIngredient[ing.id] = {
          ingredient: ing,
          consumedPurchaseQty: 0,
          consumedRecipeQty: 0
        };
      }
      perIngredient[ing.id].consumedPurchaseQty = roundQty(
        perIngredient[ing.id].consumedPurchaseQty + purchaseQtyConsumed,
        4
      );
      perIngredient[ing.id].consumedRecipeQty = roundQty(
        perIngredient[ing.id].consumedRecipeQty + recipeQtyConsumed,
        3
      );
      lines.push({
        productId: item.id,
        productName: item.englishName || item.name,
        soldQty,
        ingredientId: ing.id,
        ingredientName: ing.englishName || ing.name,
        consumedPurchaseQty: purchaseQtyConsumed,
        consumedRecipeQty: recipeQtyConsumed,
        purchaseUnit: ing.purchaseUnit,
        recipeUnit: ing.recipeUnit
      });
    });
  });

  return { perIngredient, lines };
}

/**
 * Append immutable audit history entries when an order is created/completed or cancelled/refunded.
 * Idempotent per (orderId + action) unless force is specified, so double calls never duplicate history.
 */
export function recordOrderStockAudit({
  order,
  action = 'completed', // 'completed' | 'reversed'
  recipes = null,
  ingredients = null
}) {
  if (!order || !order.id) return [];
  const activeRecipes = recipes || loadRecipes();
  const activeIngredients = ingredients || loadIngredients();
  const { perIngredient } = computeOrderIngredientConsumption(order, activeRecipes, activeIngredients);
  const entries = Object.values(perIngredient);
  if (entries.length === 0) return [];

  const existingTxns = loadIngredientTxns();
  const actionType = action === 'reversed' ? 'order_reversal' : 'order_sale';
  const sign = action === 'reversed' ? 1 : -1;
  const isoDate = getOrderIsoDate(order) || toLocalIsoDate(new Date());
  const itemSummary = (order.items || []).map(i => `${i.qty}× ${i.englishName || i.name}`).join(', ');

  // Avoid duplicate identical audit log rows for same order + type
  const alreadyLoggedIds = new Set(
    existingTxns.filter(t => t.orderId === order.id && t.type === actionType).map(t => t.ingredientId)
  );

  const newRows = [];
  entries.forEach(({ ingredient, consumedPurchaseQty }) => {
    if (consumedPurchaseQty <= 0 || alreadyLoggedIds.has(ingredient.id)) return;
    newRows.push({
      id: `tx-ord-${actionType}-${order.id}-${ingredient.id}-${Date.now()}`,
      type: actionType,
      ingredientId: ingredient.id,
      ingredientName: ingredient.englishName || ingredient.name,
      qty: consumedPurchaseQty,
      signedQty: sign * consumedPurchaseQty,
      unit: ingredient.purchaseUnit,
      cost: 0,
      supplier: '',
      staffName: order.waiterName || order.staffName || 'Chef POS',
      date: isoDate,
      orderId: order.id,
      reason: action === 'reversed' ? 'Order Cancelled / Refunded (Restored)' : 'Order Completed (Auto Deducted)',
      note: itemSummary,
      createdAt: new Date().toISOString()
    });
  });

  if (newRows.length === 0) return existingTxns;
  return saveIngredientTxns([...newRows, ...existingTxns].slice(0, 600));
}

/**
 * Compute full live Ingredient Inventory Dashboard & Statuses from:
 * ingredients + recipes + active (non-cancelled) orders + manual transactions (purchases, waste, adjustments).
 */
export function computeIngredientInventorySummary({
  ingredients = [],
  recipes = [],
  orders = [],
  transactions = [],
  menuItems = [],
  todayIso = toLocalIsoDate(new Date())
} = {}) {
  const ingMap = new Map((ingredients || []).map(i => [i.id, i]));
  const recipeById = new Map((recipes || []).map(r => [r.productId, r]));
  const menuById = new Map((menuItems || []).map(m => [m.id, m]));

  // Aggregate transactions per ingredient (Purchases, Waste, Adjustments, Returns)
  const txBuckets = {};
  (ingredients || []).forEach(ing => {
    txBuckets[ing.id] = {
      purchased: 0,
      purchasedToday: 0,
      purchaseCostToday: 0,
      purchaseCostTotal: 0,
      wasted: 0,
      wastedToday: 0,
      adjustments: 0
    };
  });

  (transactions || []).forEach(tx => {
    const b = txBuckets[tx.ingredientId];
    if (!b) return;
    const q = Math.abs(Number(tx.qty || 0));
    const isToday = (tx.date || toLocalIsoDate(tx.createdAt)) === todayIso;
    if (tx.type === 'purchase') {
      b.purchased = roundQty(b.purchased + q, 4);
      b.purchaseCostTotal += Number(tx.cost || 0);
      if (isToday) {
        b.purchasedToday = roundQty(b.purchasedToday + q, 4);
        b.purchaseCostToday += Number(tx.cost || 0);
      }
    } else if (['waste', 'spoilage', 'damaged', 'incorrect_prep'].includes(tx.type)) {
      b.wasted = roundQty(b.wasted + q, 4);
      if (isToday) b.wastedToday = roundQty(b.wastedToday + q, 4);
    } else if (tx.type === 'return_stock' || tx.type === 'adjustment_add') {
      b.adjustments = roundQty(b.adjustments + q, 4);
    } else if (tx.type === 'adjustment_sub') {
      b.adjustments = roundQty(b.adjustments - q, 4);
    }
    // Note: order_sale and order_reversal rows are historical ledger logs; live sales usage comes cleanly from active orders below.
  });

  // Aggregate live consumption from active (non-cancelled, non-refunded) orders
  const salesBuckets = {};
  (ingredients || []).forEach(ing => {
    salesBuckets[ing.id] = { totalUsed: 0, usedToday: 0 };
  });

  (orders || []).forEach(order => {
    if (isOrderCancelledOrRefunded(order)) return;
    const isToday = getOrderIsoDate(order) === todayIso;
    const { perIngredient } = computeOrderIngredientConsumption(order, recipes, ingredients);
    Object.entries(perIngredient).forEach(([ingId, entry]) => {
      if (!salesBuckets[ingId]) return;
      salesBuckets[ingId].totalUsed = roundQty(salesBuckets[ingId].totalUsed + entry.consumedPurchaseQty, 4);
      if (isToday) {
        salesBuckets[ingId].usedToday = roundQty(salesBuckets[ingId].usedToday + entry.consumedPurchaseQty, 4);
      }
    });
  });

  // Map which recipes consume each ingredient for estimated remaining capacity
  const recipesUsingIngredient = {};
  (recipes || []).forEach(recipe => {
    (recipe.ingredients || []).forEach(line => {
      if (!recipesUsingIngredient[line.ingredientId]) {
        recipesUsingIngredient[line.ingredientId] = [];
      }
      recipesUsingIngredient[line.ingredientId].push({
        productId: recipe.productId,
        productName: menuById.get(recipe.productId)?.englishName || menuById.get(recipe.productId)?.name || recipe.productName || recipe.productId,
        yieldUnit: recipe.yieldUnit || 'order',
        qtyPerUnit: Number(line.qtyPerUnit || 0)
      });
    });
  });

  // Build per-ingredient complete status records
  const ingredientStatuses = (ingredients || []).map(ing => {
    const initialStock = Number(ing.initialStock || 0);
    const txB = txBuckets[ing.id] || {};
    const salesB = salesBuckets[ing.id] || { totalUsed: 0, usedToday: 0 };

    const remainingStock = roundQty(
      initialStock + (txB.purchased || 0) - salesB.totalUsed - (txB.wasted || 0) + (txB.adjustments || 0),
      3
    );
    const clampedRemaining = Math.max(0, remainingStock);
    const conversion = Math.max(0.0001, Number(ing.recipeUnitsPerPurchaseUnit || 1));
    const availableRecipeUnits = roundQty(clampedRemaining * conversion, 2);

    // Estimated remaining capacity across linked recipes
    const linked = recipesUsingIngredient[ing.id] || [];
    const capacityPerProduct = linked
      .filter(l => l.qtyPerUnit > 0)
      .map(l => ({
        productId: l.productId,
        productName: l.productName,
        yieldUnit: l.yieldUnit,
        qtyPerUnit: l.qtyPerUnit,
        estimatedServings: Math.floor(availableRecipeUnits / l.qtyPerUnit)
      }));

    // Primary representative capacity label for dashboard table & alerts
    const primaryCap = capacityPerProduct[0] || null;
    const maxCap = capacityPerProduct.length > 0
      ? capacityPerProduct.reduce((best, cur) => (cur.estimatedServings < best.estimatedServings ? cur : best), capacityPerProduct[0])
      : null;
    const primaryYieldUnit = primaryCap?.yieldUnit || 'portions';

    const minLevel = Number(ing.minStockLevel || 0);
    const reorderLevel = Number(ing.reorderLevel || 0);
    const targetLevel = Math.max(Number(ing.targetStockLevel || 0), minLevel * 2, reorderLevel * 2);

    let status = 'in_stock'; // 'in_stock' | 'running_low' | 'purchase_required'
    if (remainingStock <= 0 || (reorderLevel > 0 && remainingStock <= reorderLevel)) {
      status = 'purchase_required';
    } else if (minLevel > 0 && remainingStock <= minLevel) {
      status = 'running_low';
    }

    const isOutOfStock = remainingStock <= 0;
    const suggestedPurchaseQty =
      status === 'in_stock'
        ? 0
        : roundQty(Math.max(1, targetLevel - clampedRemaining), 2);

    const displayName = ing.englishName || ing.name;
    let alertMessage = null;
    if (isOutOfStock) {
      alertMessage = `🔴 ${displayName} needs to be purchased immediately. Out of stock (0 ${ing.purchaseUnit} left).`;
    } else if (status === 'purchase_required') {
      alertMessage = primaryCap
        ? `🔴 ${displayName} needs to be purchased (${clampedRemaining} ${ing.purchaseUnit} left). Estimated remaining capacity: ${primaryCap.estimatedServings} ${primaryYieldUnit}${primaryCap.estimatedServings === 1 ? '' : 's'}.`
        : `🔴 ${displayName} needs to be purchased. Only ${clampedRemaining} ${ing.purchaseUnit} remaining (below reorder level ${reorderLevel} ${ing.purchaseUnit}).`;
    } else if (status === 'running_low') {
      alertMessage = primaryCap
        ? `🟡 ${displayName} is running low — purchase soon. Estimated remaining: ${primaryCap.estimatedServings} ${primaryYieldUnit}${primaryCap.estimatedServings === 1 ? '' : 's'} (${clampedRemaining} ${ing.purchaseUnit}).`
        : `🟡 ${displayName} is running low (${clampedRemaining} ${ing.purchaseUnit} left — purchase soon).`;
    }

    return {
      ...ing,
      displayName,
      initialStock,
      purchasedQty: txB.purchased || 0,
      purchasedTodayQty: txB.purchasedToday || 0,
      purchaseCostToday: txB.purchaseCostToday || 0,
      purchaseCostTotal: txB.purchaseCostTotal || 0,
      usedQty: salesB.totalUsed,
      usedTodayQty: salesB.usedToday,
      wastedQty: txB.wasted || 0,
      wastedTodayQty: txB.wastedToday || 0,
      adjustmentQty: txB.adjustments || 0,
      rawRemainingStock: remainingStock,
      remainingStock: clampedRemaining,
      availableRecipeUnits,
      capacityPerProduct,
      primaryCapacity: primaryCap,
      tightestCapacity: maxCap,
      status,
      isOutOfStock,
      suggestedPurchaseQty,
      alertMessage
    };
  });

  const statusByIngId = new Map(ingredientStatuses.map(s => [s.id, s]));

  // Mixed & single Product Capacities (limiting-ingredient calculation!)
  const productCapacities = (recipes || [])
    .filter(r => Array.isArray(r.ingredients) && r.ingredients.length > 0)
    .map(recipe => {
      const mItem = menuById.get(recipe.productId);
      const breakdown = recipe.ingredients
        .map(line => {
          const st = statusByIngId.get(line.ingredientId);
          if (!st || Number(line.qtyPerUnit) <= 0) return null;
          const cap = Math.floor(st.availableRecipeUnits / Number(line.qtyPerUnit));
          return {
            ingredientId: st.id,
            ingredientName: st.displayName,
            emoji: st.emoji || '📦',
            qtyPerUnit: Number(line.qtyPerUnit),
            recipeUnit: st.recipeUnit,
            availableRecipeUnits: st.availableRecipeUnits,
            possibleServings: cap
          };
        })
        .filter(Boolean);

      if (breakdown.length === 0) return null;
      const limiting = breakdown.reduce((minRow, cur) =>
        cur.possibleServings < minRow.possibleServings ? cur : minRow
      );

      return {
        productId: recipe.productId,
        productName: mItem?.englishName || mItem?.name || recipe.productName || recipe.productId,
        amharicName: mItem?.name || recipe.productName,
        yieldUnit: recipe.yieldUnit || 'order',
        estimatedCapacity: limiting.possibleServings,
        limitingIngredient: limiting,
        isMixedProduct: breakdown.length > 1,
        ingredientsBreakdown: breakdown
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.estimatedCapacity - b.estimatedCapacity);

  // Dashboard Summary Counters
  const totals = {
    totalIngredients: ingredientStatuses.length,
    lowStockCount: ingredientStatuses.filter(i => i.status === 'running_low').length,
    outOfStockCount: ingredientStatuses.filter(i => i.isOutOfStock).length,
    purchaseRequiredCount: ingredientStatuses.filter(i => i.status === 'purchase_required').length,
    alertsCount: ingredientStatuses.filter(i => i.status !== 'in_stock').length,
    todayConsumptionItems: ingredientStatuses.filter(i => i.usedTodayQty > 0).length,
    todayWasteItems: ingredientStatuses.filter(i => i.wastedTodayQty > 0).length,
    todayPurchasesCount: (transactions || []).filter(
      t => t.type === 'purchase' && (t.date || toLocalIsoDate(t.createdAt)) === todayIso
    ).length,
    todayPurchaseSpend: (transactions || [])
      .filter(t => t.type === 'purchase' && (t.date || toLocalIsoDate(t.createdAt)) === todayIso)
      .reduce((s, t) => s + Number(t.cost || 0), 0)
  };

  return {
    ingredientStatuses,
    statusByIngId,
    productCapacities,
    alerts: ingredientStatuses.filter(i => i.alertMessage),
    totals
  };
}
