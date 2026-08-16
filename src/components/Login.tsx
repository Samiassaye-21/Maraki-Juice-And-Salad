import React, { useState } from 'react';
import { Lock, Loader2, Eye, EyeOff, Sparkles, Moon, ChefHat, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginProps {
  onLoginSuccess: (token: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    }, 400);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f7f5f0] px-4 py-8 font-sans text-[#0B1D2C] relative">
      {/* Brand / Logo */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8 text-center flex flex-col items-center"
      >
        <div className="relative mb-3">
          <img 
            src="/logo.jpg" 
            alt="Maraki Logo" 
            className="h-24 w-24 object-contain rounded-full shadow-lg bg-white p-1 border-2 border-[#0B1D2C]/20"
            onError={(e) => {
               e.currentTarget.style.display = 'none';
            }}
          />
          <div className="absolute -bottom-1 -right-1 bg-[#0B1D2C] text-white p-1.5 rounded-full shadow-md border-2 border-white">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#0B1D2C]">
          ማራኪ <span className="font-extrabold text-[#0B1D2C]/80">• Maraki</span>
        </h1>
        <p className="text-xs font-black text-[#0B1D2C]/70 uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#0B1D2C]" />
          <span>Admin Dashboard System</span>
        </p>
      </motion.div>

      {/* Login Card */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        onSubmit={handleSubmit}
        className="w-full max-w-[380px] flex flex-col gap-4 bg-white p-7 sm:p-8 rounded-3xl border-2 border-[#0B1D2C]/20 shadow-2xl"
      >
        <div className="text-center pb-1">
          <h2 className="text-lg font-black text-[#0B1D2C]">Sign In to Admin</h2>
          <p className="text-xs text-neutral-500 font-medium mt-0.5">Enter password to manage shifts & finances</p>
        </div>

        {/* Password Input */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4.5">
            <Lock className="h-5 w-5 text-[#0B1D2C]/70" strokeWidth={2.2} />
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password..."
            required
            autoFocus
            className="block w-full rounded-full bg-white border-2 border-[#0B1D2C]/30 py-3.5 pl-12 pr-12 text-[#0B1D2C] font-bold text-sm placeholder:text-neutral-400 focus:outline-none focus:border-[#0B1D2C] focus:ring-4 focus:ring-[#0B1D2C]/15 transition-all shadow-xs"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-4 text-[#0B1D2C]/60 hover:text-[#0B1D2C] cursor-pointer transition-colors"
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -6 }} 
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-xs font-black text-rose-700 bg-rose-50 border border-rose-200 py-2.5 px-3 rounded-2xl"
          >
            {error}
          </motion.div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center rounded-full bg-[#0B1D2C] hover:bg-[#081521] py-4 text-sm font-black text-white shadow-lg hover:shadow-xl disabled:opacity-60 transition-all cursor-pointer mt-1 active:scale-95"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="animate-spin w-5 h-5 text-white" />
              <span>Verifying...</span>
            </div>
          ) : (
            <span>Log In to Dashboard →</span>
          )}
        </button>
        
        {/* Quick Portal Switchers */}
        <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-[#0B1D2C]/15">
          <p className="text-[10px] font-black uppercase tracking-wider text-neutral-500 text-center mb-0.5">
            Quick Worker Portals
          </p>
          <a
            href="/shift"
            className="text-xs font-extrabold py-3 px-4 rounded-full bg-[#f7f5f0] text-[#0B1D2C] border-2 border-[#0B1D2C]/30 hover:bg-[#0B1D2C] hover:text-white transition-all flex items-center justify-center gap-2 shadow-xs active:scale-95 group"
          >
            <Moon className="w-4 h-4 text-[#0B1D2C] group-hover:text-white transition-colors" />
            <span>Mobile Shift App</span>
          </a>
          <a
            href="/kitchen"
            className="text-xs font-extrabold py-3 px-4 rounded-full bg-[#f7f5f0] text-[#0B1D2C] border-2 border-[#0B1D2C]/30 hover:bg-[#0B1D2C] hover:text-white transition-all flex items-center justify-center gap-2 shadow-xs active:scale-95 group"
          >
            <ChefHat className="w-4 h-4 text-[#0B1D2C] group-hover:text-white transition-colors" />
            <span>Kitchen Order App</span>
          </a>
        </div>
      </motion.form>
    </div>
  );
};

export default Login;
