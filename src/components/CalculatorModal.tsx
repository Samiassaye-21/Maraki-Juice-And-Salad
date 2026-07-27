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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1C2E0A]/40 backdrop-blur-md outline-none"
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
        className="w-full max-w-[360px] bg-[#F6F1E3] rounded-[32px] p-6 shadow-2xl flex flex-col gap-5 border-2 border-[#C5D89A]"
      >
        {/* Header with Title and Close */}
        <div className="flex items-center justify-between px-1 text-[#2B4A18]">
          <span className="text-sm font-bold uppercase tracking-widest">{title}</span>
          <button onClick={onClose} className="p-1.5 hover:bg-[#C5D89A]/50 rounded-full transition-colors">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Display Screen */}
        <div className="bg-[#2B4A18] rounded-2xl h-28 flex items-end justify-end p-5 shadow-[inset_0_4px_16px_rgba(0,0,0,0.4)] border border-[#1C2E0A]">
          <span className="text-[#F6F1E3] text-[54px] leading-none font-mono tracking-tighter font-semibold overflow-hidden">
            {display}
          </span>
        </div>

        {/* Button Grid matching the user's exact image layout but AVOCADO THEMED */}
        <div className="grid grid-cols-4 gap-3">
          {/* Row 1 (Operators - Mid Green) */}
          {['*', '/', '-', '+'].map((op) => (
            <button 
              key={op} onClick={() => handleOperator(op)}
              className="h-[64px] bg-[#4A7C2F] rounded-2xl text-[#F6F1E3] text-3xl font-black flex items-center justify-center border-b-4 border-[#2B4A18] active:border-b-0 active:translate-y-1 transition-all"
            >
              {op}
            </button>
          ))}

          {/* Row 2 (Numbers 9,8,7,6 - Cream/White) */}
          {['9', '8', '7', '6'].map((num) => (
            <button 
              key={num} onClick={() => handleDigit(num)}
              className="h-[64px] bg-white rounded-2xl text-[#2B4A18] text-3xl font-black flex items-center justify-center border-b-4 border-[#C5D89A] active:border-b-0 active:translate-y-1 transition-all"
            >
              {num}
            </button>
          ))}

          {/* Row 3 (Numbers 5,4,3,2 - Cream/White) */}
          {['5', '4', '3', '2'].map((num) => (
            <button 
              key={num} onClick={() => handleDigit(num)}
              className="h-[64px] bg-white rounded-2xl text-[#2B4A18] text-3xl font-black flex items-center justify-center border-b-4 border-[#C5D89A] active:border-b-0 active:translate-y-1 transition-all"
            >
              {num}
            </button>
          ))}

          {/* Row 4 (Numbers 1,0,. and Equal) */}
          {['1', '0', '.'].map((num) => (
            <button 
              key={num} onClick={num === '.' ? handleDot : () => handleDigit(num)}
              className="h-[64px] bg-white rounded-2xl text-[#2B4A18] text-3xl font-black flex items-center justify-center border-b-4 border-[#C5D89A] active:border-b-0 active:translate-y-1 transition-all"
            >
              {num}
            </button>
          ))}
          
          <button 
            onClick={handleEqual}
            className="h-[64px] bg-[#8DB55A] rounded-2xl text-[#1C2E0A] text-4xl font-black flex items-center justify-center border-b-4 border-[#4A7C2F] active:border-b-0 active:translate-y-1 transition-all"
          >
            =
          </button>

          {/* Row 5 (Clear button - Pit Brown) */}
          <button 
            onClick={handleClear}
            className="col-span-1 h-[64px] bg-[#7A4F2D] rounded-2xl text-[#F6F1E3] text-2xl font-black flex items-center justify-center border-b-4 border-[#4A2F1D] active:border-b-0 active:translate-y-1 transition-all shadow-sm"
          >
            C
          </button>
        </div>
      </motion.div>
    </div>
  );
};
