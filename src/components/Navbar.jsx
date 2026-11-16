import React from 'react';
import { 
  Store, 
  ChefHat, 
  Scale, 
  Receipt, 
  RefreshCw, 
  Coffee, 
  Package, 
  DollarSign,
  ShieldCheck
} from 'lucide-react';

export default function Navbar({ 
  currentTab, 
  setCurrentTab, 
  totalSales, 
  cupsSold, 
  boxesSold, 
  activeTicketsCount,
  onResetDemo
}) {
  const navItems = [
    { id: 'pos', label: '1. Waiter / POS Terminal', icon: Store, badge: null },
    { id: 'kitchen', label: '2. Kitchen Cross-Check', icon: ChefHat, badge: activeTicketsCount > 0 ? activeTicketsCount : null },
    { id: 'audit', label: '3. Cups & Boxes vs Money Audit', icon: Scale, badge: 'Key Focus' },
    { id: 'reports', label: '4. Cash & Daily Sales', icon: Receipt, badge: null },
  ];

  return (
    <header className="bg-slate-900 text-white shadow-xl sticky top-0 z-50">
      {/* Top Banner with Brand & Metrics */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-lime-400 flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/20">
            🥤
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">MARAKI</h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Juice & Salad Bar
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Verified Closed-Loop Sales & Packaging Control
            </p>
          </div>
        </div>

        {/* Live Shift Counter Pills */}
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          {/* Cups Counter */}
          <div className="bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <span className="text-lg">🥤</span>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Cups Sold</div>
              <div className="text-sm font-bold text-emerald-400">{cupsSold} pcs</div>
            </div>
          </div>

          {/* Food Boxes Counter */}
          <div className="bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <span className="text-lg">🥡</span>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Boxes Sold</div>
              <div className="text-sm font-bold text-amber-400">{boxesSold} pcs</div>
            </div>
          </div>

          {/* Revenue */}
          <div className="bg-slate-800/90 border border-slate-700 px-3.5 py-1.5 rounded-lg flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
              Br
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Recorded Sales</div>
              <div className="text-sm font-bold text-white">{totalSales.toLocaleString()} ETB</div>
            </div>
          </div>

          <button
            onClick={onResetDemo}
            title="Reset to fresh demo shift"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-slate-700"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Workflow Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4">
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      isActive
                        ? 'bg-white text-emerald-700'
                        : item.badge === 'Key Focus'
                        ? 'bg-amber-400 text-slate-950 animate-pulse'
                        : 'bg-emerald-500 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
