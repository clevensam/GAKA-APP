
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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 sm:p-12 relative font-lexend overflow-hidden selection:bg-emerald-500/30">
      {/* Premium Mesh Gradient Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden bg-slate-50 dark:bg-[#050505] transition-colors duration-700">
        <div className="absolute top-[-10%] left-[-5%] w-[70%] h-[70%] bg-emerald-500/10 dark:bg-emerald-600/5 blur-[140px] rounded-full animate-float"></div>
        <div className="absolute bottom-[-15%] right-[-5%] w-[60%] h-[60%] bg-teal-500/10 dark:bg-teal-600/5 blur-[140px] rounded-full animate-float" style={{ animationDelay: '-2s' }}></div>
        <div className="absolute top-[30%] left-[40%] w-[30%] h-[30%] bg-indigo-500/5 dark:bg-indigo-600/5 blur-[100px] rounded-full animate-pulse"></div>
      </div>

      {/* Top Navigation - Home Link */}
      <div className="absolute top-8 left-8 sm:top-12 sm:left-12 z-50">
        <button 
          onClick={onBack}
          className="group flex items-center space-x-4 text-slate-500 dark:text-white/40 hover:text-emerald-600 dark:hover:text-emerald-400 font-bold text-xs uppercase tracking-[0.3em] transition-all"
        >
          <div className="w-12 h-12 rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-xl flex items-center justify-center shadow-lg border border-white dark:border-white/5 group-hover:scale-110 group-hover:bg-white dark:group-hover:bg-white/10 transition-all">
            <BackIcon className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
          </div>
          <span className="hidden sm:inline-block">Back to Hub</span>
        </button>
      </div>

      <div className="w-full max-w-[500px] animate-fade-in relative z-10">
        {/* Modern Branding Header */}
        <div className="text-center mb-12">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-emerald-500 blur-2xl opacity-20 dark:opacity-40 animate-pulse"></div>
            <div 
              className="relative w-24 h-24 bg-gradient-to-br from-emerald-500 to-emerald-700 dark:from-emerald-400 dark:to-emerald-600 rounded-[2.5rem] flex items-center justify-center text-white text-5xl font-black shadow-2xl shadow-emerald-500/20 transform hover:scale-105 hover:rotate-3 transition-all duration-500 cursor-pointer"
              onClick={onBack}
            >
              G
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-3">Portal Access</h1>
          <p className="text-slate-500 dark:text-white/30 font-medium text-base">Mbeya University of Science & Technology</p>
        </div>

        {/* Central Auth Card with Glassmorphism */}
        <div className="bg-white/70 dark:bg-[#0f0f0f]/80 backdrop-blur-[32px] rounded-[3.5rem] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.12)] dark:shadow-[0_40px_120px_-30px_rgba(0,0,0,0.8)] border border-white/80 dark:border-white/5 overflow-hidden ring-1 ring-slate-200/50 dark:ring-white/5">
          
          {/* Advanced Tab Switcher */}
          <div className="flex p-3 bg-slate-100/40 dark:bg-black/40 border-b border-slate-100 dark:border-white/5">
            <div className="relative flex w-full">
              {/* Background Highlight for Active Tab */}
              <div 
                className="absolute top-0 bottom-0 w-1/2 bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-md transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]"
                style={{ left: activeTab === 'login' ? '0%' : '50%' }}
              ></div>
              
              <button 
                type="button"
                onClick={() => { setActiveTab('login'); setError(null); }}
                className={`relative flex-1 py-4 text-[12px] font-black uppercase tracking-[0.2em] transition-all duration-500 z-10 ${activeTab === 'login' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white/40'}`}
              >
                Sign In
              </button>
              <button 
                type="button"
                onClick={() => { setActiveTab('signup'); setError(null); }}
                className={`relative flex-1 py-4 text-[12px] font-black uppercase tracking-[0.2em] transition-all duration-500 z-10 ${activeTab === 'signup' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white/40'}`}
              >
                Join GAKA
              </button>
            </div>
          </div>

          <div className="p-10 sm:p-14">
            <form onSubmit={handleSubmit} className="space-y-8">
              {activeTab === 'signup' && (
                <div className="space-y-3 animate-fade-in">
                  <label className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-white/20 ml-3">Full Student Name</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-7 flex items-center pointer-events-none">
                      <UserIcon className="w-5 h-5 text-slate-300 dark:text-white/10 group-focus-within:text-emerald-500 transition-colors" />
                    </div>
                    <input 
                      type="text" 
                      placeholder="e.g. Cleven Samwel" 
                      required 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-16 pr-8 py-5.5 bg-slate-50/50 dark:bg-black/60 border border-transparent rounded-[2rem] focus:ring-[12px] focus:ring-emerald-500/5 outline-none transition-all text-slate-900 dark:text-white font-bold text-lg placeholder:font-normal placeholder:opacity-30" 
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-white/20 ml-3">Username</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-7 flex items-center pointer-events-none">
                    <UserIcon className="w-5 h-5 text-slate-300 dark:text-white/10 group-focus-within:text-emerald-500 transition-colors" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="MUST-CS-202X" 
                    required 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-16 pr-8 py-5.5 bg-slate-50/50 dark:bg-black/60 border border-transparent rounded-[2rem] focus:ring-[12px] focus:ring-emerald-500/5 outline-none transition-all text-slate-900 dark:text-white font-bold text-lg placeholder:font-normal placeholder:opacity-30" 
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-white/20 ml-3">Secure Key</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-7 flex items-center pointer-events-none">
                    <LockIcon className="w-5 h-5 text-slate-300 dark:text-white/10 group-focus-within:text-emerald-500 transition-colors" />
                  </div>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-16 pr-8 py-5.5 bg-slate-50/50 dark:bg-black/60 border border-transparent rounded-[2rem] focus:ring-[12px] focus:ring-emerald-500/5 outline-none transition-all text-slate-900 dark:text-white font-bold text-lg" 
                  />
                </div>
              </div>

              {error && (
                <div className="p-5 bg-red-500/5 rounded-[2rem] border border-red-500/20 animate-pulse">
                  <p className="text-red-500 text-[11px] font-black text-center uppercase tracking-widest leading-relaxed">{error}</p>
                </div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="group w-full py-6 bg-gradient-to-r from-emerald-600 to-emerald-700 dark:from-emerald-500 dark:to-emerald-600 text-white rounded-[2rem] font-black text-[14px] uppercase tracking-[0.25em] shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center space-x-3 overflow-hidden relative"
              >
                {loading ? (
                  <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>{activeTab === 'login' ? 'Authenticate' : 'Register Now'}</span>
                    <ChevronRightIcon className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                  </>
                )}
                {/* Visual gloss effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
              </button>
            </form>
          </div>
        </div>

        {/* Improved Footer */}
        <div className="mt-12 text-center animate-fade-in" style={{ animationDelay: '300ms' }}>
          <p className="text-[10px] text-slate-400 dark:text-white/20 font-black uppercase tracking-[0.5em] mb-6">
            SOFTLINK AFRICA SYSTEM &copy; {new Date().getFullYear()}
          </p>
          <div className="flex justify-center space-x-2">
            <div className="w-1 h-1 rounded-full bg-emerald-500 opacity-20"></div>
            <div className="w-1 h-1 rounded-full bg-emerald-500 opacity-40"></div>
            <div className="w-1 h-1 rounded-full bg-emerald-500 opacity-20"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
