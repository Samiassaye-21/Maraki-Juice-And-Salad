import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Sun,
  Moon,
  Calculator,
  Clock,
  Truck,
  Settings,
  Receipt,
  ShoppingCart,
  BarChart3,
  FileText,
  LogOut,
  ChefHat,
  User,
  ChevronDown,
  Smartphone
} from 'lucide-react';
import { ShiftType, RestaurantSystemConfig, SystemSummaryStats } from '../types';
import { getEthiopianMonthYear } from '../utils/shiftUtils';

export type MainTab = 'calculator' | 'pending' | 'delivery' | 'purchases' | 'expenses' | 'account' | 'history' | 'kitchen' | 'orders' | 'settings';

interface HeaderProps {
  activeTab: MainTab;
  setActiveTab: (tab: MainTab) => void;
  activeShift: ShiftType;
  setActiveShift: (shift: ShiftType) => void;
  selectedMonth: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  selectedCurrency: string;
  onChangeCurrency: (curr: string) => void;
  selectedLanguage: string;
  onChangeLanguage: (lang: string) => void;
  summary: SystemSummaryStats;
  config: RestaurantSystemConfig;
  pendingShiftsCount?: number;
  themeMode?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  activeShift,
  setActiveShift,
  selectedMonth,
  onPrevMonth,
  onNextMonth,
  summary,
  config,
  pendingShiftsCount,
  onLogout
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  interface TabItem {
    id: MainTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
  }

  const tabs: TabItem[] = [
    { id: 'calculator', label: 'Shift Reconciliation', icon: Calculator, count: pendingShiftsCount },
    { id: 'pending', label: 'Pending Payments', icon: Clock, count: summary.totalPendingOutstanding },
    { id: 'delivery', label: 'Delivery Accounts', icon: Truck, count: summary.totalDeliveryUnsettled },
    { id: 'purchases', label: 'Inventory Purchases', icon: ShoppingCart },
    { id: 'expenses', label: 'Other Expenses', icon: FileText },
    { id: 'account', label: 'Account & Balance', icon: BarChart3 },
    { id: 'history', label: 'Shift History', icon: Receipt },
    { id: 'kitchen', label: 'Kitchen Check', icon: ChefHat },
    { id: 'orders', label: 'Tablet Orders', icon: Smartphone },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const currentWorker = activeShift === 'day' ? config.dayShiftWorkerName : config.nightShiftWorkerName;

  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }} 
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="sticky top-0 z-50 bg-white border-b border-[#0B1D2C]/20 shadow-xs text-[#0B1D2C] font-sans"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        
        {/* Top Row: Brand, Month & Menu Controls */}
        <div className="flex items-center justify-between gap-4">
          
          {/* Brand Identity with Logo */}
          <div 
            onClick={() => setActiveTab('calculator')}
            className="cursor-pointer flex items-center gap-3 group"
          >
            <div className="relative h-10 min-w-[40px] flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
              <img 
                src="/logo.jpg" 
                alt="Maraki Juice and Salad Logo" 
                className="h-full w-auto object-contain rounded-lg"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement?.classList.add('bg-[#f7f5f0]', 'text-[#0B1D2C]', 'rounded-lg', 'w-10');
                  e.currentTarget.parentElement!.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-store"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h2V14h8v8h2a2 2 0 0 0 2-2v-8"/><path d="M2 7h20v2a2 2 0 0 1-2 2h-1.3c-.63 0-1.22-.3-1.6-.8l-.8-1.1a1 1 0 0 0-1.6 0l-.8 1.1c-.38.5-.97.8-1.6.8H12c-.63 0-1.22-.3-1.6-.8l-.8-1.1a1 1 0 0 0-1.6 0l-.8 1.1c-.38.5-.97.8-1.6.8H4a2 2 0 0 1-2-2z"/></svg>';
                }}
              />
            </div>
            <div className="flex flex-col hidden sm:flex">
              <h1 className="text-xl font-extrabold tracking-tight text-white font-bold">
                Maraki Juice and Salad
              </h1>
            </div>
          </div>

          {/* Center: Month Selector */}
          <div className="flex items-center gap-3 bg-[#f7f5f0] rounded-full px-3 py-1.5 border border-[#0B1D2C]/20 hidden md:flex">
            <button
              onClick={onPrevMonth}
              className="p-1 rounded-full hover:bg-[#0B1D2C]/30 text-[#0B1D2C] transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="flex flex-col items-center min-w-[140px]">
              <div className="flex items-center gap-1.5 text-[#0B1D2C]">
                <CalendarIcon className="w-3.5 h-3.5 text-[#0B1D2C]" />
                <span className="font-extrabold text-sm">{selectedMonth} <span className="text-[#0B1D2C]/70 font-normal text-xs ml-1">({getEthiopianMonthYear(selectedMonth)})</span></span>
              </div>
            </div>

            <button
              onClick={onNextMonth}
              className="p-1 rounded-full hover:bg-[#0B1D2C]/30 text-[#0B1D2C] transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Right Controls: Quick Shift Toggle & Profile Menu Dropdown */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Direct Tablet POS Launch Button */}
            <a
              href="/tablet"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-[#0B1D2C] px-3.5 py-1.5 rounded-full text-xs font-black transition-all shadow-sm active:scale-95 border border-amber-400"
              title="Open Tablet POS Screen in new tab"
            >
              <Smartphone className="w-3.5 h-3.5 text-[#0B1D2C]" />
              <span className="hidden sm:inline">📱 Tablet POS</span>
              <span className="sm:hidden">POS</span>
            </a>

            {/* Quick Shift Toggle Pill */}
            <div className="flex items-center gap-1 bg-[#f7f5f0] p-1 rounded-full border border-[#0B1D2C]/20">
              <button
                onClick={() => setActiveShift('day')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase transition-all duration-150 cursor-pointer ${
                  activeShift === 'day'
                    ? 'bg-[#0B1D2C] text-white font-bold shadow-xs'
                    : 'text-[#0B1D2C]/80 hover:text-[#0B1D2C] hover:bg-[#0B1D2C]/30'
                }`}
              >
                <Sun className={`w-3.5 h-3.5 ${activeShift === 'day' ? 'text-white font-bold' : 'text-[#0B1D2C]'}`} />
                <span>Day</span>
              </button>

              <button
                onClick={() => setActiveShift('night')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase transition-all duration-150 cursor-pointer ${
                  activeShift === 'night'
                    ? 'bg-[#0B1D2C] text-white font-bold shadow-xs'
                    : 'text-[#0B1D2C]/80 hover:text-[#0B1D2C] hover:bg-[#0B1D2C]/30'
                }`}
              >
                <Moon className={`w-3.5 h-3.5 ${activeShift === 'night' ? 'text-white font-bold' : 'text-[#0B1D2C]'}`} />
                <span>Night</span>
              </button>
            </div>

            {/* Profile Dropdown Trigger Button */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 bg-[#f7f5f0] hover:bg-[#0B1D2C]/30 border border-[#0B1D2C]/20 px-3.5 py-1.5 rounded-full transition-all cursor-pointer shadow-xs active:scale-95 text-[#0B1D2C]"
              >
                <div className="w-7 h-7 rounded-full bg-[#0B1D2C] text-white font-bold flex items-center justify-center font-extrabold text-xs shadow-xs">
                  <User className="w-4 h-4 text-white font-bold" />
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-extrabold leading-tight text-[#0B1D2C]">{currentWorker}</span>
                  <span className="text-[10px] text-[#0B1D2C]/80 font-bold uppercase tracking-wider">{activeShift} Shift</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-[#0B1D2C]/70 transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown Menu */}
              <AnimatePresence>
                {isProfileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute right-0 mt-2 w-72 bg-[#0B1D2C] rounded-3xl shadow-2xl border border-[#0B1D2C]/40 p-4 z-50 text-white font-bold space-y-4"
                  >
                    {/* User Info Header */}
                    <div className="flex items-center gap-3 p-3 bg-[#081521] rounded-2xl border border-[#0B1D2C]/30">
                      <div className="w-10 h-10 rounded-full bg-[#0B1D2C] text-white font-bold flex items-center justify-center font-extrabold shadow-xs">
                        <User className="w-5 h-5 text-white font-bold" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-white font-bold">{currentWorker}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#f7f5f0] text-[#0B1D2C] uppercase">
                            {activeShift} Shift Active
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Shift Switcher inside Dropdown Menu */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-white font-bold/80 px-1">
                        Switch Duty Shift
                      </label>
                      <div className="grid grid-cols-2 gap-2 bg-[#081521] p-1.5 rounded-2xl border border-[#0B1D2C]/30">
                        <button
                          onClick={() => {
                            setActiveShift('day');
                            setIsProfileMenuOpen(false);
                          }}
                          className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                            activeShift === 'day'
                              ? 'bg-[#f7f5f0] text-[#0B1D2C] shadow-xs'
                              : 'text-white font-bold/80 hover:text-white font-bold hover:bg-[#0B1D2C]'
                          }`}
                        >
                          <Sun className={`w-4 h-4 ${activeShift === 'day' ? 'text-[#0B1D2C]' : 'text-white font-bold'}`} />
                          <span>Day Shift</span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveShift('night');
                            setIsProfileMenuOpen(false);
                          }}
                          className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                            activeShift === 'night'
                              ? 'bg-[#f7f5f0] text-[#0B1D2C] shadow-xs'
                              : 'text-white font-bold/80 hover:text-white font-bold hover:bg-[#0B1D2C]'
                          }`}
                        >
                          <Moon className={`w-4 h-4 ${activeShift === 'night' ? 'text-[#0B1D2C]' : 'text-white font-bold'}`} />
                          <span>Night Shift</span>
                        </button>
                      </div>
                    </div>

                    {/* Quick Portal Launch Links inside Menu */}
                    <div className="space-y-1.5 border-t border-[#f7f5f0]/20 pt-3">
                      <a
                        href="/tablet"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-xs font-bold text-amber-200 transition-colors border border-amber-400/30"
                      >
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4 text-amber-300" />
                          <span>📱 Tablet POS App</span>
                        </div>
                        <span className="text-[10px] bg-amber-400 text-[#0B1D2C] font-black px-2 py-0.5 rounded-full">Launch</span>
                      </a>

                      <a
                        href="/kitchen"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-xs font-bold text-emerald-200 transition-colors border border-emerald-400/30"
                      >
                        <div className="flex items-center gap-2">
                          <ChefHat className="w-4 h-4 text-emerald-300" />
                          <span>👨‍🍳 Kitchen Portal</span>
                        </div>
                        <span className="text-[10px] bg-emerald-400 text-[#0B1D2C] font-black px-2 py-0.5 rounded-full">Launch</span>
                      </a>

                      <a
                        href="/shift"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#081521] text-xs font-bold text-white transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Receipt className="w-4 h-4 text-white" />
                          <span>Mobile Shift App</span>
                        </div>
                        <span className="text-[10px] bg-[#f7f5f0] text-[#0B1D2C] font-extrabold px-2 py-0.5 rounded-full">Open</span>
                      </a>

                      <button
                        onClick={() => {
                          setActiveTab('settings');
                          setIsProfileMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#081521] text-xs font-bold text-white transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Settings className="w-4 h-4 text-white" />
                          <span>System Settings</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/80" />
                      </button>
                    </div>

                    {/* Logout Option inside Menu */}
                    <div className="border-t border-[#f7f5f0]/20 pt-3">
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-extrabold text-white font-bold bg-[#000000]/60 hover:bg-[#000000] border border-[#f7f5f0]/30 transition-all cursor-pointer active:scale-95"
                      >
                        <LogOut className="w-4 h-4 text-white font-bold" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>

        {/* Bottom Row: Navigation Tabs */}
        <div className="mt-3 flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            const activeClasses = isActive 
              ? 'bg-[#0B1D2C] text-white font-black shadow-xs' 
              : 'bg-[#f7f5f0] text-[#0B1D2C] hover:text-[#0B1D2C] hover:bg-[#0B1D2C]/20 font-bold border border-[#0B1D2C]/15';

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as MainTab)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full whitespace-nowrap transition-all duration-150 cursor-pointer text-xs ${activeClasses}`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white font-bold' : 'text-[#0B1D2C]'}`} />
                <span>{tab.label}</span>

                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full text-[10px] font-extrabold ml-1 ${
                    isActive ? 'bg-[#f7f5f0] text-[#0B1D2C]' : 'bg-[#0B1D2C] text-white font-bold'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

      </div>
    </motion.header>
  );
};

export default Header;
