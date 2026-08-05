import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Delete } from 'lucide-react';

interface KitchenLoginProps {
  onLoginSuccess: () => void;
}

const CHEF_PIN = '0102';

const KitchenLogin: React.FC<KitchenLoginProps> = ({ onLoginSuccess }) => {
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
        if (next === CHEF_PIN) {
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
      style={{ background: 'linear-gradient(160deg, #1a2a3a 0%, #0f1f2e 100%)' }}
      className="min-h-screen flex flex-col items-center justify-center px-6 font-sans"
    >
      {/* Logo & Title */}
      <motion.div
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center mb-12"
      >
        <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mb-6 shadow-lg border border-white/20">
          <img
            src="/logo.jpg"
            alt="Maraki"
            className="w-20 h-20 rounded-full object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <span className="text-5xl" style={{ display: 'none' }}>🍽️</span>
        </div>
        {/* Amharic: "Maraki Kitchen" */}
        <h1 className="text-4xl font-bold text-white tracking-wide mb-1">ማራኪ</h1>
        <p className="text-xl text-orange-300 font-semibold">ኩሽና መዝግቢያ</p>
        <p className="text-sm text-white/40 mt-2">Kitchen Order System</p>
      </motion.div>

      {/* PIN Dots */}
      <motion.div
        animate={shake ? { x: [0, -12, 12, -10, 10, -6, 6, 0] } : {}}
        transition={{ duration: 0.5 }}
        className="flex gap-4 mb-10"
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
              i < pin.length
                ? errorMsg
                  ? 'bg-red-500 border-red-400 scale-110'
                  : 'bg-orange-400 border-orange-300 scale-110'
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
            className="text-red-400 text-lg font-semibold mb-6 -mt-4"
          >
            {/* Amharic: "Wrong PIN" */}
            ስህተት ቁጥር! እንደገና ሞክር
          </motion.p>
        )}
      </AnimatePresence>

      {/* Number Pad */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
        {keys.map((key, idx) => {
          if (key === '') {
            return <div key={idx} />;
          }
          if (key === 'del') {
            return (
              <button
                key={idx}
                onClick={handleDelete}
                className="h-20 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all duration-100 flex items-center justify-center cursor-pointer border border-white/10"
              >
                <Delete className="w-7 h-7 text-white/70" />
              </button>
            );
          }
          return (
            <button
              key={idx}
              onClick={() => handleKey(key)}
              className="h-20 rounded-2xl bg-white/10 hover:bg-orange-500/30 active:scale-95 transition-all duration-100 flex items-center justify-center cursor-pointer border border-white/10"
            >
              <span className="text-3xl font-bold text-white">{key}</span>
            </button>
          );
        })}
      </div>

      {/* Amharic instruction */}
      <p className="mt-10 text-white/30 text-sm text-center">
        የምስጢር ቁጥርዎን ያስገቡ
      </p>
    </div>
  );
};

export default KitchenLogin;
