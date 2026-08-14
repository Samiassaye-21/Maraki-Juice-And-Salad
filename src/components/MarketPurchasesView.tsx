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
  fruits:    'bg-[#238868]/40 text-[#13EE86] border border-[#238868]',
  dairy:     'bg-[#238868]/40 text-[#13EE86] border border-[#238868]',
  kitchen:   'bg-[#238868]/40 text-[#13EE86] border border-[#238868]',
  packaging: 'bg-[#238868]/40 text-[#13EE86] border border-[#238868]',
  equipment: 'bg-[#238868]/40 text-[#13EE86] border border-[#238868]',
  other:     'bg-[#238868]/40 text-[#13EE86] border border-[#238868]',
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
    <div className="space-y-6 text-[#07250D] font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-[#07250D]">Inventory Purchases</h2>
          <p className="text-sm font-medium text-neutral-600 mt-0.5">Bulk buying — fruits, packaging & supplies</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#13EE86] hover:bg-[#10DF7D] text-[#07250D] rounded-full font-extrabold text-sm shadow-md transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4 text-[#07250D]" />
          <span>New Trip</span>
        </button>
      </div>

      {/* This-week summary (Deep Navy Hero Style) */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#0B1D28] border border-[#238868]/40 rounded-3xl p-5 shadow-2xl text-white">
          <p className="text-xs font-extrabold text-neutral-400 uppercase tracking-wide">This Week</p>
          <p className="text-2xl font-extrabold text-[#13EE86] mt-1">{formatCurrency(totalThisWeek, currencySymbol)}</p>
          <p className="text-xs text-neutral-300 font-medium mt-0.5">{purchaseTrips.filter(t => {
            const ws = new Date(); ws.setDate(ws.getDate() - ws.getDay());
            return new Date(t.date) >= ws;
          }).length} trips</p>
        </div>
        <div className="bg-white border border-[#238868]/20 rounded-3xl p-5 shadow-xs text-[#0B1D28]">
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-wide">All Time</p>
          <p className="text-2xl font-extrabold text-[#0B1D28] mt-1">
            {formatCurrency(purchaseTrips.reduce((s, t) => s + t.grandTotal, 0), currencySymbol)}
          </p>
          <p className="text-xs text-neutral-500 font-medium mt-0.5">{purchaseTrips.length} total trips</p>
        </div>
      </div>

      {/* Add Trip Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#07250D]/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 300 }}
              className="bg-white w-full max-w-2xl rounded-t-3xl sm:rounded-3xl border border-[#238868]/20 shadow-2xl flex flex-col max-h-[92vh] text-[#07250D]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-[#238868]/30 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#238868]/40 border border-[#238868]/60 rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-[#13EE86]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">New Purchase Trip</h3>
                    <p className="text-xs text-neutral-300">Log bulk inventory purchase</p>
                  </div>
                </div>
                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-[#238868]/30 rounded-full transition-colors cursor-pointer">
                  <X className="w-5 h-5 text-neutral-400" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
                {/* Date & Notes */}
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5 uppercase tracking-wide">Trip Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input
                        type="date"
                        value={tripDate}
                        onChange={e => setTripDate(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-[#238868]/50 bg-[#07250D] text-white rounded-full text-sm focus:outline-none focus:border-[#13EE86]"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5 uppercase tracking-wide">Notes (optional)</label>
                    <input
                      type="text"
                      value={tripNotes}
                      onChange={e => setTripNotes(e.target.value)}
                      placeholder="e.g. Weekly market run"
                      className="w-full px-4 py-2.5 border border-[#238868]/50 bg-[#07250D] text-white rounded-full text-sm focus:outline-none focus:border-[#13EE86] placeholder:text-neutral-500"
                    />
                  </div>
                </div>

                {/* Items */}
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-2 uppercase tracking-wide">Items Purchased</label>
                  <div className="space-y-3">
                    {items.map((item, idx) => (
                      <div key={idx} className="border border-[#238868]/40 rounded-3xl p-4 space-y-3 bg-[#238868]/20">
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
                                className="w-full px-4 py-2.5 border border-[#238868]/50 rounded-full text-sm focus:outline-none focus:border-[#13EE86] bg-[#07250D] text-white placeholder:text-neutral-500"
                              />
                              {/* Dropdown */}
                              {!item.materialId && searchMat.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-[#07250D] border border-[#238868] rounded-2xl shadow-xl z-10 max-h-40 overflow-y-auto">
                                  {filteredCatalog.map(mat => (
                                    <button
                                      key={mat.id}
                                      onClick={() => selectMaterial(idx, mat)}
                                      className="w-full flex items-center gap-2 px-4 py-2 hover:bg-[#238868]/30 text-left text-sm text-white cursor-pointer"
                                    >
                                      <span>{mat.emoji}</span>
                                      <span className="font-bold">{mat.name}</span>
                                      <span className="text-neutral-400 text-xs ml-auto">{mat.unit}</span>
                                      {mat.lastPricePer && (
                                        <span className="text-xs text-[#13EE86]">Last: {mat.lastPricePer} Br/{mat.unit}</span>
                                      )}
                                    </button>
                                  ))}
                                  {filteredCatalog.length === 0 && (
                                    <div
                                      className="px-4 py-2 text-sm text-neutral-300 cursor-pointer hover:bg-[#238868]/30"
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
                              <div className="flex items-center gap-1.5 mt-2">
                                <span>{item.emoji}</span>
                                <span className={`text-xs font-bold px-3 py-0.5 rounded-full ${categoryColors[item.category]}`}>
                                  {categoryLabels[item.category]}
                                </span>
                              </div>
                            )}
                          </div>
                          {items.length > 1 && (
                            <button onClick={() => removeItem(idx)} className="p-2 text-neutral-400 hover:text-white hover:bg-red-950/50 rounded-full mt-0.5 cursor-pointer">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* Quantity, Unit, Total */}
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[10px] font-medium text-neutral-300 mb-1 uppercase">Quantity</label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={e => updateItem(idx, 'quantity', e.target.value)}
                              placeholder="0"
                              min="0"
                              className="w-full px-3 py-2 border border-[#238868]/50 bg-[#07250D] text-white rounded-full text-sm text-center focus:outline-none focus:border-[#13EE86]"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium text-neutral-300 mb-1 uppercase">Unit</label>
                            <select
                              value={item.unit}
                              onChange={e => updateItem(idx, 'unit', e.target.value)}
                              className="w-full px-3 py-2 border border-[#238868]/50 bg-[#07250D] text-white rounded-full text-sm focus:outline-none focus:border-[#13EE86]"
                            >
                              {Object.entries(unitLabels).map(([k, v]) => (
                                <option key={k} value={k}>{v}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium text-neutral-300 mb-1 uppercase">Total Paid (Br)</label>
                            <input
                              type="number"
                              value={item.totalPrice}
                              onChange={e => updateItem(idx, 'totalPrice', e.target.value)}
                              placeholder="0"
                              min="0"
                              className="w-full px-3 py-2 border border-[#238868]/50 bg-[#07250D] text-white rounded-full text-sm text-center focus:outline-none focus:border-[#13EE86]"
                            />
                          </div>
                        </div>
                        {/* Per-unit hint */}
                        {item.pricePerUnit && parseFloat(item.pricePerUnit) > 0 && (
                          <p className="text-xs text-neutral-300">
                            = <strong className="text-[#13EE86]">{parseFloat(item.pricePerUnit).toFixed(2)} Br</strong> per {unitLabels[item.unit]}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={addItemRow}
                    className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-[#238868] rounded-full text-neutral-300 text-sm hover:border-[#13EE86] hover:text-[#13EE86] transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-[#13EE86]" />
                    Add Another Item
                  </button>
                </div>

                {/* Grand Total */}
                {grandTotal > 0 && (
                  <div className="bg-[#238868]/30 border border-[#13EE86]/50 rounded-2xl px-4 py-3 flex items-center justify-between">
                    <span className="text-sm font-bold text-white">Grand Total</span>
                    <span className="text-xl font-extrabold text-[#13EE86]">{formatCurrency(grandTotal, currencySymbol)}</span>
                  </div>
                )}

                {!isFormValid && items.some(it => it.itemName) && (
                  <div className="flex items-center gap-2 text-[#13EE86] bg-[#238868]/30 rounded-2xl px-3 py-2.5 text-sm border border-[#238868]">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#13EE86]" />
                    Please fill in quantity and total price for each item.
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-[#238868]/30 px-6 py-4 flex gap-3 flex-shrink-0">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 bg-[#07250D] border border-[#238868] text-white font-bold text-xs rounded-full hover:bg-[#238868]/30 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!isFormValid}
                  className="flex-1 py-3 bg-[#13EE86] hover:bg-[#13EE86]/90 disabled:opacity-40 text-[#07250D] rounded-full font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4 text-[#07250D]" />
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
          <div className="text-center py-16 text-neutral-600 bg-white border border-[#238868]/20 rounded-3xl shadow-xs">
            <Package className="w-12 h-12 mx-auto mb-3 text-[#238868] opacity-40" />
            <p className="font-extrabold text-[#07250D]">No purchase trips yet</p>
            <p className="text-sm mt-1 text-neutral-500 font-medium">Tap "New Trip" to log your first inventory purchase</p>
          </div>
        )}
        {purchaseTrips.map(trip => {
          const isExpanded = expandedTrip === trip.id;
          return (
            <motion.div
              key={trip.id}
              layout
              className="bg-white border border-[#238868]/20 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all text-[#07250D]"
            >
              <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-[#F4F8F5] transition-colors"
                onClick={() => setExpandedTrip(isExpanded ? null : trip.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#F4F8F5] border border-[#238868]/20 rounded-full flex items-center justify-center flex-shrink-0 text-[#238868]">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-extrabold text-[#07250D] text-sm">
                      {trip.items.length} item{trip.items.length !== 1 ? 's' : ''} purchased
                    </p>
                    <p className="text-xs text-neutral-600 font-medium mt-0.5">
                      {formatEthiopianFullDate(trip.date)} — {trip.date}
                    </p>
                    {trip.notes && <p className="text-xs text-neutral-500 italic mt-0.5">{trip.notes}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-extrabold text-[#238868]">{formatCurrency(trip.grandTotal, currencySymbol)}</p>
                    <p className="text-[10px] text-neutral-500 font-medium">total spent</p>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-neutral-500" /> : <ChevronDown className="w-4 h-4 text-neutral-500" />}
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-[#238868]/15 overflow-hidden"
                  >
                    <div className="px-5 py-4 space-y-2 bg-[#F4F8F5]">
                      {trip.items.map(item => (
                        <div key={item.id} className="flex items-center justify-between py-2 border-b border-[#238868]/15 last:border-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{DEFAULT_MATERIALS_CATALOG.find(m => m.id === item.materialId)?.emoji || '📌'}</span>
                            <div>
                              <p className="text-sm font-extrabold text-[#07250D]">{item.itemName}</p>
                              <p className="text-xs text-neutral-600 font-medium">
                                {item.quantity} {unitLabels[item.unit]} × {item.pricePerUnit.toFixed(2)} Br/{unitLabels[item.unit]}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm font-extrabold text-[#238868]">{formatCurrency(item.totalPrice, currencySymbol)}</p>
                        </div>
                      ))}
                      <div className="flex justify-between items-center pt-3 border-t border-[#238868]/15">
                        <button
                          onClick={() => onDeleteTrip(trip.id)}
                          className="text-xs text-neutral-600 hover:text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-full border border-[#238868]/20 transition-colors flex items-center gap-1 cursor-pointer font-bold"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete trip
                        </button>
                        <p className="text-sm font-extrabold text-[#07250D]">
                          Total: <span className="text-[#238868]">{formatCurrency(trip.grandTotal, currencySymbol)}</span>
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
