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
      className="min-h-screen flex flex-col items-center justify-center px-6 font-sans bg-[#F4F8F5] text-[#07250D]"
    >
      {/* Logo & Title */}
      <motion.div
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center mb-10 text-center"
      >
        <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center mb-4 shadow-md border-2 border-[#238868]/20 p-1">
          <img
            src="/logo.jpg"
            alt="Maraki"
            className="w-20 h-20 rounded-full object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>
        <h1 className="text-4xl font-extrabold text-[#07250D] tracking-wide mb-1">ማራኪ</h1>
        <p className="text-xl text-[#238868] font-extrabold uppercase tracking-wider">ኩሽና መዝግቢያ</p>
        <p className="text-sm font-semibold text-neutral-600 mt-1">Kitchen Order System</p>
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
            className="text-rose-600 text-sm font-bold mb-4 -mt-2"
          >
            ስህተት ቁጥር! እንደገና ሞክር
          </motion.p>
        )}
      </AnimatePresence>

      {/* Number Pad */}
      <div className="grid grid-cols-3 gap-3.5 w-full max-w-xs">
        {keys.map((key, idx) => {
          if (key === '') {
            return <div key={idx} />;
          }
          if (key === 'del') {
            return (
              <button
                key={idx}
                onClick={handleDelete}
                className="h-16 rounded-full bg-white hover:bg-rose-50 active:scale-95 transition-all duration-100 flex items-center justify-center cursor-pointer border-2 border-[#07250D] shadow-xs text-[#07250D]"
              >
                <Delete className="w-6 h-6 text-[#07250D]" />
              </button>
            );
          }
          return (
            <button
              key={idx}
              onClick={() => handleKey(key)}
              className="h-16 rounded-full bg-white hover:bg-[#EBF5F0] active:scale-95 transition-all duration-100 flex items-center justify-center cursor-pointer border-2 border-[#07250D] shadow-xs"
            >
              <span className="text-2xl font-extrabold text-[#07250D]">{key}</span>
            </button>
          );
        })}
      </div>

      <p className="mt-8 text-neutral-600 text-xs font-semibold text-center">
        የምስጢር ቁጥርዎን ያስገቡ
      </p>
    </div>
  );
};

export default KitchenLogin;
