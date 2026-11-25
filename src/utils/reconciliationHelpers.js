import { toEthiopianDateString } from '../components/BusinessManagement';

/**
 * Safely convert a YYYY-MM-DD string or ISO timestamp to local YYYY-MM-DD.
 */
export function toLocalIsoDate(dateInput) {
  if (!dateInput) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) return dateInput;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Extract reliable YYYY-MM-DD date from a Chef POS order record.
 */
export function getOrderIsoDate(order) {
  if (!order) return '';
  if (order.gregorianDate && /^\d{4}-\d{2}-\d{2}$/.test(order.gregorianDate)) {
    return order.gregorianDate;
  }
  if (order.createdAt) {
    const iso = toLocalIsoDate(order.createdAt);
    if (iso) return iso;
  }
  if (order.gregorianDateFormatted) {
    const parsed = toLocalIsoDate(order.gregorianDateFormatted);
    if (parsed) return parsed;
  }
  return '';
}

/**
 * Normalize an order's shift into 'Day' or 'Night'.
 */
export function getOrderShift(order) {
  if (!order) return 'Day';
  const raw = (order.shiftType || order.shift || '').toLowerCase();
  if (raw.includes('night')) return 'Night';
  return 'Day';
}

/**
 * Determine if an order falls on the given YYYY-MM-DD date (matching ISO date or Ethiopian date string).
 */
export function doesOrderMatchDate(order, dateStr) {
  if (!order || !dateStr) return false;
  const orderIso = getOrderIsoDate(order);
  if (orderIso && orderIso === dateStr) return true;
  // Fallback: compare Ethiopian formatted dates
  const targetEth = toEthiopianDateString(`${dateStr}T12:00:00`);
  if (order.ethiopianDate && targetEth && order.ethiopianDate === targetEth) {
    return true;
  }
  return false;
}

/**
 * Check if a YYYY-MM-DD record date falls inside the active time range filter.
 */
export function isDateInRange(recordDateStr, { timeRange, selectedDate, customStartDate, customEndDate }) {
  const recordDate = toLocalIsoDate(recordDateStr);
  if (!recordDate) return false;

  if (timeRange === 'daily') {
    return recordDate === selectedDate;
  }
  if (timeRange === 'weekly') {
    const target = new Date(`${selectedDate}T12:00:00`);
    const start = new Date(target);
    start.setDate(start.getDate() - 6);
    const startStr = toLocalIsoDate(start);
    return recordDate >= startStr && recordDate <= selectedDate;
  }
  if (timeRange === 'monthly') {
    const monthPrefix = (selectedDate || '').slice(0, 7);
    return recordDate.startsWith(monthPrefix);
  }
  if (timeRange === 'custom') {
    if (customStartDate && recordDate < customStartDate) return false;
    if (customEndDate && recordDate > customEndDate) return false;
    return true;
  }
  return true;
}

/**
 * Normalize dish identifier or name so Chef POS menu items ('m1'..'m16') and
 * ShiftReconciliation items ('sb', 'cs', 'm1'..'m16') match accurately.
 */
function resolveCanonicalDishKey(item, dishesList = []) {
  if (!item) return 'unknown';
  // Try exact id match first
  const byId = dishesList.find(d => d.id === item.id);
  if (byId) return byId.id;
  // Try matching by name or englishName
  const normName = (item.name || '').trim().toLowerCase();
  const normEng = (item.englishName || '').trim().toLowerCase();
  const byName = dishesList.find(
    d =>
      (normName && (d.name || '').trim().toLowerCase() === normName) ||
      (normEng && (d.englishName || '').trim().toLowerCase() === normEng)
  );
  if (byName) return byName.id;
  return item.id || item.name || 'unknown';
}

/**
 * Aggregate Chef Sent Orders for a specific date & shift ('Day' | 'Night' | 'all').
 */
export function aggregateChefOrders(orders = [], dateStr, shift = 'all', dishesList = []) {
  const matchedOrders = orders.filter(o => {
    if (dateStr && !doesOrderMatchDate(o, dateStr)) return false;
    if (shift !== 'all' && getOrderShift(o) !== shift) return false;
    return true;
  });

  let takeawayBoxes = 0;
  let homeDishes = 0;
  let beuOrdersCount = 0;
  let beuBoxes = 0;
  let totalRevenue = 0;
  const dishCounts = {};

  matchedOrders.forEach(order => {
    const isHome = order.orderType === 'Home' || order.channel === 'In-Store Home';
    const isBeu = order.channel === 'BEU Delivery';
    if (isBeu) beuOrdersCount += 1;
    totalRevenue += Number(order.totalAmount || 0);

    const items = Array.isArray(order.items) ? order.items : [];
    let orderFoodQty = 0;

    items.forEach(item => {
      const qty = Number(item.qty || 0);
      if (qty <= 0) return;
      orderFoodQty += qty;

      const key = resolveCanonicalDishKey(item, dishesList);
      if (!dishCounts[key]) {
        const refDish = dishesList.find(d => d.id === key);
        dishCounts[key] = {
          id: key,
          name: refDish?.name || item.name || key,
          englishName: refDish?.englishName || item.englishName || '',
          price: Number(item.price || refDish?.price || 0),
          qty: 0,
          takeawayQty: 0,
          homeQty: 0,
          revenue: 0
        };
      }
      dishCounts[key].qty += qty;
      if (isHome) {
        dishCounts[key].homeQty += qty;
      } else {
        dishCounts[key].takeawayQty += qty;
      }
      dishCounts[key].revenue += qty * Number(item.price || 0);
    });

    if (isHome) {
      homeDishes += orderFoodQty;
    } else {
      const boxes = order.boxesCount !== undefined ? Number(order.boxesCount || 0) : orderFoodQty;
      takeawayBoxes += boxes;
      if (isBeu) beuBoxes += boxes;
    }
  });

  return {
    matchedOrders,
    totalOrders: matchedOrders.length,
    takeawayBoxes,
    homeDishes,
    totalFoodItems: takeawayBoxes + homeDishes,
    beuOrdersCount,
    beuBoxes,
    totalRevenue,
    dishCounts
  };
}

/**
 * Compare Chef Sent Orders against Income Sheet foodAssignments.
 * Detects both total box/food discrepancy and dish-by-dish discrepancy.
 */
export function compareChefVsIncomeSheet(chefSummary, foodAssignments = {}, dishesList = []) {
  const assignedTotal = Object.values(foodAssignments).reduce((sum, q) => sum + Number(q || 0), 0);

  if (!chefSummary || chefSummary.totalOrders === 0) {
    return {
      hasChefOrders: false,
      isMatch: true,
      hasMismatch: false,
      chefTotalFood: 0,
      chefTakeawayBoxes: 0,
      chefHomeDishes: 0,
      incomeSheetTotal: assignedTotal,
      discrepancyCount: 0,
      discrepancyETB: 0,
      dishDiffs: []
    };
  }

  // Build union of all dish keys present in either Chef Sent or Income Sheet
  const allKeys = new Set([
    ...Object.keys(chefSummary.dishCounts || {}),
    ...Object.keys(foodAssignments).filter(k => Number(foodAssignments[k] || 0) > 0)
  ]);

  const dishDiffs = [];
  let discrepancyETB = 0;

  allKeys.forEach(key => {
    const chefEntry = chefSummary.dishCounts[key];
    const refDish = dishesList.find(d => d.id === key);
    const chefQty = chefEntry ? chefEntry.qty : 0;
    const chefTakeawayQty = chefEntry ? chefEntry.takeawayQty : 0;
    const chefHomeQty = chefEntry ? chefEntry.homeQty : 0;
    const incomeQty = Number(foodAssignments[key] || 0);
    const unitPrice = chefEntry?.price || refDish?.price || 0;

    // Compare against total food cooked by chef (or takeaway if dine-in wasn't boxed).
    // If incomeQty matches neither total qty nor takeaway qty, flag it!
    const matchesTotal = incomeQty === chefQty;
    const matchesTakeawayOnly = chefHomeQty > 0 && incomeQty === chefTakeawayQty;
    const diff = incomeQty - chefQty;

    if (!matchesTotal && !matchesTakeawayOnly) {
      discrepancyETB += (incomeQty - chefQty) * unitPrice;
      dishDiffs.push({
        id: key,
        name: chefEntry?.name || refDish?.name || key,
        englishName: chefEntry?.englishName || refDish?.englishName || '',
        unitPrice,
        chefQty,
        chefTakeawayQty,
        chefHomeQty,
        incomeQty,
        diff,
        diffETB: diff * unitPrice
      });
    }
  });

  // Check overall count against total food or takeaway boxes
  // Dish type swaps do NOT trigger an alarm as long as total count matches!
  const matchesGrandTotal = assignedTotal === chefSummary.totalFoodItems;
  const matchesTakeawayBoxes = assignedTotal === chefSummary.takeawayBoxes;
  const totalMismatch = !matchesGrandTotal && !matchesTakeawayBoxes;
  const hasMismatch = totalMismatch;
  const hasDishTypeVariance = !totalMismatch && dishDiffs.length > 0;

  const discrepancyCount = matchesTakeawayBoxes || matchesGrandTotal
    ? 0
    : assignedTotal - chefSummary.totalFoodItems;

  return {
    hasChefOrders: true,
    isMatch: !hasMismatch,
    hasMismatch,
    hasDishTypeVariance,
    chefTotalFood: chefSummary.totalFoodItems,
    chefTakeawayBoxes: chefSummary.takeawayBoxes,
    chefHomeDishes: chefSummary.homeDishes,
    incomeSheetTotal: assignedTotal,
    discrepancyCount,
    discrepancyETB,
    dishDiffs
  };
}

/**
 * Load & compute unified Box & Cup inventory audit stats across localStorage.
 */
export function computePackagingAudit({
  orders = [],
  settlements = [],
  purchasesOverride = null,
  manualIssuesOverride = null
} = {}) {
  let purchases = Array.isArray(purchasesOverride) ? purchasesOverride : [];
  let manualIssues = Array.isArray(manualIssuesOverride) ? manualIssuesOverride : [];
  let thresholds = { boxLow: 50, cupLow: 100 };

  if (!Array.isArray(purchasesOverride)) {
    try {
      const savedPurchases = localStorage.getItem('maraki_box_purchases_v1');
      if (savedPurchases) {
        purchases = JSON.parse(savedPurchases);
      } else {
        // Seed seamlessly from legacy maraki_box_starting_stock if available
        const legacyBoxes = Number(localStorage.getItem('maraki_box_starting_stock'));
        if (!isNaN(legacyBoxes) && legacyBoxes > 0) {
          purchases = [
            {
              id: 'seed-initial-boxes',
              itemType: 'box',
              qty: legacyBoxes,
              unitCost: 0,
              totalCost: 0,
              supplier: 'Opening Stock Balance',
              note: 'Imported from previous box starting stock',
              date: toLocalIsoDate(new Date()),
              createdAt: new Date().toISOString()
            }
          ];
        }
      }
    } catch (e) {
      purchases = [];
    }
  }

  if (!Array.isArray(manualIssuesOverride)) {
    try {
      const savedIssues = localStorage.getItem('maraki_box_manual_issues_v1');
      if (savedIssues) manualIssues = JSON.parse(savedIssues);
    } catch (e) {
      manualIssues = [];
    }
  }

  try {
    const savedThresh = localStorage.getItem('maraki_stock_thresholds_v1');
    if (savedThresh) thresholds = { ...thresholds, ...JSON.parse(savedThresh) };
  } catch (e) {}

  const wasteBoxes = Number(localStorage.getItem('maraki_waste_boxes')) || 0;
  const wasteCups = Number(localStorage.getItem('maraki_waste_cups')) || 0;

  const boxesBought = purchases.filter(p => p.itemType === 'box').reduce((s, p) => s + Number(p.qty || 0), 0);
  const cupsBought = purchases.filter(p => p.itemType === 'cup').reduce((s, p) => s + Number(p.qty || 0), 0);
  const totalBoxSpend = purchases.filter(p => p.itemType === 'box').reduce((s, p) => s + Number(p.totalCost || 0), 0);
  const totalCupSpend = purchases.filter(p => p.itemType === 'cup').reduce((s, p) => s + Number(p.totalCost || 0), 0);
  const avgBoxPurchaseCost = boxesBought > 0 && totalBoxSpend > 0 ? Math.round((totalBoxSpend / boxesBought) * 100) / 100 : 0;
  const avgCupPurchaseCost = cupsBought > 0 && totalCupSpend > 0 ? Math.round((totalCupSpend / cupsBought) * 100) / 100 : 0;

  const boxesGivenToKitchen = manualIssues.filter(i => i.itemType === 'box').reduce((s, i) => s + Number(i.qty || 0), 0);
  const cupsGivenToBar = manualIssues.filter(i => i.itemType === 'cup').reduce((s, i) => s + Number(i.qty || 0), 0);

  // Boxes used from Chef Orders (System Truth)
  const boxesSoldChef = orders.reduce((sum, o) => {
    const isHome = o.orderType === 'Home' || o.channel === 'In-Store Home';
    if (isHome) return sum;
    return sum + Number(o.boxesCount || 0);
  }, 0);

  // Cups sold from Shift Settlements
  const cupsSoldSettlements = settlements.reduce((sum, s) => sum + Number(s.juiceSold || 0), 0);

  const boxesStorageRemaining = Math.max(0, boxesBought - boxesGivenToKitchen);
  const boxesTotalRemaining = boxesBought === 0 && boxesSoldChef === 0 ? 0 : Math.max(0, boxesBought - boxesSoldChef - wasteBoxes);
  const boxesExpectedInKitchen = boxesGivenToKitchen - boxesSoldChef - wasteBoxes;

  const cupsStorageRemaining = Math.max(0, cupsBought - cupsGivenToBar);
  const cupsTotalRemaining = cupsBought === 0 && cupsSoldSettlements === 0 ? 0 : Math.max(0, cupsBought - cupsSoldSettlements - wasteCups);
  const cupsExpectedInBar = cupsGivenToBar - cupsSoldSettlements - wasteCups;

  const boxStatus =
    boxesBought === 0
      ? 'unset'
      : boxesTotalRemaining <= 0
      ? 'finished'
      : boxesTotalRemaining <= thresholds.boxLow
      ? 'low'
      : 'healthy';

  const cupStatus =
    cupsBought === 0
      ? 'unset'
      : cupsTotalRemaining <= 0
      ? 'finished'
      : cupsTotalRemaining <= thresholds.cupLow
      ? 'low'
      : 'healthy';

  return {
    purchases,
    manualIssues,
    thresholds,
    boxes: {
      bought: boxesBought,
      given: boxesGivenToKitchen,
      sold: boxesSoldChef,
      waste: wasteBoxes,
      spend: totalBoxSpend,
      avgUnitCost: avgBoxPurchaseCost,
      storageRemaining: boxesStorageRemaining,
      expectedInKitchen: boxesExpectedInKitchen,
      totalRemaining: boxesTotalRemaining,
      status: boxStatus,
      lowThreshold: thresholds.boxLow
    },
    cups: {
      bought: cupsBought,
      given: cupsGivenToBar,
      sold: cupsSoldSettlements,
      waste: wasteCups,
      spend: totalCupSpend,
      avgUnitCost: avgCupPurchaseCost,
      storageRemaining: cupsStorageRemaining,
      expectedInBar: cupsExpectedInBar,
      totalRemaining: cupsTotalRemaining,
      status: cupStatus,
      lowThreshold: thresholds.cupLow
    }
  };
}
