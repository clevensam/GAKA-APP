
import React, { useState } from 'react';
import { supabase } from '../App';

const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    }
    // Success will be handled by App.tsx session listener
  };

  return (
    <div className="max-w-md mx-auto mt-16 sm:mt-24 p-8 bg-white dark:bg-[#1E1E1E] rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-2xl animate-fade-in">
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-emerald-600 rounded-2xl mx-auto mb-6 flex items-center justify-center text-white text-3xl font-black">G</div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white">Admin Access</h2>
        <p className="text-slate-500 dark:text-white/40 mt-2">Sign in to manage academic registry.</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/30 mb-2 ml-1">Email Address</label>
          <input 
            type="email" 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-6 py-4 bg-slate-50 dark:bg-black rounded-2xl border border-slate-100 dark:border-white/5 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all dark:text-white"
            placeholder="admin@gaka.must"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/30 mb-2 ml-1">Password</label>
          <input 
            type="password" 
            required 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-6 py-4 bg-slate-50 dark:bg-black rounded-2xl border border-slate-100 dark:border-white/5 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all dark:text-white"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl border border-red-100 dark:border-red-500/20">
            {error}
          </div>
        )}

        <button 
          disabled={isLoading}
          type="submit" 
          className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all shadow-xl shadow-emerald-500/20 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
        >
          {isLoading ? 'Verifying...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
};

export default AdminLoginPage;
