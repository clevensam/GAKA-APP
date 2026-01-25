
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'login') {
        await onLogin(username, password);
      } else {
        await onSignup(username, password, fullName);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 sm:p-12 relative">
      {/* Dynamic Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
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

      <div className="w-full max-w-[500px] animate-fade-in relative z-10">
        {/* Branding Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-emerald-600 dark:bg-emerald-500 rounded-[2.5rem] flex items-center justify-center text-white text-4xl font-black mx-auto mb-8 shadow-2xl shadow-emerald-500/20 transform hover:scale-110 transition-transform duration-500 cursor-pointer" onClick={onBack}>
            G
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-3">Academic Portal</h1>
          <p className="text-slate-500 dark:text-white/40 font-medium">Verified resources for MUST Computer Science.</p>
        </div>

        {/* Central Auth Card */}
        <div className="bg-white/80 dark:bg-[#121212]/80 backdrop-blur-3xl rounded-[3rem] shadow-[0_40px_100px_-30px_rgba(0,0,0,0.15)] dark:shadow-[0_40px_100px_-30px_rgba(0,0,0,0.8)] border border-white dark:border-white/5 overflow-hidden">
          
          {/* Tab Switcher */}
          <div className="flex p-3 bg-slate-100/50 dark:bg-black/40 border-b border-slate-100 dark:border-white/5">
            <button 
              onClick={() => { setActiveTab('login'); setError(null); }}
              className={`flex-1 py-4 text-[12px] font-black uppercase tracking-widest rounded-2xl transition-all duration-300 ${activeTab === 'login' ? 'bg-white dark:bg-[#1E1E1E] text-emerald-600 dark:text-emerald-400 shadow-md ring-1 ring-slate-200/50 dark:ring-white/5' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white/60'}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => { setActiveTab('signup'); setError(null); }}
              className={`flex-1 py-4 text-[12px] font-black uppercase tracking-widest rounded-2xl transition-all duration-300 ${activeTab === 'signup' ? 'bg-white dark:bg-[#1E1E1E] text-emerald-600 dark:text-emerald-400 shadow-md ring-1 ring-slate-200/50 dark:ring-white/5' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white/60'}`}
            >
              Register
            </button>
          </div>

          <div className="p-10 sm:p-14">
            <form onSubmit={handleSubmit} className="space-y-7">
              {activeTab === 'signup' && (
                <div className="space-y-3 animate-fade-in">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20 ml-3">Full Name</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-7 flex items-center pointer-events-none">
                      <UserIcon className="w-5 h-5 text-slate-300 dark:text-white/10 group-focus-within:text-emerald-500 transition-colors" />
                    </div>
                    <input 
                      type="text" 
                      placeholder="Enter your full name" 
                      required 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-16 pr-8 py-5 bg-slate-50/50 dark:bg-black/60 border border-transparent rounded-[2rem] focus:ring-8 focus:ring-emerald-500/5 outline-none transition-all text-slate-900 dark:text-white font-bold text-lg placeholder:font-normal placeholder:opacity-50" 
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20 ml-3">Username</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-7 flex items-center pointer-events-none">
                    <UserIcon className="w-5 h-5 text-slate-300 dark:text-white/10 group-focus-within:text-emerald-500 transition-colors" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="student_id" 
                    required 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-16 pr-8 py-5 bg-slate-50/50 dark:bg-black/60 border border-transparent rounded-[2rem] focus:ring-8 focus:ring-emerald-500/5 outline-none transition-all text-slate-900 dark:text-white font-bold text-lg placeholder:font-normal placeholder:opacity-50" 
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20 ml-3">Security Key</label>
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
                    className="w-full pl-16 pr-8 py-5 bg-slate-50/50 dark:bg-black/60 border border-transparent rounded-[2rem] focus:ring-8 focus:ring-emerald-500/5 outline-none transition-all text-slate-900 dark:text-white font-bold text-lg" 
                  />
                </div>
              </div>

              {error && (
                <div className="p-5 bg-red-50 dark:bg-red-500/5 rounded-[1.5rem] border border-red-100 dark:border-red-500/20 animate-pulse">
                  <p className="text-red-500 text-[11px] font-black text-center uppercase tracking-[0.1em]">{error}</p>
                </div>
              )}

              <button 
                disabled={loading}
                className="group w-full py-6 bg-emerald-600 dark:bg-emerald-500 text-white rounded-[2rem] font-black text-[13px] uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:bg-emerald-700 dark:hover:bg-emerald-400 active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center space-x-3 overflow-hidden relative"
              >
                {loading ? (
                  <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>{activeTab === 'login' ? 'Secure Login' : 'Create Profile'}</span>
                    <ChevronRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
                {/* Glossy overlay on button */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </button>
            </form>

            <div className="mt-10 text-center">
              <p className="text-[10px] text-slate-400 dark:text-white/20 font-black uppercase tracking-[0.3em] leading-relaxed mb-6">
                Institutional Academic Access
              </p>
              <div className="h-px w-12 bg-slate-100 dark:bg-white/5 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Footer Credits */}
      <footer className="mt-16 text-center space-y-4 animate-fade-in" style={{ animationDelay: '300ms' }}>
        <button 
          onClick={onBack}
          className="text-[11px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
        >
          &larr; Back to resource repository
        </button>
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300 dark:text-white/5">
          MUST ICT DEPT | SOFTLINK AFRICA
        </p>
      </footer>
    </div>
  );
};
