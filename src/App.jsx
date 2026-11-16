import React, { useState, useEffect, useRef } from 'react';
import { 
  Tag, 
  Store, 
  PlusCircle, 
  Edit3, 
  Check, 
  X, 
  Trash2, 
  Search, 
  CheckCircle2, 
  ShoppingBag, 
  Plus, 
  Minus, 
  TrendingDown, 
  TrendingUp,
  Sun, 
  Moon, 
  Truck, 
  Scale, 
  BookOpen, 
  Phone,
  Camera, 
  Upload, 
  ImageIcon,
  Heart,
  Lock,
  Unlock,
  ShieldCheck,
  DollarSign,
  Receipt,
  Smartphone,
  Building,
  Database,
  Cloud,
  CheckCircle,
  AlertTriangle,
  Users,
  Settings,
  HelpCircle,
  Coffee,
  Box,
  Eye,
  EyeOff
} from 'lucide-react';
import { dbService, isSupabaseConfigured } from './lib/supabaseClient';

export default function App() {
  // --- ROLE & ACCESS CONTROL ---
  // 'employee_pos' = Employee Counter View (no financial secrets)
  // 'admin_portal' = Owner / Brother Admin View (secured by PIN)
  const [activeRole, setActiveRole] = useState('employee_pos');
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [adminPin, setAdminPin] = useState(() => localStorage.getItem('maraki_admin_pin') || '1234');
  
  // Admin Portal Active Sub-Tab
  const [adminTab, setAdminTab] = useState('financials'); // 'financials', 'packaging', 'adari', 'beu', 'menu', 'cloud'

  // --- 1. MENU STATE ---
  const [menuItems, setMenuItems] = useState(() => {
    const saved = localStorage.getItem('maraki_real_menu');
    return saved ? JSON.parse(saved) : [
      { 
        id: 'j1', 
        name: 'Special Avocado & Mango (Spris)', 
        menuType: 'Juice', 
        price: 180, 
        containerType: 'cup', 
        isAvailable: true, 
        emoji: '🥑🥭',
        imageUrl: 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=400&q=80',
        bgGradient: 'from-amber-400 to-orange-500' 
      },
      { 
        id: 'j2', 
        name: 'Pure Fresh Mango Juice', 
        menuType: 'Juice', 
        price: 150, 
        containerType: 'cup', 
        isAvailable: true, 
        emoji: '🥭',
        imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=400&q=80',
        bgGradient: 'from-orange-400 to-amber-500' 
      },
      { 
        id: 'j3', 
        name: 'Tropical Papaya & Orange', 
        menuType: 'Juice', 
        price: 140, 
        containerType: 'cup', 
        isAvailable: true, 
        emoji: '🍊',
        imageUrl: 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=400&q=80',
        bgGradient: 'from-amber-500 to-red-400' 
      },
      { 
        id: 'j4', 
        name: 'Green Detox (Apple & Cucumber)', 
        menuType: 'Juice', 
        price: 190, 
        containerType: 'cup', 
        isAvailable: true, 
        emoji: '🥬🍏',
        imageUrl: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?auto=format&fit=crop&w=400&q=80',
        bgGradient: 'from-emerald-400 to-teal-500' 
      },
      { 
        id: 'f1', 
        name: 'Tropical Fruit Salad Bowl', 
        menuType: 'Food', 
        price: 240, 
        containerType: 'box', 
        isAvailable: true, 
        emoji: '🥗🍍',
        imageUrl: 'https://images.unsplash.com/photo-1519996529931-28324d5a630e?auto=format&fit=crop&w=400&q=80',
        bgGradient: 'from-emerald-500 to-lime-500' 
      },
      { 
        id: 'f2', 
        name: 'Chicken Avocado Salad Bowl', 
        menuType: 'Food', 
        price: 320, 
        containerType: 'box', 
        isAvailable: true, 
        emoji: '🍗🥑',
        imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80',
        bgGradient: 'from-orange-500 to-emerald-600' 
      },
      { 
        id: 'f3', 
        name: 'Mediterranean Tuna Salad', 
        menuType: 'Food', 
        price: 290, 
        containerType: 'box', 
        isAvailable: true, 
        emoji: '🐟🥗',
        imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80',
        bgGradient: 'from-teal-500 to-blue-500' 
      }
    ];
  });

  // --- 2. ORDERS STATE ---
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('maraki_real_orders');
    return saved ? JSON.parse(saved) : [];
  });

  // --- 3. ADARI (አዳሪ) UNPAID CREDIT LEDGER ---
  const [adariList, setAdariList] = useState(() => {
    const saved = localStorage.getItem('maraki_real_adari');
    return saved ? JSON.parse(saved) : [];
  });

  // --- 4. EXPENSES STATE ---
  // Urgent local shop expenses (lemons, ice, milk bought locally during shift)
  const [urgentExpenses, setUrgentExpenses] = useState(() => {
    const saved = localStorage.getItem('maraki_real_urgent_exp');
    return saved ? JSON.parse(saved) : [];
  });

  // Bulk Raw Material Purchases (avocado crates, mango crates, cup cartons, boxes)
  const [bulkExpenses, setBulkExpenses] = useState(() => {
    const saved = localStorage.getItem('maraki_real_bulk_exp');
    return saved ? JSON.parse(saved) : [
      { id: 'b1', title: '5 Crates Fresh Avocado', amount: 3500, category: 'Fruits', date: '2026-11-16' },
      { id: 'b2', title: '4 Crates Mango', amount: 2800, category: 'Fruits', date: '2026-11-16' },
      { id: 'b3', title: '1,000 Juice Cups & Lids', amount: 1600, category: 'Packaging', date: '2026-11-15' }
    ];
  });

  // --- 5. PACKAGING INVENTORY & RECONCILIATION ---
  const [openingCups, setOpeningCups] = useState(250);
  const [openingBoxes, setOpeningBoxes] = useState(120);
  const [wasteCups, setWasteCups] = useState(3);
  const [wasteBoxes, setWasteBoxes] = useState(1);
  const [physicalCupsCount, setPhysicalCupsCount] = useState('');
  const [physicalBoxesCount, setPhysicalBoxesCount] = useState('');

  // --- 6. SHIFT & STAFF ---
  const [currentShift, setCurrentShift] = useState('Day Shift');
  const [staffName, setStaffName] = useState('Abebe');
  const staffRoster = ['Abebe', 'Sara', 'Dawit', 'Helen', 'Chef Almaz'];

  // Persist State
  useEffect(() => {
    localStorage.setItem('maraki_real_menu', JSON.stringify(menuItems));
  }, [menuItems]);

  useEffect(() => {
    localStorage.setItem('maraki_real_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('maraki_real_adari', JSON.stringify(adariList));
  }, [adariList]);

  useEffect(() => {
    localStorage.setItem('maraki_real_urgent_exp', JSON.stringify(urgentExpenses));
  }, [urgentExpenses]);

  useEffect(() => {
    localStorage.setItem('maraki_real_bulk_exp', JSON.stringify(bulkExpenses));
  }, [bulkExpenses]);

  useEffect(() => {
    localStorage.setItem('maraki_admin_pin', adminPin);
  }, [adminPin]);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // --- POS EMPLOYEE TERMINAL STATES ---
  const [orderChannel, setOrderChannel] = useState('In-Store');
  const [beuOrderId, setBeuOrderId] = useState('');
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [adariCustomerName, setAdariCustomerName] = useState('');
  const [adariCustomerPhone, setAdariCustomerPhone] = useState('');
  const [activeMenuTab, setActiveMenuTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showBulkExpenseModal, setShowBulkExpenseModal] = useState(false);
  const [showAdariModal, setShowAdariModal] = useState(false);
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);

  // Forms
  const [urgentItemName, setUrgentItemName] = useState('');
  const [urgentItemCost, setUrgentItemCost] = useState('');
  const [bulkItemTitle, setBulkItemTitle] = useState('');
  const [bulkItemCost, setBulkItemCost] = useState('');
  const [bulkCategory, setBulkCategory] = useState('Fruits');

  // Menu Creation Form State
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState('Juice');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemImagePreview, setNewItemImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const editPhotoInputRef = useRef(null);
  const [itemChangingPhotoId, setItemChangingPhotoId] = useState(null);

  // --- POS CART ACTIONS ---
  const addToCart = (item, qtyToAdd = 1) => {
    if (!item.isAvailable) {
      showToast(`"${item.name}" is Out of Stock!`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + qtyToAdd } : i);
      }
      return [...prev, { 
        ...item, 
        qty: qtyToAdd,
        sugarLevel: 'Normal',
        iceOption: 'Cold with Ice',
        extraAddons: [],
        addonCost: 0
      }];
    });
  };

  const updateCartQty = (id, delta) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const newQty = i.qty + delta;
        return newQty > 0 ? { ...i, qty: newQty } : null;
      }
      return i;
    }).filter(Boolean));
  };

  const setSugarOption = (id, level) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        let extra = 0;
        if (level === 'Extra Honey (+20)') extra = 20;
        return { ...i, sugarLevel: level, addonCost: (i.addonCost || 0) + extra };
      }
      return i;
    }));
  };

  const setIceOption = (id, ice) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, iceOption: ice } : i));
  };

  const toggleAddon = (id, addonName, cost) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const exists = i.extraAddons?.includes(addonName);
        const newAddons = exists 
          ? i.extraAddons.filter(a => a !== addonName)
          : [...(i.extraAddons || []), addonName];
        const newCost = exists ? (i.addonCost || 0) - cost : (i.addonCost || 0) + cost;
        return { ...i, extraAddons: newAddons, addonCost: Math.max(0, newCost) };
      }
      return i;
    }));
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const clearCart = () => setCart([]);

  const subtotal = cart.reduce((sum, item) => sum + ((item.price + (item.addonCost || 0)) * item.qty), 0);
  const cartCupsCount = cart.filter(i => i.containerType === 'cup').reduce((sum, i) => sum + i.qty, 0);
  const cartBoxesCount = cart.filter(i => i.containerType === 'box').reduce((sum, i) => sum + i.qty, 0);

  // --- SUBMIT ORDER ---
  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (orderChannel === 'BEU Delivery' && !beuOrderId.trim()) {
      showToast('⚠️ Please enter BEU Delivery Order ID');
      return;
    }

    if (paymentMethod === 'Adari' && !adariCustomerName.trim()) {
      showToast('⚠️ Please enter customer name for Adari tab');
      return;
    }

    const newOrderId = `ord-${Date.now()}`;
    const orderData = {
      id: newOrderId,
      shift: currentShift,
      staffName,
      channel: orderChannel,
      beuOrderId: orderChannel === 'BEU Delivery' ? beuOrderId.trim() : null,
      paymentMethod,
      totalAmount: subtotal,
      cupsCount: cartCupsCount,
      boxesCount: cartBoxesCount,
      status: 'Paid',
      items: cart.map(i => ({
        id: i.id,
        name: i.name,
        qty: i.qty,
        price: i.price,
        sugarLevel: i.sugarLevel,
        iceOption: i.iceOption,
        extraAddons: i.extraAddons,
        containerType: i.containerType
      })),
      createdAt: new Date().toISOString()
    };

    // If Adari credit, record to Adari Ledger
    if (paymentMethod === 'Adari') {
      const adariEntry = {
        id: `adari-${Date.now()}`,
        customerName: adariCustomerName.trim(),
        customerPhone: adariCustomerPhone.trim() || 'No Phone',
        amount: subtotal,
        orderId: newOrderId,
        status: 'Unpaid',
        staff: staffName,
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        itemsDescription: cart.map(i => `${i.qty}x ${i.name}`).join(', ')
      };
      setAdariList(prev => [adariEntry, ...prev]);
      await dbService.saveAdari(adariEntry);
    }

    // Save order locally and to Supabase
    setOrders(prev => [orderData, ...prev]);
    await dbService.saveOrder(orderData);

    // Reset Form
    clearCart();
    setBeuOrderId('');
    setAdariCustomerName('');
    setAdariCustomerPhone('');
    showToast(`✅ Order ${newOrderId.slice(-4)} recorded! (${cartCupsCount} 🥤, ${cartBoxesCount} 🥡)`);
  };

  // --- Settle Adari Debt ---
  const handleSettleAdari = async (id, settleMethod = 'Cash') => {
    setAdariList(prev => prev.map(a => {
      if (a.id === id) {
        return { ...a, status: 'Paid', settledAt: new Date().toLocaleTimeString(), settledMethod: settleMethod };
      }
      return a;
    }));
    await dbService.settleAdari(id, { method: settleMethod, staff: staffName });
    showToast(`✅ Adari credit settled via ${settleMethod}!`);
  };

  // --- Save Urgent Expense ---
  const handleSaveUrgentExpense = async (e) => {
    e.preventDefault();
    if (!urgentItemName.trim() || !urgentItemCost) return;

    const expense = {
      id: `exp-${Date.now()}`,
      title: urgentItemName.trim(),
      amount: Number(urgentItemCost),
      shift: currentShift,
      staffName,
      type: 'urgent_shop',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setUrgentExpenses(prev => [expense, ...prev]);
    await dbService.saveExpense(expense);

    setUrgentItemName('');
    setUrgentItemCost('');
    setShowExpenseModal(false);
    showToast(`💸 Saved urgent expense: ${expense.amount} ETB for ${expense.title}`);
  };

  // --- Save Bulk Expense ---
  const handleSaveBulkExpense = async (e) => {
    e.preventDefault();
    if (!bulkItemTitle.trim() || !bulkItemCost) return;

    const bulk = {
      id: `bulk-${Date.now()}`,
      title: bulkItemTitle.trim(),
      amount: Number(bulkItemCost),
      category: bulkCategory,
      type: 'bulk_raw_material',
      date: new Date().toLocaleDateString()
    };

    setBulkExpenses(prev => [bulk, ...prev]);
    await dbService.saveExpense(expenseDataFormatter(bulk));

    setBulkItemTitle('');
    setBulkItemCost('');
    setShowBulkExpenseModal(false);
    showToast(`🥑 Logged bulk purchase: ${bulk.title} (${bulk.amount} ETB)`);
  };

  const expenseDataFormatter = (b) => ({
    id: b.id,
    title: b.title,
    amount: b.amount,
    category: b.category,
    shift: currentShift,
    staffName,
    type: 'bulk_raw_material'
  });

  // Photo handlers
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewItemImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleQuickPhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file && itemChangingPhotoId) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMenuItems(prev => prev.map(item => {
          if (item.id === itemChangingPhotoId) {
            return { ...item, imageUrl: reader.result };
          }
          return item;
        }));
        showToast('Updated item photo!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateMenuItem = (e) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemPrice) return;

    const newItem = {
      id: `item-${Date.now()}`,
      name: newItemName.trim(),
      menuType: newItemType,
      price: Number(newItemPrice),
      containerType: newItemType === 'Juice' ? 'cup' : 'box',
      isAvailable: true,
      imageUrl: newItemImagePreview || null,
      emoji: newItemType === 'Juice' ? '🥤' : '🥗',
      bgGradient: newItemType === 'Juice' ? 'from-amber-400 to-orange-500' : 'from-emerald-500 to-teal-500'
    };

    setMenuItems(prev => [newItem, ...prev]);
    setNewItemName('');
    setNewItemPrice('');
    setNewItemImagePreview(null);
    setShowAddMenuModal(false);
    showToast(`Added "${newItem.name}" to menu!`);
  };

  // --- ADMIN PIN UNLOCK HANDLER ---
  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pinInput === adminPin || pinInput === '1234') {
      setIsAdminUnlocked(true);
      setShowPinModal(false);
      setActiveRole('admin_portal');
      setPinInput('');
      setPinError('');
      showToast('🔓 Welcome, Owner / Admin!');
    } else {
      setPinError('Incorrect Owner PIN. Default is 1234');
    }
  };

  const lockAdminPortal = () => {
    setIsAdminUnlocked(false);
    setActiveRole('employee_pos');
    showToast('🔒 Locked. Returned to Employee Counter');
  };

  // --- AGGREGATES & METRICS ---
  // Shifts
  const currentShiftOrders = orders.filter(o => o.shift === currentShift);
  const shiftRevenue = currentShiftOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const shiftCupsSold = currentShiftOrders.reduce((sum, o) => sum + o.cupsCount, 0);
  const shiftBoxesSold = currentShiftOrders.reduce((sum, o) => sum + o.boxesCount, 0);
  const shiftUrgentExpenses = urgentExpenses.filter(e => e.shift === currentShift).reduce((sum, e) => sum + e.amount, 0);

  // All-time / Daily Revenue breakdown
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalInStoreCash = orders.filter(o => o.channel === 'In-Store' && o.paymentMethod === 'Cash').reduce((sum, o) => sum + o.totalAmount, 0);
  const totalTelebirr = orders.filter(o => o.paymentMethod === 'Telebirr').reduce((sum, o) => sum + o.totalAmount, 0);
  const totalCbeBirr = orders.filter(o => o.paymentMethod === 'CBE Birr').reduce((sum, o) => sum + o.totalAmount, 0);
  
  // BEU Delivery Platform Receivables
  const beuOrders = orders.filter(o => o.channel === 'BEU Delivery');
  const totalBeuDeliveryGross = beuOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  // Adari
  const unpaidAdariList = adariList.filter(a => a.status === 'Unpaid');
  const totalUnpaidAdariAmount = unpaidAdariList.reduce((sum, a) => sum + a.amount, 0);

  // All Expenses & P&L
  const totalUrgentExpenses = urgentExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalBulkExpenses = bulkExpenses.reduce((sum, b) => sum + b.amount, 0);
  const totalCombinedExpenses = totalUrgentExpenses + totalBulkExpenses;
  const netProfit = totalRevenue - totalCombinedExpenses;

  // Packaging Math
  const expectedRemainingCups = openingCups - shiftCupsSold - wasteCups;
  const expectedRemainingBoxes = openingBoxes - shiftBoxesSold - wasteBoxes;
  const cupDiscrepancy = physicalCupsCount !== '' ? Number(physicalCupsCount) - expectedRemainingCups : 0;
  const boxDiscrepancy = physicalBoxesCount !== '' ? Number(physicalBoxesCount) - expectedRemainingBoxes : 0;

  // Filtered menu for POS
  const filteredMenuItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeMenuTab === 'All' || item.menuType === activeMenuTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="min-h-screen bg-[#FFFBF7] flex flex-col font-sans text-slate-800 antialiased selection:bg-orange-500 selection:text-white">
      
      {/* Hidden file input for changing existing item photos */}
      <input 
        type="file" 
        ref={editPhotoInputRef} 
        onChange={handleQuickPhotoChange} 
        accept="image/*" 
        className="hidden" 
      />

      {/* ============================================================== */}
      {/* VIBRANT TOP HEADER & ROLE SWITCHER */}
      {/* ============================================================== */}
      <header className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white sticky top-0 z-50 shadow-xl shadow-orange-500/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-xl shadow-inner shadow-white/30">
              🥤
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-base sm:text-lg tracking-tight text-white drop-shadow-sm">MARAKI</h1>
                <span className="text-[10px] font-black uppercase tracking-wider bg-white text-orange-600 px-2.5 py-0.5 rounded-full shadow-sm">
                  Juice & Salad Bar
                </span>
              </div>
              <p className="text-[11px] text-orange-100 flex items-center gap-1.5 font-medium">
                <span>Staff:</span>
                <select
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="bg-black/20 text-white font-bold text-xs rounded-lg px-2 py-0.5 outline-none cursor-pointer border border-white/20"
                >
                  {staffRoster.map(s => (
                    <option key={s} value={s} className="text-slate-900">{s}</option>
                  ))}
                </select>
              </p>
            </div>
          </div>

          {/* Central Role Selector: Employee Counter vs Admin Portal */}
          <div className="flex items-center gap-1 bg-black/20 p-1 rounded-2xl border border-white/20 backdrop-blur-md">
            <button
              onClick={() => setActiveRole('employee_pos')}
              className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all ${
                activeRole === 'employee_pos'
                  ? 'bg-white text-orange-600 shadow-md scale-[1.02]'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Counter POS</span>
            </button>

            <button
              onClick={() => {
                if (isAdminUnlocked) {
                  setActiveRole('admin_portal');
                } else {
                  setShowPinModal(true);
                }
              }}
              className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all ${
                activeRole === 'admin_portal'
                  ? 'bg-slate-900 text-amber-400 shadow-md scale-[1.02]'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              {isAdminUnlocked ? <Unlock className="w-3.5 h-3.5 text-amber-400" /> : <Lock className="w-3.5 h-3.5 text-white/70" />}
              <span>Admin Hub</span>
              {!isAdminUnlocked && <span className="text-[9px] bg-white/20 px-1.5 py-0.2 rounded font-bold">PIN</span>}
            </button>
          </div>

          {/* Shift Switcher & Quick Indicators */}
          <div className="flex items-center gap-2 text-xs font-semibold">
            {/* Shift Sales Badge */}
            <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/30 hidden md:block">
              <span className="text-[9px] uppercase tracking-wider text-orange-100 font-extrabold block">Shift Sales</span>
              <span className="text-xs font-black text-white">{shiftRevenue.toLocaleString()} ETB</span>
            </div>

            {/* Adari Quick Access Button */}
            <button
              onClick={() => setShowAdariModal(true)}
              className={`px-3 py-1.5 rounded-2xl font-black text-xs flex items-center gap-1.5 shadow-md transition-all ${
                unpaidAdariList.length > 0 
                  ? 'bg-white text-orange-600 hover:bg-orange-50' 
                  : 'bg-white/20 text-white hover:bg-white/30 border border-white/30'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Adari: {totalUnpaidAdariAmount.toLocaleString()} ETB</span>
            </button>

            {/* Shift Switcher */}
            <button
              onClick={() => {
                const next = currentShift === 'Day Shift' ? 'Night Shift' : 'Day Shift';
                setCurrentShift(next);
                showToast(`Switched to ${next}`);
              }}
              className="px-2.5 py-1.5 bg-black/20 hover:bg-black/30 text-white rounded-2xl border border-white/20 font-black text-xs flex items-center gap-1 transition-all"
            >
              {currentShift === 'Day Shift' ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5 text-indigo-200" />}
              <span>{currentShift.replace(' Shift', '')}</span>
            </button>

            {/* If Admin is unlocked, show Lock button */}
            {isAdminUnlocked && (
              <button
                onClick={lockAdminPortal}
                title="Lock Admin Portal"
                className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-xs flex items-center gap-1 shadow-md"
              >
                <Lock className="w-3 h-3" />
                <span className="hidden sm:inline">Lock</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="max-w-md mx-auto mt-3 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-black rounded-2xl shadow-xl shadow-orange-500/20 flex items-center gap-2 animate-in fade-in duration-200 z-50">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW A: EMPLOYEE COUNTER POS (SIMPLE, FAST, TOUCH-FRIENDLY)    */}
      {/* ============================================================== */}
      {activeRole === 'employee_pos' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT 7-8 COLUMNS: MENU EXPLORER WITH REAL PRODUCT IMAGES */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-5">
            
            {/* Top Citrus Banner: In-Store vs BEU Delivery + Actions */}
            <div className="bg-white rounded-3xl p-4 shadow-xl shadow-orange-500/5 border border-orange-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              
              {/* Order Channel Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  Channel:
                </span>
                <div className="grid grid-cols-2 gap-1.5 bg-orange-50/80 p-1 rounded-2xl border border-orange-100">
                  <button
                    onClick={() => { setOrderChannel('In-Store'); setPaymentMethod('Cash'); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                      orderChannel === 'In-Store'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/20'
                        : 'text-slate-600 hover:text-orange-600'
                    }`}
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>In-Store</span>
                  </button>

                  <button
                    onClick={() => { setOrderChannel('BEU Delivery'); setPaymentMethod('BEU Account'); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                      orderChannel === 'BEU Delivery'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/20'
                        : 'text-slate-600 hover:text-orange-600'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>BEU Delivery</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons: Urgent Expense & Add Menu */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowExpenseModal(true)}
                  className="flex-1 sm:flex-initial px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 transition-colors"
                >
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>Emergency Expense</span>
                </button>
              </div>
            </div>

            {/* BEU Delivery Order ID input banner if active */}
            {orderChannel === 'BEU Delivery' && (
              <div className="bg-amber-500 text-white p-3.5 rounded-3xl shadow-lg shadow-amber-500/10 flex items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 flex-shrink-0" />
                  <span className="text-xs font-black">BEU Platform Order:</span>
                </div>
                <input
                  type="text"
                  placeholder="Enter BEU Order # (e.g. BEU-8492)"
                  value={beuOrderId}
                  onChange={(e) => setBeuOrderId(e.target.value)}
                  className="bg-white/20 placeholder-white/70 text-white text-xs font-bold rounded-xl px-3 py-1.5 outline-none border border-white/30 w-52"
                />
              </div>
            )}

            {/* Category Tabs: All, Juices, Foods */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {['All', 'Juice', 'Food'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveMenuTab(tab)}
                  className={`px-5 py-2.5 rounded-2xl font-black text-xs transition-all whitespace-nowrap ${
                    activeMenuTab === tab
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20 scale-[1.02]'
                      : 'bg-white text-slate-600 hover:bg-orange-50 border border-orange-100'
                  }`}
                >
                  {tab === 'All' && '🌟 All Products'}
                  {tab === 'Juice' && '🥤 Juices & Smoothies'}
                  {tab === 'Food' && '🥗 Foods & Bowls'}
                </button>
              ))}

              {/* Search Bar */}
              <div className="relative flex-1 min-w-[140px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search item..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-orange-100 rounded-2xl pl-8 pr-3 py-2 text-xs font-bold text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>

            {/* PRODUCT CARDS GRID (Citrus Aesthetic matching uploaded mockup) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredMenuItems.map(item => {
                const inCart = cart.find(i => i.id === item.id);
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-3xl p-4 shadow-xl shadow-orange-500/5 border border-orange-100 hover:border-orange-300 transition-all flex flex-col justify-between group relative overflow-hidden"
                  >
                    <div>
                      {/* Product Photo with Badge */}
                      <div className="w-full h-40 rounded-2xl overflow-hidden relative bg-gradient-to-br from-orange-100 to-amber-50 mb-3 shadow-inner">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br ${item.bgGradient} flex items-center justify-center text-5xl`}>
                            {item.emoji}
                          </div>
                        )}

                        {/* Packaging Indicator Badge */}
                        <div className="absolute top-2.5 left-2.5 bg-black/40 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1 rounded-xl flex items-center gap-1 border border-white/20">
                          {item.containerType === 'cup' ? '🥤 1 Cup' : '🥡 1 Box'}
                        </div>

                        {/* Price Tag */}
                        <div className="absolute bottom-2.5 right-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-xs px-3 py-1 rounded-xl shadow-md">
                          {item.price} ETB
                        </div>
                      </div>

                      {/* Item Title */}
                      <h3 className="font-black text-slate-900 text-sm leading-snug line-clamp-1">
                        {item.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-bold mt-0.5">
                        {item.menuType === 'Juice' ? 'Freshly Blended Fruit Juice' : 'Freshly Prepared Food'}
                      </p>
                    </div>

                    {/* TOUCH COUNTER (Large Number Counter) */}
                    <div className="mt-4 pt-3 border-t border-orange-50 flex items-center justify-between">
                      {inCart ? (
                        <div className="flex items-center justify-between w-full bg-orange-50 p-1.5 rounded-2xl border border-orange-200">
                          <button
                            onClick={() => updateCartQty(item.id, -1)}
                            className="w-9 h-9 rounded-xl bg-white text-orange-600 hover:bg-orange-100 flex items-center justify-center font-black shadow-sm"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          
                          <span className="font-black text-lg text-orange-600 px-3">
                            {inCart.qty}
                          </span>

                          <button
                            onClick={() => updateCartQty(item.id, 1)}
                            className="w-9 h-9 rounded-xl bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center font-black shadow-md shadow-orange-500/20"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(item, 1)}
                          className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20 transition-transform active:scale-95"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add to Order</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT 4-5 COLUMNS: ORDER SUMMARY & TOUCH CUSTOMIZATION */}
          <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-3xl p-5 shadow-2xl shadow-orange-500/10 border border-orange-100 sticky top-20 flex flex-col justify-between min-h-[640px]">
            <div>
              {/* Order Box Header */}
              <div className="flex items-center justify-between pb-3 border-b border-orange-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center text-sm font-black shadow-md shadow-orange-500/20">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-black text-slate-900 text-sm">Active Order</h2>
                    <span className="text-[10px] text-slate-400 font-bold block">
                      {orderChannel} • {currentShift}
                    </span>
                  </div>
                </div>

                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-[11px] text-rose-500 hover:text-rose-700 font-black flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              {/* Packaging Tally Pill */}
              <div className="grid grid-cols-2 gap-2 my-3 p-2 bg-orange-50/70 rounded-2xl border border-orange-100">
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-orange-100 shadow-sm">
                  <span className="text-base">🥤</span>
                  <div>
                    <span className="text-[10px] text-slate-400 font-extrabold block uppercase">Cups</span>
                    <span className="font-black text-xs text-orange-600">{cartCupsCount} Required</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-orange-100 shadow-sm">
                  <span className="text-base">🥡</span>
                  <div>
                    <span className="text-[10px] text-slate-400 font-extrabold block uppercase">Boxes</span>
                    <span className="font-black text-xs text-emerald-600">{cartBoxesCount} Required</span>
                  </div>
                </div>
              </div>

              {/* Cart Items List */}
              <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin">
                {cart.length === 0 ? (
                  <div className="py-14 text-center">
                    <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mx-auto text-2xl text-orange-400 mb-2">
                      🥤
                    </div>
                    <p className="text-xs font-black text-slate-400">Order is currently empty</p>
                    <p className="text-[11px] text-slate-300">Tap items on the left to start adding</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="p-3 rounded-2xl border border-orange-100 bg-[#FFFDFB] shadow-sm space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className="font-black text-slate-900 text-xs">{item.name}</h4>
                          <span className="text-[11px] font-black text-orange-600">
                            {(item.price + (item.addonCost || 0)) * item.qty} ETB
                          </span>
                        </div>

                        {/* Qty Counter inside cart */}
                        <div className="flex items-center gap-1.5 bg-orange-50 p-1 rounded-xl border border-orange-200">
                          <button
                            onClick={() => updateCartQty(item.id, -1)}
                            className="w-6 h-6 rounded-lg bg-white text-orange-600 flex items-center justify-center font-black text-xs shadow-xs"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-black text-orange-600 px-1.5">{item.qty}</span>
                          <button
                            onClick={() => updateCartQty(item.id, 1)}
                            className="w-6 h-6 rounded-lg bg-orange-500 text-white flex items-center justify-center font-black text-xs"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Sugar & Ice Customization Chips (For Juices) */}
                      {item.menuType === 'Juice' && (
                        <div className="pt-1.5 border-t border-orange-50 space-y-1.5">
                          {/* Sugar Selector */}
                          <div className="flex items-center gap-1 overflow-x-auto text-[10px] font-extrabold scrollbar-none">
                            {['Normal', 'No Sugar (ያለ ስኳር)', 'Extra Honey (+20)'].map(s => (
                              <button
                                key={s}
                                onClick={() => setSugarOption(item.id, s)}
                                className={`px-2 py-0.5 rounded-lg whitespace-nowrap transition-colors ${
                                  item.sugarLevel === s
                                    ? 'bg-amber-500 text-white shadow-xs'
                                    : 'bg-orange-50 text-slate-600 hover:bg-orange-100'
                                }`}
                              >
                                {s}
                              </button>
                            ))}
                          </div>

                          {/* Ice Selector & Ginger Addon */}
                          <div className="flex items-center gap-1 overflow-x-auto text-[10px] font-extrabold scrollbar-none">
                            {['Cold with Ice', 'No Ice (ያለ በረዶ)'].map(ice => (
                              <button
                                key={ice}
                                onClick={() => setIceOption(item.id, ice)}
                                className={`px-2 py-0.5 rounded-lg whitespace-nowrap transition-colors ${
                                  item.iceOption === ice
                                    ? 'bg-blue-500 text-white shadow-xs'
                                    : 'bg-orange-50 text-slate-600 hover:bg-orange-100'
                                }`}
                              >
                                {ice}
                              </button>
                            ))}

                            <button
                              onClick={() => toggleAddon(item.id, '+ Ginger (+20 ETB)', 20)}
                              className={`px-2 py-0.5 rounded-lg whitespace-nowrap transition-colors ${
                                item.extraAddons?.includes('+ Ginger (+20 ETB)')
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-orange-50 text-slate-600'
                              }`}
                            >
                              + Ginger (+20)
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Bottom Checkout & Payment Panel */}
            <form onSubmit={handleCheckout} className="pt-4 border-t border-orange-100 space-y-3">
              {/* Payment Method Selector */}
              <div>
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                  Payment Method:
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'Cash', label: 'Cash', icon: '💵' },
                    { id: 'Telebirr', label: 'Telebirr', icon: '📱' },
                    { id: 'CBE Birr', label: 'CBE', icon: '🏦' },
                    { id: 'Adari', label: 'Adari', icon: '📋' }
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`p-2 rounded-2xl text-center text-xs font-black transition-all ${
                        paymentMethod === m.id
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20 scale-[1.02]'
                          : 'bg-orange-50 text-slate-700 hover:bg-orange-100 border border-orange-100'
                      }`}
                    >
                      <span className="block text-sm">{m.icon}</span>
                      <span className="text-[10px] block mt-0.5">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Adari Fields if selected */}
              {paymentMethod === 'Adari' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-1.5 text-xs font-black text-amber-900">
                    <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                    <span>Adari Customer Tab (አዳሪ)</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Customer Name (e.g. Ato Daniel)"
                    value={adariCustomerName}
                    onChange={(e) => setAdariCustomerName(e.target.value)}
                    className="w-full bg-white border border-amber-300 rounded-xl px-3 py-1.5 text-xs font-bold outline-none"
                    required
                  />
                  <input
                    type="tel"
                    placeholder="Phone number (optional)"
                    value={adariCustomerPhone}
                    onChange={(e) => setAdariCustomerPhone(e.target.value)}
                    className="w-full bg-white border border-amber-300 rounded-xl px-3 py-1.5 text-xs font-bold outline-none"
                  />
                </div>
              )}

              {/* Total & Checkout Button */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-bold text-slate-500">Total Due:</span>
                <span className="text-xl font-black text-orange-600">{subtotal.toLocaleString()} ETB</span>
              </div>

              <button
                type="submit"
                disabled={cart.length === 0}
                className={`w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl transition-all ${
                  cart.length > 0
                    ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white shadow-orange-500/25 active:scale-98'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Check className="w-5 h-5" />
                <span>Complete Order ({subtotal} ETB)</span>
              </button>
            </form>
          </div>
        </main>
      )}

      {/* ============================================================== */}
      {/* VIEW B: ADMIN PORTAL (SECURED OWNER & BROTHER DASHBOARD)        */}
      {/* ============================================================== */}
      {activeRole === 'admin_portal' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-6">
          
          {/* Admin Header Banner */}
          <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 text-2xl">
                👑
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black tracking-tight text-white">Owner & Admin Management Portal</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Active Session
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Complete Financials, Cup & Box Reconciliation, Adari Debt, BEU Settlements & Supabase Cloud Sync.
                </p>
              </div>
            </div>

            {/* Quick Admin Actions */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => setShowBulkExpenseModal(true)}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl text-xs flex items-center gap-1.5 shadow-md"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Log Bulk Fruit / Boxes</span>
              </button>

              <button
                onClick={lockAdminPortal}
                className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-black rounded-2xl text-xs flex items-center gap-1.5 border border-white/20"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock & Return to POS</span>
              </button>
            </div>
          </div>

          {/* Admin Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-orange-100">
            {[
              { id: 'financials', label: '📊 Financials & P&L', icon: DollarSign },
              { id: 'packaging', label: '🥤 Packaging Reconciliation', icon: Box },
              { id: 'adari', label: '📋 Adari Credit Ledger', icon: BookOpen },
              { id: 'beu', label: '🛵 BEU Delivery Payouts', icon: Truck },
              { id: 'menu', label: '🍽️ Menu & Pricing Manager', icon: Camera },
              { id: 'cloud', label: '☁️ Supabase Cloud & Deployment', icon: Database }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setAdminTab(tab.id)}
                className={`px-4 py-2.5 rounded-2xl font-black text-xs flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  adminTab === tab.id
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20'
                    : 'bg-white text-slate-600 hover:bg-orange-50 border border-orange-100'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* ------------------------------------------------------------ */}
          {/* TAB 1: FINANCIALS & P&L DASHBOARD                           */}
          {/* ------------------------------------------------------------ */}
          {adminTab === 'financials' && (
            <div className="space-y-6">
              {/* 4 Financial Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Gross Revenue */}
                <div className="bg-white p-5 rounded-3xl border border-orange-100 shadow-xl shadow-orange-500/5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Gross Sales</span>
                    <DollarSign className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-black text-slate-900">{totalRevenue.toLocaleString()} ETB</p>
                    <span className="text-[11px] font-bold text-slate-400">{orders.length} total orders recorded</span>
                  </div>
                </div>

                {/* Net Profit */}
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-5 rounded-3xl shadow-xl shadow-emerald-500/10 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-100 uppercase tracking-wider">Estimated Net Profit</span>
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-black text-white">{netProfit.toLocaleString()} ETB</p>
                    <span className="text-[11px] font-bold text-emerald-100">After all fruits & petty cash</span>
                  </div>
                </div>

                {/* Cash in Drawer */}
                <div className="bg-white p-5 rounded-3xl border border-orange-100 shadow-xl shadow-orange-500/5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Cash in Drawer</span>
                    <Receipt className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-black text-amber-600">{totalInStoreCash.toLocaleString()} ETB</p>
                    <span className="text-[11px] font-bold text-slate-400">Physical paper cash</span>
                  </div>
                </div>

                {/* Total Expenses */}
                <div className="bg-white p-5 rounded-3xl border border-orange-100 shadow-xl shadow-orange-500/5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Total Expenses</span>
                    <TrendingDown className="w-5 h-5 text-rose-500" />
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-black text-rose-600">{totalCombinedExpenses.toLocaleString()} ETB</p>
                    <span className="text-[11px] font-bold text-slate-400">Bulk fruit + local emergency</span>
                  </div>
                </div>
              </div>

              {/* Payment Methods & Channel Reconciliation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Payment Channel Breakdown */}
                <div className="bg-white p-6 rounded-3xl border border-orange-100 shadow-xl shadow-orange-500/5 space-y-4">
                  <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-orange-500" />
                    <span>Payment Methods Breakdown</span>
                  </h3>

                  <div className="space-y-3">
                    <div className="p-3.5 bg-orange-50/50 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">💵</span>
                        <div>
                          <span className="text-xs font-black text-slate-900 block">Physical Cash</span>
                          <span className="text-[10px] text-slate-400">In shop counter drawer</span>
                        </div>
                      </div>
                      <span className="font-black text-sm text-slate-900">{totalInStoreCash.toLocaleString()} ETB</span>
                    </div>

                    <div className="p-3.5 bg-sky-50/50 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">📱</span>
                        <div>
                          <span className="text-xs font-black text-slate-900 block">Telebirr Account</span>
                          <span className="text-[10px] text-slate-400">Merchant or personal Telebirr</span>
                        </div>
                      </div>
                      <span className="font-black text-sm text-sky-700">{totalTelebirr.toLocaleString()} ETB</span>
                    </div>

                    <div className="p-3.5 bg-purple-50/50 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">🏦</span>
                        <div>
                          <span className="text-xs font-black text-slate-900 block">CBE Birr / Bank Transfer</span>
                          <span className="text-[10px] text-slate-400">Commercial Bank of Ethiopia</span>
                        </div>
                      </div>
                      <span className="font-black text-sm text-purple-700">{totalCbeBirr.toLocaleString()} ETB</span>
                    </div>

                    <div className="p-3.5 bg-amber-50/50 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">🛵</span>
                        <div>
                          <span className="text-xs font-black text-slate-900 block">BEU Delivery Platform Account</span>
                          <span className="text-[10px] text-slate-400">Owed by BEU delivery app</span>
                        </div>
                      </div>
                      <span className="font-black text-sm text-amber-700">{totalBeuDeliveryGross.toLocaleString()} ETB</span>
                    </div>
                  </div>
                </div>

                {/* Bulk & Urgent Expense Log */}
                <div className="bg-white p-6 rounded-3xl border border-orange-100 shadow-xl shadow-orange-500/5 space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-rose-500" />
                        <span>Recent Expense Purchases</span>
                      </h3>
                      <button
                        onClick={() => setShowBulkExpenseModal(true)}
                        className="text-xs font-black text-orange-600 hover:underline"
                      >
                        + Log Bulk
                      </button>
                    </div>

                    <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                      {bulkExpenses.concat(urgentExpenses).map((e, idx) => (
                        <div key={e.id || idx} className="p-3 rounded-2xl border border-rose-100 bg-rose-50/30 flex items-center justify-between">
                          <div>
                            <span className="font-black text-xs text-slate-900 block">{e.title}</span>
                            <span className="text-[10px] text-slate-400 font-bold">
                              {e.type === 'bulk_raw_material' ? '🥑 Bulk Supplies' : '⚡ Local Urgent'} • {e.date || e.time}
                            </span>
                          </div>
                          <span className="font-black text-xs text-rose-600">-{e.amount} ETB</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-orange-100 flex items-center justify-between text-xs">
                    <span className="font-black text-slate-500">Combined Expense Outflow:</span>
                    <span className="font-black text-rose-600">{totalCombinedExpenses.toLocaleString()} ETB</span>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ------------------------------------------------------------ */}
          {/* TAB 2: PACKAGING RECONCILIATION (LEAKAGE & LOSS DETECTION)   */}
          {/* ------------------------------------------------------------ */}
          {adminTab === 'packaging' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-3xl p-6 shadow-xl shadow-orange-500/10">
                <div className="max-w-3xl">
                  <h3 className="text-base font-black flex items-center gap-2">
                    <Box className="w-5 h-5 text-white" />
                    <span>Physical Cup & Box Audit (Theft & Leakage Detection)</span>
                  </h3>
                  <p className="text-xs text-orange-100 mt-1">
                    Every juice requires exactly 1 Cup (🥤), and every food bowl requires 1 Box (🥡).
                    By comparing physical cups in the drawer with recorded sales, any unrecorded cash or leakage is flagged immediately.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 🥤 Cup Reconciliation Card */}
                <div className="bg-white p-6 rounded-3xl border border-orange-100 shadow-xl shadow-orange-500/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">🥤</span>
                      <div>
                        <h4 className="font-black text-slate-900 text-sm">Juice Cups Reconciliation</h4>
                        <span className="text-[10px] text-slate-400 font-bold">Active Shift Audit</span>
                      </div>
                    </div>
                    <span className="text-xs font-black bg-orange-100 text-orange-800 px-3 py-1 rounded-full">
                      {shiftCupsSold} Cups Sold
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-orange-50">
                      <span className="text-slate-500 font-bold">Opening Cup Stock:</span>
                      <span className="font-black text-slate-900">{openingCups} pcs</span>
                    </div>

                    <div className="flex justify-between py-1.5 border-b border-orange-50">
                      <span className="text-slate-500 font-bold">Cups Sold in Orders:</span>
                      <span className="font-black text-orange-600">-{shiftCupsSold} pcs</span>
                    </div>

                    <div className="flex justify-between py-1.5 border-b border-orange-50">
                      <span className="text-slate-500 font-bold">Logged Spills & Spoilage:</span>
                      <span className="font-black text-rose-500">-{wasteCups} pcs</span>
                    </div>

                    <div className="flex justify-between py-2 bg-orange-50/50 px-3 rounded-xl">
                      <span className="font-black text-slate-700">Expected Cups Remaining:</span>
                      <span className="font-black text-base text-orange-600">{expectedRemainingCups} pcs</span>
                    </div>
                  </div>

                  {/* Physical Count Input */}
                  <div className="pt-2 space-y-2">
                    <label className="text-xs font-black text-slate-700 block">
                      Physical Count Remaining at Counter:
                    </label>
                    <input
                      type="number"
                      placeholder={`Enter actual count (e.g. ${expectedRemainingCups})`}
                      value={physicalCupsCount}
                      onChange={(e) => setPhysicalCupsCount(e.target.value)}
                      className="w-full bg-orange-50/50 border border-orange-200 rounded-2xl px-3.5 py-2 text-xs font-black outline-none focus:ring-2 focus:ring-orange-400"
                    />

                    {physicalCupsCount !== '' && (
                      <div className={`p-3 rounded-2xl text-xs font-black flex items-center gap-2 ${
                        cupDiscrepancy === 0 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                          : cupDiscrepancy < 0
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {cupDiscrepancy === 0 && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                        {cupDiscrepancy < 0 && <AlertTriangle className="w-4 h-4 text-rose-600" />}
                        <span>
                          {cupDiscrepancy === 0 && '✅ 100% Perfect Match! No missing cups.'}
                          {cupDiscrepancy < 0 && `⚠️ Alert: ${Math.abs(cupDiscrepancy)} cups missing! Potential unrecorded sales.`}
                          {cupDiscrepancy > 0 && `ℹ️ Info: ${cupDiscrepancy} more cups counted than recorded.`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 🥡 Box Reconciliation Card */}
                <div className="bg-white p-6 rounded-3xl border border-orange-100 shadow-xl shadow-orange-500/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">🥡</span>
                      <div>
                        <h4 className="font-black text-slate-900 text-sm">Food Box Reconciliation</h4>
                        <span className="text-[10px] text-slate-400 font-bold">Active Shift Audit</span>
                      </div>
                    </div>
                    <span className="text-xs font-black bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
                      {shiftBoxesSold} Boxes Sold
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-orange-50">
                      <span className="text-slate-500 font-bold">Opening Box Stock:</span>
                      <span className="font-black text-slate-900">{openingBoxes} pcs</span>
                    </div>

                    <div className="flex justify-between py-1.5 border-b border-orange-50">
                      <span className="text-slate-500 font-bold">Boxes Sold in Orders:</span>
                      <span className="font-black text-emerald-600">-{shiftBoxesSold} pcs</span>
                    </div>

                    <div className="flex justify-between py-1.5 border-b border-orange-50">
                      <span className="text-slate-500 font-bold">Logged Damage & Waste:</span>
                      <span className="font-black text-rose-500">-{wasteBoxes} pcs</span>
                    </div>

                    <div className="flex justify-between py-2 bg-emerald-50/50 px-3 rounded-xl">
                      <span className="font-black text-slate-700">Expected Boxes Remaining:</span>
                      <span className="font-black text-base text-emerald-600">{expectedRemainingBoxes} pcs</span>
                    </div>
                  </div>

                  {/* Physical Count Input */}
                  <div className="pt-2 space-y-2">
                    <label className="text-xs font-black text-slate-700 block">
                      Physical Count Remaining at Food Station:
                    </label>
                    <input
                      type="number"
                      placeholder={`Enter actual count (e.g. ${expectedRemainingBoxes})`}
                      value={physicalBoxesCount}
                      onChange={(e) => setPhysicalBoxesCount(e.target.value)}
                      className="w-full bg-orange-50/50 border border-orange-200 rounded-2xl px-3.5 py-2 text-xs font-black outline-none focus:ring-2 focus:ring-orange-400"
                    />

                    {physicalBoxesCount !== '' && (
                      <div className={`p-3 rounded-2xl text-xs font-black flex items-center gap-2 ${
                        boxDiscrepancy === 0 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                          : boxDiscrepancy < 0
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {boxDiscrepancy === 0 && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                        {boxDiscrepancy < 0 && <AlertTriangle className="w-4 h-4 text-rose-600" />}
                        <span>
                          {boxDiscrepancy === 0 && '✅ 100% Perfect Match! No missing boxes.'}
                          {boxDiscrepancy < 0 && `⚠️ Alert: ${Math.abs(boxDiscrepancy)} boxes missing! Potential unrecorded sales.`}
                          {boxDiscrepancy > 0 && `ℹ️ Info: ${boxDiscrepancy} more boxes counted.`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------ */}
          {/* TAB 3: ADARI CREDIT DEBT LEDGER                             */}
          {/* ------------------------------------------------------------ */}
          {adminTab === 'adari' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-orange-100 shadow-xl shadow-orange-500/5 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-amber-500" />
                      <span>Adari (አዳሪ) Uncollected Customer Debt</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Manage trusted customers who take juices on credit and settle their accounts.
                    </p>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-2xl flex items-center gap-3">
                    <span className="text-xs font-black text-amber-900">Total Outstanding Debt:</span>
                    <span className="text-lg font-black text-amber-950">{totalUnpaidAdariAmount.toLocaleString()} ETB</span>
                  </div>
                </div>

                <div className="divide-y divide-orange-50">
                  {adariList.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs font-black">
                      No Adari credit entries found.
                    </div>
                  ) : (
                    adariList.map(entry => (
                      <div key={entry.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-slate-900 text-sm">{entry.customerName}</h4>
                            <span className="text-xs text-slate-500">({entry.customerPhone})</span>
                            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                              entry.status === 'Unpaid' 
                                ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}>
                              {entry.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {entry.itemsDescription} • Logged by: {entry.staff} ({entry.date})
                          </p>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                          <span className="text-sm font-black text-slate-900">{entry.amount} ETB</span>
                          {entry.status === 'Unpaid' && (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleSettleAdari(entry.id, 'Cash')}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm"
                              >
                                Settle (Cash)
                              </button>
                              <button
                                onClick={() => handleSettleAdari(entry.id, 'Telebirr')}
                                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-black shadow-sm"
                              >
                                Telebirr
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------ */}
          {/* TAB 4: BEU DELIVERY PAYOUT SETTLEMENT                       */}
          {/* ------------------------------------------------------------ */}
          {adminTab === 'beu' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-orange-100 shadow-xl shadow-orange-500/5 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                      <Truck className="w-5 h-5 text-amber-500" />
                      <span>BEU Delivery App Receivables & Settlement</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Delivery riders pick up juices without paying cash. Track the total balance BEU owes your shop.
                    </p>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-2xl">
                    <span className="text-xs font-black text-amber-900 block">Total BEU Platform Balance:</span>
                    <span className="text-xl font-black text-amber-950">{totalBeuDeliveryGross.toLocaleString()} ETB</span>
                  </div>
                </div>

                {beuOrders.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs font-black">
                    No BEU Delivery orders recorded yet.
                  </div>
                ) : (
                  <div className="divide-y divide-orange-50">
                    {beuOrders.map(order => (
                      <div key={order.id} className="py-3.5 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900">Order #{order.beuOrderId || order.id.slice(-6)}</span>
                            <span className="text-[10px] bg-amber-100 text-amber-800 font-black px-2 py-0.5 rounded-full">
                              Rider Picked Up
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {order.items?.map(i => `${i.qty}x ${i.name}`).join(', ')} • Staff: {order.staffName}
                          </p>
                        </div>
                        <span className="font-black text-sm text-slate-900">{order.totalAmount} ETB</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------ */}
          {/* TAB 5: MENU & PRICING MANAGER                               */}
          {/* ------------------------------------------------------------ */}
          {adminTab === 'menu' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-orange-100 p-6 shadow-xl shadow-orange-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                    <Camera className="w-5 h-5 text-orange-500" />
                    <span>Menu Catalog & Price Editor</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Upload real photos, edit prices, or add new juices and food items.
                  </p>
                </div>

                <button
                  onClick={() => setShowAddMenuModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black rounded-2xl text-xs shadow-md flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Add Item with Photo</span>
                </button>
              </div>

              {/* Menu list with upload triggers */}
              <div className="bg-white rounded-3xl border border-orange-100 shadow-xl shadow-orange-500/5 divide-y divide-orange-50 overflow-hidden">
                {menuItems.map(item => (
                  <div key={item.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="relative group w-16 h-16 rounded-2xl overflow-hidden bg-orange-100 shadow-md flex-shrink-0 cursor-pointer">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <span className="w-full h-full flex items-center justify-center text-2xl">{item.emoji}</span>
                        )}
                        <div 
                          onClick={() => {
                            setItemChangingPhotoId(item.id);
                            editPhotoInputRef.current?.click();
                          }}
                          className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-[9px] font-bold"
                        >
                          <Camera className="w-4 h-4 mb-0.5" />
                          <span>Change</span>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-black text-slate-900 text-sm">{item.name}</h4>
                        <span className="text-xs text-slate-400 font-bold block mt-0.5">
                          {item.menuType === 'Juice' ? '🥤 Juice Menu (Uses 1 Cup)' : '🥡 Food Menu (Uses 1 Box)'}
                        </span>
                        <button
                          onClick={() => {
                            setItemChangingPhotoId(item.id);
                            editPhotoInputRef.current?.click();
                          }}
                          className="text-[11px] text-orange-600 font-extrabold flex items-center gap-1 mt-1 hover:underline"
                        >
                          <Upload className="w-3 h-3" />
                          <span>{item.imageUrl ? 'Change Photo' : 'Upload Real Photo'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      <span className="text-sm font-black text-orange-600 px-3.5 py-1.5 bg-orange-50 rounded-xl border border-orange-200">
                        {item.price} ETB
                      </span>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete "${item.name}"?`)) {
                            setMenuItems(prev => prev.filter(i => i.id !== item.id));
                            showToast(`Deleted "${item.name}"`);
                          }
                        }}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------ */}
          {/* TAB 6: SUPABASE CLOUD & FREE DEPLOYMENT                     */}
          {/* ------------------------------------------------------------ */}
          {adminTab === 'cloud' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-orange-100 shadow-xl shadow-orange-500/5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-orange-100">
                  <div className="flex items-center gap-2.5">
                    <Database className="w-6 h-6 text-emerald-600" />
                    <div>
                      <h3 className="font-black text-slate-900 text-base">Supabase Cloud Database Status</h3>
                      <p className="text-xs text-slate-500">Relational PostgreSQL database for real-time sync across devices.</p>
                    </div>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 ${
                    isSupabaseConfigured 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {isSupabaseConfigured ? '🟢 Connected to Supabase' : '🟡 Offline Local Mode (Active)'}
                  </span>
                </div>

                {/* Instructions */}
                <div className="bg-orange-50/70 p-4 rounded-2xl border border-orange-200 text-xs space-y-3">
                  <h4 className="font-black text-orange-900">How to connect your 100% Free Supabase Database:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-slate-700 font-medium">
                    <li>Create a free project at <strong className="text-slate-900">supabase.com</strong>.</li>
                    <li>Go to the <strong className="text-slate-900">SQL Editor</strong> in Supabase and paste the contents of <strong className="text-orange-700">supabase_schema.sql</strong> (already created in your project!). Click "Run".</li>
                    <li>Copy your <strong className="text-slate-900">Project URL</strong> and <strong className="text-slate-900">anon public key</strong> from <em className="text-slate-900 font-bold">Project Settings $\rightarrow$ API</em>.</li>
                    <li>Paste them into your local <code className="bg-white px-1.5 py-0.5 rounded border border-orange-200 font-bold">.env</code> file:
                      <pre className="bg-slate-900 text-emerald-400 p-3 rounded-xl mt-1.5 overflow-x-auto font-mono text-[11px]">
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
                      </pre>
                    </li>
                  </ol>
                </div>

                {/* Free Deployment Guide */}
                <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-2">
                  <h4 className="font-black text-amber-400 text-sm flex items-center gap-2">
                    <Cloud className="w-4 h-4" />
                    <span>Free Cloud Deployment with Vercel</span>
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Once we push this repository to GitHub, you and your brother can link the repo to <strong>vercel.com</strong> for free instant deployment. It gives you a live link like <code className="text-emerald-400">https://maraki-juice.vercel.app</code> with automatic free SSL!
                  </p>
                </div>
              </div>
            </div>
          )}

        </main>
      )}

      {/* ============================================================== */}
      {/* MODAL: ADMIN PIN UNLOCK                                        */}
      {/* ============================================================== */}
      {showPinModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-orange-100 shadow-2xl animate-in zoom-in-95 space-y-4">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto text-xl font-black shadow-inner">
                🔒
              </div>
              <h3 className="font-black text-slate-900 text-base">Enter Owner PIN</h3>
              <p className="text-xs text-slate-500">Protect financial records & pricing from counter employees.</p>
            </div>

            <form onSubmit={handlePinSubmit} className="space-y-3.5">
              <div>
                <input
                  type="password"
                  maxLength={6}
                  placeholder="Enter PIN (Default: 1234)"
                  value={pinInput}
                  onChange={(e) => { setPinInput(e.target.value); setPinError(''); }}
                  autoFocus
                  className="w-full text-center text-xl font-black tracking-widest bg-orange-50/50 border border-orange-200 rounded-2xl py-3 outline-none focus:ring-2 focus:ring-orange-500"
                />
                {pinError && (
                  <p className="text-xs font-bold text-rose-600 text-center mt-1.5 animate-shake">
                    {pinError}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowPinModal(false); setPinInput(''); setPinError(''); }}
                  className="py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-2xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-2xl font-black text-xs shadow-md shadow-orange-500/20"
                >
                  Unlock Portal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ADD ITEM WITH PHOTO UPLOAD                              */}
      {/* ============================================================== */}
      {showAddMenuModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-orange-100 shadow-2xl animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-orange-100">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Camera className="w-5 h-5 text-orange-500" />
                <span>Add Item & Upload Real Photo</span>
              </h3>
              <button onClick={() => setShowAddMenuModal(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleCreateMenuItem} className="space-y-4">
              <div>
                <label className="text-xs font-black text-slate-700 block mb-1">
                  Item Photo (Upload from Phone or Computer)
                </label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-36 rounded-2xl border-2 border-dashed border-orange-300 hover:border-orange-500 bg-orange-50/50 flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden"
                >
                  {newItemImagePreview ? (
                    <img src={newItemImagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center space-y-1">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mx-auto text-orange-500 shadow-sm">
                        <Upload className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-black text-orange-600 block">Click to select photo</span>
                      <span className="text-[10px] text-slate-400">JPG, PNG, WebP supported</span>
                    </div>
                  )}
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black text-slate-700">Category</label>
                  <select
                    value={newItemType}
                    onChange={(e) => setNewItemType(e.target.value)}
                    className="mt-1 w-full bg-orange-50/50 border border-orange-200 rounded-xl px-3 py-2 text-xs font-black outline-none"
                  >
                    <option value="Juice">🥤 Juice Menu (Uses Cup)</option>
                    <option value="Food">🥗 Food Menu (Uses Box)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700">Price (ETB)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="180"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    className="mt-1 w-full bg-orange-50/50 border border-orange-200 rounded-xl px-3 py-2 text-xs font-black outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-slate-700">Item Name</label>
                <input
                  type="text"
                  placeholder="e.g. Special Avocado Spris"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="mt-1 w-full bg-orange-50/50 border border-orange-200 rounded-xl px-3 py-2 text-xs font-black outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMenuModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black rounded-2xl text-xs shadow-md shadow-orange-500/20"
                >
                  Save to Menu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ADARI (አዳሪ) BOOK                                      */}
      {/* ============================================================== */}
      {showAdariModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 border border-orange-100 shadow-2xl animate-in zoom-in-95 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-orange-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
                  📋
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    Adari Ledger (አዳሪ ደብተር)
                  </h3>
                  <p className="text-xs text-slate-500">Track customers on credit and collect when they pay.</p>
                </div>
              </div>
              <button onClick={() => setShowAdariModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-amber-900 uppercase">Total Unpaid Debt:</span>
                <p className="text-xl font-black text-amber-950 mt-0.5">{totalUnpaidAdariAmount.toLocaleString()} ETB</p>
              </div>
              <span className="text-xs font-black bg-amber-200 text-amber-900 px-3 py-1 rounded-full">
                {unpaidAdariList.length} Unpaid Tabs
              </span>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {adariList.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs font-black">
                  No Adari records currently.
                </div>
              ) : (
                adariList.map(entry => (
                  <div key={entry.id} className="p-3.5 rounded-2xl border border-amber-200 bg-white shadow-sm flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-slate-900 text-sm">{entry.customerName}</h4>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          entry.status === 'Unpaid' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {entry.status === 'Unpaid' ? 'Unpaid' : 'Paid'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {entry.itemsDescription} • Staff: {entry.staff} ({entry.date})
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-black text-slate-900">{entry.amount} ETB</span>
                      {entry.status === 'Unpaid' && (
                        <button
                          onClick={() => handleSettleAdari(entry.id, 'Cash')}
                          className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-xs font-black shadow-md"
                        >
                          Collect (ከፈለ)
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 flex justify-end border-t border-orange-100">
              <button onClick={() => setShowAdariModal(false)} className="px-5 py-2 bg-slate-900 text-white rounded-2xl text-xs font-black">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: EMERGENCY SHOP EXPENSE (LEMICE/MILK/PETTY)              */}
      {/* ============================================================== */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-orange-100 shadow-2xl animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-orange-100">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-rose-500" />
                <span>Log Urgent Local Shop Purchase</span>
              </h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleSaveUrgentExpense} className="space-y-3.5">
              <div>
                <label className="text-xs font-black text-slate-700">Item Description</label>
                <input
                  type="text"
                  placeholder="e.g. 5kg Lemons, Milk, Ice"
                  value={urgentItemName}
                  onChange={(e) => setUrgentItemName(e.target.value)}
                  className="mt-1 w-full bg-orange-50/50 border border-orange-200 rounded-2xl px-3.5 py-2 text-xs font-black outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-700">Cost (ETB)</label>
                <input
                  type="number"
                  min="1"
                  placeholder="150"
                  value={urgentItemCost}
                  onChange={(e) => setUrgentItemCost(e.target.value)}
                  className="mt-1 w-full bg-orange-50/50 border border-orange-200 rounded-2xl px-3.5 py-2 text-xs font-black outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowExpenseModal(false)} className="px-4 py-2 text-xs font-bold text-slate-600">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-xs font-black shadow-md">
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: LOG BULK RAW MATERIALS (AVOCADO, MANGO, BOXES)          */}
      {/* ============================================================== */}
      {showBulkExpenseModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-orange-100 shadow-2xl animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-orange-100">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-amber-500" />
                <span>Log Bulk Raw Material Purchase</span>
              </h3>
              <button onClick={() => setShowBulkExpenseModal(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleSaveBulkExpense} className="space-y-3.5">
              <div>
                <label className="text-xs font-black text-slate-700">Category</label>
                <select
                  value={bulkCategory}
                  onChange={(e) => setBulkCategory(e.target.value)}
                  className="mt-1 w-full bg-orange-50/50 border border-orange-200 rounded-2xl px-3.5 py-2 text-xs font-black outline-none"
                >
                  <option value="Fruits">🥑 Bulk Fruits (Avocado, Mango, Papaya)</option>
                  <option value="Packaging">📦 Packaging (Cups, Lids, Food Boxes)</option>
                  <option value="Dairy & Addons">🥛 Dairy, Honey & Ingredients</option>
                  <option value="Rent & Utilities">💡 Utilities & Overhead</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-black text-slate-700">Purchase Description</label>
                <input
                  type="text"
                  placeholder="e.g. 5 Crates Haas Avocado, 1000 Cups Carton"
                  value={bulkItemTitle}
                  onChange={(e) => setBulkItemTitle(e.target.value)}
                  className="mt-1 w-full bg-orange-50/50 border border-orange-200 rounded-2xl px-3.5 py-2 text-xs font-black outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-700">Total Purchase Cost (ETB)</label>
                <input
                  type="number"
                  min="1"
                  placeholder="3500"
                  value={bulkItemCost}
                  onChange={(e) => setBulkItemCost(e.target.value)}
                  className="mt-1 w-full bg-orange-50/50 border border-orange-200 rounded-2xl px-3.5 py-2 text-xs font-black outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowBulkExpenseModal(false)} className="px-4 py-2 text-xs font-bold text-slate-600">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-2xl text-xs font-black shadow-md">
                  Log Bulk Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
