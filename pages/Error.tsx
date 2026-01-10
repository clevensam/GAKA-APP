import React from 'react';

interface ErrorPageProps {
  message: string;
  onRetry: () => void;
  isRetrying: boolean;
}

export const ErrorPage: React.FC<ErrorPageProps> = ({ message, onRetry, isRetrying }) => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 py-12 animate-fade-in text-center">
      <div className="relative mb-12 group">
        {/* Animated Background Glow */}
        <div className="absolute inset-0 bg-emerald-500/10 dark:bg-emerald-500/5 blur-[100px] rounded-full scale-150 group-hover:scale-125 transition-transform duration-1000"></div>
        
        {/* Error Illustration */}
        <div className="relative z-10 animate-float">
          <svg width="240" height="240" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-48 h-48 sm:w-60 sm:h-60">
            <circle cx="120" cy="120" r="100" className="fill-slate-50 dark:fill-white/5" />
            <path d="M165 140C165 159.33 149.33 175 130 175H95C75.67 175 60 159.33 60 140C60 120.67 75.67 105 95 105C95 85.67 110.67 70 130 70C149.33 70 165 85.67 165 105C184.33 105 200 120.67 200 140C200 159.33 184.33 175 165 175" 
              className="stroke-slate-200 dark:stroke-white/10" strokeWidth="8" strokeLinecap="round" />
            <path d="M110 120L130 140M130 120L110 140" 
              className="stroke-emerald-500/50 dark:stroke-emerald-400/40" strokeWidth="8" strokeLinecap="round" />
            <rect x="80" y="190" width="80" height="8" rx="4" className="fill-slate-200 dark:fill-white/10 animate-pulse" />
          </svg>
        </div>
      </div>

      <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white/90 mb-4 tracking-tight">
        Registry <span className="gradient-text">Sync Failed</span>
      </h2>
      
      <p className="text-slate-500 dark:text-white/40 max-w-md mx-auto mb-10 text-base sm:text-lg font-medium leading-relaxed">
        {message || "We encountered a temporary interruption while connecting to the academic cloud repository."}
      </p>

      <button 
        onClick={onRetry}
        disabled={isRetrying}
        className="group relative flex items-center justify-center px-10 py-5 bg-emerald-600 dark:bg-emerald-500 text-white rounded-2xl font-bold text-sm sm:text-base shadow-2xl shadow-emerald-200 dark:shadow-emerald-900/20 hover:bg-emerald-700 dark:hover:bg-emerald-600 hover:scale-[1.05] transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
      >
        {isRetrying ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
            <span>Re-connecting...</span>
          </>
        ) : (
          <>
            <span>Retry Synchronization</span>
            <svg className="ml-3 w-5 h-5 group-hover:rotate-180 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </>
        )}
      </button>
    </div>
  );
};
