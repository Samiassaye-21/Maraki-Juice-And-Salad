import React, { useState, useRef, useEffect } from 'react';
import { 
  Settings, 
  CupSoda, 
  UtensilsCrossed, 
  CheckCircle2, 
  User, 
  Sparkles,
  Plus,
  Trash2,
  Pencil,
  RotateCcw,
  Tag,
  PenTool,
  Upload,
  Lock,
  KeyRound
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RestaurantSystemConfig, SystemSummaryStats, FoodMenuItem } from '../types';
import { DEFAULT_FOOD_MENU } from '../data/initialData';
import { cleanNumberInput, cleanStringNumberInput, handleInputFocus } from '../utils/shiftUtils';
import { safeLocalStorage } from '../utils/safeStorage';

interface BudgetSettingsProps {
  config: RestaurantSystemConfig;
  onSaveConfig: (newConfig: RestaurantSystemConfig) => void;
  summary: SystemSummaryStats;
}

export const BudgetSettings: React.FC<BudgetSettingsProps> = ({
  config,
  onSaveConfig,
  summary,
}) => {
  const getInitialPins = () => {
    const savedStr = safeLocalStorage.getItem('maraki_shift_pins');
    if (savedStr) {
      try { return JSON.parse(savedStr); } catch {}
    }
    return {};
  };
  const initialPins = getInitialPins();

  const [juicePrice, setJuicePrice] = useState(config.defaultJuiceUnitPrice || 170);
  const [foodPrice, setFoodPrice] = useState(config.defaultFoodUnitPrice || 220);
  const [dayWorker, setDayWorker] = useState(config.dayShiftWorkerName);
  const [nightWorker, setNightWorker] = useState(config.nightShiftWorkerName);
  const [dayShiftPin, setDayShiftPin] = useState(config.dayShiftPin || initialPins.dayShiftPin || '1111');
  const [nightShiftPin, setNightShiftPin] = useState(config.nightShiftPin || initialPins.nightShiftPin || '2222');
  const [daySignatureUrl, setDaySignatureUrl] = useState<string>(config.dayWorkerSignatureUrl || '');
  const [nightSignatureUrl, setNightSignatureUrl] = useState<string>(config.nightWorkerSignatureUrl || '');
  const [restaurantName, setRestaurantName] = useState(config.restaurantName);
  const [currencySymbol, setCurrencySymbol] = useState(config.currencySymbol);

  // Keep state synchronized with incoming config or local storage updates
  useEffect(() => {
    const savedStr = safeLocalStorage.getItem('maraki_shift_pins');
    let saved: any = {};
    if (savedStr) {
      try { saved = JSON.parse(savedStr); } catch {}
    }
    if (config.dayShiftPin) setDayShiftPin(config.dayShiftPin);
    else if (saved.dayShiftPin) setDayShiftPin(saved.dayShiftPin);

    if (config.nightShiftPin) setNightShiftPin(config.nightShiftPin);
    else if (saved.nightShiftPin) setNightShiftPin(saved.nightShiftPin);
  }, [config]);

  // ── Full-screen Signature Modal ──────────────────────────────────────────
  const [sigModalOpen, setSigModalOpen] = useState(false);
  const [sigModalTarget, setSigModalTarget] = useState<'day' | 'night'>('day');
  const modalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingModal = useRef(false);
  const modalHasSigned = useRef(false);

  const openSigModal = (target: 'day' | 'night') => {
    setSigModalTarget(target);
    setSigModalOpen(true);
    modalHasSigned.current = false;
  };

  // Fill canvas white when modal opens
  useEffect(() => {
    if (!sigModalOpen) return;
    // Small delay so the canvas has rendered
    const t = setTimeout(() => {
      const canvas = modalCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, 50);
    return () => clearTimeout(t);
  }, [sigModalOpen]);

  const modalStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    const canvas = modalCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    isDrawingModal.current = true;
    modalHasSigned.current = true;
  };

  const modalDraw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!isDrawingModal.current) return;
    const canvas = modalCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#111111';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const modalStop = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    isDrawingModal.current = false;
  };

  const confirmModalSignature = () => {
    const canvas = modalCanvasRef.current;
    if (!canvas || !modalHasSigned.current) return;
    const dataUrl = canvas.toDataURL('image/png');
    if (sigModalTarget === 'day') setDaySignatureUrl(dataUrl);
    else setNightSignatureUrl(dataUrl);
    setSigModalOpen(false);
  };

  const clearModalCanvas = () => {
    const canvas = modalCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    modalHasSigned.current = false;
  };

  const clearMaster = (setUrl: (s: string) => void) => {
    setUrl('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setUrl: (s: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Food Menu state
  const [foodMenu, setFoodMenu] = useState<FoodMenuItem[]>(config.foodMenu || DEFAULT_FOOD_MENU);

  // Add Item form state
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<'traditional' | 'fast_food' | 'breakfast' | 'special'>('traditional');
  const [showAddForm, setShowAddForm] = useState(false);

  // Edit Item modal state
  const [editingItem, setEditingItem] = useState<FoodMenuItem | null>(null);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleAddFoodItem = (e: React.FormEvent) => {
    e.preventDefault();
    const numericPrice = parseFloat(newItemPrice);
    if (!newItemName.trim() || isNaN(numericPrice) || numericPrice <= 0) return;

    const item: FoodMenuItem = {
      id: 'fm-' + Date.now(),
      name: newItemName.trim(),
      price: numericPrice,
      category: newItemCategory,
      available: true,
    };

    setFoodMenu((prev) => [...prev, item]);
    setNewItemName('');
    setNewItemPrice('');
    setShowAddForm(false);
  };

  const handleRemoveFoodItem = (id: string) => {
    setFoodMenu((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateFoodItem = (updated: FoodMenuItem) => {
    setFoodMenu((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    setEditingItem(null);
  };

  const handleResetMenu = () => {
    if (window.confirm('Reset food menu items to default Ethiopian dishes?')) {
      setFoodMenu(DEFAULT_FOOD_MENU);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      defaultJuiceUnitPrice: juicePrice,
      defaultFoodUnitPrice: foodPrice,
      foodMenu,
      dayShiftWorkerName: dayWorker.trim(),
      nightShiftWorkerName: nightWorker.trim(),
      dayShiftPin: dayShiftPin.trim() || '1111',
      nightShiftPin: nightShiftPin.trim() || '2222',
      dayWorkerSignatureUrl: daySignatureUrl || undefined,
      nightWorkerSignatureUrl: nightSignatureUrl || undefined,
      restaurantName: restaurantName.trim() || 'Maraki Juice and Salad',
      currencySymbol,
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 2500);
  };

  const inputClasses = "w-full px-4 py-2.5 bg-white border border-[#0B1D2C]/30 rounded-full text-[#0B1D2C] text-sm font-bold focus:outline-none focus:border-[#0B1D2C] focus:ring-4 focus:ring-[#0B1D2C]/20 transition-all placeholder:text-[#0B1D2C]/70 shadow-xs";

  const getCategoryBadge = (category?: string) => {
    switch (category) {
      case 'traditional':
        return <span className="bg-[#0B1D2C] text-white font-bold text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">Traditional</span>;
      case 'fast_food':
        return <span className="bg-[#0B1D2C] text-white font-bold text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">Fast Food</span>;
      case 'breakfast':
        return <span className="bg-[#0B1D2C] text-white font-bold text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">Breakfast</span>;
      case 'special':
        return <span className="bg-[#0B1D2C] text-white font-bold text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">Special</span>;
      default:
        return <span className="bg-[#f7f5f0] text-[#0B1D2C] border border-[#0B1D2C]/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">Dish</span>;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 16 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.4 }}
      className="space-y-6 font-sans text-[#0B1D2C]"
    >
      
      {/* HEADER CARD */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#0B1D2C]/20 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="p-3.5 rounded-full bg-[#f7f5f0] text-[#0B1D2C] border border-[#0B1D2C]/20">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[#0B1D2C]">
              System Configuration & Food Menu
            </h2>
            <p className="text-sm font-medium text-neutral-600 mt-0.5">
              Set juice prices over time, manage your custom food menu & worker settings
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-[#0B1D2C]/20 shadow-xs p-5 sm:p-6 space-y-8 text-[#0B1D2C]">
        
        {/* JUICE PRICING SECTION */}
        <div className="space-y-4">
          <h3 className="text-lg font-extrabold text-[#0B1D2C] flex items-center space-x-2.5">
            <Sparkles className="w-5 h-5 text-[#0B1D2C]" />
            <span>Juice & Base Unit Pricing</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Juice Cup Price */}
            <div className="space-y-2 bg-[#f7f5f0] p-4 rounded-3xl border border-[#0B1D2C]/20 text-[#0B1D2C]">
              <label className="text-sm font-extrabold text-[#0B1D2C] flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <CupSoda className="w-5 h-5 text-[#0B1D2C]" />
                  <span>Juice Cup Unit Price (ETB)</span>
                </span>
                <span className="text-xs text-white font-bold bg-[#0B1D2C] font-extrabold px-3 py-0.5 rounded-full shadow-xs">
                  Editable anytime
                </span>
              </label>
              <input
                type="number"
                required
                min="1"
                step="0.01"
                value={juicePrice}
                onFocus={handleInputFocus}
                onChange={(e) => setJuicePrice(cleanNumberInput(e))}
                className={`${inputClasses} font-extrabold text-lg text-[#0B1D2C]`}
              />
              <p className="text-xs text-neutral-600 font-medium">
                Current rate: <strong className="text-[#0B1D2C]">{juicePrice} ETB</strong> per cup. Update this anytime as juice costs change to calculate revenues automatically.
              </p>
            </div>

            {/* Default Takeaway Box Base Price */}
            <div className="space-y-2 bg-[#f7f5f0] p-4 rounded-3xl border border-[#0B1D2C]/20 text-[#0B1D2C]">
              <label className="text-sm font-extrabold text-[#0B1D2C] flex items-center space-x-2">
                <UtensilsCrossed className="w-5 h-5 text-[#0B1D2C]" />
                <span>Takeaway Box Fallback Rate (ETB)</span>
              </label>
              <input
                type="number"
                required
                min="1"
                step="0.01"
                value={foodPrice}
                onFocus={handleInputFocus}
                onChange={(e) => setFoodPrice(cleanNumberInput(e))}
                className={inputClasses}
              />
              <p className="text-xs text-neutral-600 font-medium">
                Fallback container price used when specific menu item is not selected.
              </p>
            </div>
          </div>
        </div>

        {/* FOOD MENU MANAGER SECTION */}
        <div className="border-t border-[#0B1D2C]/15 pt-6 space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-extrabold text-[#0B1D2C] flex items-center space-x-2.5">
                <UtensilsCrossed className="w-5 h-5 text-[#0B1D2C]" />
                <span>Food Menu & Item Pricing</span>
              </h3>
              <p className="text-xs text-neutral-600 font-medium mt-1">
                Food items have custom prices. Shift reconciliation & ledgers will auto-calculate order totals using these prices.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleResetMenu}
                className="px-4 py-2 bg-white border-2 border-[#0B1D2C] hover:bg-slate-100 text-[#0B1D2C] font-extrabold text-xs rounded-full transition-colors flex items-center space-x-1.5 cursor-pointer shadow-xs"
                title="Reset menu to default Ethiopian dishes"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#0B1D2C]" />
                <span>Reset Defaults</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-4 py-2 bg-[#0B1D2C] hover:bg-[#081521] text-white font-black text-xs rounded-full shadow-md transition-colors flex items-center space-x-1.5 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4 text-white font-bold" />
                <span>Add Dish</span>
              </button>
            </div>
          </div>

          {/* ADD DISH FORM */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                className="overflow-hidden"
              >
                <div className="bg-[#f7f5f0] border border-[#0B1D2C]/20 rounded-3xl p-4 space-y-3 text-[#0B1D2C]">
                  <h4 className="text-sm font-extrabold text-[#0B1D2C] flex items-center space-x-2">
                    <Plus className="w-4 h-4 text-white font-bold" />
                    <span>Add New Food Menu Item</span>
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-neutral-600 mb-1">Dish Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Special Beyaynetu, Tibs"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        className={inputClasses}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-600 mb-1">Price (ETB)</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 250"
                        value={newItemPrice}
                        onFocus={handleInputFocus}
                        onChange={(e) => setNewItemPrice(cleanStringNumberInput(e))}
                        className={inputClasses}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-600 mb-1">Category</label>
                      <select
                        value={newItemCategory}
                        onChange={(e) => setNewItemCategory(e.target.value as any)}
                        className={inputClasses}
                      >
                        <option value="traditional">Traditional</option>
                        <option value="fast_food">Fast Food</option>
                        <option value="breakfast">Breakfast</option>
                        <option value="special">Special</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 bg-white border border-[#0B1D2C] text-[#0B1D2C] font-extrabold text-xs rounded-full hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddFoodItem}
                      className="px-5 py-2 bg-[#0B1D2C] hover:bg-[#081521] text-white font-bold text-xs font-extrabold rounded-full shadow-md cursor-pointer active:scale-95"
                    >
                      Save Menu Item
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* MENU ITEMS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {foodMenu.map((item) => (
              <div 
                key={item.id}
                className="bg-white border border-[#0B1D2C]/20 rounded-2xl p-3.5 flex items-center justify-between hover:shadow-md transition-all text-[#0B1D2C]"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-sm text-[#0B1D2C]">{item.name}</span>
                    {getCategoryBadge(item.category)}
                  </div>
                  <div className="text-xs text-[#0B1D2C] font-extrabold">
                    {item.price} {currencySymbol}
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => setEditingItem({ ...item })}
                    className="p-2 text-neutral-500 hover:text-[#0B1D2C] hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                    title="Edit Item"
                  >
                    <Pencil className="w-3.5 h-3.5 text-[#0B1D2C]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveFoodItem(item.id)}
                    className="p-2 text-neutral-500 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors cursor-pointer"
                    title="Delete Item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* WORKER & SHIFT NAMES */}
        <div className="border-t border-[#0B1D2C]/15 pt-6 space-y-5">
          <h3 className="text-lg font-extrabold text-[#0B1D2C] flex items-center space-x-2.5">
            <User className="w-5 h-5 text-[#0B1D2C]" />
            <span>Shift Workers & Registered Master Signatures</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-bold text-neutral-600 mb-2">
                Restaurant Name
              </label>
              <input
                type="text"
                required
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                className={inputClasses}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-neutral-600 mb-2">
                Day Shift Worker
              </label>
              <input
                type="text"
                required
                value={dayWorker}
                onChange={(e) => setDayWorker(e.target.value)}
                className={inputClasses}
              />

              <div className="mt-3 bg-[#f7f5f0] border border-[#0B1D2C]/20 p-3 rounded-2xl space-y-2 text-[#0B1D2C]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#0B1D2C] flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5 text-[#0B1D2C]" />
                    Day Worker Master Signature
                  </span>
                  {daySignatureUrl && (
                    <button
                      type="button"
                      onClick={() => clearMaster(setDaySignatureUrl)}
                      className="text-[10px] text-neutral-500 hover:text-rose-600 hover:underline cursor-pointer font-bold"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {daySignatureUrl ? (
                  <div className="bg-white p-2 rounded-xl border border-[#0B1D2C]/20 text-center shadow-xs">
                    <img src={daySignatureUrl} alt="Day Worker Master Signature" className="h-14 mx-auto object-contain bg-white rounded-lg p-1" />
                    <p className="text-[10px] text-[#0B1D2C] font-extrabold mt-1">✅ Master Signature Saved</p>
                    <button type="button" onClick={() => clearMaster(setDaySignatureUrl)} className="mt-1 text-[10px] text-neutral-500 hover:text-rose-600 hover:underline cursor-pointer font-bold">Clear & Re-draw</button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => openSigModal('day')}
                      className="w-full flex items-center justify-center gap-2 py-3 px-3 bg-white hover:bg-slate-100 border-2 border-dashed border-[#0B1D2C] rounded-full text-[#0B1D2C] text-sm font-extrabold cursor-pointer transition-colors shadow-xs"
                    >
                      <PenTool className="w-4 h-4 text-[#0B1D2C]" />
                      ✍️ Tap Here to Draw Signature
                    </button>

                    <label className="flex items-center justify-center gap-2 py-2 px-4 bg-white hover:bg-slate-100 text-neutral-600 text-xs font-bold rounded-full border border-[#0B1D2C]/20 cursor-pointer shadow-xs">
                      <Upload className="w-3.5 h-3.5 text-[#0B1D2C]" />
                      <span>Upload Image File Instead</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, setDaySignatureUrl)}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-neutral-600 mb-2">
                Night Shift Worker
              </label>
              <input
                type="text"
                required
                value={nightWorker}
                onChange={(e) => setNightWorker(e.target.value)}
                className={inputClasses}
              />

              <div className="mt-3 bg-[#f7f5f0] border border-[#0B1D2C]/20 p-3 rounded-2xl space-y-2 text-[#0B1D2C]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#0B1D2C] flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5 text-[#0B1D2C]" />
                    Night Worker Master Signature
                  </span>
                  {nightSignatureUrl && (
                    <button
                      type="button"
                      onClick={() => clearMaster(setNightSignatureUrl)}
                      className="text-[10px] text-neutral-500 hover:text-rose-600 hover:underline cursor-pointer font-bold"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {nightSignatureUrl ? (
                  <div className="bg-white p-2 rounded-xl border border-[#0B1D2C]/20 text-center shadow-xs">
                    <img src={nightSignatureUrl} alt="Night Worker Master Signature" className="h-14 mx-auto object-contain bg-white rounded-lg p-1" />
                    <p className="text-[10px] text-[#0B1D2C] font-extrabold mt-1">✅ Master Signature Saved</p>
                    <button type="button" onClick={() => clearMaster(setNightSignatureUrl)} className="mt-1 text-[10px] text-neutral-500 hover:text-rose-600 hover:underline cursor-pointer font-bold">Clear & Re-draw</button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => openSigModal('night')}
                      className="w-full flex items-center justify-center gap-2 py-3 px-3 bg-white hover:bg-slate-100 border-2 border-dashed border-[#0B1D2C] rounded-full text-[#0B1D2C] text-sm font-extrabold cursor-pointer transition-colors shadow-xs"
                    >
                      <PenTool className="w-4 h-4 text-[#0B1D2C]" />
                      ✍️ Tap Here to Draw Signature
                    </button>

                    <label className="flex items-center justify-center gap-2 py-2 px-4 bg-white hover:bg-slate-100 text-neutral-600 text-xs font-bold rounded-full border border-[#0B1D2C]/20 cursor-pointer shadow-xs">
                      <Upload className="w-3.5 h-3.5 text-[#0B1D2C]" />
                      <span>Upload Image File Instead</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, setNightSignatureUrl)}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* TABLET & SHIFT SECURITY PINS */}
        <div className="border-t border-[#0B1D2C]/15 pt-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-[#0B1D2C] flex items-center space-x-2.5">
              <Lock className="w-5 h-5 text-[#0B1D2C]" />
              <span>Tablet & Shift Security PINs (የይለፍ ቃሎች)</span>
            </h3>
            <span className="text-xs bg-[#f7f5f0] text-[#0B1D2C] font-bold px-3 py-1 rounded-full border border-[#0B1D2C]/20">
              Change Anytime
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Day Shift PIN */}
            <div className="bg-[#f7f5f0] p-4 rounded-3xl border border-[#0B1D2C]/20 space-y-2">
              <label className="text-sm font-extrabold text-[#0B1D2C] flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <KeyRound className="w-4 h-4 text-amber-600" />
                  <span>Day Shift PIN (የቀን ሸፍት ፒን)</span>
                </span>
                <span className="text-xs text-amber-700 bg-amber-100 font-black px-2.5 py-0.5 rounded-full">
                  Day Mode
                </span>
              </label>
              <input
                type="text"
                maxLength={6}
                value={dayShiftPin}
                onChange={(e) => setDayShiftPin(e.target.value.replace(/\D/g, ''))}
                placeholder="1111"
                className={`${inputClasses} font-mono font-black tracking-widest text-base text-center`}
              />
              <p className="text-xs text-neutral-600 font-medium">
                Used by the Day Shift worker to finalize & close their shift on the tablet.
              </p>
            </div>

            {/* Night Shift PIN */}
            <div className="bg-[#f7f5f0] p-4 rounded-3xl border border-[#0B1D2C]/20 space-y-2">
              <label className="text-sm font-extrabold text-[#0B1D2C] flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <KeyRound className="w-4 h-4 text-indigo-600" />
                  <span>Night Shift PIN (የሌሊት ሸፍት ፒን)</span>
                </span>
                <span className="text-xs text-indigo-700 bg-indigo-100 font-black px-2.5 py-0.5 rounded-full">
                  Night Mode
                </span>
              </label>
              <input
                type="text"
                maxLength={6}
                value={nightShiftPin}
                onChange={(e) => setNightShiftPin(e.target.value.replace(/\D/g, ''))}
                placeholder="2222"
                className={`${inputClasses} font-mono font-black tracking-widest text-base text-center`}
              />
              <p className="text-xs text-neutral-600 font-medium">
                Used by the Night Shift worker to finalize & close their shift on the tablet.
              </p>
            </div>
          </div>
        </div>

        {/* SAVE BUTTON */}
        <div className="border-t border-[#0B1D2C]/15 pt-6 flex justify-end">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="px-8 py-3 rounded-full text-white font-black bg-[#0B1D2C] hover:bg-[#081521] shadow-md transition-all flex items-center justify-center space-x-2 min-w-[170px] cursor-pointer"
          >
            <AnimatePresence mode="wait">
              {savedSuccess ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center space-x-2"
                >
                  <CheckCircle2 className="w-5 h-5 text-white font-bold" />
                  <span>Settings Saved!</span>
                </motion.div>
              ) : (
                <motion.div
                  key="save"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <span>Save Configuration</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

      </form>

      {/* EDIT MENU ITEM MODAL */}
      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 bg-[#0B1D2C]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0B1D2C] rounded-3xl shadow-2xl max-w-md w-full p-6 border border-[#0B1D2C]/50 space-y-4 text-white"
            >
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Pencil className="w-4 h-4 text-white" />
                <span>Edit Food Dish</span>
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Dish Name</label>
                  <input
                    type="text"
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Price (ETB)</label>
                  <input
                    type="number"
                    min="1"
                    value={editingItem.price}
                    onFocus={handleInputFocus}
                    onChange={(e) => setEditingItem({ ...editingItem, price: cleanNumberInput(e) })}
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Category</label>
                  <select
                    value={editingItem.category || 'traditional'}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value as any })}
                    className={inputClasses}
                  >
                    <option value="traditional">Traditional</option>
                    <option value="fast_food">Fast Food</option>
                    <option value="breakfast">Breakfast</option>
                    <option value="special">Special</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-[#0B1D2C]/30">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 bg-white border border-[#0B1D2C] text-[#0B1D2C] font-bold text-xs rounded-full hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateFoodItem(editingItem)}
                  className="px-5 py-2 bg-[#0B1D2C] hover:bg-[#081521] text-white font-black text-xs rounded-full shadow-md cursor-pointer"
                >
                  Update Dish
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Full-screen Signature Drawing Modal ──────────────────────────────── */}
      {sigModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-4 backdrop-blur-md"
          style={{ background: 'rgba(11, 29, 44, 0.95)' }}
        >
          <div className="w-full max-w-md flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-bold text-lg">
                  {sigModalTarget === 'day' ? '☀️ Day Worker' : '🌙 Night Worker'} Master Signature
                </p>
                <p className="text-neutral-300 text-xs mt-0.5">Sign clearly inside the white box below</p>
              </div>
              <button
                type="button"
                onClick={() => setSigModalOpen(false)}
                className="text-white/70 hover:text-white text-2xl font-bold leading-none cursor-pointer px-2"
              >
                ✕
              </button>
            </div>

            {/* Canvas */}
            <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border-4 border-[#0B1D2C] relative">
              <canvas
                ref={modalCanvasRef}
                width={560}
                height={260}
                onMouseDown={modalStart}
                onMouseMove={modalDraw}
                onMouseUp={modalStop}
                onMouseLeave={modalStop}
                onTouchStart={modalStart}
                onTouchMove={modalDraw}
                onTouchEnd={modalStop}
                onTouchCancel={modalStop}
                className="w-full bg-white cursor-crosshair block"
                style={{ touchAction: 'none' }}
              />
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[#0B1D2C]/70 text-sm font-medium select-none">
                ✍️ Sign here with your finger
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={clearModalCanvas}
                className="flex-1 py-3 rounded-full bg-white border border-[#0B1D2C] text-[#0B1D2C] text-sm font-bold cursor-pointer transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4 text-[#0B1D2C]" /> Clear
              </button>
              <button
                type="button"
                onClick={confirmModalSignature}
                className="flex-2 flex-grow-[2] py-3 rounded-full bg-[#0B1D2C] hover:bg-[#081521] text-white text-sm font-black cursor-pointer transition-colors flex items-center justify-center gap-2 shadow-md"
              >
                <CheckCircle2 className="w-4 h-4 text-white" /> Confirm & Save Signature
              </button>
            </div>

            <p className="text-center text-neutral-300 text-xs">
              After saving, click the main <strong className="text-[#0B1D2C]">Save Configuration</strong> button to store it permanently.
            </p>
          </div>
        </div>
      )}

    </motion.div>
  );
};

export default BudgetSettings;
