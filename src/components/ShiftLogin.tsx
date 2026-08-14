import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Delete, Moon, ArrowRight, ShieldCheck } from 'lucide-react';

interface ShiftLoginProps {
  onLoginSuccess: () => void;
}

const WORKER_PIN = '1234';

const ShiftLogin: React.FC<ShiftLoginProps> = ({ onLoginSuccess }) => {
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);
  const [errorMsg, setErrorMsg] = useState(false);

  const handleKey = (key: string) => {
    setPin((prevPin) => {
      if (prevPin.length >= 4) return prevPin;
      const next = prevPin + key;
      setErrorMsg(false);

      if (next.length === 4) {
        setTimeout(() => {
          if (next === WORKER_PIN) {
            onLoginSuccess();
          } else {
            setShake(true);
            setErrorMsg(true);
            setTimeout(() => {
              setShake(false);
              setPin('');
            }, 700);
          }
        }, 200);
      }
      return next;
    });
  };

  const handleDelete = () => {
    setPin((p) => p.slice(0, -1));
    setErrorMsg(false);
  };

  // Keyboard Event Listener for physical typing support
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKey(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Enter') {
        if (pin === WORKER_PIN) {
          onLoginSuccess();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin]);

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 font-sans bg-[#F4F8F5] text-[#07250D] relative"
    >
      {/* Top navigation shortcuts */}
      <div className="absolute top-6 right-6 flex items-center gap-3">
        <a
          href="/kitchen"
          className="text-xs font-bold px-4 py-2 rounded-full bg-white text-[#07250D] hover:bg-[#EBF5F0] transition-all border-2 border-[#07250D] flex items-center gap-1 shadow-xs"
        >
          <span>🍳 Kitchen</span>
        </a>
        <a
          href="/"
          className="text-xs font-bold px-4 py-2 rounded-full bg-white text-[#07250D] hover:bg-[#EBF5F0] transition-all border-2 border-[#07250D] flex items-center gap-1 shadow-xs"
        >
          <span>💻 Admin</span>
        </a>
      </div>

      {/* Header Badge */}
      <motion.div
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center mb-8 text-center"
      >
        <div className="w-20 h-20 rounded-full bg-[#07250D] flex items-center justify-center mb-4 shadow-xl text-[#13EE86]">
          <Moon className="w-10 h-10 text-[#13EE86]" />
        </div>
        
        <h1 className="text-3xl font-extrabold text-[#07250D] tracking-tight mb-1">
          ማራኪ የሸፍት ገቢ መመዝገቢያ
        </h1>
        <p className="text-sm font-bold text-[#238868] uppercase tracking-wider">
          Mobile Worker Shift Income Portal
        </p>
        <p className="text-xs text-neutral-600 font-medium mt-1 max-w-xs">
          ለሌሊትና ለቀን ሸፍት ሰራተኞች የገቢና የሽያጭ መመዝገቢያ
        </p>
      </motion.div>

      {/* PIN Dots */}
      <motion.div
        animate={shake ? { x: [0, -12, 12, -10, 10, -6, 6, 0] } : {}}
        transition={{ duration: 0.5 }}
        className="flex gap-4 mb-6"
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
              i < pin.length
                ? errorMsg
                  ? 'bg-rose-500 border-rose-400 scale-110'
                  : 'bg-[#13EE86] border-[#07250D] scale-110 shadow-xs'
                : 'bg-white border-[#238868]/40'
            }`}
          />
        ))}
      </motion.div>

      <AnimatePresence>
        {errorMsg && (
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-rose-600 text-sm font-bold mb-4"
          >
            ስህተት ቁጥር! (የስራ ባልደረባ ቁጥር 1234)
          </motion.p>
        )}
      </AnimatePresence>

      {/* Number Pad */}
      <div className="grid grid-cols-3 gap-3.5 w-full max-w-xs">
        {keys.map((key, idx) => {
          if (key === '') return <div key={idx} />;
          if (key === 'del') {
            return (
              <button
                key={idx}
                onClick={handleDelete}
                className="h-14 rounded-full bg-white hover:bg-rose-50 active:scale-95 transition-all duration-100 flex items-center justify-center cursor-pointer border-2 border-[#07250D] shadow-xs text-[#07250D]"
              >
                <Delete className="w-6 h-6 text-[#07250D]" />
              </button>
            );
          }
          return (
            <button
              key={idx}
              onClick={() => handleKey(key)}
              className="h-14 rounded-full bg-white hover:bg-[#EBF5F0] active:scale-95 transition-all duration-100 flex items-center justify-center cursor-pointer border-2 border-[#07250D] shadow-xs"
            >
              <span className="text-2xl font-extrabold text-[#07250D]">{key}</span>
            </button>
          );
        })}
      </div>

      {/* Quick Direct Pass Button */}
      <button
        onClick={onLoginSuccess}
        className="mt-8 flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#13EE86] text-[#07250D] text-xs font-extrabold transition-all shadow-md cursor-pointer hover:bg-[#10DF7D] active:scale-95"
      >
        <ShieldCheck className="w-4 h-4 text-[#07250D]" />
        <span>በቀጥታ ግባ (Quick Login: 1234)</span>
        <ArrowRight className="w-3.5 h-3.5 text-[#07250D]" />
      </button>
    </div>
  );
};

export default ShiftLogin;
