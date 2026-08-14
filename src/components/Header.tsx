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

export type MainTab = 'calculator' | 'pending' | 'delivery' | 'purchases' | 'expenses' | 'account' | 'history' | 'kitchen' | 'settings';

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
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const currentWorker = activeShift === 'day' ? config.dayShiftWorkerName : config.nightShiftWorkerName;

  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }} 
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="sticky top-0 z-50 bg-white border-b border-[#2D4F1E]/20 shadow-xs text-[#2D4F1E] font-sans"
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
                  e.currentTarget.parentElement?.classList.add('bg-[#FAF6EE]', 'text-[#2D4F1E]', 'rounded-lg', 'w-10');
                  e.currentTarget.parentElement!.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-store"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h2V14h8v8h2a2 2 0 0 0 2-2v-8"/><path d="M2 7h20v2a2 2 0 0 1-2 2h-1.3c-.63 0-1.22-.3-1.6-.8l-.8-1.1a1 1 0 0 0-1.6 0l-.8 1.1c-.38.5-.97.8-1.6.8H12c-.63 0-1.22-.3-1.6-.8l-.8-1.1a1 1 0 0 0-1.6 0l-.8 1.1c-.38.5-.97.8-1.6.8H4a2 2 0 0 1-2-2z"/></svg>';
                }}
              />
            </div>
            <div className="flex flex-col hidden sm:flex">
              <h1 className="text-xl font-extrabold tracking-tight text-[#2D4F1E]">
                Maraki Juice and Salad
              </h1>
            </div>
          </div>

          {/* Center: Month Selector */}
          <div className="flex items-center gap-3 bg-[#FAF6EE] rounded-full px-3 py-1.5 border border-[#2D4F1E]/20 hidden md:flex">
            <button
              onClick={onPrevMonth}
              className="p-1 rounded-full hover:bg-stone-200 text-[#2D4F1E] transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="flex flex-col items-center min-w-[140px]">
              <div className="flex items-center gap-1.5 text-[#2D4F1E]">
                <CalendarIcon className="w-3.5 h-3.5 text-[#4A7C36]" />
                <span className="font-extrabold text-sm">{selectedMonth} <span className="text-stone-500 font-normal text-xs ml-1">({getEthiopianMonthYear(selectedMonth)})</span></span>
              </div>
            </div>

            <button
              onClick={onNextMonth}
              className="p-1 rounded-full hover:bg-stone-200 text-[#2D4F1E] transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Right Controls: Quick Shift Toggle & Profile Menu Dropdown */}
          <div className="flex items-center gap-3">
            
            {/* Quick Shift Toggle Pill */}
            <div className="flex items-center gap-1 bg-[#FAF6EE] p-1 rounded-full border border-[#2D4F1E]/20">
              <button
                onClick={() => setActiveShift('day')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase transition-all duration-150 cursor-pointer ${
                  activeShift === 'day'
                    ? 'bg-[#84CC16] text-[#2D4F1E] shadow-xs'
                    : 'text-stone-600 hover:text-[#2D4F1E] hover:bg-stone-200'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-[#2D4F1E]" />
                <span>Day</span>
              </button>

              <button
                onClick={() => setActiveShift('night')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase transition-all duration-150 cursor-pointer ${
                  activeShift === 'night'
                    ? 'bg-[#84CC16] text-[#2D4F1E] shadow-xs'
                    : 'text-stone-600 hover:text-[#2D4F1E] hover:bg-stone-200'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-[#2D4F1E]" />
                <span>Night</span>
              </button>
            </div>

            {/* Profile Dropdown Trigger Button */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 bg-[#FAF6EE] hover:bg-stone-200 border border-[#2D4F1E]/20 px-3.5 py-1.5 rounded-full transition-all cursor-pointer shadow-xs active:scale-95 text-[#2D4F1E]"
              >
                <div className="w-7 h-7 rounded-full bg-[#84CC16] text-[#2D4F1E] flex items-center justify-center font-extrabold text-xs shadow-xs">
                  <User className="w-4 h-4" />
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-extrabold leading-tight text-[#2D4F1E]">{currentWorker}</span>
                  <span className="text-[10px] text-[#4A7C36] font-bold uppercase tracking-wider">{activeShift} Shift</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-stone-500 transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown Menu (Deep Olive & Cream Style) */}
              <AnimatePresence>
                {isProfileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute right-0 mt-2 w-72 bg-[#2D4F1E] rounded-3xl shadow-2xl border border-[#84CC16]/40 p-4 z-50 text-white space-y-4"
                  >
                    {/* User Info Header */}
                    <div className="flex items-center gap-3 p-3 bg-[#395F27] rounded-2xl border border-[#84CC16]/30">
                      <div className="w-10 h-10 rounded-full bg-[#84CC16] text-[#2D4F1E] flex items-center justify-center font-extrabold shadow-xs">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-white">{currentWorker}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#84CC16] text-[#2D4F1E] uppercase">
                            {activeShift} Shift Active
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Shift Switcher inside Dropdown Menu */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-stone-300 px-1">
                        Switch Duty Shift
                      </label>
                      <div className="grid grid-cols-2 gap-2 bg-[#395F27] p-1.5 rounded-2xl border border-[#84CC16]/30">
                        <button
                          onClick={() => {
                            setActiveShift('day');
                            setIsProfileMenuOpen(false);
                          }}
                          className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                            activeShift === 'day'
                              ? 'bg-[#84CC16] text-[#2D4F1E] shadow-xs'
                              : 'text-stone-200 hover:text-white hover:bg-[#477333]'
                          }`}
                        >
                          <Sun className="w-4 h-4 text-[#2D4F1E]" />
                          <span>Day Shift</span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveShift('night');
                            setIsProfileMenuOpen(false);
                          }}
                          className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                            activeShift === 'night'
                              ? 'bg-[#84CC16] text-[#2D4F1E] shadow-xs'
                              : 'text-stone-200 hover:text-white hover:bg-[#477333]'
                          }`}
                        >
                          <Moon className="w-4 h-4 text-[#2D4F1E]" />
                          <span>Night Shift</span>
                        </button>
                      </div>
                    </div>

                    {/* Quick Links inside Menu */}
                    <div className="space-y-1 border-t border-[#84CC16]/20 pt-3">
                      <a
                        href="/shift"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#395F27] text-xs font-bold text-white transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4 text-[#84CC16]" />
                          <span>Mobile Shift App</span>
                        </div>
                        <span className="text-[10px] bg-[#84CC16] text-[#2D4F1E] font-extrabold px-2 py-0.5 rounded-full">Open</span>
                      </a>

                      <button
                        onClick={() => {
                          setActiveTab('settings');
                          setIsProfileMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#395F27] text-xs font-bold text-white transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Settings className="w-4 h-4 text-[#84CC16]" />
                          <span>System Settings</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-stone-300" />
                      </button>
                    </div>

                    {/* Logout Option inside Menu */}
                    <div className="border-t border-[#84CC16]/20 pt-3">
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-extrabold text-rose-200 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 transition-all cursor-pointer active:scale-95"
                      >
                        <LogOut className="w-4 h-4 text-rose-300" />
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
              ? 'bg-[#84CC16] text-[#2D4F1E] font-extrabold shadow-xs' 
              : 'bg-[#FAF6EE] text-stone-700 hover:text-[#2D4F1E] hover:bg-stone-200 font-bold border border-[#2D4F1E]/15';

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as MainTab)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full whitespace-nowrap transition-all duration-150 cursor-pointer text-xs ${activeClasses}`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#2D4F1E]' : 'text-[#4A7C36]'}`} />
                <span>{tab.label}</span>

                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full text-[10px] font-extrabold ml-1 ${
                    isActive ? 'bg-[#2D4F1E] text-white' : 'bg-[#84CC16] text-[#2D4F1E]'
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
