import React, { useState, useEffect, useRef, useDeferredValue, useTransition } from 'react';
import BusinessManagement from './components/BusinessManagement';
import ShiftReconciliation from './components/ShiftReconciliation';
import OwnerIncomeAnalysisReport from './components/OwnerIncomeAnalysisReport';
import OwnerDashboard from './components/OwnerDashboard';
import BoxInventoryAudit from './components/BoxInventoryAudit';
import OwnerMenuPriceManager from './components/OwnerMenuPriceManager';
import { computePackagingAudit, getShiftDefaultWaiters, saveShiftDefaultWaiters, clearAllBusinessData } from './utils/reconciliationHelpers';
import { 
  Plus, 
  Minus, 
  Trash2, 
  Check, 
  CheckCircle2, 
  ClipboardCheck,
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
  Download,
  Printer,
  Filter,
  FileText,
  Package,
  TrendingUp,
  Award,
  X,
  BellRing,
  LayoutDashboard,
  Wallet,
  Target,
  Tag
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
    imageUrl: 'https://images.unsplash.com/photo-1608897013039-887f21d8c804?auto=format&fit=crop&w=600&q=80',
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
    itemType: 'food',
    price: 200, 
    containerType: 'box', 
    isAvailable: true, 
    emoji: '🍲🌱',
    imageUrl: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=600&q=80',
    description: 'በጥሩ ቅመም የተዘጋጀ ጣፋጭ የአኩሪ አተር ወጥ (ቴስቲሶያ)'
  },
  // Authentic Maraki Juices & Smoothies
  { 
    id: 'j1', 
    name: 'ማራኪ ስፔሻል ጁስ', 
    englishName: 'Maraki Special Mixed Juice', 
    category: 'Juices',
    itemType: 'juice',
    price: 180, 
    containerType: 'cup', 
    isAvailable: true, 
    emoji: '🥤✨',
    imageUrl: 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=600&q=80',
    description: 'በአቮካዶ፣ ማንጎ፣ ፓፓያና ብርቱካን የተዘጋጀ ልዩ ማራኪ ስፔሻል ጁስ'
  },
  { 
    id: 'j2', 
    name: 'ስፕሪስ ጁስ', 
    englishName: 'Spris Juice (Layered)', 
    category: 'Juices',
    itemType: 'juice',
    price: 150, 
    containerType: 'cup', 
    isAvailable: true, 
    emoji: '🍹',
    imageUrl: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=600&q=80',
    description: 'ጣፋጭ የማንጎና አቮካዶ ባለሁለት ቀለም ስፕሪስ'
  },
  { 
    id: 'j3', 
    name: 'አቮካዶ ጁስ', 
    englishName: 'Avocado Juice', 
    category: 'Juices',
    itemType: 'juice',
    price: 140, 
    containerType: 'cup', 
    isAvailable: true, 
    emoji: '🥑🥤',
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
    description: 'ወፍራም ትኩስ አቮካዶ በሎሚና በቪምቶ'
  },
  { 
    id: 'j4', 
    name: 'ማንጎ ጁስ', 
    englishName: 'Mango Juice', 
    category: 'Juices',
    itemType: 'juice',
    price: 150, 
    containerType: 'cup', 
    isAvailable: true, 
    emoji: '🥭🥤',
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
    description: 'የሀዋሳ የተመረጠ ትኩስና ጣፋጭ ማንጎ ጁስ'
  },
  { 
    id: 'j5', 
    name: 'ፓፓያ ጁስ', 
    englishName: 'Papaya Juice', 
    category: 'Juices',
    itemType: 'juice',
    price: 130, 
    containerType: 'cup', 
    isAvailable: true, 
    emoji: '🍈🥤',
    imageUrl: 'https://images.unsplash.com/photo-1517456793572-1d8efd6dc135?auto=format&fit=crop&w=600&q=80',
    description: 'በሎሚና በበረዶ የተዘጋጀ ትኩስ ፓፓያ ጁስ'
  },
  { 
    id: 'j6', 
    name: 'ብርቱካን ጁስ', 
    englishName: 'Fresh Orange Juice', 
    category: 'Juices',
    itemType: 'juice',
    price: 160, 
    containerType: 'cup', 
    isAvailable: true, 
    emoji: '🍊🥤',
    imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80',
    description: '100% ንፁህ የተጨመቀ የብርቱካን ጭማቂ'
  },
  { 
    id: 'j7', 
    name: 'ሐባብ ጁስ', 
    englishName: 'Watermelon Juice', 
    category: 'Juices',
    itemType: 'juice',
    price: 140, 
    containerType: 'cup', 
    isAvailable: true, 
    emoji: '🍉🥤',
    imageUrl: 'https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?auto=format&fit=crop&w=600&q=80',
    description: 'ትኩስ የበጋ ቀዝቃዛ የሐባብ ጭማቂ'
  },
  { 
    id: 'j8', 
    name: 'አናናስ ጁስ', 
    englishName: 'Pineapple Juice', 
    category: 'Juices',
    itemType: 'juice',
    price: 150, 
    containerType: 'cup', 
    isAvailable: true, 
    emoji: '🍍🥤',
    imageUrl: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=600&q=80',
    description: 'የተመረጠ ትኩስ አናናስ በበረዶ'
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

/**
 * Calculates effective price based on order type:
 * - If Home (ቤት ውስጥ) and base price is 320 ETB, decreases to 300 ETB.
 * - All other prices remain unchanged.
 * - If Takeaway (ቴክአዌይ), base price is maintained.
 */
export function getDishEffectivePrice(dishOrItem, currentOrderType = 'Takeaway') {
  const basePrice = Number(dishOrItem.originalPrice || dishOrItem.basePrice || dishOrItem.price || 0);
  if (currentOrderType === 'Home') {
    if (dishOrItem.homePrice !== undefined && dishOrItem.homePrice !== null && dishOrItem.homePrice !== '') {
      return Number(dishOrItem.homePrice);
    }
    if (basePrice === 320) {
      return 300;
    }
  }
  return basePrice;
}

export function getFormattedGregorianDate(d = new Date()) {
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export function formatWaiterDisplayName(waiterStr) {
  if (!waiterStr) return 'አልተጠቀሰም';
  const match = waiterStr.match(/^(.*?)\s*\((.*?)\)$/);
  if (match) {
    return `${match[1]}  ${match[2]}`;
  }
  return waiterStr;
}

export default function App() {
  // --- SYSTEM SEPARATION: CHEF KITCHEN POS vs OWNER COMMAND CENTER vs SHIFT RECONCILIATION ---
  const [systemMode, setSystemMode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const sys = params.get('system') || params.get('role');
    if (sys === 'chef' || sys === 'owner' || sys === 'reconciliation' || sys === 'shift') {
      return sys === 'shift' ? 'reconciliation' : sys;
    }
    const saved = localStorage.getItem('maraki_system_mode');
    if (saved === 'chef' || saved === 'owner' || saved === 'reconciliation') return saved;
    return 'portal'; // Default to portal selection gateway
  });

  const [isChefAuth, setIsChefAuth] = useState(() => {
    if (localStorage.getItem('maraki_chef_authenticated') === 'true') return true;
    if (localStorage.getItem('maraki_is_authenticated') === 'true' && localStorage.getItem('maraki_auth_role') === 'chef') return true;
    return false;
  });

  const [isOwnerAuth, setIsOwnerAuth] = useState(() => {
    if (localStorage.getItem('maraki_owner_authenticated') === 'true') return true;
    if (localStorage.getItem('maraki_is_authenticated') === 'true' && localStorage.getItem('maraki_auth_role') === 'owner') return true;
    return false;
  });

  const [ownerPassword, setOwnerPassword] = useState(() => {
    return localStorage.getItem('maraki_owner_password') || '1234';
  });
  const [chefPin, setChefPin] = useState(() => {
    return localStorage.getItem('maraki_chef_pin') || '0000';
  });

  // Dedicated PIN/Password Entry States
  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState(null);
  const [showPasswordText, setShowPasswordText] = useState(false);

  // Password & Shift Waiter Settings Modal (Managed by Owner)
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [newOwnerPassInput, setNewOwnerPassInput] = useState('');
  const [newChefPinInput, setNewChefPinInput] = useState('');
  const [dayShiftWaiterInput, setDayShiftWaiterInput] = useState(() => getShiftDefaultWaiters().Day);
  const [nightShiftWaiterInput, setNightShiftWaiterInput] = useState(() => getShiftDefaultWaiters().Night);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearConfirmPass, setClearConfirmPass] = useState('');
  const [clearIncludeSettings, setClearIncludeSettings] = useState(false);
  const [clearConfirmError, setClearConfirmError] = useState('');

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

  // Order Type: 'Takeaway' (default) vs 'Home' (Dine-in with 320 -> 300 ETB price rule)
  const [orderType, setOrderType] = useState('Takeaway');

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
    const cleared = localStorage.getItem('maraki_sent_orders_cleared_v3');
    if (!cleared) {
      localStorage.removeItem('maraki_chef_sent_orders');
      localStorage.setItem('maraki_sent_orders_cleared_v3', 'true');
      return [];
    }
    const saved = localStorage.getItem('maraki_chef_sent_orders');
    return saved ? JSON.parse(saved) : [];
  });

  // Food Menu & Juice Rate (Owner-controlled, persisted to localStorage)
  const [foodMenu, setFoodMenu] = useState(() => {
    try {
      const saved = localStorage.getItem('maraki_chef_food_menu_v2');
      return saved ? JSON.parse(saved) : MARAKI_REAL_FOOD_MENU;
    } catch (e) {
      return MARAKI_REAL_FOOD_MENU;
    }
  });
  const [standardJuicePrice, setStandardJuicePrice] = useState(() => {
    const saved = Number(localStorage.getItem('maraki_standard_juice_price'));
    return saved > 0 ? saved : 170;
  });
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);

  // Damaged Boxes Tracking
  const [wasteBoxes, setWasteBoxes] = useState(() => {
    const saved = localStorage.getItem('maraki_waste_boxes');
    return saved ? Number(saved) : 0;
  });
  const [stockVersion, setStockVersion] = useState(0);
  const [showWasteModal, setShowWasteModal] = useState(false);
  const [wasteCountInput, setWasteCountInput] = useState(1);
  const [wasteReason, setWasteReason] = useState('Box Damaged / Dropped');

  // --- OWNER DASHBOARD FILTERS & CONTROLS ---
  const [ownerDateRange, setOwnerDateRange] = useState('today'); // 'today' | 'all' | 'custom'
  const [ownerSelectedCustomDate, setOwnerSelectedCustomDate] = useState('');
  const [ownerSection, setOwnerSection] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const sec = params.get('section');
    const valid = ['dashboard', 'sheet', 'analysis', 'stock', 'menu', 'finance', 'plans', 'orders'];
    if (sec && valid.includes(sec)) return sec;
    const saved = localStorage.getItem('maraki_owner_active_section');
    if (saved && valid.includes(saved)) return saved;
    return 'dashboard';
  });
  useEffect(() => {
    localStorage.setItem('maraki_owner_active_section', ownerSection);
  }, [ownerSection]);

  // Settlements History for Owner Income Analysis
  const [settlementsHistory, setSettlementsHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('maraki_shift_settlements');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'maraki_shift_settlements' && e.newValue) {
        try {
          setSettlementsHistory(JSON.parse(e.newValue));
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  const [ownerSearchQuery, setOwnerSearchQuery] = useState('');
  const deferredOwnerSearchQuery = useDeferredValue(ownerSearchQuery);
  const [isFilterPending, startFilterTransition] = useTransition();
  const [ownerShiftFilter, setOwnerShiftFilter] = useState('all'); // 'all' | 'Day' | 'Night' | 'BEU' | 'Takeaway' | 'Home'
  const [ownerWaiterFilter, setOwnerWaiterFilter] = useState('all');
  const [ownerStatusFilter, setOwnerStatusFilter] = useState('all'); // 'all' | 'cooked' | 'taken'
  const [selectedOrderForView, setSelectedOrderForView] = useState(null); // Full Ticket Modal viewer
  const [boxInventoryInitial, setBoxInventoryInitial] = useState(() => {
    return Number(localStorage.getItem('maraki_box_starting_stock')) || 500;
  });
  const [showBoxStockModal, setShowBoxStockModal] = useState(false);
  const [boxStockInput, setBoxStockInput] = useState('');

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
    localStorage.setItem('maraki_chef_food_menu_v2', JSON.stringify(foodMenu));
  }, [foodMenu]);

  useEffect(() => {
    localStorage.setItem('maraki_standard_juice_price', String(standardJuicePrice));
  }, [standardJuicePrice]);

  useEffect(() => {
    localStorage.setItem('maraki_waiters_list_v3', JSON.stringify(waitersList));
  }, [waitersList]);

  useEffect(() => {
    localStorage.setItem('maraki_waste_boxes', wasteBoxes.toString());
  }, [wasteBoxes]);

  // Auto-return to menu after successful order submission without needing manual interaction
  useEffect(() => {
    if (!orderSuccessModal) return;
    const timer = setTimeout(() => {
      setOrderSuccessModal(null);
      clearCurrentOrder();
    }, 2500); // 2.5 seconds: confirms order on screen, then smoothly auto-returns straight to the food menu
    return () => clearTimeout(timer);
  }, [orderSuccessModal]);

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
    setOrderType('Takeaway');
    setBeuOrderId('');
    setCustomWaiterName('');
    setShowAddWaiterInput(false);
  };

  // Packaging & Amount Math
  // - If Home (ቤት ውስጥ): All 320 ETB dishes decrease to 300 ETB; other prices stay the same.
  // - Takeaway uses 1 🥡 Box per dish item. Home (dine-in) uses 0 takeaway boxes.
  const totalSubtotal = cart.reduce((sum, item) => {
    const effectivePrice = getDishEffectivePrice(item, orderType);
    return sum + (effectivePrice * item.qty);
  }, 0);

  const totalBoxesInOrder = orderType === 'Takeaway' 
    ? cart.reduce((sum, item) => sum + item.qty, 0) 
    : 0;

  // --- SUBMIT ORDER ---
  const handleFinalSubmit = async () => {
    if (cart.length === 0) {
      showToast('⚠️ እባክዎ ቢያንስ አንድ ምግብ ይምረጡ (Please choose at least 1 food item)');
      setOrderStep(1);
      return;
    }

    const effectiveWaiter = customWaiterName.trim() || selectedWaiter;
    const isBeu = selectedShiftType === 'BEU';
    // BEU delivery orders are always Takeaway
    const finalOrderType = isBeu ? 'Takeaway' : orderType;
    const shiftLabel = isBeu ? 'Day Shift' : (selectedShiftType === 'Day' ? 'Day Shift' : 'Night Shift');
    const channelLabel = isBeu 
      ? 'BEU Delivery' 
      : (finalOrderType === 'Home' ? 'In-Store Home' : 'In-Store Takeaway');
    const finalPayment = isBeu ? 'BEU Account' : 'Kitchen Dispatch';

    const orderId = `food-${Date.now()}`;
    const orderData = {
      id: orderId,
      chefName: 'Chef Almaz',
      shift: shiftLabel,
      channel: channelLabel,
      orderType: finalOrderType, // 'Takeaway' | 'Home'
      waiterName: effectiveWaiter,
      status: 'ተዘጋጅቶ ተወስዷል (Cooked & Taken)',
      cookedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      takenByWaiter: effectiveWaiter,
      ethiopianDate: orderEthDate.formatted,
      ethiopianDay: orderEthDate.day,
      ethiopianMonth: orderEthDate.monthName,
      ethiopianYear: orderEthDate.year,
      gregorianDateFormatted: getFormattedGregorianDate(),
      beuOrderId: isBeu ? (beuOrderId.trim() || 'BEU-Direct') : null,
      paymentMethod: finalPayment,
      totalAmount: totalSubtotal,
      boxesCount: totalBoxesInOrder,
      items: cart.map(i => ({
        id: i.id,
        name: i.name,
        englishName: i.englishName,
        qty: i.qty,
        price: getDishEffectivePrice(i, finalOrderType),
        basePrice: i.price,
        homePrice: i.homePrice ?? null
      })),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString()
    };

    // 1. OPTIMISTIC UI: Update state & show receipt confirmation instantly (0ms latency!)
    setSentOrders(prev => [orderData, ...prev]);
    setOrderSuccessModal({
      ...orderData,
      foodSummary: cart.map(i => `${i.qty}x ${i.name}`).join(', ')
    });
    clearCurrentOrder();

    // 2. BACKGROUND RECONCILIATION: Sync with cloud asynchronously without blocking the chef
    dbService.saveOrder({
      ...orderData,
      staffName: 'Chef Almaz',
      cupsCount: 0,
      boxesUsed: totalBoxesInOrder
    }).catch(err => {
      console.warn('Background sync warning (order preserved locally):', err);
    });

    // If new custom waiter was typed, save to permanent list
    if (customWaiterName.trim()) {
      const name = customWaiterName.trim();
      const existing = waitersList.find(w => w.fullName === name || w.amharic === name || w.english === name);
      if (!existing) {
        setWaitersList(prev => [...prev, { amharic: name, english: name, fullName: name, emoji: '👤' }]);
      }
    }
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
    if (target === 'current' || target === 'filter') {
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
    } else if (editingDateTarget === 'filter') {
      setOwnerSelectedCustomDate(formatted);
      setOwnerDateRange('custom');
      showToast(`📅 Showing orders for: ${formatted}`);
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

  // --- SYSTEM NAVIGATION & AUTHENTICATION HANDLERS ---
  const navigateToSystem = (mode) => {
    setSystemMode(mode);
    setPinInput('');
    setLoginError(null);
    localStorage.setItem('maraki_system_mode', mode);
    const url = new URL(window.location.href);
    if (mode === 'portal') {
      url.searchParams.delete('system');
      url.searchParams.delete('role');
    } else {
      url.searchParams.set('system', mode);
      url.searchParams.delete('role');
    }
    window.history.pushState({}, '', url);
  };

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const sys = params.get('system') || params.get('role');
      if (sys === 'chef' || sys === 'owner' || sys === 'reconciliation' || sys === 'shift') {
        setSystemMode(sys === 'shift' ? 'reconciliation' : sys);
      } else {
        setSystemMode('portal');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleChefLoginSubmit = (e) => {
    if (e) e.preventDefault();
    if (pinInput.trim() === chefPin) {
      setIsChefAuth(true);
      localStorage.setItem('maraki_chef_authenticated', 'true');
      setPinInput('');
      setLoginError(null);
      showToast('👩‍🍳 እንደ ሼፍ ገብተዋል (Welcome to Chef Station)');
    } else {
      setLoginError('❌ የተሳሳተ የኩሽና ፒን ነው፤ እባክዎ እንደገና ይሞክሩ (Default: 0000)');
    }
  };

  const handleOwnerLoginSubmit = (e) => {
    if (e) e.preventDefault();
    if (pinInput.trim() === ownerPassword) {
      setIsOwnerAuth(true);
      localStorage.setItem('maraki_owner_authenticated', 'true');
      setPinInput('');
      setLoginError(null);
      showToast('👑 የባለቤት መቆጣጠሪያ ማዕከል ተከፍቷል (Welcome to Owner Center)');
    } else {
      setLoginError('❌ የተሳሳተ የባለቤት ይለፍ ቃል ነው፤ እባክዎ እንደገና ይሞክሩ (Default: 1234)');
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

  const handleLockChef = () => {
    setIsChefAuth(false);
    localStorage.removeItem('maraki_chef_authenticated');
    setPinInput('');
    setLoginError(null);
    showToast('🔒 የኩሽና ሲስተም ተቆልፏል (Chef Station Locked)');
  };

  const handleLockOwner = () => {
    setIsOwnerAuth(false);
    localStorage.removeItem('maraki_owner_authenticated');
    setPinInput('');
    setLoginError(null);
    showToast('🔒 የባለቤት ሲስተም ተቆልፏል (Owner Command Center Locked)');
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
    if (systemMode === 'owner') {
      saveShiftDefaultWaiters({
        Day: dayShiftWaiterInput,
        Night: nightShiftWaiterInput
      });
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

  // Filtered dishes for Step 1 (Optimized with useDeferredValue for 60fps typing)
  const filteredDishes = foodMenu.filter(item => {
    if (item.isAvailable === false) return false;
    const q = deferredSearchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      item.name.toLowerCase().includes(q) ||
      (item.englishName && item.englishName.toLowerCase().includes(q));
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // --- STATS FOR OWNER REPORTS ---
  // Unique Ethiopian dates present in orders
  const availableDates = Array.from(new Set(sentOrders.map(o => o.ethiopianDate).filter(Boolean)));

  // 1. Date Range Filtering for Owner Dashboard
  const dateFilteredOrders = sentOrders.filter(order => {
    if (ownerDateRange === 'today') {
      return order.ethiopianDate === orderEthDate.formatted;
    }
    if (ownerDateRange === 'yesterday') {
      return order.ethiopianDate !== orderEthDate.formatted;
    }
    if (ownerDateRange === 'custom' && ownerSelectedCustomDate) {
      return order.ethiopianDate === ownerSelectedCustomDate;
    }
    return true; // 'all'
  });

  const dayOrders = dateFilteredOrders.filter(o => o.shift === 'Day Shift' && o.channel !== 'BEU Delivery');
  const nightOrders = dateFilteredOrders.filter(o => o.shift === 'Night Shift' && o.channel !== 'BEU Delivery');
  const beuOrders = dateFilteredOrders.filter(o => o.channel === 'BEU Delivery');
  const takeawayOrders = dateFilteredOrders.filter(o => o.orderType !== 'Home' && o.channel !== 'In-Store Home');
  const homeOrders = dateFilteredOrders.filter(o => o.orderType === 'Home' || o.channel === 'In-Store Home');

  const dayBoxes = dayOrders.reduce((sum, o) => sum + (o.boxesCount || 0), 0);
  const nightBoxes = nightOrders.reduce((sum, o) => sum + (o.boxesCount || 0), 0);
  const beuBoxes = beuOrders.reduce((sum, o) => sum + (o.boxesCount || 0), 0);
  const totalBoxesAll = dateFilteredOrders.reduce((sum, o) => sum + (o.boxesCount || 0), 0);

  const dayRevenue = dayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const nightRevenue = nightOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const beuRevenue = beuOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const homeRevenue = homeOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalRevenueAll = dateFilteredOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  // Box Inventory Metrics
  const allTimeBoxesUsed = sentOrders.reduce((sum, o) => sum + (o.boxesCount || 0), 0);
  const remainingBoxes = Math.max(0, boxInventoryInitial - allTimeBoxesUsed);
  const boxStockPercent = Math.min(100, Math.round((remainingBoxes / (boxInventoryInitial || 1)) * 100));

  // Breakdown by Food Dishes (All 16)
  const dishBreakdown = foodMenu.map(dish => {
    let countSold = 0;
    let boxesUsed = 0;
    let revenue = 0;
    dateFilteredOrders.forEach(order => {
      order.items?.forEach(i => {
        if (i.id === dish.id || i.name === dish.name) {
          countSold += i.qty;
          const isHome = order.orderType === 'Home' || order.channel === 'In-Store Home';
          if (!isHome) {
            boxesUsed += i.qty;
          }
          const soldPrice = Number(i.price ?? (isHome && dish.price === 320 ? 300 : dish.price));
          revenue += (i.qty * soldPrice);
        }
      });
    });
    return {
      ...dish,
      countSold,
      boxesUsed,
      revenueGenerated: revenue
    };
  });

  // Top 5 Best Selling Dishes
  const topSellingDishes = [...dishBreakdown]
    .filter(d => d.countSold > 0)
    .sort((a, b) => b.countSold - a.countSold)
    .slice(0, 5);

  // Breakdown by Waiter
  const waiterStats = {};
  dateFilteredOrders.forEach(order => {
    const w = order.waiterName || 'Unassigned';
    if (!waiterStats[w]) {
      waiterStats[w] = { ordersCount: 0, boxesCount: 0, totalETB: 0 };
    }
    waiterStats[w].ordersCount += 1;
    waiterStats[w].boxesCount += (order.boxesCount || 0);
    waiterStats[w].totalETB += order.totalAmount;
  });

  // Full Search & Filtered Orders for the Audit Log (Optimized with useDeferredValue)
  const displayOrders = dateFilteredOrders.filter(order => {
    if (deferredOwnerSearchQuery.trim()) {
      const q = deferredOwnerSearchQuery.toLowerCase().trim();
      const matchId = order.id.toLowerCase().includes(q);
      const matchWaiter = (order.waiterName || '').toLowerCase().includes(q);
      const matchDate = (order.ethiopianDate || '').toLowerCase().includes(q);
      const matchGreg = (order.gregorianDateFormatted || '').toLowerCase().includes(q);
      const matchTime = (order.timestamp || '').toLowerCase().includes(q);
      const matchItems = (order.items || []).some(i => 
        i.name.toLowerCase().includes(q) || 
        (i.englishName && i.englishName.toLowerCase().includes(q))
      );
      if (!matchId && !matchWaiter && !matchDate && !matchGreg && !matchTime && !matchItems) return false;
    }

    if (ownerShiftFilter === 'Day' && (order.shift !== 'Day Shift' || order.channel === 'BEU Delivery')) return false;
    if (ownerShiftFilter === 'Night' && (order.shift !== 'Night Shift' || order.channel === 'BEU Delivery')) return false;
    if (ownerShiftFilter === 'BEU' && order.channel !== 'BEU Delivery') return false;
    if (ownerShiftFilter === 'Home' && order.orderType !== 'Home' && order.channel !== 'In-Store Home') return false;
    if (ownerShiftFilter === 'Takeaway' && (order.orderType === 'Home' || order.channel === 'In-Store Home')) return false;

    if (ownerWaiterFilter !== 'all') {
      const wName = order.waiterName || '';
      if (!wName.includes(ownerWaiterFilter)) return false;
    }

    if (ownerStatusFilter === 'cooked') {
      const st = order.status || '';
      if (!st.includes('Cooked') && !st.includes('ተዘጋጅቷል')) return false;
    }
    if (ownerStatusFilter === 'taken') {
      const st = order.status || '';
      if (!st.includes('Taken') && !st.includes('ተወስዷል')) return false;
    }

    return true;
  });

  // Delete Order (Owner correction)
  const handleDeleteOrder = (orderId) => {
    if (window.confirm('ይህን ትዕዛዝ በእርግጥ መሰረዝ ይፈልጋሉ? (Are you sure you want to delete this order?)')) {
      setSentOrders(prev => prev.filter(o => o.id !== orderId));
      showToast('ትዕዛዙ ተሰርዟል (Order deleted)');
    }
  };

  // Toggle Order Status (Cooked vs Taken)
  const handleToggleOrderStatus = (orderId) => {
    setSentOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const isCooked = (o.status || '').includes('ተዘጋጅቷል');
        const nextStatus = isCooked 
          ? '🏃 በአስተጋጅ ተወስዷል (Taken by Waiter)' 
          : '🍳 በኩሽና ተዘጋጅቷል (Cooked by Chef)';
        return { ...o, status: nextStatus };
      }
      return o;
    }));
    showToast('የምግብ ሁኔታ ተቀይሯል!');
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (dateFilteredOrders.length === 0) {
      showToast('⚠️ ምንም የሚወርድ ትዕዛዝ አልተገኘም (No orders to export)');
      return;
    }
    const headers = [
      'Order ID',
      'Ethiopian Date',
      'Gregorian Date',
      'Time',
      'Shift',
      'Channel',
      'Service Type',
      'Waiter',
      'Dishes & Quantities',
      'Takeaway Boxes',
      'Total Amount (ETB)',
      'Status'
    ];
    const rows = dateFilteredOrders.map(o => [
      `"${o.id}"`,
      `"${o.ethiopianDate || ''}"`,
      `"${o.gregorianDateFormatted || ''}"`,
      `"${o.timestamp || ''}"`,
      `"${o.shift || ''}"`,
      `"${o.channel || ''}"`,
      `"${o.orderType === 'Home' ? 'ቤት ውስጥ (Home)' : 'ቴክአዌይ (Takeaway)'}"`,
      `"${o.waiterName || ''}"`,
      `"${(o.items || []).map(i => `${i.qty}x ${i.name}`).join('; ')}"`,
      o.orderType === 'Home' ? 0 : (o.boxesCount || 0),
      o.totalAmount || 0,
      `"${o.status || 'ተዘጋጅቶ ተወስዷል (Cooked & Taken)'}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `maraki_sales_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('📥 የትዕዛዞች ዝርዝር በኤክሴል (CSV) ወርዷል!');
  };

  // Print Daily Summary
  const handlePrintSummary = () => {
    window.print();
  };

  // Save Box Stock
  const handleSaveBoxInventory = (e) => {
    if (e) e.preventDefault();
    const val = Number(boxStockInput);
    if (!isNaN(val) && val >= 0) {
      setBoxInventoryInitial(val);
      localStorage.setItem('maraki_box_starting_stock', val.toString());
      setShowBoxStockModal(false);
      showToast(`📦 የሳጥን መነሻ ክምችት ወደ ${val} ተስተካክሏል!`);
    }
  };

  // Reset Day Orders (Protected)
  const handleResetDayOrders = () => {
    if (window.confirm('የዛሬውን ትዕዛዞች በሙሉ አጥፍተው አዲስ ቀን መጀመር ይፈልጋሉ? (Are you sure you want to reset today\'s orders?)')) {
      const pass = window.prompt('እባክዎ የባለቤት ይለፍ ቃል ያስገቡ (Enter Owner Password):');
      if (pass === ownerPassword) {
        setSentOrders(prev => prev.filter(o => o.ethiopianDate !== orderEthDate.formatted));
        showToast('የዕለቱ ትዕዛዞች ተሰርዘዋል / አዲስ ቀን ተጀምሯል!');
      } else if (pass !== null) {
        alert('የተሳሳተ የይለፍ ቃል! (Incorrect Password)');
      }
    }
  };

  // ==============================================================
  // 1. SYSTEM GATEWAY: PORTAL SELECTOR (CHEF vs OWNER)
  // ==============================================================
  if (systemMode === 'portal') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 flex flex-col items-center justify-center p-4 sm:p-6 text-white selection:bg-emerald-500 selection:text-white">
        
        {/* Branding & Welcome */}
        <div className="text-center max-w-md mx-auto space-y-2 mb-8 animate-in fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white text-4xl shadow-2xl shadow-emerald-500/30 mb-2">
            🥗
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">MARAKI</h1>
          <p className="text-xs font-black text-emerald-400 uppercase tracking-widest">
            Juice & Salad Restaurant System
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-slate-300 text-xs font-bold mt-2 border border-white/10">
            <span>የስራ ክፍል ይምረጡ (Choose Work Station)</span>
          </div>
        </div>

        {/* Three Dedicated Portal Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 max-w-5xl w-full">
          
          {/* Portal 1: Chef Kitchen Station */}
          <div 
            onClick={() => navigateToSystem('chef')}
            className="group bg-white/10 hover:bg-white/15 backdrop-blur-xl border-2 border-emerald-500/40 hover:border-emerald-400 rounded-3xl p-6 sm:p-7 transition-all cursor-pointer shadow-xl hover:shadow-2xl hover:scale-[1.02] flex flex-col justify-between space-y-5"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center text-3xl shadow-inner">
                  👩‍🍳
                </div>
                <span className={`text-[11px] font-black px-3 py-1 rounded-full border ${
                  isChefAuth 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' 
                    : 'bg-white/10 text-slate-300 border-white/20'
                }`}>
                  {isChefAuth ? '🔓 Unlocked (Active)' : '🔒 PIN Required'}
                </span>
              </div>

              <div>
                <h2 className="text-xl font-black text-white group-hover:text-emerald-300 transition-colors flex items-center gap-2">
                  <span>Kitchen POS Station</span>
                </h2>
                <p className="text-xs font-black text-emerald-400 tracking-wide mt-0.5">
                  CHEF KITCHEN STATION (POS)
                </p>
                <p className="text-xs text-slate-300 font-bold mt-2 leading-relaxed">
                  Food order entry, takeaway packaging, home discounts, day & night shifts, beU delivery, and kitchen tickets.
                </p>
              </div>

              <div className="pt-2 border-t border-white/10 space-y-1.5 text-xs text-slate-300 font-bold">
                <div className="flex items-center gap-2 text-emerald-300">
                  <span>✓</span> <span>Food menu selection & fast order entry</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-300">
                  <span>✓</span> <span>Receipt printing & chef queue</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); navigateToSystem('chef'); }}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 transition-all group-hover:shadow-emerald-500/30 active:scale-98"
            >
              <span>Enter Chef Station</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Portal 2: Owner Command Center */}
          <div 
            onClick={() => navigateToSystem('owner')}
            className="group bg-white/10 hover:bg-white/15 backdrop-blur-xl border-2 border-emerald-500/40 hover:border-emerald-400 rounded-3xl p-6 sm:p-7 transition-all cursor-pointer shadow-xl hover:shadow-2xl hover:scale-[1.02] flex flex-col justify-between space-y-5"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center text-3xl shadow-inner">
                  👑
                </div>
                <span className={`text-[11px] font-black px-3 py-1 rounded-full border ${
                  isOwnerAuth 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' 
                    : 'bg-white/10 text-slate-300 border-white/20'
                }`}>
                  {isOwnerAuth ? '🔓 Unlocked (Active)' : '🔒 Password Required'}
                </span>
              </div>

              <div>
                <h2 className="text-xl font-black text-white group-hover:text-emerald-300 transition-colors flex items-center gap-2">
                  <span>Owner Command Center</span>
                </h2>
                <p className="text-xs font-black text-emerald-400 tracking-wide mt-0.5">
                  OWNER COMMAND CENTER & AUDIT
                </p>
                <p className="text-xs text-slate-300 font-bold mt-2 leading-relaxed">
                  Financial planning, shift income reports, packaging box inventory, waiter performance, and daily analytics.
                </p>
              </div>

              <div className="pt-2 border-t border-white/10 space-y-1.5 text-xs text-slate-300 font-bold">
                <div className="flex items-center gap-2 text-emerald-300">
                  <span>✓</span> <span>Shift income reports & daily/monthly analytics</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-300">
                  <span>✓</span> <span>Calendar, expenses & waiter performance</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); navigateToSystem('owner'); }}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-950/30 flex items-center justify-center gap-2 transition-all group-hover:shadow-emerald-500/30 active:scale-98"
            >
              <span>Enter Owner Center</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Portal 3: Shift Reconciliation & Waiter Cash Audit (Internal System) */}
          <div 
            onClick={() => navigateToSystem('reconciliation')}
            className="group bg-white/10 hover:bg-white/15 backdrop-blur-xl border-2 border-emerald-500/40 hover:border-emerald-400 rounded-3xl p-6 sm:p-7 transition-all cursor-pointer shadow-xl hover:shadow-2xl hover:scale-[1.02] flex flex-col justify-between space-y-5"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center text-3xl shadow-inner">
                  📋
                </div>
                <span className="text-[11px] font-black px-3 py-1 rounded-full border bg-emerald-500/20 text-emerald-300 border-emerald-400/30">
                  🌟 Active
                </span>
              </div>

              <div>
                <h2 className="text-xl font-black text-white group-hover:text-emerald-300 transition-colors flex items-center gap-2">
                  <span>Shift Reconciliation</span>
                </h2>
                <p className="text-xs font-black text-emerald-400 tracking-wide mt-0.5">
                  SHIFT RECONCILIATION & CASH AUDIT
                </p>
                <p className="text-xs text-slate-300 font-bold mt-2 leading-relaxed">
                  Daily income sheet, anti-skimming food box engine, juice cups inventory, drawer cash handoff, and thermal slips.
                </p>
              </div>

              <div className="pt-2 border-t border-white/10 space-y-1.5 text-xs text-slate-300 font-bold">
                <div className="flex items-center gap-2 text-emerald-300">
                  <span>✓</span> <span>🥤 Juice Cups vs 🥗 Food Boxes Sold</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-300">
                  <span>✓</span> <span>💰 Cash Drawer, Telebirr & Bank Handoff</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); navigateToSystem('reconciliation'); }}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-950/30 flex items-center justify-center gap-2 transition-all group-hover:shadow-emerald-500/30 active:scale-98"
            >
              <span>Enter Shift Audit</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Install App Link */}
        <div className="mt-8">
          <button
            type="button"
            onClick={handleInstallApp}
            className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-black flex items-center gap-2 transition-all border border-white/15 backdrop-blur-md"
          >
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>📲 አፑን በስልክዎ ወይም በኮምፒውተርዎ ላይ ይጫኑ (Install App)</span>
          </button>
        </div>

      </div>
    );
  }

  // ==============================================================
  // 2. CHEF PIN LOCK SCREEN (WHEN IN CHEF MODE & NOT AUTHENTICATED)
  // ==============================================================
  if (systemMode === 'chef' && !isChefAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-7 shadow-2xl border border-white/30 text-center space-y-4">
          
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigateToSystem('portal')}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Portals</span>
            </button>
            <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
              Kitchen Station
            </span>
          </div>

          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center text-3xl shadow-lg shadow-emerald-900/30 mx-auto">
            👩‍🍳
          </div>
          <h2 className="text-xl font-black text-slate-900">Kitchen POS Station</h2>
          <p className="text-xs text-slate-500 font-bold">Chef Station Security PIN</p>

          <form onSubmit={handleChefLoginSubmit} className="space-y-3">
            <div className="relative">
              <input
                type={showPasswordText ? "text" : "password"}
                placeholder="Enter Chef PIN..."
                value={pinInput}
                onChange={(e) => { setPinInput(e.target.value); setLoginError(null); }}
                className="w-full bg-slate-50 border-2 border-emerald-300 focus:border-emerald-600 rounded-2xl py-3 pl-10 pr-10 text-center font-black text-lg text-slate-900 tracking-widest outline-none"
                autoFocus
              />
              <Key className="w-4 h-4 text-emerald-600 absolute left-3.5 top-3.5" />
              <button
                type="button"
                onClick={() => setShowPasswordText(!showPasswordText)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
              >
                {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {loginError && (
              <p className="text-xs font-black text-rose-600 bg-rose-50 py-1.5 px-3 rounded-xl border border-rose-200">
                {loginError}
              </p>
            )}

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeypadPress(num.toString())}
                  className="py-3 bg-slate-100 hover:bg-emerald-50 text-slate-800 font-black text-lg rounded-2xl border border-slate-200 transition-all active:scale-95"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleKeypadPress('clear')}
                className="py-3 bg-rose-50 text-rose-700 font-black text-xs rounded-2xl border border-rose-200"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                className="py-3 bg-slate-100 hover:bg-emerald-50 text-slate-800 font-black text-lg rounded-2xl border border-slate-200"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('backspace')}
                className="py-3 bg-emerald-50 text-emerald-800 font-black text-sm rounded-2xl border border-emerald-200"
              >
                ⌫
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-700/25 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              <span>Unlock Kitchen Station</span>
            </button>
          </form>

          <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 text-xs font-bold text-slate-600 flex items-center justify-between">
            <span>💡 Default Chef PIN:</span>
            <button 
              type="button" 
              onClick={() => setPinInput(chefPin)}
              className="font-black text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-300"
            >
              {chefPin}
            </button>
          </div>

        </div>
      </div>
    );
  }

  // ==============================================================
  // 3. OWNER PASSWORD LOCK SCREEN (WHEN IN OWNER MODE & NOT AUTH)
  // ==============================================================
  if (systemMode === 'owner' && !isOwnerAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-7 shadow-2xl border border-white/30 text-center space-y-4">
          
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigateToSystem('portal')}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Portals</span>
            </button>
            <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
              Owner Center
            </span>
          </div>

          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center text-3xl shadow-lg shadow-emerald-900/30 mx-auto">
            👑
          </div>
          <h2 className="text-xl font-black text-slate-900">Owner Command Center</h2>
          <p className="text-xs text-slate-500 font-bold">Executive Management & Income Analysis</p>

          <form onSubmit={handleOwnerLoginSubmit} className="space-y-3">
            <div className="relative">
              <input
                type={showPasswordText ? "text" : "password"}
                placeholder="Enter Owner Password..."
                value={pinInput}
                onChange={(e) => { setPinInput(e.target.value); setLoginError(null); }}
                className="w-full bg-slate-50 border-2 border-emerald-300 focus:border-emerald-600 rounded-2xl py-3 pl-10 pr-10 text-center font-black text-lg text-slate-900 tracking-widest outline-none"
                autoFocus
              />
              <Key className="w-4 h-4 text-emerald-600 absolute left-3.5 top-3.5" />
              <button
                type="button"
                onClick={() => setShowPasswordText(!showPasswordText)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
              >
                {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {loginError && (
              <p className="text-xs font-black text-rose-600 bg-rose-50 py-1.5 px-3 rounded-xl border border-rose-200">
                {loginError}
              </p>
            )}

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeypadPress(num.toString())}
                  className="py-3 bg-slate-100 hover:bg-emerald-50 text-slate-800 font-black text-lg rounded-2xl border border-slate-200 transition-all active:scale-95"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleKeypadPress('clear')}
                className="py-3 bg-rose-50 text-rose-700 font-black text-xs rounded-2xl border border-rose-200"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                className="py-3 bg-slate-100 hover:bg-emerald-50 text-slate-800 font-black text-lg rounded-2xl border border-slate-200"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('backspace')}
                className="py-3 bg-emerald-50 text-emerald-800 font-black text-sm rounded-2xl border border-emerald-200"
              >
                ⌫
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-950/25 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              <span>Unlock Owner Center</span>
            </button>
          </form>

          <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 text-xs font-bold text-slate-600 flex items-center justify-between">
            <span>💡 Default Password:</span>
            <button 
              type="button" 
              onClick={() => setPinInput(ownerPassword)}
              className="font-black text-emerald-900 bg-white px-2 py-0.5 rounded border border-emerald-300"
            >
              {ownerPassword}
            </button>
          </div>

        </div>
      </div>
    );
  }

  // ==============================================================
  // 4. SHIFT RECONCILIATION & WAITER CASH AUDIT STATION
  // ==============================================================
  if (systemMode === 'reconciliation' || systemMode === 'shift') {
    return (
      <ShiftReconciliation
        orders={sentOrders}
        waiters={waitersList}
        foodMenu={foodMenu}
        standardJuicePrice={standardJuicePrice}
        onBackToPortal={() => navigateToSystem('portal')}
        onSwitchToChef={() => navigateToSystem('chef')}
        onSwitchToOwner={() => navigateToSystem('owner')}
        onSwitchToOwnerPrices={() => {
          setOwnerSection('menu');
          navigateToSystem('owner');
        }}
        onSavedSettlement={(rec) => {
          setSettlementsHistory(prev => [rec, ...prev.filter(s => s.id !== rec.id)]);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-sans text-slate-800 antialiased selection:bg-emerald-600 selection:text-white">
      
      {/* ============================================================== */}
      {/* VIBRANT TOP APP BAR                                             */}
      {/* ============================================================== */}
      {/* ============================================================== */}
      {/* CHEF APP HEADER (VIBRANT EMERALD POS THEME)                      */}
      {/* ============================================================== */}
      {systemMode === 'chef' && (
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
                    Chef Station
                  </span>
                </div>
                <p className="text-[11px] text-emerald-100 flex items-center gap-1 font-bold">
                  <span>የኩሽና ምግብ ማዘዣና ማዘጋጃ (Kitchen POS)</span>
                </p>
              </div>
            </div>

            {/* Date & Shift */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openEthDateModal('current')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-2xl border border-white/25 text-white font-black text-xs shadow-inner transition-all hover:scale-[1.02]"
                title="የኢትዮጵያ ቀን ቀይር"
              >
                <Calendar className="w-3.5 h-3.5 text-emerald-200" />
                <span>{orderEthDate.formatted}</span>
                <span className="text-[10px] bg-black/20 text-emerald-200 px-1.5 py-0.5 rounded-lg border border-white/10 flex items-center gap-0.5 font-bold">
                  <Edit3 className="w-2.5 h-2.5" />
                  <span>ቀይር</span>
                </span>
              </button>

              <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 bg-black/20 text-white text-xs font-black rounded-2xl border border-white/10">
                <span>{orderEthDate.shift}</span>
              </span>
            </div>

            {/* Chef Station Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigateToSystem('reconciliation')}
                className="px-2.5 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-black flex items-center gap-1.5 border border-white/25 transition-all shadow-sm active:scale-95"
                title="የፈረቃና የገቢ ማስታረቂያ (Shift Reconciliation)"
              >
                <ClipboardCheck className="w-3.5 h-3.5 text-emerald-200" />
                <span className="hidden sm:inline">የፈረቃ ርክክብ</span>
              </button>

              <button
                type="button"
                onClick={handleInstallApp}
                className="px-2.5 py-1.5 bg-emerald-800/80 hover:bg-emerald-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 border border-emerald-400/30 shadow-md transition-all active:scale-95"
                title="አፑን ጫን"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-300" />
                <span className="hidden md:inline">አፑን ጫን</span>
              </button>

              <button
                type="button"
                onClick={handleLockChef}
                className="px-2.5 py-1.5 bg-black/20 hover:bg-black/30 text-emerald-100 rounded-xl text-xs font-black flex items-center gap-1 border border-white/15 transition-all shadow-sm"
                title="ኩሽናውን ቆልፍ (Lock)"
              >
                <Lock className="w-3.5 h-3.5 text-emerald-200" />
                <span>ቆልፍ</span>
              </button>

              <button
                type="button"
                onClick={() => navigateToSystem('portal')}
                className="px-2.5 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-black flex items-center gap-1 border border-white/20 transition-all shadow-sm"
                title="ወደ ሲስተም ምርጫ ተመለስ (Switch Portal)"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ውጣ / Switch</span>
              </button>
            </div>

          </div>
        </header>
      )}

      {/* ============================================================== */}
      {/* OWNER EXECUTIVE HEADER (DISTINCT DARK SLATE + EMERALD THEME)   */}
      {/* ============================================================== */}
      {systemMode === 'owner' && (
        <header className="bg-slate-900 text-white sticky top-0 z-50 border-b border-emerald-500/20 shadow-lg shadow-slate-950/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
            
            {/* Logo & Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-xl shadow-md shadow-emerald-500/20 font-black">
                👑
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-black text-lg tracking-tight text-white">MARAKI</h1>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    Owner Executive
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-bold">
                  Analytics, Stock Cross-Check, Shift Alarms & Finance
                </p>
              </div>
            </div>

            {/* Date Badge */}
            <button
              type="button"
              onClick={() => openEthDateModal('current')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-white font-black text-xs transition-all"
              title="Change Ethiopian Date"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>{orderEthDate.formatted}</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-lg flex items-center gap-0.5 font-bold">
                <Edit3 className="w-2.5 h-2.5" />
                <span>Edit</span>
              </span>
            </button>

            {/* Owner Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOwnerSection('sheet')}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                title="Open Daily Income Sheet"
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Daily Sheet</span>
              </button>

              <button
                type="button"
                onClick={() => setOwnerSection('menu')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all border active:scale-95 ${
                  ownerSection === 'menu'
                    ? 'bg-amber-400 text-slate-950 border-amber-300'
                    : 'bg-white/10 hover:bg-white/15 text-emerald-300 border-white/10'
                }`}
                title="Edit Menu & Juice Prices"
              >
                <Tag className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Prices</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setNewOwnerPassInput(ownerPassword);
                  setNewChefPinInput(chefPin);
                  const sw = getShiftDefaultWaiters();
                  setDayShiftWaiterInput(sw.Day);
                  setNightShiftWaiterInput(sw.Night);
                  setShowClearConfirm(false);
                  setClearConfirmPass('');
                  setClearIncludeSettings(false);
                  setClearConfirmError('');
                  setShowSettingsModal(true);
                }}
                className="px-2.5 py-1.5 bg-white/10 hover:bg-white/15 text-slate-200 rounded-xl text-xs font-black border border-white/10 transition-all flex items-center gap-1"
                title="Change Passwords & Settings"
              >
                <Settings className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Settings</span>
              </button>

              <button
                type="button"
                onClick={handleInstallApp}
                className="px-2.5 py-1.5 bg-white/10 hover:bg-white/15 text-slate-200 rounded-xl text-xs font-black flex items-center gap-1.5 border border-white/10 transition-all active:scale-95"
                title="Install Application"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline">Install</span>
              </button>

              <button
                type="button"
                onClick={handleLockOwner}
                className="px-2.5 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-200 rounded-xl text-xs font-black flex items-center gap-1 border border-rose-500/25 transition-all"
                title="Lock Owner Session"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock</span>
              </button>

              <button
                type="button"
                onClick={() => navigateToSystem('portal')}
                className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black flex items-center gap-1 border border-white/10 transition-all"
                title="Switch Work Station"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Portal</span>
              </button>
            </div>

          </div>
        </header>
      )}

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
      {systemMode === 'chef' && (
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full pb-28">
          
          {/* STEP PROGRESS INDICATOR (5-STEP SEQUENTIAL WIZARD) */}
          <div className="mb-6 bg-white p-3 sm:p-3.5 rounded-3xl shadow-md shadow-emerald-900/5 border border-emerald-100">
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2 text-center">
              
              {/* Step 1 Pill: Food */}
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
                <div className="flex items-center gap-1 text-[11px] sm:text-xs">
                  <span>1. Food</span>
                  {cart.length > 0 && (
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white text-[9px] font-black flex items-center justify-center">
                      {cart.reduce((s, i) => s + i.qty, 0)}
                    </span>
                  )}
                </div>
                <span className="text-[9px] opacity-80 hidden sm:inline">ምግብ</span>
              </button>

              {/* Step 2 Pill: Service (Takeaway vs Home) - Cannot be jumped */}
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
                <div className="flex items-center gap-1 text-[11px] sm:text-xs">
                  <span>2. Service</span>
                </div>
                <span className="text-[9px] opacity-80 hidden sm:inline">🥡 / 🏠</span>
              </button>

              {/* Step 3 Pill: Shift */}
              <button
                type="button"
                disabled={orderStep < 3 && cart.length === 0}
                onClick={() => orderStep >= 3 && setOrderStep(3)}
                className={`flex flex-col items-center py-2 px-1 rounded-2xl transition-all ${
                  orderStep === 3 
                    ? 'bg-emerald-600 text-white font-black shadow-md shadow-emerald-600/30' 
                    : orderStep > 3 
                      ? 'bg-emerald-50 text-emerald-800 font-bold hover:bg-emerald-100' 
                      : 'text-slate-400 font-semibold disabled:opacity-40'
                }`}
              >
                <div className="flex items-center gap-1 text-[11px] sm:text-xs">
                  <span>3. Shift</span>
                </div>
                <span className="text-[9px] opacity-80 hidden sm:inline">ፈረቃ</span>
              </button>

              {/* Step 4 Pill: Waiter */}
              <button
                type="button"
                disabled={orderStep < 4}
                onClick={() => orderStep >= 4 && setOrderStep(4)}
                className={`flex flex-col items-center py-2 px-1 rounded-2xl transition-all ${
                  orderStep === 4 
                    ? 'bg-emerald-600 text-white font-black shadow-md shadow-emerald-600/30' 
                    : orderStep > 4 
                      ? 'bg-emerald-50 text-emerald-800 font-bold hover:bg-emerald-100' 
                      : 'text-slate-400 font-semibold disabled:opacity-40'
                }`}
              >
                <div className="flex items-center gap-1 text-[11px] sm:text-xs">
                  <span>4. Waiter</span>
                </div>
                <span className="text-[9px] opacity-80 hidden sm:inline">አስተናጋጅ</span>
              </button>

              {/* Step 5 Pill: Submit */}
              <button
                type="button"
                disabled={orderStep < 5}
                onClick={() => orderStep >= 5 && setOrderStep(5)}
                className={`flex flex-col items-center py-2 px-1 rounded-2xl transition-all ${
                  orderStep === 5 
                    ? 'bg-emerald-600 text-white font-black shadow-md shadow-emerald-600/30' 
                    : 'text-slate-400 font-semibold disabled:opacity-40'
                }`}
              >
                <div className="flex items-center gap-1 text-[11px] sm:text-xs">
                  <span>5. Review</span>
                </div>
                <span className="text-[9px] opacity-80 hidden sm:inline">ማጠቃለያ</span>
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
                    {orderType === 'Takeaway'
                      ? 'የሚፈልጉትን ምግብ ይጫኑ፤ ቀጥሎ ቴክአዌይ ወይም ቤት ውስጥ መሆኑን ይመርጣሉ'
                      : 'የሚፈልጉትን ምግብ ይጫኑ፤ በቤት ውስጥ (🍽️) ስለቀረበ የቦክስ እቃ አይወጣም'}
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
                  { id: 'All', label: '🌟 ሁሉም (All)' },
                  { id: 'Juices', label: '🥤 ጁሶች (Juices)' },
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
                  const effectivePrice = getDishEffectivePrice(dish, orderType);
                  const isDiscounted = orderType === 'Home' && effectivePrice < Number(dish.price);
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
                          {dish.imageUrl && (
                            <img 
                              src={dish.imageUrl} 
                              alt={dish.name} 
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fallback = e.currentTarget.parentElement.querySelector('.image-emoji-fallback');
                                if (fallback) fallback.style.display = 'flex';
                              }}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          )}
                          <div 
                            className="image-emoji-fallback w-full h-full items-center justify-center text-4xl bg-emerald-50"
                            style={{ display: dish.imageUrl ? 'none' : 'flex' }}
                          >
                            {dish.emoji}
                          </div>

                          {/* Packaging Tag */}
                          <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white text-[9px] font-black px-2 py-0.5 rounded-lg border border-white/20">
                            {orderType === 'Takeaway' ? '🥡 1 ቦክስ' : '🍽️ ቤት ውስጥ'}
                          </div>

                          {/* Discount Badge on Image for Dine-In Home prices */}
                          {isDiscounted && (
                            <div className="absolute bottom-2 left-2 bg-emerald-700 text-white text-[9px] font-black px-2 py-0.5 rounded-lg shadow-sm border border-emerald-500">
                              🏠 {effectivePrice} ETB
                            </div>
                          )}

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
                        <div>
                          <div className="flex items-baseline gap-1">
                            <span className={`font-black text-xs sm:text-sm ${isDiscounted ? 'text-emerald-700' : 'text-slate-900'}`}>
                              {effectivePrice}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold">ETB</span>
                          </div>
                          {isDiscounted && (
                            <span className="text-[9px] text-slate-400 line-through font-bold block">
                              320 ETB
                            </span>
                          )}
                        </div>

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
          {/* ============================================================== */}
          {/* STEP 2: CHOOSE SERVICE TYPE (TAKEAWAY vs HOME 300 ETB)         */}
          {/* ============================================================== */}
          {orderStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200 max-w-2xl mx-auto">
              
              <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-sm text-center">
                <span className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 font-black inline-flex items-center justify-center text-sm mb-2 shadow-sm">
                  2
                </span>
                <h2 className="text-xl font-black text-slate-900">
                  የአገልግሎት ዓይነት ይምረጡ (Choose Service Type)
                </h2>
                <p className="text-xs text-slate-500 font-bold mt-1">
                  ትዕዛዙ ቴክአዌይ (Takeaway) ነው ወይስ በሬስቶራንት ውስጥ የሚበላ (Home)?
                </p>
              </div>

              {/* 2 Big Visual Touch-Friendly Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                
                {/* 1. Takeaway Card */}
                <div
                  onClick={() => setOrderType('Takeaway')}
                  className={`p-6 sm:p-7 rounded-3xl border-2 text-left transition-all flex flex-col justify-between gap-5 cursor-pointer active:scale-[0.98] ${
                    orderType === 'Takeaway'
                      ? 'border-emerald-600 bg-emerald-50/90 shadow-xl shadow-emerald-700/15 ring-4 ring-emerald-500/20'
                      : 'border-slate-200 bg-white hover:border-emerald-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-3xl shadow-inner">
                      🥡
                    </div>
                    {orderType === 'Takeaway' ? (
                      <span className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-black px-3.5 py-1.5 rounded-full shadow-sm">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>ተመርጧል (Selected)</span>
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                        ይምረጡ
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-xl font-black text-slate-900">
                      🥡 ቴክአዌይ (Takeaway)
                    </h3>
                    <p className="text-xs font-bold text-slate-500 leading-relaxed">
                      ለደጃፍ ወይም ይዘውት ለሚሄዱ ደንበኞች። የምግብ ማሸጊያ ቦክስ በየምግቡ ይቆጠራል (1 Box per item)።
                    </p>
                  </div>

                  <div className="pt-3 border-t border-emerald-200/60 flex items-center justify-between text-xs font-black">
                    <span className="text-slate-600">ዋጋ (Pricing):</span>
                    <span className="text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-xl">
                      መደበኛ ዋጋ (Normal)
                    </span>
                  </div>
                </div>

                {/* 2. Home (Dine-In 300 ETB) Card */}
                <div
                  onClick={() => setOrderType('Home')}
                  className={`p-6 sm:p-7 rounded-3xl border-2 text-left transition-all flex flex-col justify-between gap-5 cursor-pointer active:scale-[0.98] ${
                    orderType === 'Home'
                      ? 'border-emerald-600 bg-emerald-50/90 shadow-xl shadow-emerald-600/15 ring-4 ring-emerald-500/20'
                      : 'border-slate-200 bg-white hover:border-emerald-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-900 flex items-center justify-center text-3xl shadow-inner">
                      🏠
                    </div>
                    {orderType === 'Home' ? (
                      <span className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-black px-3.5 py-1.5 rounded-full shadow-sm">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>ተመርጧል (Selected)</span>
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                        ይምረጡ
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-black text-slate-900">
                        🏠 ቤት ውስጥ (Home)
                      </h3>
                      <span className="bg-emerald-700 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-sm">
                        300 ETB
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-500 leading-relaxed">
                      በሬስቶራንት ውስጥ ተቀምጠው ለሚመገቡ ደንበኞች። ቦክስ አይወጣም (0 Boxes)።
                    </p>
                  </div>

                  <div className="pt-3 border-t border-emerald-100 flex items-center justify-between text-xs font-black">
                    <span className="text-slate-600">ልዩ ቅናሽ (Discount):</span>
                    <span className="text-emerald-900 bg-emerald-100/90 border border-emerald-200 px-2.5 py-1 rounded-xl">
                      ✨ የ 320 ብር ምግቦች በ 300 ብር!
                    </span>
                  </div>
                </div>

              </div>

              {/* Order Pricing Preview Box */}
              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-emerald-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-xl">
                    {orderType === 'Home' ? '🏠' : '🥡'}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-400 block">የተመረጠው አገልግሎት</span>
                    <span className="text-sm font-black text-slate-900">
                      {orderType === 'Home' ? 'ቤት ውስጥ (Home) • የ 300 ብር ቅናሽ ተተግብሯል' : 'ቴክአዌይ (Takeaway) • የማሸጊያ ቦክስ ይቆጠራል'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-slate-400 block">የአሁን ድምር ዋጋ (Total)</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900">{totalSubtotal.toLocaleString()}</span>
                    <span className="text-xs font-black text-emerald-700">ETB</span>
                  </div>
                </div>
              </div>

              {/* Step 2 Back & Next Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setOrderStep(1)}
                  className="px-5 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-black text-xs sm:text-sm flex items-center gap-2 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>ወደ ምግብ መረጣ (Back to Food)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOrderStep(3)}
                  className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-700/20 transition-all scale-[1.02]"
                >
                  <span>ቀጣይ ወደ ፈረቃ (Next: Shift) →</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 3: IS IT DAY, NIGHT, OR BEU?                              */}
          {/* ============================================================== */}
          {orderStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-sm text-center max-w-xl mx-auto">
                <span className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 font-black inline-flex items-center justify-center text-sm mb-2">
                  3
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
                      ? 'border-emerald-600 bg-emerald-50/90 shadow-xl shadow-emerald-600/10 scale-105 ring-2 ring-emerald-500/20'
                      : 'border-emerald-100/80 bg-white hover:border-emerald-300'
                  }`}
                >
                  <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-inner">
                    <Sun className="w-9 h-9" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-slate-900">☀️ ቀን (Day Shift)</h3>
                    <p className="text-xs text-slate-400 font-bold mt-0.5">የቀን ፈረቃ ትዕዛዝ</p>
                  </div>
                  {selectedShiftType === 'Day' && (
                    <span className="text-[11px] font-black text-emerald-800 bg-emerald-200/80 px-3 py-1 rounded-full">
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
                      ? 'border-emerald-600 bg-emerald-50/90 shadow-xl shadow-emerald-600/10 scale-105 ring-2 ring-emerald-500/20'
                      : 'border-emerald-100/80 bg-white hover:border-emerald-300'
                  }`}
                >
                  <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-inner">
                    <Moon className="w-9 h-9" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-slate-900">🌙 ማታ (Night Shift)</h3>
                    <p className="text-xs text-slate-400 font-bold mt-0.5">የማታ ፈረቃ ትዕዛዝ</p>
                  </div>
                  {selectedShiftType === 'Night' && (
                    <span className="text-[11px] font-black text-emerald-800 bg-emerald-200/80 px-3 py-1 rounded-full">
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
                    setOrderType('Takeaway');
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
                  onClick={() => setOrderStep(2)}
                  className="px-5 py-3 rounded-2xl bg-white hover:bg-emerald-50 text-slate-700 border border-emerald-200 font-black text-xs flex items-center gap-2 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>ወደ አገልግሎት (Back: Service)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOrderStep(4)}
                  className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-700/20 transition-all scale-[1.02]"
                >
                  <span>ቀጥል ወደ አስተናጋጅ (Next: Waiter)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 4: WHO IS THE WAITER THAT TAKES IT?                        */}
          {/* ============================================================== */}
          {orderStep === 4 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-sm text-center max-w-xl mx-auto">
                <span className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 font-black inline-flex items-center justify-center text-sm mb-2">
                  4
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
                  onClick={() => setOrderStep(3)}
                  className="px-5 py-3 rounded-2xl bg-white hover:bg-emerald-50 text-slate-700 border border-emerald-200 font-black text-xs flex items-center gap-2 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>ወደ ፈረቃ (Back: Shift)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOrderStep(5)}
                  className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-700/20 transition-all scale-[1.02]"
                >
                  <span>ቀጥል ወደ ማረጋገጫ (Next: Submit)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 5: REVIEW & SUBMIT TO OWNER                               */}
          {/* ============================================================== */}
          {orderStep === 5 && (
            <div className="space-y-5 animate-in fade-in duration-200 max-w-sm sm:max-w-md mx-auto text-center">
              
              <div>
                <span className="w-9 h-9 rounded-2xl bg-[#E2F4EB] text-[#126848] font-black inline-flex items-center justify-center text-sm mb-2 shadow-sm">
                  5
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-[#1C201D] tracking-tight">
                  ትዕዛዙን አረጋግጠው ያስገቡ
                </h2>
                <p className="text-xs font-semibold text-[#666E67] mt-1">
                  Confirm & Review Order Ticket
                </p>
              </div>

              {/* TICKET RECEIPT CARD (MATCHING SUBMISSION LAYOUT) */}
              <div className="w-full bg-white rounded-[32px] shadow-sm border border-[#E9E4D6] overflow-hidden text-left">
                
                {/* 1. Food Items List */}
                <div className="p-5 sm:p-6 space-y-3">
                  {cart.map((item, idx) => (
                    <div key={item.id || idx} className="flex items-center gap-3.5 pb-2.5 border-b border-[#F2EEE4] last:border-b-0 last:pb-0">
                      <span className="bg-[#E2F4EB] text-[#126848] font-black text-xs px-2.5 py-1 rounded-xl flex-shrink-0">
                        {item.qty}×
                      </span>
                      <span className="font-black text-sm sm:text-base text-[#1C201D] tracking-tight">
                        {item.name}
                      </span>
                    </div>
                  ))}

                  {/* Total Price Box */}
                  <div className="bg-[#EBF6F0] rounded-2xl p-4 flex items-center justify-between mt-3">
                    <span className="font-black text-sm text-[#1C201D]">ድምር ዋጋ</span>
                    <div className="flex items-baseline">
                      <span className="text-3xl font-black text-[#1C201D] tracking-tight">
                        {totalSubtotal.toLocaleString()}
                      </span>
                      <span className="text-xs font-black text-[#107049] ml-1.5">
                        ETB
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dashed Tear Line with Circular Notches */}
                <div className="relative py-1 bg-white">
                  <div className="border-t-2 border-dashed border-[#DDD7C8] w-full" />
                  <div className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#FDFBF7] border-r border-[#DDD7C8]" />
                  <div className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#FDFBF7] border-l border-[#DDD7C8]" />
                </div>

                {/* 2. Metadata Details Rows */}
                <div className="p-5 sm:p-6 space-y-4 bg-white">
                  
                  {/* Date */}
                  <div className="flex items-start justify-between text-xs">
                    <div className="flex items-center gap-2 text-[#5A625B] font-bold">
                      <Calendar className="w-4 h-4 text-[#7A837C]" />
                      <span>ቀን</span>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className="font-black text-xs text-[#1D211E]">
                          {orderEthDate.formatted}
                        </span>
                        <button
                          type="button"
                          onClick={() => openEthDateModal('current')}
                          className="text-[10px] text-emerald-700 hover:underline font-bold"
                          title="ቀን ቀይር"
                        >
                          (ቀይር)
                        </button>
                      </div>
                      <span className="text-[11px] font-semibold text-[#7D847E] block mt-0.5">
                        {getFormattedGregorianDate()}
                      </span>
                    </div>
                  </div>

                  {/* Shift */}
                  <div className="flex items-start justify-between text-xs">
                    <div className="flex items-center gap-2 text-[#5A625B] font-bold">
                      <Sun className="w-4 h-4 text-[#7A837C]" />
                      <span>ፈረቃ</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-xs text-[#1D211E] block">
                        {selectedShiftType === 'Day' ? 'Day Shift' : selectedShiftType === 'Night' ? 'Night Shift' : 'BEU Delivery'}
                      </span>
                      <span className="text-[11px] font-semibold text-[#7D847E] block mt-0.5">
                        {selectedShiftType === 'BEU' ? (beuOrderId || 'BEU Delivery') : orderType === 'Home' ? 'In-Store Home' : 'In-Store Takeaway'}
                      </span>
                    </div>
                  </div>

                  {/* Order Type */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-[#5A625B] font-bold">
                      <ShoppingBag className="w-4 h-4 text-[#7A837C]" />
                      <span>አገልግሎት</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-xs text-[#1D211E]">
                        {orderType === 'Home' ? 'ቤት ውስጥ  Home' : 'ቴክአዌይ  Takeaway'}
                      </span>
                    </div>
                  </div>

                  {/* Waiter */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-[#5A625B] font-bold">
                      <User className="w-4 h-4 text-[#7A837C]" />
                      <span>የወሰደው</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-xs text-[#1D211E]">
                        {formatWaiterDisplayName(customWaiterName.trim() || selectedWaiter)}
                      </span>
                    </div>
                  </div>

                  {/* Boxes Count */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-[#5A625B] font-bold">
                      <Box className="w-4 h-4 text-[#7A837C]" />
                      <span>የወጣ ቦክስ</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-xs text-[#1D211E]">
                        {orderType === 'Home' 
                          ? '0  Takeaway Box' 
                          : `${totalBoxesInOrder}  Takeaway Box`}
                      </span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  className="w-full bg-[#107049] hover:bg-[#0D5B3B] active:scale-[0.98] transition-all text-white rounded-3xl py-4 px-6 flex items-center justify-center gap-3.5 shadow-xl shadow-[#107049]/25 select-none"
                >
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-white stroke-[3]" />
                  </div>
                  <div className="text-left">
                    <span className="font-black text-sm sm:text-base text-white block leading-tight">
                      ትዕዛዙን መዝግብ / አስገባ
                    </span>
                    <span className="text-[11px] font-semibold text-white/80 block mt-0.5">
                      Confirm & Submit Order
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setOrderStep(4)}
                  className="w-full py-3 rounded-2xl bg-white hover:bg-emerald-50 text-slate-600 border border-emerald-100 font-black text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>ወደ አስተናጋጅ ተመለስ (Back: Waiter)</span>
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
                        {orderType === 'Takeaway' ? (
                          <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-lg">
                            🥡 {totalBoxesInOrder} ቦክስ
                          </span>
                        ) : (
                          <span className="text-xs font-black text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-300">
                            🏠 ቤት ውስጥ (0 ቦክስ)
                          </span>
                        )}
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
                    <span>ቀጥል (Next: 🥡 Takeaway / 🏠 Home)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            </div>
          )}

        </main>
      )}

      {/* ============================================================== */}
      {/* 2. OWNER EXECUTIVE COMMAND CENTER (6-SECTION SIDEBAR LAYOUT)   */}
      {/* ============================================================== */}
      {systemMode === 'owner' && (() => {
        const pkgAudit = computePackagingAudit({ orders: sentOrders, settlements: settlementsHistory });
        const mismatchCount = settlementsHistory.filter(s => s.chefAudit?.hasMismatch).length;
        const stockAlert =
          pkgAudit.boxes.status === 'finished' || pkgAudit.cups.status === 'finished'
            ? 'FINISHED'
            : (pkgAudit.boxes.status === 'low' || pkgAudit.cups.status === 'low')
              ? 'LOW'
              : null;

        const navItems = [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: mismatchCount > 0 ? `${mismatchCount} 🚨` : null, alert: mismatchCount > 0 },
          { id: 'sheet', label: 'Daily Sheet', icon: ClipboardCheck, badge: null },
          { id: 'analysis', label: 'Income & Reports', icon: BarChart3, badge: settlementsHistory.length, alert: mismatchCount > 0 },
          { id: 'stock', label: 'Box & Stock Audit', icon: Package, badge: stockAlert || (pkgAudit.boxes.bought > 0 ? pkgAudit.boxes.totalRemaining : null), alert: Boolean(stockAlert) },
          { id: 'menu', label: 'Menu & Prices', icon: Tag, badge: foodMenu.length },
          { id: 'finance', label: 'Finance', icon: Wallet, badge: null },
          { id: 'plans', label: 'Plans & Goals', icon: Target, badge: null }
        ];

        const activeAnalysisMode = ownerSection === 'analysis' || ownerSection === 'orders';

        const ordersAuditBlock = (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header Action Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-emerald-100 shadow-sm">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm">
                    👑
                </span>
                <h2 className="text-lg font-black text-slate-900">
                  Owner Command Center & Orders Audit
                </h2>
              </div>
              <p className="text-xs text-slate-500 font-bold mt-1">
                Track prepared and served orders, packaging box inventory, waiter performance, and daily shifts
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Export to CSV */}
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95 border border-slate-200"
                title="Export Orders to CSV"
              >
                <Download className="w-3.5 h-3.5 text-emerald-700" />
                <span>Export CSV</span>
              </button>

              {/* Print Summary */}
              <button
                type="button"
                onClick={handlePrintSummary}
                className="px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95 border border-slate-200"
                title="Print Daily Summary"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-700" />
                <span>Print Summary</span>
              </button>

              {/* Box Inventory Modal Trigger */}
              <button
                type="button"
                onClick={() => {
                  setBoxStockInput(boxInventoryInitial.toString());
                  setShowBoxStockModal(true);
                }}
                className="px-3.5 py-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-black text-xs flex items-center gap-1.5 transition-all shadow-sm border border-emerald-200 active:scale-95"
                title="Takeaway Box Inventory Tracker"
              >
                <Package className="w-3.5 h-3.5 text-emerald-700" />
                <span>Box Inventory</span>
              </button>

              {/* Reset Day Orders */}
              <button
                type="button"
                onClick={handleResetDayOrders}
                className="px-3 py-2 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-xs flex items-center gap-1 transition-all border border-rose-200 active:scale-95"
                title="Reset Daily Shift Orders"
              >
                <RefreshCw className="w-3.5 h-3.5 text-rose-600" />
                <span>Reset Shift</span>
              </button>
            </div>
          </div>

          {/* DATE RANGE FILTER TABS FOR THE DASHBOARD */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1 mr-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>Report Date:</span>
              </span>

              {/* Today */}
              <button
                type="button"
                onClick={() => { setOwnerDateRange('today'); setOwnerSelectedCustomDate(''); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  ownerDateRange === 'today'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                📅 Today ({sentOrders.filter(o => o.ethiopianDate === orderEthDate.formatted).length})
              </button>

              {/* All Time */}
              <button
                type="button"
                onClick={() => { setOwnerDateRange('all'); setOwnerSelectedCustomDate(''); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  ownerDateRange === 'all'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                🗓️ All Days ({sentOrders.length})
              </button>

              {/* Direct Open Calendar Button */}
              <button
                type="button"
                onClick={() => openEthDateModal('filter')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border ${
                  ownerDateRange === 'custom'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                }`}
                title="Pick date from Ethiopian calendar"
              >
                <Calendar className="w-3.5 h-3.5" />
                {ownerDateRange === 'custom' && ownerSelectedCustomDate ? (
                  <span>📅 {ownerSelectedCustomDate}</span>
                ) : (
                  <span>Calendar Picker</span>
                )}
              </button>

              {/* Selected Custom Date Pill */}
              {ownerDateRange === 'custom' && ownerSelectedCustomDate && (
                <button
                  type="button"
                  onClick={() => { setOwnerDateRange('today'); setOwnerSelectedCustomDate(''); }}
                  className="w-6 h-6 rounded-full bg-slate-200 hover:bg-rose-100 hover:text-rose-600 text-slate-600 flex items-center justify-center text-xs font-black transition-all"
                  title="Reset to Today"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 self-start md:self-auto flex items-center gap-1.5">
              <span>Selected Date:</span>
              <span className="font-black text-slate-900">
                {ownerDateRange === 'today' ? orderEthDate.formatted : (ownerSelectedCustomDate || 'All Days')}
              </span>
            </div>
          </div>

          {/* 6 EXECUTIVE STAT CARDS: DAY, NIGHT, BEU, HOME, TOTAL BOXES & TOTAL REVENUE */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            
            {/* 1. Day Shift Card */}
            <div className="bg-white p-4 rounded-3xl border border-amber-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  የቀን ፈረቃ (Day)
                </span>
                <span className="text-xl">☀️</span>
              </div>
              <p className="text-lg font-black text-slate-900 mt-2">{dayOrders.length} <span className="text-xs font-bold text-slate-400">ትዕዛዝ</span></p>
              <div className="mt-1 pt-2 border-t border-slate-100 text-[10px] font-bold text-amber-800 flex items-center justify-between">
                <span>🥡 {dayBoxes} ቦክስ</span>
                <span>{dayRevenue.toLocaleString()} ETB</span>
              </div>
            </div>

            {/* 2. Night Shift Card */}
            <div className="bg-white p-4 rounded-3xl border border-indigo-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  የማታ ፈረቃ (Night)
                </span>
                <span className="text-xl">🌙</span>
              </div>
              <p className="text-lg font-black text-slate-900 mt-2">{nightOrders.length} <span className="text-xs font-bold text-slate-400">ትዕዛዝ</span></p>
              <div className="mt-1 pt-2 border-t border-slate-100 text-[10px] font-bold text-indigo-800 flex items-center justify-between">
                <span>🥡 {nightBoxes} ቦክስ</span>
                <span>{nightRevenue.toLocaleString()} ETB</span>
              </div>
            </div>

            {/* 3. BEU Delivery Card */}
            <div className="bg-white p-4 rounded-3xl border border-teal-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  ቢዩ (BEU)
                </span>
                <span className="text-xl">🛵</span>
              </div>
              <p className="text-lg font-black text-slate-900 mt-2">{beuOrders.length} <span className="text-xs font-bold text-slate-400">ትዕዛዝ</span></p>
              <div className="mt-1 pt-2 border-t border-slate-100 text-[10px] font-bold text-teal-800 flex items-center justify-between">
                <span>🥡 {beuBoxes} ቦክስ</span>
                <span>{beuRevenue.toLocaleString()} ETB</span>
              </div>
            </div>

            {/* 4. Home (Dine-in) Card */}
            <div className="bg-white p-4 rounded-3xl border border-amber-300 shadow-sm flex flex-col justify-between bg-amber-50/20">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                  ቤት ውስጥ (Home)
                </span>
                <span className="text-xl">🏠</span>
              </div>
              <p className="text-lg font-black text-slate-900 mt-2">{homeOrders.length} <span className="text-xs font-bold text-slate-400">ትዕዛዝ</span></p>
              <div className="mt-1 pt-2 border-t border-slate-100 text-[10px] font-bold text-amber-900 flex items-center justify-between">
                <span>🍽️ 0 ቦክስ</span>
                <span>{homeRevenue.toLocaleString()} ETB</span>
              </div>
            </div>

            {/* 5. Total Packaging Boxes */}
            <div className="bg-white p-4 rounded-3xl border border-emerald-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  የወጡ ቦክሶች
                </span>
                <span className="text-xl">🥡</span>
              </div>
              <p className="text-lg font-black text-emerald-800 mt-2">{totalBoxesAll} <span className="text-xs font-bold text-slate-400">ቦክስ</span></p>
              <div className="mt-1 pt-2 border-t border-slate-100 text-[10px] font-bold text-emerald-700 flex items-center justify-between">
                <span>ቀሪ ክምችት፡</span>
                <span className="font-black">{remainingBoxes} ቀሪ</span>
              </div>
            </div>

            {/* 6. Total Revenue */}
            <div className="bg-gradient-to-br from-emerald-700 to-teal-800 p-4 rounded-3xl text-white shadow-md shadow-emerald-900/20 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-200">
                  ጠቅላላ ሽያጭ
                </span>
                <span className="text-xl">💰</span>
              </div>
              <p className="text-xl font-black text-white mt-2 tracking-tight">
                {totalRevenueAll.toLocaleString()} <span className="text-xs font-bold text-emerald-200">ETB</span>
              </p>
              <div className="mt-1 pt-2 border-t border-white/20 text-[10px] font-bold text-emerald-100 flex items-center justify-between">
                <span>ትዕዛዞች፡ {dateFilteredOrders.length}</span>
                <span>100% ጸድቋል</span>
              </div>
            </div>

          </div>

          {/* BOX INVENTORY TRACKER BANNER */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-emerald-100 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-2xl flex-shrink-0">
                📦
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm text-slate-900">
                    የቴክአዌይ ሳጥን ክምችት ቁጥጥር (Takeaway Packaging Box Tracker)
                  </h3>
                  {remainingBoxes < 50 && (
                    <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[10px] font-black">
                      ⚠️ ሳጥን ሊያልቅ ነው!
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 font-bold mt-0.5">
                  የመነሻ ክምችት: <span className="text-slate-700 font-black">{boxInventoryInitial} ቦክስ</span> | 
                  የወጣው: <span className="text-emerald-700 font-black">{allTimeBoxesUsed} ቦክስ</span> | 
                  ቀሪ ሳጥን: <span className={`font-black ${remainingBoxes < 50 ? 'text-rose-600' : 'text-emerald-800'}`}>{remainingBoxes} ቦክስ ({boxStockPercent}%)</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-32 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${remainingBoxes < 50 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                  style={{ width: `${boxStockPercent}%` }}
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setBoxStockInput(boxInventoryInitial.toString());
                  setShowBoxStockModal(true);
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm transition-all"
              >
                ክምችት አሻሽል
              </button>
            </div>
          </div>

          {/* WAITERS PERFORMANCE BREAKDOWN */}
          <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>👤 በአስተናጋጆች የተወሰደ (Orders Taken by Waiter)</span>
              </h3>
              <span className="text-xs text-slate-400 font-bold">የአስተናጋጆች አፈጻጸም</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {waitersList.map(waiter => {
                const stats = waiterStats[waiter.fullName] || 
                              waiterStats[waiter.amharic] || 
                              waiterStats[waiter.english] || 
                              { ordersCount: 0, boxesCount: 0, totalETB: 0 };
                const isSelected = ownerWaiterFilter === waiter.amharic || ownerWaiterFilter === waiter.english;
                return (
                  <div 
                    key={waiter.fullName}
                    onClick={() => setOwnerWaiterFilter(isSelected ? 'all' : waiter.amharic)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-emerald-100 border-emerald-500 shadow-md ring-2 ring-emerald-500/20' 
                        : 'bg-emerald-50/40 border-emerald-100 hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base">{waiter.emoji || '👤'}</span>
                      {isSelected && (
                        <span className="text-[9px] bg-emerald-600 text-white font-black px-1.5 py-0.5 rounded">
                          ተመርጧል
                        </span>
                      )}
                    </div>
                    <span className="font-black text-xs text-slate-900 block truncate mt-1">{waiter.amharic}</span>
                    <span className="text-[10px] text-slate-400 font-bold block truncate">{waiter.english}</span>
                    <div className="mt-2 pt-1.5 border-t border-emerald-100 space-y-0.5 text-[11px] font-bold text-slate-600">
                      <p>ትዕዛዞች፡ <span className="font-black text-slate-900">{stats.ordersCount}</span></p>
                      <p>ቦክሶች፡ <span className="font-black text-emerald-800">{stats.boxesCount} 🥡</span></p>
                      <p>ድምር፡ <span className="font-black text-slate-900">{stats.totalETB.toLocaleString()} ETB</span></p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ============================================================== */}
          {/* COMPLETE ORDERS AUDIT & MANAGEMENT LOG (EVERY ORDER VISIBLE!)   */}
          {/* ============================================================== */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-100 shadow-sm space-y-5">
            
            {/* Header Title with live counter */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center flex-shrink-0 border border-emerald-100">
                  <Receipt className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <span>የትዕዛዞች መቆጣጠሪያ</span>
                    <span className="text-xs font-bold text-slate-400 font-sans">(Orders Log)</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-bold">
                    በቀን፣ በፈረቃና በአስተናጋጅ የተመዘገቡ {sentOrders.length} ጠቅላላ ትዕዛዞች
                  </p>
                </div>
              </div>

              {/* Status / Waiter / Date Filter Reset */}
              {(ownerShiftFilter !== 'all' || ownerWaiterFilter !== 'all' || ownerSearchQuery || ownerStatusFilter !== 'all' || ownerDateRange !== 'today' || ownerSelectedCustomDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setOwnerDateRange('today');
                    setOwnerSelectedCustomDate('');
                    setOwnerShiftFilter('all');
                    setOwnerWaiterFilter('all');
                    setOwnerSearchQuery('');
                    setOwnerStatusFilter('all');
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-xs font-black self-start sm:self-auto flex items-center gap-1.5 transition-all shadow-2xs active:scale-95"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>ማጣሪያዎችን አጥፋ (Reset)</span>
                </button>
              )}
            </div>

            {/* UNIFIED STREAMLINED FILTER TOOLBAR */}
            <div className="space-y-3">
              
              {/* ROW 1: SHIFT TABS (FULL-WIDTH MODERN SEGMENTED BAR) */}
              <div className="bg-slate-100/90 p-1.5 rounded-2xl flex items-center gap-1.5 overflow-x-auto border border-slate-200/50">
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider px-2 flex items-center gap-1 flex-shrink-0">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>ፈረቃ (Shift):</span>
                </span>

                <div className="flex items-center gap-1.5 flex-1 min-w-max">
                  {[
                    { id: 'all', label: '🌟 ሁሉም', count: dateFilteredOrders.length },
                    { id: 'Day', label: '☀️ የቀን', count: dayOrders.length },
                    { id: 'Night', label: '🌙 የማታ', count: nightOrders.length },
                    { id: 'BEU', label: '🛵 ቢዩ ዲሊቨሪ', count: beuOrders.length },
                    { id: 'Home', label: '🏠 ቤት ውስጥ', count: homeOrders.length },
                    { id: 'Takeaway', label: '🥡 ቴክአዌይ', count: takeawayOrders.length }
                  ].map(tab => {
                    const isActive = ownerShiftFilter === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          startFilterTransition(() => {
                            setOwnerShiftFilter(tab.id);
                          });
                        }}
                        className={`flex-1 min-w-[95px] py-2 px-3 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${
                          isActive
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/60'
                        }`}
                      >
                        <span>{tab.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-black ${
                          isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {tab.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ROW 2: DATE SELECTOR + SEARCH + WAITER/STATUS CONTROLS */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5">
                
                {/* 1. Date Selector (Pills) */}
                <div className="lg:col-span-5 bg-slate-50 p-1.5 rounded-2xl border border-slate-200/70 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider px-1.5 flex items-center gap-1 flex-shrink-0">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ቀን:</span>
                  </span>

                  {/* Today Button */}
                  <button
                    type="button"
                    onClick={() => { setOwnerDateRange('today'); setOwnerSelectedCustomDate(''); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                      ownerDateRange === 'today'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/60'
                    }`}
                  >
                    ዛሬ ({sentOrders.filter(o => o.ethiopianDate === orderEthDate.formatted).length})
                  </button>

                  {/* All Days Button */}
                  <button
                    type="button"
                    onClick={() => { setOwnerDateRange('all'); setOwnerSelectedCustomDate(''); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                      ownerDateRange === 'all'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/60'
                    }`}
                  >
                    ሁሉም ({sentOrders.length})
                  </button>

                  {/* Calendar Modal Trigger / Active Custom Date Badge */}
                  <button
                    type="button"
                    onClick={() => openEthDateModal('filter')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border shadow-2xs ${
                      ownerDateRange === 'custom'
                        ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                        : 'bg-white hover:bg-emerald-50 text-emerald-800 border-emerald-300'
                    }`}
                    title="ከቀን መቁጠሪያ ቀን ይምረጡ / Open Ethiopian Calendar"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    {ownerDateRange === 'custom' && ownerSelectedCustomDate ? (
                      <span>{ownerSelectedCustomDate}</span>
                    ) : (
                      <span>ቀን ምረጥ (Calendar)</span>
                    )}
                  </button>

                  {/* Reset Custom Date to Today button */}
                  {ownerDateRange === 'custom' && ownerSelectedCustomDate && (
                    <button
                      type="button"
                      onClick={() => { setOwnerDateRange('today'); setOwnerSelectedCustomDate(''); }}
                      className="w-5 h-5 rounded-full bg-slate-200 hover:bg-rose-100 hover:text-rose-600 text-slate-600 flex items-center justify-center text-xs font-black transition-all"
                      title="ወደ ዛሬ ቀን መልስ"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* 2. Live Search Input */}
                <div className="lg:col-span-3 relative">
                  <input
                    type="text"
                    placeholder="በምግብ ስም፣ በአስተናጋጅ ፈልግ..."
                    value={ownerSearchQuery}
                    onChange={(e) => setOwnerSearchQuery(e.target.value)}
                    className="w-full h-full min-h-[38px] bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-2xl py-2 pl-9 pr-8 text-xs font-bold text-slate-900 outline-none transition-all placeholder:text-slate-400 shadow-2xs"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  {ownerSearchQuery && (
                    <button 
                      type="button"
                      onClick={() => setOwnerSearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* 3. Waiter Filter Dropdown */}
                <div className="lg:col-span-2">
                  <select
                    value={ownerWaiterFilter}
                    onChange={(e) => setOwnerWaiterFilter(e.target.value)}
                    className="w-full h-full min-h-[38px] bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-2xl py-2 px-3 text-xs font-black text-slate-700 outline-none transition-all shadow-2xs"
                  >
                    <option value="all">👤 ሁሉም አስተናጋጅ</option>
                    {waitersList.map(w => (
                      <option key={w.fullName} value={w.amharic}>
                        {w.amharic}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Status Filter Dropdown */}
                <div className="lg:col-span-2">
                  <select
                    value={ownerStatusFilter}
                    onChange={(e) => setOwnerStatusFilter(e.target.value)}
                    className="w-full h-full min-h-[38px] bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-2xl py-2 px-3 text-xs font-black text-slate-700 outline-none transition-all shadow-2xs"
                  >
                    <option value="all">⚡ ሁሉም ሁኔታ</option>
                    <option value="cooked">🍳 የተዘጋጀ (Cooked)</option>
                    <option value="taken">🏃 የተወሰደ (Taken)</option>
                  </select>
                </div>

              </div>

              {/* ROW 3: ELEGANT LIVE METRICS & ACTIVE FILTERS STRIP */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 px-3.5 py-2.5 bg-emerald-50/70 border border-emerald-100 rounded-2xl text-xs">
                
                {/* Active Filter Indicators */}
                <div className="flex items-center gap-2 flex-wrap text-emerald-950 font-bold">
                  <span className="flex items-center gap-1 font-black bg-emerald-600 text-white px-2 py-0.5 rounded-lg text-[11px] shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{displayOrders.length} ትዕዛዞች</span>
                  </span>

                  <span className="text-slate-300">•</span>

                  <span className="text-slate-700 text-xs">
                    ቀን፡ <span className="font-black text-slate-900">{ownerDateRange === 'today' ? orderEthDate.formatted : (ownerSelectedCustomDate || 'ሁሉም ቀናት')}</span>
                  </span>

                  <span className="text-slate-300">•</span>

                  <span className="text-slate-700 text-xs">
                    ፈረቃ፡ <span className="font-black text-slate-900">
                      {ownerShiftFilter === 'all' ? 'ሁሉም ፈረቃ' : (ownerShiftFilter === 'Day' ? 'የቀን ፈረቃ' : (ownerShiftFilter === 'Night' ? 'የማታ ፈረቃ' : (ownerShiftFilter === 'BEU' ? 'ቢዩ ዲሊቨሪ' : (ownerShiftFilter === 'Home' ? 'ቤት ውስጥ' : 'ቴክአዌይ'))))}
                    </span>
                  </span>

                  {ownerWaiterFilter !== 'all' && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-700 text-xs">
                        አስተናጋጅ፡ <span className="font-black text-emerald-800">{ownerWaiterFilter}</span>
                      </span>
                    </>
                  )}

                  {ownerStatusFilter !== 'all' && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-700 text-xs">
                        ሁኔታ፡ <span className="font-black text-emerald-800">{ownerStatusFilter === 'cooked' ? 'የተዘጋጀ' : 'የተወሰደ'}</span>
                      </span>
                    </>
                  )}
                </div>

                {/* Financial & Box Totals for Active Filters */}
                <div className="flex items-center gap-2.5 font-black text-slate-800 self-end sm:self-auto text-xs">
                  <span className="bg-white px-2.5 py-1 rounded-xl border border-emerald-200/80 shadow-2xs text-slate-700">
                    💰 ድምር፡ <span className="text-emerald-700 font-black">{displayOrders.reduce((s, o) => s + o.totalAmount, 0).toLocaleString()} ETB</span>
                  </span>
                  <span className="bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs text-slate-700">
                    🥡 ቦክስ፡ <span className="text-slate-900 font-black">{displayOrders.reduce((s, o) => s + (o.boxesCount || 0), 0)}</span>
                  </span>
                </div>

              </div>

            </div>

            {/* THE ORDERS LIST (NO LIMIT - SHOWS ALL FILTERED ORDERS!) */}
            {displayOrders.length === 0 ? (
              <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-sm font-black text-slate-500">ምንም የተገኘ ትዕዛዝ የለም (No orders found)</p>
                <p className="text-xs text-slate-400 mt-1">የፍለጋ ቃሉን ወይም ማጣሪያውን ይቀይሩ</p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayOrders.map(order => {
                  const isHome = order.orderType === 'Home' || order.channel === 'In-Store Home';
                  const isCooked = (order.status || '').includes('ተዘጋጅቷል');

                  return (
                    <div 
                      key={order.id}
                      className="p-4 bg-slate-50/80 hover:bg-emerald-50/40 rounded-3xl border border-slate-200/80 hover:border-emerald-300 transition-all shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4"
                    >
                      {/* Left Block: Order Info & Food Items */}
                      <div className="flex items-start gap-3.5">
                        
                        {/* Packaging Icon Badge */}
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 shadow-inner ${
                          isHome ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                        }`}>
                          {isHome ? '🍽️' : '🥡'}
                        </div>

                        {/* Order Details */}
                        <div className="space-y-1.5">
                          {/* Order Badges Row */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-mono font-black text-xs text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                              #{order.id.slice(-6).toUpperCase()}
                            </span>

                            {/* Shift */}
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded-lg">
                              {order.shift}
                            </span>

                            {/* Channel / Order Type */}
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${
                              isHome ? 'bg-amber-100 text-amber-900' : 'bg-slate-200 text-slate-800'
                            }`}>
                              {isHome ? '🏠 ቤት ውስጥ' : '🥡 ቴክአዌይ'}
                            </span>

                            {order.channel === 'BEU Delivery' && (
                              <span className="text-[10px] bg-teal-100 text-teal-800 font-black px-2 py-0.5 rounded-lg">
                                {order.beuOrderId || 'BEU Delivery'}
                              </span>
                            )}

                            {/* Cooking / Taken Status Badge */}
                            <button
                              type="button"
                              onClick={() => handleToggleOrderStatus(order.id)}
                              className={`text-[10px] font-black px-2 py-0.5 rounded-lg border transition-all flex items-center gap-1 ${
                                isCooked 
                                  ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200' 
                                  : 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200'
                              }`}
                              title="የምግብ ሁኔታ ለመቀየር ይጫኑ / Click to toggle cooked vs taken"
                            >
                              <span>{order.status || '✅ ተዘጋጅቶ ተወስዷል (Cooked & Taken)'}</span>
                              <RefreshCw className="w-2.5 h-2.5 opacity-60" />
                            </button>
                          </div>

                          {/* Food Dishes List with Quantities */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            {order.items?.map((item, idx) => (
                              <span 
                                key={idx} 
                                className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-slate-200 text-xs font-black text-slate-900 shadow-2xs"
                              >
                                <span className="text-emerald-700 font-black">{item.qty}×</span>
                                <span>{item.name}</span>
                                <span className="text-[10px] text-slate-400 font-bold">({item.price} ETB)</span>
                              </span>
                            ))}
                          </div>

                          {/* Metadata row: Waiter, Time, Date, Box Count */}
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-bold pt-0.5">
                            <span className="text-slate-800 font-black flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                              👤 ወሳጅ፡ {order.waiterName || 'አልተጠቀሰም'}
                            </span>
                            <span>•</span>
                            <span className="text-emerald-900 font-black flex items-center gap-1">
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
                            <span>🕒 {order.timestamp}</span>
                            <span>•</span>
                            <span className="font-black text-slate-700">
                              {isHome ? '🍽️ 0 ቦክስ (Home)' : `📦 ${order.boxesCount || 0} ቴክአዌይ ቦክስ`}
                            </span>
                          </div>
                        </div>

                      </div>

                      {/* Right Block: Total Price & Actions */}
                      <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200/60">
                        
                        <div className="text-right">
                          <span className="text-lg font-black text-slate-900 block leading-tight">
                            {order.totalAmount?.toLocaleString()} <span className="text-xs font-black text-emerald-700">ETB</span>
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            {order.items?.reduce((s, i) => s + i.qty, 0)} የተዘጋጁ ምግቦች
                          </span>
                        </div>

                        {/* View Receipt Ticket Button */}
                        <button
                          type="button"
                          onClick={() => setSelectedOrderForView(order)}
                          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1 shadow-sm transition-all active:scale-95"
                          title="የዚህን ትዕዛዝ ሙሉ ደረሰኝ/ቲኬት እይ / View Receipt Ticket"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>ቲኬት እይ</span>
                        </button>

                        {/* Delete Order Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteOrder(order.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                          title="ትዕዛዙን ሰርዝ / Delete Order"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            </div>
          </div>
        );

        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex-1 w-full flex flex-col lg:flex-row gap-6 animate-in fade-in duration-200">
            {/* EXECUTIVE LEFT SIDEBAR (DESKTOP) / SCROLLABLE NAV BAR (MOBILE) */}
            <aside className="lg:w-64 flex-shrink-0">
              <div className="bg-slate-900 text-white rounded-3xl p-3 shadow-xl border border-slate-800 lg:sticky lg:top-20 flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible">
                <div className="hidden lg:block px-3 py-2 mb-1 border-b border-slate-800">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                    Owner Navigation
                  </span>
                </div>
                {navItems.map(item => {
                  const Icon = item.icon;
                  const isActive = item.id === 'analysis' ? activeAnalysisMode : ownerSection === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (item.id === 'analysis') {
                          try {
                            const saved = localStorage.getItem('maraki_shift_settlements');
                            if (saved) setSettlementsHistory(JSON.parse(saved));
                          } catch (e) {}
                        }
                        setOwnerSection(item.id);
                      }}
                      className={`px-3.5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center justify-between gap-2 whitespace-nowrap ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30 border-l-4 border-emerald-300'
                          : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-emerald-400'}`} />
                        <span>{item.label}</span>
                      </span>
                      {item.badge !== null && item.badge !== undefined && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                          item.alert
                            ? 'bg-rose-600 text-white animate-pulse'
                            : isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-800 text-slate-300'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}

                <div className="hidden lg:block mt-3 pt-3 border-t border-slate-800 px-2">
                  <button
                    type="button"
                    onClick={() => navigateToSystem('reconciliation')}
                    className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-emerald-300 text-[11px] font-black flex items-center justify-center gap-1.5 border border-white/10"
                  >
                    <ClipboardCheck className="w-3.5 h-3.5" />
                    <span>Full-Screen Daily Sheet</span>
                  </button>
                </div>
              </div>
            </aside>

            {/* MAIN OWNER CONTENT AREA */}
            <main className="flex-1 min-w-0 space-y-6">
              {ownerSection === 'dashboard' && (
                <OwnerDashboard
                  orders={sentOrders}
                  settlements={settlementsHistory}
                  onNavigateSection={(sec) => setOwnerSection(sec)}
                />
              )}

              {ownerSection === 'sheet' && (
                <ShiftReconciliation
                  embeddedMode={true}
                  orders={sentOrders}
                  waiters={waitersList}
                  foodMenu={foodMenu}
                  standardJuicePrice={standardJuicePrice}
                  onSwitchToOwnerPrices={() => setOwnerSection('menu')}
                  onSavedSettlement={(rec) => {
                    setSettlementsHistory(prev => [rec, ...prev.filter(s => s.id !== rec.id)]);
                  }}
                />
              )}

              {activeAnalysisMode && (
                <OwnerIncomeAnalysisReport
                  key={ownerSection}
                  initialSubView={ownerSection === 'orders' ? 'orders' : 'overview'}
                  settlements={settlementsHistory}
                  orders={sentOrders}
                  waiters={waitersList}
                  foodMenu={foodMenu}
                  standardJuicePrice={standardJuicePrice}
                  ordersAuditContent={ordersAuditBlock}
                  onOpenShiftReconciliation={() => setOwnerSection('sheet')}
                  onUpdateSettlements={(updated) => {
                    setSettlementsHistory(updated);
                    localStorage.setItem('maraki_shift_settlements', JSON.stringify(updated));
                  }}
                />
              )}

              {ownerSection === 'stock' && (
                <BoxInventoryAudit
                  orders={sentOrders}
                  settlements={settlementsHistory}
                  onStockChanged={() => setStockVersion(v => v + 1)}
                />
              )}

              {ownerSection === 'menu' && (
                <OwnerMenuPriceManager
                  foodMenu={foodMenu}
                  onUpdateMenu={(updated) => setFoodMenu(updated)}
                  defaultMenu={MARAKI_REAL_FOOD_MENU}
                  standardJuicePrice={standardJuicePrice}
                  onUpdateStandardJuicePrice={(rate) => setStandardJuicePrice(rate)}
                  ownerPassword={ownerPassword}
                />
              )}

              {ownerSection === 'finance' && (
                <BusinessManagement
                  visibleTabs={['expenses', 'topay', 'reports']}
                  defaultTab="expenses"
                  orders={sentOrders}
                  totalRealSales={totalRevenueAll}
                  onSwitchToOrdersLog={() => setOwnerSection('orders')}
                  onClearOrders={() => {
                    setSentOrders([]);
                    localStorage.removeItem('maraki_chef_sent_orders');
                  }}
                />
              )}

              {ownerSection === 'plans' && (
                <BusinessManagement
                  visibleTabs={['plans', 'schedule']}
                  defaultTab="plans"
                  orders={sentOrders}
                  totalRealSales={totalRevenueAll}
                  onSwitchToOrdersLog={() => setOwnerSection('orders')}
                  onClearOrders={() => {
                    setSentOrders([]);
                    localStorage.removeItem('maraki_chef_sent_orders');
                  }}
                />
              )}
            </main>
          </div>
        );
      })()}

      {/* ============================================================== */}
      {/* OWNER TICKET VIEWER MODAL (INSPECT ANY HISTORICAL ORDER)        */}
      {/* ============================================================== */}
      {selectedOrderForView && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#F8F6F0] flex flex-col items-center justify-center p-4 sm:p-6 min-h-screen animate-in fade-in duration-200">
          
          {/* Subtle Dot Matrix Background Texture */}
          <div 
            className="fixed inset-0 opacity-40 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(#C8BFAD 1.5px, transparent 1.5px)',
              backgroundSize: '20px 20px'
            }}
          />

          <div className="relative z-10 w-full flex flex-col items-center max-w-sm sm:max-w-md my-auto py-6">
            
            {/* Top Close Button */}
            <div className="w-full flex items-center justify-between mb-2">
              <span className="text-xs font-black text-slate-600 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-200">
                👑 የባለቤት መርማሪ (Ticket Audit)
              </span>
              <button
                type="button"
                onClick={() => setSelectedOrderForView(null)}
                className="w-8 h-8 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Glowing Checkmark Badge */}
            <div className="relative inline-flex items-center justify-center mb-1">
              <div className="w-20 h-20 rounded-full bg-[#D4EFE2] flex items-center justify-center shadow-inner">
                <div className="w-14 h-14 rounded-full bg-[#107049] flex items-center justify-center text-white shadow-md">
                  <Check className="w-8 h-8 stroke-[3.5] text-white" />
                </div>
              </div>
            </div>

            {/* Header Titles */}
            <h2 className="text-2xl sm:text-3xl font-black text-[#1C201D] tracking-tight text-center mt-3">
              ትዕዛዝ #{selectedOrderForView.id.slice(-6).toUpperCase()}
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-[#666E67] text-center mt-1 tracking-wide">
              {selectedOrderForView.status || 'ተዘጋጅቶ ተወስዷል (Cooked & Taken)'}
            </p>

            {/* Ticket Card */}
            <div className="w-full bg-white rounded-[32px] shadow-sm border border-[#E9E4D6] overflow-hidden text-left mt-6">
              
              {/* Food Items List */}
              <div className="p-5 sm:p-6 space-y-3">
                {selectedOrderForView.items?.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between pb-2.5 border-b border-[#F2EEE4] last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-3.5">
                      <span className="bg-[#E2F4EB] text-[#126848] font-black text-xs px-2.5 py-1 rounded-xl flex-shrink-0">
                        {item.qty}×
                      </span>
                      <span className="font-black text-sm sm:text-base text-[#1C201D] tracking-tight">
                        {item.name}
                      </span>
                    </div>
                    <span className="font-black text-xs text-[#1C201D]">
                      {item.price * item.qty} ETB
                    </span>
                  </div>
                ))}

                {/* Total Price Box */}
                <div className="bg-[#EBF6F0] rounded-2xl p-4 flex items-center justify-between mt-3">
                  <span className="font-black text-sm text-[#1C201D]">ድምር ዋጋ</span>
                  <div className="flex items-baseline">
                    <span className="text-3xl font-black text-[#1C201D] tracking-tight">
                      {selectedOrderForView.totalAmount?.toLocaleString()}
                    </span>
                    <span className="text-xs font-black text-[#107049] ml-1.5">
                      ETB
                    </span>
                  </div>
                </div>
              </div>

              {/* Dashed Tear Line with Circular Notches */}
              <div className="relative py-1 bg-white">
                <div className="border-t-2 border-dashed border-[#DDD7C8] w-full" />
                <div className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#F8F6F0] border-r border-[#DDD7C8]" />
                <div className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#F8F6F0] border-l border-[#DDD7C8]" />
              </div>

              {/* Metadata Details Rows */}
              <div className="p-5 sm:p-6 space-y-4 bg-white">
                
                {/* 1. Date */}
                <div className="flex items-start justify-between text-xs">
                  <div className="flex items-center gap-2 text-[#5A625B] font-bold">
                    <Calendar className="w-4 h-4 text-[#7A837C]" />
                    <span>ቀን</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-xs text-[#1D211E] block">
                      {selectedOrderForView.ethiopianDate}
                    </span>
                    <span className="text-[11px] font-semibold text-[#7D847E] block mt-0.5">
                      {selectedOrderForView.gregorianDateFormatted || selectedOrderForView.timestamp}
                    </span>
                  </div>
                </div>

                {/* 2. Shift */}
                <div className="flex items-start justify-between text-xs">
                  <div className="flex items-center gap-2 text-[#5A625B] font-bold">
                    <Sun className="w-4 h-4 text-[#7A837C]" />
                    <span>ፈረቃ</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-xs text-[#1D211E] block">
                      {selectedOrderForView.shift}
                    </span>
                    <span className="text-[11px] font-semibold text-[#7D847E] block mt-0.5">
                      {selectedOrderForView.channel}
                    </span>
                  </div>
                </div>

                {/* 3. Service / Order Type */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-[#5A625B] font-bold">
                    <ShoppingBag className="w-4 h-4 text-[#7A837C]" />
                    <span>አገልግሎት</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-xs text-[#1C201D]">
                      {selectedOrderForView.orderType === 'Home' ? 'ቤት ውስጥ  Home (300 ETB)' : 'ቴክአዌይ  Takeaway'}
                    </span>
                  </div>
                </div>

                {/* 4. Waiter */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-[#5A625B] font-bold">
                    <User className="w-4 h-4 text-[#7A837C]" />
                    <span>የወሰደው አስተናጋጅ</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-xs text-[#1D211E]">
                      {formatWaiterDisplayName(selectedOrderForView.waiterName)}
                    </span>
                  </div>
                </div>

                {/* 5. Boxes count */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-[#5A625B] font-bold">
                    <Box className="w-4 h-4 text-[#7A837C]" />
                    <span>የወጣ ቦክስ</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-xs text-[#1D211E]">
                      {selectedOrderForView.orderType === 'Home' 
                        ? '0  Takeaway Box' 
                        : `${selectedOrderForView.boxesCount}  Takeaway Box`}
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* Action Buttons: Print & Close */}
            <div className="grid grid-cols-2 gap-3 w-full mt-6">
              <button
                type="button"
                onClick={() => window.print()}
                className="bg-slate-800 hover:bg-slate-900 text-white rounded-2xl py-3.5 px-4 font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>ቲኬቱን አትም (Print)</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedOrderForView(null)}
                className="bg-[#107049] hover:bg-[#0D5B3B] text-white rounded-2xl py-3.5 px-4 font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
              >
                <span>ዝጋ (Close)</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* BOX INVENTORY CONFIGURATION MODAL                               */}
      {/* ============================================================== */}
      {showBoxStockModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600" />
                <span>የሳጥን መነሻ ክምችት (Box Inventory)</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowBoxStockModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 font-bold">
              በሲስተሙ ውስጥ ያለውን አጠቃላይ የመነሻ ሳጥን ብዛት እዚህ ያስገቡ (ለምሳሌ፡ 500 ወይም 1000 ሳጥን)። ሲስተሙ የወጡትን ሳጥኖች በቀጥታ ቀንሶ ቀሪውን ያሳየዎታል።
            </p>

            <form onSubmit={handleSaveBoxInventory} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  የመነሻ ሳጥን ብዛት (Total Initial Boxes):
                </label>
                <input
                  type="number"
                  min="0"
                  value={boxStockInput}
                  onChange={(e) => setBoxStockInput(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-emerald-200 focus:border-emerald-500 rounded-2xl py-3 px-4 font-black text-lg text-slate-900 outline-none"
                  placeholder="500"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBoxStockModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-black text-slate-500 hover:bg-slate-100"
                >
                  ተመለስ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md"
                >
                  አስቀምጥ (Save)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUBMISSION SUCCESS CONFIRMATION RECEIPT (EXACT MATCH TO DESIGN) */}
      {/* ============================================================== */}
      {orderSuccessModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#F8F6F0] flex flex-col items-center justify-center p-4 sm:p-6 min-h-screen animate-in fade-in duration-200">
          
          {/* Subtle Dot Matrix Background Texture */}
          <div 
            className="fixed inset-0 opacity-40 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(#C8BFAD 1.5px, transparent 1.5px)',
              backgroundSize: '20px 20px'
            }}
          />

          <div className="relative z-10 w-full flex flex-col items-center max-w-sm sm:max-w-md my-auto py-6">
            
            {/* Top Glowing Checkmark Badge */}
            <div className="relative inline-flex items-center justify-center mb-1">
              <div className="w-20 h-20 rounded-full bg-[#D4EFE2] flex items-center justify-center shadow-inner">
                <div className="w-14 h-14 rounded-full bg-[#107049] flex items-center justify-center text-white shadow-md">
                  <Check className="w-8 h-8 stroke-[3.5] text-white" />
                </div>
              </div>
            </div>

            {/* Header Titles */}
            <h2 className="text-2xl sm:text-3xl font-black text-[#1C201D] tracking-tight text-center mt-3">
              ትዕዛዙ ተመዝግቧል!
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-[#666E67] text-center mt-1 tracking-wide">
              Order sent & successfully logged
            </p>

            {/* Auto-Return Countdown Progress Indicator */}
            <div className="mt-3 flex flex-col items-center gap-1.5 w-full max-w-xs animate-in fade-in">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#E2F4EB] text-[#126848] text-[11px] font-black">
                <span className="w-2 h-2 rounded-full bg-[#126848] animate-ping" />
                <span>ወደ ምግብ መምረጫው በራስ-ሰር በመመለስ ላይ...</span>
              </div>
              <div className="w-full h-1.5 bg-[#E8E2D5] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-[#107049] rounded-full"
                  style={{
                    animation: 'marakiAutoProgress 2.5s linear forwards'
                  }}
                />
              </div>
            </div>

            {/* Ticket Card */}
            <div className="w-full bg-white rounded-[32px] shadow-sm border border-[#E9E4D6] overflow-hidden text-left mt-6">
              
              {/* Food Items List */}
              <div className="p-5 sm:p-6 space-y-3">
                {orderSuccessModal.items?.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3.5 pb-2.5 border-b border-[#F2EEE4] last:border-b-0 last:pb-0">
                    <span className="bg-[#E2F4EB] text-[#126848] font-black text-xs px-2.5 py-1 rounded-xl flex-shrink-0">
                      {item.qty}×
                    </span>
                    <span className="font-black text-sm sm:text-base text-[#1C201D] tracking-tight">
                      {item.name}
                    </span>
                  </div>
                ))}

                {/* Total Price Box */}
                <div className="bg-[#EBF6F0] rounded-2xl p-4 flex items-center justify-between mt-3">
                  <span className="font-black text-sm text-[#1C201D]">ድምር ዋጋ</span>
                  <div className="flex items-baseline">
                    <span className="text-3xl font-black text-[#1C201D] tracking-tight">
                      {orderSuccessModal.totalAmount?.toLocaleString()}
                    </span>
                    <span className="text-xs font-black text-[#107049] ml-1.5">
                      ETB
                    </span>
                  </div>
                </div>
              </div>

              {/* Dashed Tear Line with Circular Notches */}
              <div className="relative py-1 bg-white">
                <div className="border-t-2 border-dashed border-[#DDD7C8] w-full" />
                <div className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#F8F6F0] border-r border-[#DDD7C8]" />
                <div className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#F8F6F0] border-l border-[#DDD7C8]" />
              </div>

              {/* Metadata Details Rows */}
              <div className="p-5 sm:p-6 space-y-4 bg-white">
                
                {/* 1. Date */}
                <div className="flex items-start justify-between text-xs">
                  <div className="flex items-center gap-2 text-[#5A625B] font-bold">
                    <Calendar className="w-4 h-4 text-[#7A837C]" />
                    <span>ቀን</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-xs text-[#1D211E] block">
                      {orderSuccessModal.ethiopianDate}
                    </span>
                    <span className="text-[11px] font-semibold text-[#7D847E] block mt-0.5">
                      {orderSuccessModal.gregorianDateFormatted || getFormattedGregorianDate()}
                    </span>
                  </div>
                </div>

                {/* 2. Shift */}
                <div className="flex items-start justify-between text-xs">
                  <div className="flex items-center gap-2 text-[#5A625B] font-bold">
                    <Sun className="w-4 h-4 text-[#7A837C]" />
                    <span>ፈረቃ</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-xs text-[#1D211E] block">
                      {orderSuccessModal.shift}
                    </span>
                    <span className="text-[11px] font-semibold text-[#7D847E] block mt-0.5">
                      {orderSuccessModal.channel}
                    </span>
                  </div>
                </div>

                {/* 3. Service / Order Type */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-[#5A625B] font-bold">
                    <ShoppingBag className="w-4 h-4 text-[#7A837C]" />
                    <span>አገልግሎት</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-xs text-[#1C201D]">
                      {orderSuccessModal.orderType === 'Home' ? 'ቤት ውስጥ  Home' : 'ቴክአዌይ  Takeaway'}
                    </span>
                  </div>
                </div>

                {/* 4. Waiter */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-[#5A625B] font-bold">
                    <User className="w-4 h-4 text-[#7A837C]" />
                    <span>የወሰደው</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-xs text-[#1D211E]">
                      {formatWaiterDisplayName(orderSuccessModal.waiterName)}
                    </span>
                  </div>
                </div>

                {/* 5. Boxes count */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-[#5A625B] font-bold">
                    <Box className="w-4 h-4 text-[#7A837C]" />
                    <span>የወጣ ቦክስ</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-xs text-[#1D211E]">
                      {orderSuccessModal.orderType === 'Home' 
                        ? '0  Takeaway Box' 
                        : `${orderSuccessModal.boxesCount}  Takeaway Box`}
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom Next Order / Back to Menu Button */}
            <button
              type="button"
              onClick={() => {
                setOrderSuccessModal(null);
                clearCurrentOrder();
              }}
              className="w-full bg-[#107049] hover:bg-[#0D5B3B] active:scale-[0.98] transition-all text-white rounded-3xl py-4 px-6 flex items-center justify-center gap-3.5 shadow-xl shadow-[#107049]/25 mt-6 select-none"
            >
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <ArrowLeft className="w-5 h-5 text-white stroke-[3]" />
              </div>
              <div className="text-left">
                <span className="font-black text-sm sm:text-base text-white block leading-tight">
                  ወደ ምግብ መምረጫው ተመለስ
                </span>
                <span className="text-[11px] font-semibold text-white/80 block mt-0.5">
                  Back to Food Menu (or auto-returns in 2.5s)
                </span>
              </div>
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
                  <h3 className="font-black text-sm text-slate-900">
                    {editingDateTarget === 'filter' 
                      ? '📅 ከቀን መቁጠሪያ ትዕዛዝ ፈልግ (Filter Orders by Date)' 
                      : 'የኢትዮጵያ ቀን መምረጫ'}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-bold block">
                    {editingDateTarget === 'filter' 
                      ? 'Pick any day from Ethiopian calendar to view all orders' 
                      : 'Ethiopian Calendar Date'}
                  </span>
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
                {editingDateTarget === 'filter' ? '🔍 ትዕዛዞቹን አሳይ (Show Orders)' : '✓ አጽድቅ (Save Date)'}
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
          <div className="bg-white rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-emerald-500 space-y-4">
            
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

              {systemMode === 'owner' && (
                <div className="pt-2 border-t border-slate-100 space-y-2.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">
                    👤 Default Shift Waiters (Owner Authority)
                  </span>
                  <div>
                    <label className="block text-[11px] font-black text-slate-700 mb-1">
                      ☀️ Day Shift Waiter:
                    </label>
                    <input
                      type="text"
                      value={dayShiftWaiterInput}
                      onChange={(e) => setDayShiftWaiterInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-2xl px-3.5 py-2 text-xs font-bold text-slate-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-700 mb-1">
                      🌙 Night Shift Waiter:
                    </label>
                    <input
                      type="text"
                      value={nightShiftWaiterInput}
                      onChange={(e) => setNightShiftWaiterInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-2xl px-3.5 py-2 text-xs font-bold text-slate-900 outline-none"
                    />
                  </div>
                </div>
              )}

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

            {systemMode === 'owner' && (
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowSettingsModal(false);
                    setOwnerSection('menu');
                  }}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-sm"
                >
                  <Tag className="w-4 h-4 text-emerald-400" />
                  <span>Open Menu & Juice Price Control →</span>
                </button>

                {/* Danger Zone: Owner-Authorized Clear All Data */}
                <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-3 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-black text-rose-800 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Clear All Business Data</span>
                      </span>
                      <span className="text-[10px] text-rose-600 font-bold block">
                        Wipes all orders, shifts, boxes, expenses & debts
                      </span>
                    </div>
                    {!showClearConfirm && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowClearConfirm(true);
                          setClearConfirmPass('');
                          setClearConfirmError('');
                        }}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[11px] font-black flex items-center gap-1 shadow-xs shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Clear All</span>
                      </button>
                    )}
                  </div>

                  {showClearConfirm && (
                    <div className="space-y-2 pt-1 border-t border-rose-200/80">
                      <label className="flex items-center gap-2 text-[11px] font-bold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={clearIncludeSettings}
                          onChange={(e) => setClearIncludeSettings(e.target.checked)}
                          className="rounded text-rose-600"
                        />
                        <span>Also reset Menu Prices & Shift Waiters to defaults</span>
                      </label>
                      <input
                        type="password"
                        value={clearConfirmPass}
                        onChange={(e) => {
                          setClearConfirmPass(e.target.value);
                          setClearConfirmError('');
                        }}
                        placeholder="Enter Owner Password to confirm wipe..."
                        className="w-full bg-white border border-rose-300 focus:border-rose-500 rounded-xl px-3 py-2 text-xs font-black text-slate-900 outline-none"
                      />
                      {clearConfirmError && (
                        <p className="text-[11px] font-black text-rose-700">{clearConfirmError}</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowClearConfirm(false);
                            setClearConfirmPass('');
                            setClearConfirmError('');
                          }}
                          className="flex-1 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-[11px] font-black"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (clearConfirmPass.trim() !== ownerPassword) {
                              setClearConfirmError('Incorrect Owner Password.');
                              return;
                            }
                            clearAllBusinessData({ includeSettings: clearIncludeSettings });
                            window.location.reload();
                          }}
                          className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[11px] font-black shadow-xs"
                        >
                          Confirm Clear All Data
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
