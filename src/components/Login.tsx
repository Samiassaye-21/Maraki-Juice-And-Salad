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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#07250D] px-4 font-sans text-white">
      {/* Brand / Logo */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 mt-8 text-center flex flex-col items-center"
      >
        <img 
          src="/logo.jpg" 
          alt="Maraki Logo" 
          className="h-24 w-24 object-contain rounded-full shadow-lg mb-4 bg-white p-1"
          onError={(e) => {
             e.currentTarget.style.display = 'none';
          }}
        />
        <h1 className="text-4xl font-bold leading-none tracking-tight text-white">Maraki</h1>
        <p className="text-sm font-medium text-[#13EE86] mt-2">Admin Dashboard System</p>
      </motion.div>

      {/* Login Form */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleSubmit}
        className="w-full max-w-[340px] flex flex-col gap-4 bg-[#238868]/20 p-6 rounded-3xl border border-[#238868]/40 shadow-xl"
      >
        {/* Password Input */}
        <div className="relative group">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5">
            <Lock className="h-5 w-5 text-[#13EE86] transition-colors" strokeWidth={2} />
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="block w-full rounded-full bg-[#07250D] border border-[#238868]/60 py-3.5 pl-14 pr-4 text-white placeholder-neutral-400 focus:outline-none focus:border-[#13EE86] transition-all text-sm font-medium"
          />
        </div>

        {/* Error Message */}
        {error && (
          <motion.p 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center text-xs font-semibold text-rose-400"
          >
            {error}
          </motion.p>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center rounded-full bg-[#13EE86] py-3.5 text-base font-bold text-[#07250D] shadow-md hover:bg-[#13EE86]/90 disabled:opacity-70 transition-all cursor-pointer mt-2"
        >
          {loading ? <Loader2 className="animate-spin w-5 h-5 text-[#07250D]" /> : 'Log in'}
        </button>
        
        {/* Quick Portal Switchers */}
        <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-[#238868]/30">
          <a
            href="/shift"
            className="text-xs font-medium py-2.5 px-4 rounded-full bg-[#07250D] text-white border border-[#238868] hover:bg-[#238868]/30 transition-all flex items-center justify-center gap-1.5"
          >
            <span>🌙 Mobile Shift App</span>
          </a>
          <a
            href="/kitchen"
            className="text-xs font-medium py-2.5 px-4 rounded-full bg-[#07250D] text-white border border-[#238868] hover:bg-[#238868]/30 transition-all flex items-center justify-center gap-1.5"
          >
            <span>🍳 Kitchen App</span>
          </a>
        </div>
      </motion.form>
    </div>
  );
};

export default Login;
