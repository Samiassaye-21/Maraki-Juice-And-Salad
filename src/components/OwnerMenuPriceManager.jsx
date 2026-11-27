import React, { useState, useMemo, useEffect } from 'react';
import {
  Tag,
  Lock,
  Unlock,
  Plus,
  Search,
  RotateCcw,
  CheckCircle2,
  Coffee,
  UtensilsCrossed,
  Eye,
  EyeOff,
  Trash2,
  ShieldCheck,
  History,
  Save,
  AlertTriangle,
  Truck,
  Camera,
  ImagePlus,
  X,
  Pencil
} from 'lucide-react';
import { isFoodItemForBeu, computeBeuPrice, formatEtb } from '../utils/beuHelpers';
import { getDishBoxType, getDishBoxTypeMap, saveDishBoxTypeMap } from '../utils/reconciliationHelpers';
import { dbService } from '../lib/supabaseClient';

/**
 * Resize and compress a selected image file into a lightweight JPEG data URL (~20-35KB)
 * so it syncs reliably into Supabase menu_items.image_url and localStorage.
 */
function compressMenuImageFile(file, maxSize = 320, quality = 0.78) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file'));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (ev) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image file'));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

const CATEGORIES = [
  { id: 'All', label: 'All Items' },
  { id: 'Juices', label: '🥤 Juices' },
  { id: 'Milkshake', label: '🥛 Milkshakes' },
  { id: 'Drinks', label: '🧃 Drinks' },
  { id: 'Salad', label: '🥗 Salads & Fruit' },
  { id: 'Pasta & Rice', label: '🍝 Pasta & Rice' },
  { id: 'Eggs & Firfir', label: '🍳 Eggs & Firfir' },
  { id: 'Sandwiches', label: '🥪 Sandwiches' },
  { id: 'Other', label: '🍽️ Other' }
];

export default function OwnerMenuPriceManager({
  foodMenu = [],
  onUpdateMenu,
  defaultMenu = [],
  standardJuicePrice = 170,
  onUpdateStandardJuicePrice,
  ownerPassword = '1234'
}) {
  // Permission Gate: Price editing lock toggle (protected by Owner Password)
  const [requirePinToSave, setRequirePinToSave] = useState(() => {
    const saved = localStorage.getItem('maraki_menu_edit_pin_lock');
    return saved === null ? true : saved === 'true';
  });
  const [isUnlockedForSession, setIsUnlockedForSession] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [pendingAction, setPendingAction] = useState(null);

  useEffect(() => {
    localStorage.setItem('maraki_menu_edit_pin_lock', String(requirePinToSave));
    dbService.saveAppState('maraki_menu_edit_pin_lock', requirePinToSave);
  }, [requirePinToSave]);

  // Price Change Audit History
  const [priceAuditLog, setPriceAuditLog] = useState(() => {
    try {
      const saved = localStorage.getItem('maraki_price_change_log_v1');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('maraki_price_change_log_v1', JSON.stringify(priceAuditLog));
    dbService.saveAppState('maraki_price_change_log_v1', priceAuditLog);
  }, [priceAuditLog]);

  useEffect(() => {
    const handleRemoteSync = () => {
      const savedPin = localStorage.getItem('maraki_menu_edit_pin_lock');
      if (savedPin !== null) setRequirePinToSave(savedPin === 'true');
      try {
        const savedLog = localStorage.getItem('maraki_price_change_log_v1');
        if (savedLog) setPriceAuditLog(JSON.parse(savedLog));
      } catch (e) {}
    };
    window.addEventListener('maraki-supabase-synced', handleRemoteSync);
    return () => window.removeEventListener('maraki-supabase-synced', handleRemoteSync);
  }, []);

  const recordAudit = (itemName, oldPrice, newPrice, detail = '') => {
    const entry = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      itemName,
      oldPrice,
      newPrice,
      detail,
      timestamp: new Date().toLocaleString()
    };
    setPriceAuditLog(prev => [entry, ...prev].slice(0, 50));
  };

  // Run an action gated behind Owner Password if Lock is enabled & not yet unlocked
  const runWithPermission = (actionFn) => {
    if (!requirePinToSave || isUnlockedForSession) {
      actionFn();
      return;
    }
    setPendingAction(() => actionFn);
    setPinInput('');
    setPinError('');
    setPinModalOpen(true);
  };

  const handleConfirmPin = (e) => {
    e.preventDefault();
    if (pinInput.trim() === ownerPassword) {
      setIsUnlockedForSession(true);
      setPinModalOpen(false);
      setPinError('');
      if (pendingAction) {
        pendingAction();
        setPendingAction(null);
      }
    } else {
      setPinError('Incorrect Owner Password. Permission denied.');
    }
  };

  // Filters & Draft Price Edits
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [draftJuicePrice, setDraftJuicePrice] = useState(String(standardJuicePrice));
  const [draftPrices, setDraftPrices] = useState({}); // { [itemId]: { price, homePrice } }
  const [savedNotice, setSavedNotice] = useState('');

  useEffect(() => {
    setDraftJuicePrice(String(standardJuicePrice));
  }, [standardJuicePrice]);

  // Add New Item Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEnglishName, setNewEnglishName] = useState('');
  const [newCategory, setNewCategory] = useState('Salad');
  const [newItemType, setNewItemType] = useState('food'); // 'food' | 'juice'
  const [newPrice, setNewPrice] = useState('');
  const [newOriginalPrice, setNewOriginalPrice] = useState('');
  const [newHomePrice, setNewHomePrice] = useState('');
  const [newEmoji, setNewEmoji] = useState('🥗');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newBoxType, setNewBoxType] = useState('standard_box'); // 'standard_box' | 'chofan_box'
  const [boxTypeMap, setBoxTypeMap] = useState(() => getDishBoxTypeMap());
  const [uploadingItemId, setUploadingItemId] = useState(null);
  const [editingItem, setEditingItem] = useState(null); // { id, name, englishName, category, itemType, price, originalPrice, homePrice, emoji, description, imageUrl, isAvailable, boxType }

  useEffect(() => {
    const syncBoxTypes = () => setBoxTypeMap(getDishBoxTypeMap());
    window.addEventListener('maraki-supabase-synced', syncBoxTypes);
    window.addEventListener('maraki-dish-box-types-updated', syncBoxTypes);
    return () => {
      window.removeEventListener('maraki-supabase-synced', syncBoxTypes);
      window.removeEventListener('maraki-dish-box-types-updated', syncBoxTypes);
    };
  }, []);

  const showNotice = (msg) => {
    setSavedNotice(msg);
    setTimeout(() => setSavedNotice(''), 3000);
  };

  const filteredItems = useMemo(() => {
    return foodMenu.filter(item => {
      if (activeCategory !== 'All' && item.category !== activeCategory) return false;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        (item.name || '').toLowerCase().includes(q) ||
        (item.englishName || '').toLowerCase().includes(q)
      );
    });
  }, [foodMenu, activeCategory, searchQuery]);

  const handleSaveStandardJuiceRate = () => {
    const num = Number(draftJuicePrice);
    if (isNaN(num) || num <= 0) return;
    runWithPermission(() => {
      if (num !== standardJuicePrice) {
        recordAudit('Standard Juice Cup Rate (Daily Sheet)', `${standardJuicePrice} ETB`, `${num} ETB`, 'Applies to Shift Reconciliation & Pending Juice');
      }
      onUpdateStandardJuicePrice(num);
      showNotice(`Standard Juice Cup rate updated to ${num} ETB`);
    });
  };

  const getDraft = (item) => {
    return draftPrices[item.id] || {
      price: String(item.price ?? ''),
      originalPrice: item.originalPrice !== undefined && item.originalPrice !== null ? String(item.originalPrice) : '',
      homePrice: item.homePrice !== undefined && item.homePrice !== null ? String(item.homePrice) : ''
    };
  };

  const updateDraftField = (item, field, value) => {
    const current = getDraft(item);
    setDraftPrices(prev => ({
      ...prev,
      [item.id]: { ...current, [field]: value }
    }));
  };

  const handleSaveSingleItem = (item) => {
    const draft = getDraft(item);
    const nextPrice = Number(draft.price);
    const nextOriginal = draft.originalPrice === '' ? null : Number(draft.originalPrice);
    const nextHome = draft.homePrice === '' ? null : Number(draft.homePrice);
    if (isNaN(nextPrice) || nextPrice < 0) return;
    if (nextOriginal !== null && (isNaN(nextOriginal) || nextOriginal < 0)) return;
    if (nextHome !== null && (isNaN(nextHome) || nextHome < 0)) return;

    runWithPermission(() => {
      const updated = foodMenu.map(m => {
        if (m.id !== item.id) return m;
        return {
          ...m,
          price: nextPrice,
          originalPrice: nextOriginal,
          homePrice: nextHome
        };
      });
      if (
        nextPrice !== Number(item.price) ||
        nextOriginal !== (item.originalPrice ?? null) ||
        nextHome !== (item.homePrice ?? null)
      ) {
        recordAudit(
          `${item.name} (${item.englishName || ''})`,
          `${item.price} ETB${item.homePrice ? ` / Home ${item.homePrice}` : ''}`,
          `${nextPrice} ETB${isFoodItemForBeu(item) ? ` (BEU ${formatEtb(computeBeuPrice(nextPrice))})` : ''}`
        );
      }
      onUpdateMenu(updated);
      setDraftPrices(prev => {
        const copy = { ...prev };
        delete copy[item.id];
        return copy;
      });
      showNotice(`Updated ${item.englishName || item.name} → ${formatEtb(nextPrice)} ETB${isFoodItemForBeu(item) ? ` (BEU ${formatEtb(computeBeuPrice(nextPrice))} ETB)` : ''}`);
    });
  };

  const dirtyCount = Object.keys(draftPrices).length;

  const handleSaveAllEdited = () => {
    if (dirtyCount === 0) return;
    runWithPermission(() => {
      let changedCount = 0;
      const updated = foodMenu.map(m => {
        const draft = draftPrices[m.id];
        if (!draft) return m;
        const nextPrice = Number(draft.price);
        const nextOriginal = draft.originalPrice === '' ? null : Number(draft.originalPrice);
        const nextHome = draft.homePrice === '' ? null : Number(draft.homePrice);
        if (isNaN(nextPrice) || nextPrice < 0) return m;
        if (nextOriginal !== null && (isNaN(nextOriginal) || nextOriginal < 0)) return m;
        if (nextHome !== null && (isNaN(nextHome) || nextHome < 0)) return m;
        if (
          nextPrice !== Number(m.price) ||
          nextOriginal !== (m.originalPrice ?? null) ||
          nextHome !== (m.homePrice ?? null)
        ) {
          changedCount += 1;
          recordAudit(
            `${m.name} (${m.englishName || ''})`,
            `${m.price} ETB${m.homePrice ? ` / Home ${m.homePrice}` : ''}`,
            `${nextPrice} ETB${isFoodItemForBeu(m) ? ` (BEU ${formatEtb(computeBeuPrice(nextPrice))})` : ''}`
          );
        }
        return { ...m, price: nextPrice, originalPrice: nextOriginal, homePrice: nextHome };
      });
      onUpdateMenu(updated);
      setDraftPrices({});
      showNotice(`Saved ${changedCount || dirtyCount} menu item price update(s)`);
    });
  };

  const handleToggleAvailability = (item) => {
    runWithPermission(() => {
      const nextAvail = item.isAvailable === false ? true : false;
      const updated = foodMenu.map(m => m.id === item.id ? { ...m, isAvailable: nextAvail } : m);
      recordAudit(
        `${item.name} (${item.englishName || ''})`,
        item.isAvailable === false ? 'Hidden' : 'Visible',
        nextAvail ? 'Visible on Chef POS' : 'Hidden from Chef POS'
      );
      onUpdateMenu(updated);
      showNotice(`${item.englishName || item.name} is now ${nextAvail ? 'Available' : 'Hidden'} on Chef POS`);
    });
  };

  const handleDeleteCustomItem = (item) => {
    if (!window.confirm(`Delete "${item.name} (${item.englishName || ''})" from the menu?`)) return;
    runWithPermission(() => {
      const updated = foodMenu.filter(m => m.id !== item.id);
      recordAudit(`${item.name} (${item.englishName || ''})`, `${item.price} ETB`, 'Removed');
      onUpdateMenu(updated);
      showNotice(`Removed ${item.englishName || item.name}`);
    });
  };

  const handleToggleItemBoxType = (item) => {
    if (item.containerType === 'cup' || item.itemType === 'juice') return;
    runWithPermission(() => {
      const current = getDishBoxType(item, {}, boxTypeMap);
      const next = current === 'chofan_box' ? 'standard_box' : 'chofan_box';
      const updatedMap = saveDishBoxTypeMap({ ...boxTypeMap, [item.id]: next });
      setBoxTypeMap(updatedMap);
      showNotice(
        `${item.englishName || item.name} now deducts ${
          next === 'chofan_box' ? '🥡 Chao Fan Box' : '📦 Standard Takeaway Box'
        }`
      );
    });
  };

  const handleRowImageFileChange = async (item, file) => {
    if (!file) return;
    setUploadingItemId(item.id);
    try {
      const compressed = await compressMenuImageFile(file);
      runWithPermission(() => {
        const updated = foodMenu.map(m => (m.id === item.id ? { ...m, imageUrl: compressed } : m));
        recordAudit(`${item.name} (${item.englishName || ''})`, item.imageUrl ? 'Photo' : 'No Photo', 'Updated Photo');
        onUpdateMenu(updated);
        showNotice(`Photo updated for ${item.englishName || item.name}`);
      });
    } catch (err) {
      showNotice('Could not read that image file. Try PNG or JPG.');
    } finally {
      setUploadingItemId(null);
    }
  };

  const handleClearRowImage = (item) => {
    runWithPermission(() => {
      const updated = foodMenu.map(m => (m.id === item.id ? { ...m, imageUrl: '' } : m));
      onUpdateMenu(updated);
      showNotice(`Removed photo for ${item.englishName || item.name}`);
    });
  };

  const handleNewFormImageChange = async (file) => {
    if (!file) return;
    try {
      const compressed = await compressMenuImageFile(file);
      setNewImageUrl(compressed);
    } catch (err) {
      showNotice('Could not load selected image file.');
    }
  };

  const openEditModal = (item) => {
    const draft = getDraft(item);
    const curBox = getDishBoxType(item, {}, boxTypeMap);
    const isDrinkCat = ['Juices', 'Milkshake', 'Drinks'].includes(item.category) || item.containerType === 'cup' || item.itemType === 'juice';
    setEditingItem({
      id: item.id,
      name: item.name || '',
      englishName: item.englishName || '',
      category: item.category || (isDrinkCat ? 'Juices' : 'Salad'),
      itemType: isDrinkCat ? 'juice' : 'food',
      price: draft.price,
      originalPrice: draft.originalPrice,
      homePrice: draft.homePrice,
      emoji: item.emoji || (isDrinkCat ? '🥤' : '🥗'),
      description: item.description || '',
      imageUrl: item.imageUrl || '',
      isAvailable: item.isAvailable !== false,
      boxType: curBox === 'chofan_box' ? 'chofan_box' : 'standard_box'
    });
  };

  const handleEditModalImageChange = async (file) => {
    if (!file) return;
    try {
      const compressed = await compressMenuImageFile(file);
      setEditingItem(prev => (prev ? { ...prev, imageUrl: compressed } : prev));
    } catch (err) {
      showNotice('Could not load selected image file.');
    }
  };

  const handleSaveEditModal = (e) => {
    e.preventDefault();
    if (!editingItem) return;
    const priceNum = Number(editingItem.price);
    if (!editingItem.name.trim() || isNaN(priceNum) || priceNum < 0) return;
    const origNum = editingItem.originalPrice === '' ? null : Number(editingItem.originalPrice);
    const homeNum = editingItem.homePrice === '' ? null : Number(editingItem.homePrice);
    if (origNum !== null && (isNaN(origNum) || origNum < 0)) return;
    if (homeNum !== null && (isNaN(homeNum) || homeNum < 0)) return;

    const targetId = editingItem.id;
    const originalItem = foodMenu.find(m => m.id === targetId);

    runWithPermission(() => {
      const isDrinkCat = ['Juices', 'Milkshake', 'Drinks'].includes(editingItem.category);
      const isJuice = editingItem.itemType === 'juice' || isDrinkCat;

      const updated = foodMenu.map(m => {
        if (m.id !== targetId) return m;
        return {
          ...m,
          name: editingItem.name.trim(),
          englishName: editingItem.englishName.trim() || editingItem.name.trim(),
          category: isJuice && !isDrinkCat ? 'Juices' : editingItem.category,
          itemType: isJuice ? 'juice' : 'food',
          containerType: isJuice ? 'cup' : 'box',
          price: priceNum,
          originalPrice: origNum,
          homePrice: homeNum,
          emoji: editingItem.emoji.trim() || (isJuice ? '🥤' : '🥗'),
          description: editingItem.description.trim(),
          imageUrl: editingItem.imageUrl || '',
          isAvailable: editingItem.isAvailable !== false
        };
      });

      if (!isJuice) {
        const updatedMap = saveDishBoxTypeMap({ ...boxTypeMap, [targetId]: editingItem.boxType || 'standard_box' });
        setBoxTypeMap(updatedMap);
      }

      recordAudit(
        `${editingItem.name.trim()} (${editingItem.englishName.trim() || ''})`,
        `${originalItem?.name || ''} • ${originalItem?.price ?? ''} ETB`,
        `Edited → ${priceNum} ETB${homeNum !== null ? ` / Home ${homeNum}` : ''}`
      );

      onUpdateMenu(updated);
      setDraftPrices(prev => {
        const copy = { ...prev };
        delete copy[targetId];
        return copy;
      });
      setEditingItem(null);
      showNotice(`Saved changes for "${editingItem.englishName.trim() || editingItem.name.trim()}"`);
    });
  };

  const handleAddNewItem = (e) => {
    e.preventDefault();
    const priceNum = Number(newPrice);
    if (!newName.trim() || isNaN(priceNum) || priceNum <= 0) return;
    const origNum = newOriginalPrice === '' ? null : Number(newOriginalPrice);
    const homeNum = newHomePrice === '' ? null : Number(newHomePrice);

    runWithPermission(() => {
      const isDrinkCat = ['Juices', 'Milkshake', 'Drinks'].includes(newCategory);
      const isJuice = newItemType === 'juice' || isDrinkCat;
      const newId = `${isJuice ? 'j' : 'm'}-${Date.now()}`;
      const created = {
        id: newId,
        name: newName.trim(),
        englishName: newEnglishName.trim() || newName.trim(),
        category: isJuice && !isDrinkCat ? 'Juices' : newCategory,
        itemType: isJuice ? 'juice' : 'food',
        price: priceNum,
        originalPrice: origNum,
        homePrice: homeNum,
        containerType: isJuice ? 'cup' : 'box',
        isAvailable: true,
        emoji: newEmoji || (isJuice ? '🥤' : '🥗'),
        imageUrl: newImageUrl || '',
        description: ''
      };
      if (!isJuice) {
        const updatedMap = saveDishBoxTypeMap({ ...boxTypeMap, [newId]: newBoxType });
        setBoxTypeMap(updatedMap);
      }
      onUpdateMenu([...foodMenu, created]);
      recordAudit(`${created.name} (${created.englishName})`, 'New Item', `${priceNum} ETB`);
      setNewName('');
      setNewEnglishName('');
      setNewPrice('');
      setNewOriginalPrice('');
      setNewHomePrice('');
      setNewImageUrl('');
      setNewBoxType('standard_box');
      setShowAddForm(false);
      showNotice(`Added "${created.englishName}" at ${formatEtb(priceNum)} ETB`);
    });
  };

  const handleResetDefaults = () => {
    if (!window.confirm('Restore all default Maraki food and juice menu prices? Custom edits will be reset.')) return;
    runWithPermission(() => {
      onUpdateMenu(defaultMenu);
      onUpdateStandardJuicePrice(170);
      setDraftPrices({});
      recordAudit('Full Menu & Juice Rate', 'Custom', 'Restored Defaults (170 ETB juice / default dishes)');
      showNotice('Restored default menu and juice prices');
    });
  };

  const foodCount = foodMenu.filter(i => i.containerType !== 'cup' && i.itemType !== 'juice').length;
  const juiceCount = foodMenu.filter(i => i.containerType === 'cup' || i.itemType === 'juice').length;

  return (
    <div className="space-y-6 text-slate-800">
      {/* HEADER + OWNER PERMISSION STATUS */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl font-black">
            🏷️
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Menu & Juice Price Control (Owner Only)
              </h1>
              <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Chef POS Read-Only
              </span>
            </div>
            <p className="text-xs text-slate-500 font-bold mt-0.5">
              Changes sync live to Chef POS ({foodCount} food, {juiceCount} juices), Daily Income Sheet & Owner Reports
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Permission Lock Control */}
          <button
            type="button"
            onClick={() => {
              if (isUnlockedForSession) {
                setIsUnlockedForSession(false);
                showNotice('Price editing locked — Owner PIN required for next edit');
              } else {
                setPendingAction(null);
                setPinInput('');
                setPinError('');
                setPinModalOpen(true);
              }
            }}
            className={`px-3.5 py-2 rounded-2xl text-xs font-black flex items-center gap-1.5 border transition-all ${
              !requirePinToSave || isUnlockedForSession
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
            }`}
          >
            {!requirePinToSave || isUnlockedForSession ? (
              <>
                <Unlock className="w-3.5 h-3.5 text-emerald-700" />
                <span>Unlocked (Click to Lock)</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-amber-700" />
                <span>PIN Protected • Unlock</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowAddForm(prev => !prev)}
            className="px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Dish / Juice</span>
          </button>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs flex items-center gap-1.5 border border-slate-200"
            title="Restore Default Maraki Menu Prices"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {savedNotice && (
        <div className="bg-emerald-900 text-white px-4 py-3 rounded-2xl text-xs font-black flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* 1. STANDARD JUICE CUP PRICE (FOR DAILY SHEET & beU) */}
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Coffee className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm sm:text-base font-black">Standard Juice Cup Rate (Daily Income Sheet & beU)</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-300 font-bold">
            Used automatically when calculating cups sold, beU delivery deductions, and unpaid juice waiter debts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/10 p-1 rounded-xl border border-slate-200 dark:border-white/15">
            {[150, 170, 180, 200].map(preset => (
              <button
                key={preset}
                type="button"
                onClick={() => setDraftJuicePrice(String(preset))}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                  Number(draftJuicePrice) === preset ? 'bg-emerald-600 text-white' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              value={draftJuicePrice}
              onChange={(e) => setDraftJuicePrice(e.target.value)}
              className="w-24 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-black outline-none"
            />
            <span className="text-xs font-black text-emerald-700 dark:text-emerald-300">ETB / cup</span>
            <button
              type="button"
              onClick={handleSaveStandardJuiceRate}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Update Rate</span>
            </button>
          </div>
        </div>
      </div>

      {/* ADD NEW DISH / JUICE PANEL */}
      {showAddForm && (
        <form onSubmit={handleAddNewItem} className="bg-white p-5 rounded-3xl border-2 border-emerald-400 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-black text-slate-900">➕ Add New Food Dish or Juice Item</h3>
            <button type="button" onClick={() => setShowAddForm(false)} className="text-xs font-bold text-slate-400 hover:text-slate-700">Close</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 items-end">
            <div>
              <label className="text-[10px] font-black text-slate-600 block mb-1">Type *</label>
              <select
                value={newItemType}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewItemType(val);
                  if (val === 'juice') {
                    if (!['Juices', 'Milkshake', 'Drinks'].includes(newCategory)) setNewCategory('Juices');
                    setNewEmoji('🥤');
                  } else {
                    if (['Juices', 'Milkshake', 'Drinks'].includes(newCategory)) setNewCategory('Salad');
                    setNewEmoji('🥗');
                  }
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black"
              >
                <option value="food">🍱 Food (Uses Box)</option>
                <option value="juice">🥤 Drink / Juice / Shake</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-600 block mb-1">Amharic / Display Name *</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. አቮካዶ ጁስ"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-600 block mb-1">English Name</label>
              <input
                type="text"
                value={newEnglishName}
                onChange={(e) => setNewEnglishName(e.target.value)}
                placeholder="e.g. Egg Chao fan"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-600 block mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewCategory(val);
                  setNewItemType(['Juices', 'Milkshake', 'Drinks'].includes(val) ? 'juice' : 'food');
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
              >
                {CATEGORIES.filter(c => c.id !== 'All').map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-600 block mb-1">Red / Final Price *</label>
              <input
                type="number"
                step="any"
                required
                min="1"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="e.g. 337.50"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-600 block mb-1">Crossed-Out Orig.</label>
              <input
                type="number"
                step="any"
                min="0"
                value={newOriginalPrice}
                onChange={(e) => setNewOriginalPrice(e.target.value)}
                placeholder="e.g. 450"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-600 block mb-1">Home / Dine-In Price</label>
              <input
                type="number"
                step="any"
                min="0"
                value={newHomePrice}
                onChange={(e) => setNewHomePrice(e.target.value)}
                placeholder="Optional"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
            <div className="md:col-span-5 flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                {newImageUrl ? (
                  <img src={newImageUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImagePlus className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-600 block">Menu Photo (Upload from Device)</label>
                <div className="flex items-center gap-2 flex-wrap">
                  <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-black inline-flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5" />
                    <span>{newImageUrl ? 'Change Photo' : 'Upload Image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleNewFormImageChange(e.target.files?.[0])}
                      className="hidden"
                    />
                  </label>
                  {newImageUrl && (
                    <button
                      type="button"
                      onClick={() => setNewImageUrl('')}
                      className="px-2 py-1 rounded-lg bg-rose-50 text-rose-700 text-[10px] font-black border border-rose-200"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            {newItemType === 'food' && (
              <div className="md:col-span-4">
                <label className="text-[10px] font-black text-slate-600 block mb-1">Takeaway Stock Deduction</label>
                <select
                  value={newBoxType}
                  onChange={(e) => setNewBoxType(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-black"
                >
                  <option value="standard_box">📦 Standard Takeaway Box</option>
                  <option value="chofan_box">🥡 Chao Fan / Rice & Pasta Box</option>
                </select>
              </div>
            )}

            <div className={`${newItemType === 'food' ? 'md:col-span-3' : 'md:col-span-7'} flex justify-end`}>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm"
              >
                + Add to Live Menu
              </button>
            </div>
          </div>
        </form>
      )}

      {/* 2. MENU ITEMS FILTER & TABLE */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search food or juice..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {dirtyCount > 0 && (
          <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-black text-emerald-950">
              ✏️ You have {dirtyCount} unsaved price edit(s)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDraftPrices({})}
                className="px-3 py-1.5 rounded-xl bg-white text-slate-600 text-xs font-black border border-slate-200"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleSaveAllEdited}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save All ({dirtyCount})</span>
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-black border-b border-slate-200">
                <th className="py-3 px-3">Menu Item & Photo</th>
                <th className="py-3 px-3">Category / Stock</th>
                <th className="py-3 px-3">Selling Price (Final)</th>
                <th className="py-3 px-3">Old Price (Crossed-Out)</th>
                <th className="py-3 px-3">🛵 BEU Price (×0.85)</th>
                <th className="py-3 px-3">Home / Dine-In (ETB)</th>
                <th className="py-3 px-3 text-center">Chef POS Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map(item => {
                const draft = getDraft(item);
                const autoHomeDefault = Number(draft.price) === 320 ? 300 : Number(draft.price || item.price);
                const isFoodBeu = isFoodItemForBeu(item);
                const liveBeuPrice = isFoodBeu ? computeBeuPrice(draft.price) : null;
                const isDirty = Boolean(draftPrices[item.id]);
                const isHidden = item.isAvailable === false;
                const itemBoxType = getDishBoxType(item, {}, boxTypeMap);
                const isCup = itemBoxType === 'cup';
                return (
                  <tr key={item.id} className={`hover:bg-slate-50/80 ${isHidden ? 'opacity-60 bg-slate-50' : ''}`}>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="relative group shrink-0">
                          <label
                            title="Upload / Change Photo"
                            className="cursor-pointer w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 overflow-hidden flex items-center justify-center text-lg hover:border-emerald-500 transition-all"
                          >
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.englishName || item.name} className="w-full h-full object-cover" />
                            ) : (
                              <span>{item.emoji || (item.containerType === 'cup' ? '🥤' : '🥗')}</span>
                            )}
                            <span className="absolute inset-0 bg-slate-900/55 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-2xl">
                              <Camera className="w-4 h-4" />
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleRowImageFileChange(item, e.target.files?.[0])}
                              className="hidden"
                            />
                          </label>
                          {item.imageUrl && (
                            <button
                              type="button"
                              onClick={() => handleClearRowImage(item)}
                              title="Remove photo"
                              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-xs"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="font-black text-slate-900 block">{item.name}</span>
                          <span className="text-[10px] font-bold text-slate-400 block">{item.englishName}</span>
                          {uploadingItemId === item.id && (
                            <span className="text-[9px] font-black text-emerald-600">Uploading photo...</span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 inline-block">
                        {item.category}
                      </span>
                      {!isCup && (
                        <button
                          type="button"
                          onClick={() => handleToggleItemBoxType(item)}
                          title="Click to switch which Takeaway Box stock this dish deducts"
                          className={`mt-1 block px-2 py-0.5 rounded-lg text-[9px] font-black border transition-all ${
                            itemBoxType === 'chofan_box'
                              ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          {itemBoxType === 'chofan_box' ? '🥡 Chao Fan Box' : '📦 Std Box'}
                        </button>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={draft.price}
                        onChange={(e) => updateDraftField(item, 'price', e.target.value)}
                        className="w-24 bg-white border border-slate-300 focus:border-emerald-500 rounded-xl px-2.5 py-1.5 text-xs font-black text-slate-900 outline-none"
                      />
                    </td>

                    <td className="py-3 px-3">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={draft.originalPrice}
                        onChange={(e) => updateDraftField(item, 'originalPrice', e.target.value)}
                        placeholder="None"
                        className="w-24 bg-white border border-slate-200 focus:border-emerald-500 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-500 outline-none placeholder:text-slate-300"
                      />
                    </td>

                    <td className="py-3 px-3">
                      {isFoodBeu ? (
                        <div className="inline-flex flex-col">
                          <span className="text-xs font-black text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-xl">
                            {formatEtb(liveBeuPrice)} ETB
                          </span>
                          <span className="text-[9px] text-slate-400 font-bold mt-0.5">
                            -15% of final price
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                          Drink (Excluded)
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={draft.homePrice}
                          onChange={(e) => updateDraftField(item, 'homePrice', e.target.value)}
                          placeholder={`Auto (${autoHomeDefault})`}
                          className="w-28 bg-white border border-slate-200 focus:border-emerald-500 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-none placeholder:text-slate-400"
                        />
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleAvailability(item)}
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-black inline-flex items-center gap-1 border transition-all ${
                          isHidden
                            ? 'bg-slate-100 text-slate-500 border-slate-300'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{isHidden ? 'Hidden' : 'Visible'}</span>
                      </button>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-black inline-flex items-center gap-1 transition-all"
                          title="Edit full dish details, name, category, photo & prices"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveSingleItem(item)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                            isDirty
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                              : 'bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200'
                          }`}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomItem(item)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title="Delete Menu Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. OWNER PRICE CHANGE AUDIT LOG */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-600" />
            <span>Price & Permission Change Audit Log</span>
          </h3>
          {priceAuditLog.length > 0 && (
            <button
              type="button"
              onClick={() => setPriceAuditLog([])}
              className="text-[11px] font-bold text-slate-400 hover:text-rose-600"
            >
              Clear Log
            </button>
          )}
        </div>
        {priceAuditLog.length === 0 ? (
          <p className="text-xs text-slate-400 font-bold py-3">No price changes logged yet.</p>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {priceAuditLog.map(log => (
              <div key={log.id} className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="font-black text-slate-900">{log.itemName}</span>
                  <span className="text-slate-500 font-bold ml-2">{log.oldPrice} → <strong className="text-emerald-700">{log.newPrice}</strong></span>
                </div>
                <span className="text-[10px] font-bold text-slate-400">{log.timestamp}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* EDIT MENU ITEM & PRICES MODAL */}
      {editingItem && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setEditingItem(null)}
        >
          <form
            onSubmit={handleSaveEditModal}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-emerald-200 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    Edit Menu Item & Prices
                  </h3>
                  <p className="text-[11px] text-slate-500 font-bold">
                    Update dish name, category, photo, packaging stock type & all prices
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Photo + Names Row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
              <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center text-2xl shrink-0">
                {editingItem.imageUrl ? (
                  <img src={editingItem.imageUrl} alt={editingItem.englishName || editingItem.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{editingItem.emoji || '🥗'}</span>
                )}
              </div>
              <div className="space-y-1.5 flex-1">
                <span className="text-[11px] font-black text-slate-700 block">Dish / Juice Photo</span>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black inline-flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5" />
                    <span>{editingItem.imageUrl ? 'Change Photo' : 'Upload Image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleEditModalImageChange(e.target.files?.[0])}
                      className="hidden"
                    />
                  </label>
                  {editingItem.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setEditingItem(prev => ({ ...prev, imageUrl: '' }))}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-black border border-rose-200"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-black text-slate-700 block mb-1">Amharic / Display Name *</label>
                <input
                  type="text"
                  required
                  value={editingItem.name}
                  onChange={(e) => setEditingItem(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs font-black outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-black text-slate-700 block mb-1">English Name</label>
                <input
                  type="text"
                  value={editingItem.englishName}
                  onChange={(e) => setEditingItem(prev => ({ ...prev, englishName: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-black text-slate-700 block mb-1">Category</label>
                <select
                  value={editingItem.category}
                  onChange={(e) => {
                    const cat = e.target.value;
                    const isJuice = ['Juices', 'Milkshake', 'Drinks'].includes(cat);
                    setEditingItem(prev => ({ ...prev, category: cat, itemType: isJuice ? 'juice' : 'food' }));
                  }}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                >
                  {CATEGORIES.filter(c => c.id !== 'All').map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="text-[11px] font-black text-slate-700 block mb-1">Emoji</label>
                  <input
                    type="text"
                    value={editingItem.emoji}
                    onChange={(e) => setEditingItem(prev => ({ ...prev, emoji: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-sm text-center outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[11px] font-black text-slate-700 block mb-1">Chef POS Visibility</label>
                  <button
                    type="button"
                    onClick={() => setEditingItem(prev => ({ ...prev, isAvailable: !prev.isAvailable }))}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-black border flex items-center justify-center gap-1.5 ${
                      editingItem.isAvailable
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-300'
                    }`}
                  >
                    {editingItem.isAvailable ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{editingItem.isAvailable ? 'Visible' : 'Hidden'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Pricing Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-200/80">
              <div>
                <label className="text-[11px] font-black text-slate-800 block mb-1">Selling Price (Final ETB) *</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={editingItem.price}
                  onChange={(e) => setEditingItem(prev => ({ ...prev, price: e.target.value }))}
                  className="w-full bg-white border border-slate-300 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs font-black outline-none"
                />
                {!['Juices', 'Milkshake', 'Drinks'].includes(editingItem.category) && (
                  <span className="text-[10px] font-black text-teal-800 block mt-1">
                    🛵 BEU (×0.85): {formatEtb(computeBeuPrice(editingItem.price))} ETB
                  </span>
                )}
              </div>

              <div>
                <label className="text-[11px] font-black text-slate-700 block mb-1">Home / Dine-In Price</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="Optional"
                  value={editingItem.homePrice}
                  onChange={(e) => setEditingItem(prev => ({ ...prev, homePrice: e.target.value }))}
                  className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-black text-slate-700 block mb-1">Crossed-Out Old Price</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="Promo display only"
                  value={editingItem.originalPrice}
                  onChange={(e) => setEditingItem(prev => ({ ...prev, originalPrice: e.target.value }))}
                  className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                />
              </div>
            </div>

            {!['Juices', 'Milkshake', 'Drinks'].includes(editingItem.category) && (
              <div>
                <label className="text-[11px] font-black text-slate-700 block mb-1">Takeaway Stock Box Deduction</label>
                <select
                  value={editingItem.boxType}
                  onChange={(e) => setEditingItem(prev => ({ ...prev, boxType: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black outline-none"
                >
                  <option value="standard_box">📦 Standard Takeaway Box</option>
                  <option value="chofan_box">🥡 Chao Fan / Rice & Pasta Box</option>
                </select>
              </div>
            )}

            <div>
              <label className="text-[11px] font-black text-slate-700 block mb-1">Short Description (Optional)</label>
              <input
                type="text"
                value={editingItem.description}
                onChange={(e) => setEditingItem(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Ingredients or short note shown on Chef POS card..."
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs font-bold outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-black"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Item Changes</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* OWNER PASSWORD PERMISSION MODAL */}
      {pinModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleConfirmPin} className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 border border-emerald-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Owner Permission Required</h3>
                <p className="text-[11px] text-slate-500 font-bold">Enter Owner Password to modify prices or menu availability</p>
              </div>
            </div>

            <input
              type="password"
              autoFocus
              required
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Enter Owner Password..."
              className="w-full bg-slate-50 border border-slate-300 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm font-black outline-none"
            />

            {pinError && (
              <p className="text-xs font-black text-rose-600 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{pinError}</span>
              </p>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setPinModalOpen(false); setPendingAction(null); }}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-black"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black"
              >
                Authorize & Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
