import React, { useState, useEffect, useRef, useDeferredValue, useTransition, useMemo, useCallback } from 'react';
import BusinessManagement from './components/BusinessManagement';
import ShiftReconciliation from './components/ShiftReconciliation';
import OwnerIncomeAnalysisReport from './components/OwnerIncomeAnalysisReport';
import OwnerDashboard from './components/OwnerDashboard';
import BoxInventoryAudit from './components/BoxInventoryAudit';
import OwnerMenuPriceManager from './components/OwnerMenuPriceManager';
import { computePackagingAudit, getShiftDefaultWaiters, saveShiftDefaultWaiters, clearAllBusinessData } from './utils/reconciliationHelpers';
import {
  isFoodItemForBeu,
  computeBeuPrice,
  toBeuMenuItem,
  formatEtb,
  getOrderBeuMetrics,
  roundPricePrecision
} from './utils/beuHelpers';
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
  Tag,
  Crown,
  CupSoda,
  Salad,
  Sandwich,
  Egg,
  Utensils,
  Home,
  Globe,
  LayoutGrid,
  Delete,
  Flame,
  ChevronRight
} from 'lucide-react';
import { dbService, isSupabaseConfigured, setApplyingRemoteSync } from './lib/supabaseClient';
import { TRANSLATIONS } from './utils/i18n';

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
 * Calculates effective price based on order type & channel:
 * - In BEU Delivery mode: strictly 85% of current red/final selling price (15% BEU deduction).
 *   Never applies Home 300 discount on top and never uses crossed-out originalPrice.
 * - If Home (ቤት ውስጥ) and current final price is 320 ETB, decreases to 300 ETB.
 * - All other prices use current red/final selling price (`price`).
 */
export function getDishEffectivePrice(dishOrItem, currentOrderType = 'Takeaway') {
  if (!dishOrItem) return 0;
  if (dishOrItem.isBeuItem) {
    return dishOrItem.normalFinalPrice !== undefined
      ? computeBeuPrice(dishOrItem.normalFinalPrice)
      : roundPricePrecision(dishOrItem.price || 0);
  }
  const finalSellingPrice = Number(dishOrItem.price ?? 0);
  if (currentOrderType === 'Home') {
    if (dishOrItem.homePrice !== undefined && dishOrItem.homePrice !== null && dishOrItem.homePrice !== '') {
      return Number(dishOrItem.homePrice);
    }
    if (finalSellingPrice === 320) {
      return 300;
    }
  }
  return finalSellingPrice;
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
  // Theme (Light / Dark) & Language (Amharic / English)
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('maraki_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });
  const themeManuallySetRef = useRef(false);
  const handleToggleTheme = useCallback(() => {
    themeManuallySetRef.current = true;
    localStorage.setItem('maraki_theme_manual', '1');
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('maraki_language');
    return saved === 'en' ? 'en' : 'am';
  });
  const [chefViewTab, setChefViewTab] = useState('menu'); // 'menu' | 'today'
  const [checkoutModalStep, setCheckoutModalStep] = useState(0); // 0 = closed, 1 = service, 2 = shift, 3 = waiter
  const orderPanelRef = useRef(null);

  const t = TRANSLATIONS[language] || TRANSLATIONS.am;

  useEffect(() => {
    const isDark = theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
    const meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) meta.setAttribute('content', isDark ? 'dark' : 'light');
    localStorage.setItem('maraki_theme', theme);
    dbService.saveAppState('maraki_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('maraki_language', language);
    dbService.saveAppState('maraki_language', language);
  }, [language]);

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

  // Every portal requires fresh PIN/Password on every entry or reload (in-memory only)
  const [isChefAuth, setIsChefAuth] = useState(false);
  const [isOwnerAuth, setIsOwnerAuth] = useState(false);
  const [isReconciliationAuth, setIsReconciliationAuth] = useState(false);

  const [ownerPassword, setOwnerPassword] = useState(() => {
    return localStorage.getItem('maraki_owner_password') || '1234';
  });
  const [chefPin, setChefPin] = useState(() => {
    return localStorage.getItem('maraki_chef_pin') || '0000';
  });
  const [reconciliationPin, setReconciliationPin] = useState(() => {
    return localStorage.getItem('maraki_reconciliation_pin') || '1111';
  });

  // Clean up any legacy persistent portal unlock flags on startup
  useEffect(() => {
    localStorage.removeItem('maraki_chef_authenticated');
    localStorage.removeItem('maraki_owner_authenticated');
    localStorage.removeItem('maraki_is_authenticated');
    localStorage.removeItem('maraki_auth_role');
  }, []);

  // Dedicated PIN/Password Entry States
  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState(null);
  const [showPasswordText, setShowPasswordText] = useState(false);

  // Password & Shift Waiter Settings Modal (Managed by Owner)
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [newOwnerPassInput, setNewOwnerPassInput] = useState('');
  const [newChefPinInput, setNewChefPinInput] = useState('');
  const [newReconciliationPinInput, setNewReconciliationPinInput] = useState('');
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

  /**
   * BEU food menu derived dynamically from foodMenu (food-only, 85% of final price).
   * Used silently behind the scenes when taker is BEU Delivery; never duplicates products.
   */
  const beuFoodMenu = useMemo(() => {
    return foodMenu.filter(isFoodItemForBeu).map(toBeuMenuItem);
  }, [foodMenu]);
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
      if (e.key === 'maraki_chef_food_menu_v2' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setFoodMenu(parsed);
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
    dbService.saveAppState('maraki_standard_juice_price', standardJuicePrice);
  }, [standardJuicePrice]);

  useEffect(() => {
    localStorage.setItem('maraki_waiters_list_v3', JSON.stringify(waitersList));
    dbService.saveAppState('maraki_waiters_list_v3', waitersList);
  }, [waitersList]);

  useEffect(() => {
    localStorage.setItem('maraki_waste_boxes', wasteBoxes.toString());
    dbService.saveAppState('maraki_waste_boxes', wasteBoxes);
  }, [wasteBoxes]);

  const recentSubmittedOrderTimesRef = useRef(new Map());

  // Fetch all latest data (app_state, menu_items, orders, expenses, adari) from Supabase
  const syncFromSupabase = useCallback(async () => {
    if (!isSupabaseConfigured) return null;
    const [remoteState, remoteMenu, remoteOrders, remoteExpenses, remoteAdari] = await Promise.all([
      dbService.fetchAllAppState(),
      dbService.fetchMenuItems(),
      dbService.fetchOrders(),
      dbService.fetchExpenses(),
      dbService.fetchAdari()
    ]);

    setApplyingRemoteSync(true);
    try {
      if (remoteState && typeof remoteState === 'object') {
        Object.entries(remoteState).forEach(([key, val]) => {
          if (val === undefined) return;
          if (key === 'maraki_theme' && (themeManuallySetRef.current || localStorage.getItem('maraki_theme'))) {
            return;
          }
          const serialized = typeof val === 'string' ? val : JSON.stringify(val);
          localStorage.setItem(key, serialized);
        });

        if (Array.isArray(remoteState.maraki_shift_settlements)) {
          setSettlementsHistory(remoteState.maraki_shift_settlements);
        }
        if (Array.isArray(remoteState.maraki_waiters_list_v3)) {
          setWaitersList(remoteState.maraki_waiters_list_v3);
        }
        if (Number(remoteState.maraki_standard_juice_price) > 0) {
          setStandardJuicePrice(Number(remoteState.maraki_standard_juice_price));
        }
        if (remoteState.maraki_waste_boxes !== undefined) {
          setWasteBoxes(Number(remoteState.maraki_waste_boxes) || 0);
        }
        if (remoteState.maraki_box_starting_stock !== undefined) {
          setBoxInventoryInitial(Number(remoteState.maraki_box_starting_stock) || 0);
        }
        if (typeof remoteState.maraki_owner_password === 'string' && remoteState.maraki_owner_password) {
          setOwnerPassword(remoteState.maraki_owner_password);
        }
        if (typeof remoteState.maraki_chef_pin === 'string' && remoteState.maraki_chef_pin) {
          setChefPin(remoteState.maraki_chef_pin);
        }
        if (typeof remoteState.maraki_reconciliation_pin === 'string' && remoteState.maraki_reconciliation_pin) {
          setReconciliationPin(remoteState.maraki_reconciliation_pin);
        }
        if (
          !themeManuallySetRef.current &&
          !localStorage.getItem('maraki_theme_manual') &&
          (remoteState.maraki_theme === 'dark' || remoteState.maraki_theme === 'light')
        ) {
          setTheme(remoteState.maraki_theme);
        }
        if (remoteState.maraki_language === 'en' || remoteState.maraki_language === 'am') {
          setLanguage(remoteState.maraki_language);
        }
      }

      if ((!remoteState || !remoteState.maraki_actual_expenses) && Array.isArray(remoteExpenses) && remoteExpenses.length > 0) {
        localStorage.setItem('maraki_actual_expenses', JSON.stringify(remoteExpenses));
      }

      if (Array.isArray(remoteAdari) && remoteAdari.length > 0 && (!remoteState || !Array.isArray(remoteState.maraki_waiter_pending_debts))) {
        const mappedDebts = remoteAdari.map(row =>
          row.items && typeof row.items === 'object' && !Array.isArray(row.items)
            ? { ...row.items, status: row.status === 'paid' ? 'completed' : (row.items.status || 'pending') }
            : {
                id: row.id,
                waiterName: row.customer_name,
                totalAmount: Number(row.amount) || 0,
                remainingAmount: row.status === 'paid' ? 0 : Number(row.amount) || 0,
                totalUnits: Number(row.amount) || 0,
                remainingUnits: row.status === 'paid' ? 0 : Number(row.amount) || 0,
                unitPrice: 1,
                status: row.status === 'paid' ? 'completed' : 'pending',
                createdAt: row.created_at
              }
        );
        localStorage.setItem('maraki_waiter_pending_debts', JSON.stringify(mappedDebts));
      }

      if (Array.isArray(remoteMenu) && remoteMenu.length > 0) {
        setFoodMenu(prev => {
          const prevById = new Map(prev.map(i => [i.id, i]));
          return remoteMenu.map(item => {
            const existing = prevById.get(item.id);
            return existing
              ? {
                  ...existing,
                  ...item,
                  homePrice: item.homePrice ?? existing.homePrice ?? null,
                  originalPrice: item.originalPrice ?? existing.originalPrice ?? null
                }
              : item;
          });
        });
      }

      if (Array.isArray(remoteOrders)) {
        const now = Date.now();
        setSentOrders(prev => {
          const merged = new Map();
          remoteOrders.forEach(o => merged.set(o.id, o));
          // Only retain local orders submitted in the last 15s while their DB write settles
          prev.forEach(o => {
            const submittedAt = recentSubmittedOrderTimesRef.current.get(o.id);
            if (!merged.has(o.id) && submittedAt && now - submittedAt < 15000) {
              merged.set(o.id, o);
            }
          });
          return Array.from(merged.values()).sort(
            (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
          );
        });
      }

      window.dispatchEvent(new CustomEvent('maraki-supabase-synced'));
      return remoteOrders || null;
    } finally {
      setTimeout(() => setApplyingRemoteSync(false), 100);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;
    syncFromSupabase();

    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        syncFromSupabase();
      }
    }, 20000);

    const handleFocusOrVisible = () => {
      if (document.visibilityState === 'visible') {
        syncFromSupabase();
      }
    };

    window.addEventListener('focus', handleFocusOrVisible);
    document.addEventListener('visibilitychange', handleFocusOrVisible);
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocusOrVisible);
      document.removeEventListener('visibilitychange', handleFocusOrVisible);
    };
  }, [syncFromSupabase, systemMode]);

  const handleUpdateMenu = (updatedMenu) => {
    dbService.syncMenuItems(updatedMenu, foodMenu);
    setFoodMenu(updatedMenu);
  };

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
    setCheckoutModalStep(0);
    setOrderType('Takeaway');
    setSelectedShiftType('Day');
    setActiveCategory('All');
    setBeuOrderId('');
    setCustomWaiterName('');
    setShowAddWaiterInput(false);
  };

  // Keep cart items synchronized whenever Owner edits foodMenu
  useEffect(() => {
    setCart(prev => {
      if (prev.length === 0) return prev;
      let changed = false;
      const updated = prev
        .map(cartItem => {
          const liveItem = foodMenu.find(f => f.id === cartItem.id);
          if (!liveItem || liveItem.isAvailable === false) {
            changed = true;
            return null;
          }
          if (cartItem.price !== liveItem.price || cartItem.homePrice !== liveItem.homePrice) {
            changed = true;
            return { ...liveItem, qty: cartItem.qty };
          }
          return cartItem;
        })
        .filter(Boolean);
      return changed ? updated : prev;
    });
  }, [foodMenu]);

  // Packaging & Amount Math for Chef UI (normal menu prices shown to chef)
  const totalSubtotal = roundPricePrecision(
    cart.reduce((sum, item) => {
      const effectivePrice = getDishEffectivePrice(item, orderType);
      return sum + effectivePrice * item.qty;
    }, 0)
  );

  const totalBoxesInOrder = orderType === 'Takeaway'
    ? cart.reduce((sum, item) => sum + item.qty, 0)
    : 0;

  // --- SUBMIT ORDER ---
  // Behind the scenes: if taker is BEU Driver or channel is BEU Delivery,
  // automatically apply BEU menu price (Current Final Price * 0.85, food items only)
  // and send full BEU + 15% deduction breakdown to the Owner without showing the process to the chef.
  const handleFinalSubmit = async () => {
    if (cart.length === 0) {
      showToast('⚠️ እባክዎ ቢያንስ አንድ ምግብ ይምረጡ (Please choose at least 1 food item)');
      setOrderStep(1);
      return;
    }

    const effectiveWaiter = customWaiterName.trim() || selectedWaiter;
    const isBeuTaker = /beu|ቢዩ/i.test(effectiveWaiter);
    const isBeu = selectedShiftType === 'BEU' || isBeuTaker;
    const finalOrderType = isBeu ? 'Takeaway' : orderType;
    const shiftLabel = selectedShiftType === 'Night' ? 'Night Shift' : 'Day Shift';
    const channelLabel = isBeu
      ? 'BEU Delivery'
      : (finalOrderType === 'Home' ? 'In-Store Home' : 'In-Store Takeaway');
    const finalPayment = isBeu ? 'BEU Account' : 'Kitchen Dispatch';

    // Chef receipt display items (keeps normal menu pricing on the chef confirmation view)
    const chefDisplayItems = cart.map(i => {
      const liveItem = foodMenu.find(f => f.id === i.id) || i;
      const chefUnitPrice = getDishEffectivePrice(liveItem, finalOrderType);
      return {
        id: i.id,
        name: i.name,
        englishName: i.englishName,
        qty: i.qty,
        price: chefUnitPrice
      };
    });
    const chefDisplayTotal = roundPricePrecision(
      chefDisplayItems.reduce((sum, i) => sum + i.price * i.qty, 0)
    );

    // Owner order items: when BEU Delivery/Driver is chosen, automatically pull from live beuFoodMenu
    // (food items only, 85% of current red/final selling price; non-food drinks never receive BEU food pricing).
    const frozenItems = cart.map(i => {
      const liveItem = foodMenu.find(f => f.id === i.id) || i;
      const beuEntry = isBeu && isFoodItemForBeu(liveItem)
        ? (beuFoodMenu.find(b => b.id === i.id) || toBeuMenuItem(liveItem))
        : null;
      const normalFinalPrice = Number(liveItem.price ?? i.price ?? 0);
      const soldUnitPrice = beuEntry
        ? beuEntry.price
        : getDishEffectivePrice(liveItem, finalOrderType);
      const itemBeuApplied = Boolean(beuEntry);
      return {
        id: i.id,
        name: i.name,
        englishName: i.englishName,
        qty: i.qty,
        price: soldUnitPrice,
        normalPrice: itemBeuApplied ? beuEntry.normalFinalPrice : soldUnitPrice,
        beuDeductionPerUnit: itemBeuApplied ? beuEntry.beuDeduction : 0,
        beuDeductionPct: itemBeuApplied ? 15 : 0,
        basePrice: normalFinalPrice,
        homePrice: liveItem.homePrice ?? null,
        isBeuItem: itemBeuApplied
      };
    });

    const hasBeuFood = frozenItems.some(i => i.isBeuItem);
    const frozenNormalSubtotal = roundPricePrecision(
      frozenItems.reduce((sum, i) => sum + i.normalPrice * i.qty, 0)
    );
    const frozenTotalAmount = roundPricePrecision(
      frozenItems.reduce((sum, i) => sum + i.price * i.qty, 0)
    );
    const frozenDeductionAmount = isBeu && hasBeuFood
      ? Math.max(0, roundPricePrecision(frozenNormalSubtotal - frozenTotalAmount))
      : 0;
    const frozenBoxesCount = finalOrderType === 'Takeaway'
      ? frozenItems.reduce((sum, i) => sum + i.qty, 0)
      : 0;

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
      totalAmount: frozenTotalAmount,
      boxesCount: frozenBoxesCount,
      // BEU Delivery metadata — stored for historical accuracy & Owner reporting
      isBeuOrder: isBeu,
      beuDeductionPct: isBeu && hasBeuFood ? 15 : 0,
      normalSubtotal: frozenNormalSubtotal,
      beuDeductionAmount: frozenDeductionAmount,
      items: frozenItems,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString()
    };

    // 1. OPTIMISTIC UI: Save Owner BEU order & show Chef her clean normal receipt confirmation
    recentSubmittedOrderTimesRef.current.set(orderData.id, Date.now());
    setSentOrders(prev => [orderData, ...prev]);
    setOrderSuccessModal({
      ...orderData,
      items: chefDisplayItems,
      totalAmount: chefDisplayTotal,
      foodSummary: chefDisplayItems.map(i => `${i.qty}x ${i.name}`).join(', ')
    });
    clearCurrentOrder();

    // 2. BACKGROUND RECONCILIATION: Sync with cloud asynchronously without blocking the chef
    dbService.saveOrder({
      ...orderData,
      staffName: 'Chef Almaz',
      cupsCount: 0,
      boxesUsed: frozenBoxesCount
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
      dbService.updateOrder(editingDateTarget, { ethiopianDate: formatted });
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
  const lockAllPortals = () => {
    setIsChefAuth(false);
    setIsOwnerAuth(false);
    setIsReconciliationAuth(false);
    setPinInput('');
    setLoginError(null);
    setShowPasswordText(false);
    localStorage.removeItem('maraki_chef_authenticated');
    localStorage.removeItem('maraki_owner_authenticated');
    localStorage.removeItem('maraki_is_authenticated');
    localStorage.removeItem('maraki_auth_role');
  };

  const navigateToSystem = (mode) => {
    lockAllPortals();
    setSystemMode(mode);
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
      lockAllPortals();
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

  const handlePortalLoginSubmit = (e, portalKey) => {
    if (e) e.preventDefault();
    const entered = pinInput.trim();
    if (portalKey === 'chef') {
      if (entered === chefPin) {
        setIsChefAuth(true);
        setPinInput('');
        setLoginError(null);
        showToast('👩‍🍳 እንደ ሼፍ ገብተዋል (Welcome to Chef Station)');
      } else {
        setLoginError('❌ የተሳሳተ የኩሽና ፒን ነው፤ እባክዎ እንደገና ይሞክሩ');
      }
    } else if (portalKey === 'owner') {
      if (entered === ownerPassword) {
        setIsOwnerAuth(true);
        setPinInput('');
        setLoginError(null);
        showToast('👑 የባለቤት መቆጣጠሪያ ማዕከል ተከፍቷል (Welcome to Owner Center)');
      } else {
        setLoginError('❌ የተሳሳተ የባለቤት ይለፍ ቃል ነው፤ እባክዎ እንደገና ይሞክሩ');
      }
    } else if (portalKey === 'reconciliation') {
      if (entered === reconciliationPin || entered === ownerPassword) {
        setIsReconciliationAuth(true);
        setPinInput('');
        setLoginError(null);
        showToast('📋 የፈረቃ ገቢ ማስታረቂያ ተከፍቷል (Shift Audit Unlocked)');
      } else {
        setLoginError('❌ የተሳሳተ የፈረቃ ፒን ነው፤ እባክዎ እንደገና ይሞክሩ');
      }
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
    setPinInput('');
    setLoginError(null);
    showToast('🔒 የኩሽና ሲስተም ተቆልፏል (Chef Station Locked)');
  };

  const handleLockOwner = () => {
    setIsOwnerAuth(false);
    setPinInput('');
    setLoginError(null);
    showToast('🔒 የባለቤት ሲስተም ተቆልፏል (Owner Command Center Locked)');
  };

  const handleLockReconciliation = () => {
    setIsReconciliationAuth(false);
    setPinInput('');
    setLoginError(null);
    showToast('🔒 የፈረቃ ገቢ ማስታረቂያ ተቆልፏል (Shift Audit Locked)');
  };

  const handleSaveNewPasswords = (e) => {
    e.preventDefault();
    let updated = false;
    if (newOwnerPassInput.trim()) {
      setOwnerPassword(newOwnerPassInput.trim());
      localStorage.setItem('maraki_owner_password', newOwnerPassInput.trim());
      dbService.saveAppState('maraki_owner_password', newOwnerPassInput.trim());
      updated = true;
    }
    if (newChefPinInput.trim()) {
      setChefPin(newChefPinInput.trim());
      localStorage.setItem('maraki_chef_pin', newChefPinInput.trim());
      dbService.saveAppState('maraki_chef_pin', newChefPinInput.trim());
      updated = true;
    }
    if (newReconciliationPinInput.trim()) {
      setReconciliationPin(newReconciliationPinInput.trim());
      localStorage.setItem('maraki_reconciliation_pin', newReconciliationPinInput.trim());
      dbService.saveAppState('maraki_reconciliation_pin', newReconciliationPinInput.trim());
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
      setNewReconciliationPinInput('');
      setShowSettingsModal(false);
      showToast('✅ አዲስ የይለፍ ቃሎች ተመዝግበዋል (Passwords updated)');
    } else {
      showToast('ምንም ለውጥ አልተደረገም');
      setShowSettingsModal(false);
    }
  };

  // Filtered dishes for Step 1 (Normal Menu shown to Chef; BEU 15% pricing calculated automatically on submit)
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

  const dayRevenue = roundPricePrecision(dayOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0));
  const nightRevenue = roundPricePrecision(nightOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0));
  const beuRevenue = roundPricePrecision(beuOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0));
  const beuNormalRevenue = roundPricePrecision(beuOrders.reduce((sum, o) => sum + getOrderBeuMetrics(o).normalSubtotal, 0));
  const beuDeductionTotal = roundPricePrecision(beuOrders.reduce((sum, o) => sum + getOrderBeuMetrics(o).deductionAmount, 0));
  const homeRevenue = roundPricePrecision(homeOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0));
  const totalRevenueAll = roundPricePrecision(dateFilteredOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0));

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
      dbService.deleteOrder(orderId);
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
        dbService.updateOrder(orderId, { status: nextStatus });
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
      'Normal Menu Value (ETB)',
      'BEU 15% Deduction (ETB)',
      'Total Amount (ETB)',
      'Status'
    ];
    const rows = dateFilteredOrders.map(o => {
      const bm = getOrderBeuMetrics(o);
      return [
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
        bm.normalSubtotal,
        bm.deductionAmount,
        o.totalAmount || 0,
        `"${o.status || 'ተዘጋጅቶ ተወስዷል (Cooked & Taken)'}"`
      ];
    });

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
      dbService.saveAppState('maraki_box_starting_stock', val);
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
        dbService.deleteOrdersByDate(orderEthDate.formatted);
        showToast('የዕለቱ ትዕዛዞች ተሰርዘዋል / አዲስ ቀን ተጀምሯል!');
      } else if (pass !== null) {
        alert('የተሳሳተ የይለፍ ቃል! (Incorrect Password)');
      }
    }
  };

  // ==============================================================
  // 1. SYSTEM GATEWAY: PORTAL SELECTOR (CHEF vs OWNER vs RECONCILIATION)
  // ==============================================================
  if (systemMode === 'portal') {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-emerald-500 selection:text-white transition-colors ${
        theme === 'dark'
          ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white'
          : 'bg-gradient-to-br from-slate-50 via-emerald-50/60 to-slate-100 text-slate-900'
      }`}>
        {/* Top Utility Bar (Language & Theme) */}
        <div className="w-full max-w-5xl flex items-center justify-end gap-2 mb-6">
          <button
            type="button"
            onClick={() => setLanguage(prev => prev === 'en' ? 'am' : 'en')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
              theme === 'dark'
                ? 'bg-white/10 hover:bg-white/15 border-white/15 text-slate-200'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-sm'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-500" />
            <span>{language === 'en' ? 'EN / አማ' : 'አማ / EN'}</span>
          </button>

          <button
            type="button"
            onClick={handleToggleTheme}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
              theme === 'dark'
                ? 'bg-white/10 hover:bg-white/15 border-white/15 text-slate-200'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-sm'
            }`}
            title={theme === 'dark' ? t.lightMode : t.darkMode}
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
            <span>{theme === 'dark' ? t.lightMode : t.darkMode}</span>
          </button>
        </div>

        {/* Branding & Welcome */}
        <div className="text-center max-w-md mx-auto space-y-2 mb-8 animate-in fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-xl shadow-emerald-600/25 mb-2">
            <UtensilsCrossed className="w-8 h-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">MARAKI</h1>
          <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
            Juice & Salad Restaurant System
          </p>
          <div className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold mt-2 border ${
            theme === 'dark'
              ? 'bg-white/10 text-slate-300 border-white/10'
              : 'bg-white text-slate-600 border-slate-200 shadow-sm'
          }`}>
            <span>{t.chooseStation}</span>
          </div>
        </div>

        {/* Three Dedicated Portal Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 max-w-5xl w-full">
          
          {/* Portal 1: Chef Kitchen Station */}
          <div 
            onClick={() => navigateToSystem('chef')}
            className={`group backdrop-blur-xl border rounded-3xl p-6 sm:p-7 transition-all cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex flex-col justify-between space-y-5 ${
              theme === 'dark'
                ? 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/60'
                : 'bg-white border-slate-200 hover:border-emerald-400'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 flex items-center justify-center">
                  <ChefHat className="w-6 h-6" />
                </div>
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${
                  theme === 'dark' ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  <Lock className="w-3 h-3" />
                  <span>{t.pinRequired}</span>
                </span>
              </div>

              <div>
                <h2 className="text-xl font-black group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {t.kitchenStation}
                </h2>
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tracking-wide mt-0.5">
                  {t.kitchenSubtitle}
                </p>
                <p className={`text-xs font-medium mt-2 leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  {t.kitchenDesc}
                </p>
              </div>

              <div className={`pt-3 border-t space-y-1.5 text-xs font-semibold ${theme === 'dark' ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-700'}`}>
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" /> <span>{t.kitchenFeat1}</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" /> <span>{t.kitchenFeat2}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); navigateToSystem('chef'); }}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-2xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <span>{t.enterKitchen}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Portal 2: Owner Command Center */}
          <div 
            onClick={() => navigateToSystem('owner')}
            className={`group backdrop-blur-xl border rounded-3xl p-6 sm:p-7 transition-all cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex flex-col justify-between space-y-5 ${
              theme === 'dark'
                ? 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/60'
                : 'bg-white border-slate-200 hover:border-emerald-400'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 flex items-center justify-center">
                  <Crown className="w-6 h-6" />
                </div>
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${
                  theme === 'dark' ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  <Lock className="w-3 h-3" />
                  <span>{t.pinRequired}</span>
                </span>
              </div>

              <div>
                <h2 className="text-xl font-black group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {t.ownerCenter}
                </h2>
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tracking-wide mt-0.5">
                  {t.ownerSubtitle}
                </p>
                <p className={`text-xs font-medium mt-2 leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  {t.ownerDesc}
                </p>
              </div>

              <div className={`pt-3 border-t space-y-1.5 text-xs font-semibold ${theme === 'dark' ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-700'}`}>
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" /> <span>{t.ownerFeat1}</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" /> <span>{t.ownerFeat2}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); navigateToSystem('owner'); }}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-2xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <span>{t.enterOwner}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Portal 3: Shift Reconciliation & Waiter Cash Audit */}
          <div 
            onClick={() => navigateToSystem('reconciliation')}
            className={`group backdrop-blur-xl border rounded-3xl p-6 sm:p-7 transition-all cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex flex-col justify-between space-y-5 ${
              theme === 'dark'
                ? 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/60'
                : 'bg-white border-slate-200 hover:border-emerald-400'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 flex items-center justify-center">
                  <ClipboardCheck className="w-6 h-6" />
                </div>
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${
                  theme === 'dark' ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  <Lock className="w-3 h-3" />
                  <span>{t.pinRequired}</span>
                </span>
              </div>

              <div>
                <h2 className="text-xl font-black group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {t.shiftAudit}
                </h2>
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tracking-wide mt-0.5">
                  {t.shiftAuditSubtitle}
                </p>
                <p className={`text-xs font-medium mt-2 leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  {t.shiftAuditDesc}
                </p>
              </div>

              <div className={`pt-3 border-t space-y-1.5 text-xs font-semibold ${theme === 'dark' ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-700'}`}>
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" /> <span>{t.shiftFeat1}</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" /> <span>{t.shiftFeat2}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); navigateToSystem('reconciliation'); }}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-2xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <span>{t.enterShiftAudit}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Install App Link */}
        <div className="mt-8">
          <button
            type="button"
            onClick={handleInstallApp}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all border ${
              theme === 'dark'
                ? 'bg-white/10 hover:bg-white/15 text-white border-white/15'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-500" />
            <span>{t.installApp}</span>
          </button>
        </div>

      </div>
    );
  }

  // ==============================================================
  // 2. UNIFIED PORTAL PIN LOCK SCREEN (ALL PORTALS REQUIRE PIN EVERY ENTRY)
  // ==============================================================
  const portalLockConfig =
    systemMode === 'chef' && !isChefAuth
      ? {
          key: 'chef',
          badge: t.kitchenStation,
          IconComp: ChefHat,
          title: t.kitchenStation,
          subtitle: t.kitchenSubtitle,
          placeholder: 'PIN...',
          unlockLabel: t.unlockStation
        }
      : systemMode === 'owner' && !isOwnerAuth
      ? {
          key: 'owner',
          badge: t.ownerCenter,
          IconComp: Crown,
          title: t.ownerCenter,
          subtitle: t.ownerSubtitle,
          placeholder: 'Password...',
          unlockLabel: t.unlockStation
        }
      : (systemMode === 'reconciliation' || systemMode === 'shift') && !isReconciliationAuth
      ? {
          key: 'reconciliation',
          badge: t.shiftAudit,
          IconComp: ClipboardCheck,
          title: t.shiftAudit,
          subtitle: t.shiftAuditSubtitle,
          placeholder: 'PIN...',
          unlockLabel: t.unlockStation
        }
      : null;

  if (portalLockConfig) {
    const LockStationIcon = portalLockConfig.IconComp;
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors ${
        theme === 'dark'
          ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950'
          : 'bg-gradient-to-br from-slate-100 via-emerald-50 to-slate-200'
      }`}>
        <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => navigateToSystem('portal')}
              className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t.backToPortals}</span>
            </button>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleToggleTheme}
                className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 transition-all"
                title={theme === 'dark' ? t.lightMode : t.darkMode}
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
              </button>
              <span className="text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 px-2.5 py-0.5 rounded-full">
                {portalLockConfig.badge}
              </span>
            </div>
          </div>

          <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 flex items-center justify-center mx-auto shadow-inner">
            <LockStationIcon className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">{portalLockConfig.title}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{portalLockConfig.subtitle}</p>

          <form onSubmit={(e) => handlePortalLoginSubmit(e, portalLockConfig.key)} className="space-y-3">
            <div className="relative">
              <input
                type={showPasswordText ? 'text' : 'password'}
                placeholder={portalLockConfig.placeholder}
                value={pinInput}
                onChange={(e) => { setPinInput(e.target.value); setLoginError(null); }}
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-emerald-500 rounded-2xl py-3 pl-10 pr-10 text-center font-black text-lg text-slate-900 dark:text-white tracking-widest outline-none"
                autoFocus
              />
              <Key className="w-4 h-4 text-emerald-500 absolute left-3.5 top-3.5" />
              <button
                type="button"
                onClick={() => setShowPasswordText(!showPasswordText)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {loginError && (
              <p className="text-xs font-black text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 py-1.5 px-3 rounded-xl border border-rose-200 dark:border-rose-800">
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
                  className="py-3 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-black text-lg rounded-2xl border border-slate-200 dark:border-slate-700 transition-all active:scale-95"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleKeypadPress('clear')}
                className="py-3 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-black text-xs rounded-2xl border border-rose-200 dark:border-rose-900"
              >
                {t.clear}
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                className="py-3 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-black text-lg rounded-2xl border border-slate-200 dark:border-slate-700"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('backspace')}
                className="py-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-black text-sm rounded-2xl border border-emerald-200 dark:border-emerald-900 flex items-center justify-center"
              >
                <Delete className="w-4 h-4" />
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/25 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              <span>{portalLockConfig.unlockLabel}</span>
            </button>
          </form>

          <p className="text-[11px] font-bold text-slate-400 flex items-center justify-center gap-1.5 pt-1">
            <Lock className="w-3 h-3 text-emerald-500" />
            <span>{t.enterPinPrompt}</span>
          </p>
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
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onRefreshOrders={syncFromSupabase}
        onBackToPortal={() => navigateToSystem('portal')}
        onSwitchToChef={() => navigateToSystem('chef')}
        onSwitchToOwner={() => navigateToSystem('owner')}
        onLockReconciliation={handleLockReconciliation}
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans text-slate-800 dark:text-slate-100 antialiased selection:bg-emerald-600 selection:text-white transition-colors">
      
      {/* ============================================================== */}
      {/* CHEF KITCHEN POS NAVBAR (CLEAN PROFESSIONAL DESIGN)            */}
      {/* ============================================================== */}
      {systemMode === 'chef' && (() => {
        const todayOrdersCount = sentOrders.filter(o => o.ethiopianDate === orderEthDate.formatted).length;
        return (
          <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
              
              {/* Left: Brand Lockup */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 flex-shrink-0">
                  <ChefHat className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="font-black text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">MARAKI</h1>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 px-2 py-0.5 rounded-full">
                      {t.kitchenStation}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold truncate hidden sm:block">
                    {t.kitchenSubtitle}
                  </p>
                </div>
              </div>

              {/* Center: Workspace Tabs + Ethiopian Date */}
              <div className="flex items-center gap-2">
                <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setChefViewTab('menu')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all ${
                      chefViewTab === 'menu'
                        ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <UtensilsCrossed className="w-3.5 h-3.5" />
                    <span>{t.menuAndOrder}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChefViewTab('today')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all ${
                      chefViewTab === 'today'
                        ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>{t.todaysOrders}</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-600 text-white">
                      {todayOrdersCount}
                    </span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => openEthDateModal('current')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all"
                  title={t.changeDate}
                >
                  <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden sm:inline">{orderEthDate.formatted}</span>
                  <span className="text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded-md font-black">
                    {t.changeDate}
                  </span>
                </button>
              </div>

              {/* Right: Language, Theme & Logout */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setLanguage(prev => prev === 'en' ? 'am' : 'en')}
                  className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black flex items-center gap-1 border border-slate-200 dark:border-slate-700 transition-all"
                  title="Switch Language (English / አማርኛ)"
                >
                  <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{language === 'en' ? 'EN' : 'አማ'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleTheme}
                  className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 transition-all"
                  title={theme === 'dark' ? t.lightMode : t.darkMode}
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
                </button>

                <button
                  type="button"
                  onClick={() => navigateToSystem('portal')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all"
                  title={t.logout}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t.logout}</span>
                </button>
              </div>
            </div>

            {/* Mobile Sub-nav Tabs for Menu vs Today's Orders */}
            <div className="md:hidden border-t border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center gap-2 bg-slate-50 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setChefViewTab('menu')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                  chefViewTab === 'menu'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <UtensilsCrossed className="w-3.5 h-3.5" />
                <span>{t.menuAndOrder}</span>
              </button>
              <button
                type="button"
                onClick={() => setChefViewTab('today')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                  chefViewTab === 'today'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>{t.todaysOrders} ({todayOrdersCount})</span>
              </button>
            </div>
          </header>
        );
      })()}

      {/* ============================================================== */}
      {/* OWNER EXECUTIVE HEADER (MATCHING PROFESSIONAL DESIGN)          */}
      {/* ============================================================== */}
      {systemMode === 'owner' && (
        <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-900 dark:text-white sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
            
            {/* Logo & Brand */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 flex-shrink-0">
                <Crown className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="font-black text-base sm:text-lg tracking-tight">MARAKI</h1>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 px-2 py-0.5 rounded-full">
                    {t.ownerCenter}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold truncate hidden md:block">
                  {t.ownerExecSubtitle}
                </p>
              </div>
            </div>

            {/* Date Badge */}
            <button
              type="button"
              onClick={() => openEthDateModal('current')}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs transition-all"
              title={t.changeDate}
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{orderEthDate.formatted}</span>
              <span className="text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded-md font-black">
                {t.changeDate}
              </span>
            </button>

            {/* Owner Actions */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setOwnerSection('sheet')}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                title={t.dailySheet}
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.dailySheet}</span>
              </button>

              <button
                type="button"
                onClick={() => setOwnerSection('menu')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all border active:scale-95 ${
                  ownerSection === 'menu'
                    ? 'bg-amber-400 text-slate-950 border-amber-300'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-emerald-300 border-slate-200 dark:border-slate-700'
                }`}
                title={t.prices}
              >
                <Tag className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.prices}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setNewOwnerPassInput(ownerPassword);
                  setNewChefPinInput(chefPin);
                  setNewReconciliationPinInput(reconciliationPin);
                  const sw = getShiftDefaultWaiters();
                  setDayShiftWaiterInput(sw.Day);
                  setNightShiftWaiterInput(sw.Night);
                  setShowClearConfirm(false);
                  setClearConfirmPass('');
                  setClearIncludeSettings(false);
                  setClearConfirmError('');
                  setShowSettingsModal(true);
                }}
                className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1"
                title={t.settings}
              >
                <Settings className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden xl:inline">{t.settings}</span>
              </button>

              <button
                type="button"
                onClick={() => setLanguage(prev => prev === 'en' ? 'am' : 'en')}
                className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black flex items-center gap-1 border border-slate-200 dark:border-slate-700 transition-all"
                title="Switch Language (English / አማርኛ)"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{language === 'en' ? 'EN' : 'አማ'}</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
                className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 transition-all"
                title={theme === 'dark' ? t.lightMode : t.darkMode}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              </button>

              <button
                type="button"
                onClick={() => navigateToSystem('portal')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all"
                title={t.logout}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.logout}</span>
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
      {/* 1. KITCHEN POS: REAL MENU + RIGHT-SIDE TICKET + TODAY'S ORDERS */}
      {/* ============================================================== */}
      {systemMode === 'chef' && (() => {
        const todayOrders = sentOrders.filter(o => o.ethiopianDate === orderEthDate.formatted);
        const todayDishesMap = {};
        let todayTotalDishes = 0;
        let todayTotalBoxes = 0;
        let todayTotalSales = 0;

        todayOrders.forEach(o => {
          todayTotalBoxes += Number(o.boxesCount || 0);
          todayTotalSales += Number(o.totalAmount || 0);
          (o.items || []).forEach(it => {
            const qty = Number(it.qty || 0);
            todayTotalDishes += qty;
            const key = it.id || it.name;
            if (!todayDishesMap[key]) {
              todayDishesMap[key] = {
                id: key,
                name: it.name,
                englishName: it.englishName || it.name,
                qty: 0
              };
            }
            todayDishesMap[key].qty += qty;
          });
        });

        const todayDishesSummary = Object.values(todayDishesMap).sort((a, b) => b.qty - a.qty);

        const categories = [
          { id: 'All', label: t.catAll, Icon: LayoutGrid, count: foodMenu.filter(d => d.isAvailable !== false).length },
          { id: 'Juices', label: t.catJuices, Icon: CupSoda, count: foodMenu.filter(d => d.isAvailable !== false && (d.category === 'Juices' || d.category === 'Milkshake' || d.category === 'Drinks' || d.itemType === 'juice' || d.containerType === 'cup')).length },
          { id: 'Salad', label: t.catSalad, Icon: Salad, count: foodMenu.filter(d => d.isAvailable !== false && d.category === 'Salad').length },
          { id: 'Pasta & Rice', label: t.catPasta, Icon: Utensils, count: foodMenu.filter(d => d.isAvailable !== false && d.category === 'Pasta & Rice').length },
          { id: 'Eggs & Firfir', label: t.catEggs, Icon: Egg, count: foodMenu.filter(d => d.isAvailable !== false && d.category === 'Eggs & Firfir').length },
          { id: 'Sandwiches', label: t.catSandwiches, Icon: Sandwich, count: foodMenu.filter(d => d.isAvailable !== false && d.category === 'Sandwiches').length }
        ];

        const cartItemsTotalQty = cart.reduce((s, i) => s + i.qty, 0);

        return (
          <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex-1 w-full pb-24 lg:pb-8">
            {chefViewTab === 'menu' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                
                {/* LEFT COLUMN: REAL MENU & CATEGORIES (8 COLS) */}
                <div className="lg:col-span-8 space-y-4">
                  
                  {/* Search & Category Header Card */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                          <UtensilsCrossed className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span>{t.menuAndOrder}</span>
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                          {orderType === 'Takeaway'
                            ? `${t.takeaway} • ${t.takeawayBox}`
                            : `${t.homeDineIn} • ${t.dineInHome}`}
                        </p>
                      </div>

                      <div className="relative w-full sm:w-72">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                        <input
                          type="text"
                          placeholder={t.searchFood}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-8 py-2 text-xs font-bold text-slate-800 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        {searchQuery && (
                          <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Real Menu Category Tabs with Lucide Icons */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                      {categories.map(cat => {
                        const CatIcon = cat.Icon;
                        const active = activeCategory === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setActiveCategory(cat.id)}
                            className={`px-3.5 py-2 rounded-xl font-bold text-xs whitespace-nowrap flex items-center gap-2 transition-all border ${
                              active
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/20'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                            }`}
                          >
                            <CatIcon className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
                            <span>{cat.label}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-black ${
                              active
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}>
                              {cat.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Real Restaurant Menu Cards Grid */}
                  {filteredDishes.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center">
                      <UtensilsCrossed className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{t.noMatchingDishes}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
                      {filteredDishes.map(dish => {
                        const inCart = cart.find(i => i.id === dish.id);
                        const effectivePrice = getDishEffectivePrice(dish, orderType);
                        const hasCrossedOriginal = Number(dish.originalPrice) > Number(dish.price);
                        const isDiscounted = orderType === 'Home' && effectivePrice < Number(dish.price);
                        const primaryTitle = language === 'en' ? (dish.englishName || dish.name) : dish.name;
                        const secondaryTitle = language === 'en' ? dish.name : dish.englishName;
                        const isDrink = dish.containerType === 'cup' || dish.itemType === 'juice';

                        return (
                          <div
                            key={dish.id}
                            data-dish-id={dish.id}
                            onClick={() => !inCart && toggleOrAddFood(dish)}
                            className={`relative bg-white dark:bg-slate-900 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group select-none overflow-hidden ${
                              inCart
                                ? 'border-emerald-500 shadow-lg shadow-emerald-600/10 ring-2 ring-emerald-500/25'
                                : 'border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500/50 shadow-sm hover:shadow-md'
                            }`}
                          >
                            {/* Dish Image Header */}
                            <div className="w-full h-36 relative bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              {dish.imageUrl && (
                                <img
                                  src={dish.imageUrl}
                                  alt={primaryTitle}
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const fallback = e.currentTarget.parentElement.querySelector('.image-icon-fallback');
                                    if (fallback) fallback.style.display = 'flex';
                                  }}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              )}
                              <div
                                className="image-icon-fallback w-full h-full items-center justify-center bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                style={{ display: dish.imageUrl ? 'none' : 'flex' }}
                              >
                                {isDrink ? <CupSoda className="w-10 h-10" /> : <UtensilsCrossed className="w-10 h-10" />}
                              </div>

                              {/* Packaging Badge */}
                              <div className="absolute top-2.5 left-2.5 bg-slate-900/75 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 border border-white/15">
                                {orderType === 'Takeaway' ? (
                                  <>
                                    <Package className="w-3 h-3 text-emerald-400" />
                                    <span>{t.takeawayBox}</span>
                                  </>
                                ) : (
                                  <>
                                    <Home className="w-3 h-3 text-emerald-400" />
                                    <span>{t.dineInHome}</span>
                                  </>
                                )}
                              </div>

                              {/* Discount Badge */}
                              {isDiscounted && (
                                <div className="absolute bottom-2.5 left-2.5 bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-sm flex items-center gap-1">
                                  <Home className="w-3 h-3" />
                                  <span>{formatEtb(effectivePrice)} ETB</span>
                                </div>
                              )}

                              {/* Active Quantity Pill */}
                              {inCart && (
                                <div className="absolute top-2.5 right-2.5 bg-emerald-600 text-white text-xs font-black w-7 h-7 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-900">
                                  {inCart.qty}
                                </div>
                              )}
                            </div>

                            {/* Card Body */}
                            <div className="p-3.5 flex-1 flex flex-col justify-between gap-3">
                              <div>
                                <div className="flex items-start justify-between gap-2">
                                  <h3 className="font-black text-sm text-slate-900 dark:text-white leading-snug line-clamp-1">
                                    {primaryTitle}
                                  </h3>
                                </div>
                                {secondaryTitle && secondaryTitle !== primaryTitle && (
                                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 block mt-0.5 line-clamp-1">
                                    {secondaryTitle}
                                  </span>
                                )}
                                {dish.description && (
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                                    {dish.description}
                                  </p>
                                )}
                              </div>

                              {/* Price & Action */}
                              <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                                <div>
                                  <div className="flex items-baseline gap-1">
                                    <span className={`font-black text-base ${
                                      isDiscounted
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : hasCrossedOriginal
                                          ? 'text-rose-600 dark:text-rose-400'
                                          : 'text-slate-900 dark:text-white'
                                    }`}>
                                      {formatEtb(effectivePrice)}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-bold">ETB</span>
                                  </div>
                                  {(isDiscounted || hasCrossedOriginal) && (
                                    <span className="text-[10px] text-slate-400 line-through font-semibold block">
                                      {formatEtb(isDiscounted ? dish.price : dish.originalPrice)} ETB
                                    </span>
                                  )}
                                </div>

                                {inCart ? (
                                  <div
                                    className="flex items-center gap-1 bg-emerald-500/10 dark:bg-emerald-500/15 p-1 rounded-xl border border-emerald-500/30"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => updateCartQty(dish.id, -1)}
                                      className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center shadow-xs"
                                    >
                                      <Minus className="w-3.5 h-3.5" />
                                    </button>
                                    <span className="font-black text-xs text-emerald-700 dark:text-emerald-300 px-1.5 min-w-[20px] text-center">
                                      {inCart.qty}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => updateCartQty(dish.id, 1)}
                                      className="w-7 h-7 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 flex items-center justify-center shadow-xs"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); toggleOrAddFood(dish); }}
                                    className="px-3 py-1.5 rounded-xl bg-emerald-600/10 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 hover:text-white text-xs font-black flex items-center gap-1 transition-all border border-emerald-600/20"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>{t.add}</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Compact Today's Ordered Foods Strip below menu for quick kitchen glance */}
                  {todayDishesSummary.length > 0 && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <h3 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-wider">
                          <Flame className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span>{t.dishBreakdownTitle} ({todayOrders.length})</span>
                        </h3>
                        <button
                          type="button"
                          onClick={() => setChefViewTab('today')}
                          className="text-xs font-black text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                        >
                          <span>{t.todaysOrders}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {todayDishesSummary.map(item => (
                          <span
                            key={item.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200"
                          >
                            <span className="px-1.5 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-black">
                              {item.qty}×
                            </span>
                            <span>{language === 'en' ? item.englishName : item.name}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* RIGHT COLUMN: LIVE ORDER TICKET PANEL (4 COLS) */}
                <aside ref={orderPanelRef} className="lg:col-span-4 lg:sticky lg:top-20">
                  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden">
                    
                    {/* Ticket Header */}
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                          <Receipt className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-black text-sm text-slate-900 dark:text-white">{t.currentOrder}</h3>
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            {cartItemsTotalQty} {t.itemsCount}
                          </span>
                        </div>
                      </div>
                      {cart.length > 0 && (
                        <button
                          type="button"
                          onClick={clearCurrentOrder}
                          className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 px-2.5 py-1 rounded-lg transition-all"
                        >
                          {t.clearOrder}
                        </button>
                      )}
                    </div>

                    {/* Added Foods List */}
                    <div className="p-4 max-h-64 overflow-y-auto space-y-2.5 border-b border-slate-100 dark:border-slate-800">
                      {cart.length === 0 ? (
                        <div className="py-8 text-center space-y-2">
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                            <ShoppingBag className="w-5 h-5" />
                          </div>
                          <p className="text-xs font-black text-slate-700 dark:text-slate-300">{t.emptyCartTitle}</p>
                          <p className="text-[11px] text-slate-400 font-medium max-w-[220px] mx-auto">
                            {t.emptyCartHint}
                          </p>
                        </div>
                      ) : (
                        cart.map(item => {
                          const unitPrice = getDishEffectivePrice(item, orderType);
                          const itemTitle = language === 'en' ? (item.englishName || item.name) : item.name;
                          return (
                            <div
                              key={item.id}
                              className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700/70"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-black text-slate-900 dark:text-white truncate">{itemTitle}</p>
                                <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                  {formatEtb(unitPrice * item.qty)} ETB
                                  <span className="text-slate-400 font-normal ml-1">({formatEtb(unitPrice)})</span>
                                </p>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => updateCartQty(item.id, -1)}
                                  className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 flex items-center justify-center"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-xs font-black w-5 text-center text-slate-900 dark:text-white">
                                  {item.qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateCartQty(item.id, 1)}
                                  className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeDishFromCart(item.id)}
                                  className="w-6 h-6 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center justify-center ml-0.5"
                                  title="Remove"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Ticket Summary & Add Order Action */}
                    <div className="p-4 space-y-3 bg-slate-50/70 dark:bg-slate-800/40">
                      <div className="flex items-center justify-between pt-1">
                        <span className="font-black text-sm text-slate-900 dark:text-white">{t.totalAmount}</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                            {formatEtb(totalSubtotal)}
                          </span>
                          <span className="text-xs font-black text-slate-500">ETB</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={cart.length === 0}
                        onClick={() => setCheckoutModalStep(1)}
                        className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 disabled:shadow-none transition-all active:scale-[0.98]"
                      >
                        <span>{t.completeOrder}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                </aside>

              </div>
            ) : (
              /* ============================================================== */
              /* TODAY'S ORDERED FOODS & TICKETS VIEW                           */
              /* ============================================================== */
              <div className="space-y-5 animate-in fade-in duration-200">
                
                {/* Today's KPI Summary Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold mb-1">
                      <span>{t.ordersCountLabel}</span>
                      <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">{todayOrders.length}</p>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold mb-1">
                      <span>{t.dishesPreparedLabel}</span>
                      <UtensilsCrossed className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">{todayTotalDishes}</p>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold mb-1">
                      <span>{t.boxesUsedLabel}</span>
                      <Package className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">{todayTotalBoxes}</p>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold mb-1">
                      <span>{t.salesTodayLabel}</span>
                      <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      {formatEtb(todayTotalSales)} <span className="text-xs">ETB</span>
                    </p>
                  </div>
                </div>

                {/* Aggregated Dishes Ordered Today */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                    <Flame className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{t.dishBreakdownTitle} • {orderEthDate.formatted}</span>
                  </h3>
                  {todayDishesSummary.length === 0 ? (
                    <p className="text-xs font-semibold text-slate-400">{t.noOrdersToday}</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
                      {todayDishesSummary.map(item => (
                        <div
                          key={item.id}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2"
                        >
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            {language === 'en' ? item.englishName : item.name}
                          </span>
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white text-xs font-black flex-shrink-0">
                            {item.qty}×
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Order Tickets Feed for Today */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>{t.orderFeedTitle}</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setChefViewTab('menu')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t.menuAndOrder}</span>
                    </button>
                  </div>

                  {todayOrders.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 text-xs font-bold">
                      {t.noOrdersToday}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                      {todayOrders.map(order => {
                        const isCooked = (order.status || '').includes('ተዘጋጅቷል');
                        return (
                          <div
                            key={order.id}
                            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50 p-4 flex flex-col justify-between gap-3"
                          >
                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between gap-2">
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                  <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                  <span>{order.timestamp || order.cookedAt}</span>
                                </span>
                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black flex items-center gap-1 ${
                                  order.channel === 'BEU Delivery'
                                    ? 'bg-teal-500/15 text-teal-700 dark:text-teal-300'
                                    : order.orderType === 'Home'
                                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                      : 'bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                                }`}>
                                  {order.channel === 'BEU Delivery' ? <Truck className="w-3 h-3" /> : order.orderType === 'Home' ? <Home className="w-3 h-3" /> : <Package className="w-3 h-3" />}
                                  <span>{order.channel === 'BEU Delivery' ? 'BEU' : order.orderType === 'Home' ? t.homeDineIn : t.takeaway}</span>
                                </span>
                              </div>

                              <div className="space-y-1">
                                {(order.items || []).map((item, idx) => (
                                  <div key={idx} className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                                    <span>
                                      <span className="text-emerald-600 dark:text-emerald-400 font-black mr-1.5">{item.qty}×</span>
                                      {language === 'en' ? (item.englishName || item.name) : item.name}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="pt-2.5 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                                <User className="w-3 h-3 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                                <span className="truncate">{formatWaiterDisplayName(order.waiterName)}</span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleToggleOrderStatus(order.id)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all flex-shrink-0 ${
                                  isCooked
                                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                                    : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                                }`}
                              >
                                {isCooked ? t.cookedStatus : t.takenStatus}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mobile Floating Cart Bar (opens step modal or scrolls to ticket) */}
            {chefViewTab === 'menu' && cart.length > 0 && (
              <div className="lg:hidden fixed bottom-3 left-4 right-4 z-40">
                <button
                  type="button"
                  onClick={() => setCheckoutModalStep(1)}
                  className="w-full py-3 px-4 rounded-2xl bg-emerald-600 text-white shadow-xl shadow-emerald-900/30 flex items-center justify-between text-xs font-black"
                >
                  <span className="flex items-center gap-2">
                    <Receipt className="w-4 h-4" />
                    <span>{t.completeOrder} ({cartItemsTotalQty})</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span>{formatEtb(totalSubtotal)} ETB</span>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </button>
              </div>
            )}

            {/* ============================================================== */}
            {/* STEP-BY-STEP CHECKOUT MODAL (SERVICE -> SHIFT -> WAITER)       */}
            {/* ============================================================== */}
            {checkoutModalStep > 0 && (
              <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
                  
                  {/* Modal Header & Step Progress */}
                  <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50">
                    <div>
                      <h3 className="font-black text-base text-slate-900 dark:text-white">
                        {checkoutModalStep === 1
                          ? t.chooseServiceTitle
                          : checkoutModalStep === 2
                            ? t.chooseShiftTitle
                            : t.chooseWaiterTitle}
                      </h3>
                      <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {checkoutModalStep === 1
                          ? t.chooseServiceSub
                          : checkoutModalStep === 2
                            ? t.chooseShiftSub
                            : t.chooseWaiterSub}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCheckoutModalStep(0)}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Stepper Pills */}
                  <div className="px-6 pt-4 grid grid-cols-3 gap-2">
                    {[
                      { step: 1, label: `1. ${t.serviceType}` },
                      { step: 2, label: `2. ${t.shift}` },
                      { step: 3, label: `3. ${t.waiter}` }
                    ].map(s => (
                      <div
                        key={s.step}
                        className={`py-1.5 px-2 rounded-xl text-center text-[11px] font-black border transition-all ${
                          checkoutModalStep === s.step
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : checkoutModalStep > s.step
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {s.label}
                      </div>
                    ))}
                  </div>

                  {/* Modal Body */}
                  <div className="p-6 space-y-4">
                    
                    {/* STEP 1: SERVICE TYPE */}
                    {checkoutModalStep === 1 && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <button
                            type="button"
                            onClick={() => {
                              setOrderType('Takeaway');
                            }}
                            className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col gap-2 ${
                              orderType === 'Takeaway'
                                ? 'border-emerald-600 bg-emerald-500/10 ring-2 ring-emerald-500/20'
                                : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-emerald-400'
                            }`}
                          >
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                              <Package className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-black text-sm text-slate-900 dark:text-white">{t.takeaway}</p>
                              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{t.takeawayBox}</p>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setOrderType('Home');
                              if (selectedShiftType === 'BEU') {
                                setSelectedShiftType('Day');
                                if (/beu|ቢዩ/i.test(selectedWaiter)) setSelectedWaiter('ሀብታሙ (Habtamu)');
                              }
                            }}
                            className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col gap-2 ${
                              orderType === 'Home'
                                ? 'border-emerald-600 bg-emerald-500/10 ring-2 ring-emerald-500/20'
                                : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-emerald-400'
                            }`}
                          >
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                              <Home className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-black text-sm text-slate-900 dark:text-white">{t.homeDineIn}</p>
                              <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5">{t.dineInHome}</p>
                            </div>
                          </button>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-500 dark:text-slate-400">{t.boxesOut}: {orderType === 'Home' ? 0 : totalBoxesInOrder}</span>
                          <span className="text-base font-black text-emerald-600 dark:text-emerald-400">{formatEtb(totalSubtotal)} ETB</span>
                        </div>
                      </div>
                    )}

                    {/* STEP 2: SHIFT (DAY / NIGHT / BEU) */}
                    {checkoutModalStep === 2 && (
                      <div className="space-y-3.5">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedShiftType('Day');
                              if (/beu|ቢዩ/i.test(selectedWaiter)) setSelectedWaiter('ሀብታሙ (Habtamu)');
                            }}
                            className={`p-5 rounded-2xl border-2 text-center transition-all flex flex-col items-center gap-2.5 ${
                              selectedShiftType === 'Day'
                                ? 'border-emerald-600 bg-emerald-500/10 ring-2 ring-emerald-500/20'
                                : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-emerald-400'
                            }`}
                          >
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                              <Sun className="w-6 h-6" />
                            </div>
                            <span className="font-black text-sm text-slate-900 dark:text-white">{t.dayShift}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedShiftType('Night');
                              if (/beu|ቢዩ/i.test(selectedWaiter)) setSelectedWaiter('ወንዴ (Wende)');
                            }}
                            className={`p-5 rounded-2xl border-2 text-center transition-all flex flex-col items-center gap-2.5 ${
                              selectedShiftType === 'Night'
                                ? 'border-emerald-600 bg-emerald-500/10 ring-2 ring-emerald-500/20'
                                : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-emerald-400'
                            }`}
                          >
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                              <Moon className="w-6 h-6" />
                            </div>
                            <span className="font-black text-sm text-slate-900 dark:text-white">{t.nightShift}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedShiftType('BEU');
                              setOrderType('Takeaway');
                              setSelectedWaiter('የቢዩ አሽከርካሪ (BEU Driver)');
                            }}
                            className={`p-5 rounded-2xl border-2 text-center transition-all flex flex-col items-center gap-2.5 ${
                              selectedShiftType === 'BEU'
                                ? 'border-teal-600 bg-teal-500/10 ring-2 ring-teal-500/20'
                                : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-teal-400'
                            }`}
                          >
                            <div className="w-12 h-12 rounded-2xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                              <Truck className="w-6 h-6" />
                            </div>
                            <span className="font-black text-sm text-slate-900 dark:text-white">{t.beuDelivery}</span>
                          </button>
                        </div>

                        {selectedShiftType === 'BEU' && (
                          <input
                            type="text"
                            placeholder={t.beuOrderIdPlaceholder}
                            value={beuOrderId}
                            onChange={(e) => setBeuOrderId(e.target.value)}
                            className="w-full bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        )}
                      </div>
                    )}

                    {/* STEP 3: WAITER */}
                    {checkoutModalStep === 3 && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          {waitersList.map(waiter => {
                            const isSelected = (selectedWaiter === waiter.fullName || selectedWaiter === waiter.amharic) && !customWaiterName.trim();
                            const waiterLabel = language === 'en' ? (waiter.english || waiter.amharic) : (waiter.amharic || waiter.english);
                            return (
                              <button
                                key={waiter.fullName || waiter.amharic}
                                type="button"
                                onClick={() => {
                                  setSelectedWaiter(waiter.fullName || waiter.amharic);
                                  setCustomWaiterName('');
                                }}
                                className={`p-3 rounded-2xl border-2 text-center transition-all flex flex-col items-center gap-1.5 ${
                                  isSelected
                                    ? 'border-emerald-600 bg-emerald-500/10 ring-2 ring-emerald-500/20'
                                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-emerald-400'
                                }`}
                              >
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                                  isSelected ? 'bg-emerald-600 text-white' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                }`}>
                                  <User className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-black text-slate-900 dark:text-white leading-tight">{waiterLabel}</span>
                              </button>
                            );
                          })}
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder={t.customWaiterPlaceholder}
                            value={customWaiterName}
                            onChange={(e) => setCustomWaiterName(e.target.value)}
                            className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                          {customWaiterName.trim() && (
                            <button
                              type="button"
                              onClick={handleAddCustomWaiter}
                              className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black"
                            >
                              {t.saveWaiter}
                            </button>
                          )}
                        </div>

                        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-700 dark:text-slate-200">
                            {orderType === 'Home' ? t.homeDineIn : t.takeaway} • {selectedShiftType === 'BEU' ? t.beuDelivery : (selectedShiftType === 'Night' ? t.nightShift : t.dayShift)}
                          </span>
                          <span className="text-base font-black text-emerald-700 dark:text-emerald-300">{formatEtb(totalSubtotal)} ETB</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Modal Footer Navigation */}
                  <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between gap-3">
                    {checkoutModalStep > 1 ? (
                      <button
                        type="button"
                        onClick={() => setCheckoutModalStep(prev => prev - 1)}
                        className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-black text-xs flex items-center gap-1.5"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>{t.back}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setCheckoutModalStep(0)}
                        className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-black text-xs"
                      >
                        {t.close}
                      </button>
                    )}

                    {checkoutModalStep === 1 && (
                      <button
                        type="button"
                        onClick={() => setCheckoutModalStep(2)}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md"
                      >
                        <span>{t.next}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {checkoutModalStep === 2 && (
                      <button
                        type="button"
                        onClick={() => setCheckoutModalStep(3)}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md"
                      >
                        <span>{t.next}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {checkoutModalStep === 3 && (
                      <button
                        type="button"
                        onClick={handleFinalSubmit}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{t.submitOrder}</span>
                      </button>
                    )}
                  </div>

                </div>
              </div>
            )}
          </main>
        );
      })()}

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
                  <span className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-black text-sm">
                    <Crown className="w-4 h-4" />
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
                <span>{formatEtb(beuRevenue)} ETB</span>
              </div>
              {beuDeductionTotal > 0 && (
                <span className="text-[9px] font-black text-rose-600 mt-0.5 block">
                  -15% Deduction: -{formatEtb(beuDeductionTotal)} ETB
                </span>
              )}
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
                                🛵 {order.beuOrderId || 'BEU Delivery'} {order.beuDeductionPct ? `(-${order.beuDeductionPct}%)` : ''}
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
                                <span className="text-[10px] text-slate-400 font-bold">({formatEtb(item.price)} ETB)</span>
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
                            {formatEtb(order.totalAmount)} <span className="text-xs font-black text-emerald-700">ETB</span>
                          </span>
                          {order.channel === 'BEU Delivery' && getOrderBeuMetrics(order).deductionAmount > 0 && (
                            <span className="text-[10px] font-black text-rose-600 block">
                              Normal {formatEtb(getOrderBeuMetrics(order).normalSubtotal)} • -15% ({formatEtb(getOrderBeuMetrics(order).deductionAmount)} ETB)
                            </span>
                          )}
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
              <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-3xl p-3 shadow-sm border border-slate-200 dark:border-slate-800 lg:sticky lg:top-20 flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible">
                <div className="hidden lg:block px-3 py-2 mb-1 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
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
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
                        <span>{item.label}</span>
                      </span>
                      {item.badge !== null && item.badge !== undefined && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                          item.alert
                            ? 'bg-rose-600 text-white animate-pulse'
                            : isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}

                <div className="hidden lg:block mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 px-2">
                  <button
                    type="button"
                    onClick={() => navigateToSystem('reconciliation')}
                    className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-emerald-700 dark:text-emerald-300 text-[11px] font-black flex items-center justify-center gap-1.5 border border-slate-200 dark:border-white/10"
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
                  theme={theme}
                  onToggleTheme={handleToggleTheme}
                  onRefreshOrders={syncFromSupabase}
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
                    dbService.saveAppState('maraki_shift_settlements', updated);
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
                  onUpdateMenu={handleUpdateMenu}
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
                    dbService.clearAllOrders();
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
                    dbService.clearAllOrders();
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
                      <div>
                        <span className="font-black text-sm sm:text-base text-[#1C201D] tracking-tight block">
                          {item.name}
                        </span>
                        {item.normalPrice && Number(item.normalPrice) > Number(item.price) && (
                          <span className="text-[10px] text-slate-400 font-bold block">
                            Normal {formatEtb(item.normalPrice)} → BEU {formatEtb(item.price)} ETB
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="font-black text-xs text-[#1C201D]">
                      {formatEtb(roundPricePrecision(item.price * item.qty))} ETB
                    </span>
                  </div>
                ))}

                {selectedOrderForView.channel === 'BEU Delivery' && getOrderBeuMetrics(selectedOrderForView).deductionAmount > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl px-3.5 py-2.5 space-y-1 text-xs">
                    <div className="flex justify-between font-bold text-slate-600">
                      <span>Normal Menu Value:</span>
                      <span>{formatEtb(getOrderBeuMetrics(selectedOrderForView).normalSubtotal)} ETB</span>
                    </div>
                    <div className="flex justify-between font-black text-rose-700">
                      <span>BEU 15% Deduction:</span>
                      <span>-{formatEtb(getOrderBeuMetrics(selectedOrderForView).deductionAmount)} ETB</span>
                    </div>
                  </div>
                )}

                {/* Total Price Box */}
                <div className="bg-[#EBF6F0] rounded-2xl p-4 flex items-center justify-between mt-3">
                  <span className="font-black text-sm text-[#1C201D]">ድምር ዋጋ</span>
                  <div className="flex items-baseline">
                    <span className="text-3xl font-black text-[#1C201D] tracking-tight">
                      {formatEtb(selectedOrderForView.totalAmount)}
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
            <h2 className="text-2xl sm:text-3xl font-black text-[#1C201D] dark:text-white tracking-tight text-center mt-3">
              {t.orderSubmittedTitle}
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-[#666E67] dark:text-slate-400 text-center mt-1 tracking-wide">
              {t.orderSubmittedSub}
            </p>

            {/* Auto-Return Countdown Progress Indicator */}
            <div className="mt-3 flex flex-col items-center gap-1.5 w-full max-w-xs animate-in fade-in">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#E2F4EB] dark:bg-emerald-950/60 text-[#126848] dark:text-emerald-300 text-[11px] font-black">
                <span className="w-2 h-2 rounded-full bg-[#126848] dark:bg-emerald-400 animate-ping" />
                <span>{t.autoReturning}</span>
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
                      {formatEtb(orderSuccessModal.totalAmount)}
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

              {/* Shift Reconciliation PIN */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  📋 የፈረቃ ማስታረቂያ ፒን (Shift Audit PIN):
                </label>
                <input
                  type="text"
                  placeholder={`የአሁኑ፡ ${reconciliationPin}`}
                  value={newReconciliationPinInput}
                  onChange={(e) => setNewReconciliationPinInput(e.target.value)}
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
                          onClick={async () => {
                            if (clearConfirmPass.trim() !== ownerPassword) {
                              setClearConfirmError('Incorrect Owner Password.');
                              return;
                            }
                            setApplyingRemoteSync(true);
                            clearAllBusinessData({ includeSettings: clearIncludeSettings });
                            await dbService.clearAllCloudData({ includeSettings: clearIncludeSettings });
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
