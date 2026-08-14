import React, { useState, useRef } from 'react';
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
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RestaurantSystemConfig, SystemSummaryStats, FoodMenuItem } from '../types';
import { DEFAULT_FOOD_MENU } from '../data/initialData';
import { cleanNumberInput, cleanStringNumberInput, handleInputFocus } from '../utils/shiftUtils';

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
  const [juicePrice, setJuicePrice] = useState(config.defaultJuiceUnitPrice || 170);
  const [foodPrice, setFoodPrice] = useState(config.defaultFoodUnitPrice || 220);
  const [dayWorker, setDayWorker] = useState(config.dayShiftWorkerName);
  const [nightWorker, setNightWorker] = useState(config.nightShiftWorkerName);
  const [daySignatureUrl, setDaySignatureUrl] = useState<string>(config.dayWorkerSignatureUrl || '');
  const [nightSignatureUrl, setNightSignatureUrl] = useState<string>(config.nightWorkerSignatureUrl || '');
  const [restaurantName, setRestaurantName] = useState(config.restaurantName);
  const [currencySymbol, setCurrencySymbol] = useState(config.currencySymbol);

  // Master Canvas Refs
  const dayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawingDay, setIsDrawingDay] = useState(false);

  const nightCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawingNight, setIsDrawingNight] = useState(false);

  const startDrawingMaster = (canvasRef: React.RefObject<HTMLCanvasElement | null>, setIsDrawing: (v: boolean) => void, e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
  };

  const drawMaster = (canvasRef: React.RefObject<HTMLCanvasElement | null>, isDrawing: boolean, e: any) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawingMaster = (canvasRef: React.RefObject<HTMLCanvasElement | null>, setIsDrawing: (v: boolean) => void, setUrl: (s: string) => void) => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setUrl(canvas.toDataURL('image/png'));
    }
  };

  const clearMaster = (canvasRef: React.RefObject<HTMLCanvasElement | null>, setUrl: (s: string) => void) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
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
      dayShiftWorkerName: dayWorker.trim() || 'Day Worker',
      nightShiftWorkerName: nightWorker.trim() || 'Night Worker',
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

  const inputClasses = "w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/40 transition-all shadow-sm";

  const getCategoryBadge = (category?: string) => {
    switch (category) {
      case 'traditional':
        return <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">Traditional</span>;
      case 'fast_food':
        return <span className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">Fast Food</span>;
      case 'breakfast':
        return <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">Breakfast</span>;
      case 'special':
        return <span className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">Special</span>;
      default:
        return <span className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">Dish</span>;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 16 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      
      {/* HEADER CARD */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="p-3.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-500 border border-blue-100 dark:border-blue-900">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              System Configuration & Food Menu
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Set juice prices over time, manage your custom food menu & worker settings
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-8">
        
        {/* JUICE PRICING SECTION */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center space-x-2.5">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <span>Juice & Base Unit Pricing</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Juice Cup Price */}
            <div className="space-y-2 bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/50">
              <label className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <CupSoda className="w-5 h-5 text-blue-500" />
                  <span>Juice Cup Unit Price (ETB)</span>
                </span>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-bold bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded">
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
                className={`${inputClasses} font-semibold text-lg text-blue-600 dark:text-blue-400`}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Current rate: <strong>{juicePrice} ETB</strong> per cup. Update this anytime as juice costs change to calculate revenues automatically.
              </p>
            </div>

            {/* Default Takeaway Box Base Price */}
            <div className="space-y-2 bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <label className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <UtensilsCrossed className="w-5 h-5 text-slate-500" />
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
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Fallback container price used when specific menu item is not selected.
              </p>
            </div>
          </div>
        </div>

        {/* FOOD MENU MANAGER SECTION */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center space-x-2.5">
                <UtensilsCrossed className="w-5 h-5 text-blue-500" />
                <span>Food Menu & Item Pricing</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Food items have custom prices. Shift reconciliation & ledgers will auto-calculate order totals using these prices.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleResetMenu}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 font-medium text-xs rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer"
                title="Reset menu to default Ethiopian dishes"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white font-medium text-xs rounded-lg shadow-sm transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
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
                <div className="bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                    <Plus className="w-4 h-4 text-blue-500" />
                    <span>Add New Food Menu Item</span>
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Dish Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Special Beyaynetu, Tibs"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        className={inputClasses}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Price (ETB)</label>
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
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Category</label>
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
                      className="px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddFoodItem}
                      className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-lg shadow-sm cursor-pointer"
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
                className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 flex items-center justify-between hover:border-blue-300 dark:hover:border-blue-800 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">{item.name}</span>
                    {getCategoryBadge(item.category)}
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-bold">
                    {item.price} {currencySymbol}
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => setEditingItem({ ...item })}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
                    title="Edit Item"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveFoodItem(item.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
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
        <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-5">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center space-x-2.5">
            <User className="w-5 h-5 text-blue-500" />
            <span>Shift Workers & Registered Master Signatures</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
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
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Day Shift Worker
              </label>
              <input
                type="text"
                required
                value={dayWorker}
                onChange={(e) => setDayWorker(e.target.value)}
                className={inputClasses}
              />

              <div className="mt-3 bg-slate-900/90 border border-slate-800 p-3 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5 text-blue-400" />
                    Day Worker Master Signature
                  </span>
                  {daySignatureUrl && (
                    <button
                      type="button"
                      onClick={() => clearMaster(dayCanvasRef, setDaySignatureUrl)}
                      className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {daySignatureUrl ? (
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 text-center">
                    <img src={daySignatureUrl} alt="Day Worker Master Signature" className="h-14 mx-auto object-contain bg-white rounded-lg p-1" />
                    <p className="text-[10px] text-emerald-400 font-bold mt-1">✅ Master Signature Saved</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="bg-slate-950 rounded-xl p-1 border border-slate-800 relative">
                      <canvas
                        ref={dayCanvasRef}
                        width={260}
                        height={90}
                        onMouseDown={(e) => startDrawingMaster(dayCanvasRef, setIsDrawingDay, e)}
                        onMouseMove={(e) => drawMaster(dayCanvasRef, isDrawingDay, e)}
                        onMouseUp={() => stopDrawingMaster(dayCanvasRef, setIsDrawingDay, setDaySignatureUrl)}
                        onMouseLeave={() => stopDrawingMaster(dayCanvasRef, setIsDrawingDay, setDaySignatureUrl)}
                        onTouchStart={(e) => startDrawingMaster(dayCanvasRef, setIsDrawingDay, e)}
                        onTouchMove={(e) => drawMaster(dayCanvasRef, isDrawingDay, e)}
                        onTouchEnd={() => stopDrawingMaster(dayCanvasRef, setIsDrawingDay, setDaySignatureUrl)}
                        className="w-full h-20 touch-none bg-slate-950 rounded-lg cursor-crosshair"
                      />
                      <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-slate-600 text-[11px]">
                        ✍️ Draw Day Worker Signature Here
                      </span>
                    </div>

                    <label className="flex items-center justify-center gap-2 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Image File</span>
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
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Night Shift Worker
              </label>
              <input
                type="text"
                required
                value={nightWorker}
                onChange={(e) => setNightWorker(e.target.value)}
                className={inputClasses}
              />

              <div className="mt-3 bg-slate-900/90 border border-slate-800 p-3 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5 text-indigo-400" />
                    Night Worker Master Signature
                  </span>
                  {nightSignatureUrl && (
                    <button
                      type="button"
                      onClick={() => clearMaster(nightCanvasRef, setNightSignatureUrl)}
                      className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {nightSignatureUrl ? (
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 text-center">
                    <img src={nightSignatureUrl} alt="Night Worker Master Signature" className="h-14 mx-auto object-contain bg-white rounded-lg p-1" />
                    <p className="text-[10px] text-emerald-400 font-bold mt-1">✅ Master Signature Saved</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="bg-slate-950 rounded-xl p-1 border border-slate-800 relative">
                      <canvas
                        ref={nightCanvasRef}
                        width={260}
                        height={90}
                        onMouseDown={(e) => startDrawingMaster(nightCanvasRef, setIsDrawingNight, e)}
                        onMouseMove={(e) => drawMaster(nightCanvasRef, isDrawingNight, e)}
                        onMouseUp={() => stopDrawingMaster(nightCanvasRef, setIsDrawingNight, setNightSignatureUrl)}
                        onMouseLeave={() => stopDrawingMaster(nightCanvasRef, setIsDrawingNight, setNightSignatureUrl)}
                        onTouchStart={(e) => startDrawingMaster(nightCanvasRef, setIsDrawingNight, e)}
                        onTouchMove={(e) => drawMaster(nightCanvasRef, isDrawingNight, e)}
                        onTouchEnd={() => stopDrawingMaster(nightCanvasRef, setIsDrawingNight, setNightSignatureUrl)}
                        className="w-full h-20 touch-none bg-slate-950 rounded-lg cursor-crosshair"
                      />
                      <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-slate-600 text-[11px]">
                        ✍️ Draw Night Worker Signature Here
                      </span>
                    </div>

                    <label className="flex items-center justify-center gap-2 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Image File</span>
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

        {/* SAVE BUTTON */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-6 flex justify-end">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className={`px-6 py-3 rounded-xl text-white font-semibold shadow-md transition-all flex items-center justify-center space-x-2 min-w-[170px] cursor-pointer ${
              savedSuccess 
                ? 'bg-emerald-500 hover:bg-emerald-600' 
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
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
                  <CheckCircle2 className="w-5 h-5" />
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
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4"
            >
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <Pencil className="w-4 h-4 text-blue-500" />
                <span>Edit Food Dish</span>
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Dish Name</label>
                  <input
                    type="text"
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Price (ETB)</label>
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
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Category</label>
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

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateFoodItem(editingItem)}
                  className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-lg shadow-sm cursor-pointer"
                >
                  Update Dish
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default BudgetSettings;
