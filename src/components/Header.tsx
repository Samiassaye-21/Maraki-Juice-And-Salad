import React from 'react';
import { motion } from 'motion/react';
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
  Sparkles,
  ShoppingCart,
  BarChart3,
  FileText,
  LogOut,
  ChefHat
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

  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }} 
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="sticky top-0 z-50 bg-white border-b border-[#238868]/20 shadow-xs text-[#07250D] font-sans"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        
        {/* Top Row: Brand, Month & Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
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
                  e.currentTarget.parentElement?.classList.add('bg-[#F4F8F5]', 'text-[#238868]', 'rounded-lg', 'w-10');
                  e.currentTarget.parentElement!.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-store"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h2V14h8v8h2a2 2 0 0 0 2-2v-8"/><path d="M2 7h20v2a2 2 0 0 1-2 2h-1.3c-.63 0-1.22-.3-1.6-.8l-.8-1.1a1 1 0 0 0-1.6 0l-.8 1.1c-.38.5-.97.8-1.6.8H12c-.63 0-1.22-.3-1.6-.8l-.8-1.1a1 1 0 0 0-1.6 0l-.8 1.1c-.38.5-.97.8-1.6.8H4a2 2 0 0 1-2-2z"/></svg>';
                }}
              />
            </div>
            <div className="flex flex-col hidden sm:flex">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-[#07250D]">
                  Maraki Juice and Salad
                </h1>
              </div>
            </div>
          </div>

          {/* Center: Month & Worker Name */}
          <div className="flex items-center gap-3 bg-[#F4F8F5] rounded-full px-3 py-1.5 border border-[#238868]/20 hidden lg:flex">
            <button
              onClick={onPrevMonth}
              className="p-1 rounded-full hover:bg-slate-200 text-[#07250D] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="flex flex-col items-center min-w-[140px]">
              <div className="flex items-center gap-1.5 text-[#07250D]">
                <CalendarIcon className="w-3.5 h-3.5 text-[#238868]" />
                <span className="font-extrabold text-sm">{selectedMonth} <span className="text-neutral-500 font-normal text-xs ml-1">({getEthiopianMonthYear(selectedMonth)})</span></span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-neutral-600 font-medium">
                <Sparkles className="w-3 h-3 text-[#238868]" />
                <span>{activeShift === 'day' ? config.dayShiftWorkerName : config.nightShiftWorkerName}</span>
              </div>
            </div>

            <button
              onClick={onNextMonth}
              className="p-1 rounded-full hover:bg-slate-200 text-[#07250D] transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Controls: Shift Toggle */}
          <div className="flex items-center gap-1 bg-[#F4F8F5] p-1 rounded-full border border-[#238868]/20">
            <button
              onClick={() => setActiveShift('day')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase transition-all duration-150 cursor-pointer ${
                activeShift === 'day'
                  ? 'bg-[#13EE86] text-[#07250D] shadow-md'
                  : 'text-neutral-600 hover:text-[#07250D] hover:bg-slate-200'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Day</span>
            </button>

            <button
              onClick={() => setActiveShift('night')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase transition-all duration-150 cursor-pointer ${
                activeShift === 'night'
                  ? 'bg-[#13EE86] text-[#07250D] shadow-md'
                  : 'text-neutral-600 hover:text-[#07250D] hover:bg-slate-200'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Night</span>
            </button>
          </div>

          <div className="flex items-center gap-2 border-l border-[#238868]/20 pl-3 ml-1">
            <a
              href="/shift"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-extrabold text-[#07250D] bg-[#13EE86] hover:bg-[#10DF7D] transition-all shadow-md active:scale-95"
              title="Open Mobile Shift Income Portal"
            >
              <Moon className="w-3.5 h-3.5 text-[#07250D]" />
              <span className="hidden sm:inline">Mobile Shift App</span>
              <span className="sm:hidden">Shift App</span>
            </a>

            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-[#07250D] border-2 border-[#07250D] hover:bg-[#07250D] hover:text-white transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-500" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Bottom Row: Navigation Tabs */}
        <div className="mt-3 flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            const activeClasses = isActive 
              ? 'bg-[#13EE86] text-[#07250D] font-extrabold shadow-md' 
              : 'bg-[#F4F8F5] text-neutral-600 hover:text-[#07250D] hover:bg-slate-200 font-bold border border-[#238868]/15';

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as MainTab)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full whitespace-nowrap transition-all duration-150 cursor-pointer text-xs ${activeClasses}`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#07250D]' : 'text-[#238868]'}`} />
                <span>{tab.label}</span>

                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full text-[10px] font-extrabold ml-1 ${
                    isActive ? 'bg-[#07250D] text-white' : 'bg-[#13EE86] text-[#07250D]'
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
