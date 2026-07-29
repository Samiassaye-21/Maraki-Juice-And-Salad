import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingCart, Plus, ChevronDown, ChevronUp, Trash2, 
  Calendar, Package, X, Save, AlertCircle
} from 'lucide-react';
import { PurchaseTrip, PurchaseTripItem, MaterialCatalogItem, MaterialUnit, MaterialCategory } from '../types';
import { DEFAULT_MATERIALS_CATALOG } from '../data/initialData';
import { formatCurrency, formatEthiopianFullDate } from '../utils/shiftUtils';

interface MarketPurchasesViewProps {
  purchaseTrips: PurchaseTrip[];
  onAddTrip: (trip: Omit<PurchaseTrip, 'id' | 'createdAt'>) => void;
  onDeleteTrip: (id: string) => void;
  currencySymbol: string;
}

const categoryColors: Record<MaterialCategory, string> = {
  fruits:    'bg-orange-100 text-orange-700',
  dairy:     'bg-blue-100 text-blue-700',
  kitchen:   'bg-yellow-100 text-yellow-700',
  packaging: 'bg-purple-100 text-purple-700',
  equipment: 'bg-slate-100 text-slate-700',
  other:     'bg-gray-100 text-gray-700',
};

const categoryLabels: Record<MaterialCategory, string> = {
  fruits: '🍋 Fruits', dairy: '🥛 Dairy & Base', kitchen: '🫙 Kitchen',
  packaging: '📦 Packaging', equipment: '⚙️ Equipment', other: '📌 Other',
};

const unitLabels: Record<MaterialUnit, string> = {
  kg: 'kg', liter: 'ltr', piece: 'pc', pack: 'pack', cylinder: 'cyl', box: 'box',
};

interface NewItem {
  materialId: string;
  itemName: string;
  category: MaterialCategory;
  unit: MaterialUnit;
  emoji: string;
  quantity: string;
  totalPrice: string;     // User enters total paid
  pricePerUnit: string;   // Auto-calculated
}

const EMPTY_ITEM: NewItem = {
  materialId: '', itemName: '', category: 'other', unit: 'kg',
  emoji: '📌', quantity: '', totalPrice: '', pricePerUnit: '',
};

export const MarketPurchasesView: React.FC<MarketPurchasesViewProps> = ({
  purchaseTrips,
  onAddTrip,
  onDeleteTrip,
  currencySymbol,
}) => {
  const today = new Date().toISOString().split('T')[0];
  const [showForm, setShowForm] = useState(false);
  const [tripDate, setTripDate] = useState(today);
  const [tripNotes, setTripNotes] = useState('');
  const [items, setItems] = useState<NewItem[]>([{ ...EMPTY_ITEM }]);
  const [expandedTrip, setExpandedTrip] = useState<string | null>(null);
  const [searchMat, setSearchMat] = useState('');

  const catalog = DEFAULT_MATERIALS_CATALOG;

  const filteredCatalog = catalog.filter(m =>
    m.name.toLowerCase().includes(searchMat.toLowerCase())
  );

  const selectMaterial = (index: number, mat: MaterialCatalogItem) => {
    setItems(prev => prev.map((item, i) =>
      i === index ? {
        ...item,
        materialId: mat.id,
        itemName: mat.name,
        category: mat.category,
        unit: mat.unit,
        emoji: mat.emoji,
      } : item
    ));
    setSearchMat('');
  };

  const updateItem = (index: number, field: keyof NewItem, value: string) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const updated = { ...item, [field]: value };
      // Auto-calculate
      if (field === 'totalPrice' || field === 'quantity') {
        const total = parseFloat(field === 'totalPrice' ? value : updated.totalPrice) || 0;
        const qty   = parseFloat(field === 'quantity'   ? value : updated.quantity)   || 0;
        updated.pricePerUnit = qty > 0 ? (total / qty).toFixed(2) : '';
      }
      if (field === 'pricePerUnit') {
        const ppu = parseFloat(value) || 0;
        const qty = parseFloat(updated.quantity) || 0;
        updated.totalPrice = qty > 0 ? (ppu * qty).toFixed(2) : '';
      }
      return updated;
    }));
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const addItemRow = () => {
    setItems(prev => [...prev, { ...EMPTY_ITEM }]);
  };

  const grandTotal = items.reduce((sum, it) => sum + (parseFloat(it.totalPrice) || 0), 0);

  const isFormValid = items.some(it => it.itemName.trim() && parseFloat(it.totalPrice) > 0 && parseFloat(it.quantity) > 0);

  const handleSave = () => {
    if (!isFormValid) return;
    const validItems = items.filter(it => it.itemName.trim() && parseFloat(it.totalPrice) > 0);
    const tripItems: Omit<PurchaseTripItem, 'id' | 'tripId'>[] = validItems.map(it => ({
      materialId: it.materialId || undefined,
      itemName: it.itemName,
      category: it.category,
      unit: it.unit,
      quantity: parseFloat(it.quantity) || 0,
      pricePerUnit: parseFloat(it.pricePerUnit) || 0,
      totalPrice: parseFloat(it.totalPrice) || 0,
    }));

    const tripId = 'trip-' + Date.now();
    const fullItems: PurchaseTripItem[] = tripItems.map((it, idx) => ({
      ...it,
      id: `ti-${Date.now()}-${idx}`,
      tripId,
    }));

    onAddTrip({
      date: tripDate,
      notes: tripNotes || undefined,
      items: fullItems,
      grandTotal,
    });

    // Reset
    setShowForm(false);
    setItems([{ ...EMPTY_ITEM }]);
    setTripNotes('');
    setTripDate(today);
  };

  // Group trips by week
  const totalThisWeek = (() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    return purchaseTrips
      .filter(t => new Date(t.date) >= weekStart)
      .reduce((sum, t) => sum + t.grandTotal, 0);
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Inventory Purchases</h2>
          <p className="text-sm text-slate-500 mt-0.5">Bulk buying — fruits, packaging & supplies</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          New Trip
        </button>
      </div>

      {/* This-week summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
          <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide">This Week</p>
          <p className="text-2xl font-bold text-orange-700 mt-1">{formatCurrency(totalThisWeek, currencySymbol)}</p>
          <p className="text-xs text-orange-500 mt-0.5">{purchaseTrips.filter(t => {
            const ws = new Date(); ws.setDate(ws.getDate() - ws.getDay());
            return new Date(t.date) >= ws;
          }).length} trips</p>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">All Time</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">
            {formatCurrency(purchaseTrips.reduce((s, t) => s + t.grandTotal, 0), currencySymbol)}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">{purchaseTrips.length} total trips</p>
        </div>
      </div>

      {/* Add Trip Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 300 }}
              className="bg-white w-full max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">New Purchase Trip</h3>
                    <p className="text-xs text-slate-400">Log bulk inventory purchase</p>
                  </div>
                </div>
                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
                {/* Date & Notes */}
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Trip Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="date"
                        value={tripDate}
                        onChange={e => setTripDate(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Notes (optional)</label>
                    <input
                      type="text"
                      value={tripNotes}
                      onChange={e => setTripNotes(e.target.value)}
                      placeholder="e.g. Weekly market run"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Items */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Items Purchased</label>
                  <div className="space-y-3">
                    {items.map((item, idx) => (
                      <div key={idx} className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-slate-50/50">
                        {/* Material selector */}
                        <div className="flex gap-2 items-start">
                          <div className="flex-1">
                            <div className="relative">
                              <input
                                type="text"
                                value={item.itemName || searchMat}
                                onChange={e => {
                                  if (!item.materialId) setSearchMat(e.target.value);
                                  if (item.materialId) {
                                    // Clear and allow re-type
                                    setItems(prev => prev.map((it, i) => i === idx ? { ...EMPTY_ITEM } : it));
                                    setSearchMat(e.target.value);
                                  }
                                }}
                                placeholder="Search or type item name..."
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              />
                              {/* Dropdown */}
                              {!item.materialId && searchMat.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 max-h-40 overflow-y-auto">
                                  {filteredCatalog.map(mat => (
                                    <button
                                      key={mat.id}
                                      onClick={() => selectMaterial(idx, mat)}
                                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-blue-50 text-left text-sm"
                                    >
                                      <span>{mat.emoji}</span>
                                      <span className="font-medium">{mat.name}</span>
                                      <span className="text-slate-400 text-xs ml-auto">{mat.unit}</span>
                                      {mat.lastPricePer && (
                                        <span className="text-xs text-orange-500">Last: {mat.lastPricePer} Br/{mat.unit}</span>
                                      )}
                                    </button>
                                  ))}
                                  {filteredCatalog.length === 0 && (
                                    <div
                                      className="px-3 py-2 text-sm text-slate-500 cursor-pointer hover:bg-slate-50"
                                      onClick={() => {
                                        setItems(prev => prev.map((it, i) => i === idx ? {
                                          ...it, itemName: searchMat, materialId: '', category: 'other', emoji: '📌',
                                        } : it));
                                        setSearchMat('');
                                      }}
                                    >
                                      ➕ Add "{searchMat}" as custom item
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            {item.materialId && (
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <span>{item.emoji}</span>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryColors[item.category]}`}>
                                  {categoryLabels[item.category]}
                                </span>
                              </div>
                            )}
                          </div>
                          {items.length > 1 && (
                            <button onClick={() => removeItem(idx)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg mt-0.5">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* Quantity, Unit, Total */}
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase">Quantity</label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={e => updateItem(idx, 'quantity', e.target.value)}
                              placeholder="0"
                              min="0"
                              className="w-full px-2 py-2 border border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase">Unit</label>
                            <select
                              value={item.unit}
                              onChange={e => updateItem(idx, 'unit', e.target.value)}
                              className="w-full px-2 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              {Object.entries(unitLabels).map(([k, v]) => (
                                <option key={k} value={k}>{v}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase">Total Paid (Br)</label>
                            <input
                              type="number"
                              value={item.totalPrice}
                              onChange={e => updateItem(idx, 'totalPrice', e.target.value)}
                              placeholder="0"
                              min="0"
                              className="w-full px-2 py-2 border border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        {/* Per-unit hint */}
                        {item.pricePerUnit && parseFloat(item.pricePerUnit) > 0 && (
                          <p className="text-xs text-slate-400">
                            = <strong className="text-slate-600">{parseFloat(item.pricePerUnit).toFixed(2)} Br</strong> per {unitLabels[item.unit]}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={addItemRow}
                    className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 text-sm hover:border-blue-400 hover:text-blue-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Another Item
                  </button>
                </div>

                {/* Grand Total */}
                {grandTotal > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-orange-700">Grand Total</span>
                    <span className="text-xl font-bold text-orange-700">{formatCurrency(grandTotal, currencySymbol)}</span>
                  </div>
                )}

                {!isFormValid && items.some(it => it.itemName) && (
                  <div className="flex items-center gap-2 text-amber-600 bg-amber-50 rounded-xl px-3 py-2.5 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    Please fill in quantity and total price for each item.
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-slate-100 px-6 py-4 flex gap-3 flex-shrink-0">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!isFormValid}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Save Trip — {formatCurrency(grandTotal, currencySymbol)}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trip List */}
      <div className="space-y-3">
        {purchaseTrips.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No purchase trips yet</p>
            <p className="text-sm mt-1">Tap "New Trip" to log your first inventory purchase</p>
          </div>
        )}
        {purchaseTrips.map(trip => {
          const isExpanded = expandedTrip === trip.id;
          return (
            <motion.div
              key={trip.id}
              layout
              className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden"
            >
              <div
                className="flex items-center justify-between px-4 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedTrip(isExpanded ? null : trip.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <ShoppingCart className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">
                      {trip.items.length} item{trip.items.length !== 1 ? 's' : ''} purchased
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatEthiopianFullDate(trip.date)} — {trip.date}
                    </p>
                    {trip.notes && <p className="text-xs text-slate-500 italic mt-0.5">{trip.notes}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-bold text-red-600">{formatCurrency(trip.grandTotal, currencySymbol)}</p>
                    <p className="text-[10px] text-slate-400">total spent</p>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-slate-100 overflow-hidden"
                  >
                    <div className="px-4 py-3 space-y-2 bg-slate-50/50">
                      {trip.items.map(item => (
                        <div key={item.id} className="flex items-center justify-between py-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{DEFAULT_MATERIALS_CATALOG.find(m => m.id === item.materialId)?.emoji || '📌'}</span>
                            <div>
                              <p className="text-sm font-medium text-slate-800">{item.itemName}</p>
                              <p className="text-xs text-slate-400">
                                {item.quantity} {unitLabels[item.unit]} × {item.pricePerUnit.toFixed(2)} Br/{unitLabels[item.unit]}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm font-semibold text-slate-700">{formatCurrency(item.totalPrice, currencySymbol)}</p>
                        </div>
                      ))}
                      <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                        <button
                          onClick={() => onDeleteTrip(trip.id)}
                          className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete trip
                        </button>
                        <p className="text-sm font-bold text-slate-800">
                          Total: {formatCurrency(trip.grandTotal, currencySymbol)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default MarketPurchasesView;
