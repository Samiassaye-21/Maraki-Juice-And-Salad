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
  Sun, 
  Moon, 
  Truck, 
  Scale, 
  BookOpen, 
  Phone,
  Camera, 
  Upload, 
  ImageIcon,
  Heart
} from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState('staff_terminal');

  // 1. Menu State with High-Res Real Photography & Image Upload Support
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

  // 2. Orders State
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('maraki_real_orders');
    return saved ? JSON.parse(saved) : [];
  });

  // 3. Adari (አዳሪ) Unpaid Customer Credit Ledger
  const [adariList, setAdariList] = useState(() => {
    const saved = localStorage.getItem('maraki_real_adari');
    return saved ? JSON.parse(saved) : [];
  });

  // 4. Urgent Expenses State
  const [urgentExpenses, setUrgentExpenses] = useState(() => {
    const saved = localStorage.getItem('maraki_real_urgent_exp');
    return saved ? JSON.parse(saved) : [];
  });

  // 5. Shift & Staff State
  const [currentShift, setCurrentShift] = useState('Day Shift');
  const [staffName, setStaffName] = useState('Abebe');

  // Persist to localStorage
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

  // Toast Notification
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // --- STAFF TERMINAL STATES ---
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
  const [showShiftCloseModal, setShowShiftCloseModal] = useState(false);
  const [showAdariModal, setShowAdariModal] = useState(false);

  // Forms
  const [urgentItemName, setUrgentItemName] = useState('');
  const [urgentItemCost, setUrgentItemCost] = useState('');

  // Settle Adari Form State
  const [settlingAdariId, setSettlingAdariId] = useState(null);
  const [settleMethod, setSettleMethod] = useState('Cash');

  // Image Upload Form State
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState('Juice');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemImagePreview, setNewItemImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  // Quick photo upload ref for existing items
  const editPhotoInputRef = useRef(null);
  const [itemChangingPhotoId, setItemChangingPhotoId] = useState(null);

  const staffRoster = ['Abebe', 'Sara', 'Dawit', 'Helen', 'Chef Almaz'];

  // Add Item to Cart
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

  // Calculations for current order
  const orderTotal = cart.reduce((sum, i) => sum + ((i.price + (i.addonCost || 0)) * i.qty), 0);
  const orderCups = cart.filter(i => i.containerType === 'cup').reduce((sum, i) => sum + i.qty, 0);
  const orderBoxes = cart.filter(i => i.containerType === 'box').reduce((sum, i) => sum + i.qty, 0);

  // Complete Order
  const handleCompleteOrder = () => {
    if (cart.length === 0) return;
    if (orderChannel === 'BEU Delivery' && !beuOrderId.trim()) {
      alert('Please enter BEU Order ID (e.g. BEU-205)');
      return;
    }
    if (paymentMethod === 'Adari' && !adariCustomerName.trim()) {
      alert('Please enter customer name for Adari (አዳሪ) record.');
      return;
    }

    const orderId = `ORD-${Date.now()}`;
    const newOrder = {
      id: orderId,
      orderNumber: orders.length + 101,
      shift: currentShift,
      staff: staffName,
      channel: orderChannel,
      beuId: orderChannel === 'BEU Delivery' ? beuOrderId.trim() : null,
      items: [...cart],
      totalAmount: orderTotal,
      cupsCount: orderCups,
      boxesCount: orderBoxes,
      paymentMethod: orderChannel === 'BEU Delivery' ? 'BEU Platform Credit' : paymentMethod,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toISOString().split('T')[0]
    };

    if (paymentMethod === 'Adari' && orderChannel === 'In-Store') {
      const newAdariEntry = {
        id: `ADARI-${Date.now()}`,
        orderId: orderId,
        customerName: adariCustomerName.trim(),
        customerPhone: adariCustomerPhone.trim() || 'No phone',
        amount: orderTotal,
        itemsDescription: cart.map(i => `${i.qty}x ${i.name}`).join(', '),
        cupsCount: orderCups,
        boxesCount: orderBoxes,
        shift: currentShift,
        staff: staffName,
        status: 'Unpaid',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setAdariList(prev => [newAdariEntry, ...prev]);
      showToast(`Saved ${orderTotal} ETB under Adari for ${newAdariEntry.customerName}!`);
    } else {
      showToast(`Order #${newOrder.orderNumber} recorded successfully!`);
    }

    setOrders(prev => [newOrder, ...prev]);
    setCart([]);
    setBeuOrderId('');
    setAdariCustomerName('');
    setAdariCustomerPhone('');
  };

  // Settle Adari
  const handleSettleAdari = (id) => {
    const item = adariList.find(a => a.id === id);
    if (!item) return;

    setAdariList(prev => prev.map(a => {
      if (a.id === id) {
        return {
          ...a,
          status: 'Paid',
          settledDate: new Date().toLocaleDateString(),
          settledTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          settledMethod: settleMethod,
          settledBy: staffName
        };
      }
      return a;
    }));

    showToast(`Collected ${item.amount} ETB Adari payment from ${item.customerName}!`);
    setSettlingAdariId(null);
  };

  // Urgent Shop Expense
  const handleSaveUrgentExpense = (e) => {
    e.preventDefault();
    if (!urgentItemName.trim() || !urgentItemCost) return;

    const newExpense = {
      id: `URG-${Date.now()}`,
      item: urgentItemName.trim(),
      amount: Number(urgentItemCost),
      shift: currentShift,
      staff: staffName,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setUrgentExpenses(prev => [newExpense, ...prev]);
    showToast(`Logged urgent expense: ${newExpense.item} (${newExpense.amount} ETB)`);
    setUrgentItemName('');
    setUrgentItemCost('');
    setShowExpenseModal(false);
  };

  // Handle Image Upload for New Item
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewItemImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Quick Photo Replacement for Existing Item
  const handleQuickPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file && itemChangingPhotoId) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMenuItems(prev => prev.map(item => {
          if (item.id === itemChangingPhotoId) {
            showToast(`Photo updated for "${item.name}"!`);
            return { ...item, imageUrl: reader.result };
          }
          return item;
        }));
        setItemChangingPhotoId(null);
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
    showToast(`Added "${newItem.name}" with real photo!`);
  };

  // Aggregates
  const currentShiftOrders = orders.filter(o => o.shift === currentShift);
  const shiftRevenue = currentShiftOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const shiftCupsSold = currentShiftOrders.reduce((sum, o) => sum + o.cupsCount, 0);
  const shiftBoxesSold = currentShiftOrders.reduce((sum, o) => sum + o.boxesCount, 0);
  const shiftUrgentExpenses = urgentExpenses.filter(e => e.shift === currentShift).reduce((sum, e) => sum + e.amount, 0);

  const unpaidAdariList = adariList.filter(a => a.status === 'Unpaid');
  const totalUnpaidAdariAmount = unpaidAdariList.reduce((sum, a) => sum + a.amount, 0);

  // Filtered menu
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

      {/* VIBRANT WARM CITRUS HEADER */}
      <header className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white sticky top-0 z-50 shadow-xl shadow-orange-500/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-2xl shadow-inner shadow-white/30">
              🥤
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-lg tracking-tight text-white drop-shadow-sm">MARAKI</h1>
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

          {/* Quick Shift Pills & Adari Badge */}
          <div className="flex items-center gap-2 text-xs font-semibold">
            {/* Shift Sales Badge */}
            <div className="bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/30 hidden sm:block">
              <span className="text-[9px] uppercase tracking-wider text-orange-100 font-extrabold block">Shift Sales</span>
              <span className="text-sm font-black text-white">{shiftRevenue.toLocaleString()} ETB</span>
            </div>

            {/* Adari Quick Access Button */}
            <button
              onClick={() => setShowAdariModal(true)}
              className={`px-3.5 py-2 rounded-2xl font-black text-xs flex items-center gap-1.5 shadow-md transition-all ${
                unpaidAdariList.length > 0 
                  ? 'bg-white text-orange-600 hover:bg-orange-50 animate-bounce' 
                  : 'bg-white/20 text-white hover:bg-white/30 border border-white/30'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Adari: {totalUnpaidAdariAmount.toLocaleString()} ETB ({unpaidAdariList.length})</span>
            </button>

            {/* Shift Switcher */}
            <button
              onClick={() => {
                const next = currentShift === 'Day Shift' ? 'Night Shift' : 'Day Shift';
                setCurrentShift(next);
                showToast(`Switched to ${next}`);
              }}
              className="px-3 py-2 bg-black/20 hover:bg-black/30 text-white rounded-2xl border border-white/20 font-black text-xs flex items-center gap-1 transition-all"
            >
              {currentShift === 'Day Shift' ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5 text-indigo-200" />}
              <span>{currentShift}</span>
            </button>
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
      {/* VIBRANT STAFF COUNTER POS (WITH REAL FOOD & JUICE PHOTOGRAPHY) */}
      {/* ============================================================== */}
      {currentView === 'staff_terminal' && (
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
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                      orderChannel === 'In-Store'
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20'
                        : 'text-slate-600 hover:text-orange-600'
                    }`}
                  >
                    🏪 In-Store Walk-in
                  </button>
                  <button
                    onClick={() => { setOrderChannel('BEU Delivery'); setPaymentMethod('BEU Platform Credit'); }}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                      orderChannel === 'BEU Delivery'
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'text-slate-600 hover:text-orange-600'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>BEU Delivery</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons: Urgent Expense & Shift Close */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowExpenseModal(true)}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold rounded-2xl text-xs border border-rose-200 transition-colors flex items-center gap-1.5"
                >
                  <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                  <span>+ Shop Expense</span>
                </button>

                <button
                  onClick={() => setShowShiftCloseModal(true)}
                  className="px-3.5 py-2 bg-orange-50 hover:bg-orange-100 text-orange-800 font-extrabold rounded-2xl text-xs border border-orange-200 transition-colors flex items-center gap-1.5"
                >
                  <Scale className="w-3.5 h-3.5 text-orange-600" />
                  <span>Shift Audit</span>
                </button>
              </div>
            </div>

            {/* BEU Delivery Banner */}
            {orderChannel === 'BEU Delivery' && (
              <div className="bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-300 rounded-3xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md animate-in fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm shadow-md">
                    BEU
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-amber-950">BEU Food Delivery Rider Pickup</h4>
                    <p className="text-xs text-amber-800">Auto-credited to BEU Platform account.</p>
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="BEU Order # (e.g. BEU-205)"
                  value={beuOrderId}
                  onChange={(e) => setBeuOrderId(e.target.value)}
                  className="w-full sm:w-56 bg-white border border-amber-300 rounded-2xl px-3.5 py-2 text-xs font-black outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
                  required
                />
              </div>
            )}

            {/* Category Filter Pills & Search */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setActiveMenuTab('All')}
                  className={`px-4 py-2 rounded-2xl text-xs font-black transition-all ${
                    activeMenuTab === 'All'
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/30'
                      : 'bg-white text-slate-600 hover:bg-orange-50 border border-orange-100'
                  }`}
                >
                  ✨ All Items ({menuItems.length})
                </button>

                <button
                  onClick={() => setActiveMenuTab('Juice')}
                  className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 ${
                    activeMenuTab === 'Juice'
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/30'
                      : 'bg-white text-orange-800 hover:bg-orange-50 border border-orange-100'
                  }`}
                >
                  <span>🥤 Fresh Juices</span>
                </button>

                <button
                  onClick={() => setActiveMenuTab('Food')}
                  className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 ${
                    activeMenuTab === 'Food'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/30'
                      : 'bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-100'
                  }`}
                >
                  <span>🥗 Foods</span>
                </button>
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-orange-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search juice or food..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-orange-200 rounded-2xl pl-9 pr-3.5 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
                />
              </div>
            </div>

            {/* PRODUCT CARDS WITH REAL IMAGES (LIKE THE FIGMA DESIGN) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {filteredMenuItems.map(item => {
                const cartItem = cart.find(c => c.id === item.id);
                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-3xl p-3 sm:p-4 border transition-all select-none flex flex-col justify-between group hover:shadow-xl hover:shadow-orange-500/15 relative overflow-hidden ${
                      cartItem 
                        ? 'border-orange-500 ring-2 ring-orange-500/30 bg-orange-50/20' 
                        : 'border-orange-100 hover:border-orange-300'
                    }`}
                  >
                    {/* Top Tag: Packaging & Heart Icon */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                        item.containerType === 'cup'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {item.containerType === 'cup' ? '🥤 1 Cup' : '🥡 1 Box'}
                      </span>

                      <span className="w-7 h-7 rounded-full bg-orange-50 flex items-center justify-center text-xs text-orange-400 group-hover:text-rose-500 transition-colors">
                        <Heart className="w-3.5 h-3.5 fill-current" />
                      </span>
                    </div>

                    {/* REAL IMAGE CONTAINER */}
                    <div 
                      onClick={() => addToCart(item, 1)}
                      className="cursor-pointer text-center py-1"
                    >
                      <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-2xl overflow-hidden shadow-lg shadow-orange-500/15 group-hover:scale-105 transition-transform bg-orange-50 relative flex items-center justify-center">
                        {item.imageUrl ? (
                          <img 
                            src={item.imageUrl} 
                            alt={item.name} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-tr ${item.bgGradient || 'from-orange-400 to-amber-400'} flex items-center justify-center text-4xl`}>
                            {item.emoji}
                          </div>
                        )}
                      </div>

                      <h4 className="font-black text-slate-900 text-xs sm:text-sm mt-3 leading-snug group-hover:text-orange-600 transition-colors line-clamp-1">
                        {item.name}
                      </h4>
                      <p className="text-[12px] font-black text-orange-600 mt-0.5">
                        {item.price} <span className="text-[9px] text-slate-400 uppercase font-semibold">ETB</span>
                      </p>
                    </div>

                    {/* LARGE COUNTER / ADD BY CLICKING PLUS (NO +1 +2 +3) */}
                    <div className="mt-2.5 pt-2 border-t border-orange-50">
                      {cartItem ? (
                        <div className="flex items-center justify-between bg-orange-50/80 p-1 rounded-2xl border border-orange-200 shadow-inner">
                          <button
                            onClick={() => updateCartQty(item.id, -1)}
                            className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-700 hover:bg-orange-500 hover:text-white transition-colors"
                          >
                            <Minus className="w-4 h-4 stroke-[2.5]" />
                          </button>
                          
                          {/* LARGE NUMBER COUNTER */}
                          <span className="text-xl font-black text-orange-600 px-2">
                            {cartItem.qty}
                          </span>

                          <button
                            onClick={() => addToCart(item, 1)}
                            className="w-8 h-8 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md flex items-center justify-center hover:scale-105 transition-transform"
                          >
                            <Plus className="w-4 h-4 stroke-[3]" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(item, 1)}
                          className="w-full py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-2xl font-black text-xs shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02]"
                        >
                          <Plus className="w-4 h-4 stroke-[3]" />
                          <span>+ Add to Order</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT 4-5 COLUMNS: ELEGANT CURRENT ORDER & CHECKOUT */}
          <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-3xl border border-orange-100 shadow-2xl shadow-orange-500/10 overflow-hidden flex flex-col sticky top-20">
            
            {/* Header: Warm Orange with Order Status */}
            <div className="p-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-100 block">
                  Staff: {staffName}
                </span>
                <h3 className="font-black text-base">
                  {orderChannel === 'BEU Delivery' ? `BEU Order (${beuOrderId || 'New'})` : 'Current Order'}
                </h3>
              </div>
              <span className="text-xs bg-white/20 backdrop-blur-md px-3 py-1 rounded-full font-black border border-white/30 text-white">
                {currentShift}
              </span>
            </div>

            {/* Cart Items List */}
            <div className="p-4 flex-1 overflow-y-auto max-h-[340px] space-y-3">
              {cart.length === 0 ? (
                <div className="py-14 text-center text-slate-400 space-y-2">
                  <div className="w-14 h-14 mx-auto rounded-3xl bg-orange-50 flex items-center justify-center text-3xl">
                    🥤
                  </div>
                  <p className="text-sm font-black text-slate-700">No items selected</p>
                  <p className="text-xs text-slate-400">Click + on any juice or food to start an order</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="p-3 bg-orange-50/40 border border-orange-100 rounded-2xl space-y-2">
                    
                    {/* Item row with image thumbnail */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-orange-100 flex-shrink-0">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="w-full h-full flex items-center justify-center text-lg">{item.emoji}</span>
                          )}
                        </div>
                        <div>
                          <h5 className="font-black text-xs text-slate-900 leading-snug">{item.name}</h5>
                          <span className="text-[10px] text-slate-500 font-bold block">
                            {item.containerType === 'cup' ? '🥤 1 Cup' : '🥡 1 Box'} • {item.price + (item.addonCost || 0)} ETB
                          </span>
                        </div>
                      </div>

                      {/* Quantity Controls with LARGE NUMBER */}
                      <div className="flex items-center gap-1.5 bg-white border border-orange-200 rounded-2xl p-1 shadow-sm">
                        <button
                          onClick={() => updateCartQty(item.id, -1)}
                          className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-orange-100 rounded-lg transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                        
                        {/* LARGE NUMBER */}
                        <span className="text-base sm:text-lg font-black min-w-[26px] text-center text-orange-600">
                          {item.qty}
                        </span>

                        <button
                          onClick={() => updateCartQty(item.id, 1)}
                          className="w-7 h-7 flex items-center justify-center bg-orange-500 text-white hover:bg-orange-600 rounded-lg shadow-sm transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        </button>

                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg ml-0.5 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="text-xs font-black text-slate-900 min-w-[50px] text-right">
                        {(item.price + (item.addonCost || 0)) * item.qty} ETB
                      </span>
                    </div>

                    {/* Modifiers Chips (Sugar, Ice, Add-ons) */}
                    {item.menuType === 'Juice' && (
                      <div className="pt-1.5 border-t border-orange-100 space-y-1.5 text-[10px]">
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="font-extrabold text-slate-400">Sugar:</span>
                          {['Normal', 'No Sugar (ያለ ስኳር)', 'Extra Honey (+20)'].map(opt => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setSugarOption(item.id, opt)}
                              className={`px-2 py-0.5 rounded-lg font-black transition-all ${
                                item.sugarLevel === opt 
                                  ? 'bg-orange-500 text-white shadow-sm' 
                                  : 'bg-white text-slate-600 border border-orange-100 hover:bg-orange-50'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="font-extrabold text-slate-400">Ice:</span>
                          {['Cold with Ice', 'No Ice (ያለ በረዶ)'].map(ice => (
                            <button
                              key={ice}
                              type="button"
                              onClick={() => setIceOption(item.id, ice)}
                              className={`px-2 py-0.5 rounded-lg font-black transition-all ${
                                item.iceOption === ice 
                                  ? 'bg-blue-500 text-white shadow-sm' 
                                  : 'bg-white text-slate-600 border border-orange-100 hover:bg-orange-50'
                              }`}
                            >
                              {ice}
                            </button>
                          ))}

                          <button
                            type="button"
                            onClick={() => toggleAddon(item.id, '+ Ginger (+20)', 20)}
                            className={`px-2 py-0.5 rounded-lg font-black transition-all ${
                              item.extraAddons?.includes('+ Ginger (+20)') 
                                ? 'bg-amber-500 text-slate-950 shadow-sm' 
                                : 'bg-white text-amber-800 border border-amber-200 hover:bg-amber-50'
                            }`}
                          >
                            + Ginger (+20 ETB)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Packaging Tracker Badge */}
            {cart.length > 0 && (
              <div className="px-4 py-2 bg-orange-50 border-t border-orange-100 flex items-center justify-between text-xs">
                <span className="font-black text-slate-600">Containers to Deduct:</span>
                <div className="flex items-center gap-2">
                  <span className="font-black text-orange-900 bg-orange-200/70 px-2.5 py-0.5 rounded-full text-[11px]">
                    🥤 {orderCups} Cups
                  </span>
                  <span className="font-black text-emerald-900 bg-emerald-200/70 px-2.5 py-0.5 rounded-full text-[11px]">
                    🥡 {orderBoxes} Boxes
                  </span>
                </div>
              </div>
            )}

            {/* Checkout Area */}
            <div className="p-4 bg-white border-t border-orange-100 space-y-3">
              {/* Payment Methods */}
              {orderChannel === 'In-Store' ? (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {['Cash', 'Telebirr', 'CBE Birr', 'Adari'].map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPaymentMethod(m)}
                        className={`py-2 text-[11px] font-black rounded-xl border transition-all text-center ${
                          paymentMethod === m
                            ? m === 'Adari' 
                              ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md font-black' 
                              : 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20'
                            : 'bg-orange-50/60 text-slate-700 border-orange-100 hover:bg-orange-100'
                        }`}
                      >
                        {m === 'Adari' ? '📋 Adari' : m}
                      </button>
                    ))}
                  </div>

                  {paymentMethod === 'Adari' && (
                    <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl space-y-1.5 animate-in fade-in">
                      <span className="text-[11px] font-black text-amber-950 block">Customer Name for Adari (አዳሪ)</span>
                      <input
                        type="text"
                        placeholder="Customer Name (e.g. Ato Bekele)"
                        value={adariCustomerName}
                        onChange={(e) => setAdariCustomerName(e.target.value)}
                        className="w-full bg-white border border-amber-300 rounded-xl px-3 py-1.5 text-xs font-black outline-none"
                        required
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs font-black text-amber-900 flex items-center justify-between">
                  <span>Channel Payment:</span>
                  <span>BEU Platform Account</span>
                </div>
              )}

              {/* Total Due */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-black text-slate-500 uppercase">Total Bill:</span>
                <span className="text-2xl font-black text-slate-950">
                  {orderTotal.toLocaleString()} <span className="text-xs font-black text-orange-500">ETB</span>
                </span>
              </div>

              {/* Checkout CTA */}
              <button
                disabled={cart.length === 0}
                onClick={handleCompleteOrder}
                className={`w-full py-3.5 text-white rounded-2xl text-xs font-black shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 ${
                  paymentMethod === 'Adari'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-amber-500/30'
                    : 'bg-gradient-to-r from-orange-500 to-amber-500 shadow-orange-500/30 hover:scale-[1.01]'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {paymentMethod === 'Adari' 
                    ? `Save as Adari (አዳሪ) - ${orderTotal} ETB` 
                    : `Complete Order (${orderTotal} ETB)`}
                </span>
              </button>
            </div>
          </div>
        </main>
      )}

      {/* ============================================================== */}
      {/* VIEW 2: MENU & PHOTO MANAGEMENT (UPLOAD REAL IMAGES) */}
      {/* ============================================================== */}
      {currentView === 'menu_manager' && (
        <main className="max-w-5xl mx-auto px-4 py-6 flex-1 w-full space-y-6">
          <div className="bg-white rounded-3xl border border-orange-100 p-6 shadow-xl shadow-orange-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Camera className="w-5 h-5 text-orange-500" />
                <span>Menu & Real Image Manager</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Upload real photos of your juices, salads, and smoothies from your phone or computer.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddMenuModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black rounded-2xl text-xs shadow-md flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Add Item with Photo</span>
              </button>
              <button
                onClick={() => setCurrentView('staff_terminal')}
                className="px-4 py-2 bg-slate-900 text-white font-black rounded-2xl text-xs"
              >
                Back to POS
              </button>
            </div>
          </div>

          {/* Menu Items with Image Upload Buttons */}
          <div className="bg-white rounded-3xl border border-orange-100 shadow-xl shadow-orange-500/5 divide-y divide-orange-50 overflow-hidden">
            {menuItems.map(item => (
              <div key={item.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  {/* Photo Preview Container with Click-to-Change */}
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
                      {item.menuType === 'Juice' ? '🥤 Juice Menu (1 Cup)' : '🥡 Food Menu (1 Box)'}
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
        </main>
      )}

      {/* ============================================================== */}
      {/* MODAL: ADD ITEM WITH PHOTO UPLOAD */}
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
              {/* Image Uploader Box */}
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
                  <label className="text-xs font-black text-slate-700">Menu Category</label>
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
      {/* MODAL: ADARI (አዳሪ) BOOK */}
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
                          onClick={() => handleSettleAdari(entry.id)}
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
      {/* MODAL: EMERGENCY SHOP EXPENSE */}
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
    </div>
  );
}
