import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Check, Minus, Plus, Trash2, Clock } from 'lucide-react';
import { FoodMenuItem } from '../types';
import { KitchenOrder, KitchenTaker } from '../types';
import { supabase } from '../lib/supabaseClient';

interface KitchenOrderEntryProps {
  foodMenu: FoodMenuItem[];
}

type Step = 'food' | 'quantity' | 'taker' | 'confirm';

const TAKERS: { id: KitchenTaker; emoji: string; label: string; subLabel: string; color: string }[] = [
  { id: 'day_shift',    emoji: '☀️', label: 'ቀን ሸፍት',   subLabel: 'Day Shift',    color: 'bg-amber-400 hover:bg-amber-500 border-amber-300' },
  { id: 'night_shift',  emoji: '🌙', label: 'ሌሊት ሸፍት', subLabel: 'Night Shift',  color: 'bg-indigo-500 hover:bg-indigo-600 border-indigo-400' },
  { id: 'beu_delivery', emoji: '🚴', label: 'BeU Delivery', subLabel: 'Delivery',  color: 'bg-emerald-500 hover:bg-emerald-600 border-emerald-400' },
];

// Emoji mapping for food categories
const CATEGORY_EMOJI: Record<string, string> = {
  special: '⭐',
  fast_food: '🍝',
  breakfast: '🍳',
  traditional: '🥘',
};

function formatTime(isoStr: string) {
  const d = new Date(isoStr);
  return d.toLocaleTimeString('am-ET', { hour: '2-digit', minute: '2-digit', hour12: true });
}

const KitchenOrderEntry: React.FC<KitchenOrderEntryProps> = ({ foodMenu }) => {
  const [step, setStep] = useState<Step>('food');
  const [selectedFood, setSelectedFood] = useState<FoodMenuItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedTaker, setSelectedTaker] = useState<KitchenTaker | null>(null);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [todayOrders, setTodayOrders] = useState<KitchenOrder[]>([]);
  const [loadedToday, setLoadedToday] = useState(false);

  // Load today's orders on mount
  React.useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    supabase
      .from('kitchen_orders')
      .select('*')
      .eq('date', today)
      .order('created_at_ts', { ascending: false })
      .then(({ data }) => {
        if (data) {
          setTodayOrders(data.map((r: any) => ({
            id: r.id,
            foodItemId: r.food_item_id,
            foodItemName: r.food_item_name,
            quantity: r.quantity,
            taker: r.taker as KitchenTaker,
            shiftType: r.shift_type,
            orderTime: r.order_time,
            date: r.date,
            notes: r.notes,
            createdAt: Number(r.created_at_ts),
          })));
        }
        setLoadedToday(true);
      });
  }, []);

  const reset = () => {
    setStep('food');
    setSelectedFood(null);
    setQuantity(1);
    setSelectedTaker(null);
  };

  const handleSave = async () => {
    if (!selectedFood || !selectedTaker) return;
    setSaving(true);

    const now = new Date();
    const shiftType = selectedTaker === 'night_shift' ? 'night' : 'day';
    const order: KitchenOrder = {
      id: 'ko-' + Date.now(),
      foodItemId: selectedFood.id,
      foodItemName: selectedFood.name,
      quantity,
      taker: selectedTaker,
      shiftType,
      orderTime: now.toISOString(),
      date: now.toISOString().split('T')[0],
      createdAt: Date.now(),
    };

    const { error } = await supabase.from('kitchen_orders').insert({
      id: order.id,
      food_item_id: order.foodItemId,
      food_item_name: order.foodItemName,
      quantity: order.quantity,
      taker: order.taker,
      shift_type: order.shiftType,
      order_time: order.orderTime,
      date: order.date,
      created_at_ts: order.createdAt,
    });

    setSaving(false);

    if (!error) {
      setTodayOrders((prev) => [order, ...prev]);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        reset();
      }, 1800);
    } else {
      alert('Error saving order: ' + error.message);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    await supabase.from('kitchen_orders').delete().eq('id', id);
    setTodayOrders((prev) => prev.filter((o) => o.id !== id));
  };

  const takerInfo = (t: KitchenTaker) => TAKERS.find((x) => x.id === t)!;

  // ─── Step: Food Selection ──────────────────────────────────────────────────
  const renderFoodStep = () => (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-6 pb-3">
        {/* Amharic: "Choose Food" */}
        <h2 className="text-3xl font-bold text-white mb-1">ምግብ ይምረጡ</h2>
        <p className="text-white/50 text-base">Choose Food</p>
      </div>
      <div className="flex-1 overflow-y-auto px-5 pb-6">
        <div className="grid grid-cols-2 gap-3">
          {foodMenu.filter(f => f.available !== false).map((item) => (
            <button
              key={item.id}
              onClick={() => { setSelectedFood(item); setStep('quantity'); }}
              className="flex flex-col items-center justify-center rounded-2xl border-2 border-white/10 bg-white/10 hover:bg-orange-500/20 hover:border-orange-400/50 active:scale-95 transition-all duration-150 cursor-pointer p-4 min-h-[100px] gap-2"
            >
              <span className="text-3xl">{CATEGORY_EMOJI[item.category || 'special'] ?? '🍽️'}</span>
              <span className="text-white font-semibold text-center leading-tight text-sm">{item.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ─── Step: Quantity ────────────────────────────────────────────────────────
  const renderQuantityStep = () => (
    <div className="flex flex-col items-center justify-center flex-1 px-8 gap-10">
      <div className="text-center">
        {/* Amharic: "How many?" */}
        <h2 className="text-3xl font-bold text-white mb-1">ስንት?</h2>
        <p className="text-white/50 text-base">How many portions?</p>
        {selectedFood && (
          <p className="text-orange-300 font-semibold text-lg mt-3">{selectedFood.name}</p>
        )}
      </div>

      <div className="flex items-center gap-10">
        <button
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          className="w-20 h-20 rounded-full bg-white/15 hover:bg-red-500/40 border-2 border-white/20 flex items-center justify-center active:scale-90 transition-all cursor-pointer"
        >
          <Minus className="w-10 h-10 text-white" strokeWidth={2.5} />
        </button>

        <span className="text-8xl font-black text-white w-28 text-center">{quantity}</span>

        <button
          onClick={() => setQuantity((q) => q + 1)}
          className="w-20 h-20 rounded-full bg-white/15 hover:bg-green-500/40 border-2 border-white/20 flex items-center justify-center active:scale-90 transition-all cursor-pointer"
        >
          <Plus className="w-10 h-10 text-white" strokeWidth={2.5} />
        </button>
      </div>

      <button
        onClick={() => setStep('taker')}
        className="w-full max-w-xs h-16 rounded-2xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-2xl font-bold transition-all cursor-pointer shadow-lg"
      >
        {/* Amharic: "Next" */}
        ቀጣይ →
      </button>
    </div>
  );

  // ─── Step: Taker ──────────────────────────────────────────────────────────
  const renderTakerStep = () => (
    <div className="flex flex-col flex-1 px-5 gap-6">
      <div className="pt-6">
        {/* Amharic: "Who took it?" */}
        <h2 className="text-3xl font-bold text-white mb-1">ማን ወሰደ?</h2>
        <p className="text-white/50 text-base">Who took the order?</p>
      </div>

      <div className="flex flex-col gap-4 flex-1 justify-center">
        {TAKERS.map((t) => (
          <button
            key={t.id}
            onClick={() => { setSelectedTaker(t.id); setStep('confirm'); }}
            className={`flex items-center gap-5 h-24 rounded-2xl border-2 px-6 text-white active:scale-95 transition-all duration-150 cursor-pointer shadow-md ${t.color}`}
          >
            <span className="text-5xl">{t.emoji}</span>
            <div className="text-left">
              <div className="text-2xl font-bold">{t.label}</div>
              <div className="text-sm opacity-80">{t.subLabel}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  // ─── Step: Confirm ─────────────────────────────────────────────────────────
  const renderConfirmStep = () => {
    const taker = TAKERS.find((t) => t.id === selectedTaker)!;
    return (
      <div className="flex flex-col flex-1 px-5 gap-6 justify-center items-center">
        {/* Amharic: "Confirm?" */}
        <h2 className="text-3xl font-bold text-white mb-2 text-center">እርግጠኛ ነህ?</h2>

        <div className="w-full max-w-sm rounded-3xl bg-white/10 border border-white/20 p-6 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <span className="text-4xl">{CATEGORY_EMOJI[selectedFood?.category || 'special'] ?? '🍽️'}</span>
            <div>
              <p className="text-white text-xl font-bold">{selectedFood?.name}</p>
              <p className="text-white/60 text-base">
                {/* Amharic: "Amount" */}
                ብዛት: <span className="text-orange-300 font-bold text-xl">{quantity}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 border-t border-white/10 pt-4">
            <span className="text-3xl">{taker.emoji}</span>
            <div>
              <p className="text-white font-bold text-lg">{taker.label}</p>
              <p className="text-white/50 text-sm">{taker.subLabel}</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full max-w-sm h-20 rounded-2xl bg-green-500 hover:bg-green-600 active:scale-95 text-white text-2xl font-bold transition-all cursor-pointer shadow-lg flex items-center justify-center gap-3 disabled:opacity-60"
        >
          {saving ? (
            <div className="w-8 h-8 border-4 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Check className="w-8 h-8" strokeWidth={3} />
              {/* Amharic: "Save" */}
              አስቀምጥ
            </>
          )}
        </button>
      </div>
    );
  };

  // ─── Success overlay ───────────────────────────────────────────────────────
  const renderSuccess = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.7 }}
      className="absolute inset-0 flex flex-col items-center justify-center bg-green-600/95 rounded-none z-50"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.3, 1] }}
        transition={{ duration: 0.4 }}
        className="text-9xl mb-6"
      >
        ✅
      </motion.div>
      {/* Amharic: "Saved!" */}
      <p className="text-white text-4xl font-black">ተቀምጧል!</p>
      <p className="text-white/70 text-xl mt-2">Order Saved</p>
    </motion.div>
  );

  // ─── Today's order list ────────────────────────────────────────────────────
  const renderTodayOrders = () => (
    <div className="px-5 pb-6">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-white/40" />
        {/* Amharic: "Today's Orders" */}
        <h3 className="text-white/60 text-sm font-semibold uppercase tracking-wider">የዛሬ ትዕዛዞች</h3>
        <span className="ml-auto bg-white/10 text-white/60 text-xs px-2 py-0.5 rounded-full">
          {todayOrders.length}
        </span>
      </div>
      {todayOrders.length === 0 ? (
        <p className="text-white/30 text-center py-4 text-sm">
          {loadedToday ? 'ዛሬ ምንም ትዕዛዝ የለም' : '...'}
        </p>
      ) : (
        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
          {todayOrders.map((order) => {
            const t = takerInfo(order.taker);
            return (
              <div
                key={order.id}
                className="flex items-center gap-3 bg-white/8 rounded-xl px-4 py-3 border border-white/10"
              >
                <span className="text-2xl">{t.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{order.foodItemName}</p>
                  <p className="text-white/40 text-xs">
                    ×{order.quantity} · {formatTime(order.orderTime)}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteOrder(order.id)}
                  className="p-2 rounded-lg hover:bg-red-500/30 text-white/30 hover:text-red-400 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div
      style={{ background: 'linear-gradient(160deg, #1a2a3a 0%, #0f1f2e 100%)' }}
      className="min-h-screen flex flex-col font-sans relative overflow-hidden"
    >
      <AnimatePresence>
        {showSuccess && renderSuccess()}
      </AnimatePresence>

      {/* Top bar */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-2">
        {step !== 'food' && (
          <button
            onClick={() => {
              if (step === 'quantity') setStep('food');
              else if (step === 'taker') setStep('quantity');
              else if (step === 'confirm') setStep('taker');
            }}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        {/* Step indicator dots */}
        <div className="flex gap-2 ml-auto">
          {(['food', 'quantity', 'taker', 'confirm'] as Step[]).map((s) => (
            <div
              key={s}
              className={`rounded-full transition-all duration-300 ${
                s === step
                  ? 'w-6 h-2.5 bg-orange-400'
                  : 'w-2.5 h-2.5 bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col flex-1"
        >
          {step === 'food' && renderFoodStep()}
          {step === 'quantity' && renderQuantityStep()}
          {step === 'taker' && renderTakerStep()}
          {step === 'confirm' && renderConfirmStep()}
        </motion.div>
      </AnimatePresence>

      {/* Today's orders (only show on food step) */}
      {step === 'food' && (
        <div className="border-t border-white/10 mt-4">
          {renderTodayOrders()}
        </div>
      )}
    </div>
  );
};

export default KitchenOrderEntry;
