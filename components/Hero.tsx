import React from 'react';
import { SearchIcon } from './Icons';

interface HeroProps {
  onNavigate: (page: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ onNavigate }) => (
  <div className="text-center pt-8 pb-20 lg:pt-36 animate-fade-in">
    <div className="inline-flex items-center space-x-3 bg-emerald-50 dark:bg-emerald-500/10 px-6 py-2.5 rounded-full mb-10 border border-emerald-100 dark:border-emerald-500/20 animate-slide-in shadow-sm">
      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
      <span className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-800 dark:text-emerald-400">MUST CS Portal</span>
    </div>
    
    <h2 className="text-5xl sm:text-[95px] font-black text-slate-900 dark:text-white mb-10 max-w-6xl mx-auto leading-[1] sm:leading-[0.95] tracking-tight px-4 text-center">
      Centralized <span className="gradient-text">Academic</span> <br className="hidden sm:block"/> Repository.
    </h2>
    
    <p className="text-lg sm:text-2xl text-slate-500 dark:text-white/60 max-w-4xl mx-auto mb-16 font-medium leading-relaxed px-6 text-center">
      Access verified lecture notes, module materials, and past examination papers specifically curated for MUST Computer Science students.
    </p>
    
    <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto px-8 justify-center">
      <button 
        onClick={() => onNavigate('modules')} 
        className="group flex items-center justify-center px-12 py-6 sm:px-20 sm:py-7 bg-emerald-600 dark:bg-emerald-500 text-white rounded-3xl font-black text-base sm:text-lg shadow-2xl shadow-emerald-200 dark:shadow-emerald-900/30 hover:bg-emerald-700 dark:hover:bg-emerald-400 hover:scale-[1.04] transition-all duration-500 active:scale-95"
      >
        Access Modules 
        <SearchIcon className="ml-4 w-6 h-6 group-hover:rotate-12 transition-transform duration-500" />
      </button>
      <button 
        onClick={() => onNavigate('about')} 
        className="px-12 py-6 sm:px-20 sm:py-7 bg-white dark:bg-white/[0.04] text-slate-800 dark:text-white font-black text-base sm:text-lg border border-slate-200 dark:border-white/[0.05] rounded-3xl hover:bg-slate-50 dark:hover:bg-white/[0.08] transition-all duration-500 shadow-sm active:scale-95"
      >
        Learn More
      </button>
    </div>
  </div>
);