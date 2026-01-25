
import React, { useState } from 'react';
import { UserIcon, LockIcon, BackIcon, ChevronRightIcon } from './Icons';

interface AuthPageProps {
  onLogin: (username: string, pass: string) => Promise<void>;
  onSignup: (username: string, pass: string, name: string) => Promise<void>;
  onBack: () => void;
  isDark: boolean;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin, onSignup, onBack, isDark }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = () => {
    if (username.length < 3) return "Username must be at least 3 characters.";
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return "Username can only contain letters, numbers, and underscores.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    if (activeTab === 'signup' && fullName.trim().length < 2) return "Please enter your full name.";
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
        await onSignup(username, password, fullName);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 sm:p-12 relative font-lexend">
      {/* Dynamic Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden bg-slate-50 dark:bg-black transition-colors duration-500">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-emerald-500/10 dark:bg-emerald-500/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-teal-500/10 dark:bg-teal-500/5 blur-[120px] rounded-full"></div>
      </div>

      {/* Top Navigation - Home Link */}
      <div className="absolute top-8 left-8 sm:top-12 sm:left-12 z-50">
        <button 
          onClick={onBack}
          className="group flex items-center space-x-3 text-slate-500 dark:text-white/40 hover:text-emerald-600 dark:hover:text-emerald-400 font-bold text-xs uppercase tracking-[0.2em] transition-all"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white dark:bg-white/5 flex items-center justify-center shadow-lg border border-slate-100 dark:border-white/5 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-500/10 transition-all">
            <BackIcon className="w-5 h-5 sm:w-6 sm:h-6 group-hover:-translate-x-1 transition-transform" />
          </div>
          <span className="hidden sm:inline-block">Return Home</span>
        </button>
      </div>

      <div className="w-full max-w-[480px] animate-fade-in relative z-10">
        {/* Branding Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-emerald-600 dark:bg-emerald-500 rounded-[2.5rem] flex items-center justify-center text-white text-4xl font-black mx-auto mb-6 shadow-2xl shadow-emerald-500/20 transform hover:scale-105 transition-transform duration-500 cursor-pointer" onClick={onBack}>
            G
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">GAKA Portal</h1>
          <p className="text-slate-500 dark:text-white/40 font-medium text-sm">Institutional login for MUST Computer Science.</p>
        </div>

        {/* Central Auth Card */}
        <div className="bg-white/90 dark:bg-[#121212]/90 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_40px_100px_-30px_rgba(0,0,0,0.1)] dark:shadow-[0_40px_100px_-30px_rgba(0,0,0,0.7)] border border-white/50 dark:border-white/5 overflow-hidden">
          
          {/* Tab Switcher */}
          <div className="flex p-2.5 bg-slate-100/50 dark:bg-black/30 border-b border-slate-100/50 dark:border-white/5">
            <button 
              type="button"
              onClick={() => { setActiveTab('login'); setError(null); }}
              className={`flex-1 py-4 text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all duration-300 ${activeTab === 'login' ? 'bg-white dark:bg-[#1E1E1E] text-emerald-600 dark:text-emerald-400 shadow-md ring-1 ring-slate-200/20' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white/60'}`}
            >
              Sign In
            </button>
            <button 
              type="button"
              onClick={() => { setActiveTab('signup'); setError(null); }}
              className={`flex-1 py-4 text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all duration-300 ${activeTab === 'signup' ? 'bg-white dark:bg-[#1E1E1E] text-emerald-600 dark:text-emerald-400 shadow-md ring-1 ring-slate-200/20' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white/60'}`}
            >
              Register
            </button>
          </div>

          <div className="p-8 sm:p-12">
            <form onSubmit={handleSubmit} className="space-y-6">
              {activeTab === 'signup' && (
                <div className="space-y-2 animate-fade-in">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20 ml-2">Display Name</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                      <UserIcon className="w-5 h-5 text-slate-300 dark:text-white/10 group-focus-within:text-emerald-500 transition-colors" />
                    </div>
                    <input 
                      type="text" 
                      placeholder="e.g. Cleven Samwel" 
                      required 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-15 pr-6 py-4.5 bg-slate-50 dark:bg-black/40 border border-transparent rounded-[1.5rem] focus:ring-8 focus:ring-emerald-500/5 outline-none transition-all text-slate-900 dark:text-white font-bold text-lg" 
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20 ml-2">Username</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                    <UserIcon className="w-5 h-5 text-slate-300 dark:text-white/10 group-focus-within:text-emerald-500 transition-colors" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="student_id" 
                    required 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-15 pr-6 py-4.5 bg-slate-50 dark:bg-black/40 border border-transparent rounded-[1.5rem] focus:ring-8 focus:ring-emerald-500/5 outline-none transition-all text-slate-900 dark:text-white font-bold text-lg" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20 ml-2">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                    <LockIcon className="w-5 h-5 text-slate-300 dark:text-white/10 group-focus-within:text-emerald-500 transition-colors" />
                  </div>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-15 pr-6 py-4.5 bg-slate-50 dark:bg-black/40 border border-transparent rounded-[1.5rem] focus:ring-8 focus:ring-emerald-500/5 outline-none transition-all text-slate-900 dark:text-white font-bold text-lg" 
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-500/5 rounded-2xl border border-red-100 dark:border-red-500/20">
                  <p className="text-red-500 text-[11px] font-black text-center uppercase tracking-widest leading-relaxed">{error}</p>
                </div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="group w-full py-5.5 bg-emerald-600 dark:bg-emerald-500 text-white rounded-[1.5rem] font-black text-[13px] uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 dark:hover:bg-emerald-600 active:scale-[0.97] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center space-x-3"
              >
                {loading ? (
                  <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>{activeTab === 'login' ? 'Authenticate' : 'Get Started'}</span>
                    <ChevronRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer info in auth page */}
        <div className="mt-10 text-center animate-fade-in" style={{ animationDelay: '200ms' }}>
          <p className="text-[10px] text-slate-400 dark:text-white/20 font-black uppercase tracking-[0.4em] mb-4">
            SOFTLINK AFRICA &copy; {new Date().getFullYear()}
          </p>
          <div className="h-px w-8 bg-slate-200 dark:bg-white/5 mx-auto"></div>
        </div>
      </div>
    </div>
  );
};
