
import React, { useState } from 'react';
import { UserIcon, LockIcon, BackIcon, ChevronRightIcon } from './Icons';

interface AuthPageProps {
  onLogin: (username: string, pass: string) => Promise<void>;
  onSignup: (username: string, pass: string, name: string) => Promise<void>;
  onBack: () => void;
  isDark: boolean;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin, onSignup, onBack, isDark }) => {
  const [isLogin, setIsLogin] = useState(true);
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
      if (isLogin) {
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
    <div className="min-h-screen flex flex-col lg:flex-row overflow-hidden animate-fade-in">
      {/* Illustration Side */}
      <div className="relative lg:w-[45%] xl:w-[50%] bg-emerald-600 dark:bg-emerald-900 hidden lg:flex flex-col justify-between p-16 xl:p-24 overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-emerald-800 opacity-90"></div>
        
        {/* Animated background elements */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl animate-pulse delay-700"></div>

        <div className="relative z-10">
          <button 
            onClick={onBack}
            className="flex items-center space-x-3 text-white/70 hover:text-white font-bold text-sm uppercase tracking-[0.2em] transition-all group-hover:-translate-x-2"
          >
            <BackIcon className="w-6 h-6" />
            <span>Back to Portal</span>
          </button>
        </div>

        <div className="relative z-10 max-w-lg">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center text-white text-4xl font-black mb-10 border border-white/20 shadow-2xl">
            G
          </div>
          <h2 className="text-5xl xl:text-7xl font-black text-white leading-[1.1] mb-8 tracking-tighter">
            Your Academic <br/> <span className="text-emerald-300">Hub.</span>
          </h2>
          <p className="text-emerald-50/80 text-xl font-medium leading-relaxed mb-12">
            The most powerful repository for MUST Computer Science resources. One account, total efficiency.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-center space-x-5 text-white/90">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10"><ChevronRightIcon className="w-6 h-6" /></div>
              <span className="font-bold tracking-tight text-lg">Instant GAKA Paper Access</span>
            </div>
            <div className="flex items-center space-x-5 text-white/90">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10"><ChevronRightIcon className="w-6 h-6" /></div>
              <span className="font-bold tracking-tight text-lg">Verified Lecture Materials</span>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">
            &copy; {new Date().getFullYear()} SOFTLINK AFRICA | MUST ICT
          </p>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 sm:p-12 lg:p-24 bg-white dark:bg-black relative overflow-y-auto">
        <button 
          onClick={onBack}
          className="lg:hidden absolute top-8 left-8 text-slate-400 hover:text-emerald-600 transition-colors flex items-center gap-2 font-bold uppercase tracking-widest text-[10px]"
        >
          <BackIcon className="w-5 h-5" /> Back
        </button>

        <div className="w-full max-w-md animate-slide-in">
          <div className="mb-12 text-center lg:text-left">
            <div className="lg:hidden w-16 h-16 bg-emerald-600 rounded-3xl flex items-center justify-center text-white text-3xl font-black mx-auto mb-8 shadow-xl shadow-emerald-500/20">G</div>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
              {isLogin ? 'Sign In' : 'Join Us'}
            </h2>
            <p className="text-slate-500 dark:text-white/40 text-lg font-medium leading-relaxed">
              {isLogin ? 'Welcome back, student. Access your hub.' : 'Create an account to unlock premium MUST resources.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="relative group">
                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                  <UserIcon className="w-5 h-5 text-slate-300 dark:text-white/10 group-focus-within:text-emerald-500 transition-colors" />
                </div>
                <input 
                  type="text" 
                  placeholder="Full Name" 
                  required 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-16 pr-6 py-5 bg-slate-50 dark:bg-white/5 border border-transparent rounded-3xl focus:ring-8 focus:ring-emerald-500/5 outline-none transition-all text-slate-900 dark:text-white font-bold text-lg" 
                />
              </div>
            )}
            
            <div className="relative group">
              <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                <UserIcon className="w-5 h-5 text-slate-300 dark:text-white/10 group-focus-within:text-emerald-500 transition-colors" />
              </div>
              <input 
                type="text" 
                placeholder="Username" 
                required 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-16 pr-6 py-5 bg-slate-50 dark:bg-white/5 border border-transparent rounded-3xl focus:ring-8 focus:ring-emerald-500/5 outline-none transition-all text-slate-900 dark:text-white font-bold text-lg" 
              />
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                <LockIcon className="w-5 h-5 text-slate-300 dark:text-white/10 group-focus-within:text-emerald-500 transition-colors" />
              </div>
              <input 
                type="password" 
                placeholder="Password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-16 pr-6 py-5 bg-slate-50 dark:bg-white/5 border border-transparent rounded-3xl focus:ring-8 focus:ring-emerald-500/5 outline-none transition-all text-slate-900 dark:text-white font-bold text-lg" 
              />
            </div>

            {error && <p className="text-red-500 text-[12px] font-bold text-center bg-red-50 dark:bg-red-500/5 py-4 rounded-2xl border border-red-100 dark:border-red-500/20">{error}</p>}

            <button 
              disabled={loading}
              className="w-full py-6 bg-emerald-600 dark:bg-emerald-500 text-white rounded-3xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/20 hover:bg-emerald-700 dark:hover:bg-emerald-600 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
            >
              {loading ? <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin mx-auto"></div> : isLogin ? 'Authenticate' : 'Get Started'}
            </button>
          </form>

          <div className="mt-12 text-center lg:text-left">
            <p className="text-slate-400 dark:text-white/20 font-bold uppercase tracking-widest text-[10px] mb-4">
              {isLogin ? "New here?" : "Joined already?"}
            </p>
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="px-8 py-4 border-2 border-slate-100 dark:border-white/5 rounded-2xl text-slate-700 dark:text-white font-black text-[12px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/5 transition-all active:scale-95"
            >
              {isLogin ? "Create Student Account" : "Sign into Account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
