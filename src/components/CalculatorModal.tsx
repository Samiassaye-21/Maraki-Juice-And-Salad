import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save } from 'lucide-react';

interface CalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (amount: number) => void;
  title: string;
  initialValue: number;
}

export const CalculatorModal: React.FC<CalculatorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  title,
  initialValue
}) => {
  const [display, setDisplay] = useState(initialValue.toString());
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDisplay(initialValue.toString());
      setPrevValue(null);
      setOperator(null);
      setWaitingForNewValue(true); // So that if they start typing, it clears the initial value
    }
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  const calculate = (a: number, b: number, op: string) => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return b === 0 ? 0 : a / b;
      default: return b;
    }
  };

  const handleDigit = (digit: string) => {
    if (waitingForNewValue) {
      setDisplay(digit);
      setWaitingForNewValue(false);
    } else {
      setDisplay(display === '0' && digit !== '.' ? digit : display + digit);
    }
  };

  const handleDot = () => {
    if (waitingForNewValue) {
      setDisplay('0.');
      setWaitingForNewValue(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  };

  const handleOperator = (nextOp: string) => {
    const inputValue = parseFloat(display);

    if (prevValue == null) {
      setPrevValue(inputValue);
    } else if (operator) {
      const result = calculate(prevValue, inputValue, operator);
      setDisplay(String(result));
      setPrevValue(result);
    }

    setWaitingForNewValue(true);
    setOperator(nextOp);
  };

  const handleEqual = () => {
    let finalResult = parseFloat(display);
    
    if (operator && prevValue != null) {
      finalResult = calculate(prevValue, finalResult, operator);
    }
    
    setDisplay(String(finalResult));
    setPrevValue(null);
    setOperator(null);
    setWaitingForNewValue(true);
    
    // Automatically save and close the modal
    onSave(finalResult || 0);
  };

  const handleClear = () => {
    setDisplay('0');
    setPrevValue(null);
    setOperator(null);
    setWaitingForNewValue(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const key = e.key;
    
    if (key >= '0' && key <= '9') {
      handleDigit(key);
    } else if (key === '.') {
      handleDot();
    } else if (key === '+' || key === '-' || key === '*' || key === '/') {
      handleOperator(key);
    } else if (key === 'Enter' || key === '=') {
      e.preventDefault();
      handleEqual();
    } else if (key === 'Escape') {
      onClose();
    } else if (key === 'Backspace' || key === 'Delete' || key === 'c' || key === 'C') {
      handleClear();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs outline-none"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      ref={(el) => {
        if (el) el.focus();
      }}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full max-w-[360px] bg-white rounded-3xl p-6 shadow-2xl flex flex-col gap-5 border border-[#238868]/20 text-[#07250D] font-sans"
      >
        {/* Header with Title and Close */}
        <div className="flex items-center justify-between px-1 text-[#07250D]">
          <span className="text-sm font-extrabold uppercase tracking-widest">{title}</span>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors cursor-pointer text-neutral-500 hover:text-[#07250D]">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Display Screen (#403c21 with #c9b197 Digits) */}
        <div className="bg-[#403c21] rounded-2xl h-28 flex items-end justify-end p-5 shadow-inner border border-[#c9b197]/40">
          <span className="text-[#c9b197] text-[54px] leading-none font-mono tracking-tighter font-extrabold overflow-hidden">
            {display}
          </span>
        </div>

        {/* Button Grid */}
        <div className="grid grid-cols-4 gap-3">
          {/* Row 1 (Operators - #403c21 with #c9b197 text) */}
          {['*', '/', '-', '+'].map((op) => (
            <button 
              key={op} onClick={() => handleOperator(op)}
              className="h-[60px] bg-[#403c21] hover:bg-[#33301a] rounded-full text-[#c9b197] text-3xl font-extrabold flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-xs"
            >
              {op}
            </button>
          ))}

          {/* Row 2 (Numbers 9,8,7,6) */}
          {['9', '8', '7', '6'].map((num) => (
            <button 
              key={num} onClick={() => handleDigit(num)}
              className="h-[60px] bg-white hover:bg-[#f7f5f0] rounded-full text-[#403c21] text-3xl font-extrabold flex items-center justify-center border-2 border-[#403c21] cursor-pointer transition-all active:scale-95 shadow-xs"
            >
              {num}
            </button>
          ))}

          {/* Row 3 (Numbers 5,4,3,2) */}
          {['5', '4', '3', '2'].map((num) => (
            <button 
              key={num} onClick={() => handleDigit(num)}
              className="h-[60px] bg-white hover:bg-[#f7f5f0] rounded-full text-[#403c21] text-3xl font-extrabold flex items-center justify-center border-2 border-[#403c21] cursor-pointer transition-all active:scale-95 shadow-xs"
            >
              {num}
            </button>
          ))}

          {/* Row 4 (Numbers 1,0,. and Equal) */}
          {['1', '0', '.'].map((num) => (
            <button 
              key={num} onClick={num === '.' ? handleDot : () => handleDigit(num)}
              className="h-[60px] bg-white hover:bg-[#f7f5f0] rounded-full text-[#403c21] text-3xl font-extrabold flex items-center justify-center border-2 border-[#403c21] cursor-pointer transition-all active:scale-95 shadow-xs"
            >
              {num}
            </button>
          ))}
          
          <button 
            onClick={handleEqual}
            className="h-[60px] bg-[#c9b197] hover:bg-[#bda387] rounded-full text-[#403c21] text-4xl font-extrabold flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-md"
          >
            =
          </button>

          {/* Row 5 (Clear button) */}
          <button 
            onClick={handleClear}
            className="col-span-1 h-[60px] bg-white hover:bg-[#f7f5f0] rounded-full text-[#403c21] border-2 border-[#403c21] text-2xl font-extrabold flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-xs"
          >
            C
          </button>
        </div>
      </motion.div>
    </div>
  );
};
