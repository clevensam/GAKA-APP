
import React, { useState } from 'react';
import { UserIcon, LockIcon, MailIcon, BackIcon, ChevronRightIcon } from './Icons';

interface AuthPageProps {
  onLogin: (username: string, pass: string) => Promise<void>;
  onSignup: (username: string, pass: string, name: string, email: string) => Promise<void>;
  onBack: () => void;
  isDark: boolean;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin, onSignup, onBack, isDark }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = () => {
    if (username.length < 3) return "Username too short.";
    if (password.length < 6) return "Password must be 6+ chars.";
    
    if (activeTab === 'signup') {
      if (fullName.trim().length < 2) return "Enter your full name.";
      if (!email.includes('@')) return "Invalid email address.";
      if (password !== confirmPassword) return "Keys do not match.";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'login') {
        await onLogin(username, password);
      } else {
        await onSignup(username, password, fullName, email);
      }
    } catch (err: any) {
      setError(err.message || "Access denied.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 sm:p-8 bg-slate-50 dark:bg-[#050505] font-lexend transition-colors duration-500">
      {/* Minimal Header */}
      <div className="w-full max-w-md mb-8 flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center space-x-2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
        >
          <BackIcon className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-widest">Back</span>
        </button>
        <div className="flex items-center space-x-2">
           <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-black text-sm">G</div>
           <span className="font-black text-slate-900 dark:text-white tracking-tight uppercase text-xs">Portal</span>
        </div>
      </div>

      <div className="w-full max-w-md animate-fade-in">
        <div className="bg-white dark:bg-[#0f0f0f] rounded-3xl shadow-sm border border-slate-200/60 dark:border-white/5 overflow-hidden">
          {/* Tab Switcher */}
          <div className="flex border-b dark:border-white/5">
            <button 
              onClick={() => { setActiveTab('login'); setError(null); }}
              className={`flex-1 py-5 text-[11px] font-bold uppercase tracking-widest transition-all ${activeTab === 'login' ? 'text-emerald-600 bg-white dark:bg-transparent border-b-2 border-emerald-600' : 'text-slate-400 bg-slate-50/50 dark:bg-black/20'}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => { setActiveTab('signup'); setError(null); }}
              className={`flex-1 py-5 text-[11px] font-bold uppercase tracking-widest transition-all ${activeTab === 'signup' ? 'text-emerald-600 bg-white dark:bg-transparent border-b-2 border-emerald-600' : 'text-slate-400 bg-slate-50/50 dark:bg-black/20'}`}
            >
              Register
            </button>
          </div>

          <div className="p-8 sm:p-10">
            <form onSubmit={handleSubmit} className="space-y-5">
              {activeTab === 'signup' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Cleven Samwel" 
                        required 
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-white/5 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-slate-900 dark:text-white font-medium text-sm placeholder:opacity-40" 
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Email</label>
                    <div className="relative">
                      <input 
                        type="email" 
                        placeholder="student@must.ac.tz" 
                        required 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-white/5 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-slate-900 dark:text-white font-medium text-sm placeholder:opacity-40" 
                      />
                    </div>
                  </div>
                </>
              )}
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Username</label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="MUST-CS-20XX" 
                    required 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-5 py-3.5 bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-white/5 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-slate-900 dark:text-white font-medium text-sm placeholder:opacity-40" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Security Key</label>
                <div className="relative">
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-5 py-3.5 bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-white/5 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-slate-900 dark:text-white font-medium text-sm" 
                  />
                </div>
              </div>

              {activeTab === 'signup' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Confirm Key</label>
                  <div className="relative">
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      required 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-5 py-3.5 bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-white/5 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-slate-900 dark:text-white font-medium text-sm" 
                    />
                  </div>
                </div>
              )}

              {error && (
                <p className="text-red-500 text-[10px] font-bold text-center uppercase tracking-widest py-2">
                  {error}
                </p>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-4.5 bg-emerald-600 dark:bg-emerald-500 text-white rounded-2xl font-bold text-xs uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <span>{activeTab === 'login' ? 'Continue' : 'Create Account'}</span>
                )}
              </button>
            </form>
          </div>
        </div>

        <p className="mt-8 text-center text-[9px] font-bold text-slate-300 dark:text-white/10 uppercase tracking-[0.4em]">
          MUST Computer Science Repository
        </p>
      </div>
    </div>
  );
};
