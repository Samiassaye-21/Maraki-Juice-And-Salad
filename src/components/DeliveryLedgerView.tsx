import React, { useState } from 'react';
import { 
  Truck, 
  Plus, 
  CheckCircle2, 
  Search, 
  Trash2,
  Pencil,
  X,
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DeliveryAccountRecord, ShiftType, RestaurantSystemConfig } from '../types';
import { formatCurrency, cleanNumberInput, cleanStringNumberInput, handleInputFocus } from '../utils/shiftUtils';

interface DeliveryLedgerViewProps {
  deliveryRecords: DeliveryAccountRecord[];
  onAddDeliveryRecord: (del: Omit<DeliveryAccountRecord, 'id' | 'isSettledWeekly'>) => void;
  onUpdateDeliveryRecord?: (updated: DeliveryAccountRecord) => void;
  onSettleDeliveryRecord: (id: string) => void;
  onDeleteDeliveryRecord: (id: string) => void;
  currencySymbol: string;
  config?: RestaurantSystemConfig;
}

export const DeliveryLedgerView: React.FC<DeliveryLedgerViewProps> = ({
  deliveryRecords,
  onAddDeliveryRecord,
  onUpdateDeliveryRecord,
  onSettleDeliveryRecord,
  onDeleteDeliveryRecord,
  currencySymbol,
  config,
}) => {
  const defaultJuicePrice = config?.defaultJuiceUnitPrice || 170;
  const defaultFoodPrice = config?.defaultFoodUnitPrice || 220;

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'unsettled' | 'settled' | 'all'>('unsettled');

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deliveryRiderName, setDeliveryRiderName] = useState('');
  const [description, setDescription] = useState('');
  const [juiceCupsCount, setJuiceCupsCount] = useState(0);
  const [foodTakeawaysCount, setFoodTakeawaysCount] = useState(1);
  const [selectedFoodItemId, setSelectedFoodItemId] = useState<string>('');
  const [amount, setAmount] = useState((1 * defaultFoodPrice).toString());
  const [shiftType, setShiftType] = useState<ShiftType>('day');

  // Edit Modal State
  const [editingRecord, setEditingRecord] = useState<DeliveryAccountRecord | null>(null);

  const handleJuiceCupsChange = (cups: number) => {
    const validCups = Math.max(0, cups);
    setJuiceCupsCount(validCups);
    const selectedItem = config?.foodMenu?.find(m => m.id === selectedFoodItemId);
    const currentFoodPrice = selectedItem ? selectedItem.price : defaultFoodPrice;
    const calculated = (validCups * defaultJuicePrice) + (foodTakeawaysCount * currentFoodPrice);
    setAmount(calculated > 0 ? calculated.toString() : '');
  };

  const handleFoodBoxesChange = (boxes: number) => {
    const validBoxes = Math.max(0, boxes);
    setFoodTakeawaysCount(validBoxes);
    const selectedItem = config?.foodMenu?.find(m => m.id === selectedFoodItemId);
    const currentFoodPrice = selectedItem ? selectedItem.price : defaultFoodPrice;
    const calculated = (juiceCupsCount * defaultJuicePrice) + (validBoxes * currentFoodPrice);
    setAmount(calculated > 0 ? calculated.toString() : '');
  };

  const handleSelectFoodItem = (itemId: string) => {
    setSelectedFoodItemId(itemId);
    const item = config?.foodMenu?.find((m) => m.id === itemId);
    const foodCost = item ? item.price : defaultFoodPrice;
    const count = foodTakeawaysCount > 0 ? foodTakeawaysCount : (itemId ? 1 : 0);
    if (itemId && foodTakeawaysCount === 0) setFoodTakeawaysCount(1);
    
    const calc = (juiceCupsCount * defaultJuicePrice) + (count * foodCost);
    setAmount(calc > 0 ? calc.toString() : '');
    
    const descParts = [];
    if (juiceCupsCount > 0) descParts.push(`${juiceCupsCount} Juice${juiceCupsCount > 1 ? 's' : ''}`);
    if (item) descParts.push(`${count > 1 ? count + 'x ' : ''}${item.name}`);
    if (descParts.length > 0) setDescription(descParts.join(' + '));
  };

  const filtered = deliveryRecords.filter((rec) => {
    if (filterStatus === 'unsettled' && rec.isSettledWeekly) return false;
    if (filterStatus === 'settled' && !rec.isSettledWeekly) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchRider = rec.deliveryRiderName.toLowerCase().includes(term);
      const matchDesc = rec.description.toLowerCase().includes(term);
      if (!matchRider && !matchDesc) return false;
    }
    return true;
  });

  const totalUnsettled = deliveryRecords
    .filter((d) => !d.isSettledWeekly)
    .reduce((sum, d) => sum + d.amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) return;

    onAddDeliveryRecord({
      deliveryRiderName: deliveryRiderName.trim() || 'BeU Delivery Rider',
      description: description.trim() || 'Weekly Delivery Credit Orders',
      juiceCupsCount,
      foodTakeawaysCount,
      amount: numericAmount,
      date: new Date().toISOString().split('T')[0],
      shiftType,
    });

    setDeliveryRiderName('');
    setDescription('');
    setJuiceCupsCount(0);
    setFoodTakeawaysCount(0);
    setAmount('');
    setIsFormOpen(false);
  };

  const inputClasses = "w-full px-4 py-2.5 rounded-full border border-[#238868]/50 bg-[#07250D] text-white text-sm focus:outline-none focus:border-[#13EE86] transition-all placeholder:text-neutral-500";
  const labelClasses = "block text-xs font-medium text-neutral-300 uppercase tracking-wider mb-2";

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6 text-white">
      
      {/* HEADER CARD */}
      <div className="bg-[#238868]/20 rounded-3xl p-5 sm:p-6 border border-[#238868]/40 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="flex items-center space-x-4">
          <div className="p-3.5 rounded-full bg-[#238868]/40 text-[#13EE86] border border-[#238868]/60">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              Weekly Delivery Accounts
            </h2>
            <p className="text-sm font-medium text-neutral-300 mt-0.5">
              BeU, Deliver Addis & Feres delivery partner ledgers
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4 w-full sm:w-auto">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-medium uppercase tracking-widest text-neutral-300">
              Unsettled Balance
            </span>
            <span className="text-2xl font-extrabold text-[#13EE86]">
              {formatCurrency(totalUnsettled, currencySymbol)}
            </span>
          </div>
          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="px-5 py-2.5 bg-[#13EE86] hover:bg-[#13EE86]/90 text-[#07250D] font-bold rounded-full shadow-md transition-all flex items-center space-x-2 shrink-0 cursor-pointer text-sm"
          >
            <Plus className="w-5 h-5 text-[#07250D]" />
            <span>Add Delivery</span>
          </button>
        </div>
      </div>

      {/* FORM MODAL */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            className="overflow-hidden"
          >
            <div className="bg-[#238868]/20 border border-[#238868]/40 rounded-3xl p-5 sm:p-6 shadow-sm mb-6">
              <h3 className="text-base font-bold text-white mb-5 flex items-center space-x-2">
                <Plus className="w-5 h-5 text-[#13EE86]" />
                <span>Record Weekly Delivery Order Credit</span>
              </h3>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className={labelClasses}>Delivery Partner / Rider</label>
                    <input
                      type="text"
                      required
                      value={deliveryRiderName}
                      onChange={(e) => setDeliveryRiderName(e.target.value)}
                      placeholder="e.g. BeU Delivery"
                      className={inputClasses}
                    />
                  </div>

                  <div>
                    <label className={labelClasses}>Shift</label>
                    <select
                      value={shiftType}
                      onChange={(e) => setShiftType(e.target.value as ShiftType)}
                      className={inputClasses}
                    >
                      <option value="day">Day Shift</option>
                      <option value="night">Night Shift</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClasses}>Amount ({currencySymbol})</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={amount}
                      onFocus={handleInputFocus}
                      onChange={(e) => setAmount(cleanStringNumberInput(e))}
                      placeholder="0.00"
                      className={inputClasses}
                    />
                  </div>

                  <div>
                    <label className={labelClasses}>Description</label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g. 5 Meals + 2 Smoothies"
                      className={inputClasses}
                    />
                  </div>

                  <div>
                    <label className={labelClasses}>Juice Cups Used</label>
                    <input
                      type="number"
                      min="0"
                      value={juiceCupsCount}
                      onFocus={handleInputFocus}
                      onChange={(e) => handleJuiceCupsChange(cleanNumberInput(e))}
                      className={inputClasses}
                    />
                  </div>

                  <div>
                    <label className={labelClasses}>Select Food Dish</label>
                    <select
                      value={selectedFoodItemId}
                      onChange={(e) => handleSelectFoodItem(e.target.value)}
                      className={inputClasses}
                    >
                      <option value="">-- Standard Takeaway Container --</option>
                      {(config?.foodMenu || []).map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.price} ETB)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelClasses}>Food Containers Used</label>
                    <input
                      type="number"
                      min="0"
                      value={foodTakeawaysCount}
                      onFocus={handleInputFocus}
                      onChange={(e) => handleFoodBoxesChange(cleanNumberInput(e))}
                      className={inputClasses}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-5 py-2.5 bg-[#07250D] border border-[#238868] text-white hover:bg-[#238868]/30 font-bold text-xs rounded-full transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#13EE86] hover:bg-[#13EE86]/90 text-[#07250D] font-bold text-xs rounded-full shadow-md transition cursor-pointer"
                  >
                    Save Delivery Credit
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SEARCH & FILTERS */}
      <div className="bg-[#238868]/20 rounded-3xl p-4 border border-[#238868]/40 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-xs">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search delivery riders/companies..."
            className="w-full pl-10 pr-4 py-2 bg-[#07250D] border border-[#238868]/50 rounded-full text-sm text-white focus:outline-none focus:border-[#13EE86] placeholder:text-neutral-500"
          />
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
        </div>

        <div className="flex bg-[#07250D] p-1 rounded-full border border-[#238868]/40 text-xs font-medium w-full sm:w-auto">
          <button
            onClick={() => setFilterStatus('unsettled')}
            className={`px-4 py-1.5 rounded-full transition cursor-pointer flex-1 sm:flex-none font-bold ${filterStatus === 'unsettled' ? 'bg-[#13EE86] text-[#07250D]' : 'text-neutral-300 hover:text-white'}`}
          >
            Weekly Unsettled
          </button>
          <button
            onClick={() => setFilterStatus('settled')}
            className={`px-4 py-1.5 rounded-full transition cursor-pointer flex-1 sm:flex-none font-bold ${filterStatus === 'settled' ? 'bg-[#13EE86] text-[#07250D]' : 'text-neutral-300 hover:text-white'}`}
          >
            Settled Paid
          </button>
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-1.5 rounded-full transition cursor-pointer flex-1 sm:flex-none font-bold ${filterStatus === 'all' ? 'bg-[#13EE86] text-[#07250D]' : 'text-neutral-300 hover:text-white'}`}
          >
            All Logs
          </button>
        </div>
      </div>

      {/* LIST */}
      <div className="space-y-3.5">
        {filtered.length === 0 ? (
          <div className="bg-[#238868]/20 rounded-3xl p-12 text-center text-neutral-300 border border-[#238868]/40 flex flex-col items-center">
            <Truck className="w-12 h-12 text-neutral-400 mb-3" />
            <h3 className="text-base font-bold text-white">No delivery account logs</h3>
            <p className="text-xs text-neutral-300 mt-1">Try adjusting search term or status filter</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-3.5">
            {filtered.map((item, index) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className={`bg-[#238868]/20 rounded-3xl p-5 border border-[#238868]/40 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:border-[#13EE86]/50`}
              >
                
                <div className="flex items-start space-x-4">
                  <div className="p-3 rounded-full bg-[#238868]/40 text-[#13EE86] border border-[#238868]/60 shrink-0">
                    <Truck className="w-6 h-6" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center flex-wrap gap-2">
                      <h4 className="text-base font-bold text-white">
                        {item.deliveryRiderName}
                      </h4>
                      <span className="px-3 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#07250D] text-[#13EE86] border border-[#238868]/40">
                        {item.shiftType} SHIFT
                      </span>
                      {item.isSettledWeekly ? (
                        <span className="bg-[#238868]/40 text-[#13EE86] border border-[#238868] text-[10px] font-bold px-3 py-0.5 rounded-full uppercase">
                          WEEKLY SETTLED
                        </span>
                      ) : (
                        <span className="bg-[#13EE86] text-[#07250D] text-[10px] font-bold px-3 py-0.5 rounded-full uppercase">
                          UNSETTLED
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-neutral-300">
                      {item.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-400 font-medium">
                      <span>Date: {item.date}</span>
                      {item.juiceCupsCount > 0 && <span>• {item.juiceCupsCount} Cups</span>}
                      {item.foodTakeawaysCount > 0 && <span>• {item.foodTakeawaysCount} Takeaways</span>}
                      {item.isSettledWeekly && item.settledDate && (
                        <span className="text-[#13EE86] font-bold">• Settled on {item.settledDate}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4 self-end sm:self-center">
                  <span className="text-lg font-extrabold text-[#13EE86]">
                    {formatCurrency(item.amount, currencySymbol)}
                  </span>

                  <div className="flex items-center space-x-2">
                    {!item.isSettledWeekly ? (
                      <button
                        onClick={() => onSettleDeliveryRecord(item.id)}
                        className="px-4 py-2 bg-[#13EE86] hover:bg-[#13EE86]/90 text-[#07250D] font-bold text-xs rounded-full shadow-md flex items-center space-x-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[#07250D]" />
                        <span>Settle Payment</span>
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-[#13EE86] flex items-center space-x-1 px-2">
                        <CheckCircle2 className="w-4 h-4 text-[#13EE86]" />
                        <span>Settled</span>
                      </span>
                    )}

                    <button
                      onClick={() => setEditingRecord(JSON.parse(JSON.stringify(item)))}
                      className="p-2 text-neutral-300 hover:text-white hover:bg-[#238868]/30 rounded-full transition cursor-pointer"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDeleteDeliveryRecord(item.id)}
                      className="p-2 text-neutral-300 hover:text-white hover:bg-red-950/50 rounded-full transition cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* EDIT MODAL */}
      <AnimatePresence>
        {editingRecord && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#07250D]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#07250D] rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-[#238868]/50 space-y-4 text-white"
            >
              <div className="flex items-center justify-between border-b border-[#238868]/30 pb-4">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Pencil className="w-4 h-4 text-[#13EE86]" />
                  <span>Edit Delivery Credit Record</span>
                </h3>
                <button
                  onClick={() => setEditingRecord(null)}
                  className="p-2 text-neutral-400 hover:text-white hover:bg-[#238868]/30 rounded-full transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (onUpdateDeliveryRecord && editingRecord) {
                    onUpdateDeliveryRecord(editingRecord);
                  }
                  setEditingRecord(null);
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClasses}>Date</label>
                    <input
                      type="date"
                      required
                      value={editingRecord.date}
                      onChange={(e) => setEditingRecord({ ...editingRecord, date: e.target.value })}
                      className={inputClasses}
                    />
                  </div>

                  <div>
                    <label className={labelClasses}>Shift</label>
                    <select
                      value={editingRecord.shiftType}
                      onChange={(e) => setEditingRecord({ ...editingRecord, shiftType: e.target.value as ShiftType })}
                      className={inputClasses}
                    >
                      <option value="day">Day Shift</option>
                      <option value="night">Night Shift</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelClasses}>Delivery Partner / Rider</label>
                  <input
                    type="text"
                    required
                    value={editingRecord.deliveryRiderName}
                    onChange={(e) => setEditingRecord({ ...editingRecord, deliveryRiderName: e.target.value })}
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label className={labelClasses}>Description</label>
                  <input
                    type="text"
                    value={editingRecord.description}
                    onChange={(e) => setEditingRecord({ ...editingRecord, description: e.target.value })}
                    className={inputClasses}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={labelClasses}>Juice Cups</label>
                    <input
                      type="number"
                      min="0"
                      value={editingRecord.juiceCupsCount}
                      onFocus={handleInputFocus}
                      onChange={(e) => {
                        const cups = cleanNumberInput(e);
                        const calculated = (cups * defaultJuicePrice) + (editingRecord.foodTakeawaysCount * defaultFoodPrice);
                        setEditingRecord({
                          ...editingRecord,
                          juiceCupsCount: cups,
                          amount: calculated > 0 ? calculated : editingRecord.amount,
                        });
                      }}
                      className={inputClasses}
                    />
                  </div>

                  <div>
                    <label className={labelClasses}>Takeaways</label>
                    <input
                      type="number"
                      min="0"
                      value={editingRecord.foodTakeawaysCount}
                      onFocus={handleInputFocus}
                      onChange={(e) => {
                        const boxes = cleanNumberInput(e);
                        const calculated = (editingRecord.juiceCupsCount * defaultJuicePrice) + (boxes * defaultFoodPrice);
                        setEditingRecord({
                          ...editingRecord,
                          foodTakeawaysCount: boxes,
                          amount: calculated > 0 ? calculated : editingRecord.amount,
                        });
                      }}
                      className={inputClasses}
                    />
                  </div>

                  <div>
                    <label className={labelClasses}>Amount</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editingRecord.amount}
                      onFocus={handleInputFocus}
                      onChange={(e) => setEditingRecord({ ...editingRecord, amount: cleanNumberInput(e) })}
                      className={inputClasses}
                    />
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end space-x-3 border-t border-[#238868]/30">
                  <button
                    type="button"
                    onClick={() => setEditingRecord(null)}
                    className="px-5 py-2.5 bg-[#07250D] border border-[#238868] text-white hover:bg-[#238868]/30 font-bold text-xs rounded-full cursor-pointer transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#13EE86] hover:bg-[#13EE86]/90 text-[#07250D] font-bold text-xs rounded-full shadow-md cursor-pointer flex items-center space-x-1.5 transition"
                  >
                    <Save className="w-4 h-4 text-[#07250D]" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default DeliveryLedgerView;
