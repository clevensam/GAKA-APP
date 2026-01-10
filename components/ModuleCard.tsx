import React from 'react';
import { Module } from '../types';
import { ChevronRightIcon, BookOpenIcon } from './Icons';

interface Props {
  module: Module;
  onClick: () => void;
}

export const ModuleCard: React.FC<Props> = ({ module, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex flex-col text-left bg-white dark:bg-[#1E1E1E] p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-white/5 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 group hover:border-emerald-200 dark:hover:border-emerald-500/30 h-full relative overflow-hidden"
    >
      {/* Background soft glow in dark mode */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 dark:bg-emerald-400/5 blur-[80px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

      <div className="flex justify-between items-start mb-6 sm:mb-8 w-full relative z-10">
        <div className="p-3.5 sm:p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-[1.1rem] group-hover:bg-emerald-600 dark:group-hover:bg-emerald-500 transition-all duration-500 shadow-sm group-hover:shadow-emerald-200 dark:group-hover:shadow-emerald-900/40">
          <BookOpenIcon className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600 dark:text-emerald-400 group-hover:text-white dark:group-hover:text-white" />
        </div>
        <span className="text-[10px] font-bold text-slate-400 dark:text-white/40 bg-slate-50 dark:bg-black/40 px-3.5 py-1.5 rounded-full tracking-widest border border-slate-100 dark:border-white/5 uppercase">
          {module.code}
        </span>
      </div>
      
      <div className="relative z-10 flex flex-col h-full">
        <h3 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white/90 mb-3 sm:mb-4 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors leading-tight tracking-tight">
          {module.name}
        </h3>
        <p className="text-slate-500 dark:text-white/60 text-sm sm:text-base line-clamp-2 mb-8 sm:mb-10 font-normal leading-relaxed flex-grow">
          {module.description}
        </p>
        
        <div className="flex items-center text-emerald-600 dark:text-emerald-400 font-bold text-[11px] sm:text-[12px] uppercase tracking-widest group-hover:translate-x-2 transition-transform duration-500">
          Open Resources
          <ChevronRightIcon className="ml-2 w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
      </div>
    </button>
  );
};