import React from 'react';

export const LoadingScreen: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black transition-colors duration-700">
    <div className="relative">
      <div className="w-20 h-20 border-[4px] border-slate-100 dark:border-white/5 border-t-emerald-600 rounded-full animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-black text-xl animate-pulse shadow-xl shadow-emerald-500/30">G</div>
      </div>
    </div>
    <p className="mt-8 text-slate-400 dark:text-white/20 font-black uppercase tracking-[0.4em] text-[10px] animate-pulse">Syncing Hub</p>
  </div>
);