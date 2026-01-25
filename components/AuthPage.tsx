
import React, { useState } from 'react';
import { UserIcon, LockIcon, BackIcon } from './Icons';

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
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-500/10 blur-[120px] rounded-full animate-pulse delay-700"></div>
      </div>

      {/* Back Navigation */}
      <div className="absolute top-6 left-6 sm:top-12 sm:left-12">
        <button 
          onClick={onBack}
          className="flex items-center space-x-3 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-bold text-xs uppercase tracking-[0.2em] transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/5 flex items-center justify-center shadow-sm border border-slate-100 dark:border-white/5 group-hover:-translate-x-1 transition-transform">
            <BackIcon className="w-5 h-5" />
          </div>
          <span className="hidden sm:inline">Back to Portal</span>
        </button>
      </div>

      <div className="w-full max-w-[480px] animate-fade-in">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-emerald-600 dark:bg-emerald-500 rounded-[2rem] flex items-center justify-center text-white text-4xl font-black mx-auto mb-8 shadow-2xl shadow-emerald-500/20 transform rotate-3 hover:rotate-0 transition-transform duration-500">
            G
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Academic Portal</h1>
          <p className="text-slate-500 dark:text-white/40 font-medium mt-2">Verified resources for MUST Computer Science.</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white dark:bg-[#121212] rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border border-slate-100 dark:border-white/5 overflow-hidden">
          {/* Tabs */}
          <div className="flex p-2 bg-slate-50 dark:bg-black/40 border-b border-slate-100 dark:border-white/5">
            <button 
              onClick={() => { setActiveTab('login'); setError(null); }}
              className={`flex-1 py-4 text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all ${activeTab === 'login' ? 'bg-white dark:bg-[#1E1E1E] text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white/60'}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => { setActiveTab('signup'); setError(null); }}
              className={`flex-1 py-4 text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all ${activeTab === 'signup' ? 'bg-white dark:bg-[#1E1E1E] text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white/60'}`}
            >
              Create Account
            </button>
          </div>

          <div className="p-8 sm:p-12">
            <form onSubmit={handleSubmit} className="space-y-6">
              {activeTab === 'signup' && (
                <div className="space-y-2 animate-fade-in">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20 ml-2">Full Name</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                      <UserIcon className="w-5 h-5 text-slate-300 dark:text-white/10 group-focus-within:text-emerald-500 transition-colors" />
                    </div>
                    <input 
                      type="text" 
                      placeholder="e.g. John Doe" 
                      required 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-16 pr-6 py-5 bg-slate-50 dark:bg-black/40 border border-transparent rounded-3xl focus:ring-8 focus:ring-emerald-500/5 outline-none transition-all text-slate-900 dark:text-white font-bold text-lg" 
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
                    className="w-full pl-16 pr-6 py-5 bg-slate-50 dark:bg-black/40 border border-transparent rounded-3xl focus:ring-8 focus:ring-emerald-500/5 outline-none transition-all text-slate-900 dark:text-white font-bold text-lg" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20 ml-2">Secure Password</label>
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
                    className="w-full pl-16 pr-6 py-5 bg-slate-50 dark:bg-black/40 border border-transparent rounded-3xl focus:ring-8 focus:ring-emerald-500/5 outline-none transition-all text-slate-900 dark:text-white font-bold text-lg" 
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-500/5 rounded-2xl border border-red-100 dark:border-red-500/20 animate-pulse">
                  <p className="text-red-500 text-[11px] font-black text-center uppercase tracking-widest">{error}</p>
                </div>
              )}

              <button 
                disabled={loading}
                className="w-full py-6 bg-emerald-600 dark:bg-emerald-500 text-white rounded-3xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/20 hover:bg-emerald-700 dark:hover:bg-emerald-600 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center space-x-3"
              >
                {loading ? (
                  <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>{activeTab === 'login' ? 'Authenticate Account' : 'Register Profile'}</span>
                  </>
                )}
              </button>
            </form>

            <p className="mt-8 text-[10px] text-center text-slate-400 dark:text-white/20 font-bold uppercase tracking-widest leading-relaxed">
              By continuing, you agree to access <br className="hidden sm:block"/> MUST academic resources responsibly.
            </p>
          </div>
        </div>
      </div>

      <footer className="mt-12 text-center opacity-40">
        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500 dark:text-white/60">
          &copy; {new Date().getFullYear()} SOFTLINK AFRICA | MUST ICT
        </p>
      </footer>
    </div>
  );
};
