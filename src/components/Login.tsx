import React, { useState } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginProps {
  onLoginSuccess: (token: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Hardcoded simple authentication
    setTimeout(() => {
      if (password === 'maraki2026') {
        onLoginSuccess('authenticated_' + Date.now());
      } else {
        setError('Incorrect password. Please try again.');
      }
      setLoading(false);
    }, 600); // Fake network delay for UX
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f7f5f0] px-4 font-sans text-[#0B1D2C]">
      {/* Brand / Logo */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 mt-8 text-center flex flex-col items-center"
      >
        <img 
          src="/logo.jpg" 
          alt="Maraki Logo" 
          className="h-24 w-24 object-contain rounded-full shadow-md mb-4 bg-white p-1 border-2 border-[#0B1D2C]/20"
          onError={(e) => {
             e.currentTarget.style.display = 'none';
          }}
        />
        <h1 className="text-4xl font-extrabold leading-none tracking-tight text-white font-bold">Maraki</h1>
        <p className="text-sm font-bold text-[#0B1D2C] mt-2 uppercase tracking-wider">Admin Dashboard System</p>
      </motion.div>

      {/* Login Form */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleSubmit}
        className="w-full max-w-[360px] flex flex-col gap-4 bg-white p-7 rounded-3xl border border-[#0B1D2C]/20 shadow-xl"
      >
        {/* Password Input */}
        <div className="relative group">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5">
            <Lock className="h-5 w-5 text-[#0B1D2C] transition-colors" strokeWidth={2} />
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="block w-full rounded-full bg-white border border-[#0B1D2C]/30 py-3.5 pl-14 pr-4 text-[#0B1D2C] placeholder-neutral-400 focus:outline-none focus:border-[#0B1D2C] focus:ring-4 focus:ring-[#0B1D2C]/20 transition-all text-sm font-medium shadow-xs"
          />
        </div>

        {/* Error Message */}
        {error && (
          <motion.p 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center text-xs font-bold text-rose-600"
          >
            {error}
          </motion.p>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center rounded-full bg-[#0B1D2C] hover:bg-[#081521] py-3.5 text-base font-extrabold text-white font-bold shadow-md hover:shadow-lg disabled:opacity-70 transition-all cursor-pointer mt-2 active:scale-95"
        >
          {loading ? <Loader2 className="animate-spin w-5 h-5 text-white font-bold" /> : 'Log in'}
        </button>
        
        {/* Quick Portal Switchers */}
        <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-[#0B1D2C]/15">
          <a
            href="/shift"
            className="text-xs font-bold py-3 px-4 rounded-full bg-white text-[#0B1D2C] border-2 border-[#0B1D2C] hover:bg-[#f7f5f0] transition-all flex items-center justify-center gap-1.5 shadow-xs active:scale-95"
          >
            <span>🌙 Mobile Shift App</span>
          </a>
          <a
            href="/kitchen"
            className="text-xs font-bold py-3 px-4 rounded-full bg-white text-[#0B1D2C] border-2 border-[#0B1D2C] hover:bg-[#f7f5f0] transition-all flex items-center justify-center gap-1.5 shadow-xs active:scale-95"
          >
            <span>🍳 Kitchen App</span>
          </a>
        </div>
      </motion.form>
    </div>
  );
};

export default Login;
