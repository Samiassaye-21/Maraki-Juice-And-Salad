import React, { useState } from 'react';
import { 
  Plus, 
  Minus, 
  Trash2, 
  Send, 
  CheckCircle2, 
  Coffee, 
  Package, 
  ShoppingBag, 
  User, 
  CreditCard,
  AlertCircle
} from 'lucide-react';

export default function PosTerminal({ menu, onPlaceOrder }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState([]);
  const [tableNumber, setTableNumber] = useState('Table 1');
  const [orderType, setOrderType] = useState('Dine-In'); // Dine-In | Takeaway
  const [waiterName, setWaiterName] = useState('Abebe');
  const [paymentMethod, setPaymentMethod] = useState('Cash'); // Cash | Telebirr | CBE Birr | Card
  const [orderSuccess, setOrderSuccess] = useState(null);

  const categories = ['All', 'Juices', 'Smoothies', 'Salads'];

  const filteredMenu = selectedCategory === 'All'
    ? menu
    : menu.filter(item => item.category === selectedCategory);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1, notes: '' }];
    });
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const updateNotes = (id, notes) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, notes } : i));
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  // Packaging calculations
  const totalCupsInOrder = cart
    .filter(item => item.containerType === 'cup')
    .reduce((sum, item) => sum + item.quantity, 0);

  const totalBoxesInOrder = cart
    .filter(item => item.containerType === 'box')
    .reduce((sum, item) => sum + item.quantity, 0);

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = (isDirectPaid = true) => {
    if (cart.length === 0) return;

    const newOrder = {
      table: orderType === 'Takeaway' ? `Takeaway #${Math.floor(Math.random() * 80 + 10)}` : tableNumber,
      waiter: waiterName,
      type: orderType,
      status: 'Pending', // Sent to kitchen
      paymentStatus: isDirectPaid ? 'Paid' : 'Unpaid',
      paymentMethod: paymentMethod,
      items: [...cart],
      totalAmount,
      cupsCount: totalCupsInOrder,
      boxesCount: totalBoxesInOrder
    };

    onPlaceOrder(newOrder);

    setOrderSuccess({
      table: newOrder.table,
      total: totalAmount,
      cups: totalCupsInOrder,
      boxes: totalBoxesInOrder,
      paid: isDirectPaid
    });

    setCart([]);
    setTimeout(() => setOrderSuccess(null), 5000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Success Notification Banner */}
      {orderSuccess && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-emerald-900 shadow-md animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="font-bold">
                Order sent to Kitchen successfully! ({orderSuccess.table})
              </p>
              <p className="text-xs text-emerald-700">
                Amount: <span className="font-semibold">{orderSuccess.total} ETB</span> • 
                Registered: <span className="font-semibold">{orderSuccess.cups} Cups</span> & <span className="font-semibold">{orderSuccess.boxes} Boxes</span>
              </p>
            </div>
          </div>
          <span className="text-xs bg-emerald-200 text-emerald-800 px-2.5 py-1 rounded-full font-semibold">
            {orderSuccess.paid ? 'Payment Recorded' : 'Sent to Tab'}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Columns: Interactive Menu & Item Selection */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat === 'All' ? '🌟 All Items' : cat === 'Juices' ? '🥤 Fresh Juices' : cat === 'Smoothies' ? '🥬 Smoothies' : '🥗 Salads & Bowls'}
              </button>
            ))}
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {filteredMenu.map(item => {
              const inCartItem = cart.find(i => i.id === item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer select-none flex flex-col justify-between group hover:shadow-lg ${
                    inCartItem ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20' : 'border-slate-200 hover:border-emerald-400'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-3xl p-2 bg-slate-50 rounded-xl group-hover:scale-110 transition-transform">
                        {item.image}
                      </span>
                      {/* Packaging Badge */}
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        item.containerType === 'cup' 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {item.containerType === 'cup' ? '🥤 1 Cup' : '🥡 1 Box'}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-emerald-700 transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-base font-extrabold text-slate-900">
                      {item.price} <span className="text-xs font-semibold text-slate-500">ETB</span>
                    </span>

                    {inCartItem ? (
                      <span className="bg-emerald-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                        Added: {inCartItem.quantity}
                      </span>
                    ) : (
                      <button className="text-xs bg-slate-100 text-slate-700 font-semibold px-2.5 py-1 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        + Add
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 5 Columns: Live Ticket & Cashier Order Cart */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col sticky top-24">
          {/* Header Controls: Table / Waiter */}
          <div className="p-4 bg-slate-900 text-white border-b border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                New Order Ticket
              </span>
              <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
                <button
                  onClick={() => setOrderType('Dine-In')}
                  className={`px-2.5 py-1 rounded-md font-semibold ${
                    orderType === 'Dine-In' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Dine-In
                </button>
                <button
                  onClick={() => setOrderType('Takeaway')}
                  className={`px-2.5 py-1 rounded-md font-semibold ${
                    orderType === 'Takeaway' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Takeaway
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {orderType === 'Dine-In' ? (
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold">Table</label>
                  <select
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="w-full mt-0.5 bg-slate-800 text-white border border-slate-700 rounded-lg px-2.5 py-1.5 font-medium focus:ring-1 focus:ring-emerald-400 outline-none"
                  >
                    <option value="Table 1">Table 1 (Indoor)</option>
                    <option value="Table 2">Table 2 (Window)</option>
                    <option value="Table 3">Table 3 (Patio)</option>
                    <option value="Table 4">Table 4 (Bar)</option>
                    <option value="Table 5">Table 5 (Corner)</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold">Takeaway Tag</label>
                  <div className="mt-0.5 bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 font-medium">
                    Auto Takeaway Ticket
                  </div>
                </div>
              )}

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-semibold">Server / Waiter</label>
                <select
                  value={waiterName}
                  onChange={(e) => setWaiterName(e.target.value)}
                  className="w-full mt-0.5 bg-slate-800 text-white border border-slate-700 rounded-lg px-2.5 py-1.5 font-medium focus:ring-1 focus:ring-emerald-400 outline-none"
                >
                  <option value="Abebe">Abebe (Waiter #1)</option>
                  <option value="Sara">Sara (Cashier)</option>
                  <option value="Dawit">Dawit (Waiter #2)</option>
                  <option value="Helen">Helen (Barista)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="p-4 flex-1 overflow-y-auto max-h-[340px] space-y-3">
            {cart.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <ShoppingBag className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
                <p className="text-sm font-medium">No items added yet</p>
                <p className="text-xs text-slate-400">Click items on the left to start an order</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{item.image}</span>
                        <span className="text-xs font-bold text-slate-900">{item.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {item.containerType === 'cup' ? '🥤 Juice Cup' : '🥡 Food Box'} • {item.price} ETB each
                      </span>
                    </div>

                    <span className="text-xs font-extrabold text-slate-900 whitespace-nowrap">
                      {item.price * item.quantity} ETB
                    </span>
                  </div>

                  {/* Quantity & Notes Bar */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
                    <input
                      type="text"
                      placeholder="Kitchen note (e.g. no sugar, extra lime)..."
                      value={item.notes}
                      onChange={(e) => updateNotes(item.id, e.target.value)}
                      className="text-[11px] bg-white border border-slate-200 rounded px-2 py-1 flex-1 text-slate-700 outline-none focus:border-emerald-500"
                    />

                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-5 h-5 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold px-1.5 min-w-[18px] text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-5 h-5 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="w-5 h-5 flex items-center justify-center text-rose-500 hover:bg-rose-50 rounded ml-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Packaging Audit Tracker inside Cart */}
          {cart.length > 0 && (
            <div className="px-4 py-2.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-700">
              <span className="font-semibold text-slate-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-emerald-600" />
                Physical Containers to Deduct:
              </span>
              <div className="flex items-center gap-3">
                <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                  🥤 {totalCupsInOrder} Cups
                </span>
                <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                  🥡 {totalBoxesInOrder} Boxes
                </span>
              </div>
            </div>
          )}

          {/* Payment Method Selector & Totals */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
            {/* Payment Method Selector */}
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Payment Channel
              </label>
              <div className="grid grid-cols-4 gap-1.5 mt-1">
                {['Cash', 'Telebirr', 'CBE Birr', 'Card'].map(m => (
                  <button
                    key={m}
                    onClick={() => setPaymentMethod(m)}
                    className={`py-1.5 px-1 text-[11px] font-bold rounded-lg border text-center transition-all ${
                      paymentMethod === m
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Total Row */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-sm font-semibold text-slate-600">Total Due:</span>
              <span className="text-2xl font-black text-slate-950">
                {totalAmount.toLocaleString()} <span className="text-sm font-bold text-slate-500">ETB</span>
              </span>
            </div>

            {/* Order Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                disabled={cart.length === 0}
                onClick={() => handleCheckout(false)}
                className="w-full py-2.5 px-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send to Kitchen</span>
              </button>

              <button
                disabled={cart.length === 0}
                onClick={() => handleCheckout(true)}
                className="w-full py-2.5 px-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 shadow-md shadow-emerald-700/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition-colors"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Pay & Send ({paymentMethod})</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
