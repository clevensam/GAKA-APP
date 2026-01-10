import React from 'react';

interface ErrorPageProps {
  message: string;
  onRetry: () => void;
  isRetrying: boolean;
  onGoHome: () => void;
}

export const ErrorPage: React.FC<ErrorPageProps> = ({ message, onRetry, isRetrying, onGoHome }) => {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center px-6 py-12 animate-fade-in text-center">
      <div className="relative mb-10 group">
        {/* Dynamic Glow Effect */}
        <div className="absolute -inset-12 bg-red-500/5 dark:bg-red-500/10 blur-[100px] rounded-full scale-110 opacity-50"></div>
        <div className="absolute -inset-12 bg-emerald-500/5 dark:bg-emerald-500/5 blur-[80px] rounded-full translate-x-12 translate-y-12 opacity-30"></div>
        
        {/* Error Illustration */}
        <div className="relative z-10 animate-float">
          <svg width="240" height="240" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-56 h-56 sm:w-72 sm:h-72">
            <defs>
              <linearGradient id="errorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.05" />
              </linearGradient>
            </defs>
            <circle cx="120" cy="120" r="100" fill="url(#errorGrad)" className="dark:opacity-20" />
            
            {/* Server Rack / Connection Icon */}
            <rect x="85" y="80" width="70" height="20" rx="4" className="stroke-slate-200 dark:stroke-white/10" strokeWidth="4" />
            <rect x="85" y="110" width="70" height="20" rx="4" className="stroke-slate-200 dark:stroke-white/10" strokeWidth="4" />
            <rect x="85" y="140" width="70" height="20" rx="4" className="stroke-emerald-500 dark:stroke-emerald-400" strokeWidth="4" />
            
            {/* Small Indicator Lights */}
            <circle cx="140" cy="90" r="3" className="fill-red-400 animate-pulse" />
            <circle cx="140" cy="120" r="3" className="fill-red-400 animate-pulse" />
            <circle cx="140" cy="150" r="3" className="fill-emerald-400" />
            
            {/* Ground Shadow */}
            <ellipse cx="120" cy="210" rx="60" ry="8" className="fill-slate-100 dark:fill-white/5" />
          </svg>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-5 mb-14">
        <div className="inline-flex items-center space-x-2 bg-red-50 dark:bg-red-500/10 px-4 py-2 rounded-full border border-red-100 dark:border-red-500/20 mb-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
          <span className="text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-400">Sync Unsuccessful</span>
        </div>
        
        <h2 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tight">
          Server <span className="text-red-500 dark:text-red-400">Connection</span> <br className="hidden sm:block" /> Failed.
        </h2>
        
        <p className="text-slate-500 dark:text-white/40 text-base sm:text-xl font-medium leading-relaxed px-4">
          {message ? `Technical Detail: ${message}` : "The academic registry is temporarily unreachable. This usually happens due to network congestion or server maintenance."}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-5 w-full sm:w-auto px-6">
        <button 
          onClick={onRetry}
          disabled={isRetrying}
          className="w-full sm:w-auto group relative flex items-center justify-center px-14 py-5 bg-emerald-600 dark:bg-emerald-500 text-white rounded-[1.5rem] font-bold text-lg shadow-2xl shadow-emerald-200 dark:shadow-emerald-900/40 hover:bg-emerald-700 dark:hover:bg-emerald-600 hover:scale-[1.03] active:scale-95 transition-all duration-300 disabled:opacity-70 disabled:hover:scale-100"
          aria-label="Retry server synchronization"
        >
          {isRetrying ? (
            <div className="flex items-center">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
              <span>Connecting...</span>
            </div>
          ) : (
            <div className="flex items-center">
              <span>Try Sync Again</span>
              <svg className="ml-3 w-6 h-6 group-hover:rotate-180 transition-transform duration-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          )}
        </button>

        <button 
          onClick={onGoHome}
          className="w-full sm:w-auto px-14 py-5 bg-white dark:bg-[#1A1A1A] text-slate-600 dark:text-white/60 border border-slate-200 dark:border-white/5 rounded-[1.5rem] font-bold text-lg hover:bg-slate-50 dark:hover:bg-[#222222] hover:text-slate-900 dark:hover:text-white transition-all active:scale-95 shadow-sm"
        >
          Return Home
        </button>
      </div>

      {/* Offline Status Footnote */}
      <div className="mt-16 flex flex-col items-center space-y-4 opacity-50">
        <div className="h-px w-24 bg-slate-200 dark:bg-white/10"></div>
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400 dark:text-white/20">
          MUST CS | Offline Ready Registry
        </p>
      </div>
    </div>
  );
};
