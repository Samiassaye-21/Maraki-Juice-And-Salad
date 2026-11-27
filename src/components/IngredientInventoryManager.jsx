import React, { useState, useMemo, useEffect } from 'react';
import {
  Boxes,
  Plus,
  ShoppingCart,
  AlertTriangle,
  SlidersHorizontal,
  BookOpen,
  History,
  Trash2,
  Pencil,
  CheckCircle2,
  X,
  Save,
  ChevronDown,
  ChevronUp,
  Search,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  RotateCcw
} from 'lucide-react';
import {
  PURCHASE_UNITS,
  RECIPE_UNITS,
  TRANSACTION_TYPES,
  DEFAULT_INGREDIENTS,
  DEFAULT_RECIPES,
  loadIngredients,
  saveIngredients,
  loadRecipes,
  saveRecipes,
  loadIngredientTxns,
  saveIngredientTxns,
  computeIngredientInventorySummary,
  roundQty
} from '../utils/ingredientInventoryEngine';
import { toLocalIsoDate } from '../utils/reconciliationHelpers';
import { dbService } from '../lib/supabaseClient';

export default function IngredientInventoryManager({
  foodMenu = [],
  orders = []
}) {
  const [sectionView, setSectionView] = useState('dashboard'); // 'dashboard' | 'movements' | 'ingredients' | 'recipes' | 'history'
  const [ingredients, setIngredients] = useState(() => loadIngredients());
  const [recipes, setRecipes] = useState(() => loadRecipes());
  const [transactions, setTransactions] = useState(() => loadIngredientTxns());
  const [expandedIngId, setExpandedIngId] = useState(null);
  const [notice, setNotice] = useState('');

  // Keep synced with Chef POS orders / Supabase sync / external updates
  useEffect(() => {
    const syncLocal = () => {
      setIngredients(loadIngredients());
      setRecipes(loadRecipes());
      setTransactions(loadIngredientTxns());
    };
    window.addEventListener('maraki-supabase-synced', syncLocal);
    window.addEventListener('maraki-ingredients-updated', syncLocal);
    window.addEventListener('storage', syncLocal);
    return () => {
      window.removeEventListener('maraki-supabase-synced', syncLocal);
      window.removeEventListener('maraki-ingredients-updated', syncLocal);
      window.removeEventListener('storage', syncLocal);
    };
  }, []);

  const showNotice = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3500);
  };

  const todayIso = toLocalIsoDate(new Date());

  const summary = useMemo(
    () =>
      computeIngredientInventorySummary({
        ingredients,
        recipes,
        orders,
        transactions,
        menuItems: foodMenu,
        todayIso
      }),
    [ingredients, recipes, orders, transactions, foodMenu, todayIso]
  );

  // --- PURCHASE FORM STATE ---
  const [purIngId, setPurIngId] = useState(() => (ingredients[0]?.id || ''));
  const [purQty, setPurQty] = useState('');
  const [purCost, setPurCost] = useState('');
  const [purSupplier, setPurSupplier] = useState('');
  const [purDate, setPurDate] = useState(todayIso);
  const [purStaff, setPurStaff] = useState('Owner / Admin');
  const [purNote, setPurNote] = useState('');
  const [purLogFinance, setPurLogFinance] = useState(true);

  // --- WASTE / ADJUSTMENT / RETURN FORM STATE ---
  const [adjType, setAdjType] = useState('waste');
  const [adjIngId, setAdjIngId] = useState(() => (ingredients[0]?.id || ''));
  const [adjQty, setAdjQty] = useState('');
  const [adjDate, setAdjDate] = useState(todayIso);
  const [adjStaff, setAdjStaff] = useState('Staff / Admin');
  const [adjNote, setAdjNote] = useState('');

  // Keep default dropdown selections valid when ingredients change
  useEffect(() => {
    if (ingredients.length > 0) {
      if (!ingredients.some(i => i.id === purIngId)) setPurIngId(ingredients[0].id);
      if (!ingredients.some(i => i.id === adjIngId)) setAdjIngId(ingredients[0].id);
    }
  }, [ingredients]);

  // --- INGREDIENT CRUD MODAL STATE ---
  const [ingModal, setIngModal] = useState(null); // null or editable ingredient object

  // --- RECIPE / BOM EDITOR STATE ---
  const [selectedProductId, setSelectedProductId] = useState(() => foodMenu[0]?.id || recipes[0]?.productId || '');
  const [recipeSearch, setRecipeSearch] = useState('');
  const [newBomIngId, setNewBomIngId] = useState(() => ingredients[0]?.id || '');
  const [newBomQty, setNewBomQty] = useState('');

  // --- HISTORY FILTERS ---
  const [histTypeFilter, setHistTypeFilter] = useState('all');
  const [histIngFilter, setHistIngFilter] = useState('all');
  const [histSearch, setHistSearch] = useState('');

  const handleRecordPurchase = (e) => {
    e.preventDefault();
    const ing = ingredients.find(i => i.id === purIngId);
    const qty = Number(purQty);
    if (!ing || !qty || qty <= 0) return;
    const cost = Math.max(0, Number(purCost) || 0);

    const tx = {
      id: `tx-pur-${Date.now()}`,
      type: 'purchase',
      ingredientId: ing.id,
      ingredientName: ing.englishName || ing.name,
      qty: roundQty(qty, 3),
      signedQty: roundQty(qty, 3),
      unit: ing.purchaseUnit,
      cost,
      supplier: purSupplier.trim() || 'Direct Supplier',
      staffName: purStaff.trim() || 'Admin',
      date: purDate || todayIso,
      reason: 'Purchase (+ Stock)',
      note: purNote.trim(),
      createdAt: new Date().toISOString()
    };
    const nextTxns = saveIngredientTxns([tx, ...transactions]);
    setTransactions(nextTxns);

    if (purLogFinance && cost > 0) {
      try {
        const existingExp = JSON.parse(localStorage.getItem('maraki_actual_expenses') || '[]');
        const finEntry = {
          id: `exp-ing-${Date.now()}`,
          title: `Stock Purchase: ${ing.englishName || ing.name} (${qty} ${ing.purchaseUnit})`,
          category: 'Ingredients',
          amount: cost,
          date: purDate || todayIso,
          paymentMethod: 'Cash',
          linkedPlan: 'Ingredient Inventory'
        };
        const updatedExp = [finEntry, ...existingExp];
        localStorage.setItem('maraki_actual_expenses', JSON.stringify(updatedExp));
        dbService.saveAppState('maraki_actual_expenses', updatedExp);
        dbService.saveExpense({ ...finEntry, type: 'bulk_raw_material' });
      } catch (err) {}
    }

    setPurQty('');
    setPurCost('');
    setPurNote('');
    showNotice(`Purchased +${qty} ${ing.purchaseUnit} of ${ing.englishName || ing.name}`);
  };

  const handleRecordAdjustment = (e) => {
    e.preventDefault();
    const ing = ingredients.find(i => i.id === adjIngId);
    const qty = Number(adjQty);
    if (!ing || !qty || qty <= 0) return;
    const meta = TRANSACTION_TYPES.find(t => t.id === adjType) || TRANSACTION_TYPES[4];

    const tx = {
      id: `tx-adj-${Date.now()}`,
      type: meta.id,
      ingredientId: ing.id,
      ingredientName: ing.englishName || ing.name,
      qty: roundQty(qty, 3),
      signedQty: meta.sign * roundQty(qty, 3),
      unit: ing.purchaseUnit,
      cost: 0,
      supplier: '',
      staffName: adjStaff.trim() || 'Staff',
      date: adjDate || todayIso,
      reason: meta.label,
      note: adjNote.trim(),
      createdAt: new Date().toISOString()
    };
    const nextTxns = saveIngredientTxns([tx, ...transactions]);
    setTransactions(nextTxns);
    setAdjQty('');
    setAdjNote('');
    showNotice(`${meta.label}: ${meta.sign > 0 ? '+' : '−'}${qty} ${ing.purchaseUnit} (${ing.englishName || ing.name})`);
  };

  const handleDeleteTransaction = (txId) => {
    if (!window.confirm('Delete this movement record? Stock levels will recalculate automatically.')) return;
    const nextTxns = saveIngredientTxns(transactions.filter(t => t.id !== txId));
    setTransactions(nextTxns);
    showNotice('Movement record deleted');
  };

  const openNewIngredientModal = () => {
    setIngModal({
      isNew: true,
      id: `ing-${Date.now()}`,
      name: '',
      englishName: '',
      emoji: '🥗',
      category: 'Dry Goods',
      purchaseUnit: 'kg',
      recipeUnit: 'g',
      recipeUnitsPerPurchaseUnit: 1000,
      initialStock: 0,
      minStockLevel: 5,
      reorderLevel: 2,
      targetStockLevel: 15,
      conversionNote: ''
    });
  };

  const handleSaveIngredientModal = (e) => {
    e.preventDefault();
    if (!ingModal) return;
    const english = (ingModal.englishName || ingModal.name || '').trim();
    if (!english) return;

    const cleanObj = {
      id: ingModal.id,
      name: (ingModal.name || english).trim(),
      englishName: english,
      emoji: ingModal.emoji || '📦',
      category: ingModal.category || 'General',
      purchaseUnit: ingModal.purchaseUnit || 'kg',
      recipeUnit: ingModal.recipeUnit || 'g',
      recipeUnitsPerPurchaseUnit: Math.max(0.0001, Number(ingModal.recipeUnitsPerPurchaseUnit) || 1),
      initialStock: Math.max(0, Number(ingModal.initialStock) || 0),
      minStockLevel: Math.max(0, Number(ingModal.minStockLevel) || 0),
      reorderLevel: Math.max(0, Number(ingModal.reorderLevel) || 0),
      targetStockLevel: Math.max(0, Number(ingModal.targetStockLevel) || 0),
      conversionNote:
        ingModal.conversionNote?.trim() ||
        `1 ${ingModal.purchaseUnit} = ${Number(ingModal.recipeUnitsPerPurchaseUnit) || 1} ${ingModal.recipeUnit}`
    };

    const exists = ingredients.some(i => i.id === cleanObj.id);
    const nextList = exists
      ? ingredients.map(i => (i.id === cleanObj.id ? cleanObj : i))
      : [...ingredients, cleanObj];
    setIngredients(saveIngredients(nextList));
    setIngModal(null);
    showNotice(`Saved ingredient "${cleanObj.englishName}"`);
  };

  const handleDeleteIngredient = (ing) => {
    if (!window.confirm(`Delete "${ing.englishName || ing.name}" and remove it from linked recipes?`)) return;
    setIngredients(saveIngredients(ingredients.filter(i => i.id !== ing.id)));
    setRecipes(
      saveRecipes(
        recipes.map(r => ({
          ...r,
          ingredients: (r.ingredients || []).filter(line => line.ingredientId !== ing.id)
        }))
      )
    );
    showNotice(`Deleted ingredient "${ing.englishName || ing.name}"`);
  };

  // --- RECIPE / BOM HELPERS ---
  const activeMenuProduct = useMemo(() => {
    return foodMenu.find(m => m.id === selectedProductId) || null;
  }, [foodMenu, selectedProductId]);

  const activeRecipe = useMemo(() => {
    const found = recipes.find(r => r.productId === selectedProductId);
    if (found) return found;
    return {
      productId: selectedProductId,
      productName: activeMenuProduct?.englishName || activeMenuProduct?.name || selectedProductId,
      yieldUnit: activeMenuProduct?.containerType === 'cup' ? 'cup' : 'order',
      ingredients: []
    };
  }, [recipes, selectedProductId, activeMenuProduct]);

  const upsertProductRecipe = (nextRecipe) => {
    const exists = recipes.some(r => r.productId === nextRecipe.productId);
    const nextList = exists
      ? recipes.map(r => (r.productId === nextRecipe.productId ? nextRecipe : r))
      : [...recipes, nextRecipe];
    setRecipes(saveRecipes(nextList));
  };

  const handleAddIngredientToBom = (e) => {
    e.preventDefault();
    if (!selectedProductId || !newBomIngId) return;
    const qty = Number(newBomQty);
    if (!qty || qty <= 0) return;

    const existingLines = activeRecipe.ingredients || [];
    const hasLine = existingLines.some(l => l.ingredientId === newBomIngId);
    const updatedLines = hasLine
      ? existingLines.map(l => (l.ingredientId === newBomIngId ? { ...l, qtyPerUnit: qty } : l))
      : [...existingLines, { ingredientId: newBomIngId, qtyPerUnit: qty }];

    upsertProductRecipe({ ...activeRecipe, ingredients: updatedLines });
    setNewBomQty('');
    showNotice(`Updated recipe for ${activeRecipe.productName}`);
  };

  const handleUpdateBomLineQty = (ingredientId, nextQty) => {
    const val = Number(nextQty);
    if (isNaN(val) || val < 0) return;
    upsertProductRecipe({
      ...activeRecipe,
      ingredients: (activeRecipe.ingredients || []).map(l =>
        l.ingredientId === ingredientId ? { ...l, qtyPerUnit: val } : l
      )
    });
  };

  const handleRemoveBomLine = (ingredientId) => {
    upsertProductRecipe({
      ...activeRecipe,
      ingredients: (activeRecipe.ingredients || []).filter(l => l.ingredientId !== ingredientId)
    });
  };

  const handleRestoreDefaults = () => {
    if (!window.confirm('Restore default starter ingredients & recipes (Rice, Avocado, Papaya, Sprice, Chofan, etc.)? Your transaction history is kept.')) return;
    setIngredients(saveIngredients(DEFAULT_INGREDIENTS));
    setRecipes(saveRecipes(DEFAULT_RECIPES));
    showNotice('Restored default starter ingredients & recipes');
  };

  const statusBadge = (status) => {
    if (status === 'purchase_required') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
          🔴 Purchase Required
        </span>
      );
    }
    if (status === 'running_low') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
          🟡 Running Low — Purchase Soon
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
        🟢 In Stock
      </span>
    );
  };

  const filteredMenuProducts = useMemo(() => {
    const q = recipeSearch.toLowerCase().trim();
    return foodMenu.filter(m => {
      if (!q) return true;
      return (
        (m.name || '').toLowerCase().includes(q) ||
        (m.englishName || '').toLowerCase().includes(q) ||
        (m.category || '').toLowerCase().includes(q)
      );
    });
  }, [foodMenu, recipeSearch]);

  const filteredHistory = useMemo(() => {
    return transactions.filter(t => {
      if (histTypeFilter !== 'all') {
        if (histTypeFilter === 'waste_group') {
          if (!['waste', 'spoilage', 'damaged', 'incorrect_prep'].includes(t.type)) return false;
        } else if (histTypeFilter === 'orders_group') {
          if (!['order_sale', 'order_reversal'].includes(t.type)) return false;
        } else if (histTypeFilter === 'adj_group') {
          if (!['return_stock', 'adjustment_add', 'adjustment_sub'].includes(t.type)) return false;
        } else if (t.type !== histTypeFilter) {
          return false;
        }
      }
      if (histIngFilter !== 'all' && t.ingredientId !== histIngFilter) return false;
      if (histSearch.trim()) {
        const q = histSearch.toLowerCase().trim();
        return (
          (t.ingredientName || '').toLowerCase().includes(q) ||
          (t.note || '').toLowerCase().includes(q) ||
          (t.supplier || '').toLowerCase().includes(q) ||
          (t.reason || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [transactions, histTypeFilter, histIngFilter, histSearch]);

  return (
    <div className="space-y-5 text-slate-800 antialiased font-sans">
      {/* HEADER BAR + SUB-NAVIGATION INSIDE SINGLE PAGE */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              General Ingredient & Stock Management
            </h1>
            <p className="text-xs text-slate-500 font-bold mt-0.5">
              Reusable BOM Recipes, Yield Conversions, Auto-Deduction on Orders, Reversals & Purchase Alerts
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Boxes, badge: summary.totals.alertsCount || null },
            { id: 'movements', label: 'Purchase / Waste / Adj', icon: ShoppingCart },
            { id: 'recipes', label: 'Product Recipes (BOM)', icon: BookOpen, badge: recipes.filter(r => r.ingredients?.length > 0).length },
            { id: 'ingredients', label: 'Ingredients & Units', icon: SlidersHorizontal, badge: ingredients.length },
            { id: 'history', label: 'Movement History', icon: History, badge: transactions.length }
          ].map(tab => {
            const Icon = tab.icon;
            const active = sectionView === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSectionView(tab.id)}
                className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                  active
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge !== null && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                      active ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {notice && (
        <div className="bg-emerald-900 text-white px-4 py-3 rounded-2xl text-xs font-black flex items-center gap-2 shadow-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notice}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 1: INVENTORY DASHBOARD                                    */}
      {/* ============================================================== */}
      {sectionView === 'dashboard' && (
        <div className="space-y-5">
          {/* 7 EXECUTIVE INVENTORY KPI CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-black uppercase text-slate-400 block">Total Ingredients</span>
              <p className="text-2xl font-black text-slate-900 mt-1 tabular-nums">{summary.totals.totalIngredients}</p>
            </div>
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 shadow-xs">
              <span className="text-[10px] font-black uppercase text-amber-800 block">Low Stock</span>
              <p className="text-2xl font-black text-amber-900 mt-1 tabular-nums">{summary.totals.lowStockCount}</p>
            </div>
            <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 shadow-xs">
              <span className="text-[10px] font-black uppercase text-rose-700 block">Out of Stock</span>
              <p className="text-2xl font-black text-rose-800 mt-1 tabular-nums">{summary.totals.outOfStockCount}</p>
            </div>
            <div className="bg-rose-50 p-4 rounded-2xl border border-rose-300 shadow-xs">
              <span className="text-[10px] font-black uppercase text-rose-800 block">Purchase Required</span>
              <p className="text-2xl font-black text-rose-900 mt-1 tabular-nums">{summary.totals.purchaseRequiredCount}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-black uppercase text-slate-400 block">Today's Consumption</span>
              <p className="text-2xl font-black text-emerald-700 mt-1 tabular-nums">{summary.totals.todayConsumptionItems} <span className="text-[11px] font-bold text-slate-400">items</span></p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-black uppercase text-slate-400 block">Today's Waste</span>
              <p className="text-2xl font-black text-rose-600 mt-1 tabular-nums">{summary.totals.todayWasteItems} <span className="text-[11px] font-bold text-slate-400">items</span></p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 shadow-xs">
              <span className="text-[10px] font-black uppercase text-emerald-800 block">Today's Purchases</span>
              <p className="text-2xl font-black text-emerald-900 mt-1 tabular-nums">{summary.totals.todayPurchasesCount}</p>
              <span className="text-[10px] font-bold text-emerald-700">{summary.totals.todayPurchaseSpend.toLocaleString()} ETB</span>
            </div>
          </div>

          {/* LIVE PURCHASE ALERTS (BASED ON STOCK + RECIPE CONSUMPTION) */}
          {summary.alerts.length > 0 && (
            <div className="bg-white rounded-3xl border-2 border-rose-300 p-5 space-y-3 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-black text-rose-950 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Live Purchase & Capacity Warnings ({summary.alerts.length})</span>
                </h2>
                <button
                  type="button"
                  onClick={() => setSectionView('movements')}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black"
                >
                  Open Purchase Entry →
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {summary.alerts.map(item => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-2 text-xs ${
                      item.status === 'purchase_required'
                        ? 'bg-rose-50 border-rose-300 text-rose-950'
                        : 'bg-amber-50 border-amber-300 text-amber-950'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="font-black">{item.alertMessage}</p>
                      <span className="text-[10px] font-bold opacity-80">
                        Suggested Purchase: +{item.suggestedPurchaseQty} {item.purchaseUnit} (Reorder ≤ {item.reorderLevel} {item.purchaseUnit})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPurIngId(item.id);
                        setPurQty(String(item.suggestedPurchaseQty));
                        setSectionView('movements');
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-black whitespace-nowrap shrink-0"
                    >
                      + Buy {item.suggestedPurchaseQty} {item.purchaseUnit}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LIVE INGREDIENT STOCK TABLE */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900">
                  Live Ingredient Inventory & Estimated Capacity
                </h2>
                <p className="text-[11px] text-slate-500 font-bold">
                  Click any ingredient row to inspect Initial Stock, Purchases, Sales Consumption, Waste, Adjustments & Suggested Reorder
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSectionView('movements')}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Record Purchase / Waste</span>
                </button>
                <button
                  type="button"
                  onClick={openNewIngredientModal}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black border border-slate-200"
                >
                  + New Ingredient
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-black border-b border-slate-200">
                    <th className="py-3 px-3">Ingredient</th>
                    <th className="py-3 px-3 text-right">Stock</th>
                    <th className="py-3 px-3">Unit</th>
                    <th className="py-3 px-3 text-right">Used Today</th>
                    <th className="py-3 px-3 text-right">Capacity</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summary.ingredientStatuses.map(ing => {
                    const isExpanded = expandedIngId === ing.id;
                    const capStr = ing.primaryCapacity
                      ? `${ing.primaryCapacity.estimatedServings} ${ing.primaryCapacity.yieldUnit}${ing.primaryCapacity.estimatedServings === 1 ? '' : 's'}`
                      : `${ing.availableRecipeUnits.toLocaleString()} ${ing.recipeUnit}`;
                    return (
                      <React.Fragment key={ing.id}>
                        <tr
                          onClick={() => setExpandedIngId(isExpanded ? null : ing.id)}
                          className="cursor-pointer hover:bg-slate-50/90 transition-colors"
                        >
                          <td className="py-3 px-3 font-black text-slate-900">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{ing.emoji || '📦'}</span>
                              <div>
                                <span className="block">{ing.displayName}</span>
                                <span className="text-[10px] text-slate-400 font-bold">{ing.conversionNote || `1 ${ing.purchaseUnit} = ${ing.recipeUnitsPerPurchaseUnit} ${ing.recipeUnit}`}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right font-black text-slate-900 tabular-nums">
                            {ing.remainingStock}
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-600">{ing.purchaseUnit}</td>
                          <td className="py-3 px-3 text-right font-black text-emerald-700 tabular-nums">
                            {ing.usedTodayQty > 0 ? `${ing.usedTodayQty} ${ing.purchaseUnit}` : `0 ${ing.purchaseUnit}`}
                          </td>
                          <td className="py-3 px-3 text-right font-black text-slate-800 tabular-nums">{capStr}</td>
                          <td className="py-3 px-3">{statusBadge(ing.status)}</td>
                          <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setPurIngId(ing.id);
                                  if (ing.suggestedPurchaseQty > 0) setPurQty(String(ing.suggestedPurchaseQty));
                                  setSectionView('movements');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-black"
                              >
                                + Buy
                              </button>
                              <button
                                type="button"
                                onClick={() => setExpandedIngId(isExpanded ? null : ing.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                              >
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-slate-50/70">
                            <td colSpan={7} className="p-4">
                              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 text-[11px]">
                                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                                  <span className="text-slate-400 font-bold block">Initial Stock</span>
                                  <strong className="font-black text-slate-900">{ing.initialStock} {ing.purchaseUnit}</strong>
                                </div>
                                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                                  <span className="text-slate-400 font-bold block">Total Purchased</span>
                                  <strong className="font-black text-emerald-700">+{ing.purchasedQty} {ing.purchaseUnit}</strong>
                                </div>
                                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                                  <span className="text-slate-400 font-bold block">Used in Sales</span>
                                  <strong className="font-black text-slate-900">−{ing.usedQty} {ing.purchaseUnit}</strong>
                                </div>
                                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                                  <span className="text-slate-400 font-bold block">Wasted / Damaged</span>
                                  <strong className="font-black text-rose-600">−{ing.wastedQty} {ing.purchaseUnit}</strong>
                                </div>
                                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                                  <span className="text-slate-400 font-bold block">Adjustments / Returns</span>
                                  <strong className="font-black text-slate-900">{ing.adjustmentQty >= 0 ? `+${ing.adjustmentQty}` : ing.adjustmentQty} {ing.purchaseUnit}</strong>
                                </div>
                                <div className="bg-white p-2.5 rounded-xl border border-emerald-200">
                                  <span className="text-emerald-700 font-bold block">Min / Reorder / Sugg. Buy</span>
                                  <strong className="font-black text-slate-900">
                                    {ing.minStockLevel} / {ing.reorderLevel} / +{ing.suggestedPurchaseQty} {ing.purchaseUnit}
                                  </strong>
                                </div>
                              </div>
                              {ing.capacityPerProduct.length > 0 && (
                                <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                                  <span className="font-black text-slate-600 mr-1">Estimated Servings Left:</span>
                                  {ing.capacityPerProduct.map(cp => (
                                    <span key={cp.productId} className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-bold text-slate-700">
                                      {cp.productName}: <strong>{cp.estimatedServings} {cp.yieldUnit}s</strong> ({cp.qtyPerUnit} {ing.recipeUnit})
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* MIXED & SINGLE PRODUCT CAPACITY GRID (LIMITING INGREDIENT ENGINE) */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900">
                  Product Serving Capacity (Mixed & Single Recipes — Limiting Ingredient)
                </h2>
                <p className="text-[11px] text-slate-500 font-bold">
                  Mixed products like Sprice automatically calculate capacity from the lowest available ingredient (e.g. Avocado 20 vs Papaya 12 → Capacity 12)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSectionView('recipes')}
                className="text-xs font-black text-emerald-700 hover:underline"
              >
                Configure Product Recipes →
              </button>
            </div>

            {summary.productCapacities.length === 0 ? (
              <p className="text-xs text-slate-400 font-bold py-4 text-center">No product recipes configured yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {summary.productCapacities.map(pc => (
                  <div
                    key={pc.productId}
                    className={`p-4 rounded-2xl border space-y-2 ${
                      pc.estimatedCapacity <= 0
                        ? 'bg-rose-50 border-rose-300'
                        : pc.estimatedCapacity <= 10
                          ? 'bg-amber-50/70 border-amber-300'
                          : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-black text-xs text-slate-900 block">{pc.productName}</span>
                        {pc.isMixedProduct && (
                          <span className="text-[10px] font-black text-amber-800">
                            Limiting: {pc.limitingIngredient.ingredientName}
                          </span>
                        )}
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-xl text-xs font-black tabular-nums ${
                          pc.estimatedCapacity <= 0
                            ? 'bg-rose-600 text-white'
                            : pc.estimatedCapacity <= 10
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-emerald-600 text-white'
                        }`}
                      >
                        {pc.estimatedCapacity} {pc.yieldUnit}s
                      </span>
                    </div>
                    <div className="space-y-1 pt-1 border-t border-black/5">
                      {pc.ingredientsBreakdown.map(b => (
                        <div key={b.ingredientId} className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                          <span>
                            {b.emoji} {b.ingredientName} ({b.qtyPerUnit} {b.recipeUnit}/{pc.yieldUnit})
                          </span>
                          <span className={b.ingredientId === pc.limitingIngredient.ingredientId ? 'text-rose-700 font-black' : ''}>
                            {b.possibleServings} possible
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 2: PURCHASE, WASTE, SPOILAGE, RETURNS & ADJUSTMENTS       */}
      {/* ============================================================== */}
      {sectionView === 'movements' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* PANEL 1: RECORD PURCHASE */}
          <form onSubmit={handleRecordPurchase} className="bg-white p-5 rounded-3xl border border-emerald-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-emerald-600" />
                  <span>Record Ingredient Purchase (+ Increase Stock)</span>
                </h2>
                <p className="text-[11px] text-slate-400 font-bold">Supports kg, liter, piece, bottle, packet & all configured units</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-black text-slate-700 block mb-1">Ingredient *</label>
                <select
                  value={purIngId}
                  onChange={(e) => setPurIngId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black"
                >
                  {ingredients.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.emoji} {i.englishName || i.name} ({i.purchaseUnit})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-black text-slate-700 block mb-1">
                  Quantity ({ingredients.find(i => i.id === purIngId)?.purchaseUnit || 'unit'}) *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  value={purQty}
                  onChange={(e) => setPurQty(e.target.value)}
                  placeholder="e.g. 10"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black"
                />
              </div>

              <div>
                <label className="text-[11px] font-black text-slate-700 block mb-1">Total Cost (ETB)</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={purCost}
                  onChange={(e) => setPurCost(e.target.value)}
                  placeholder="e.g. 1200"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black"
                />
              </div>
              <div>
                <label className="text-[11px] font-black text-slate-700 block mb-1">Supplier</label>
                <input
                  type="text"
                  value={purSupplier}
                  onChange={(e) => setPurSupplier(e.target.value)}
                  placeholder="e.g. Atkilt Tera / Merkato"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-black text-slate-700 block mb-1">Date</label>
                <input
                  type="date"
                  value={purDate}
                  onChange={(e) => setPurDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] font-black text-slate-700 block mb-1">Employee / Admin</label>
                <input
                  type="text"
                  value={purStaff}
                  onChange={(e) => setPurStaff(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-black text-slate-700 block mb-1">Optional Note</label>
              <input
                type="text"
                value={purNote}
                onChange={(e) => setPurNote(e.target.value)}
                placeholder="Batch quality, invoice #, or storage notes..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
              />
            </div>

            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={purLogFinance}
                onChange={(e) => setPurLogFinance(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600"
              />
              <span>Also log this purchase cost inside Finance Expenses Ledger</span>
            </label>

            <button
              type="submit"
              className="w-full py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Save Purchase & Increase Stock</span>
            </button>
          </form>

          {/* PANEL 2: WASTE, SPOILAGE, DAMAGED, ADJUSTMENTS & RETURNED STOCK */}
          <form onSubmit={handleRecordAdjustment} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-rose-600" />
                <span>Waste, Spoilage, Damage, Return & Stock Adjustments</span>
              </h2>
              <p className="text-[11px] text-slate-400 font-bold">All movements appear automatically in Inventory History & update stock immediately</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-black text-slate-700 block mb-1">Movement Type *</label>
                <select
                  value={adjType}
                  onChange={(e) => setAdjType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black"
                >
                  {TRANSACTION_TYPES.filter(t => t.id !== 'purchase').map(t => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-black text-slate-700 block mb-1">Ingredient *</label>
                <select
                  value={adjIngId}
                  onChange={(e) => setAdjIngId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black"
                >
                  {ingredients.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.emoji} {i.englishName || i.name} ({i.purchaseUnit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-black text-slate-700 block mb-1">
                  Quantity ({ingredients.find(i => i.id === adjIngId)?.purchaseUnit || 'unit'}) *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  value={adjQty}
                  onChange={(e) => setAdjQty(e.target.value)}
                  placeholder="e.g. 1"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black"
                />
              </div>
              <div>
                <label className="text-[11px] font-black text-slate-700 block mb-1">Date</label>
                <input
                  type="date"
                  value={adjDate}
                  onChange={(e) => setAdjDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-black text-slate-700 block mb-1">Recorded By</label>
                <input
                  type="text"
                  value={adjStaff}
                  onChange={(e) => setAdjStaff(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] font-black text-slate-700 block mb-1">Reason / Note</label>
                <input
                  type="text"
                  value={adjNote}
                  onChange={(e) => setAdjNote(e.target.value)}
                  placeholder="e.g. Overripe fruit discarded or stock count correction"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Record Inventory Movement</span>
            </button>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 3: PRODUCT RECIPES / BOM BUILDER                          */}
      {/* ============================================================== */}
      {sectionView === 'recipes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* LEFT: MENU PRODUCTS PICKER */}
          <div className="lg:col-span-5 bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-black text-slate-900">Select Menu Product</h2>
              <span className="text-[11px] font-bold text-slate-400">{foodMenu.length} products</span>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={recipeSearch}
                onChange={(e) => setRecipeSearch(e.target.value)}
                placeholder="Search dish or juice..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-bold outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1">
              {filteredMenuProducts.map(prod => {
                const rec = recipes.find(r => r.productId === prod.id);
                const ingCount = rec?.ingredients?.length || 0;
                const selected = selectedProductId === prod.id;
                return (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => setSelectedProductId(prod.id)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between gap-2 ${
                      selected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-900'
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="text-xs font-black block truncate">{prod.englishName || prod.name}</span>
                      <span className={`text-[10px] font-bold block truncate ${selected ? 'text-emerald-100' : 'text-slate-400'}`}>
                        {prod.name} • {prod.category}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                        selected
                          ? 'bg-white/20 text-white'
                          : ingCount > 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {ingCount} ingr.
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT: RECIPE INGREDIENTS FOR SELECTED PRODUCT */}
          <div className="lg:col-span-7 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900">
                  Recipe / BOM: {activeMenuProduct?.englishName || activeMenuProduct?.name || activeRecipe.productName}
                </h2>
                <p className="text-[11px] text-slate-500 font-bold">
                  Every time 1 {activeRecipe.yieldUnit} is sold, all attached ingredients below deduct automatically
                </p>
              </div>
              <select
                value={activeRecipe.yieldUnit || 'order'}
                onChange={(e) => upsertProductRecipe({ ...activeRecipe, yieldUnit: e.target.value })}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-black"
              >
                <option value="order">Per Order</option>
                <option value="cup">Per Cup</option>
                <option value="plate">Per Plate</option>
                <option value="portion">Per Portion</option>
              </select>
            </div>

            {/* Attached Ingredients List */}
            {(activeRecipe.ingredients || []).length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center text-xs text-slate-500 font-bold">
                No ingredients attached to this product yet. Add one below!
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeRecipe.ingredients.map(line => {
                  const ing = summary.statusByIngId.get(line.ingredientId) || ingredients.find(i => i.id === line.ingredientId);
                  if (!ing) return null;
                  const possible =
                    Number(line.qtyPerUnit) > 0 && ing.availableRecipeUnits !== undefined
                      ? Math.floor(ing.availableRecipeUnits / Number(line.qtyPerUnit))
                      : 0;
                  return (
                    <div key={line.ingredientId} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{ing.emoji || '📦'}</span>
                        <div>
                          <span className="text-xs font-black text-slate-900 block">{ing.englishName || ing.name}</span>
                          <span className="text-[10px] font-bold text-slate-500">
                            Capacity from current stock: <strong>{possible} {activeRecipe.yieldUnit}s</strong>
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={line.qtyPerUnit}
                          onChange={(e) => handleUpdateBomLineQty(line.ingredientId, e.target.value)}
                          className="w-24 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-black text-right"
                        />
                        <span className="text-xs font-bold text-slate-600 min-w-[60px]">{ing.recipeUnit}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveBomLine(line.ingredientId)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title="Remove from recipe"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add Ingredient Line to Product BOM */}
            <form onSubmit={handleAddIngredientToBom} className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
              <div className="sm:col-span-6">
                <label className="text-[10px] font-black text-emerald-900 block mb-1">Add Ingredient to Recipe</label>
                <select
                  value={newBomIngId}
                  onChange={(e) => setNewBomIngId(e.target.value)}
                  className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-2 text-xs font-black"
                >
                  {ingredients.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.emoji} {i.englishName || i.name} ({i.recipeUnit})
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-3">
                <label className="text-[10px] font-black text-emerald-900 block mb-1">
                  Qty / {activeRecipe.yieldUnit} ({ingredients.find(i => i.id === newBomIngId)?.recipeUnit || 'unit'})
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  value={newBomQty}
                  onChange={(e) => setNewBomQty(e.target.value)}
                  placeholder="e.g. 300"
                  className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-2 text-xs font-black"
                />
              </div>
              <div className="sm:col-span-3">
                <button
                  type="submit"
                  className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Attach</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 4: INGREDIENTS, UNITS, YIELD CONVERSIONS & THRESHOLDS     */}
      {/* ============================================================== */}
      {sectionView === 'ingredients' && (
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900">
                Raw Ingredients Catalog, Conversions & Alert Thresholds
              </h2>
              <p className="text-[11px] text-slate-500 font-bold">
                Add any new ingredient (Mango, Milk, Sugar, Chicken, Oil, Cups, etc.) and configure exact unit conversions without touching code
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRestoreDefaults}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black flex items-center gap-1 border border-slate-200"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore Starters</span>
              </button>
              <button
                type="button"
                onClick={openNewIngredientModal}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add New Ingredient</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-black border-b border-slate-200">
                  <th className="py-2.5 px-3">Ingredient</th>
                  <th className="py-2.5 px-3">Purchase → Recipe Conversion</th>
                  <th className="py-2.5 px-3 text-right">Initial Stock</th>
                  <th className="py-2.5 px-3 text-right">Min Alert (🟡)</th>
                  <th className="py-2.5 px-3 text-right">Reorder Level (🔴)</th>
                  <th className="py-2.5 px-3 text-right">Target Stock</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ingredients.map(ing => (
                  <tr key={ing.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-black text-slate-900">
                      <span className="mr-1.5">{ing.emoji || '📦'}</span>
                      {ing.englishName || ing.name}
                      <span className="block text-[10px] font-bold text-slate-400">{ing.category}</span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-700">
                      1 {ing.purchaseUnit} = <strong>{Number(ing.recipeUnitsPerPurchaseUnit).toLocaleString()} {ing.recipeUnit}</strong>
                      {ing.conversionNote && (
                        <span className="block text-[10px] text-slate-400">{ing.conversionNote}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-black">{ing.initialStock} {ing.purchaseUnit}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-amber-700">{ing.minStockLevel} {ing.purchaseUnit}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-rose-700">{ing.reorderLevel} {ing.purchaseUnit}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-700">{ing.targetStockLevel || '—'} {ing.purchaseUnit}</td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setIngModal({ ...ing, isNew: false })}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-black inline-flex items-center gap-1"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteIngredient(ing)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 5: INVENTORY MOVEMENT HISTORY                             */}
      {/* ============================================================== */}
      {sectionView === 'history' && (
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900">
                Complete Inventory Movement History ({filteredHistory.length})
              </h2>
              <p className="text-[11px] text-slate-500 font-bold">
                Tracks every Purchase, Auto-Deducted Order, Cancelled/Refunded Reversal, Waste & Manual Adjustment
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={histTypeFilter}
                onChange={(e) => setHistTypeFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold"
              >
                <option value="all">All Types</option>
                <option value="purchase">Purchases</option>
                <option value="orders_group">Orders & Reversals</option>
                <option value="waste_group">Waste / Spoilage / Damage</option>
                <option value="adj_group">Adjustments & Returns</option>
              </select>
              <select
                value={histIngFilter}
                onChange={(e) => setHistIngFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold"
              >
                <option value="all">All Ingredients</option>
                {ingredients.map(i => (
                  <option key={i.id} value={i.id}>{i.englishName || i.name}</option>
                ))}
              </select>
              <input
                type="text"
                value={histSearch}
                onChange={(e) => setHistSearch(e.target.value)}
                placeholder="Search supplier/note..."
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold"
              />
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <p className="text-xs text-slate-400 font-bold py-6 text-center">No inventory movements logged yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-black border-b border-slate-200">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Ingredient</th>
                    <th className="py-2.5 px-3">Movement</th>
                    <th className="py-2.5 px-3 text-right">Qty</th>
                    <th className="py-2.5 px-3">Staff / Supplier</th>
                    <th className="py-2.5 px-3">Note / Order</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHistory.map(tx => {
                    const isPositive = Number(tx.signedQty) > 0;
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 whitespace-nowrap font-bold text-slate-500">{tx.date}</td>
                        <td className="py-2.5 px-3 font-black text-slate-900">{tx.ingredientName}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            tx.type === 'purchase' || tx.type === 'order_reversal' || tx.type === 'return_stock'
                              ? 'bg-emerald-100 text-emerald-800'
                              : tx.type === 'order_sale'
                                ? 'bg-slate-100 text-slate-700'
                                : 'bg-rose-100 text-rose-800'
                          }`}>
                            {tx.reason}
                          </span>
                        </td>
                        <td className={`py-2.5 px-3 text-right font-black tabular-nums ${isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {isPositive ? `+${tx.qty}` : `−${tx.qty}`} {tx.unit}
                          {Number(tx.cost) > 0 && <span className="block text-[10px] text-slate-500">{tx.cost.toLocaleString()} ETB</span>}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-600">
                          {tx.supplier ? `${tx.supplier} • ` : ''}{tx.staffName}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate">{tx.note || tx.orderId || '—'}</td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteTransaction(tx.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Delete entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ADD / EDIT INGREDIENT MODAL */}
      {ingModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIngModal(null)}
        >
          <form
            onSubmit={handleSaveIngredientModal}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl border border-emerald-200 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                {ingModal.isNew ? '➕ Add New Raw Ingredient' : `✏️ Edit Ingredient: ${ingModal.englishName}`}
              </h3>
              <button type="button" onClick={() => setIngModal(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-black text-slate-700 block mb-1">English Name *</label>
                <input
                  type="text"
                  required
                  value={ingModal.englishName}
                  onChange={(e) => setIngModal(p => ({ ...p, englishName: e.target.value }))}
                  placeholder="e.g. Mango, Sugar, Milk, Chicken"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black"
                />
              </div>
              <div>
                <label className="text-[11px] font-black text-slate-700 block mb-1">Display / Amharic Label</label>
                <input
                  type="text"
                  value={ingModal.name}
                  onChange={(e) => setIngModal(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. ማንጎ (Mango)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-black text-slate-700 block mb-1">Purchase Unit</label>
                <select
                  value={ingModal.purchaseUnit}
                  onChange={(e) => setIngModal(p => ({ ...p, purchaseUnit: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black"
                >
                  {PURCHASE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-black text-slate-700 block mb-1">Recipe Unit</label>
                <select
                  value={ingModal.recipeUnit}
                  onChange={(e) => setIngModal(p => ({ ...p, recipeUnit: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black"
                >
                  {RECIPE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>

              <div className="sm:col-span-2 bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-black text-emerald-950 block mb-1">
                    Conversion: 1 {ingModal.purchaseUnit} = ? {ingModal.recipeUnit}
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.0001"
                    required
                    value={ingModal.recipeUnitsPerPurchaseUnit}
                    onChange={(e) => setIngModal(p => ({ ...p, recipeUnitsPerPurchaseUnit: e.target.value }))}
                    className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-xs font-black"
                  />
                  <span className="text-[10px] font-bold text-emerald-800 block mt-1">
                    e.g. 1 kg raw rice = 3000 g cooked; 1 kg fruit = 1000 g; 1 liter = 1000 ml
                  </span>
                </div>
                <div>
                  <label className="text-[11px] font-black text-emerald-950 block mb-1">Conversion / Yield Note</label>
                  <input
                    type="text"
                    value={ingModal.conversionNote || ''}
                    onChange={(e) => setIngModal(p => ({ ...p, conversionNote: e.target.value }))}
                    placeholder="e.g. 1 kg avocado ≈ 2 cups"
                    className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black text-slate-700 block mb-1">Initial Stock ({ingModal.purchaseUnit})</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={ingModal.initialStock}
                  onChange={(e) => setIngModal(p => ({ ...p, initialStock: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black"
                />
              </div>
              <div>
                <label className="text-[11px] font-black text-slate-700 block mb-1">Category & Emoji</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={ingModal.category}
                    onChange={(e) => setIngModal(p => ({ ...p, category: e.target.value }))}
                    placeholder="Fruits"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                  />
                  <input
                    type="text"
                    value={ingModal.emoji}
                    onChange={(e) => setIngModal(p => ({ ...p, emoji: e.target.value }))}
                    className="w-14 bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-center text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black text-amber-800 block mb-1">🟡 Min Alert Level ({ingModal.purchaseUnit})</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={ingModal.minStockLevel}
                  onChange={(e) => setIngModal(p => ({ ...p, minStockLevel: e.target.value }))}
                  className="w-full bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs font-black"
                />
              </div>
              <div>
                <label className="text-[11px] font-black text-rose-800 block mb-1">🔴 Reorder Level ({ingModal.purchaseUnit})</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={ingModal.reorderLevel}
                  onChange={(e) => setIngModal(p => ({ ...p, reorderLevel: e.target.value }))}
                  className="w-full bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 text-xs font-black"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setIngModal(null)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-black">
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5">
                <Save className="w-3.5 h-3.5" />
                <span>Save Ingredient</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
