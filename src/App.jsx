import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Minus, 
  Trash2, 
  Check, 
  CheckCircle2, 
  Clock, 
  ShoppingBag, 
  Truck, 
  Store, 
  AlertTriangle, 
  UtensilsCrossed, 
  ChefHat, 
  Send, 
  Search, 
  Camera, 
  Upload, 
  PlusCircle, 
  BookOpen, 
  Sun, 
  Moon, 
  Box, 
  Receipt,
  Database
} from 'lucide-react';
import { dbService, isSupabaseConfigured } from './lib/supabaseClient';

export const MARAKI_REAL_FOOD_MENU = [
  { 
    id: 'm1', 
    name: 'ማራኪ ኮምቦ ሳላድ', 
    englishName: 'Maraki Combo Salad', 
    category: 'Salad',
    price: 430, 
    containerType: 'box', 
    isAvailable: true, 
    emoji: '🥗✨',
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
    description: 'የተሟላ ማራኪ ኮምቦ ሳላድ በአቮካዶ፣ ዶሮና ትኩስ አትክልት'
  },
  { 
    id: 'm2', 
    name: 'ሳላድ', 
    englishName: 'Salad', 
    category: 'Salad',
    price: 320, 
    containerType: 'box', 
    isAvailable: true, 
    emoji: '🥗',
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80',
    description: 'ትኩስ ሰላጣ ከአትክልትና ድሬሲንግ ጋር'
  },
  { 
    id: 'm3', 
    name: 'ፓስታ በሳላድ', 
    englishName: 'Pasta with Salad', 
    category: 'Pasta & Rice',
    price: 320, 
    containerType: 'box', 
    isAvailable: true, 
    emoji: '🍝🥗',
    imageUrl: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80',
    description: 'ጣፋጭ የተቀቀለ ፓስታ ከትኩስ ሰላጣ ጋር'
  },
  { 
    id: 'm4', 
    name: 'ሩዝ በሳላድ', 
    englishName: 'Rice with Salad', 
    category: 'Pasta & Rice',
    price: 320, 
    containerType: 'box', 
    isAvailable: true, 
    emoji: '🍚🥗',
    imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80',
    description: 'ጥሩ ተደርጎ የተዘጋጀ ሩዝ ከሰላጣ ጋር'
  },
  { 
    id: 'm5', 
    name: 'ፓስታ በአትክልት', 
    englishName: 'Pasta with Vegetables', 
    category: 'Pasta & Rice',
    price: 320, 
    containerType: 'box', 
    isAvailable: true, 
    emoji: '🍝🥦',
    imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?auto=format&fit=crop&w=600&q=80',
    description: 'ፓስታ ከተለያዩ ትኩስ አትክልቶች ጋር'
  },
  { 
    id: 'm6', 
    name: 'ሩዝ በአትክልት', 
    englishName: 'Rice with Vegetables', 
    category: 'Pasta & Rice',
    price: 320, 
    containerType: 'box', 
    isAvailable: true, 
    emoji: '🍚🥕',
    imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80',
    description: 'በካሮት፣ አተርና ጥቅል ጎመን የተዘጋጀ አትክልት ሩዝ'
  },
  { 
    id: 'm7', 
    name: 'ፓስታ በእንቁላል', 
    englishName: 'Pasta with Egg', 
    category: 'Pasta & Rice',
    price: 320, 
    containerType: 'box', 
    isAvailable: true, 
    emoji: '🍝🥚',
    imageUrl: 'https://images.unsplash.com/photo-1546549032-9571cd6b27df?auto=format&fit=crop&w=600&q=80',
    description: 'ፓስታ በእንቁላል ተዘጋጅቶ የቀረበ'
  },
  { 
    id: 'm8', 
    name: 'ሩዝ በእንቁላል', 
    englishName: 'Rice with Egg', 
    category: 'Pasta & Rice',
    price: 320, 
    containerType: 'box', 
    isAvailable: true, 
    emoji: '🍚🥚',
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80',
    description: 'በእንቁላል የተጠበሰ ጣፋጭ ሩዝ'
  },
  { 
    id: 'm9', 
    name: 'እንቁላል ፍርፍር', 
    englishName: 'Egg Firfir', 
    category: 'Eggs & Firfir',
    price: 230, 
    containerType: 'box', 
    isAvailable: true, 
    emoji: '🍳',
    imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80',
    description: 'በባህላዊ መንገድ በሽንኩርትና ቃሪያ የተዘጋጀ እንቁላል ፍርፍር'
  },
  { 
    id: 'm10', 
    name: 'እንቁላል ስልስ', 
    englishName: 'Egg Sils', 
    category: 'Eggs & Firfir',
    price: 230, 
    containerType: 'box', 
    isAvailable: true, 
    emoji: '🍳🍅',
    imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=600&q=80',
    description: 'በጣፋጭ የቲማቲም ስልስ የተሰራ ትኩስ እንቁላል'
  },
  { 
    id: 'm11', 
    name: 'እንቁላል ሳንድዊች', 
    englishName: 'Egg Sandwich', 
    category: 'Sandwiches',
    price: 120, 
    containerType: 'box', 
    isAvailable: true, 
    emoji: '🥪🥚',
    imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80',
    description: 'ትኩስ የእንቁላል ሳንድዊች በሰላጣና ቲማቲም'
  },
  { 
    id: 'm12', 
    name: 'አትክልት ሳንድዊች', 
    englishName: 'Vegetable Sandwich', 
    category: 'Sandwiches',
    price: 100, 
    containerType: 'box', 
    isAvailable: true, 
    emoji: '🥪🥑',
    imageUrl: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=600&q=80',
    description: 'በአቮካዶና ትኩስ አትክልት የተዘጋጀ ሳንድዊች'
  },
  { 
    id: 'm13', 
    name: 'ፍሩት ፓንች', 
    englishName: 'Fruit Punch', 
    category: 'Salad',
    price: 320, 
    containerType: 'box', 
    isAvailable: true, 
    emoji: '🍍🥭',
    imageUrl: 'https://images.unsplash.com/photo-1519996529931-28324d5a630e?auto=format&fit=crop&w=600&q=80',
    description: 'ማንጎ፣ ፓፓያ፣ አናናስና ሙዝ በማር የተዘጋጀ የፍራፍሬ ቦውል'
  },
  { 
    id: 'm14', 
    name: 'ፍርፍር', 
    englishName: 'Firfir', 
    category: 'Eggs & Firfir',
    price: 200, 
    containerType: 'box', 
    isAvailable: true, 
    emoji: '🥘',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    description: 'በበርበሬና ቅመማቅመም የተዘጋጀ የእንጀራ ፍርፍር'
  },
  { 
    id: 'm15', 
    name: 'ፓስታ በስጎ', 
    englishName: 'Pasta with Sugo', 
    category: 'Pasta & Rice',
    price: 200, 
    containerType: 'box', 
    isAvailable: true, 
    emoji: '🍝🍅',
    imageUrl: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80',
    description: 'በልዩ የቲማቲም ስጎ የተሰራ ትኩስ ፓስታ'
  },
  { 
    id: 'm16', 
    name: 'ቴስቲሶያ', 
    englishName: 'Tasty Soya', 
    category: 'Eggs & Firfir',
    price: 200, 
    containerType: 'box', 
    isAvailable: true, 
    emoji: '🍲🌱',
    imageUrl: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=600&q=80',
    description: 'በጥሩ ቅመም የተዘጋጀ ጣፋጭ የአኩሪ አተር ወጥ (ቴስቲሶያ)'
  }
];

export default function App() {
  // --- 1. CHEF & SHIFT STATE ---
  const [chefName, setChefName] = useState('Chef Almaz');
  const [currentShift, setCurrentShift] = useState('Day Shift');

  // --- 2. FOOD MENU (FOODS ONLY - ALL TAKEAWAY) ---
  const [foodMenu, setFoodMenu] = useState(() => {
    const saved = localStorage.getItem('maraki_chef_food_menu_v2');
    return saved ? JSON.parse(saved) : MARAKI_REAL_FOOD_MENU;
  });

  const [activeCategory, setActiveCategory] = useState('All');

  // --- 3. ORDERS SENT TO OWNER ---
  const [sentOrders, setSentOrders] = useState(() => {
    const saved = localStorage.getItem('maraki_chef_sent_orders');
    return saved ? JSON.parse(saved) : [];
  });

  // --- 4. BOXES & WASTE TRACKING ---
  const [openingBoxes, setOpeningBoxes] = useState(120);
  const [wasteBoxes, setWasteBoxes] = useState(1);
  const [showWasteModal, setShowWasteModal] = useState(false);
  const [wasteCountInput, setWasteCountInput] = useState(1);
  const [wasteReason, setWasteReason] = useState('Box Damaged / Dropped');

  // --- 5. ACTIVE CHEF ORDER FORM STATES ---
  const [cart, setCart] = useState([]);
  const [orderChannel, setOrderChannel] = useState('In-Store Takeaway');
  const [beuOrderId, setBeuOrderId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [specialNotes, setSpecialNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Adari customer fields (if on credit)
  const [adariCustomerName, setAdariCustomerName] = useState('');
  const [adariCustomerPhone, setAdariCustomerPhone] = useState('');

  // Add New Dish Modal
  const [showAddDishModal, setShowAddDishModal] = useState(false);
  const [newDishName, setNewDishName] = useState('');
  const [newDishPrice, setNewDishPrice] = useState('');
  const [newDishDesc, setNewDishDesc] = useState('');
  const [newDishImagePreview, setNewDishImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Persist State
  useEffect(() => {
    localStorage.setItem('maraki_chef_food_menu_v2', JSON.stringify(foodMenu));
  }, [foodMenu]);

  useEffect(() => {
    localStorage.setItem('maraki_chef_sent_orders', JSON.stringify(sentOrders));
  }, [sentOrders]);

  // --- CART ACTIONS ---
  const addToCart = (item, qtyDelta = 1) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + qtyDelta } : i);
      }
      return [...prev, { ...item, qty: qtyDelta }];
    });
  };

  const updateCartQty = (id, delta) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const nextQty = i.qty + delta;
        return nextQty > 0 ? { ...i, qty: nextQty } : null;
      }
      return i;
    }).filter(Boolean));
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setSpecialNotes('');
    setBeuOrderId('');
    setAdariCustomerName('');
    setAdariCustomerPhone('');
  };

  // Totals: ALWAYS TAKEAWAY = 1 Box per each item qty!
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const totalBoxesInOrder = cart.reduce((sum, item) => sum + item.qty, 0);

  // --- FINISH ORDER & SEND TO OWNER ---
  const handleSendOrderToOwner = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      showToast('⚠️ Please select at least 1 food dish to send');
      return;
    }

    if (orderChannel === 'BEU Delivery' && !beuOrderId.trim()) {
      showToast('⚠️ Please enter the BEU Delivery Order ID');
      return;
    }

    if (paymentMethod === 'Adari' && !adariCustomerName.trim()) {
      showToast('⚠️ Please enter customer name for Adari credit');
      return;
    }

    const orderId = `food-${Date.now()}`;
    const orderData = {
      id: orderId,
      chefName,
      shift: currentShift,
      channel: orderChannel,
      beuOrderId: orderChannel === 'BEU Delivery' ? beuOrderId.trim() : null,
      paymentMethod,
      totalAmount: subtotal,
      boxesCount: totalBoxesInOrder, // Every item is a takeaway box
      packagingType: 'takeaway_box',
      specialNotes: specialNotes.trim() || null,
      status: 'Sent to Owner',
      items: cart.map(i => ({
        id: i.id,
        name: i.name,
        qty: i.qty,
        price: i.price
      })),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString()
    };

    // If Adari credit
    if (paymentMethod === 'Adari') {
      const adariEntry = {
        id: `adari-${Date.now()}`,
        customerName: adariCustomerName.trim(),
        customerPhone: adariCustomerPhone.trim() || 'No Phone',
        amount: subtotal,
        orderId,
        status: 'Unpaid',
        staff: chefName,
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        itemsDescription: cart.map(i => `${i.qty}x ${i.name}`).join(', ')
      };
      await dbService.saveAdari(adariEntry);
    }

    // Save locally and sync with Supabase database
    setSentOrders(prev => [orderData, ...prev]);
    await dbService.saveOrder({
      ...orderData,
      cupsCount: 0,
      staffName: chefName
    });

    // Reset Form
    clearCart();
    showToast(`✅ Order sent to Owner! (${totalBoxesInOrder} 🥡 Takeaway Box${totalBoxesInOrder > 1 ? 'es' : ''} logged)`);
  };

  // --- SAVE DAMAGED BOX / SPILL ---
  const handleSaveWaste = (e) => {
    e.preventDefault();
    const count = Number(wasteCountInput) || 1;
    setWasteBoxes(prev => prev + count);
    setShowWasteModal(false);
    showToast(`⚠️ Logged ${count} damaged takeaway box(es) (${wasteReason})`);
  };

  // --- ADD NEW DISH ---
  const handleCreateDish = (e) => {
    e.preventDefault();
    if (!newDishName.trim() || !newDishPrice) return;

    const newDish = {
      id: `dish-${Date.now()}`,
      name: newDishName.trim(),
      price: Number(newDishPrice),
      description: newDishDesc.trim() || 'Freshly prepared takeaway dish',
      containerType: 'box',
      isAvailable: true,
      emoji: '🥗',
      imageUrl: newDishImagePreview || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80'
    };

    setFoodMenu(prev => [newDish, ...prev]);
    setNewDishName('');
    setNewDishPrice('');
    setNewDishDesc('');
    setNewDishImagePreview(null);
    setShowAddDishModal(false);
    showToast(`Added "${newDish.name}" to Food Menu!`);
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewDishImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Filtered Menu by Category & Search (supports Amharic & English search)
  const filteredDishes = foodMenu.filter(item => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      item.name.toLowerCase().includes(q) ||
      (item.englishName && item.englishName.toLowerCase().includes(q));
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Shift Aggregates for Chef (Current Shift)
  const shiftOrders = sentOrders.filter(o => o.shift === currentShift);
  const totalShiftBoxesUsed = shiftOrders.reduce((sum, o) => sum + (o.boxesCount || 0), 0);
  const totalShiftRevenue = shiftOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  // --- OWNER INSPECTION & FILTERING (SHIFTS, BEU, FOOD TYPES) ---
  const [viewFilter, setViewFilter] = useState('All'); // 'All', 'Day Shift', 'Night Shift', 'BEU Delivery', 'In-Store Takeaway'

  // Filtered Sent Orders based on viewFilter
  const filteredSentOrders = sentOrders.filter(order => {
    if (viewFilter === 'Day Shift') return order.shift === 'Day Shift';
    if (viewFilter === 'Night Shift') return order.shift === 'Night Shift';
    if (viewFilter === 'BEU Delivery') return order.channel === 'BEU Delivery';
    if (viewFilter === 'In-Store Takeaway') return order.channel === 'In-Store Takeaway';
    return true; // 'All'
  });

  // Shift & Channel Counts & Totals
  const dayOrders = sentOrders.filter(o => o.shift === 'Day Shift');
  const nightOrders = sentOrders.filter(o => o.shift === 'Night Shift');
  const beuOrders = sentOrders.filter(o => o.channel === 'BEU Delivery');
  const inStoreOrders = sentOrders.filter(o => o.channel === 'In-Store Takeaway');

  const dayBoxes = dayOrders.reduce((sum, o) => sum + (o.boxesCount || 0), 0);
  const nightBoxes = nightOrders.reduce((sum, o) => sum + (o.boxesCount || 0), 0);
  const beuBoxes = beuOrders.reduce((sum, o) => sum + (o.boxesCount || 0), 0);
  const inStoreBoxes = inStoreOrders.reduce((sum, o) => sum + (o.boxesCount || 0), 0);

  const dayRevenue = dayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const nightRevenue = nightOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const beuRevenue = beuOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const inStoreRevenue = inStoreOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  // Food Types Breakdown (Exact counts of each food dish prepared in the active view)
  const dishBreakdown = foodMenu.map(dish => {
    let countSold = 0;
    let revenue = 0;
    filteredSentOrders.forEach(order => {
      order.items?.forEach(i => {
        if (i.id === dish.id || i.name === dish.name) {
          countSold += i.qty;
          revenue += (i.qty * dish.price);
        }
      });
    });
    return {
      ...dish,
      countSold,
      boxesUsed: countSold, // 1 box per dish
      revenueGenerated: revenue
    };
  });

  return (
    <div className="min-h-screen bg-[#FFFDFB] flex flex-col font-sans text-slate-800 antialiased selection:bg-emerald-600 selection:text-white">
      
      {/* ============================================================== */}
      {/* VIBRANT CHEF HEADER (CHEF ALMAZ & SHIFT)                        */}
      {/* ============================================================== */}
      <header className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white sticky top-0 z-50 shadow-xl shadow-emerald-700/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          
          {/* Logo & Chef Station Identity */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-2xl shadow-inner">
              👩‍🍳
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-lg tracking-tight text-white drop-shadow-sm">MARAKI</h1>
                <span className="text-[10px] font-black uppercase tracking-wider bg-white text-emerald-800 px-2.5 py-0.5 rounded-full shadow-sm">
                  Chef Food Station
                </span>
              </div>
              <p className="text-xs text-emerald-100 flex items-center gap-1.5 font-bold mt-0.5">
                <span>Chef on Duty:</span>
                <span className="underline decoration-emerald-300 font-black">{chefName}</span>
                <span className="text-white/40">•</span>
                <span className="text-[11px] bg-black/20 px-2 py-0.5 rounded-lg border border-white/10">
                  100% Takeaway (🥡)
                </span>
              </p>
            </div>
          </div>

          {/* Quick Shift & Action Controls */}
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            
            {/* Shift Switcher */}
            <button
              onClick={() => {
                const next = currentShift === 'Day Shift' ? 'Night Shift' : 'Day Shift';
                setCurrentShift(next);
                showToast(`Switched to ${next}`);
              }}
              className="px-3 py-1.5 bg-black/20 hover:bg-black/30 text-white rounded-2xl border border-white/20 font-black text-xs flex items-center gap-1.5 transition-all"
            >
              {currentShift === 'Day Shift' ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5 text-indigo-200" />}
              <span>{currentShift}</span>
            </button>

            {/* Log Damaged Box Button */}
            <button
              onClick={() => setShowWasteModal(true)}
              className="px-3 py-1.5 bg-rose-500/90 hover:bg-rose-600 text-white font-black rounded-2xl text-xs flex items-center gap-1 shadow-md transition-colors border border-rose-400/30"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Log Damaged Box</span>
            </button>

            {/* Add New Dish */}
            <button
              onClick={() => setShowAddDishModal(true)}
              className="px-3 py-1.5 bg-white text-emerald-800 hover:bg-emerald-50 font-black rounded-2xl text-xs flex items-center gap-1 shadow-md transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Add Dish</span>
            </button>
          </div>
        </div>
      </header>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="max-w-md mx-auto mt-3 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-black rounded-2xl shadow-xl shadow-emerald-700/20 flex items-center gap-2 animate-in fade-in duration-200 z-50">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4 LIVE CHEF COUNTERS (BOXES, ORDERS SENT, REVENUE)             */}
      {/* ============================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          
          {/* Total Boxes Used */}
          <div className="bg-white p-4 rounded-3xl border border-emerald-100 shadow-xl shadow-emerald-700/5 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-2xl flex-shrink-0">
              🥡
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Boxes Handed Out
              </span>
              <p className="text-xl font-black text-emerald-700 mt-0.5">{totalShiftBoxesUsed} Boxes</p>
              <span className="text-[10px] text-slate-400 font-bold">1 box per dish</span>
            </div>
          </div>

          {/* Orders Sent to Owner */}
          <div className="bg-white p-4 rounded-3xl border border-emerald-100 shadow-xl shadow-emerald-700/5 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center text-2xl flex-shrink-0">
              📤
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Orders Sent to Owner
              </span>
              <p className="text-xl font-black text-slate-900 mt-0.5">{shiftOrders.length} Sent</p>
              <span className="text-[10px] text-emerald-600 font-bold">Logged to database</span>
            </div>
          </div>

          {/* Shift Food Value */}
          <div className="bg-white p-4 rounded-3xl border border-emerald-100 shadow-xl shadow-emerald-700/5 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-2xl flex-shrink-0">
              💰
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Total Food Sales
              </span>
              <p className="text-xl font-black text-slate-900 mt-0.5">{totalShiftRevenue.toLocaleString()} ETB</p>
              <span className="text-[10px] text-slate-400 font-bold">{currentShift}</span>
            </div>
          </div>

          {/* Damaged Boxes */}
          <div className="bg-white p-4 rounded-3xl border border-rose-100 shadow-xl shadow-rose-600/5 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center text-2xl flex-shrink-0">
              ⚠️
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Damaged / Spilled
              </span>
              <p className="text-xl font-black text-rose-600 mt-0.5">{wasteBoxes} Boxes</p>
              <span className="text-[10px] text-slate-400 font-bold">Reported to Owner</span>
            </div>
          </div>

        </div>
      </section>

      {/* ============================================================== */}
      {/* MAIN WORKSPACE: DISH SELECTOR & SEND TO OWNER PANEL            */}
      {/* ============================================================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT 7-8 COLUMNS: CHEF FOOD DISHES (TOUCH CARDS) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          
          {/* Top Bar: Channel Toggle & Search */}
          <div className="bg-white rounded-3xl p-4 shadow-xl shadow-emerald-700/5 border border-emerald-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            
            {/* Channel Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Channel:</span>
              <div className="grid grid-cols-2 gap-1.5 bg-emerald-50/80 p-1 rounded-2xl border border-emerald-100">
                <button
                  type="button"
                  onClick={() => { setOrderChannel('In-Store Takeaway'); setPaymentMethod('Cash'); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                    orderChannel === 'In-Store Takeaway'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-emerald-700'
                  }`}
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>In-Store Takeaway</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setOrderChannel('BEU Delivery'); setPaymentMethod('BEU Account'); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                    orderChannel === 'BEU Delivery'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-emerald-700'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>BEU Delivery</span>
                </button>
              </div>
            </div>

            {/* Search Dishes */}
            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search food dish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-emerald-50/40 border border-emerald-100 rounded-2xl pl-8 pr-3 py-2 text-xs font-bold text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* BEU Delivery Banner */}
          {orderChannel === 'BEU Delivery' && (
            <div className="bg-amber-500 text-white p-3.5 rounded-3xl shadow-lg shadow-amber-500/10 flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 flex-shrink-0" />
                <span className="text-xs font-black">BEU Delivery Rider Order:</span>
              </div>
              <input
                type="text"
                placeholder="Enter BEU Order # (e.g. BEU-4921)"
                value={beuOrderId}
                onChange={(e) => setBeuOrderId(e.target.value)}
                className="bg-white/20 placeholder-white/80 text-white text-xs font-bold rounded-xl px-3 py-1.5 outline-none border border-white/30 w-52"
              />
            </div>
          )}

          {/* Quick Category Tabs for Chef Almaz */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'All', label: '🌟 ሁሉም (All 16)' },
              { id: 'Salad', label: '🥗 ሳላድና ፍራፍሬ' },
              { id: 'Pasta & Rice', label: '🍝 ፓስታ እና ሩዝ' },
              { id: 'Eggs & Firfir', label: '🍳 እንቁላል እና ፍርፍር' },
              { id: 'Sandwiches', label: '🥪 ሳንድዊች' }
            ].map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-2xl font-black text-xs whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-700/20 scale-[1.02]'
                    : 'bg-white text-slate-700 hover:bg-emerald-50 border border-emerald-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* DISH CARDS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredDishes.map(item => {
              const inCart = cart.find(i => i.id === item.id);
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl p-4 shadow-xl shadow-emerald-700/5 border border-emerald-100 hover:border-emerald-300 transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Real Photography with 🥡 Takeaway Box Tag */}
                    <div className="w-full h-40 rounded-2xl overflow-hidden relative bg-emerald-50 mb-3 shadow-inner">
                      {item.imageUrl ? (
                        <img 
                          src={item.imageUrl} 
                          alt={item.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl">
                          {item.emoji}
                        </div>
                      )}

                      {/* Always Takeaway Box Tag */}
                      <div className="absolute top-2.5 left-2.5 bg-black/50 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1 rounded-xl flex items-center gap-1 border border-white/20">
                        <span>🥡 1 Takeaway Box</span>
                      </div>

                      {/* Price Tag */}
                      <div className="absolute bottom-2.5 right-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs px-3 py-1 rounded-xl shadow-md">
                        {item.price} ETB
                      </div>
                    </div>

                    <h3 className="font-black text-slate-900 text-sm leading-snug line-clamp-1">{item.name}</h3>
                    {item.englishName && (
                      <span className="text-[11px] font-bold text-emerald-700 block mt-0.5">
                        {item.englishName}
                      </span>
                    )}
                    <p className="text-[11px] text-slate-400 font-bold mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Big Number Touch Counter */}
                  <div className="mt-4 pt-3 border-t border-emerald-50 flex items-center justify-between">
                    {inCart ? (
                      <div className="flex items-center justify-between w-full bg-emerald-50 p-1.5 rounded-2xl border border-emerald-200">
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.id, -1)}
                          className="w-10 h-10 rounded-xl bg-white text-emerald-800 hover:bg-emerald-100 flex items-center justify-center font-black shadow-sm active:scale-95 transition-transform"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        
                        <div className="text-center px-2">
                          <span className="font-black text-lg text-emerald-800 block leading-none">
                            {inCart.qty}
                          </span>
                          <span className="text-[9px] font-extrabold text-emerald-600 uppercase">
                            {inCart.qty} 🥡
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => updateCartQty(item.id, 1)}
                          className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center font-black shadow-md shadow-emerald-600/20 active:scale-95 transition-transform"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => addToCart(item, 1)}
                        className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-transform active:scale-95"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Takeaway Dish</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* RIGHT 4-5 COLUMNS: SEND TO OWNER PANEL */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-3xl p-5 shadow-2xl shadow-emerald-700/10 border border-emerald-100 sticky top-20 flex flex-col justify-between min-h-[620px]">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-base font-black shadow-md">
                  👩‍🍳
                </div>
                <div>
                  <h2 className="font-black text-slate-900 text-sm">Chef Order Tray</h2>
                  <span className="text-[10px] text-slate-400 font-bold block">
                    {orderChannel} • {chefName}
                  </span>
                </div>
              </div>

              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-[11px] text-rose-500 hover:text-rose-700 font-black flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {/* Packaging Notice: ALWAYS TAKEAWAY BOXES */}
            <div className="my-3 p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-3xl">🥡</span>
                <div>
                  <span className="text-xs font-black text-emerald-950 block">
                    Takeaway Boxes Count:
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold">
                    Logged directly to owner's packaging stock
                  </span>
                </div>
              </div>
              <span className="text-xl font-black text-emerald-800 bg-white px-3.5 py-1.5 rounded-xl border border-emerald-300 shadow-sm">
                {totalBoxesInOrder} 🥡
              </span>
            </div>

            {/* Cart Items List */}
            <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="py-14 text-center">
                  <UtensilsCrossed className="w-12 h-12 mx-auto text-emerald-200 mb-2" />
                  <p className="text-xs font-black text-slate-500">No dishes on tray</p>
                  <p className="text-[11px] text-slate-400">Tap food dishes on the left to add</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="p-3 rounded-2xl border border-emerald-100 bg-[#FAFDFB] flex items-center justify-between">
                    <div>
                      <h4 className="font-black text-slate-900 text-xs">{item.name}</h4>
                      <span className="text-[11px] font-black text-emerald-700">
                        {item.price * item.qty} ETB ({item.qty} 🥡 Boxes)
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-emerald-200 shadow-xs">
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.id, -1)}
                        className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center font-black text-xs"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-black text-emerald-800 px-2">{item.qty}</span>
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.id, 1)}
                        className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-xs"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Checkout & Send to Owner Form */}
          <form onSubmit={handleSendOrderToOwner} className="pt-4 border-t border-emerald-100 space-y-3">
            
            {/* Special Instructions / Kitchen Note */}
            <div>
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                Custom Preparation Note:
              </label>
              <input
                type="text"
                placeholder="e.g. ያለ ማዮኔዝ / No Mayo, Extra dressing, Spicy"
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                className="w-full bg-emerald-50/40 border border-emerald-200 rounded-2xl px-3.5 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Payment Method */}
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
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                        : 'bg-emerald-50/60 text-slate-700 hover:bg-emerald-100 border border-emerald-100'
                    }`}
                  >
                    <span className="block text-sm">{m.icon}</span>
                    <span className="text-[10px] block mt-0.5">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Adari credit inputs if selected */}
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

            {/* Total and Big Send to Owner Button */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 block">Total Takeaway Due</span>
                <span className="text-xl font-black text-emerald-800">{subtotal.toLocaleString()} ETB</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black uppercase text-slate-400 block">Boxes</span>
                <span className="text-lg font-black text-emerald-600">{totalBoxesInOrder} 🥡</span>
              </div>
            </div>

            {/* THE PRIMARY ACTION: FINISH & SEND TO OWNER */}
            <button
              type="submit"
              disabled={cart.length === 0}
              className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl transition-all ${
                cart.length > 0
                  ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-700/25 active:scale-98'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Finish & Send to Owner (አጠናቅቄ ልኬያለሁ)</span>
            </button>
          </form>
        </div>

      </main>

      {/* ============================================================== */}
      {/* OWNER LIVE INSPECTION: SHIFTS, BEU & FOOD TYPES BREAKDOWN      */}
      {/* ============================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full space-y-6">
        
        {/* Section Header */}
        <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 text-2xl shadow-inner">
              📊
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>Owner Food & Shift Inspection Hub</span>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full">
                  Live Feed
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Inspect how many orders went to Day vs Night shift, BEU Delivery vs In-Store, and exactly what type of food was prepared.
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Total Combined Boxes</span>
            <span className="text-xl font-black text-emerald-400">{dayBoxes + nightBoxes} 🥡 Takeaway Boxes</span>
          </div>
        </div>

        {/* 4 SUMMARY METRIC CARDS: DAY SHIFT vs NIGHT SHIFT vs BEU vs IN-STORE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Day Shift Card */}
          <div 
            onClick={() => setViewFilter(viewFilter === 'Day Shift' ? 'All' : 'Day Shift')}
            className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between ${
              viewFilter === 'Day Shift'
                ? 'bg-amber-500 text-white border-amber-600 shadow-xl scale-[1.02]'
                : 'bg-white text-slate-900 border-amber-200 shadow-lg shadow-amber-500/5 hover:border-amber-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-black uppercase tracking-wider ${viewFilter === 'Day Shift' ? 'text-amber-100' : 'text-amber-700'}`}>
                ☀️ Day Shift Orders
              </span>
              <span className="text-lg">☀️</span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-black">{dayOrders.length} Orders</p>
              <div className="flex items-center justify-between mt-1 text-xs font-bold">
                <span className={viewFilter === 'Day Shift' ? 'text-amber-100' : 'text-slate-500'}>
                  {dayBoxes} 🥡 Boxes Used
                </span>
                <span className="font-black">{dayRevenue.toLocaleString()} ETB</span>
              </div>
            </div>
          </div>

          {/* Night Shift Card */}
          <div 
            onClick={() => setViewFilter(viewFilter === 'Night Shift' ? 'All' : 'Night Shift')}
            className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between ${
              viewFilter === 'Night Shift'
                ? 'bg-indigo-600 text-white border-indigo-700 shadow-xl scale-[1.02]'
                : 'bg-white text-slate-900 border-indigo-200 shadow-lg shadow-indigo-600/5 hover:border-indigo-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-black uppercase tracking-wider ${viewFilter === 'Night Shift' ? 'text-indigo-200' : 'text-indigo-700'}`}>
                🌙 Night Shift Orders
              </span>
              <span className="text-lg">🌙</span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-black">{nightOrders.length} Orders</p>
              <div className="flex items-center justify-between mt-1 text-xs font-bold">
                <span className={viewFilter === 'Night Shift' ? 'text-indigo-200' : 'text-slate-500'}>
                  {nightBoxes} 🥡 Boxes Used
                </span>
                <span className="font-black">{nightRevenue.toLocaleString()} ETB</span>
              </div>
            </div>
          </div>

          {/* BEU Delivery Card */}
          <div 
            onClick={() => setViewFilter(viewFilter === 'BEU Delivery' ? 'All' : 'BEU Delivery')}
            className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between ${
              viewFilter === 'BEU Delivery'
                ? 'bg-orange-500 text-white border-orange-600 shadow-xl scale-[1.02]'
                : 'bg-white text-slate-900 border-orange-200 shadow-lg shadow-orange-500/5 hover:border-orange-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-black uppercase tracking-wider ${viewFilter === 'BEU Delivery' ? 'text-orange-100' : 'text-orange-700'}`}>
                🛵 BEU Delivery App
              </span>
              <span className="text-lg">🛵</span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-black">{beuOrders.length} Orders</p>
              <div className="flex items-center justify-between mt-1 text-xs font-bold">
                <span className={viewFilter === 'BEU Delivery' ? 'text-orange-100' : 'text-slate-500'}>
                  {beuBoxes} 🥡 Boxes
                </span>
                <span className="font-black">{beuRevenue.toLocaleString()} ETB</span>
              </div>
            </div>
          </div>

          {/* In-Store Takeaway Card */}
          <div 
            onClick={() => setViewFilter(viewFilter === 'In-Store Takeaway' ? 'All' : 'In-Store Takeaway')}
            className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between ${
              viewFilter === 'In-Store Takeaway'
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-xl scale-[1.02]'
                : 'bg-white text-slate-900 border-emerald-200 shadow-lg shadow-emerald-600/5 hover:border-emerald-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-black uppercase tracking-wider ${viewFilter === 'In-Store Takeaway' ? 'text-emerald-100' : 'text-emerald-700'}`}>
                🏪 In-Store Walk-ins
              </span>
              <span className="text-lg">🏪</span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-black">{inStoreOrders.length} Orders</p>
              <div className="flex items-center justify-between mt-1 text-xs font-bold">
                <span className={viewFilter === 'In-Store Takeaway' ? 'text-emerald-100' : 'text-slate-500'}>
                  {inStoreBoxes} 🥡 Boxes
                </span>
                <span className="font-black">{inStoreRevenue.toLocaleString()} ETB</span>
              </div>
            </div>
          </div>

        </div>

        {/* FOOD TYPES BREAKDOWN: WHAT TYPE OF FOOD DISHES WERE ORDERED */}
        <div className="bg-white rounded-3xl p-6 shadow-xl shadow-emerald-700/5 border border-emerald-100 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-emerald-100">
            <div>
              <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-emerald-600" />
                <span>Food Types Breakdown (ምን አይነት ምግቦች እንደተዘጋጁ)</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Exact count of each dish and how many 🥡 takeaway boxes were used for: <strong className="text-emerald-700 font-black">{viewFilter}</strong>
              </p>
            </div>

            <span className="text-xs font-black text-slate-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              Showing: {viewFilter}
            </span>
          </div>

          {/* Dish Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {dishBreakdown.map(dish => (
              <div 
                key={dish.id} 
                className={`p-4 rounded-2xl border transition-all flex items-center gap-3.5 ${
                  dish.countSold > 0
                    ? 'bg-emerald-50/40 border-emerald-200 shadow-sm'
                    : 'bg-slate-50/50 border-slate-100 opacity-60'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-emerald-100 flex-shrink-0 shadow-inner">
                  {dish.imageUrl ? (
                    <img src={dish.imageUrl} alt={dish.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="w-full h-full flex items-center justify-center text-2xl">{dish.emoji}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h5 className="font-black text-xs text-slate-900 truncate">{dish.name}</h5>
                  <span className="text-[10px] text-slate-400 font-bold block">{dish.price} ETB / bowl</span>
                  
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                      dish.countSold > 0 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {dish.countSold} Prepared
                    </span>
                    <span className="text-[11px] font-extrabold text-slate-500">
                      ({dish.boxesUsed} 🥡 Boxes)
                    </span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="text-xs font-black text-emerald-800 block">
                    {dish.revenueGenerated.toLocaleString()} ETB
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* INTERACTIVE FILTER TABS & DETAILED ORDER FEED */}
        <div className="bg-white rounded-3xl p-6 shadow-xl shadow-emerald-700/5 border border-emerald-100 space-y-4">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-emerald-100">
            <div>
              <h4 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <span>Orders Sent to Owner ({filteredSentOrders.length})</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Every order logged by Chef Almaz and sent directly to your database.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none w-full sm:w-auto pb-1 sm:pb-0">
              {[
                { id: 'All', label: '🌟 All Orders', count: sentOrders.length },
                { id: 'Day Shift', label: '☀️ Day Shift', count: dayOrders.length },
                { id: 'Night Shift', label: '🌙 Night Shift', count: nightOrders.length },
                { id: 'BEU Delivery', label: '🛵 BEU Delivery', count: beuOrders.length },
                { id: 'In-Store Takeaway', label: '🏪 In-Store', count: inStoreOrders.length }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setViewFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl font-black text-xs whitespace-nowrap transition-all ${
                    viewFilter === tab.id
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                      : 'bg-emerald-50/60 text-slate-700 hover:bg-emerald-100'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="ml-1 opacity-80 text-[10px]">({tab.count})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Orders Feed */}
          {filteredSentOrders.length === 0 ? (
            <div className="py-14 text-center text-slate-400">
              <ShoppingBag className="w-12 h-12 mx-auto text-emerald-200 mb-2" />
              <p className="text-xs font-black text-slate-500">No orders match the filter "{viewFilter}".</p>
              <p className="text-[11px] text-slate-400">When orders are finished and sent by the chef, they will show up here.</p>
            </div>
          ) : (
            <div className="divide-y divide-emerald-50">
              {filteredSentOrders.map(order => (
                <div key={order.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900 text-sm">Order #{order.id.slice(-6)}</span>
                      
                      {/* Shift Badge */}
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        order.shift === 'Day Shift' ? 'bg-amber-100 text-amber-900' : 'bg-indigo-100 text-indigo-900'
                      }`}>
                        {order.shift === 'Day Shift' ? '☀️ Day' : '🌙 Night'}
                      </span>

                      {/* Channel Badge */}
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                        order.channel === 'BEU Delivery' 
                          ? 'bg-orange-100 text-orange-900 border border-orange-200' 
                          : 'bg-emerald-100 text-emerald-900'
                      }`}>
                        {order.channel} {order.beuOrderId ? `(${order.beuOrderId})` : ''}
                      </span>

                      {/* Boxes Count */}
                      <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {order.boxesCount} 🥡 Boxes
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 font-bold mt-1">
                      {order.items?.map(i => `${i.qty}x ${i.name}`).join(', ')}
                    </p>

                    {order.specialNotes && (
                      <p className="text-[11px] text-amber-700 font-bold mt-0.5">
                        📝 Note: {order.specialNotes}
                      </p>
                    )}

                    <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                      Sent at: {order.timestamp} by {order.chefName} • Paid via {order.paymentMethod}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-base font-black text-emerald-800">
                      {order.totalAmount} ETB
                    </span>
                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-xl">
                      Sent to Owner ✓
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </section>

      {/* ============================================================== */}
      {/* MODAL: LOG DAMAGED BOX / SPILL                                 */}
      {/* ============================================================== */}
      {showWasteModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-emerald-100 shadow-2xl animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>Log Damaged Food Box / Spill (የተበላሸ እቃ)</span>
              </h3>
              <button onClick={() => setShowWasteModal(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleSaveWaste} className="space-y-3.5">
              <div>
                <label className="text-xs font-black text-slate-700">Number of Damaged / Wasted Boxes (🥡)</label>
                <input
                  type="number"
                  min="1"
                  value={wasteCountInput}
                  onChange={(e) => setWasteCountInput(e.target.value)}
                  className="mt-1 w-full bg-emerald-50/40 border border-emerald-200 rounded-2xl px-3.5 py-2 text-xs font-black outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-700">Reason</label>
                <select
                  value={wasteReason}
                  onChange={(e) => setWasteReason(e.target.value)}
                  className="mt-1 w-full bg-emerald-50/40 border border-emerald-200 rounded-2xl px-3.5 py-2 text-xs font-black outline-none"
                >
                  <option value="Box Damaged / Dropped">🥡 Box Damaged / Dropped on Floor</option>
                  <option value="Salad Remake / Customer Change">🥗 Remade Salad / Food Spilled</option>
                  <option value="Defective Box Packaging">📦 Defective Packaging Batch</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowWasteModal(false)} className="px-4 py-2 text-xs font-bold text-slate-600">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-xs font-black shadow-md">
                  Report Damaged Box
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ADD NEW FOOD DISH                                       */}
      {/* ============================================================== */}
      {showAddDishModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-emerald-100 shadow-2xl animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-600" />
                <span>Add New Takeaway Dish to Menu</span>
              </h3>
              <button onClick={() => setShowAddDishModal(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleCreateDish} className="space-y-4">
              <div>
                <label className="text-xs font-black text-slate-700 block mb-1">
                  Dish Photo (Upload from Phone or Computer)
                </label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-36 rounded-2xl border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/50 flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden"
                >
                  {newDishImagePreview ? (
                    <img src={newDishImagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center space-y-1">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mx-auto text-emerald-600 shadow-sm">
                        <Upload className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-black text-emerald-700 block">Click to select photo</span>
                      <span className="text-[10px] text-slate-400">JPG, PNG, WebP supported</span>
                    </div>
                  )}
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black text-slate-700">Dish Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Avocado Chicken Wrap"
                    value={newDishName}
                    onChange={(e) => setNewDishName(e.target.value)}
                    className="mt-1 w-full bg-emerald-50/40 border border-emerald-200 rounded-xl px-3 py-2 text-xs font-black outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700">Price (ETB)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="300"
                    value={newDishPrice}
                    onChange={(e) => setNewDishPrice(e.target.value)}
                    className="mt-1 w-full bg-emerald-50/40 border border-emerald-200 rounded-xl px-3 py-2 text-xs font-black outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-slate-700">Description / Ingredients</label>
                <input
                  type="text"
                  placeholder="e.g. Fresh lettuce, tomato, grilled chicken..."
                  value={newDishDesc}
                  onChange={(e) => setNewDishDesc(e.target.value)}
                  className="mt-1 w-full bg-emerald-50/40 border border-emerald-200 rounded-xl px-3 py-2 text-xs font-black outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddDishModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black rounded-2xl text-xs shadow-md shadow-emerald-700/20"
                >
                  Save Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
