import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Delete, Sun, Moon, ArrowRight, ShieldCheck } from 'lucide-react';

interface ShiftLoginProps {
  onLoginSuccess: () => void;
}

const WORKER_PIN = '1234';

const ShiftLogin: React.FC<ShiftLoginProps> = ({ onLoginSuccess }) => {
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);
  const [errorMsg, setErrorMsg] = useState(false);

  const handleKey = (key: string) => {
    if (pin.length >= 4) return;
    const next = pin + key;
    setPin(next);
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
  };

  const handleDelete = () => {
    setPin((p) => p.slice(0, -1));
    setErrorMsg(false);
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  return (
    <div
      style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1e1b4b 100%)' }}
      className="min-h-screen flex flex-col items-center justify-center px-6 font-sans relative"
    >
      {/* Top navigation shortcuts */}
      <div className="absolute top-6 right-6 flex items-center gap-3">
        <a
          href="/kitchen"
          className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white/10 text-slate-300 hover:bg-white/20 transition-all border border-white/10 flex items-center gap-1"
        >
          <span>🍳 Kitchen</span>
        </a>
        <a
          href="/"
          className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white/10 text-slate-300 hover:bg-white/20 transition-all border border-white/10 flex items-center gap-1"
        >
          <span>💻 Admin</span>
        </a>
      </div>

      {/* Header Badge */}
      <motion.div
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center mb-10 text-center"
      >
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-5 shadow-xl shadow-indigo-500/30 border border-white/20 text-white">
          <Moon className="w-10 h-10 text-amber-300" />
        </div>
        
        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1">
          ማራኪ የሸፍት ገቢ መመዝገቢያ
        </h1>
        <p className="text-sm font-semibold text-indigo-300">
          Mobile Worker Shift Income Portal
        </p>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          ለሌሊትና ለቀን ሸፍት ሰራተኞች የገቢና የሽያጭ መመዝገቢያ
        </p>
      </motion.div>

      {/* PIN Dots */}
      <motion.div
        animate={shake ? { x: [0, -12, 12, -10, 10, -6, 6, 0] } : {}}
        transition={{ duration: 0.5 }}
        className="flex gap-4 mb-8"
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
              i < pin.length
                ? errorMsg
                  ? 'bg-red-500 border-red-400 scale-110'
                  : 'bg-indigo-400 border-indigo-300 scale-110'
                : 'bg-transparent border-white/30'
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
            className="text-red-400 text-sm font-semibold mb-4"
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
                className="h-16 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all duration-100 flex items-center justify-center cursor-pointer border border-white/10"
              >
                <Delete className="w-6 h-6 text-white/70" />
              </button>
            );
          }
          return (
            <button
              key={idx}
              onClick={() => handleKey(key)}
              className="h-16 rounded-2xl bg-white/10 hover:bg-indigo-500/40 active:scale-95 transition-all duration-100 flex items-center justify-center cursor-pointer border border-white/10"
            >
              <span className="text-2xl font-bold text-white">{key}</span>
            </button>
          );
        })}
      </div>

      {/* Quick Direct Pass Button for Convenience */}
      <button
        onClick={onLoginSuccess}
        className="mt-8 flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600/60 hover:bg-indigo-600 text-white text-xs font-bold transition-all border border-indigo-500/40 shadow-md cursor-pointer"
      >
        <ShieldCheck className="w-4 h-4 text-emerald-300" />
        <span>በቀጥታ ግባ (Quick Login: 1234)</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default ShiftLogin;
