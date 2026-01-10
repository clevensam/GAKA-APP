import React from 'react';

export const Footer: React.FC = () => (
  <footer className="bg-white dark:bg-black border-t border-slate-50 dark:border-white/[0.05] py-20 transition-colors duration-500">
    <div className="container mx-auto px-8 max-w-7xl text-center md:text-left">
      <div className="flex flex-col md:flex-row justify-between items-center gap-12">
        <div className="space-y-4">
          <div className="flex items-center justify-center md:justify-start space-x-4">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black text-xl">G</div>
            <span className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">GAKA Portal</span>
          </div>
          <p className="text-slate-400 dark:text-white/30 text-xs font-medium max-w-sm mx-auto md:mx-0">
            The centralized high-performance academic repository for MUST Computer Science students. Built for speed and accessibility.
          </p>
        </div>
        <div className="text-center md:text-right space-y-2">
          <p className="text-slate-300 dark:text-white/10 text-[10px] font-black uppercase tracking-[0.4em] mb-2">Developed by Softlink Africa</p>
          <p className="text-slate-200 dark:text-white/5 text-[10px] font-black tracking-widest">&copy; {new Date().getFullYear()} ALL RIGHTS RESERVED</p>
        </div>
      </div>
    </div>
  </footer>
);