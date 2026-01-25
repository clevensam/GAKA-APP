
import React, { useState, useEffect } from 'react';
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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = () => {
    if (username.length < 3) return "Username must be at least 3 characters.";
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return "Username can only contain letters, numbers, and underscores.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    
    if (activeTab === 'signup') {
      if (fullName.trim().length < 2) return "Please enter your full student name.";
      if (password !== confirmPassword) return "Passwords do not match.";
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
        await onSignup(username, password, fullName);
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      // Handle the common "Email provider is disabled" error specifically
      if (err.message?.toLowerCase().includes('email provider is disabled') || err.message?.toLowerCase().includes('email disabled')) {
        setError("Database Configuration Error: Please ensure the 'Email' provider is ENABLED in your Supabase Dashboard (Auth -> Providers).");
      } else {
        setError(err.message || "Authentication failed. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 sm:p-12 relative font-lexend overflow-hidden selection:bg-emerald-500/30">
      {/* Dynamic Mesh Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden bg-white dark:bg-[#050505] transition-colors duration-700">
        <div className="absolute top-[-10%] left-[-5%] w-[80%] h-[80%] bg-emerald-500/5 dark:bg-emerald-600/5 blur-[120px] rounded-full animate-float"></div>
        <div className="absolute bottom-[-15%] right-[-5%] w-[70%] h-[70%] bg-teal-500/5 dark:bg-teal-600/5 blur-[120px] rounded-full animate-float" style={{ animationDelay: '-3s' }}></div>
      </div>

      {/* Top Left Navigation */}
      <div className="absolute top-8 left-8 sm:top-12 sm:left-12 z-50">
        <button 
          onClick={onBack}
          className="group flex items-center space-x-4 text-slate-400 dark:text-white/20 hover:text-emerald-600 dark:hover:text-emerald-400 font-black text-[10px] uppercase tracking-[0.4em] transition-all"
        >
          <div className="w-10 h-10 rounded-2xl bg-white/40 dark:bg-white/5 backdrop-blur-xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-white/5 group-hover:scale-110 transition-all">
            <BackIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </div>
          <span className="hidden sm:inline-block">Portal Hub</span>
        </button>
      </div>

      <div className="w-full max-w-[480px] animate-fade-in relative z-10">
        {/* Branding */}
        <div className="text-center mb-10">
          <div 
            className="w-20 h-20 bg-emerald-600 dark:bg-emerald-500 rounded-[2rem] flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-emerald-500/20 mx-auto mb-8 transform hover:rotate-6 transition-transform cursor-pointer"
            onClick={onBack}
          >
            G
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">Gatekeeper Access</h1>
          <p className="text-slate-400 dark:text-white/20 font-medium uppercase tracking-[0.2em] text-[10px]">MUST Computer Science Repository</p>
        </div>

        {/* Auth Glass Card */}
        <div className="bg-white/80 dark:bg-[#0f0f0f]/80 backdrop-blur-[40px] rounded-[3rem] shadow-2xl border border-white dark:border-white/5 overflow-hidden ring-1 ring-slate-200/50 dark:ring-white/5">
          
          {/* Tab Slider */}
          <div className="flex p-2 bg-slate-50/50 dark:bg-black/40 border-b dark:border-white/5">
            <div className="relative flex w-full h-14">
              <div 
                className="absolute top-0 bottom-0 w-1/2 bg-white dark:bg-[#1A1A1A] rounded-[1.25rem] shadow-sm transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]"
                style={{ left: activeTab === 'login' ? '0%' : '50%' }}
              ></div>
              
              <button 
                type="button"
                onClick={() => { setActiveTab('login'); setError(null); }}
                className={`relative flex-1 py-4 text-[11px] font-black uppercase tracking-[0.25em] transition-all duration-500 z-10 ${activeTab === 'login' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-white/20'}`}
              >
                Sign In
              </button>
              <button 
                type="button"
                onClick={() => { setActiveTab('signup'); setError(null); }}
                className={`relative flex-1 py-4 text-[11px] font-black uppercase tracking-[0.25em] transition-all duration-500 z-10 ${activeTab === 'signup' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-white/20'}`}
              >
                Sign Up
              </button>
            </div>
          </div>

          <div className="p-8 sm:p-12">
            <form onSubmit={handleSubmit} className="space-y-6">
              {activeTab === 'signup' && (
                <div className="space-y-2 animate-fade-in">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-white/20 ml-4">Full Student Name</label>
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
                      className="w-full pl-14 pr-8 py-4.5 bg-slate-50 dark:bg-black/60 border border-transparent rounded-2xl focus:ring-8 focus:ring-emerald-500/5 outline-none transition-all text-slate-900 dark:text-white font-bold" 
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-white/20 ml-4">Username</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                    <UserIcon className="w-5 h-5 text-slate-300 dark:text-white/10 group-focus-within:text-emerald-500 transition-colors" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="MUST-CS-202X" 
                    required 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-14 pr-8 py-4.5 bg-slate-50 dark:bg-black/60 border border-transparent rounded-2xl focus:ring-8 focus:ring-emerald-500/5 outline-none transition-all text-slate-900 dark:text-white font-bold" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-white/20 ml-4">{activeTab === 'login' ? 'Password' : 'Create Password'}</label>
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
                    className="w-full pl-14 pr-8 py-4.5 bg-slate-50 dark:bg-black/60 border border-transparent rounded-2xl focus:ring-8 focus:ring-emerald-500/5 outline-none transition-all text-slate-900 dark:text-white font-bold" 
                  />
                </div>
              </div>

              {activeTab === 'signup' && (
                <div className="space-y-2 animate-fade-in">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-white/20 ml-4">Verify Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                      <LockIcon className="w-5 h-5 text-slate-300 dark:text-white/10 group-focus-within:text-emerald-500 transition-colors" />
                    </div>
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      required 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-14 pr-8 py-4.5 bg-slate-50 dark:bg-black/60 border border-transparent rounded-2xl focus:ring-8 focus:ring-emerald-500/5 outline-none transition-all text-slate-900 dark:text-white font-bold" 
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-500/5 rounded-2xl border border-red-500/20">
                  <p className="text-red-500 text-[10px] font-black text-center uppercase tracking-widest leading-relaxed">
                    {error}
                  </p>
                </div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="group w-full py-5 bg-emerald-600 dark:bg-emerald-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-xl shadow-emerald-500/10 hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center space-x-3"
              >
                {loading ? (
                  <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>{activeTab === 'login' ? 'Authorize' : 'Join Repository'}</span>
                    <ChevronRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 text-center text-[9px] font-black text-slate-300 dark:text-white/5 uppercase tracking-[0.5em]">
          &copy; {new Date().getFullYear()} SOFTLINK AFRICA • SECURE PORTAL
        </div>
      </div>
    </div>
  );
};
