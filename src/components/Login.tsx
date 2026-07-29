import React, { useState } from 'react';
import { User, Lock, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginProps {
  onLoginSuccess: (token: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#2b3541] px-4 font-sans text-white">
      {/* Brand / Logo */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-16 mt-8 text-center flex flex-col items-center"
      >
        <img 
          src="/logo.jpg" 
          alt="Maraki Logo" 
          className="h-24 w-24 object-contain rounded-full shadow-lg mb-4 bg-white p-1"
          onError={(e) => {
             e.currentTarget.style.display = 'none';
          }}
        />
        <h1 className="text-[3.5rem] font-bold leading-none tracking-tight">Maraki</h1>
      </motion.div>

      {/* Login Form */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleSubmit}
        className="w-full max-w-[320px] flex flex-col gap-4"
      >
        {/* Username Input */}
        <div className="relative group">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5">
            <User className="h-[22px] w-[22px] text-[#db606e] transition-colors group-focus-within:text-[#e47683]" strokeWidth={1.5} />
          </div>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            required
            className="block w-full rounded-full bg-[#394553] py-4 pl-14 pr-4 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#db606e] transition-all"
          />
        </div>

        {/* Password Input */}
        <div className="relative group">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5">
            <Lock className="h-[22px] w-[22px] text-[#db606e] transition-colors group-focus-within:text-[#e47683]" strokeWidth={1.5} />
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="block w-full rounded-full bg-[#394553] py-4 pl-14 pr-4 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#db606e] transition-all"
          />
        </div>

        {/* Error Message */}
        {error && (
          <motion.p 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center text-sm font-medium text-red-400"
          >
            {error}
          </motion.p>
        )}

        {/* Forgot Password */}
        <div className="text-center mt-2 mb-8">
          <a href="#" className="text-sm text-gray-300 hover:text-white transition-colors">
            Forgot password?
          </a>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center rounded-full bg-[#cc5a68] py-4 text-lg font-medium text-white shadow-lg hover:bg-[#d66876] focus:outline-none focus:ring-2 focus:ring-[#db606e] focus:ring-offset-2 focus:ring-offset-[#2b3541] disabled:opacity-70 transition-all cursor-pointer"
        >
          {loading ? <Loader2 className="animate-spin w-6 h-6" /> : 'Log in'}
        </button>
        
      </motion.form>
    </div>
  );
};

export default Login;
