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
  Sun, 
  Moon, 
  Box, 
  Receipt,
  ArrowRight,
  ArrowLeft,
  User,
  Users,
  BarChart3,
  Sparkles,
  RefreshCw,
  Calendar,
  Edit3,
  Lock,
  Unlock,
  Key,
  ShieldCheck,
  Eye,
  EyeOff,
  LogOut,
  Settings,
  Smartphone,
  Download
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

export const ETHIOPIAN_MONTHS = [
  { id: 1, name: 'መስከረም', english: 'Meskerem', maxDays: 30 },
  { id: 2, name: 'ጥቅምት', english: 'Tikimt', maxDays: 30 },
  { id: 3, name: 'ኅዳር', english: 'Hidar', maxDays: 30 },
  { id: 4, name: 'ታኅሣሥ', english: 'Tahsas', maxDays: 30 },
  { id: 5, name: 'ጥር', english: 'Tir', maxDays: 30 },
  { id: 6, name: 'የካቲት', english: 'Yekatit', maxDays: 30 },
  { id: 7, name: 'መጋቢት', english: 'Megabit', maxDays: 30 },
  { id: 8, name: 'ሚያዝያ', english: 'Miyazya', maxDays: 30 },
  { id: 9, name: 'ግንቦት', english: 'Ginbot', maxDays: 30 },
  { id: 10, name: 'ሰኔ', english: 'Sene', maxDays: 30 },
  { id: 11, name: 'ሐምሌ', english: 'Hamle', maxDays: 30 },
  { id: 12, name: 'ነሐሴ', english: 'Nehase', maxDays: 30 },
  { id: 13, name: 'ጳጉሜ', english: 'Pagume', maxDays: 6 }
];

export function getTodayEthiopianDate(d = new Date()) {
  const year = d.getFullYear();
  const month = d.getMonth() + 1; // 1-12
  const day = d.getDate();

  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  const jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;

  const r = (jdn - 1723856) % 1461;
  const n = (r % 365) + 365 * Math.floor(r / 1460);
  const ethYear = 4 * Math.floor((jdn - 1723856) / 1461) + Math.floor(r / 365) - Math.floor(r / 1460);
  const ethMonthIndex = Math.floor(n / 30);
  const ethDay = (n % 30) + 1;

  const monthObj = ETHIOPIAN_MONTHS[ethMonthIndex] || ETHIOPIAN_MONTHS[0];

  return {
    year: ethYear,
    monthId: monthObj.id,
    monthName: monthObj.name,
    monthEnglish: monthObj.english,
    day: ethDay,
    formatted: `${monthObj.name} ${ethDay}, ${ethYear} ዓ.ም`
  };
}

export const DEFAULT_WAITERS = [
  { amharic: 'ሀብታሙ', english: 'Habtamu', fullName: 'ሀብታሙ (Habtamu)', emoji: '👨‍🍳' },
  { amharic: 'ወንዴ', english: 'Wende', fullName: 'ወንዴ (Wende)', emoji: '👨‍🍳' },
  { amharic: 'ዳዊት', english: 'Dawit', fullName: 'ዳዊት (Dawit)', emoji: '👨‍🍳' },
  { amharic: 'የቢዩ አሽከርካሪ', english: 'BEU Driver', fullName: 'የቢዩ አሽከርካሪ (BEU Driver)', emoji: '🛵' },
  { amharic: 'ፋሲል', english: 'Fassil', fullName: 'ፋሲል (Fassil)', emoji: '👨‍🍳' },
  { amharic: 'በለጠ', english: 'Belete', fullName: 'በለጠ (Belete)', emoji: '👨‍🍳' }
];

export default function App() {
  // --- SECURITY & PASSWORD AUTHENTICATION STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('maraki_is_authenticated') === 'true';
  });
  const [authRole, setAuthRole] = useState(() => {
    return localStorage.getItem('maraki_auth_role') || 'owner'; // 'owner' or 'chef'
  });
  const [ownerPassword, setOwnerPassword] = useState(() => {
    return localStorage.getItem('maraki_owner_password') || '1234';
  });
  const [chefPin, setChefPin] = useState(() => {
    return localStorage.getItem('maraki_chef_pin') || '0000';
  });

  // Login Form States
  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState(null);
  const [showPasswordText, setShowPasswordText] = useState(false);

  // Password Settings Modal
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [newOwnerPassInput, setNewOwnerPassInput] = useState('');
  const [newChefPinInput, setNewChefPinInput] = useState('');

  // Owner Authorization Prompt (When Chef clicks Reports)
  const [showOwnerAuthPrompt, setShowOwnerAuthPrompt] = useState(false);
  const [ownerPromptInput, setOwnerPromptInput] = useState('');
  const [ownerPromptError, setOwnerPromptError] = useState(null);

  // Navigation: 'order' (Simple Stepper POS) vs 'reports' (Owner Dashboard)
  const [viewMode, setViewMode] = useState('order');

  // --- PWA MOBILE / DESKTOP APP INSTALL STATE ---
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [canInstallPWA, setCanInstallPWA] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstallPWA(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setCanInstallPWA(false);
        showToast('🎉 አፕሊኬሽኑ ተጭኗል!');
      }
      setDeferredPrompt(null);
    } else {
      alert("📱 በስልክዎ ወይም በኮምፒውተርዎ ላይ አፑን ለመጫን:\n\n• በ Chrome: ከላይ ባለ ሶስት ነጥብ (⋮) ነክተው 'Install app' ወይም 'Add to Home Screen' ይጫኑ።\n• በ Safari (iPhone): ከታች Share (ማጋሪያ) ምልክት ነክተው 'Add to Home Screen' ይጫኑ።");
    }
  };

  // --- AUTOMATIC ETHIOPIAN CALENDAR STATE ---
  const [orderEthDate, setOrderEthDate] = useState(() => getTodayEthiopianDate());
  const [showEthDateModal, setShowEthDateModal] = useState(false);
  const [editingDateTarget, setEditingDateTarget] = useState('current'); // 'current' or orderId
  const [modalDay, setModalDay] = useState(orderEthDate.day);
  const [modalMonthId, setModalMonthId] = useState(orderEthDate.monthId);
  const [modalYear, setModalYear] = useState(orderEthDate.year);

  // --- ORDER STEPPER STATE (1: Food -> 2: Shift/BEU -> 3: Waiter -> 4: Submit) ---
  const [orderStep, setOrderStep] = useState(1);

  // Cart / Food Selection
  const [cart, setCart] = useState([]);

  // Step 2 Selection: 'Day' | 'Night' | 'BEU'
  const [selectedShiftType, setSelectedShiftType] = useState('Day'); // 'Day', 'Night', 'BEU'
  const [beuOrderId, setBeuOrderId] = useState('');

  // Step 3 Selection: Waiter who takes it
  const [waitersList, setWaitersList] = useState(() => {
    const saved = localStorage.getItem('maraki_waiters_list_v3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].amharic) {
          return parsed;
        }
      } catch (e) {
        console.warn('Fallback to default waiters');
      }
    }
    return DEFAULT_WAITERS;
  });
  const [selectedWaiter, setSelectedWaiter] = useState('ሀብታሙ (Habtamu)');
  const [customWaiterName, setCustomWaiterName] = useState('');
  const [showAddWaiterInput, setShowAddWaiterInput] = useState(false);

  // Order Submission Success Flash Modal
  const [orderSuccessModal, setOrderSuccessModal] = useState(null);

  // Database of Sent Orders
  const [sentOrders, setSentOrders] = useState(() => {
    const saved = localStorage.getItem('maraki_chef_sent_orders');
    return saved ? JSON.parse(saved) : [];
  });

  // Food Menu & Filtering
  const [foodMenu, setFoodMenu] = useState(() => {
    const saved = localStorage.getItem('maraki_chef_food_menu_v2');
    return saved ? JSON.parse(saved) : MARAKI_REAL_FOOD_MENU;
  });
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Damaged Boxes Tracking
  const [wasteBoxes, setWasteBoxes] = useState(() => {
    const saved = localStorage.getItem('maraki_waste_boxes');
    return saved ? Number(saved) : 1;
  });
  const [showWasteModal, setShowWasteModal] = useState(false);
  const [wasteCountInput, setWasteCountInput] = useState(1);
  const [wasteReason, setWasteReason] = useState('Box Damaged / Dropped');

  // Toast message
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Persist State
  useEffect(() => {
    localStorage.setItem('maraki_chef_sent_orders', JSON.stringify(sentOrders));
  }, [sentOrders]);

  useEffect(() => {
    localStorage.setItem('maraki_waiters_list_v3', JSON.stringify(waitersList));
  }, [waitersList]);

  useEffect(() => {
    localStorage.setItem('maraki_waste_boxes', wasteBoxes.toString());
  }, [wasteBoxes]);

  // --- CART / FOOD SELECTION ACTIONS ---
  const toggleOrAddFood = (dish) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === dish.id);
      if (existing) {
        return prev.map(i => i.id === dish.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...dish, qty: 1 }];
    });
  };

  const updateCartQty = (dishId, delta) => {
    setCart(prev => prev.map(i => {
      if (i.id === dishId) {
        const nextQty = i.qty + delta;
        return nextQty > 0 ? { ...i, qty: nextQty } : null;
      }
      return i;
    }).filter(Boolean));
  };

  const removeDishFromCart = (dishId) => {
    setCart(prev => prev.filter(i => i.id !== dishId));
  };

  const clearCurrentOrder = () => {
    setCart([]);
    setOrderStep(1);
    setBeuOrderId('');
    setCustomWaiterName('');
    setShowAddWaiterInput(false);
  };

  // Packaging & Amount Math (Every single dish item is 100% takeaway = 1 Box)
  const totalSubtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const totalBoxesInOrder = cart.reduce((sum, item) => sum + item.qty, 0);

  // --- SUBMIT ORDER ---
  const handleFinalSubmit = async () => {
    if (cart.length === 0) {
      showToast('⚠️ እባክዎ ቢያንስ አንድ ምግብ ይምረጡ (Please choose at least 1 food item)');
      setOrderStep(1);
      return;
    }

    const effectiveWaiter = customWaiterName.trim() || selectedWaiter;
    const isBeu = selectedShiftType === 'BEU';
    const shiftLabel = isBeu ? 'Day Shift' : (selectedShiftType === 'Day' ? 'Day Shift' : 'Night Shift');
    const channelLabel = isBeu ? 'BEU Delivery' : 'In-Store Takeaway';
    const finalPayment = isBeu ? 'BEU Account' : 'Kitchen Dispatch';

    const orderId = `food-${Date.now()}`;
    const orderData = {
      id: orderId,
      chefName: 'Chef Almaz',
      shift: shiftLabel,
      channel: channelLabel,
      waiterName: effectiveWaiter,
      ethiopianDate: orderEthDate.formatted,
      ethiopianDay: orderEthDate.day,
      ethiopianMonth: orderEthDate.monthName,
      ethiopianYear: orderEthDate.year,
      beuOrderId: isBeu ? (beuOrderId.trim() || 'BEU-Direct') : null,
      paymentMethod: finalPayment,
      totalAmount: totalSubtotal,
      boxesCount: totalBoxesInOrder,
      items: cart.map(i => ({
        id: i.id,
        name: i.name,
        englishName: i.englishName,
        qty: i.qty,
        price: i.price
      })),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString()
    };

    // Save locally
    setSentOrders(prev => [orderData, ...prev]);

    // Send to Supabase
    await dbService.saveOrder({
      ...orderData,
      staffName: 'Chef Almaz',
      cupsCount: 0,
      boxesUsed: totalBoxesInOrder
    });

    // If new custom waiter was typed, save to permanent list
    if (customWaiterName.trim()) {
      const name = customWaiterName.trim();
      const existing = waitersList.find(w => w.fullName === name || w.amharic === name || w.english === name);
      if (!existing) {
        setWaitersList(prev => [...prev, { amharic: name, english: name, fullName: name, emoji: '👤' }]);
      }
    }

    // Show big success confirmation modal
    setOrderSuccessModal({
      ...orderData,
      foodSummary: cart.map(i => `${i.qty}x ${i.name}`).join(', ')
    });

    // Reset current order
    clearCurrentOrder();
  };

  // Add custom waiter permanently
  const handleAddCustomWaiter = (e) => {
    e.preventDefault();
    if (customWaiterName.trim()) {
      const name = customWaiterName.trim();
      const existing = waitersList.find(w => w.fullName === name || w.amharic === name || w.english === name);
      if (!existing) {
        setWaitersList(prev => [...prev, { amharic: name, english: name, fullName: name, emoji: '👤' }]);
      }
      setSelectedWaiter(name);
      setCustomWaiterName('');
      setShowAddWaiterInput(false);
      showToast(`Added "${name}" to Waiters`);
    }
  };

  // --- ETHIOPIAN DATE MODAL HANDLERS ---
  const openEthDateModal = (target = 'current', targetOrder = null) => {
    setEditingDateTarget(target);
    if (target === 'current') {
      setModalDay(orderEthDate.day);
      setModalMonthId(orderEthDate.monthId);
      setModalYear(orderEthDate.year);
    } else if (targetOrder) {
      setModalDay(targetOrder.ethiopianDay || 10);
      const mObj = ETHIOPIAN_MONTHS.find(m => m.name === targetOrder.ethiopianMonth) || ETHIOPIAN_MONTHS[2];
      setModalMonthId(mObj.id);
      setModalYear(targetOrder.ethiopianYear || 2019);
    }
    setShowEthDateModal(true);
  };

  const handleSaveEthDate = (e) => {
    e?.preventDefault();
    const monthObj = ETHIOPIAN_MONTHS.find(m => m.id === Number(modalMonthId)) || ETHIOPIAN_MONTHS[0];
    const formatted = `${monthObj.name} ${modalDay}, ${modalYear} ዓ.ም`;

    if (editingDateTarget === 'current') {
      setOrderEthDate({
        day: Number(modalDay),
        monthId: monthObj.id,
        monthName: monthObj.name,
        monthEnglish: monthObj.english,
        year: Number(modalYear),
        formatted
      });
      showToast(`ቀን ተስተካክሏል፡ ${formatted}`);
    } else {
      // Edit past order in sentOrders
      setSentOrders(prev => prev.map(o => {
        if (o.id === editingDateTarget) {
          return {
            ...o,
            ethiopianDate: formatted,
            ethiopianDay: Number(modalDay),
            ethiopianMonth: monthObj.name,
            ethiopianYear: Number(modalYear)
          };
        }
        return o;
      }));
      showToast(`የትዕዛዝ ቀን ተስተካክሏል፡ ${formatted}`);
    }
    setShowEthDateModal(false);
  };

  const handleResetToTodayEthDate = () => {
    const today = getTodayEthiopianDate();
    setModalDay(today.day);
    setModalMonthId(today.monthId);
    setModalYear(today.year);
    showToast(`ወደ ዛሬ ቀን ተመልሷል፡ ${today.formatted}`);
  };

  // --- AUTHENTICATION & LOCK HANDLERS ---
  const handleLoginSubmit = (e) => {
    if (e) e.preventDefault();
    const entered = pinInput.trim();
    if (!entered) {
      setLoginError('እባክዎ የይለፍ ቃል ያስገቡ (Please enter password)');
      return;
    }

    if (entered === ownerPassword) {
      setIsAuthenticated(true);
      setAuthRole('owner');
      localStorage.setItem('maraki_is_authenticated', 'true');
      localStorage.setItem('maraki_auth_role', 'owner');
      setPinInput('');
      setLoginError(null);
      showToast('👑 እንደ ባለቤት ገብተዋል (Logged in as Owner)');
    } else if (entered === chefPin) {
      setIsAuthenticated(true);
      setAuthRole('chef');
      setViewMode('order');
      localStorage.setItem('maraki_is_authenticated', 'true');
      localStorage.setItem('maraki_auth_role', 'chef');
      setPinInput('');
      setLoginError(null);
      showToast('👩‍🍳 እንደ ሼፍ ገብተዋል (Logged in as Chef)');
    } else {
      setLoginError('❌ የተሳሳተ የይለፍ ቃል ነው፤ እባክዎ እንደገና ይሞክሩ');
    }
  };

  const handleKeypadPress = (val) => {
    setLoginError(null);
    if (val === 'backspace') {
      setPinInput(prev => prev.slice(0, -1));
    } else if (val === 'clear') {
      setPinInput('');
    } else {
      setPinInput(prev => prev + val);
    }
  };

  const handleLockApp = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('maraki_is_authenticated');
    setPinInput('');
    setLoginError(null);
    showToast('🔒 ሲስተሙ ተቆልፏል (App Locked)');
  };

  const handleSwitchToReports = () => {
    if (authRole === 'owner') {
      setViewMode('reports');
    } else {
      setOwnerPromptInput('');
      setOwnerPromptError(null);
      setShowOwnerAuthPrompt(true);
    }
  };

  const handleVerifyOwnerForReports = (e) => {
    e.preventDefault();
    if (ownerPromptInput.trim() === ownerPassword) {
      setShowOwnerAuthPrompt(false);
      setAuthRole('owner');
      localStorage.setItem('maraki_auth_role', 'owner');
      setViewMode('reports');
      showToast('👑 የባለቤት ሪፖርት ተከፍቷል (Reports Unlocked)');
    } else {
      setOwnerPromptError('❌ የተሳሳተ የባለቤት የይለፍ ቃል ነው');
    }
  };

  const handleSaveNewPasswords = (e) => {
    e.preventDefault();
    let updated = false;
    if (newOwnerPassInput.trim()) {
      setOwnerPassword(newOwnerPassInput.trim());
      localStorage.setItem('maraki_owner_password', newOwnerPassInput.trim());
      updated = true;
    }
    if (newChefPinInput.trim()) {
      setChefPin(newChefPinInput.trim());
      localStorage.setItem('maraki_chef_pin', newChefPinInput.trim());
      updated = true;
    }
    if (updated) {
      setNewOwnerPassInput('');
      setNewChefPinInput('');
      setShowSettingsModal(false);
      showToast('✅ አዲስ የይለፍ ቃሎች ተመዝግበዋል (Passwords updated)');
    } else {
      showToast('ምንም ለውጥ አልተደረገም');
      setShowSettingsModal(false);
    }
  };

  // Filtered dishes for Step 1
  const filteredDishes = foodMenu.filter(item => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      item.name.toLowerCase().includes(q) ||
      (item.englishName && item.englishName.toLowerCase().includes(q));
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // --- STATS FOR OWNER REPORTS ---
  const dayOrders = sentOrders.filter(o => o.shift === 'Day Shift' && o.channel !== 'BEU Delivery');
  const nightOrders = sentOrders.filter(o => o.shift === 'Night Shift' && o.channel !== 'BEU Delivery');
  const beuOrders = sentOrders.filter(o => o.channel === 'BEU Delivery');

  const dayBoxes = dayOrders.reduce((sum, o) => sum + (o.boxesCount || 0), 0);
  const nightBoxes = nightOrders.reduce((sum, o) => sum + (o.boxesCount || 0), 0);
  const beuBoxes = beuOrders.reduce((sum, o) => sum + (o.boxesCount || 0), 0);
  const totalBoxesAll = sentOrders.reduce((sum, o) => sum + (o.boxesCount || 0), 0);

  const dayRevenue = dayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const nightRevenue = nightOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const beuRevenue = beuOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalRevenueAll = sentOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  // Breakdown by Food Dishes (All 16)
  const dishBreakdown = foodMenu.map(dish => {
    let countSold = 0;
    let revenue = 0;
    sentOrders.forEach(order => {
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
      boxesUsed: countSold,
      revenueGenerated: revenue
    };
  });

  // Breakdown by Waiter
  const waiterStats = {};
  sentOrders.forEach(order => {
    const w = order.waiterName || 'Unassigned';
    if (!waiterStats[w]) {
      waiterStats[w] = { ordersCount: 0, boxesCount: 0, totalETB: 0 };
    }
    waiterStats[w].ordersCount += 1;
    waiterStats[w].boxesCount += (order.boxesCount || 0);
    waiterStats[w].totalETB += order.totalAmount;
  });

  // Delete Order (Owner correction)
  const handleDeleteOrder = (orderId) => {
    if (window.confirm('ይህን ትዕዛዝ በእርግጥ መሰረዝ ይፈልጋሉ? (Are you sure you want to delete this order?)')) {
      setSentOrders(prev => prev.filter(o => o.id !== orderId));
      showToast('Order deleted');
    }
  };

  // ==============================================================
  // 🔒 LOCK SCREEN / PASSWORD LOGIN SCREEN
  // ==============================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-950 flex flex-col items-center justify-center p-4 selection:bg-emerald-500 selection:text-white">
        <div className="w-full max-w-sm bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-7 shadow-2xl border border-white/30 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
          
          {/* Logo & Header */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center text-3xl shadow-lg shadow-emerald-900/30 mb-2.5">
              👩‍🍳
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">MARAKI</h1>
            <p className="text-xs font-black text-emerald-700 uppercase tracking-wider">
              Food Station & Management
            </p>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              <Lock className="w-3 h-3 text-emerald-600" />
              <span>የደህንነት መግቢያ (Security Passcode)</span>
            </div>
          </div>

          {/* Password Input Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-3">
            <div className="relative">
              <input
                type={showPasswordText ? "text" : "password"}
                placeholder="የይለፍ ቃል / PIN ያስገቡ..."
                value={pinInput}
                onChange={(e) => { setPinInput(e.target.value); setLoginError(null); }}
                className="w-full bg-slate-50 border-2 border-emerald-200 focus:border-emerald-500 rounded-2xl py-3.5 pl-10 pr-10 text-center font-black text-lg text-slate-900 tracking-widest placeholder:tracking-normal placeholder:font-bold placeholder:text-xs placeholder:text-slate-400 outline-none transition-all shadow-inner"
                autoFocus
              />
              <Key className="w-4 h-4 text-emerald-600 absolute left-3.5 top-4" />
              <button
                type="button"
                onClick={() => setShowPasswordText(!showPasswordText)}
                className="absolute right-3.5 top-4 text-slate-400 hover:text-slate-600"
              >
                {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Error Message */}
            {loginError && (
              <p className="text-xs font-black text-rose-600 bg-rose-50 py-1.5 px-3 rounded-xl border border-rose-200 animate-in shake">
                {loginError}
              </p>
            )}

            {/* Touch Keypad */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeypadPress(num.toString())}
                  className="py-3 bg-slate-100 hover:bg-emerald-50 active:bg-emerald-100 text-slate-800 hover:text-emerald-900 font-black text-lg rounded-2xl border border-slate-200/80 transition-all active:scale-95 shadow-sm"
                >
                  {num}
                </button>
              ))}

              <button
                type="button"
                onClick={() => handleKeypadPress('clear')}
                className="py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-xs rounded-2xl border border-rose-200 transition-all active:scale-95"
              >
                አጥፋ
              </button>

              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                className="py-3 bg-slate-100 hover:bg-emerald-50 active:bg-emerald-100 text-slate-800 hover:text-emerald-900 font-black text-lg rounded-2xl border border-slate-200/80 transition-all active:scale-95 shadow-sm"
              >
                0
              </button>

              <button
                type="button"
                onClick={() => handleKeypadPress('backspace')}
                className="py-3 bg-amber-50 hover:bg-amber-100 text-amber-800 font-black text-sm rounded-2xl border border-amber-200 transition-all active:scale-95 flex items-center justify-center"
              >
                ⌫
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-800/25 active:scale-95 transition-all flex items-center justify-center gap-2 mt-2"
            >
              <Unlock className="w-4 h-4" />
              <span>ክፈት / ግባ (Unlock)</span>
            </button>
          </form>

          {/* Quick Default Passwords Guide */}
          <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-100/80 text-left text-[11px] font-bold text-slate-600 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">
              💡 የመጀመሪያ ይለፍ ቃሎች (Default Passwords):
            </span>
            <div className="flex items-center justify-between text-slate-700">
              <span>👑 የባለቤት መግቢያ (Owner):</span>
              <button 
                type="button" 
                onClick={() => setPinInput(ownerPassword)} 
                className="font-black text-emerald-800 hover:underline bg-white px-2 py-0.5 rounded border border-emerald-200"
              >
                {ownerPassword}
              </button>
            </div>
            <div className="flex items-center justify-between text-slate-700">
              <span>👩‍🍳 የሼፍ / ኩሽና መግቢያ (Chef):</span>
              <button 
                type="button" 
                onClick={() => setPinInput(chefPin)} 
                className="font-black text-emerald-800 hover:underline bg-white px-2 py-0.5 rounded border border-emerald-200"
              >
                {chefPin}
              </button>
            </div>
          </div>

          {/* Install App Link */}
          <button
            type="button"
            onClick={handleInstallApp}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 transition-all border border-slate-200"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            <span>📲 አፑን በስልክዎ ላይ ይጫኑ (Install App)</span>
          </button>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-sans text-slate-800 antialiased selection:bg-emerald-600 selection:text-white">
      
      {/* ============================================================== */}
      {/* VIBRANT TOP APP BAR                                             */}
      {/* ============================================================== */}
      <header className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white sticky top-0 z-50 shadow-lg shadow-emerald-800/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-xl shadow-inner">
              👩‍🍳
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-lg tracking-tight text-white drop-shadow-sm">MARAKI</h1>
                <span className="text-[10px] font-black uppercase tracking-wider bg-white text-emerald-800 px-2 py-0.5 rounded-full shadow-sm">
                  Food Station
                </span>
              </div>
              <p className="text-[11px] text-emerald-100 flex items-center gap-1 font-bold">
                <span>100% Takeaway</span>
                <span className="text-white/40">•</span>
                <span>🥡 1 Box per Dish</span>
              </p>
            </div>
          </div>

          {/* Automatic Ethiopian Date Badge (Click to Edit) */}
          <button
            type="button"
            onClick={() => openEthDateModal('current')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-2xl border border-white/25 text-white font-black text-xs shadow-inner transition-all hover:scale-[1.02]"
            title="የኢትዮጵያ ቀን ቀይር / Edit Ethiopian Date"
          >
            <Calendar className="w-3.5 h-3.5 text-amber-300" />
            <span>{orderEthDate.formatted}</span>
            <span className="text-[10px] bg-black/20 text-emerald-200 px-1.5 py-0.5 rounded-lg border border-white/10 flex items-center gap-0.5 font-bold">
              <Edit3 className="w-2.5 h-2.5" />
              <span>ቀይር</span>
            </span>
          </button>

          {/* Clean View Mode Switcher: New Order vs Owner Reports */}
          <div className="flex items-center gap-2">
            <div className="flex bg-black/20 p-1 rounded-2xl border border-white/20">
              <button
                type="button"
                onClick={() => setViewMode('order')}
                className={`px-3.5 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all ${
                  viewMode === 'order'
                    ? 'bg-white text-emerald-800 shadow-md scale-[1.02]'
                    : 'text-white hover:text-emerald-100'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>ትዕዛዝ አስገባ (Order)</span>
              </button>

              <button
                type="button"
                onClick={handleSwitchToReports}
                className={`px-3.5 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all ${
                  viewMode === 'reports'
                    ? 'bg-white text-emerald-800 shadow-md scale-[1.02]'
                    : 'text-white hover:text-emerald-100'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>የባለቤት ሪፖርት (Reports)</span>
              </button>
            </div>

            {/* Role Badge */}
            <span className={`px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1 border shadow-sm ${
              authRole === 'owner'
                ? 'bg-amber-400 text-slate-950 border-amber-300'
                : 'bg-white/20 text-white border-white/20'
            }`}>
              {authRole === 'owner' ? '👑 ባለቤት' : '👩‍🍳 ሼፍ'}
            </span>

            {/* If Owner: Settings Button to Change Passwords */}
            {authRole === 'owner' && (
              <button
                type="button"
                onClick={() => {
                  setNewOwnerPassInput(ownerPassword);
                  setNewChefPinInput(chefPin);
                  setShowSettingsModal(true);
                }}
                className="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-black border border-white/20 transition-all shadow-sm"
                title="የይለፍ ቃል ቀይር / Change Passwords"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}

            {/* Install App Button */}
            <button
              type="button"
              onClick={handleInstallApp}
              className="px-2.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1 shadow-md transition-all active:scale-95"
              title="አፕሊኬሽኑን በስልክዎ ወይም በኮምፒውተርዎ ላይ ይጫኑ / Install App"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden md:inline">አፑን ጫን</span>
            </button>

            {/* Lock App Button */}
            <button
              type="button"
              onClick={handleLockApp}
              className="px-2.5 py-1.5 bg-rose-500/80 hover:bg-rose-600 text-white rounded-xl text-xs font-black flex items-center gap-1 border border-rose-400/30 transition-all shadow-sm"
              title="ሲስተሙን ቆልፍ / Lock App"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ቆልፍ</span>
            </button>
          </div>

        </div>
      </header>

      {/* Global Toast */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-slate-900/90 backdrop-blur-md text-white text-xs font-black rounded-2xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. SIMPLE 4-STEP ORDERING WIZARD                                */}
      {/* ============================================================== */}
      {viewMode === 'order' && (
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full pb-28">
          
          {/* STEP PROGRESS INDICATOR */}
          <div className="mb-6 bg-white p-3.5 rounded-3xl shadow-md shadow-emerald-900/5 border border-emerald-100">
            <div className="grid grid-cols-4 gap-2 text-center">
              
              {/* Step 1 Pill */}
              <button
                type="button"
                onClick={() => setOrderStep(1)}
                className={`flex flex-col items-center py-2 px-1 rounded-2xl transition-all ${
                  orderStep === 1 
                    ? 'bg-emerald-600 text-white font-black shadow-md shadow-emerald-600/30' 
                    : orderStep > 1 
                      ? 'bg-emerald-50 text-emerald-800 font-bold hover:bg-emerald-100' 
                      : 'text-slate-400 font-semibold'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs">
                  <span>1. ምግብ</span>
                  {cart.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-900 text-[10px] font-black flex items-center justify-center">
                      {cart.reduce((s, i) => s + i.qty, 0)}
                    </span>
                  )}
                </div>
                <span className="text-[10px] opacity-80 hidden sm:inline">Choose Food</span>
              </button>

              {/* Step 2 Pill */}
              <button
                type="button"
                disabled={cart.length === 0}
                onClick={() => cart.length > 0 && setOrderStep(2)}
                className={`flex flex-col items-center py-2 px-1 rounded-2xl transition-all ${
                  orderStep === 2 
                    ? 'bg-emerald-600 text-white font-black shadow-md shadow-emerald-600/30' 
                    : orderStep > 2 
                      ? 'bg-emerald-50 text-emerald-800 font-bold hover:bg-emerald-100' 
                      : 'text-slate-400 font-semibold disabled:opacity-40'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs">
                  <span>2. ፈረቃ / ቢዩ</span>
                </div>
                <span className="text-[10px] opacity-80 hidden sm:inline">Day, Night or BEU</span>
              </button>

              {/* Step 3 Pill */}
              <button
                type="button"
                disabled={cart.length === 0}
                onClick={() => cart.length > 0 && setOrderStep(3)}
                className={`flex flex-col items-center py-2 px-1 rounded-2xl transition-all ${
                  orderStep === 3 
                    ? 'bg-emerald-600 text-white font-black shadow-md shadow-emerald-600/30' 
                    : orderStep > 3 
                      ? 'bg-emerald-50 text-emerald-800 font-bold hover:bg-emerald-100' 
                      : 'text-slate-400 font-semibold disabled:opacity-40'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs">
                  <span>3. አስተናጋጅ</span>
                </div>
                <span className="text-[10px] opacity-80 hidden sm:inline">Waiter</span>
              </button>

              {/* Step 4 Pill */}
              <button
                type="button"
                disabled={cart.length === 0}
                onClick={() => cart.length > 0 && setOrderStep(4)}
                className={`flex flex-col items-center py-2 px-1 rounded-2xl transition-all ${
                  orderStep === 4 
                    ? 'bg-emerald-600 text-white font-black shadow-md shadow-emerald-600/30' 
                    : 'text-slate-400 font-semibold disabled:opacity-40'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs">
                  <span>4. አስገባ</span>
                </div>
                <span className="text-[10px] opacity-80 hidden sm:inline">Submit</span>
              </button>

            </div>
          </div>

          {/* ============================================================== */}
          {/* STEP 1: CHOOSE FOOD FROM MENU                                  */}
          {/* ============================================================== */}
          {orderStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* Header Title & Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-emerald-100 shadow-sm">
                <div>
                  <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">
                      1
                    </span>
                    <span>የምግብ አይነት ይምረጡ (Choose Food from Menu)</span>
                  </h2>
                  <p className="text-xs text-slate-400 font-bold mt-0.5">
                    የሚፈልጉትን ምግብ ይጫኑ፤ እያንዳንዱ ምግብ 1 🥡 ቴክአዌይ ቦክስ ያሰላል
                  </p>
                </div>

                {/* Search Box */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="ፈልግ / Search food..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-emerald-50/60 border border-emerald-100 rounded-2xl pl-9 pr-3 py-2 text-xs font-bold text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Category Filter Tabs */}
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
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/20 scale-[1.02]'
                        : 'bg-white text-slate-700 hover:bg-emerald-50 border border-emerald-100'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* 16 FOOD DISHES GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {filteredDishes.map(dish => {
                  const inCart = cart.find(i => i.id === dish.id);
                  return (
                    <div
                      key={dish.id}
                      onClick={() => !inCart && toggleOrAddFood(dish)}
                      className={`relative bg-white rounded-3xl p-3 border transition-all cursor-pointer flex flex-col justify-between group select-none ${
                        inCart 
                          ? 'border-emerald-500 shadow-xl shadow-emerald-600/15 ring-2 ring-emerald-500/30' 
                          : 'border-emerald-100 hover:border-emerald-300 shadow-sm hover:shadow-md'
                      }`}
                    >
                      <div>
                        {/* Food Image */}
                        <div className="w-full h-32 rounded-2xl overflow-hidden relative bg-emerald-50 mb-2.5 shadow-inner">
                          {dish.imageUrl ? (
                            <img 
                              src={dish.imageUrl} 
                              alt={dish.name} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl">
                              {dish.emoji}
                            </div>
                          )}

                          {/* 1 Takeaway Box Tag */}
                          <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-md text-white text-[9px] font-black px-2 py-0.5 rounded-lg border border-white/20">
                            🥡 1 ቦክስ
                          </div>

                          {/* Selected Quantity Indicator Pill */}
                          {inCart && (
                            <div className="absolute top-2 right-2 bg-emerald-600 text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center shadow-lg border border-white">
                              {inCart.qty}
                            </div>
                          )}
                        </div>

                        {/* Dish Details */}
                        <h3 className="font-black text-slate-900 text-xs sm:text-sm leading-snug line-clamp-1">
                          {dish.name}
                        </h3>
                        <span className="text-[10px] font-bold text-emerald-700 block mt-0.5 line-clamp-1">
                          {dish.englishName}
                        </span>
                      </div>

                      {/* Price & Quantity Controls */}
                      <div className="mt-3 pt-2 border-t border-emerald-50 flex items-center justify-between">
                        <span className="font-black text-xs sm:text-sm text-slate-900">
                          {dish.price} <span className="text-[10px] text-slate-400 font-bold">ETB</span>
                        </span>

                        {inCart ? (
                          <div 
                            className="flex items-center gap-1.5 bg-emerald-50 p-1 rounded-xl border border-emerald-200"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => updateCartQty(dish.id, -1)}
                              className="w-7 h-7 rounded-lg bg-white text-emerald-800 hover:bg-emerald-100 flex items-center justify-center font-black shadow-sm"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="font-black text-xs text-emerald-900 px-1">
                              {inCart.qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateCartQty(dish.id, 1)}
                              className="w-7 h-7 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center justify-center font-black shadow-sm"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); toggleOrAddFood(dish); }}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-black flex items-center gap-1 transition-all"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>ምረጥ</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 2: IS IT DAY, NIGHT, OR BEU?                              */}
          {/* ============================================================== */}
          {orderStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-sm text-center max-w-xl mx-auto">
                <span className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 font-black inline-flex items-center justify-center text-sm mb-2">
                  2
                </span>
                <h2 className="text-lg font-black text-slate-900">
                  ቀን፣ ማታ ወይስ ቢዩ? (Day, Night or BEU?)
                </h2>
                <p className="text-xs text-slate-400 font-bold mt-1">
                  ይህ ትዕዛዝ የተዘጋጀው በየትኛው ፈረቃ ነው ወይስ በቢዩ ዴሊቨሪ?
                </p>
              </div>

              {/* 3 BIG VISUAL CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                
                {/* 1. Day Shift Card */}
                <button
                  type="button"
                  onClick={() => setSelectedShiftType('Day')}
                  className={`p-6 rounded-3xl border-2 text-center transition-all flex flex-col items-center justify-center gap-3 ${
                    selectedShiftType === 'Day'
                      ? 'border-amber-500 bg-amber-50/80 shadow-xl shadow-amber-500/10 scale-105'
                      : 'border-emerald-100 bg-white hover:border-amber-200'
                  }`}
                >
                  <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-inner">
                    <Sun className="w-9 h-9" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-slate-900">☀️ ቀን (Day Shift)</h3>
                    <p className="text-xs text-slate-400 font-bold mt-0.5">የቀን ፈረቃ ትዕዛዝ</p>
                  </div>
                  {selectedShiftType === 'Day' && (
                    <span className="text-[11px] font-black text-amber-700 bg-amber-200/60 px-3 py-1 rounded-full">
                      ✓ ተመርጧል (Selected)
                    </span>
                  )}
                </button>

                {/* 2. Night Shift Card */}
                <button
                  type="button"
                  onClick={() => setSelectedShiftType('Night')}
                  className={`p-6 rounded-3xl border-2 text-center transition-all flex flex-col items-center justify-center gap-3 ${
                    selectedShiftType === 'Night'
                      ? 'border-indigo-600 bg-indigo-50/80 shadow-xl shadow-indigo-600/10 scale-105'
                      : 'border-emerald-100 bg-white hover:border-indigo-200'
                  }`}
                >
                  <div className="w-16 h-16 rounded-3xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-inner">
                    <Moon className="w-9 h-9" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-slate-900">🌙 ማታ (Night Shift)</h3>
                    <p className="text-xs text-slate-400 font-bold mt-0.5">የማታ ፈረቃ ትዕዛዝ</p>
                  </div>
                  {selectedShiftType === 'Night' && (
                    <span className="text-[11px] font-black text-indigo-700 bg-indigo-200/60 px-3 py-1 rounded-full">
                      ✓ ተመርጧል (Selected)
                    </span>
                  )}
                </button>

                {/* 3. BEU Delivery Card */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedShiftType('BEU');
                    setSelectedWaiter('የቢዩ አሽከርካሪ (BEU Driver)');
                  }}
                  className={`p-6 rounded-3xl border-2 text-center transition-all flex flex-col items-center justify-center gap-3 ${
                    selectedShiftType === 'BEU'
                      ? 'border-teal-600 bg-teal-50/80 shadow-xl shadow-teal-600/10 scale-105'
                      : 'border-emerald-100 bg-white hover:border-teal-200'
                  }`}
                >
                  <div className="w-16 h-16 rounded-3xl bg-teal-100 text-teal-700 flex items-center justify-center shadow-inner">
                    <Truck className="w-9 h-9" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-slate-900">🛵 ቢዩ (BEU Delivery)</h3>
                    <p className="text-xs text-slate-400 font-bold mt-0.5">የቢዩ አሽከርካሪ ትዕዛዝ</p>
                  </div>
                  {selectedShiftType === 'BEU' && (
                    <span className="text-[11px] font-black text-teal-700 bg-teal-200/60 px-3 py-1 rounded-full">
                      ✓ ተመርጧል (Selected)
                    </span>
                  )}
                </button>

              </div>

              {/* If BEU Delivery is selected, optional BEU Order # input */}
              {selectedShiftType === 'BEU' && (
                <div className="max-w-md mx-auto bg-teal-50 border border-teal-200 p-4 rounded-3xl animate-in fade-in">
                  <label className="block text-xs font-black text-teal-900 mb-1.5">
                    የቢዩ ትዕዛዝ ቁጥር (BEU Order # - Optional):
                  </label>
                  <input
                    type="text"
                    placeholder="ለምሳሌ፡ BEU-4921"
                    value={beuOrderId}
                    onChange={(e) => setBeuOrderId(e.target.value)}
                    className="w-full bg-white border border-teal-300 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              )}

              {/* Step 2 Back & Next Action Buttons */}
              <div className="flex items-center justify-between max-w-2xl mx-auto pt-4">
                <button
                  type="button"
                  onClick={() => setOrderStep(1)}
                  className="px-5 py-3 rounded-2xl bg-white hover:bg-emerald-50 text-slate-700 border border-emerald-200 font-black text-xs flex items-center gap-2 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>ወደ ምግብ መረጣ (Back)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOrderStep(3)}
                  className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-700/20 transition-all scale-[1.02]"
                >
                  <span>ቀጥል ወደ አስተናጋጅ (Next: Waiter)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 3: WHO IS THE WAITER THAT TAKES IT?                        */}
          {/* ============================================================== */}
          {orderStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-sm text-center max-w-xl mx-auto">
                <span className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 font-black inline-flex items-center justify-center text-sm mb-2">
                  3
                </span>
                <h2 className="text-lg font-black text-slate-900">
                  ምግቡን የወሰደው አስተናጋጅ ማን ነው?
                </h2>
                <p className="text-xs text-slate-400 font-bold mt-1">
                  (Who is the Waiter that takes the food?)
                </p>
              </div>

              {/* WAITER SELECTION CARDS (6 OFFICIAL WAITERS) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 max-w-2xl mx-auto">
                {waitersList.map(waiter => {
                  const isSelected = (selectedWaiter === waiter.fullName || selectedWaiter === waiter.amharic) && !customWaiterName.trim();
                  return (
                    <button
                      key={waiter.fullName || waiter.amharic}
                      type="button"
                      onClick={() => {
                        setSelectedWaiter(waiter.fullName || waiter.amharic);
                        setCustomWaiterName('');
                      }}
                      className={`p-4 rounded-3xl border-2 text-center transition-all flex flex-col items-center justify-center gap-2 select-none ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/90 shadow-xl shadow-emerald-600/15 ring-2 ring-emerald-500/30 scale-[1.03]'
                          : 'border-emerald-100 bg-white hover:border-emerald-300 hover:shadow-md'
                      }`}
                    >
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner transition-colors ${
                        isSelected ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {waiter.emoji || '👨‍🍳'}
                      </div>
                      <div className="text-center">
                        <span className="font-black text-sm text-slate-900 block leading-tight">
                          {waiter.amharic}
                        </span>
                        <span className="text-[11px] font-extrabold text-emerald-700 block mt-0.5">
                          {waiter.english}
                        </span>
                      </div>
                      {isSelected && (
                        <span className="text-[10px] font-black text-emerald-800 bg-emerald-200/80 px-2.5 py-0.5 rounded-full mt-0.5">
                          ✓ ተመርጧል (Selected)
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Add Custom Waiter Name Input */}
              <div className="max-w-md mx-auto bg-white p-4 rounded-3xl border border-emerald-100 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-slate-700">ሌላ ስም መጻፍ ይፈልጋሉ? (Custom Name):</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="የአስተናጋጅ ስም ጻፍ (e.g. ሰላማዊት)..."
                    value={customWaiterName}
                    onChange={(e) => setCustomWaiterName(e.target.value)}
                    className="flex-1 bg-emerald-50/60 border border-emerald-200 rounded-2xl px-4 py-2 text-xs font-bold text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {customWaiterName.trim() && (
                    <button
                      type="button"
                      onClick={handleAddCustomWaiter}
                      className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 transition-all"
                    >
                      + አስቀምጥ
                    </button>
                  )}
                </div>
              </div>

              {/* Step 3 Back & Next Action Buttons */}
              <div className="flex items-center justify-between max-w-2xl mx-auto pt-4">
                <button
                  type="button"
                  onClick={() => setOrderStep(2)}
                  className="px-5 py-3 rounded-2xl bg-white hover:bg-emerald-50 text-slate-700 border border-emerald-200 font-black text-xs flex items-center gap-2 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>ወደ ፈረቃ (Back)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOrderStep(4)}
                  className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-700/20 transition-all scale-[1.02]"
                >
                  <span>ቀጥል ወደ ማረጋገጫ (Next: Submit)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 4: REVIEW & SUBMIT TO OWNER                               */}
          {/* ============================================================== */}
          {orderStep === 4 && (
            <div className="space-y-6 animate-in fade-in duration-200 max-w-xl mx-auto">
              
              <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-sm text-center">
                <span className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 font-black inline-flex items-center justify-center text-sm mb-2">
                  4
                </span>
                <h2 className="text-lg font-black text-slate-900">
                  ትዕዛዙን አረጋግጠው ያስገቡ (Confirm & Submit)
                </h2>
                <p className="text-xs text-slate-400 font-bold mt-1">
                  ትዕዛዙ በቀጥታ ወደ ሲስተሙ ዳታቤዝ ይመዘገባል
                </p>
              </div>

              {/* BEAUTIFUL ORDER SUMMARY RECEIPT CARD */}
              <div className="bg-white rounded-3xl p-6 border-2 border-emerald-500 shadow-xl shadow-emerald-700/10 space-y-4">
                
                {/* 1. Food Items List */}
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                    የተመረጡ ምግቦች (Food Items)
                  </span>
                  <div className="space-y-2">
                    {cart.map(item => (
                      <div key={item.id} className="flex items-center justify-between bg-emerald-50/50 p-2.5 rounded-2xl border border-emerald-100">
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{item.emoji || '🍲'}</span>
                          <div>
                            <h4 className="font-black text-xs text-slate-900">{item.name}</h4>
                            <span className="text-[10px] text-slate-400 font-bold">
                              {item.qty} x {item.price} ETB • 🥡 {item.qty} ቦክስ
                            </span>
                          </div>
                        </div>
                        <span className="font-black text-xs text-emerald-800">
                          {item.qty * item.price} ETB
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Key Metadata Badges */}
                <div className="space-y-2.5 pt-2 border-t border-emerald-100">
                  
                  {/* Automatic Ethiopian Date with Quick Edit */}
                  <div className="bg-emerald-50/80 p-3 rounded-2xl border border-emerald-200/90 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-black text-emerald-800 uppercase tracking-wider block">
                        ቀን (Ethiopian Date)
                      </span>
                      <span className="font-black text-xs text-emerald-950 mt-0.5 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{orderEthDate.formatted}</span>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => openEthDateModal('current')}
                      className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 text-[11px] font-black rounded-xl border border-emerald-300 transition-all flex items-center gap-1 shadow-sm"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>ቀይር (Edit)</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Shift / Channel */}
                    <div className="bg-slate-50 p-3 rounded-2xl">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                        ፈረቃ / ዓይነት (Shift)
                      </span>
                      <span className="font-black text-xs text-slate-900 mt-0.5 flex items-center gap-1">
                        {selectedShiftType === 'Day' && '☀️ ቀን (Day Shift)'}
                        {selectedShiftType === 'Night' && '🌙 ማታ (Night Shift)'}
                        {selectedShiftType === 'BEU' && `🛵 ቢዩ (${beuOrderId || 'BEU Order'})`}
                      </span>
                    </div>

                    {/* Waiter */}
                    <div className="bg-slate-50 p-3 rounded-2xl">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                        የወሰደው አስተናጋጅ (Waiter)
                      </span>
                      <span className="font-black text-xs text-slate-900 mt-0.5 flex items-center gap-1">
                        👤 {customWaiterName.trim() || selectedWaiter}
                      </span>
                    </div>
                  </div>

                </div>

                {/* 3. Takeaway Box Tally */}
                <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🥡</span>
                    <div>
                      <span className="font-black text-xs text-emerald-900 block">የወጣ የቴክአዌይ ሳጥን</span>
                      <span className="text-[10px] text-emerald-700 font-bold">100% Takeaway Packaging</span>
                    </div>
                  </div>
                  <span className="text-base font-black text-emerald-900">
                    {totalBoxesInOrder} ቦክስ
                  </span>
                </div>

                {/* 4. Total Price */}
                <div className="pt-3 border-t-2 border-dashed border-emerald-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">
                      አጠቃላይ ድምር ዋጋ
                    </span>
                    <span className="text-[11px] text-emerald-600 font-bold">
                      {totalBoxesInOrder} የተዘጋጀ ምግብ
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-slate-900">
                      {totalSubtotal.toLocaleString()}
                    </span>
                    <span className="text-xs font-black text-emerald-700 ml-1">ETB</span>
                  </div>
                </div>

              </div>

              {/* Step 4 Back & HUGE SUBMIT BUTTON */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  className="w-full py-4 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-base flex items-center justify-center gap-2 shadow-xl shadow-emerald-700/25 active:scale-95 transition-all"
                >
                  <Check className="w-5 h-5" />
                  <span>ትዕዛዙን መዝግብ / አስገባ (Submit Order)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOrderStep(3)}
                  className="w-full py-2.5 rounded-2xl bg-white hover:bg-emerald-50 text-slate-600 border border-emerald-100 font-black text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>ወደ ኋላ ተመለስና አስተካክል (Back to Edit)</span>
                </button>
              </div>

            </div>
          )}

          {/* ============================================================== */}
          {/* FLOATING ACTION BOTTOM BAR (When in Step 1)                      */}
          {/* ============================================================== */}
          {orderStep === 1 && (
            <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-emerald-100 py-3 px-4 shadow-2xl z-40">
              <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
                
                {/* Summary Info */}
                <div>
                  {cart.length > 0 ? (
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-base text-slate-900">
                          {totalSubtotal.toLocaleString()} <span className="text-xs text-emerald-700">ETB</span>
                        </span>
                        <span className="text-xs text-slate-400 font-bold">•</span>
                        <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-lg">
                          🥡 {totalBoxesInOrder} ቦክስ
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-bold truncate max-w-xs sm:max-w-md">
                        {cart.map(i => `${i.qty}x ${i.name}`).join(', ')}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                      <ShoppingBag className="w-4 h-4" />
                      <span>እባክዎ የሚዘጋጀውን ምግብ ይምረጡ (Choose food from menu)</span>
                    </div>
                  )}
                </div>

                {/* Next Button */}
                <div className="flex items-center gap-2">
                  {cart.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCart([])}
                      className="px-3 py-2.5 rounded-2xl text-xs font-black text-rose-600 hover:bg-rose-50 transition-all"
                    >
                      አጥፋ
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={cart.length === 0}
                    onClick={() => setOrderStep(2)}
                    className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white disabled:text-slate-400 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-700/20 disabled:shadow-none transition-all active:scale-95"
                  >
                    <span>ቀጥል (Next: Shift & Waiter)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            </div>
          )}

        </main>
      )}

      {/* ============================================================== */}
      {/* 2. OWNER DASHBOARD & REPORT VIEW                                */}
      {/* ============================================================== */}
      {viewMode === 'reports' && (
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-6 animate-in fade-in duration-200">
          
          {/* Header Title */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-emerald-100 shadow-sm">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-600" />
                <span>የባለቤት መቆጣጠሪያና ሪፖርት (Owner Shift & Food Report)</span>
              </h2>
              <p className="text-xs text-slate-400 font-bold mt-0.5">
                የቀን፣ የማታ እና የቢዩ ፈረቃዎች፣ የተሸጡ ምግቦች እና የወጡ ቴክአዌይ ሳጥኖች ቆጠራ
              </p>
            </div>

            <button
              type="button"
              onClick={() => setViewMode('order')}
              className="px-4 py-2 rounded-2xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-700/20 hover:bg-emerald-700 transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ አዲስ ትዕዛዝ አስገባ</span>
            </button>
          </div>

          {/* 4 SUMMARY STAT CARDS: DAY, NIGHT, BEU & TOTAL BOXES */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            
            {/* 1. Day Shift Card */}
            <div className="bg-white p-4 rounded-3xl border border-amber-200 shadow-sm flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-2xl flex-shrink-0">
                ☀️
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  የቀን ፈረቃ (Day Shift)
                </span>
                <p className="text-lg font-black text-slate-900 mt-0.5">{dayOrders.length} Orders</p>
                <div className="flex items-center gap-2 text-[10px] font-bold text-amber-700 mt-0.5">
                  <span>🥡 {dayBoxes} ቦክስ</span>
                  <span>•</span>
                  <span>{dayRevenue.toLocaleString()} ETB</span>
                </div>
              </div>
            </div>

            {/* 2. Night Shift Card */}
            <div className="bg-white p-4 rounded-3xl border border-indigo-200 shadow-sm flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl flex-shrink-0">
                🌙
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  የማታ ፈረቃ (Night Shift)
                </span>
                <p className="text-lg font-black text-slate-900 mt-0.5">{nightOrders.length} Orders</p>
                <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-700 mt-0.5">
                  <span>🥡 {nightBoxes} ቦክስ</span>
                  <span>•</span>
                  <span>{nightRevenue.toLocaleString()} ETB</span>
                </div>
              </div>
            </div>

            {/* 3. BEU Delivery Card */}
            <div className="bg-white p-4 rounded-3xl border border-teal-200 shadow-sm flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center text-2xl flex-shrink-0">
                🛵
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  ቢዩ (BEU Delivery)
                </span>
                <p className="text-lg font-black text-slate-900 mt-0.5">{beuOrders.length} Orders</p>
                <div className="flex items-center gap-2 text-[10px] font-bold text-teal-700 mt-0.5">
                  <span>🥡 {beuBoxes} ቦክስ</span>
                  <span>•</span>
                  <span>{beuRevenue.toLocaleString()} ETB</span>
                </div>
              </div>
            </div>

            {/* 4. Total Packaging Boxes */}
            <div className="bg-white p-4 rounded-3xl border border-emerald-200 shadow-sm flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl flex-shrink-0">
                🥡
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  ጠቅላላ የወጡ ቦክሶች
                </span>
                <p className="text-lg font-black text-emerald-800 mt-0.5">{totalBoxesAll} Boxes</p>
                <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-700 mt-0.5">
                  <span>ድምር: {totalRevenueAll.toLocaleString()} ETB</span>
                </div>
              </div>
            </div>

          </div>

          {/* FOOD TYPES BREAKDOWN TABLE (ALL 16 DISHES) */}
          <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  🍲 የምግቦች ዝርዝር ቆጠራ (Food Types Breakdown)
                </h3>
                <p className="text-xs text-slate-400 font-bold mt-0.5">
                  ከ16ቱ ምግቦች እያንዳንዱ ስንት ሳህን እንደተሸጠና የወጣው ቦክስ
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-emerald-100 text-slate-400 uppercase text-[9px] font-black tracking-wider">
                    <th className="py-2.5 px-3">ምግብ (Food Dish)</th>
                    <th className="py-2.5 px-3">ምድብ</th>
                    <th className="py-2.5 px-3 text-right">የአንዱ ዋጋ</th>
                    <th className="py-2.5 px-3 text-center">የተዘጋጀ ብዛት</th>
                    <th className="py-2.5 px-3 text-center">🥡 የወጣ ቦክስ</th>
                    <th className="py-2.5 px-3 text-right">የተገኘ ገቢ (ETB)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50">
                  {dishBreakdown.map((item, index) => (
                    <tr key={item.id} className="hover:bg-emerald-50/40 transition-colors">
                      <td className="py-2.5 px-3 font-black text-slate-900 flex items-center gap-2">
                        <span>{item.emoji || '🍲'}</span>
                        <div>
                          <span>{item.name}</span>
                          <span className="block text-[10px] text-slate-400 font-bold">{item.englishName}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-bold">{item.category}</td>
                      <td className="py-2.5 px-3 text-right font-black text-slate-800">{item.price} ETB</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full font-black text-xs ${
                          item.countSold > 0 ? 'bg-emerald-100 text-emerald-800' : 'text-slate-300'
                        }`}>
                          {item.countSold} ሳህን
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                        {item.boxesUsed} 🥡
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-slate-900">
                        {item.revenueGenerated.toLocaleString()} ETB
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* WAITERS BREAKDOWN */}
          <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900">
              👤 በአስተናጋጆች የተወሰደ (Orders by Waiter)
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {Object.keys(waiterStats).length > 0 ? (
                Object.entries(waiterStats).map(([waiter, stats]) => (
                  <div key={waiter} className="bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-100">
                    <span className="font-black text-xs text-slate-900 block truncate">{waiter}</span>
                    <div className="mt-1 space-y-0.5 text-[11px] font-bold text-slate-500">
                      <p>ትዕዛዞች: <span className="font-black text-slate-900">{stats.ordersCount}</span></p>
                      <p>ቦክሶች: <span className="font-black text-emerald-800">{stats.boxesCount} 🥡</span></p>
                      <p>ድምር: <span className="font-black text-slate-900">{stats.totalETB.toLocaleString()} ETB</span></p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 font-bold col-span-full">እስካሁን ምንም ትዕዛዝ አልተመዘገበም</p>
              )}
            </div>
          </div>

          {/* RECENT ORDERS FEED */}
          <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm space-y-3">
            <h3 className="text-sm font-black text-slate-900">
              📋 የቅርብ ጊዜ ትዕዛዞች ዝርዝር (Recent Orders Log)
            </h3>

            {sentOrders.length === 0 ? (
              <p className="text-xs text-slate-400 font-bold py-4 text-center">ምንም ትዕዛዝ የለም</p>
            ) : (
              <div className="space-y-2">
                {sentOrders.slice(0, 15).map(order => (
                  <div 
                    key={order.id}
                    className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-xs">
                        🥡
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900">
                            {order.items?.map(i => `${i.qty}x ${i.name}`).join(', ')}
                          </span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-1.5 py-0.5 rounded">
                            {order.shift}
                          </span>
                          {order.channel === 'BEU Delivery' && (
                            <span className="text-[10px] bg-teal-100 text-teal-800 font-black px-1.5 py-0.5 rounded">
                              {order.beuOrderId || 'BEU'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold mt-0.5">
                          <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-black flex items-center gap-1">
                            📅 {order.ethiopianDate || orderEthDate.formatted}
                          </span>
                          <button
                            type="button"
                            onClick={() => openEthDateModal(order.id, order)}
                            className="text-slate-400 hover:text-emerald-700 underline text-[10px]"
                            title="ቀን ቀይር / Edit Date"
                          >
                            ✏️ ቀይር
                          </button>
                          <span>•</span>
                          <span>{order.timestamp}</span>
                          <span>•</span>
                          <span>ወሳጅ፡ {order.waiterName || 'አልተጠቀሰም'}</span>
                          <span>•</span>
                          <span>{order.boxesCount} ቦክስ</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-black text-slate-900 text-sm">
                        {order.totalAmount} ETB
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteOrder(order.id)}
                        className="text-slate-300 hover:text-rose-500 p-1"
                        title="ሰርዝ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </main>
      )}

      {/* ============================================================== */}
      {/* SUCCESS CONFIRMATION MODAL                                     */}
      {/* ============================================================== */}
      {orderSuccessModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl border-2 border-emerald-500 space-y-4">
            
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-3xl shadow-inner animate-bounce">
              ✅
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">ትዕዛዙ ተመዝግቧል!</h3>
              <p className="text-xs text-slate-500 font-bold mt-1">
                Order Sent & Successfully Logged!
              </p>
            </div>

            <div className="bg-emerald-50 p-4 rounded-2xl text-left text-xs font-bold space-y-1.5 border border-emerald-100">
              <p className="text-slate-900 font-black text-sm">
                {orderSuccessModal.foodSummary}
              </p>
              <p className="text-slate-600">
                ቀን፡ <span className="font-black text-emerald-900">📅 {orderSuccessModal.ethiopianDate || orderEthDate.formatted}</span>
              </p>
              <p className="text-slate-600">
                ፈረቃ፡ <span className="font-black text-slate-900">{orderSuccessModal.shift}</span> ({orderSuccessModal.channel})
              </p>
              <p className="text-slate-600">
                የወሰደው፡ <span className="font-black text-slate-900">{orderSuccessModal.waiterName}</span>
              </p>
              <p className="text-emerald-800 font-black">
                🥡 የወጣ ቦክስ፡ {orderSuccessModal.boxesCount} Takeaway Box
              </p>
              <p className="text-slate-900 font-black text-sm pt-1 border-t border-emerald-200">
                ድምር ዋጋ፡ {orderSuccessModal.totalAmount} ETB
              </p>
            </div>

            <button
              type="button"
              onClick={() => setOrderSuccessModal(null)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl shadow-lg shadow-emerald-700/20 transition-all"
            >
              + ቀጣይ አዲስ ትዕዛዝ አስገባ (Next Order)
            </button>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* AMHARIC / ETHIOPIAN CALENDAR DATE PICKER MODAL                 */}
      {/* ============================================================== */}
      {showEthDateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl border-2 border-emerald-500 space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">የኢትዮጵያ ቀን መምረጫ</h3>
                  <span className="text-[10px] text-slate-400 font-bold block">Ethiopian Calendar Date</span>
                </div>
              </div>

              {/* Reset to Today Button */}
              <button
                type="button"
                onClick={handleResetToTodayEthDate}
                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl font-black text-[11px] flex items-center gap-1 border border-amber-200 transition-all"
                title="ወደ ዛሬ ቀን መልስ"
              >
                <RefreshCw className="w-3 h-3" />
                <span>ዛሬ (Today)</span>
              </button>
            </div>

            {/* Selected Date Preview */}
            <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200 text-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">
                የተመረጠው ቀን (Selected Date)
              </span>
              <p className="text-base font-black text-emerald-900 mt-0.5">
                {ETHIOPIAN_MONTHS.find(m => m.id === Number(modalMonthId))?.name || 'ኅዳር'} {modalDay}, {modalYear} ዓ.ም
              </p>
            </div>

            {/* 1. Month Picker (13 Months) */}
            <div>
              <label className="block text-xs font-black text-slate-700 mb-2">
                1. ወር ይምረጡ (Choose Month):
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                {ETHIOPIAN_MONTHS.map(m => {
                  const isSelected = Number(modalMonthId) === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setModalMonthId(m.id);
                        if (m.id === 13 && modalDay > 6) {
                          setModalDay(5); // Pagume max 5 or 6
                        }
                      }}
                      className={`py-2 px-1 rounded-xl text-xs font-black transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-md scale-[1.02]'
                          : 'bg-slate-50 hover:bg-emerald-50 text-slate-700 border border-slate-100'
                      }`}
                    >
                      <span className="block leading-none">{m.name}</span>
                      <span className={`text-[9px] block mt-0.5 font-bold opacity-75 ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                        {m.english}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Day Picker (1 to 30) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black text-slate-700">
                  2. ቀን ይምረጡ (Choose Day):
                </label>
                <span className="text-[11px] font-black text-emerald-800">
                  ቀን {modalDay}
                </span>
              </div>
              <div className="grid grid-cols-6 gap-1.5 max-h-36 overflow-y-auto p-1 bg-slate-50/60 rounded-2xl border border-slate-100">
                {Array.from({ length: Number(modalMonthId) === 13 ? 6 : 30 }, (_, i) => i + 1).map(dayNum => {
                  const isSelected = Number(modalDay) === dayNum;
                  return (
                    <button
                      key={dayNum}
                      type="button"
                      onClick={() => setModalDay(dayNum)}
                      className={`py-2 rounded-xl text-xs font-black transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-md scale-105'
                          : 'bg-white hover:bg-emerald-50 text-slate-800 border border-slate-200'
                      }`}
                    >
                      {dayNum}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Year Picker (ዓመተ ምሕረት) */}
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5">
                3. ዓመተ ምሕረት (Year):
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {[2016, 2017, 2018, 2019, 2020].map(y => {
                  const isSelected = Number(modalYear) === y;
                  return (
                    <button
                      key={y}
                      type="button"
                      onClick={() => setModalYear(y)}
                      className={`py-2 rounded-xl text-xs font-black transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-md scale-[1.02]'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-100'
                      }`}
                    >
                      {y}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-emerald-100">
              <button
                type="button"
                onClick={() => setShowEthDateModal(false)}
                className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs transition-all"
              >
                ተመለስ (Cancel)
              </button>

              <button
                type="button"
                onClick={handleSaveEthDate}
                className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-lg shadow-emerald-700/20 transition-all"
              >
                ✓ አጽድቅ (Save Date)
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* DAMAGED BOX / SPILL MODAL                                      */}
      {/* ============================================================== */}
      {showWasteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-rose-100 space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-black text-sm text-slate-900">የተበላሸ ቦክስ መዝግብ (Log Waste)</h3>
            </div>
            
            <p className="text-xs text-slate-500 font-bold">
              የወደቀ ወይም የተበላሸ የቴክአዌይ እቃ ሲኖር የቦክስ ቆጠራው ትክክል እንዲሆን እዚህ ይመዝግቡ።
            </p>

            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">ስንት ቦክስ ተበላሸ? (Count)</label>
              <input
                type="number"
                min="1"
                value={wasteCountInput}
                onChange={(e) => setWasteCountInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowWasteModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-xs"
              >
                ተመለስ
              </button>
              <button
                type="button"
                onClick={() => {
                  const count = Number(wasteCountInput) || 1;
                  setWasteBoxes(prev => prev + count);
                  setShowWasteModal(false);
                  showToast(`⚠️ ${count} የተበላሸ ቦክስ ተመዘገበ`);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-xs shadow-md shadow-rose-600/20"
              >
                መዝግብ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECURITY / CHANGE PASSWORDS MODAL                              */}
      {/* ============================================================== */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border-2 border-emerald-500 space-y-4">
            
            <div className="flex items-center gap-2.5 pb-2 border-b border-emerald-100">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Settings className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-900">የይለፍ ቃል መቀየሪያ</h3>
                <span className="text-[10px] text-slate-400 font-bold block">Change Security Passwords</span>
              </div>
            </div>

            <form onSubmit={handleSaveNewPasswords} className="space-y-3.5">
              
              {/* Owner Password */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  👑 የባለቤት አዲስ የይለፍ ቃል (Owner Password):
                </label>
                <input
                  type="text"
                  placeholder={`የአሁኑ፡ ${ownerPassword}`}
                  value={newOwnerPassInput}
                  onChange={(e) => setNewOwnerPassInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-900 outline-none"
                />
              </div>

              {/* Chef PIN */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  👩‍🍳 የሼፍ / ኩሽና አዲስ ፒን (Chef PIN):
                </label>
                <input
                  type="text"
                  placeholder={`የአሁኑ፡ ${chefPin}`}
                  value={newChefPinInput}
                  onChange={(e) => setNewChefPinInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-900 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-xs transition-all"
                >
                  ተመለስ (Cancel)
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs shadow-md shadow-emerald-700/20 transition-all"
                >
                  💾 መዝግብ (Save)
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* OWNER PASSCODE PROMPT MODAL (RESTRICT REPORTS FOR STAFF)       */}
      {/* ============================================================== */}
      {showOwnerAuthPrompt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border-2 border-amber-500 space-y-4 text-center">
            
            <div className="w-14 h-14 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto text-2xl shadow-inner">
              🔒
            </div>

            <div>
              <h3 className="font-black text-base text-slate-900">የባለቤት የይለፍ ቃል</h3>
              <p className="text-xs text-slate-400 font-bold mt-1">
                ይህንን የሂሳብ እና የሽያጭ ሪፖርት ለመክፈት የባለቤት የይለፍ ቃል ያስገቡ።
              </p>
            </div>

            <form onSubmit={handleVerifyOwnerForReports} className="space-y-3">
              <input
                type="password"
                placeholder="የባለቤት የይለፍ ቃል ያስገቡ..."
                value={ownerPromptInput}
                onChange={(e) => { setOwnerPromptInput(e.target.value); setOwnerPromptError(null); }}
                className="w-full bg-slate-50 border-2 border-amber-300 focus:border-amber-500 rounded-2xl py-3 px-4 text-center font-black text-base tracking-widest text-slate-900 outline-none"
                autoFocus
              />

              {ownerPromptError && (
                <p className="text-xs font-black text-rose-600 bg-rose-50 py-1.5 px-3 rounded-xl border border-rose-200">
                  {ownerPromptError}
                </p>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowOwnerAuthPrompt(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-xs"
                >
                  ተመለስ (Cancel)
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-xs shadow-md shadow-amber-500/20"
                >
                  ክፈት (Unlock)
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
