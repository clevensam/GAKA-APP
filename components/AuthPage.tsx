
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
      console.error("Auth Failure:", err);
      setError(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 sm:p-12 relative font-lexend overflow-hidden selection:bg-emerald-500/30">
      {/* High-End Mesh Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden bg-white dark:bg-[#050505] transition-colors duration-700">
        <div className="absolute top-[-10%] left-[-5%] w-[80%] h-[80%] bg-emerald-500/10 dark:bg-emerald-600/5 blur-[140px] rounded-full animate-float opacity-50"></div>
        <div className="absolute bottom-[-15%] right-[-5%] w-[70%] h-[70%] bg-teal-500/10 dark:bg-teal-600/5 blur-[140px] rounded-full animate-float opacity-50" style={{ animationDelay: '-3s' }}></div>
      </div>

      {/* Navigation */}
      <div className="absolute top-8 left-8 sm:top-12 sm:left-12 z-50">
        <button 
          onClick={onBack}
          className="group flex items-center space-x-5 text-slate-400 dark:text-white/20 hover:text-emerald-600 dark:hover:text-emerald-400 font-black text-[11px] uppercase tracking-[0.4em] transition-all"
        >
          <div className="w-12 h-12 rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-white/5 group-hover:scale-110 transition-all">
            <BackIcon className="w-5 h-5 group-hover:-translate-x-1.5 transition-transform" />
          </div>
          <span className="hidden sm:inline-block">Return to Hub</span>
        </button>
      </div>

      <div className="w-full max-w-[520px] animate-fade-in relative z-10">
        {/* Branding */}
        <div className="text-center mb-12">
          <div 
            className="w-24 h-24 bg-gradient-to-br from-emerald-600 to-emerald-800 dark:from-emerald-500 dark:to-emerald-700 rounded-[2.5rem] flex items-center justify-center text-white text-5xl font-black shadow-2xl shadow-emerald-500/20 mx-auto mb-10 transform hover:scale-105 transition-all cursor-pointer ring-4 ring-white dark:ring-white/5"
            onClick={onBack}
          >
            G
          </div>
          <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-3">Portal Authentication</h1>
          <p className="text-slate-400 dark:text-white/20 font-bold uppercase tracking-[0.4em] text-[10px] px-4 max-w-xs mx-auto leading-relaxed">Secure Access Protocol • Computer Science Repository</p>
        </div>

        {/* Glass Card */}
        <div className="bg-white/95 dark:bg-[#0f0f0f]/90 backdrop-blur-[60px] rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.08)] dark:shadow-none border border-white dark:border-white/5 overflow-hidden ring-1 ring-slate-200/50 dark:ring-white/5">
          
          {/* Tabs */}
          <div className="flex p-3 bg-slate-50/50 dark:bg-black/40 border-b dark:border-white/5">
            <div className="relative flex w-full h-16">
              <div 
                className="absolute top-0 bottom-0 w-1/2 bg-white dark:bg-[#1E1E1E] rounded-[1.75rem] shadow-md transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]"
                style={{ left: activeTab === 'login' ? '0%' : '50%' }}
              ></div>
              
              <button 
                type="button"
                onClick={() => { setActiveTab('login'); setError(null); }}
                className={`relative flex-1 py-4 text-[12px] font-black uppercase tracking-[0.3em] transition-all duration-500 z-10 ${activeTab === 'login' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-white/20'}`}
              >
                Sign In
              </button>
              <button 
                type="button"
                onClick={() => { setActiveTab('signup'); setError(null); }}
                className={`relative flex-1 py-4 text-[12px] font-black uppercase tracking-[0.3em] transition-all duration-500 z-10 ${activeTab === 'signup' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-white/20'}`}
              >
                Create ID
              </button>
            </div>
          </div>

          <div className="p-12 sm:p-16">
            <form onSubmit={handleSubmit} className="space-y-8">
              {activeTab === 'signup' && (
                <div className="space-y-3 animate-fade-in">
                  <label className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-white/10 ml-5">Official Full Name</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-8 flex items-center pointer-events-none">
                      <UserIcon className="w-6 h-6 text-slate-300 dark:text-white/10 group-focus-within:text-emerald-500 transition-colors" />
                    </div>
                    <input 
                      type="text" 
                      placeholder="e.g. Cleven Samwel" 
                      required 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-18 pr-8 py-5.5 bg-slate-50/40 dark:bg-black/60 border border-slate-100 dark:border-white/5 rounded-[2rem] focus:ring-8 focus:ring-emerald-500/5 outline-none transition-all text-slate-900 dark:text-white font-bold text-lg placeholder:opacity-30 placeholder:font-medium tracking-tight" 
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-white/10 ml-5">Unique Username</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-8 flex items-center pointer-events-none">
                    <UserIcon className="w-6 h-6 text-slate-300 dark:text-white/10 group-focus-within:text-emerald-500 transition-colors" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="MUST-CS-20XX" 
                    required 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-18 pr-8 py-5.5 bg-slate-50/40 dark:bg-black/60 border border-slate-100 dark:border-white/5 rounded-[2rem] focus:ring-8 focus:ring-emerald-500/5 outline-none transition-all text-slate-900 dark:text-white font-bold text-lg placeholder:opacity-30 placeholder:font-medium tracking-tight" 
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-white/10 ml-5">{activeTab === 'login' ? 'Security Key' : 'Create Key'}</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-8 flex items-center pointer-events-none">
                    <LockIcon className="w-6 h-6 text-slate-300 dark:text-white/10 group-focus-within:text-emerald-500 transition-colors" />
                  </div>
                  <input 
                    type="password" 
                    placeholder="••••••••••••" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-18 pr-8 py-5.5 bg-slate-50/40 dark:bg-black/60 border border-slate-100 dark:border-white/5 rounded-[2rem] focus:ring-8 focus:ring-emerald-500/5 outline-none transition-all text-slate-900 dark:text-white font-bold text-lg" 
                  />
                </div>
              </div>

              {activeTab === 'signup' && (
                <div className="space-y-3 animate-fade-in">
                  <label className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-white/10 ml-5">Confirm Key</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-8 flex items-center pointer-events-none">
                      <LockIcon className="w-6 h-6 text-slate-300 dark:text-white/10 group-focus-within:text-emerald-500 transition-colors" />
                    </div>
                    <input 
                      type="password" 
                      placeholder="••••••••••••" 
                      required 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-18 pr-8 py-5.5 bg-slate-50/40 dark:bg-black/60 border border-slate-100 dark:border-white/5 rounded-[2rem] focus:ring-8 focus:ring-emerald-500/5 outline-none transition-all text-slate-900 dark:text-white font-bold text-lg" 
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="p-5 bg-red-500/5 rounded-3xl border border-red-500/10">
                  <p className="text-red-500 text-[10px] font-black text-center uppercase tracking-[0.2em] leading-relaxed">
                    Error: {error}
                  </p>
                </div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="group w-full py-6 bg-emerald-600 dark:bg-emerald-500 text-white rounded-[2rem] font-black text-[13px] uppercase tracking-[0.4em] shadow-2xl shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center space-x-4"
              >
                {loading ? (
                  <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>{activeTab === 'login' ? 'Authorize' : 'Finalize Registration'}</span>
                    <ChevronRightIcon className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="text-[10px] font-black text-slate-300 dark:text-white/5 uppercase tracking-[0.6em] mb-6">
            SOFTLINK AFRICA • ENCRYPTED GATEWAY
          </p>
          <div className="flex justify-center space-x-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/20 animate-pulse"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/20 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};
