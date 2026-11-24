import React, { useState, useMemo, useEffect } from 'react';
import {
  LayoutGrid,
  Calendar,
  Utensils,
  GraduationCap,
  Settings,
  LogOut,
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  X,
  Trash2,
  CheckCircle2,
  Sparkles,
  AlertCircle
} from 'lucide-react';

// Ethiopian calendar converter helper
const toEthiopianDate = (isoStr) => {
  try {
    const parts = isoStr.split('-');
    const gYear = parseInt(parts[0], 10);
    const gMonth = parseInt(parts[1], 10);
    const gDay = parseInt(parts[2], 10);
    
    // Ethiopian ኅዳር 2019 starts Nov 10, 2026 (ኅዳር 1 = Nov 10)
    if (gYear === 2026 && gMonth === 11) {
      if (gDay >= 10) {
        const ethDay = gDay - 9;
        return { year: 2019, month: 'ኅዳር', monthNum: 3, day: ethDay, formatted: `ኅዳር ${ethDay}፣ 2019 ዓ.ም` };
      } else {
        const ethDay = 21 + gDay; // Oct 30 = 30 days
        return { year: 2019, month: 'ጥቅምት', monthNum: 2, day: ethDay, formatted: `ጥቅምት ${ethDay}፣ 2019 ዓ.ም` };
      }
    } else if (gYear === 2026 && gMonth === 12) {
      if (gDay <= 9) {
        const ethDay = 21 + gDay;
        return { year: 2019, month: 'ኅዳር', monthNum: 3, day: ethDay, formatted: `ኅዳር ${ethDay}፣ 2019 ዓ.ም` };
      } else {
        const ethDay = gDay - 9;
        return { year: 2019, month: 'ታኅሣሥ', monthNum: 4, day: ethDay, formatted: `ታኅሣሥ ${ethDay}፣ 2019 ዓ.ም` };
      }
    }
    return { year: 2019, month: 'ኅዳር', monthNum: 3, day: 14, formatted: `ኅዳር 14፣ 2019 ዓ.ም` };
  } catch (e) {
    return { year: 2019, month: 'ኅዳር', monthNum: 3, day: 14, formatted: `ኅዳር 14፣ 2019 ዓ.ም` };
  }
};

export default function ScheduleCalendarRemindMe({
  recurringExpenses = [],
  purchasePlans = [],
  salaryPlans = [],
  actualExpenses = [],
  dayCloses = [],
  sentOrders = [],
  onNavigateTab,
  onInitiatePayment,
  onOpenSettings,
  onOpenKitchen
}) {
  // Navigation & View Modes
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'week' | 'day'
  const [selectedDate, setSelectedDate] = useState('2026-11-23'); // Default ኅዳር 14 (Nov 23)
  const [searchQuery, setSearchQuery] = useState('');
  
  // Right Panel Reminder / Event Form State
  const [eventType, setEventType] = useState('Remainders'); // 'Remainders' | 'Event' | 'Custom'
  const [eventTitle, setEventTitle] = useState('');
  const [fromTime, setFromTime] = useState('11.00 am');
  const [toTime, setToTime] = useState('-- : --');
  const [eventLocation, setEventLocation] = useState('');
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  // Custom Reminders / Events Store
  const [customReminders, setCustomReminders] = useState(() => {
    try {
      const saved = localStorage.getItem('maraki_schedule_reminders');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    // Seed sample events to mirror the aesthetic of the reference RemindMe image
    return [
      { id: 'rem-1', title: 'Prepare XXN', date: '2026-11-12', ethDay: 3, fromTime: '09.00 am', toTime: '11.00 am', location: 'Kitchen Station', type: 'Remainders', color: 'peach' },
      { id: 'rem-2', title: 'BBQ 20.00-24.00', date: '2026-11-10', ethDay: 1, fromTime: '08.00 pm', toTime: '12.00 am', location: 'Maraki Patio', type: 'Event', color: 'peach' },
      { id: 'rem-3', title: 'Classroom 10:00', date: '2026-11-14', ethDay: 5, fromTime: '10.00 am', toTime: '11.30 am', location: 'Training Room', type: 'Event', color: 'yellow' },
      { id: 'rem-4', title: 'Exam 10.00-11.00', date: '2026-11-16', ethDay: 7, fromTime: '10.00 am', toTime: '11.00 am', location: 'Main Branch', type: 'Remainders', color: 'pink' },
      { id: 'rem-5', title: 'Presentation 08.00', date: '2026-11-19', ethDay: 10, fromTime: '08.00 am', toTime: '09.30 am', location: 'Office', type: 'Event', color: 'purple' },
      { id: 'rem-6', title: 'Start Intern', date: '2026-11-22', ethDay: 13, fromTime: '09.00 am', toTime: '05.00 pm', location: 'Bar Counter', type: 'Remainders', color: 'pink' },
      { id: 'rem-7', title: 'Exam 09:00-13:00', date: '2026-11-29', ethDay: 20, fromTime: '09.00 am', toTime: '01.00 pm', location: 'CBE Branch', type: 'Event', color: 'yellow' },
      { id: 'rem-8', title: 'Meeting 11:00-12:00', date: '2026-12-03', ethDay: 24, fromTime: '11.00 am', toTime: '12.00 pm', location: 'Manager Room', type: 'Event', color: 'pink' },
      { id: 'rem-9', title: 'Exam 10:00-11:00', date: '2026-12-04', ethDay: 25, fromTime: '10.00 am', toTime: '11.00 am', location: 'Mercato Office', type: 'Remainders', color: 'coral' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('maraki_schedule_reminders', JSON.stringify(customReminders));
  }, [customReminders]);

  // Handle Add New Event / Reminder
  const handleAddReminder = (e) => {
    if (e) e.preventDefault();
    const finalTitle = eventTitle.trim() || `${eventType} Task`;
    const ethInfo = toEthiopianDate(selectedDate);
    const chosenColor = eventType === 'Remainders' ? 'pink' : eventType === 'Event' ? 'peach' : 'purple';

    const newReminder = {
      id: `rem-${Date.now()}`,
      title: finalTitle,
      date: selectedDate,
      ethDay: ethInfo.day,
      fromTime: fromTime || '09.00 am',
      toTime: toTime || '-- : --',
      location: eventLocation.trim() || 'Maraki Juice & Salad',
      type: eventType,
      color: chosenColor
    };

    setCustomReminders(prev => [newReminder, ...prev]);
    setEventTitle('');
    setEventLocation('');
  };

  const handleDeleteReminder = (id) => {
    setCustomReminders(prev => prev.filter(r => r.id !== id));
  };

  // Build 35 Calendar Cells for ኅዳር 2019 (Nov 10 to Dec 9, 2026)
  const calendarGrid = useMemo(() => {
    const cells = [];
    // Previous month (ጥቅምት) padding: Sunday Nov 8 (29), Monday Nov 9 (30)
    cells.push({ dayNum: 29, isCurrentMonth: false, isoDate: '2026-11-08', gregDateStr: 'Nov 8', dayOfWeek: 'Sun' });
    cells.push({ dayNum: 30, isCurrentMonth: false, isoDate: '2026-11-09', gregDateStr: 'Nov 9', dayOfWeek: 'Mon' });

    // Days 1 to 30 of ኅዳር 2019
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let d = 1; d <= 30; d++) {
      const gDate = new Date(2026, 10, 10 + (d - 1));
      const year = gDate.getFullYear();
      const month = String(gDate.getMonth() + 1).padStart(2, '0');
      const day = String(gDate.getDate()).padStart(2, '0');
      const isoDate = `${year}-${month}-${day}`;
      const dayOfWeek = dayNames[gDate.getDay()];
      const gregDateStr = `${gDate.toLocaleString('default', { month: 'short' })} ${gDate.getDate()}`;

      // Filter events occurring on this date
      const dayReminders = customReminders.filter(r => r.date === isoDate);
      const dayBills = recurringExpenses.filter(r => r.nextDueDate === isoDate);
      const dayPurchases = purchasePlans.filter(p => p.deliveryDate === isoDate);
      const daySalaries = salaryPlans.filter(s => s.dueMonth === 'ኅዳር 2019' && d === 22);
      const dayExpensesList = actualExpenses.filter(e => e.date === isoDate);
      const daySales = sentOrders
        .filter(o => o.createdAt && o.createdAt.startsWith(isoDate))
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      cells.push({
        dayNum: d,
        isCurrentMonth: true,
        isoDate,
        dayOfWeek,
        gregDateStr,
        reminders: dayReminders,
        bills: dayBills,
        purchases: dayPurchases,
        salaries: daySalaries,
        expensesList: dayExpensesList,
        daySales
      });
    }

    // Next month (ታኅሣሥ) padding: to complete 35 cells (need 3 more cells)
    cells.push({ dayNum: 1, isCurrentMonth: false, isoDate: '2026-12-10', gregDateStr: 'Dec 10', dayOfWeek: 'Thu' });
    cells.push({ dayNum: 2, isCurrentMonth: false, isoDate: '2026-12-11', gregDateStr: 'Dec 11', dayOfWeek: 'Fri' });
    cells.push({ dayNum: 3, isCurrentMonth: false, isoDate: '2026-12-12', gregDateStr: 'Dec 12', dayOfWeek: 'Sat' });

    return cells;
  }, [customReminders, recurringExpenses, purchasePlans, salaryPlans, actualExpenses, sentOrders]);

  // Selected Day Details
  const selectedDayCell = useMemo(() => {
    return calendarGrid.find(c => c.isoDate === selectedDate && c.isCurrentMonth) || {
      dayNum: 14,
      isoDate: selectedDate,
      reminders: [],
      bills: [],
      purchases: [],
      salaries: [],
      expensesList: [],
      daySales: 0
    };
  }, [calendarGrid, selectedDate]);

  // Color mapper helper for pastel chips
  const getChipStyle = (color) => {
    switch (color) {
      case 'peach':
        return 'bg-[#FFF3EA] border-[#FFE2CF] text-[#9A3412] hover:bg-[#FFE8D6]';
      case 'yellow':
        return 'bg-[#FEFCE8] border-[#FEF08A] text-[#854D0E] hover:bg-[#FEF9C3]';
      case 'pink':
        return 'bg-[#FDF2F8] border-[#FECDD3] text-[#9F1239] hover:bg-[#FCE7F3]';
      case 'purple':
        return 'bg-[#F5F3FF] border-[#DDD6FE] text-[#5B21B6] hover:bg-[#EDE9FE]';
      case 'coral':
        return 'bg-[#FFF1F2] border-[#FECDD3] text-[#BE123C] hover:bg-[#FFE4E6]';
      case 'mint':
      default:
        return 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46] hover:bg-[#D1FAE5]';
    }
  };

  const ethDateObj = toEthiopianDate(selectedDate);

  return (
    <div className="w-full bg-[#EDE8F5] p-2 sm:p-5 md:p-7 rounded-[40px] text-slate-800 font-sans shadow-inner selection:bg-purple-200">
      
      {/* MAIN SHELL CONTAINER (EXACT SOFT WHITE CURVED CARD) */}
      <div className="bg-white rounded-[32px] sm:rounded-[36px] shadow-2xl border border-purple-100/80 overflow-hidden flex flex-col md:flex-row min-h-[750px]">
        
        {/* ============================================================== */}
        {/* 1. LEFT SIDEBAR NAVIGATION (PURPLE RETRO STYLING)              */}
        {/* ============================================================== */}
        <aside className="w-full md:w-56 lg:w-60 bg-white p-5 md:p-6 border-b md:border-b-0 md:border-r border-purple-50 flex flex-col justify-between shrink-0">
          
          <div className="space-y-8">
            {/* BRAND LOGO: RemindMe. / Maraki. */}
            <div className="flex items-center gap-3">
              <div className="flex items-baseline">
                <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">RemindMe</span>
                <span className="w-2 h-2 rounded-full bg-[#6C5DD3] ml-0.5 inline-block"></span>
              </div>
              <div className="h-6 w-[2px] bg-[#6C5DD3]/30 rounded-full hidden sm:block"></div>
            </div>

            {/* NAV MENU ITEMS */}
            <nav className="space-y-2">
              {/* Dashboard */}
              <button
                type="button"
                onClick={() => onNavigateTab && onNavigateTab('home')}
                className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold text-slate-500 hover:text-slate-900 hover:bg-purple-50/50 transition-all group"
              >
                <LayoutGrid className="w-4 h-4 text-slate-400 group-hover:text-[#6C5DD3] transition-colors" />
                <span>Dashboard</span>
              </button>

              {/* Schedule (ACTIVE PURPLE PILL) */}
              <button
                type="button"
                className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs sm:text-sm font-black bg-[#6C5DD3] text-white shadow-lg shadow-[#6C5DD3]/30 transition-all scale-[1.02]"
              >
                <Calendar className="w-4 h-4 text-white" />
                <span>Schedule</span>
              </button>

              {/* Classroom / Kitchen */}
              <button
                type="button"
                onClick={() => onOpenKitchen && onOpenKitchen()}
                className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold text-slate-500 hover:text-slate-900 hover:bg-purple-50/50 transition-all group"
              >
                <GraduationCap className="w-4 h-4 text-slate-400 group-hover:text-[#6C5DD3] transition-colors" />
                <span>Classroom</span>
              </button>

              {/* Setting */}
              <button
                type="button"
                onClick={() => onOpenSettings && onOpenSettings()}
                className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold text-slate-500 hover:text-slate-900 hover:bg-purple-50/50 transition-all group"
              >
                <Settings className="w-4 h-4 text-slate-400 group-hover:text-[#6C5DD3] transition-colors" />
                <span>Setting</span>
              </button>
            </nav>
          </div>

          {/* LOG OUT BUTTON AT BOTTOM */}
          <div className="pt-6 border-t border-purple-50 mt-6">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('ከስርአቱ መውጣት ይፈልጋሉ? (Log out?)')) {
                  localStorage.removeItem('maraki_owner_authenticated');
                  window.location.reload();
                }
              }}
              className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50/50 transition-all w-full"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </button>
          </div>
        </aside>

        {/* ============================================================== */}
        {/* 2. CENTER & RIGHT WORKSPACE (FLEXIBLE WORK AREA)               */}
        {/* ============================================================== */}
        <div className="flex-1 flex flex-col xl:flex-row overflow-hidden bg-white">
          
          {/* MAIN CALENDAR COLUMN */}
          <main className="flex-1 p-4 sm:p-7 md:p-8 space-y-6 overflow-y-auto">
            
            {/* TOP GREETING & SEARCH BAR */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Hello, Angkasa
                </h1>
                <p className="text-xs text-slate-400 font-bold mt-0.5">
                  You are doing greate. Keep practicing !
                </p>
              </div>

              {/* Search Bar with Purple Circular Search Button */}
              <div className="flex items-center gap-3">
                <div className="relative flex items-center w-full sm:w-64">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search event, activities..."
                    className="w-full bg-[#FAF9FD] border border-purple-100 rounded-full pl-4 pr-11 py-2 text-xs font-bold text-slate-800 placeholder:text-slate-300 outline-none focus:border-[#6C5DD3] transition-colors"
                  />
                  <button
                    type="button"
                    className="absolute right-1 w-7 h-7 rounded-full bg-[#6C5DD3] text-white flex items-center justify-center hover:bg-[#5B4DBF] transition-all shadow-md shadow-[#6C5DD3]/30"
                  >
                    <Search className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Profile Avatar */}
                <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-purple-100 shadow-sm shrink-0 bg-purple-100 flex items-center justify-center text-sm font-black text-[#6C5DD3]">
                  👑
                </div>
              </div>
            </div>

            {/* CONTROLS ROW: [Month | Week | Day]  +  Month Title < >  +  + Add */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
              
              {/* Segmented Controls: Month | Week | Day */}
              <div className="flex items-center bg-[#F4F0FD] p-1 rounded-2xl self-start">
                {['Month', 'Week', 'Day'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setViewMode(m.toLowerCase())}
                    className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
                      viewMode === m.toLowerCase()
                        ? 'bg-[#6C5DD3] text-white shadow-md shadow-[#6C5DD3]/25'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* Month Title & Nav Arrows */}
              <div className="flex items-center gap-3 self-center sm:self-auto text-center sm:text-left">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
                    January 2022
                  </h2>
                  <span className="text-[10px] text-purple-600 font-bold block">
                    ኅዳር 2019 ዓ.ም (November 2026)
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => alert('Previous month')}
                    className="w-7 h-7 rounded-full bg-[#F4F0FD] hover:bg-purple-100 text-slate-700 flex items-center justify-center transition-all active:scale-95"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-600" />
                  </button>
                  <button
                    type="button"
                    onClick={() => alert('Next month')}
                    className="w-7 h-7 rounded-full bg-[#F4F0FD] hover:bg-purple-100 text-slate-700 flex items-center justify-center transition-all active:scale-95"
                  >
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
              </div>

              {/* + Add Button */}
              <div className="self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    setIsRightPanelOpen(true);
                    setEventTitle('');
                  }}
                  className="px-5 py-2 rounded-2xl bg-[#6C5DD3] hover:bg-[#5B4DBF] text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-[#6C5DD3]/30 transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>+ Add</span>
                </button>
              </div>

            </div>

            {/* ============================================================ */}
            {/* 3. CALENDAR GRID (7 COLUMNS SUN TO SAT)                      */}
            {/* ============================================================ */}
            <div className="border border-purple-50 rounded-3xl overflow-hidden shadow-xs">
              
              {/* 7 Days of Week Header */}
              <div className="grid grid-cols-7 text-center py-3 bg-[#FAF9FD] border-b border-purple-50 font-bold text-xs text-slate-400">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>

              {/* 35 Calendar Cells Grid */}
              <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-purple-50/80 bg-white">
                {calendarGrid.map((cell, idx) => {
                  const isSelected = selectedDate === cell.isoDate && cell.isCurrentMonth;
                  const isDay21 = cell.dayNum === 21 && cell.isCurrentMonth; // The highlighted date in the user's reference mockup!

                  if (!cell.isCurrentMonth) {
                    return (
                      <div
                        key={idx}
                        className="min-h-[90px] sm:min-h-[115px] p-2 bg-[#FAF9FD]/40 text-slate-300 text-xs font-bold select-none"
                      >
                        <span className="text-[11px] block text-right pr-1">{cell.dayNum}</span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedDate(cell.isoDate);
                        setIsRightPanelOpen(true);
                      }}
                      className={`min-h-[90px] sm:min-h-[115px] p-1.5 sm:p-2 transition-all cursor-pointer flex flex-col justify-between group hover:bg-[#FAF9FD] ${
                        isSelected ? 'bg-purple-50/40 ring-2 ring-inset ring-[#6C5DD3]' : 'bg-white'
                      }`}
                    >
                      {/* Cell Header with Date Number */}
                      <div className="flex items-center justify-end">
                        <span
                          className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                            isSelected || isDay21
                              ? 'bg-[#6C5DD3] text-white font-black shadow-md shadow-[#6C5DD3]/30 scale-105'
                              : 'text-slate-700 group-hover:text-[#6C5DD3]'
                          }`}
                        >
                          {cell.dayNum}
                        </span>
                      </div>

                      {/* Event Chips inside the cell (Pastel styling matching RemindMe) */}
                      <div className="space-y-1 mt-1">
                        
                        {/* Custom Reminders */}
                        {cell.reminders.map((rem) => (
                          <div
                            key={rem.id}
                            className={`px-1.5 py-0.5 rounded-lg border text-[10px] font-bold truncate transition-all shadow-2xs ${getChipStyle(rem.color)}`}
                            title={`${rem.title} (${rem.fromTime})`}
                          >
                            <span className="truncate">{rem.title}</span>
                          </div>
                        ))}

                        {/* Scheduled Obligations (Rent, Bills, Salaries) */}
                        {cell.bills.map((b) => (
                          <div
                            key={b.id}
                            className="px-1.5 py-0.5 rounded-lg border text-[10px] font-bold truncate bg-[#FEFCE8] border-[#FEF08A] text-[#854D0E]"
                            title={`${b.name} (${b.amount} ETB)`}
                          >
                            <span className="truncate">{b.name}</span>
                          </div>
                        ))}

                        {/* Fruit Purchases */}
                        {cell.purchases.map((p) => (
                          <div
                            key={p.id}
                            className="px-1.5 py-0.5 rounded-lg border text-[10px] font-bold truncate bg-[#FFF3EA] border-[#FFE2CF] text-[#9A3412]"
                            title={`${p.itemName} (${p.estimatedTotal} ETB)`}
                          >
                            <span className="truncate">🍏 {p.itemName}</span>
                          </div>
                        ))}

                        {/* Staff Salaries */}
                        {cell.salaries.length > 0 && (
                          <div
                            className="px-1.5 py-0.5 rounded-lg border text-[10px] font-bold truncate bg-[#FDF2F8] border-[#FECDD3] text-[#9F1239]"
                            title="Staff Salaries"
                          >
                            <span className="truncate">👥 ደመወዝ</span>
                          </div>
                        )}

                        {/* POS Sales (if any) */}
                        {cell.daySales > 0 && (
                          <div
                            className="px-1.5 py-0.5 rounded-lg border text-[10px] font-bold truncate bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]"
                            title={`Sales: +${cell.daySales} ETB`}
                          >
                            <span className="truncate">+${cell.daySales.toLocaleString()}</span>
                          </div>
                        )}

                      </div>

                    </div>
                  );
                })}
              </div>

            </div>

          </main>

          {/* ============================================================== */}
          {/* 3. RIGHT PANEL (EVENT/REMINDER CREATOR & MINI CALENDAR)        */}
          {/* ============================================================== */}
          {isRightPanelOpen && (
            <aside className="w-full xl:w-80 bg-[#FAF9FD] p-5 sm:p-6 border-t xl:border-t-0 xl:border-l border-purple-100 flex flex-col justify-between space-y-5 animate-in slide-in-from-right duration-200">
              
              <div className="space-y-5">
                
                {/* Top Purple Accent Progress Line & Dismiss (X) */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-[#6C5DD3]"></div>
                  <button
                    type="button"
                    onClick={() => setIsRightPanelOpen(false)}
                    className="w-6 h-6 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-600 flex items-center justify-center transition-all"
                    title="Close Panel"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* For Selector: [ Remainders ]  [ Event ]  [ + ] */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400 block">For</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEventType('Remainders')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        eventType === 'Remainders'
                          ? 'bg-[#EAE4FB] text-[#6C5DD3] border border-purple-200'
                          : 'bg-white text-slate-600 border border-slate-200 hover:border-purple-200'
                      }`}
                    >
                      Remainders
                    </button>
                    <button
                      type="button"
                      onClick={() => setEventType('Event')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        eventType === 'Event'
                          ? 'bg-[#EAE4FB] text-[#6C5DD3] border border-purple-200'
                          : 'bg-white text-slate-600 border border-slate-200 hover:border-purple-200'
                      }`}
                    >
                      Event
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const custom = prompt('Enter custom tag name:');
                        if (custom) setEventType(custom);
                      }}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-bold border border-dashed border-slate-300 text-slate-400 hover:border-[#6C5DD3] hover:text-[#6C5DD3] transition-all"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Title Input */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400 block">Title</span>
                  <input
                    type="text"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="Enter event or reminder title..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 placeholder:text-slate-300 outline-none focus:border-[#6C5DD3] transition-colors shadow-2xs"
                  />
                </div>

                {/* Time and Date Section */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 block">Time and Date</span>
                  
                  {/* From & To Chips */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white border border-slate-200 rounded-xl p-2 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[9px] text-slate-400 block font-bold">From</span>
                        <span className="font-bold text-slate-700">{fromTime}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const t = prompt('Set From Time:', fromTime);
                          if (t) setFromTime(t);
                        }}
                        className="text-slate-400 hover:text-slate-600 text-xs"
                      >
                        ×
                      </button>
                    </div>

                    <div className="flex-1 bg-white border border-slate-200 rounded-xl p-2 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[9px] text-slate-400 block font-bold">To</span>
                        <span className="font-bold text-slate-700">{toTime}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const t = prompt('Set To Time:', '02.00 pm');
                          if (t) setToTime(t);
                        }}
                        className="text-slate-400 hover:text-slate-600 text-xs"
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  {/* INTERACTIVE MINI CALENDAR PICKER (EXACT REPLICA FROM REFERENCE) */}
                  <div className="bg-white border border-purple-50 rounded-2xl p-3 shadow-xs space-y-1">
                    
                    {/* Mini Calendar Weekday Header */}
                    <div className="grid grid-cols-7 text-center font-bold text-[10px] text-slate-400 py-1">
                      <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
                    </div>

                    {/* Mini Calendar 35 Cells */}
                    <div className="grid grid-cols-7 text-center text-[11px]">
                      {calendarGrid.map((cell, mIdx) => {
                        const isMiniSelected = selectedDate === cell.isoDate && cell.isCurrentMonth;
                        const isMiniDay21 = cell.dayNum === 21 && cell.isCurrentMonth;

                        if (!cell.isCurrentMonth) {
                          return (
                            <span key={mIdx} className="text-slate-300 py-1">
                              {cell.dayNum}
                            </span>
                          );
                        }

                        return (
                          <button
                            key={mIdx}
                            type="button"
                            onClick={() => setSelectedDate(cell.isoDate)}
                            className={`py-1 rounded-full text-[11px] font-bold flex items-center justify-center transition-all ${
                              isMiniSelected || isMiniDay21
                                ? 'bg-[#6C5DD3] text-white font-black shadow-md shadow-[#6C5DD3]/30'
                                : 'text-slate-700 hover:bg-purple-50'
                            }`}
                          >
                            {cell.dayNum}
                          </button>
                        );
                      })}
                    </div>

                  </div>

                </div>

                {/* Location Input */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400 block">Location</span>
                  <input
                    type="text"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    placeholder="Enter location / room..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 placeholder:text-slate-300 outline-none focus:border-[#6C5DD3] transition-colors shadow-2xs"
                  />
                </div>

                {/* Submit Reminder Button */}
                <button
                  type="button"
                  onClick={handleAddReminder}
                  className="w-full py-2.5 rounded-xl bg-[#6C5DD3] hover:bg-[#5B4DBF] text-white text-xs font-black shadow-md shadow-[#6C5DD3]/30 transition-all active:scale-95"
                >
                  + Add Event / Reminder
                </button>

              </div>

              {/* SELECTED DATE SUMMARY & AUDIT LIST */}
              <div className="pt-4 border-t border-purple-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black text-slate-800">
                    {ethDateObj.formatted}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">
                    {selectedDayCell.reminders.length + selectedDayCell.bills.length + selectedDayCell.purchases.length} Items
                  </span>
                </div>

                {/* Itemized List for Selected Day */}
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 text-xs">
                  {selectedDayCell.reminders.map((rem) => (
                    <div
                      key={rem.id}
                      className="p-2 rounded-xl bg-white border border-purple-100 flex items-center justify-between gap-2 shadow-2xs"
                    >
                      <div className="truncate">
                        <span className="font-bold text-slate-800 block truncate">{rem.title}</span>
                        <span className="text-[10px] text-slate-400 font-bold block">{rem.fromTime} • {rem.location}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteReminder(rem.id)}
                        className="text-slate-300 hover:text-rose-500 p-1"
                        title="Delete reminder"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {selectedDayCell.bills.map((b) => (
                    <div
                      key={b.id}
                      className="p-2 rounded-xl bg-[#FEFCE8] border border-[#FEF08A] flex items-center justify-between gap-2"
                    >
                      <div className="truncate">
                        <span className="font-bold text-[#854D0E] block truncate">🏢 {b.name}</span>
                        <span className="text-[10px] text-amber-700 block">{b.amount} ETB</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onInitiatePayment && onInitiatePayment('bill', b, b.amount)}
                        className="text-[10px] font-black text-emerald-700 hover:underline"
                      >
                        Pay →
                      </button>
                    </div>
                  ))}

                  {selectedDayCell.reminders.length === 0 && selectedDayCell.bills.length === 0 && (
                    <div className="text-center py-4 text-slate-400 text-[11px] font-bold">
                      No events logged for this date.
                    </div>
                  )}
                </div>

              </div>

            </aside>
          )}

        </div>

      </div>

    </div>
  );
}
