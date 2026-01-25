
import React, { useState } from 'react';
import { UserIcon, LockIcon, BackIcon } from './Icons';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (username: string, pass: string) => Promise<void>;
  onSignup: (username: string, pass: string, name: string) => Promise<void>;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin, onSignup }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isLogin) {
        await onLogin(username, password);
      } else {
        await onSignup(username, password, fullName);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>
      
      <div className="relative w-full max-w-md bg-white dark:bg-[#1A1A1A] rounded-[2.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] border border-slate-100 dark:border-white/5 overflow-hidden animate-slide-in">
        <div className="p-8 sm:p-12">
          <button onClick={onClose} className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          <div className="mb-10 text-center">
            <div className="w-16 h-16 bg-emerald-600 rounded-3xl flex items-center justify-center text-white text-3xl font-black mx-auto mb-6 shadow-xl shadow-emerald-500/20">G</div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
            <p className="text-slate-500 dark:text-white/40 text-sm mt-2">Access premium resources & GAKA papers.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="relative group">
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                  <UserIcon className="w-5 h-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                </div>
                <input 
                  type="text" 
                  placeholder="Full Name" 
                  required 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-black/40 border border-transparent rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-slate-900 dark:text-white font-medium" 
                />
              </div>
            )}
            
            <div className="relative group">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                <UserIcon className="w-5 h-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
              </div>
              <input 
                type="text" 
                placeholder="Username" 
                required 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-black/40 border border-transparent rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-slate-900 dark:text-white font-medium" 
              />
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                <LockIcon className="w-5 h-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
              </div>
              <input 
                type="password" 
                placeholder="Password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-black/40 border border-transparent rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-slate-900 dark:text-white font-medium" 
              />
            </div>

            {error && <p className="text-red-500 text-[11px] font-bold text-center bg-red-50 dark:bg-red-500/5 py-3 rounded-xl border border-red-100 dark:border-red-500/20">{error}</p>}

            <button 
              disabled={loading}
              className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-[13px] uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto"></div> : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-10 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-emerald-600 transition-colors"
            >
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
