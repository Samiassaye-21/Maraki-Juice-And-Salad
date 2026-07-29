import React from 'react';
import { 
  ShiftRecord, 
  RestaurantSystemConfig, 
  SystemSummaryStats, 
  PendingPaymentItem, 
  DeliveryAccountRecord 
} from '../types';

export function formatCurrency(amount: number, symbol: string = 'Br'): string {
  const formatted = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${amount < 0 ? '-' : ''}${symbol} ${formatted}`;
}

/**
 * Strips leading zeros from numeric input strings (e.g. "0170" -> "170", "015" -> "15")
 * and directly cleans the target input DOM element so React DOM re-rendering is never bypassed.
 */
export function cleanNumberInput(valOrEvent: string | number | React.ChangeEvent<HTMLInputElement>): number {
  let valStr: string = '';
  if (typeof valOrEvent === 'object' && valOrEvent !== null && 'target' in valOrEvent) {
    valStr = valOrEvent.target.value;
    const cleaned = valStr.replace(/^0+(?=\d)/, '');
    if (valOrEvent.target.value !== cleaned) {
      valOrEvent.target.value = cleaned;
    }
    valStr = cleaned;
  } else {
    valStr = (valOrEvent ?? '').toString();
    valStr = valStr.replace(/^0+(?=\d)/, '');
  }

  if (valStr === '' || valStr === '.') return 0;
  const num = parseFloat(valStr);
  return isNaN(num) ? 0 : num;
}

export function cleanStringNumberInput(valOrEvent: string | number | React.ChangeEvent<HTMLInputElement>): string {
  let valStr: string = '';
  if (typeof valOrEvent === 'object' && valOrEvent !== null && 'target' in valOrEvent) {
    valStr = valOrEvent.target.value;
    const cleaned = valStr.replace(/^0+(?=\d)/, '');
    if (valOrEvent.target.value !== cleaned) {
      valOrEvent.target.value = cleaned;
    }
    valStr = cleaned;
  } else {
    valStr = (valOrEvent ?? '').toString();
    valStr = valStr.replace(/^0+(?=\d)/, '');
  }
  return valStr;
}

export function handleInputFocus(e: React.FocusEvent<HTMLInputElement>) {
  const target = e.target;
  setTimeout(() => {
    if (target && typeof target.select === 'function') {
      target.select();
    }
  }, 0);
}

export function calculateShiftTotals(
  juiceOpening: number,
  juiceAdded: number,
  juiceLeftover: number,
  juicePrice: number,
  foodOpening: number,
  foodAdded: number,
  foodLeftover: number,
  foodPrice: number,
  digitalTransfers: number,
  dailyExpenses: number,
  newPendingAmount: number,
  recoveredPendingAmount: number,
  deliveryCreditAmount: number
) {
  // 1. Cups Sold
  const totalJuiceInStock = juiceOpening + juiceAdded;
  const juiceCupsSold = Math.max(0, totalJuiceInStock - juiceLeftover);
  const juiceRevenue = juiceCupsSold * juicePrice;

  // 2. Takeaways Sold
  const totalFoodInStock = foodOpening + foodAdded;
  const foodTakeawaysSold = Math.max(0, totalFoodInStock - foodLeftover);
  const foodRevenue = foodTakeawaysSold * foodPrice;

  // 3. Gross Revenue
  const grossIncome = juiceRevenue + foodRevenue;

  // 4. Net Cash Due to Owner:
  // Gross Sales
  // + Recovered Pending Payments (Old debts collected in cash today)
  // - Digital Transfers (Sent directly to owner's bank/Telebirr)
  // - Daily Shift Expenses (Vegetables, ingredients bought by worker)
  // - New Pending Payments (Unpaid customer credit during shift)
  // - Delivery Credit Orders (Delivered on weekly credit account)
  const netCashDueToOwner = 
    grossIncome 
    + recoveredPendingAmount
    - digitalTransfers
    - dailyExpenses
    - newPendingAmount
    - deliveryCreditAmount;

  return {
    juiceCupsSold,
    juiceRevenue,
    foodTakeawaysSold,
    foodRevenue,
    grossIncome,
    netCashDueToOwner,
  };
}

export function calculateSystemSummary(
  shifts: ShiftRecord[],
  pendingPayments: PendingPaymentItem[],
  deliveryRecords: DeliveryAccountRecord[],
  config: RestaurantSystemConfig
): SystemSummaryStats {
  let totalGrossIncome = 0;
  let totalNetCashCollected = 0;
  let totalDigitalTransfers = 0;
  let totalExpensesPaid = 0;
  let dayShiftIncomeTotal = 0;
  let nightShiftIncomeTotal = 0;

  shifts.filter(s => s.isClosed).forEach((shift) => {
    totalGrossIncome += shift.grossIncome;
    totalNetCashCollected += shift.netCashDueToOwner;
    totalDigitalTransfers += shift.digitalTransfers;
    totalExpensesPaid += shift.dailyExpenses;

    if (shift.shiftType === 'day') {
      dayShiftIncomeTotal += shift.grossIncome;
    } else {
      nightShiftIncomeTotal += shift.grossIncome;
    }
  });

  // Calculate outstanding pending payments
  const totalPendingOutstanding = pendingPayments
    .filter((p) => !p.isPaid)
    .reduce((sum, p) => sum + p.amount, 0);

  // Calculate unsettled delivery accounts
  const totalDeliveryUnsettled = deliveryRecords
    .filter((d) => !d.isSettledWeekly)
    .reduce((sum, d) => sum + d.amount, 0);

  // Latest remaining stocks from most recent closed shift
  const lastShift = shifts.find(s => s.isClosed);
  const currentJuiceStockLeft = lastShift ? lastShift.juiceCups.remainingCount : 120;
  const currentTakeawayStockLeft = lastShift ? lastShift.foodTakeaways.remainingCount : 85;

  return {
    totalGrossIncome,
    totalNetCashCollected,
    totalDigitalTransfers,
    totalExpensesPaid,
    totalPendingOutstanding,
    totalDeliveryUnsettled,
    dayShiftIncomeTotal,
    nightShiftIncomeTotal,
    currentJuiceStockLeft,
    currentTakeawayStockLeft,
  };
}

import { EthDateTime } from 'ethiopian-calendar-date-converter';

const ethiopianMonths = [
  'Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit',
  'Megabit', 'Miazia', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'
];

export function getEthiopianMonthYear(gregorianMonthYear: string): string {
  try {
    const [month, year] = gregorianMonthYear.split(' ');
    const midMonthDate = new Date(`${month} 15, ${year}`);
    if (isNaN(midMonthDate.getTime())) return '';
    
    const ethDate = EthDateTime.fromEuropeanDate(midMonthDate);
    const ethMonthName = ethiopianMonths[ethDate.month - 1];
    return `${ethMonthName} ${ethDate.year}`;
  } catch (e) {
    return '';
  }
}

export function formatEthiopianFullDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    // Handle YYYY-MM-DD safely without timezone shifts
    const parts = dateStr.split('-');
    let d: Date;
    if (parts.length === 3) {
      d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    } else {
      d = new Date(dateStr);
    }
    if (isNaN(d.getTime())) return '';
    const ethDate = EthDateTime.fromEuropeanDate(d);
    const ethMonthName = ethiopianMonths[ethDate.month - 1];
    return `${ethMonthName} ${ethDate.date}, ${ethDate.year} E.C.`;
  } catch (e) {
    return '';
  }
}


