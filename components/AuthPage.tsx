
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
  const [error, setError] = useState<{ message: string; isConfig?: boolean } | null>(null);

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
      setError({ message: validationError });
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
      console.error("Auth Failure Details:", err);
      const msg = err.message?.toLowerCase() || '';
      
      // Specific handling for common Supabase configuration hurdles
      if (msg.includes('email provider is disabled') || msg.includes('email disabled')) {
        setError({ 
          message: "System Configuration Required: The 'Email' provider must be ENABLED in your Supabase Dashboard (Authentication -> Providers) to support username login.",
          isConfig: true
        });
      } else if (msg.includes('invalid login credentials')) {
        setError({ message: "Invalid username or password. Please try again." });
      } else if (msg.includes('user already exists')) {
        setError({ message: "This username is already taken. Please choose another one." });
      } else {
        setError({ message: err.message || "An unexpected error occurred. Please check your connection." });
      }
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

      {/* Top Left Navigation */}
      <div className="absolute top-8 left-8 sm:top-12 sm:left-12 z-50">
        <button 
          onClick={onBack}
          className="group flex items-center space-x-4 text-slate-400 dark:text-white/20 hover:text-emerald-600 dark:hover:text-emerald-400 font-black text-[10px] uppercase tracking-[0.4em] transition-all"
        >
          <div className="w-11 h-11 rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-white/5 group-hover:scale-110 transition-all">
            <BackIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </div>
          <span className="hidden sm:inline-block">Back to Portal</span>
        </button>
      </div>

      <div className="w-full max-w-[480px] animate-fade-in relative z-10">
        {/* Modern Institutional Header */}
        <div className="text-center mb-10">
          <div 
            className="w-22 h-22 bg-gradient-to-br from-emerald-600 to-emerald-800 dark:from-emerald-500 dark:to-emerald-700 rounded-[2.2rem] flex items-center justify-center text-white text-5xl font-black shadow-2xl shadow-emerald-500/20 mx-auto mb-8 transform hover:scale-105 transition-all cursor-pointer ring-4 ring-white dark:ring-white/5"
            onClick={onBack}
          >
            G
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">Academic Access</h1>
          <p className="text-slate-400 dark:text-white/20 font-medium uppercase tracking-[0.3em] text-[10px] px-4">Secure Gateway for MUST Computer Science</p>
        </div>

        {/* Auth Glass Card */}
        <div className="bg-white/90 dark:bg-[#0f0f0f]/80 backdrop-blur-[48px] rounded-[3.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] dark:shadow-none border border-white dark:border-white/5 overflow-hidden ring-1 ring-slate-200/50 dark:ring-white/5">
          
          {/* Tab Slider */}
          <div className="flex p-2.5 bg-slate-50/50 dark:bg-black/40 border-b dark:border-white/5">
            <div className="relative flex w-full h-14">
              <div 
                className="absolute top-0 bottom-0 w-1/2 bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-md transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]"
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
                Join Repository
              </button>
            </div>
          </div>

          <div className="p-10 sm:p-14">
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
                      placeholder="Cleven Samwel" 
                      required 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-14 pr-8 py-4.5 bg-slate-50/50 dark:bg-black/60 border border-transparent rounded-[1.5rem] focus:ring-8 focus:ring-emerald-500/5 outline-none transition-all text-slate-900 dark:text-white font-bold placeholder:opacity-30" 
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-white/20 ml-4">Gaka Username</label>
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
                    className="w-full pl-14 pr-8 py-4.5 bg-slate-50/50 dark:bg-black/60 border border-transparent rounded-[1.5rem] focus:ring-8 focus:ring-emerald-500/5 outline-none transition-all text-slate-900 dark:text-white font-bold placeholder:opacity-30" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-white/20 ml-4">{activeTab === 'login' ? 'Security Key' : 'Create Security Key'}</label>
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
                    className="w-full pl-14 pr-8 py-4.5 bg-slate-50/50 dark:bg-black/60 border border-transparent rounded-[1.5rem] focus:ring-8 focus:ring-emerald-500/5 outline-none transition-all text-slate-900 dark:text-white font-bold" 
                  />
                </div>
              </div>

              {activeTab === 'signup' && (
                <div className="space-y-2 animate-fade-in">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-white/20 ml-4">Confirm Security Key</label>
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
                      className="w-full pl-14 pr-8 py-4.5 bg-slate-50/50 dark:bg-black/60 border border-transparent rounded-[1.5rem] focus:ring-8 focus:ring-emerald-500/5 outline-none transition-all text-slate-900 dark:text-white font-bold" 
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className={`p-6 rounded-[1.5rem] border ${error.isConfig ? 'bg-amber-500/5 border-amber-500/20' : 'bg-red-500/5 border-red-500/20'} animate-pulse`}>
                  <p className={`${error.isConfig ? 'text-amber-600 dark:text-amber-400' : 'text-red-500'} text-[11px] font-black text-center uppercase tracking-widest leading-relaxed`}>
                    {error.message}
                  </p>
                  {error.isConfig && (
                    <div className="mt-4 pt-4 border-t border-amber-500/10">
                      <p className="text-[9px] font-medium text-slate-500 dark:text-white/30 text-center leading-relaxed italic">
                        The shadow-email authentication engine requires the Email provider to be enabled even for username logins.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="group w-full py-6 bg-emerald-600 dark:bg-emerald-500 text-white rounded-[1.5rem] font-black text-[12px] uppercase tracking-[0.3em] shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center space-x-3"
              >
                {loading ? (
                  <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>{activeTab === 'login' ? 'Authenticate' : 'Register Profile'}</span>
                    <ChevronRightIcon className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-14 text-center">
          <p className="text-[9px] font-black text-slate-300 dark:text-white/10 uppercase tracking-[0.5em] mb-4">
            &copy; {new Date().getFullYear()} SOFTLINK AFRICA • MUST CS
          </p>
          <div className="flex justify-center space-x-1">
            <div className="w-1 h-1 rounded-full bg-emerald-500/20"></div>
            <div className="w-1 h-1 rounded-full bg-emerald-500/40"></div>
            <div className="w-1 h-1 rounded-full bg-emerald-500/20"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
