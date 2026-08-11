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

/**
 * Calculates the operational/business date string (YYYY-MM-DD) based on Ethiopian Shift Clock:
 * - Day Shift: 2:00 morning (08:00 AM) to 2:00 evening (08:00 PM / 20:00).
 * - Night Shift: 2:00 evening (08:00 PM / 20:00) through midnight up to morning 2:00 (08:00 AM) until day shift receives.
 * 
 * If current time is between 00:00 (12:00 Midnight = 6 o'clock Ethiopian night) and 07:59:59 AM (before morning 2:00 when day shift receives),
 * the order/shift belongs to the PREVIOUS calendar day's Night Shift.
 */
export function getOperationalDate(d: Date = new Date()): string {
  const target = new Date(d);
  if (target.getHours() < 8) {
    target.setDate(target.getDate() - 1);
  }
  const year = target.getFullYear();
  const month = String(target.getMonth() + 1).padStart(2, '0');
  const day = String(target.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Determines the current active shift type ('day' | 'night') and default taker based on Ethiopian Shift Clock:
 * - 08:00 AM - 19:59 PM (2:00 morning to 2:00 evening ET) -> Day Shift ('day', 'day_shift')
 * - 20:00 PM - 07:59 AM (2:00 evening to morning 2:00 ET until day shift receives) -> Night Shift ('night', 'night_shift')
 */
export function getAutoShiftType(d: Date = new Date()): { shiftType: 'day' | 'night'; defaultTaker: 'day_shift' | 'night_shift' } {
  const hours = d.getHours();
  if (hours >= 8 && hours < 20) {
    return { shiftType: 'day', defaultTaker: 'day_shift' };
  } else {
    return { shiftType: 'night', defaultTaker: 'night_shift' };
  }
}

/**
 * Formats time in Ethiopian 12-hour clock format with clear time-of-day period description.
 * Ethiopian time adds 6 hours to standard 12-hour time (or gregorian hour + 6 % 12).
 * e.g., 00:00 (midnight) -> 6:00 (6 o'clock night)
 * e.g., 01:00 (1 AM) -> 7:00 (7 o'clock night)
 * e.g., 08:00 (8 AM) -> 2:00 (2 o'clock morning - Day Shift receives)
 * e.g., 20:00 (8 PM) -> 2:00 (2 o'clock evening - Night Shift starts)
 */
export function formatEthiopianTime(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  if (isNaN(d.getTime())) return '';
  const hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ethHour = (hours + 6) % 12 || 12;

  let period = '';
  if (hours >= 6 && hours < 12) {
    period = 'ጠዋት (Morning)';
  } else if (hours >= 12 && hours < 18) {
    period = 'ቀን (Afternoon)';
  } else if (hours >= 18 && hours < 24) {
    period = 'ምሽት (Evening)';
  } else {
    period = 'ሌሊት (Night)';
  }

  return `${ethHour}:${minutes} ${period}`;
}



