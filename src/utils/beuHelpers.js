/**
 * Shared helpers for the BEU Delivery Menu and 15% BEU deduction reporting.
 * Single source of truth used across Chef POS, Owner Menu Prices, Shift Sheet & Reports.
 */

export const BEU_DEDUCTION_RATE = 0.15;
export const BEU_MULTIPLIER = 0.85;

const BEU_EXCLUDED_CATEGORIES = new Set([
  'juices',
  'juice',
  'milkshake',
  'milkshakes',
  'drink',
  'drinks',
  'beverage',
  'beverages',
  'smoothie',
  'smoothies'
]);

const DRINK_NAME_KEYWORDS = [
  'juice',
  'milkshake',
  'milk shake',
  'smoothie',
  'soft drink',
  'soda',
  'mineral water',
  'ጁስ',
  'ሚልክ ሼክ',
  'ሼክ'
];

/**
 * Determine whether a menu item is food eligible for the BEU Delivery Menu.
 * Excludes juices, drinks, milkshakes, smoothies, and cup-packaged beverages.
 */
export function isFoodItemForBeu(item) {
  if (!item) return false;
  if (item.containerType === 'cup') return false;

  const itemType = String(item.itemType || '').trim().toLowerCase();
  if (
    itemType === 'juice' ||
    itemType === 'drink' ||
    itemType === 'beverage' ||
    itemType === 'milkshake'
  ) {
    return false;
  }

  const category = String(item.category || '').trim().toLowerCase();
  if (BEU_EXCLUDED_CATEGORIES.has(category)) return false;

  const combinedName = `${item.name || ''} ${item.englishName || ''}`.toLowerCase();
  if (DRINK_NAME_KEYWORDS.some((kw) => combinedName.includes(kw))) {
    return false;
  }

  return true;
}

/**
 * Clean floating-point drift while preserving up to 4 decimal places
 * (so 337.50 * 0.85 = 286.875 is preserved accurately without rounding to .88).
 */
export function roundPricePrecision(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 10000) / 10000;
}

/**
 * Resolve the current red/final selling price of a menu product.
 * Always ignores any crossed-out originalPrice / compareAtPrice.
 */
export function getFinalSellingPrice(item) {
  if (!item) return 0;
  return roundPricePrecision(item.price ?? 0);
}

/**
 * Calculate BEU price from the current red/final selling price:
 * BEU Price = Final Price * 0.85 (15% BEU deduction).
 * Example: 337.50 -> 286.875.
 */
export function computeBeuPrice(finalSellingPrice) {
  const price = Number(finalSellingPrice);
  if (!Number.isFinite(price) || price <= 0) return 0;
  return roundPricePrecision(price * BEU_MULTIPLIER);
}

/**
 * Format an ETB amount cleanly without losing fractional decimals like .875 or .50.
 */
export function formatEtb(amount) {
  const n = roundPricePrecision(amount || 0);
  if (Number.isInteger(n)) return n.toLocaleString();
  // Up to 3 decimal places when needed (e.g. 286.875), minimum 2 decimals (e.g. 337.50)
  const fixed3 = n.toFixed(3);
  const displayStr = fixed3.endsWith('0') ? fixed3.slice(0, -1) : fixed3;
  const [intPart, decPart] = displayStr.split('.');
  const formattedInt = Number(intPart).toLocaleString();
  return decPart ? `${formattedInt}.${decPart}` : formattedInt;
}

/**
 * Build a live BEU menu view item from an existing product without duplicating storage.
 */
export function toBeuMenuItem(item) {
  const normalFinalPrice = getFinalSellingPrice(item);
  const beuPrice = computeBeuPrice(normalFinalPrice);
  const beuDeduction = roundPricePrecision(normalFinalPrice - beuPrice);
  return {
    ...item,
    normalFinalPrice,
    beuPrice,
    beuDeduction,
    price: beuPrice,
    isBeuItem: true
  };
}

/**
 * Compute historical BEU metrics (normal value, 15% deduction, net BEU total)
 * from a saved order record. Preserves historical pricing if stored on order/items.
 */
export function getOrderBeuMetrics(order) {
  if (!order) {
    return { isBeu: false, normalSubtotal: 0, deductionAmount: 0, netTotal: 0 };
  }
  const isBeu = Boolean(order.isBeuOrder || order.channel === 'BEU Delivery');
  const netTotal = roundPricePrecision(order.totalAmount || 0);

  if (!isBeu) {
    return { isBeu: false, normalSubtotal: netTotal, deductionAmount: 0, netTotal };
  }

  let normalSubtotal = Number(order.normalSubtotal);
  if (!Number.isFinite(normalSubtotal) || normalSubtotal <= 0) {
    const items = Array.isArray(order.items) ? order.items : [];
    const fromItems = items.reduce((sum, item) => {
      const qty = Number(item.qty || 0);
      const unitNormal = Number(item.normalPrice);
      if (Number.isFinite(unitNormal) && unitNormal > 0) {
        return sum + unitNormal * qty;
      }
      const unitPrice = Number(item.price || 0);
      if (Number(order.beuDeductionPct) === 15) {
        return sum + (unitPrice / BEU_MULTIPLIER) * qty;
      }
      return sum + unitPrice * qty;
    }, 0);
    normalSubtotal = fromItems > 0 ? roundPricePrecision(fromItems) : netTotal;
  } else {
    normalSubtotal = roundPricePrecision(normalSubtotal);
  }

  const storedDeduction = Number(order.beuDeductionAmount);
  const deductionAmount =
    Number.isFinite(storedDeduction) && storedDeduction >= 0
      ? roundPricePrecision(storedDeduction)
      : Math.max(0, roundPricePrecision(normalSubtotal - netTotal));

  return {
    isBeu: true,
    normalSubtotal,
    deductionAmount,
    netTotal
  };
}
